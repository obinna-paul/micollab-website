import React from 'react';
import { motion } from 'framer-motion';
import { X, Eye, Upload, Trash2 } from 'lucide-react';

const PhotoActionModal = ({ isOpen, onClose, onAction, title, hasPhoto, type }) => {
  if (!isOpen) return null;
  const actions = [
    ...(type === 'avatar' && hasPhoto ? [{ id: 'VIEW', label: 'View Photo', icon: Eye, color: 'text-textMain' }] : []),
    { id: 'UPLOAD', label: hasPhoto ? 'Change Photo' : 'Upload Photo', icon: Upload, color: 'text-primary' },
    ...(hasPhoto ? [{ id: 'DELETE', label: 'Remove Photo', icon: Trash2, color: 'text-red-500' }] : [])
  ];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      
      {/* Modal Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-divider flex items-center justify-between">
          <h3 className="text-sm font-black text-textMain uppercase tracking-widest">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition text-textMuted">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-2">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={() => {
                onAction(action.id);
                onClose();
              }}
              className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-gray-50 transition-all group ${action.color}`}
            >
              <div className="p-2 rounded-xl bg-gray-50 group-hover:bg-white shadow-sm transition">
                <action.icon size={20} />
              </div>
              <span className="font-bold text-sm">{action.label}</span>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default PhotoActionModal;
