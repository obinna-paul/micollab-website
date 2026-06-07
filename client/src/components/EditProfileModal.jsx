import React, { useState } from 'react';
import { X, Camera, MapPin, Globe, Check, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import useAuthStore from '../store/useAuthStore';

const EditProfileModal = ({ isOpen, onClose, profile, onUpdate }) => {
  const { token } = useAuthStore();
  const [formData, setFormData] = useState({
    displayName: profile?.displayName || '',
    bio: profile?.bio || '',
    longAbout: profile?.longAbout || '',
    location: profile?.location || '',
    availabilityStatus: profile?.availabilityStatus || 'AVAILABLE',
    profileType: profile?.profileType || '',
    skills: profile?.skills || '',
    socialLinks: typeof profile?.socialLinks === 'string'  
      ? JSON.parse(profile.socialLinks) 
      : profile?.socialLinks || { instagram: '', twitter: '', youtube: '', website: '' }
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.put('/api/users/profile', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onUpdate(res.data);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-2xl bg-[var(--bg-base)] rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-[var(--border-secondary)]"
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-[var(--border-primary)] flex items-center justify-between bg-[var(--bg-surface-alt)]">
          <div>
            <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Edit Creative Identity</h2>
            <p className="text-[10px] text-[var(--text-secondary)] font-black uppercase tracking-widest mt-1">Define how the world sees your craft</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          {/* Basics */}
          <section className="space-y-4">
            <h3 className="text-[10px] font-black text-[#7B5CFA] uppercase tracking-widest">Core Information</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase ml-2">Display Name</label>
                <input 
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                  className="w-full px-4 py-3 bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] rounded-2xl text-sm font-bold text-[var(--text-primary)] focus:border-[#7B5CFA] outline-none transition"
                  placeholder="e.g. David Okafor"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase ml-2">Short Professional Bio</label>
                <input 
                  type="text"
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  className="w-full px-4 py-3 bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] rounded-2xl text-sm font-bold text-[var(--text-primary)] focus:border-[#7B5CFA] outline-none transition"
                  placeholder="e.g. Award-winning Cinematographer based in Lagos"
                />
              </div>
            </div>
          </section>

          {/* Role & Specializations */}
          <section className="space-y-4">
            <h3 className="text-[10px] font-black text-[#7B5CFA] uppercase tracking-widest">Role & Specializations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase ml-2">Primary Role</label>
                <input 
                  type="text"
                  value={formData.profileType}
                  onChange={(e) => setFormData({...formData, profileType: e.target.value})}
                  className="w-full px-4 py-3 bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] rounded-2xl text-sm font-bold text-[var(--text-primary)] focus:border-[#7B5CFA] outline-none transition"
                  placeholder="e.g. Sound Designer"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase ml-2">Specializations</label>
                <input 
                  type="text"
                  value={formData.skills}
                  onChange={(e) => setFormData({...formData, skills: e.target.value})}
                  className="w-full px-4 py-3 bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] rounded-2xl text-sm font-bold text-[var(--text-primary)] focus:border-[#7B5CFA] outline-none transition"
                  placeholder="e.g. Mixing, Mastering, Scoring"
                />
              </div>
            </div>
          </section>

          {/* Availability & Location */}
          <section className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase ml-2">Location</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={16} />
                <input 
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="w-full pl-12 pr-4 py-3 bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] rounded-2xl text-sm font-bold text-[var(--text-primary)] outline-none focus:border-[#7B5CFA] transition"
                  placeholder="Lagos, Nigeria"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase ml-2">Availability</label>
              <select 
                value={formData.availabilityStatus}
                onChange={(e) => setFormData({...formData, availabilityStatus: e.target.value})}
                className="w-full px-4 py-3 bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] rounded-2xl text-sm font-bold text-[var(--text-primary)] outline-none focus:border-[#7B5CFA] transition appearance-none"
              >
                <option value="AVAILABLE" className="bg-[var(--bg-surface-alt)]">Available for Collab</option>
                <option value="OPEN_TO_WORK" className="bg-[var(--bg-surface-alt)]">Looking for Work</option>
                <option value="BUSY" className="bg-[var(--bg-surface-alt)]">Booked / Busy</option>
              </select>
            </div>
          </section>

          {/* Long Form About */}
          <section className="space-y-1">
            <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase ml-2">Your Creative Story</label>
            <textarea 
              value={formData.longAbout}
              onChange={(e) => setFormData({...formData, longAbout: e.target.value})}
              rows={4}
              className="w-full px-4 py-3 bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] rounded-2xl text-sm font-medium text-[var(--text-primary)] focus:border-[#7B5CFA] outline-none transition resize-none"
              placeholder="Tell your story, your style, your influences..."
            />
          </section>

          {/* Social Links */}
          <section className="space-y-4">
            <h3 className="text-[10px] font-black text-[#7B5CFA] uppercase tracking-widest">Digital Presence</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={16} />
                <input 
                  type="text"
                  value={formData.socialLinks.instagram}
                  onChange={(e) => setFormData({...formData, socialLinks: {...formData.socialLinks, instagram: e.target.value}})}
                  className="w-full pl-12 pr-4 py-3 bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] rounded-2xl text-sm font-bold text-[var(--text-primary)] outline-none focus:border-[#7B5CFA] transition"
                  placeholder="Instagram User"
                />
              </div>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={16} />
                <input 
                  type="text"
                  value={formData.socialLinks.youtube}
                  onChange={(e) => setFormData({...formData, socialLinks: {...formData.socialLinks, youtube: e.target.value}})}
                  className="w-full pl-12 pr-4 py-3 bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] rounded-2xl text-sm font-bold text-[var(--text-primary)] outline-none focus:border-[#7B5CFA] transition"
                  placeholder="YouTube Channel"
                />
              </div>
            </div>
          </section>
        </form>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-[var(--border-primary)] bg-[var(--bg-surface-alt)] flex items-center justify-end gap-4">
          <button onClick={onClose} className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition">
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="px-8 py-3 bg-[#7B5CFA] text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-[#684CE0] transition shadow-[0_0_15px_rgba(123,92,250,0.3)] disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? 'Saving...' : <><Check size={16} /> Save Changes</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default EditProfileModal;
