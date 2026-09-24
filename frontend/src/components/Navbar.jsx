import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Vote,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  GraduationCap,
} from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }) =>
    `inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
      isActive
        ? 'bg-campus-700 text-white'
        : 'text-slate-200 hover:text-white hover:bg-slate-800'
    }`;

  const mobileNavLinkClass = ({ isActive }) =>
    `flex items-center gap-2.5 px-3 py-2.5 rounded-md text-base font-medium transition-colors ${
      isActive
        ? 'bg-campus-700 text-white'
        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`;

  return (
    <header className="bg-navy-900 border-b border-slate-800 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 text-white font-bold text-lg tracking-tight group">
              <div className="w-9 h-9 rounded-md bg-campus-600 flex items-center justify-center text-white shadow-inner group-hover:bg-campus-500 transition-colors">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="leading-none text-base">CampusPortal</span>
                <span className="text-[10px] text-slate-400 font-normal tracking-wider uppercase mt-0.5">
                  Student Elections
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            {isAuthenticated && (
              <nav className="hidden md:flex items-center space-x-1" aria-label="Main navigation">
                <NavLink to="/dashboard" className={navLinkClass}>
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </NavLink>

                <NavLink to="/polls" className={navLinkClass}>
                  <Vote className="w-4 h-4" />
                  <span>{isAdmin ? 'Manage Polls' : 'Elections & Polls'}</span>
                </NavLink>

                {/* Admin Specific Links */}
                {isAdmin && (
                  <NavLink to="/admin/users" className={navLinkClass}>
                    <ShieldCheck className="w-4 h-4" />
                    <span>User Management</span>
                  </NavLink>
                )}
              </nav>
            )}
          </div>

          {/* Desktop Right User Area */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 pl-3 border-l border-slate-700 text-right">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-white leading-tight">{user?.name}</span>
                    <span className="text-[11px] text-slate-400 capitalize flex items-center gap-1 justify-end">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        isAdmin ? 'bg-amber-400' : 'bg-campus-400'
                      }`} />
                      {user?.role}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-sm font-medium text-slate-200 hover:text-white rounded-md transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1.5 text-sm font-medium text-white bg-campus-600 hover:bg-campus-700 rounded-md transition-colors shadow-xs"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-800 bg-navy-950 px-4 pt-3 pb-4 space-y-2">
          {isAuthenticated ? (
            <>
              <div className="pb-3 mb-2 border-b border-slate-800">
                <div className="text-sm font-semibold text-white">{user?.name}</div>
                <div className="text-xs text-slate-400">{user?.email} • <span className="capitalize text-campus-400">{user?.role}</span></div>
              </div>

              <NavLink to="/dashboard" onClick={() => setMobileOpen(false)} className={mobileNavLinkClass}>
                <LayoutDashboard className="w-5 h-5" />
                <span>Dashboard</span>
              </NavLink>

              <NavLink to="/polls" onClick={() => setMobileOpen(false)} className={mobileNavLinkClass}>
                <Vote className="w-5 h-5" />
                <span>{isAdmin ? 'Manage Polls' : 'Elections & Polls'}</span>
              </NavLink>

              {isAdmin && (
                <NavLink to="/admin/users" onClick={() => setMobileOpen(false)} className={mobileNavLinkClass}>
                  <ShieldCheck className="w-5 h-5" />
                  <span>User Management</span>
                </NavLink>
              )}

              <div className="pt-2 mt-2 border-t border-slate-800">
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-base font-medium text-rose-400 hover:bg-rose-950/40"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-2 pt-2">
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="block text-center py-2.5 rounded-md text-base font-medium text-slate-200 bg-slate-800"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileOpen(false)}
                className="block text-center py-2.5 rounded-md text-base font-medium text-white bg-campus-600"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
