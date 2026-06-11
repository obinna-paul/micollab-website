import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, Trash2, Mail, ShieldAlert, Loader2, CheckCircle, Sliders, Bell, Eye, MapPin, Globe, Check, UserCircle } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { ROLES_CONFIG, getSpecializationsForRole } from '../utils/rolesAndSpecializations';

const Settings = () => {
  const { user, updateProfile, updateEmail, changePassword, updatePreferences, deleteAccount, logout } = useAuthStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('PROFILE'); // PROFILE, ACCOUNT, SECURITY, PREFERENCES
  
  // Profile Tab State
  const [profileFormData, setProfileFormData] = useState({
    displayName: user?.displayName || '',
    bio: user?.bio || '',
    longAbout: user?.longAbout || '',
    location: user?.location || '',
    availabilityStatus: user?.availabilityStatus || 'AVAILABLE',
    profileType: user?.profileType || '',
    skills: user?.skills || '',
    socialLinks: typeof user?.socialLinks === 'string'  
      ? JSON.parse(user.socialLinks) 
      : user?.socialLinks || { instagram: '', twitter: '', youtube: '', website: '' }
  });
  const [profileStatus, setProfileStatus] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Account Tab State
  const [email, setEmail] = useState(user?.email || '');
  const [accountStatus, setAccountStatus] = useState(null);
  const [loadingAccount, setLoadingAccount] = useState(false);

  // Security Tab State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [securityStatus, setSecurityStatus] = useState(null);
  const [loadingSecurity, setLoadingSecurity] = useState(false);

  // Preferences Tab State
  const [emailNotifications, setEmailNotifications] = useState(user?.emailNotifications ?? true);
  const [pushNotifications, setPushNotifications] = useState(user?.pushNotifications ?? true);
  const [profileVisibility, setProfileVisibility] = useState(user?.profileVisibility || 'PUBLIC');
  const [prefStatus, setPrefStatus] = useState(null);
  const [loadingPref, setLoadingPref] = useState(false);

  // Delete State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [loadingDelete, setLoadingDelete] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoadingProfile(true);
    setProfileStatus(null);
    const res = await updateProfile({
      ...profileFormData,
      socialLinks: JSON.stringify(profileFormData.socialLinks)
    });
    if (res.success) {
      setProfileStatus({ type: 'success', msg: 'Profile updated successfully.' });
    } else {
      setProfileStatus({ type: 'error', msg: res.error || 'Failed to update profile' });
    }
    setLoadingProfile(false);
  };

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

  const handleUpdatePreferences = async (e) => {
    e.preventDefault();
    setLoadingPref(true);
    setPrefStatus(null);
    const res = await updatePreferences({ emailNotifications, pushNotifications, profileVisibility });
    if (res.success) {
      setPrefStatus({ type: 'success', msg: 'Preferences updated successfully.' });
    } else {
      setPrefStatus({ type: 'error', msg: res.error });
    }
    setLoadingPref(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setLoadingDelete(true);
    const res = await deleteAccount();
    if (res.success) {
      navigate('/login');
    } else {
      alert(res.error || 'Failed to delete account. Please try again later.');
      setLoadingDelete(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 font-sans animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-textMain tracking-tight">Settings</h1>
        <p className="text-textMuted font-medium mt-1">Manage your identity, account preferences, and security.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Nav */}
        <div className="w-full md:w-64 flex flex-col gap-2 shrink-0">
          <button 
            onClick={() => setActiveTab('PROFILE')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'PROFILE' 
                ? 'bg-primary text-[var(--text-primary)] shadow-md' 
                : 'text-textMuted hover:bg-surface hover:text-textMain'
            }`}
          >
            <UserCircle size={18} /> Public Profile
          </button>
          <button 
            onClick={() => setActiveTab('ACCOUNT')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'ACCOUNT' 
                ? 'bg-primary text-[var(--text-primary)] shadow-md' 
                : 'text-textMuted hover:bg-surface hover:text-textMain'
            }`}
          >
            <User size={18} /> Account Details
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
          <button 
            onClick={() => setActiveTab('PREFERENCES')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'PREFERENCES' 
                ? 'bg-primary text-[var(--text-primary)] shadow-md' 
                : 'text-textMuted hover:bg-surface hover:text-textMain'
            }`}
          >
            <Sliders size={18} /> Preferences
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-surface border border-divider rounded-3xl p-6 md:p-8 shadow-sm">
          {activeTab === 'PROFILE' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-xl font-bold text-textMain mb-6 flex items-center gap-2">
                <UserCircle size={24} className="text-primary" /> Public Profile
              </h2>

              {profileStatus && (
                <div className={`p-4 rounded-xl mb-6 text-sm font-semibold flex items-start gap-3 ${
                  profileStatus.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                }`}>
                  {profileStatus.type === 'success' && <CheckCircle size={20} className="shrink-0" />}
                  <p>{profileStatus.msg}</p>
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-8">
                {/* Basics */}
                <section className="space-y-4 border-b border-divider pb-8">
                  <h3 className="text-xs font-black text-primary uppercase tracking-widest">Core Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-textMuted uppercase ml-1">Display Name</label>
                      <input 
                        type="text"
                        value={profileFormData.displayName}
                        onChange={(e) => setProfileFormData({...profileFormData, displayName: e.target.value})}
                        className="w-full px-4 py-3 bg-background border border-divider rounded-xl text-sm font-bold text-textMain focus:border-primary outline-none transition"
                        placeholder="e.g. David Okafor"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-textMuted uppercase ml-1">Short Bio</label>
                      <input 
                        type="text"
                        value={profileFormData.bio}
                        onChange={(e) => setProfileFormData({...profileFormData, bio: e.target.value})}
                        className="w-full px-4 py-3 bg-background border border-divider rounded-xl text-sm font-bold text-textMain focus:border-primary outline-none transition"
                        placeholder="e.g. Award-winning Videographer"
                      />
                    </div>
                  </div>
                </section>

                {/* Role & Specializations */}
                <section className="space-y-4 border-b border-divider pb-8">
                  <h3 className="text-xs font-black text-primary uppercase tracking-widest">Identity & Anchors</h3>
                  <p className="text-xs text-textMuted font-medium mb-4">Your role and specializations determine the collaborations you see and the creatives recommended to you.</p>
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-textMuted uppercase ml-1">Primary Role</label>
                      <select 
                        value={profileFormData.profileType}
                        onChange={(e) => setProfileFormData({...profileFormData, profileType: e.target.value, skills: ''})}
                        className="w-full px-4 py-3 bg-background border border-divider rounded-xl text-sm font-bold text-textMain focus:border-primary outline-none transition appearance-none"
                      >
                        <option value="" disabled>Select a Primary Role</option>
                        {ROLES_CONFIG.map(role => (
                          <option key={role.id} value={role.id}>{role.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-textMuted uppercase ml-1">Specializations (Max 5)</label>
                      <div className="bg-background border border-divider rounded-xl p-4 min-h-[80px] max-h-48 overflow-y-auto custom-scrollbar flex flex-wrap gap-2">
                        {profileFormData.profileType && getSpecializationsForRole(profileFormData.profileType).length > 0 ? (
                          getSpecializationsForRole(profileFormData.profileType).map(spec => {
                            const currentSkills = profileFormData.skills ? profileFormData.skills.split(',').map(s => s.trim()) : [];
                            const isSelected = currentSkills.includes(spec);
                            return (
                              <button
                                key={spec}
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    setProfileFormData({...profileFormData, skills: currentSkills.filter(s => s !== spec).join(', ')});
                                  } else {
                                    if (currentSkills.length >= 5) {
                                      alert("You can select up to 5 specializations.");
                                      return;
                                    }
                                    setProfileFormData({...profileFormData, skills: [...currentSkills, spec].filter(Boolean).join(', ')});
                                  }
                                }}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                                  isSelected 
                                    ? 'bg-primary text-white shadow-md border border-primary' 
                                    : 'bg-surface text-textMuted border border-divider hover:border-textMuted hover:text-textMain'
                                }`}
                              >
                                {spec}
                              </button>
                            );
                          })
                        ) : (
                          <p className="text-xs text-textMuted p-2">Select a primary role first to see specializations.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Availability & Location */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-divider pb-8">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-textMuted uppercase ml-1">Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-textMuted" size={16} />
                      <input 
                        type="text"
                        value={profileFormData.location}
                        onChange={(e) => setProfileFormData({...profileFormData, location: e.target.value})}
                        className="w-full pl-12 pr-4 py-3 bg-background border border-divider rounded-xl text-sm font-bold text-textMain outline-none focus:border-primary transition"
                        placeholder="e.g. Lagos, Nigeria"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-textMuted uppercase ml-1">Availability</label>
                    <select 
                      value={profileFormData.availabilityStatus}
                      onChange={(e) => setProfileFormData({...profileFormData, availabilityStatus: e.target.value})}
                      className="w-full px-4 py-3 bg-background border border-divider rounded-xl text-sm font-bold text-textMain outline-none focus:border-primary transition appearance-none"
                    >
                      <option value="AVAILABLE">Available for Collab</option>
                      <option value="OPEN_TO_WORK">Looking for Work</option>
                      <option value="BUSY">Booked / Busy</option>
                    </select>
                  </div>
                </section>

                {/* Long Form About */}
                <section className="space-y-1 border-b border-divider pb-8">
                  <label className="text-xs font-bold text-textMuted uppercase ml-1">Your Creative Story</label>
                  <textarea 
                    value={profileFormData.longAbout}
                    onChange={(e) => setProfileFormData({...profileFormData, longAbout: e.target.value})}
                    rows={4}
                    className="w-full px-4 py-3 bg-background border border-divider rounded-xl text-sm font-medium text-textMain focus:border-primary outline-none transition resize-y"
                    placeholder="Tell your story, your style, your influences..."
                  />
                </section>

                {/* Social Links */}
                <section className="space-y-4 border-b border-divider pb-8">
                  <h3 className="text-xs font-black text-primary uppercase tracking-widest">Digital Presence</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-textMuted" size={16} />
                      <input 
                        type="text"
                        value={profileFormData.socialLinks.instagram}
                        onChange={(e) => setProfileFormData({...profileFormData, socialLinks: {...profileFormData.socialLinks, instagram: e.target.value}})}
                        className="w-full pl-12 pr-4 py-3 bg-background border border-divider rounded-xl text-sm font-bold text-textMain outline-none focus:border-primary transition"
                        placeholder="Instagram User/URL"
                      />
                    </div>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-textMuted" size={16} />
                      <input 
                        type="text"
                        value={profileFormData.socialLinks.youtube}
                        onChange={(e) => setProfileFormData({...profileFormData, socialLinks: {...profileFormData.socialLinks, youtube: e.target.value}})}
                        className="w-full pl-12 pr-4 py-3 bg-background border border-divider rounded-xl text-sm font-bold text-textMain outline-none focus:border-primary transition"
                        placeholder="YouTube Channel/URL"
                      />
                    </div>
                  </div>
                </section>

                <button
                  type="submit"
                  disabled={loadingProfile}
                  className="bg-primary text-[var(--text-primary)] px-6 py-3 rounded-xl font-bold hover:scale-[1.02] transition-all disabled:opacity-50 disabled:scale-100 flex items-center gap-2 shadow-md"
                >
                  {loadingProfile ? <Loader2 className="animate-spin" size={18} /> : <><Check size={18} /> Save Profile</>}
                </button>
              </form>
            </motion.div>
          )}

          {activeTab === 'ACCOUNT' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-xl font-bold text-textMain mb-6 flex items-center gap-2">
                <User size={24} className="text-primary" /> Account Details
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
                  className="bg-primary text-[var(--text-primary)] px-6 py-2.5 rounded-xl font-bold hover:scale-[1.02] transition-all disabled:opacity-50 disabled:scale-100 flex items-center gap-2 shadow-md"
                >
                  {loadingAccount ? <Loader2 className="animate-spin" size={18} /> : 'Update Email'}
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
                      className="bg-primary text-[var(--text-primary)] px-6 py-2.5 rounded-xl font-bold hover:scale-[1.02] transition-all disabled:opacity-50 disabled:scale-100 flex items-center gap-2 shadow-md"
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

          {activeTab === 'PREFERENCES' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-xl font-bold text-textMain mb-6 flex items-center gap-2">
                <Sliders size={24} className="text-primary" /> Notification & Privacy
              </h2>

              {prefStatus && (
                 <div className={`p-4 rounded-xl mb-6 text-sm font-semibold flex items-start gap-3 ${
                  prefStatus.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                }`}>
                  {prefStatus.type === 'success' && <CheckCircle size={20} className="shrink-0" />}
                  <p>{prefStatus.msg}</p>
                </div>
              )}

              <form onSubmit={handleUpdatePreferences} className="space-y-6 max-w-xl">
                
                {/* Notifications Section */}
                <div className="bg-background border border-divider rounded-2xl p-5 space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-textMuted flex items-center gap-2">
                    <Bell size={16} /> Notifications
                  </h3>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-textMain">Email Notifications</p>
                      <p className="text-xs text-textMuted font-medium">Receive updates and alerts via email.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={emailNotifications}
                        onChange={(e) => setEmailNotifications(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-divider peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-divider">
                    <div>
                      <p className="font-bold text-textMain">Push Notifications</p>
                      <p className="text-xs text-textMuted font-medium">Receive in-app push alerts.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={pushNotifications}
                        onChange={(e) => setPushNotifications(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-divider peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>

                {/* Privacy Section */}
                <div className="bg-background border border-divider rounded-2xl p-5 space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-textMuted flex items-center gap-2">
                    <Eye size={16} /> Privacy
                  </h3>
                  
                  <div className="space-y-3">
                    <p className="font-bold text-textMain">Profile Visibility</p>
                    <p className="text-xs text-textMuted font-medium mb-3">Control who can see your profile and portfolio.</p>
                    
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-3 p-3 border border-divider rounded-xl cursor-pointer hover:bg-surface transition-colors">
                        <input 
                          type="radio" 
                          name="visibility" 
                          value="PUBLIC"
                          checked={profileVisibility === 'PUBLIC'}
                          onChange={(e) => setProfileVisibility(e.target.value)}
                          className="w-4 h-4 text-primary focus:ring-primary border-gray-300"
                        />
                        <div>
                          <p className="font-bold text-textMain text-sm">Public (Recommended)</p>
                          <p className="text-xs text-textMuted">Anyone can view your profile and find you in search.</p>
                        </div>
                      </label>
                      <label className="flex items-center gap-3 p-3 border border-divider rounded-xl cursor-pointer hover:bg-surface transition-colors">
                        <input 
                          type="radio" 
                          name="visibility" 
                          value="NETWORK_ONLY"
                          checked={profileVisibility === 'NETWORK_ONLY'}
                          onChange={(e) => setProfileVisibility(e.target.value)}
                          className="w-4 h-4 text-primary focus:ring-primary border-gray-300"
                        />
                        <div>
                          <p className="font-bold text-textMain text-sm">Network Only</p>
                          <p className="text-xs text-textMuted">Only people in your network can view your full profile.</p>
                        </div>
                      </label>
                      <label className="flex items-center gap-3 p-3 border border-divider rounded-xl cursor-pointer hover:bg-surface transition-colors">
                        <input 
                          type="radio" 
                          name="visibility" 
                          value="PRIVATE"
                          checked={profileVisibility === 'PRIVATE'}
                          onChange={(e) => setProfileVisibility(e.target.value)}
                          className="w-4 h-4 text-primary focus:ring-primary border-gray-300"
                        />
                        <div>
                          <p className="font-bold text-textMain text-sm">Private</p>
                          <p className="text-xs text-textMuted">Your profile is hidden. You can still apply to Collabs.</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loadingPref}
                  className="bg-primary text-[var(--text-primary)] px-6 py-3 rounded-xl font-bold hover:scale-[1.02] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 w-full sm:w-auto shadow-md"
                >
                  {loadingPref ? <Loader2 className="animate-spin" size={18} /> : 'Save Preferences'}
                </button>
              </form>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
