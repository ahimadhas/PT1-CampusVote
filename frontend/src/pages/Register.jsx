import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  GraduationCap,
  Lock,
  Mail,
  User,
  AlertCircle,
  BookOpen,
  Award,
  Shield,
  CheckSquare,
  Square,
} from 'lucide-react';

const Register = () => {
  const [role, setRole] = useState('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('');
  const [studentId, setStudentId] = useState('');
  const [bio, setBio] = useState('');

  // Candidate Request State (for Students)
  const [requestCandidate, setRequestCandidate] = useState(false);
  const [candidateManifesto, setCandidateManifesto] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { register } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim() || !email.trim() || !password) {
      setErrorMsg('Please fill in all required fields (Name, Email, Password)');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters in length');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        department: department.trim(),
        studentId: studentId.trim(),
        bio: bio.trim(),
        requestCandidate: role === 'student' && requestCandidate,
        candidateManifesto: role === 'student' && requestCandidate ? candidateManifesto.trim() : '',
      };

      const res = await register(payload);
      if (res.success) {
        if (role === 'student' && requestCandidate) {
          success(`Account created! Your candidate request was submitted to the administration for review.`);
        } else {
          success(`Account created successfully! Welcome to CampusPortal, ${name}.`);
        }
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      setErrorMsg(msg);
      error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-10 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center">
        <div className="w-12 h-12 rounded-lg bg-campus-700 text-white flex items-center justify-center mx-auto shadow-sm">
          <GraduationCap className="w-7 h-7" />
        </div>
        <h2 className="mt-4 text-2xl font-bold text-slate-900 tracking-tight">
          Create University Account
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Join the campus student polling and elections platform
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="card p-8 sm:p-10 shadow-md">
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-md bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Exactly 2 Roles: Student and Admin */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Select Your Role *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`p-3 rounded-lg border text-center transition-all flex flex-col items-center gap-1.5 ${
                    role === 'student'
                      ? 'border-campus-600 bg-campus-50/80 text-campus-900 font-semibold ring-1 ring-campus-600'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <BookOpen className="w-5 h-5 text-campus-600" />
                  <span className="text-sm">Student</span>
                  <span className="text-[10px] text-slate-500 font-normal">Vote & apply as candidate</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRole('admin');
                    setRequestCandidate(false);
                  }}
                  className={`p-3 rounded-lg border text-center transition-all flex flex-col items-center gap-1.5 ${
                    role === 'admin'
                      ? 'border-amber-600 bg-amber-50/80 text-amber-900 font-semibold ring-1 ring-amber-600'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Shield className="w-5 h-5 text-amber-600" />
                  <span className="text-sm">Administrator</span>
                  <span className="text-[10px] text-slate-500 font-normal">Manage elections & approvals</span>
                </button>
              </div>
            </div>

            {/* Candidate Request Toggle (Available for Students) */}
            {role === 'student' && (
              <div className="p-3.5 rounded-lg border border-campus-200 bg-campus-50/50 space-y-2.5">
                <div
                  onClick={() => setRequestCandidate(!requestCandidate)}
                  className="flex items-start gap-2.5 cursor-pointer select-none"
                >
                  {requestCandidate ? (
                    <CheckSquare className="w-4 h-4 text-campus-700 shrink-0 mt-0.5" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-emerald-600" />
                      Request to become an Election Candidate
                    </span>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                      Check this box if you plan to run for student office. Only administrator-approved candidates can be added to election ballots.
                    </p>
                  </div>
                </div>

                {requestCandidate && (
                  <div className="pt-2 border-t border-campus-200/60">
                    <label className="block text-[11px] font-semibold text-campus-900 mb-1">
                      Candidate Statement / Manifesto (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={candidateManifesto}
                      onChange={(e) => setCandidateManifesto(e.target.value)}
                      placeholder="Share your goals or reasons for running for student leadership..."
                      className="input-field text-xs"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Johnson"
                    className="input-field pl-9"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  University Email *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@university.edu"
                    className="input-field pl-9"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="input-field pl-9"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Department
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Computer Science"
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Student ID Number (Optional)
              </label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="e.g. CS-2025-101"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Bio (Optional)
              </label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Brief introduction about yourself..."
                className="input-field"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-2.5 text-sm"
              >
                {loading ? 'Creating University Account...' : 'Complete Registration'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-campus-700 hover:text-campus-800 underline">
              Sign In here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
