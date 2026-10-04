import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { adminService, pollService, authService } from '../services/api';
import {
  Vote,
  Users,
  Shield,
  BarChart3,
  PlusCircle,
  ArrowRight,
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  Play,
  Lock,
  AlertTriangle,
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import PollCard from '../components/PollCard';
import Modal from '../components/Modal';

const Dashboard = () => {
  const { user, role, isAdmin } = useAuth();
  const { success, error } = useToast();

  const [loading, setLoading] = useState(true);
  const [adminStats, setAdminStats] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [activePolls, setActivePolls] = useState([]);

  // Voting Modal State
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [selectedOptionId, setSelectedOptionId] = useState('');
  const [votingLoading, setVotingLoading] = useState(false);

  // Student Candidate Request Modal
  const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);
  const [candidateManifesto, setCandidateManifesto] = useState('');
  const [submittingCandidate, setSubmittingCandidate] = useState(false);

  // Admin Confirmation Modals
  const [pollToClose, setPollToClose] = useState(null);
  const [pollToDelete, setPollToDelete] = useState(null);
  const [pollToActivate, setPollToActivate] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        const statsRes = await adminService.getStats();
        if (statsRes.data.success) {
          setAdminStats(statsRes.data.stats);
          setPendingRequests(statsRes.data.pendingRequests || []);
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
      error('Please select a candidate to cast your vote.');
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

  // Student Candidate Request Submission
  const handleCandidateRequest = async (e) => {
    e.preventDefault();
    setSubmittingCandidate(true);
    try {
      const res = await authService.requestCandidate({ manifesto: candidateManifesto });
      if (res.data.success) {
        success('Candidacy request submitted! An administrator will review your application.');
        setIsCandidateModalOpen(false);
        setCandidateManifesto('');
        // Update user state if needed
        if (user) {
          user.candidateStatus = 'pending';
        }
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to submit candidacy request.');
    } finally {
      setSubmittingCandidate(false);
    }
  };

  // Admin Quick Review Candidate Request
  const handleReviewCandidate = async (userId, status) => {
    try {
      const res = await adminService.reviewCandidateRequest(userId, status);
      if (res.data.success) {
        success(`Candidate request ${status} successfully.`);
        fetchDashboardData();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to review candidate request.');
    }
  };

  // Admin Activate Poll
  const handleConfirmActivate = async () => {
    if (!pollToActivate) return;
    try {
      const res = await pollService.activate(pollToActivate._id);
      if (res.data.success) {
        success('Election activated and opened for student voting!');
        setPollToActivate(null);
        fetchDashboardData();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to activate election.');
    }
  };

  // Admin Close Poll
  const handleConfirmClose = async () => {
    if (!pollToClose) return;
    try {
      const res = await pollService.close(pollToClose._id);
      if (res.data.success) {
        success('Election closed successfully. Certified results are now viewable.');
        setPollToClose(null);
        fetchDashboardData();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to close election.');
    }
  };

  // Admin Delete Poll
  const handleConfirmDelete = async () => {
    if (!pollToDelete) return;
    try {
      const res = await pollService.delete(pollToDelete._id);
      if (res.data.success) {
        success('Election and associated votes removed successfully.');
        setPollToDelete(null);
        fetchDashboardData();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to delete election.');
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
                {role === 'admin' ? 'ADMINISTRATOR PORTAL' : 'STUDENT VOTING PORTAL'}
              </span>
              <span className="text-xs text-slate-300">
                {user?.department || 'Academic Division'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Welcome, {user?.name}
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              {isAdmin && 'Oversee campus elections, approve student candidates, and manage electoral integrity.'}
              {!isAdmin && 'Cast your confidential ballot in active campus elections and apply to run as a candidate.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {isAdmin ? (
              <Link to="/polls" className="btn-primary bg-campus-600 hover:bg-campus-500 text-white text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-sm">
                <PlusCircle className="w-4 h-4" />
                Manage Elections
              </Link>
            ) : (
              <Link to="/polls" className="btn-primary bg-campus-600 hover:bg-campus-500 text-white text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-sm">
                <Vote className="w-4 h-4" />
                View Active Ballots
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
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Approved Candidates</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{adminStats.users.candidates}</p>
                </div>
                <div className="w-10 h-10 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                  <Award className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 text-xs text-slate-500 flex gap-2">
                <span className="text-amber-700 font-semibold">{adminStats.users.pendingCandidates} pending requests</span>
              </div>
            </div>

            <div className="card p-5 border-l-4 border-l-slate-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Ballots</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{adminStats.polls.active}</p>
                </div>
                <div className="w-10 h-10 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
                  <Vote className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 text-xs text-slate-500">
                <span>{adminStats.polls.total} total elections · {adminStats.polls.closed} closed</span>
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
                <span>Certified single-vote tallies</span>
              </div>
            </div>
          </div>

          {/* Pending Candidate Requests Alert Section */}
          {pendingRequests.length > 0 && (
            <div className="card border-amber-300 overflow-hidden">
              <div className="p-4 bg-amber-50/70 border-b border-amber-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <h3 className="text-sm font-bold text-amber-900">
                    Pending Candidate Requests ({pendingRequests.length})
                  </h3>
                </div>
                <Link
                  to="/admin/users"
                  className="text-xs font-semibold text-amber-800 hover:text-amber-900 flex items-center gap-1"
                >
                  View All in User Management <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="divide-y divide-slate-100">
                {pendingRequests.map((req) => (
                  <div key={req._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{req.name}</p>
                      <p className="text-xs text-slate-500">{req.email} · {req.department || 'General'}</p>
                      {req.candidateManifesto && (
                        <p className="text-xs text-slate-600 italic mt-1 line-clamp-1">
                          "{req.candidateManifesto}"
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                      <button
                        onClick={() => handleReviewCandidate(req._id, 'approved')}
                        className="btn-primary bg-emerald-600 hover:bg-emerald-700 text-xs py-1.5 px-3 flex items-center gap-1 shadow-2xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approve Candidate
                      </button>
                      <button
                        onClick={() => handleReviewCandidate(req._id, 'rejected')}
                        className="btn-secondary text-xs py-1.5 px-3 text-rose-600 hover:bg-rose-50 border-rose-200"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Admin Elections Overview */}
          <div className="card">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Campus Elections</h2>
                <p className="text-xs text-slate-500 mt-0.5">Live status and administration of student elections</p>
              </div>
              <Link to="/polls" className="text-xs font-semibold text-campus-700 hover:text-campus-800 flex items-center gap-1">
                View All Elections <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="p-6">
              {activePolls.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  <Vote className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="font-medium text-slate-700">No campus elections created yet</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Click "Manage Elections" to publish your first election ballot.
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
                      onActivateClick={(p) => setPollToActivate(p)}
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
      {/* 2. STUDENT DASHBOARD VIEW */}
      {/* ============================================================ */}
      {!isAdmin && (
        <div className="space-y-6">
          {/* Candidate Status Banner */}
          <div className="card p-5 bg-gradient-to-r from-campus-50/90 via-emerald-50/50 to-white border-campus-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-campus-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">Student Candidacy Status</h3>
                    {user?.candidateStatus === 'approved' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Approved Candidate
                      </span>
                    ) : user?.candidateStatus === 'pending' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3 text-amber-600" />
                        Pending Admin Review
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                        Not Applied
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {user?.candidateStatus === 'approved'
                      ? 'You are an eligible election candidate. University administrators can include you on official election ballots.'
                      : user?.candidateStatus === 'pending'
                      ? 'Your candidate request has been submitted. The university administration will review your statement.'
                      : 'Students can request candidate status to run in upcoming student council and departmental elections.'}
                  </p>
                </div>
              </div>

              {user?.candidateStatus === 'approved' ? (
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg shrink-0">
                  Ready for Ballots
                </span>
              ) : user?.candidateStatus === 'pending' ? (
                <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg shrink-0">
                  Awaiting Approval
                </span>
              ) : (
                <button
                  onClick={() => setIsCandidateModalOpen(true)}
                  className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shrink-0 shadow-xs"
                >
                  <Award className="w-4 h-4" />
                  Request Candidate Status
                </button>
              )}
            </div>
          </div>

          {/* Active Elections */}
          <div className="card">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Active Campus Elections</h2>
                <p className="text-xs text-slate-500 mt-0.5">Cast your confidential ballot (One student = one vote per election)</p>
              </div>
              <Link to="/polls" className="text-xs font-semibold text-campus-700 hover:text-campus-800 flex items-center gap-1">
                All Elections <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="p-5">
              {activePolls.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  <Vote className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="font-medium text-slate-700">No active elections at this time</p>
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
                  Votes are authenticated via your university student token. Each student is limited to exactly one vote per election. Live tallies remain confidential until polls close.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* Modals */}
      {/* ============================================================ */}

      {/* 1. Vote Modal */}
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
                🔒 Security notice: One verified student = exactly one vote. Votes are confidential.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Select One Approved Candidate / Choice:
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

      {/* 2. Student Candidate Request Modal */}
      <Modal
        isOpen={isCandidateModalOpen}
        onClose={() => setIsCandidateModalOpen(false)}
        title="Apply to Become an Election Candidate"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCandidateRequest} className="space-y-4">
          <div className="p-3 bg-campus-50 rounded-lg border border-campus-200 text-xs text-campus-900 space-y-1">
            <p className="font-semibold">Candidate Application</p>
            <p className="text-campus-800 leading-relaxed">
              Submit your platform statement. Once approved by the administration, you will become an eligible candidate for upcoming campus elections.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Your Platform / Manifesto *
            </label>
            <textarea
              rows={4}
              required
              value={candidateManifesto}
              onChange={(e) => setCandidateManifesto(e.target.value)}
              placeholder="Outline your vision and reasons for running for student leadership..."
              className="input-field text-xs"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCandidateModalOpen(false)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingCandidate || !candidateManifesto.trim()}
              className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
            >
              <Award className="w-3.5 h-3.5" />
              {submittingCandidate ? 'Submitting...' : 'Submit Candidate Application'}
            </button>
          </div>
        </form>
      </Modal>

      {/* 3. Activate Poll Confirmation Modal */}
      <Modal
        isOpen={!!pollToActivate}
        onClose={() => setPollToActivate(null)}
        title="Activate Campus Election"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded border border-emerald-200 text-xs text-emerald-900">
            <Play className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5 fill-current" />
            <div>
              <p className="font-semibold mb-0.5">Activate Election for Voting</p>
              <p>Activating "{pollToActivate?.title}" will immediately open the election to all verified students for voting.</p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setPollToActivate(null)} className="btn-secondary text-xs">
              Cancel
            </button>
            <button onClick={handleConfirmActivate} className="btn-primary bg-emerald-600 hover:bg-emerald-700 text-xs py-1.5 px-3">
              Activate Election Now
            </button>
          </div>
        </div>
      </Modal>

      {/* 4. Close Poll Confirmation Modal */}
      <Modal
        isOpen={!!pollToClose}
        onClose={() => setPollToClose(null)}
        title="Confirm Election Closure"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-amber-50 rounded border border-amber-200 text-xs text-amber-900">
            <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-0.5">Are you sure you want to close this election?</p>
              <p>Closing "{pollToClose?.title}" will immediately disable new votes and publish final certified results.</p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setPollToClose(null)} className="btn-secondary text-xs">
              Keep Active
            </button>
            <button onClick={handleConfirmClose} className="btn-primary bg-amber-600 hover:bg-amber-700 text-xs py-1.5 px-3">
              Yes, Close Election & Reveal Results
            </button>
          </div>
        </div>
      </Modal>

      {/* 5. Delete Poll Confirmation Modal */}
      <Modal
        isOpen={!!pollToDelete}
        onClose={() => setPollToDelete(null)}
        title="Confirm Election Deletion"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-rose-50 rounded border border-rose-200 text-xs text-rose-900">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-0.5">Permanent Deletion Warning</p>
              <p>Deleting "{pollToDelete?.title}" will permanently erase this election and all voter records from the database.</p>
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
