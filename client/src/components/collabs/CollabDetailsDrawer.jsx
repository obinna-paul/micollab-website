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
          className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        />

        {/* Drawer Content */}
        <motion.div 
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-divider">
             <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={24} className="text-textMuted" />
             </button>
             <div className="flex gap-3">
                <button className="btn-outline py-2 px-6 rounded-xl text-xs font-black uppercase">Save</button>
                <button 
                  onClick={() => onApply(collab)}
                  className="btn-primary py-2 px-8 rounded-xl text-xs font-black uppercase shadow-lg shadow-primary/20"
                >
                  Submit Proposal
                </button>
             </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-8">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center gap-4">
                 <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div>
                 <p className="text-[10px] font-black text-textMuted uppercase tracking-widest">Loading opportunity...</p>
              </div>
            ) : collab && (
              <div className="space-y-10">
                {/* Title & Metadata */}
                <section>
                   <div className="flex items-center gap-2 mb-4">
                      <span className="bg-primary/5 text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase">{collab.category}</span>
                      {collab.isVerified && (
                         <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-3 py-1 rounded-full uppercase flex items-center gap-1">
                            <ShieldCheck size={12} /> Verified
                         </span>
                      )}
                   </div>
                   <h2 className="text-3xl font-black text-textMain tracking-tighter leading-tight mb-6">{collab.title}</h2>
                   
                   <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 py-6 border-y border-divider/50">
                      <div>
                         <p className="text-[10px] text-textMuted font-black uppercase tracking-widest mb-1">Budget</p>
                         <p className="font-black text-textMain">{collab.budget}</p>
                      </div>
                      <div>
                         <p className="text-[10px] text-textMuted font-black uppercase tracking-widest mb-1">Duration</p>
                         <p className="font-black text-textMain">{collab.duration || collab.projectType.replace('_', ' ')}</p>
                      </div>
                      <div>
                         <p className="text-[10px] text-textMuted font-black uppercase tracking-widest mb-1">Location</p>
                         <p className="font-black text-textMain">{collab.location || 'Remote'}</p>
                      </div>
                      <div>
                         <p className="text-[10px] text-textMuted font-black uppercase tracking-widest mb-1">Experience</p>
                         <p className="font-black text-textMain">{collab.experienceLevel || 'Any'}</p>
                      </div>
                   </div>
                </section>

                {/* Poster Info */}
                <section className="bg-gray-50 rounded-3xl p-6 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <img 
                        src={collab.poster?.profileImage || `https://ui-avatars.com/api/?name=${collab.poster?.username}`} 
                        className="w-14 h-14 rounded-2xl border-2 border-white shadow-sm object-cover" 
                        alt="" 
                      />
                      <div>
                         <p className="text-sm font-black text-textMain">@{collab.poster?.username}</p>
                         <p className="text-[10px] text-textMuted font-black uppercase tracking-widest">{collab.poster?.profileType} • Posted {new Date(collab.createdAt).toLocaleDateString()}</p>
                      </div>
                   </div>
                   <button className="text-primary font-black uppercase text-[10px] tracking-widest hover:underline">View Profile</button>
                </section>

                {/* Description */}
                <section>
                   <h3 className="text-lg font-black text-textMain mb-4">Collab Overview</h3>
                   <p className="text-textMuted leading-relaxed font-medium whitespace-pre-wrap">
                      {collab.description}
                   </p>
                </section>

                {/* Requirements */}
                {collab.requirements?.length > 0 && (
                  <section>
                    <h3 className="text-lg font-black text-textMain mb-4">Required Creative Skills</h3>
                    <div className="flex flex-wrap gap-2">
                       {collab.requirements.map(req => (
                         <span key={req.id} className="bg-surface border border-divider px-4 py-2 rounded-xl text-xs font-bold text-textMain">
                            {req.skill}
                         </span>
                       ))}
                    </div>
                  </section>
                )}

                {/* Attachments */}
                {collab.attachments?.length > 0 && (
                  <section>
                    <h3 className="text-lg font-black text-textMain mb-4">Reference Media</h3>
                    <div className="grid grid-cols-2 gap-4">
                       {collab.attachments.map(att => (
                         <div key={att.id} className="group relative aspect-video bg-gray-100 rounded-2xl overflow-hidden border border-divider">
                            <img src={att.fileUrl} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="" />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                               <Paperclip size={24} className="text-white" />
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
          <div className="p-8 border-t border-divider bg-gray-50/50">
             <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-textMuted">
                   <Users size={16} />
                   <span className="text-xs font-bold">{collab?._count?.proposals || 0} applications received</span>
                </div>
                <p className="text-xs text-textMuted font-bold">Applications close: {collab?.deadline ? new Date(collab.deadline).toLocaleDateString() : 'Until filled'}</p>
             </div>
             <button 
               onClick={() => onApply(collab)}
               className="w-full btn-primary py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20"
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
