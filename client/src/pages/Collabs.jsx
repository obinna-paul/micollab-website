import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Briefcase, Search, MapPin, Users, Clock, 
  Plus, AlertCircle, FileText, Filter, X, ShieldCheck
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import FilterSidebar from '../components/collabs/FilterSidebar';
import CollabDetailsDrawer from '../components/collabs/CollabDetailsDrawer';
import ProposalModal from '../components/collabs/ProposalModal';
import useAuthStore from '../store/useAuthStore';

const FilterChip = ({ label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex-shrink-0 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${
      active 
        ? 'bg-[#7B5CFA] text-white border-[#7B5CFA] shadow-lg shadow-[#7B5CFA]/20' 
        : 'bg-[var(--bg-surface-alt)] text-[var(--text-secondary)] border-[var(--border-primary)] hover:border-[#7B5CFA]/30 hover:text-[var(--text-primary)]'
    }`}
  >
    {label}
  </button>
);

const Collabs = () => {
  const { token } = useAuthStore();
  const [collabs, setCollabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('EXPLORE'); 
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    locationType: '',
    experienceLevel: '',
    budgetRange: 'ALL',
    verifiedOnly: false
  });

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
      console.error(err);
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
      console.error(err);
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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="mb-6 md:mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 px-4 md:px-0">
        <div className="hidden md:block">
          <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tighter flex items-center gap-3">
            <Briefcase size={36} className="text-[#7B5CFA]" />
            Collabs Hub
          </h1>
          <p className="text-[var(--text-secondary)] mt-1 text-sm font-medium">Discover premium creative collabs and professional partnerships.</p>
        </div>
        
        <h1 className="md:hidden text-2xl font-black text-[var(--text-primary)] tracking-tighter flex items-center gap-2">
          <Briefcase size={24} className="text-[#7B5CFA]" />
          Collabs
        </h1>

        <button 
          onClick={() => navigate('/collabs/new')}
          className="hidden md:flex bg-[#7B5CFA] hover:bg-[#6B4CE0] text-white items-center gap-2 py-3 px-8 shadow-xl shadow-[#7B5CFA]/20 rounded-2xl font-black text-xs uppercase tracking-widest transition-colors"
        >
          <Plus size={18} /> Post a Collab
        </button>
      </div>

      <div className="flex border-b border-[var(--border-primary)] mb-4 md:mb-10 overflow-x-auto no-scrollbar px-4 md:px-0 sticky top-[56px] md:top-0 bg-[var(--bg-base)]/90 backdrop-blur-xl z-40 md:static md:bg-transparent md:backdrop-blur-none">
        <button 
          onClick={() => setActiveView('EXPLORE')}
          className={`flex-shrink-0 px-6 md:px-8 py-4 md:py-5 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeView === 'EXPLORE' ? 'border-[#7B5CFA] text-[#7B5CFA]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
        >
          Explore
        </button>
        <button 
          onClick={() => setActiveView('POSTINGS')}
          className={`flex-shrink-0 px-6 md:px-8 py-4 md:py-5 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeView === 'POSTINGS' ? 'border-[#7B5CFA] text-[#7B5CFA]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
        >
          My Postings
        </button>
        <button 
          onClick={() => setActiveView('APPLICATIONS')}
          className={`flex-shrink-0 px-6 md:px-8 py-4 md:py-5 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeView === 'APPLICATIONS' ? 'border-[#7B5CFA] text-[#7B5CFA]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
        >
          My Proposals
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
              <div className="relative z-30 mb-8 px-4 md:px-0">
                <div className="relative mb-4 group">
                  <Search className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--accent)] transition-colors" size={20} />
                  <input 
                    type="text" 
                    placeholder="Search collabs..."
                    className="w-full bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] rounded-2xl py-4 md:py-5 pl-12 md:pl-14 pr-6 text-sm md:text-base font-medium text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent)]/40 outline-none shadow-sm transition-all"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && fetchCollabs()}
                  />
                </div>

                {/* Mobile Filter Chips & Button */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar md:hidden">
                   <button 
                     onClick={() => setIsFilterModalOpen(true)}
                     className="flex-shrink-0 w-10 h-10 rounded-full border border-[var(--border-primary)] flex items-center justify-center bg-[var(--bg-surface-alt)] text-[var(--text-primary)]"
                   >
                     <Filter size={16} />
                   </button>
                   <div className="w-[1px] h-4 bg-white/[0.06] flex-shrink-0 mx-1" />
                   <FilterChip label="All" active={!filters.category} onClick={() => setFilters({...filters, category: ''})} />
                   <FilterChip label="Remote" active={filters.locationType === 'REMOTE'} onClick={() => setFilters({...filters, locationType: filters.locationType === 'REMOTE' ? '' : 'REMOTE'})} />
                   <FilterChip label="Verified" active={filters.verifiedOnly} onClick={() => setFilters({...filters, verifiedOnly: !filters.verifiedOnly})} />
                </div>
              </div>

              {loading ? (
                <div className="py-20 text-center flex flex-col items-center gap-6">
                   <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#7B5CFA]"></div>
                   <p className="text-[var(--text-secondary)] font-black uppercase text-[10px] tracking-widest">Scouting...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 px-4 md:px-0">
                  {collabs && collabs.length > 0 ? (
                    collabs.map(collab => (
                      <motion.div 
                        key={collab.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => {
                          setSelectedCollabId(collab.id);
                          setIsDrawerOpen(true);
                        }}
                        className="bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] p-6 md:p-8 rounded-[2rem] cursor-pointer hover:border-[#7B5CFA]/40 hover:shadow-2xl hover:shadow-[#7B5CFA]/10 transition-all group relative overflow-hidden"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1 min-w-0 pr-4">
                             <h3 className="text-xl md:text-2xl font-black text-[var(--text-primary)] group-hover:text-[#7B5CFA] transition-colors tracking-tight line-clamp-2">{collab.title}</h3>
                             <p className="text-[11px] text-[var(--text-muted)] font-black uppercase tracking-widest mt-2 flex items-center gap-2">
                               {collab.category} 
                               {collab.isVerified && <span className="text-[#34D399] flex items-center gap-1"><ShieldCheck size={12}/> Verified Client</span>}
                             </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                             <p className="text-lg md:text-xl font-black text-[var(--text-primary)]">{collab.budget}</p>
                             <p className="text-[9px] text-[var(--text-secondary)] font-black uppercase tracking-widest mt-1">Budget</p>
                          </div>
                        </div>

                        <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-6 leading-relaxed font-medium">
                          {collab.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 mb-6">
                           <span className="bg-[var(--bg-base)] border border-[var(--border-primary)] text-[var(--text-secondary)] text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                              <MapPin size={12} className="text-[#7B5CFA]" /> {collab.location || 'Remote'}
                           </span>
                           <span className="bg-[var(--bg-base)] border border-[var(--border-primary)] text-[var(--text-secondary)] text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                              <Briefcase size={12} className="text-[#7B5CFA]" /> {collab.experienceLevel?.toLowerCase() || 'Any'}
                           </span>
                           <span className="bg-[var(--bg-base)] border border-[var(--border-primary)] text-[var(--text-secondary)] text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                              <Users size={12} className="text-[#7B5CFA]" /> {collab._count?.proposals || 0} Proposals
                           </span>
                        </div>


                      </motion.div>
                    ))
                  ) : (
                    <div className="bg-[var(--bg-surface-alt)] border-2 border-dashed border-[var(--border-primary)] p-20 rounded-[3rem] text-center">
                       <div className="w-20 h-20 bg-[var(--bg-base)] rounded-full flex items-center justify-center text-[var(--text-muted)] mx-auto mb-6">
                          <AlertCircle size={40} className="opacity-50" />
                       </div>
                       <h3 className="text-2xl font-black text-[var(--text-primary)] tracking-tighter">No collabs found</h3>
                       <p className="text-[var(--text-secondary)] mt-2 font-medium text-sm">Try refining your filters or check back later.</p>
                       <button 
                         onClick={() => setFilters({ category: '', locationType: '', experienceLevel: '', budgetRange: 'ALL', verifiedOnly: false })}
                         className="text-[#7B5CFA] font-black uppercase text-[10px] tracking-widest hover:underline mt-6"
                       >
                         Clear Filters
                       </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {activeView === 'POSTINGS' && (
            <div className="space-y-6 px-4 md:px-0">
               <div className="flex justify-between items-center mb-6">
                  <h2 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Active Postings</h2>
               </div>
               
               {loading ? (
                 <div className="py-20 text-center">
                   <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#7B5CFA] mx-auto"></div>
                 </div>
               ) : (
                 <div className="space-y-5">
                   {collabs.map(collab => (
                     <div key={collab.id} className="bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] p-6 md:p-8 rounded-[2rem] flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:border-[#7B5CFA]/30 transition-all">
                        <div className="flex-1">
                           <h3 className="font-black text-[var(--text-primary)] text-xl tracking-tight">{collab.title}</h3>
                           <div className="flex flex-wrap gap-4 mt-3">
                              <span className="text-[10px] text-[var(--text-secondary)] font-black uppercase tracking-widest flex items-center gap-1.5">
                                <Users size={14} className="text-[#7B5CFA]" /> {collab._count?.proposals || 0} applicants
                              </span>
                              <span className="text-[10px] text-[var(--text-secondary)] font-black uppercase tracking-widest flex items-center gap-1.5">
                                <Clock size={14} className="text-[#7B5CFA]" /> {new Date(collab.createdAt).toLocaleDateString()}
                              </span>
                           </div>
                        </div>
                        <button 
                          onClick={() => navigate(`/collabs/manage/${collab.id}`)} 
                          className="bg-[#7B5CFA] hover:bg-[#6B4CE0] text-white text-[11px] font-black px-6 py-3 rounded-xl uppercase tracking-widest transition-all w-full md:w-auto text-center shadow-lg shadow-[#7B5CFA]/20"
                        >
                          Manage Proposals
                        </button>
                     </div>
                   ))}
                   
                   {collabs.length === 0 && (
                     <div className="bg-[var(--bg-surface-alt)] border-2 border-dashed border-[var(--border-primary)] p-20 rounded-[3rem] text-center">
                        <p className="text-[var(--text-secondary)] font-black uppercase text-[10px] tracking-widest">You haven't posted any opportunities yet.</p>
                        <button onClick={() => navigate('/collabs/new')} className="text-[#7B5CFA] font-black uppercase text-xs hover:underline mt-6">Create Your First Collab</button>
                     </div>
                   )}
                 </div>
               )}
            </div>
          )}

          {activeView === 'APPLICATIONS' && (
            <div className="space-y-6 px-4 md:px-0">
               <div className="flex justify-between items-center mb-6">
                  <h2 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Active Proposal Tracking</h2>
               </div>
               
               {loading ? (
                 <div className="py-20 text-center">
                   <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#7B5CFA] mx-auto"></div>
                 </div>
               ) : (
                 <div className="space-y-5">
                   {collabs.map(proposal => {
                     const statusColors = {
                        PENDING: 'bg-[#FFAB4C]/10 text-[#FFAB4C] border-[#FFAB4C]/20',
                        SHORTLISTED: 'bg-[#A78BFA]/10 text-[#A78BFA] border-[#A78BFA]/20',
                        ACCEPTED: 'bg-[#34D399]/10 text-[#34D399] border-[#34D399]/20',
                        REJECTED: 'bg-[#FF6B6B]/10 text-[#FF6B6B] border-[#FF6B6B]/20'
                     };
                     const sColor = statusColors[proposal.status] || statusColors.PENDING;

                     return (
                       <div key={proposal.id} className="bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] p-6 md:p-8 rounded-[2rem] flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:border-white/[0.1] transition-all">
                          <div className="flex-1">
                             <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1.5">Proposal for:</p>
                             <h3 className="font-black text-[var(--text-primary)] text-xl tracking-tight leading-tight">{proposal.collab?.title}</h3>
                             <div className="flex flex-wrap items-center gap-4 mt-4">
                                <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-md border ${sColor}`}>
                                  {proposal.status}
                                </span>
                                <span className="text-[10px] text-[var(--text-secondary)] font-black uppercase tracking-widest flex items-center gap-1.5">
                                  <Clock size={14} className="text-[var(--text-muted)]" /> Sent {new Date(proposal.createdAt).toLocaleDateString()}
                                </span>
                             </div>
                          </div>
                          <button 
                            onClick={() => {
                               setSelectedCollabId(proposal.collabId);
                               setIsDrawerOpen(true);
                            }} 
                            className="bg-[var(--bg-base)] border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-[11px] font-black px-6 py-3 rounded-xl uppercase tracking-widest transition-all w-full md:w-auto text-center"
                          >
                            View Collab
                          </button>
                       </div>
                     );
                   })}
                   
                   {collabs.length === 0 && (
                     <div className="bg-[var(--bg-surface-alt)] border-2 border-dashed border-[var(--border-primary)] p-20 rounded-[3rem] text-center">
                        <p className="text-[var(--text-secondary)] font-black uppercase text-[10px] tracking-widest">No active proposals sent yet.</p>
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
              className="relative w-full max-w-sm bg-[var(--bg-base)] rounded-[2.5rem] border border-[var(--border-primary)] shadow-2xl overflow-hidden p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Filters</h2>
                <button onClick={() => setIsFilterModalOpen(false)} className="p-2 hover:bg-white/[0.05] rounded-full transition">
                  <X size={20} className="text-[var(--text-secondary)]" />
                </button>
              </div>
              <FilterSidebar filters={filters} setFilters={setFilters} />
              <button 
                onClick={() => setIsFilterModalOpen(false)}
                className="w-full bg-[#7B5CFA] text-white font-black text-xs uppercase tracking-widest py-4 rounded-xl mt-6 shadow-lg shadow-[#7B5CFA]/20"
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
