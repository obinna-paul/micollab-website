import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  X, Send, Paperclip, CheckCircle, 
  Briefcase, DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../../store/useAuthStore';

const ProposalModal = ({ collab, isOpen, onClose, onSuccess }) => {
  const { user, token } = useAuthStore();
  const [coverLetter, setCoverLetter] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [selectedPortfolio, setSelectedPortfolio] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [userPortfolio, setUserPortfolio] = useState([]);

  useEffect(() => {
    if (isOpen && user) {
       fetchPortfolio();
    }
  }, [isOpen, user]);

  const fetchPortfolio = async () => {
    try {
      const res = await axios.get(`/api/users/profile/${user.username}`);
      setUserPortfolio(res.data.portfolioItems || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach(file => formData.append('media', file));
      
      const res = await axios.post('/api/upload', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}` 
        }
      });
      
      setAttachments(prev => [...prev, ...res.data.files]);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!coverLetter) return alert('Please write a cover letter');
    setSubmitting(true);
    try {
      await axios.post('/api/collabs/apply', {
        collabId: collab.id,
        coverLetter,
        bidAmount: bidAmount ? `₦${bidAmount}` : null,
        portfolioLinks: selectedPortfolio.map(p => p.mediaUrl).join(','),
        attachments: attachments.map(a => ({ url: a.url, type: a.type }))
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      onSuccess();
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit proposal');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Modal */}
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-2xl bg-[#0F131E] border border-white/[0.06] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-8 border-b border-white/[0.04] flex items-center justify-between bg-[#181D2A]/50">
             <div>
                <p className="text-[10px] font-black text-[#7B5CFA] uppercase tracking-widest mb-1.5">Submit Proposal To</p>
                <h3 className="text-xl font-black text-white truncate max-w-[400px] tracking-tight">{collab?.title}</h3>
             </div>
             <button onClick={onClose} className="p-3 hover:bg-white/[0.05] rounded-full transition-colors">
                <X size={24} className="text-[#5A6478]" />
             </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
             {/* Proposed Bid Amount */}
             <div>
                <label className="text-[10px] font-black text-[#8B95A5] uppercase tracking-widest mb-3 block">Your Proposed Rate / Bid Amount (Optional)</label>
                <div className="relative">
                   <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A6478]" size={16} />
                   <input 
                     type="number"
                     placeholder="e.g. 150000"
                     value={bidAmount}
                     onChange={(e) => setBidAmount(e.target.value)}
                     className="w-full bg-[#181D2A] border border-white/[0.06] rounded-2xl py-4 pl-12 pr-5 text-[14px] font-medium text-white outline-none focus:border-[#7B5CFA]/40 transition-all placeholder-[#5A6478]"
                   />
                </div>
                <p className="text-[10px] text-[#5A6478] mt-2 font-medium">Client's Budget: <span className="font-bold text-white">{collab?.budget}</span></p>
             </div>

             {/* Cover Letter */}
             <div>
                <label className="text-[10px] font-black text-[#8B95A5] uppercase tracking-widest mb-3 block">Your Pitch (Cover Letter)</label>
                <textarea 
                  className="w-full bg-[#181D2A] border border-white/[0.06] rounded-2xl p-5 text-[14px] font-medium text-white placeholder-[#5A6478] focus:border-[#7B5CFA]/40 outline-none min-h-[150px] transition-all resize-none shadow-inner leading-relaxed"
                  placeholder="Explain why you're the perfect collaborator for this project. Highlight your unique approach and relevant experience..."
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                />
             </div>

             {/* Portfolio Selector */}
             <div>
                <label className="text-[10px] font-black text-[#8B95A5] uppercase tracking-widest mb-4 block">Select Featured Portfolio Items</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                   {userPortfolio.map(item => (
                     <div 
                       key={item.id}
                       onClick={() => {
                          if (selectedPortfolio.find(p => p.id === item.id)) {
                             setSelectedPortfolio(selectedPortfolio.filter(p => p.id !== item.id));
                          } else {
                             setSelectedPortfolio([...selectedPortfolio, item]);
                          }
                       }}
                       className={`p-3 border rounded-2xl cursor-pointer transition-all flex items-center gap-3 ${selectedPortfolio.find(p => p.id === item.id) ? 'border-[#7B5CFA] bg-[#7B5CFA]/10 ring-1 ring-[#7B5CFA]/30' : 'border-white/[0.06] bg-[#181D2A] hover:border-white/[0.15]'}`}
                     >
                        <div className="w-12 h-12 rounded-xl bg-[#0F131E] overflow-hidden flex-shrink-0 border border-white/[0.04]">
                           {item.media && item.media[0] ? (
                             <img src={item.media[0].url} className="w-full h-full object-cover" alt="" />
                           ) : (
                             <div className="w-full h-full flex items-center justify-center text-[#5A6478]">
                                <Briefcase size={20} />
                             </div>
                           )}
                        </div>
                        <div className="min-w-0">
                           <p className="text-xs font-black text-white truncate">{item.title}</p>
                           <p className="text-[9px] text-[#7B5CFA] font-bold uppercase tracking-widest mt-0.5">{item.mediaType || 'Media'}</p>
                        </div>
                     </div>
                   ))}
                </div>
                {userPortfolio.length === 0 && (
                   <p className="text-[10px] text-[#5A6478] font-bold bg-[#181D2A] p-4 rounded-xl text-center border border-dashed border-white/[0.06]">No portfolio items found. Add some to your profile to showcase your work!</p>
                )}
             </div>

             {/* Custom Attachments */}
             <div>
                <label className="text-[10px] font-black text-[#8B95A5] uppercase tracking-widest mb-4 block">Custom Attachments (Audition Tapes, Samples)</label>
                <div className="flex flex-wrap gap-2 mb-4">
                   {attachments.map((att, i) => (
                     <div key={i} className="flex items-center gap-2 bg-[#34D399]/10 text-[#34D399] border border-[#34D399]/20 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest">
                        <CheckCircle size={14} /> {att.type} File
                        <X size={14} className="cursor-pointer ml-1 hover:text-white" onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))} />
                     </div>
                   ))}
                </div>
                <label className="flex flex-col items-center justify-center w-full aspect-[6/1] border-2 border-dashed border-white/[0.06] bg-[#181D2A] rounded-2xl cursor-pointer hover:border-[#7B5CFA]/40 transition-all group">
                   <div className="flex items-center gap-2 text-[#5A6478] group-hover:text-[#7B5CFA] transition-colors font-black uppercase text-[10px] tracking-widest">
                      <Paperclip size={18} /> {uploading ? 'Uploading...' : 'Attach additional files'}
                   </div>
                   <input type="file" multiple className="hidden" onChange={handleFileUpload} disabled={uploading} />
                </label>
             </div>
          </div>

          {/* Footer */}
          <div className="p-8 border-t border-white/[0.04] bg-[#181D2A]/50">
             <button 
               onClick={handleSubmit}
               disabled={submitting || uploading}
               className="w-full bg-[#7B5CFA] hover:bg-[#6B4CE0] text-white py-5 rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-[#7B5CFA]/20 flex items-center justify-center gap-3 disabled:opacity-50 transition-colors"
             >
                {submitting ? 'Sending...' : (
                   <>
                      <Send size={20} />
                      Submit Proposal
                   </>
                )}
             </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ProposalModal;
