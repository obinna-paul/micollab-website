import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Flame, UserPlus, ScanFace, Plus, Check, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

const TrendingSidebar = () => {
  const [creators, setCreators] = useState([]);
  const [newCollabs, setNewCollabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestedIds, setRequestedIds] = useState(new Set());
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [creatorsRes, collabsRes] = await Promise.all([
          axios.get('/api/users/trending'),
          axios.get('/api/collabs')
        ]);
        setCreators(creatorsRes.data);
        const sortedCollabs = collabsRes.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setNewCollabs(sortedCollabs.slice(0, 2));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleConnect = async (creatorId) => {
    if (requestedIds.has(creatorId)) return;
    try {
      await axios.post('/api/network/connect', { receiverId: creatorId });
      setRequestedIds(prev => new Set(prev).add(creatorId));
    } catch (error) {
      console.error('Failed to send connection request:', error);
      if (error.response?.data?.error === 'Connection request already exists' || error.response?.data?.error === 'Already connected') {
        setRequestedIds(prev => new Set(prev).add(creatorId));
      }
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-10">
      
      {/* New Collabs */}
      <div>
        <div className="flex items-center gap-2 mb-4 px-2">
          <Sparkles size={16} className="text-[#34D399]" />
          <h3 className="text-sm font-black text-[var(--text-primary)] tracking-tight">New Collabs</h3>
        </div>

        {loading ? (
          <div className="flex justify-center py-4">
             <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-[#7B5CFA]"></div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {newCollabs.length > 0 ? newCollabs.map(collab => (
              <div 
                key={collab.id}
                onClick={() => navigate('/collabs')}
                className="bg-[var(--bg-surface-alt)] p-4 rounded-2xl border border-[var(--border-primary)] hover:border-[var(--border-secondary)] transition cursor-pointer"
              >
                 <div className="flex justify-between items-center mb-1">
                   <span className="text-[10px] font-black text-[#7B5CFA] tracking-widest uppercase">{collab.category}</span>
                   <span className="text-[10px] font-bold text-[var(--text-secondary)]">{collab.budget || 'Open Budget'}</span>
                 </div>
                 <p className="text-sm font-bold text-[var(--text-primary)] mb-4">{collab.title}</p>
                 <div className="flex items-center gap-2">
                   <img 
                     src={collab.poster?.profileImage || `https://ui-avatars.com/api/?name=${collab.poster?.username}`} 
                     className="w-6 h-6 rounded-full border border-[var(--border-primary)] z-30 bg-[var(--bg-base)] object-cover" 
                     alt="" 
                   />
                   <span className="text-[10px] font-bold text-[var(--text-secondary)]">
                     @{collab.poster?.username}
                   </span>
                 </div>
              </div>
            )) : (
              <div className="text-center py-4 text-xs font-bold text-[var(--text-muted)]">No new collabs found.</div>
            )}
          </div>
        )}
      </div>

      {/* Suggested Peers */}
      <div>
        <div className="flex items-center gap-2 mb-4 px-2">
          <ScanFace size={16} className="text-[#A37BFF]" />
          <h3 className="text-sm font-black text-[var(--text-primary)] tracking-tight">Suggested Peers</h3>
        </div>

        {loading ? (
          <div className="flex justify-center py-4">
             <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-[#7B5CFA]"></div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 px-2">
            {creators.filter(c => c.id !== user?.id).slice(0, 3).map(creator => {
              const isRequested = requestedIds.has(creator.id);
              return (
                <div key={creator.id} className="flex items-center justify-between group">
                  <Link to={`/profile/${creator.username}`} className="flex items-center gap-3">
                    <img 
                      src={creator.profileImage || `https://ui-avatars.com/api/?name=${creator.username}&background=random`} 
                      alt={creator.username} 
                      className="w-9 h-9 rounded-full object-cover border border-[var(--border-secondary)]"
                    />
                    <div>
                      <p className="font-bold text-[var(--text-primary)] text-sm hover:underline">{creator.name || creator.username}</p>
                      <p className="text-[11px] text-[var(--text-secondary)] font-medium">{creator.profileType || 'Creator'}</p>
                    </div>
                  </Link>
                  <button 
                    onClick={() => handleConnect(creator.id)}
                    disabled={isRequested}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all shadow-sm ${
                      isRequested 
                        ? 'bg-[#34D399]/20 border border-[#34D399]/30 text-[#34D399]'
                        : 'bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] text-[var(--text-primary)] hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    {isRequested ? <Check size={14} /> : <Plus size={14} />}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default TrendingSidebar;
