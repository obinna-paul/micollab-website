import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Compass, User, Users, Briefcase, MessageSquare, Bell, LogOut, X, Circle, Search, ChevronDown, Flame, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../store/useAuthStore';
import FloatingChatWidget from './chat/FloatingChatWidget';
import MobileNav from './MobileNav';
import MobileDrawer from './MobileDrawer';
import CreatePost from './CreatePost';
import TrendingSidebar from './TrendingSidebar';

const SidebarItem = ({ to, icon: Icon, label }) => (
  <NavLink 
    to={to} 
    className={({ isActive }) => `
      flex items-center gap-3 px-4 py-3 rounded-2xl transition-all group font-bold text-sm
      ${isActive ? 'bg-[#7B5CFA]/10 text-[#A37BFF]' : 'text-[#8B95A5] hover:bg-white/5 hover:text-white'}
    `}
  >
    {({ isActive }) => (
      <>
        <Icon size={18} className={isActive ? 'text-[#7B5CFA]' : 'text-[#8B95A5] group-hover:text-white transition-colors'} />
        <span>{label}</span>
      </>
    )}
  </NavLink>
);

const MainLayout = ({ children }) => {
  const { user, token, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isCollabs = location.pathname.startsWith('/collabs');
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
      const interval = setInterval(fetchUnread, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, token]);

  const userTags = user?.specializations ? user.specializations.split(',').slice(0, 5) : ['Creative', 'Design'];

  return (
    <div className="min-h-screen bg-[#0F131E] transition-colors duration-500 pb-20 md:pb-0 font-sans text-white">
      {/* Top Navigation */}
      <header className="bg-[#0F131E] border-b border-white/5 sticky top-0 z-50 h-16 flex items-center">
        <div className="px-6 w-full flex items-center justify-between">
          
          <div className="flex items-center gap-2 w-auto md:w-[240px]">
            {/* Mobile Profile Trigger */}
            <button 
              onClick={() => setIsDrawerOpen(true)}
              className="md:hidden w-8 h-8 rounded-full overflow-hidden border border-white/10 mr-2"
            >
              <img 
                src={user?.profileImage || `https://ui-avatars.com/api/?name=${user?.username}&background=7B5CFA&color=fff`} 
                className="w-full h-full object-cover" 
                alt="" 
              />
            </button>
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-lg bg-gradient-to-br from-[#7B5CFA] to-[#684CE0] shadow-[0_0_15px_rgba(123,92,250,0.4)]">M</div>
              <h1 className="text-xl font-black tracking-tighter text-white hidden md:block">Micollab</h1>
            </Link>
          </div>

          <div className="hidden md:block flex-1 max-w-xl px-4 relative">
            <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-[#8B95A5]" size={16} />
            <input 
              type="text" 
              placeholder="Search creatives, projects, or tags..." 
              className="w-full bg-[#181D2A] border border-white/5 rounded-full py-2.5 pl-10 pr-4 text-sm text-white placeholder-[#8B95A5] outline-none focus:border-[#7B5CFA]/50 transition" 
            />
          </div>

          <div className="flex items-center gap-4 w-auto md:w-[240px] justify-end">
             {isAuthenticated ? (
               <div className="flex items-center gap-3">
                 <button className="w-9 h-9 rounded-full border border-white/10 bg-[#181D2A] flex items-center justify-center hover:bg-white/5 transition relative group">
                   <Bell size={16} className="text-[#8B95A5] group-hover:text-white transition" />
                   {unreadCount > 0 && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#EC4899] rounded-full border-2 border-[#0F131E]" />}
                 </button>
                 <Link to="/messages" className="w-9 h-9 rounded-full border border-white/10 bg-[#181D2A] flex items-center justify-center hover:bg-white/5 transition relative group">
                   <MessageSquare size={16} className="text-[#8B95A5] group-hover:text-white transition" />
                 </Link>
                 
                 <div className="hidden md:flex items-center gap-2 ml-2 cursor-pointer group">
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10">
                      <img 
                        src={user?.profileImage || `https://ui-avatars.com/api/?name=${user?.username}&background=7B5CFA&color=fff`} 
                        className="w-full h-full object-cover" 
                        alt="" 
                      />
                    </div>
                    <ChevronDown size={14} className="text-[#8B95A5] group-hover:text-white transition" />
                 </div>
               </div>
             ) : (
               <Link to="/login" className="bg-[#7B5CFA] hover:bg-[#684CE0] text-white font-bold text-xs px-5 py-2 rounded-full transition shadow-[0_0_10px_rgba(123,92,250,0.3)]">Sign In</Link>
             )}
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex flex-1 max-w-[1440px] mx-auto w-full px-4 gap-8 pt-8">
        
        {/* Left Sidebar */}
        <aside className="hidden md:flex flex-col w-[220px] lg:w-[240px] flex-shrink-0 sticky top-24 h-[calc(100vh-96px)] overflow-y-auto custom-scrollbar">
          <nav className="space-y-1 mb-10">
             <SidebarItem to="/" icon={Compass} label="Community" />
             <SidebarItem to={user ? `/profile/${user.username}` : "/login"} icon={User} label="Profile" />
             <SidebarItem to="/network" icon={Users} label="Network" />
             <SidebarItem to="/circles" icon={Circle} label="Circle" />
             <SidebarItem to="/collabs" icon={Briefcase} label="Collab" />
          </nav>
          
          <div className="px-4">
            <p className="text-[10px] font-black text-[#8B95A5] uppercase tracking-widest mb-4">Your Tags</p>
            <div className="flex flex-wrap gap-2">
              {userTags.map(tag => (
                <span key={tag} className="px-3 py-1.5 bg-[#181D2A] rounded-lg text-[11px] font-bold text-[#8B95A5] hover:text-white transition cursor-pointer border border-white/5 hover:border-white/20">
                  #{tag.trim().replace(/\s+/g, '')}
                </span>
              ))}
            </div>
          </div>
        </aside>

        {/* Center - Main Content */}
        <main className="flex-1 min-w-0 pb-20">
          {children}
        </main>

        {/* Right Sidebar - Trending & Peers */}
        {isHome && (
          <aside className="hidden xl:block w-[300px] flex-shrink-0 sticky top-24 h-[calc(100vh-96px)] overflow-y-auto custom-scrollbar">
            <TrendingSidebar />
          </aside>
        )}
      </div>

      <FloatingChatWidget />
      <MobileNav onCreateClick={() => setIsCreateOpen(true)} />
      <MobileDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      {/* Mobile Create Post Bottom Sheet */}
      <AnimatePresence>
        {isCreateOpen && (
          <div className="md:hidden fixed inset-0 z-[300] flex items-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 250 }}
              className="relative w-full bg-[#181D2A] rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-10 max-h-[90svh] flex flex-col border-t border-white/10"
            >
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div className="w-10 h-1 bg-white/20 rounded-full" />
              </div>
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 flex-shrink-0">
                <h2 className="text-base font-black text-white tracking-tight">Create a Post</h2>
                <button
                  onClick={() => setIsCreateOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-xl transition-all text-[#8B95A5] hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>
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
