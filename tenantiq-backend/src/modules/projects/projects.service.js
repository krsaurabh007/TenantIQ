const { sequelize } = require('../../config/database');

// ─── PROJECTS ───────────────────────────────────────────────

async function getAllProjects(schemaName) {
  const projects = await sequelize.query(
    `SELECT 
      p.id, p.name, p.description, p.status, p.deadline, p.created_at,
      u.name as created_by_name,
      COUNT(t.id) as total_tasks,
      COUNT(CASE WHEN t.status = 'done' THEN 1 END) as completed_tasks
     FROM "${schemaName}".projects p
     LEFT JOIN "${schemaName}".users u ON u.id = p.created_by
     LEFT JOIN "${schemaName}".tasks t ON t.project_id = p.id
     GROUP BY p.id, u.name
     ORDER BY p.created_at DESC`,
    { type: sequelize.QueryTypes.SELECT }
  );
  return projects;
}

async function getProjectDetails(schemaName, projectId) {
  const [project] = await sequelize.query(
    `SELECT 
      p.id, p.name, p.description, p.status, p.deadline, p.created_at,
      u.name as created_by_name
     FROM "${schemaName}".projects p
     LEFT JOIN "${schemaName}".users u ON u.id = p.created_by
     WHERE p.id = :projectId`,
    { replacements: { projectId }, type: sequelize.QueryTypes.SELECT }
  );

  if (!project) throw { statusCode: 404, message: 'Project not found' };

  // Get project members
  const members = await sequelize.query(
    `SELECT u.id, u.name, u.email, u.role
     FROM "${schemaName}".project_members pm
     JOIN "${schemaName}".users u ON u.id = pm.user_id
     WHERE pm.project_id = :projectId`,
    { replacements: { projectId }, type: sequelize.QueryTypes.SELECT }
  );

  return { ...project, members };
}

async function createNewProject({ schemaName, name, description, status, deadline, memberIds, createdBy }) {
  // Insert project
  const projectResult = await sequelize.query(
    `INSERT INTO "${schemaName}".projects 
      (name, description, status, deadline, created_by)
     VALUES (:name, :description, :status, :deadline, :createdBy)
     RETURNING id, name, description, status, deadline, created_at`,
    {
      replacements: {
        name,
        description: description || null,
        status: status || 'active',
        deadline: deadline || null,
        createdBy,
      },
      type: sequelize.QueryTypes.INSERT,
    }
  );

  const project = projectResult[0][0];

  // Add members to project if provided
  if (memberIds && memberIds.length > 0) {
    for (const userId of memberIds) {
      await sequelize.query(
        `INSERT INTO "${schemaName}".project_members (project_id, user_id)
         VALUES (:projectId, :userId)
         ON CONFLICT DO NOTHING`,
        { replacements: { projectId: project.id, userId } }
      );
    }
  }

  // Always add the creator as a member
  await sequelize.query(
    `INSERT INTO "${schemaName}".project_members (project_id, user_id)
     VALUES (:projectId, :userId)
     ON CONFLICT DO NOTHING`,
    { replacements: { projectId: project.id, userId: createdBy } }
  );

  return project;
}

async function updateProjectById({ schemaName, projectId, name, description, status, deadline, memberIds }) {
  const [existing] = await sequelize.query(
    `SELECT id FROM "${schemaName}".projects WHERE id = :projectId`,
    { replacements: { projectId }, type: sequelize.QueryTypes.SELECT }
  );
  if (!existing) throw { statusCode: 404, message: 'Project not found' };

  await sequelize.query(
    `UPDATE "${schemaName}".projects
     SET name = :name,
         description = :description,
         status = :status,
         deadline = :deadline
     WHERE id = :projectId`,
    {
      replacements: {
        name,
        description: description || null,
        status: status || 'active',
        deadline: deadline || null,
        projectId,
      },
    }
  );

  // Update members if provided
  if (memberIds && memberIds.length > 0) {
    // Remove existing members
    await sequelize.query(
      `DELETE FROM "${schemaName}".project_members WHERE project_id = :projectId`,
      { replacements: { projectId } }
    );
    // Add new members
    for (const userId of memberIds) {
      await sequelize.query(
        `INSERT INTO "${schemaName}".project_members (project_id, user_id)
         VALUES (:projectId, :userId)
         ON CONFLICT DO NOTHING`,
        { replacements: { projectId, userId } }
      );
    }
  }

  return { message: 'Project updated successfully' };
}

async function deleteProjectById(schemaName, projectId) {
  const [existing] = await sequelize.query(
    `SELECT id FROM "${schemaName}".projects WHERE id = :projectId`,
    { replacements: { projectId }, type: sequelize.QueryTypes.SELECT }
  );
  if (!existing) throw { statusCode: 404, message: 'Project not found' };

  await sequelize.query(
    `DELETE FROM "${schemaName}".projects WHERE id = :projectId`,
    { replacements: { projectId } }
  );

  return { message: 'Project deleted successfully' };
}

// ─── TASKS ───────────────────────────────────────────────────

async function getTasksByProject(schemaName, projectId) {
  const tasks = await sequelize.query(
    `SELECT 
      t.id, t.title, t.description, t.priority, t.status, t.due_date, t.created_at,
      u.name as assignee_name, u.id as assignee_id
     FROM "${schemaName}".tasks t
     LEFT JOIN "${schemaName}".users u ON u.id = t.assignee_id
     WHERE t.project_id = :projectId
     ORDER BY t.created_at ASC`,
    { replacements: { projectId }, type: sequelize.QueryTypes.SELECT }
  );
  return tasks;
}

async function createNewTask({ schemaName, projectId, title, description, priority, status, assigneeId, dueDate }) {
  // Check project exists
  const [project] = await sequelize.query(
    `SELECT id FROM "${schemaName}".projects WHERE id = :projectId`,
    { replacements: { projectId }, type: sequelize.QueryTypes.SELECT }
  );
  if (!project) throw { statusCode: 404, message: 'Project not found' };

  const taskResult = await sequelize.query(
    `INSERT INTO "${schemaName}".tasks
      (project_id, title, description, priority, status, assignee_id, due_date)
     VALUES (:projectId, :title, :description, :priority, :status, :assigneeId, :dueDate)
     RETURNING id, title, description, priority, status, assignee_id, due_date, created_at`,
    {
      replacements: {
        projectId,
        title,
        description: description || null,
        priority: priority || 'medium',
        status: status || 'todo',
        assigneeId: assigneeId || null,
        dueDate: dueDate || null,
      },
      type: sequelize.QueryTypes.INSERT,
    }
  );

  return taskResult[0][0];
}

async function updateTaskById({ schemaName, taskId, title, description, priority, status, assigneeId, dueDate }) {
  const [existing] = await sequelize.query(
    `SELECT id FROM "${schemaName}".tasks WHERE id = :taskId`,
    { replacements: { taskId }, type: sequelize.QueryTypes.SELECT }
  );
  if (!existing) throw { statusCode: 404, message: 'Task not found' };

  await sequelize.query(
    `UPDATE "${schemaName}".tasks
     SET title = :title,
         description = :description,
         priority = :priority,
         status = :status,
         assignee_id = :assigneeId,
         due_date = :dueDate
     WHERE id = :taskId`,
    {
      replacements: {
        title,
        description: description || null,
        priority: priority || 'medium',
        status: status || 'todo',
        assigneeId: assigneeId || null,
        dueDate: dueDate || null,
        taskId,
      },
    }
  );

  return { message: 'Task updated successfully' };
}

async function deleteTaskById(schemaName, taskId) {
  const [existing] = await sequelize.query(
    `SELECT id FROM "${schemaName}".tasks WHERE id = :taskId`,
    { replacements: { taskId }, type: sequelize.QueryTypes.SELECT }
  );
  if (!existing) throw { statusCode: 404, message: 'Task not found' };

  await sequelize.query(
    `DELETE FROM "${schemaName}".tasks WHERE id = :taskId`,
    { replacements: { taskId } }
  );

  return { message: 'Task deleted successfully' };
}

async function updateTaskStatusById(schemaName, taskId, status) {
  const validStatuses = ['todo', 'in_progress', 'done'];
  if (!validStatuses.includes(status)) {
    throw { statusCode: 400, message: 'Status must be todo, in_progress or done' };
  }

  const [existing] = await sequelize.query(
    `SELECT id FROM "${schemaName}".tasks WHERE id = :taskId`,
    { replacements: { taskId }, type: sequelize.QueryTypes.SELECT }
  );
  if (!existing) throw { statusCode: 404, message: 'Task not found' };

  await sequelize.query(
    `UPDATE "${schemaName}".tasks SET status = :status WHERE id = :taskId`,
    { replacements: { status, taskId } }
  );

  return { message: 'Task status updated successfully' };
}

module.exports = {
  getAllProjects,
  getProjectDetails,
  createNewProject,
  updateProjectById,
  deleteProjectById,
  getTasksByProject,
  createNewTask,
  updateTaskById,
  deleteTaskById,
  updateTaskStatusById,
};