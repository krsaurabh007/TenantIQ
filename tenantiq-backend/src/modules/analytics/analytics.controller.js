const {
  getOverviewStats,
  getTasksOverTime: fetchTasksOverTime,
  getTopMembers: fetchTopMembers,
  getProjectProgress: fetchProjectProgress,
  getRecentActivity: fetchRecentActivity,
} = require('./analytics.service');

async function getOverview(req, res, next) {
  try {
    const data = await getOverviewStats(req.schemaName);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function getTasksOverTime(req, res, next) {
  try {
    const data = await fetchTasksOverTime(req.schemaName);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function getTopMembers(req, res, next) {
  try {
    const data = await fetchTopMembers(req.schemaName);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function getProjectProgress(req, res, next) {
  try {
    const data = await fetchProjectProgress(req.schemaName);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function getRecentActivity(req, res, next) {
  try {
    const data = await fetchRecentActivity(req.schemaName);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getOverview,
  getTasksOverTime,
  getTopMembers,
  getProjectProgress,
  getRecentActivity,
};