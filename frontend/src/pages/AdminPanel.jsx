import React from 'react';
import { useAuth } from '../context/AuthContext';

function AdminPanel() {
  const { logout } = useAuth();
  return (
    <div className="min-h-screen bg-darkBg text-textMain flex items-center justify-center p-4">
      <div className="glass-card max-w-md w-full p-8 rounded-2xl text-center">
        <h2 className="text-3xl font-extrabold text-white mb-2">Admin Dashboard</h2>
        <p className="text-sm text-textMuted mb-6">Verify branches and manage user blocks (Superuser console).</p>
        <button
          onClick={logout}
          className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/5 text-sm font-medium hover:bg-white/10 transition-all"
        >
          Logout Admin Console
        </button>
      </div>
    </div>
  );
}

export default AdminPanel;
