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
        className="relative w-full max-w-2xl bg-background rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-divider flex items-center justify-between bg-surface">
          <div>
            <h2 className="text-xl font-black text-textMain tracking-tight">Edit Creative Identity</h2>
            <p className="text-[10px] text-textMuted font-black uppercase tracking-widest mt-1">Define how the world sees your craft</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          {/* Basics */}
          <section className="space-y-4">
            <h3 className="text-[10px] font-black text-primary uppercase tracking-widest">Core Information</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-textMuted uppercase ml-2">Display Name</label>
                <input 
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                  className="w-full px-4 py-3 bg-surface border border-divider rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition"
                  placeholder="e.g. David Okafor"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-textMuted uppercase ml-2">Short Professional Bio</label>
                <input 
                  type="text"
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  className="w-full px-4 py-3 bg-surface border border-divider rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition"
                  placeholder="e.g. Award-winning Cinematographer based in Lagos"
                />
              </div>
            </div>
          </section>


          {/* Availability & Location */}
          <section className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-textMuted uppercase ml-2">Location</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-textMuted" size={16} />
                <input 
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="w-full pl-12 pr-4 py-3 bg-surface border border-divider rounded-2xl text-sm font-bold outline-none"
                  placeholder="Lagos, Nigeria"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-textMuted uppercase ml-2">Availability</label>
              <select 
                value={formData.availabilityStatus}
                onChange={(e) => setFormData({...formData, availabilityStatus: e.target.value})}
                className="w-full px-4 py-3 bg-surface border border-divider rounded-2xl text-sm font-bold outline-none appearance-none"
              >
                <option value="AVAILABLE">Available for Collab</option>
                <option value="OPEN_TO_WORK">Looking for Work</option>
                <option value="BUSY">Booked / Busy</option>
              </select>
            </div>
          </section>

          {/* Long Form About */}
          <section className="space-y-1">
            <label className="text-[10px] font-black text-textMuted uppercase ml-2">Your Creative Story</label>
            <textarea 
              value={formData.longAbout}
              onChange={(e) => setFormData({...formData, longAbout: e.target.value})}
              rows={4}
              className="w-full px-4 py-3 bg-surface border border-divider rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition resize-none"
              placeholder="Tell your story, your style, your influences..."
            />
          </section>

          {/* Social Links */}
          <section className="space-y-4">
            <h3 className="text-[10px] font-black text-primary uppercase tracking-widest">Digital Presence</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-textMuted" size={16} />
                <input 
                  type="text"
                  value={formData.socialLinks.instagram}
                  onChange={(e) => setFormData({...formData, socialLinks: {...formData.socialLinks, instagram: e.target.value}})}
                  className="w-full pl-12 pr-4 py-3 bg-surface border border-divider rounded-2xl text-sm font-bold outline-none"
                  placeholder="Instagram User"
                />
              </div>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-textMuted" size={16} />
                <input 
                  type="text"
                  value={formData.socialLinks.youtube}
                  onChange={(e) => setFormData({...formData, socialLinks: {...formData.socialLinks, youtube: e.target.value}})}
                  className="w-full pl-12 pr-4 py-3 bg-surface border border-divider rounded-2xl text-sm font-bold outline-none"
                  placeholder="YouTube Channel"
                />
              </div>
            </div>
          </section>
        </form>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-divider bg-surface flex items-center justify-end gap-4">
          <button onClick={onClose} className="text-xs font-black uppercase tracking-widest text-textMuted hover:text-textMain transition">
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="px-8 py-3 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:scale-105 transition shadow-lg disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? 'Saving...' : <><Check size={16} /> Save Changes</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default EditProfileModal;
