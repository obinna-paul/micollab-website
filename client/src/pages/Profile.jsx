import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  MapPin, Link as LinkIcon, Calendar, Users, 
  Briefcase, CheckCircle, Star, MessageSquare, 
  UserPlus, Share2, Grid, Info, Clock, ExternalLink,
  Camera, X, Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import useAuthStore from '../store/useAuthStore';
import EditProfileModal from '../components/EditProfileModal';
import PhotoActionModal from '../components/PhotoActionModal';
import PhotoViewerModal from '../components/PhotoViewerModal';
import AddPortfolioModal from '../components/AddPortfolioModal';
import ProjectDetailsModal from '../components/ProjectDetailsModal';

const TABS = [
  { id: 'PORTFOLIO', label: 'Portfolio', icon: Grid },
  { id: 'ABOUT', label: 'About', icon: Info },
  { id: 'ACTIVITY', label: 'Activity', icon: Clock }
];

const Profile = () => {
  const { username } = useParams();
  const { user: currentUser, token, updateProfile: updateAuthProfile } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('PORTFOLIO');
  const [loading, setLoading] = useState(true);
  
  // Modals State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isProjectDetailOpen, setIsProjectDetailOpen] = useState(false);
  
  // Image Management State
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [coverMenuOpen, setCoverMenuOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);

  const avatarInputRef = React.useRef(null);
  const coverInputRef = React.useRef(null);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`/api/users/profile/${username}`);
      setProfile(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [username]);

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadLoading(true);
    const formData = new FormData();
    formData.append('media', file);

    try {
      const uploadRes = await axios.post('/api/upload', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      const imageUrl = uploadRes.data.urls[0];
      const updateData = type === 'avatar' ? { profileImage: imageUrl } : { coverImage: imageUrl };
      const profileRes = await axios.put('/api/users/profile', updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setProfile(profileRes.data);
      if (isOwner) updateAuthProfile(updateData);
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Failed to upload image.');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleRemovePhoto = async (type) => {
    try {
      const updateData = type === 'avatar' ? { profileImage: null } : { coverImage: null };
      const profileRes = await axios.put('/api/users/profile', updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(profileRes.data);
      if (isOwner) updateAuthProfile(updateData);
    } catch (err) {
      console.error('Removal failed:', err);
    }
  };

  const handleAction = (id, type) => {
    if (id === 'VIEW') {
      setViewerUrl(type === 'avatar' ? profile.profileImage : profile.coverImage);
      setViewerOpen(true);
    } else if (id === 'UPLOAD') {
      if (type === 'avatar') avatarInputRef.current?.click();
      else coverInputRef.current?.click();
    } else if (id === 'DELETE') {
      handleRemovePhoto(type);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!profile) return (
    <div className="text-center py-20">
      <h2 className="text-2xl font-black text-textMain">Creator not found</h2>
      <Link to="/" className="text-primary hover:underline mt-2 inline-block">Return to home</Link>
    </div>
  );

  const isOwner = currentUser?.id === profile.id;
  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.displayName || profile.username)}&background=f3f4f6&color=374151&size=200`;

  return (
    <div className="max-w-7xl mx-auto pb-20">
      {/* Hero Section */}
      <div className="relative mb-8">
        {/* Cover Image */}
        <div className="h-64 md:h-80 w-full rounded-3xl overflow-hidden relative group shadow-sm bg-gray-200">
          {profile.coverImage ? (
            <img src={profile.coverImage} alt="Cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200"></div>
          )}
          {isOwner && (
            <button onClick={() => setCoverMenuOpen(true)} className="absolute top-4 right-4 bg-white/50 backdrop-blur-md text-textMain px-4 py-2 rounded-xl text-xs font-bold hover:bg-white/80 transition shadow-sm border border-white/20 z-10">
              Change Cover
            </button>
          )}
        </div>

        {/* Profile Info */}
        <div className="px-6 md:px-12 flex flex-col md:flex-row items-center md:items-start gap-6 relative">
          <div className="-mt-16 md:-mt-20 relative group z-10 shrink-0 self-center md:self-start">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-[6px] border-surface shadow-lg overflow-hidden bg-gray-100 relative">
              <img src={profile.profileImage || fallbackAvatar} className="w-full h-full object-cover" alt="Avatar" />
              {profile.isVerified === 'YES' && (
                <div className="absolute bottom-2 right-2 bg-primary text-white p-1.5 rounded-full border-4 border-surface shadow-lg z-20">
                  <CheckCircle size={18} fill="currentColor" />
                </div>
              )}
              {isOwner && (
                <div onClick={() => setAvatarMenuOpen(true)} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition cursor-pointer z-10">
                  <span className="text-white text-xs font-bold">Edit Avatar</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 pt-4 pb-4 w-full flex flex-col">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-3 mb-1">
                  <h1 className="text-3xl font-black text-textMain tracking-tight">{profile.displayName || profile.username}</h1>
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20">{profile.profileType}</span>
                    <div className="flex items-center gap-1 bg-green-500/10 text-green-600 px-3 py-1 rounded-full border border-green-500/20">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-[10px] font-black uppercase tracking-wider">{profile.availabilityStatus || 'Available'}</span>
                    </div>
                  </div>
                </div>
                <p className="text-textMuted font-bold text-sm">@{profile.username}</p>
              </div>

              <div className="flex items-center justify-center md:justify-start gap-3">
                {isOwner ? (
                  <button onClick={() => setIsEditModalOpen(true)} className="px-6 py-3 bg-white border border-divider text-textMain font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-gray-50 transition shadow-sm">
                    Edit Profile
                  </button>
                ) : (
                  <>
                    <button className="px-6 py-3 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:scale-105 transition shadow-lg flex items-center gap-2"><UserPlus size={16} />Connect</button>
                    <button className="p-3 bg-surface border border-divider text-textMain rounded-2xl hover:bg-gray-50 transition shadow-sm"><MessageSquare size={20} /></button>
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-around md:justify-start items-center gap-4 md:gap-6 mt-4 md:mt-6 pt-4 md:pt-6 border-t border-divider order-first md:order-none mb-6 md:mb-0">
              <div className="text-center md:text-left">
                <p className="text-lg font-black text-textMain">{profile.connectionsCount || 0}</p>
                <p className="text-[10px] text-textMuted font-black uppercase tracking-widest">Connections</p>
              </div>
              <div className="border-l border-divider pl-4 md:pl-6 text-center md:text-left">
                <p className="text-lg font-black text-textMain">{profile.reputationScore || 0}</p>
                <p className="text-[10px] text-textMuted font-black uppercase tracking-widest">Reputation</p>
              </div>
              <div className="border-l border-divider pl-4 md:pl-6 text-center md:text-left">
                <p className="text-lg font-black text-textMain">{profile.completionRate || 100}%</p>
                <p className="text-[10px] text-textMuted font-black uppercase tracking-widest">Success Rate</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-8 px-6 md:px-12">
        <aside className="col-span-12 lg:col-span-4 space-y-6">
          <div className="card p-6 shadow-sm">
            <h3 className="text-xs font-black text-textMuted uppercase tracking-widest mb-4">About Creator</h3>
            <p className="text-sm text-textMain leading-relaxed mb-6 font-medium">{profile.bio}</p>
            <div className="space-y-4 pt-4 border-t border-divider">
              <div className="flex items-center gap-3 text-textMuted">
                <MapPin size={18} className="text-primary" /><span className="text-xs font-bold">{profile.location || 'Global'}</span>
              </div>
              <div className="flex items-center gap-3 text-textMuted">
                <Calendar size={18} className="text-primary" /><span className="text-xs font-bold">Joined {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
              </div>
              {profile.website && (
                <div className="flex items-center gap-3 text-textMuted">
                  <LinkIcon size={18} className="text-primary" />
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-xs font-bold hover:text-primary transition">{profile.website.replace(/^https?:\/\//, '')}</a>
                </div>
              )}
            </div>
            <div className="mt-8">
              <h4 className="text-[10px] font-black text-textMuted uppercase tracking-widest mb-3">Top Skills</h4>
              <div className="flex flex-wrap gap-2">
                {profile.skills?.split(',').map(skill => (
                  <span key={skill} className="px-3 py-1 bg-surface border border-divider rounded-full text-[10px] font-black uppercase text-textMain">{skill.trim()}</span>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="flex border-b border-divider sticky top-0 bg-background/80 backdrop-blur-md z-20">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-6 py-4 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === tab.id ? 'text-primary' : 'text-textMuted hover:text-textMain'}`}>
                <tab.icon size={16} />{tab.label}
                {activeTab === tab.id && <motion.div layoutId="profile-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
              </button>
            ))}
          </div>

          <div className="py-4">
            <AnimatePresence mode="wait">
              {activeTab === 'PORTFOLIO' && (
                <motion.div key="portfolio" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-12">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-black text-textMain tracking-tight">Showcase</h3>
                    {isOwner && (
                      <button onClick={() => setIsAddProjectOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary/20 transition border border-primary/20">
                        <Plus size={14} /> Add Project
                      </button>
                    )}
                  </div>
                  
                  {/* Featured Project Hero */}
                  {profile.portfolioItems?.some(p => p.featured) && (
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-textMuted uppercase tracking-widest">Featured Spotlight</h4>
                      {profile.portfolioItems.filter(p => p.featured).slice(0, 1).map(project => (
                        <div 
                          key={project.id}
                          onClick={() => { setSelectedProject(project); setIsProjectDetailOpen(true); }}
                          className="group relative aspect-[21/9] bg-surface rounded-[2.5rem] overflow-hidden border border-divider shadow-xl hover:shadow-2xl transition-all duration-700 cursor-pointer"
                        >
                          <div className="absolute inset-0 bg-gray-100 overflow-hidden">
                            <img src={project.media[0]?.url || "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" alt={project.title} />
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent p-8 flex flex-col justify-end">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="px-3 py-1 bg-primary text-white text-[9px] font-black uppercase tracking-tighter rounded-full shadow-lg shadow-primary/30">Featured</span>
                              <span className="px-3 py-1 bg-white/10 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-tighter rounded-full border border-white/20">{project.category}</span>
                            </div>
                            <h4 className="text-3xl font-black text-white mb-2 tracking-tight group-hover:text-primary transition-colors">{project.title}</h4>
                            <p className="text-white/70 text-sm max-w-xl font-medium mb-4 line-clamp-2">{project.description}</p>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2 text-white/50 text-[10px] font-black uppercase tracking-widest">
                                <Users size={12} /> {project.credits?.length || 0} Collaborators
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                    {profile.portfolioItems?.length > 0 ? (
                      profile.portfolioItems.filter(p => !p.featured || profile.portfolioItems.filter(f => f.featured).indexOf(p) > 0).map((item) => (
                        <div 
                          key={item.id} 
                          onClick={() => { setSelectedProject(item); setIsProjectDetailOpen(true); }}
                          className="group relative aspect-video bg-surface rounded-[2.5rem] overflow-hidden border border-divider shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer"
                        >
                          <div className="absolute inset-0 bg-gray-100 overflow-hidden">
                            <img src={item.media[0]?.url || "https://images.unsplash.com/photo-1536440136628-849c177e76a1"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={item.title} />
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-6 flex flex-col justify-end">
                            <div className="flex items-center gap-2 mb-2">
                               <span className="px-2 py-0.5 bg-white/20 backdrop-blur-md text-white text-[8px] font-black uppercase tracking-tighter rounded-full border border-white/20">{item.category}</span>
                               <span className="px-2 py-0.5 bg-primary/20 backdrop-blur-md text-primary text-[8px] font-black uppercase tracking-tighter rounded-full border border-primary/20">{item.projectType}</span>
                            </div>
                            <h4 className="text-lg font-black text-white group-hover:text-primary transition-colors">{item.title}</h4>
                            <div className="flex items-center gap-4 mt-3">
                              <div className="flex items-center gap-1 text-white/70 text-[10px] font-bold"><Star size={12} className="text-primary" fill="currentColor" /> {item.viewCount || 0}</div>
                              <div className="flex items-center gap-1 text-white/70 text-[10px] font-bold"><Users size={12} /> {item.credits?.length || 0}</div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-1 md:col-span-2 py-24 flex flex-col items-center justify-center border-4 border-dashed border-divider rounded-[3rem] bg-surface/50">
                        <Grid size={56} className="text-textLight mb-6 opacity-20" />
                        <h4 className="text-xl font-black text-textMain tracking-tight">Showcase your brilliance</h4>
                        <p className="text-sm text-textMuted mt-1">Upload your best work to get noticed by recruiters.</p>
                        {isOwner && (
                          <button onClick={() => setIsAddProjectOpen(true)} className="mt-8 px-8 py-3 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:scale-105 transition shadow-xl shadow-primary/20">
                            Upload First Project
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Modals */}
      <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} profile={profile} onUpdate={(updated) => setProfile(updated)} />
      <AddPortfolioModal isOpen={isAddProjectOpen} onClose={() => setIsAddProjectOpen(false)} onProjectCreated={fetchProfile} />
      <ProjectDetailsModal isOpen={isProjectDetailOpen} onClose={() => setIsProjectDetailOpen(false)} project={selectedProject} />
      
      <PhotoActionModal isOpen={avatarMenuOpen} onClose={() => setAvatarMenuOpen(false)} onAction={(id) => handleAction(id, 'avatar')} title="Avatar Settings" type="avatar" hasPhoto={!!profile.profileImage} />
      <PhotoActionModal isOpen={coverMenuOpen} onClose={() => setCoverMenuOpen(false)} onAction={(id) => handleAction(id, 'cover')} title="Cover Settings" type="cover" hasPhoto={!!profile.coverImage} />
      <PhotoViewerModal isOpen={viewerOpen} onClose={() => setViewerOpen(false)} photoUrl={viewerUrl} title={profile.displayName || profile.username} />

      <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'avatar')} />
      <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'cover')} />

      {uploadLoading && (
        <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-md flex items-center justify-center">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="font-black text-xs uppercase tracking-widest text-textMain">Processing...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
