import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

const ForgotPassword = () => {
  const { forgotPassword } = useAuthStore();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success' | 'error', msg: string }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setStatus(null);

    const res = await forgotPassword(email.trim());
    
    if (res.success) {
      setStatus({ type: 'success', msg: res.message });
      setEmail('');
    } else {
      setStatus({ type: 'error', msg: res.error });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 font-sans text-textMain">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-surface border border-divider rounded-3xl p-8 shadow-2xl relative overflow-hidden"
      >
        {/* Aesthetic background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-[150px] bg-primary/10 rounded-[100%] blur-3xl -z-10" />

        <Link to="/login" className="inline-flex items-center text-sm font-semibold text-textMuted hover:text-primary transition-colors mb-6 group">
          <ArrowLeft size={16} className="mr-1 group-hover:-translate-x-1 transition-transform" /> Back to Login
        </Link>

        <h2 className="text-3xl font-black mb-2 tracking-tight">Forgot Password</h2>
        <p className="text-textMuted text-sm font-medium mb-8">
          Enter the email address associated with your account and we'll send you a link to reset your password.
        </p>

        {status && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }}
            className={`p-4 rounded-xl mb-6 text-sm font-semibold flex items-start gap-3 ${
              status.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
            }`}
          >
            {status.type === 'success' ? <CheckCircle size={20} className="shrink-0" /> : null}
            <p>{status.msg}</p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-textMuted ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-textMuted pointer-events-none" size={20} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-background border border-divider rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium placeholder:text-textMuted/50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !email.trim() || status?.type === 'success'}
            className="w-full bg-primary text-[var(--text-primary)] font-bold py-3.5 rounded-xl hover:scale-[1.02] transition-all active:scale-[0.98] shadow-lg disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Send Reset Link'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
