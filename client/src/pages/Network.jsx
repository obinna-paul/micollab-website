import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Users, Search, UserPlus, MessageSquare, 
  Layers, Bell, ArrowRight, Check, X,
  Plus, Calendar, Target, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../store/useAuthStore';

const Network = () => {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('DISCOVER'); // DISCOVER, CONNECTIONS, REQUESTS
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [connections, setConnections] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      if (activeTab === 'DISCOVER') {
        const res = await axios.get(`/api/network/discover?search=${search}`, { headers });
        setUsers(res.data);
      } else if (activeTab === 'CONNECTIONS') {
        const res = await axios.get('/api/network/connections', { headers });
        setConnections(res.data);
      } else if (activeTab === 'REQUESTS') {
        const res = await axios.get('/api/network/requests', { headers });
        setRequests(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (receiverId) => {
    try {
      await axios.post('/api/network/connect', { receiverId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Update local state
      setUsers(users.map(u => u.id === receiverId ? { ...u, requested: true } : u));
    } catch (err) {
      console.error(err);
    }
  };

  const handleRequest = async (requestId, action) => {
    try {
      await axios.patch(`/api/network/requests/${requestId}`, { action }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(requests.filter(r => r.id !== requestId));
    } catch (err) {
      console.error(err);
    }
  };

  const TAB_META = {
    DISCOVER: {
      label:   'Discover',
      heading: 'Build your Network',
      sub:     'Find and connect with talented creatives.',
      // desktop-specific
      eyebrow: 'Global Creative Network',
      desktopHeading: ['Discover ', 'New Creatives'],
      desktopSub: 'Search for designers, developers, writers, and more. Send a connection request and start building your professional circle.',
    },
    CONNECTIONS: {
      label:   'Connect',
      heading: 'Your Connections',
      sub:     "People you've already connected with.",
      eyebrow: 'Your Network',
      desktopHeading: ['People in ', 'Your Network'],
      desktopSub: "Everyone you've connected with. Visit their profiles, explore their portfolios, send a message, or recruit them into a Circle.",
    },
    REQUESTS: {
      label:   'Requests',
      heading: 'Connection Requests',
      sub:     'Accept or decline incoming requests.',
      eyebrow: 'Pending Requests',
      desktopHeading: ['Connection ', 'Requests'],
      desktopSub: 'Creatives who want to join your network. Accept to connect, or decline to keep your network curated.',
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-12">

      {/* ── MOBILE ONLY ── */}
      <div className="md:hidden">
        {/* Dynamic heading */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="pb-3"
          >
            <h1 className="text-2xl font-black text-white tracking-tighter">
              {TAB_META[activeTab].heading}
            </h1>
            <p className="text-xs text-[#8B95A5] font-medium mt-0.5">
              {TAB_META[activeTab].sub}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Sticky tab bar */}
        <div className="flex border-b border-white/5 sticky top-14 bg-[#181D2A]/95 backdrop-blur-xl z-40 -mx-4 px-0 mb-5">
          {Object.entries(TAB_META).map(([key, meta]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider transition-all relative ${
                activeTab === key ? 'text-[#7B5CFA]' : 'text-[#8B95A5]'
              }`}
            >
              {meta.label}
              {key === 'REQUESTS' && requests.length > 0 && (
                <span className="ml-1 bg-red-500 text-white px-1 py-0.5 rounded-full text-[7px]">{requests.length}</span>
              )}
              {activeTab === key && (
                <motion.div layoutId="network-tab-mobile" className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#7B5CFA] rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── DESKTOP ONLY ── */}
      <div className="hidden md:flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">

        {/* Animated heading block */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="space-y-3 max-w-xl"
          >
            <div className="flex items-center gap-2.5 text-[#7B5CFA] font-black uppercase text-[10px] tracking-[0.2em]">
              <Globe size={13} /> {TAB_META[activeTab].eyebrow}
            </div>
            <h1 className="text-5xl font-black text-white tracking-tighter leading-none">
              {TAB_META[activeTab].desktopHeading[0]}
              <span className="text-[#7B5CFA] italic">{TAB_META[activeTab].desktopHeading[1]}</span>
            </h1>
            <p className="text-[#8B95A5] font-medium leading-relaxed text-sm">
              {TAB_META[activeTab].desktopSub}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Desktop Tab Pills */}
        <div className="flex bg-[#181D2A]/50 backdrop-blur-md p-1.5 rounded-2xl border border-white/5 flex-shrink-0">
          {Object.entries(TAB_META).map(([key, meta]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === key ? 'bg-[#7B5CFA] text-white shadow-[0_0_15px_rgba(123,92,250,0.3)]' : 'text-[#8B95A5] hover:text-white'}`}
            >
              {meta.label}
              {key === 'REQUESTS' && requests.length > 0 && (
                <span className="ml-2 bg-red-500 text-white px-1.5 py-0.5 rounded-full text-[8px]">{requests.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="min-h-[500px]"
        >
          {activeTab === 'DISCOVER' && (
            <div className="space-y-8">
              <div className="relative group max-w-2xl">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[#8B95A5] group-focus-within:text-[#7B5CFA] transition-colors" size={20} />
                <input 
                  type="text"
                  placeholder="Search by name, skill, or bio..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && fetchData()}
                  className="w-full bg-[#181D2A] border-2 border-white/5 rounded-[2rem] py-5 pl-16 pr-8 text-sm font-bold focus:border-[#7B5CFA] text-white outline-none transition-all shadow-sm"
                />
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                   {[1,2,3,4,5,6].map(i => <div key={i} className="h-64 bg-[#181D2A] rounded-3xl" />)}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {users.map(user => (
                    <motion.div 
                      whileHover={{ y: -5 }}
                      key={user.id} 
                      className="bg-[#0F131E] border border-white/5 rounded-[2rem] p-6 group transition-all hover:shadow-xl hover:shadow-[#7B5CFA]/10"
                    >
                      <div className="relative mb-6">
                        <img 
                          src={user.profileImage || `https://ui-avatars.com/api/?name=${user.username}&background=random`} 
                          alt={user.username}
                          className="w-20 h-20 rounded-2xl object-cover ring-4 ring-[#181D2A]"
                        />
                        {user.isVerified && (
                          <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-full border-4 border-[#0F131E]">
                            <Check size={12} strokeWidth={4} />
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-1 mb-4">
                        <h3 className="text-xl font-black text-white tracking-tight">{user.username}</h3>
                        <p className="text-[10px] font-black text-[#7B5CFA] uppercase tracking-widest">{user.profileType}</p>
                      </div>

                      <p className="text-xs text-[#8B95A5] line-clamp-2 mb-6 font-medium leading-relaxed h-8">
                        {user.bio || "No bio available yet."}
                      </p>

                      <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                        <button 
                          onClick={() => handleConnect(user.id)}
                          disabled={user.requested}
                          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${user.requested ? 'bg-[#181D2A] text-[#8B95A5]' : 'bg-[#181D2A] border border-white/5 text-white hover:border-[#7B5CFA] hover:text-[#7B5CFA]'}`}
                        >
                          {user.requested ? 'Requested' : 'Connect'}
                        </button>
                        <button className="p-3 rounded-xl bg-[#181D2A] text-[#8B95A5] hover:text-[#7B5CFA] transition-all">
                          <ArrowRight size={16} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'CONNECTIONS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {connections.length === 0 && !loading && (
                 <div className="col-span-full py-20 text-center">
                    <div className="w-20 h-20 bg-[#181D2A] rounded-full flex items-center justify-center mx-auto mb-6">
                       <Users size={40} className="text-[#8B95A5] opacity-20" />
                    </div>
                    <h3 className="text-2xl font-black text-white tracking-tight">No connections yet</h3>
                    <p className="text-[#8B95A5] mt-2">Start exploring the network to build your creative circle.</p>
                 </div>
               )}
               {connections.map(user => (
                 <div key={user.id} className="bg-[#0F131E] border border-white/5 rounded-3xl p-6 flex items-center gap-6">
                    <img src={user.profileImage || `https://ui-avatars.com/api/?name=${user.username}&background=random`} className="w-16 h-16 rounded-2xl object-cover" />
                    <div className="flex-1">
                       <h3 className="text-lg font-black text-white">{user.username}</h3>
                       <p className="text-[10px] font-black text-[#7B5CFA] uppercase tracking-widest">{user.profileType}</p>
                    </div>
                    <button className="bg-[#181D2A] p-3 rounded-xl text-[#8B95A5] hover:text-[#7B5CFA] transition-all">
                       <MessageSquare size={18} />
                    </button>
                 </div>
               ))}
            </div>
          )}

          {activeTab === 'REQUESTS' && (
            <div className="max-w-2xl space-y-4">
               {requests.length === 0 && !loading && (
                 <div className="py-20 text-center bg-[#0F131E] rounded-3xl border-2 border-dashed border-white/5">
                    <Bell size={40} className="text-[#8B95A5] mx-auto mb-4 opacity-20" />
                    <p className="text-[#8B95A5] font-black uppercase text-[10px] tracking-widest">No pending requests</p>
                 </div>
               )}
               {requests.map(req => (
                 <div key={req.id} className="bg-[#0F131E] border border-white/5 rounded-3xl p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <img src={req.requester.profileImage || `https://ui-avatars.com/api/?name=${req.requester.username}&background=random`} className="w-12 h-12 rounded-xl object-cover" />
                       <div>
                          <p className="font-black text-white">{req.requester.username}</p>
                          <p className="text-[9px] font-black text-[#7B5CFA] uppercase tracking-widest">Wants to connect</p>
                       </div>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => handleRequest(req.id, 'ACCEPTED')} className="bg-[#7B5CFA] text-white p-3 rounded-xl hover:shadow-[0_0_15px_rgba(123,92,250,0.3)] transition-all">
                          <Check size={18} />
                       </button>
                       <button onClick={() => handleRequest(req.id, 'DECLINED')} className="bg-[#181D2A] text-[#8B95A5] p-3 rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-all">
                          <X size={18} />
                       </button>
                    </div>
                 </div>
               ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Network;
