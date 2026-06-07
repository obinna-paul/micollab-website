import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Plus, Image, Video, Music, FileText, 
  Trash2, Search, UserPlus, Tag, Check, Loader2, Grid
} from 'lucide-react';
import axios from 'axios';
import useAuthStore from '../store/useAuthStore';

const CATEGORIES = [
  { id: 'VIDEO', label: 'Video', icon: Video },
  { id: 'PHOTOGRAPHY', label: 'Photography', icon: Image },
  { id: 'MUSIC', label: 'Music/Audio', icon: Music },
  { id: 'WRITING', label: 'Writing/Copy', icon: FileText },
  { id: 'DESIGN', label: 'Design/Art', icon: Grid },
];

const AddPortfolioModal = ({ isOpen, onClose, onProjectCreated }) => {
  const { token } = useAuthStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('VIDEO');
  const [projectType, setProjectType] = useState('PERSONAL');
  const [media, setMedia] = useState([]); // { url, type, order }
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [credits, setCredits] = useState([]); // { userId, role, username, profileImage }
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const fileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setLoading(true);
    const formData = new FormData();
    files.forEach(file => formData.append('media', file));

    try {
      const res = await axios.post('/api/upload', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      
      const newMedia = res.data.urls.map((url, i) => {
        const isVideo = url.match(/\.(mp4|webm|mov|mkv)$/i);
        const isAudio = url.match(/\.(mp3|wav|ogg|aac)$/i);
        return {
          url,
          type: isVideo ? 'VIDEO' : (isAudio ? 'AUDIO' : 'IMAGE'),
          order: media.length + i
        };
      });
      
      setMedia(prev => [...prev, ...newMedia]);
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const removeMedia = (index) => {
    setMedia(prev => prev.filter((_, i) => i !== index));
  };

  const handleSearchUsers = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) { setSearchResults([]); return; }
    
    setIsSearching(true);
    try {
      const res = await axios.get(`/api/users/search?query=${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSearchResults(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const addCredit = (user) => {
    const role = window.prompt(`What was @${user.username}'s role in this project? (e.g. Editor, Producer)`, 'Collaborator');
    if (role) {
      setCredits(prev => [...prev, { userId: user.id, username: user.username, profileImage: user.profileImage, role }]);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const addTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags(prev => [...prev, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const handleSubmit = async () => {
    if (!title || !media.length) return;
    
    setLoading(true);
    try {
      const res = await axios.post('/api/users/portfolio', {
        title, description, category, projectType, media, tags, credits
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onProjectCreated(res.data);
      onClose();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.details || 'Failed to create project';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-2xl bg-[var(--bg-base)] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-[var(--border-secondary)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-[var(--border-primary)] bg-[var(--bg-surface-alt)]">
          <div>
            <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">Showcase New Project</h2>
            <p className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-widest mt-1">Step {step} of 3</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition">
            <X size={24} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Project Title</label>
                  <input 
                    type="text" value={title} onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Midnight in Lagos"
                    className="w-full bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] rounded-2xl px-5 py-4 text-sm font-bold text-[var(--text-primary)] outline-none focus:border-[#7B5CFA] transition"
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Description</label>
                  <textarea 
                    value={description} onChange={e => setDescription(e.target.value)}
                    placeholder="Tell the story behind this project..."
                    className="w-full bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] rounded-2xl px-5 py-4 text-sm font-medium text-[var(--text-primary)] outline-none focus:border-[#7B5CFA] transition min-h-[120px] resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Category</label>
                    <select 
                      value={category} onChange={e => setCategory(e.target.value)}
                      className="w-full bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] rounded-2xl px-5 py-4 text-sm font-bold text-[var(--text-primary)] outline-none focus:border-[#7B5CFA] transition appearance-none"
                    >
                      <option value="VIDEO" className="bg-[var(--bg-surface-alt)]">Video</option>
                      <option value="PHOTOGRAPHY" className="bg-[var(--bg-surface-alt)]">Photography</option>
                      <option value="MUSIC" className="bg-[var(--bg-surface-alt)]">Music/Audio</option>
                      <option value="WRITING" className="bg-[var(--bg-surface-alt)]">Writing</option>
                      <option value="DESIGN" className="bg-[var(--bg-surface-alt)]">Design</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Project Type</label>
                    <div className="flex gap-2">
                      {['PERSONAL', 'CLIENT'].map(t => (
                        <button 
                          key={t} onClick={() => setProjectType(t)}
                          className={`flex-1 py-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                            projectType === t ? 'bg-[#7B5CFA] border-[#7B5CFA] text-white shadow-[0_0_15px_rgba(123,92,250,0.3)]' : 'bg-[var(--bg-surface-alt)] border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-4 border-dashed border-[var(--border-primary)] rounded-[2rem] py-12 flex flex-col items-center justify-center cursor-pointer hover:border-[#7B5CFA]/30 hover:bg-[#7B5CFA]/5 transition-all group bg-[var(--bg-surface-alt)]/50"
                >
                  <div className="w-16 h-16 bg-[#7B5CFA]/10 rounded-2xl flex items-center justify-center text-[#7B5CFA] mb-4 group-hover:scale-110 transition-transform">
                    <Plus size={32} />
                  </div>
                  <h3 className="font-black text-[var(--text-primary)] tracking-tight">Upload Project Assets</h3>
                  <p className="text-xs text-[var(--text-secondary)] font-bold mt-1">High-quality Images or Videos (up to 50MB)</p>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*,video/*,audio/*" onChange={handleFileUpload} />

                {media.length > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    {media.map((m, i) => (
                      <div key={i} className="relative aspect-square rounded-2xl overflow-hidden group">
                        <img src={m.url} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button onClick={() => removeMedia(i)} className="p-2 bg-red-500 text-white rounded-full">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Credits */}
                <div>
                  <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Collaborators (Credits)</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
                    <input 
                      type="text" value={searchQuery} onChange={e => handleSearchUsers(e.target.value)}
                      placeholder="Search for fellow creatives..."
                      className="w-full bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] rounded-2xl pl-12 pr-5 py-4 text-sm font-bold text-[var(--text-primary)] outline-none focus:border-[#7B5CFA] transition"
                    />
                  </div>
                  
                  {/* Search Results */}
                  <AnimatePresence>
                    {searchResults.length > 0 && (
                      <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mt-2 bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] rounded-2xl shadow-xl overflow-hidden max-h-48 overflow-y-auto custom-scrollbar">
                        {searchResults.map(u => (
                          <button key={u.id} onClick={() => addCredit(u)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-left border-b border-[var(--border-primary)] last:border-0 transition">
                            <img src={u.profileImage} className="w-8 h-8 rounded-full" />
                            <div className="min-w-0">
                              <p className="text-xs font-black text-[var(--text-primary)]">@{u.username}</p>
                              <p className="text-[9px] text-[var(--text-secondary)] uppercase font-bold">{u.profileType}</p>
                            </div>
                            <UserPlus size={14} className="ml-auto text-[#7B5CFA]" />
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Added Credits */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {credits.map((c, i) => (
                      <div key={i} className="flex items-center gap-2 bg-[#7B5CFA]/10 text-[#7B5CFA] px-3 py-2 rounded-xl border border-[#7B5CFA]/20">
                        <img src={c.profileImage} className="w-5 h-5 rounded-full" />
                        <span className="text-[10px] font-black">@{c.username} ({c.role})</span>
                        <button onClick={() => setCredits(prev => prev.filter((_, idx) => idx !== i))} className="hover:text-red-500">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Project Tags</label>
                  <div className="relative">
                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
                    <input 
                      type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={addTag}
                      placeholder="Type a tag and press Enter (e.g. Cinematic, VFX)..."
                      className="w-full bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] rounded-2xl pl-12 pr-5 py-4 text-sm font-bold text-[var(--text-primary)] outline-none focus:border-[#7B5CFA] transition"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {tags.map(t => (
                      <span key={t} className="px-3 py-1 bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] rounded-full text-[10px] font-black uppercase text-[var(--text-secondary)] flex items-center gap-2">
                        {t}
                        <button onClick={() => setTags(prev => prev.filter(tag => tag !== t))} className="hover:text-[var(--text-primary)]">
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-[var(--border-primary)] bg-[var(--bg-surface-alt)] flex items-center justify-between">
          <button 
            onClick={() => setStep(prev => prev - 1)}
            disabled={step === 1 || loading}
            className="px-6 py-3 text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30 transition"
          >
            Back
          </button>
          
          <div className="flex gap-3">
            {step < 3 ? (
              <button 
                onClick={() => setStep(prev => prev + 1)}
                disabled={step === 1 && !title}
                className="px-8 py-3 bg-[#7B5CFA] text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-[#684CE0] transition shadow-[0_0_15px_rgba(123,92,250,0.3)] disabled:opacity-30"
              >
                Next Step
              </button>
            ) : (
              <button 
                onClick={handleSubmit}
                disabled={loading || !media.length}
                className="px-10 py-3 bg-[#7B5CFA] text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-[#684CE0] transition shadow-[0_0_15px_rgba(123,92,250,0.3)] flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                {loading ? 'Publishing...' : 'Publish Project'}
              </button>
            ) }
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AddPortfolioModal;
