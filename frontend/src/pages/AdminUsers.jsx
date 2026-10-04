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
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';

const roleConfig = {
  admin: { label: 'Admin', className: 'badge-pending', icon: Shield },
  student: { label: 'Student', className: 'badge-active', icon: BookOpen },
};

const candidateStatusConfig = {
  approved: {
    label: 'Approved Candidate',
    className: 'inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full',
    icon: CheckCircle2,
  },
  pending: {
    label: 'Request Pending',
    className: 'inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full',
    icon: Clock,
  },
  rejected: {
    label: 'Request Rejected',
    className: 'inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full',
    icon: XCircle,
  },
};

const AdminUsers = () => {
  const { user: currentAdmin } = useAuth();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'candidate-requests'

  // Users state
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Candidate Requests state
  const [candidateRequests, setCandidateRequests] = useState([]);
  const [candidateFilter, setCandidateFilter] = useState('pending');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Delete Modal State
  const [userToDelete, setUserToDelete] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (roleFilter === 'candidate') {
        params.candidateStatus = 'approved';
      } else if (roleFilter !== 'all') {
        params.role = roleFilter;
      }
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

  const fetchCandidateRequests = async () => {
    try {
      const res = await adminService.getCandidateRequests({ status: candidateFilter });
      if (res.data.success) {
        setCandidateRequests(res.data.requests || []);
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to load candidate requests.');
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchCandidateRequests();
  }, [roleFilter, candidateFilter]);

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

  const handleReviewCandidate = async (userId, status) => {
    setActionLoadingId(userId);
    try {
      const res = await adminService.reviewCandidateRequest(userId, status);
      if (res.data.success) {
        success(`Candidate application ${status === 'approved' ? 'approved' : 'rejected'} successfully.`);
        fetchCandidateRequests();
        fetchUsers();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to review candidate request.');
    } finally {
      setActionLoadingId(null);
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
        fetchCandidateRequests();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  const pendingRequestsCount = candidateRequests.filter((r) => r.candidateStatus === 'pending').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Shield className="w-6 h-6 text-amber-600" />
          University User & Candidate Administration
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage university accounts (Student & Admin) and review student candidacy requests for upcoming elections.
        </p>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'users'
              ? 'border-campus-600 text-campus-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          User Registry ({users.length})
        </button>

        <button
          onClick={() => setActiveTab('candidate-requests')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'candidate-requests'
              ? 'border-campus-600 text-campus-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          Candidate Requests
          {pendingRequestsCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-200">
              {pendingRequestsCount} Pending
            </span>
          )}
        </button>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: USER REGISTRY */}
      {/* ============================================================ */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="card p-4 flex flex-col sm:flex-row gap-3">
            {/* Role Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
              {[
                { key: 'all', label: 'All Users' },
                { key: 'student', label: 'Students' },
                { key: 'candidate', label: 'Approved Candidates' },
                { key: 'admin', label: 'Admins' },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setRoleFilter(item.key)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    roleFilter === item.key
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by name, email, department, student ID..."
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
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-600">
                        Name / Email
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-600">
                        Department / ID
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-600">
                        Role
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-600">
                        Candidate Eligibility
                      </th>
                      <th className="text-right px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-600">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((u) => {
                      const rc = roleConfig[u.role] || roleConfig.student;
                      const csc = candidateStatusConfig[u.candidateStatus];
                      const isSelf = u._id === currentAdmin?._id;

                      return (
                        <tr
                          key={u._id}
                          className={`hover:bg-slate-50 transition-colors ${
                            isSelf ? 'bg-campus-50/30' : ''
                          }`}
                        >
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs border border-slate-200 shrink-0">
                                {u.name?.charAt(0)}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900 text-sm">
                                  {u.name}
                                  {isSelf && (
                                    <span className="ml-2 text-[10px] text-campus-700 font-bold">
                                      (You)
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-slate-500">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-xs text-slate-600">
                            <div>{u.department || '—'}</div>
                            {u.studentId && (
                              <div className="text-[11px] text-slate-400 font-mono">
                                ID: {u.studentId}
                              </div>
                            )}
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
                                <option value="student">Student</option>
                                <option value="admin">Admin</option>
                              </select>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            {u.role === 'student' ? (
                              csc ? (
                                <div className="space-y-1">
                                  <span className={csc.className}>
                                    <csc.icon className="w-3 h-3" />
                                    {csc.label}
                                  </span>
                                  {u.candidateStatus === 'pending' && (
                                    <div className="flex gap-1.5 mt-1">
                                      <button
                                        onClick={() => handleReviewCandidate(u._id, 'approved')}
                                        className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded"
                                      >
                                        Approve
                                      </button>
                                      <button
                                        onClick={() => handleReviewCandidate(u._id, 'rejected')}
                                        className="text-[10px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-0.5 rounded"
                                      >
                                        Reject
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400">Standard Student</span>
                              )
                            ) : (
                              <span className="text-xs text-slate-400">System Admin</span>
                            )}
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
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: CANDIDATE REQUESTS */}
      {/* ============================================================ */}
      {activeTab === 'candidate-requests' && (
        <div className="space-y-6">
          {/* Status Filter */}
          <div className="card p-4 flex items-center justify-between">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
              {[
                { key: 'pending', label: 'Pending Review' },
                { key: 'approved', label: 'Approved Candidates' },
                { key: 'rejected', label: 'Rejected' },
                { key: 'all', label: 'All Requests' },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setCandidateFilter(item.key)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    candidateFilter === item.key
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <span className="text-xs text-slate-500 font-medium">
              Only approved candidates can be added to elections by an Admin.
            </span>
          </div>

          {candidateRequests.length === 0 ? (
            <EmptyState
              icon={Award}
              title="No candidate requests found"
              description={`There are currently no candidate requests with status "${candidateFilter}".`}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {candidateRequests.map((req) => {
                const csc = candidateStatusConfig[req.candidateStatus] || candidateStatusConfig.pending;
                const isPending = req.candidateStatus === 'pending';
                const isActionLoading = actionLoadingId === req._id;

                return (
                  <div key={req._id} className="card p-5 space-y-4 hover:border-slate-300 transition-shadow">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-campus-100 text-campus-800 font-bold flex items-center justify-center text-sm border border-campus-200 shrink-0">
                          {req.name?.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-base">{req.name}</h3>
                          <p className="text-xs text-slate-500">{req.email}</p>
                          <div className="text-[11px] text-slate-600 mt-0.5">
                            {req.department && <span className="font-medium">{req.department}</span>}
                            {req.studentId && <span> · ID: {req.studentId}</span>}
                          </div>
                        </div>
                      </div>

                      <span className={csc.className}>
                        <csc.icon className="w-3 h-3" />
                        {csc.label}
                      </span>
                    </div>

                    {/* Manifesto / Platform */}
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                      <p className="font-bold text-slate-700 uppercase text-[10px] tracking-wider mb-1">
                        Candidate Platform / Manifesto:
                      </p>
                      <p className="text-slate-600 leading-relaxed italic">
                        "{req.candidateManifesto || req.bio || 'No statement provided by candidate.'}"
                      </p>
                    </div>

                    {/* Requested Date & Action Footer */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-400">
                        Requested: {req.candidateRequestedAt ? new Date(req.candidateRequestedAt).toLocaleDateString() : '—'}
                      </span>

                      <div className="flex items-center gap-2">
                        {req.candidateStatus !== 'approved' && (
                          <button
                            onClick={() => handleReviewCandidate(req._id, 'approved')}
                            disabled={isActionLoading}
                            className="btn-primary bg-emerald-600 hover:bg-emerald-700 text-xs py-1.5 px-3 flex items-center gap-1 shadow-xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Approve Candidate
                          </button>
                        )}

                        {req.candidateStatus !== 'rejected' && (
                          <button
                            onClick={() => handleReviewCandidate(req._id, 'rejected')}
                            disabled={isActionLoading}
                            className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1 text-rose-700 hover:bg-rose-50 border-rose-200"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Reject
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
