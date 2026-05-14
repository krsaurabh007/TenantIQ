const { sequelize } = require("../../config/database");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

async function getAllMembers(schemaName) {
  const members = await sequelize.query(
    `SELECT id, name, email, role, status, created_at
     FROM "${schemaName}".users
     ORDER BY created_at ASC`,
    { type: sequelize.QueryTypes.SELECT },
  );
  return members;
}

async function inviteNewMember({ schemaName, email, role, invitedBy }) {
  // Check if user already exists in this tenant schema
  const [existingUser] = await sequelize.query(
    `SELECT id FROM "${schemaName}".users WHERE email = :email`,
    { replacements: { email }, type: sequelize.QueryTypes.SELECT },
  );
  if (existingUser) {
    throw {
      statusCode: 409,
      message: "A member with this email already exists",
    };
  }

  // Check if invite already sent
  const [existingInvite] = await sequelize.query(
    `SELECT id FROM "${schemaName}".invites 
     WHERE email = :email AND accepted = false AND expires_at > NOW()`,
    { replacements: { email }, type: sequelize.QueryTypes.SELECT },
  );
  if (existingInvite) {
    throw {
      statusCode: 409,
      message: "An invite has already been sent to this email",
    };
  }

  // Generate a secure random token for the invite link
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  // Save invite to tenant schema
  const inviteResult = await sequelize.query(
    `INSERT INTO "${schemaName}".invites (email, token, role, expires_at)
     VALUES (:email, :token, :role, :expiresAt)
     RETURNING id, email, role, token, expires_at`,
    {
      replacements: { email, token, role, expiresAt },
      type: sequelize.QueryTypes.INSERT,
    },
  );

  const invite = inviteResult[0][0];

  // In production you would send an email here with nodemailer
  // For now we return the invite link directly so you can test it
const inviteLink = `${process.env.CLIENT_URL}/accept-invite?token=${token}`;
  return {
    message: "Invite created successfully",
    invite: {
      id: invite.id,
      email: invite.email,
      role: invite.role,
      expiresAt: invite.expires_at,
      inviteLink, // remove this in production — send via email instead
    },
  };
}

async function updateRole({ schemaName, userId, role, currentUserId }) {
  // Prevent admin from changing their own role
  if (userId === currentUserId) {
    throw { statusCode: 400, message: "You cannot change your own role" };
  }

  // Check member exists
  const [member] = await sequelize.query(
    `SELECT id, role FROM "${schemaName}".users WHERE id = :userId`,
    { replacements: { userId }, type: sequelize.QueryTypes.SELECT },
  );
  if (!member) {
    throw { statusCode: 404, message: "Member not found" };
  }

  // Prevent changing another admin's role
  if (member.role === "admin") {
    throw { statusCode: 403, message: "Cannot change role of another admin" };
  }

  await sequelize.query(
    `UPDATE "${schemaName}".users SET role = :role WHERE id = :userId`,
    { replacements: { role, userId } },
  );

  return { message: "Role updated successfully" };
}

async function removeMemberById({ schemaName, userId, currentUserId }) {
  // Prevent self removal
  if (userId === currentUserId) {
    throw { statusCode: 400, message: "You cannot remove yourself" };
  }

  // Check member exists
  const [member] = await sequelize.query(
    `SELECT id, role FROM "${schemaName}".users WHERE id = :userId`,
    { replacements: { userId }, type: sequelize.QueryTypes.SELECT },
  );
  if (!member) {
    throw { statusCode: 404, message: "Member not found" };
  }

  // Prevent removing another admin
  if (member.role === "admin") {
    throw { statusCode: 403, message: "Cannot remove another admin" };
  }

  await sequelize.query(
    `DELETE FROM "${schemaName}".users WHERE id = :userId`,
    { replacements: { userId } },
  );

  return { message: "Member removed successfully" };
}

async function acceptInvite({ token, name, password }) {
  // Find the invite across all tenant schemas
  // First we need to find which tenant this token belongs to
  const tenants = await sequelize.query(
    `SELECT schema_name FROM public.tenants WHERE status = 'active'`,
    { type: sequelize.QueryTypes.SELECT },
  );

  let foundInvite = null;
  let foundSchema = null;

  // Search through each tenant schema for this token
  for (const tenant of tenants) {
    const [invite] = await sequelize.query(
      `SELECT * FROM "${tenant.schema_name}".invites
       WHERE token = :token
         AND accepted = false
         AND expires_at > NOW()`,
      { replacements: { token }, type: sequelize.QueryTypes.SELECT },
    );

    if (invite) {
      foundInvite = invite;
      foundSchema = tenant.schema_name;
      break;
    }
  }

  if (!foundInvite) {
    throw { statusCode: 400, message: "Invalid or expired invite link" };
  }

  // Check if email already registered in this tenant
  const [existingUser] = await sequelize.query(
    `SELECT id FROM "${foundSchema}".users WHERE email = :email`,
    {
      replacements: { email: foundInvite.email },
      type: sequelize.QueryTypes.SELECT,
    },
  );
  if (existingUser) {
    throw { statusCode: 409, message: "This email is already registered" };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Create user in tenant schema
  const userResult = await sequelize.query(
    `INSERT INTO "${foundSchema}".users (name, email, password_hash, role, status)
     VALUES (:name, :email, :passwordHash, :role, 'active')
     RETURNING id, name, email, role`,
    {
      replacements: {
        name,
        email: foundInvite.email,
        passwordHash,
        role: foundInvite.role,
      },
      type: sequelize.QueryTypes.INSERT,
    },
  );

  const newUser = userResult[0][0];

  // Get tenant info
  const [tenant] = await sequelize.query(
    `SELECT id, name, slug, plan FROM public.tenants
     WHERE schema_name = :schemaName`,
    {
      replacements: { schemaName: foundSchema },
      type: sequelize.QueryTypes.SELECT,
    },
  );

  // Insert into public.users so they can login
  await sequelize.query(
    `INSERT INTO public.users (id, tenant_id, name, email, password_hash, role)
     VALUES (:id, :tenantId, :name, :email, :passwordHash, :role)`,
    {
      replacements: {
        id: newUser.id,
        tenantId: tenant.id,
        name,
        email: foundInvite.email,
        passwordHash,
        role: foundInvite.role,
      },
    },
  );

  // Mark invite as accepted
  await sequelize.query(
    `UPDATE "${foundSchema}".invites
     SET accepted = true WHERE token = :token`,
    { replacements: { token } },
  );

  return {
    message: "Account created successfully",
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    },
    tenant: {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      plan: tenant.plan,
    },
    schemaName: foundSchema,
  };
}

module.exports = {
  getAllMembers,
  inviteNewMember,
  updateRole,
  removeMemberById,
  acceptInvite,
};
