import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, Trash2, Mail, ShieldAlert, Loader2, CheckCircle } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const { user, updateEmail, changePassword, deleteAccount, logout } = useAuthStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('ACCOUNT'); // ACCOUNT, SECURITY
  
  // Account Tab State
  const [email, setEmail] = useState(user?.email || '');
  const [accountStatus, setAccountStatus] = useState(null);
  const [loadingAccount, setLoadingAccount] = useState(false);

  // Security Tab State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [securityStatus, setSecurityStatus] = useState(null);
  const [loadingSecurity, setLoadingSecurity] = useState(false);

  // Delete State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [loadingDelete, setLoadingDelete] = useState(false);

  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    if (email === user?.email) return;
    setLoadingAccount(true);
    setAccountStatus(null);
    const res = await updateEmail(email);
    if (res.success) {
      setAccountStatus({ type: 'success', msg: 'Email updated successfully.' });
    } else {
      setAccountStatus({ type: 'error', msg: res.error });
    }
    setLoadingAccount(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;
    setLoadingSecurity(true);
    setSecurityStatus(null);
    const res = await changePassword(currentPassword, newPassword);
    if (res.success) {
      setSecurityStatus({ type: 'success', msg: 'Password changed successfully.' });
      setCurrentPassword('');
      setNewPassword('');
    } else {
      setSecurityStatus({ type: 'error', msg: res.error });
    }
    setLoadingSecurity(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setLoadingDelete(true);
    const res = await deleteAccount();
    if (res.success) {
      navigate('/login');
    } else {
      alert('Failed to delete account. Please try again later.');
      setLoadingDelete(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 font-sans animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-textMain tracking-tight">Settings</h1>
        <p className="text-textMuted font-medium mt-1">Manage your account preferences and security.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Nav */}
        <div className="w-full md:w-64 flex flex-col gap-2 shrink-0">
          <button 
            onClick={() => setActiveTab('ACCOUNT')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'ACCOUNT' 
                ? 'bg-primary text-[var(--text-primary)] shadow-md' 
                : 'text-textMuted hover:bg-surface hover:text-textMain'
            }`}
          >
            <User size={18} /> Account
          </button>
          <button 
            onClick={() => setActiveTab('SECURITY')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'SECURITY' 
                ? 'bg-primary text-[var(--text-primary)] shadow-md' 
                : 'text-textMuted hover:bg-surface hover:text-textMain'
            }`}
          >
            <Lock size={18} /> Security
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-surface border border-divider rounded-3xl p-6 md:p-8 shadow-sm">
          {activeTab === 'ACCOUNT' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-xl font-bold text-textMain mb-6 flex items-center gap-2">
                <User size={24} className="text-primary" /> Profile Details
              </h2>

              {accountStatus && (
                <div className={`p-4 rounded-xl mb-6 text-sm font-semibold flex items-start gap-3 ${
                  accountStatus.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                }`}>
                  {accountStatus.type === 'success' && <CheckCircle size={20} className="shrink-0" />}
                  <p>{accountStatus.msg}</p>
                </div>
              )}

              <form onSubmit={handleUpdateEmail} className="space-y-6 max-w-md">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-textMuted ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-textMuted" size={20} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-background border border-divider rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-primary transition-all font-medium"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loadingAccount || email === user?.email}
                  className="bg-primary text-[var(--text-primary)] px-6 py-2.5 rounded-xl font-bold hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100 flex items-center gap-2 shadow-md"
                >
                  {loadingAccount ? <Loader2 className="animate-spin" size={18} /> : 'Save Changes'}
                </button>
              </form>
            </motion.div>
          )}

          {activeTab === 'SECURITY' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-xl font-bold text-textMain mb-6 flex items-center gap-2">
                <Lock size={24} className="text-primary" /> Change Password
              </h2>

              {user?.googleId && !user?.password ? (
                <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 p-4 rounded-xl text-sm font-medium">
                  You signed in using Google. You cannot change your password here.
                </div>
              ) : (
                <>
                  {securityStatus && (
                    <div className={`p-4 rounded-xl mb-6 text-sm font-semibold flex items-start gap-3 ${
                      securityStatus.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {securityStatus.type === 'success' && <CheckCircle size={20} className="shrink-0" />}
                      <p>{securityStatus.msg}</p>
                    </div>
                  )}
                  <form onSubmit={handleChangePassword} className="space-y-5 max-w-md border-b border-divider pb-8 mb-8">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-textMuted ml-1">Current Password</label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full bg-background border border-divider rounded-xl py-3 px-4 focus:outline-none focus:border-primary transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-textMuted ml-1">New Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-background border border-divider rounded-xl py-3 px-4 focus:outline-none focus:border-primary transition-all font-medium"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loadingSecurity || !currentPassword || !newPassword}
                      className="bg-primary text-[var(--text-primary)] px-6 py-2.5 rounded-xl font-bold hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100 flex items-center gap-2 shadow-md"
                    >
                      {loadingSecurity ? <Loader2 className="animate-spin" size={18} /> : 'Update Password'}
                    </button>
                  </form>
                </>
              )}

              {/* Danger Zone */}
              <div className="mt-8">
                <h3 className="text-lg font-black text-red-500 flex items-center gap-2 mb-4">
                  <ShieldAlert size={20} /> Danger Zone
                </h3>
                <p className="text-sm text-textMuted font-medium mb-4">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                
                {!showDeleteConfirm ? (
                  <button 
                    onClick={() => setShowDeleteConfirm(true)}
                    className="border border-red-500 text-red-500 font-bold px-4 py-2 rounded-xl hover:bg-red-500/10 transition-colors"
                  >
                    Delete Account
                  </button>
                ) : (
                  <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl max-w-md">
                    <p className="text-sm font-bold text-red-500 mb-3">Type "DELETE" to confirm.</p>
                    <input 
                      type="text" 
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="DELETE"
                      className="w-full bg-background border border-red-500/30 rounded-lg py-2 px-3 mb-3 focus:outline-none focus:border-red-500"
                    />
                    <div className="flex gap-2">
                      <button 
                        onClick={handleDeleteAccount}
                        disabled={deleteConfirmText !== 'DELETE' || loadingDelete}
                        className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold disabled:opacity-50 flex items-center justify-center min-w-[100px]"
                      >
                        {loadingDelete ? <Loader2 className="animate-spin" size={16} /> : 'Confirm'}
                      </button>
                      <button 
                        onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
                        className="bg-background border border-divider text-textMain px-4 py-2 rounded-lg font-bold hover:bg-surface"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
