import { useState } from 'react';
import Layout from '../components/Layout';
import {
  useMembers,
  useInviteMember,
  useUpdateMemberRole,
  useRemoveMember,
} from '../hooks/useTeam';
import useAuthStore from '../store/authStore';
import { UserPlus, Trash2, Shield } from 'lucide-react';

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700',
  manager: 'bg-blue-100 text-blue-700',
  viewer: 'bg-gray-100 text-gray-600',
};

export default function Team() {
  const { user } = useAuthStore();
  const { data: members, isLoading } = useMembers();
  const inviteMember = useInviteMember();
  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();

  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'viewer' });
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [error, setError] = useState('');

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setInviteSuccess('');

    try {
      const result = await inviteMember.mutateAsync(inviteForm);
      setInviteSuccess(
        `Invite created! Link: ${result.invite.inviteLink}`
      );
      setInviteForm({ email: '', role: 'viewer' });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send invite');
    }
  }

  async function handleRoleChange(id: string, role: string) {
    try {
      await updateRole.mutateAsync({ id, role });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update role');
    }
  }

  async function handleRemove(id: string, name: string) {
    if (confirm(`Remove ${name} from the team?`)) {
      try {
        await removeMember.mutateAsync(id);
      } catch (err: any) {
        alert(err.response?.data?.message || 'Failed to remove member');
      }
    }
  }

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Team</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your team members and their roles
          </p>
        </div>
        {user?.role === 'admin' && (
          <button
            onClick={() => {
              setShowInviteForm(true);
              setInviteSuccess('');
              setError('');
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            <UserPlus size={16} />
            Invite Member
          </button>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              Invite Team Member
            </h2>

            {inviteSuccess && (
              <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg mb-4 text-xs break-all">
                {inviteSuccess}
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) =>
                    setInviteForm({ ...inviteForm, email: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="colleague@company.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={inviteForm.role}
                  onChange={(e) =>
                    setInviteForm({ ...inviteForm, role: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="viewer">Viewer</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteForm(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50 transition"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={inviteMember.isPending}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {inviteMember.isPending ? 'Sending...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Members Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-gray-400 text-sm">Loading members...</div>
        ) : !members || members.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <p className="text-lg font-medium">No team members yet</p>
            <p className="text-sm mt-1">Invite your first team member</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left text-xs font-semibold text-gray-500 px-6 py-4">
                  Member
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 px-6 py-4">
                  Role
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 px-6 py-4">
                  Status
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 px-6 py-4">
                  Joined
                </th>
                {user?.role === 'admin' && (
                  <th className="text-left text-xs font-semibold text-gray-500 px-6 py-4">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {members.map((member: any) => (
                <tr key={member.id} className="hover:bg-gray-50 transition">
                  {/* Member info */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {member.name}
                          {member.id === user?.id && (
                            <span className="ml-2 text-xs text-gray-400">
                              (you)
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-400">{member.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-6 py-4">
                    {user?.role === 'admin' && member.role !== 'admin' ? (
                      <select
                        value={member.role}
                        onChange={(e) =>
                          handleRoleChange(member.id, e.target.value)
                        }
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="viewer">Viewer</option>
                        <option value="manager">Manager</option>
                      </select>
                    ) : (
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${ROLE_COLORS[member.role]}`}
                      >
                        {member.role}
                      </span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        member.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {member.status}
                    </span>
                  </td>

                  {/* Joined date */}
                  <td className="px-6 py-4 text-xs text-gray-400">
                    {new Date(member.created_at).toLocaleDateString()}
                  </td>

                  {/* Actions */}
                  {user?.role === 'admin' && (
                    <td className="px-6 py-4">
                      {member.role !== 'admin' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              handleRoleChange(
                                member.id,
                                member.role === 'manager' ? 'viewer' : 'manager'
                              )
                            }
                            className="text-gray-400 hover:text-blue-500 transition"
                            title="Toggle role"
                          >
                            <Shield size={15} />
                          </button>
                          <button
                            onClick={() =>
                              handleRemove(member.id, member.name)
                            }
                            className="text-gray-400 hover:text-red-500 transition"
                            title="Remove member"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}