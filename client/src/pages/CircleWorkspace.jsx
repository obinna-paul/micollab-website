import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ChevronLeft, Shield, MessageSquare, Users, Plus,
  Send, Paperclip, Clock, Calendar, CheckCircle,
  MoreHorizontal, Info, Target, Layers, ListTodo, 
  FileText, ArrowRight, Trash2, Edit2, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../store/useAuthStore';

const CircleWorkspace = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuthStore();

  const [circle, setCircle]     = useState(null);
  const [messages, setMessages] = useState([]);
  const [tasks, setTasks]       = useState([]);
  const [msgInput, setMsgInput] = useState('');
  const [loading, setLoading]   = useState(true);
  const [sending, setSending]   = useState(false);
  const [activeTab, setActiveTab] = useState('OVERVIEW'); // OVERVIEW, TASKS, CHAT, FILES
  const scrollRef = useRef(null);
  const pollRef   = useRef(null);

  const headers = { Authorization: `Bearer ${token}` };

  // ── Data Fetching ──────────────────────────────────
  const fetchCircleData = useCallback(async () => {
    try {
      const circleRes = await axios.get(`/api/circles/${id}`, { headers });
      setCircle(circleRes.data);
      setMessages(circleRes.data.messages || []);
      
      const tasksRes = await axios.get(`/api/circles/${id}/tasks`, { headers });
      setTasks(tasksRes.data);
    } catch (err) {
      console.error('Circle fetch error:', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    fetchCircleData();
    pollRef.current = setInterval(fetchCircleData, 5000);
    return () => clearInterval(pollRef.current);
  }, [fetchCircleData]);

  useEffect(() => {
    if (scrollRef.current && activeTab === 'CHAT') {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activeTab]);

  // ── Actions ──────────────────────────────────────────
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!msgInput.trim() || sending) return;
    const text = msgInput.trim();
    setMsgInput('');
    setSending(true);
    try {
      const res = await axios.post(`/api/circles/${id}/messages`, { content: text }, { headers });
      setMessages(prev => [res.data, ...prev]);
    } catch (err) {
      console.error('Send error:', err);
      setMsgInput(text);
    } finally {
      setSending(false);
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const res = await axios.patch(`/api/tasks/${taskId}`, { status: newStatus }, { headers });
      setTasks(tasks.map(t => t.id === taskId ? res.data : t));
    } catch (err) {
      console.error('Task update error:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary" />
        <p className="text-textMuted text-sm font-medium">Powering up workspace...</p>
      </div>
    );
  }

  if (!circle) return null;

  // ── Component Panels ────────────────────────────────

  const OverviewPanel = () => (
    <div className="space-y-6 pb-12">
      <div className="bg-white border border-divider rounded-[2rem] p-8 shadow-sm">
        <div className="flex items-center gap-3 text-primary font-black uppercase text-[10px] tracking-widest mb-4">
          <Target size={14} /> Project Vision
        </div>
        <h2 className="text-2xl font-black text-textMain tracking-tight mb-4">{circle.title}</h2>
        <p className="text-sm text-textMuted font-medium leading-relaxed">
          {circle.description || "Establish a clear vision for this collaboration by adding a project description."}
        </p>
        
        <div className="mt-8 pt-8 border-t border-divider grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-4 rounded-2xl">
             <p className="text-[8px] font-black text-textMuted uppercase tracking-widest mb-1">Status</p>
             <p className="text-xs font-black text-emerald-600 uppercase">{circle.status}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-2xl">
             <p className="text-[8px] font-black text-textMuted uppercase tracking-widest mb-1">Category</p>
             <p className="text-xs font-black text-textMain">{circle.category}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-2xl">
             <p className="text-[8px] font-black text-textMuted uppercase tracking-widest mb-1">Members</p>
             <p className="text-xs font-black text-textMain">{circle.members?.length || 0}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-2xl">
             <p className="text-[8px] font-black text-textMuted uppercase tracking-widest mb-1">Tasks</p>
             <p className="text-xs font-black text-textMain">{tasks.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-divider rounded-[2rem] p-8">
           <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-textMain tracking-tight">Active Team</h3>
              <button className="text-[10px] font-black text-primary uppercase tracking-widest">Recruit +</button>
           </div>
           <div className="space-y-4">
              {circle.members?.map((m, i) => (
                <div key={i} className="flex items-center gap-3">
                   <img src={m.user?.profileImage || `https://ui-avatars.com/api/?name=${m.user?.username}`} className="w-10 h-10 rounded-xl object-cover" />
                   <div>
                      <p className="font-black text-textMain text-xs">@{m.user?.username}</p>
                      <p className="text-[9px] font-black text-textMuted uppercase tracking-widest">{m.role}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>
        
        <div className="bg-slate-900 text-white rounded-[2rem] p-8 relative overflow-hidden">
           <Zap className="absolute -top-4 -right-4 w-24 h-24 text-white/5 opacity-20" />
           <h3 className="font-black tracking-tight mb-2">Upcoming Deadline</h3>
           <p className="text-sm text-white/60 mb-6">No immediate deadlines set. Add milestones to track progress.</p>
           <button className="w-full py-3 bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition">
              Set Milestone
           </button>
        </div>
      </div>
    </div>
  );

  const TasksPanel = () => (
    <div className="space-y-4 pb-12">
      <div className="flex items-center justify-between mb-6">
         <h3 className="text-xl font-black text-textMain tracking-tight">Project Tasks</h3>
         <button className="bg-primary text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center gap-2">
            <Plus size={14} /> New Task
         </button>
      </div>

      <div className="space-y-3">
         {tasks.length === 0 && (
           <div className="py-20 text-center bg-gray-50 rounded-[2rem] border-2 border-dashed border-divider">
              <ListTodo size={40} className="text-textMuted mx-auto mb-4 opacity-20" />
              <p className="text-textMuted font-black uppercase text-[10px] tracking-widest">No tasks created yet</p>
           </div>
         )}
         {tasks.map(task => (
           <div key={task.id} className="bg-white border border-divider rounded-2xl p-5 hover:border-primary transition-all group">
              <div className="flex items-start justify-between mb-4">
                 <div>
                    <h4 className="font-black text-textMain text-sm">{task.title}</h4>
                    <p className="text-xs text-textMuted mt-1 line-clamp-1">{task.description}</p>
                 </div>
                 <div className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                    task.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                 }`}>
                    {task.status}
                 </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-divider">
                 <div className="flex items-center gap-2">
                    {task.assignee ? (
                      <div className="flex items-center gap-2">
                         <img src={task.assignee.profileImage} className="w-6 h-6 rounded-lg object-cover" />
                         <span className="text-[10px] font-black text-textMuted uppercase tracking-widest">{task.assignee.username}</span>
                      </div>
                    ) : (
                      <span className="text-[10px] font-black text-textMuted uppercase tracking-widest">Unassigned</span>
                    )}
                 </div>
                 <div className="flex gap-2">
                    <button onClick={() => updateTaskStatus(task.id, task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED')} className="p-2 hover:bg-gray-50 rounded-lg text-textMuted hover:text-primary transition">
                       <CheckCircle size={16} />
                    </button>
                    <button className="p-2 hover:bg-gray-50 rounded-lg text-textMuted transition">
                       <MoreHorizontal size={16} />
                    </button>
                 </div>
              </div>
           </div>
         ))}
      </div>
    </div>
  );

  const ChatPanel = () => (
    <div className="flex flex-col h-full bg-white md:border md:border-divider md:rounded-[2rem] overflow-hidden shadow-sm">
       <div className="p-4 border-b border-divider bg-gray-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <MessageSquare size={16} className="text-primary" />
             <span className="text-[10px] font-black text-textMain uppercase tracking-widest">Internal Sync</span>
          </div>
          <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1">
             <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Live
          </span>
       </div>

       <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar flex flex-col-reverse">
          {messages.map((msg, i) => {
            const isMine = msg.senderId === user?.id;
            return (
              <div key={msg.id || i} className={`flex gap-3 ${isMine ? 'flex-row-reverse' : ''}`}>
                 <img src={msg.sender?.profileImage} className="w-8 h-8 rounded-lg object-cover flex-shrink-0 mt-1" />
                 <div className={`max-w-[80%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                    <div className={`px-4 py-2.5 rounded-2xl text-sm ${isMine ? 'bg-primary text-white rounded-tr-none' : 'bg-gray-100 text-textMain rounded-tl-none'}`}>
                       {msg.content}
                    </div>
                    <p className="text-[8px] font-black text-textMuted uppercase mt-1 px-1 tracking-widest">
                       {msg.sender?.username} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                 </div>
              </div>
            );
          })}
       </div>

       <form onSubmit={handleSendMessage} className="p-4 border-t border-divider">
          <div className="flex gap-2 bg-gray-50 border border-divider rounded-2xl p-2 focus-within:border-primary transition-all">
             <input 
               value={msgInput}
               onChange={e => setMsgInput(e.target.value)}
               placeholder="Write an update..."
               className="flex-1 bg-transparent border-none outline-none text-sm px-2"
             />
             <button type="submit" className="bg-primary text-white p-2.5 rounded-xl shadow-lg shadow-primary/20">
                <Send size={16} />
             </button>
          </div>
       </form>
    </div>
  );

  const TABS = [
    { id: 'OVERVIEW', label: 'Overview', icon: Info },
    { id: 'TASKS',    label: 'Tasks',    icon: ListTodo },
    { id: 'CHAT',     label: 'Chat',     icon: MessageSquare },
    { id: 'FILES',    label: 'Files',    icon: FileText }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 md:py-8 h-full flex flex-col">
      {/* Workspace Header */}
      <div className="flex items-center justify-between mb-6 md:mb-10 pt-4 md:pt-0">
        <div className="flex items-center gap-4">
           <button onClick={() => navigate('/network')} className="p-2.5 bg-white border border-divider rounded-xl hover:text-primary transition shadow-sm">
              <ChevronLeft size={20} />
           </button>
           <div className="min-w-0">
              <div className="flex items-center gap-2 text-primary font-black uppercase text-[9px] tracking-widest mb-0.5">
                 <Shield size={10} /> Secure Circle
              </div>
              <h1 className="text-xl md:text-3xl font-black text-textMain tracking-tighter leading-tight truncate">{circle.title}</h1>
           </div>
        </div>
        <div className="hidden md:flex items-center gap-3">
           <div className="flex -space-x-3">
              {circle.members?.map((m, i) => (
                <img key={i} src={m.user?.profileImage} className="w-10 h-10 rounded-full border-4 border-white shadow-sm" />
              ))}
           </div>
           <button className="p-3 bg-white border border-divider rounded-xl text-textMuted hover:text-primary transition shadow-sm">
              <MoreHorizontal size={20} />
           </button>
        </div>
      </div>

      {/* Navigation Tabs (Mobile) */}
      <div className="md:hidden flex border-b border-divider -mx-4 mb-6 sticky top-14 bg-white/95 backdrop-blur-md z-40">
        {TABS.map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-4 flex flex-col items-center gap-1.5 transition-all relative ${activeTab === tab.id ? 'text-primary' : 'text-textMuted'}`}
          >
            <tab.icon size={16} />
            <span className="text-[9px] font-black uppercase tracking-widest">{tab.label}</span>
            {activeTab === tab.id && <motion.div layoutId="tab-active" className="absolute bottom-0 w-8 h-0.5 bg-primary rounded-full" />}
          </button>
        ))}
      </div>

      {/* Main Content Layout */}
      <div className="flex-1 min-h-0">
        {/* Mobile View */}
        <div className="md:hidden h-full">
           <AnimatePresence mode="wait">
             <motion.div
               key={activeTab}
               initial={{ opacity: 0, x: 10 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -10 }}
               transition={{ duration: 0.2 }}
               className="h-full"
             >
               {activeTab === 'OVERVIEW' && <OverviewPanel />}
               {activeTab === 'TASKS' && <TasksPanel />}
               {activeTab === 'CHAT' && <div className="h-[calc(100svh-18rem)]"><ChatPanel /></div>}
               {activeTab === 'FILES' && (
                 <div className="py-20 text-center opacity-50">
                    <FileText size={40} className="mx-auto mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest">No files shared yet</p>
                 </div>
               )}
             </motion.div>
           </AnimatePresence>
        </div>

        {/* Desktop View */}
        <div className="hidden md:grid grid-cols-12 gap-8 h-[calc(100vh-280px)]">
           <div className="col-span-8 overflow-y-auto no-scrollbar pr-2">
              {/* Tab Selector Desktop */}
              <div className="flex gap-2 mb-8 bg-gray-50/50 p-1.5 rounded-2xl border border-divider w-fit">
                 {TABS.filter(t => t.id !== 'CHAT').map(tab => (
                   <button 
                     key={tab.id}
                     onClick={() => setActiveTab(tab.id)}
                     className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white text-primary shadow-sm' : 'text-textMuted hover:text-textMain'}`}
                   >
                      {tab.label}
                   </button>
                 ))}
              </div>
              
              {activeTab === 'CHAT' ? <OverviewPanel /> : activeTab === 'TASKS' ? <TasksPanel /> : activeTab === 'OVERVIEW' ? <OverviewPanel /> : null}
              {activeTab === 'FILES' && (
                 <div className="py-40 text-center opacity-25">
                    <FileText size={64} className="mx-auto mb-6" />
                    <h3 className="text-xl font-black text-textMain uppercase tracking-widest">Project File Hub</h3>
                    <p className="text-sm font-medium text-textMuted mt-2">Shared assets and versions will appear here.</p>
                 </div>
              )}
           </div>
           <div className="col-span-4 h-full">
              <ChatPanel />
           </div>
        </div>
      </div>
    </div>
  );
};

export default CircleWorkspace;
