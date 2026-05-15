import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  Briefcase, Search, MapPin, Users, Clock, 
  Plus, LayoutDashboard, AlertCircle, FileText
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import FilterSidebar from '../components/collabs/FilterSidebar';
import CollabDetailsDrawer from '../components/collabs/CollabDetailsDrawer';
import ProposalModal from '../components/collabs/ProposalModal';
import useAuthStore from '../store/useAuthStore';

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
      const res = await axios.get(`http://localhost:5000/api/collabs?${params.toString()}`);
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
      const res = await axios.get('http://localhost:5000/api/collabs/my-collabs', {
         headers: { Authorization: `Bearer ${token}` }
      });
      setCollabs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyProposals = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/collabs/my-proposals', {
         headers: { Authorization: `Bearer ${token}` }
      });
      setCollabs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-textMain tracking-tighter flex items-center gap-3">
            <Briefcase size={40} className="text-primary" />
            Collabs Hub
          </h1>
          <p className="text-textMuted mt-1 text-sm font-medium">Discover premium creative collabs and professional partnerships.</p>
        </div>
        
        <button 
          onClick={() => navigate('/collabs/new')}
          className="btn-primary flex items-center gap-2 py-3 px-8 shadow-xl shadow-primary/25 rounded-2xl"
        >
          <Plus size={20} /> Post a collab
        </button>
      </div>

      <div className="flex border-b border-divider mb-10 overflow-x-auto no-scrollbar">
        <button 
          onClick={() => setActiveView('EXPLORE')}
          className={`px-8 py-5 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeView === 'EXPLORE' ? 'border-primary text-primary' : 'border-transparent text-textMuted hover:text-textMain'}`}
        >
          Explore
        </button>
        <button 
          onClick={() => setActiveView('POSTINGS')}
          className={`px-8 py-5 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeView === 'POSTINGS' ? 'border-primary text-primary' : 'border-transparent text-textMuted hover:text-textMain'}`}
        >
          My Postings
        </button>
        <button 
          onClick={() => setActiveView('APPLICATIONS')}
          className={`px-8 py-5 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeView === 'APPLICATIONS' ? 'border-primary text-primary' : 'border-transparent text-textMuted hover:text-textMain'}`}
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
        <div className="lg:col-span-9 space-y-6">
          {activeView === 'EXPLORE' && (
            <>
              <div className="relative mb-8 group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-textMuted group-focus-within:text-primary transition-colors" size={24} />
                <input 
                  type="text" 
                  placeholder="Search by title, role, or creative category..."
                  className="w-full bg-white border border-divider rounded-2xl py-5 pl-14 pr-6 text-base font-medium focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none shadow-sm transition-all"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && fetchCollabs()}
                />
              </div>

              {loading ? (
                <div className="py-20 text-center flex flex-col items-center gap-6">
                   <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary"></div>
                   <p className="text-textMuted font-black uppercase text-[10px] tracking-widest">Scouting...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {collabs.length > 0 ? (
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
                        className="bg-white border border-divider p-8 rounded-3xl cursor-pointer hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 transition-all group relative overflow-hidden"
                      >
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex-1 min-w-0">
                             <div className="flex flex-wrap items-center gap-2 mb-3">
                               <span className="bg-primary/5 text-primary text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">{collab.category}</span>
                               <span className="bg-emerald-50 text-emerald-600 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">
                                 {collab.projectType === 'RECURRING' ? 'Recurring Potential' : 'One-off Project'}
                               </span>
                               {collab.isVerified && (
                                 <span className="bg-blue-50 text-blue-600 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter flex items-center gap-1">
                                    Verified Opportunity
                                 </span>
                               )}
                             </div>
                             <h3 className="text-2xl font-black text-textMain group-hover:text-primary transition-colors tracking-tight truncate pr-4">{collab.title}</h3>
                          </div>
                          <div className="text-right flex-shrink-0">
                             <p className="text-2xl font-black text-textMain">{collab.budget}</p>
                             <p className="text-[9px] text-textMuted font-black uppercase tracking-widest mt-1">Budget Allocation</p>
                          </div>
                        </div>

                        <p className="text-sm text-textMuted line-clamp-3 mb-8 leading-relaxed font-medium">
                          {collab.description}
                        </p>

                        <div className="flex flex-wrap items-center justify-between gap-6 pt-6 border-t border-divider/50">
                          <div className="flex items-center gap-8">
                            <div className="flex items-center gap-2 text-textMuted text-xs font-black uppercase tracking-tighter">
                              <MapPin size={16} className="text-primary" />
                              {collab.location || 'Remote'}
                            </div>
                            <div className="flex items-center gap-2 text-textMuted text-xs font-black uppercase tracking-tighter">
                              <Users size={16} className="text-primary" />
                              {collab._count?.proposals || 0} Proposals
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="text-right hidden sm:block">
                               <p className="text-[9px] text-textMuted font-black uppercase tracking-widest">{collab.poster?.profileType}</p>
                               <p className="text-sm font-black text-textMain">@{collab.poster?.username}</p>
                            </div>
                            <img 
                              src={collab.poster?.profileImage || `https://ui-avatars.com/api/?name=${collab.poster?.username}`} 
                              className="w-12 h-12 rounded-2xl border-2 border-divider group-hover:border-primary transition-colors object-cover shadow-sm" 
                              alt="" 
                            />
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="bg-white border-2 border-dashed border-divider p-20 rounded-3xl text-center">
                       <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-textMuted mx-auto mb-6">
                          <AlertCircle size={48} className="opacity-20" />
                       </div>
                       <h3 className="text-2xl font-black text-textMain tracking-tighter">No collabs found</h3>
                       <p className="text-textMuted mt-2 font-medium">Try refining your filters or check back later.</p>
                       <button 
                         onClick={() => setFilters({ category: '', locationType: '', experienceLevel: '', budgetRange: 'ALL', verifiedOnly: false })}
                         className="text-primary font-black uppercase text-[10px] tracking-widest hover:underline mt-6"
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
                  <h2 className="text-[10px] font-black text-textMuted uppercase tracking-widest">Your Active Postings</h2>
               </div>
               
               {loading ? (
                 <div className="py-20 text-center">
                   <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary mx-auto"></div>
                 </div>
               ) : (
                 <div className="space-y-6">
                   {collabs.map(collab => (
                     <div key={collab.id} className="bg-white border border-divider p-8 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-8 hover:shadow-xl transition-all">
                        <div className="flex-1">
                           <h3 className="font-black text-textMain text-xl tracking-tight">{collab.title}</h3>
                           <div className="flex gap-6 mt-3">
                              <span className="text-[10px] text-textMuted font-black uppercase tracking-widest flex items-center gap-2">
                                <Users size={16} className="text-primary opacity-50" /> {collab._count?.proposals || 0} applicants
                              </span>
                              <span className="text-[10px] text-textMuted font-black uppercase tracking-widest flex items-center gap-2">
                                <Clock size={16} className="text-primary opacity-50" /> {new Date(collab.createdAt).toLocaleDateString()}
                              </span>
                           </div>
                        </div>
                        <div className="flex gap-3">
                           <button onClick={() => navigate(`/collabs/manage/${collab.id}`)} className="bg-primary/5 text-primary text-[10px] font-black px-8 py-4 rounded-2xl uppercase tracking-widest hover:bg-primary/10 transition-all border border-primary/20">Manage Proposals</button>
                        </div>
                     </div>
                   ))}
                   
                   {collabs.length === 0 && (
                     <div className="bg-white border-2 border-dashed border-divider p-20 rounded-3xl text-center">
                        <p className="text-textMuted font-black uppercase text-[10px] tracking-widest">You haven't posted any opportunities yet.</p>
                        <button onClick={() => navigate('/collabs/new')} className="text-primary font-black uppercase text-xs hover:underline mt-6">Create Your First Collab</button>
                     </div>
                   )}
                 </div>
               )}
            </div>
          )}

          {activeView === 'APPLICATIONS' && (
            <div className="space-y-6">
               <div className="flex justify-between items-center mb-8">
                  <h2 className="text-[10px] font-black text-textMuted uppercase tracking-widest">Active Proposal Tracking</h2>
               </div>
               
               {loading ? (
                 <div className="py-20 text-center">
                   <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary mx-auto"></div>
                 </div>
               ) : (
                 <div className="space-y-6">
                   {collabs.map(proposal => (
                     <div key={proposal.id} className="bg-white border border-divider p-8 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-8 hover:shadow-xl transition-all">
                        <div className="flex-1">
                           <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">Proposal for:</p>
                           <h3 className="font-black text-textMain text-xl tracking-tight">{proposal.collab?.title}</h3>
                           <div className="flex gap-6 mt-3">
                              <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${proposal.status === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-600' : 'bg-primary/5 text-primary'}`}>
                                Status: {proposal.status}
                              </span>
                              <span className="text-[10px] text-textMuted font-black uppercase tracking-widest flex items-center gap-2">
                                <Clock size={16} className="text-primary opacity-50" /> Sent {new Date(proposal.createdAt).toLocaleDateString()}
                              </span>
                           </div>
                        </div>
                        <div className="flex gap-3">
                           <button onClick={() => navigate(`/collabs/${proposal.collabId}`)} className="bg-surface border border-divider text-[10px] font-black px-8 py-4 rounded-2xl uppercase tracking-widest hover:bg-gray-50 transition-all">View Collab</button>
                        </div>
                     </div>
                   ))}
                   
                   {collabs.length === 0 && (
                     <div className="bg-white border-2 border-dashed border-divider p-20 rounded-3xl text-center">
                        <p className="text-textMuted font-black uppercase text-[10px] tracking-widest">No active proposals sent yet.</p>
                        <button onClick={() => setActiveView('EXPLORE')} className="text-primary font-black uppercase text-xs hover:underline mt-6">Explore collabs</button>
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
    </div>
  );
};

export default Collabs;

