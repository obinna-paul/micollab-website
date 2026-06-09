import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { ShieldAlert } from 'lucide-react';

const AdminRoute = ({ children }) => {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[var(--bg-base)]">
        <ShieldAlert size={64} className="text-red-500 mb-6 animate-pulse" />
        <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tighter mb-2">Access Denied</h1>
        <p className="text-[var(--text-secondary)] font-bold text-center max-w-sm mb-8">
          This area is restricted to Micollab Administrators. If you believe you should have access, please contact support.
          <br /><br />
          <span className="text-xs font-mono text-red-300 break-all">
            Debug Email: {user?.email} | Admin: {String(user?.isAdmin)} | Super: {String(user?.isSuperAdmin)}
          </span>
        </p>
        <button 
          onClick={() => window.history.back()}
          className="bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] text-[var(--text-primary)] px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[var(--border-primary)] transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return children;
};

export default AdminRoute;
