import React from 'react';
import { Link } from 'react-router-dom';
import {
  Vote,
  CheckCircle2,
  Lock,
  BarChart3,
  Calendar,
  Trash2,
  Pencil,
  Play,
  Clock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const categoryLabels = {
  student_council: 'Student Council Election',
  class_election: 'Class Representative',
  club_election: 'Club & Org Poll',
  general_poll: 'General Student Poll',
};

const PollCard = ({
  poll,
  onVoteClick,
  onActivateClick,
  onCloseClick,
  onDeleteClick,
  onEditClick,
}) => {
  const { isAdmin } = useAuth();

  const isActive = poll.status === 'active';
  const isDraft = poll.status === 'draft';
  const isClosed = poll.status === 'closed';
  const hasVoted = poll.hasVoted;

  return (
    <div className="card hover:border-slate-300 transition-shadow flex flex-col justify-between h-full">
      <div>
        {/* Header Badges */}
        <div className="p-5 pb-3 border-b border-slate-100 flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-campus-800 bg-campus-50 border border-campus-200 px-2.5 py-0.5 rounded-full">
            {categoryLabels[poll.category] || 'Campus Election'}
          </span>
          <div>
            {isActive && (
              <span className="badge-active flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active Ballot
              </span>
            )}
            {isDraft && (
              <span className="badge-pending flex items-center gap-1 bg-amber-50 text-amber-800 border-amber-200">
                <Clock className="w-3 h-3 text-amber-600" />
                Draft / Inactive
              </span>
            )}
            {isClosed && (
              <span className="badge-closed flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-500" />
                Closed
              </span>
            )}
          </div>
        </div>

        {/* Body Content */}
        <div className="p-5">
          <h3 className="text-base font-bold text-slate-900 mb-2 leading-snug">
            {poll.title}
          </h3>
          <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed mb-4">
            {poll.description}
          </p>

          {/* Options Info */}
          <div className="space-y-1.5 text-xs text-slate-500 mb-4 bg-slate-50 p-3 rounded-md border border-slate-100">
            <div className="font-medium text-slate-700 mb-1 flex items-center justify-between">
              <span>Approved Candidates:</span>
              <span className="bg-white px-2 py-0.5 rounded border text-slate-600">
                {poll.options?.length || 0} registered
              </span>
            </div>
            <ul className="space-y-1 pl-1">
              {poll.options?.slice(0, 3).map((opt, i) => (
                <li key={opt._id || i} className="text-slate-600 flex items-center gap-1.5 truncate">
                  <span className="w-1 h-1 rounded-full bg-slate-400" />
                  <span className="truncate">{opt.name}</span>
                </li>
              ))}
              {poll.options?.length > 3 && (
                <li className="text-slate-400 italic pl-2.5">
                  +{poll.options.length - 3} more candidates
                </li>
              )}
            </ul>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              {isActive
                ? `Created: ${new Date(poll.createdAt).toLocaleDateString()}`
                : isDraft
                ? `Drafted: ${new Date(poll.createdAt).toLocaleDateString()}`
                : `Closed: ${new Date(poll.closedAt || poll.updatedAt).toLocaleDateString()}`}
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
        {/* User / Student Action */}
        <div className="flex items-center gap-2">
          {isActive && (
            hasVoted ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-100/80 px-3 py-1.5 rounded-md border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Vote Recorded
              </span>
            ) : (
              <button
                onClick={() => onVoteClick && onVoteClick(poll)}
                className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
              >
                <Vote className="w-3.5 h-3.5" />
                Vote Now
              </button>
            )
          )}

          {isDraft && (
            <span className="text-xs text-slate-500 italic">
              {isAdmin ? 'Ready to activate' : 'Ballot opens soon'}
            </span>
          )}

          {isClosed && (
            <Link
              to={`/polls/${poll._id}/results`}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-campus-700 bg-campus-50 hover:bg-campus-100 border border-campus-200 px-3 py-1.5 rounded-md transition-colors"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              View Results
            </Link>
          )}
        </div>

        {/* Admin Controls */}
        {isAdmin && (
          <div className="flex items-center gap-1">
            {isDraft && onActivateClick && (
              <button
                onClick={() => onActivateClick(poll)}
                className="p-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors flex items-center gap-1"
                title="Activate Election for Voting"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span className="text-[11px] font-bold">Activate</span>
              </button>
            )}
            {onEditClick && (
              <button
                onClick={() => onEditClick(poll)}
                className="p-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded transition-colors"
                title="Edit Election Details"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
            {isActive && onCloseClick && (
              <button
                onClick={() => onCloseClick(poll)}
                className="p-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded transition-colors"
                title="Close Election to finalize & aggregate results"
              >
                <Lock className="w-3.5 h-3.5" />
              </button>
            )}
            {onDeleteClick && (
              <button
                onClick={() => onDeleteClick(poll)}
                className="p-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded transition-colors"
                title="Delete Election"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PollCard;
