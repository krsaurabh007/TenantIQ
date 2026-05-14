const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../middleware/auth');
const tenantContext = require('../../middleware/tenantContext');
const {
  getMembers,
  inviteMember,
  updateMemberRole,
  removeMember,
  acceptInviteHandler,
} = require('./team.controller');
const { body } = require('express-validator');

const acceptInviteValidation = [
  body('token').notEmpty().withMessage('Token is required'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

const inviteValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('role')
    .isIn(['manager', 'viewer'])
    .withMessage('Role must be manager or viewer'),
];

const roleValidation = [
  body('role')
    .isIn(['manager', 'viewer'])
    .withMessage('Role must be manager or viewer'),
];

// PUBLIC route — no auth needed
router.post('/accept-invite', acceptInviteValidation, acceptInviteHandler);

// All routes below require authentication + tenant context
router.use(authenticate);
router.use(tenantContext);

router.get('/members', authorize('admin', 'manager'), getMembers);
router.post('/invite', authorize('admin'), inviteValidation, inviteMember);
router.patch('/members/:id/role', authorize('admin'), roleValidation, updateMemberRole);
router.delete('/members/:id', authorize('admin'), removeMember);

module.exports = router;