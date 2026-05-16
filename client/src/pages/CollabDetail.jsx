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
       <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div>
       <p className="text-[10px] font-black text-textMuted uppercase tracking-widest">Fetching collab details...</p>
    </div>
  );

  if (!collab) return (
    <div className="max-w-4xl mx-auto py-20 text-center">
       <h1 className="text-2xl font-black text-textMain">Collab not found</h1>
       <button onClick={() => navigate('/collabs')} className="text-primary font-black uppercase text-xs mt-4 hover:underline">Back to Hub</button>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto pb-20 px-4">
      <button 
        onClick={() => navigate('/collabs')}
        className="flex items-center gap-2 text-textMuted font-black text-[10px] uppercase tracking-widest mb-10 hover:text-primary transition"
      >
        <ChevronLeft size={16} /> Back to Hub
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-10">
          <div className="bg-white border border-divider rounded-[40px] p-10 shadow-sm">
             <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className="bg-primary/5 text-primary text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-tighter">{collab.category}</span>
                {collab.isVerified && (
                   <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-4 py-1.5 rounded-full uppercase flex items-center gap-2">
                      <ShieldCheck size={14} /> Verified Collab
                   </span>
                )}
             </div>
             
             <h1 className="text-4xl font-black text-textMain mb-6 leading-tight tracking-tighter">{collab.title}</h1>
             
             <div className="flex flex-wrap gap-8 py-8 border-y border-divider/50">
                <div className="flex items-center gap-3">
                   <div className="p-3 bg-gray-50 rounded-2xl text-primary"><MapPin size={20} /></div>
                   <div>
                      <p className="text-[9px] text-textMuted font-black uppercase tracking-widest">Location</p>
                      <p className="text-sm font-black text-textMain">{collab.location || 'Remote'}</p>
                   </div>
                </div>
                <div className="flex items-center gap-3">
                   <div className="p-3 bg-gray-50 rounded-2xl text-primary"><Clock size={20} /></div>
                   <div>
                      <p className="text-[9px] text-textMuted font-black uppercase tracking-widest">Posted</p>
                      <p className="text-sm font-black text-textMain">{new Date(collab.createdAt).toLocaleDateString()}</p>
                   </div>
                </div>
                <div className="flex items-center gap-3">
                   <div className="p-3 bg-gray-50 rounded-2xl text-primary"><Users size={20} /></div>
                   <div>
                      <p className="text-[9px] text-textMuted font-black uppercase tracking-widest">Applications</p>
                      <p className="text-sm font-black text-textMain">{collab.proposals?.length || 0} Proposals</p>
                   </div>
                </div>
             </div>

             <div className="mt-10">
                <h3 className="text-lg font-black text-textMain mb-6">Project Overview</h3>
                <div className="text-textMuted leading-relaxed whitespace-pre-wrap font-medium text-base">
                  {collab.description}
                </div>
             </div>

             {collab.requirements?.length > 0 && (
               <div className="mt-10 pt-10 border-t border-divider/50">
                 <h3 className="text-lg font-black text-textMain mb-6">Required Creative Skills</h3>
                 <div className="flex flex-wrap gap-3">
                    {collab.requirements.map(req => (
                      <span key={req.id} className="bg-gray-50 border border-divider px-5 py-2.5 rounded-2xl text-sm font-black text-textMain">
                         {req.skill}
                      </span>
                    ))}
                 </div>
               </div>
             )}

             {collab.attachments?.length > 0 && (
               <div className="mt-10 pt-10 border-t border-divider/50">
                 <h3 className="text-lg font-black text-textMain mb-6">Reference Media</h3>
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {collab.attachments.map(att => (
                      <div key={att.id} className="aspect-square bg-gray-100 rounded-3xl overflow-hidden border border-divider group cursor-pointer relative">
                         <img src={att.fileUrl} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="" />
                         <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Paperclip size={24} className="text-white" />
                         </div>
                      </div>
                    ))}
                 </div>
               </div>
             )}
          </div>

          <div className="bg-emerald-50 rounded-[40px] p-10 border border-emerald-100">
             <div className="flex gap-6">
                <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
                   <Sparkles size={32} />
                </div>
                <div>
                   <h3 className="text-xl font-black text-textMain">Trust & Security</h3>
                   <p className="text-sm text-emerald-800/80 mt-2 leading-relaxed font-medium">
                     Your creative output is valuable. Micollab's integrated escrow ensures that funds are secured before you begin work, with automated payouts for every milestone achieved.
                   </p>
                </div>
             </div>
          </div>
        </div>

        {/* Sidebar Actions */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white border border-divider rounded-[40px] p-8 shadow-sm">
             <div className="mb-8 text-center md:text-left">
                <p className="text-[10px] text-textMuted font-black uppercase tracking-widest mb-1">Budget Range</p>
                <p className="text-4xl font-black text-textMain tracking-tighter">{collab.budget}</p>
             </div>

             {applied ? (
               <div className="bg-emerald-50 text-emerald-700 p-6 rounded-[30px] flex flex-col items-center text-center gap-3 border border-emerald-100">
                 <CheckCircle size={40} className="opacity-50" />
                 <div>
                    <p className="text-sm font-black uppercase">Proposal Active</p>
                    <p className="text-xs font-medium opacity-80 mt-1">Your pitch and portfolio are being reviewed by the scout.</p>
                 </div>
               </div>
             ) : (
               <button 
                 onClick={() => setIsModalOpen(true)}
                 className="w-full btn-primary py-5 rounded-3xl font-black uppercase tracking-widest shadow-2xl shadow-primary/25"
               >
                 Submit Proposal
               </button>
             )}
             
             <p className="text-[10px] text-textMuted text-center mt-6 font-black uppercase tracking-widest">Applications close: {collab.deadline ? new Date(collab.deadline).toLocaleDateString() : 'Rolling'}</p>
          </div>

          <div className="bg-white border border-divider rounded-[40px] p-8 shadow-sm">
             <h3 className="text-[10px] font-black text-textMuted uppercase tracking-widest mb-6">About the Scout</h3>
             <div className="flex items-center gap-5 mb-6">
                <img 
                  src={collab.poster?.profileImage || `https://ui-avatars.com/api/?name=${collab.poster?.username}`} 
                  className="w-16 h-16 rounded-3xl border-4 border-gray-50 object-cover shadow-sm" 
                  alt="" 
                />
                <div>
                   <p className="text-lg font-black text-textMain tracking-tight">@{collab.poster?.username}</p>
                   <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[9px] font-black uppercase tracking-widest text-primary">{collab.poster?.profileType}</span>
                      <ShieldCheck size={12} className="text-blue-500" />
                   </div>
                </div>
             </div>
             <p className="text-sm text-textMuted leading-relaxed font-medium">
               {collab.poster?.bio || "A verified creative scout on Micollab."}
             </p>
             
             <div className="mt-8 pt-8 border-t border-divider/50 grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-2xl">
                   <p className="text-[9px] text-textMuted font-black uppercase tracking-widest mb-1">Success</p>
                   <p className="text-sm font-black text-textMain">12 Hires</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-2xl">
                   <p className="text-[9px] text-textMuted font-black uppercase tracking-widest mb-1">Rating</p>
                   <p className="text-sm font-black text-primary flex items-center justify-center gap-1">4.9 <Star size={12} className="fill-primary" /></p>
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
           navigate('/collabs');
        }}
      />
    </div>
  );
};

export default CollabDetail;
