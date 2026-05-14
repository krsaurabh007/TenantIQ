const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../middleware/auth');
const tenantContext = require('../../middleware/tenantContext');
const {
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
} = require('./projects.controller');
const { body } = require('express-validator');

// All routes require authentication + tenant context
router.use(authenticate);
router.use(tenantContext);

const projectValidation = [
  body('name').trim().notEmpty().withMessage('Project name is required'),
  body('status')
    .optional()
    .isIn(['active', 'on_hold', 'completed'])
    .withMessage('Status must be active, on_hold or completed'),
  body('deadline')
    .optional()
    .isDate()
    .withMessage('Deadline must be a valid date'),
];

const taskValidation = [
  body('title').trim().notEmpty().withMessage('Task title is required'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium or high'),
  body('status')
    .optional()
    .isIn(['todo', 'in_progress', 'done'])
    .withMessage('Status must be todo, in_progress or done'),
];

// Project routes
router.get('/', getProjects);
router.get('/:id', getProjectById);
router.post('/', authorize('admin', 'manager'), projectValidation, createProject);
router.put('/:id', authorize('admin', 'manager'), projectValidation, updateProject);
router.delete('/:id', authorize('admin'), deleteProject);

// Task routes (nested under projects)
router.get('/:id/tasks', getProjectTasks);
router.post('/:id/tasks', authorize('admin', 'manager'), taskValidation, createTask);
router.put('/tasks/:taskId', authorize('admin', 'manager'), taskValidation, updateTask);
router.delete('/tasks/:taskId', authorize('admin', 'manager'), deleteTask);
router.patch('/tasks/:taskId/status', updateTaskStatus);

module.exports = router;