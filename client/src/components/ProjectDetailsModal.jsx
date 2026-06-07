import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Star, Globe, Calendar, Briefcase, 
  Tag, Users, ChevronLeft, ChevronRight, Play, Maximize2 
} from 'lucide-react';
import { Link } from 'react-router-dom';

const ProjectDetailsModal = ({ isOpen, onClose, project }) => {
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  
  if (!isOpen || !project) return null;

  const currentMedia = project.media[activeMediaIndex];
  const isVideo = currentMedia?.type === 'VIDEO' || currentMedia?.url?.match(/\.(mp4|webm|mov|mkv)$/i);
  const isAudio = currentMedia?.type === 'AUDIO' || currentMedia?.url?.match(/\.(mp3|wav|ogg|aac)$/i);

  const nextMedia = () => {
    setActiveMediaIndex((prev) => (prev + 1) % project.media.length);
  };

  const prevMedia = () => {
    setActiveMediaIndex((prev) => (prev - 1 + project.media.length) % project.media.length);
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/95 backdrop-blur-xl"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-6xl bg-[var(--bg-base)] md:bg-[var(--bg-surface-alt)] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh] border border-[var(--border-secondary)]"
      >
        {/* Left: Media Display */}
        <div className="flex-[1.5] bg-black flex flex-col relative group">
          <div className="flex-1 flex items-center justify-center relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div 
                key={activeMediaIndex}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full h-full"
              >
                {isAudio ? (
                  <div className="flex flex-col items-center justify-center p-12 bg-gray-900 rounded-3xl border border-[var(--border-secondary)] w-full max-w-lg">
                    <div className="w-24 h-24 bg-[#7B5CFA]/20 rounded-full flex items-center justify-center text-[#7B5CFA] mb-6 animate-pulse">
                      <Play size={48} fill="currentColor" />
                    </div>
                    <audio 
                      src={currentMedia.url} 
                      controls 
                      className="w-full"
                    />
                    <p className="text-[var(--text-primary)]/50 text-[10px] font-black uppercase tracking-widest mt-6">Audio Asset Preview</p>
                  </div>
                ) : isVideo ? (
                  <video 
                    src={currentMedia.url} 
                    controls 
                    autoPlay
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <img 
                    src={currentMedia.url} 
                    className="w-full h-full object-contain"
                    alt={project.title}
                  />
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation Arrows */}
            {project.media.length > 1 && (
              <>
                <button 
                  onClick={prevMedia}
                  className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-[var(--text-primary)] transition-all opacity-0 group-hover:opacity-100"
                >
                  <ChevronLeft size={24} />
                </button>
                <button 
                  onClick={nextMedia}
                  className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-[var(--text-primary)] transition-all opacity-0 group-hover:opacity-100"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}

            {/* Media Counter */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-black/40 backdrop-blur-md rounded-full text-[var(--text-primary)] text-[10px] font-black uppercase tracking-widest border border-[var(--border-secondary)]">
              {activeMediaIndex + 1} / {project.media.length}
            </div>
          </div>

          <div className="h-20 bg-black/20 border-t border-[var(--border-primary)] flex items-center gap-2 px-6 overflow-x-auto no-scrollbar">
            {project.media.map((m, i) => (
              <button 
                key={i} 
                onClick={() => setActiveMediaIndex(i)}
                className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                  activeMediaIndex === i ? 'border-[#7B5CFA] scale-110 shadow-[0_0_15px_rgba(123,92,250,0.3)]' : 'border-transparent opacity-50'
                }`}
              >
                <img src={m.url} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Right: Info Panel */}
        <div className="flex-1 flex flex-col bg-[var(--bg-base)] md:bg-[var(--bg-surface-alt)] border-l border-[var(--border-primary)]">
          {/* Header */}
          <div className="p-8 pb-6 border-b border-[var(--border-primary)]">
            <div className="flex justify-between items-start mb-4">
              <span className="px-4 py-1 bg-[#7B5CFA]/10 text-[#7B5CFA] text-[10px] font-black uppercase tracking-tighter rounded-full border border-[#7B5CFA]/20">
                {project.category}
              </span>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition">
                <X size={24} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" />
              </button>
            </div>
            <h2 className="text-3xl font-black text-[var(--text-primary)] tracking-tight mb-2 leading-tight">
              {project.title}
            </h2>
            <div className="flex items-center gap-4 text-[var(--text-secondary)]">
              <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest">
                <Calendar size={12} className="text-[#7B5CFA]" /> {new Date(project.createdAt).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest">
                <Briefcase size={12} className="text-[#7B5CFA]" /> {project.projectType}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-8 space-y-8">
            {/* Description */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest flex items-center gap-2">
                Project Background <div className="h-px flex-1 bg-white/5"></div>
              </h4>
              <p className="text-sm text-[var(--text-primary)] leading-relaxed font-medium whitespace-pre-wrap">
                {project.description || "No project description provided."}
              </p>
            </div>

            {/* Collaborators */}
            {project.credits?.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest flex items-center gap-2">
                  Credits <div className="h-px flex-1 bg-white/5"></div>
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  {project.credits.map((credit, i) => (
                    <Link 
                      key={i} to={`/profile/${credit.user.username}`}
                      className="flex items-center justify-between p-3 bg-[var(--bg-base)] border border-[var(--border-primary)] rounded-2xl hover:border-[#7B5CFA] transition group"
                    >
                      <div className="flex items-center gap-3">
                        <img src={credit.user.profileImage} className="w-10 h-10 rounded-full" />
                        <div>
                          <p className="text-xs font-black text-[var(--text-primary)] group-hover:text-[#7B5CFA] transition">@{credit.user.username}</p>
                          <p className="text-[9px] text-[var(--text-secondary)] font-bold uppercase">{credit.user.profileType}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-[var(--text-primary)] uppercase">{credit.role}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {project.tags?.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest flex items-center gap-2">
                  Tags <div className="h-px flex-1 bg-white/5"></div>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag, i) => (
                    <span key={i} className="px-3 py-1.5 bg-[var(--bg-base)] border border-[var(--border-primary)] rounded-full text-[10px] font-black uppercase text-[var(--text-secondary)]">
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-8 pt-6 border-t border-[var(--border-primary)] bg-[var(--bg-base)] flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <p className="text-sm font-black text-[var(--text-primary)]">{project.viewCount || 0}</p>
                <p className="text-[9px] text-[var(--text-secondary)] font-black uppercase tracking-widest">Views</p>
              </div>
              <div className="flex flex-col border-l border-[var(--border-primary)] pl-6">
                <p className="text-sm font-black text-[var(--text-primary)]">{project.media.length}</p>
                <p className="text-[9px] text-[var(--text-secondary)] font-black uppercase tracking-widest">Assets</p>
              </div>
            </div>
            <button className="px-8 py-3 bg-[#7B5CFA] text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-[#684CE0] transition shadow-[0_0_15px_rgba(123,92,250,0.3)] flex items-center gap-2">
               Appreciate <Star size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProjectDetailsModal;
