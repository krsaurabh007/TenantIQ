import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { useQuery } from '@tanstack/react-query';
import Layout from '../components/Layout';
import {
  useProject,
  useProjectTasks,
  useCreateTask,
  useUpdateTaskStatus,
} from '../hooks/useProjects';
import api from '../api/axios';
import { Plus, ArrowLeft, Flag } from 'lucide-react';

const COLUMNS = [
  { id: 'todo', label: 'To Do', color: 'bg-gray-100' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-yellow-50' },
  { id: 'done', label: 'Done', color: 'bg-green-50' },
];

const PRIORITY_COLORS: Record<string, string> = {
  low: 'text-green-500',
  medium: 'text-yellow-500',
  high: 'text-red-500',
};

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: project, isLoading: projectLoading } = useProject(id!);
  const { data: tasks, isLoading: tasksLoading } = useProjectTasks(id!);
  const createTask = useCreateTask(id!);
  const updateTaskStatus = useUpdateTaskStatus(id!);

  const { data: members } = useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const res = await api.get('/team/members');
      return res.data.members;
    },
  });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
    dueDate: '',
    assigneeId: '',
  });

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    await createTask.mutateAsync(form);
    setForm({
      title: '',
      description: '',
      priority: 'medium',
      status: 'todo',
      dueDate: '',
      assigneeId: '',
    });
    setShowForm(false);
  }

  async function handleDragEnd(result: DropResult) {
    if (!result.destination) return;

    const taskId = result.draggableId;
    const newStatus = result.destination.droppableId;
    const oldStatus = result.source.droppableId;

    if (newStatus === oldStatus) return;

    await updateTaskStatus.mutateAsync({ taskId, status: newStatus });
  }

  const getTasksByStatus = (status: string) =>
    (tasks || []).filter((t: any) => t.status === status);

  if (projectLoading) {
    return (
      <Layout>
        <div className="text-gray-400 text-sm">Loading project...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4 transition"
        >
          <ArrowLeft size={16} />
          Back to Projects
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{project?.name}</h1>
            {project?.description && (
              <p className="text-sm text-gray-500 mt-1">{project.description}</p>
            )}
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            <Plus size={16} />
            Add Task
          </button>
        </div>
      </div>

      {/* Create Task Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Add New Task</h2>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Design homepage mockup"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={form.priority}
                    onChange={(e) =>
                      setForm({ ...form, priority: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) =>
                    setForm({ ...form, dueDate: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assignee
                </label>
                <select
                  value={form.assigneeId}
                  onChange={(e) =>
                    setForm({ ...form, assigneeId: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Unassigned</option>
                  {(members || []).map((member: any) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTask.isPending}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {createTask.isPending ? 'Adding...' : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      {tasksLoading ? (
        <div className="text-gray-400 text-sm">Loading tasks...</div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {COLUMNS.map((column) => {
              const columnTasks = getTasksByStatus(column.id);
              return (
                <div key={column.id} className={`rounded-2xl p-4 ${column.color}`}>
                  {/* Column header */}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-700 text-sm">
                      {column.label}
                    </h3>
                    <span className="bg-white text-gray-500 text-xs font-medium px-2 py-0.5 rounded-full">
                      {columnTasks.length}
                    </span>
                  </div>

                  {/* Droppable area */}
                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`min-h-32 space-y-3 rounded-xl transition ${
                          snapshot.isDraggingOver ? 'bg-blue-50' : ''
                        }`}
                      >
                        {columnTasks.map((task: any, index: number) => (
                          <Draggable
                            key={task.id}
                            draggableId={task.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 cursor-grab active:cursor-grabbing transition ${
                                  snapshot.isDragging ? 'shadow-lg rotate-1' : ''
                                }`}
                              >
                                {/* Task title */}
                                <p className="text-sm font-medium text-gray-800 mb-2">
                                  {task.title}
                                </p>

                                {/* Task description */}
                                {task.description && (
                                  <p className="text-xs text-gray-400 mb-3 line-clamp-2">
                                    {task.description}
                                  </p>
                                )}

                                {/* Footer */}
                                <div className="flex items-center justify-between">
                                  <div
                                    className={`flex items-center gap-1 text-xs font-medium ${
                                      PRIORITY_COLORS[task.priority]
                                    }`}
                                  >
                                    <Flag size={10} />
                                    <span className="capitalize">
                                      {task.priority}
                                    </span>
                                  </div>
                                  {task.due_date && (
                                    <span className="text-xs text-gray-400">
                                      {new Date(
                                        task.due_date
                                      ).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>

                                {/* Assignee */}
                                {task.assignee_name && (
                                  <div className="mt-2 flex items-center gap-1">
                                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-xs text-blue-600 font-bold">
                                      {task.assignee_name.charAt(0)}
                                    </div>
                                    <span className="text-xs text-gray-400">
                                      {task.assignee_name}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      )}
    </Layout>
  );
}