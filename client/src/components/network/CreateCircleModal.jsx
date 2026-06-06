import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Users, Target, Calendar, Plus, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../../store/useAuthStore';

const CreateCircleModal = ({ isOpen, onClose, onSuccess }) => {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Music & Audio',
    visibility: 'PRIVATE',
    duration: '',
    startDate: '',
    initialInvites: []
  });
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchConnections();
    }
  }, [isOpen]);

  const fetchConnections = async () => {
    try {
      const res = await axios.get('/api/network/connections', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConnections(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async () => {
    if (!token) {
      console.error('No token found in store');
      alert('Your session has expired. Please log in again.');
      navigate('/login');
      return;
    }
    
    setLoading(true);
    try {
      console.log('Token being used:', token.substring(0, 10) + '...');
      const res = await axios.post('/api/circles', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onSuccess(res.data);
      onClose();
      navigate(`/circles/${res.data.id}`);
    } catch (err) {
      console.error('Failed to create circle:', err.response?.data || err.message);
      alert('Failed to create circle. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const toggleInvite = (userId) => {
    if (formData.initialInvites.includes(userId)) {
      setFormData({ ...formData, initialInvites: formData.initialInvites.filter(id => id !== userId) });
    } else {
      setFormData({ ...formData, initialInvites: [...formData.initialInvites, userId] });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
      />
      
      {/* Sheet / Modal */}
      <motion.div 
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 220 }}
        className="bg-[#0F131E] w-full md:max-w-2xl md:rounded-[3rem] rounded-t-3xl shadow-2xl relative z-10 max-h-[92svh] flex flex-col"
      >
        {/* Drag handle (mobile only) */}
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 py-4 md:p-8 border-b border-[#0F131E]/5 flex justify-between items-center bg-[#181D2A]/50 flex-shrink-0">
          <div>
            <h2 className="text-xl md:text-3xl font-black text-white tracking-tighter">Launch a Circle</h2>
            <p className="text-xs text-[#8B95A5] font-medium">Step {step} of 2</p>
          </div>
          <button onClick={onClose} className="p-2 md:p-3 hover:bg-[#0F131E] rounded-xl border border-[#0F131E]/5 transition-all">
            <X size={18} />
          </button>
        </div>

        {/* Body — scrollable, shrinks to make room for sticky footer */}
        <div className="px-5 py-5 md:p-10 overflow-y-auto flex-1 min-h-0">
          {step === 1 ? (
            <div className="space-y-5 md:space-y-8">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-[#8B95A5] tracking-widest ml-1">Circle Title</label>
                  <input 
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="e.g. Creative Collective 2024"
                    className="w-full bg-[#181D2A] border border-[#0F131E]/5 rounded-2xl py-3.5 px-4 text-sm font-bold focus:border-[#7B5CFA] outline-none transition-all"
                  />
               </div>

               <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-[#8B95A5] tracking-widest ml-1">Category</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full bg-[#181D2A] border border-[#0F131E]/5 rounded-2xl py-3.5 px-4 text-sm font-bold focus:border-[#7B5CFA] outline-none transition-all"
                  >
                    {["Music & Audio", "Film, TV, Video", "Photography", "Design", "Acting"].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
               </div>

               <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-[#8B95A5] tracking-widest ml-1">Project Vision</label>
                  <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Describe the goal of this circle..."
                    rows={3}
                    className="w-full bg-[#181D2A] border border-[#0F131E]/5 rounded-2xl py-3.5 px-4 text-sm font-medium focus:border-[#7B5CFA] outline-none transition-all resize-none"
                  />
               </div>

               <div className="grid grid-cols-2 gap-3 md:gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-[#8B95A5] tracking-widest ml-1">Duration</label>
                    <input 
                      type="text"
                      value={formData.duration}
                      onChange={(e) => setFormData({...formData, duration: e.target.value})}
                      placeholder="e.g. 3 Months"
                      className="w-full bg-[#181D2A] border border-[#0F131E]/5 rounded-2xl py-3.5 px-4 text-sm font-bold focus:border-[#7B5CFA] outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-[#8B95A5] tracking-widest ml-1">Start Date</label>
                    <input 
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                      className="w-full bg-[#181D2A] border border-[#0F131E]/5 rounded-2xl py-3.5 px-4 text-sm font-bold focus:border-[#7B5CFA] outline-none transition-all"
                    />
                  </div>
               </div>
            </div>
          ) : (
            <div className="space-y-4">
               <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-[#7B5CFA]/10 text-[#7B5CFA] rounded-xl">
                     <Users size={20} />
                  </div>
                  <div>
                     <h3 className="text-base font-black text-white tracking-tight">Recruit from Network</h3>
                     <p className="text-xs text-[#8B95A5] font-medium">Select teammates to invite.</p>
                  </div>
               </div>

               <div className="space-y-2.5">
                  {connections.length === 0 && (
                    <div className="text-center py-8">
                       <p className="text-[#8B95A5] text-sm font-medium">No connections yet. Connect with people first.</p>
                    </div>
                  )}
                  {connections.map(user => (
                    <div 
                      key={user.id}
                      onClick={() => toggleInvite(user.id)}
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${formData.initialInvites.includes(user.id) ? 'border-[#7B5CFA] bg-[#7B5CFA]/5' : 'border-[#0F131E]/5'}`}
                    >
                       <div className="flex items-center gap-3">
                          <img src={user.profileImage || `https://ui-avatars.com/api/?name=${user.username}`} className="w-9 h-9 rounded-xl object-cover" />
                          <div>
                             <p className="font-black text-white text-sm">{user.username}</p>
                             <p className="text-[9px] font-black text-[#7B5CFA] uppercase tracking-widest">{user.profileType}</p>
                          </div>
                       </div>
                       <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${formData.initialInvites.includes(user.id) ? 'bg-[#7B5CFA] border-[#7B5CFA] text-white' : 'border-[#0F131E]/5'}`}>
                          {formData.initialInvites.includes(user.id) && <Check size={12} />}
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}
        </div>

        {/* Footer — always pinned at bottom */}
        <div className="px-5 py-4 md:p-8 bg-[#0F131E] border-t border-[#0F131E]/5 flex justify-between items-center flex-shrink-0 safe-area-bottom shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
          <button 
            onClick={() => step === 1 ? onClose() : setStep(1)}
            className="text-[10px] font-black uppercase tracking-widest text-[#8B95A5] hover:text-white transition-all"
          >
            {step === 1 ? 'Cancel' : '← Back'}
          </button>
          
          <button 
            onClick={step === 1 ? () => setStep(2) : handleSubmit}
            disabled={loading || (step === 1 && !formData.title)}
            className="btn-primary py-3 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-[#7B5CFA]/25 disabled:opacity-50"
          >
            {loading ? 'Creating...' : step === 1 ? 'Next →' : 'Launch Circle'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default CreateCircleModal;
