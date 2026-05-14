const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sequelize } = require('../../config/database');
const { createTenantSchema } = require('../../utils/schemaManager');

function generateSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 40);
}

function generateSchemaName(slug) {
  return `tenant_${slug}`;
}

function generateAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES,
  });
}

function generateRefreshToken(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES,
  });
}

async function registerTenant({ companyName, name, email, password }) {
  const slug = generateSlug(companyName);
  const schemaName = generateSchemaName(slug);

  // Check if company already exists
  const [existingTenant] = await sequelize.query(
    `SELECT id FROM public.tenants WHERE slug = :slug`,
    { replacements: { slug }, type: sequelize.QueryTypes.SELECT }
  );
  if (existingTenant) {
    throw { statusCode: 409, message: 'Company name already taken' };
  }

  // Check if email already exists
  const [existingUser] = await sequelize.query(
    `SELECT id FROM public.users WHERE email = :email`,
    { replacements: { email }, type: sequelize.QueryTypes.SELECT }
  );
  if (existingUser) {
    throw { statusCode: 409, message: 'Email already registered' };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Insert into public.tenants
  const tenantResult = await sequelize.query(
    `INSERT INTO public.tenants (name, slug, schema_name)
     VALUES (:name, :slug, :schemaName)
     RETURNING id, name, slug, schema_name, plan, status`,
    {
      replacements: { name: companyName, slug, schemaName },
      type: sequelize.QueryTypes.INSERT,
    }
  );
  const tenantRecord = tenantResult[0][0];

  // Insert into public.users
  const userResult = await sequelize.query(
    `INSERT INTO public.users (tenant_id, name, email, password_hash, role)
     VALUES (:tenantId, :name, :email, :passwordHash, 'admin')
     RETURNING id, name, email, role`,
    {
      replacements: {
        tenantId: tenantRecord.id,
        name,
        email,
        passwordHash,
      },
      type: sequelize.QueryTypes.INSERT,
    }
  );
  const userRecord = userResult[0][0];

  // Create isolated schema for this tenant
  await createTenantSchema(schemaName);

  // Also insert admin into tenant schema users table
  await sequelize.query(
    `INSERT INTO "${schemaName}".users (id, name, email, password_hash, role)
     VALUES (:id, :name, :email, :passwordHash, 'admin')`,
    {
      replacements: {
        id: userRecord.id,
        name,
        email,
        passwordHash,
      },
    }
  );

  const tokenPayload = {
    userId: userRecord.id,
    email: userRecord.email,
    role: userRecord.role,
    tenantId: tenantRecord.id,
    schemaName,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  return {
    accessToken,
    refreshToken,
    user: {
      id: userRecord.id,
      name: userRecord.name,
      email: userRecord.email,
      role: userRecord.role,
    },
    tenant: {
      id: tenantRecord.id,
      name: tenantRecord.name,
      slug: tenantRecord.slug,
      plan: tenantRecord.plan,
    },
  };
}

async function loginUser({ email, password }) {
  const [user] = await sequelize.query(
    `SELECT u.id, u.name, u.email, u.password_hash, u.role, u.tenant_id,
            t.schema_name, t.name as company_name, t.slug, t.plan, t.status
     FROM public.users u
     JOIN public.tenants t ON t.id = u.tenant_id
     WHERE u.email = :email`,
    { replacements: { email }, type: sequelize.QueryTypes.SELECT }
  );

  if (!user) {
    throw { statusCode: 401, message: 'Invalid email or password' };
  }

  if (user.status === 'suspended') {
    throw { statusCode: 403, message: 'Your account has been suspended' };
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw { statusCode: 401, message: 'Invalid email or password' };
  }

  const tokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    tenantId: user.tenant_id,
    schemaName: user.schema_name,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      company: user.company_name,
      plan: user.plan,
    },
  };
}

module.exports = {
  registerTenant,
  loginUser,
  generateAccessToken,
  generateRefreshToken,
};