import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Flame, UserPlus, ScanFace, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

const TrendingSidebar = () => {
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await axios.get('/api/users/trending');
        setCreators(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrending();
  }, []);

  return (
    <div className="flex flex-col gap-8 pb-10">
      
      {/* Trending Collabs */}
      <div>
        <div className="flex items-center gap-2 mb-4 px-2">
          <Flame size={16} className="text-[#FF5C00]" />
          <h3 className="text-sm font-black text-white tracking-tight">Trending Collabs</h3>
        </div>

        <div className="flex flex-col gap-3">
          {/* Collab 1 */}
          <div className="bg-[#181D2A] p-4 rounded-2xl border border-white/5 hover:border-white/10 transition cursor-pointer">
             <div className="flex justify-between items-center mb-1">
               <span className="text-[10px] font-black text-[#00B5D8] tracking-widest uppercase">Audio/Visual</span>
               <span className="text-[10px] font-bold text-[#8B95A5]">1.2k active</span>
             </div>
             <p className="text-sm font-bold text-white mb-4">Synthwave Revival Project</p>
             <div className="flex items-center gap-[-8px]">
               <img src="https://ui-avatars.com/api/?name=J&background=7B5CFA&color=fff" className="w-6 h-6 rounded-full border border-[#181D2A] z-30" alt="" />
               <img src="https://ui-avatars.com/api/?name=A&background=EC4899&color=fff" className="w-6 h-6 rounded-full border border-[#181D2A] z-20 -ml-2" alt="" />
               <img src="https://ui-avatars.com/api/?name=M&background=00B5D8&color=fff" className="w-6 h-6 rounded-full border border-[#181D2A] z-10 -ml-2" alt="" />
               <div className="w-6 h-6 rounded-full border border-[#181D2A] z-0 -ml-2 bg-[#0F131E] flex items-center justify-center text-[8px] font-bold text-[#8B95A5]">+12</div>
             </div>
          </div>

          {/* Collab 2 */}
          <div className="bg-[#181D2A] p-4 rounded-2xl border border-white/5 hover:border-white/10 transition cursor-pointer">
             <div className="flex justify-between items-center mb-1">
               <span className="text-[10px] font-black text-[#EC4899] tracking-widest uppercase">Game Dev</span>
               <span className="text-[10px] font-bold text-[#8B95A5]">850 active</span>
             </div>
             <p className="text-sm font-bold text-white mb-4">Indie RPG Asset Creation</p>
             <div className="flex items-center gap-[-8px]">
               <img src="https://ui-avatars.com/api/?name=S&background=00B5D8&color=fff" className="w-6 h-6 rounded-full border border-[#181D2A] z-20" alt="" />
               <img src="https://ui-avatars.com/api/?name=K&background=7B5CFA&color=fff" className="w-6 h-6 rounded-full border border-[#181D2A] z-10 -ml-2" alt="" />
               <div className="w-6 h-6 rounded-full border border-[#181D2A] z-0 -ml-2 bg-[#0F131E] flex items-center justify-center text-[8px] font-bold text-[#8B95A5]">+5</div>
             </div>
          </div>
        </div>
      </div>

      {/* Suggested Peers */}
      <div>
        <div className="flex items-center gap-2 mb-4 px-2">
          <ScanFace size={16} className="text-[#A37BFF]" />
          <h3 className="text-sm font-black text-white tracking-tight">Suggested Peers</h3>
        </div>

        {loading ? (
          <div className="flex justify-center py-4">
             <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-[#7B5CFA]"></div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 px-2">
            {creators.slice(0, 3).map(creator => (
              <div key={creator.id} className="flex items-center justify-between group">
                <Link to={`/profile/${creator.username}`} className="flex items-center gap-3">
                  <img 
                    src={creator.profileImage || `https://ui-avatars.com/api/?name=${creator.username}&background=random`} 
                    alt={creator.username} 
                    className="w-9 h-9 rounded-full object-cover border border-white/10"
                  />
                  <div>
                    <p className="font-bold text-white text-sm hover:underline">{creator.name || creator.username}</p>
                    <p className="text-[11px] text-[#8B95A5] font-medium">{creator.profileType || 'Creator'}</p>
                  </div>
                </Link>
                <button className="w-7 h-7 rounded-full bg-[#181D2A] border border-white/5 flex items-center justify-center text-white hover:bg-white/10 hover:border-white/20 transition-all shadow-sm">
                  <Plus size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default TrendingSidebar;
