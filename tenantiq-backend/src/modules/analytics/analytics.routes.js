const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const tenantContext = require('../../middleware/tenantContext');
const {
  getOverview,
  getTasksOverTime,
  getTopMembers,
  getProjectProgress,
  getRecentActivity,
} = require('./analytics.controller');

// All analytics routes require authentication + tenant context
router.use(authenticate);
router.use(tenantContext);

router.get('/overview', getOverview);
router.get('/tasks-over-time', getTasksOverTime);
router.get('/top-members', getTopMembers);
router.get('/project-progress', getProjectProgress);
router.get('/recent-activity', getRecentActivity);

module.exports = router;