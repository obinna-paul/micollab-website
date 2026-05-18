import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Home, Users, Briefcase, MessageSquare, Bell, LogOut, X, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../store/useAuthStore';
import FloatingChatWidget from './chat/FloatingChatWidget';
import MobileNav from './MobileNav';
import MobileDrawer from './MobileDrawer';
import CreatePost from './CreatePost';
import { MessageCircle } from 'lucide-react';

const NavItem = ({ to, icon: Icon, label, disabled }) => (
  <NavLink 
    to={disabled ? '#' : to} 
    className={({ isActive }) => `
      flex flex-col items-center justify-center gap-1 min-w-[80px] h-full transition-all border-b-2
      ${disabled ? 'opacity-30 cursor-not-allowed' : ''}
      ${isActive && !disabled ? 'border-primary text-primary' : 'border-transparent text-textMuted hover:text-textMain'}
    `}
  >
    <Icon size={24} />
    <span className="text-[10px] font-bold">{label}</span>
  </NavLink>
);

const MainLayout = ({ children }) => {
  const { user, token, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isCollabs = location.pathname === '/collabs';
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated && token) {
      const fetchUnread = async () => {
        try {
          const res = await axios.get('/api/notifications', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUnreadCount(res.data.filter(n => !n.isRead).length);
        } catch (err) {
          console.error(err);
        }
      };
      fetchUnread();
      const interval = setInterval(fetchUnread, 30000); // Poll every 30s
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, token]);

  return (
    <div className="min-h-screen bg-[#fafafa] transition-colors duration-500 pb-20 md:pb-0">
      {/* Top Navigation */}
      <header className="bg-surface border-b border-divider sticky top-0 z-50 h-14 flex items-center">
        <div className="max-w-6xl mx-auto px-4 w-full flex items-center justify-between">
          <Link to="/" className="hidden md:flex items-center gap-1">
            <div className="w-8 h-8 rounded flex items-center justify-center font-black text-white text-lg bg-primary">M</div>
            <h1 className="text-xl font-black tracking-tighter text-primary">Micollab</h1>
          </Link>

          {/* Mobile Profile Trigger */}
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="md:hidden w-8 h-8 rounded-full overflow-hidden border border-divider shadow-sm"
          >
            <img 
              src={user?.profileImage || `https://ui-avatars.com/api/?name=${user?.username}&background=f3f4f6&color=374151`} 
              className="w-full h-full object-cover" 
              alt="" 
            />
          </button>

          {/* Mobile Center Logo */}
          <Link to="/" className="md:hidden flex items-center gap-1">
            <div className="w-6 h-6 rounded flex items-center justify-center font-black text-white text-[10px] bg-primary">M</div>
            <h1 className="text-sm font-black tracking-tighter text-primary uppercase">Micollab</h1>
          </Link>

          <nav className="hidden md:flex h-full">
            <NavItem to="/" icon={Home} label="Home" />
            <NavItem to="/network" icon={Users} label="My Network" />
            <NavItem to="/circles" icon={Circle} label="Circle" />
            <NavItem to="/collabs" icon={Briefcase} label="Collabs" />
            <NavItem to="/messages" icon={MessageSquare} label="Messaging" />
            <div className="relative">
              <NavItem to="/notifications" icon={Bell} label="Notifications" />
              {unreadCount > 0 && (
                <div className="absolute top-2 right-4 w-2 h-2 bg-red-500 rounded-full border-2 border-surface animate-pulse" />
              )}
            </div>
          </nav>

          <div className="flex items-center gap-4">
             {isAuthenticated ? (
               <div className="flex items-center gap-2">
                 <button 
                  onClick={logout}
                  className="hidden md:p-2 text-textMuted hover:text-accent hover:bg-accent/5 rounded-full transition"
                 >
                    <LogOut size={20} />
                 </button>
                 
                 {/* Desktop Profile Link */}
                 <Link to={`/profile/${user?.username}`} className="hidden md:flex flex-col items-center">
                    <img 
                      src={user?.profileImage || `https://ui-avatars.com/api/?name=${user?.username}&background=f3f4f6&color=374151`} 
                      className="w-7 h-7 rounded-full border border-divider object-cover" 
                      alt="" 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://ui-avatars.com/api/?name=${user?.username}&background=f3f4f6&color=374151`;
                      }}
                    />
                    <span className="text-[10px] font-bold text-textMuted">Me ▼</span>
                 </Link>

                 {/* Mobile Message Icon */}
                 <Link to="/messages" className="md:hidden p-2 text-textMuted hover:text-primary transition relative">
                    <MessageCircle size={22} />
                    {unreadCount > 0 && (
                      <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-surface" />
                    )}
                 </Link>
               </div>
             ) : (
               <Link to="/login" className="btn-primary text-xs py-1">Sign In</Link>
             )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className={`mx-auto px-4 py-6 ${
        location.pathname.startsWith('/circles') ? 'max-w-7xl' : 'max-w-6xl'
      } ${isCollabs ? 'flex flex-col' : 'grid grid-cols-1 md:grid-cols-12 gap-6'}`}>
        
        {/* Left Sidebar - Profile Card (Only on Home) */}
        {isHome && (
          <aside className="hidden md:block md:col-span-3 space-y-4">
            <div className="card overflow-hidden">
              <div className="h-14 bg-primary/20" />
              <div className="px-4 pb-4 -mt-8 flex flex-col items-center text-center">
                <img 
                  src={user?.profileImage || `https://ui-avatars.com/api/?name=${user?.username}&background=f3f4f6&color=374151`} 
                  className="w-16 h-16 rounded-full border-2 border-white mb-3 shadow-sm bg-white object-cover" 
                  alt="" 
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://ui-avatars.com/api/?name=${user?.username}&background=f3f4f6&color=374151`;
                  }}
                />
                <Link to={`/profile/${user?.username}`} className="font-bold text-textMain hover:underline">
                  @{user?.username}
                </Link>
                <p className="text-xs text-textMuted mt-1">{user?.bio || 'Creative Professional'}</p>
                <div className="mt-3 flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-gray-100 text-textMuted">
                   {user?.profileType || 'Creator'}
                </div>
              </div>
              <div className="border-t border-divider p-3 space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-textMuted">Network Size</span>
                  <span className="text-primary font-bold">42</span>
                </div>
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-textMuted">Profile Views</span>
                  <span className="text-primary font-bold">128</span>
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Center - Main Content */}
        <main className={`space-y-4 ${
          (isCollabs || location.pathname.startsWith('/circles') || location.pathname === '/notifications' || location.pathname.startsWith('/profile')) ? 'col-span-12' : (isHome ? 'md:col-span-6' : 'md:col-span-9')
        }`}>
          {children}
        </main>

        {/* Right Sidebar - Discover Collabs (Visible except on Collabs, Circle, Notification, and Profile pages) */}
        {!isCollabs && !location.pathname.startsWith('/circles') && location.pathname !== '/notifications' && !location.pathname.startsWith('/profile') && (
          <aside className="hidden md:block md:col-span-3 space-y-4">
            <div className="card p-4">
              <h3 className="font-bold text-textMain text-sm mb-4">Discover Collabs</h3>
              <div className="space-y-4">
                 {[
                   { title: 'Music Producer Needed', brand: 'Chocolate City', loc: 'Lagos' },
                   { title: 'Lead Actor (Short Film)', brand: 'Greoh Studios', loc: 'Abuja' }
                 ].map((gig, i) => (
                   <div key={i} className="group cursor-pointer">
                      <p className="text-sm font-bold text-textMain group-hover:text-primary group-hover:underline">{gig.title}</p>
                      <p className="text-[10px] text-textMuted">{gig.brand} • {gig.loc}</p>
                   </div>
                 ))}
                 <Link to="/collabs" className="block text-center text-xs font-bold text-primary hover:underline mt-6">View all collabs</Link>
              </div>
            </div>
          </aside>
        )}

      </div>
      <FloatingChatWidget />
      <MobileNav onCreateClick={() => setIsCreateOpen(true)} />
      <MobileDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      {/* ── Mobile Create Post Bottom Sheet ── */}
      <AnimatePresence>
        {isCreateOpen && (
          <div className="md:hidden fixed inset-0 z-[300] flex items-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 250 }}
              className="relative w-full bg-white rounded-t-3xl shadow-2xl z-10 max-h-[90svh] flex flex-col"
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div className="w-10 h-1 bg-gray-200 rounded-full" />
              </div>
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-divider flex-shrink-0">
                <h2 className="text-base font-black text-textMain tracking-tight">Create a Post</h2>
                <button
                  onClick={() => setIsCreateOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-all text-textMuted"
                >
                  <X size={18} />
                </button>
              </div>
              {/* CreatePost form — mobile optimised */}
              <div className="overflow-y-auto flex-1 min-h-0 px-2 py-3 pb-safe">
                <CreatePost
                  onPostCreated={() => {
                    setIsCreateOpen(false);
                    window.dispatchEvent(new CustomEvent('postCreated'));
                  }}
                  mobile
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MainLayout;
