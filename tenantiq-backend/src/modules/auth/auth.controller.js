const { validationResult } = require('express-validator');
const { registerTenant, loginUser, generateAccessToken } = require('./auth.service');
const jwt = require('jsonwebtoken');
const { sequelize } = require('../../config/database');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

async function register(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { companyName, name, email, password } = req.body;
    const result = await registerTenant({ companyName, name, email, password });

    res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      accessToken: result.accessToken,
      user: result.user,
      tenant: result.tenant,
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;
    const result = await loginUser({ email, password });

    res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      accessToken: result.accessToken,
      user: result.user,
    });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      return res.status(401).json({ success: false, message: 'No refresh token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const newAccessToken = generateAccessToken({
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      tenantId: decoded.tenantId,
      schemaName: decoded.schemaName,
    });

    return res.status(200).json({ success: true, accessToken: newAccessToken });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }
}

async function logout(req, res) {
  res.clearCookie('refreshToken', COOKIE_OPTIONS);
  return res.status(200).json({ success: true, message: 'Logged out successfully' });
}

async function getMe(req, res, next) {
  try {
    const [user] = await sequelize.query(
      `SELECT u.id, u.name, u.email, u.role, t.name as company, t.plan, t.slug
       FROM public.users u
       JOIN public.tenants t ON t.id = u.tenant_id
       WHERE u.id = :userId`,
      {
        replacements: { userId: req.user.userId },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({ success: true, user });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, refresh, logout, getMe };