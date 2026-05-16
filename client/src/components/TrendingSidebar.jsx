import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus } from 'lucide-react';

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
    <aside className="hidden xl:block w-80 h-screen sticky top-0 p-6 overflow-y-auto">
      <div className="bg-surface rounded-2xl border border-gray-800 p-6">
        <h3 className="text-lg font-bold text-white mb-6">Trending Creators</h3>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {creators.map(creator => (
              <div key={creator.id} className="flex items-center gap-3">
                <img 
                  src={creator.profileImage} 
                  alt={creator.username} 
                  className="w-10 h-10 rounded-full object-cover border border-gray-700"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm truncate">@{creator.username}</p>
                  <p className="text-xs text-textMuted truncate">{creator.category}</p>
                </div>
                <button className="p-2 bg-white/5 hover:bg-primary/20 hover:text-primary rounded-lg transition-colors text-textMuted">
                  <UserPlus size={18} />
                </button>
              </div>
            ))}
          </div>
        )}

        <button className="w-full mt-8 py-2 text-sm font-bold text-primary hover:text-violet-400 transition">
          Show More
        </button>
      </div>

      <div className="mt-6 px-6 text-[10px] text-textMuted flex flex-wrap gap-x-4 gap-y-2 uppercase tracking-widest font-bold">
        <span>Terms</span>
        <span>Privacy</span>
        <span>Cookies</span>
        <span>More</span>
        <span>© 2026 StageLoop</span>
      </div>
    </aside>
  );
};

export default TrendingSidebar;
