import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Grid, Bookmark, FileEdit, Settings, 
  BarChart2, ShieldCheck, RefreshCw, LogOut, X, Layers 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

const MobileDrawer = ({ isOpen, onClose }) => {
  const { user, logout } = useAuthStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150]"
          />
          
          {/* Drawer */}
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 w-[80%] max-w-sm bg-[var(--bg-surface)] z-[160] shadow-2xl flex flex-col"
          >
            {/* Header / Profile Shortcut */}
            <div className="p-6 border-b border-[var(--border-primary)] bg-[#7B5CFA]/5">
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 rounded-2xl border-4 border-[var(--bg-base)] shadow-md overflow-hidden bg-[var(--bg-base)]">
                  <img 
                    src={user?.profileImage || `https://ui-avatars.com/api/?name=${user?.username}&background=7B5CFA&color=fff`} 
                    className="w-full h-full object-cover" 
                    alt="" 
                  />
                </div>
                <button onClick={onClose} className="p-2 hover:bg-[var(--bg-surface-alt)] rounded-full transition">
                  <X size={20} className="text-[var(--text-secondary)]" />
                </button>
              </div>
              <h3 className="font-black text-xl text-[var(--text-primary)] tracking-tight">@{user?.username}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#7B5CFA]">Reputation: {user?.reputationScore || 0}</span>
                <span className="w-1 h-1 bg-[var(--border-primary)] rounded-full" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">{user?.profileType || 'Creator'}</span>
              </div>
            </div>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto py-4">
              <div className="px-4 space-y-1">
                <DrawerItem icon={User} label="My Profile" to={`/profile/${user?.username}`} onClick={onClose} />
                <DrawerItem icon={Grid} label="Portfolio" to={`/profile/${user?.username}`} onClick={onClose} />
                <DrawerItem icon={Layers} label="My Circles" to="/network" onClick={onClose} />
                <DrawerItem icon={Bookmark} label="Saved Inspo" to="#" onClick={onClose} />
                <DrawerItem icon={FileEdit} label="Drafts" to="#" onClick={onClose} />
              </div>

              <div className="my-4 border-t border-[var(--border-primary)]" />

              <div className="px-4 space-y-1">
                <DrawerItem icon={BarChart2} label="Analytics" to="#" onClick={onClose} />
                <DrawerItem icon={ShieldCheck} label="Verification" to="#" onClick={onClose} />
                <DrawerItem icon={Settings} label="Settings" to="#" onClick={onClose} />
              </div>

              <div className="my-4 border-t border-[var(--border-primary)]" />

              <div className="px-4 space-y-1">
                <DrawerItem icon={RefreshCw} label="Switch Mode" to="#" onClick={onClose} />
                <button 
                  onClick={logout}
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-red-500 font-bold hover:bg-red-500/10 transition"
                >
                  <LogOut size={22} />
                  <span className="text-sm">Logout</span>
                </button>
              </div>
            </div>
            
            <div className="p-6 border-t border-[var(--border-primary)]">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)]/50 text-center">Micollab Mobile v1.0</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const DrawerItem = ({ icon: Icon, label, to, onClick }) => (
  <Link 
    to={to} 
    onClick={onClick}
    className="flex items-center gap-4 px-4 py-3 rounded-2xl text-[var(--text-primary)] font-bold hover:bg-[#7B5CFA]/10 hover:text-[#7B5CFA] transition group"
  >
    <Icon size={22} className="text-[var(--text-secondary)] group-hover:text-[#7B5CFA] transition-colors" />
    <span className="text-sm">{label}</span>
  </Link>
);

export default MobileDrawer;
