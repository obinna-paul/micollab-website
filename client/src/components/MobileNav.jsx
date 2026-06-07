import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Users, Briefcase, Bell, Plus, Circle, MessageSquare } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

const MobileNav = ({ onCreateClick }) => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) return null;

  return (
    <>
      {/* Floating Create Button */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[110]">
        <button
          onClick={onCreateClick}
          className="w-14 h-14 bg-primary text-[var(--text-primary)] rounded-full flex items-center justify-center shadow-xl shadow-primary/40 active:scale-90 transition-transform"
        >
          <Plus size={32} strokeWidth={3} />
        </button>
      </div>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--bg-base)]/80 backdrop-blur-xl border-t border-[var(--border-primary)] px-1 py-2 flex items-center justify-between z-[100] pb-safe">
        <NavLink 
          to="/" 
          className={({ isActive }) => `flex flex-col items-center gap-1 min-w-[50px] flex-1 ${isActive ? 'text-[#7B5CFA]' : 'text-[var(--text-secondary)]'}`}
        >
          <Home size={22} />
          <span className="text-[8px] font-black uppercase tracking-wider">Home</span>
        </NavLink>

        <NavLink 
          to="/network" 
          className={({ isActive }) => `flex flex-col items-center gap-1 min-w-[50px] flex-1 ${isActive ? 'text-[#7B5CFA]' : 'text-[var(--text-secondary)]'}`}
        >
          <Users size={22} />
          <span className="text-[8px] font-black uppercase tracking-wider">Network</span>
        </NavLink>

        <NavLink 
          to="/circles" 
          className={({ isActive }) => `flex flex-col items-center gap-1 min-w-[50px] flex-1 ${isActive ? 'text-[#7B5CFA]' : 'text-[var(--text-secondary)]'}`}
        >
          <Circle size={22} />
          <span className="text-[8px] font-black uppercase tracking-wider">Circle</span>
        </NavLink>

        {/* Spacer for Floating Button */}
        <div className="w-12 flex-shrink-0" />

        <NavLink 
          to="/collabs" 
          className={({ isActive }) => `flex flex-col items-center gap-1 min-w-[50px] flex-1 ${isActive ? 'text-[#7B5CFA]' : 'text-[var(--text-secondary)]'}`}
        >
          <Briefcase size={22} />
          <span className="text-[8px] font-black uppercase tracking-wider">Collabs</span>
        </NavLink>

        <NavLink 
          to="/messages" 
          className={({ isActive }) => `flex flex-col items-center gap-1 min-w-[50px] flex-1 ${isActive ? 'text-[#7B5CFA]' : 'text-[var(--text-secondary)]'}`}
        >
          <MessageSquare size={22} />
          <span className="text-[8px] font-black uppercase tracking-wider">Messages</span>
        </NavLink>
      </nav>
    </>
  );
};

export default MobileNav;
