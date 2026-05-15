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
    name: '',
    description: '',
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
      const res = await axios.get('http://localhost:5000/api/network/connections', {
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
      const res = await axios.post('http://localhost:5000/api/circles', formData, {
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-textMain/40 backdrop-blur-md" 
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden"
      >
        {/* Header */}
        <div className="p-8 border-b border-divider flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-3xl font-black text-textMain tracking-tighter">Form a Circle</h2>
            <p className="text-sm text-textMuted font-medium">Step {step} of 2</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white rounded-2xl border border-divider transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="p-10">
          {step === 1 ? (
            <div className="space-y-8">
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-textMuted tracking-widest ml-1">Project Name</label>
                  <input 
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Creative Collective 2024"
                    className="w-full bg-gray-50 border border-divider rounded-2xl py-4 px-6 text-sm font-bold focus:border-primary outline-none transition-all"
                  />
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-textMuted tracking-widest ml-1">Project Vision</label>
                  <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Describe the goal of this circle..."
                    rows={4}
                    className="w-full bg-gray-50 border border-divider rounded-2xl py-4 px-6 text-sm font-medium focus:border-primary outline-none transition-all resize-none"
                  />
               </div>

               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-textMuted tracking-widest ml-1">Proposed Duration</label>
                    <input 
                      type="text"
                      value={formData.duration}
                      onChange={(e) => setFormData({...formData, duration: e.target.value})}
                      placeholder="e.g. 3 Months"
                      className="w-full bg-gray-50 border border-divider rounded-2xl py-4 px-6 text-sm font-bold focus:border-primary outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-textMuted tracking-widest ml-1">Start Date</label>
                    <input 
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                      className="w-full bg-gray-50 border border-divider rounded-2xl py-4 px-6 text-sm font-bold focus:border-primary outline-none transition-all"
                    />
                  </div>
               </div>
            </div>
          ) : (
            <div className="space-y-6">
               <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-primary/10 text-primary rounded-xl">
                     <Users size={24} />
                  </div>
                  <div>
                     <h3 className="text-xl font-black text-textMain tracking-tight">Recruit from Network</h3>
                     <p className="text-xs text-textMuted font-medium">Select teammates to invite to your circle.</p>
                  </div>
               </div>

               <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                  {connections.length === 0 && (
                    <div className="text-center py-10">
                       <p className="text-textMuted text-sm font-medium">No connections found. Connect with people to invite them.</p>
                    </div>
                  )}
                  {connections.map(user => (
                    <div 
                      key={user.id}
                      onClick={() => toggleInvite(user.id)}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${formData.initialInvites.includes(user.id) ? 'border-primary bg-primary/5' : 'border-divider hover:border-primary/30'}`}
                    >
                       <div className="flex items-center gap-4">
                          <img src={user.profileImage || `https://ui-avatars.com/api/?name=${user.username}`} className="w-10 h-10 rounded-xl" />
                          <div>
                             <p className="font-black text-textMain text-sm">{user.username}</p>
                             <p className="text-[9px] font-black text-primary uppercase tracking-widest">{user.profileType}</p>
                          </div>
                       </div>
                       <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${formData.initialInvites.includes(user.id) ? 'bg-primary border-primary text-white' : 'border-divider'}`}>
                          {formData.initialInvites.includes(user.id) && <Check size={14} />}
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 bg-gray-50/50 border-t border-divider flex justify-between items-center">
          <button 
            onClick={() => step === 1 ? onClose() : setStep(1)}
            className="text-[10px] font-black uppercase tracking-widest text-textMuted hover:text-textMain transition-all"
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          
          <button 
            onClick={step === 1 ? () => setStep(2) : handleSubmit}
            disabled={loading || (step === 1 && !formData.name)}
            className="btn-primary py-4 px-10 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/25 disabled:opacity-50"
          >
            {loading ? 'Creating...' : step === 1 ? 'Next Step' : 'Launch Circle'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default CreateCircleModal;
