import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Users, MessageSquare, Plus, ChevronLeft, 
  Target, Calendar, Clock, CheckCircle, Info,
  Send, Paperclip, Smile, MoreVertical, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../store/useAuthStore';
import useChatStore from '../store/useChatStore';

const CircleWorkspace = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const { 
    initSocket, setActiveConversation, messages, sendMessage, loading: chatLoading 
  } = useChatStore();

  const [circle, setCircle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msgInput, setMsgInput] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (token && id) {
      fetchCircleDetails();
    }
  }, [id, token]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchCircleDetails = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/circles/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCircle(res.data);
      if (res.data.conversation) {
        initSocket(token);
        setActiveConversation(token, res.data.conversation);
      }
    } catch (err) {
      console.error(err);
      // navigate('/network');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!msgInput.trim()) return;
    sendMessage(token, msgInput.trim());
    setMsgInput('');
  };

  if (loading || !circle || !circle.name) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-100px)] flex flex-col">
      {/* Header Context */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/network')}
            className="p-3 bg-white border border-divider rounded-2xl hover:text-primary transition-all shadow-sm"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3 text-primary font-black uppercase text-[10px] tracking-widest mb-1">
               <Shield size={12} /> Secure Collaboration Circle
            </div>
            <h1 className="text-3xl font-black text-textMain tracking-tighter leading-none">{circle.name}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-divider shadow-sm">
           <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase">
              <div className="w-2 h-2 bg-emerald-600 rounded-full animate-pulse" />
              {circle.status}
           </div>
           <button className="p-3 hover:bg-gray-50 rounded-xl transition-all">
              <MoreVertical size={20} className="text-textMuted" />
           </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8 flex-1 min-h-0">
        {/* Left Side: Management & Roster (8/12) */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-8 min-h-0">
          
          {/* Project Timeline & Vision */}
          <div className="bg-white border border-divider rounded-[2.5rem] p-8 shadow-sm">
            <div className="flex items-start justify-between mb-8">
               <div className="space-y-4 max-w-xl">
                  <p className="text-sm text-textMuted font-medium leading-relaxed">
                     {circle.description || "Building something great together. Recruitment and planning in progress."}
                  </p>
                  <div className="flex flex-wrap gap-4">
                     <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl border border-divider">
                        <Clock size={14} className="text-primary" />
                        <span className="text-xs font-black text-textMain">{circle.duration || 'Flexible'}</span>
                     </div>
                     <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl border border-divider">
                        <Calendar size={14} className="text-primary" />
                        <span className="text-xs font-black text-textMain">Starts {circle.startDate ? new Date(circle.startDate).toLocaleDateString() : 'TBD'}</span>
                     </div>
                  </div>
               </div>
            </div>

            {/* Timeline Visualization */}
            <div className="pt-8 border-t border-divider">
               <div className="flex justify-between items-end mb-4">
                  <p className="text-[10px] font-black uppercase text-textMuted tracking-widest">Project Timeline Progress</p>
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest">0% Complete</p>
               </div>
               <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden border border-divider">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '5%' }}
                    className="h-full bg-primary shadow-[0_0_15px_rgba(124,58,237,0.3)]"
                  />
               </div>
               <div className="flex justify-between mt-4">
                  <div className="text-center">
                     <div className="w-2 h-2 bg-primary rounded-full mx-auto mb-2" />
                     <p className="text-[8px] font-black text-textMain uppercase">Planning</p>
                  </div>
                  <div className="text-center opacity-30">
                     <div className="w-2 h-2 bg-divider rounded-full mx-auto mb-2" />
                     <p className="text-[8px] font-black text-textMuted uppercase">Execution</p>
                  </div>
                  <div className="text-center opacity-30">
                     <div className="w-2 h-2 bg-divider rounded-full mx-auto mb-2" />
                     <p className="text-[8px] font-black text-textMuted uppercase">Review</p>
                  </div>
                  <div className="text-center opacity-30">
                     <div className="w-2 h-2 bg-divider rounded-full mx-auto mb-2" />
                     <p className="text-[8px] font-black text-textMuted uppercase">Launch</p>
                  </div>
               </div>
            </div>
          </div>

          {/* Bottom Left Row: Roster (Left) & Escrow (Right) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 min-h-0">
             {/* Project Roster */}
             <div className="bg-white border border-divider rounded-[2.5rem] p-8 shadow-sm overflow-hidden flex flex-col">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="text-lg font-black text-textMain tracking-tight">Project Roster</h3>
                   <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black">{circle?.members?.length || 0} Members</span>
                </div>

                <div className="space-y-4 overflow-y-auto no-scrollbar flex-1 pr-2">
                   {circle?.members?.map((member, i) => (
                     <div key={i} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                           <div className="relative">
                              <img src={member.user?.profileImage || `https://ui-avatars.com/api/?name=${member.user?.username}`} className="w-10 h-10 rounded-xl object-cover" />
                              {member.role === 'LEAD' && (
                                <div className="absolute -top-1 -right-1 bg-amber-500 text-white p-1 rounded-full border border-white">
                                   <CheckCircle size={8} strokeWidth={4} />
                                </div>
                              )}
                           </div>
                           <div>
                              <p className="font-black text-textMain text-xs">@{member.user?.username}</p>
                              <p className="text-[8px] font-black text-primary uppercase tracking-widest">{member.role}</p>
                           </div>
                        </div>
                     </div>
                   ))}
                   
                   {circle?.invitations?.map((invite, i) => (
                     <div key={i} className="flex items-center justify-between opacity-50 grayscale">
                        <div className="flex items-center gap-3">
                           <img src={invite.invitee?.profileImage || `https://ui-avatars.com/api/?name=${invite.invitee?.username}`} className="w-10 h-10 rounded-xl object-cover border border-dashed border-divider" />
                           <div>
                              <p className="font-black text-textMain text-xs">@{invite.invitee?.username}</p>
                              <p className="text-[8px] font-black text-textMuted uppercase tracking-widest">Invited</p>
                           </div>
                        </div>
                     </div>
                   ))}
                </div>

                <button className="w-full mt-6 py-3 bg-surface border-2 border-dashed border-divider rounded-xl text-[9px] font-black text-textMuted uppercase tracking-widest hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2">
                   <Plus size={14} /> Recruit
                </button>
             </div>

             {/* Security / Info Card (Escrow Badge) */}
             <div className="bg-emerald-900 text-white rounded-[2.5rem] p-8 shadow-2xl shadow-emerald-900/20 flex flex-col justify-between">
                <div>
                   <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                      <Shield size={24} className="text-emerald-400" />
                   </div>
                   <h3 className="text-xl font-black tracking-tight mb-2">Circle Security</h3>
                   <p className="text-xs text-emerald-100/60 leading-relaxed font-medium mb-4">
                      All files and conversations within this circle are private to members. Micollab integrated escrow is recommended for milestone payments.
                   </p>
                </div>
                <button className="w-full py-4 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                   Enable Escrow Protection
                </button>
             </div>
          </div>
        </div>

        {/* Right Side: Circle Chat (4/12) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col min-h-0">
          <div className="bg-white border border-divider rounded-[2.5rem] shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="p-6 border-b border-divider flex justify-between items-center bg-gray-50/50">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                     <MessageSquare size={20} />
                  </div>
                  <div>
                     <h3 className="font-black text-textMain tracking-tight">Circle Chat</h3>
                     <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Encrypted Workspace</p>
                  </div>
               </div>
            </div>

            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar"
            >
               {messages.length === 0 && (
                 <div className="py-20 text-center">
                    <p className="text-textMuted text-xs font-medium">Say hello to your new circle! 👋</p>
                 </div>
               )}
               {messages.map((msg, i) => {
                 const isMine = msg.senderId === user?.id;
                 return (
                   <div key={i} className={`flex gap-3 ${isMine ? 'flex-row-reverse' : ''}`}>
                      <img 
                        src={msg.sender?.profileImage || `https://ui-avatars.com/api/?name=${msg.sender?.username}`} 
                        className="w-8 h-8 rounded-lg object-cover flex-shrink-0" 
                      />
                      <div className={`max-w-[70%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                         <div className={`p-4 rounded-2xl text-sm ${isMine ? 'bg-primary text-white rounded-tr-none' : 'bg-gray-100 text-textMain rounded-tl-none'}`}>
                            {msg.content}
                         </div>
                         <p className="text-[8px] font-black text-textMuted uppercase mt-1 tracking-widest">
                            {msg.sender?.username} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                         </p>
                      </div>
                   </div>
                 );
               })}
            </div>

            <div className="p-6 border-t border-divider">
               <form onSubmit={handleSend} className="flex gap-3 bg-gray-50 border border-divider p-2 rounded-2xl focus-within:border-primary transition-all">
                  <button type="button" className="p-3 text-textMuted hover:text-primary transition"><Paperclip size={20} /></button>
                  <input 
                    value={msgInput}
                    onChange={(e) => setMsgInput(e.target.value)}
                    placeholder="Share updates..."
                    className="flex-1 bg-transparent border-none outline-none text-sm font-medium"
                  />
                  <button 
                    type="submit"
                    disabled={!msgInput.trim()}
                    className="bg-primary text-white p-3 rounded-xl shadow-lg shadow-primary/20 disabled:opacity-50"
                  >
                     <Send size={18} />
                  </button>
               </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CircleWorkspace;
