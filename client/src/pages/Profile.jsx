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
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import useChatStore from '../store/useChatStore';
import EditProfileModal from '../components/EditProfileModal';
import PhotoActionModal from '../components/PhotoActionModal';
import PhotoViewerModal from '../components/PhotoViewerModal';
import AddPortfolioModal from '../components/AddPortfolioModal';
import ProjectDetailsModal from '../components/ProjectDetailsModal';

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, token, updateProfile: updateAuthProfile } = useAuthStore();
  const { startConversation, socket } = useChatStore();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connectStatus, setConnectStatus] = useState(null);
  
  // Modals State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEndorseModalOpen, setIsEndorseModalOpen] = useState(false);
  const [endorsementText, setEndorsementText] = useState('');
  const [isEndorsing, setIsEndorsing] = useState(false);
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
      if (token && currentUser?.id !== res.data.id) {
        const statusRes = await axios.get(`/api/network/status/${res.data.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setConnectStatus(statusRes.data.status); // CONNECTED, REQUESTED, RECEIVED_REQUEST, NONE
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [username]);

  useEffect(() => {
    if (!socket || !profile) return;

    const handleNotification = (notification) => {
      // If someone accepts our connection request, they trigger this
      if (
        notification.type === 'CONNECTION' &&
        notification.content === 'Connection Accepted' &&
        notification.triggeredBy?.id === profile.id
      ) {
        setConnectStatus('CONNECTED');
      }
    };

    socket.on('new_notification', handleNotification);

    return () => {
      socket.off('new_notification', handleNotification);
    };
  }, [socket, profile]);

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

  const handleConnect = async () => {
    try {
      setConnectStatus('loading');
      const res = await axios.post('/api/network/connect', { receiverId: profile.id }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.status === 'CONNECTED') {
        setConnectStatus('CONNECTED');
      } else {
        setConnectStatus('REQUESTED');
      }
    } catch (err) {
      console.error(err);
      if (err.response?.data?.error === 'Connection request already exists' || err.response?.data?.error === 'Already connected') {
        setConnectStatus(err.response?.data?.error === 'Already connected' ? 'CONNECTED' : 'REQUESTED');
      } else {
        setConnectStatus('ERROR: ' + (err.response?.data?.error || err.message));
      }
    }
  };

  const handleUnfollow = async () => {
    if (window.confirm("Unfollow this user?")) {
      try {
        setConnectStatus('loading');
        await axios.delete(`/api/network/connections/${profile.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setConnectStatus('NONE');
      } catch (err) {
        console.error(err);
        setConnectStatus('CONNECTED');
        alert('Failed to unfollow user');
      }
    }
  };

  const handleWriteTestimonial = () => {
    setIsEndorseModalOpen(true);
    setEndorsementText('');
  };

  const submitEndorsement = async () => {
    if (!endorsementText.trim()) return;
    setIsEndorsing(true);
    try {
      await axios.post('/api/users/testimonial', { toUserId: profile.id, content: endorsementText, rating: 5 }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsEndorseModalOpen(false);
      setEndorsementText('');
      fetchProfile();
    } catch (err) {
      console.error(err);
    } finally {
      setIsEndorsing(false);
    }
  };

  const handleMessage = async () => {
    if (!token) return navigate('/login');
    try {
      await startConversation(token, profile.id);
      navigate('/messages');
    } catch (err) {
      console.error('Failed to start chat', err);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-[#7B5CFA] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!profile) return (
    <div className="text-center py-20">
      <h2 className="text-2xl font-black text-[var(--text-primary)]">Creator not found</h2>
      <Link to="/" className="text-[#7B5CFA] hover:underline mt-2 inline-block">Return to home</Link>
    </div>
  );

  const isOwner = currentUser?.id === profile.id;
  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.displayName || profile.username)}&background=181D2A&color=fff&size=200`;

  return (
    <div className="pb-20">

      {/* ============ TOP ROW: Cover & Header Info ============ */}
      <div className="flex gap-7 mb-8">

        {/* Cover & Profile Info Area */}
        <div className="flex-1 min-w-0">
          
          {/* Cover Image */}
          <div className="h-[280px] lg:h-[320px] w-full rounded-[1.5rem] overflow-hidden relative group">
            {profile.coverImage ? (
              <img src={profile.coverImage} alt="Cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#0B0F19] via-[#1A1F2E] to-[#7B5CFA]"></div>
            )}
            
            {/* Dark gradient at bottom to make text readable */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-[#0B0F19]/40 to-transparent pointer-events-none"></div>

            {isOwner && (
              <button onClick={() => setCoverMenuOpen(true)} className="absolute top-5 right-5 bg-black/40 backdrop-blur-md text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-black/60 transition border border-white/10 z-10">
                Change Cover
              </button>
            )}

            {/* Content overlaid on cover (Name & Title) */}
            <div className="absolute bottom-6 left-0 w-full px-6 lg:px-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              
              {/* Left Side: Empty space for Avatar + Name/Title */}
              <div className="flex items-end gap-6">
                {/* Spacer for absolute Avatar */}
                <div className="w-[120px] lg:w-[140px] flex-shrink-0"></div>
                
                <div className="mb-2">
                  <h1 className="text-[32px] lg:text-[40px] font-black text-white tracking-tight leading-none mb-2 drop-shadow-lg">{profile.username}</h1>
                  <div className="flex items-center gap-2 drop-shadow-md">
                    <Headphones size={16} className="text-[#00D4FF]" />
                    <span className="text-[#00D4FF] font-bold text-[14px]">{profile.profileType || 'Creative Professional'}</span>
                  </div>
                </div>
              </div>

              {/* Right Side: Buttons on Cover */}
              <div className="flex flex-wrap items-center gap-3 mb-2 z-10">
                {isOwner ? (
                  <button onClick={() => setIsEditModalOpen(true)} className="relative z-50 pointer-events-auto px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold text-sm rounded-xl hover:bg-white/20 transition shadow-lg">
                    Edit Profile
                  </button>
                ) : (
                  <>
                    <button onClick={handleMessage} className="relative z-50 pointer-events-auto px-5 py-2.5 bg-[#1A1F2E]/80 backdrop-blur-md border border-white/10 text-white font-bold text-sm rounded-xl hover:bg-[#1A1F2E] transition flex items-center gap-2 shadow-lg">
                      <Mail size={15} /> Message
                    </button>
                    <button onClick={handleWriteTestimonial} className="relative z-50 pointer-events-auto px-5 py-2.5 bg-[#FF8A00]/10 backdrop-blur-md border border-[#FF8A00]/30 text-[#FF8A00] font-bold text-sm rounded-xl hover:bg-[#FF8A00]/20 transition flex items-center gap-2 shadow-lg">
                      <Star size={15} /> Endorse
                    </button>
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (connectStatus === 'CONNECTED') handleUnfollow();
                        else handleConnect();
                      }} 
                      disabled={connectStatus === 'loading' || connectStatus === 'REQUESTED'}
                      className={`relative z-50 pointer-events-auto px-6 py-2.5 font-bold text-sm rounded-xl transition shadow-lg flex items-center gap-2 ${
                        connectStatus === 'CONNECTED'
                          ? 'bg-transparent text-cyan-400 border border-cyan-400/30 hover:bg-cyan-400/10'
                          : connectStatus === 'REQUESTED'
                          ? 'bg-transparent text-gray-400 border border-gray-400/30'
                          : connectStatus === 'loading'
                          ? 'bg-gray-600 text-white opacity-70 cursor-not-allowed'
                          : 'bg-[#7B5CFA] text-white hover:bg-[#684CE0] shadow-[0_0_15px_rgba(123,92,250,0.3)]'
                      }`}
                    >
                      {connectStatus?.startsWith('ERROR:') ? <X size={15} /> : connectStatus === 'CONNECTED' ? <CheckCircle size={15} /> : connectStatus === 'REQUESTED' ? <CheckCircle size={15} /> : connectStatus === 'loading' ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <UserPlus size={15} strokeWidth={3} />} 
                      {connectStatus?.startsWith('ERROR:') ? connectStatus : connectStatus === 'CONNECTED' ? 'Connected' : connectStatus === 'REQUESTED' ? 'Request Sent' : connectStatus === 'loading' ? 'Sending...' : 'Connect'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Absolute Avatar positioning (overlaps cover bottom edge) */}
          <div className="relative -mt-[60px] lg:-mt-[70px] ml-6 lg:ml-8 z-20 w-max">
            <div className="w-[120px] h-[120px] lg:w-[140px] lg:h-[140px] rounded-2xl border-[6px] border-[#0B0F19] shadow-2xl overflow-hidden bg-[var(--bg-surface-alt)] relative group/avatar">
              <img src={profile.profileImage || fallbackAvatar} className="w-full h-full object-cover" alt="Avatar" />
              {isOwner && (
                <div onClick={() => setAvatarMenuOpen(true)} className="absolute inset-0 bg-black/50 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition cursor-pointer">
                  <Camera size={24} className="text-white" />
                </div>
              )}
              {profile.isVerified === 'YES' && (
                <div className="absolute -bottom-1 -right-1 bg-[#00D4FF] text-[#0B0F19] p-1 rounded-full border-[3px] border-[#0B0F19] z-20">
                  <CheckCircle size={16} fill="currentColor" strokeWidth={2} />
                </div>
              )}
            </div>
          </div>
          
        </div>

        {/* Right sidebar space */}
        <aside className="hidden xl:block w-[240px] flex-shrink-0 space-y-6 pt-0">
          {profile.availabilityStatus === 'OPEN_TO_COLLAB' && (
            <div className="bg-[var(--bg-surface-alt)] rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-[#00D4FF]/8 blur-3xl rounded-full" />
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-2 h-2 rounded-full bg-[#FF8A00] animate-pulse" />
                <h4 className="text-[13px] font-bold text-[var(--text-primary)]">Open for Collaboration</h4>
              </div>
            </div>
          )}

          <div>
            <h4 className="text-[12px] font-bold text-[var(--text-primary)] flex items-center gap-2 mb-4">
              <LinkIcon size={14} className="text-[#7B5CFA]" /> Mutual Connections
            </h4>
            {profile.mutualConnections && profile.mutualConnections.length > 0 ? (
              <div className="space-y-4">
                {profile.mutualConnections.map((conn, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Link to={`/profile/${conn.username}`}>
                      <img src={conn.profileImage || `https://ui-avatars.com/api/?name=${conn.username}&background=181D2A&color=fff`} className="w-10 h-10 rounded-full object-cover hover:opacity-80 transition" />
                    </Link>
                    <div>
                      <Link to={`/profile/${conn.username}`} className="text-[13px] font-bold text-[var(--text-primary)] hover:text-[#7B5CFA] hover:underline block">{conn.username}</Link>
                      <p className="text-[11px] text-[var(--text-secondary)]">{conn.profileType}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-[var(--bg-surface-alt)]/50 border border-dashed border-[var(--border-primary)] rounded-xl p-4 text-center">
                <p className="text-[11px] text-[var(--text-secondary)]">No mutual connections yet. Expand your network!</p>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* ============ BOTTOM ROW: Left info | Middle content | Right sidebar continues ============ */}
      <div className="flex gap-7">

        {/* LEFT INFO COLUMN — fixed width */}
        <aside className="hidden lg:block w-[240px] flex-shrink-0 space-y-5">

          {/* YOUR TAGS + Bio + Stats */}
          <div className="bg-[var(--bg-surface-alt)] rounded-2xl p-5">
            <h4 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-4">ABOUT</h4>
            {profile.displayName && (
              <p className="text-sm font-bold text-[var(--text-primary)] mb-2">{profile.displayName}</p>
            )}
            <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed mb-6">
              {profile.bio || "No bio added yet."}
            </p>

            <h4 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-4 mt-6">YOUR TAGS</h4>
            <div className="flex flex-wrap gap-2 mb-5">
              {profile.profileType && profile.profileType.split(',').map(cat => (
                <span key={cat} className="px-2.5 py-1 bg-[#252C3A] rounded text-[11px] font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer">
                  #{cat.trim().replace(/\s+/g, '')}
                </span>
              ))}
            </div>
            
            <div className="flex justify-between items-center pt-4 border-t border-[var(--border-primary)]">
              <div className="text-center">
                <p className="text-lg font-black text-[var(--text-primary)]">{profile.portfolioItems?.length || 0}</p>
                <p className="text-[8px] text-[var(--text-secondary)] font-black uppercase tracking-widest mt-0.5">PROJECTS</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-black text-[var(--text-primary)]">{profile.followersCount || 0}</p>
                <p className="text-[8px] text-[var(--text-secondary)] font-black uppercase tracking-widest mt-0.5">FOLLOWERS</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-black text-[var(--text-primary)]">{profile.collabsCount || 0}</p>
                <p className="text-[8px] text-[var(--text-secondary)] font-black uppercase tracking-widest mt-0.5">COLLABS</p>
              </div>
            </div>
          </div>

          {/* SPECIALIZATIONS */}
          <div className="bg-[var(--bg-surface-alt)] rounded-2xl p-5">
            <h4 className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-widest mb-4">SPECIALIZATIONS</h4>
            <div className="flex flex-wrap gap-2">
              {profile.skills ? profile.skills.split(',').map((spec, i) => {
                const colors = ['#7B5CFA', '#00D4FF', '#FF2E93', '#FF8A00'];
                const color = colors[i % colors.length];
                return (
                  <span key={spec} className="px-3 py-1.5 rounded-lg text-[11px] font-bold" style={{ backgroundColor: `${color}1A`, color: color }}>
                    {spec.trim()}
                  </span>
                )
              }) : (
                <p className="text-[11px] text-[var(--text-secondary)] italic">No specializations listed.</p>
              )}
            </div>
          </div>

          {/* TOP ENDORSEMENTS */}
          <div className="bg-[var(--bg-surface-alt)] rounded-2xl p-5">
            <h4 className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-widest mb-5">TOP ENDORSEMENTS</h4>
            {profile.receivedTestimonials && profile.receivedTestimonials.length > 0 ? (
              <div className="space-y-6">
                {profile.receivedTestimonials.slice(0, 2).map((test) => (
                  <div key={test.id} className="flex gap-3">
                    <Link to={`/profile/${test.fromUser?.username}`}>
                      <img src={test.fromUser?.profileImage || `https://ui-avatars.com/api/?name=${test.fromUser?.username}`} className="w-10 h-10 rounded-full object-cover flex-shrink-0 hover:opacity-80 transition" />
                    </Link>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Link to={`/profile/${test.fromUser?.username}`} className="text-[13px] font-bold text-[var(--text-primary)] hover:text-[#7B5CFA] hover:underline block">{test.fromUser?.username}</Link>
                        <span className="text-[8px] bg-[#00D4FF]/10 text-[#00D4FF] px-1.5 py-0.5 rounded font-bold">{test.rating} Stars</span>
                      </div>
                      <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">"{test.content}"</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 flex flex-col items-center justify-center border border-dashed border-[var(--border-primary)] rounded-xl bg-[var(--bg-surface-alt)]/50">
                <Star size={24} className="text-[var(--text-muted)] mb-3 opacity-50" />
                <p className="text-[11px] text-[var(--text-secondary)] text-center px-4 leading-relaxed">
                  No endorsements yet. Build your network and earn some!
                </p>
              </div>
            )}
          </div>
        </aside>

        {/* MIDDLE CONTENT COLUMN — flexible width */}
        <div className="flex-1 min-w-0 space-y-8">

          {/* Pinned Deck */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-[var(--text-primary)] flex items-center gap-2">
                <Pin size={16} className="text-[#FF8A00]" fill="currentColor" /> Pinned Deck
              </h3>
              <button className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold transition">View All</button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(!profile.portfolioItems || profile.portfolioItems.filter(p => p.featured).length === 0) ? (
                 <div className="col-span-1 sm:col-span-2 py-8 flex flex-col items-center justify-center border border-dashed border-[var(--border-primary)] rounded-2xl bg-[var(--bg-surface-alt)]/50">
                   <p className="text-[var(--text-secondary)] text-sm font-medium mb-3">No featured projects yet.</p>
                   {isOwner && (
                     <button onClick={() => setIsAddProjectOpen(true)} className="px-4 py-2 bg-[#7B5CFA] text-white rounded-lg text-xs font-bold shadow-lg shadow-[#7B5CFA]/20">
                       Pin a Project
                     </button>
                   )}
                 </div>
              ) : (
                profile.portfolioItems.filter(p => p.featured).slice(0, 2).map((project) => (
                  <div 
                    key={project.id}
                    onClick={() => { setSelectedProject(project); setIsProjectDetailOpen(true); }}
                    className="group relative h-[200px] bg-[var(--bg-surface-alt)] rounded-2xl overflow-hidden cursor-pointer"
                  >
                    <img src={project.media[0]?.url || "https://images.unsplash.com/photo-1511379938547-c1f69419868d"} className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-[#0B0F19]/30 to-transparent p-5 flex flex-col justify-end">
                      <span className="px-2 py-0.5 bg-[#7B5CFA] text-white text-[9px] font-black uppercase tracking-wider rounded w-max mb-2">FEATURED PROJECT</span>
                      <h4 className="text-lg font-black text-[var(--text-primary)] leading-tight mb-1">{project.title}</h4>
                      <p className="text-[var(--text-secondary)] text-xs line-clamp-1">{project.description}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Portfolio */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-[var(--text-primary)] flex items-center gap-2">
                <Layers size={16} className="text-[#7B5CFA]" /> Portfolio
              </h3>
              <div className="flex items-center gap-2">
                <button className="w-8 h-8 rounded-lg bg-[#252C3A] text-[var(--text-primary)] flex items-center justify-center"><List size={15} /></button>
                <button className="w-8 h-8 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center"><Grid size={15} /></button>
              </div>
            </div>

            <div className="space-y-4">
              {(!profile.portfolioItems || profile.portfolioItems.filter(p => !p.featured).length === 0) ? (
                 <div className="py-12 flex flex-col items-center justify-center border border-dashed border-[var(--border-primary)] rounded-2xl bg-[var(--bg-surface-alt)]/50">
                   <Layers size={32} className="text-[var(--text-muted)] mb-4 opacity-50" />
                   <p className="text-[var(--text-secondary)] text-sm font-medium mb-4">Portfolio is empty.</p>
                   {isOwner && (
                     <button onClick={() => setIsAddProjectOpen(true)} className="px-5 py-2.5 bg-transparent border border-[var(--border-secondary)] text-[var(--text-primary)] rounded-xl text-xs font-bold hover:bg-white/5 transition">
                       Upload First Project
                     </button>
                   )}
                 </div>
              ) : (
                profile.portfolioItems.filter(p => !p.featured).slice(0, 4).map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => { setSelectedProject(item); setIsProjectDetailOpen(true); }}
                    className="bg-[var(--bg-surface-alt)] rounded-2xl p-4 flex flex-col sm:flex-row gap-5 cursor-pointer hover:bg-[#1A202F] transition"
                  >
                    <div className="flex gap-1.5 w-full sm:w-[220px] h-[120px] flex-shrink-0">
                      <img src={item.media[0]?.url || "https://images.unsplash.com/photo-1550745165-9bc0b252726f"} className="w-1/3 h-full object-cover rounded-xl" />
                      {item.media[1] ? <img src={item.media[1].url} className="w-1/3 h-full object-cover rounded-xl" /> : <div className="w-1/3 h-full bg-[#0B0F19] rounded-xl" />}
                      <div className="w-1/3 h-full bg-[#0B0F19] rounded-xl flex items-center justify-center relative overflow-hidden">
                        {item.media[2] && <img src={item.media[2].url} className="absolute inset-0 w-full h-full object-cover opacity-30" />}
                        <span className="text-[var(--text-primary)] font-bold text-sm z-10">+{(item.media?.length > 2 ? item.media.length - 2 : 0) || 4}</span>
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <h4 className="text-[16px] font-bold text-[var(--text-primary)] mb-1.5">{item.title}</h4>
                      <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed mb-3 line-clamp-2">{item.description}</p>
                      <div className="flex items-center gap-5 text-[var(--text-secondary)] text-xs">
                        <span className="flex items-center gap-1.5"><Heart size={13} /> {item.viewCount || 124}</span>
                        <span className="flex items-center gap-1.5"><MessageCircle size={13} /> 12</span>
                        <span className="ml-auto text-[var(--text-secondary)]">{item.category || 'Game Audio'}</span>
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

      {/* Custom Endorse Modal */}
      {isEndorseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isEndorsing && setIsEndorseModalOpen(false)}></div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#131720] border border-[var(--border-primary)] rounded-2xl p-6 w-full max-w-md relative z-10 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-black text-white tracking-tight">Endorse {profile.displayName || profile.username}</h3>
              <button onClick={() => !isEndorsing && setIsEndorseModalOpen(false)} className="text-gray-400 hover:text-white transition">
                <X size={20} />
              </button>
            </div>
            
            <p className="text-sm text-gray-400 mb-4 font-medium">Write a short and meaningful endorsement for their skills and professional character.</p>
            
            <textarea
              value={endorsementText}
              onChange={(e) => setEndorsementText(e.target.value)}
              placeholder="e.g. Obinna is an incredibly talented writer who always delivers top-notch content..."
              className="w-full h-32 bg-[#0B0F19] border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 outline-none focus:border-[#7B5CFA] focus:ring-1 focus:ring-[#7B5CFA] transition resize-none mb-6"
              maxLength={300}
              disabled={isEndorsing}
            ></textarea>
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setIsEndorseModalOpen(false)} 
                disabled={isEndorsing}
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-gray-400 hover:text-white hover:bg-white/5 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={submitEndorsement}
                disabled={!endorsementText.trim() || isEndorsing}
                className="px-6 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-[#7B5CFA] to-[#00D4FF] text-white hover:opacity-90 transition shadow-[0_0_15px_rgba(123,92,250,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isEndorsing ? 'Submitting...' : 'Endorse'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'avatar')} />
      <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'cover')} />

      {uploadLoading && (
        <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-md flex items-center justify-center">
          <div className="bg-[var(--bg-surface-alt)] border border-[var(--border-secondary)] p-10 rounded-[2.5rem] shadow-2xl flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-[#7B5CFA] border-t-transparent rounded-full animate-spin"></div>
            <p className="font-black text-xs uppercase tracking-widest text-[var(--text-primary)]">Processing...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
