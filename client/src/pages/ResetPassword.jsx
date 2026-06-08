import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Lock, Loader2, CheckCircle, ArrowRight } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

const ResetPassword = () => {
  const { resetPassword } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    // Extract token from URL: ?token=xyz
    const params = new URLSearchParams(location.search);
    const tokenParam = params.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setStatus({ type: 'error', msg: 'Invalid or missing password reset token.' });
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim() || !confirmPassword.trim()) return;
    
    if (password !== confirmPassword) {
      setStatus({ type: 'error', msg: 'Passwords do not match.' });
      return;
    }

    if (password.length < 6) {
      setStatus({ type: 'error', msg: 'Password must be at least 6 characters.' });
      return;
    }

    setLoading(true);
    setStatus(null);

    const res = await resetPassword(token, password);
    
    if (res.success) {
      setStatus({ type: 'success', msg: res.message });
      // Clear forms
      setPassword('');
      setConfirmPassword('');
    } else {
      setStatus({ type: 'error', msg: res.error });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 font-sans text-textMain">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-surface border border-divider rounded-3xl p-8 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-[150px] bg-primary/10 rounded-[100%] blur-3xl -z-10" />

        <h2 className="text-3xl font-black mb-2 tracking-tight">Set New Password</h2>
        <p className="text-textMuted text-sm font-medium mb-8">
          Please enter your new password below. Make sure it's secure!
        </p>

        {status && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }}
            className={`p-4 rounded-xl mb-6 text-sm font-semibold flex items-start gap-3 ${
              status.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
            }`}
          >
            {status.type === 'success' ? <CheckCircle size={20} className="shrink-0 mt-0.5" /> : null}
            <p>{status.msg}</p>
          </motion.div>
        )}

        {status?.type === 'success' ? (
          <Link 
            to="/login"
            className="w-full bg-primary text-[var(--text-primary)] font-bold py-3.5 rounded-xl hover:scale-[1.02] transition-all shadow-lg flex items-center justify-center group"
          >
            Go to Login <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-textMuted ml-1">New Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-textMuted pointer-events-none" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-background border border-divider rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium placeholder:text-textMuted/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-textMuted ml-1">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-textMuted pointer-events-none" size={20} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-background border border-divider rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium placeholder:text-textMuted/50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !token || !password || !confirmPassword}
              className="w-full bg-primary text-[var(--text-primary)] font-bold py-3.5 rounded-xl hover:scale-[1.02] transition-all active:scale-[0.98] shadow-lg disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center mt-4"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Reset Password'}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default ResetPassword;
