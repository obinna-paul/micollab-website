import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, DollarSign, Clock, Users, Building, ChevronLeft, 
  Send, Link as LinkIcon, CheckCircle, AlertCircle, Loader2, Sparkles,
  ShieldCheck, Star, Paperclip, Calendar
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import ProposalModal from '../components/collabs/ProposalModal';

const CollabDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [collab, setCollab] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    fetchCollab();
  }, [id]);

  const fetchCollab = async () => {
    try {
      const res = await axios.get(`/api/collabs/${id}`);
      setCollab(res.data);
      // Check if user already applied
      const hasApplied = res.data.proposals?.some(app => app.creatorId === user?.id);
      setApplied(hasApplied);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="py-40 text-center flex flex-col items-center gap-4">
       <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-[#7B5CFA]"></div>
       <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Fetching collab details...</p>
    </div>
  );

  if (!collab) return (
    <div className="max-w-4xl mx-auto py-20 text-center">
       <h1 className="text-2xl font-black text-[var(--text-primary)]">Collab not found</h1>
       <button onClick={() => navigate('/collabs')} className="text-[#7B5CFA] font-black uppercase text-xs mt-4 hover:underline">Back to Hub</button>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto pb-20 px-4">
      <button 
        onClick={() => navigate('/collabs')}
        className="flex items-center gap-2 text-[var(--text-secondary)] font-black text-[10px] uppercase tracking-widest mb-10 hover:text-[#7B5CFA] transition mt-6"
      >
        <ChevronLeft size={16} /> Back to Hub
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-10">
          <div className="bg-[var(--bg-base)] border border-[var(--border-primary)] rounded-[3rem] p-10 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-[#7B5CFA]/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
             
             <div className="flex flex-wrap items-center gap-3 mb-6 relative z-10">
                <span className="bg-[#7B5CFA]/10 border border-[#7B5CFA]/20 text-[#7B5CFA] text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">{collab.category}</span>
                {collab.isVerified && (
                   <span className="bg-[#34D399]/10 border border-[#34D399]/20 text-[#34D399] text-[10px] font-black px-4 py-1.5 rounded-full uppercase flex items-center gap-2 tracking-widest">
                      <ShieldCheck size={14} /> Verified Collab
                   </span>
                )}
             </div>
             
             <h1 className="text-4xl font-black text-[var(--text-primary)] mb-6 leading-tight tracking-tighter relative z-10">{collab.title}</h1>
             
             <div className="flex flex-wrap gap-8 py-8 border-y border-[var(--border-primary)] relative z-10">
                <div className="flex items-center gap-3">
                   <div className="p-3 bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] rounded-2xl text-[#7B5CFA] shadow-inner"><MapPin size={20} /></div>
                   <div>
                      <p className="text-[9px] text-[var(--text-muted)] font-black uppercase tracking-widest mb-1">Location</p>
                      <p className="text-sm font-black text-[var(--text-primary)]">{collab.location || 'Remote'}</p>
                   </div>
                </div>
                <div className="flex items-center gap-3">
                   <div className="p-3 bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] rounded-2xl text-[#7B5CFA] shadow-inner"><Clock size={20} /></div>
                   <div>
                      <p className="text-[9px] text-[var(--text-muted)] font-black uppercase tracking-widest mb-1">Posted</p>
                      <p className="text-sm font-black text-[var(--text-primary)]">{new Date(collab.createdAt).toLocaleDateString()}</p>
                   </div>
                </div>
                <div className="flex items-center gap-3">
                   <div className="p-3 bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] rounded-2xl text-[#7B5CFA] shadow-inner"><Users size={20} /></div>
                   <div>
                      <p className="text-[9px] text-[var(--text-muted)] font-black uppercase tracking-widest mb-1">Applications</p>
                      <p className="text-sm font-black text-[var(--text-primary)]">{collab.proposals?.length || 0} Proposals</p>
                   </div>
                </div>
             </div>

             <div className="mt-10 relative z-10">
                <h3 className="text-lg font-black text-[var(--text-primary)] mb-6">Project Overview</h3>
                <div className="bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] p-8 rounded-[2rem] shadow-inner">
                   <div className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap font-medium text-sm">
                     {collab.description}
                   </div>
                </div>
             </div>

             {collab.requirements?.length > 0 && (
               <div className="mt-10 pt-10 border-t border-[var(--border-primary)] relative z-10">
                 <h3 className="text-lg font-black text-[var(--text-primary)] mb-6">Required Creative Skills</h3>
                 <div className="flex flex-wrap gap-3">
                    {collab.requirements.map(req => (
                      <span key={req.id} className="bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] px-5 py-2.5 rounded-2xl text-xs font-black text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[#7B5CFA]/40 transition-colors">
                         {req.skill}
                      </span>
                    ))}
                 </div>
               </div>
             )}

             {collab.attachments?.length > 0 && (
               <div className="mt-10 pt-10 border-t border-[var(--border-primary)] relative z-10">
                 <h3 className="text-lg font-black text-[var(--text-primary)] mb-6">Reference Media</h3>
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {collab.attachments.map(att => (
                      <div key={att.id} className="aspect-square bg-[var(--bg-surface-alt)] rounded-3xl overflow-hidden border border-[var(--border-primary)] group cursor-pointer relative">
                         <img src={att.fileUrl} className="w-full h-full object-cover opacity-80 transition-transform group-hover:scale-105 group-hover:opacity-100" alt="" />
                         <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Paperclip size={24} className="text-[var(--text-primary)]" />
                         </div>
                      </div>
                    ))}
                 </div>
               </div>
             )}
          </div>

          <div className="bg-[#34D399]/10 border border-[#34D399]/20 rounded-[3rem] p-10">
             <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="w-16 h-16 bg-[#34D399]/20 rounded-3xl flex items-center justify-center text-[#34D399] shadow-sm shrink-0 border border-[#34D399]/30">
                   <Sparkles size={32} />
                </div>
                <div>
                   <h3 className="text-xl font-black text-[#34D399]">Trust & Security</h3>
                   <p className="text-sm text-[#34D399] mt-2 leading-relaxed font-medium opacity-80">
                     Your creative output is valuable. Micollab's integrated escrow ensures that funds are secured before you begin work, with automated payouts for every milestone achieved.
                   </p>
                </div>
             </div>
          </div>
        </div>

        {/* Sidebar Actions */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-[var(--bg-base)] border border-[var(--border-primary)] rounded-[3rem] p-8 shadow-sm text-center md:text-left relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-[#7B5CFA]/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
             <div className="mb-8 relative z-10">
                <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest mb-2">Budget Range</p>
                <p className="text-4xl font-black text-[var(--text-primary)] tracking-tighter">{collab.budget}</p>
             </div>

             <div className="relative z-10">
                {applied ? (
                  <div className="bg-[#34D399]/10 text-[#34D399] p-6 rounded-3xl flex flex-col items-center text-center gap-3 border border-[#34D399]/20">
                    <CheckCircle size={40} className="opacity-80" />
                    <div>
                       <p className="text-sm font-black uppercase tracking-widest">Proposal Active</p>
                       <p className="text-xs font-medium opacity-80 mt-1">Your pitch and portfolio are being reviewed by the scout.</p>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="w-full bg-[#7B5CFA] hover:bg-[#6B4CE0] text-white py-5 rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-[#7B5CFA]/20 transition-colors"
                  >
                    Submit Proposal
                  </button>
                )}
             </div>
             
             <p className="text-[10px] text-[var(--text-muted)] text-center mt-6 font-black uppercase tracking-widest relative z-10">Applications close: {collab.deadline ? new Date(collab.deadline).toLocaleDateString() : 'Rolling'}</p>
          </div>

          <div className="bg-[var(--bg-base)] border border-[var(--border-primary)] rounded-[3rem] p-8 shadow-sm">
             <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-6 text-center md:text-left">About the Client</h3>
             <div className="flex flex-col md:flex-row items-center md:items-start gap-5 mb-6 text-center md:text-left">
                <img 
                  src={collab.poster?.profileImage || `https://ui-avatars.com/api/?name=${collab.poster?.username}`} 
                  className="w-20 h-20 md:w-16 md:h-16 rounded-3xl border border-[var(--border-primary)] object-cover shadow-sm bg-[var(--bg-surface-alt)]" 
                  alt="" 
                />
                <div className="mt-2 md:mt-0">
                   <p className="text-lg font-black text-[var(--text-primary)] tracking-tight">{collab.poster?.username}</p>
                   <div className="flex items-center justify-center md:justify-start gap-1.5 mt-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-[#7B5CFA]">{collab.poster?.profileType}</span>
                      {collab.isVerified && <ShieldCheck size={12} className="text-[#34D399]" />}
                   </div>
                </div>
             </div>
             <p className="text-sm text-[var(--text-secondary)] leading-relaxed font-medium text-center md:text-left">
               {collab.poster?.bio || "A verified creative scout on Micollab."}
             </p>
             
             <div className="mt-8 pt-8 border-t border-[var(--border-primary)] grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] rounded-2xl shadow-inner">
                   <p className="text-[9px] text-[var(--text-muted)] font-black uppercase tracking-widest mb-1">Success Rate</p>
                   <p className="text-sm font-black text-[var(--text-primary)]">High</p>
                </div>
                <div className="text-center p-4 bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] rounded-2xl shadow-inner">
                   <p className="text-[9px] text-[var(--text-muted)] font-black uppercase tracking-widest mb-1">Rating</p>
                   <p className="text-sm font-black text-[#7B5CFA] flex items-center justify-center gap-1">5.0 <Star size={12} className="fill-[#7B5CFA]" /></p>
                </div>
             </div>
          </div>
        </div>
      </div>

      <ProposalModal 
        collab={collab}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
           setApplied(true);
        }}
      />
    </div>
  );
};

export default CollabDetail;
