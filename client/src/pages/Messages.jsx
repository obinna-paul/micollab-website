import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, MoreVertical, Send, Image as ImageIcon, 
  Mic, Smile, Paperclip, Info, ChevronLeft, 
  Check, CheckCheck, Clock, UserPlus, Briefcase,
  SquarePen, X
} from 'lucide-react';
import axios from 'axios';
import useAuthStore from '../store/useAuthStore';
import useChatStore from '../store/useChatStore';

const TABS = [
  { id: 'PRIMARY', label: 'Primary', count: 0 },
  { id: 'REQUESTS', label: 'Requests', count: 0 },
  { id: 'PROPOSALS', label: 'Proposals', count: 0 }
];

const Messages = () => {
  const { user, token } = useAuthStore();
  const { 
    conversations, activeConversation, messages, loading,
    initSocket, fetchConversations, setActiveConversation, sendMessage, setTyping, startConversation 
  } = useChatStore();

  const [activeTab, setActiveTab] = useState('PRIMARY');
  const [msgInput, setMsgInput] = useState('');
  const [showDetails, setShowDetails] = useState(true);
  const [showNewMsgModal, setShowNewMsgModal] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const scrollRef = useRef(null);

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

  const handleSend = (e) => {
    e.preventDefault();
    if (!msgInput.trim()) return;
    sendMessage(token, msgInput.trim());
    setMsgInput('');
    setTyping(false);
  };

  const searchUsers = async (q) => {
    setUserSearch(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/network/discover?search=${q}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSearchResults(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const handleStartChat = async (targetUserId) => {
    await startConversation(token, targetUserId);
    setShowNewMsgModal(false);
    setUserSearch('');
    setSearchResults([]);
  };

  const getPartner = (conversation) => {
    return conversation.participants.find(p => p.userId !== user?.id)?.user;
  };

  return (
    <div className="flex h-[calc(100vh-140px)] bg-surface rounded-2xl border border-divider overflow-hidden shadow-sm">
      
      {/* Left Sidebar: Conversation List */}
      <div className={`w-full md:w-80 flex-shrink-0 border-r border-divider flex flex-col ${activeConversation ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-divider">
          <div className="flex items-center justify-between mb-4">
             <h1 className="text-xl font-black text-textMain">Messaging</h1>
             <button 
               onClick={() => setShowNewMsgModal(true)}
               className="p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-all shadow-sm"
               title="New Message"
             >
                <SquarePen size={18} />
             </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" size={16} />
            <input 
              placeholder="Search conversations..."
              className="w-full bg-background border border-divider rounded-xl py-2 pl-10 pr-4 text-xs outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Inbox Tabs */}
        <div className="flex border-b border-divider">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all relative ${
                activeTab === tab.id ? 'text-primary' : 'text-textMuted hover:text-textMain'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          ))}
        </div>

        {/* Conv List */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {loading && conversations.length === 0 ? (
             <div className="p-8 text-center text-textMuted text-xs font-bold">Loading...</div>
          ) : conversations.length === 0 ? (
             <div className="p-8 text-center text-textMuted">
                <p className="text-xs font-bold">No conversations yet.</p>
                <p className="text-[10px] mt-1">Start connecting with other creators!</p>
             </div>
          ) : (
            conversations.map(conv => {
              const partner = getPartner(conv);
              const lastMsg = conv.messages[0];
              const isActive = activeConversation?.id === conv.id;

              return (
                <button
                  key={conv.id}
                  onClick={() => setActiveConversation(token, conv)}
                  className={`w-full p-4 flex items-start gap-3 hover:bg-primary/5 transition-colors text-left border-b border-divider/50 ${
                    isActive ? 'bg-primary/5 border-l-4 border-l-primary' : ''
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <img 
                      src={partner?.profileImage || 'https://via.placeholder.com/150'} 
                      alt={partner?.username} 
                      className="w-12 h-12 rounded-full object-cover border border-divider shadow-sm"
                    />
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-surface rounded-full"></div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-center mb-0.5">
                      <p className="text-sm font-bold text-textMain truncate">@{partner?.username}</p>
                      <span className="text-[9px] text-textMuted font-medium">
                        {lastMsg ? new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <p className="text-[11px] text-textMuted truncate leading-tight">
                      {lastMsg ? lastMsg.content : 'No messages yet'}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Center Chat Window */}
      <div className={`flex-1 flex flex-col min-w-0 bg-background ${!activeConversation ? 'hidden md:flex' : 'flex'}`}>
        {activeConversation ? (
          <>
            {/* Header */}
            <div className="h-16 px-4 border-b border-divider flex items-center justify-between bg-surface/50 backdrop-blur-sm sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveConversation(null)} className="md:hidden text-textMuted">
                  <ChevronLeft size={24} />
                </button>
                <div className="flex items-center gap-2">
                  <img 
                    src={getPartner(activeConversation)?.profileImage || 'https://via.placeholder.com/150'} 
                    className="w-8 h-8 rounded-full border border-divider"
                  />
                  <div>
                    <p className="text-sm font-bold text-textMain">@{getPartner(activeConversation)?.username}</p>
                    <p className="text-[10px] text-green-500 font-bold">Active now</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-textMuted">
                <button onClick={() => setShowDetails(!showDetails)} className="hover:text-primary transition">
                  <Info size={20} />
                </button>
                <button className="hover:text-primary transition">
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>

            {/* Proposal Header Context */}
            {activeConversation.type === 'PROPOSAL' && activeConversation.proposalThread && (
              <div className="p-3 bg-primary/5 border-b border-divider flex items-center justify-between mx-4 my-2 rounded-xl">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-primary shadow-sm">
                       <Briefcase size={20} />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-primary uppercase">Proposal Thread</p>
                       <p className="text-xs font-bold text-textMain">{activeConversation.proposalThread.gig.title}</p>
                    </div>
                 </div>
                 <span className="text-[9px] font-black uppercase bg-white px-2 py-1 rounded-full shadow-sm text-textMuted border border-divider">
                    {activeConversation.proposalThread.status}
                 </span>
              </div>
            )}

            {/* Messages Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar"
            >
              {messages.map((msg, idx) => {
                const isMine = msg.senderId === user.id;
                return (
                  <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] ${isMine ? 'order-2' : ''}`}>
                      <div className={`p-3 rounded-2xl text-sm ${
                        isMine 
                          ? 'bg-primary text-white rounded-tr-none shadow-md' 
                          : 'bg-surface border border-divider text-textMain rounded-tl-none shadow-sm'
                      }`}>
                        {msg.content}
                      </div>
                      <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-[9px] text-textMuted font-medium">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isMine && <CheckCheck size={10} className="text-primary" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Input */}
            <div className="p-4 bg-surface border-t border-divider">
              <form onSubmit={handleSend} className="relative flex items-end gap-2 bg-background border border-divider rounded-2xl p-2 focus-within:border-primary transition-all shadow-sm">
                <button type="button" className="p-2 text-textMuted hover:text-primary transition"><Paperclip size={20} /></button>
                <textarea 
                  value={msgInput}
                  onChange={(e) => {
                    setMsgInput(e.target.value);
                    setTyping(true);
                  }}
                  onBlur={() => setTyping(false)}
                  placeholder="Message..."
                  className="flex-1 bg-transparent border-none outline-none text-sm py-2 px-1 max-h-32 resize-none font-medium"
                  rows={1}
                />
                <button type="button" className="p-2 text-textMuted hover:text-primary transition"><Smile size={20} /></button>
                <button 
                  type="submit"
                  disabled={!msgInput.trim()}
                  className="p-2.5 bg-primary text-white rounded-xl hover:scale-105 transition disabled:opacity-50 disabled:scale-100 shadow-md"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-textMuted">
            <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-4">
              <Send size={40} className="text-primary opacity-20" />
            </div>
            <h2 className="text-xl font-black text-textMain">Your Inbox</h2>
            <p className="max-w-xs text-sm font-medium mt-2">Select a conversation or start a new one to begin collaborating with the network.</p>
          </div>
        )}
      </div>

      {/* Right Context Panel */}
      {showDetails && activeConversation && (
        <div className="hidden lg:flex w-72 flex-shrink-0 border-l border-divider flex-col bg-surface overflow-y-auto no-scrollbar">
           <div className="p-8 text-center border-b border-divider">
              <img 
                src={getPartner(activeConversation)?.profileImage || 'https://via.placeholder.com/150'} 
                className="w-24 h-24 rounded-full mx-auto border-4 border-background shadow-xl mb-4 object-cover"
              />
              <h3 className="text-lg font-black text-textMain">@{getPartner(activeConversation)?.username}</h3>
              <p className="text-xs text-textMuted font-bold uppercase tracking-widest mt-1">{getPartner(activeConversation)?.profileType}</p>
              
              <div className="flex gap-2 mt-6">
                 <button className="flex-1 py-2 bg-primary/10 text-primary text-[10px] font-black rounded-full uppercase border border-primary/20 hover:bg-primary/20 transition">View Profile</button>
                 <button className="p-2 border border-divider rounded-full text-textMuted hover:bg-gray-100 transition"><MoreVertical size={16} /></button>
              </div>
           </div>

           <div className="p-6 space-y-6">
              <div>
                 <h4 className="text-[10px] font-black text-textMuted uppercase tracking-tighter mb-3">Shared Media</h4>
                 <div className="grid grid-cols-3 gap-2">
                    {[1,2,3,4,5,6].map(i => (
                      <div key={i} className="aspect-square bg-background border border-divider rounded-lg"></div>
                    ))}
                 </div>
              </div>

              <div>
                 <h4 className="text-[10px] font-black text-textMuted uppercase tracking-tighter mb-3">Settings</h4>
                 <div className="space-y-3">
                    <button className="w-full text-left text-xs font-bold text-textMain hover:text-primary transition flex items-center justify-between">
                       Mute Notifications
                       <div className="w-8 h-4 bg-divider rounded-full relative"><div className="absolute left-1 top-1 w-2 h-2 bg-white rounded-full"></div></div>
                    </button>
                    <button className="w-full text-left text-xs font-bold text-red-500 hover:underline">Block @{getPartner(activeConversation)?.username}</button>
                    <button className="w-full text-left text-xs font-bold text-red-500 hover:underline">Report Conversation</button>
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
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowNewMsgModal(false)}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
              >
                 <div className="p-6 border-b border-divider flex items-center justify-between bg-gray-50/50">
                    <h3 className="text-xl font-black text-textMain tracking-tight">New Message</h3>
                    <button onClick={() => setShowNewMsgModal(false)} className="p-2 text-textMuted hover:text-red-500 transition">
                       <X size={20} />
                    </button>
                 </div>

                 <div className="p-6">
                    <div className="relative mb-6">
                       <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-textMuted" size={18} />
                       <input 
                         autoFocus
                         value={userSearch}
                         onChange={(e) => searchUsers(e.target.value)}
                         placeholder="Search by name or skill..."
                         className="w-full bg-gray-50 border border-divider rounded-2xl py-3 pl-12 pr-4 text-sm font-medium outline-none focus:border-primary transition-all"
                       />
                    </div>

                    <div className="max-h-72 overflow-y-auto no-scrollbar space-y-2">
                       {searching ? (
                         <div className="py-8 text-center text-xs font-bold text-textMuted animate-pulse">Searching creators...</div>
                       ) : userSearch.trim() === '' ? (
                         <div className="py-8 text-center text-textMuted">
                            <p className="text-xs font-bold">Start typing to find people</p>
                            <p className="text-[10px] mt-1">Connect with directors, actors, and producers</p>
                         </div>
                       ) : searchResults.length === 0 ? (
                         <div className="py-8 text-center text-xs font-bold text-textMuted">No creators found matching "{userSearch}"</div>
                       ) : (
                         searchResults.map(u => (
                           <button
                             key={u.id}
                             onClick={() => handleStartChat(u.id)}
                             className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-primary/5 transition-all text-left group border border-transparent hover:border-primary/10"
                           >
                              <img src={u.profileImage || `https://ui-avatars.com/api/?name=${u.username}`} className="w-10 h-10 rounded-full border border-divider" />
                              <div className="flex-1 min-w-0">
                                 <p className="font-black text-textMain text-xs group-hover:text-primary transition-colors">@{u.username}</p>
                                 <p className="text-[9px] text-textMuted uppercase tracking-widest truncate">{u.profileType} • {u.location || 'Global'}</p>
                              </div>
                              <ChevronLeft size={16} className="text-textMuted rotate-180 opacity-0 group-hover:opacity-100 transition-all" />
                           </button>
                         ))
                       )}
                    </div>
                 </div>
              </motion.div>
           </div>
         )}
      </AnimatePresence>
    </div>
  );
};

export default Messages;
