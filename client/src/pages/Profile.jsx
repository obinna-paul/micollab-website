import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  MapPin, Link as LinkIcon, Calendar, Users, 
  Briefcase, CheckCircle, Star, MessageSquare, 
  UserPlus, Share2, Grid, Info, Clock, ExternalLink,
  Camera, X, Plus, ChevronLeft, ChevronRight, Layers, List
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
  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.displayName || profile.username)}&background=181D2A&color=fff&size=200`;

  return (
    <div className="max-w-7xl mx-auto pb-20">
      {/* Hero Section */}
      <div className="relative mb-8">
        {/* Cover Image */}
        <div className="h-64 md:h-80 w-full rounded-3xl overflow-hidden relative group shadow-sm bg-[#181D2A] border border-white/5">
          {profile.coverImage ? (
            <img src={profile.coverImage} alt="Cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80 hover:opacity-100" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#181D2A] to-[#0F131E]"></div>
          )}
          {isOwner && (
            <button onClick={() => setCoverMenuOpen(true)} className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-black/70 transition shadow-sm border border-white/10 z-10">
              Change Cover
            </button>
          )}
        </div>

        {/* Profile Info */}
        <div className="px-6 md:px-12 flex flex-col md:flex-row items-center md:items-start gap-6 relative">
          <div className="-mt-16 md:-mt-20 relative group z-10 shrink-0 self-center md:self-start">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-[6px] border-[#0F131E] shadow-xl overflow-hidden bg-[#181D2A] relative">
              <img src={profile.profileImage || fallbackAvatar} className="w-full h-full object-cover" alt="Avatar" />
              {profile.isVerified === 'YES' && (
                <div className="absolute bottom-2 right-2 bg-[#7B5CFA] text-white p-1.5 rounded-full border-4 border-[#0F131E] shadow-lg z-20">
                  <CheckCircle size={18} fill="currentColor" />
                </div>
              )}
              {isOwner && (
                <div onClick={() => setAvatarMenuOpen(true)} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition cursor-pointer z-10">
                  <span className="text-white text-xs font-bold">Edit Avatar</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 pt-4 pb-4 w-full flex flex-col justify-center">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-3 mb-1">
                  <h1 className="text-3xl font-black text-white tracking-tight">{profile.displayName || profile.username}</h1>
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    {/* Verified icon is on avatar */}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[#8B95A5] font-bold text-sm mt-1 justify-center md:justify-start">
                  <Briefcase size={14} className="text-[#7B5CFA]" />
                  <span>{profile.profileType || 'Sound Designer & Producer'}</span>
                </div>
              </div>

              <div className="flex items-center justify-center md:justify-start gap-3">
                {isOwner ? (
                  <button onClick={() => setIsEditModalOpen(true)} className="px-6 py-3 bg-[#181D2A] border border-white/10 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-white/5 transition shadow-sm">
                    Edit Profile
                  </button>
                ) : (
                  <>
                    <button className="px-6 py-2.5 bg-[#181D2A] border border-white/10 text-white font-black text-xs rounded-xl hover:bg-white/5 transition shadow-sm flex items-center gap-2">
                      <MessageSquare size={16} /> Message
                    </button>
                    <button className="px-6 py-2.5 bg-[#7B5CFA] text-white font-black text-xs rounded-xl hover:bg-[#684CE0] transition shadow-[0_0_15px_rgba(123,92,250,0.3)] flex items-center gap-2">
                      <Plus size={16} /> Follow
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 px-6 md:px-12">
        {/* Left Column (3) */}
        <aside className="col-span-1 md:col-span-3 space-y-6">
          <div className="bg-[#181D2A] border border-white/5 rounded-3xl p-6 shadow-sm flex flex-col h-full">
            <h4 className="text-[10px] font-black text-[#8B95A5] uppercase tracking-widest mb-4">Your Tags</h4>
            <div className="flex flex-wrap gap-2 mb-6">
              {(profile.skills ? profile.skills.split(',') : ['MusicProduction', 'EDM', 'Ableton', 'SoundDesign']).map(skill => (
                <span key={skill} className="px-3 py-1.5 bg-[#0F131E] border border-white/5 rounded-lg text-[10px] font-black text-[#8B95A5] hover:text-white transition cursor-pointer">
                  #{skill.trim().replace(/\s+/g, '')}
                </span>
              ))}
            </div>
            
            <p className="text-sm text-white leading-relaxed font-medium mb-8">
              {profile.bio || "Crafting immersive auditory experiences for games, films, and interactive media. Obsessed with granular synthesis and analog warmth. Currently open for freelance collaborations."}
            </p>
            
            <div className="flex justify-between items-center mt-auto pt-4 border-t border-white/5">
              <div className="text-center">
                <p className="text-lg font-black text-white">{profile.portfolioItems?.length || 42}</p>
                <p className="text-[9px] text-[#8B95A5] font-black uppercase tracking-widest">Projects</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-black text-white">12.5k</p>
                <p className="text-[9px] text-[#8B95A5] font-black uppercase tracking-widest">Followers</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-black text-white">18</p>
                <p className="text-[9px] text-[#8B95A5] font-black uppercase tracking-widest">Collabs</p>
              </div>
            </div>
          </div>

          <div className="bg-[#181D2A] border border-white/5 rounded-3xl p-6 shadow-sm">
            <h4 className="text-[10px] font-black text-[#8B95A5] uppercase tracking-widest mb-4">Specializations</h4>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1.5 bg-[#7B5CFA]/20 text-[#7B5CFA] rounded-lg text-[10px] font-black">Sound Design</span>
              <span className="px-3 py-1.5 bg-[#00D4FF]/10 text-[#00D4FF] rounded-lg text-[10px] font-black">Foley</span>
              <span className="px-3 py-1.5 bg-[#FF2E93]/20 text-[#FF2E93] rounded-lg text-[10px] font-black">Mixing & Mastering</span>
              <span className="px-3 py-1.5 bg-[#FF8A00]/20 text-[#FF8A00] rounded-lg text-[10px] font-black">Game Audio</span>
              <span className="px-3 py-1.5 bg-[#0F131E] text-[#8B95A5] border border-white/5 rounded-lg text-[10px] font-black">Ableton Live</span>
              <span className="px-3 py-1.5 bg-[#0F131E] text-[#8B95A5] border border-white/5 rounded-lg text-[10px] font-black">Wwise</span>
            </div>
          </div>

          <div className="bg-[#181D2A] border border-white/5 rounded-3xl p-6 shadow-sm">
            <h4 className="text-[10px] font-black text-[#8B95A5] uppercase tracking-widest mb-4">Top Endorsements</h4>
            <div className="space-y-6">
              <div className="flex gap-3">
                <img src="https://ui-avatars.com/api/?name=Elena+Rostova" className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-black text-white">Elena Rostova</p>
                    <span className="text-[8px] bg-[#00D4FF]/10 text-[#00D4FF] px-2 py-0.5 rounded uppercase font-black">Collab Partner</span>
                  </div>
                  <p className="text-xs text-[#8B95A5] leading-relaxed italic">"Alex brought our sci-fi short to life. The attention to detail in the ambient soundscapes was mind-blowing."</p>
                </div>
              </div>
              <div className="flex gap-3">
                <img src="https://ui-avatars.com/api/?name=Marcus+Chen" className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-black text-white">Marcus Chen</p>
                    <span className="text-[8px] bg-[#FF2E93]/10 text-[#FF2E93] px-2 py-0.5 rounded uppercase font-black">Director</span>
                  </div>
                  <p className="text-xs text-[#8B95A5] leading-relaxed italic">"Incredible turnaround time and perfectly nailed the cyberpunk aesthetic we needed."</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Middle Column (6) */}
        <div className="col-span-1 md:col-span-6 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2"><Star size={16} className="text-[#FF8A00]" /> Pinned Deck</h3>
              <button className="text-[10px] text-[#8B95A5] hover:text-white font-black uppercase tracking-widest">View All</button>
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar">
              {profile.portfolioItems?.filter(p => p.featured).slice(0, 2).map((project, idx) => (
                <div 
                  key={project.id}
                  onClick={() => { setSelectedProject(project); setIsProjectDetailOpen(true); }}
                  className="min-w-[280px] sm:min-w-[320px] group relative aspect-video bg-[#181D2A] rounded-[2rem] overflow-hidden border border-white/5 shadow-lg snap-center cursor-pointer flex-shrink-0"
                >
                  <div className="absolute inset-0 bg-[#0F131E] overflow-hidden">
                    <img src={project.media[0]?.url || (idx === 0 ? "https://images.unsplash.com/photo-1511379938547-c1f69419868d" : "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04")} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100" alt={project.title} />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent p-6 flex flex-col justify-end">
                    <div className="mb-2">
                      <span className="px-3 py-1 bg-[#7B5CFA] text-white text-[8px] font-black uppercase tracking-tighter rounded-full shadow-lg shadow-[#7B5CFA]/30">Featured Project</span>
                    </div>
                    <h4 className="text-xl font-black text-white mb-1 tracking-tight">{project.title}</h4>
                    <p className="text-[#8B95A5] text-xs font-medium line-clamp-1">{project.description}</p>
                  </div>
                </div>
              ))}
              {(!profile.portfolioItems || profile.portfolioItems.filter(p => p.featured).length === 0) && (
                 <>
                   <div className="min-w-[280px] sm:min-w-[320px] group relative aspect-video bg-[#181D2A] rounded-[2rem] overflow-hidden border border-white/5 shadow-lg snap-center cursor-pointer flex-shrink-0">
                     <div className="absolute inset-0 bg-[#0F131E] overflow-hidden">
                       <img src="https://images.unsplash.com/photo-1511379938547-c1f69419868d" className="w-full h-full object-cover opacity-90" />
                     </div>
                     <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent p-6 flex flex-col justify-end">
                       <span className="px-3 py-1 bg-[#7B5CFA] text-white text-[8px] font-black uppercase tracking-tighter rounded-full w-max mb-2">Featured Project</span>
                       <h4 className="text-xl font-black text-white mb-1">Neon Shadows OST</h4>
                       <p className="text-[#8B95A5] text-xs font-medium line-clamp-1">Full original score and sound design...</p>
                     </div>
                   </div>
                   <div className="min-w-[280px] sm:min-w-[320px] group relative aspect-video bg-[#181D2A] rounded-[2rem] overflow-hidden border border-white/5 shadow-lg snap-center cursor-pointer flex-shrink-0">
                     <div className="absolute inset-0 bg-[#0F131E] overflow-hidden">
                       <img src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04" className="w-full h-full object-cover opacity-90" />
                     </div>
                     <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent p-6 flex flex-col justify-end">
                       <h4 className="text-xl font-black text-white mb-1">Analog Synth Pack Vol 1</h4>
                       <p className="text-[#8B95A5] text-xs font-medium line-clamp-1">100+ royalty-free patches for Serum...</p>
                     </div>
                   </div>
                 </>
              )}
            </div>
            
            <div className="flex justify-center mt-2">
              <div className="bg-white text-black font-black text-sm px-6 py-2 rounded-full flex items-center gap-4 shadow-lg cursor-pointer">
                <ChevronLeft size={16} />
                <span>10 / 16</span>
                <ChevronRight size={16} />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2"><Layers size={16} className="text-[#7B5CFA]" /> Portfolio</h3>
              <div className="flex items-center gap-2">
                <button className="p-2 bg-[#181D2A] border border-white/5 rounded-lg text-white"><List size={14} /></button>
                <button className="p-2 bg-transparent text-[#8B95A5] hover:text-white"><Grid size={14} /></button>
              </div>
            </div>

            <div className="space-y-4">
              {profile.portfolioItems?.filter(p => !p.featured).slice(0, 2).map((item, idx) => (
                <div 
                  key={item.id} 
                  onClick={() => { setSelectedProject(item); setIsProjectDetailOpen(true); }}
                  className="bg-[#181D2A] border border-white/5 rounded-[2rem] p-4 flex flex-col sm:flex-row gap-6 cursor-pointer hover:bg-white/5 transition"
                >
                  <div className="flex gap-2">
                    <img src={item.media[0]?.url || "https://images.unsplash.com/photo-1550745165-9bc0b252726f"} className="w-24 h-24 object-cover rounded-2xl" />
                    <img src={item.media[1]?.url || "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04"} className="w-24 h-24 object-cover rounded-2xl" />
                    <div className="w-24 h-24 bg-[#0F131E] rounded-2xl flex items-center justify-center border border-white/5">
                      <span className="text-white font-black text-sm">+4</span>
                    </div>
                  </div>
                  <div className="flex-1 py-2">
                    <h4 className="text-lg font-black text-white mb-2">{item.title}</h4>
                    <p className="text-sm text-[#8B95A5] font-medium line-clamp-2 mb-4">{item.description}</p>
                    <div className="flex items-center gap-4 text-[#8B95A5] text-xs font-bold">
                      <span className="flex items-center gap-1">♡ {item.viewCount || 124}</span>
                      <span className="flex items-center gap-1"><MessageSquare size={14} /> 12</span>
                      <span>{item.category || 'Game Audio'}</span>
                    </div>
                  </div>
                </div>
              ))}
              
              {(!profile.portfolioItems || profile.portfolioItems.filter(p => !p.featured).length === 0) && (
                <>
                  <div className="bg-[#181D2A] border border-white/5 rounded-[2rem] p-4 flex flex-col sm:flex-row gap-6 cursor-pointer hover:bg-white/5 transition">
                    <div className="flex gap-2">
                      <img src="https://images.unsplash.com/photo-1550745165-9bc0b252726f" className="w-24 h-24 object-cover rounded-2xl" />
                      <img src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04" className="w-24 h-24 object-cover rounded-2xl" />
                      <div className="w-24 h-24 bg-[#0F131E] rounded-2xl flex items-center justify-center border border-white/5">
                        <span className="text-white font-black text-sm">+4</span>
                      </div>
                    </div>
                    <div className="flex-1 py-2">
                      <h4 className="text-lg font-black text-white mb-2">Cyberpunk Game Audio Assets</h4>
                      <p className="text-sm text-[#8B95A5] font-medium line-clamp-2 mb-4">Complete UI and environmental sound package for an upcoming indie RPG.</p>
                      <div className="flex items-center gap-4 text-[#8B95A5] text-xs font-bold">
                        <span className="flex items-center gap-1">♡ 124</span>
                        <span className="flex items-center gap-1"><MessageSquare size={14} /> 12</span>
                        <span>Game Audio</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-[#181D2A] border border-white/5 rounded-[2rem] p-4 flex flex-col sm:flex-row gap-6 cursor-pointer hover:bg-white/5 transition">
                    <div className="flex gap-2">
                      <img src="https://images.unsplash.com/photo-1614680376593-902f74cf0d41" className="w-48 h-24 object-cover rounded-2xl" />
                    </div>
                    <div className="flex-1 py-2">
                      <h4 className="text-lg font-black text-white mb-2">"Ethereal" - Short Film Score</h4>
                      <p className="text-sm text-[#8B95A5] font-medium line-clamp-2 mb-4">Orchestral arrangement mixed with heavy electronic elements.</p>
                      <div className="flex items-center gap-4 text-[#8B95A5] text-xs font-bold">
                        <span className="flex items-center gap-1">♡ 89</span>
                        <span className="flex items-center gap-1"><MessageSquare size={14} /> 5</span>
                        <span>Film Score</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (3) */}
        <aside className="col-span-1 md:col-span-3 space-y-6">
          <div className="bg-[#00D4FF]/5 border border-[#00D4FF]/20 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#00D4FF]/10 blur-2xl rounded-full" />
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-[#00D4FF] animate-pulse" />
              <h4 className="text-xs font-black text-[#00D4FF] uppercase tracking-widest">Open for Collaboration</h4>
            </div>
            <p className="text-xs text-[#8B95A5] leading-relaxed">
              Currently accepting new projects for Q3. Special rates for indie game devs.
            </p>
          </div>

          <div>
            <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2"><LinkIcon size={12} className="text-[#7B5CFA]" /> Mutual Connections</h4>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img src="https://ui-avatars.com/api/?name=Sarah+Jenkins" className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <p className="text-sm font-black text-white">Sarah Jenkins</p>
                  <p className="text-[10px] text-[#8B95A5] font-bold">3D Animator</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <img src="https://ui-avatars.com/api/?name=David+Kim" className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <p className="text-sm font-black text-white">David Kim</p>
                  <p className="text-[10px] text-[#8B95A5] font-bold">UI/UX Designer</p>
                </div>
              </div>
            </div>
          </div>
        </aside>
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
        <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-md flex items-center justify-center">
          <div className="bg-[#181D2A] border border-white/10 p-10 rounded-[2.5rem] shadow-2xl flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-[#7B5CFA] border-t-transparent rounded-full animate-spin"></div>
            <p className="font-black text-xs uppercase tracking-widest text-white">Processing...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
