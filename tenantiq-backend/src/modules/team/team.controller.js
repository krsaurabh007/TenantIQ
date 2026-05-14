const { validationResult } = require('express-validator');
const {
  getAllMembers,
  inviteNewMember,
  updateRole,
  removeMemberById,
  acceptInvite,
} = require('./team.services');
const jwt = require('jsonwebtoken');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

async function getMembers(req, res, next) {
  try {
    const members = await getAllMembers(req.schemaName);
    return res.status(200).json({ success: true, members });
  } catch (err) {
    next(err);
  }
}

async function inviteMember(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, role } = req.body;
    const result = await inviteNewMember({
      schemaName: req.schemaName,
      email,
      role,
      invitedBy: req.user.userId,
    });

    return res.status(201).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function updateMemberRole(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;
    const { role } = req.body;
    const result = await updateRole({
      schemaName: req.schemaName,
      userId: id,
      role,
      currentUserId: req.user.userId,
    });

    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function removeMember(req, res, next) {
  try {
    const { id } = req.params;
    const result = await removeMemberById({
      schemaName: req.schemaName,
      userId: id,
      currentUserId: req.user.userId,
    });

    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function acceptInviteHandler(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { token, name, password } = req.body;
    const result = await acceptInvite({ token, name, password });

    const tokenPayload = {
      userId: result.user.id,
      email: result.user.email,
      role: result.user.role,
      tenantId: result.tenant.id,
      schemaName: result.schemaName,
    };

    const accessToken = jwt.sign(
      tokenPayload,
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRES }
    );

    const refreshToken = jwt.sign(
      tokenPayload,
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES }
    );

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      accessToken,
      user: result.user,
      tenant: result.tenant,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMembers,
  inviteMember,
  updateMemberRole,
  removeMember,
  acceptInviteHandler,
};