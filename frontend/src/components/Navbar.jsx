import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

function Navbar({ children }) {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-white/10 bg-darkBg/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center gap-8">
        {/* Brand */}
        <div className="flex items-center gap-2 flex-shrink-0 cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
            <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <span className="text-xl font-extrabold tracking-tight text-white">Focus<span className="text-primary">Desk</span></span>
          {user?.role === 'owner' && (
             <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-secondary/15 text-secondary border border-secondary/20 uppercase">
               Owner Portal
             </span>
          )}
        </div>

        {/* Global Navigation slot (e.g., Tabs) */}
        <div className="flex-1 hidden md:flex items-center justify-center">
          {children}
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <NotificationBell />
          <Link
            to="/profile"
            className="flex items-center gap-2 px-1 py-1 rounded-full border border-white/5 bg-white/5 hover:bg-white/10 transition-all text-sm group"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-glow">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <span className="text-white font-medium pr-3 hidden sm:inline group-hover:text-primary transition-colors">
              {user?.name?.split(' ')[0] || 'Profile'}
            </span>
          </Link>
          <button
            onClick={logout}
            className="p-2 rounded-lg text-textMuted hover:text-error hover:bg-error/10 transition-all"
            aria-label="Log Out"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
