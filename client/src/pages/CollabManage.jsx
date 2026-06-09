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
  const [updating, setUpdating] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL');

  useEffect(() => {
    fetchCollab();
  }, [id]);

  const fetchCollab = async () => {
    try {
      const res = await axios.get(`/api/collabs/${id}`);
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
      await axios.patch(`/api/collabs/proposals/${proposalId}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCollab();
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  const handleDepositAndAccept = async (proposalId) => {
    setUpdating(proposalId);
    try {
      const res = await axios.post('/api/escrow/deposit/initialize', { proposalId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.authorization_url) {
        window.location.href = res.data.authorization_url;
      } else if (res.data.mock) {
        // Auto-verify mock
        await axios.post('/api/escrow/deposit/verify', { proposalId }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Mock deposit successful. Proposal accepted.');
        fetchCollab();
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to initialize deposit');
    } finally {
      setUpdating(null);
    }
  };

  const handleReleaseEscrow = async (proposalId) => {
    if (!window.confirm("Are you sure you want to release the funds to the creative? This action cannot be undone.")) return;
    setUpdating(proposalId);
    try {
      await axios.post('/api/escrow/release', { proposalId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Funds released successfully!');
      fetchCollab();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to release funds');
    } finally {
      setUpdating(null);
    }
  };

  const handleOpenDispute = async (proposalId) => {
    const reason = window.prompt("Please state the reason for opening this dispute. Administrators will review this.");
    if (!reason) return;
    setUpdating(proposalId);
    try {
      await axios.post('/api/escrow/dispute', { proposalId, reason }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Dispute opened. An administrator will review your case.');
      fetchCollab();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to open dispute');
    } finally {
      setUpdating(null);
    }
  };

  const handleStartChat = async (creatorId) => {
    try {
      await axios.post('/api/messages/conversation', {
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
       <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#7B5CFA]"></div>
       <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Entering Dashboard...</p>
    </div>
  );

  if (!collab) return <div className="max-w-4xl mx-auto py-20 text-center text-[var(--text-primary)] font-bold">Opportunity not found</div>;

  const filteredProposals = collab.proposals?.filter(p => {
     if (activeTab === 'ALL') return true;
     return p.status === activeTab;
  }) || [];

  return (
    <div className="max-w-6xl mx-auto pb-20 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <button 
            onClick={() => navigate('/collabs')}
            className="flex items-center gap-2 text-[var(--text-secondary)] font-black text-[10px] uppercase tracking-widest mb-4 hover:text-[#7B5CFA] transition mt-6"
          >
            <ChevronLeft size={16} /> Back to Hub
          </button>
          <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tighter leading-tight">{collab.title}</h1>
          <p className="text-[var(--text-secondary)] text-sm font-medium mt-1">Reviewing proposals and applicant tracking.</p>
        </div>

        <div className="flex items-center gap-3">
           <div className="bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] px-6 py-3 rounded-2xl flex items-center gap-3 shadow-inner">
              <div className="text-right">
                 <p className="text-[9px] text-[var(--text-muted)] font-black uppercase tracking-widest">Status</p>
                 <p className="text-sm font-black text-[#7B5CFA] uppercase tracking-wider">{collab.status}</p>
              </div>
              <div className="w-3 h-3 rounded-full bg-[#7B5CFA] animate-pulse" />
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
           <div key={i} className="bg-[var(--bg-base)] border border-[var(--border-primary)] p-6 rounded-[2rem] shadow-sm relative overflow-hidden group hover:border-[#7B5CFA]/30 transition-all">
              <div className="absolute -right-4 -top-4 w-20 h-20 bg-[#7B5CFA]/5 rounded-full blur-2xl group-hover:bg-[#7B5CFA]/10 transition-colors" />
              <stat.icon size={20} className="text-[#7B5CFA] mb-3" />
              <p className="text-[9px] text-[var(--text-muted)] font-black uppercase tracking-widest">{stat.label}</p>
              <p className="text-xl font-black text-[var(--text-primary)] mt-1">{stat.val}</p>
           </div>
         ))}
      </div>

      {/* ATS Tabs */}
      <div className="flex border-b border-[var(--border-primary)] mb-8 overflow-x-auto no-scrollbar">
         {['ALL', 'PENDING', 'SHORTLISTED', 'ACCEPTED', 'REJECTED'].map(tab => (
           <button 
             key={tab}
             onClick={() => setActiveTab(tab)}
             className={`flex items-center gap-2 px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 flex-shrink-0 ${activeTab === tab ? 'border-[#7B5CFA] text-[#7B5CFA]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
           >
              {tab} 
              <span className="bg-[var(--bg-surface-alt)] px-2 py-0.5 rounded-md text-[var(--text-primary)] border border-[var(--border-primary)]">
                 {tab === 'ALL' ? collab.proposals?.length : collab.proposals?.filter(p => p.status === tab).length || 0}
              </span>
           </button>
         ))}
      </div>

      <div className="space-y-6">
        {filteredProposals.length > 0 ? (
          filteredProposals.map(proposal => (
            <motion.div 
              key={proposal.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-[var(--bg-base)] border border-[var(--border-primary)] p-8 rounded-[2.5rem] shadow-sm transition-all group hover:border-white/[0.1] relative overflow-hidden ${proposal.status === 'SHORTLISTED' ? 'ring-1 ring-[#7B5CFA]/30 bg-[var(--bg-surface-alt)]/30' : ''}`}
            >
              {proposal.status === 'ACCEPTED' && <div className="absolute top-0 left-0 w-1 h-full bg-[#34D399]" />}
              {proposal.status === 'SHORTLISTED' && <div className="absolute top-0 left-0 w-1 h-full bg-[#7B5CFA]" />}
              
              <div className="flex flex-col md:flex-row gap-8">
                 {/* Talent Profile Snapshot */}
                 <div className="flex-shrink-0 flex flex-col items-center w-full md:w-48 bg-[var(--bg-surface-alt)] rounded-3xl p-6 border border-[var(--border-primary)]">
                    <div className="relative">
                       <img 
                        src={proposal.creator?.profileImage || `https://ui-avatars.com/api/?name=${proposal.creator?.username}`} 
                        className="w-20 h-20 rounded-2xl border border-[var(--border-primary)] object-cover shadow-inner bg-[var(--bg-base)]" 
                        alt="" 
                       />
                       {proposal.status === 'SHORTLISTED' && (
                         <div className="absolute -top-3 -right-3 bg-[#7B5CFA] text-white p-1.5 rounded-full shadow-lg border border-white/[0.1]">
                            <Star size={14} fill="white" />
                         </div>
                       )}
                    </div>
                    <h3 className="font-black text-[var(--text-primary)] text-lg mt-4 truncate w-full text-center tracking-tight">@{proposal.creator?.username}</h3>
                    <p className="text-[9px] text-[#7B5CFA] font-black uppercase tracking-widest mt-1 text-center">{proposal.creator?.profileType}</p>
                    
                    <Link 
                      to={`/profile/${proposal.creator?.username}`}
                      className="w-full text-center text-[10px] font-bold text-[var(--text-secondary)] uppercase mt-4 hover:text-[var(--text-primary)] transition-colors bg-[var(--bg-base)] py-2 rounded-xl border border-[var(--border-primary)] flex items-center justify-center gap-1.5"
                    >
                      Full Profile <ExternalLink size={12} />
                    </Link>
                 </div>

                 {/* Proposal Content */}
                 <div className="flex-1 min-w-0">
                    <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
                       <div className="flex flex-wrap gap-2">
                          <span className="bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] text-[var(--text-primary)] text-[10px] font-black uppercase px-3 py-1.5 rounded-xl flex items-center gap-1.5 tracking-widest">
                             <Clock size={12} className="text-[var(--text-muted)]" /> Applied {new Date(proposal.createdAt).toLocaleDateString()}
                          </span>
                          {proposal.bidAmount && (
                             <span className="bg-[#34D399]/10 border border-[#34D399]/20 text-[#34D399] text-[10px] font-black uppercase px-3 py-1.5 rounded-xl flex items-center gap-1.5 tracking-widest">
                                <DollarSign size={12} /> Bid: {proposal.bidAmount}
                             </span>
                          )}
                       </div>
                       
                       <div className="flex gap-2 w-full md:w-auto">
                          {proposal.status !== 'SHORTLISTED' && proposal.status !== 'ACCEPTED' && (
                            <button 
                              onClick={() => handleUpdateStatus(proposal.id, 'SHORTLISTED')}
                              disabled={updating === proposal.id}
                              className="flex-1 md:flex-none p-3 bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[#7B5CFA]/50 hover:text-[#7B5CFA] rounded-xl transition-all flex items-center justify-center"
                              title="Shortlist"
                            >
                               {updating === proposal.id ? <Loader2 size={18} className="animate-spin" /> : <Star size={18} />}
                            </button>
                          )}
                          {proposal.status !== 'ACCEPTED' && (
                            <button 
                              onClick={() => handleDepositAndAccept(proposal.id)}
                              disabled={updating === proposal.id}
                              className="flex-1 md:flex-none p-3 bg-[#34D399]/10 border border-[#34D399]/20 text-[#34D399] hover:bg-[#34D399]/20 rounded-xl transition-all flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-widest"
                              title="Deposit Funds & Accept"
                            >
                               {updating === proposal.id ? <Loader2 size={16} className="animate-spin" /> : <DollarSign size={16} />} 
                               Pay & Accept
                            </button>
                          )}
                          {proposal.status === 'ACCEPTED' && proposal.escrowStatus === 'HELD' && (
                            <div className="flex flex-col gap-2 w-full md:w-auto">
                              <button 
                                onClick={() => handleReleaseEscrow(proposal.id)}
                                disabled={updating === proposal.id}
                                className="flex-1 p-3 bg-[#FF8A00]/10 border border-[#FF8A00]/20 text-[#FF8A00] hover:bg-[#FF8A00]/20 rounded-xl transition-all flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-widest"
                                title="Release Funds from Escrow"
                              >
                                 {updating === proposal.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />} 
                                 Release Funds
                              </button>
                              <button 
                                onClick={() => handleOpenDispute(proposal.id)}
                                disabled={updating === proposal.id}
                                className="flex-1 p-3 bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 rounded-xl transition-all flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-widest"
                                title="Open a Dispute"
                              >
                                 {updating === proposal.id ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />} 
                                 Dispute
                              </button>
                            </div>
                          )}
                          {proposal.escrowStatus === 'DISPUTED' && (
                            <div className="flex-1 md:flex-none p-3 bg-red-500/10 border border-red-500 text-red-500 rounded-xl text-center font-black text-xs uppercase tracking-widest">
                               Dispute Under Review
                            </div>
                          )}
                          {proposal.status !== 'REJECTED' && (
                            <button 
                              onClick={() => handleUpdateStatus(proposal.id, 'REJECTED')}
                              disabled={updating === proposal.id}
                              className="flex-1 md:flex-none p-3 bg-[#FF6B6B]/10 border border-[#FF6B6B]/20 text-[#FF6B6B] hover:bg-[#FF6B6B]/20 rounded-xl transition-all flex items-center justify-center"
                              title="Reject"
                            >
                               <X size={18} />
                            </button>
                          )}
                       </div>
                    </div>

                    <div className="bg-[var(--bg-surface-alt)]/50 p-6 rounded-2xl border border-[var(--border-primary)] mb-6 shadow-inner">
                       <p className="text-[9px] font-black uppercase text-[var(--text-muted)] mb-3 tracking-widest">Cover Letter / Pitch</p>
                       <p className="text-sm text-[var(--text-primary)] leading-relaxed font-medium">
                         {proposal.coverLetter}
                       </p>
                    </div>

                    {/* Proposal Attachments & Links */}
                    <div className="flex flex-col sm:flex-row gap-6">
                       {proposal.attachments?.length > 0 && (
                          <div className="flex-1">
                             <p className="text-[9px] font-black uppercase text-[var(--text-muted)] mb-3 tracking-widest">Attached Media</p>
                             <div className="flex flex-wrap gap-2">
                                {proposal.attachments.map(att => (
                                  <a key={att.id} href={att.fileUrl} target="_blank" rel="noreferrer" className="bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] px-4 py-2.5 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase text-[var(--text-primary)] hover:border-[#7B5CFA]/50 transition-all">
                                     <Paperclip size={14} className="text-[var(--text-muted)]" /> {att.fileType || 'Document'}
                                  </a>
                                ))}
                             </div>
                          </div>
                       )}

                       {proposal.portfolioLinks && (
                          <div className="flex-1">
                             <p className="text-[9px] font-black uppercase text-[var(--text-muted)] mb-3 tracking-widest">Portfolio Selection</p>
                             <div className="flex flex-wrap gap-2">
                                {proposal.portfolioLinks.split(',').map((link, i) => (
                                  <a key={i} href={link} target="_blank" rel="noreferrer" className="bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] px-4 py-2.5 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase text-[var(--text-primary)] hover:border-[#7B5CFA]/50 transition-all">
                                     <ExternalLink size={14} className="text-[var(--text-muted)]" /> View Project
                                  </a>
                                ))}
                             </div>
                          </div>
                       )}
                    </div>
                    
                    <div className="flex justify-end pt-6 mt-6 border-t border-[var(--border-primary)]">
                       <button 
                         onClick={() => handleStartChat(proposal.creatorId)}
                         className="flex items-center gap-2 text-[10px] font-black uppercase text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] px-6 py-3 rounded-xl transition-all"
                       >
                          <MessageSquare size={16} className="text-[#7B5CFA]" /> Message Candidate
                       </button>
                    </div>
                 </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="bg-[var(--bg-base)] border border-[var(--border-primary)] p-20 rounded-[3rem] text-center shadow-sm">
             <div className="w-24 h-24 bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] rounded-full flex items-center justify-center text-[var(--text-muted)] mx-auto mb-6 shadow-inner">
                <Users size={40} className="opacity-50" />
             </div>
             <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight">No proposals found</h3>
             <p className="text-[var(--text-secondary)] mt-2 font-medium">There are no {activeTab !== 'ALL' ? activeTab.toLowerCase() : ''} proposals yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollabManage;
