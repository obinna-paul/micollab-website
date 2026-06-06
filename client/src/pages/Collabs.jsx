import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Briefcase, Search, MapPin, Users, Clock, 
  Plus, LayoutDashboard, AlertCircle, FileText, Filter, X
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import FilterSidebar from '../components/collabs/FilterSidebar';
import CollabDetailsDrawer from '../components/collabs/CollabDetailsDrawer';
import ProposalModal from '../components/collabs/ProposalModal';
import useAuthStore from '../store/useAuthStore';

const FilterChip = ({ label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${
      active 
        ? 'bg-[#7B5CFA] text-white border-[#7B5CFA] shadow-lg shadow-[#7B5CFA]/20' 
        : 'bg-[#0F131E] text-[#8B95A5] border-[#0F131E]/5 hover:border-[#7B5CFA]/30'
    }`}
  >
    {label}
  </button>
);

const Collabs = () => {
  const { token } = useAuthStore();
  const [collabs, setCollabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('EXPLORE'); // EXPLORE, POSTINGS, APPLICATIONS
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    locationType: '',
    experienceLevel: '',
    budgetRange: 'ALL',
    verifiedOnly: false
  });

  // Drawer & Modal State
  const [selectedCollabId, setSelectedCollabId] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [activeProposalCollab, setActiveProposalCollab] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (activeView === 'EXPLORE') {
      fetchCollabs();
    } else if (activeView === 'POSTINGS') {
      fetchMyCollabs();
    } else if (activeView === 'APPLICATIONS') {
      fetchMyProposals();
    }
  }, [activeView, filters]);

  const fetchCollabs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        category: filters.category,
        locationType: filters.locationType,
        experienceLevel: filters.experienceLevel,
        verifiedOnly: filters.verifiedOnly
      });
      const res = await axios.get(`/api/collabs?${params.toString()}`);
      setCollabs(res.data);
    } catch (err) {
      console.error('[COLLABS_FETCH_ERROR]', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyCollabs = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/collabs/my-collabs', {
         headers: { Authorization: `Bearer ${token}` }
      });
      setCollabs(res.data || []);
    } catch (err) {
      console.error('[MY_COLLABS_ERROR]', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyProposals = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/collabs/my-proposals', {
         headers: { Authorization: `Bearer ${token}` }
      });
      setCollabs(res.data || []);
    } catch (err) {
      console.error('[MY_PROPOSALS_ERROR]', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="mb-6 md:mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 px-4 md:px-0">
        <div className="hidden md:block">
          <h1 className="text-4xl font-black text-white tracking-tighter flex items-center gap-3">
            <Briefcase size={40} className="text-[#7B5CFA]" />
            Collabs Hub
          </h1>
          <p className="text-[#8B95A5] mt-1 text-sm font-medium">Discover premium creative collabs and professional partnerships.</p>
        </div>
        
        <h1 className="md:hidden text-2xl font-black text-white tracking-tighter flex items-center gap-2">
          <Briefcase size={24} className="text-[#7B5CFA]" />
          Collabs
        </h1>

        <button 
          onClick={() => navigate('/collabs/new')}
          className="hidden md:flex btn-primary items-center gap-2 py-3 px-8 shadow-xl shadow-[#7B5CFA]/25 rounded-2xl"
        >
          <Plus size={20} /> Post a collab
        </button>
      </div>

      <div className="flex border-b border-[#0F131E]/5 mb-4 md:mb-10 overflow-x-auto no-scrollbar px-4 md:px-0 sticky top-0 bg-[#181D2A]/90 backdrop-blur-xl z-40 md:static md:bg-transparent md:backdrop-blur-none">
        <button 
          onClick={() => setActiveView('EXPLORE')}
          className={`flex-shrink-0 px-6 md:px-8 py-4 md:py-5 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeView === 'EXPLORE' ? 'border-[#7B5CFA] text-[#7B5CFA]' : 'border-transparent text-[#8B95A5] hover:text-white'}`}
        >
          Explore
        </button>
        <button 
          onClick={() => setActiveView('POSTINGS')}
          className={`flex-shrink-0 px-6 md:px-8 py-4 md:py-5 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeView === 'POSTINGS' ? 'border-[#7B5CFA] text-[#7B5CFA]' : 'border-transparent text-[#8B95A5] hover:text-white'}`}
        >
          Postings
        </button>
        <button 
          onClick={() => setActiveView('APPLICATIONS')}
          className={`flex-shrink-0 px-6 md:px-8 py-4 md:py-5 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeView === 'APPLICATIONS' ? 'border-[#7B5CFA] text-[#7B5CFA]' : 'border-transparent text-[#8B95A5] hover:text-white'}`}
        >
          Proposals
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Sidebar: Filters */}
        <div className="lg:col-span-3 hidden lg:block">
           <FilterSidebar filters={filters} setFilters={setFilters} />
        </div>

          {/* Center: Content */}
        <div className="lg:col-span-9 space-y-6 px-0 md:px-0">
          {activeView === 'EXPLORE' && (
            <>
              <div className="sticky top-[52px] md:relative z-30 bg-[#181D2A]/80 backdrop-blur-xl pb-4 px-4 md:px-0 md:bg-transparent md:backdrop-blur-none">
                <div className="relative mb-4 group">
                  <Search className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 text-[#8B95A5] group-focus-within:text-[#7B5CFA] transition-colors" size={20} />
                  <input 
                    type="text" 
                    placeholder="Search collabs..."
                    className="w-full bg-[#0F131E] border border-[#0F131E]/5 rounded-2xl py-4 md:py-5 pl-12 md:pl-14 pr-6 text-sm md:text-base font-medium focus:border-[#7B5CFA] focus:ring-4 focus:ring-primary/5 outline-none shadow-sm transition-all"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && fetchCollabs()}
                  />
                </div>

                {/* Mobile Filter Chips & Button */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar md:hidden">
                   <button 
                     onClick={() => setIsFilterModalOpen(true)}
                     className="flex-shrink-0 w-10 h-8 rounded-full border border-[#0F131E]/5 flex items-center justify-center bg-[#0F131E] text-white"
                   >
                     <Filter size={14} />
                   </button>
                   <div className="w-[1px] h-4 bg-divider flex-shrink-0" />
                   <FilterChip label="All" active={!filters.category} onClick={() => setFilters({...filters, category: ''})} />
                   <FilterChip label="Remote" active={filters.locationType === 'REMOTE'} onClick={() => setFilters({...filters, locationType: filters.locationType === 'REMOTE' ? '' : 'REMOTE'})} />
                   <FilterChip label="Verified" active={filters.verifiedOnly} onClick={() => setFilters({...filters, verifiedOnly: !filters.verifiedOnly})} />
                </div>
              </div>

              {loading ? (
                <div className="py-20 text-center flex flex-col items-center gap-6">
                   <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#7B5CFA]"></div>
                   <p className="text-[#8B95A5] font-black uppercase text-[10px] tracking-widest">Scouting...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {collabs && collabs.length > 0 ? (
                    collabs.map(collab => (
                      <motion.div 
                        key={collab.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -4 }}
                        onClick={() => {
                          setSelectedCollabId(collab.id);
                          setIsDrawerOpen(true);
                        }}
                        className="bg-[#0F131E] border border-[#0F131E]/5 p-4 md:p-8 rounded-2xl md:rounded-3xl cursor-pointer hover:border-[#7B5CFA]/50 hover:shadow-2xl hover:shadow-[#7B5CFA]/5 transition-all group relative overflow-hidden"
                      >
                        <div className="flex justify-between items-start mb-4 md:mb-6">
                          <div className="flex-1 min-w-0">
                             <div className="flex flex-wrap items-center gap-2 mb-2 md:mb-3">
                               <span className="bg-[#7B5CFA]/5 text-[#7B5CFA] text-[8px] md:text-[9px] font-black px-2 md:px-3 py-0.5 md:py-1 rounded-full uppercase tracking-tighter">{collab.category}</span>
                               <span className="bg-emerald-50 text-emerald-600 text-[8px] md:text-[9px] font-black px-2 md:px-3 py-0.5 md:py-1 rounded-full uppercase tracking-tighter">
                                 {collab.projectType === 'RECURRING' ? 'Recurring' : 'One-off'}
                               </span>
                             </div>
                             <h3 className="text-lg md:text-2xl font-black text-white group-hover:text-[#7B5CFA] transition-colors tracking-tight truncate pr-4">{collab.title}</h3>
                          </div>
                          <div className="text-right flex-shrink-0">
                             <p className="text-lg md:text-2xl font-black text-white">{collab.budget}</p>
                             <p className="text-[8px] md:text-[9px] text-[#8B95A5] font-black uppercase tracking-widest mt-1">Budget</p>
                          </div>
                        </div>

                        <p className="hidden md:block text-sm text-[#8B95A5] line-clamp-3 mb-8 leading-relaxed font-medium">
                          {collab.description}
                        </p>

                        <div className="flex flex-wrap items-center justify-between gap-4 md:gap-6 pt-4 md:pt-6 border-t border-[#0F131E]/5/50">
                          <div className="flex items-center gap-4 md:gap-8">
                            <div className="flex items-center gap-2 text-[#8B95A5] text-[10px] md:text-xs font-black uppercase tracking-tighter">
                              <MapPin size={14} className="text-[#7B5CFA]" />
                              {collab.location || 'Remote'}
                            </div>
                            <div className="flex items-center gap-2 text-[#8B95A5] text-[10px] md:text-xs font-black uppercase tracking-tighter">
                              <Users size={14} className="text-[#7B5CFA]" />
                              {collab._count?.proposals || 0} Proposals
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 md:gap-4">
                            <div className="text-right hidden sm:block">
                               <p className="text-[8px] md:text-[9px] text-[#8B95A5] font-black uppercase tracking-widest">{collab.poster?.profileType}</p>
                               <p className="text-xs md:text-sm font-black text-white">@{collab.poster?.username || 'creator'}</p>
                            </div>
                            <img 
                              src={collab.poster?.profileImage || `https://ui-avatars.com/api/?name=${collab.poster?.username || 'C'}`} 
                              className="w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-2xl border border-[#0F131E]/5 group-hover:border-[#7B5CFA] transition-colors object-cover shadow-sm" 
                              alt="" 
                            />
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="bg-[#0F131E] border-2 border-dashed border-[#0F131E]/5 p-20 rounded-3xl text-center">
                       <div className="w-24 h-24 bg-[#181D2A] rounded-full flex items-center justify-center text-[#8B95A5] mx-auto mb-6">
                          <AlertCircle size={48} className="opacity-20" />
                       </div>
                       <h3 className="text-2xl font-black text-white tracking-tighter">No collabs found</h3>
                       <p className="text-[#8B95A5] mt-2 font-medium">Try refining your filters or check back later.</p>
                       <button 
                         onClick={() => setFilters({ category: '', locationType: '', experienceLevel: '', budgetRange: 'ALL', verifiedOnly: false })}
                         className="text-[#7B5CFA] font-black uppercase text-[10px] tracking-widest hover:underline mt-6"
                       >
                         Reset all filters
                       </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {activeView === 'POSTINGS' && (
            <div className="space-y-6">
               <div className="flex justify-between items-center mb-8">
                  <h2 className="text-[10px] font-black text-[#8B95A5] uppercase tracking-widest">Your Active Postings</h2>
               </div>
               
               {loading ? (
                 <div className="py-20 text-center">
                   <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#7B5CFA] mx-auto"></div>
                 </div>
               ) : (
                 <div className="space-y-6">
                   {collabs.map(collab => (
                     <div key={collab.id} className="bg-[#0F131E] border border-[#0F131E]/5 p-8 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-8 hover:shadow-xl transition-all">
                        <div className="flex-1">
                           <h3 className="font-black text-white text-xl tracking-tight">{collab.title}</h3>
                           <div className="flex gap-6 mt-3">
                              <span className="text-[10px] text-[#8B95A5] font-black uppercase tracking-widest flex items-center gap-2">
                                <Users size={16} className="text-[#7B5CFA] opacity-50" /> {collab._count?.proposals || 0} applicants
                              </span>
                              <span className="text-[10px] text-[#8B95A5] font-black uppercase tracking-widest flex items-center gap-2">
                                <Clock size={16} className="text-[#7B5CFA] opacity-50" /> {new Date(collab.createdAt).toLocaleDateString()}
                              </span>
                           </div>
                        </div>
                        <div className="flex gap-3">
                           <button onClick={() => navigate(`/collabs/manage/${collab.id}`)} className="bg-[#7B5CFA]/5 text-[#7B5CFA] text-[10px] font-black px-8 py-4 rounded-2xl uppercase tracking-widest hover:bg-[#7B5CFA]/10 transition-all border border-[#7B5CFA]/20">Manage Proposals</button>
                        </div>
                     </div>
                   ))}
                   
                   {collabs.length === 0 && (
                     <div className="bg-[#0F131E] border-2 border-dashed border-[#0F131E]/5 p-20 rounded-3xl text-center">
                        <p className="text-[#8B95A5] font-black uppercase text-[10px] tracking-widest">You haven't posted any opportunities yet.</p>
                        <button onClick={() => navigate('/collabs/new')} className="text-[#7B5CFA] font-black uppercase text-xs hover:underline mt-6">Create Your First Collab</button>
                     </div>
                   )}
                 </div>
               )}
            </div>
          )}

          {activeView === 'APPLICATIONS' && (
            <div className="space-y-6">
               <div className="flex justify-between items-center mb-8">
                  <h2 className="text-[10px] font-black text-[#8B95A5] uppercase tracking-widest">Active Proposal Tracking</h2>
               </div>
               
               {loading ? (
                 <div className="py-20 text-center">
                   <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#7B5CFA] mx-auto"></div>
                 </div>
               ) : (
                 <div className="space-y-6">
                   {collabs.map(proposal => (
                     <div key={proposal.id} className="bg-[#0F131E] border border-[#0F131E]/5 p-8 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-8 hover:shadow-xl transition-all">
                        <div className="flex-1">
                           <p className="text-[9px] font-black text-[#7B5CFA] uppercase tracking-widest mb-1">Proposal for:</p>
                           <h3 className="font-black text-white text-xl tracking-tight">{proposal.collab?.title}</h3>
                           <div className="flex gap-6 mt-3">
                              <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${proposal.status === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-600' : 'bg-[#7B5CFA]/5 text-[#7B5CFA]'}`}>
                                Status: {proposal.status}
                              </span>
                              <span className="text-[10px] text-[#8B95A5] font-black uppercase tracking-widest flex items-center gap-2">
                                <Clock size={16} className="text-[#7B5CFA] opacity-50" /> Sent {new Date(proposal.createdAt).toLocaleDateString()}
                              </span>
                           </div>
                        </div>
                        <div className="flex gap-3">
                           <button onClick={() => navigate(`/collabs/${proposal.collabId}`)} className="bg-[#181D2A] border border-[#0F131E]/5 text-[10px] font-black px-8 py-4 rounded-2xl uppercase tracking-widest hover:bg-[#181D2A] transition-all">View Collab</button>
                        </div>
                     </div>
                   ))}
                   
                   {collabs.length === 0 && (
                     <div className="bg-[#0F131E] border-2 border-dashed border-[#0F131E]/5 p-20 rounded-3xl text-center">
                        <p className="text-[#8B95A5] font-black uppercase text-[10px] tracking-widest">No active proposals sent yet.</p>
                        <button onClick={() => setActiveView('EXPLORE')} className="text-[#7B5CFA] font-black uppercase text-xs hover:underline mt-6">Explore collabs</button>
                     </div>
                   )}
                 </div>
               )}
            </div>
          )}
        </div>
      </div>
      <CollabDetailsDrawer 
        collabId={selectedCollabId}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onApply={(collab) => {
          setActiveProposalCollab(collab);
          setIsModalOpen(true);
        }}
      />

      <ProposalModal 
        collab={activeProposalCollab}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsDrawerOpen(false);
          setActiveView('APPLICATIONS');
        }}
      />

      {/* Mobile Filter Modal */}
      <AnimatePresence>
        {isFilterModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => setIsFilterModalOpen(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-[#0F131E] rounded-[2.5rem] shadow-2xl overflow-hidden p-8"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black text-white tracking-tight">Filters</h2>
                <button onClick={() => setIsFilterModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition">
                  <X size={20} className="text-[#8B95A5]" />
                </button>
              </div>
              <FilterSidebar filters={filters} setFilters={setFilters} />
              <button 
                onClick={() => setIsFilterModalOpen(false)}
                className="w-full bg-[#7B5CFA] text-white font-black text-xs uppercase tracking-widest py-4 rounded-2xl mt-8 shadow-lg shadow-[#7B5CFA]/20"
              >
                Apply Filters
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Collabs;

