import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Users, CheckCircle, Send } from 'lucide-react';
import axios from 'axios';
import useAuthStore from '../store/useAuthStore';

const InviteMemberModal = ({ isOpen, onClose, circleId }) => {
  const { token } = useAuthStore();
  const [connections, setConnections] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState(null);
  const [sentIds, setSentIds] = useState([]);

  useEffect(() => {
    if (isOpen) {
      fetchConnections();
      setSentIds([]);
    }
  }, [isOpen]);

  const fetchConnections = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/network/connections', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConnections(res.data);
    } catch (error) {
      console.error('Failed to fetch connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (userId) => {
    setSendingId(userId);
    try {
      await axios.post(`/api/circles/${circleId}/invite`, { inviteeId: userId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSentIds(prev => [...prev, userId]);
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to send invite');
    } finally {
      setSendingId(null);
    }
  };

  const filteredConnections = connections.filter(c => 
    c.username.toLowerCase().includes(search.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="relative w-full max-w-md bg-[var(--bg-base)] border border-[var(--border-primary)] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          <div className="p-6 md:p-8 flex-shrink-0">
            <button onClick={onClose} className="absolute top-6 right-6 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors bg-[var(--bg-surface)] p-2 rounded-full">
              <X size={20} />
            </button>

            <div className="w-16 h-16 bg-[#7B5CFA]/10 rounded-3xl flex items-center justify-center text-[#7B5CFA] mb-6">
              <Users size={32} />
            </div>

            <h2 className="text-2xl font-black text-[var(--text-primary)] mb-2 tracking-tight">Invite to Circle</h2>
            <p className="text-[var(--text-secondary)] text-sm mb-6 leading-relaxed font-medium">
              Invite people from your network directly into this workspace.
            </p>

            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input 
                type="text"
                placeholder="Search your network..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] rounded-xl pl-10 pr-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#7B5CFA]/50 transition"
              />
            </div>
          </div>

          <div className="overflow-y-auto px-6 md:px-8 pb-8 space-y-3 flex-1 no-scrollbar">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#7B5CFA]" />
              </div>
            ) : filteredConnections.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[var(--text-secondary)] text-sm">No connections found.</p>
              </div>
            ) : (
              filteredConnections.map(user => {
                const isSent = sentIds.includes(user.id);
                return (
                  <div key={user.id} className="flex items-center justify-between p-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-primary)] hover:border-[#7B5CFA]/30 transition">
                    <div className="flex items-center gap-3">
                      <img src={user.profileImage || `https://ui-avatars.com/api/?name=${user.username}`} className="w-10 h-10 rounded-xl object-cover" />
                      <div>
                        <h4 className="font-bold text-sm text-[var(--text-primary)]">{user.username}</h4>
                        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">{user.profileType}</p>
                      </div>
                    </div>

                    {isSent ? (
                      <button disabled className="bg-[#34D399]/10 text-[#34D399] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1">
                        <CheckCircle size={14} /> Sent
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleInvite(user.id)}
                        disabled={sendingId === user.id}
                        className="bg-[#7B5CFA]/10 text-[#7B5CFA] hover:bg-[#7B5CFA] hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1"
                      >
                        {sendingId === user.id ? <span className="animate-pulse">Sending...</span> : <><Send size={14} /> Invite</>}
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default InviteMemberModal;
