import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader2, AlertCircle, Eye, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const AppleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.05 15.65c-.06 2.06 1.83 2.78 1.91 2.81-.01.12-.29.98-.89 1.86-.52.76-1.07 1.51-1.91 1.53-.82.02-1.09-.48-2.02-.48-.93 0-1.25.46-2.01.49-.8.03-1.45-.83-1.97-1.58C9.07 18.72 8 16.32 8 14.3c0-2.26 1.22-3.46 2.5-3.5 1.25-.04 1.93.58 2.85.58.91 0 1.76-.64 2.91-.55 1.15.09 2.04.5 2.59 1.3-.06.04-1.8.98-1.8 2.52zm-3.08-5.32c.5-0.62.82-1.48.72-2.33-.74.03-1.63.49-2.15 1.11-.47.55-.86 1.43-.74 2.27.83.06 1.66-.4 2.17-1.05z" />
  </svg>
);

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
    <div className="min-h-screen bg-[var(--bg-base)] flex flex-col lg:flex-row relative overflow-hidden font-sans">
      {/* Subtle Grid Background */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-40" 
        style={{ 
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)', 
          backgroundSize: '40px 40px' 
        }} 
      />

      {/* Left Marketing Section */}
      <div className="w-full lg:w-[55%] flex flex-col justify-center p-8 lg:p-20 relative z-10 min-h-[50vh] lg:min-h-screen">
        <Link to="/" className="flex items-center gap-3 mb-16 lg:mb-24 w-fit group">
          <div className="w-10 h-10 bg-[#7B5CFA] rounded-xl flex items-center justify-center font-black text-white text-xl shadow-lg shadow-[#7B5CFA]/20 group-hover:bg-[#684CE0] transition-colors">M</div>
          <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tighter">Micollab</h1>
        </Link>
        
        <div className="max-w-xl">
          <h2 className="text-4xl lg:text-6xl font-black text-[var(--text-primary)] mb-6 leading-[1.1] tracking-tight">
            Enter the Creative <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D0B3FF] to-[#A37BFF]">Multiverse.</span>
          </h2>
          <p className="text-[var(--text-secondary)] text-lg lg:text-xl leading-relaxed mb-12 max-w-md font-medium">
            Connect, collaborate, and create with the world's most vibrant community of avant-garde professionals.
          </p>
          
          <div className="flex items-center gap-4 bg-[var(--bg-surface-alt)] w-fit p-3 pr-6 rounded-2xl border border-[var(--border-primary)] shadow-xl">
            <div className="flex -space-x-3">
              <img src="https://ui-avatars.com/api/?name=Alice&background=7B5CFA&color=fff" className="w-10 h-10 rounded-full border-2 border-[#181D2A] object-cover" alt="User" />
              <img src="https://ui-avatars.com/api/?name=Bob&background=00B5D8&color=fff" className="w-10 h-10 rounded-full border-2 border-[#181D2A] object-cover" alt="User" />
              <img src="https://ui-avatars.com/api/?name=Charlie&background=10B981&color=fff" className="w-10 h-10 rounded-full border-2 border-[#181D2A] object-cover" alt="User" />
            </div>
            <div>
              <p className="text-[var(--text-primary)] text-sm font-bold">Join 50k+ creators</p>
              <p className="text-[#00B5D8] text-xs font-bold">Building the future</p>
            </div>
          </div>
        </div>


      </div>

      {/* Right Form Section */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-4 lg:p-12 relative z-10">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md bg-[var(--bg-surface-alt)] p-8 md:p-10 rounded-[2rem] border border-[var(--border-primary)] relative overflow-hidden"
          style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
        >
          {/* Top colored indicator line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#7B5CFA] to-[#4D38A0]" />
          
          {!requiresVerification ? (
            <>
              {/* Form Header */}
              <div className="flex items-center justify-between mb-8 text-xs font-bold text-[var(--text-secondary)] tracking-widest uppercase">
                <div className="flex gap-1.5 items-center">
                  <div className="w-6 h-1.5 bg-[#7B5CFA] rounded-full shadow-[0_0_8px_rgba(123,92,250,0.5)]" />
                  <div className="w-1.5 h-1.5 bg-white/10 rounded-full" />
                  <div className="w-1.5 h-1.5 bg-white/10 rounded-full" />
                </div>
                <span>Step 1 of 4</span>
              </div>

              <div className="text-center mb-8">
                <h3 className="text-3xl font-black text-[var(--text-primary)] mb-2">Welcome Back</h3>
                <p className="text-[var(--text-secondary)] font-medium text-sm">Sign in to Micollab to continue.</p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-xs font-bold">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text-primary)] ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-[var(--bg-base)] border border-[var(--border-primary)] rounded-xl py-3 pl-12 pr-4 text-[var(--text-primary)] outline-none focus:border-[#7B5CFA] transition font-medium placeholder-[#8B95A5]/50"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text-primary)] ml-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[var(--bg-base)] border border-[var(--border-primary)] rounded-xl py-3 pl-12 pr-12 text-[var(--text-primary)] outline-none focus:border-[#7B5CFA] transition font-medium tracking-widest placeholder-[#8B95A5]/50"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <div className="flex justify-end pt-1.5">
                    <button type="button" className="text-xs font-bold text-[#A37BFF] hover:text-[var(--text-primary)] transition">Forgot password?</button>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[#7B5CFA] hover:bg-[#684CE0] text-white font-black rounded-xl transition-all flex items-center justify-center gap-2 mt-4 shadow-[0_0_15px_rgba(123,92,250,0.3)] disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : 'Sign In'}
                </button>
              </form>

              <div className="flex items-center gap-4 my-8">
                <div className="h-px bg-white/5 flex-1" />
                <span className="text-xs font-bold text-[var(--text-secondary)]">Or continue with</span>
                <div className="h-px bg-white/5 flex-1" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button type="button" className="flex items-center justify-center gap-2 py-3 bg-[var(--bg-base)] hover:bg-white/5 border border-[var(--border-primary)] rounded-xl transition text-[var(--text-primary)] text-xs font-bold">
                  <GoogleIcon /> Google
                </button>
                <button type="button" className="flex items-center justify-center gap-2 py-3 bg-[var(--bg-base)] hover:bg-white/5 border border-[var(--border-primary)] rounded-xl transition text-[var(--text-primary)] text-xs font-bold">
                  <AppleIcon /> Apple
                </button>
              </div>

              <p className="mt-8 text-center text-[var(--text-secondary)] text-xs font-bold">
                New to Micollab? {' '}
                <Link to="/register" className="text-[#00B5D8] hover:text-[var(--text-primary)] transition">Create Account</Link>
              </p>
            </>
          ) : (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
               <div className="text-center mb-8 mt-4">
                 <div className="w-16 h-16 bg-[#7B5CFA]/10 text-[#7B5CFA] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#7B5CFA]/20">
                   <Mail size={32} />
                 </div>
                 <h3 className="text-2xl font-black text-[var(--text-primary)] mb-2">Verify your email</h3>
                 <p className="text-[var(--text-secondary)] text-sm font-medium">
                   Please check your email and enter the verification code.
                 </p>
               </div>

               {error && (
                 <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-xs font-bold">
                   <AlertCircle size={16} />
                   {error}
                 </div>
               )}

               <form onSubmit={handleVerifyOTP} className="space-y-6">
                 <div className="space-y-1.5">
                   <label className="text-xs font-bold text-[var(--text-primary)] ml-1 text-center block">Enter 6-digit Code</label>
                   <input 
                     type="text" 
                     required
                     maxLength={6}
                     value={otpCode}
                     onChange={(e) => setOtpCode(e.target.value)}
                     placeholder="000000"
                     className="w-full bg-[var(--bg-base)] border border-[var(--border-primary)] rounded-xl py-4 text-center text-3xl tracking-[1em] text-[var(--text-primary)] outline-none focus:border-[#7B5CFA] transition font-black placeholder-[#8B95A5]/30"
                   />
                 </div>

                 <button 
                   type="submit"
                   disabled={loading || otpCode.length !== 6}
                   className="w-full py-3.5 bg-[#7B5CFA] hover:bg-[#684CE0] disabled:bg-[var(--bg-base)] disabled:text-[var(--text-secondary)] text-white font-black rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(123,92,250,0.3)] disabled:shadow-none"
                 >
                   {loading ? <Loader2 className="animate-spin" size={20} /> : 'Verify Email'}
                 </button>
               </form>

               <p className="text-center text-xs font-bold text-[var(--text-secondary)] pt-8">
                 Didn't receive the code?{' '}
                 <button onClick={handleResendOTP} disabled={loading} className="text-[#00B5D8] hover:text-[var(--text-primary)] transition disabled:opacity-50">
                   Resend OTP
                 </button>
               </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
