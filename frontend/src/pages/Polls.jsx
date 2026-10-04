import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { pollService, authService } from '../services/api';
import {
  Vote,
  PlusCircle,
  Search,
  Lock,
  Trash2,
  AlertTriangle,
  Play,
  Award,
  Clock,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import PollCard from '../components/PollCard';
import Modal from '../components/Modal';

const Polls = () => {
  const { user, isAdmin, isAuthenticated } = useAuth();
  const { success, error } = useToast();

  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'active', 'draft', 'closed'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Vote Modal
  const [selectedPollForVote, setSelectedPollForVote] = useState(null);
  const [selectedOptionId, setSelectedOptionId] = useState('');
  const [voteLoading, setVoteLoading] = useState(false);

  // Student Candidate Request Modal
  const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);
  const [candidateManifesto, setCandidateManifesto] = useState('');
  const [candidateSubmitting, setCandidateSubmitting] = useState(false);

  // Admin Create Poll Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('student_council');
  const [newStatus, setNewStatus] = useState('active'); // 'active' or 'draft'
  const [candidates, setCandidates] = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState([]);
  const [candidateDescriptions, setCandidateDescriptions] = useState({});

  // Admin Close / Delete / Activate Confirmation Modals
  const [pollToClose, setPollToClose] = useState(null);
  const [pollToDelete, setPollToDelete] = useState(null);
  const [pollToActivate, setPollToActivate] = useState(null);

  // Admin Edit Poll Modal
  const [pollToEdit, setPollToEdit] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('student_council');
  const [editLoading, setEditLoading] = useState(false);

  const fetchPolls = async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeTab === 'active') params.status = 'active';
      if (activeTab === 'draft') params.status = 'draft';
      if (activeTab === 'closed') params.status = 'closed';
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await pollService.getAll(params);
      if (res.data.success) {
        setPolls(res.data.polls || []);
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to load elections.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolls();
  }, [activeTab, selectedCategory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPolls();
  };

  // ------------------------------------------------------------
  // Voting Action
  // ------------------------------------------------------------
  const handleVoteSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOptionId) {
      error('Please select a candidate to cast your vote.');
      return;
    }

    setVoteLoading(true);
    try {
      const res = await pollService.castVote(selectedPollForVote._id, selectedOptionId);
      if (res.data.success) {
        success(res.data.message || 'Vote cast successfully!');
        setSelectedPollForVote(null);
        setSelectedOptionId('');
        fetchPolls();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to submit vote.');
    } finally {
      setVoteLoading(false);
    }
  };

  // ------------------------------------------------------------
  // Student Candidate Request Action
  // ------------------------------------------------------------
  const handleCandidateRequestSubmit = async (e) => {
    e.preventDefault();
    setCandidateSubmitting(true);
    try {
      const res = await authService.requestCandidate({ manifesto: candidateManifesto });
      if (res.data.success) {
        success('Candidacy request submitted! An administrator will review your application.');
        setIsCandidateModalOpen(false);
        setCandidateManifesto('');
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to submit candidate request.');
    } finally {
      setCandidateSubmitting(false);
    }
  };

  // ------------------------------------------------------------
  // Admin Create Poll Action (Only Approved Candidates)
  // ------------------------------------------------------------
  const fetchApprovedCandidates = async () => {
    setCandidatesLoading(true);
    try {
      const res = await pollService.getApprovedCandidates();
      if (res.data.success) {
        setCandidates(res.data.candidates || []);
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to load approved candidates.');
    } finally {
      setCandidatesLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setSelectedCandidateIds([]);
    setCandidateDescriptions({});
    setNewStatus('active');
    setIsCreateModalOpen(true);
    fetchApprovedCandidates();
  };

  const toggleCandidateSelection = (candidateId) => {
    setSelectedCandidateIds((prev) =>
      prev.includes(candidateId)
        ? prev.filter((id) => id !== candidateId)
        : [...prev, candidateId]
    );
  };

  const handleCandidateDescriptionChange = (candidateId, value) => {
    setCandidateDescriptions((prev) => ({ ...prev, [candidateId]: value }));
  };

  const handleCreatePoll = async (e) => {
    e.preventDefault();

    if (!newTitle.trim() || !newDescription.trim()) {
      error('Please fill in election title and description.');
      return;
    }

    if (selectedCandidateIds.length < 2) {
      error('Please select at least 2 approved candidates for this election.');
      return;
    }

    setCreateLoading(true);
    try {
      const res = await pollService.create({
        title: newTitle.trim(),
        description: newDescription.trim(),
        category: newCategory,
        status: newStatus,
        options: selectedCandidateIds.map((candidateId) => ({
          candidateId,
          description: (candidateDescriptions[candidateId] || '').trim(),
        })),
      });

      if (res.data.success) {
        success(
          newStatus === 'active'
            ? 'New election published and voting is live!'
            : 'Election saved as draft.'
        );
        setIsCreateModalOpen(false);
        setNewTitle('');
        setNewDescription('');
        setNewCategory('student_council');
        setSelectedCandidateIds([]);
        setCandidateDescriptions({});
        fetchPolls();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to create election.');
    } finally {
      setCreateLoading(false);
    }
  };

  // ------------------------------------------------------------
  // Admin Edit Poll Action
  // ------------------------------------------------------------
  const handleOpenEditModal = (poll) => {
    setPollToEdit(poll);
    setEditTitle(poll.title);
    setEditDescription(poll.description);
    setEditCategory(poll.category);
  };

  const handleConfirmEdit = async (e) => {
    e.preventDefault();
    if (!pollToEdit) return;

    if (!editTitle.trim() || !editDescription.trim()) {
      error('Please fill in election title and description.');
      return;
    }

    setEditLoading(true);
    try {
      const res = await pollService.update(pollToEdit._id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        category: editCategory,
      });
      if (res.data.success) {
        success('Election details updated successfully.');
        setPollToEdit(null);
        fetchPolls();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update election.');
    } finally {
      setEditLoading(false);
    }
  };

  // ------------------------------------------------------------
  // Admin Activate Poll Action
  // ------------------------------------------------------------
  const handleConfirmActivate = async () => {
    if (!pollToActivate) return;
    try {
      const res = await pollService.activate(pollToActivate._id);
      if (res.data.success) {
        success('Election activated successfully! Students can now cast their votes.');
        setPollToActivate(null);
        fetchPolls();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to activate election.');
    }
  };

  // ------------------------------------------------------------
  // Admin Close & Delete Actions
  // ------------------------------------------------------------
  const handleConfirmClose = async () => {
    if (!pollToClose) return;
    try {
      const res = await pollService.close(pollToClose._id);
      if (res.data.success) {
        success('Election closed successfully. Certified results are now viewable.');
        setPollToClose(null);
        fetchPolls();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to close election.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!pollToDelete) return;
    try {
      const res = await pollService.delete(pollToDelete._id);
      if (res.data.success) {
        success('Election and all voter receipts permanently deleted.');
        setPollToDelete(null);
        fetchPolls();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to delete election.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Student Candidacy Banner */}
      {!isAdmin && (
        <div className="card p-4 sm:p-5 bg-gradient-to-r from-campus-50/90 to-emerald-50/50 border border-campus-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-campus-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  {user?.candidateStatus === 'approved'
                    ? 'You are an Approved Election Candidate'
                    : user?.candidateStatus === 'pending'
                    ? 'Candidate Request Under Administrator Review'
                    : 'Interested in Running for Student Office?'}
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  {user?.candidateStatus === 'approved'
                    ? 'Administrators can add you to official ballots for upcoming university elections.'
                    : user?.candidateStatus === 'pending'
                    ? 'Your application has been received. University administration reviews each request.'
                    : 'Submit a candidate request to become eligible for addition to election ballots.'}
                </p>
              </div>
            </div>

            {user?.candidateStatus === 'approved' ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100/90 px-3 py-1.5 rounded-full border border-emerald-300 self-start sm:self-auto">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Eligible Candidate
              </span>
            ) : user?.candidateStatus === 'pending' ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-100/90 px-3 py-1.5 rounded-full border border-amber-300 self-start sm:self-auto">
                <Clock className="w-4 h-4 text-amber-600" />
                Pending Approval
              </span>
            ) : (
              <button
                onClick={() => setIsCandidateModalOpen(true)}
                className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 self-start sm:self-auto shadow-xs"
              >
                <Award className="w-4 h-4" />
                Apply to be a Candidate
              </button>
            )}
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Vote className="w-6 h-6 text-campus-700" />
            Campus Elections & Ballots
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse active student elections, vote securely, and inspect closed poll results.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreateModal}
            className="btn-primary flex items-center gap-2 py-2 px-4 shadow-sm self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            Create Election
          </button>
        )}
      </div>

      {/* Filter & Search Toolbar */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200 w-full md:w-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 md:flex-initial px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Ballots
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`flex-1 md:flex-initial px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'active'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active Only
            </button>
            {isAdmin && (
              <button
                onClick={() => setActiveTab('draft')}
                className={`flex-1 md:flex-initial px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  activeTab === 'draft'
                    ? 'bg-white text-amber-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Drafts
              </button>
            )}
            <button
              onClick={() => setActiveTab('closed')}
              className={`flex-1 md:flex-initial px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'closed'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Closed / Concluded
            </button>
          </div>

          {/* Search and Category Filter */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-field text-xs py-1.5 px-3 w-full sm:w-48"
            >
              <option value="all">All Categories</option>
              <option value="student_council">Student Council</option>
              <option value="class_election">Class Representative</option>
              <option value="club_election">Club & Organization</option>
              <option value="general_poll">General Opinion</option>
            </select>

            <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search elections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-8 pr-3 text-xs py-1.5"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </form>
          </div>
        </div>
      </div>

      {/* Main Polls Grid */}
      {loading ? (
        <LoadingSpinner message="Loading campus ballots..." size="lg" className="py-20" />
      ) : polls.length === 0 ? (
        <EmptyState
          icon={Vote}
          title="No elections found"
          description="There are currently no elections matching your selected filter criteria."
          action={
            isAdmin ? (
              <button
                onClick={handleOpenCreateModal}
                className="btn-primary text-xs mt-2"
              >
                Create the first election
              </button>
            ) : null
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {polls.map((poll) => (
            <PollCard
              key={poll._id}
              poll={poll}
              onVoteClick={(p) => {
                setSelectedPollForVote(p);
                setSelectedOptionId('');
              }}
              onActivateClick={isAdmin ? (p) => setPollToActivate(p) : undefined}
              onEditClick={isAdmin ? (p) => handleOpenEditModal(p) : undefined}
              onCloseClick={(p) => setPollToClose(p)}
              onDeleteClick={(p) => setPollToDelete(p)}
            />
          ))}
        </div>
      )}

      {/* ============================================================ */}
      {/* 1. Vote Modal */}
      {/* ============================================================ */}
      <Modal
        isOpen={!!selectedPollForVote}
        onClose={() => {
          setSelectedPollForVote(null);
          setSelectedOptionId('');
        }}
        title={`Cast Vote: ${selectedPollForVote?.title || ''}`}
        maxWidth="max-w-lg"
      >
        {selectedPollForVote && (
          <form onSubmit={handleVoteSubmit} className="space-y-4">
            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded border border-slate-200">
              <p className="font-medium text-slate-800 mb-1">{selectedPollForVote.description}</p>
              <p className="text-slate-500 italic mt-1">
                🔒 Security notice: One verified student = exactly one vote. Votes are confidential.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Choose Candidate / Option:
              </label>
              <div className="space-y-2">
                {selectedPollForVote.options?.map((opt) => (
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
                      name="modalOption"
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
                  setSelectedPollForVote(null);
                  setSelectedOptionId('');
                }}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={voteLoading || !selectedOptionId}
                className="btn-primary text-xs py-2 px-4"
              >
                {voteLoading ? 'Recording Vote...' : 'Confirm Vote'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ============================================================ */}
      {/* 2. Student Candidate Request Modal */}
      {/* ============================================================ */}
      <Modal
        isOpen={isCandidateModalOpen}
        onClose={() => setIsCandidateModalOpen(false)}
        title="Apply to Become an Election Candidate"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCandidateRequestSubmit} className="space-y-4">
          <div className="p-3 bg-campus-50 rounded-lg border border-campus-200 text-xs text-campus-900 space-y-1">
            <p className="font-semibold">Candidate Application Guidelines</p>
            <p className="text-campus-800 leading-relaxed">
              Once submitted, university administration will review your eligibility. If approved, you can be selected as a candidate on official university election ballots.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Candidate Platform / Manifesto *
            </label>
            <textarea
              rows={4}
              required
              value={candidateManifesto}
              onChange={(e) => setCandidateManifesto(e.target.value)}
              placeholder="Outline your platform goals, vision, and leadership experience..."
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
              disabled={candidateSubmitting || !candidateManifesto.trim()}
              className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
            >
              <Award className="w-3.5 h-3.5" />
              {candidateSubmitting ? 'Submitting Application...' : 'Submit Candidate Request'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ============================================================ */}
      {/* 3. Admin Create Poll Modal (Only Approved Candidates) */}
      {/* ============================================================ */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Campus Election"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreatePoll} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Election Title *
            </label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. 2026 Student Government President Election"
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Category *
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="input-field text-xs py-2"
              >
                <option value="student_council">Student Council Election</option>
                <option value="class_election">Class Representative Election</option>
                <option value="club_election">Club & Organization Election</option>
                <option value="general_poll">General Student Poll</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Initial Status *
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="input-field text-xs py-2"
              >
                <option value="active">Active (Open for Voting Immediately)</option>
                <option value="draft">Draft (Inactive until Activated)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Description / Manifesto Overview *
            </label>
            <textarea
              rows={3}
              required
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Provide context, voting guidelines, and election details..."
              className="input-field text-xs"
            />
          </div>

          {/* Approved Candidate Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Select Approved Candidates (Minimum 2 required) *
              </label>
              <span className="text-[11px] text-slate-500 font-medium">
                {selectedCandidateIds.length} candidate{selectedCandidateIds.length !== 1 ? 's' : ''} selected
              </span>
            </div>

            {candidatesLoading ? (
              <LoadingSpinner message="Loading approved candidates..." size="sm" className="py-6" />
            ) : candidates.length === 0 ? (
              <div className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-3.5 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  No Approved Candidates Available
                </p>
                <p className="text-amber-800 leading-relaxed">
                  Only students with <strong>approved candidate status</strong> can be added to an election. Students can submit candidate requests from their dashboard or registration, and an administrator can approve them under <strong>User Management → Candidate Requests</strong>.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto p-1 border border-slate-200 rounded-lg bg-slate-50">
                {candidates.map((c) => {
                  const isSelected = selectedCandidateIds.includes(c._id);
                  return (
                    <div
                      key={c._id}
                      className={`p-3 rounded-lg border transition-colors ${
                        isSelected ? 'border-campus-600 bg-campus-50/80 shadow-2xs' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleCandidateSelection(c._id)}
                          className="mt-0.5 h-4 w-4 text-campus-600 focus:ring-campus-500 border-slate-300 rounded"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-900">{c.name}</span>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                              Approved
                            </span>
                          </div>
                          <span className="text-xs text-slate-500">
                            {c.email} {c.department ? `· ${c.department}` : ''}
                          </span>
                          {c.candidateManifesto && (
                            <p className="text-[11px] text-slate-600 italic mt-1 line-clamp-1">
                              "{c.candidateManifesto}"
                            </p>
                          )}
                        </div>
                      </label>
                      {isSelected && (
                        <input
                          type="text"
                          placeholder="Election-specific campaign slogan/blurb (optional)"
                          value={candidateDescriptions[c._id] || ''}
                          onChange={(e) => handleCandidateDescriptionChange(c._id, e.target.value)}
                          className="input-field text-xs py-1.5 mt-2 bg-white"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createLoading || candidates.length < 2 || selectedCandidateIds.length < 2}
              className="btn-primary text-xs py-2 px-4"
            >
              {createLoading
                ? 'Creating...'
                : newStatus === 'active'
                ? 'Publish Active Election'
                : 'Save Election Draft'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ============================================================ */}
      {/* 4. Edit Poll Modal */}
      {/* ============================================================ */}
      <Modal
        isOpen={!!pollToEdit}
        onClose={() => setPollToEdit(null)}
        title="Edit Election Details"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleConfirmEdit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Election Title *
            </label>
            <input
              type="text"
              required
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Category *
            </label>
            <select
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value)}
              className="input-field"
            >
              <option value="student_council">Student Council Election</option>
              <option value="class_election">Class Representative Election</option>
              <option value="club_election">Club & Organization Election</option>
              <option value="general_poll">General Student Poll</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Description / Manifesto Overview *
            </label>
            <textarea
              rows={3}
              required
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="input-field"
            />
          </div>

          <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded p-2.5">
            Candidate options are locked once votes are received to preserve electoral integrity.
          </p>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setPollToEdit(null)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editLoading}
              className="btn-primary text-xs py-2 px-4"
            >
              {editLoading ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ============================================================ */}
      {/* 5. Activate Poll Confirmation Modal */}
      {/* ============================================================ */}
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

      {/* ============================================================ */}
      {/* 6. Close Poll Confirmation Modal */}
      {/* ============================================================ */}
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

      {/* ============================================================ */}
      {/* 7. Delete Poll Confirmation Modal */}
      {/* ============================================================ */}
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

export default Polls;
