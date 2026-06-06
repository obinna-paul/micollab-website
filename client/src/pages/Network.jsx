import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Users, Search, UserPlus, MessageSquare, 
  Layers, Bell, ArrowRight, Check, X,
  Plus, Calendar, Target, Globe, Flame, Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../store/useAuthStore';

// Helper to generate consistent gradient colors based on user string
const getGradient = (str) => {
  const gradients = [
    'from-indigo-500 via-purple-500 to-pink-500',
    'from-cyan-500 to-blue-500',
    'from-emerald-400 to-cyan-400',
    'from-fuchsia-600 to-pink-600',
    'from-orange-400 to-rose-400',
    'from-blue-600 via-indigo-600 to-purple-600'
  ];
  const hash = str.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return gradients[hash % gradients.length];
};

const Network = () => {
  const { token, user: currentUser } = useAuthStore();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('DISCOVER'); // DISCOVER, CONNECTIONS, REQUESTS
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [connections, setConnections] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All Creatives');

  const FILTERS = ['All Creatives', 'Sound Designers', 'Visual Artists', 'Filmmakers', 'Developers'];
  const TRENDING_TOPICS = ['#UnrealEngine5', '#CyberpunkArt', '#AnalogSynths', '#IndieFilm', '#Web3Design'];

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

  const handleStartChat = async (targetId) => {
    try {
      await axios.post('/api/messages/conversation', {
        targetUserId: targetId,
        type: 'DIRECT'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate('/messages');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6 md:py-10">

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
         
         {/* Left/Center Content */}
         <div className="lg:col-span-9 space-y-8">
            
            {/* Header Area */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8">
               <div>
                  <h1 className="text-3xl font-black text-white tracking-tight leading-tight mb-2">
                     Discover Creatives
                  </h1>
                  <p className="text-[#8B95A5] font-medium leading-relaxed text-sm max-w-md">
                     Find your next collaborator from our curated network of global creative professionals.
                  </p>
               </div>
               
               {/* View Toggles (Discover, Connections, Requests) */}
               <div className="flex bg-[#181D2A] border border-white/[0.04] p-1.5 rounded-2xl w-full xl:w-auto overflow-x-auto flex-shrink-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {['DISCOVER', 'CONNECTIONS', 'REQUESTS'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 xl:flex-none px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'bg-[#7B5CFA] text-white shadow-lg shadow-[#7B5CFA]/20' : 'text-[#5A6478] hover:text-white'}`}
                    >
                      {tab}
                      {tab === 'REQUESTS' && requests.length > 0 && (
                        <span className="ml-2 bg-red-500 text-white px-1.5 py-0.5 rounded-md text-[8px]">{requests.length}</span>
                      )}
                    </button>
                  ))}
               </div>
            </div>

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
                        {/* Filters and Search */}
                        <div className="flex flex-col xl:flex-row xl:items-center gap-6 justify-between">
                           <div className="flex overflow-x-auto gap-2 pb-2 xl:pb-0 w-full xl:flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                              {FILTERS.map(f => (
                                 <button 
                                   key={f}
                                   onClick={() => setFilter(f)}
                                   className={`flex-shrink-0 px-6 py-3 rounded-full text-[11px] font-black transition-all border ${filter === f ? 'bg-[#7B5CFA] text-white border-[#7B5CFA]' : 'bg-[#181D2A] text-[#8B95A5] border-white/[0.06] hover:border-white/20 hover:text-white'}`}
                                 >
                                    {f}
                                 </button>
                              ))}
                           </div>
                           
                           <div className="relative group w-full xl:w-[300px] flex-shrink-0">
                              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#5A6478] group-focus-within:text-[#7B5CFA] transition-colors" size={16} />
                              <input 
                                type="text"
                                placeholder="Search network..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && fetchData()}
                                className="w-full bg-[#181D2A] border border-white/[0.06] rounded-full py-3.5 pl-12 pr-5 text-sm font-bold focus:border-[#7B5CFA]/50 text-white outline-none transition-all shadow-inner placeholder-[#5A6478]"
                              />
                           </div>
                        </div>

                        {/* Masonry Grid */}
                        {loading ? (
                           <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                              {[1,2,3,4,5,6].map(i => <div key={i} className="h-64 bg-[#181D2A] rounded-3xl animate-pulse" />)}
                           </div>
                        ) : (
                           <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6 pb-20">
                              {users.map(user => (
                                 <div 
                                   key={user.id} 
                                   className="break-inside-avoid bg-[#181D2A] border border-white/[0.04] rounded-3xl overflow-hidden hover:border-[#7B5CFA]/30 hover:shadow-2xl hover:shadow-[#7B5CFA]/10 transition-all group relative flex flex-col"
                                 >
                                    {/* Abstract Gradient Banner */}
                                    <div className={`h-32 w-full bg-gradient-to-br ${getGradient(user.username)} opacity-80 relative`}>
                                       {/* Connect Button inside Banner */}
                                       <button 
                                         onClick={(e) => { e.stopPropagation(); handleConnect(user.id); }}
                                         disabled={user.requested}
                                         className={`absolute top-4 right-4 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${user.requested ? 'bg-black/20 text-white/50 border border-white/10' : 'bg-black/40 text-white border border-white/20 hover:bg-black/60'}`}
                                       >
                                         {user.requested ? 'Requested' : 'Connect'}
                                       </button>
                                    </div>
                                    
                                    {/* Profile Content */}
                                    <div className="px-6 pb-6 relative flex-1 flex flex-col">
                                       <div className="relative -mt-10 mb-4 inline-block">
                                          <img 
                                            src={user.profileImage || `https://ui-avatars.com/api/?name=${user.username}&background=random`} 
                                            alt={user.username}
                                            className="w-20 h-20 rounded-2xl object-cover ring-4 ring-[#181D2A] bg-[#0F131E]"
                                          />
                                          {user.isVerified && (
                                            <div className="absolute -bottom-1 -right-1 bg-cyan-400 text-[#0F131E] p-1 rounded-full border-2 border-[#181D2A]">
                                              <Check size={12} strokeWidth={4} />
                                            </div>
                                          )}
                                       </div>
                                       
                                       <div className="mb-4">
                                          <h3 className="text-xl font-black text-white tracking-tight leading-tight">{user.username}</h3>
                                          <p className="text-[11px] font-black text-cyan-400 mt-1">{user.profileType || 'Creative Professional'}</p>
                                       </div>

                                       <p className="text-sm text-[#8B95A5] line-clamp-3 mb-6 font-medium leading-relaxed flex-1">
                                          {user.bio || "Crafting digital experiences and pushing the boundaries of creative technology."}
                                       </p>

                                       {/* Skill Tags */}
                                       <div className="flex flex-wrap gap-1.5 mb-6">
                                          {(user.skills ? user.skills.split(',') : ['Design', 'Direction', 'Creative']).slice(0, 3).map((skill, i) => (
                                             <span key={i} className="bg-[#0F131E] border border-white/[0.04] text-[#8B95A5] text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">
                                                {skill.trim()}
                                             </span>
                                          ))}
                                       </div>

                                       {/* Footer */}
                                       <div className="pt-4 border-t border-white/[0.04] flex items-center gap-2 text-orange-400">
                                          <Star size={14} className="fill-orange-400" />
                                          <span className="text-xs font-bold">{Math.floor((user.username.length * 7.3) % 40) + 2} Endorsements</span>
                                       </div>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        )}
                     </div>
                  )}

                  {activeTab === 'CONNECTIONS' && (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {connections.length === 0 && !loading && (
                           <div className="col-span-full py-20 text-center bg-[#181D2A] rounded-[3rem] border border-white/[0.04]">
                              <div className="w-20 h-20 bg-[#0F131E] rounded-full flex items-center justify-center mx-auto mb-6 border border-white/[0.06]">
                                 <Users size={40} className="text-[#5A6478]" />
                              </div>
                              <h3 className="text-2xl font-black text-white tracking-tight">No connections yet</h3>
                              <p className="text-[#8B95A5] mt-2 text-sm">Start exploring the network to build your creative circle.</p>
                           </div>
                        )}
                        {connections.map(user => (
                           <div key={user.id} className="bg-[#181D2A] border border-white/[0.04] rounded-[2rem] p-6 flex items-center gap-5 hover:border-[#7B5CFA]/30 transition-colors group">
                              <img src={user.profileImage || `https://ui-avatars.com/api/?name=${user.username}&background=random`} className="w-16 h-16 rounded-2xl object-cover border border-white/[0.06]" />
                              <div className="flex-1 min-w-0">
                                 <h3 className="text-lg font-black text-white truncate">{user.username}</h3>
                                 <p className="text-[9px] font-black text-cyan-400 uppercase tracking-widest mt-0.5 truncate">{user.profileType}</p>
                              </div>
                              <button 
                                onClick={() => handleStartChat(user.id)}
                                className="bg-[#0F131E] p-3.5 rounded-xl border border-white/[0.04] text-[#8B95A5] hover:text-[#7B5CFA] hover:border-[#7B5CFA]/30 transition-all flex-shrink-0"
                              >
                                 <MessageSquare size={18} />
                              </button>
                           </div>
                        ))}
                     </div>
                  )}

                  {activeTab === 'REQUESTS' && (
                     <div className="max-w-2xl space-y-4">
                        {requests.length === 0 && !loading && (
                           <div className="py-20 text-center bg-[#181D2A] rounded-[3rem] border border-white/[0.04]">
                              <div className="w-20 h-20 bg-[#0F131E] rounded-full flex items-center justify-center mx-auto mb-6 border border-white/[0.06]">
                                 <Bell size={40} className="text-[#5A6478]" />
                              </div>
                              <h3 className="text-2xl font-black text-white tracking-tight">No pending requests</h3>
                           </div>
                        )}
                        {requests.map(req => (
                           <div key={req.id} className="bg-[#181D2A] border border-white/[0.04] rounded-[2rem] p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                              <div className="flex items-center gap-4 w-full sm:w-auto">
                                 <img src={req.requester.profileImage || `https://ui-avatars.com/api/?name=${req.requester.username}&background=random`} className="w-14 h-14 rounded-xl object-cover border border-white/[0.06]" />
                                 <div className="flex-1">
                                    <p className="font-black text-white text-lg">{req.requester.username}</p>
                                    <p className="text-[9px] font-black text-[#5A6478] uppercase tracking-widest mt-0.5">Wants to connect</p>
                                 </div>
                              </div>
                              <div className="flex gap-3 w-full sm:w-auto">
                                 <button onClick={() => handleRequest(req.id, 'ACCEPTED')} className="flex-1 sm:flex-none bg-[#7B5CFA] hover:bg-[#6B4CE0] text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                                    Accept
                                 </button>
                                 <button onClick={() => handleRequest(req.id, 'DECLINED')} className="flex-1 sm:flex-none bg-[#0F131E] border border-white/[0.04] text-[#8B95A5] px-6 py-3 rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-all text-[10px] font-black uppercase tracking-widest">
                                    Decline
                                 </button>
                              </div>
                           </div>
                        ))}
                     </div>
                  )}
               </motion.div>
            </AnimatePresence>
         </div>

         {/* Right Sidebar */}
         <div className="lg:col-span-3 space-y-10 hidden lg:block">
            
            {/* Trending Topics */}
            <div className="pt-2">
               <h3 className="flex items-center gap-2 text-sm font-black text-white mb-6 tracking-tight">
                  <Flame size={18} className="text-orange-500" /> Trending Topics
               </h3>
               <div className="flex flex-wrap gap-2">
                  {TRENDING_TOPICS.map(topic => (
                     <button key={topic} className="bg-[#181D2A] border border-white/[0.04] text-[#8B95A5] text-xs font-bold px-3.5 py-2 rounded-lg hover:text-white hover:border-white/20 transition-all">
                        {topic}
                     </button>
                  ))}
               </div>
            </div>

            {/* Suggested Connections */}
            <div>
               <h3 className="flex items-center gap-2 text-sm font-black text-white mb-6 tracking-tight">
                  <UserPlus size={18} className="text-cyan-400" /> Suggested Connections
               </h3>
               <div className="space-y-4">
                  {users.slice(0, 4).map(user => (
                     <div key={user.id} className="flex items-center justify-between gap-3 group">
                        <div className="flex items-center gap-3 min-w-0">
                           <img 
                             src={user.profileImage || `https://ui-avatars.com/api/?name=${user.username}&background=random`} 
                             className="w-10 h-10 rounded-xl object-cover bg-[#181D2A]"
                           />
                           <div className="min-w-0">
                              <p className="text-sm font-black text-white truncate group-hover:text-[#7B5CFA] transition-colors">{user.username}</p>
                              <p className="text-[9px] font-bold text-[#5A6478] uppercase truncate">{user.profileType || 'Creative'}</p>
                           </div>
                        </div>
                        <button 
                          onClick={() => handleConnect(user.id)}
                          disabled={user.requested}
                          className="w-8 h-8 rounded-full bg-[#181D2A] border border-white/[0.04] flex items-center justify-center text-[#8B95A5] hover:text-white hover:bg-[#7B5CFA] hover:border-[#7B5CFA] transition-all flex-shrink-0"
                        >
                           {user.requested ? <Check size={14} /> : <Plus size={14} />}
                        </button>
                     </div>
                  ))}
               </div>
            </div>
            
            {/* Promo Card */}
            <div className="bg-gradient-to-br from-[#181D2A] to-[#0F131E] border border-white/[0.04] rounded-3xl p-6 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-[#7B5CFA]/10 rounded-full blur-2xl -mr-10 -mt-10" />
               <h4 className="text-white font-black text-lg leading-tight mb-2 relative z-10">Expand Your Creative Circle</h4>
               <p className="text-[#8B95A5] text-xs font-medium leading-relaxed mb-6 relative z-10">Connect with industry leaders and build your dream collaborative team today.</p>
               <button className="w-full bg-[#7B5CFA] text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest relative z-10 hover:bg-[#6B4CE0] transition-colors">
                  Explore More
               </button>
            </div>

         </div>

      </div>
    </div>
  );
};

export default Network;
