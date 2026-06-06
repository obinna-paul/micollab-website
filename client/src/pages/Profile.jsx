import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  MapPin, Link as LinkIcon, Calendar, Users, 
  Briefcase, CheckCircle, Star, MessageSquare, 
  UserPlus, Share2, Grid, Info, Clock, ExternalLink,
  Camera, X, Plus, ChevronLeft, ChevronRight, Layers, List, Search, Bell, Mail, Headphones, Heart, MessageCircle, HelpCircle, Pin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import useAuthStore from '../store/useAuthStore';
import EditProfileModal from '../components/EditProfileModal';
import PhotoActionModal from '../components/PhotoActionModal';
import PhotoViewerModal from '../components/PhotoViewerModal';
import AddPortfolioModal from '../components/AddPortfolioModal';
import ProjectDetailsModal from '../components/ProjectDetailsModal';

const Profile = () => {
  const { username } = useParams();
  const { user: currentUser, token, updateProfile: updateAuthProfile } = useAuthStore();
  const [profile, setProfile] = useState(null);
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
      const res = await axios.get('/api/users/profile/' + username);
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
          Authorization: 'Bearer ' + token
        }
      });

      const imageUrl = uploadRes.data.urls[0];
      const updateData = type === 'avatar' ? { profileImage: imageUrl } : { coverImage: imageUrl };
      const profileRes = await axios.put('/api/users/profile', updateData, {
        headers: { Authorization: 'Bearer ' + token }
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
        headers: { Authorization: 'Bearer ' + token }
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
      <div className="w-12 h-12 border-4 border-[#7B5CFA] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!profile) return (
    <div className="text-center py-20">
      <h2 className="text-2xl font-black text-white">Creator not found</h2>
      <Link to="/" className="text-[#7B5CFA] hover:underline mt-2 inline-block">Return to home</Link>
    </div>
  );

  const isOwner = currentUser?.id === profile.id;
  const fallbackAvatar = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(profile.displayName || profile.username) + '&background=181D2A&color=fff&size=200';

  return (
    <div className="max-w-[1600px] mx-auto pb-20 px-4 md:px-8 xl:px-12 pt-6">
      
      {/* Top Nav Mockup */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center bg-[#181D2A] border border-white/5 rounded-full px-5 py-3 w-full max-w-2xl shadow-sm">
          <Search size={18} className="text-[#8B95A5]" />
          <input type="text" placeholder="Search creatives, projects, or tags..." className="bg-transparent border-none text-[13px] text-white placeholder-[#8B95A5] focus:outline-none ml-3 w-full font-medium" />
        </div>
        <div className="hidden md:flex items-center gap-4">
          <button className="w-11 h-11 rounded-full bg-[#181D2A] border border-white/5 flex items-center justify-center text-[#8B95A5] relative hover:bg-white/5 transition shadow-sm">
            <Bell size={18} />
            <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-[#FF2E93] rounded-full ring-[3px] ring-[#181D2A]"></span>
          </button>
          <button className="w-11 h-11 rounded-full bg-[#181D2A] border border-white/5 flex items-center justify-center text-[#8B95A5] hover:bg-white/5 transition shadow-sm">
            <Mail size={18} />
          </button>
          <div className="w-11 h-11 rounded-full bg-[#181D2A] overflow-hidden ml-3 cursor-pointer border-[1.5px] border-[#7B5CFA]/50 hover:border-[#7B5CFA] transition shadow-sm">
            <img src={currentUser?.profileImage || 'https://ui-avatars.com/api/?name=User'} className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Left & Middle Wrapper (9 cols) */}
        <div className="col-span-1 xl:col-span-9 flex flex-col">
          
          {/* Cover Image */}
          <div className="h-[260px] md:h-[300px] w-full rounded-t-[2rem] overflow-hidden relative group bg-gradient-to-br from-[#8A2387] via-[#E94057] to-[#F27121] border-b border-white/5">
            {profile.coverImage ? (
              <img src={profile.coverImage} alt="Cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90" />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-[#9C27B0] to-[#3F51B5] opacity-80"></div>
            )}
            {isOwner && (
              <button onClick={() => setCoverMenuOpen(true)} className="absolute top-6 right-6 bg-black/50 backdrop-blur-md text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-black/70 transition shadow-lg border border-white/10 z-10">
                Change Cover
              </button>
            )}
          </div>

          {/* Header Info Grid (Internal 9 cols) */}
          <div className="grid grid-cols-1 md:grid-cols-9 gap-8 mb-8">
            
            {/* Avatar Column */}
            <div className="col-span-1 md:col-span-3 relative">
              <div className="h-[70px] hidden md:block"></div> {/* Spacer for Avatar overhang */}
              <div className="absolute -top-[75px] left-6 md:left-0 w-[140px] h-[140px] rounded-[1.8rem] border-[6px] border-[#0B0F19] shadow-2xl overflow-hidden bg-[#181D2A] z-20">
                <img src={profile.profileImage || fallbackAvatar} className="w-full h-full object-cover" alt="Avatar" />
                {isOwner && (
                  <div onClick={() => setAvatarMenuOpen(true)} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition cursor-pointer z-10">
                    <span className="text-white text-xs font-bold">Edit</span>
                  </div>
                )}
              </div>
              {profile.isVerified === 'YES' && (
                <div className="absolute top-[35px] left-[110px] bg-[#00D4FF] text-[#0B0F19] p-1 rounded-full border-[3px] border-[#0B0F19] z-30 shadow-sm">
                  <CheckCircle size={14} fill="currentColor" strokeWidth={2} />
                </div>
              )}
            </div>

            {/* Info Column */}
            <div className="col-span-1 md:col-span-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 px-6 md:px-0">
              <div>
                <h1 className="text-[32px] font-black text-white tracking-tight leading-none mb-2">{profile.displayName || profile.username}</h1>
                <div className="flex items-center gap-2">
                  <Headphones size={16} className="text-[#00D4FF]" />
                  <span className="text-[#00D4FF] font-bold text-sm tracking-wide">{profile.profileType || 'Sound Designer & Producer'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {isOwner ? (
                  <button onClick={() => setIsEditModalOpen(true)} className="px-6 py-2.5 bg-[#181D2A] border border-white/10 text-white font-bold text-sm rounded-xl hover:bg-white/5 transition shadow-sm">
                    Edit Profile
                  </button>
                ) : (
                  <>
                    <button className="px-6 py-2.5 bg-[#181D2A] border border-white/10 text-white font-bold text-sm rounded-xl hover:bg-white/5 transition shadow-sm flex items-center gap-2">
                      <Mail size={16} /> Message
                    </button>
                    <button className="px-7 py-2.5 bg-[#7B5CFA] text-white font-bold text-sm rounded-xl hover:bg-[#684CE0] transition shadow-[0_0_15px_rgba(123,92,250,0.4)] flex items-center gap-2">
                      <Plus size={16} strokeWidth={3} /> Follow
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Content Grid (Internal 9 cols) */}
          <div className="grid grid-cols-1 md:grid-cols-9 gap-8">
            
            {/* Left Sidebar (3 cols) */}
            <aside className="col-span-1 md:col-span-3 space-y-6">
              
              <div className="bg-[#181D2A] rounded-[1.5rem] p-6 shadow-sm border border-transparent">
                <h4 className="text-[11px] font-black text-white uppercase tracking-widest mb-5">YOUR TAGS</h4>
                <div className="flex flex-wrap gap-2.5 mb-7">
                  {(profile.skills ? profile.skills.split(',') : ['MusicProduction', 'EDM', 'Ableton', 'SoundDesign']).map(skill => (
                    <span key={skill} className="px-3 py-1.5 bg-[#252C3A] rounded-[0.4rem] text-[11px] font-bold text-[#8B95A5] hover:text-white transition cursor-pointer">
                      #{skill.trim().replace(/\s+/g, '')}
                    </span>
                  ))}
                </div>
                
                <p className="text-[13px] text-[#8B95A5] leading-relaxed mb-8 font-medium">
                  {profile.bio || "Crafting immersive auditory experiences for games, films, and interactive media. Obsessed with granular synthesis and analog warmth. Currently open for freelance collaborations."}
                </p>
                
                <div className="flex justify-between items-center">
                  <div className="flex flex-col items-center">
                    <p className="text-[22px] font-black text-white">{profile.portfolioItems?.length || 42}</p>
                    <p className="text-[9px] text-[#8B95A5] font-black uppercase tracking-widest mt-1">PROJECTS</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <p className="text-[22px] font-black text-white">12.5k</p>
                    <p className="text-[9px] text-[#8B95A5] font-black uppercase tracking-widest mt-1">FOLLOWERS</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <p className="text-[22px] font-black text-white">18</p>
                    <p className="text-[9px] text-[#8B95A5] font-black uppercase tracking-widest mt-1">COLLABS</p>
                  </div>
                </div>
              </div>

              <div className="bg-[#181D2A] rounded-[1.5rem] p-6 shadow-sm">
                <h4 className="text-[11px] font-black text-white uppercase tracking-widest mb-5">SPECIALIZATIONS</h4>
                <div className="flex flex-wrap gap-2.5">
                  <span className="px-3.5 py-2 bg-[#7B5CFA]/10 text-[#7B5CFA] rounded-lg text-[11px] font-bold">Sound Design</span>
                  <span className="px-3.5 py-2 bg-[#00D4FF]/10 text-[#00D4FF] rounded-lg text-[11px] font-bold">Foley</span>
                  <span className="px-3.5 py-2 bg-[#FF2E93]/10 text-[#FF2E93] rounded-lg text-[11px] font-bold">Mixing & Mastering</span>
                  <span className="px-3.5 py-2 bg-[#FF8A00]/10 text-[#FF8A00] rounded-lg text-[11px] font-bold">Game Audio</span>
                  <span className="px-3.5 py-2 bg-[#252C3A] text-[#8B95A5] rounded-lg text-[11px] font-bold">Ableton Live</span>
                  <span className="px-3.5 py-2 bg-[#252C3A] text-[#8B95A5] rounded-lg text-[11px] font-bold">Wwise</span>
                </div>
              </div>

              <div className="bg-[#181D2A] rounded-[1.5rem] p-6 shadow-sm">
                <h4 className="text-[11px] font-black text-white uppercase tracking-widest mb-6">TOP ENDORSEMENTS</h4>
                <div className="space-y-7">
                  <div className="flex gap-4">
                    <img src="https://ui-avatars.com/api/?name=Elena+Rostova&background=252C3A&color=fff" className="w-11 h-11 rounded-full object-cover" />
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-sm font-bold text-white">Elena Rostova</p>
                        <span className="text-[9px] bg-[#00D4FF]/10 text-[#00D4FF] px-2 py-0.5 rounded uppercase font-bold tracking-wider">Collab Partner</span>
                      </div>
                      <p className="text-xs text-[#8B95A5] leading-relaxed font-medium">"Alex brought our sci-fi short to life. The attention to detail in the ambient soundscapes was mind-blowing."</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <img src="https://ui-avatars.com/api/?name=Marcus+Chen&background=252C3A&color=fff" className="w-11 h-11 rounded-full object-cover" />
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-sm font-bold text-white">Marcus Chen</p>
                        <span className="text-[9px] bg-[#FF2E93]/10 text-[#FF2E93] px-2 py-0.5 rounded uppercase font-bold tracking-wider">Director</span>
                      </div>
                      <p className="text-xs text-[#8B95A5] leading-relaxed font-medium">"Incredible turnaround time and perfectly nailed the cyberpunk aesthetic we needed."</p>
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            {/* Middle Content (6 cols) */}
            <div className="col-span-1 md:col-span-6 space-y-8">
              
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2.5">
                    <Pin size={18} className="text-[#FF8A00]" fill="currentColor" /> Pinned Deck
                  </h3>
                  <button className="text-xs text-[#8B95A5] hover:text-white font-bold transition">View All</button>
                </div>
                
                <div className="flex gap-5 overflow-x-auto pb-4 snap-x hide-scrollbar">
                  {(!profile.portfolioItems || profile.portfolioItems.filter(p => p.featured).length === 0) ? (
                     <>
                       <div className="min-w-[280px] sm:min-w-[340px] flex-1 group relative h-[220px] bg-[#181D2A] rounded-[1.5rem] overflow-hidden shadow-lg snap-center cursor-pointer flex-shrink-0">
                         <img src="https://images.unsplash.com/photo-1511379938547-c1f69419868d" className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-700" />
                         <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-[#0B0F19]/40 to-transparent p-6 flex flex-col justify-end">
                           <span className="px-2.5 py-1 bg-[#7B5CFA] text-white text-[9px] font-black uppercase tracking-wider rounded w-max mb-3">FEATURED PROJECT</span>
                           <h4 className="text-xl font-black text-white mb-1.5 leading-tight">Neon Shadows OST</h4>
                           <p className="text-[#8B95A5] text-xs line-clamp-1 font-medium">Full original score and sound design...</p>
                         </div>
                       </div>
                       <div className="min-w-[280px] sm:min-w-[340px] flex-1 group relative h-[220px] bg-[#181D2A] rounded-[1.5rem] overflow-hidden shadow-lg snap-center cursor-pointer flex-shrink-0">
                         <img src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04" className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-700" />
                         <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-[#0B0F19]/40 to-transparent p-6 flex flex-col justify-end">
                           <h4 className="text-xl font-black text-white mb-1.5 leading-tight">Analog Synth Pack Vol 1</h4>
                           <p className="text-[#8B95A5] text-xs line-clamp-1 font-medium">100+ royalty-free patches for Serum...</p>
                         </div>
                       </div>
                     </>
                  ) : (
                    profile.portfolioItems.filter(p => p.featured).slice(0, 2).map((project) => (
                      <div 
                        key={project.id}
                        onClick={() => { setSelectedProject(project); setIsProjectDetailOpen(true); }}
                        className="min-w-[280px] sm:min-w-[340px] flex-1 group relative h-[220px] bg-[#181D2A] rounded-[1.5rem] overflow-hidden shadow-lg snap-center cursor-pointer flex-shrink-0"
                      >
                        <img src={project.media[0]?.url || "https://images.unsplash.com/photo-1511379938547-c1f69419868d"} className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-700" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-[#0B0F19]/40 to-transparent p-6 flex flex-col justify-end">
                          <span className="px-2.5 py-1 bg-[#7B5CFA] text-white text-[9px] font-black uppercase tracking-wider rounded w-max mb-3">FEATURED PROJECT</span>
                          <h4 className="text-xl font-black text-white mb-1.5 leading-tight">{project.title}</h4>
                          <p className="text-[#8B95A5] text-xs line-clamp-1 font-medium">{project.description}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                <div className="flex justify-center mt-2">
                  <div className="bg-white text-[#0B0F19] font-bold text-sm px-6 py-2.5 rounded-full flex items-center gap-6 shadow-xl cursor-pointer hover:bg-gray-100 transition">
                    <ChevronLeft size={18} />
                    <span className="tracking-wide">10 / 16</span>
                    <ChevronRight size={18} />
                  </div>
                </div>
              </div>

              <div className="space-y-5 pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2.5">
                    <Layers size={18} className="text-[#7B5CFA]" /> Portfolio
                  </h3>
                  <div className="flex items-center gap-2">
                    <button className="w-9 h-9 rounded-lg bg-[#252C3A] text-white flex items-center justify-center shadow-sm"><List size={16} /></button>
                    <button className="w-9 h-9 rounded-lg bg-transparent text-[#8B95A5] hover:text-white flex items-center justify-center"><Grid size={16} /></button>
                    <button className="w-9 h-9 rounded-full bg-transparent text-[#8B95A5] hover:text-white flex items-center justify-center ml-2"><HelpCircle size={18} /></button>
                  </div>
                </div>

                <div className="space-y-5">
                  {(!profile.portfolioItems || profile.portfolioItems.filter(p => !p.featured).length === 0) ? (
                    <>
                      <div className="bg-[#181D2A] rounded-[1.5rem] p-5 flex flex-col sm:flex-row gap-6 cursor-pointer hover:bg-[#1A202F] transition">
                        <div className="flex gap-2 w-full sm:w-[260px] h-[130px]">
                          <img src="https://images.unsplash.com/photo-1550745165-9bc0b252726f" className="w-1/3 h-full object-cover rounded-[0.8rem]" />
                          <img src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04" className="w-1/3 h-full object-cover rounded-[0.8rem]" />
                          <div className="w-1/3 h-full bg-[#0B0F19] rounded-[0.8rem] flex items-center justify-center relative overflow-hidden">
                            <img src="https://images.unsplash.com/photo-1511379938547-c1f69419868d" className="absolute inset-0 w-full h-full object-cover opacity-40" />
                            <span className="text-white font-bold z-10">+4</span>
                          </div>
                        </div>
                        <div className="flex-1 flex flex-col justify-center py-2">
                          <h4 className="text-[17px] font-bold text-white mb-2">Cyberpunk Game Audio Assets</h4>
                          <p className="text-sm text-[#8B95A5] leading-relaxed mb-4 line-clamp-2 font-medium">Complete UI and environmental sound package for an upcoming indie RPG.</p>
                          <div className="flex items-center gap-5 text-[#8B95A5] text-xs font-bold">
                            <span className="flex items-center gap-1.5"><Heart size={14} /> 124</span>
                            <span className="flex items-center gap-1.5"><MessageCircle size={14} /> 12</span>
                            <span className="ml-auto">Game Audio</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-[#181D2A] rounded-[1.5rem] p-5 flex flex-col sm:flex-row gap-6 cursor-pointer hover:bg-[#1A202F] transition">
                        <div className="w-full sm:w-[260px] h-[130px]">
                          <img src="https://images.unsplash.com/photo-1614680376593-902f74cf0d41" className="w-full h-full object-cover rounded-[0.8rem]" />
                        </div>
                        <div className="flex-1 flex flex-col justify-center py-2">
                          <h4 className="text-[17px] font-bold text-white mb-2">"Ethereal" - Short Film Score</h4>
                          <p className="text-sm text-[#8B95A5] leading-relaxed mb-4 line-clamp-2 font-medium">Orchestral arrangement mixed with heavy electronic elements.</p>
                          <div className="flex items-center gap-5 text-[#8B95A5] text-xs font-bold">
                            <span className="flex items-center gap-1.5"><Heart size={14} /> 89</span>
                            <span className="flex items-center gap-1.5"><MessageCircle size={14} /> 5</span>
                            <span className="ml-auto">Film Score</span>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    profile.portfolioItems.filter(p => !p.featured).slice(0, 2).map((item) => (
                      <div 
                        key={item.id} 
                        onClick={() => { setSelectedProject(item); setIsProjectDetailOpen(true); }}
                        className="bg-[#181D2A] rounded-[1.5rem] p-5 flex flex-col sm:flex-row gap-6 cursor-pointer hover:bg-[#1A202F] transition"
                      >
                        <div className="flex gap-2 w-full sm:w-[260px] h-[130px]">
                          <img src={item.media[0]?.url || "https://images.unsplash.com/photo-1550745165-9bc0b252726f"} className="w-1/3 h-full object-cover rounded-[0.8rem]" />
                          {item.media[1] ? <img src={item.media[1].url} className="w-1/3 h-full object-cover rounded-[0.8rem]" /> : <div className="w-1/3 h-full bg-[#0B0F19] rounded-[0.8rem]" />}
                          <div className="w-1/3 h-full bg-[#0B0F19] rounded-[0.8rem] flex items-center justify-center relative overflow-hidden">
                            {item.media[2] && <img src={item.media[2].url} className="absolute inset-0 w-full h-full object-cover opacity-40" />}
                            <span className="text-white font-bold z-10">+{(item.media?.length > 2 ? item.media.length - 2 : 0) || 4}</span>
                          </div>
                        </div>
                        <div className="flex-1 flex flex-col justify-center py-2">
                          <h4 className="text-[17px] font-bold text-white mb-2">{item.title}</h4>
                          <p className="text-sm text-[#8B95A5] leading-relaxed mb-4 line-clamp-2 font-medium">{item.description}</p>
                          <div className="flex items-center gap-5 text-[#8B95A5] text-xs font-bold">
                            <span className="flex items-center gap-1.5"><Heart size={14} /> {item.viewCount || 124}</span>
                            <span className="flex items-center gap-1.5"><MessageCircle size={14} /> 12</span>
                            <span className="ml-auto">{item.category || 'Game Audio'}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right Sidebar (3 cols) */}
        <aside className="col-span-1 xl:col-span-3 space-y-6">
          <div className="bg-[#181D2A] rounded-[1.5rem] p-6 relative overflow-hidden border border-transparent">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#00D4FF]/10 blur-3xl rounded-full" />
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-4 rounded-full bg-[#00D4FF]" />
              <h4 className="text-sm font-bold text-white">Open for Collaboration</h4>
            </div>
            <p className="text-[13px] text-[#8B95A5] leading-relaxed font-medium mt-2">
              Currently accepting new projects for Q3. Special rates for indie game devs.
            </p>
          </div>

          <div>
            <h4 className="text-[12px] font-bold text-white flex items-center gap-2.5 mb-5"><LinkIcon size={14} className="text-[#7B5CFA]" /> Mutual Connections</h4>
            <div className="space-y-4">
              <div className="flex items-center gap-3.5">
                <img src="https://ui-avatars.com/api/?name=Sarah+Jenkins&background=181D2A&color=fff" className="w-11 h-11 rounded-full border border-white/5 object-cover" />
                <div>
                  <p className="text-[13px] font-bold text-white">Sarah Jenkins</p>
                  <p className="text-[11px] text-[#8B95A5] font-medium">3D Animator</p>
                </div>
              </div>
              <div className="flex items-center gap-3.5">
                <img src="https://ui-avatars.com/api/?name=David+Kim&background=181D2A&color=fff" className="w-11 h-11 rounded-full border border-white/5 object-cover" />
                <div>
                  <p className="text-[13px] font-bold text-white">David Kim</p>
                  <p className="text-[11px] text-[#8B95A5] font-medium">UI/UX Designer</p>
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
