import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Users, Search, UserPlus, MessageSquare, 
  Layers, Bell, ArrowRight, Check, X,
  Plus, Calendar, Target, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CreateCircleModal from '../components/network/CreateCircleModal';
import useAuthStore from '../store/useAuthStore';

const Network = () => {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('DISCOVER'); // DISCOVER, CONNECTIONS, REQUESTS, CIRCLES
  const [isCircleModalOpen, setIsCircleModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [connections, setConnections] = useState([]);
  const [requests, setRequests] = useState([]);
  const [circles, setCircles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      if (activeTab === 'DISCOVER') {
        const res = await axios.get(`http://localhost:5000/api/network/discover?search=${search}`, { headers });
        setUsers(res.data);
      } else if (activeTab === 'CONNECTIONS') {
        const res = await axios.get('http://localhost:5000/api/network/connections', { headers });
        setConnections(res.data);
      } else if (activeTab === 'REQUESTS') {
        const res = await axios.get('http://localhost:5000/api/network/requests', { headers });
        setRequests(res.data);
      } else if (activeTab === 'CIRCLES') {
        const res = await axios.get('http://localhost:5000/api/circles', { headers });
        setCircles(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (receiverId) => {
    try {
      await axios.post('http://localhost:5000/api/network/connect', { receiverId }, {
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
      await axios.patch(`http://localhost:5000/api/network/requests/${requestId}`, { action }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(requests.filter(r => r.id !== requestId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-primary font-black uppercase text-[10px] tracking-[0.2em]">
            <Globe size={14} /> Global Creative Network
          </div>
          <h1 className="text-5xl font-black text-textMain tracking-tighter leading-none">
            Expand Your <span className="text-primary italic">Circle</span>
          </h1>
          <p className="text-textMuted font-medium max-w-lg">
            Connect with verified creatives, form project teams, and build your professional reputation on Micollab.
          </p>
        </div>

        <div className="flex bg-white/50 backdrop-blur-md p-1.5 rounded-2xl border border-divider">
          {['DISCOVER', 'CONNECTIONS', 'REQUESTS', 'CIRCLES'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'text-textMuted hover:text-textMain'}`}
            >
              {tab.replace('_', ' ')}
              {tab === 'REQUESTS' && requests.length > 0 && (
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
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-textMuted group-focus-within:text-primary transition-colors" size={20} />
                <input 
                  type="text"
                  placeholder="Search by name, skill, or bio..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && fetchData()}
                  className="w-full bg-white border-2 border-divider rounded-[2rem] py-5 pl-16 pr-8 text-sm font-bold focus:border-primary outline-none transition-all shadow-sm"
                />
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                   {[1,2,3,4,5,6].map(i => <div key={i} className="h-64 bg-gray-100 rounded-3xl" />)}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {users.map(user => (
                    <motion.div 
                      whileHover={{ y: -5 }}
                      key={user.id} 
                      className="bg-white border border-divider rounded-[2rem] p-6 group transition-all hover:shadow-xl hover:shadow-gray-100"
                    >
                      <div className="relative mb-6">
                        <img 
                          src={user.profileImage || `https://ui-avatars.com/api/?name=${user.username}&background=random`} 
                          alt={user.username}
                          className="w-20 h-20 rounded-2xl object-cover ring-4 ring-gray-50"
                        />
                        {user.isVerified && (
                          <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-full border-4 border-white">
                            <Check size={12} strokeWidth={4} />
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-1 mb-4">
                        <h3 className="text-xl font-black text-textMain tracking-tight">{user.username}</h3>
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest">{user.profileType}</p>
                      </div>

                      <p className="text-xs text-textMuted line-clamp-2 mb-6 font-medium leading-relaxed h-8">
                        {user.bio || "No bio available yet."}
                      </p>

                      <div className="flex items-center gap-2 pt-4 border-t border-divider">
                        <button 
                          onClick={() => handleConnect(user.id)}
                          disabled={user.requested}
                          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${user.requested ? 'bg-gray-100 text-textMuted' : 'bg-surface border border-divider text-textMain hover:border-primary hover:text-primary'}`}
                        >
                          {user.requested ? 'Requested' : 'Connect'}
                        </button>
                        <button className="p-3 rounded-xl bg-gray-50 text-textMuted hover:text-primary transition-all">
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
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                       <Users size={40} className="text-textMuted opacity-20" />
                    </div>
                    <h3 className="text-2xl font-black text-textMain tracking-tight">No connections yet</h3>
                    <p className="text-textMuted mt-2">Start exploring the network to build your creative circle.</p>
                 </div>
               )}
               {connections.map(user => (
                 <div key={user.id} className="bg-white border border-divider rounded-3xl p-6 flex items-center gap-6">
                    <img src={user.profileImage || `https://ui-avatars.com/api/?name=${user.username}&background=random`} className="w-16 h-16 rounded-2xl object-cover" />
                    <div className="flex-1">
                       <h3 className="text-lg font-black text-textMain">{user.username}</h3>
                       <p className="text-[10px] font-black text-primary uppercase tracking-widest">{user.profileType}</p>
                    </div>
                    <button className="bg-gray-50 p-3 rounded-xl text-textMuted hover:text-primary transition-all">
                       <MessageSquare size={18} />
                    </button>
                 </div>
               ))}
            </div>
          )}

          {activeTab === 'REQUESTS' && (
            <div className="max-w-2xl space-y-4">
               {requests.length === 0 && !loading && (
                 <div className="py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-divider">
                    <Bell size={40} className="text-textMuted mx-auto mb-4 opacity-20" />
                    <p className="text-textMuted font-black uppercase text-[10px] tracking-widest">No pending requests</p>
                 </div>
               )}
               {requests.map(req => (
                 <div key={req.id} className="bg-white border border-divider rounded-3xl p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <img src={req.requester.profileImage || `https://ui-avatars.com/api/?name=${req.requester.username}&background=random`} className="w-12 h-12 rounded-xl object-cover" />
                       <div>
                          <p className="font-black text-textMain">{req.requester.username}</p>
                          <p className="text-[9px] font-black text-primary uppercase tracking-widest">Wants to connect</p>
                       </div>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => handleRequest(req.id, 'ACCEPTED')} className="bg-primary text-white p-3 rounded-xl hover:shadow-lg shadow-primary/20 transition-all">
                          <Check size={18} />
                       </button>
                       <button onClick={() => handleRequest(req.id, 'DECLINED')} className="bg-gray-50 text-textMuted p-3 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all">
                          <X size={18} />
                       </button>
                    </div>
                 </div>
               ))}
            </div>
          )}

          {activeTab === 'CIRCLES' && (
            <div className="space-y-8">
               <div className="flex justify-between items-center bg-surface border border-divider p-8 rounded-3xl">
                  <div className="flex items-center gap-6">
                     <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                        <Layers size={32} />
                     </div>
                     <div>
                        <h2 className="text-2xl font-black text-textMain tracking-tight">Collaboration Circles</h2>
                        <p className="text-sm text-textMuted font-medium">Recruit talent from your network for high-stakes projects.</p>
                     </div>
                  </div>
                  <button 
                    onClick={() => setIsCircleModalOpen(true)}
                    className="btn-primary py-4 px-8 rounded-2xl flex items-center gap-3 font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20"
                  >
                     <Plus size={18} /> Start a Circle
                  </button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {circles.length === 0 && !loading && (
                    <div className="col-span-full py-20 text-center">
                       <p className="text-textMuted font-black uppercase text-[10px] tracking-widest">You haven't joined any circles yet.</p>
                    </div>
                  )}
                  {circles.map(circle => (
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      key={circle.id} 
                      className="bg-white border-2 border-divider rounded-[2.5rem] p-8 relative overflow-hidden group cursor-pointer"
                      onClick={() => navigate(`/circles/${circle.id}`)}
                    >
                       <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
                       
                       <div className="flex justify-between items-start mb-6">
                          <div>
                             <h3 className="text-2xl font-black text-textMain tracking-tighter mb-2">{circle.name}</h3>
                             <div className="flex items-center gap-2 text-primary font-black uppercase text-[9px] tracking-widest">
                                <Target size={12} /> {circle.status}
                             </div>
                          </div>
                          <div className="flex -space-x-3">
                             {circle.members?.slice(0, 3).map((m, i) => (
                               <img key={i} src={m.user.profileImage || `https://ui-avatars.com/api/?name=${m.user.username}`} className="w-10 h-10 rounded-full border-4 border-white shadow-sm" />
                             ))}
                             {circle._count?.members > 3 && (
                               <div className="w-10 h-10 rounded-full bg-gray-100 border-4 border-white flex items-center justify-center text-[10px] font-black text-textMuted">
                                  +{circle._count.members - 3}
                               </div>
                             )}
                          </div>
                       </div>

                       <div className="grid grid-cols-2 gap-4 mb-8">
                          <div className="bg-gray-50 p-4 rounded-2xl">
                             <p className="text-[8px] font-black text-textMuted uppercase tracking-widest mb-1">Proposed Duration</p>
                             <p className="text-sm font-black text-textMain">{circle.duration || 'Flexible'}</p>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-2xl">
                             <p className="text-[8px] font-black text-textMuted uppercase tracking-widest mb-1">Start Date</p>
                             <p className="text-sm font-black text-textMain">{circle.startDate ? new Date(circle.startDate).toLocaleDateString() : 'TBD'}</p>
                          </div>
                       </div>

                       <button className="w-full bg-surface border-2 border-divider py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-primary hover:text-primary transition-all">
                          Enter Workspace
                       </button>
                    </motion.div>
                  ))}
               </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <CreateCircleModal 
        isOpen={isCircleModalOpen} 
        onClose={() => setIsCircleModalOpen(false)}
        onSuccess={(newCircle) => {
          setCircles([newCircle, ...circles]);
          setActiveTab('CIRCLES');
        }}
      />
    </div>
  );
};

export default Network;
