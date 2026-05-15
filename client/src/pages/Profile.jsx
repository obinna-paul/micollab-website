import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Link as LinkIcon, Calendar, Star, Users, Briefcase, 
  MessageSquare, Plus, Grid, List, Activity as ActivityIcon, 
  Edit3, Share2, MoreHorizontal, ExternalLink, Image as ImageIcon, X, Loader2, Building, UserCircle
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import PostCard from '../components/PostCard';

const Profile = () => {
  const { username } = useParams();
  const { user: currentUser, token } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('portfolio');
  
  // Modals
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [showExpModal, setShowExpModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  
  // Forms
  const [newProject, setNewProject] = useState({ title: '', mediaUrl: '', caption: '' });
  const [newExp, setNewExp] = useState({ company: '', role: '', startDate: '', endDate: '', description: '', location: '' });
  const [editProfileData, setEditProfileData] = useState({ profileType: '', bio: '', location: '', skills: '', creativeMission: '' });
  
  const [modalLoading, setModalLoading] = useState(false);

  const updateStoreProfile = useAuthStore(state => state.updateProfile);
  const isOwnProfile = currentUser?.username === username;

  useEffect(() => {
    fetchProfile();
  }, [username]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/users/profile/${username}`);
      setProfile(res.data);
      setEditProfileData({
        profileType: res.data.profileType || '',
        bio: res.data.bio || '',
        location: res.data.location || '',
        skills: res.data.skills || '',
        creativeMission: res.data.creativeMission || ''
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProject = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      await axios.post('http://localhost:5000/api/users/portfolio', newProject, {
         headers: { Authorization: `Bearer ${token}` }
      });
      setShowPortfolioModal(false);
      setNewProject({ title: '', mediaUrl: '', caption: '' });
      fetchProfile();
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleAddExperience = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      await axios.post('http://localhost:5000/api/users/experience', newExp, {
         headers: { Authorization: `Bearer ${token}` }
      });
      setShowExpModal(false);
      setNewExp({ company: '', role: '', startDate: '', endDate: '', description: '', location: '' });
      fetchProfile();
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleEditProfile = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      const res = await updateStoreProfile(editProfileData);
      if (res.success) {
         setShowEditProfileModal(false);
         fetchProfile();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
      <p className="text-textMuted font-bold animate-pulse">Loading profile...</p>
    </div>
  );

  if (!profile) return (
    <div className="card p-20 text-center">
      <h2 className="text-2xl font-black text-textMain mb-2">User not found</h2>
      <p className="text-textMuted">The profile you're looking for doesn't exist.</p>
      <Link to="/" className="btn-primary mt-6 inline-block">Back Home</Link>
    </div>
  );

  const fallbackAvatar = 'https://ui-avatars.com/api/?name=' + profile.username + '&background=0A66C2&color=fff';

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Header / Banner Area */}
      <div className="card overflow-hidden">
        <div className="h-40 bg-gradient-to-r from-primary/80 to-accent/80 relative">
          <button className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 p-2 rounded-full backdrop-blur-md text-white transition">
            <Share2 size={18} />
          </button>
        </div>
        
        <div className="px-6 pb-6 -mt-16 flex flex-col md:flex-row gap-6 relative z-10">
          <div className="flex-shrink-0">
            <img 
              src={profile.profileImage || fallbackAvatar} 
              className="w-32 h-32 md:w-40 md:h-40 rounded-3xl border-4 border-white shadow-xl object-cover bg-white" 
              alt={profile.username}
              onError={(e) => e.target.src = fallbackAvatar}
            />
          </div>
          
          <div className="flex-1 mt-16 md:mt-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-textMain flex items-center gap-2">
                  @{profile.username}
                  {profile.verified && <Star size={18} className="text-primary fill-primary" />}
                </h1>
                <p className="text-primary font-bold uppercase tracking-widest text-[10px] mt-1">{profile.profileType || 'Creative Professional'}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-textMuted text-sm font-medium">
                  <span className="flex items-center gap-1"><MapPin size={14} /> {profile.location || 'Africa'}</span>
                  <span className="flex items-center gap-1"><Users size={14} /> <span className="text-textMain font-bold">{profile.connectionsCount || 0}</span> connections</span>
                  <span className="flex items-center gap-1"><Calendar size={14} /> Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex gap-2">
                {isOwnProfile ? (
                  <button onClick={() => setShowEditProfileModal(true)} className="btn-outline flex items-center gap-2 py-2 px-6">
                    <Edit3 size={16} /> Edit Profile
                  </button>
                ) : (
                  <>
                    <button className="btn-primary flex items-center gap-2 py-2 px-6">
                      <Plus size={16} /> Connect
                    </button>
                    <button className="btn-outline p-2">
                      <MessageSquare size={18} />
                    </button>
                  </>
                )}
                <button className="btn-outline p-2">
                  <MoreHorizontal size={18} />
                </button>
              </div>
            </div>
            
            <p className="mt-4 text-sm text-textMain leading-relaxed max-w-2xl">
              {profile.bio || "Crafting unique experiences and pushing the boundaries of creative expression."}
            </p>
          </div>
        </div>

        {/* Profile Navigation */}
        <div className="flex border-t border-divider bg-surface px-6 overflow-x-auto no-scrollbar">
          {[
            { id: 'portfolio', label: 'Portfolio', icon: Grid },
            { id: 'activity', label: 'Activity', icon: ActivityIcon },
            { id: 'about', label: 'Experience', icon: Briefcase }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-textMuted hover:text-textMain'}`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'portfolio' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-textMain">Featured Projects</h3>
              {isOwnProfile && (
                <button 
                  onClick={() => setShowPortfolioModal(true)}
                  className="btn-primary flex items-center gap-2 text-xs py-1.5 px-4"
                >
                  <Plus size={14} /> Add Project
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {profile.portfolioItems?.length > 0 ? (
                profile.portfolioItems.map(item => (
                  <motion.div 
                    key={item.id}
                    whileHover={{ y: -4 }}
                    className="card group cursor-pointer overflow-hidden border-none shadow-md hover:shadow-xl transition-all"
                  >
                    <div className="aspect-video bg-gray-100 overflow-hidden relative">
                      <img src={item.mediaUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <div className="bg-white p-3 rounded-full text-primary scale-0 group-hover:scale-100 transition-transform"><ExternalLink size={24} /></div>
                      </div>
                    </div>
                    <div className="p-4 bg-surface">
                      <h4 className="font-bold text-textMain group-hover:text-primary transition-colors">{item.title}</h4>
                      <p className="text-xs text-textMuted mt-1 line-clamp-2">{item.caption}</p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="md:col-span-2 card p-20 text-center flex flex-col items-center gap-4 bg-gray-50/50 border-dashed border-2">
                  <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center text-primary/40"><Grid size={32} /></div>
                  <p className="text-textMuted font-bold">No projects showcase yet.</p>
                  {isOwnProfile && <button onClick={() => setShowPortfolioModal(true)} className="text-primary font-black hover:underline text-sm uppercase">Create Your Portfolio</button>}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-4 max-w-2xl mx-auto">
             {profile.posts?.length > 0 ? (
               profile.posts.map(post => <PostCard key={post.id} post={post} />)
             ) : (
               <div className="card p-20 text-center text-textMuted font-bold bg-gray-50/50">
                 No recent activity to show.
               </div>
             )}
          </div>
        )}

        {activeTab === 'about' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="md:col-span-2 space-y-6">
                <div className="card p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-black text-textMain uppercase text-xs tracking-widest">Work History</h3>
                    {isOwnProfile && <button onClick={() => setShowExpModal(true)} className="text-primary p-1 hover:bg-primary/5 rounded-full"><Plus size={20} /></button>}
                  </div>
                  
                  <div className="space-y-8">
                     {profile.experiences?.length > 0 ? (
                       profile.experiences.map((exp, i) => (
                         <div key={i} className="flex gap-4 relative">
                            {i !== profile.experiences.length - 1 && <div className="absolute left-6 top-10 bottom-[-32px] w-0.5 bg-divider" />}
                            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-textMuted flex-shrink-0 border border-divider">
                               <Building size={24} />
                            </div>
                            <div>
                               <h4 className="font-bold text-textMain leading-tight">{exp.role}</h4>
                               <p className="text-sm text-textMuted font-medium">{exp.company}</p>
                               <p className="text-[10px] text-textLight font-bold mt-0.5 uppercase tracking-wider">
                                 {exp.startDate} - {exp.endDate || 'Present'} • {exp.location || 'Remote'}
                               </p>
                               {exp.description && (
                                 <p className="text-xs text-textMuted mt-3 leading-relaxed">
                                   {exp.description}
                                 </p>
                               )}
                            </div>
                         </div>
                       ))
                     ) : (
                       <div className="text-center py-10">
                          <p className="text-textMuted text-xs font-bold">No work history added yet.</p>
                          {isOwnProfile && <button onClick={() => setShowExpModal(true)} className="text-primary font-black hover:underline text-[10px] uppercase mt-2">Add Experience</button>}
                       </div>
                     )}
                  </div>
                </div>

                <div className="card p-6">
                  <h3 className="font-black text-textMain mb-4 uppercase text-xs tracking-widest">About Me</h3>
                  <p className="text-sm text-textMain leading-relaxed whitespace-pre-wrap">
                    {profile.bio || "No biography provided yet."}
                  </p>
                </div>
             </div>
             
             <div className="space-y-6">
                <div className="card p-6">
                  <h3 className="font-black text-textMain mb-4 uppercase text-xs tracking-widest">Skills & Expertise</h3>
                  <div className="flex flex-wrap gap-2">
                    {(profile.skills || 'Creative Direction,Networking').split(',').map(skill => (
                      <span key={skill} className="px-3 py-1 bg-gray-100 text-textMuted text-[10px] font-bold rounded-full">{skill.trim()}</span>
                    ))}
                  </div>
                </div>

                <div className="card p-6">
                  <h3 className="font-black text-textMain mb-4 uppercase text-xs tracking-widest">Creative Mission</h3>
                  <p className="text-xs text-textMain leading-relaxed italic">
                    "{profile.creativeMission || "Building the future of African creative expression through collaboration and innovation."}"
                  </p>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {showEditProfileModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="bg-surface w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="p-6 border-b border-divider flex justify-between items-center sticky top-0 bg-surface z-10">
                <h2 className="text-xl font-black text-textMain">Edit Profile</h2>
                <button onClick={() => setShowEditProfileModal(false)} className="text-textMuted hover:bg-gray-100 p-2 rounded-full transition"><X size={20} /></button>
              </div>
              
              <form onSubmit={handleEditProfile} className="p-6 space-y-5">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-textMuted ml-1">What best describes you?</label>
                  <div className="relative">
                    <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-textMuted" size={18} />
                    <input required value={editProfileData.profileType} onChange={(e) => setEditProfileData({...editProfileData, profileType: e.target.value})} placeholder="e.g. Musician, Producer, Brand" className="w-full bg-background border border-divider rounded-xl py-3 pl-12 pr-4 text-sm outline-none focus:border-primary" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-textMuted ml-1">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-textMuted" size={18} />
                    <input value={editProfileData.location} onChange={(e) => setEditProfileData({...editProfileData, location: e.target.value})} placeholder="e.g. Lagos, Nigeria" className="w-full bg-background border border-divider rounded-xl py-3 pl-12 pr-4 text-sm outline-none focus:border-primary" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-textMuted ml-1">Bio</label>
                  <textarea value={editProfileData.bio} onChange={(e) => setEditProfileData({...editProfileData, bio: e.target.value})} placeholder="Tell your story..." className="w-full h-24 bg-background border border-divider rounded-xl p-4 text-sm outline-none focus:border-primary resize-none" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-textMuted ml-1">Skills (comma separated)</label>
                  <input value={editProfileData.skills} onChange={(e) => setEditProfileData({...editProfileData, skills: e.target.value})} placeholder="e.g. Sound Design, Mixing, DJing" className="w-full bg-background border border-divider rounded-xl py-3 px-4 text-sm outline-none focus:border-primary" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-textMuted ml-1">Creative Mission</label>
                  <textarea value={editProfileData.creativeMission} onChange={(e) => setEditProfileData({...editProfileData, creativeMission: e.target.value})} placeholder="What drives you creatively?" className="w-full h-20 bg-background border border-divider rounded-xl p-4 text-sm outline-none focus:border-primary resize-none" />
                </div>

                <div className="flex gap-3 pt-2 sticky bottom-0 bg-surface">
                  <button type="button" onClick={() => setShowEditProfileModal(false)} className="flex-1 py-3 bg-gray-100 text-textMuted font-bold rounded-xl hover:bg-gray-200 transition">Cancel</button>
                  <button type="submit" disabled={modalLoading} className="flex-[2] py-3 bg-primary text-white font-bold rounded-xl hover:bg-primaryHover shadow-lg shadow-primary/20 transition flex items-center justify-center gap-2">
                    {modalLoading ? <Loader2 className="animate-spin" size={20} /> : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Portfolio Item Modal */}
      <AnimatePresence>
        {showPortfolioModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="bg-surface w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-divider flex justify-between items-center bg-surface">
                <h2 className="text-xl font-black text-textMain">Add New Project</h2>
                <button onClick={() => setShowPortfolioModal(false)} className="text-textMuted hover:bg-gray-100 p-2 rounded-full transition"><X size={20} /></button>
              </div>
              
              <form onSubmit={handleAddProject} className="p-6 space-y-5">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-textMuted ml-1">Project Title</label>
                  <input required value={newProject.title} onChange={(e) => setNewProject({...newProject, title: e.target.value})} placeholder="e.g. Faces of Lagos Series" className="w-full bg-background border border-divider rounded-xl py-3 px-4 text-sm outline-none focus:border-primary" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-textMuted ml-1">Project Thumbnail (URL)</label>
                  <div className="relative">
                    <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-textMuted" size={18} />
                    <input required value={newProject.mediaUrl} onChange={(e) => setNewProject({...newProject, mediaUrl: e.target.value})} placeholder="https://images.unsplash.com/..." className="w-full bg-background border border-divider rounded-xl py-3 pl-12 pr-4 text-sm outline-none focus:border-primary" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-textMuted ml-1">Project Description</label>
                  <textarea value={newProject.caption} onChange={(e) => setNewProject({...newProject, caption: e.target.value})} placeholder="Describe your role and the project's impact..." className="w-full h-32 bg-background border border-divider rounded-xl p-4 text-sm outline-none focus:border-primary resize-none" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowPortfolioModal(false)} className="flex-1 py-3 bg-gray-100 text-textMuted font-bold rounded-xl hover:bg-gray-200 transition">Cancel</button>
                  <button type="submit" disabled={modalLoading} className="flex-[2] py-3 bg-primary text-white font-bold rounded-xl hover:bg-primaryHover shadow-lg shadow-primary/20 transition flex items-center justify-center gap-2">
                    {modalLoading ? <Loader2 className="animate-spin" size={20} /> : 'Save Project'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Experience Modal */}
      <AnimatePresence>
        {showExpModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="bg-surface w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-divider flex justify-between items-center bg-surface">
                <h2 className="text-xl font-black text-textMain">Add Work Experience</h2>
                <button onClick={() => setShowExpModal(false)} className="text-textMuted hover:bg-gray-100 p-2 rounded-full transition"><X size={20} /></button>
              </div>
              
              <form onSubmit={handleAddExperience} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-textMuted ml-1">Role / Title</label>
                    <input required value={newExp.role} onChange={(e) => setNewExp({...newExp, role: e.target.value})} placeholder="e.g. Lead Producer" className="w-full bg-background border border-divider rounded-xl py-2.5 px-4 text-sm outline-none focus:border-primary" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-textMuted ml-1">Company / Studio</label>
                    <input required value={newExp.company} onChange={(e) => setNewExp({...newExp, company: e.target.value})} placeholder="e.g. Mavin Records" className="w-full bg-background border border-divider rounded-xl py-2.5 px-4 text-sm outline-none focus:border-primary" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-textMuted ml-1">Start Date</label>
                    <input required value={newExp.startDate} onChange={(e) => setNewExp({...newExp, startDate: e.target.value})} placeholder="Jan 2023" className="w-full bg-background border border-divider rounded-xl py-2.5 px-4 text-sm outline-none focus:border-primary" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-textMuted ml-1">End Date</label>
                    <input value={newExp.endDate} onChange={(e) => setNewExp({...newExp, endDate: e.target.value})} placeholder="Present" className="w-full bg-background border border-divider rounded-xl py-2.5 px-4 text-sm outline-none focus:border-primary" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-textMuted ml-1">Location</label>
                  <input value={newExp.location} onChange={(e) => setNewExp({...newExp, location: e.target.value})} placeholder="e.g. Lagos, Nigeria" className="w-full bg-background border border-divider rounded-xl py-2.5 px-4 text-sm outline-none focus:border-primary" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-textMuted ml-1">Description</label>
                  <textarea value={newExp.description} onChange={(e) => setNewExp({...newExp, description: e.target.value})} placeholder="What did you accomplish in this role?" className="w-full h-24 bg-background border border-divider rounded-xl p-4 text-sm outline-none focus:border-primary resize-none" />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowExpModal(false)} className="flex-1 py-3 bg-gray-100 text-textMuted font-bold rounded-xl hover:bg-gray-200 transition">Cancel</button>
                  <button type="submit" disabled={modalLoading} className="flex-[2] py-3 bg-primary text-white font-bold rounded-xl hover:bg-primaryHover shadow-lg shadow-primary/20 transition flex items-center justify-center gap-2">
                    {modalLoading ? <Loader2 className="animate-spin" size={20} /> : 'Save Experience'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;
