import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, MoreVertical, Send, Image as ImageIcon, 
  Mic, Smile, Paperclip, Info, ChevronLeft, 
  Check, CheckCheck, Clock, UserPlus, Briefcase,
  SquarePen, X, Play, Pause, CornerUpLeft, Download, Volume2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import EmojiPicker from 'emoji-picker-react';
import useAuthStore from '../store/useAuthStore';
import useChatStore from '../store/useChatStore';

const TABS = [
  { id: 'PRIMARY', label: 'Primary', count: 0 },
  { id: 'REQUESTS', label: 'Requests', count: 0 },
  { id: 'PROPOSALS', label: 'Proposals', count: 0 }
];

// Custom Voice Player Component
const VoicePlayer = ({ src }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.error);
    }
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const formatTime = (secs) => {
    if (isNaN(secs)) return '0:00';
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleSliderChange = (e) => {
    const time = parseFloat(e.target.value);
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  return (
    <div className="flex items-center gap-3 w-48 py-1.5 px-1 bg-white/5 rounded-xl border border-white/10">
      <audio ref={audioRef} src={src} preload="metadata" />
      <button 
        type="button" 
        onClick={togglePlay}
        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition flex-shrink-0"
      >
        {isPlaying ? <Pause size={14} fill="white" /> : <Play size={14} fill="white" className="ml-0.5" />}
      </button>
      <div className="flex-1 min-w-0 pr-1">
        <input 
          type="range" 
          min="0" 
          max={duration || 100} 
          value={currentTime} 
          onChange={handleSliderChange}
          className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white" 
        />
        <div className="flex justify-between text-[8px] text-white/60 mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};

const Messages = () => {
  const { user, token } = useAuthStore();
  const { 
    conversations, activeConversation, messages, loading, typingStatus,
    initSocket, fetchConversations, setActiveConversation, sendMessage, setTyping, startConversation,
    blockUser, reportUser
  } = useChatStore();

  const [activeTab, setActiveTab] = useState('PRIMARY');
  const [msgInput, setMsgInput] = useState('');
  const [showDetails, setShowDetails] = useState(true);
  const [showNewMsgModal, setShowNewMsgModal] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Image Lightbox state
  const [lightboxImg, setLightboxImg] = useState(null);
  
  // Replying context
  const [replyingTo, setReplyingTo] = useState(null);

  // Voice Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordDuration, setRecordDuration] = useState(0);
  const recordingTimer = useRef(null);
  const audioChunks = useRef([]);

  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (token) {
      initSocket(token);
      fetchConversations(token, activeTab);
    }
  }, [token, activeTab]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Image compression helper
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = document.createElement('img');
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          }, 'image/jpeg', 0.85);
        };
      };
    });
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!msgInput.trim() && !replyingTo) return;
    
    sendMessage(token, msgInput.trim(), null, null, replyingTo?.id || null);
    setMsgInput('');
    setReplyingTo(null);
    setTyping(false);
    setShowEmojiPicker(false);
  };

  const onEmojiClick = (emojiObject) => {
    setMsgInput(prev => prev + emojiObject.emoji);
  };

  const handleFileUpload = async (e) => {
    let file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    
    // Compress image if applicable
    if (file.type.startsWith('image/')) {
      try {
        file = await compressImage(file);
      } catch (err) {
        console.warn('Compression failed, uploading original', err);
      }
    }

    const formData = new FormData();
    formData.append('media', file);

    try {
      const res = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      const mediaUrl = res.data.urls[0];
      const mediaType = file.type.startsWith('video') ? 'video' : 'image';
      
      await sendMessage(token, msgInput.trim() || '', mediaUrl, mediaType, replyingTo?.id || null);
      setMsgInput('');
      setReplyingTo(null);
    } catch (err) {
      console.error('Upload failed', err);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Voice note actions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunks.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunks.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice_note_${Date.now()}.webm`, {
          type: 'audio/webm'
        });
        
        setUploading(true);
        const formData = new FormData();
        formData.append('media', audioFile);

        try {
          const res = await axios.post('/api/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${token}`
            }
          });
          const mediaUrl = res.data.urls[0];
          await sendMessage(token, '', mediaUrl, 'voice', replyingTo?.id || null);
          setReplyingTo(null);
        } catch (err) {
          console.error('Failed to send voice note', err);
          alert('Failed to send voice note');
        } finally {
          setUploading(false);
        }

        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordDuration(0);
      recordingTimer.current = setInterval(() => {
        setRecordDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to access microphone', err);
      alert('Microphone access denied or not supported.');
    }
  };

  const stopRecording = (cancel = false) => {
    if (!mediaRecorder) return;
    clearInterval(recordingTimer.current);
    setIsRecording(false);
    if (cancel) {
      mediaRecorder.onstop = () => {
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
      };
    }
    mediaRecorder.stop();
    setMediaRecorder(null);
  };

  const formatRecordDuration = (secs) => {
    const minutes = Math.floor(secs / 60);
    const seconds = secs % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const searchUsers = async (q) => {
    setUserSearch(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await axios.get(`/api/network/discover?search=${q}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSearchResults(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const handleStartChat = async (targetId) => {
    const conv = await startConversation(token, targetId);
    if (conv) {
      setShowNewMsgModal(false);
      setUserSearch('');
      setSearchResults([]);
    }
  };

  const handleBlock = async () => {
    const partner = getPartner(activeConversation);
    if (!partner) return;
    if (window.confirm(`Are you sure you want to block ${partner.username}? You will no longer receive messages from them.`)) {
      const success = await blockUser(token, partner.userId);
      if (success) {
        alert(`${partner.username} has been blocked.`);
      } else {
        alert('Failed to block user.');
      }
    }
  };

  const handleReport = async () => {
    const partner = getPartner(activeConversation);
    if (!partner) return;
    const reason = window.prompt(`Why are you reporting ${partner.username}?`);
    if (reason && reason.trim()) {
      const success = await reportUser(token, partner.userId, reason.trim());
      if (success) {
        alert(`${partner.username} has been reported to moderation.`);
      } else {
        alert('Failed to submit report.');
      }
    }
  };

  const getPartner = (conversation) => {
    return conversation?.participants?.find(p => p.userId !== user?.id)?.user;
  };

  const partner = getPartner(activeConversation);
  const isPartnerTyping = activeConversation && partner && typingStatus[activeConversation.id]?.[partner.username];

  return (
    <div className="flex h-[calc(100dvh-145px)] md:h-[calc(100vh-140px)] bg-[var(--bg-surface-alt)] md:rounded-[2rem] border border-[var(--border-primary)] overflow-hidden shadow-2xl -mx-4 -mt-8 md:mx-0 md:mt-0 font-medium">
      
      {/* Left Sidebar: Conversation List */}
      <div className={`w-full md:w-80 flex-shrink-0 border-r border-[var(--border-primary)] flex flex-col ${activeConversation ? 'hidden md:flex' : 'flex'} bg-[var(--bg-surface-alt)]`}>
        <div className="p-6 border-b border-[var(--border-primary)]">
          <div className="flex items-center justify-between mb-4">
             <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">Direct</h1>
             <button 
               onClick={() => setShowNewMsgModal(true)}
               className="p-3 bg-[#7B5CFA]/10 text-[#7B5CFA] rounded-2xl hover:bg-[#7B5CFA]/20 transition-all shadow-sm"
               title="New Message"
             >
                <SquarePen size={18} />
             </button>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
            <input 
              placeholder="Search chats..."
              className="w-full bg-[var(--bg-sunken)] border border-[var(--border-primary)] rounded-xl py-2.5 pl-11 pr-4 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[#7B5CFA]/40 transition"
            />
          </div>
        </div>

        {/* Inbox Tabs */}
        <div className="flex border-b border-[var(--border-primary)]">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all relative ${
                activeTab === tab.id ? 'text-[#7B5CFA]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7B5CFA]" />
              )}
            </button>
          ))}
        </div>

        {/* Conv List */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {loading && conversations.length === 0 ? (
             <div className="p-8 text-center text-[var(--text-secondary)] text-xs font-bold">Connecting...</div>
          ) : conversations.length === 0 ? (
             <div className="p-10 text-center text-[var(--text-secondary)]">
                <p className="text-sm font-bold">No chats yet.</p>
                <p className="text-[10px] mt-1 text-[var(--text-muted)]">Find creators and start communicating!</p>
             </div>
          ) : (
            conversations.map(conv => {
              const convPartner = getPartner(conv);
              const lastMsg = conv.messages[0];
              const isActive = activeConversation?.id === conv.id;

              return (
                <button
                  key={conv.id}
                  onClick={() => setActiveConversation(token, conv)}
                  className={`w-full p-4 flex items-start gap-4 hover:bg-[var(--bg-sunken)]/60 transition-all text-left border-b border-[var(--border-primary)]/50 ${
                    isActive ? 'bg-[var(--bg-sunken)]/80 border-l-4 border-l-[#7B5CFA]' : ''
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <img 
                      src={convPartner?.profileImage || 'https://via.placeholder.com/150'} 
                      alt={convPartner?.username} 
                      className="w-12 h-12 rounded-2xl object-cover border border-[var(--border-primary)] shadow-sm"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-bold text-[var(--text-primary)] truncate">{convPartner?.username}</span>
                      <span className="text-[9px] text-[var(--text-muted)] font-bold">
                        {lastMsg ? new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] truncate leading-normal">
                      {lastMsg ? lastMsg.content || (lastMsg.mediaUrl ? '[Media File]' : '') : 'Tap to start chat'}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
 
      {/* Center Chat Window */}
      <div className={`flex-1 flex flex-col min-w-0 bg-[var(--bg-sunken)]/40 ${!activeConversation ? 'hidden md:flex' : 'flex'}`}>
        {activeConversation ? (
          <>
            {/* Header */}
            <div className="h-20 px-6 border-b border-[var(--border-primary)] flex items-center justify-between bg-[var(--bg-surface-alt)]/65 backdrop-blur-xl sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <button onClick={() => setActiveConversation(null)} className="md:hidden text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                  <ChevronLeft size={24} />
                </button>
                <div className="flex items-center gap-3">
                  <img 
                    src={partner?.profileImage || 'https://via.placeholder.com/150'} 
                    className="w-10 h-10 rounded-2xl object-cover border border-[var(--border-primary)]"
                    alt={partner?.username}
                  />
                  <div>
                    <h2 className="text-sm font-black text-[var(--text-primary)] leading-tight">{partner?.username}</h2>
                    <p className="text-[9px] text-green-400 font-bold uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" /> Active now
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-[var(--text-secondary)]">
                <button onClick={() => setShowDetails(!showDetails)} className="hover:text-[#7B5CFA] transition p-2 hover:bg-[var(--bg-sunken)] rounded-xl">
                  <Info size={20} />
                </button>
                <button className="hover:text-[#7B5CFA] transition p-2 hover:bg-[var(--bg-sunken)] rounded-xl">
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>

            {/* Proposal Context */}
            {activeConversation.type === 'PROPOSAL' && activeConversation.proposalThread && (
              <div className="p-4 bg-[#7B5CFA]/5 border-b border-[var(--border-primary)] flex items-center justify-between mx-6 my-4 rounded-[1.5rem]">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] rounded-xl flex items-center justify-center text-[#7B5CFA] shadow-sm">
                       <Briefcase size={18} />
                    </div>
                    <div>
                       <p className="text-[9px] font-black text-[#7B5CFA] uppercase tracking-wider">Project Proposal context</p>
                       <p className="text-xs font-bold text-[var(--text-primary)]">{activeConversation.proposalThread.gig.title}</p>
                    </div>
                 </div>
                 <span className="text-[9px] font-black uppercase bg-[var(--bg-surface-alt)] px-3 py-1.5 rounded-full shadow-sm text-[var(--text-secondary)] border border-[var(--border-primary)]">
                    {activeConversation.proposalThread.status}
                 </span>
              </div>
            )}

            {/* Messages Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar"
            >
              {messages.map((msg) => {
                const isMine = msg.senderId === user.id;
                
                return (
                  <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} group items-end gap-2`}>
                    
                    {/* Reply Action button on hover */}
                    {isMine && (
                      <button 
                        onClick={() => setReplyingTo(msg)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-[var(--text-muted)] hover:text-[#7B5CFA] rounded-xl hover:bg-[var(--bg-sunken)]"
                        title="Reply to message"
                      >
                        <CornerUpLeft size={14} />
                      </button>
                    )}

                    <div className={`max-w-[70%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                      
                      <div className={`relative px-4 py-3 rounded-[1.5rem] text-sm leading-relaxed shadow-sm transition-all ${
                        isMine 
                          ? 'bg-gradient-to-tr from-[#7B5CFA] to-[#6A4CE0] text-white rounded-tr-none shadow-[#7B5CFA]/10' 
                          : 'bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] text-[var(--text-primary)] rounded-tl-none'
                      }`}>
                        
                        {/* Nested Reply Reference Bubble */}
                        {msg.replyTo && (
                          <div className={`p-2.5 rounded-xl text-xs mb-2.5 border-l-2 opacity-90 truncate max-w-full ${
                            isMine
                              ? 'bg-white/10 border-[#a78bfa] text-white/90'
                              : 'bg-[var(--bg-sunken)] border-[var(--text-muted)] text-[var(--text-secondary)]'
                          }`}>
                            <p className="font-black text-[8px] uppercase tracking-wider mb-0.5">
                              {msg.replyTo.sender?.username || 'User'}
                            </p>
                            <p className="truncate text-[10px]">
                              {msg.replyTo.content || (msg.replyTo.mediaUrl ? '[Attachment]' : '')}
                            </p>
                          </div>
                        )}

                        {/* Rendering Media Image */}
                        {msg.mediaUrl && msg.mediaType === 'image' && (
                           <div 
                             onClick={() => setLightboxImg(msg.mediaUrl)}
                             className="cursor-zoom-in relative rounded-xl overflow-hidden mb-2 border border-white/5 group-hover:brightness-95 transition-all max-w-[260px] aspect-auto shadow-md"
                           >
                             <img src={msg.mediaUrl} alt="attachment" className="max-h-[220px] object-cover rounded-xl" />
                           </div>
                        )}

                        {/* Rendering Media Video */}
                        {msg.mediaUrl && msg.mediaType === 'video' && (
                           <div className="rounded-xl overflow-hidden mb-2 max-w-[260px] border border-white/5 shadow-md">
                             <video src={msg.mediaUrl} controls className="w-full object-cover max-h-[200px]" />
                           </div>
                        )}

                        {/* Rendering Voice Note */}
                        {msg.mediaUrl && msg.mediaType === 'voice' && (
                          <div className="mb-2">
                            <VoicePlayer src={msg.mediaUrl} />
                          </div>
                        )}

                        {/* Text Content */}
                        {msg.content && <p className="whitespace-pre-wrap font-medium">{msg.content}</p>}
                      </div>
                      
                      {/* Meta timestamp & read ticks */}
                      <div className="flex items-center gap-1 mt-1 px-1">
                        <span className="text-[8px] text-[var(--text-muted)] font-black uppercase tracking-wider">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        
                        {isMine && (
                          <span className="flex items-center">
                            {msg.isRead ? (
                              <CheckCheck size={11} className="text-[#00D4FF]" strokeWidth={2.5} />
                            ) : msg.isDelivered ? (
                              <CheckCheck size={11} className="text-[var(--text-muted)]" strokeWidth={2.5} />
                            ) : (
                              <Check size={11} className="text-[var(--text-muted)]" strokeWidth={2.5} />
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    {!isMine && (
                      <button 
                        onClick={() => setReplyingTo(msg)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-[var(--text-muted)] hover:text-[#7B5CFA] rounded-xl hover:bg-[var(--bg-sunken)]"
                        title="Reply to message"
                      >
                        <CornerUpLeft size={14} />
                      </button>
                    )}

                  </div>
                );
              })}

              {/* Real-time typing indicators */}
              {isPartnerTyping && (
                <div className="flex justify-start items-center gap-3 mt-4">
                  <img src={partner?.profileImage || 'https://via.placeholder.com/150'} className="w-8 h-8 rounded-2xl object-cover border border-[var(--border-primary)]" alt={partner?.username} />
                  <div className="bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1 shadow-sm">
                    <span className="w-1.5 h-1.5 bg-[#7B5CFA] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-[#7B5CFA] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-[#7B5CFA] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Replying Context Strip */}
            {replyingTo && (
              <div className="px-6 py-3 bg-[var(--bg-surface-alt)] border-t border-[var(--border-primary)] flex items-center justify-between text-xs animate-slide-up">
                <div className="border-l-2 border-[#7B5CFA] pl-3 py-0.5 truncate flex-1 min-w-0 pr-8">
                  <p className="font-black text-[9px] uppercase tracking-wider text-[#7B5CFA]">
                    Replying to {replyingTo.senderId === user.id ? 'yourself' : (partner?.username || 'partner')}
                  </p>
                  <p className="text-[var(--text-secondary)] truncate">
                    {replyingTo.content || (replyingTo.mediaUrl ? '[Attachment]' : '')}
                  </p>
                </div>
                <button 
                  onClick={() => setReplyingTo(null)}
                  className="p-1.5 hover:bg-[var(--bg-sunken)] text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-full transition"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Footer Input */}
            <div className="p-6 bg-[var(--bg-surface-alt)] border-t border-[var(--border-primary)] relative">
              <AnimatePresence>
                {showEmojiPicker && (
                  <motion.div 
                    initial={{ opacity: 0, y: 15, scale: 0.95 }} 
                    animate={{ opacity: 1, y: 0, scale: 1 }} 
                    exit={{ opacity: 0, y: 15, scale: 0.95 }}
                    className="absolute bottom-24 right-6 z-50 shadow-2xl rounded-3xl overflow-hidden border border-[var(--border-primary)]"
                  >
                    <EmojiPicker onEmojiClick={onEmojiClick} theme="auto" />
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="flex items-center gap-3">
                {isRecording ? (
                  /* Recording Controller */
                  <div className="flex-1 bg-[var(--bg-sunken)] border border-[#FF6B6B]/20 rounded-2xl p-2 flex items-center justify-between">
                    <div className="flex items-center gap-3 pl-2">
                      <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-xs text-[var(--text-secondary)] font-bold">
                        Recording Voice Note · {formatRecordDuration(recordDuration)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        type="button" 
                        onClick={() => stopRecording(true)}
                        className="px-4 py-2 hover:bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-xl transition"
                      >
                        Cancel
                      </button>
                      <button 
                        type="button" 
                        onClick={() => stopRecording(false)}
                        className="px-5 py-2 bg-[#7B5CFA] text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md shadow-[#7B5CFA]/20 flex items-center gap-1.5"
                      >
                        <Volume2 size={12} /> Send Audio
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Standard Input Form */
                  <form onSubmit={handleSend} className="flex-1 flex items-end gap-2 bg-[var(--bg-sunken)] border border-[var(--border-primary)] rounded-2xl p-2.5 focus-within:border-[#7B5CFA]/40 transition-all shadow-inner">
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleFileUpload} disabled={uploading} />
                    
                    <button 
                      type="button" 
                      onClick={() => fileInputRef.current?.click()} 
                      disabled={uploading} 
                      className="p-2.5 text-[var(--text-secondary)] hover:text-[#7B5CFA] hover:bg-[var(--bg-surface-alt)] rounded-xl transition disabled:opacity-50"
                      title="Attach File"
                    >
                      {uploading ? (
                        <div className="w-5 h-5 border-2 border-[#7B5CFA] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Paperclip size={18} />
                      )}
                    </button>

                    <button 
                      type="button" 
                      onClick={startRecording}
                      disabled={uploading}
                      className="p-2.5 text-[var(--text-secondary)] hover:text-[#7B5CFA] hover:bg-[var(--bg-surface-alt)] rounded-xl transition disabled:opacity-50"
                      title="Record Voice Note"
                    >
                      <Mic size={18} />
                    </button>

                    <textarea 
                      value={msgInput}
                      onChange={(e) => {
                        setMsgInput(e.target.value);
                        setTyping(true);
                      }}
                      onBlur={() => setTyping(false)}
                      placeholder="Message..."
                      className="flex-1 bg-transparent border-none outline-none text-sm py-2 px-1 max-h-32 resize-none font-medium text-[var(--text-primary)] placeholder-[var(--text-muted)]"
                      rows={1}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend(e);
                        }
                      }}
                    />

                    <button 
                      type="button" 
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
                      className="p-2.5 text-[var(--text-secondary)] hover:text-[#7B5CFA] hover:bg-[var(--bg-surface-alt)] rounded-xl transition"
                      title="Add Emoji"
                    >
                      <Smile size={18} className={showEmojiPicker ? 'text-[#7B5CFA]' : ''} />
                    </button>

                    <button 
                      type="submit"
                      disabled={!msgInput.trim() && !replyingTo}
                      className="p-3 bg-[#7B5CFA] text-white rounded-xl hover:scale-105 transition disabled:opacity-50 disabled:scale-100 shadow-md shadow-[#7B5CFA]/15"
                      title="Send Message"
                    >
                      <Send size={16} />
                    </button>
                  </form>
                )}
              </div>
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-[var(--text-secondary)]">
            <div className="w-24 h-24 bg-[#7B5CFA]/5 rounded-[2rem] flex items-center justify-center mb-6">
              <Send size={44} className="text-[#7B5CFA] opacity-30" />
            </div>
            <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">Your Inbox</h2>
            <p className="max-w-xs text-xs font-semibold text-[var(--text-muted)] mt-2 leading-relaxed">
              Select a conversation, start a new one, or check project messages to coordinate with other creators.
            </p>
          </div>
        )}
      </div>

      {/* Right Context Panel */}
      {showDetails && activeConversation && (
        <div className="hidden lg:flex w-72 flex-shrink-0 border-l border-[var(--border-primary)] flex-col bg-[var(--bg-surface-alt)] overflow-y-auto no-scrollbar">
           <div className="p-8 text-center border-b border-[var(--border-primary)]">
              <img 
                src={partner?.profileImage || 'https://via.placeholder.com/150'} 
                className="w-24 h-24 rounded-3xl mx-auto border border-[var(--border-primary)] shadow-lg mb-4 object-cover"
                alt={partner?.username}
              />
              <Link to={`/profile/${partner?.username}`} className="text-base font-black text-[var(--text-primary)] hover:text-[#7B5CFA] hover:underline block truncate">
                {partner?.username}
              </Link>
              <p className="text-[9px] text-[var(--text-muted)] font-black uppercase tracking-widest mt-1">
                {partner?.profileType}
              </p>
              
              <div className="flex gap-2 mt-6">
                 <Link 
                   to={`/profile/${partner?.username}`}
                   className="flex-1 py-2.5 bg-[#7B5CFA]/10 hover:bg-[#7B5CFA]/20 border border-[#7B5CFA]/20 text-[#7B5CFA] text-[10px] font-black rounded-xl uppercase tracking-wider transition text-center"
                 >
                   View Profile
                 </Link>
              </div>
           </div>

           <div className="p-6 space-y-6">
              <div>
                 <h4 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-3">Privacy & Trust</h4>
                 <div className="space-y-2.5">
                    <button 
                      onClick={handleBlock} 
                      className="w-full text-left text-xs font-bold text-red-500 hover:text-red-600 transition flex items-center justify-between"
                    >
                      Block {partner?.username}
                    </button>
                    <button 
                      onClick={handleReport} 
                      className="w-full text-left text-xs font-bold text-red-500 hover:text-red-600 transition flex items-center justify-between"
                    >
                      Report Conversation
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* New Message Modal */}
      <AnimatePresence>
         {showNewMsgModal && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setShowNewMsgModal(false)}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-md bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] rounded-[2.5rem] shadow-2xl overflow-hidden"
              >
                 <div className="p-6 border-b border-[var(--border-primary)] flex items-center justify-between bg-[var(--bg-sunken)]/20">
                    <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight">New Conversation</h3>
                    <button 
                      onClick={() => setShowNewMsgModal(false)} 
                      className="p-2 text-[var(--text-secondary)] hover:text-red-500 transition rounded-xl"
                    >
                       <X size={18} />
                    </button>
                 </div>

                 <div className="p-6">
                    <div className="relative mb-6">
                       <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                       <input 
                         autoFocus
                         value={userSearch}
                         onChange={(e) => searchUsers(e.target.value)}
                         placeholder="Search network..."
                         className="w-full bg-[var(--bg-sunken)] border border-[var(--border-primary)] rounded-2xl py-3 pl-12 pr-4 text-xs font-semibold text-[var(--text-primary)] outline-none focus:border-[#7B5CFA]/40 transition-all"
                       />
                    </div>

                    <div className="max-h-72 overflow-y-auto no-scrollbar space-y-2">
                       {searching ? (
                         <div className="py-8 text-center text-xs font-bold text-[var(--text-secondary)] animate-pulse">Searching...</div>
                       ) : userSearch.trim() === '' ? (
                         <div className="py-8 text-center text-[var(--text-secondary)]">
                            <p className="text-xs font-bold">Search creators</p>
                            <p className="text-[10px] text-[var(--text-muted)] mt-1">Connect with creatives in your network</p>
                         </div>
                       ) : searchResults.length === 0 ? (
                         <div className="py-8 text-center text-xs font-bold text-[var(--text-muted)]">No users found matching "{userSearch}"</div>
                       ) : (
                         searchResults.map(u => (
                           <button
                             key={u.id}
                             onClick={() => handleStartChat(u.id)}
                             className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-[#7B5CFA]/5 transition-all text-left group border border-transparent hover:border-[#7B5CFA]/10"
                           >
                              <img src={u.profileImage || `https://ui-avatars.com/api/?name=${u.username}`} className="w-10 h-10 rounded-2xl object-cover border border-[var(--border-primary)]" alt={u.username} />
                              <div className="flex-1 min-w-0">
                                 <span className="font-bold text-[var(--text-primary)] text-sm group-hover:text-[#7B5CFA] transition-colors block">{u.username}</span>
                                 <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider truncate">{u.profileType} • {u.location || 'Global'}</p>
                              </div>
                           </button>
                         ))
                       )}
                    </div>
                 </div>
              </motion.div>
           </div>
         )}
      </AnimatePresence>

      {/* Image Lightbox Modal */}
      <AnimatePresence>
        {lightboxImg && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4"
          >
            <button 
              onClick={() => setLightboxImg(null)}
              className="absolute top-6 right-6 text-white/80 hover:text-white p-3 bg-white/10 rounded-full transition"
            >
              <X size={24} />
            </button>
            <img src={lightboxImg} className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl" alt="Lightbox Preview" />
            <div className="flex gap-4 mt-6">
              <a 
                href={lightboxImg} 
                download 
                target="_blank"
                rel="noreferrer"
                className="px-6 py-3 bg-[#7B5CFA] hover:bg-[#684CE0] text-white text-xs font-black uppercase tracking-widest rounded-2xl transition flex items-center gap-2 shadow-lg shadow-[#7B5CFA]/20"
              >
                <Download size={14} /> Download Original
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Messages;
