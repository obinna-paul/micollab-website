import React from 'react';
import { motion } from 'framer-motion';
import { X, Download, Share2 } from 'lucide-react';

const PhotoViewerModal = ({ onClose, photoUrl, title }) => {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/95 backdrop-blur-xl cursor-zoom-out"
        onClick={onClose}
      />
      
      {/* Controls */}
      <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-10">
        <div className="flex flex-col">
          <h3 className="text-white font-black text-lg tracking-tight">{title}</h3>
          <p className="text-white/50 text-[10px] font-black uppercase tracking-widest">Full Resolution View</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition backdrop-blur-md">
            <Download size={20} />
          </button>
          <button className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition backdrop-blur-md">
            <Share2 size={20} />
          </button>
          <button 
            onClick={onClose}
            className="p-3 bg-white text-black rounded-2xl hover:scale-110 transition shadow-xl ml-2"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Image Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative max-w-[90vw] max-h-[80vh] rounded-3xl overflow-hidden shadow-2xl border border-white/10 z-10"
      >
        <img 
          src={photoUrl} 
          alt="Full Resolution" 
          className="w-full h-full object-contain"
        />
      </motion.div>
    </div>
  );
};

export default PhotoViewerModal;
