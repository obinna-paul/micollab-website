import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  Briefcase, Send, MapPin, DollarSign, List, 
  ChevronLeft, Loader2, Sparkles, AlertCircle, Share2,
  Plus, X, Paperclip, Calendar, Clock, Search, ShieldCheck
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

const CATEGORIES = [
  "Music & Audio", "Film, TV, Video", "Photography & Visual Arts",
  "Writing & Content", "Acting & Performance", "Fashion & Beauty",
  "Design & Creative tech", "Digital & Social creator",
  "Event & Entertainment", "Education"
];

const BUDGET_RANGES = [
  "Under ₦50,000", "₦50,000 - ₦150,000", "₦150,000 - ₦300,000",
  "₦300,000 - ₦500,000", "₦500,000 - ₦1,000,000", "₦1,000,000+",
  "To be negotiated", "Custom Fixed Price"
];

const SKILL_MAP = {
  writing: ["Ghostwriting", "Book Writing", "Ebook", "Creative Writing", "Nonfiction", "Fiction", "Storytelling", "Proofreading", "Copywriting", "Editing", "Narrative Design"],
  music: ["Vocal Tuning", "Mixing", "Mastering", "Songwriting", "Music Production", "Beat Making", "Vocal Performance", "Audio Engineering", "Sound Design"],
  video: ["Video Editing", "Color Grading", "Motion Graphics", "After Effects", "Premiere Pro", "Cinematography", "Directing", "Storyboarding"],
  design: ["UI/UX Design", "Logo Design", "Branding", "Illustration", "Typography", "3D Modeling", "Figma", "Photoshop", "Canva"],
  acting: ["Voice Acting", "Screen Acting", "Improv", "Method Acting", "Monologue", "Script Analysis", "Voice-over"],
  photography: ["Portrait Photography", "Event Photography", "Photo Editing", "Lightroom", "Color Correction", "Studio Lighting"],
  fashion: ["Fashion Styling", "Pattern Making", "Garment Construction", "Trend Analysis", "Fashion Illustration"],
  digital: ["Social Media Management", "Content Strategy", "SEO", "Influencer Marketing", "Digital Strategy", "Copywriting"]
};

const getRecommendedSkills = (title, category) => {
  const combined = (title + ' ' + category).toLowerCase();
  let suggestions = [];
  
  if (combined.includes('writ') || combined.includes('book') || combined.includes('ghost') || combined.includes('content')) {
    suggestions = [...suggestions, ...SKILL_MAP.writing];
  }
  if (combined.includes('music') || combined.includes('song') || combined.includes('vocal') || combined.includes('audio') || combined.includes('beat')) {
    suggestions = [...suggestions, ...SKILL_MAP.music];
  }
  if (combined.includes('video') || combined.includes('film') || combined.includes('edit') || combined.includes('tv')) {
    suggestions = [...suggestions, ...SKILL_MAP.video];
  }
  if (combined.includes('design') || combined.includes('logo') || combined.includes('brand') || combined.includes('ui') || combined.includes('ux')) {
    suggestions = [...suggestions, ...SKILL_MAP.design];
  }
  if (combined.includes('act') || combined.includes('perform') || combined.includes('voice')) {
    suggestions = [...suggestions, ...SKILL_MAP.acting];
  }
  if (combined.includes('photo') || combined.includes('art') || combined.includes('visual')) {
    suggestions = [...suggestions, ...SKILL_MAP.photography];
  }
  if (combined.includes('fashion') || combined.includes('beauty') || combined.includes('style')) {
    suggestions = [...suggestions, ...SKILL_MAP.fashion];
  }
  if (combined.includes('social') || combined.includes('digital') || combined.includes('creator')) {
    suggestions = [...suggestions, ...SKILL_MAP.digital];
  }

  if (suggestions.length === 0) {
    if (category.includes('Writing')) suggestions = SKILL_MAP.writing;
    else if (category.includes('Music')) suggestions = SKILL_MAP.music;
    else if (category.includes('Film') || category.includes('TV')) suggestions = SKILL_MAP.video;
    else if (category.includes('Design')) suggestions = SKILL_MAP.design;
    else if (category.includes('Acting')) suggestions = SKILL_MAP.acting;
  }

  return [...new Set(suggestions)];
};

const NewCollab = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const targetCircleId = queryParams.get('circleId');

  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: BUDGET_RANGES[0],
    fixedAmount: '',
    category: CATEGORIES[0],
    locationType: 'REMOTE',
    country: '',
    state: '',
    projectType: 'ONE_OFF',
    experienceLevel: 'INTERMEDIATE',
    duration: '',
    deadline: '',
    crossPostToFeed: false,
    requirements: [],
    attachments: []
  });

  const [reqInput, setReqInput] = useState('');

  const addRequirement = () => {
    if (reqInput.trim()) {
      if (!formData.requirements.includes(reqInput.trim())) {
        setFormData({ ...formData, requirements: [...formData.requirements, reqInput.trim()] });
      }
      setReqInput('');
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      const fd = new FormData();
      files.forEach(f => fd.append('media', f));
      const res = await axios.post('/api/upload', fd, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}` 
        }
      });
      setFormData({ ...formData, attachments: [...formData.attachments, ...res.data.files] });
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const finalLocation = formData.locationType === 'REMOTE' 
      ? 'Remote' 
      : `${formData.state}, ${formData.country}`;

    const finalBudget = formData.budget === 'Custom Fixed Price' 
      ? `₦${formData.fixedAmount}` 
      : formData.budget;

    try {
      await axios.post('/api/collabs', {
        ...formData,
        location: finalLocation,
        budget: finalBudget,
        targetCircleId: targetCircleId || undefined
      }, {
         headers: { Authorization: `Bearer ${token}` }
      });
      navigate('/collabs');
    } catch (err) {
      alert('Failed to post collab. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 px-4">
      <button 
        onClick={() => navigate('/collabs')}
        className="flex items-center gap-2 text-[var(--text-secondary)] font-black text-[10px] uppercase tracking-widest mb-6 hover:text-[#7B5CFA] transition mt-6"
      >
        <ChevronLeft size={16} /> Cancel & Return
      </button>

      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-[var(--text-primary)] tracking-tighter leading-tight flex items-center gap-3">
            Create Collab
          </h1>
          <p className="text-[var(--text-secondary)] text-sm md:text-base font-medium mt-2">Design a posting that attracts top creative talent.</p>
        </div>
        
        <div className="bg-[var(--bg-surface-alt)] border border-[#7B5CFA]/20 px-4 py-3 rounded-2xl flex items-center gap-4 text-left shadow-lg shadow-[#7B5CFA]/5">
           <div className="bg-[#7B5CFA]/10 p-2.5 rounded-xl text-[#7B5CFA]"><ShieldCheck size={24} /></div>
           <div>
              <p className="text-[10px] text-[#7B5CFA] font-black uppercase tracking-widest">Client Protection</p>
              <p className="text-[var(--text-primary)] text-sm font-bold mt-0.5">Payment held safely in escrow</p>
           </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Section 1: Basic Information */}
        <div className="bg-[var(--bg-base)] border border-[var(--border-primary)] rounded-[2.5rem] p-8 md:p-10 shadow-sm relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-[#7B5CFA]/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
           <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 rounded-full bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] flex items-center justify-center text-[var(--text-primary)] font-black text-sm">1</div>
              <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Project Overview</h2>
           </div>

           <div className="space-y-6 relative z-10">
              <div>
                 <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-widest mb-2 block">Project Title</label>
                 <input 
                   required
                   value={formData.title}
                   onChange={(e) => setFormData({...formData, title: e.target.value})}
                   placeholder="e.g. Lead Singer for Afropop Track, UI Designer for Mobile App..."
                   className="w-full bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] rounded-2xl py-4 px-5 text-[15px] font-medium text-[var(--text-primary)] placeholder-[#5A6478] outline-none focus:border-[#7B5CFA]/40 transition-all shadow-inner"
                 />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                   <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-widest mb-2 block">Category</label>
                   <select 
                     value={formData.category}
                     onChange={(e) => setFormData({...formData, category: e.target.value})}
                     className="w-full bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] rounded-2xl py-4 px-5 text-[14px] font-medium text-[var(--text-primary)] outline-none focus:border-[#7B5CFA]/40 transition-all cursor-pointer appearance-none"
                   >
                     {CATEGORIES.map(cat => (
                       <option key={cat} value={cat}>{cat}</option>
                     ))}
                   </select>
                 </div>
                 <div>
                   <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-widest mb-2 block">Project Type</label>
                   <select 
                     value={formData.projectType}
                     onChange={(e) => setFormData({...formData, projectType: e.target.value})}
                     className="w-full bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] rounded-2xl py-4 px-5 text-[14px] font-medium text-[var(--text-primary)] outline-none focus:border-[#7B5CFA]/40 transition-all cursor-pointer appearance-none"
                   >
                     <option value="ONE_OFF">One-off Project</option>
                     <option value="RECURRING">Recurring / Long Term</option>
                   </select>
                 </div>
              </div>

              <div>
                 <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-widest mb-2 block">Detailed Description</label>
                 <textarea 
                   required
                   value={formData.description}
                   onChange={(e) => setFormData({...formData, description: e.target.value})}
                   placeholder="Describe the scope of work, deliverables, and what you expect from the freelancer..."
                   className="w-full h-40 bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] rounded-2xl py-4 px-5 text-[14px] font-medium text-[var(--text-primary)] placeholder-[#5A6478] outline-none focus:border-[#7B5CFA]/40 transition-all shadow-inner resize-none leading-relaxed"
                 />
              </div>
           </div>
        </div>

        {/* Section 2: Skills & Requirements */}
        <div className="bg-[var(--bg-base)] border border-[var(--border-primary)] rounded-[2.5rem] p-8 md:p-10 shadow-sm relative overflow-hidden">
           <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 rounded-full bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] flex items-center justify-center text-[var(--text-primary)] font-black text-sm">2</div>
              <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Skills & Requirements</h2>
           </div>

           <div className="space-y-6">
              <div>
                 <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-widest mb-2 block">Search Skills</label>
                 <div className="flex gap-2">
                    <div className="relative flex-1">
                       <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                       <input 
                         value={reqInput}
                         onChange={(e) => setReqInput(e.target.value)}
                         onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                         placeholder="e.g. Figma, Vocal Tuning, Storyboarding"
                         className="w-full bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] rounded-2xl py-4 pl-12 pr-5 text-[14px] font-medium text-[var(--text-primary)] placeholder-[#5A6478] outline-none focus:border-[#7B5CFA]/40 transition-all shadow-inner"
                       />
                    </div>
                    <button 
                      type="button" 
                      onClick={addRequirement}
                      className="bg-[#7B5CFA]/10 text-[#7B5CFA] px-6 rounded-2xl hover:bg-[#7B5CFA]/20 transition-all font-black text-xs uppercase tracking-widest flex items-center justify-center border border-[#7B5CFA]/20"
                    >
                       Add
                    </button>
                 </div>

                 {formData.requirements.length > 0 && (
                   <div className="flex flex-wrap gap-2 mt-4 p-4 bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] rounded-2xl">
                      {formData.requirements.map((req, i) => (
                        <motion.div 
                           initial={{ scale: 0.9, opacity: 0 }}
                           animate={{ scale: 1, opacity: 1 }}
                           key={i} 
                           className="bg-[#7B5CFA]/10 text-[#7B5CFA] border border-[#7B5CFA]/20 text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-2"
                        >
                           {req}
                           <button type="button" onClick={() => setFormData({...formData, requirements: formData.requirements.filter((_, idx) => idx !== i)})} className="hover:text-[var(--text-primary)] transition">
                             <X size={12} />
                           </button>
                        </motion.div>
                      ))}
                   </div>
                 )}
              </div>

              <div className="pt-2">
                 <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Sparkles size={12} className="text-[#7B5CFA]" /> Suggested Skills
                 </p>
                 <div className="flex flex-wrap gap-2">
                    {getRecommendedSkills(formData.title, formData.category)
                      .filter(skill => !formData.requirements.includes(skill))
                      .slice(0, 10)
                      .map((skill, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setFormData(p => ({ ...p, requirements: [...p.requirements, skill] }))}
                          className="bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] px-3 py-2 rounded-xl text-[11px] font-bold text-[var(--text-secondary)] hover:border-[#7B5CFA]/40 hover:text-[var(--text-primary)] transition-all flex items-center gap-1.5"
                        >
                           {skill} <Plus size={12} className="opacity-50" />
                        </button>
                      ))}
                 </div>
              </div>

              <div>
                 <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-widest mb-2 block">Required Experience Level</label>
                 <select 
                   value={formData.experienceLevel}
                   onChange={(e) => setFormData({...formData, experienceLevel: e.target.value})}
                   className="w-full bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] rounded-2xl py-4 px-5 text-[14px] font-medium text-[var(--text-primary)] outline-none focus:border-[#7B5CFA]/40 transition-all cursor-pointer appearance-none"
                 >
                    <option value="ANY">Any Experience Level</option>
                    <option value="BEGINNER">Beginner / Junior</option>
                    <option value="INTERMEDIATE">Intermediate / Mid-level</option>
                    <option value="EXPERT">Expert / Senior</option>
                 </select>
              </div>
           </div>
        </div>

        {/* Section 3: Budget & Details */}
        <div className="bg-[var(--bg-base)] border border-[var(--border-primary)] rounded-[2.5rem] p-8 md:p-10 shadow-sm relative overflow-hidden">
           <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 rounded-full bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] flex items-center justify-center text-[var(--text-primary)] font-black text-sm">3</div>
              <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Budget & Timeline</h2>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div>
                   <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-widest mb-2 block">Budget Range</label>
                   <select 
                     value={formData.budget}
                     onChange={(e) => setFormData({...formData, budget: e.target.value})}
                     className="w-full bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] rounded-2xl py-4 px-5 text-[14px] font-medium text-[var(--text-primary)] outline-none focus:border-[#7B5CFA]/40 transition-all cursor-pointer appearance-none"
                   >
                     {BUDGET_RANGES.map(range => (
                       <option key={range} value={range}>{range}</option>
                     ))}
                   </select>
                </div>
                
                {formData.budget === 'Custom Fixed Price' && (
                  <div>
                     <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-widest mb-2 block">Fixed Amount (₦)</label>
                     <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                        <input 
                          type="number"
                          required
                          value={formData.fixedAmount}
                          onChange={(e) => setFormData({...formData, fixedAmount: e.target.value})}
                          placeholder="0.00"
                          className="w-full bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] rounded-2xl py-4 pl-12 pr-5 text-[14px] font-medium text-[var(--text-primary)] outline-none focus:border-[#7B5CFA]/40 transition-all"
                        />
                     </div>
                  </div>
                )}

                <div>
                   <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-widest mb-2 block">Work Location</label>
                   <select 
                     value={formData.locationType}
                     onChange={(e) => setFormData({...formData, locationType: e.target.value})}
                     className="w-full bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] rounded-2xl py-4 px-5 text-[14px] font-medium text-[var(--text-primary)] outline-none focus:border-[#7B5CFA]/40 transition-all cursor-pointer appearance-none"
                   >
                      <option value="REMOTE">Remote Work</option>
                      <option value="IN_PERSON">In-Person / On-site</option>
                   </select>
                </div>

                {formData.locationType === 'IN_PERSON' && (
                   <div className="grid grid-cols-2 gap-4">
                      <input 
                        required placeholder="State/Region" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})}
                        className="bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] rounded-2xl py-4 px-5 text-[14px] font-medium text-[var(--text-primary)] outline-none focus:border-[#7B5CFA]/40 transition-all"
                      />
                      <input 
                        required placeholder="Country" value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})}
                        className="bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] rounded-2xl py-4 px-5 text-[14px] font-medium text-[var(--text-primary)] outline-none focus:border-[#7B5CFA]/40 transition-all"
                      />
                   </div>
                )}
              </div>

              <div className="space-y-6">
                 <div>
                   <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-widest mb-2 block">Expected Duration (Optional)</label>
                   <input 
                     value={formData.duration}
                     onChange={(e) => setFormData({...formData, duration: e.target.value})}
                     placeholder="e.g. 2 weeks, 1 month, Ongoing"
                     className="w-full bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] rounded-2xl py-4 px-5 text-[14px] font-medium text-[var(--text-primary)] outline-none focus:border-[#7B5CFA]/40 transition-all"
                   />
                 </div>
                 
                 <div>
                   <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-widest mb-2 block">Deadline for Proposals (Optional)</label>
                   <input 
                     type="date"
                     value={formData.deadline}
                     onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                     className="w-full bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] rounded-2xl py-4 px-5 text-[14px] font-medium text-[var(--text-primary)] outline-none focus:border-[#7B5CFA]/40 transition-all cursor-pointer"
                   />
                 </div>
              </div>
           </div>
        </div>

        {/* Section 4: Attachments & Final */}
        <div className="bg-[var(--bg-base)] border border-[var(--border-primary)] rounded-[2.5rem] p-8 md:p-10 shadow-sm relative overflow-hidden">
           <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 rounded-full bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] flex items-center justify-center text-[var(--text-primary)] font-black text-sm">4</div>
              <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Reference Media</h2>
           </div>

           <div>
              <p className="text-sm text-[var(--text-secondary)] mb-4">Attach brand guidelines, moodboards, project briefs, or audio/video files.</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                 {formData.attachments.map((att, i) => (
                   <div key={i} className="aspect-square bg-[var(--bg-surface-alt)] rounded-2xl border border-[var(--border-primary)] relative group overflow-hidden">
                      <img src={att.url} className="w-full h-full object-cover opacity-80" alt="" />
                      <button 
                         type="button"
                         onClick={() => setFormData({...formData, attachments: formData.attachments.filter((_, idx) => idx !== i)})}
                         className="absolute top-2 right-2 bg-black/60 text-[var(--text-primary)] p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                         <X size={14} />
                      </button>
                   </div>
                 ))}
                 
                 <label className="aspect-square bg-[var(--bg-surface-alt)] border-2 border-dashed border-[var(--border-primary)] rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-[#7B5CFA]/40 transition-all group">
                    <Paperclip size={24} className="text-[var(--text-muted)] group-hover:text-[#7B5CFA] transition-colors mb-2" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">{uploading ? 'Wait...' : 'Add Files'}</span>
                    <input type="file" multiple className="hidden" onChange={handleFileUpload} disabled={uploading} />
                 </label>
              </div>
           </div>

           <label className="flex items-start gap-4 p-6 bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] rounded-3xl cursor-pointer hover:border-[#7B5CFA]/30 transition-all mt-8 group">
              <div className="pt-0.5">
                 <input 
                   type="checkbox" 
                   checked={formData.crossPostToFeed}
                   onChange={(e) => setFormData({...formData, crossPostToFeed: e.target.checked})}
                   className="w-5 h-5 rounded bg-[var(--bg-base)] border-[var(--border-primary)] text-[#7B5CFA] focus:ring-[#7B5CFA]"
                 />
              </div>
              <div>
                 <p className="font-bold text-[var(--text-primary)] group-hover:text-[#7B5CFA] transition-colors flex items-center gap-2">
                    Boost visibility in the Community Feed
                 </p>
                 <p className="text-sm text-[var(--text-secondary)] mt-1 font-medium">
                    This will create a dedicated post in the main community tab so more creatives can discover your project.
                 </p>
              </div>
           </label>
        </div>

        <div className="pt-6">
           <button 
             type="submit"
             disabled={loading || uploading}
             className="w-full bg-[#7B5CFA] text-white py-5 rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-[#7B5CFA]/20 flex items-center justify-center gap-3 disabled:opacity-50 hover:bg-[#6B4CE0] transition-colors text-lg"
           >
             {loading ? <Loader2 className="animate-spin" size={24} /> : <><Send size={20} /> Publish Collab</>}
           </button>
        </div>
      </form>
    </div>
  );
};

export default NewCollab;
