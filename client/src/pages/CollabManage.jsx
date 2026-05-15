import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, MessageSquare, Star, ChevronLeft, 
  ExternalLink, CheckCircle, Clock, MapPin, Loader2,
  Filter, MoreVertical, Check, X, ShieldCheck,
  Paperclip, Layout, DollarSign
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

const CollabManage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const [collab, setCollab] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null); // ID of proposal being updated

  useEffect(() => {
    fetchCollab();
  }, [id]);

  const fetchCollab = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/collabs/${id}`);
      setCollab(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (proposalId, status) => {
    setUpdating(proposalId);
    try {
      await axios.patch(`http://localhost:5000/api/collabs/proposals/${proposalId}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Refresh data
      fetchCollab();
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  const handleStartChat = async (creatorId) => {
    try {
      const res = await axios.post('http://localhost:5000/api/messages/conversation', {
        targetUserId: creatorId,
        type: 'PROPOSAL'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate('/messages');
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return (
    <div className="py-40 text-center flex flex-col items-center gap-6">
       <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary"></div>
       <p className="text-[10px] font-black text-textMuted uppercase tracking-widest">Entering Dashboard...</p>
    </div>
  );

  if (!collab) return <div className="max-w-4xl mx-auto py-20 text-center card">Opportunity not found</div>;

  return (
    <div className="max-w-5xl mx-auto pb-20 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <button 
            onClick={() => navigate('/collabs')}
            className="flex items-center gap-2 text-textMuted font-black text-[10px] uppercase tracking-widest mb-4 hover:text-primary transition"
          >
            <ChevronLeft size={16} /> Back to Hub
          </button>
          <h1 className="text-3xl font-black text-textMain tracking-tighter leading-tight">{collab.title}</h1>
          <p className="text-textMuted text-sm font-medium mt-1">Reviewing {collab.proposals?.length || 0} active proposals from talent.</p>
        </div>

        <div className="flex items-center gap-3">
           <div className="bg-primary/5 px-6 py-3 rounded-2xl border border-primary/20 flex items-center gap-3">
              <div className="text-right">
                 <p className="text-[9px] text-textMuted font-black uppercase tracking-widest">Collab Status</p>
                 <p className="text-sm font-black text-primary uppercase">{collab.status}</p>
              </div>
              <div className={`w-3 h-3 rounded-full bg-primary animate-pulse`} />
           </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
         {[
           { label: 'Total Proposals', val: collab.proposals?.length || 0, icon: Users },
           { label: 'Shortlisted', val: collab.proposals?.filter(p => p.status === 'SHORTLISTED').length || 0, icon: Star },
           { label: 'Budget Allocation', val: collab.budget, icon: DollarSign },
           { label: 'Category', val: collab.category, icon: Layout }
         ].map((stat, i) => (
           <div key={i} className="bg-white border border-divider p-6 rounded-[30px] shadow-sm">
              <stat.icon size={20} className="text-primary mb-3 opacity-50" />
              <p className="text-[9px] text-textMuted font-black uppercase tracking-widest">{stat.label}</p>
              <p className="text-lg font-black text-textMain mt-1">{stat.val}</p>
           </div>
         ))}
      </div>

      <div className="space-y-8">
        <h2 className="text-[10px] font-black text-textMuted uppercase tracking-widest flex items-center gap-2">
           <Filter size={14} /> Incoming Proposals
        </h2>

        {collab.proposals?.length > 0 ? (
          collab.proposals.map(proposal => (
            <motion.div 
              key={proposal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white border p-8 rounded-[40px] shadow-sm transition-all ${proposal.status === 'SHORTLISTED' ? 'border-primary/50 ring-1 ring-primary/10' : 'border-divider'}`}
            >
              <div className="flex flex-col md:flex-row gap-10">
                 {/* Talent Profile */}
                 <div className="flex-shrink-0 flex flex-col items-center">
                    <div className="relative">
                       <img 
                        src={proposal.creator?.profileImage || `https://ui-avatars.com/api/?name=${proposal.creator?.username}`} 
                        className="w-24 h-24 rounded-[30px] border-4 border-gray-50 object-cover shadow-sm" 
                        alt="" 
                       />
                       {proposal.status === 'SHORTLISTED' && (
                         <div className="absolute -top-2 -right-2 bg-primary text-white p-2 rounded-full shadow-lg">
                            <Star size={16} fill="white" />
                         </div>
                       )}
                    </div>
                    <Link 
                      to={`/profile/${proposal.creator?.username}`}
                      className="text-[10px] font-black text-primary uppercase mt-4 hover:underline flex items-center gap-2"
                    >
                      View Profile <ExternalLink size={12} />
                    </Link>
                 </div>

                 {/* Proposal Details */}
                 <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-6">
                       <div>
                          <h3 className="font-black text-textMain text-2xl tracking-tight">@{proposal.creator?.username}</h3>
                          <p className="text-[10px] text-primary font-black uppercase tracking-widest mt-1">{proposal.creator?.profileType}</p>
                       </div>
                       
                       <div className="flex gap-2">
                          {proposal.status !== 'SHORTLISTED' && (
                            <button 
                              onClick={() => handleUpdateStatus(proposal.id, 'SHORTLISTED')}
                              disabled={updating === proposal.id}
                              className="p-4 bg-gray-50 text-textMuted hover:bg-primary/10 hover:text-primary rounded-2xl transition-all"
                              title="Shortlist"
                            >
                               {updating === proposal.id ? <Loader2 size={20} className="animate-spin" /> : <Star size={20} />}
                            </button>
                          )}
                          <button 
                            onClick={() => handleUpdateStatus(proposal.id, 'ACCEPTED')}
                            disabled={updating === proposal.id}
                            className="p-4 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-2xl transition-all"
                            title="Accept & Unlock Chat"
                          >
                             <Check size={20} />
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus(proposal.id, 'REJECTED')}
                            disabled={updating === proposal.id}
                            className="p-4 bg-red-50 text-red-600 hover:bg-red-100 rounded-2xl transition-all"
                            title="Reject"
                          >
                             <X size={20} />
                          </button>
                       </div>
                    </div>

                    <div className="bg-gray-50/50 p-6 rounded-[30px] border border-divider/50 mb-6">
                       <p className="text-[9px] font-black uppercase text-textMuted mb-3 tracking-widest">Proposal Pitch</p>
                       <p className="text-base text-textMain leading-relaxed font-medium">
                         {proposal.coverLetter}
                       </p>
                    </div>

                    {/* Proposal Attachments */}
                    {proposal.attachments?.length > 0 && (
                       <div className="mb-6">
                          <p className="text-[9px] font-black uppercase text-textMuted mb-3 tracking-widest">Media Samples</p>
                          <div className="flex flex-wrap gap-2">
                             {proposal.attachments.map(att => (
                               <a key={att.id} href={att.fileUrl} target="_blank" rel="noreferrer" className="bg-white border border-divider px-4 py-2 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase text-textMuted hover:border-primary transition-all">
                                  <Paperclip size={14} className="text-primary" /> {att.fileType} Sample
                               </a>
                             ))}
                          </div>
                       </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-6 border-t border-divider/50">
                       <div className="flex items-center gap-6 text-[9px] text-textMuted font-black uppercase tracking-widest">
                          <span className="flex items-center gap-2"><Clock size={16} className="text-primary opacity-50" /> Applied {new Date(proposal.createdAt).toLocaleDateString()}</span>
                          <span className="flex items-center gap-2 text-emerald-600"><ShieldCheck size={16} /> Identity Verified</span>
                       </div>
                       
                       <button 
                         onClick={() => handleStartChat(proposal.creatorId)}
                         className="flex items-center gap-3 text-[10px] font-black uppercase text-primary hover:underline"
                       >
                          <MessageSquare size={16} /> Open Communication Thread
                       </button>
                    </div>
                 </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="bg-white border-2 border-dashed border-divider p-20 rounded-[40px] text-center">
             <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-textMuted mx-auto mb-6">
                <Users size={40} className="opacity-20" />
             </div>
             <h3 className="text-xl font-black text-textMain tracking-tight">Quiet for now...</h3>
             <p className="text-textMuted mt-2 font-medium">No proposals have been received for this opportunity yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollabManage;
