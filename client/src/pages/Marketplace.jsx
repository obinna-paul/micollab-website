import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Briefcase, MapPin, DollarSign, Calendar, Search, Filter, ChevronRight, Clock, Sparkles } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

const Marketplace = () => {
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    const fetchGigs = async () => {
      try {
        const res = await axios.get('/api/gigs');
        setGigs(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchGigs();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="card p-6">
        <h1 className="text-2xl font-black text-textMain mb-4 flex items-center gap-2">
          <Sparkles className="text-primary" />
          Creative Collabs
        </h1>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" size={20} />
            <input 
              type="text" 
              placeholder="Find acting roles, music gigs, design collabs..." 
              className="w-full bg-background border border-divider rounded-lg py-2 pl-10 pr-4 text-sm outline-none focus:border-primary"
            />
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-background border border-divider rounded-lg flex items-center gap-2 text-sm font-bold text-textMuted hover:bg-gray-100 transition">
              <Filter size={18} /> Filters
            </button>
            {user?.role === 'SCOUT' && (
               <button className="btn-primary py-2 px-6 text-sm">Post a Collab</button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div></div>
        ) : (
          gigs.map(gig => (
            <motion.div 
              key={gig.id}
              whileHover={{ scale: 1.005 }}
              className="card p-5 hover:border-primary transition-all group cursor-pointer"
            >
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex gap-4">
                  <img 
                    src={gig.poster.profileImage || 'https://via.placeholder.com/100'} 
                    className="w-16 h-16 rounded-lg border object-cover" 
                    alt="" 
                  />
                  <div>
                    <h3 className="text-lg font-bold text-textMain group-hover:text-primary transition-colors">{gig.title}</h3>
                    <p className="text-sm font-bold text-primary">{gig.poster.username} • {gig.poster.category}</p>
                    <div className="flex flex-wrap gap-4 mt-3">
                      <span className="flex items-center gap-1 text-xs text-textMuted font-bold">
                        <MapPin size={14} /> {gig.location || 'Remote'}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-textMuted font-bold">
                        <DollarSign size={14} /> {gig.budget || 'Negotiable'}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-textMuted font-bold">
                        <Clock size={14} /> Posted {new Date(gig.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-center md:items-end justify-center">
                  <button className="btn-outline py-1.5 px-6 text-sm mb-2 w-full md:w-auto">View Collab</button>
                  <p className="text-[10px] text-textMuted font-bold uppercase tracking-widest">
                    {gig._count?.applications || 0} Interested
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-divider">
                <p className="text-sm text-textMuted line-clamp-2">
                  {gig.description}
                </p>
              </div>
            </motion.div>
          ))
        )}

        {!loading && gigs.length === 0 && (
          <div className="card p-20 text-center space-y-4">
             <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Briefcase size={40} className="text-primary" />
             </div>
             <h2 className="text-xl font-bold text-textMain">No collabs found</h2>
             <p className="text-textMuted text-sm max-w-sm mx-auto">Try adjusting your filters or search keywords to find the perfect professional creative partnership.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;
