import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Users, Search, UserPlus, MessageSquare, 
  Bell, Check, X, Plus, Flame, Star, Heart, CheckCircle2, ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../store/useAuthStore';

/* ─── helpers ─── */
const getGradient = (str = 'creative') => {
  const gradients = [
    'from-indigo-500 via-purple-500 to-pink-500',
    'from-cyan-500 to-blue-500',
    'from-emerald-400 to-cyan-400',
    'from-fuchsia-600 to-pink-600',
    'from-orange-400 to-rose-400',
    'from-blue-600 via-indigo-600 to-purple-600'
  ];
  const hash = str.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return gradients[hash % gradients.length];
};

const getCategory = (user) => {
  if (!user.profileType) return 'Creative';
  return user.profileType.split(',')[0].trim();
};

const Network = () => {
  const { token, user: currentUser } = useAuthStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('DISCOVER');
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [connections, setConnections] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All Creatives');
  const [localFollows, setLocalFollows] = useState({});
  const [localLikes, setLocalLikes] = useState({});

  const FILTERS = ['All Creatives', 'Sound Designers', 'Visual Artists', 'Filmmakers', 'Developers'];

  useEffect(() => { fetchData(); }, [activeTab, filter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      if (activeTab === 'DISCOVER') {
        let sq = search;
        if (filter !== 'All Creatives') {
          const m = { 'Sound Designers': 'Sound', 'Visual Artists': 'Artist', 'Filmmakers': 'Film', 'Developers': 'Developer' };
          sq = m[filter] || '';
        }
        const res = await axios.get(`/api/network/discover?search=${sq}`, { headers });
        setUsers(res.data);
      } else if (activeTab === 'CONNECTIONS') {
        const res = await axios.get('/api/network/connections', { headers });
        setConnections(res.data);
      } else if (activeTab === 'REQUESTS') {
        const res = await axios.get('/api/network/requests', { headers });
        setRequests(res.data);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleConnect = async (receiverId) => {
    try {
      await axios.post('/api/network/connect', { receiverId }, { headers: { Authorization: `Bearer ${token}` } });
      setUsers(users.map(u => u.id === receiverId ? { ...u, requested: true } : u));
    } catch (err) { console.error(err); }
  };

  const handleRequest = async (requestId, action) => {
    try {
      await axios.patch(`/api/network/requests/${requestId}`, { action }, { headers: { Authorization: `Bearer ${token}` } });
      setRequests(requests.filter(r => r.id !== requestId));
    } catch (err) { console.error(err); }
  };

  const handleStartChat = async (targetId) => {
    try {
      await axios.post('/api/messages/conversation', { targetUserId: targetId, type: 'DIRECT' }, { headers: { Authorization: `Bearer ${token}` } });
      navigate('/messages');
    } catch (err) { console.error(err); }
  };

  const handleUnfollow = async (targetId) => {
    if (window.confirm("Unfollow this user?")) {
      try {
        await axios.delete(`/api/network/connections/${targetId}`, { headers: { Authorization: `Bearer ${token}` } });
        setUsers(users.map(u => u.id === targetId ? { ...u, connectionStatus: 'NONE', requested: false } : u));
        setConnections(connections.filter(u => u.id !== targetId));
      } catch (err) { console.error(err); }
    }
  };

  const toggleFollow = (userId) => setLocalFollows(p => ({ ...p, [userId]: !p[userId] }));
  const toggleLike  = (userId) => setLocalLikes(p  => ({ ...p, [userId]: !p[userId] }));

  /* ── Profile Card — compact square ── */
  const ProfileCard = ({ user, idx }) => {
    const status = user.requested ? 'REQUESTED' : (user.connectionStatus || 'NONE');
    const skills = user.skills ? user.skills.split(',').map(s => s.trim()).filter(Boolean).slice(0, 3) : [];

    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: idx * 0.03 }}
        whileHover={{ y: -3, transition: { duration: 0.15 } }}
        className="nw-card bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-xl flex flex-col items-center text-center cursor-pointer"
        style={{ padding: '20px 16px 16px' }}
        onClick={() => navigate(`/profile/${user.username}`)}
      >
        {/* Avatar */}
        <div className="relative mb-2.5">
          <div className={`absolute -inset-[2px] rounded-full bg-gradient-to-br ${getGradient(user.username)} opacity-70 blur-[1px]`} />
          <img
            src={user.profileImage || `https://ui-avatars.com/api/?name=${user.username}&background=random&size=96`}
            alt={user.username}
            className="w-12 h-12 rounded-full object-cover relative z-10 border-2 border-[#131720]"
          />
          {user.isVerified === 'YES' && (
            <div className="absolute -bottom-0.5 -right-0.5 z-20 bg-[#22D3EE] text-[#0B0F18] p-[2px] rounded-full border-[1.5px] border-[#131720]">
              <Check size={6} strokeWidth={4} />
            </div>
          )}
        </div>

        <h3 className="text-[13px] font-bold text-[var(--text-primary)] leading-tight">{user.username}</h3>
        <p className="text-[10px] font-medium text-[#7B5CFA] mt-0.5">{getCategory(user)}</p>

        {/* Skills */}
        <div className="flex flex-wrap justify-center gap-[5px] mt-2.5 mb-3">
          {skills.map((skill, i) => (
            <span key={i} className="bg-[var(--bg-elevated)] border border-[var(--border-primary)] text-[var(--text-secondary)] text-[9px] font-medium px-2 py-[3px] rounded-md">
              {skill}
            </span>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex gap-2 w-full mt-auto">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/profile/${user.username}`); }}
            className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border-primary)] hover:bg-white/[0.06] text-[var(--text-primary)] text-[10px] font-semibold py-[7px] rounded-lg transition-all"
          >
            Profile
          </button>
          <button
            disabled={status === 'REQUESTED'}
            onClick={(e) => { 
              e.stopPropagation(); 
              if (status === 'CONNECTED') {
                handleUnfollow(user.id);
              } else {
                handleConnect(user.id); 
              }
            }}
            className={`flex-1 text-[10px] font-semibold py-[7px] rounded-lg transition-all ${
              status === 'CONNECTED'
                ? 'bg-transparent text-cyan-400 border border-cyan-400/30'
                : status === 'REQUESTED'
                ? 'bg-transparent text-gray-400 border border-gray-400/30'
                : 'bg-[#7B5CFA] hover:bg-[#6A4DE8] text-white'
            }`}
          >
            {status === 'CONNECTED' ? (
              <span className="flex items-center justify-center gap-1"><Check size={8} strokeWidth={3} />Following</span>
            ) : status === 'REQUESTED' ? (
              <span className="flex items-center justify-center gap-1">Request Sent</span>
            ) : (
              'Connect'
            )}
          </button>
        </div>
      </motion.div>
    );
  };



  /* ── Skeletons ── */
  const SkeletonProfile = () => (
    <div className="nw-card bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-xl p-4 animate-pulse flex flex-col items-center">
      <div className="w-12 h-12 rounded-full bg-[var(--bg-elevated)] mb-2.5" />
      <div className="w-20 h-2.5 bg-[var(--bg-elevated)] rounded mb-1.5" />
      <div className="w-14 h-2 bg-[var(--bg-elevated)] rounded mb-3" />
      <div className="flex gap-1 mb-3"><div className="w-10 h-4 bg-[var(--bg-elevated)] rounded" /><div className="w-8 h-4 bg-[var(--bg-elevated)] rounded" /><div className="w-12 h-4 bg-[var(--bg-elevated)] rounded" /></div>
      <div className="flex gap-2 w-full"><div className="flex-1 h-7 bg-[var(--bg-elevated)] rounded-lg" /><div className="flex-1 h-7 bg-[var(--bg-elevated)] rounded-lg" /></div>
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4 md:py-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-[var(--border-primary)] pb-5 mb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--text-primary)] tracking-tight leading-tight mb-0.5">Discover Creatives</h1>
          <p className="text-[var(--text-secondary)] font-medium text-[11px]">Find your next collaborator from our curated network.</p>
        </div>
        <div className="flex overflow-x-auto gap-1.5 pb-1 md:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => { setFilter(f); setActiveTab('DISCOVER'); }}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${
                filter === f && activeTab === 'DISCOVER'
                  ? 'bg-[#7B5CFA] text-white border-[#7B5CFA] shadow-md shadow-[#7B5CFA]/20'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-primary)] hover:border-white/15 hover:text-[var(--text-primary)]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Sub-bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[var(--bg-surface)]/40 border border-[var(--border-primary)] p-2.5 rounded-xl mb-6">
        <div className="relative group w-full sm:w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[#7B5CFA] transition-colors" size={13} />
          <input
            type="text"
            placeholder="Search creatives..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && fetchData()}
            className="w-full bg-[var(--bg-sunken)] border border-[var(--border-primary)] rounded-lg py-1.5 pl-8 pr-3 text-[11px] font-medium focus:border-[#7B5CFA]/40 text-[var(--text-primary)] outline-none transition-all placeholder-[#5A6478]"
          />
        </div>
        <div className="flex bg-[var(--bg-sunken)] border border-[var(--border-primary)] p-0.5 rounded-lg w-full sm:w-auto">
          {['DISCOVER', 'CONNECTIONS', 'REQUESTS'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                activeTab === tab ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              {tab === 'DISCOVER' ? 'Discover' : tab === 'CONNECTIONS' ? 'Connections' : 'Requests'}
              {tab === 'REQUESTS' && requests.length > 0 && (
                <span className="ml-1 bg-red-500 text-white px-1 py-[1px] rounded-full text-[7px] font-bold">{requests.length}</span>
              )}
              {tab === 'CONNECTIONS' && connections.length > 0 && (
                <span className="ml-1 bg-[#7B5CFA]/20 text-[#A37BFF] px-1 py-[1px] rounded-full text-[7px] font-bold">{connections.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab + '_' + filter}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="min-h-[400px]"
        >
          {activeTab === 'DISCOVER' && (
            <>
              {loading ? (
                <div className="nw-masonry">
                  {[...Array(8)].map((_, i) => (
                    <SkeletonProfile key={i} />
                  ))}
                </div>
              ) : users.length === 0 ? (
                <div className="py-16 text-center bg-[var(--bg-surface)]/40 rounded-xl border border-[var(--border-primary)]">
                  <div className="w-12 h-12 bg-[var(--bg-sunken)] rounded-full flex items-center justify-center mx-auto mb-3 border border-[var(--border-primary)]">
                    <Users size={22} className="text-[var(--text-muted)]" />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">No creatives found</h3>
                  <p className="text-[var(--text-secondary)] mt-1 text-[11px] max-w-xs mx-auto">Try broadening your search or choosing a different filter.</p>
                </div>
              ) : (
                <div className="nw-masonry">
                  {users.map((user, idx) => (
                    <ProfileCard key={user.id} user={user} idx={idx} />
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'CONNECTIONS' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {connections.length === 0 && !loading && (
                <div className="col-span-full py-16 text-center bg-[var(--bg-surface)] rounded-xl border border-[var(--border-primary)]">
                  <div className="w-12 h-12 bg-[var(--bg-sunken)] rounded-full flex items-center justify-center mx-auto mb-3 border border-[var(--border-primary)]">
                    <Users size={22} className="text-[var(--text-muted)]" />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">No connections yet</h3>
                  <p className="text-[var(--text-secondary)] mt-1 text-[11px]">Start exploring to connect with creators.</p>
                </div>
              )}
              {connections.map(user => (
                <div key={user.id} className="bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-xl p-3.5 flex items-center gap-3 hover:border-[#7B5CFA]/20 transition-all">
                  <Link to={`/profile/${user.username}`}>
                    <img src={user.profileImage || `https://ui-avatars.com/api/?name=${user.username}&background=random`} className="w-10 h-10 rounded-lg object-cover border border-[var(--border-primary)] hover:opacity-80 transition" alt={user.username} />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/profile/${user.username}`}>
                      <h3 className="text-[13px] font-bold text-[var(--text-primary)] truncate hover:text-[#7B5CFA] hover:underline transition">{user.username}</h3>
                    </Link>
                    <p className="text-[9px] font-bold text-cyan-400 uppercase tracking-wider mt-0.5 truncate">{user.profileType}</p>
                  </div>
                  <button onClick={() => handleStartChat(user.id)} className="bg-[var(--bg-sunken)] p-2 rounded-lg border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[#7B5CFA] hover:border-[#7B5CFA]/30 transition-all flex-shrink-0">
                    <MessageSquare size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'REQUESTS' && (
            <div className="max-w-xl mx-auto space-y-3">
              {requests.length === 0 && !loading && (
                <div className="py-16 text-center bg-[var(--bg-surface)] rounded-xl border border-[var(--border-primary)]">
                  <div className="w-12 h-12 bg-[var(--bg-sunken)] rounded-full flex items-center justify-center mx-auto mb-3 border border-[var(--border-primary)]">
                    <Bell size={22} className="text-[var(--text-muted)]" />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">No pending requests</h3>
                </div>
              )}
              {requests.map(req => (
                <div key={req.id} className="bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Link to={`/profile/${req.fromUser?.username}`}>
                      <img src={req.fromUser?.profileImage || `https://ui-avatars.com/api/?name=${req.fromUser?.username}&background=random`} className="w-10 h-10 rounded-lg object-cover border border-[var(--border-primary)] hover:opacity-80 transition" alt={req.fromUser?.username} />
                    </Link>
                    <div className="flex-1">
                      <Link to={`/profile/${req.fromUser?.username}`}>
                        <p className="font-bold text-[var(--text-primary)] text-[13px] hover:text-[#7B5CFA] hover:underline transition">{req.fromUser?.username}</p>
                      </Link>
                      <p className="text-[9px] font-medium text-[var(--text-muted)] uppercase tracking-wider mt-0.5">Wants to connect</p>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button onClick={() => handleRequest(req.id, 'ACCEPTED')} className="flex-1 sm:flex-none bg-[#7B5CFA] hover:bg-[#6A4DE8] text-white px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all">Accept</button>
                    <button onClick={() => handleRequest(req.id, 'DECLINED')} className="flex-1 sm:flex-none bg-[var(--bg-sunken)] border border-[var(--border-primary)] text-[var(--text-secondary)] px-4 py-2 rounded-lg hover:bg-red-500/10 hover:text-red-500 transition-all text-[9px] font-bold uppercase tracking-wider">Decline</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Masonry styles — CSS columns give equal-width, variable-height cards */}
      <style>{`
        .nw-masonry {
          columns: 5 220px;
          column-gap: 14px;
          padding-bottom: 40px;
        }
        .nw-card {
          break-inside: avoid;
          margin-bottom: 14px;
          display: inline-flex;
          flex-direction: column;
          width: 100%;
        }
        .nw-card:hover {
          border-color: rgba(123, 92, 250, 0.2);
          box-shadow: 0 4px 20px rgba(123, 92, 250, 0.06);
        }
        @media (max-width: 1280px) {
          .nw-masonry { columns: 4 200px; }
        }
        @media (max-width: 1024px) {
          .nw-masonry { columns: 3 200px; }
        }
        @media (max-width: 768px) {
          .nw-masonry { columns: 2 180px; }
        }
        @media (max-width: 480px) {
          .nw-masonry { columns: 1; }
        }
      `}</style>
    </div>
  );
};

export default Network;
