import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { pollService } from '../services/api';
import {
  BarChart3,
  Award,
  Lock,
  ArrowLeft,
  Users,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const Results = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeRestricted, setActiveRestricted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      setActiveRestricted(false);
      setErrorMsg('');

      try {
        const res = await pollService.getResults(id);
        if (res.data.success) {
          setData(res.data);
        }
      } catch (err) {
        if (err.response?.status === 403 || err.response?.data?.status === 'active') {
          setActiveRestricted(true);
        } else {
          setErrorMsg(err.response?.data?.message || 'Failed to load poll results.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [id]);

  if (loading) {
    return <LoadingSpinner message="Aggregating election results..." size="lg" className="py-24" />;
  }

  // Active Poll Privacy Guard
  if (activeRestricted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="card p-8 border-slate-200 shadow-sm">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200">
            <Lock className="w-7 h-7" />
          </div>
          <span className="badge-active text-xs mb-3">Ballot In Progress</span>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Results Are Confidential While Active</h2>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed max-w-lg mx-auto">
            To preserve election integrity and prevent voting bias, live vote totals and candidate tallies are strictly withheld until the poll is officially concluded by the university administration.
          </p>
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 text-left mb-6 space-y-1.5">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              University Polling Standard Rule #5:
            </div>
            <p>
              "While a poll is active, student vote choices are encrypted and confidential. Final aggregated results will be published immediately upon election closure."
            </p>
          </div>
          <Link to="/polls" className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Return to Campus Ballots
          </Link>
        </div>
      </div>
    );
  }

  if (errorMsg || !data) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="card p-8">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 mb-1">Results Unavailable</h3>
          <p className="text-sm text-slate-500 mb-6">{errorMsg || 'Could not retrieve election results.'}</p>
          <Link to="/polls" className="btn-secondary text-xs">
            Back to Polls
          </Link>
        </div>
      </div>
    );
  }

  const { poll, totalVotes, results, winners } = data;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back button */}
      <div>
        <Link to="/polls" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to All Polls
        </Link>
      </div>

      {/* Header Banner */}
      <div className="card p-6 sm:p-8 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <span className="badge-closed text-xs mb-2">Concluded Election</span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{poll.title}</h1>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">{poll.description}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-campus-600" />
            <span>Total Turnout: <strong className="text-slate-800">{totalVotes} Verified Votes</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Closed On: <strong className="text-slate-800">{new Date(poll.closedAt || poll.createdAt).toLocaleDateString()}</strong></span>
          </div>
        </div>
      </div>

      {/* Winner Callout Banner */}
      {winners && winners.length > 0 && (
        <div className="card p-5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-amber-300">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
                {winners.length > 1 ? 'Co-Winners (Tie)' : 'Official Winner / Elected Choice'}
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                {winners.map((w) => w.name).join(' & ')}
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Secured the majority with <strong>{winners[0].votes} votes</strong> ({winners[0].percentage}% of total ballots cast).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Breakdown Cards & Progress Bars */}
      <div className="card">
        <div className="p-5 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-campus-700" />
            Certified Vote Tallies & Aggregation
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Aggregated using MongoDB data pipelines from individual encrypted vote receipts.
          </p>
        </div>

        <div className="p-6 space-y-6">
          {results.map((opt, index) => {
            const isWinner = winners && winners.some((w) => w._id === opt._id);

            return (
              <div key={opt._id} className="space-y-2">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-slate-100 font-bold text-xs text-slate-700 flex items-center justify-center border border-slate-200">
                      {index + 1}
                    </span>
                    <div>
                      <span className="font-bold text-slate-900">{opt.name}</span>
                      {isWinner && (
                        <span className="ml-2 text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                          Winner
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-slate-900">{opt.votes} votes</span>
                    <span className="text-xs text-slate-500 ml-1.5">({opt.percentage}%)</span>
                  </div>
                </div>

                {opt.description && (
                  <p className="text-xs text-slate-500 pl-8 leading-relaxed">
                    {opt.description}
                  </p>
                )}

                {/* Percentage Bar */}
                <div className="pl-8">
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        isWinner ? 'bg-amber-500' : 'bg-campus-600'
                      }`}
                      style={{ width: `${Math.max(opt.percentage, 1)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Results;
