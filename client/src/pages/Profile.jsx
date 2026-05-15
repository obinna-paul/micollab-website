import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  MapPin, Link as LinkIcon, Calendar, Users, 
  Briefcase, CheckCircle, Star, MessageSquare, 
  UserPlus, Share2, Grid, Info, Clock, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import useAuthStore from '../store/useAuthStore';
import EditProfileModal from '../components/EditProfileModal';
import PhotoActionModal from '../components/PhotoActionModal';
import PhotoViewerModal from '../components/PhotoViewerModal';
import { Camera } from 'lucide-react';

const TABS = [
  { id: 'PORTFOLIO', label: 'Portfolio', icon: Grid },
  { id: 'ABOUT', label: 'About', icon: Info },
  { id: 'EXPERIENCE', label: 'Experience', icon: Briefcase },
  { id: 'ACTIVITY', label: 'Activity', icon: Clock }
];

const Profile = () => {
  const { username } = useParams();
  const { user: currentUser, token, updateProfile: updateAuthProfile } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('PORTFOLIO');
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Image Management State
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [coverMenuOpen, setCoverMenuOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);

  const avatarInputRef = React.useRef(null);
  const coverInputRef = React.useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/users/profile/${username}`);
        setProfile(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [username]);

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadLoading(true);
    const formData = new FormData();
    formData.append('media', file);

    try {
      // 1. Upload the file
      const uploadRes = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      const imageUrl = uploadRes.data.urls[0];

      // 2. Update the profile
      const updateData = type === 'avatar' ? { profileImage: imageUrl } : { coverImage: imageUrl };
      const profileRes = await axios.put('http://localhost:5000/api/users/profile', updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setProfile(profileRes.data);
      
      // 3. Sync with global auth store so navbar/sidebar update
      if (isOwner) {
        updateAuthProfile(updateData);
      }
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleRemovePhoto = async (type) => {
    try {
      const updateData = type === 'avatar' ? { profileImage: null } : { coverImage: null };
      const profileRes = await axios.put('http://localhost:5000/api/users/profile', updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(profileRes.data);
      
      // Sync with global auth store
      if (isOwner) {
        updateAuthProfile(updateData);
      }
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

  return (
    <div className="max-w-7xl mx-auto pb-20">
      {/* Hero Section */}
      <div className="relative mb-8">
        {/* Cover Image */}
        <div className="h-64 md:h-80 w-full rounded-3xl overflow-hidden relative group shadow-sm bg-gray-200">
          {(profile.coverImage && profile.coverImage !== "https://images.unsplash.com/photo-1579546929518-9e396f3cc809") ? (
            <img 
              src={profile.coverImage} 
              alt="Cover" 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
          ) : (
            <div className="w-full h-full bg-gray-200"></div>
          )}
          
          {isOwner && (
            <button 
              onClick={() => setCoverMenuOpen(true)}
              className="absolute top-4 right-4 bg-white/50 backdrop-blur-md text-textMain px-4 py-2 rounded-xl text-xs font-bold hover:bg-white/80 transition shadow-sm border border-white/20 z-10"
            >
              Change Cover
            </button>
          )}
        </div>

        {/* Profile Info (Below Cover) */}
        <div className="px-6 md:px-12 flex flex-col md:flex-row gap-6 relative">
          {/* Avatar Container */}
          <div className="-mt-16 md:-mt-20 relative group z-10 shrink-0 self-start">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-[6px] border-surface shadow-lg overflow-hidden bg-gray-100 relative">
              <img 
                src={profile.profileImage && profile.profileImage !== "https://via.placeholder.com/150" ? profile.profileImage : `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.displayName || profile.username)}&background=f3f4f6&color=374151&size=200`} 
                className="w-full h-full object-cover"
                alt="Avatar"
              />
              {profile.isVerified === 'YES' && (
                <div className="absolute bottom-2 right-2 bg-primary text-white p-1.5 rounded-full border-4 border-surface shadow-lg z-20">
                  <CheckCircle size={18} fill="currentColor" />
                </div>
              )}
              {isOwner && (
                <div 
                  onClick={() => setAvatarMenuOpen(true)}
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition cursor-pointer z-10"
                >
                  <span className="text-white text-xs font-bold">Edit Avatar</span>
                </div>
              )}
            </div>
          </div>

          {/* Text and Actions */}
          <div className="flex-1 pt-4 pb-4">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-1">
                  <h1 className="text-3xl font-black text-textMain tracking-tight">
                    {profile.displayName || profile.username}
                  </h1>
                  <span className="text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20">
                    {profile.profileType}
                  </span>
                  <div className="flex items-center gap-1 bg-green-500/10 text-green-600 px-3 py-1 rounded-full border border-green-500/20">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-black uppercase tracking-wider">{profile.availabilityStatus || 'Available'}</span>
                  </div>
                </div>
                <p className="text-textMuted font-bold text-sm">@{profile.username}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                {isOwner ? (
                  <>
                    <button 
                      onClick={() => setIsEditModalOpen(true)}
                      className="px-6 py-3 bg-white border border-divider text-textMain font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-gray-50 transition shadow-sm"
                    >
                      Edit Profile
                    </button>
                    <EditProfileModal 
                      isOpen={isEditModalOpen}
                      onClose={() => setIsEditModalOpen(false)}
                      profile={profile}
                      onUpdate={(updated) => setProfile(updated)}
                    />
                  </>
                ) : (
                  <>
                    <button className="px-6 py-3 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:scale-105 transition shadow-lg flex items-center gap-2">
                      <UserPlus size={16} />
                      Connect
                    </button>
                    <button className="p-3 bg-surface border border-divider text-textMain rounded-2xl hover:bg-gray-50 transition shadow-sm">
                      <MessageSquare size={20} />
                    </button>
                    <button className="p-3 bg-surface border border-divider text-textMain rounded-2xl hover:bg-gray-50 transition shadow-sm">
                      <Share2 size={20} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-6 mt-6 pt-6 border-t border-divider">
              <div>
                <p className="text-lg font-black text-textMain">1.2k</p>
                <p className="text-[10px] text-textMuted font-black uppercase tracking-widest">Followers</p>
              </div>
              <div className="border-l border-divider pl-6">
                <p className="text-lg font-black text-textMain">{profile.reputationScore || 0}</p>
                <p className="text-[10px] text-textMuted font-black uppercase tracking-widest">Reputation</p>
              </div>
              <div className="border-l border-divider pl-6">
                <p className="text-lg font-black text-textMain">{profile.completionRate || 100}%</p>
                <p className="text-[10px] text-textMuted font-black uppercase tracking-widest">Success Rate</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Management Modals */}
      <AnimatePresence>
        {avatarMenuOpen && (
          <PhotoActionModal 
            isOpen={avatarMenuOpen}
            onClose={() => setAvatarMenuOpen(false)}
            onAction={(id) => handleAction(id, 'avatar')}
            title="Avatar Settings"
            type="avatar"
            hasPhoto={!!profile.profileImage && profile.profileImage !== "https://via.placeholder.com/150"}
          />
        )}

        {coverMenuOpen && (
          <PhotoActionModal 
            isOpen={coverMenuOpen}
            onClose={() => setCoverMenuOpen(false)}
            onAction={(id) => handleAction(id, 'cover')}
            title="Cover Settings"
            type="cover"
            hasPhoto={!!profile.coverImage && profile.coverImage !== "https://images.unsplash.com/photo-1579546929518-9e396f3cc809"}
          />
        )}

        {viewerOpen && (
          <PhotoViewerModal 
            isOpen={viewerOpen}
            onClose={() => setViewerOpen(false)}
            photoUrl={viewerUrl}
            title={profile.displayName || profile.username}
          />
        )}
      </AnimatePresence>

      {/* Hidden File Inputs */}
      <input 
        type="file" 
        ref={avatarInputRef} 
        className="hidden" 
        accept="image/*"
        onChange={(e) => handleFileUpload(e, 'avatar')} 
      />
      <input 
        type="file" 
        ref={coverInputRef} 
        className="hidden" 
        accept="image/*"
        onChange={(e) => handleFileUpload(e, 'cover')} 
      />

      {uploadLoading && (
        <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="font-black text-xs uppercase tracking-widest text-textMain">Uploading Brand Asset...</p>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-8 px-6 md:px-12">
        {/* Left Sidebar */}
        <aside className="col-span-12 lg:col-span-4 space-y-6">
          <div className="card p-6 shadow-sm">
            <h3 className="text-xs font-black text-textMuted uppercase tracking-widest mb-4">About Creator</h3>
            <p className="text-sm text-textMain leading-relaxed mb-6 font-medium">
              {profile.bio}
            </p>
            
            <div className="space-y-4 pt-4 border-t border-divider">
              <div className="flex items-center gap-3 text-textMuted">
                <MapPin size={18} className="text-primary" />
                <span className="text-xs font-bold">{profile.location || 'Global'}</span>
              </div>
              <div className="flex items-center gap-3 text-textMuted">
                <Calendar size={18} className="text-primary" />
                <span className="text-xs font-bold">Joined {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-3 text-textMuted">
                <LinkIcon size={18} className="text-primary" />
                <a href="#" className="text-xs font-bold hover:text-primary transition">davfilmz.studio</a>
              </div>
            </div>

            <div className="mt-8">
              <h4 className="text-[10px] font-black text-textMuted uppercase tracking-widest mb-3">Top Skills</h4>
              <div className="flex flex-wrap gap-2">
                {profile.skills?.split(',').map(skill => (
                  <span key={skill} className="px-3 py-1 bg-surface border border-divider rounded-full text-[10px] font-black uppercase text-textMain">
                    {skill.trim()}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Social Proof Widget */}
          <div className="card p-6 bg-gradient-to-br from-primary to-indigo-600 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black uppercase tracking-widest">Testimonials</h3>
              <Star size={16} fill="white" />
            </div>
            <p className="text-sm italic font-medium opacity-90 leading-relaxed">
              "One of the most visionary directors I've collaborated with. Truly understands the craft."
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 border border-white/30 overflow-hidden">
                <img src="https://i.pravatar.cc/150?u=scout" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase">Sarah Jenkins</p>
                <p className="text-[8px] font-bold opacity-60">Lead Producer @ Greoh</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Center Content */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Tabs Navigation */}
          <div className="flex border-b border-divider sticky top-0 bg-background/80 backdrop-blur-md z-20">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-xs font-black uppercase tracking-widest transition-all relative ${
                  activeTab === tab.id ? 'text-primary' : 'text-textMuted hover:text-textMain'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div layoutId="profile-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="py-4">
            <AnimatePresence mode="wait">
              {activeTab === 'PORTFOLIO' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-textMain tracking-tight">Featured Work</h3>
                    {isOwner && (
                      <button className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">
                        + Add Project
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Featured Project Large */}
                    <div className="col-span-1 md:col-span-2 group relative aspect-[21/9] bg-surface rounded-3xl overflow-hidden border border-divider shadow-lg hover:shadow-2xl transition-all duration-700">
                      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1492691527719-9d1e07e534b4')] bg-cover bg-center group-hover:scale-105 transition-transform duration-1000"></div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-8 flex flex-col justify-end">
                        <div className="flex items-center gap-2 mb-2">
                           <span className="px-3 py-1 bg-primary text-white text-[9px] font-black uppercase tracking-tighter rounded-full">Featured</span>
                           <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-tighter rounded-full">Director's Cut</span>
                        </div>
                        <h4 className="text-3xl font-black text-white mb-2 tracking-tight">Midnight in Lagos</h4>
                        <p className="text-white/70 text-sm max-w-xl font-medium mb-4">A cinematic exploration of the city's vibrant nightlife and hidden stories.</p>
                        <div className="flex items-center gap-6">
                           <div className="flex -space-x-3">
                              {[1, 2, 3].map(i => (
                                <div key={i} className="w-8 h-8 rounded-full border-2 border-black overflow-hidden">
                                  <img src={`https://i.pravatar.cc/100?u=${i}`} className="w-full h-full object-cover" />
                                </div>
                              ))}
                           </div>
                           <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">+ 12 Credits</p>
                        </div>
                      </div>
                    </div>

                    {/* Standard Portfolio Items */}
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="group relative aspect-video bg-surface rounded-2xl overflow-hidden border border-divider shadow-sm hover:shadow-xl transition-all duration-500">
                        <div className="absolute inset-0 bg-gray-200 overflow-hidden">
                           <img 
                            src={`https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=600&auto=format&fit=crop&u=${i}`} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                           />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-6 flex flex-col justify-end">
                          <p className="text-[10px] font-black text-primary uppercase mb-1 tracking-widest">Showcase</p>
                          <h4 className="text-lg font-black text-white">Project Title {i}</h4>
                          <div className="flex items-center gap-4 mt-3">
                             <div className="flex items-center gap-1 text-white/70 text-[10px] font-bold">
                                <Star size={12} className="text-primary" fill="currentColor" /> 124
                             </div>
                             <div className="flex items-center gap-1 text-white/70 text-[10px] font-bold">
                                <Users size={12} /> 4 Collabs
                             </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'ABOUT' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card p-8 space-y-6"
                >
                  <h3 className="text-xl font-black text-textMain tracking-tight">The Creative Journey</h3>
                  <p className="text-textMuted leading-relaxed font-medium">
                    {profile.longAbout || "No extended biography available yet."}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
