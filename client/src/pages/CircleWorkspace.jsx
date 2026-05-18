import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ChevronLeft, Shield, MessageSquare, Users, Plus,
  Send, Paperclip, Clock, Calendar, Check, CheckCircle,
  MoreHorizontal, Info, Target, Layers, ListTodo, 
  FileText, ArrowRight, Trash2, Edit2, Zap,
  Image, Video, Music, Download, X, Search,
  Grid, List, AlertTriangle, CheckCircle2
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
  const [files, setFiles]       = useState([]);
  const [msgInput, setMsgInput] = useState('');
  const [loading, setLoading]   = useState(true);
  const [sending, setSending]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('OVERVIEW'); // OVERVIEW, FILES, TASKS, UPDATES
  const scrollRef = useRef(null);
  const pollRef   = useRef(null);
  const fileInputRef = useRef(null);

  // Task Creation States
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle]             = useState('');
  const [taskDesc, setTaskDesc]               = useState('');
  const [taskPriority, setTaskPriority]       = useState('MEDIUM');
  const [taskAssignee, setTaskAssignee]       = useState('');
  const [taskDeadline, setTaskDeadline]       = useState('');
  const [taskSaving, setTaskSaving]           = useState(false);

  // Files Control States
  const [fileSearchQuery, setFileSearchQuery]       = useState('');
  const [fileCategoryFilter, setFileCategoryFilter] = useState('ALL');
  const [fileLayout, setFileLayout]                 = useState('grid'); // grid or list

  const headers = { Authorization: `Bearer ${token}` };

  // ── Data Fetching ──────────────────────────────────
  const fetchCircleData = useCallback(async () => {
    try {
      const circleRes = await axios.get(`/api/circles/${id}`, { headers });
      setCircle(circleRes.data);
      setMessages(circleRes.data.messages || []);
      
      const tasksRes = await axios.get(`/api/circles/${id}/tasks`, { headers });
      setTasks(tasksRes.data);

      const filesRes = await axios.get(`/api/circles/${id}/files`, { headers });
      setFiles(filesRes.data);
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
    if (scrollRef.current && activeTab === 'UPDATES') {
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
      setTasks(prev => prev.map(t => t.id === taskId ? res.data : t));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update task status');
      console.error('Task update error:', err);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim() || taskSaving) return;

    setTaskSaving(true);
    try {
      const res = await axios.post(`/api/circles/${id}/tasks`, {
        title: taskTitle.trim(),
        description: taskDesc.trim(),
        priority: taskPriority,
        assignedTo: taskAssignee || null,
        deadline: taskDeadline || null
      }, { headers });

      setTasks(prev => [res.data, ...prev]);
      
      // Reset Modal Form
      setTaskTitle('');
      setTaskDesc('');
      setTaskPriority('MEDIUM');
      setTaskAssignee('');
      setTaskDeadline('');
      setIsTaskModalOpen(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create task');
      console.error('Task creation error:', err);
    } finally {
      setTaskSaving(false);
    }
  };

  const handleFileUpload = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await axios.post(`/api/circles/${id}/files`, formData, {
        headers: {
          ...headers,
          'Content-Type': 'multipart/form-data'
        }
      });
      setFiles(prev => [res.data, ...prev]);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to upload file');
      console.error('File upload error:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileDelete = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    try {
      await axios.delete(`/api/circles/files/${fileId}`, { headers });
      setFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete file');
      console.error('File delete error:', err);
    }
  };

  const getFileIcon = (mimeType, fileUrl) => {
    const filename = fileUrl.substring(fileUrl.lastIndexOf('/') + 1);
    const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
    
    if (mimeType.startsWith('image/') || ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'].includes(ext)) {
      return { icon: Image, color: 'text-indigo-500 bg-indigo-50 border-indigo-100' };
    }
    if (mimeType.startsWith('video/') || ['.mp4', '.mkv', '.avi', '.mov', '.webm'].includes(ext)) {
      return { icon: Video, color: 'text-pink-500 bg-pink-50 border-pink-100' };
    }
    if (mimeType.startsWith('audio/') || ['.mp3', '.wav', '.ogg', '.m4a'].includes(ext)) {
      return { icon: Music, color: 'text-emerald-500 bg-emerald-50 border-emerald-100' };
    }
    if (ext === '.pdf') {
      return { icon: FileText, color: 'text-rose-500 bg-rose-50 border-rose-100' };
    }
    if (['.zip', '.rar', '.tar', '.gz', '.7z'].includes(ext)) {
      return { icon: Layers, color: 'text-amber-500 bg-amber-50 border-amber-100' };
    }
    return { icon: FileText, color: 'text-slate-500 bg-slate-50 border-slate-100' };
  };

  const getOriginalName = (fileUrl) => {
    const filename = fileUrl.substring(fileUrl.lastIndexOf('/') + 1);
    const parts = filename.split('-');
    if (parts.length > 2) {
      return parts.slice(2).join('-');
    }
    return filename;
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

  const TaskProgressBar = () => {
    if (tasks.length === 0) {
      return (
        <div className="bg-white border border-divider rounded-[2rem] p-6 shadow-sm mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-black text-textMain uppercase tracking-widest flex items-center gap-1.5">
              <Zap size={12} className="text-primary" /> Workspace Health
            </span>
            <span className="text-[10px] font-black text-textMuted uppercase tracking-widest">No Active Tasks</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden border border-divider" />
        </div>
      );
    }

    const total = tasks.length;
    const todoCount = tasks.filter(t => t.status === 'TODO').length;
    const inProgressCount = tasks.filter(t => t.status === 'IN_PROGRESS').length;
    const reviewCount = tasks.filter(t => t.status === 'REVIEW').length;
    const approvedCount = tasks.filter(t => t.status === 'APPROVED' || t.status === 'COMPLETED').length;

    const todoPercent = (todoCount / total) * 100;
    const inProgressPercent = (inProgressCount / total) * 100;
    const reviewPercent = (reviewCount / total) * 100;
    const approvedPercent = (approvedCount / total) * 100;

    return (
      <div className="bg-white border border-divider rounded-[2rem] p-6 shadow-sm mb-6">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[10px] font-black text-textMain uppercase tracking-widest flex items-center gap-1.5">
            <Zap size={12} className="text-primary animate-pulse" /> Workspace Progress
          </span>
          <span className="text-[10px] font-black text-primary uppercase tracking-widest">
            {((approvedCount / total) * 100).toFixed(0)}% Shipped ({approvedCount}/{total} Tasks)
          </span>
        </div>

        {/* Dynamic Segmented Stacked Progress Bar */}
        <div className="w-full bg-gray-100 rounded-full h-3.5 overflow-hidden flex shadow-inner border border-divider">
          {todoPercent > 0 && (
            <div 
              style={{ width: `${todoPercent}%` }} 
              className="bg-rose-500 transition-all duration-500 cursor-pointer hover:opacity-90 animate-pulse"
              title={`To Do: ${todoCount} tasks (${todoPercent.toFixed(0)}%)`}
            />
          )}
          {inProgressPercent > 0 && (
            <div 
              style={{ width: `${inProgressPercent}%` }} 
              className="bg-amber-500 transition-all duration-500 cursor-pointer hover:opacity-90"
              title={`In Progress: ${inProgressCount} tasks (${inProgressPercent.toFixed(0)}%)`}
            />
          )}
          {reviewPercent > 0 && (
            <div 
              style={{ width: `${reviewPercent}%` }} 
              className="bg-yellow-400 transition-all duration-500 cursor-pointer hover:opacity-90"
              title={`Under Review: ${reviewCount} tasks (${reviewPercent.toFixed(0)}%)`}
            />
          )}
          {approvedPercent > 0 && (
            <div 
              style={{ width: `${approvedPercent}%` }} 
              className="bg-emerald-500 transition-all duration-500 cursor-pointer hover:opacity-90"
              title={`Approved: ${approvedCount} tasks (${approvedPercent.toFixed(0)}%)`}
            />
          )}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-divider text-center">
          <div className="flex items-center gap-2 justify-center bg-rose-50/50 py-1.5 px-3 rounded-xl border border-rose-100/50">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-[9px] font-black text-rose-700 uppercase tracking-widest">
              To Do ({todoCount})
            </span>
          </div>
          <div className="flex items-center gap-2 justify-center bg-amber-50/50 py-1.5 px-3 rounded-xl border border-amber-100/50">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-[9px] font-black text-amber-700 uppercase tracking-widest">
              In Progress ({inProgressCount})
            </span>
          </div>
          <div className="flex items-center gap-2 justify-center bg-yellow-50/50 py-1.5 px-3 rounded-xl border border-yellow-100/50">
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <span className="text-[9px] font-black text-yellow-700 uppercase tracking-widest">
              Review ({reviewCount})
            </span>
          </div>
          <div className="flex items-center gap-2 justify-center bg-emerald-50/50 py-1.5 px-3 rounded-xl border border-emerald-100/50">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">
              Approved ({approvedCount})
            </span>
          </div>
        </div>
      </div>
    );
  };

  const TasksPanel = () => {
    const columns = [
      { id: 'TODO',        title: 'To Do',        color: 'border-t-rose-500 bg-rose-50/10 text-rose-700', iconBg: 'bg-rose-500' },
      { id: 'IN_PROGRESS', title: 'In Progress',  color: 'border-t-amber-500 bg-amber-50/10 text-amber-700', iconBg: 'bg-amber-500' },
      { id: 'REVIEW',      title: 'Under Review', color: 'border-t-yellow-400 bg-yellow-50/10 text-yellow-700', iconBg: 'bg-yellow-400' },
      { id: 'APPROVED',    title: 'Approved',     color: 'border-t-emerald-500 bg-emerald-50/10 text-emerald-700', iconBg: 'bg-emerald-500' }
    ];

    const getPriorityBadge = (p) => {
      switch (p) {
        case 'URGENT':
          return 'bg-red-50 text-red-600 border-red-100';
        case 'HIGH':
          return 'bg-orange-50 text-orange-600 border-orange-100';
        case 'MEDIUM':
          return 'bg-blue-50 text-blue-600 border-blue-100';
        default:
          return 'bg-slate-50 text-slate-600 border-slate-100';
      }
    };

    const isCircleAdminOrOwner = circle.ownerId === user?.id || 
      circle.members?.some(m => m.userId === user?.id && m.role === 'ADMIN');

    return (
      <div className="space-y-6 pb-12">
        <div className="flex items-center justify-between">
           <div>
              <h3 className="text-xl font-black text-textMain tracking-tight">Project Tasks</h3>
              <p className="text-xs text-textMuted mt-0.5">Manage deliverables, deadlines, and approvals in real-time.</p>
           </div>
           <button 
             onClick={() => setIsTaskModalOpen(true)}
             className="bg-primary hover:bg-primaryHover text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center gap-2 transition"
           >
              <Plus size={14} /> New Task
           </button>
        </div>

        {/* Stacked Progress Bar */}
        <TaskProgressBar />

        {/* Kanban Board columns */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {columns.map(col => {
            const colTasks = tasks.filter(t => {
              if (col.id === 'APPROVED') {
                return t.status === 'APPROVED' || t.status === 'COMPLETED';
              }
              return t.status === col.id;
            });

            return (
              <div key={col.id} className={`flex flex-col bg-gray-50/50 border border-divider rounded-[2rem] p-4 border-t-4 ${col.color} min-h-[500px]`}>
                <div className="flex items-center justify-between mb-4 px-2">
                  <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${col.iconBg}`} /> {col.title}
                  </span>
                  <span className="text-[10px] font-black bg-white px-2 py-0.5 rounded-md border border-divider shadow-sm">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto no-scrollbar pr-0.5">
                  {colTasks.length === 0 && (
                    <div className="h-32 rounded-2xl border-2 border-dashed border-divider bg-white flex flex-col items-center justify-center text-center p-4">
                      <ListTodo size={20} className="text-textMuted opacity-20 mb-2" />
                      <p className="text-[8px] font-black text-textMuted uppercase tracking-widest">Empty</p>
                    </div>
                  )}

                  {colTasks.map(task => {
                    const isMyTask = task.assignedTo === user?.id;
                    return (
                      <div key={task.id} className="bg-white border border-divider rounded-2xl p-4 hover:border-primary transition group shadow-sm flex flex-col justify-between min-h-[160px]">
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${getPriorityBadge(task.priority)}`}>
                              {task.priority}
                            </span>
                            {task.deadline && (
                              <span className="text-[8px] font-black text-textMuted uppercase flex items-center gap-1">
                                <Calendar size={10} /> {new Date(task.deadline).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                          </div>
                          <h4 className="font-black text-textMain text-sm leading-snug group-hover:text-primary transition-colors">{task.title}</h4>
                          <p className="text-xs text-textMuted mt-1 line-clamp-3 leading-relaxed">{task.description || "No description provided."}</p>
                        </div>

                        <div className="pt-4 border-t border-divider mt-4 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {task.assignee ? (
                              <>
                                <img src={task.assignee.profileImage || `https://ui-avatars.com/api/?name=${task.assignee.username}`} className="w-5 h-5 rounded-md object-cover flex-shrink-0" />
                                <span className="text-[8px] font-black text-textMuted uppercase tracking-widest truncate">@{task.assignee.username}</span>
                              </>
                            ) : (
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Unassigned</span>
                            )}
                          </div>

                          <div className="flex gap-1">
                            {col.id === 'TODO' && isMyTask && (
                              <button 
                                onClick={() => updateTaskStatus(task.id, 'IN_PROGRESS')}
                                className="bg-primary hover:bg-primaryHover text-white px-2.5 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm transition"
                              >
                                <Zap size={10} /> Start
                              </button>
                            )}

                            {col.id === 'IN_PROGRESS' && isMyTask && (
                              <button 
                                onClick={() => updateTaskStatus(task.id, 'REVIEW')}
                                className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 px-2.5 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm transition"
                              >
                                <Check size={10} /> Finish
                              </button>
                            )}

                            {col.id === 'REVIEW' && (
                              isCircleAdminOrOwner ? (
                                <div className="flex gap-1">
                                  <button 
                                    onClick={() => updateTaskStatus(task.id, 'APPROVED')}
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white p-1.5 rounded-lg shadow-sm transition flex items-center justify-center"
                                    title="Approve Task"
                                  >
                                    <CheckCircle size={12} />
                                  </button>
                                  <button 
                                    onClick={() => updateTaskStatus(task.id, 'IN_PROGRESS')}
                                    className="bg-rose-500 hover:bg-rose-600 text-white p-1.5 rounded-lg shadow-sm transition flex items-center justify-center"
                                    title="Request Changes"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[8px] font-black text-yellow-600 uppercase tracking-widest px-2 py-1 bg-yellow-50 rounded-md border border-yellow-100">
                                  Awaiting Approval
                                </span>
                              )
                            )}

                            {col.id === 'APPROVED' && (
                              <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest px-2 py-1 bg-emerald-50 rounded-md border border-emerald-100 flex items-center gap-1">
                                <CheckCircle2 size={10} /> Shipped
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

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

  const FilesPanel = () => {
    const totalFiles = files.length;
    
    const getExt = (fileUrl) => {
      const filename = fileUrl.substring(fileUrl.lastIndexOf('/') + 1);
      return filename.substring(filename.lastIndexOf('.')).toLowerCase();
    };

    const isImage = (f) => f.type.startsWith('image/') || ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'].includes(getExt(f.fileUrl));
    const isVideo = (f) => f.type.startsWith('video/') || ['.mp4', '.mkv', '.avi', '.mov', '.webm'].includes(getExt(f.fileUrl));
    const isAudio = (f) => f.type.startsWith('audio/') || ['.mp3', '.wav', '.ogg', '.m4a'].includes(getExt(f.fileUrl));
    const isPdf = (f) => getExt(f.fileUrl) === '.pdf' || f.type === 'application/pdf';
    const isArchive = (f) => ['.zip', '.rar', '.tar', '.gz', '.7z'].includes(getExt(f.fileUrl));
    const isDoc = (f) => !isImage(f) && !isVideo(f) && !isAudio(f) && !isArchive(f);

    const imageCount = files.filter(isImage).length;
    const videoCount = files.filter(isVideo).length;
    const audioCount = files.filter(isAudio).length;
    const docCount = files.filter(f => isPdf(f) || isDoc(f)).length;
    const archiveCount = files.filter(isArchive).length;

    const filteredFiles = files.filter(file => {
      const originalName = getOriginalName(file.fileUrl).toLowerCase();
      const matchesSearch = originalName.includes(fileSearchQuery.toLowerCase());
      
      if (!matchesSearch) return false;

      switch (fileCategoryFilter) {
        case 'IMAGES':
          return isImage(file);
        case 'AUDIOS':
          return isAudio(file);
        case 'VIDEOS':
          return isVideo(file);
        case 'DOCUMENTS':
          return isPdf(file) || isDoc(file);
        case 'ARCHIVES':
          return isArchive(file);
        default:
          return true;
      }
    });

    const categoryTabs = [
      { id: 'ALL',       label: 'All Assets', count: totalFiles },
      { id: 'IMAGES',    label: 'Images',     count: imageCount },
      { id: 'AUDIOS',    label: 'Audio',      count: audioCount },
      { id: 'VIDEOS',    label: 'Video',      count: videoCount },
      { id: 'DOCUMENTS', label: 'Docs',       count: docCount },
      { id: 'ARCHIVES',  label: 'Archives',   count: archiveCount }
    ];

    return (
      <div className="space-y-6 pb-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-textMain tracking-tight">Circle File Vault</h3>
            <p className="text-xs text-textMuted mt-0.5">Secure shared assets and version control briefs.</p>
          </div>
          <div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
            />
            <button 
              onClick={() => fileInputRef.current?.click()} 
              disabled={uploading}
              className="bg-primary hover:bg-primaryHover text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center gap-2 transition disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-white" /> Uploading...
                </>
              ) : (
                <>
                  <Plus size={14} /> Upload File
                </>
              )}
            </button>
          </div>
        </div>

        {/* Dynamic File Statistics Panel */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-indigo-50/50 border border-indigo-100/50 p-3 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-[8px] font-black text-indigo-600 uppercase tracking-widest">Images</p>
              <p className="text-lg font-black text-indigo-900 mt-0.5">{imageCount}</p>
            </div>
            <Image size={24} className="text-indigo-400 opacity-80" />
          </div>
          <div className="bg-emerald-50/50 border border-emerald-100/50 p-3 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Audio</p>
              <p className="text-lg font-black text-emerald-900 mt-0.5">{audioCount}</p>
            </div>
            <Music size={24} className="text-emerald-400 opacity-80" />
          </div>
          <div className="bg-pink-50/50 border border-pink-100/50 p-3 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-[8px] font-black text-pink-600 uppercase tracking-widest">Video</p>
              <p className="text-lg font-black text-pink-900 mt-0.5">{videoCount}</p>
            </div>
            <Video size={24} className="text-pink-400 opacity-80" />
          </div>
          <div className="bg-rose-50/50 border border-rose-100/50 p-3 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-[8px] font-black text-rose-600 uppercase tracking-widest">Documents</p>
              <p className="text-lg font-black text-rose-900 mt-0.5">{docCount}</p>
            </div>
            <FileText size={24} className="text-rose-400 opacity-80" />
          </div>
          <div className="bg-amber-50/50 border border-amber-100/50 p-3 rounded-2xl flex items-center justify-between col-span-2 sm:col-span-1">
            <div>
              <p className="text-[8px] font-black text-amber-600 uppercase tracking-widest">Archives</p>
              <p className="text-lg font-black text-amber-900 mt-0.5">{archiveCount}</p>
            </div>
            <Layers size={24} className="text-amber-400 opacity-80" />
          </div>
        </div>

        {/* Control Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0">
            {categoryTabs.map(tab => (
              <button 
                key={tab.id}
                onClick={() => setFileCategoryFilter(tab.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition ${
                  fileCategoryFilter === tab.id 
                    ? 'bg-primary border-primary text-white shadow-md shadow-primary/20' 
                    : 'bg-white border-divider text-textMuted hover:text-textMain'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 md:w-64">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-textMuted" />
              <input 
                type="text" 
                value={fileSearchQuery}
                onChange={e => setFileSearchQuery(e.target.value)}
                placeholder="Search assets..."
                className="w-full bg-white border border-divider rounded-xl pl-10 pr-4 py-2 text-xs font-bold focus:border-primary outline-none transition shadow-sm"
              />
              {fileSearchQuery && (
                <button 
                  onClick={() => setFileSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-textMuted hover:text-textMain transition"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <div className="flex bg-white p-1 rounded-xl border border-divider shadow-sm">
              <button 
                onClick={() => setFileLayout('grid')}
                className={`p-1.5 rounded-lg transition ${fileLayout === 'grid' ? 'bg-gray-100 text-primary' : 'text-textMuted hover:text-textMain'}`}
                title="Grid View"
              >
                <Grid size={14} />
              </button>
              <button 
                onClick={() => setFileLayout('list')}
                className={`p-1.5 rounded-lg transition ${fileLayout === 'list' ? 'bg-gray-100 text-primary' : 'text-textMuted hover:text-textMain'}`}
                title="List View"
              >
                <List size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Files Listings */}
        {filteredFiles.length === 0 ? (
          <div className="py-20 text-center bg-gray-50 rounded-[2rem] border-2 border-dashed border-divider">
            <FileText size={40} className="text-textMuted mx-auto mb-4 opacity-20" />
            <p className="text-textMuted font-black uppercase text-[10px] tracking-widest mb-1">
              {fileSearchQuery || fileCategoryFilter !== 'ALL' ? 'No matching files' : 'Vault is empty'}
            </p>
            <p className="text-xs text-textMuted max-w-xs mx-auto">
              {fileSearchQuery || fileCategoryFilter !== 'ALL' 
                ? 'Try adjusting your search filters.' 
                : 'Upload assets, design brief PDF sheets, audio drafts, or media packages to sync.'}
            </p>
          </div>
        ) : fileLayout === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {uploading && (
              <div className="border border-primary border-dashed bg-primary/5 rounded-2xl p-5 flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-xl text-primary">
                    <FileText size={24} className="animate-bounce" />
                  </div>
                  <div>
                    <p className="font-black text-textMain text-sm">Uploading file...</p>
                    <p className="text-xs text-textMuted mt-0.5">Encrypting Vault Slot</p>
                  </div>
                </div>
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-primary" />
              </div>
            )}

            {filteredFiles.map(file => {
              const { icon: Icon, color } = getFileIcon(file.type, file.fileUrl);
              const originalName = getOriginalName(file.fileUrl);
              const isMyFile = file.uploadedBy === user?.id;
              const isCircleOwner = circle.ownerId === user?.id;

              return (
                <div key={file.id} className="bg-white border border-divider rounded-2xl p-5 hover:border-primary transition-all group flex flex-col justify-between shadow-sm hover:shadow-md">
                  <div className="flex items-start gap-4">
                    <div className={`p-3.5 rounded-xl border ${color} flex-shrink-0`}>
                      <Icon size={24} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-black text-textMain text-sm truncate group-hover:text-primary transition-colors" title={originalName}>
                        {originalName}
                      </h4>
                      <p className="text-[10px] font-black text-textMuted uppercase tracking-widest mt-1">
                        Uploaded by @{file.uploader?.username || 'member'}
                      </p>
                      <p className="text-[9px] text-textMuted mt-0.5">
                        {new Date(file.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-divider mt-4">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-2 py-0.5 bg-slate-100 rounded-md">
                      v{file.version}
                    </span>
                    <div className="flex gap-2">
                      <a 
                        href={file.fileUrl} 
                        download={originalName} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-2 hover:bg-gray-50 rounded-lg text-textMuted hover:text-primary transition flex items-center justify-center border border-divider"
                        title="Download File"
                      >
                        <Download size={14} />
                      </a>
                      {(isMyFile || isCircleOwner) && (
                        <button 
                          onClick={() => handleFileDelete(file.id)}
                          className="p-2 hover:bg-rose-50 rounded-lg text-textMuted hover:text-rose-600 transition flex items-center justify-center border border-divider"
                          title="Delete File"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-divider rounded-[2rem] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-divider">
                    <th className="px-6 py-4 text-[9px] font-black text-textMuted uppercase tracking-widest">Name</th>
                    <th className="px-6 py-4 text-[9px] font-black text-textMuted uppercase tracking-widest">Shared By</th>
                    <th className="px-6 py-4 text-[9px] font-black text-textMuted uppercase tracking-widest">Uploaded Date</th>
                    <th className="px-6 py-4 text-[9px] font-black text-textMuted uppercase tracking-widest">Version</th>
                    <th className="px-6 py-4 text-[9px] font-black text-textMuted uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider">
                  {uploading && (
                    <tr className="animate-pulse bg-primary/5">
                      <td className="px-6 py-4 flex items-center gap-3 font-bold text-xs text-textMain">
                        <FileText size={18} className="text-primary animate-bounce" /> Uploading in progress...
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-textMuted">-</td>
                      <td className="px-6 py-4 text-xs font-semibold text-textMuted">-</td>
                      <td className="px-6 py-4 text-xs font-semibold text-textMuted">v1</td>
                      <td className="px-6 py-4 text-right">-</td>
                    </tr>
                  )}
                  {filteredFiles.map(file => {
                    const { icon: Icon, color } = getFileIcon(file.type, file.fileUrl);
                    const originalName = getOriginalName(file.fileUrl);
                    const isMyFile = file.uploadedBy === user?.id;
                    const isCircleOwner = circle.ownerId === user?.id;

                    return (
                      <tr key={file.id} className="hover:bg-gray-50/50 transition-all group">
                        <td className="px-6 py-4 min-w-0">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg border ${color} flex-shrink-0`}>
                              <Icon size={16} />
                            </div>
                            <span className="font-bold text-textMain text-xs truncate max-w-xs block group-hover:text-primary transition" title={originalName}>
                              {originalName}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <img src={file.uploader?.profileImage || `https://ui-avatars.com/api/?name=${file.uploader?.username}`} className="w-5 h-5 rounded-md object-cover" />
                            <span className="text-[10px] font-black text-textMuted uppercase tracking-widest">@{file.uploader?.username}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-textMuted">
                          {new Date(file.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest px-2 py-0.5 bg-slate-100 rounded-md">
                            v{file.version}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <a 
                              href={file.fileUrl} 
                              download={originalName} 
                              target="_blank" 
                              rel="noreferrer"
                              className="p-1.5 hover:bg-gray-100 rounded-lg text-textMuted hover:text-primary transition flex items-center justify-center border border-divider"
                              title="Download File"
                            >
                              <Download size={12} />
                            </a>
                            {(isMyFile || isCircleOwner) && (
                              <button 
                                onClick={() => handleFileDelete(file.id)}
                                className="p-1.5 hover:bg-rose-50 rounded-lg text-textMuted hover:text-rose-600 transition flex items-center justify-center border border-divider"
                                title="Delete File"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  const TABS = [
    { id: 'OVERVIEW', label: 'Overview', icon: Info },
    { id: 'FILES',    label: 'Files',    icon: FileText },
    { id: 'TASKS',    label: 'Tasks',    icon: ListTodo },
    { id: 'UPDATES',  label: 'Updates',  icon: MessageSquare }
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
               {activeTab === 'FILES' && <FilesPanel />}
               {activeTab === 'TASKS' && <TasksPanel />}
               {activeTab === 'UPDATES' && <div className="h-[calc(100svh-18rem)]"><ChatPanel /></div>}
             </motion.div>
           </AnimatePresence>
        </div>

        {/* Desktop View */}
        <div className="hidden md:flex flex-col h-[calc(100vh-280px)]">
           {/* Tab Selector Desktop */}
           <div className="flex gap-2 mb-8 bg-gray-50/50 p-1.5 rounded-2xl border border-divider w-fit flex-shrink-0">
              {TABS.map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white text-primary shadow-sm' : 'text-textMuted hover:text-textMain'}`}
                >
                   {tab.label}
                </button>
              ))}
           </div>
           
           <div className={`flex-1 min-h-0 pr-2 ${activeTab === 'UPDATES' ? '' : 'overflow-y-auto no-scrollbar'}`}>
              {activeTab === 'OVERVIEW' && <OverviewPanel />}
              {activeTab === 'FILES' && <FilesPanel />}
              {activeTab === 'TASKS' && <TasksPanel />}
              {activeTab === 'UPDATES' && <div className="h-full max-w-4xl mx-auto"><ChatPanel /></div>}
           </div>
        </div>
      </div>

      {/* Task Creation Modal */}
      <AnimatePresence>
        {isTaskModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white border border-divider rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden"
            >
              <div className="p-6 md:p-8 border-b border-divider bg-gray-50/80 backdrop-blur-sm flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-textMain tracking-tight">Create Workspace Task</h3>
                  <p className="text-xs text-textMuted mt-0.5">Assign deliverables to creatives in this circle.</p>
                </div>
                <button 
                  onClick={() => setIsTaskModalOpen(false)}
                  className="p-2 hover:bg-gray-200/50 rounded-xl text-textMuted transition"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="p-6 md:p-8 space-y-5">
                <div>
                  <label className="block text-[9px] font-black text-textMuted uppercase tracking-widest mb-2">Task Title</label>
                  <input 
                    type="text" 
                    required
                    value={taskTitle}
                    onChange={e => setTaskTitle(e.target.value)}
                    placeholder="e.g. Design Home Hero Section"
                    className="w-full bg-gray-50 border border-divider rounded-xl px-4 py-3 text-sm focus:border-primary focus:bg-white outline-none transition font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-black text-textMuted uppercase tracking-widest mb-2">Description</label>
                  <textarea 
                    value={taskDesc}
                    onChange={e => setTaskDesc(e.target.value)}
                    rows={3}
                    placeholder="Specify requirements, deliverables, or inspiration..."
                    className="w-full bg-gray-50 border border-divider rounded-xl px-4 py-3 text-sm focus:border-primary focus:bg-white outline-none transition font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-black text-textMuted uppercase tracking-widest mb-2">Priority</label>
                    <select 
                      value={taskPriority}
                      onChange={e => setTaskPriority(e.target.value)}
                      className="w-full bg-gray-50 border border-divider rounded-xl px-4 py-3 text-sm focus:border-primary focus:bg-white outline-none transition font-bold"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-textMuted uppercase tracking-widest mb-2">Deadline</label>
                    <input 
                      type="date" 
                      value={taskDeadline}
                      onChange={e => setTaskDeadline(e.target.value)}
                      className="w-full bg-gray-50 border border-divider rounded-xl px-4 py-3 text-sm focus:border-primary focus:bg-white outline-none transition font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-black text-textMuted uppercase tracking-widest mb-2">Assign Creative</label>
                  <select 
                    value={taskAssignee}
                    onChange={e => setTaskAssignee(e.target.value)}
                    className="w-full bg-gray-50 border border-divider rounded-xl px-4 py-3 text-sm focus:border-primary focus:bg-white outline-none transition font-bold"
                  >
                    <option value="">Unassigned</option>
                    {circle.members?.map(m => (
                      <option key={m.userId} value={m.userId}>
                        {m.user?.username || 'member'} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsTaskModalOpen(false)}
                    className="flex-1 py-3.5 bg-gray-50 border border-divider rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={taskSaving}
                    className="flex-1 py-3.5 bg-primary hover:bg-primaryHover text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/25 disabled:opacity-50 transition"
                  >
                    {taskSaving ? 'Saving...' : 'Create Task'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CircleWorkspace;
