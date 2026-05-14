import Layout from '../components/Layout';
import {
  useOverview,
  useTasksOverTime,
  useTopMembers,
  useProjectProgress,
} from '../hooks/useAnalytics';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import useAuthStore from '../store/authStore';

// Stat card component
function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: number | string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const { data: overview, isLoading: overviewLoading } = useOverview();
  const { data: tasksOverTime } = useTasksOverTime();
  const { data: topMembers } = useTopMembers();
  const { data: projectProgress } = useProjectProgress();

  return (
    <Layout>
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">
          Welcome Back, {user?.name}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Here is what is happening in your workspace today.
        </p>
      </div>

      {/* Stat Cards */}
      {overviewLoading ? (
        <div className="text-gray-400 text-sm">Loading stats...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Projects"
            value={overview?.projects?.total_projects || 0}
            sub={`${overview?.projects?.active_projects || 0} active`}
            color="text-blue-600"
          />
          <StatCard
            label="Total Tasks"
            value={overview?.tasks?.total_tasks || 0}
            sub={`${overview?.tasks?.done_tasks || 0} completed`}
            color="text-green-600"
          />
          <StatCard
            label="In Progress"
            value={overview?.tasks?.in_progress_tasks || 0}
            sub="tasks currently active"
            color="text-yellow-500"
          />
          <StatCard
            label="Team Members"
            value={overview?.members?.total_members || 0}
            sub="active members"
            color="text-purple-600"
          />
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Tasks over time line chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Tasks Completed — Last 30 Days
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={tasksOverTime || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                tickFormatter={(val) => val.slice(5)}
              />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="tasks_completed"
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top members bar chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Top Performers
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topMembers || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="tasks_completed" radius={[4, 4, 0, 0]}>
                {(topMembers || []).map((_: any, index: number) => (
                  <Cell
                    key={index}
                    fill={index === 0 ? '#2563eb' : index === 1 ? '#7c3aed' : '#059669'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Project Progress */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          Project Progress
        </h3>
        {!projectProgress || projectProgress.length === 0 ? (
          <p className="text-sm text-gray-400">No projects yet.</p>
        ) : (
          <div className="space-y-4">
            {projectProgress.map((project: any) => (
              <div key={project.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">
                    {project.name}
                  </span>
                  <span className="text-sm text-gray-500">
                    {project.progress_percentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${project.progress_percentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {project.completed_tasks} of {project.total_tasks} tasks done
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}