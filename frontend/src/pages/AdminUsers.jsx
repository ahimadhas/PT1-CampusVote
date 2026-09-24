import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { adminService } from '../services/api';
import {
  Users,
  Search,
  Shield,
  BookOpen,
  Award,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';

const roleConfig = {
  admin: { label: 'Admin', className: 'badge-pending', icon: Shield },
  student: { label: 'Student', className: 'badge-active', icon: BookOpen },
  candidate: { label: 'Candidate', className: 'badge-accepted', icon: Award },
};

const AdminUsers = () => {
  const { user: currentAdmin } = useAuth();
  const { success, error } = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Delete Modal State
  const [userToDelete, setUserToDelete] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (roleFilter !== 'all') params.role = roleFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await adminService.getUsers(params);
      if (res.data.success) {
        setUsers(res.data.users || []);
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await adminService.updateUserRole(userId, newRole);
      if (res.data.success) {
        success(`User role updated to ${newRole} successfully.`);
        fetchUsers();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update user role.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    try {
      const res = await adminService.deleteUser(userToDelete._id);
      if (res.data.success) {
        success('User account deleted successfully.');
        setUserToDelete(null);
        fetchUsers();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Shield className="w-6 h-6 text-amber-600" />
          University User Management
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Administer all registered users, modify roles, and manage account access.
        </p>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        {/* Role Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
          {['all', 'admin', 'student', 'candidate'].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors capitalize ${
                roleFilter === r
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {r === 'all' ? 'All Roles' : r.charAt(0).toUpperCase() + r.slice(1) + 's'}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, email, department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-8 text-xs py-1.5 w-full"
            />
          </div>
          <button type="submit" className="btn-secondary text-xs py-1.5 px-3">
            Search
          </button>
        </form>
      </div>

      {/* Results Count */}
      {!loading && (
        <p className="text-xs text-slate-500 font-medium">
          Showing <strong>{users.length}</strong> registered user{users.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Users Table */}
      {loading ? (
        <LoadingSpinner message="Loading university user registry..." size="lg" className="py-20" />
      ) : users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users found"
          description="No users match your current filter or search criteria."
        />
      ) : (
        <div className="card overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-600">
                    Name / Email
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-600">
                    Department
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-600">
                    Role
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-600">
                    Joined
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const rc = roleConfig[u.role] || roleConfig.student;
                  const isSelf = u._id === currentAdmin?._id;
                  return (
                    <tr key={u._id} className={`hover:bg-slate-50 transition-colors ${isSelf ? 'bg-campus-50/30' : ''}`}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs border border-slate-200 shrink-0">
                            {u.name?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 text-sm">
                              {u.name}
                              {isSelf && <span className="ml-2 text-[10px] text-campus-700 font-bold">(You)</span>}
                            </p>
                            <p className="text-xs text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-600">
                        {u.department || '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        {isSelf ? (
                          <span className={rc.className}>{rc.label}</span>
                        ) : (
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u._id, e.target.value)}
                            className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-white text-slate-700 focus:ring-1 focus:ring-campus-500 focus:border-campus-500"
                          >
                            <option value="admin">Admin</option>
                            <option value="student">Student</option>
                            <option value="candidate">Candidate</option>
                          </select>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {!isSelf && (
                          <button
                            onClick={() => setUserToDelete(u)}
                            className="inline-flex items-center gap-1 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="Delete User Account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="sm:hidden divide-y divide-slate-100">
            {users.map((u) => {
              const rc = roleConfig[u.role] || roleConfig.student;
              const isSelf = u._id === currentAdmin?._id;
              return (
                <div key={u._id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs border border-slate-200">
                        {u.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{u.name}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                    </div>
                    <span className={`${rc.className} text-[10px]`}>{rc.label}</span>
                  </div>
                  <p className="text-xs text-slate-500">{u.department}</p>
                  {!isSelf && (
                    <div className="flex items-center justify-between pt-2">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        className="text-xs border border-slate-200 rounded px-2 py-1 bg-white"
                      >
                        <option value="admin">Admin</option>
                        <option value="student">Student</option>
                      </select>
                      <button
                        onClick={() => setUserToDelete(u)}
                        className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        title="Confirm Account Deletion"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-rose-50 rounded border border-rose-200 text-xs text-rose-900">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Permanently Delete User Account</p>
              <p className="mt-1">
                Deleting <strong>{userToDelete?.name}</strong> ({userToDelete?.email}) will also remove all their associated votes.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setUserToDelete(null)} className="btn-secondary text-xs">
              Cancel
            </button>
            <button onClick={handleDeleteConfirm} className="btn-danger text-xs py-1.5 px-3">
              Delete Account
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminUsers;
