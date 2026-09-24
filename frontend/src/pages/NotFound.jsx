import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Vote, Users, ArrowRight, Shield, BookOpen, UserCheck } from 'lucide-react';

const NotFound = () => (
  <div className="min-h-[75vh] flex flex-col items-center justify-center px-4 text-center">
    <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-5">
      <GraduationCap className="w-8 h-8 text-slate-400" />
    </div>
    <h1 className="text-4xl font-bold text-slate-900 mb-2">404</h1>
    <p className="text-base font-semibold text-slate-700 mb-1">Page Not Found</p>
    <p className="text-sm text-slate-500 mb-8 max-w-sm">
      The page you're looking for doesn't exist or may have been removed.
    </p>
    <Link to="/dashboard" className="btn-primary flex items-center gap-2">
      <ArrowRight className="w-4 h-4" />
      Return to Dashboard
    </Link>
  </div>
);

export default NotFound;
