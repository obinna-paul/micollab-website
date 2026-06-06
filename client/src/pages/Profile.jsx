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
  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.displayName || profile.username)}&background=181D2A&color=fff&size=200`;

  return (
    <div className="pb-20">

      {/* ============ TOP ROW: Cover (left+mid) | Right sidebar (start) ============ */}
      <div className="flex gap-7">

        {/* Cover image area — takes all space except the right sidebar */}
        <div className="flex-1 min-w-0">
          <div className="h-[240px] lg:h-[280px] w-full rounded-t-[1.5rem] overflow-hidden relative group">
            {profile.coverImage ? (
              <img src={profile.coverImage} alt="Cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#7B2FF2] via-[#B23AEE] to-[#E94057]"></div>
            )}
            {isOwner && (
              <button onClick={() => setCoverMenuOpen(true)} className="absolute top-5 right-5 bg-black/40 backdrop-blur-md text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-black/60 transition border border-white/10 z-10">
                Change Cover
              </button>
            )}
          </div>
        </div>

        {/* Right sidebar — fixed width, starts at top next to cover */}
        <aside className="hidden xl:block w-[240px] flex-shrink-0 space-y-6 pt-0">
          {/* Open for Collaboration */}
          <div className="bg-[#181D2A] rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-[#00D4FF]/8 blur-3xl rounded-full" />
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-2 h-2 rounded-full bg-[#FF8A00] animate-pulse" />
              <h4 className="text-[13px] font-bold text-white">Open for Collaboration</h4>
            </div>
            <p className="text-[12px] text-[#8B95A5] leading-relaxed">
              Currently accepting new projects for Q3. Special rates for indie game devs.
            </p>
          </div>

          {/* Mutual Connections */}
          <div>
            <h4 className="text-[12px] font-bold text-white flex items-center gap-2 mb-4">
              <LinkIcon size={14} className="text-[#7B5CFA]" /> Mutual Connections
            </h4>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img src={`https://ui-avatars.com/api/?name=Sarah+Jenkins&background=181D2A&color=fff`} className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <p className="text-[13px] font-bold text-white">Sarah Jenkins</p>
                  <p className="text-[11px] text-[#8B95A5]">3D Animator</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <img src={`https://ui-avatars.com/api/?name=David+Kim&background=181D2A&color=fff`} className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <p className="text-[13px] font-bold text-white">David Kim</p>
                  <p className="text-[11px] text-[#8B95A5]">UI/UX Designer</p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* ============ AVATAR + NAME ROW ============ */}
      <div className="flex gap-7">
        <div className="flex-1 min-w-0">
          <div className="flex items-end gap-5 px-4 lg:px-6 -mt-[60px] relative z-10 mb-6">
            {/* Avatar */}
            <div className="relative group flex-shrink-0">
              <div className="w-[120px] h-[120px] lg:w-[130px] lg:h-[130px] rounded-2xl border-[5px] border-[#0F131E] shadow-2xl overflow-hidden bg-[#181D2A]">
                <img src={profile.profileImage || fallbackAvatar} className="w-full h-full object-cover" alt="Avatar" />
                {isOwner && (
                  <div onClick={() => setAvatarMenuOpen(true)} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition cursor-pointer rounded-2xl">
                    <Camera size={20} className="text-white" />
                  </div>
                )}
              </div>
              {profile.isVerified === 'YES' && (
                <div className="absolute -bottom-1 -right-1 bg-[#00D4FF] text-[#0B0F19] p-1 rounded-full border-[3px] border-[#0F131E] z-20">
                  <CheckCircle size={14} fill="currentColor" strokeWidth={2} />
                </div>
              )}
            </div>

            {/* Name + buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-1 pb-1">
              <div>
                <h1 className="text-[28px] lg:text-[32px] font-black text-white tracking-tight leading-none mb-1">{profile.displayName || profile.username}</h1>
                <div className="flex items-center gap-2">
                  <Headphones size={15} className="text-[#00D4FF]" />
                  <span className="text-[#00D4FF] font-bold text-[13px]">{profile.profileType || 'Sound Designer & Producer'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {isOwner ? (
                  <button onClick={() => setIsEditModalOpen(true)} className="px-5 py-2.5 bg-[#181D2A] border border-white/10 text-white font-bold text-sm rounded-xl hover:bg-white/5 transition">
                    Edit Profile
                  </button>
                ) : (
                  <>
                    <button className="px-5 py-2.5 bg-[#181D2A] border border-white/10 text-white font-bold text-sm rounded-xl hover:bg-white/5 transition flex items-center gap-2">
                      <Mail size={15} /> Message
                    </button>
                    <button className="px-6 py-2.5 bg-[#7B5CFA] text-white font-bold text-sm rounded-xl hover:bg-[#684CE0] transition shadow-[0_0_15px_rgba(123,92,250,0.3)] flex items-center gap-2">
                      <Plus size={15} strokeWidth={3} /> Follow
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Spacer to keep right sidebar alignment */}
        <div className="hidden xl:block w-[240px] flex-shrink-0"></div>
      </div>

      {/* ============ BOTTOM ROW: Left info | Middle content | Right sidebar continues ============ */}
      <div className="flex gap-7">

        {/* LEFT INFO COLUMN — fixed width */}
        <aside className="hidden lg:block w-[240px] flex-shrink-0 space-y-5">

          {/* YOUR TAGS + Bio + Stats */}
          <div className="bg-[#181D2A] rounded-2xl p-5">
            <h4 className="text-[10px] font-black text-[#8B95A5] uppercase tracking-widest mb-4">YOUR TAGS</h4>
            <div className="flex flex-wrap gap-2 mb-5">
              {(profile.skills ? profile.skills.split(',') : ['MusicProduction', 'EDM', 'Ableton', 'SoundDesign']).map(skill => (
                <span key={skill} className="px-2.5 py-1 bg-[#252C3A] rounded text-[11px] font-bold text-[#8B95A5] hover:text-white transition cursor-pointer">
                  #{skill.trim().replace(/\s+/g, '')}
                </span>
              ))}
            </div>
            
            <p className="text-[12px] text-[#8B95A5] leading-relaxed mb-6">
              {profile.bio || "Crafting immersive auditory experiences for games, films, and interactive media. Obsessed with granular synthesis and analog warmth. Currently open for freelance collaborations."}
            </p>
            
            <div className="flex justify-between items-center pt-4 border-t border-white/5">
              <div className="text-center">
                <p className="text-lg font-black text-white">{profile.portfolioItems?.length || 42}</p>
                <p className="text-[8px] text-[#8B95A5] font-black uppercase tracking-widest mt-0.5">PROJECTS</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-black text-white">12.5k</p>
                <p className="text-[8px] text-[#8B95A5] font-black uppercase tracking-widest mt-0.5">FOLLOWERS</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-black text-white">18</p>
                <p className="text-[8px] text-[#8B95A5] font-black uppercase tracking-widest mt-0.5">COLLABS</p>
              </div>
            </div>
          </div>

          {/* SPECIALIZATIONS */}
          <div className="bg-[#181D2A] rounded-2xl p-5">
            <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-4">SPECIALIZATIONS</h4>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1.5 bg-[#7B5CFA]/10 text-[#7B5CFA] rounded-lg text-[11px] font-bold">Sound Design</span>
              <span className="px-3 py-1.5 bg-[#00D4FF]/10 text-[#00D4FF] rounded-lg text-[11px] font-bold">Foley</span>
              <span className="px-3 py-1.5 bg-[#FF2E93]/10 text-[#FF2E93] rounded-lg text-[11px] font-bold">Mixing & Mastering</span>
              <span className="px-3 py-1.5 bg-[#FF8A00]/10 text-[#FF8A00] rounded-lg text-[11px] font-bold">Game Audio</span>
              <span className="px-3 py-1.5 bg-[#252C3A] text-[#8B95A5] rounded-lg text-[11px] font-bold">Ableton Live</span>
              <span className="px-3 py-1.5 bg-[#252C3A] text-[#8B95A5] rounded-lg text-[11px] font-bold">Wwise</span>
            </div>
          </div>

          {/* TOP ENDORSEMENTS */}
          <div className="bg-[#181D2A] rounded-2xl p-5">
            <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-5">TOP ENDORSEMENTS</h4>
            <div className="space-y-6">
              <div className="flex gap-3">
                <img src={`https://ui-avatars.com/api/?name=Elena+Rostova&background=252C3A&color=fff`} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[13px] font-bold text-white">Elena Rostova</p>
                    <span className="text-[8px] bg-[#00D4FF]/10 text-[#00D4FF] px-1.5 py-0.5 rounded font-bold">Collab Partner</span>
                  </div>
                  <p className="text-[11px] text-[#8B95A5] leading-relaxed">"Alex brought our sci-fi short to life. The attention to detail in the ambient soundscapes was mind-blowing."</p>
                </div>
              </div>
              <div className="flex gap-3">
                <img src={`https://ui-avatars.com/api/?name=Marcus+Chen&background=252C3A&color=fff`} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[13px] font-bold text-white">Marcus Chen</p>
                    <span className="text-[8px] bg-[#FF2E93]/10 text-[#FF2E93] px-1.5 py-0.5 rounded font-bold">Director</span>
                  </div>
                  <p className="text-[11px] text-[#8B95A5] leading-relaxed">"Incredible turnaround time and perfectly nailed the cyberpunk aesthetic we needed."</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* MIDDLE CONTENT COLUMN — flexible width */}
        <div className="flex-1 min-w-0 space-y-8">

          {/* Pinned Deck */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Pin size={16} className="text-[#FF8A00]" fill="currentColor" /> Pinned Deck
              </h3>
              <button className="text-xs text-[#8B95A5] hover:text-white font-bold transition">View All</button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(!profile.portfolioItems || profile.portfolioItems.filter(p => p.featured).length === 0) ? (
                 <>
                   <div className="group relative h-[200px] bg-[#181D2A] rounded-2xl overflow-hidden cursor-pointer">
                     <img src="https://images.unsplash.com/photo-1511379938547-c1f69419868d" className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-700" />
                     <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-[#0B0F19]/30 to-transparent p-5 flex flex-col justify-end">
                       <span className="px-2 py-0.5 bg-[#7B5CFA] text-white text-[9px] font-black uppercase tracking-wider rounded w-max mb-2">FEATURED PROJECT</span>
                       <h4 className="text-lg font-black text-white leading-tight mb-1">Neon Shadows OST</h4>
                       <p className="text-[#8B95A5] text-xs line-clamp-1">Full original score and sound design...</p>
                     </div>
                   </div>
                   <div className="group relative h-[200px] bg-[#181D2A] rounded-2xl overflow-hidden cursor-pointer">
                     <img src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04" className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-700" />
                     <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-[#0B0F19]/30 to-transparent p-5 flex flex-col justify-end">
                       <h4 className="text-lg font-black text-white leading-tight mb-1">Analog Synth Pack Vol 1</h4>
                       <p className="text-[#8B95A5] text-xs line-clamp-1">100+ royalty-free patches for Serum...</p>
                     </div>
                   </div>
                 </>
              ) : (
                profile.portfolioItems.filter(p => p.featured).slice(0, 2).map((project) => (
                  <div 
                    key={project.id}
                    onClick={() => { setSelectedProject(project); setIsProjectDetailOpen(true); }}
                    className="group relative h-[200px] bg-[#181D2A] rounded-2xl overflow-hidden cursor-pointer"
                  >
                    <img src={project.media[0]?.url || "https://images.unsplash.com/photo-1511379938547-c1f69419868d"} className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-[#0B0F19]/30 to-transparent p-5 flex flex-col justify-end">
                      <span className="px-2 py-0.5 bg-[#7B5CFA] text-white text-[9px] font-black uppercase tracking-wider rounded w-max mb-2">FEATURED PROJECT</span>
                      <h4 className="text-lg font-black text-white leading-tight mb-1">{project.title}</h4>
                      <p className="text-[#8B95A5] text-xs line-clamp-1">{project.description}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Portfolio */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Layers size={16} className="text-[#7B5CFA]" /> Portfolio
              </h3>
              <div className="flex items-center gap-2">
                <button className="w-8 h-8 rounded-lg bg-[#252C3A] text-white flex items-center justify-center"><List size={15} /></button>
                <button className="w-8 h-8 rounded-lg text-[#8B95A5] hover:text-white flex items-center justify-center"><Grid size={15} /></button>
              </div>
            </div>

            <div className="space-y-4">
              {(!profile.portfolioItems || profile.portfolioItems.filter(p => !p.featured).length === 0) ? (
                <>
                  <div className="bg-[#181D2A] rounded-2xl p-4 flex flex-col sm:flex-row gap-5 cursor-pointer hover:bg-[#1A202F] transition">
                    <div className="flex gap-1.5 w-full sm:w-[220px] h-[120px] flex-shrink-0">
                      <img src="https://images.unsplash.com/photo-1550745165-9bc0b252726f" className="w-1/3 h-full object-cover rounded-xl" />
                      <img src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04" className="w-1/3 h-full object-cover rounded-xl" />
                      <div className="w-1/3 h-full bg-[#0B0F19] rounded-xl flex items-center justify-center relative overflow-hidden">
                        <img src="https://images.unsplash.com/photo-1511379938547-c1f69419868d" className="absolute inset-0 w-full h-full object-cover opacity-30" />
                        <span className="text-white font-bold text-sm z-10">+4</span>
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <h4 className="text-[16px] font-bold text-white mb-1.5">Cyberpunk Game Audio Assets</h4>
                      <p className="text-[13px] text-[#8B95A5] leading-relaxed mb-3 line-clamp-2">Complete UI and environmental sound package for an upcoming indie RPG.</p>
                      <div className="flex items-center gap-5 text-[#8B95A5] text-xs">
                        <span className="flex items-center gap-1.5"><Heart size={13} /> 124</span>
                        <span className="flex items-center gap-1.5"><MessageCircle size={13} /> 12</span>
                        <span className="ml-auto text-[#8B95A5]">Game Audio</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#181D2A] rounded-2xl p-4 flex flex-col sm:flex-row gap-5 cursor-pointer hover:bg-[#1A202F] transition">
                    <div className="w-full sm:w-[220px] h-[120px] flex-shrink-0">
                      <img src="https://images.unsplash.com/photo-1614680376593-902f74cf0d41" className="w-full h-full object-cover rounded-xl" />
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <h4 className="text-[16px] font-bold text-white mb-1.5">"Ethereal" - Short Film Score</h4>
                      <p className="text-[13px] text-[#8B95A5] leading-relaxed mb-3 line-clamp-2">Orchestral arrangement mixed with heavy electronic elements.</p>
                      <div className="flex items-center gap-5 text-[#8B95A5] text-xs">
                        <span className="flex items-center gap-1.5"><Heart size={13} /> 89</span>
                        <span className="flex items-center gap-1.5"><MessageCircle size={13} /> 5</span>
                        <span className="ml-auto text-[#8B95A5]">Film Score</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                profile.portfolioItems.filter(p => !p.featured).slice(0, 4).map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => { setSelectedProject(item); setIsProjectDetailOpen(true); }}
                    className="bg-[#181D2A] rounded-2xl p-4 flex flex-col sm:flex-row gap-5 cursor-pointer hover:bg-[#1A202F] transition"
                  >
                    <div className="flex gap-1.5 w-full sm:w-[220px] h-[120px] flex-shrink-0">
                      <img src={item.media[0]?.url || "https://images.unsplash.com/photo-1550745165-9bc0b252726f"} className="w-1/3 h-full object-cover rounded-xl" />
                      {item.media[1] ? <img src={item.media[1].url} className="w-1/3 h-full object-cover rounded-xl" /> : <div className="w-1/3 h-full bg-[#0B0F19] rounded-xl" />}
                      <div className="w-1/3 h-full bg-[#0B0F19] rounded-xl flex items-center justify-center relative overflow-hidden">
                        {item.media[2] && <img src={item.media[2].url} className="absolute inset-0 w-full h-full object-cover opacity-30" />}
                        <span className="text-white font-bold text-sm z-10">+{(item.media?.length > 2 ? item.media.length - 2 : 0) || 4}</span>
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <h4 className="text-[16px] font-bold text-white mb-1.5">{item.title}</h4>
                      <p className="text-[13px] text-[#8B95A5] leading-relaxed mb-3 line-clamp-2">{item.description}</p>
                      <div className="flex items-center gap-5 text-[#8B95A5] text-xs">
                        <span className="flex items-center gap-1.5"><Heart size={13} /> {item.viewCount || 124}</span>
                        <span className="flex items-center gap-1.5"><MessageCircle size={13} /> 12</span>
                        <span className="ml-auto text-[#8B95A5]">{item.category || 'Game Audio'}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR COLUMN — continues from the top row */}
        <div className="hidden xl:block w-[240px] flex-shrink-0">
          {/* This column is intentionally empty here; its content is rendered in the top row 
              and visually continues down due to the sticky behavior and consistent column width */}
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
