import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  X, Send, Paperclip, CheckCircle, 
  Layout, Image as ImageIcon, Link as LinkIcon 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../../store/useAuthStore';

const ProposalModal = ({ collab, isOpen, onClose, onSuccess }) => {
  const { user, token } = useAuthStore();
  const [coverLetter, setCoverLetter] = useState('');
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
      const res = await axios.get(`http://localhost:5000/api/users/profile/${user.username}`);
      setUserPortfolio(res.data.portfolio || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach(file => formData.append('media', file));
      
      const res = await axios.post('http://localhost:5000/api/upload', formData, {
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
      await axios.post('http://localhost:5000/api/collabs/apply', {
        collabId: collab.id,
        coverLetter,
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
          className="absolute inset-0 bg-black/40 backdrop-blur-md"
        />

        {/* Modal */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-8 border-b border-divider flex items-center justify-between bg-gray-50/50">
             <div>
                <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Submitting Proposal to</p>
                <h3 className="text-xl font-black text-textMain truncate max-w-[400px] tracking-tight">{collab?.title}</h3>
             </div>
             <button onClick={onClose} className="p-3 hover:bg-gray-200 rounded-full transition-colors">
                <X size={24} className="text-textMuted" />
             </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
             {/* Cover Letter */}
             <div>
                <label className="text-[10px] font-black text-textMuted uppercase tracking-widest mb-3 block">Your Pitch (Cover Letter)</label>
                <textarea 
                  className="w-full bg-gray-50 border border-divider rounded-2xl p-5 text-sm font-medium focus:border-primary outline-none min-h-[150px] transition-all"
                  placeholder="Explain why you're the perfect collaborator for this project..."
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                />
             </div>

             {/* Portfolio Selector */}
             <div>
                <label className="text-[10px] font-black text-textMuted uppercase tracking-widest mb-4 block">Select Featured Portfolio Items</label>
                <div className="grid grid-cols-2 gap-3">
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
                       className={`p-3 border rounded-2xl cursor-pointer transition-all flex items-center gap-3 ${selectedPortfolio.find(p => p.id === item.id) ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-divider hover:border-textMuted'}`}
                     >
                        <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                           {item.mediaType === 'IMAGE' ? (
                             <img src={item.mediaUrl} className="w-full h-full object-cover" alt="" />
                           ) : (
                             <div className="w-full h-full flex items-center justify-center text-textMuted">
                                <LinkIcon size={20} />
                             </div>
                           )}
                        </div>
                        <div className="min-w-0">
                           <p className="text-xs font-black text-textMain truncate">{item.title}</p>
                           <p className="text-[9px] text-textMuted font-bold uppercase">{item.mediaType}</p>
                        </div>
                     </div>
                   ))}
                </div>
                {userPortfolio.length === 0 && (
                   <p className="text-[10px] text-textMuted font-bold bg-gray-50 p-4 rounded-xl text-center">No portfolio items found. Add some to your profile to showcase your work!</p>
                )}
             </div>

             {/* Custom Attachments */}
             <div>
                <label className="text-[10px] font-black text-textMuted uppercase tracking-widest mb-4 block">Custom Attachments (Audition Tapes, Samples)</label>
                <div className="flex flex-wrap gap-3 mb-4">
                   {attachments.map((att, i) => (
                     <div key={i} className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase">
                        <CheckCircle size={14} /> {att.type} File
                        <X size={14} className="cursor-pointer ml-2" onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))} />
                     </div>
                   ))}
                </div>
                <label className="flex flex-col items-center justify-center w-full aspect-[5/1] border-2 border-dashed border-divider rounded-2xl cursor-pointer hover:bg-gray-50 transition-all">
                   <div className="flex items-center gap-2 text-textMuted font-black uppercase text-[10px] tracking-widest">
                      <Paperclip size={18} /> {uploading ? 'Uploading...' : 'Attach additional files'}
                   </div>
                   <input type="file" multiple className="hidden" onChange={handleFileUpload} disabled={uploading} />
                </label>
             </div>
          </div>

          {/* Footer */}
          <div className="p-8 border-t border-divider bg-gray-50/50">
             <button 
               onClick={handleSubmit}
               disabled={submitting || uploading}
               className="w-full btn-primary py-5 rounded-3xl font-black uppercase tracking-widest shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 disabled:opacity-50"
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
