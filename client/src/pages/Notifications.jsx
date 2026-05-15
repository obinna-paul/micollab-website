import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Bell, Check, Trash2, UserPlus, Briefcase, 
  MessageSquare, Heart, Clock, ChevronRight,
  Filter, Shield, Zap
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
      const res = await axios.get('http://localhost:5000/api/notifications', {
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
      await axios.patch(`http://localhost:5000/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.patch('http://localhost:5000/api/notifications/mark-all', {}, {
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
    switch(type) {
      case 'CONNECTION': return <UserPlus size={18} className="text-blue-500" />;
      case 'COLLAB_PROPOSAL': return <Briefcase size={18} className="text-emerald-500" />;
      case 'CIRCLE': return <Shield size={18} className="text-amber-500" />;
      case 'SOCIAL': return <Heart size={18} className="text-pink-500" />;
      default: return <Bell size={18} className="text-primary" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
           <div className="flex items-center gap-3 text-primary font-black uppercase text-[10px] tracking-widest mb-1">
              <Zap size={12} /> Real-time Activity
           </div>
           <h1 className="text-4xl font-black text-textMain tracking-tighter leading-none">Notifications</h1>
        </div>
        
        <div className="flex items-center gap-3">
           <button 
             onClick={markAllAsRead}
             className="px-6 py-3 bg-white border border-divider rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-primary transition-all shadow-sm flex items-center gap-2"
           >
              <Check size={14} /> Mark all read
           </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Filters Sidebar */}
        <div className="col-span-12 md:col-span-3">
           <div className="bg-white border border-divider rounded-[2rem] p-6 sticky top-24 shadow-sm">
              <h3 className="text-xs font-black text-textMuted uppercase tracking-widest mb-6 flex items-center gap-2">
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
                       ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                       : 'text-textMuted hover:bg-gray-50'
                     }`}
                   >
                     <item.icon size={16} />
                     {item.label}
                   </button>
                 ))}
              </div>
           </div>
        </div>

        {/* Notifications Feed */}
        <div className="col-span-12 md:col-span-9">
           <div className="space-y-4">
              {loading ? (
                <div className="py-20 text-center">
                   <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-primary mx-auto mb-4"></div>
                   <p className="text-textMuted font-medium">Syncing your activity...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="bg-white border border-divider rounded-[2.5rem] p-16 text-center shadow-sm">
                   <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-textMuted">
                      <Bell size={40} />
                   </div>
                   <h3 className="text-xl font-black text-textMain tracking-tight mb-2">Creative Pulse is Quiet</h3>
                   <p className="text-sm text-textMuted font-medium">When people interact with your work or invite you to projects, you'll see it here.</p>
                </div>
              ) : (
                <AnimatePresence>
                  {filtered.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      className={`group relative bg-white border border-divider rounded-[2rem] p-6 shadow-sm transition-all hover:shadow-md ${
                        !notification.isRead ? 'border-l-4 border-l-primary' : ''
                      }`}
                    >
                       <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                            !notification.isRead ? 'bg-primary/10' : 'bg-gray-50'
                          }`}>
                             {getIcon(notification.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0 pr-10">
                             <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-sm font-black text-textMain tracking-tight truncate">{notification.title}</h4>
                                {!notification.isRead && <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />}
                             </div>
                             <p className="text-sm text-textMuted leading-relaxed">
                                <span className="font-bold text-textMain">@{notification.sender?.username}</span> {notification.content}
                             </p>
                             <div className="flex items-center gap-3 mt-3">
                                <span className="flex items-center gap-1.5 text-[10px] font-black text-textMuted uppercase tracking-widest">
                                   <Clock size={10} /> {new Date(notification.createdAt).toLocaleDateString()}
                                </span>
                                {notification.link && (
                                  <Link 
                                    to={notification.link}
                                    onClick={() => markAsRead(notification.id)}
                                    className="flex items-center gap-1 text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                                  >
                                     View Details <ChevronRight size={10} />
                                  </Link>
                                )}
                             </div>
                          </div>
                       </div>

                       <div className="absolute top-6 right-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          {!notification.isRead && (
                            <button 
                              onClick={() => markAsRead(notification.id)}
                              className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-xl transition"
                              title="Mark as read"
                            >
                               <Check size={16} />
                            </button>
                          )}
                          <button 
                            onClick={() => deleteNotification(notification.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition"
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
