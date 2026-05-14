const { validationResult } = require('express-validator');
const {
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
} = require('./projects.service');

async function getProjects(req, res, next) {
  try {
    const projects = await getAllProjects(req.schemaName);
    return res.status(200).json({ success: true, projects });
  } catch (err) {
    next(err);
  }
}

async function getProjectById(req, res, next) {
  try {
    const project = await getProjectDetails(req.schemaName, req.params.id);
    return res.status(200).json({ success: true, project });
  } catch (err) {
    next(err);
  }
}

async function createProject(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, description, status, deadline, memberIds } = req.body;
    const project = await createNewProject({
      schemaName: req.schemaName,
      name,
      description,
      status,
      deadline,
      memberIds,
      createdBy: req.user.userId,
    });

    return res.status(201).json({ success: true, project });
  } catch (err) {
    next(err);
  }
}

async function updateProject(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, description, status, deadline, memberIds } = req.body;
    const result = await updateProjectById({
      schemaName: req.schemaName,
      projectId: req.params.id,
      name,
      description,
      status,
      deadline,
      memberIds,
    });

    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function deleteProject(req, res, next) {
  try {
    const result = await deleteProjectById(req.schemaName, req.params.id);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function getProjectTasks(req, res, next) {
  try {
    const tasks = await getTasksByProject(req.schemaName, req.params.id);
    return res.status(200).json({ success: true, tasks });
  } catch (err) {
    next(err);
  }
}

async function createTask(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { title, description, priority, status, assigneeId, dueDate } = req.body;
    const task = await createNewTask({
      schemaName: req.schemaName,
      projectId: req.params.id,
      title,
      description,
      priority,
      status,
      assigneeId,
      dueDate,
    });

    return res.status(201).json({ success: true, task });
  } catch (err) {
    next(err);
  }
}

async function updateTask(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { title, description, priority, status, assigneeId, dueDate } = req.body;
    const result = await updateTaskById({
      schemaName: req.schemaName,
      taskId: req.params.taskId,
      title,
      description,
      priority,
      status,
      assigneeId,
      dueDate,
    });

    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function deleteTask(req, res, next) {
  try {
    const result = await deleteTaskById(req.schemaName, req.params.taskId);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function updateTaskStatus(req, res, next) {
  try {
    const { status } = req.body;
    const result = await updateTaskStatusById(req.schemaName, req.params.taskId, status);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectTasks,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
};