import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Target, Globe, Circle, Shield, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import CreateCircleModal from '../components/network/CreateCircleModal';
import useAuthStore from '../store/useAuthStore';

const Circles = () => {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [circles, setCircles] = useState([]);
  const [isCircleModalOpen, setIsCircleModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchCircles = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/circles', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCircles(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCircles();
  }, [token]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="space-y-3 max-w-xl">
          <div className="flex items-center gap-2.5 text-[#7B5CFA] font-black uppercase text-[10px] tracking-[0.2em]">
            <Shield size={13} /> Collaboration Hub
          </div>
          <h1 className="text-5xl font-black text-[var(--text-primary)] tracking-tighter leading-none">
            Your <span className="text-[#7B5CFA] italic">Circles</span>
          </h1>
          <p className="text-[var(--text-secondary)] font-medium leading-relaxed text-sm">
            Project groups built from your network. Recruit trusted connections, share updates in your private chat, and ship together.
          </p>
        </div>

        <button 
          onClick={() => setIsCircleModalOpen(true)}
          className="btn-primary py-2.5 px-4 md:py-4 md:px-8 rounded-xl md:rounded-2xl flex items-center gap-2 font-black uppercase tracking-widest text-[10px] shadow-[0_0_15px_rgba(123,92,250,0.3)] flex-shrink-0"
        >
           <Plus size={14} /> Start a Circle
        </button>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
           {[1,2,3,4].map(i => <div key={i} className="h-64 bg-[var(--bg-surface-alt)] rounded-3xl" />)}
        </div>
      ) : circles.length === 0 ? (
        <div className="py-24 text-center bg-[var(--bg-base)] border border-[var(--border-primary)] rounded-[2.5rem] shadow-sm max-w-2xl mx-auto">
           <Circle size={48} className="text-[var(--text-secondary)]/20 mx-auto mb-4" />
           <p className="text-[var(--text-secondary)] font-black uppercase text-[10px] tracking-widest mb-1">
             No active circles found
           </p>
           <p className="text-xs text-[var(--text-secondary)] max-w-xs mx-auto mb-6">
             Start a brand new circle workspace, invite creatives, and start collaborating on deliverables!
           </p>
           <button 
             onClick={() => setIsCircleModalOpen(true)}
             className="btn-primary py-3 px-6 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(123,92,250,0.3)]"
           >
              Create Your First Circle
           </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {circles.map(circle => (
             <motion.div 
               whileHover={{ scale: 1.01, y: -2 }}
               key={circle.id} 
               className="bg-[var(--bg-base)] border border-[var(--border-primary)] rounded-[2.5rem] p-8 relative overflow-hidden group cursor-pointer shadow-md hover:shadow-xl transition-all"
               onClick={() => navigate(`/circles/${circle.id}`)}
             >
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#7B5CFA]/5 rounded-full -mr-16 -mt-16 group-hover:bg-[#7B5CFA]/10 transition-colors" />
                
                <div className="flex justify-between items-start mb-6">
                   <div>
                      <h3 className="text-2xl font-black text-[var(--text-primary)] tracking-tighter mb-2 truncate max-w-[240px]" title={circle.title}>
                        {circle.title}
                      </h3>
                      <div className="flex items-center gap-2 text-[#7B5CFA] font-black uppercase text-[9px] tracking-widest">
                         <Target size={12} /> {circle.status}
                      </div>
                   </div>
                   <div className="flex -space-x-3 flex-shrink-0">
                      {circle.members?.slice(0, 3).map((m, i) => (
                        <img 
                          key={i} 
                          src={m.user?.profileImage || `https://ui-avatars.com/api/?name=${m.user?.username}`} 
                          className="w-10 h-10 rounded-full border-4 border-[#0F131E] shadow-sm object-cover" 
                          alt=""
                        />
                      ))}
                      {circle._count?.members > 3 && (
                        <div className="w-10 h-10 rounded-full bg-[var(--bg-surface-alt)] border-4 border-[#0F131E] flex items-center justify-center text-[10px] font-black text-[var(--text-secondary)]">
                           +{circle._count.members - 3}
                        </div>
                      )}
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                   <div className="bg-[var(--bg-surface-alt)] p-4 rounded-2xl">
                      <p className="text-[8px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1">Proposed Duration</p>
                      <p className="text-sm font-black text-[var(--text-primary)]">{circle.duration || 'Flexible'}</p>
                   </div>
                   <div className="bg-[var(--bg-surface-alt)] p-4 rounded-2xl">
                      <p className="text-[8px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1">Start Date</p>
                      <p className="text-sm font-black text-[var(--text-primary)]">
                        {circle.startDate ? new Date(circle.startDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}
                      </p>
                   </div>
                </div>

                <button className="w-full bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-[#7B5CFA] hover:text-[#7B5CFA] transition-all shadow-sm text-[var(--text-primary)]">
                   Enter Workspace
                </button>
             </motion.div>
           ))}
        </div>
      )}

      <CreateCircleModal 
        isOpen={isCircleModalOpen} 
        onClose={() => setIsCircleModalOpen(false)}
        onSuccess={(newCircle) => {
          setCircles([newCircle, ...circles]);
        }}
      />
    </div>
  );
};

export default Circles;
