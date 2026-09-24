import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { adminService, pollService } from '../services/api';
import {
  Vote,
  Users,
  Shield,
  BarChart3,
  PlusCircle,
  ArrowRight,
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import PollCard from '../components/PollCard';
import Modal from '../components/Modal';

const Dashboard = () => {
  const { user, role, isAdmin } = useAuth();
  const { success, error } = useToast();

  const [loading, setLoading] = useState(true);
  const [adminStats, setAdminStats] = useState(null);
  const [activePolls, setActivePolls] = useState([]);

  // Voting Modal State
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [selectedOptionId, setSelectedOptionId] = useState('');
  const [votingLoading, setVotingLoading] = useState(false);

  // Admin Close / Delete Confirmation Modals
  const [pollToClose, setPollToClose] = useState(null);
  const [pollToDelete, setPollToDelete] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        const statsRes = await adminService.getStats();
        if (statsRes.data.success) {
          setAdminStats(statsRes.data.stats);
        }
        const pollsRes = await pollService.getAll({ limit: 4 });
        if (pollsRes.data.success) {
          setActivePolls(pollsRes.data.polls || []);
        }
      } else {
        const pollsRes = await pollService.getAll({ status: 'active' });
        if (pollsRes.data.success) {
          setActivePolls(pollsRes.data.polls || []);
        }
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [role]);

  // Handle voting submission
  const handleCastVote = async (e) => {
    e.preventDefault();
    if (!selectedOptionId) {
      error('Please select a candidate or option to cast your vote.');
      return;
    }

    setVotingLoading(true);
    try {
      const res = await pollService.castVote(selectedPoll._id, selectedOptionId);
      if (res.data.success) {
        success(res.data.message || 'Your vote has been recorded successfully.');
        setSelectedPoll(null);
        setSelectedOptionId('');
        fetchDashboardData();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to submit vote.');
    } finally {
      setVotingLoading(false);
    }
  };

  // Handle admin close/delete actions (mirrors Polls.jsx)
  const handleConfirmClose = async () => {
    if (!pollToClose) return;
    try {
      const res = await pollService.close(pollToClose._id);
      if (res.data.success) {
        success('Poll closed successfully. Results are now available for viewing.');
        setPollToClose(null);
        fetchDashboardData();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to close poll.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!pollToDelete) return;
    try {
      const res = await pollService.delete(pollToDelete._id);
      if (res.data.success) {
        success('Poll and associated votes removed successfully.');
        setPollToDelete(null);
        fetchDashboardData();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to delete poll.');
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading your dashboard..." size="lg" className="py-24" />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Welcome Banner */}
      <div className="card bg-gradient-to-r from-navy-900 via-navy-800 to-campus-900 text-white p-6 sm:p-8 border-none shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded bg-white/10 text-campus-200 border border-white/10">
                {role?.toUpperCase()} PORTAL
              </span>
              <span className="text-xs text-slate-300">
                {user?.department || 'Academic Division'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Welcome, {user?.name}
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              {isAdmin && 'Oversee campus voting procedures, election results, and platform administration.'}
              {!isAdmin && 'Cast your ballot in active campus elections and review results once polls close.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {isAdmin && (
              <Link to="/polls" className="btn-primary bg-campus-600 hover:bg-campus-500 text-white text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-sm">
                <PlusCircle className="w-4 h-4" />
                Manage Polls
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 1. ADMIN DASHBOARD VIEW */}
      {/* ============================================================ */}
      {isAdmin && adminStats && (
        <div className="space-y-8">
          {/* KPI Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-5 border-l-4 border-l-campus-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Users</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{adminStats.users.total}</p>
                </div>
                <div className="w-10 h-10 rounded-md bg-campus-50 text-campus-700 flex items-center justify-center border border-campus-200">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 text-xs text-slate-500 flex gap-2">
                <span><strong>{adminStats.users.admins}</strong> Admins</span>
                <span>•</span>
                <span><strong>{adminStats.users.students}</strong> Students</span>
              </div>
            </div>

            <div className="card p-5 border-l-4 border-l-emerald-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Ballots</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{adminStats.polls.active}</p>
                </div>
                <div className="w-10 h-10 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                  <Vote className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 text-xs text-slate-500">
                <span>{adminStats.polls.total} total elections created</span>
              </div>
            </div>

            <div className="card p-5 border-l-4 border-l-slate-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Closed Polls</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{adminStats.polls.closed}</p>
                </div>
                <div className="w-10 h-10 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
                  <BarChart3 className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 text-xs text-slate-500">
                <span>Results aggregated & published</span>
              </div>
            </div>

            <div className="card p-5 border-l-4 border-l-amber-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Votes Cast</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{adminStats.polls.totalVotes}</p>
                </div>
                <div className="w-10 h-10 rounded-md bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
                  <Shield className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 text-xs text-slate-500">
                <span>Across all elections</span>
              </div>
            </div>
          </div>

          {/* Admin Management Overview */}
          <div className="card">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Campus Polls & Elections</h2>
                <p className="text-xs text-slate-500 mt-0.5">Live status and administration of voting records</p>
              </div>
              <Link to="/polls" className="text-xs font-semibold text-campus-700 hover:text-campus-800 flex items-center gap-1">
                View All Polls <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="p-6">
              {activePolls.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  <Vote className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="font-medium text-slate-700">No campus polls created yet</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Click "Manage Polls" above or in the navigation to create your first election ballot.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activePolls.slice(0, 4).map((poll) => (
                    <PollCard
                      key={poll._id}
                      poll={poll}
                      onVoteClick={(p) => {
                        setSelectedPoll(p);
                        setSelectedOptionId('');
                      }}
                      onCloseClick={(p) => setPollToClose(p)}
                      onDeleteClick={(p) => setPollToDelete(p)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. STUDENT / CANDIDATE DASHBOARD VIEW */}
      {/* ============================================================ */}
      {!isAdmin && (
        <div className="card">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Active Campus Elections & Polls</h2>
              <p className="text-xs text-slate-500 mt-0.5">Cast your confidential ballot (One student = one vote)</p>
            </div>
            <Link to="/polls" className="text-xs font-semibold text-campus-700 hover:text-campus-800 flex items-center gap-1">
              All Polls <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-5">
            {activePolls.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                <Vote className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="font-medium text-slate-700">No active polls at this time</p>
                <p className="text-xs text-slate-400 mt-1">Check back later or explore closed election results.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activePolls.map((poll) => (
                  <PollCard
                    key={poll._id}
                    poll={poll}
                    onVoteClick={(p) => {
                      setSelectedPoll(p);
                      setSelectedOptionId('');
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="p-5 pt-0">
            <div className="card p-4 bg-campus-50/50 border-campus-200">
              <h4 className="text-xs font-bold text-campus-900 flex items-center gap-1.5 mb-1.5">
                <Shield className="w-4 h-4 text-campus-700" />
                Voting Integrity Guarantee
              </h4>
              <p className="text-[11px] text-campus-800 leading-relaxed">
                Votes are authenticated via your student token. Each student is limited to one vote per election. Live tallies remain hidden until the poll is concluded.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Vote Modal */}
      <Modal
        isOpen={!!selectedPoll}
        onClose={() => {
          setSelectedPoll(null);
          setSelectedOptionId('');
        }}
        title={`Cast Your Ballot: ${selectedPoll?.title || ''}`}
        maxWidth="max-w-lg"
      >
        {selectedPoll && (
          <form onSubmit={handleCastVote} className="space-y-4">
            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded border border-slate-200 leading-relaxed">
              <p className="font-medium text-slate-800 mb-1">{selectedPoll.description}</p>
              <p className="text-slate-500 italic mt-2">
                ⚠️ Notice: Once submitted, your vote cannot be altered or retracted. One student = one vote.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Select One Candidate / Choice:
              </label>
              <div className="space-y-2">
                {selectedPoll.options?.map((opt) => (
                  <label
                    key={opt._id}
                    className={`flex items-start p-3.5 rounded-lg border cursor-pointer transition-all ${
                      selectedOptionId === opt._id
                        ? 'border-campus-600 bg-campus-50/80 ring-1 ring-campus-600 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="pollOption"
                      value={opt._id}
                      checked={selectedOptionId === opt._id}
                      onChange={() => setSelectedOptionId(opt._id)}
                      className="mt-0.5 text-campus-600 focus:ring-campus-500 h-4 w-4 border-slate-300"
                    />
                    <div className="ml-3 flex flex-col">
                      <span className="text-sm font-semibold text-slate-900">{opt.name}</span>
                      {opt.description && (
                        <span className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                          {opt.description}
                        </span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedPoll(null);
                  setSelectedOptionId('');
                }}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={votingLoading || !selectedOptionId}
                className="btn-primary text-xs py-2 px-4"
              >
                {votingLoading ? 'Recording Vote...' : 'Confirm & Cast Ballot'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Close Poll Confirmation Modal */}
      <Modal
        isOpen={!!pollToClose}
        onClose={() => setPollToClose(null)}
        title="Confirm Poll Closure"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-amber-50 rounded border border-amber-200 text-xs text-amber-900">
            <Shield className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-0.5">Are you sure you want to close this poll?</p>
              <p>Closing "{pollToClose?.title}" will immediately disable new votes and publish final aggregated results.</p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setPollToClose(null)} className="btn-secondary text-xs">
              Keep Active
            </button>
            <button onClick={handleConfirmClose} className="btn-primary bg-amber-600 hover:bg-amber-700 text-xs py-1.5 px-3">
              Yes, Close Poll & Reveal Results
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Poll Confirmation Modal */}
      <Modal
        isOpen={!!pollToDelete}
        onClose={() => setPollToDelete(null)}
        title="Confirm Poll Deletion"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-rose-50 rounded border border-rose-200 text-xs text-rose-900">
            <Shield className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-0.5">Permanent Deletion Warning</p>
              <p>Deleting "{pollToDelete?.title}" will permanently erase this poll and all associated voter records from the database.</p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setPollToDelete(null)} className="btn-secondary text-xs">
              Cancel
            </button>
            <button onClick={handleConfirmDelete} className="btn-danger text-xs py-1.5 px-3">
              Yes, Delete Permanently
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Dashboard;
