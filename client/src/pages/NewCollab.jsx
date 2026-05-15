import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  Briefcase, Send, MapPin, DollarSign, List, 
  ChevronLeft, Loader2, Sparkles, AlertCircle, Share2,
  Plus, X, Paperclip, Calendar, Clock, Search
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

  // Fallback to category-based if no title match
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
      setFormData({ ...formData, requirements: [...formData.requirements, reqInput.trim()] });
      setReqInput('');
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    setUploading(true);
    try {
      const fd = new FormData();
      files.forEach(f => fd.append('media', f));
      const res = await axios.post('http://localhost:5000/api/upload', fd, {
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
      await axios.post('http://localhost:5000/api/collabs', {
        ...formData,
        location: finalLocation,
        budget: finalBudget
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
    <div className="max-w-3xl mx-auto pb-20 px-4">
      <button 
        onClick={() => navigate('/collabs')}
        className="flex items-center gap-2 text-textMuted font-black text-[10px] uppercase tracking-widest mb-10 hover:text-primary transition"
      >
        <ChevronLeft size={16} /> Exit Editor
      </button>

      <div className="bg-white border border-divider rounded-[40px] p-10 shadow-2xl shadow-primary/5">
        <div className="mb-12">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6">
             <Sparkles size={32} />
          </div>
          <h1 className="text-4xl font-black text-textMain tracking-tighter leading-tight">
            Launch a New <span className="text-primary">Collab</span>
          </h1>
          <p className="text-textMuted text-sm font-medium mt-2">Design a collab that attracts the best creative talent.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Section 1: Basic Info */}
          <section className="space-y-6">
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-textMuted tracking-widest ml-1">Collab Title</label>
                <input 
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g. Lead Singer for Afropop Track"
                  className="w-full bg-gray-50 border border-divider rounded-2xl py-5 px-6 text-base font-black text-textMain outline-none focus:border-primary transition-all shadow-sm"
                />
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-textMuted tracking-widest ml-1">Category</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full bg-gray-50 border border-divider rounded-2xl py-5 px-6 text-sm font-black text-textMain outline-none focus:border-primary transition-all"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-textMuted tracking-widest ml-1">Budget Allocation</label>
                  <select 
                    value={formData.budget}
                    onChange={(e) => setFormData({...formData, budget: e.target.value})}
                    className="w-full bg-gray-50 border border-divider rounded-2xl py-5 px-6 text-sm font-black text-textMain outline-none focus:border-primary transition-all"
                  >
                    {BUDGET_RANGES.map(range => (
                      <option key={range} value={range}>{range}</option>
                    ))}
                  </select>
                  
                  {formData.budget === 'Custom Fixed Price' && (
                    <div className="relative mt-2">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-textMain">₦</span>
                      <input 
                        type="number"
                        required
                        value={formData.fixedAmount}
                        onChange={(e) => setFormData({...formData, fixedAmount: e.target.value})}
                        placeholder="Enter amount"
                        className="w-full bg-gray-50 border border-divider rounded-2xl py-5 pl-12 pr-6 text-sm font-black text-textMain outline-none focus:border-primary transition-all"
                      />
                    </div>
                  )}
                </div>
             </div>
          </section>

          {/* Section 2: Requirements */}
          <section className="space-y-6">
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-textMuted tracking-widest ml-1">Required Creative Skills</label>
                
                <div className="flex gap-2 mb-4">
                   <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-textMuted" size={18} />
                      <input 
                        value={reqInput}
                        onChange={(e) => setReqInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                        placeholder="Search skills or add your own"
                        className="w-full bg-gray-50 border border-divider rounded-2xl py-4 pl-12 pr-6 text-sm font-medium outline-none focus:border-primary transition-all shadow-sm"
                      />
                   </div>
                   <button 
                     type="button" 
                     onClick={addRequirement}
                     className="bg-primary/10 text-primary p-4 rounded-2xl hover:bg-primary/20 transition-all border border-primary/10"
                   >
                      <Plus size={24} />
                   </button>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                   {formData.requirements.map((req, i) => (
                     <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        key={i} 
                        className="bg-primary text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl flex items-center gap-2 shadow-md shadow-primary/10"
                     >
                        {req}
                        <X size={14} className="cursor-pointer hover:bg-white/20 rounded-full p-0.5" onClick={() => setFormData({...formData, requirements: formData.requirements.filter((_, idx) => idx !== i)})} />
                     </motion.div>
                   ))}
                </div>

                {/* Intelligent Recommendations */}
                <div className="pt-4 border-t border-divider/50">
                   <p className="text-[9px] font-black text-textMuted uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Sparkles size={12} className="text-primary" /> Recommended based on your title
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
                            className="bg-white border border-divider px-4 py-2.5 rounded-2xl text-[11px] font-black text-textMain hover:border-primary hover:text-primary hover:bg-primary/5 transition-all flex items-center gap-2 group"
                          >
                             {skill} <Plus size={14} className="text-textMuted group-hover:text-primary transition-colors" />
                          </button>
                        ))}
                   </div>
                   <p className="text-[9px] text-textMuted font-medium mt-4">Tip: Adding 3-5 specific skills helps attract the right collaborators.</p>
                </div>
             </div>
          </section>

          {/* Section 3: Context & Reference */}
          <section className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-textMuted tracking-widest ml-1">Experience Level</label>
                   <select 
                     value={formData.experienceLevel}
                     onChange={(e) => setFormData({...formData, experienceLevel: e.target.value})}
                     className="w-full bg-gray-50 border border-divider rounded-2xl py-5 px-6 text-sm font-black text-textMain outline-none focus:border-primary transition-all"
                   >
                      <option value="ANY">Any Experience</option>
                      <option value="BEGINNER">Beginner / Aspiring</option>
                      <option value="INTERMEDIATE">Intermediate / Professional</option>
                      <option value="EXPERT">Expert / Specialist</option>
                   </select>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-textMuted tracking-widest ml-1">Deadline for Proposals</label>
                   <input 
                     type="date"
                     value={formData.deadline}
                     onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                     className="w-full bg-gray-50 border border-divider rounded-2xl py-5 px-6 text-sm font-black text-textMain outline-none focus:border-primary transition-all"
                   />
                </div>
             </div>

             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-textMuted tracking-widest ml-1">Collab Overview</label>
                <textarea 
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Explain the vision, specific deliverables, and what you're looking for in a collaborator..."
                  className="w-full h-48 bg-gray-50 border border-divider rounded-2xl p-6 text-base font-medium outline-none focus:border-primary resize-none transition-all leading-relaxed"
                />
             </div>
          </section>

          {/* Section 4: Attachments */}
          <section className="space-y-4">
             <label className="text-[10px] font-black uppercase text-textMuted tracking-widest ml-1 block">Reference Media & Attachments</label>
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {formData.attachments.map((att, i) => (
                  <div key={i} className="aspect-square bg-gray-50 rounded-2xl border border-divider relative group overflow-hidden">
                     <img src={att.url} className="w-full h-full object-cover" alt="" />
                     <button 
                        type="button"
                        onClick={() => setFormData({...formData, attachments: formData.attachments.filter((_, idx) => idx !== i)})}
                        className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                     >
                        <X size={14} />
                     </button>
                  </div>
                ))}
                <label className="aspect-square bg-gray-50 border-2 border-dashed border-divider rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-all text-textMuted gap-2">
                   <Paperclip size={24} />
                   <span className="text-[10px] font-black uppercase tracking-tighter">{uploading ? 'Uploading...' : 'Add Files'}</span>
                   <input type="file" multiple className="hidden" onChange={handleFileUpload} disabled={uploading} />
                </label>
             </div>
          </section>

          {/* Share to Feed */}
          <label className="flex items-start gap-4 p-8 bg-primary/5 border border-primary/20 rounded-[30px] cursor-pointer hover:bg-primary/10 transition-all group">
             <div className="pt-1">
                <input 
                  type="checkbox" 
                  checked={formData.crossPostToFeed}
                  onChange={(e) => setFormData({...formData, crossPostToFeed: e.target.checked})}
                  className="w-6 h-6 rounded-lg border-primary text-primary focus:ring-primary"
                />
             </div>
             <div>
                <p className="font-black text-lg text-textMain group-hover:text-primary transition-colors flex items-center gap-2">
                   <Share2 size={20} /> Boost with Feed Announcement
                </p>
                <p className="text-sm text-textMuted mt-1 font-medium">
                   Create a high-visibility activity card in the main community feed to alert your entire network immediately.
                </p>
             </div>
          </label>

          <button 
            type="submit"
            disabled={loading || uploading}
            className="w-full btn-primary py-6 rounded-3xl shadow-2xl shadow-primary/25 flex items-center justify-center gap-3 font-black uppercase tracking-widest text-lg disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : <><Send size={24} /> Publish Collab</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewCollab;
