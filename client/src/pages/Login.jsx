import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // OTP State
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  const navigate = useNavigate();
  const { login, verifyOTP, resendOTP } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const result = await login(email, password);
    
    if (result.success) {
      navigate('/');
    } else if (result.requiresVerification) {
      setRequiresVerification(true);
      setError('');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const result = await verifyOTP(email, otpCode);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleResendOTP = async () => {
    setLoading(true);
    const result = await resendOTP(email);
    if (!result.success) {
      setError(result.error);
    } else {
      setError('');
      alert('A new code has been sent to your email.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Link to="/" className="flex items-center gap-2 mb-8">
        <div className="w-10 h-10 bg-primary rounded flex items-center justify-center font-black text-white text-xl">M</div>
        <h1 className="text-2xl font-black text-primary tracking-tighter">Micollab</h1>
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-surface p-8 rounded-2xl border border-divider shadow-xl"
      >
        {!requiresVerification ? (
          <>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-textMain mb-2">Welcome Back</h2>
              <p className="text-textMuted">Sign in to Micollab to continue.</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-600 text-sm">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-textMuted ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" size={18} />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-background border border-divider rounded-xl py-2.5 pl-10 pr-4 text-textMain outline-none focus:border-primary transition"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-textMuted ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" size={18} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-background border border-divider rounded-xl py-2.5 pl-10 pr-12 text-textMain outline-none focus:border-primary transition"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-textMuted hover:text-textMain transition"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary hover:bg-primaryHover text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 mt-4"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Sign In'}
              </button>
            </form>

            <p className="mt-8 text-center text-textMuted text-sm font-medium">
              New to Micollab? {' '}
              <Link to="/register" className="text-primary font-bold hover:underline">Join Now</Link>
            </p>
          </>
        ) : (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
             <div className="text-center mb-8">
               <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Mail size={32} />
               </div>
               <h2 className="text-2xl font-black text-textMain mb-2">Verify your email</h2>
               <p className="text-textMuted text-sm">
                 Please check your email and enter the verification code.
               </p>
             </div>

             {error && (
               <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-600 text-sm">
                 <AlertCircle size={18} />
                 {error}
               </div>
             )}

             <form onSubmit={handleVerifyOTP} className="space-y-6">
               <div className="space-y-1">
                 <label className="text-xs font-bold text-textMuted ml-1 text-center block">Enter 6-digit Code</label>
                 <input 
                   type="text" 
                   required
                   maxLength={6}
                   value={otpCode}
                   onChange={(e) => setOtpCode(e.target.value)}
                   placeholder="000000"
                   className="w-full bg-background border border-divider rounded-xl py-4 text-center text-3xl tracking-[1em] text-textMain outline-none focus:border-primary transition font-black"
                 />
               </div>

               <button 
                 type="submit"
                 disabled={loading || otpCode.length !== 6}
                 className="w-full py-3 bg-primary hover:bg-primaryHover disabled:bg-divider disabled:text-textMuted text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-primary/20"
               >
                 {loading ? <Loader2 className="animate-spin" size={20} /> : 'Verify Email'}
               </button>
             </form>

             <p className="text-center text-sm text-textMuted pt-6">
               Didn't receive the code?{' '}
               <button onClick={handleResendOTP} disabled={loading} className="text-primary font-bold hover:underline disabled:opacity-50">
                 Resend OTP
               </button>
             </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default Login;
