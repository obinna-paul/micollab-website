import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  X, MapPin, Users, Clock, Briefcase, 
  ChevronRight, Calendar, DollarSign, ShieldCheck, 
  FileText, Link as LinkIcon, Paperclip
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CollabDetailsDrawer = ({ collabId, isOpen, onClose, onApply }) => {
  const [collab, setCollab] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (collabId && isOpen) {
      fetchDetails();
    }
  }, [collabId, isOpen]);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/collabs/${collabId}`);
      setCollab(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex justify-end">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Drawer Content */}
        <motion.div 
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative w-full max-w-2xl bg-[var(--bg-base)] border-l border-[var(--border-primary)] h-full shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[var(--border-primary)] bg-[var(--bg-surface-alt)]/80">
             <button onClick={onClose} className="p-2 hover:bg-white/[0.05] rounded-full transition-colors">
                <X size={24} className="text-[var(--text-secondary)]" />
             </button>
             <div className="flex gap-3">
                <button 
                  onClick={() => onApply(collab)}
                  className="bg-[#7B5CFA] hover:bg-[#6B4CE0] text-white py-2 px-8 rounded-xl text-xs font-black uppercase shadow-lg shadow-[#7B5CFA]/20 transition-colors"
                >
                  Submit Proposal
                </button>
             </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-8">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center gap-4">
                 <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-[#7B5CFA]"></div>
                 <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Loading opportunity...</p>
              </div>
            ) : collab && (
              <div className="space-y-10">
                {/* Title & Metadata */}
                <section>
                   <div className="flex items-center gap-2 mb-4">
                      <span className="bg-[#7B5CFA]/10 border border-[#7B5CFA]/20 text-[#7B5CFA] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">{collab.category}</span>
                      {collab.isVerified && (
                         <span className="bg-[#34D399]/10 border border-[#34D399]/20 text-[#34D399] text-[10px] font-black px-3 py-1 rounded-full uppercase flex items-center gap-1 tracking-widest">
                            <ShieldCheck size={12} /> Verified Client
                         </span>
                      )}
                   </div>
                   <h2 className="text-3xl font-black text-[var(--text-primary)] tracking-tighter leading-tight mb-6">{collab.title}</h2>
                   
                   <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 py-6 border-y border-[var(--border-primary)]">
                      <div>
                         <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest mb-1.5">Budget</p>
                         <p className="font-black text-[var(--text-primary)] text-sm">{collab.budget}</p>
                      </div>
                      <div>
                         <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest mb-1.5">Duration</p>
                         <p className="font-black text-[var(--text-primary)] text-sm">{collab.duration || (collab.projectType ? collab.projectType.replace('_', ' ') : 'N/A')}</p>
                      </div>
                      <div>
                         <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest mb-1.5">Location</p>
                         <p className="font-black text-[var(--text-primary)] text-sm">{collab.location || 'Remote'}</p>
                      </div>
                      <div>
                         <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest mb-1.5">Experience</p>
                         <p className="font-black text-[var(--text-primary)] text-sm">{collab.experienceLevel || 'Any'}</p>
                      </div>
                   </div>
                </section>



                {/* Description */}
                <section>
                   <h3 className="text-lg font-black text-[var(--text-primary)] mb-4">Project Overview</h3>
                   <div className="bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] p-6 rounded-3xl">
                     <p className="text-[var(--text-secondary)] leading-relaxed font-medium whitespace-pre-wrap text-sm">
                        {collab.description}
                     </p>
                   </div>
                </section>

                {/* Requirements */}
                {collab.requirements?.length > 0 && (
                  <section>
                    <h3 className="text-lg font-black text-[var(--text-primary)] mb-4">Required Creative Skills</h3>
                    <div className="flex flex-wrap gap-2">
                       {collab.requirements.map(req => (
                         <span key={req.id} className="bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] px-4 py-2 rounded-xl text-xs font-bold text-[var(--text-secondary)]">
                            {req.skill}
                         </span>
                       ))}
                    </div>
                  </section>
                )}

                {/* Attachments */}
                {collab.attachments?.length > 0 && (
                  <section>
                    <h3 className="text-lg font-black text-[var(--text-primary)] mb-4">Reference Media</h3>
                    <div className="grid grid-cols-2 gap-4">
                       {collab.attachments.map(att => (
                         <div key={att.id} className="group relative aspect-video bg-[var(--bg-surface-alt)] rounded-2xl overflow-hidden border border-[var(--border-primary)]">
                            <img src={att.fileUrl} className="w-full h-full object-cover transition-transform group-hover:scale-105 opacity-80" alt="" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                               <Paperclip size={24} className="text-[var(--text-primary)]" />
                            </div>
                         </div>
                       ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </div>

          {/* Footer CTA */}
          <div className="p-8 border-t border-[var(--border-primary)] bg-[var(--bg-surface-alt)]/80">
             <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                   <Users size={16} className="text-[#7B5CFA] opacity-50" />
                   <span className="text-[11px] font-black uppercase tracking-widest">{collab?._count?.proposals || 0} applications received</span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] font-black uppercase tracking-widest">Closes: {collab?.deadline ? new Date(collab.deadline).toLocaleDateString() : 'Until filled'}</p>
             </div>
             <button 
               onClick={() => onApply(collab)}
               className="w-full bg-[#7B5CFA] hover:bg-[#6B4CE0] text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-[#7B5CFA]/20 transition-colors"
             >
               Apply to this Collab
             </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CollabDetailsDrawer;
