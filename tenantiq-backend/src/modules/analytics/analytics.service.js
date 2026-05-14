const { sequelize } = require('../../config/database');

async function getOverviewStats(schemaName) {
  // Project counts by status
  const projectStats = await sequelize.query(
    `SELECT
      COUNT(*) as total_projects,
      COUNT(CASE WHEN status = 'active' THEN 1 END) as active_projects,
      COUNT(CASE WHEN status = 'on_hold' THEN 1 END) as on_hold_projects,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_projects
     FROM "${schemaName}".projects`,
    { type: sequelize.QueryTypes.SELECT }
  );

  // Task counts by status
  const taskStats = await sequelize.query(
    `SELECT
      COUNT(*) as total_tasks,
      COUNT(CASE WHEN status = 'todo' THEN 1 END) as todo_tasks,
      COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tasks,
      COUNT(CASE WHEN status = 'done' THEN 1 END) as done_tasks
     FROM "${schemaName}".tasks`,
    { type: sequelize.QueryTypes.SELECT }
  );

  // Total team members
  const memberStats = await sequelize.query(
    `SELECT COUNT(*) as total_members
     FROM "${schemaName}".users
     WHERE status = 'active'`,
    { type: sequelize.QueryTypes.SELECT }
  );

  return {
    projects: projectStats[0],
    tasks: taskStats[0],
    members: memberStats[0],
  };
}

async function getTasksOverTime(schemaName) {
  // Tasks completed per day for the last 30 days
  const data = await sequelize.query(
    `SELECT
      DATE(created_at) as date,
      COUNT(*) as tasks_completed
     FROM "${schemaName}".tasks
     WHERE status = 'done'
       AND created_at >= NOW() - INTERVAL '30 days'
     GROUP BY DATE(created_at)
     ORDER BY date ASC`,
    { type: sequelize.QueryTypes.SELECT }
  );

  // Fill in missing dates with 0 so the line chart has no gaps
  const result = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const found = data.find(d => {
      const foundDate = new Date(d.date).toISOString().split('T')[0];
      return foundDate === dateStr;
    });

    result.push({
      date: dateStr,
      tasks_completed: found ? parseInt(found.tasks_completed) : 0,
    });
  }

  return result;
}

async function getTopMembers(schemaName) {
  // Members with most tasks completed
  const data = await sequelize.query(
    `SELECT
      u.id,
      u.name,
      u.role,
      COUNT(t.id) as tasks_completed
     FROM "${schemaName}".users u
     LEFT JOIN "${schemaName}".tasks t
       ON t.assignee_id = u.id AND t.status = 'done'
     GROUP BY u.id, u.name, u.role
     ORDER BY tasks_completed DESC
     LIMIT 10`,
    { type: sequelize.QueryTypes.SELECT }
  );

  return data.map(member => ({
    ...member,
    tasks_completed: parseInt(member.tasks_completed),
  }));
}

async function getProjectProgress(schemaName) {
  // Progress percentage per project
  const data = await sequelize.query(
    `SELECT
      p.id,
      p.name,
      p.status,
      p.deadline,
      COUNT(t.id) as total_tasks,
      COUNT(CASE WHEN t.status = 'done' THEN 1 END) as completed_tasks
     FROM "${schemaName}".projects p
     LEFT JOIN "${schemaName}".tasks t ON t.project_id = p.id
     GROUP BY p.id, p.name, p.status, p.deadline
     ORDER BY p.created_at DESC`,
    { type: sequelize.QueryTypes.SELECT }
  );

  return data.map(project => {
    const total = parseInt(project.total_tasks);
    const completed = parseInt(project.completed_tasks);
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

    return {
      id: project.id,
      name: project.name,
      status: project.status,
      deadline: project.deadline,
      total_tasks: total,
      completed_tasks: completed,
      progress_percentage: percentage,
    };
  });
}

async function getRecentActivity(schemaName) {
  // Last 10 tasks created across all projects
  const data = await sequelize.query(
    `SELECT
      t.id,
      t.title,
      t.status,
      t.priority,
      t.created_at,
      p.name as project_name,
      u.name as assignee_name
     FROM "${schemaName}".tasks t
     LEFT JOIN "${schemaName}".projects p ON p.id = t.project_id
     LEFT JOIN "${schemaName}".users u ON u.id = t.assignee_id
     ORDER BY t.created_at DESC
     LIMIT 10`,
    { type: sequelize.QueryTypes.SELECT }
  );

  return data;
}

module.exports = {
  getOverviewStats,
  getTasksOverTime,
  getTopMembers,
  getProjectProgress,
  getRecentActivity,
};