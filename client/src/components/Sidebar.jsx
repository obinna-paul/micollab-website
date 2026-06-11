import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Compass, MessageSquare, Bell, User, Wallet, Settings, TrendingUp, LogOut, Users, Briefcase, ShieldAlert } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

const SidebarItem = ({ to, icon: Icon, label }) => (
  <NavLink 
    to={to} 
    className={({ isActive }) => `
      flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200
      ${isActive 
        ? 'bg-primary/10 text-primary font-bold border border-primary/20' 
        : 'text-textMuted hover:bg-white/5 hover:text-[var(--text-primary)]'}
    `}
  >
    <Icon size={22} />
    <span className="hidden lg:block">{label}</span>
  </NavLink>
);

const Sidebar = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-20 lg:w-64 h-screen sticky top-0 border-r border-gray-800 p-4 flex flex-col gap-2">
      <div className="mb-8 px-4">
        <h2 className="text-2xl font-black tracking-tighter text-[var(--text-primary)] hidden lg:block">
          Mi<span className="text-primary">collab</span>
        </h2>
        <div className="w-10 h-10 bg-primary rounded-xl flex lg:hidden items-center justify-center font-black">M</div>
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        <SidebarItem to="/" icon={Home} label="Home" />
        <SidebarItem to="/network" icon={Users} label="My Network" />
        <SidebarItem to="/collabs" icon={Briefcase} label="Collabs Hub" />
        <SidebarItem to="/messages" icon={MessageSquare} label="Messages" />
        <SidebarItem to="/notifications" icon={Bell} label="Notifications" />
        
        <div className="my-6 border-t border-gray-800 lg:mx-4"></div>
        
        <SidebarItem to={`/profile/${user?.username}`} icon={User} label="Profile" />
        <SidebarItem to="/wallet" icon={Wallet} label="Wallet" />
        <SidebarItem to="/settings" icon={Settings} label="Settings" />
        <SidebarItem to="/disputes" icon={ShieldAlert} label="Dispute Center" />
        <SidebarItem to="/policies" icon={Briefcase} label="Usage Policies" />
      </nav>

      {isAuthenticated ? (
        <div className="mt-auto flex flex-col gap-2">
          <div className="flex items-center gap-3 px-4 py-3 bg-surface rounded-2xl border border-gray-800">
            <img 
              src={user?.profileImage || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop'} 
              alt={user?.username} 
              className="w-8 h-8 rounded-full border border-gray-700"
            />
            <div className="hidden lg:block min-w-0">
              <p className="text-sm font-bold text-[var(--text-primary)] truncate">{user?.username}</p>
              <p className="text-[10px] text-textMuted uppercase font-bold">{user?.role}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-4 px-4 py-3 rounded-xl text-textMuted hover:bg-accent/10 hover:text-accent transition-all duration-200"
          >
            <LogOut size={22} />
            <span className="hidden lg:block font-bold">Logout</span>
          </button>
        </div>
      ) : (
        <div className="mt-auto p-4 bg-surface rounded-2xl border border-gray-800 hidden lg:block">
          <p className="text-xs text-textMuted mb-3">Join our community</p>
          <button 
            onClick={() => navigate('/login')}
            className="w-full py-2 bg-primary text-[var(--text-primary)] text-sm font-bold rounded-lg hover:bg-violet-600 transition"
          >
            Sign In
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
