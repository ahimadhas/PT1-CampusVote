import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ message = 'Loading...', size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 text-xs',
    md: 'w-6 h-6 text-sm',
    lg: 'w-10 h-10 text-base',
  };

  return (
    <div className={`flex flex-col items-center justify-center p-8 text-slate-500 gap-3 ${className}`}>
      <Loader2 className={`animate-spin text-campus-600 ${sizeClasses[size] || sizeClasses.md}`} />
      {message && <p className="font-medium text-slate-600">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
