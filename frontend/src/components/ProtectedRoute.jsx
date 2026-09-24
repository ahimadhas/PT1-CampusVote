import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner message="Authenticating session..." size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="card p-8 border-slate-200">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied (403 Forbidden)</h2>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            Your current account role (<strong className="capitalize text-slate-800">{role}</strong>) does not have authorization to view this page. This section requires one of the following roles: <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">{allowedRoles.join(', ')}</span>.
          </p>
          <div className="flex justify-center gap-3">
            <Link to="/dashboard" className="btn-primary inline-flex items-center gap-1.5">
              <ArrowLeft className="w-4 h-4" />
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
