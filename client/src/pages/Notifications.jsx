import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Bell, Check, Trash2, UserPlus, Briefcase, 
  MessageSquare, Heart, Clock, ChevronRight,
  Filter, Shield, Zap, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../store/useAuthStore';
import { Link } from 'react-router-dom';

const Notifications = () => {
  const { token } = useAuthStore();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    if (token) fetchNotifications();
  }, [token]);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.patch(`/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleConnection = async (notificationId, requestId, action) => {
    if (!requestId) {
      alert("Missing request ID");
      return;
    }
    
    // Optimistic UI update
    setNotifications(notifications.map(n => 
      n.id === notificationId 
      ? { ...n, actionResult: action } 
      : n
    ));

    try {
      await axios.patch(`/api/network/requests/${requestId}`, { action }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error(err);
      // Revert on failure
      setNotifications(notifications.map(n => 
        n.id === notificationId 
        ? { ...n, actionResult: undefined } 
        : n
      ));
      alert('Failed to handle connection request. It may have already been processed.');
    }
  };

  const handleCircleInvite = async (notificationId, inviteId, status) => {
    if (!inviteId) {
      alert("Missing invitation ID");
      return;
    }
    
    // Optimistic UI update
    setNotifications(notifications.map(n => 
      n.id === notificationId 
      ? { ...n, actionResult: status } 
      : n
    ));

    try {
      await axios.patch(`/api/circles/invites/${inviteId}`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error(err);
      // Revert on failure
      setNotifications(notifications.map(n => 
        n.id === notificationId 
        ? { ...n, actionResult: undefined } 
        : n
      ));
      alert('Failed to respond to circle invitation.');
    }
  };

  const deleteNotification = async (id) => {
    try {
      await axios.delete(`/api/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.patch('/api/notifications/mark-all', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = notifications.filter(n => {
    if (filter === 'ALL') return true;
    return n.type === filter;
  });

  const getIcon = (type) => {
    if (type && type.startsWith('CIRCLE')) {
      return <Shield size={18} className="text-amber-500" />;
    }
    switch(type) {
      case 'CONNECTION': return <UserPlus size={18} className="text-blue-500" />;
      case 'COLLAB_PROPOSAL': return <Briefcase size={18} className="text-emerald-500" />;
      case 'CIRCLE': return <Shield size={18} className="text-amber-500" />;
      case 'SOCIAL': return <Heart size={18} className="text-pink-500" />;
      default: return <Bell size={18} className="text-[#7B5CFA]" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between gap-4 mb-8 md:mb-10">
        <div>
           <div className="flex items-center gap-2 text-[#7B5CFA] font-black uppercase text-[9px] tracking-widest mb-1">
              <Zap size={10} /> Live Activity
           </div>
           <h1 className="text-3xl md:text-4xl font-black text-[var(--text-primary)] tracking-tighter leading-none">Notifications</h1>
        </div>
        
        <button 
          onClick={markAllAsRead}
          className="p-3 md:px-6 md:py-3 bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] rounded-2xl text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)] hover:text-[#7B5CFA] transition-all shadow-sm flex items-center gap-2"
        >
          <Check size={14} /> <span className="hidden md:inline">Mark all read</span>
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6 md:gap-8">
        {/* Filters - Sidebar on desktop, Chips on mobile */}
        <div className="col-span-12 md:col-span-3">
           {/* Desktop Sidebar */}
           <div className="hidden md:block bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] rounded-[2rem] p-6 sticky top-24 shadow-sm">
              <h3 className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest mb-6 flex items-center gap-2">
                 <Filter size={12} /> Filter by
              </h3>
              <div className="space-y-2">
                 {[
                   { id: 'ALL', label: 'All Activity', icon: Zap },
                   { id: 'COLLAB_PROPOSAL', label: 'Projects', icon: Briefcase },
                   { id: 'CONNECTION', label: 'Network', icon: UserPlus },
                   { id: 'CIRCLE', label: 'Circles', icon: Shield },
                   { id: 'SOCIAL', label: 'Interactions', icon: Heart },
                 ].map((item) => (
                   <button
                     key={item.id}
                     onClick={() => setFilter(item.id)}
                     className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black transition-all ${
                       filter === item.id 
                       ? 'bg-[#7B5CFA] text-white shadow-lg shadow-[#7B5CFA]/20' 
                       : 'text-[var(--text-secondary)] hover:bg-[var(--bg-sunken)]'
                     }`}
                   >
                     <item.icon size={16} />
                     {item.label}
                   </button>
                 ))}
              </div>
           </div>

           {/* Mobile Horizontal Chips */}
           <div className="flex md:hidden items-center gap-2 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 sticky top-14 bg-[var(--bg-base)]/80 backdrop-blur-xl z-20">
              {[
                { id: 'ALL', label: 'All', icon: Zap },
                { id: 'COLLAB_PROPOSAL', label: 'Projects', icon: Briefcase },
                { id: 'CONNECTION', label: 'Network', icon: UserPlus },
                { id: 'CIRCLE', label: 'Circles', icon: Shield },
                { id: 'SOCIAL', label: 'Social', icon: Heart },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setFilter(item.id)}
                  className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${
                    filter === item.id 
                    ? 'bg-[#7B5CFA] text-white border-[#7B5CFA] shadow-lg shadow-[#7B5CFA]/20' 
                    : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-primary)]'
                  }`}
                >
                  <item.icon size={12} />
                  {item.label}
                </button>
              ))}
           </div>
        </div>

        {/* Notifications Feed */}
        <div className="col-span-12 md:col-span-9">
           <div className="space-y-4">
              {loading ? (
                <div className="py-20 text-center">
                   <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-[#7B5CFA] mx-auto mb-4"></div>
                   <p className="text-[var(--text-secondary)] font-medium">Syncing your activity...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] rounded-[2.5rem] p-16 text-center shadow-sm">
                   <div className="w-20 h-20 bg-[var(--bg-sunken)] rounded-full flex items-center justify-center mx-auto mb-6 text-[var(--text-muted)]">
                      <Bell size={40} />
                   </div>
                   <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight mb-2">Creative Pulse is Quiet</h3>
                   <p className="text-sm text-[var(--text-secondary)] font-medium">When people interact with your work or invite you to projects, you'll see it here.</p>
                </div>
              ) : (
                <AnimatePresence>
                  {filtered.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      className={`group relative bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] rounded-[2rem] p-6 shadow-sm transition-all hover:shadow-md ${
                        !notification.isRead ? 'border-l-4 border-l-[#7B5CFA]' : ''
                      }`}
                    >
                       <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                            !notification.isRead ? 'bg-[#7B5CFA]/10' : 'bg-[var(--bg-sunken)]'
                          }`}>
                             {getIcon(notification.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0 pr-10">
                             <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-sm font-black text-[var(--text-primary)] tracking-tight truncate">
                                  {notification.title || (notification.type === 'CONNECTION' ? 'Network Update' : notification.type.replace('_', ' '))}
                                </h4>
                                {!notification.isRead && <div className="w-1.5 h-1.5 bg-[#7B5CFA] rounded-full animate-pulse" />}
                             </div>
                             <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                                {notification.triggeredBy?.username && (
                                  <Link to={`/profile/${notification.triggeredBy.username}`} className="font-bold text-[var(--text-primary)] hover:underline">
                                    {notification.triggeredBy.username}
                                  </Link>
                                )}
                                {' '}
                                {notification.content === 'Connection Accepted' 
                                  ? 'accepted your connection request' 
                                  : notification.content === 'New Connection Request'
                                  ? 'wants to connect with you'
                                  : notification.content}
                             </p>
                             <div className="flex items-center gap-3 mt-3">
                                <span className="flex items-center gap-1.5 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">
                                   <Clock size={10} /> {new Date(notification.createdAt).toLocaleDateString()}
                                </span>
                                {notification.link && (
                                  <Link 
                                    to={notification.link}
                                    onClick={() => markAsRead(notification.id)}
                                    className="flex items-center gap-1 text-[10px] font-black text-[#7B5CFA] uppercase tracking-widest hover:underline"
                                  >
                                     View Details <ChevronRight size={10} />
                                  </Link>
                                )}
                             </div>
                             
                             {notification.content === 'New Connection Request' && !notification.actionResult && (
                                <div className="flex items-center gap-2 mt-3">
                                  <button 
                                    onClick={() => handleConnection(notification.id, notification.relatedId, 'ACCEPTED')}
                                    className="px-4 py-1.5 bg-[#7B5CFA] hover:bg-[#684CE0] text-white text-[11px] font-black uppercase tracking-widest rounded-lg transition-all shadow-md shadow-[#7B5CFA]/20"
                                  >
                                    Accept
                                  </button>
                                  <button 
                                    onClick={() => handleConnection(notification.id, notification.relatedId, 'DECLINED')}
                                    className="px-4 py-1.5 bg-[var(--bg-sunken)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[#2A303C] text-[11px] font-black uppercase tracking-widest rounded-lg transition-all"
                                  >
                                    Decline
                                  </button>
                                </div>
                             )}
                             {notification.actionResult === 'ACCEPTED' && notification.type !== 'CIRCLE_INVITE' && (
                                <div className="mt-3">
                                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#7B5CFA]/10 border border-[#7B5CFA]/30 text-[#7B5CFA] text-[11px] font-black uppercase tracking-widest rounded-lg">
                                    <Check size={12} strokeWidth={3} /> Connected
                                  </span>
                                </div>
                             )}
                             {notification.actionResult === 'DECLINED' && notification.type !== 'CIRCLE_INVITE' && (
                                <div className="mt-3">
                                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-red-500/10 border border-red-500/30 text-red-500 text-[11px] font-black uppercase tracking-widest rounded-lg">
                                    <X size={12} strokeWidth={3} /> Declined
                                  </span>
                                </div>
                             )}

                             {notification.type === 'CIRCLE_INVITE' && !notification.actionResult && (
                                <div className="flex items-center gap-2 mt-3">
                                  <button 
                                    onClick={() => handleCircleInvite(notification.id, notification.relatedId, 'ACCEPTED')}
                                    className="px-4 py-1.5 bg-[#7B5CFA] hover:bg-[#684CE0] text-white text-[11px] font-black uppercase tracking-widest rounded-lg transition-all shadow-md shadow-[#7B5CFA]/20"
                                  >
                                    Accept
                                  </button>
                                  <button 
                                    onClick={() => handleCircleInvite(notification.id, notification.relatedId, 'REJECTED')}
                                    className="px-4 py-1.5 bg-[var(--bg-sunken)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[#2A303C] text-[11px] font-black uppercase tracking-widest rounded-lg transition-all"
                                  >
                                    Decline
                                  </button>
                                  {notification.link && (
                                    <Link 
                                      to={notification.link}
                                      onClick={() => markAsRead(notification.id)}
                                      className="px-4 py-1.5 bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] text-[var(--text-primary)] hover:text-[#7B5CFA] text-[11px] font-black uppercase tracking-widest rounded-lg transition-all"
                                    >
                                      Review
                                    </Link>
                                  )}
                                </div>
                             )}
                             {notification.type === 'CIRCLE_INVITE' && notification.actionResult === 'ACCEPTED' && (
                                <div className="mt-3">
                                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#7B5CFA]/10 border border-[#7B5CFA]/30 text-[#7B5CFA] text-[11px] font-black uppercase tracking-widest rounded-lg">
                                    <Check size={12} strokeWidth={3} /> Joined Circle
                                  </span>
                                </div>
                             )}
                             {notification.type === 'CIRCLE_INVITE' && notification.actionResult === 'REJECTED' && (
                                <div className="mt-3">
                                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-red-500/10 border border-red-500/30 text-red-500 text-[11px] font-black uppercase tracking-widest rounded-lg">
                                    <X size={12} strokeWidth={3} /> Declined
                                  </span>
                                </div>
                             )}
                          </div>
                       </div>

                       <div className="absolute top-6 right-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          {!notification.isRead && (
                            <button 
                              onClick={() => markAsRead(notification.id)}
                              className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition"
                              title="Mark as read"
                            >
                               <Check size={16} />
                            </button>
                          )}
                          <button 
                            onClick={() => deleteNotification(notification.id)}
                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition"
                            title="Delete"
                          >
                             <Trash2 size={16} />
                          </button>
                       </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
