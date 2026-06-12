import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ChevronLeft, Shield, MessageSquare, Users, Plus,
  Send, Paperclip, Clock, Calendar, Check, CheckCircle,
  MoreHorizontal, Info, Target, Layers, ListTodo, 
  FileText, ArrowRight, Trash2, Edit2, Zap,
  Image, Video, Music, Download, X, Search,
  Grid, List, AlertTriangle, CheckCircle2,
  Share2, Tag, ChevronDown, ArrowUpRight, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../store/useAuthStore';
import FilesHub from './FilesHub';
import InviteMemberModal from '../components/InviteMemberModal';

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
  const [error, setError]       = useState(null);
  const [sending, setSending]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('OVERVIEW');
  const [respondingInvite, setRespondingInvite] = useState(false);
  const scrollRef = useRef(null);
  const pollRef   = useRef(null);
  const fileInputRef = useRef(null);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isRecruitMenuOpen, setIsRecruitMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [tasksLayout, setTasksLayout]         = useState('board');
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [taskAssigneeFilter, setTaskAssigneeFilter] = useState('ALL');
  const [taskPriorityFilter, setTaskPriorityFilter] = useState('ALL');
  const [taskLabelFilter, setTaskLabelFilter]       = useState('ALL');
  const [taskMyTasksOnly, setTaskMyTasksOnly]       = useState(false);
  const [taskSortField, setTaskSortField]           = useState('createdAt');
  const [taskSortOrder, setTaskSortOrder]           = useState('desc');
  const [taskDueDateFilter, setTaskDueDateFilter]   = useState('ALL');

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle]             = useState('');
  const [taskDesc, setTaskDesc]               = useState('');
  const [taskPriority, setTaskPriority]       = useState('MEDIUM');
  const [taskAssignee, setTaskAssignee]       = useState('');
  const [taskDeadline, setTaskDeadline]       = useState('');
  const [taskEffort, setTaskEffort]           = useState('');
  const [taskLabels, setTaskLabels]           = useState('');
  const [taskSaving, setTaskSaving]           = useState(false);

  const [selectedTask, setSelectedTask]       = useState(null);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle]   = useState(false);
  const [detailTitle, setDetailTitle]         = useState('');
  const [detailDesc, setDetailDesc]           = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [commentInput, setCommentInput]       = useState('');

  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [pendingRejectionTask, setPendingRejectionTask] = useState(null);
  const [pendingRejectionStatus, setPendingRejectionStatus] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const [fileSearchQuery, setFileSearchQuery]       = useState('');
  const [fileCategoryFilter, setFileCategoryFilter] = useState('ALL');
  const [fileLayout, setFileLayout]                 = useState('grid');

  const headers = { Authorization: `Bearer ${token}` };

  const fetchCircleData = useCallback(async () => {
    try {
      setError(null);
      const circleRes = await axios.get(`/api/circles/${id}`, { headers });
      setCircle(circleRes.data);
      setMessages(circleRes.data.messages || []);
      
      const tasksRes = await axios.get(`/api/circles/${id}/tasks`, { headers });
      setTasks(tasksRes.data);

      const filesRes = await axios.get(`/api/circles/${id}/files`, { headers });
      setFiles(filesRes.data);
    } catch (err) {
      console.error('Circle fetch error:', err.response?.data || err.message);
      setError(err.response?.data?.details || err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    fetchCircleData();
    pollRef.current = setInterval(fetchCircleData, 5000);
    return () => clearInterval(pollRef.current);
  }, [fetchCircleData]);

  const handleRespondFromPreview = async (action) => {
    if (!circle?.invitationId) return;
    setRespondingInvite(true);
    try {
      await axios.patch(`/api/circles/invites/${circle.invitationId}`, { status: action }, { headers });
      if (action === 'ACCEPTED') {
        await fetchCircleData();
      } else {
        navigate('/circles');
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to respond to invitation');
      console.error(err);
    } finally {
      setRespondingInvite(false);
    }
  };

  useEffect(() => {
    if (tasks.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const taskId = params.get('task');
      if (taskId) {
        const found = tasks.find(t => t.id === taskId);
        if (found) {
          setSelectedTask(found);
          setDetailTitle(found.title);
          setDetailDesc(found.description || '');
          setIsDetailPanelOpen(true);
        }
      }
    }
  }, [tasks]);

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

  const updateTaskStatus = async (taskId, newStatus, reason = null) => {
    try {
      const res = await axios.patch(`/api/tasks/${taskId}`, { 
        status: newStatus, 
        rejectionComment: reason 
      }, { headers });
      setTasks(prev => prev.map(t => t.id === taskId ? res.data : t));
      if (selectedTask?.id === taskId) {
        setSelectedTask(res.data);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update task status');
      console.error('Task update error:', err);
    }
  };

  const updateTaskDetails = async (taskId, fields) => {
    try {
      const res = await axios.patch(`/api/tasks/${taskId}`, fields, { headers });
      setTasks(prev => prev.map(t => t.id === taskId ? res.data : t));
      if (selectedTask?.id === taskId) {
        setSelectedTask(res.data);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update task details');
      console.error('Task update details error:', err);
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
        deadline: taskDeadline || null,
        estimatedEffort: taskEffort ? parseInt(taskEffort) : null,
        labels: taskLabels.trim()
      }, { headers });

      setTasks(prev => [res.data, ...prev]);
      setTaskTitle('');
      setTaskDesc('');
      setTaskPriority('MEDIUM');
      setTaskAssignee('');
      setTaskDeadline('');
      setTaskEffort('');
      setTaskLabels('');
      setIsTaskModalOpen(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create task');
      console.error('Task creation error:', err);
    } finally {
      setTaskSaving(false);
    }
  };

  const handleAddSubtask = async (e) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || !selectedTask) return;
    try {
      const res = await axios.post(`/api/circles/${id}/tasks`, {
        title: newSubtaskTitle.trim(),
        parentId: selectedTask.id,
        circleId: id
      }, { headers });
      
      const tasksRes = await axios.get(`/api/circles/${id}/tasks`, { headers });
      setTasks(tasksRes.data);
      
      const updatedParent = tasksRes.data.find(t => t.id === selectedTask.id);
      if (updatedParent) {
        setSelectedTask(updatedParent);
      }
      setNewSubtaskTitle('');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create subtask');
    }
  };

  const handleAddTaskComment = async (e) => {
    e.preventDefault();
    if (!commentInput.trim() || !selectedTask) return;
    try {
      const res = await axios.post(`/api/tasks/${selectedTask.id}/comments`, {
        content: commentInput.trim()
      }, { headers });
      
      setSelectedTask(prev => ({
        ...prev,
        comments: [...(prev.comments || []), res.data]
      }));
      
      setTasks(prev => prev.map(t => t.id === selectedTask.id ? { 
        ...t, 
        comments: [...(t.comments || []), res.data], 
        _count: { ...t._count, comments: (t._count?.comments || 0) + 1 } 
      } : t));
      setCommentInput('');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add comment');
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
      return { icon: Image, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' };
    }
    if (mimeType.startsWith('video/') || ['.mp4', '.mkv', '.avi', '.mov', '.webm'].includes(ext)) {
      return { icon: Video, color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' };
    }
    if (mimeType.startsWith('audio/') || ['.mp3', '.wav', '.ogg', '.m4a'].includes(ext)) {
      return { icon: Music, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
    }
    if (ext === '.pdf') {
      return { icon: FileText, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' };
    }
    if (['.zip', '.rar', '.tar', '.gz', '.7z'].includes(ext)) {
      return { icon: Layers, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
    }
    return { icon: FileText, color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' };
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#7B5CFA]" />
        <p className="text-[var(--text-secondary)] text-sm font-medium">Powering up workspace...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-4 px-4 text-center">
        <div className="text-xl font-black text-red-500 tracking-tight">Failed to Load Workspace</div>
        <p className="text-[var(--text-secondary)] text-sm max-w-md">
          {error}
        </p>
        <button 
          onClick={() => { setError(null); setLoading(true); fetchCircleData(); }} 
          className="btn-primary py-3 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest mt-2 shadow-[0_0_15px_rgba(123,92,250,0.3)]"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!circle) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-4 px-4 text-center">
        <div className="text-xl font-black text-[var(--text-primary)] tracking-tight">Circle Not Found</div>
        <p className="text-[var(--text-secondary)] text-sm max-w-md">
          We couldn't retrieve the details for this workspace. It might have been deleted, or you might not have permission to access it.
        </p>
        <button 
          onClick={() => navigate('/circles')} 
          className="btn-primary py-3 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest mt-2 shadow-[0_0_15px_rgba(123,92,250,0.3)]"
        >
          Go Back to Circles
        </button>
      </div>
    );
  }

  if (circle && circle.hasPendingInvitation) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
        <div className="bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] rounded-[2.5rem] overflow-hidden shadow-2xl relative">
          
          <div className="h-48 relative bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900 flex items-end p-6">
            {circle.coverImage && (
              <img 
                src={circle.coverImage} 
                alt="Circle Cover" 
                className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-surface-alt)] to-transparent" />
            
            <div className="relative z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#7B5CFA]/25 border border-[#7B5CFA]/40 text-[#a78bfa] text-[10px] font-black uppercase tracking-widest rounded-full mb-3">
                <Shield size={10} /> Pending Invitation
              </span>
              <h1 className="text-3xl md:text-4xl font-black text-[var(--text-primary)] tracking-tighter leading-none">
                {circle.title}
              </h1>
            </div>
          </div>

          <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              <div className="md:col-span-8 space-y-4">
                <h3 className="text-xs font-black text-[#7B5CFA] uppercase tracking-widest flex items-center gap-2">
                  <Target size={12} /> Project Overview
                </h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {circle.description || "No description provided for this circle."}
                </p>
                
                <div className="flex gap-4 pt-4">
                  <div className="bg-[var(--bg-sunken)] px-4 py-3 rounded-2xl border border-[var(--border-primary)] flex-1">
                    <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Category</p>
                    <p className="text-sm font-bold text-[var(--text-primary)]">{circle.category}</p>
                  </div>
                  <div className="bg-[var(--bg-sunken)] px-4 py-3 rounded-2xl border border-[var(--border-primary)] flex-1">
                    <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Visibility</p>
                    <p className="text-sm font-bold text-[var(--text-primary)]">{circle.visibility}</p>
                  </div>
                </div>
              </div>

              <div className="md:col-span-4 bg-[var(--bg-sunken)] p-6 rounded-[2rem] border border-[var(--border-primary)] h-fit space-y-4">
                <h4 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Invited By</h4>
                <div className="flex items-center gap-3">
                  <img 
                    src={circle.owner?.profileImage || `https://ui-avatars.com/api/?name=${circle.owner?.username}`} 
                    className="w-12 h-12 rounded-2xl object-cover border border-[var(--border-primary)]" 
                    alt="Owner avatar"
                  />
                  <div>
                    <h5 className="font-bold text-[var(--text-primary)] text-sm">{circle.owner?.username}</h5>
                    <p className="text-[10px] text-[#34D399] font-black uppercase tracking-widest">Circle Owner</p>
                  </div>
                </div>
              </div>
            </div>

            {circle.members && circle.members.length > 0 && (
              <div className="border-t border-[var(--border-primary)] pt-6 space-y-4">
                <h3 className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest">
                  Circle Members ({circle.members.length})
                </h3>
                <div className="flex flex-wrap gap-3">
                  {circle.members.map((m, i) => (
                    <div 
                      key={i} 
                      className="flex items-center gap-2 bg-[var(--bg-sunken)] border border-[var(--border-primary)] rounded-full pl-1.5 pr-4.5 py-1.5"
                    >
                      <img 
                        src={m.user?.profileImage || `https://ui-avatars.com/api/?name=${m.user?.username}`} 
                        className="w-7 h-7 rounded-full object-cover" 
                        alt={m.user?.username}
                      />
                      <div>
                        <span className="text-xs font-black text-[var(--text-primary)]">{m.user?.username}</span>
                        <span className="text-[8px] text-[var(--text-muted)] font-black uppercase tracking-wider ml-1.5">
                          {m.role}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-[var(--border-primary)] pt-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div>
                <h4 className="font-black text-[var(--text-primary)] text-base tracking-tight mb-1">
                  Ready to join the collaboration?
                </h4>
                <p className="text-xs text-[var(--text-secondary)] font-medium">
                  Accepting will add you as a contributor to this circle workspace.
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  disabled={respondingInvite}
                  onClick={() => handleRespondFromPreview('REJECTED')}
                  className="w-full sm:w-auto px-6 py-3 bg-[var(--bg-sunken)] hover:bg-red-500/10 hover:text-red-500 text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all border border-[var(--border-primary)] hover:border-red-500/30"
                >
                  Decline
                </button>
                <button
                  disabled={respondingInvite}
                  onClick={() => handleRespondFromPreview('ACCEPTED')}
                  className="w-full sm:w-auto px-8 py-3 bg-[#7B5CFA] hover:bg-[#684CE0] disabled:bg-purple-800 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-[#7B5CFA]/20 flex items-center justify-center gap-2"
                >
                  {respondingInvite ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-white" />
                  ) : (
                    <>
                      Accept & Join <ArrowRight size={12} />
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>
    );
  }

  // ── Component Panels ────────────────────────────────

  const OverviewPanel = () => (
    <div className="space-y-6 pb-12">
      <div className="bg-[var(--bg-surface-alt)] rounded-2xl p-7 border border-[var(--border-primary)]">
        <div className="flex items-center gap-2 text-[#7B5CFA] text-[10px] font-bold uppercase tracking-widest mb-4">
          <Target size={13} /> Project Vision
        </div>
        <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight mb-3">{circle.title}</h2>
        <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
          {circle.description || "Establish a clear vision for this collaboration by adding a project description."}
        </p>
        
        <div className="mt-7 pt-6 border-t border-[var(--border-primary)] grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-[var(--bg-base)] p-4 rounded-xl border border-[var(--border-primary)]">
             <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1.5">Status</p>
             <p className="text-xs font-bold text-[#34D399]">{circle.status}</p>
          </div>
          <div className="bg-[var(--bg-base)] p-4 rounded-xl border border-[var(--border-primary)]">
             <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1.5">Category</p>
             <p className="text-xs font-bold text-[var(--text-primary)]">{circle.category}</p>
          </div>
          <div className="bg-[var(--bg-base)] p-4 rounded-xl border border-[var(--border-primary)]">
             <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1.5">Members</p>
             <p className="text-xs font-bold text-[var(--text-primary)]">{circle.members?.length || 0}</p>
          </div>
          <div className="bg-[var(--bg-base)] p-4 rounded-xl border border-[var(--border-primary)]">
             <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1.5">Tasks</p>
             <p className="text-xs font-bold text-[var(--text-primary)]">{tasks.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-[var(--bg-surface-alt)] rounded-2xl p-7 border border-[var(--border-primary)]">
           <div className="flex items-center justify-between mb-5 relative">
              <h3 className="font-bold text-[var(--text-primary)] text-sm">Active Team</h3>
              
              {/* Recruit Dropdown */}
              <div className="relative z-[100]">
                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsRecruitMenuOpen(!isRecruitMenuOpen);
                  }}
                  className="text-sm font-black text-white bg-[#7B5CFA] hover:bg-[#6B4CE0] px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-xl shadow-[#7B5CFA]/30"
                >
                  + Recruit <ChevronDown size={16} className={`transition-transform ${isRecruitMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isRecruitMenuOpen && (
                  <div 
                    className="absolute right-0 top-full mt-2 w-48 bg-[var(--bg-base)] border border-[var(--border-primary)] rounded-xl shadow-xl z-50 overflow-hidden"
                  >
                    <button 
                      onClick={() => {
                        setIsRecruitMenuOpen(false);
                        setIsInviteModalOpen(true);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--bg-surface)] transition text-[11px] font-bold text-[var(--text-primary)]"
                    >
                      <Users size={14} className="text-[#34D399]" />
                      Invite from Network
                    </button>
                    <div className="h-px bg-[var(--border-primary)]" />
                    <button 
                      onClick={() => {
                        setIsRecruitMenuOpen(false);
                        navigate(`/collabs/new?circleId=${id}`);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--bg-surface)] transition text-[11px] font-bold text-[var(--text-primary)]"
                    >
                      <Target size={14} className="text-[#FFAB4C]" />
                      Create Collab Listing
                    </button>
                  </div>
                )}
              </div>
           </div>
           <div className="space-y-3.5">
              {circle.members?.map((m, i) => (
                <div key={i} className="flex items-center gap-3">
                   <img src={m.user?.profileImage || `https://ui-avatars.com/api/?name=${m.user?.username}`} className="w-9 h-9 rounded-lg object-cover" />
                   <div>
                      <p className="font-bold text-[var(--text-primary)] text-[13px]">{m.user?.username}</p>
                      <p className="text-[10px] text-[var(--text-muted)] font-medium">{m.role}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>
        
        <div className="bg-gradient-to-br from-[#1E1B4B] to-[#181D2A] rounded-2xl p-7 relative overflow-hidden border border-[#7B5CFA]/10">
           <Zap className="absolute -top-4 -right-4 w-24 h-24 text-[#7B5CFA]/10" />
           <h3 className="font-bold text-[var(--text-primary)] text-sm mb-2">Upcoming Deadline</h3>
           <p className="text-[13px] text-[var(--text-secondary)] mb-6 leading-relaxed">No immediate deadlines set. Add milestones to track progress.</p>
           <button className="w-full py-3 bg-white/[0.05] border border-[var(--border-primary)] rounded-xl text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest hover:bg-white/[0.08] hover:text-[var(--text-primary)] transition">
              Set Milestone
           </button>
        </div>
      </div>
    </div>
  );

  const TaskProgressBar = () => {
    if (tasks.length === 0) return null;

    const total = tasks.filter(t => !t.parentId).length;
    const approvedCount = tasks.filter(t => !t.parentId && (t.status === 'APPROVED' || t.status === 'COMPLETED')).length;
    const progressPercent = total > 0 ? (approvedCount / total) * 100 : 0;

    const todoCount = tasks.filter(t => !t.parentId && t.status === 'TODO').length;
    const inProgressCount = tasks.filter(t => !t.parentId && t.status === 'IN_PROGRESS').length;
    const reviewCount = tasks.filter(t => !t.parentId && t.status === 'REVIEW').length;

    const todoPercent = total > 0 ? (todoCount / total) * 100 : 0;
    const inProgressPercent = total > 0 ? (inProgressCount / total) * 100 : 0;
    const reviewPercent = total > 0 ? (reviewCount / total) * 100 : 0;
    const approvedPercent = total > 0 ? (approvedCount / total) * 100 : 0;

    return (
      <div className="bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] rounded-xl p-4 mb-5">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
            <Zap size={12} className="text-[#7B5CFA]" /> Sprint Progress
          </span>
          <span className="text-[11px] font-bold text-[#7B5CFA]">
            {progressPercent.toFixed(0)}% complete · {approvedCount}/{total}
          </span>
        </div>
        
        <div className="relative w-full bg-white/[0.04] rounded-full h-1.5 overflow-hidden flex">
          {approvedPercent > 0 && <div style={{ width: `${approvedPercent}%` }} className="bg-[#34D399] h-full transition-all duration-500" />}
          {reviewPercent > 0 && <div style={{ width: `${reviewPercent}%` }} className="bg-[#A78BFA] h-full transition-all duration-500" />}
          {inProgressPercent > 0 && <div style={{ width: `${inProgressPercent}%` }} className="bg-[#FFAB4C] h-full transition-all duration-500" />}
          {todoPercent > 0 && <div style={{ width: `${todoPercent}%` }} className="bg-[#FF6B6B] h-full transition-all duration-500" />}
        </div>
        
        <div className="flex items-center gap-4 mt-3 text-[9px] font-medium text-[var(--text-muted)]">
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#FF6B6B]" /> To Do {todoCount}</span>
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#FFAB4C]" /> Active {inProgressCount}</span>
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#A78BFA]" /> Review {reviewCount}</span>
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#34D399]" /> Done {approvedCount}</span>
        </div>
      </div>
    );
  };

  const TasksPanel = () => {
    const columns = [
      { id: 'TODO',        title: 'To Do',        accent: '#FF6B6B', dotBg: 'bg-[#FF6B6B]' },
      { id: 'IN_PROGRESS', title: 'In Progress',  accent: '#FFAB4C', dotBg: 'bg-[#FFAB4C]' },
      { id: 'REVIEW',      title: 'In Review',    accent: '#A78BFA', dotBg: 'bg-[#A78BFA]' },
      { id: 'APPROVED',    title: 'Done',          accent: '#34D399', dotBg: 'bg-[#34D399]' }
    ];

    const getPriorityStyle = (p) => {
      switch (p) {
        case 'URGENT': return { badge: 'bg-[#FF4757]/10 text-[#FF4757] border-[#FF4757]/20', strip: '#FF4757', label: 'Urgent' };
        case 'HIGH':   return { badge: 'bg-[#FF6348]/10 text-[#FF6348] border-[#FF6348]/20', strip: '#FF6348', label: 'High' };
        case 'MEDIUM': return { badge: 'bg-[#7B5CFA]/10 text-[#7B5CFA] border-[#7B5CFA]/20', strip: '#7B5CFA', label: 'Medium' };
        default:       return { badge: 'bg-white/[0.04] text-[var(--text-muted)] border-[var(--border-primary)]', strip: '#5A6478', label: 'Low' };
      }
    };

    const getStatusStyle = (s) => {
      switch (s) {
        case 'APPROVED':
        case 'COMPLETED':  return 'bg-[#34D399]/10 text-[#34D399] border-[#34D399]/20';
        case 'REVIEW':     return 'bg-[#A78BFA]/10 text-[#A78BFA] border-[#A78BFA]/20';
        case 'IN_PROGRESS': return 'bg-[#FFAB4C]/10 text-[#FFAB4C] border-[#FFAB4C]/20';
        default:            return 'bg-[#FF6B6B]/10 text-[#FF6B6B] border-[#FF6B6B]/20';
      }
    };

    const distinctTags = Array.from(new Set(
      tasks
        .map(t => t.labels || '')
        .flatMap(l => l.split(','))
        .map(s => s.trim())
        .filter(s => s.length > 0)
    ));

    const filteredTasks = tasks.filter(t => {
      if (t.parentId) return false;
      const query = taskSearchQuery.toLowerCase().trim();
      const matchesSearch = !query || 
        t.taskCode?.toLowerCase().includes(query) ||
        t.title.toLowerCase().includes(query) ||
        (t.description && t.description.toLowerCase().includes(query));
      const matchesAssignee = taskAssigneeFilter === 'ALL' || t.assignedTo === taskAssigneeFilter;
      const matchesPriority = taskPriorityFilter === 'ALL' || t.priority === taskPriorityFilter;
      const matchesLabel = taskLabelFilter === 'ALL' || 
        (t.labels && t.labels.split(',').map(s => s.trim().toLowerCase()).includes(taskLabelFilter.toLowerCase()));
      const matchesMyTasks = !taskMyTasksOnly || t.assignedTo === user?.id;
      let matchesDueDate = true;
      if (taskDueDateFilter === 'OVERDUE') {
        matchesDueDate = t.deadline && new Date(t.deadline) < new Date() && t.status !== 'APPROVED';
      } else if (taskDueDateFilter === 'THIS_WEEK') {
        if (!t.deadline) { matchesDueDate = false; }
        else {
          const diff = new Date(t.deadline) - new Date();
          const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
          matchesDueDate = days >= 0 && days <= 7;
        }
      }
      return matchesSearch && matchesAssignee && matchesPriority && matchesLabel && matchesMyTasks && matchesDueDate;
    });

    const handleDragStart = (e, taskId) => { e.dataTransfer.setData('text/plain', taskId); };
    const handleDragOver = (e) => { e.preventDefault(); };
    const handleDrop = (e, targetStatus) => {
      e.preventDefault();
      const taskId = e.dataTransfer.getData('text/plain');
      if (!taskId) return;
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;
      const isCircleAdminOrOwner = circle.ownerId === user?.id || circle.members?.some(m => m.userId === user?.id && m.role === 'ADMIN');
      const isMyTask = task.assignedTo === user?.id;
      if (!isCircleAdminOrOwner && !isMyTask) {
        alert("You do not have permission to move this task.");
        return;
      }
      const isRegression = 
        (task.status === 'REVIEW' && (targetStatus === 'IN_PROGRESS' || targetStatus === 'TODO')) ||
        (task.status === 'APPROVED' && targetStatus !== 'APPROVED');
      if (isRegression) {
        setPendingRejectionTask(task);
        setPendingRejectionStatus(targetStatus);
        setRejectionReason('');
        setIsRejectionModalOpen(true);
      } else {
        updateTaskStatus(taskId, targetStatus);
      }
    };

    const getSortedTasks = () => {
      const items = [...filteredTasks];
      items.sort((a, b) => {
        let valA = a[taskSortField];
        let valB = b[taskSortField];
        if (taskSortField === 'deadline') {
          valA = a.deadline ? new Date(a.deadline).getTime() : 0;
          valB = b.deadline ? new Date(b.deadline).getTime() : 0;
        }
        if (valA < valB) return taskSortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return taskSortOrder === 'asc' ? 1 : -1;
        return 0;
      });
      return items;
    };

    const tagColors = ['#7B5CFA', '#00D4FF', '#FF6B6B', '#FFAB4C', '#34D399', '#FF2E93'];

    return (
      <div className="space-y-5 pb-12">
        {/* Title Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
           <div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">Task Board</h3>
              <p className="text-[12px] text-[var(--text-muted)] mt-0.5">Manage priorities, assignees, and track progress.</p>
           </div>
           <button 
             onClick={() => setIsTaskModalOpen(true)}
             className="bg-[#7B5CFA] hover:bg-[#6B4CE0] text-white px-4 py-2.5 rounded-xl text-[11px] font-bold flex items-center gap-2 transition shadow-lg shadow-[#7B5CFA]/20 w-fit"
           >
              <Plus size={14} /> New Task
           </button>
        </div>

        <TaskProgressBar />

        {/* Filter Toolbar */}
        <div className="bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] rounded-xl p-3 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className="relative flex-1 max-w-xs">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input 
                  type="text"
                  value={taskSearchQuery}
                  onChange={e => setTaskSearchQuery(e.target.value)}
                  placeholder="Search tasks..."
                  className="w-full bg-[var(--bg-base)] border border-[var(--border-primary)] rounded-lg pl-9 pr-3 py-2 text-[12px] text-[var(--text-primary)] placeholder-[#5A6478] focus:outline-none focus:border-[#7B5CFA]/40 transition font-medium"
                />
              </div>
              
              <div className="hidden lg:flex bg-[var(--bg-base)] p-0.5 rounded-lg border border-[var(--border-primary)]">
                <button 
                  onClick={() => setTasksLayout('board')}
                  className={`p-1.5 rounded-md transition-all ${tasksLayout === 'board' ? 'bg-[#7B5CFA]/15 text-[#7B5CFA]' : 'text-[var(--text-muted)] hover:text-white'}`}
                >
                  <Grid size={13} />
                </button>
                <button 
                  onClick={() => setTasksLayout('list')}
                  className={`p-1.5 rounded-md transition-all ${tasksLayout === 'list' ? 'bg-[#7B5CFA]/15 text-[#7B5CFA]' : 'text-[var(--text-muted)] hover:text-white'}`}
                >
                  <List size={13} />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select value={taskAssigneeFilter} onChange={e => setTaskAssigneeFilter(e.target.value)}
                className="bg-[var(--bg-base)] border border-[var(--border-primary)] rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-[var(--text-secondary)] outline-none focus:border-[#7B5CFA]/30 transition appearance-none cursor-pointer">
                <option value="ALL">All Members</option>
                {circle.members?.map(m => (
                  <option key={m.userId} value={m.userId}>{m.user?.username || 'member'}</option>
                ))}
              </select>

              <select value={taskPriorityFilter} onChange={e => setTaskPriorityFilter(e.target.value)}
                className="bg-[var(--bg-base)] border border-[var(--border-primary)] rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-[var(--text-secondary)] outline-none focus:border-[#7B5CFA]/30 transition appearance-none cursor-pointer">
                <option value="ALL">All Priority</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>

              {distinctTags.length > 0 && (
                <select value={taskLabelFilter} onChange={e => setTaskLabelFilter(e.target.value)}
                  className="bg-[var(--bg-base)] border border-[var(--border-primary)] rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-[var(--text-secondary)] outline-none focus:border-[#7B5CFA]/30 transition appearance-none cursor-pointer">
                  <option value="ALL">All Tags</option>
                  {distinctTags.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              )}

              <select value={taskDueDateFilter} onChange={e => setTaskDueDateFilter(e.target.value)}
                className="bg-[var(--bg-base)] border border-[var(--border-primary)] rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-[var(--text-secondary)] outline-none focus:border-[#7B5CFA]/30 transition appearance-none cursor-pointer">
                <option value="ALL">Any Date</option>
                <option value="OVERDUE">Overdue</option>
                <option value="THIS_WEEK">This Week</option>
              </select>

              <button 
                onClick={() => setTaskMyTasksOnly(!taskMyTasksOnly)}
                className={`px-3 py-1.5 border rounded-lg text-[11px] font-medium transition-all ${taskMyTasksOnly ? 'bg-[#7B5CFA]/15 border-[#7B5CFA]/30 text-[#7B5CFA]' : 'bg-[var(--bg-base)] border-[var(--border-primary)] text-[var(--text-muted)] hover:text-white hover:border-[var(--border-secondary)]'}`}
              >
                My Tasks
              </button>
            </div>
          </div>
        </div>

        {/* TASK VIEWS */}
        {isMobile ? (
          /* MOBILE VIEW: Vertical List with Status Dropdowns */
          <div className="space-y-3">
            {getSortedTasks().length === 0 && (
              <div className="py-12 flex flex-col items-center justify-center border border-dashed border-[var(--border-primary)] rounded-xl">
                <ListTodo size={24} className="text-[var(--text-muted)] mb-3" />
                <p className="text-sm font-medium text-[var(--text-secondary)]">No tasks found</p>
              </div>
            )}
            {getSortedTasks().map(task => {
              const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'APPROVED';
              const pStyle = getPriorityStyle(task.priority);
              const tagsList = task.labels ? task.labels.split(',').map(t => t.trim()).filter(t => t.length > 0) : [];
              
              return (
                <div 
                  key={task.id}
                  className={`bg-[var(--bg-surface-alt)] rounded-xl border p-4 flex flex-col gap-3 transition-all ${isOverdue ? 'border-[#FF6B6B]/30' : 'border-[var(--border-primary)]'}`}
                  style={{ borderLeftWidth: '4px', borderLeftColor: pStyle.strip }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => {
                        setSelectedTask(task);
                        setDetailTitle(task.title);
                        setDetailDesc(task.description || '');
                        setIsDetailPanelOpen(true);
                      }}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-bold text-[#7B5CFA]/70">{task.taskCode || 'TASK'}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border ${pStyle.badge}`}>{pStyle.label}</span>
                      </div>
                      <h4 className="font-bold text-[var(--text-primary)] text-sm leading-snug truncate">{task.title}</h4>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[var(--border-primary)]">
                    {/* Status Dropdown */}
                    <select
                      value={task.status}
                      onChange={(e) => {
                        const newStatus = e.target.value;
                        const isRegression = (task.status === 'REVIEW' && (newStatus === 'IN_PROGRESS' || newStatus === 'TODO')) ||
                                             (task.status === 'APPROVED' && newStatus !== 'APPROVED');
                        if (isRegression) {
                          setPendingRejectionTask(task);
                          setPendingRejectionStatus(newStatus);
                          setRejectionReason('');
                          setIsRejectionModalOpen(true);
                        } else {
                          updateTaskStatus(task.id, newStatus);
                        }
                      }}
                      className="bg-[var(--bg-base)] border border-[var(--border-primary)] text-[var(--text-primary)] text-[11px] font-bold rounded-lg px-2.5 py-1.5 outline-none appearance-none cursor-pointer"
                    >
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="REVIEW">Review</option>
                      <option value="APPROVED">Done</option>
                    </select>

                    <div className="flex items-center gap-2">
                      {task.deadline && (
                        <span className={`flex items-center gap-1 text-[10px] font-medium ${isOverdue ? 'text-[#FF6B6B]' : 'text-[var(--text-muted)]'}`}>
                          <Calendar size={12} /> {new Date(task.deadline).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                      {task.assignee ? (
                        <img src={task.assignee.profileImage || `https://ui-avatars.com/api/?name=${task.assignee.username}&background=181D2A&color=8B95A5`} className="w-6 h-6 rounded-md object-cover border border-[var(--border-primary)]" alt="Assignee" />
                      ) : (
                        <div className="w-6 h-6 rounded-md bg-[var(--bg-base)] border border-[var(--border-primary)] flex items-center justify-center text-[var(--text-muted)]">
                          <User size={10} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : tasksLayout === 'board' ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {columns.map(col => {
              const colTasks = filteredTasks.filter(t => {
                if (col.id === 'APPROVED') return t.status === 'APPROVED' || t.status === 'COMPLETED';
                return t.status === col.id;
              });

              return (
                <div 
                  key={col.id} 
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, col.id)}
                  className="flex flex-col bg-[var(--bg-base)]/60 rounded-xl border border-[var(--border-primary)] min-h-[480px] max-h-[680px]"
                  style={{ borderTopColor: col.accent, borderTopWidth: '2px' }}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between px-3.5 py-3">
                    <span className="text-[11px] font-bold text-[var(--text-secondary)] flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${col.dotBg}`} /> {col.title}
                    </span>
                    <span className="text-[10px] font-bold text-[var(--text-muted)] bg-white/[0.04] px-2 py-0.5 rounded-md min-w-[22px] text-center">
                      {colTasks.length}
                    </span>
                  </div>

                  {/* Cards Container */}
                  <div className="space-y-2.5 flex-1 overflow-y-auto no-scrollbar px-2.5 pb-3">
                    {colTasks.length === 0 && (
                      <div className="h-20 rounded-lg border border-dashed border-[var(--border-primary)] bg-white/[0.01] flex flex-col items-center justify-center">
                        <ListTodo size={14} className="text-[var(--text-muted)]/40 mb-1" />
                        <p className="text-[10px] text-[var(--text-muted)]/60">No tasks</p>
                      </div>
                    )}

                    {colTasks.map(task => {
                      const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'APPROVED';
                      const hasSubtasks = task.subtasks && task.subtasks.length > 0;
                      const completedSubtasks = hasSubtasks ? task.subtasks.filter(s => s.status === 'APPROVED' || s.status === 'COMPLETED').length : 0;
                      const tagsList = task.labels ? task.labels.split(',').map(t => t.trim()).filter(t => t.length > 0) : [];
                      const pStyle = getPriorityStyle(task.priority);

                      return (
                        <div 
                          key={task.id} 
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          onClick={() => {
                            setSelectedTask(task);
                            setDetailTitle(task.title);
                            setDetailDesc(task.description || '');
                            setIsDetailPanelOpen(true);
                          }}
                          className={`bg-[var(--bg-surface-alt)] rounded-lg border cursor-pointer group transition-all duration-200 hover:border-[#7B5CFA]/30 hover:shadow-lg hover:shadow-[#7B5CFA]/[0.04] ${isOverdue ? 'border-[#FF6B6B]/20' : 'border-[var(--border-primary)]'}`}
                          style={{ borderLeftWidth: '3px', borderLeftColor: pStyle.strip }}
                        >
                          <div className="p-3.5 space-y-2.5">
                            {/* Code + Priority Row */}
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-[#7B5CFA]/70">{task.taskCode || 'TASK'}</span>
                              <div className="flex items-center gap-1.5">
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border ${pStyle.badge}`}>
                                  {pStyle.label}
                                </span>
                                {task.estimatedEffort && (
                                  <span className="bg-[#7B5CFA]/8 text-[#A78BFA] px-1.5 py-0.5 rounded text-[8px] font-bold border border-[#7B5CFA]/15">
                                    {task.estimatedEffort}sp
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Title */}
                            <h4 className="font-bold text-[var(--text-primary)] text-[13px] leading-snug group-hover:text-[#A78BFA] transition-colors">{task.title}</h4>
                            
                            {task.description && (
                              <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 leading-relaxed">{task.description}</p>
                            )}

                            {/* Tags */}
                            {tagsList.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {tagsList.map((tag, idx) => {
                                  const color = tagColors[idx % tagColors.length];
                                  return (
                                    <span key={tag} className="text-[9px] font-bold px-1.5 py-0.5 rounded" 
                                      style={{ backgroundColor: `${color}10`, color: color, border: `1px solid ${color}20` }}>
                                      {tag}
                                    </span>
                                  );
                                })}
                              </div>
                            )}

                            {/* Rejection Badge */}
                            {task.rejectionComment && (
                              <div className="flex items-center gap-1.5 px-2 py-1 bg-[#FF4757]/8 border border-[#FF4757]/15 rounded-md">
                                <AlertTriangle size={10} className="text-[#FF4757] flex-shrink-0" />
                                <span className="text-[9px] font-bold text-[#FF4757]">Changes Requested</span>
                              </div>
                            )}

                            {/* Subtask progress bar */}
                            {hasSubtasks && (
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-white/[0.04] rounded-full h-1 overflow-hidden">
                                  <div className="bg-[#34D399] h-full rounded-full transition-all" style={{ width: `${(completedSubtasks / task.subtasks.length) * 100}%` }} />
                                </div>
                                <span className="text-[9px] text-[var(--text-muted)] font-medium">{completedSubtasks}/{task.subtasks.length}</span>
                              </div>
                            )}
                          </div>

                          {/* Card Footer */}
                          <div className="px-3.5 py-2.5 border-t border-[var(--border-primary)] flex items-center justify-between">
                            <div className="flex items-center gap-1.5 min-w-0">
                              {task.assignee ? (
                                <>
                                  <img src={task.assignee.profileImage || `https://ui-avatars.com/api/?name=${task.assignee.username}&background=181D2A&color=8B95A5&size=20`} className="w-5 h-5 rounded-md object-cover" />
                                  <span className="text-[10px] text-[var(--text-secondary)] font-medium truncate">{task.assignee.username}</span>
                                </>
                              ) : (
                                <span className="text-[10px] text-[var(--text-muted)] italic">Unassigned</span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              {task.deadline && (
                                <span className={`flex items-center gap-1 text-[10px] font-medium ${isOverdue ? 'text-[#FF6B6B]' : 'text-[var(--text-muted)]'}`}>
                                  <Calendar size={10} /> {new Date(task.deadline).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                </span>
                              )}
                              {task._count?.comments > 0 && (
                                <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-0.5">
                                  <MessageSquare size={9} /> {task._count.comments}
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
        ) : (
          /* LIST VIEW */
          <div className="bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-[var(--border-primary)]">
                    <th onClick={() => { setTaskSortField('taskCode'); setTaskSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); }}
                      className="px-4 py-3.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider cursor-pointer hover:text-[var(--text-primary)] transition">
                      ID {taskSortField === 'taskCode' ? (taskSortOrder === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th onClick={() => { setTaskSortField('title'); setTaskSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); }}
                      className="px-4 py-3.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider cursor-pointer hover:text-[var(--text-primary)] transition">
                      Title {taskSortField === 'title' ? (taskSortOrder === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th onClick={() => { setTaskSortField('status'); setTaskSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); }}
                      className="px-4 py-3.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider cursor-pointer hover:text-[var(--text-primary)] transition">
                      Status {taskSortField === 'status' ? (taskSortOrder === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th onClick={() => { setTaskSortField('priority'); setTaskSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); }}
                      className="px-4 py-3.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider cursor-pointer hover:text-[var(--text-primary)] transition">
                      Priority {taskSortField === 'priority' ? (taskSortOrder === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th className="px-4 py-3.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Assignee</th>
                    <th onClick={() => { setTaskSortField('deadline'); setTaskSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); }}
                      className="px-4 py-3.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider cursor-pointer hover:text-[var(--text-primary)] transition">
                      Due {taskSortField === 'deadline' ? (taskSortOrder === 'asc' ? '↑' : '↓') : ''}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {getSortedTasks().length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-[var(--text-muted)] text-xs">
                        No tasks match the selected filters
                      </td>
                    </tr>
                  )}
                  {getSortedTasks().map(task => {
                    const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'APPROVED';
                    const pStyle = getPriorityStyle(task.priority);
                    return (
                      <tr 
                        key={task.id} 
                        onClick={() => {
                          setSelectedTask(task);
                          setDetailTitle(task.title);
                          setDetailDesc(task.description || '');
                          setIsDetailPanelOpen(true);
                        }}
                        className={`border-b border-[var(--border-primary)] hover:bg-white/[0.02] transition cursor-pointer group ${isOverdue ? 'bg-[#FF6B6B]/[0.02]' : ''}`}
                      >
                        <td className="px-4 py-3.5 text-[11px] font-bold text-[#7B5CFA]/70">{task.taskCode || 'TASK'}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[13px] font-bold text-[var(--text-primary)] group-hover:text-[#A78BFA] transition">{task.title}</span>
                            {task.rejectionComment && (
                              <span className="text-[9px] font-bold text-[#FF4757] flex items-center gap-1 mt-0.5">
                                <AlertTriangle size={9} /> Changes Requested
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`text-[9px] font-bold px-2 py-1 rounded-md border ${getStatusStyle(task.status)}`}>
                            {task.status === 'IN_PROGRESS' ? 'Active' : task.status === 'APPROVED' ? 'Done' : task.status === 'REVIEW' ? 'Review' : 'To Do'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`text-[9px] font-bold px-2 py-1 rounded-md border ${pStyle.badge}`}>
                            {pStyle.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          {task.assignee ? (
                            <div className="flex items-center gap-2">
                              <img src={task.assignee.profileImage || `https://ui-avatars.com/api/?name=${task.assignee.username}&background=181D2A&color=8B95A5&size=20`} className="w-5 h-5 rounded-md object-cover" />
                              <span className="text-[11px] font-medium text-[var(--text-secondary)]">{task.assignee.username}</span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-[var(--text-muted)] italic">Unassigned</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          {task.deadline ? (
                            <span className={`text-[11px] font-medium ${isOverdue ? 'text-[#FF6B6B]' : 'text-[var(--text-secondary)]'}`}>
                              {new Date(task.deadline).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          ) : (
                            <span className="text-[11px] text-[var(--text-muted)]">—</span>
                          )}
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

  const ChatPanel = () => (
    <div className="flex flex-col h-full bg-[var(--bg-surface-alt)] md:border md:border-[var(--border-primary)] md:rounded-2xl overflow-hidden">
       <div className="p-4 border-b border-[var(--border-primary)] flex items-center justify-between">
          <div className="flex items-center gap-2">
             <MessageSquare size={15} className="text-[#7B5CFA]" />
             <span className="text-[12px] font-bold text-[var(--text-primary)]">Team Chat</span>
          </div>
          <span className="text-[10px] font-medium text-[#34D399] flex items-center gap-1.5">
             <span className="w-1.5 h-1.5 bg-[#34D399] rounded-full animate-pulse" /> Live
          </span>
       </div>

       <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar flex flex-col-reverse">
          {messages.map((msg, i) => {
            const isMine = msg.senderId === user?.id;
            return (
              <div key={msg.id || i} className={`flex gap-2.5 ${isMine ? 'flex-row-reverse' : ''}`}>
                 <img src={msg.sender?.profileImage} className="w-7 h-7 rounded-lg object-cover flex-shrink-0 mt-0.5" />
                 <div className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                    <div className={`px-3.5 py-2 rounded-2xl text-[13px] leading-relaxed ${isMine ? 'bg-[#7B5CFA] text-white rounded-tr-sm' : 'bg-white/[0.05] text-[var(--text-primary)] rounded-tl-sm'}`}>
                       {msg.content}
                    </div>
                    <p className="text-[9px] text-[var(--text-muted)] mt-1 px-1 font-medium">
                       {msg.sender?.username} · {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                 </div>
              </div>
            );
          })}
       </div>

       <form onSubmit={handleSendMessage} className="p-3 border-t border-[var(--border-primary)]">
          <div className="flex gap-2 bg-[var(--bg-base)] border border-[var(--border-primary)] rounded-xl p-1.5 focus-within:border-[#7B5CFA]/30 transition">
             <input 
               value={msgInput}
               onChange={e => setMsgInput(e.target.value)}
               placeholder="Write a message..."
               className="flex-1 bg-transparent border-none outline-none text-[13px] px-2 text-[var(--text-primary)] placeholder-[#5A6478]"
             />
             <button type="submit" className="bg-[#7B5CFA] text-white p-2 rounded-lg hover:bg-[#6B4CE0] transition">
                <Send size={14} />
             </button>
          </div>
       </form>
    </div>
  );

  const TABS = [
    { id: 'OVERVIEW', label: 'Overview', icon: Info },
    { id: 'FILES',    label: 'Files',    icon: FileText },
    { id: 'TASKS',    label: 'Tasks',    icon: ListTodo },
    { id: 'UPDATES',  label: 'Updates',  icon: MessageSquare }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 md:py-6 h-full flex flex-col">
      {/* Workspace Header */}
      <div className="flex items-center justify-between mb-6 md:mb-8 pt-4 md:pt-0">
        <div className="flex items-center gap-3">
           <button onClick={() => navigate('/circles')} className="p-2 bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] rounded-lg hover:text-[#7B5CFA] transition text-[var(--text-secondary)]">
              <ChevronLeft size={18} />
           </button>
           <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[#7B5CFA] text-[9px] font-bold uppercase tracking-widest mb-0.5">
                 <Shield size={10} /> Circle Workspace
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-[var(--text-primary)] tracking-tight truncate">{circle.title}</h1>
           </div>
        </div>
        <div className="hidden md:flex items-center gap-2">
           <div className="flex -space-x-2.5">
              {circle.members?.map((m, i) => (
                <img key={i} src={m.user?.profileImage || `https://ui-avatars.com/api/?name=${m.user?.username}`} className="w-8 h-8 rounded-lg border-2 border-[#0F131E] object-cover" />
              ))}
           </div>
           <button className="p-2 bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition ml-1">
              <MoreHorizontal size={16} />
           </button>
        </div>
      </div>

      {/* Mobile Tabs */}
      <div className="md:hidden flex border-b border-[var(--border-primary)] -mx-4 mb-5 sticky top-14 bg-[var(--bg-base)]/95 backdrop-blur-md z-40">
        {TABS.map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3.5 flex flex-col items-center gap-1 transition-all relative ${activeTab === tab.id ? 'text-[#7B5CFA]' : 'text-[var(--text-muted)]'}`}
          >
            <tab.icon size={15} />
            <span className="text-[9px] font-bold uppercase tracking-wider">{tab.label}</span>
            {activeTab === tab.id && <motion.div layoutId="tab-active" className="absolute bottom-0 w-8 h-0.5 bg-[#7B5CFA] rounded-full" />}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0">
        {/* Mobile */}
        <div className="md:hidden h-full">
           <AnimatePresence mode="wait">
             <motion.div
               key={activeTab}
               initial={{ opacity: 0, x: 10 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -10 }}
               transition={{ duration: 0.15 }}
               className="h-full"
             >
               {activeTab === 'OVERVIEW' && <OverviewPanel />}
               {activeTab === 'FILES' && <FilesHub circleIdScope={id} />}
               {activeTab === 'TASKS' && <TasksPanel />}
               {activeTab === 'UPDATES' && <div className="h-[calc(100svh-18rem)]"><ChatPanel /></div>}
             </motion.div>
           </AnimatePresence>
        </div>

        {/* Desktop */}
        <div className="hidden md:flex flex-col h-[calc(100vh-240px)]">
           <div className="flex gap-1 mb-6 bg-[var(--bg-surface-alt)]/50 p-1 rounded-xl border border-[var(--border-primary)] w-fit flex-shrink-0">
              {TABS.map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-2 rounded-lg text-[11px] font-bold transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-[var(--bg-base)] text-[#7B5CFA] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                >
                  <tab.icon size={13} /> {tab.label}
                </button>
              ))}
           </div>
           
           <div className={`flex-1 min-h-0 ${activeTab === 'UPDATES' ? '' : 'overflow-y-auto no-scrollbar'}`}>
              {activeTab === 'OVERVIEW' && <OverviewPanel />}
              {activeTab === 'FILES' && <FilesHub circleIdScope={id} />}
              {activeTab === 'TASKS' && <TasksPanel />}
              {activeTab === 'UPDATES' && <div className="h-full max-w-4xl mx-auto"><ChatPanel /></div>}
           </div>
        </div>
      </div>

      {/* ═══ Task Creation Modal ═══ */}
      <AnimatePresence>
        {isTaskModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-[var(--border-primary)] flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">New Task</h3>
                  <p className="text-[12px] text-[var(--text-muted)] mt-0.5">Assign deliverables to team members.</p>
                </div>
                <button onClick={() => setIsTaskModalOpen(false)} className="p-2 hover:bg-white/[0.05] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto no-scrollbar">
                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Task Title</label>
                  <input 
                    type="text" required value={taskTitle} onChange={e => setTaskTitle(e.target.value)}
                    placeholder="e.g. Design Home Hero Section"
                    className="w-full bg-[var(--bg-base)] border border-[var(--border-primary)] rounded-lg px-3.5 py-2.5 text-[13px] text-[var(--text-primary)] placeholder-[#5A6478] focus:border-[#7B5CFA]/40 outline-none transition font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Description</label>
                  <textarea 
                    value={taskDesc} onChange={e => setTaskDesc(e.target.value)} rows={3}
                    placeholder="Requirements, deliverables, inspiration..."
                    className="w-full bg-[var(--bg-base)] border border-[var(--border-primary)] rounded-lg px-3.5 py-2.5 text-[13px] text-[var(--text-primary)] placeholder-[#5A6478] focus:border-[#7B5CFA]/40 outline-none transition font-medium resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Priority</label>
                    <select value={taskPriority} onChange={e => setTaskPriority(e.target.value)}
                      className="w-full bg-[var(--bg-base)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-[13px] text-[var(--text-primary)] focus:border-[#7B5CFA]/40 outline-none transition font-medium appearance-none cursor-pointer">
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Deadline</label>
                    <input type="date" value={taskDeadline} onChange={e => setTaskDeadline(e.target.value)}
                      className="w-full bg-[var(--bg-base)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-[13px] text-[var(--text-primary)] focus:border-[#7B5CFA]/40 outline-none transition font-medium cursor-pointer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Story Points</label>
                    <input type="number" min="1" value={taskEffort} onChange={e => setTaskEffort(e.target.value)}
                      placeholder="e.g. 5"
                      className="w-full bg-[var(--bg-base)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-[13px] text-[var(--text-primary)] placeholder-[#5A6478] focus:border-[#7B5CFA]/40 outline-none transition font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Labels</label>
                    <input type="text" value={taskLabels} onChange={e => setTaskLabels(e.target.value)}
                      placeholder="e.g. UI, Frontend"
                      className="w-full bg-[var(--bg-base)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-[13px] text-[var(--text-primary)] placeholder-[#5A6478] focus:border-[#7B5CFA]/40 outline-none transition font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Assign To</label>
                  <select value={taskAssignee} onChange={e => setTaskAssignee(e.target.value)}
                    className="w-full bg-[var(--bg-base)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-[13px] text-[var(--text-primary)] focus:border-[#7B5CFA]/40 outline-none transition font-medium appearance-none cursor-pointer">
                    <option value="">Unassigned</option>
                    {circle.members?.map(m => (
                      <option key={m.userId} value={m.userId}>{m.user?.username || 'member'} ({m.role})</option>
                    ))}
                  </select>
                </div>

                <div className="pt-3 flex gap-3">
                  <button type="button" onClick={() => setIsTaskModalOpen(false)}
                    className="flex-1 py-3 bg-white/[0.04] border border-[var(--border-primary)] rounded-xl text-[11px] font-bold text-[var(--text-secondary)] hover:bg-white/[0.06] hover:text-[var(--text-primary)] transition">
                    Cancel
                  </button>
                  <button type="submit" disabled={taskSaving}
                    className="flex-1 py-3 bg-[#7B5CFA] hover:bg-[#6B4CE0] text-white rounded-xl text-[11px] font-bold shadow-lg shadow-[#7B5CFA]/20 disabled:opacity-50 transition">
                    {taskSaving ? 'Creating...' : 'Create Task'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══ Task Detail Side Panel ═══ */}
      <AnimatePresence>
        {isDetailPanelOpen && selectedTask && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-end">
            <div className="absolute inset-0 cursor-default" onClick={() => setIsDetailPanelOpen(false)} />
            
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-xl bg-[var(--bg-base)] h-full shadow-2xl flex flex-col border-l border-[var(--border-primary)] z-10"
            >
              {/* Panel Header */}
              <div className="p-5 border-b border-[var(--border-primary)] flex items-center justify-between bg-[var(--bg-surface-alt)]/80">
                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] font-bold text-[#7B5CFA] bg-[#7B5CFA]/10 border border-[#7B5CFA]/20 px-2.5 py-1 rounded-md">
                    {selectedTask.taskCode || 'TASK'}
                  </span>
                  <button 
                    onClick={() => {
                      const shareUrl = `${window.location.origin}${window.location.pathname}?task=${selectedTask.id}`;
                      navigator.clipboard.writeText(shareUrl);
                      alert("Link copied to clipboard!");
                    }}
                    className="p-1.5 hover:bg-white/[0.05] rounded-lg text-[var(--text-muted)] hover:text-[#7B5CFA] transition flex items-center gap-1.5 border border-[var(--border-primary)]"
                  >
                    <Share2 size={11} />
                    <span className="text-[9px] font-bold">Share</span>
                  </button>
                </div>
                <button onClick={() => setIsDetailPanelOpen(false)} className="p-2 hover:bg-white/[0.05] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition">
                  <X size={16} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5 no-scrollbar">
                {/* Title */}
                <div>
                  <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Title</label>
                  {isEditingTitle ? (
                    <input 
                      type="text" value={detailTitle} onChange={e => setDetailTitle(e.target.value)}
                      onBlur={() => {
                        setIsEditingTitle(false);
                        if (detailTitle.trim() && detailTitle.trim() !== selectedTask.title) {
                          updateTaskDetails(selectedTask.id, { title: detailTitle.trim() });
                        }
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          setIsEditingTitle(false);
                          if (detailTitle.trim() && detailTitle.trim() !== selectedTask.title) {
                            updateTaskDetails(selectedTask.id, { title: detailTitle.trim() });
                          }
                        }
                      }}
                      autoFocus
                      className="w-full bg-[var(--bg-surface-alt)] border border-[#7B5CFA]/40 rounded-lg px-3 py-2 text-base font-bold text-[var(--text-primary)] outline-none"
                    />
                  ) : (
                    <h3 onClick={() => setIsEditingTitle(true)}
                      className="text-lg font-bold text-[var(--text-primary)] cursor-pointer hover:bg-[var(--bg-surface-alt)] p-2 -m-2 rounded-lg border border-transparent hover:border-[var(--border-primary)] transition flex items-center gap-2 group">
                      {selectedTask.title} <Edit2 size={13} className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition" />
                    </h3>
                  )}
                </div>

                {/* Rejection Alert */}
                {selectedTask.rejectionComment && (
                  <div className="bg-[#FF4757]/8 border border-[#FF4757]/15 p-4 rounded-xl">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-[#FF4757] mb-2">
                      <AlertTriangle size={13} /> Changes Requested
                    </div>
                    <p className="text-[12px] text-[#FF6B6B]/80 font-medium leading-relaxed bg-[#FF4757]/5 border border-[#FF4757]/10 p-3 rounded-lg italic">
                      "{selectedTask.rejectionComment}"
                    </p>
                  </div>
                )}

                {/* Fields Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-[var(--bg-surface-alt)]/60 border border-[var(--border-primary)] p-4 rounded-xl">
                  <div>
                    <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Status</label>
                    <select 
                      value={selectedTask.status}
                      onChange={e => {
                        const targetStatus = e.target.value;
                        const isRegression = 
                          (selectedTask.status === 'REVIEW' && (targetStatus === 'IN_PROGRESS' || targetStatus === 'TODO')) ||
                          (selectedTask.status === 'APPROVED' && targetStatus !== 'APPROVED');
                        if (isRegression) {
                          setPendingRejectionTask(selectedTask);
                          setPendingRejectionStatus(targetStatus);
                          setRejectionReason('');
                          setIsRejectionModalOpen(true);
                        } else {
                          updateTaskStatus(selectedTask.id, targetStatus);
                        }
                      }}
                      className="w-full bg-[var(--bg-base)] border border-[var(--border-primary)] rounded-lg px-2.5 py-2 text-[11px] font-bold text-[var(--text-primary)] outline-none cursor-pointer appearance-none"
                    >
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="REVIEW">In Review</option>
                      <option value="APPROVED">Done</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Priority</label>
                    <select value={selectedTask.priority} onChange={e => updateTaskDetails(selectedTask.id, { priority: e.target.value })}
                      className="w-full bg-[var(--bg-base)] border border-[var(--border-primary)] rounded-lg px-2.5 py-2 text-[11px] font-bold text-[var(--text-primary)] outline-none cursor-pointer appearance-none">
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Story Pts</label>
                    <input type="number" min="1" value={selectedTask.estimatedEffort || ''} onChange={e => updateTaskDetails(selectedTask.id, { estimatedEffort: e.target.value ? parseInt(e.target.value) : null })}
                      placeholder="—" className="w-full bg-[var(--bg-base)] border border-[var(--border-primary)] rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-[var(--text-primary)] outline-none" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Labels</label>
                    <input type="text" value={selectedTask.labels || ''} onChange={e => updateTaskDetails(selectedTask.id, { labels: e.target.value })}
                      placeholder="design, UI" className="w-full bg-[var(--bg-base)] border border-[var(--border-primary)] rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-[var(--text-primary)] outline-none" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Deadline</label>
                    <input type="date" value={selectedTask.deadline ? selectedTask.deadline.split('T')[0] : ''} onChange={e => updateTaskDetails(selectedTask.id, { deadline: e.target.value || null })}
                      className="w-full bg-[var(--bg-base)] border border-[var(--border-primary)] rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-[var(--text-primary)] outline-none cursor-pointer" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Assignee</label>
                    <select value={selectedTask.assignedTo || ''} onChange={e => updateTaskDetails(selectedTask.id, { assignedTo: e.target.value || null })}
                      className="w-full bg-[var(--bg-base)] border border-[var(--border-primary)] rounded-lg px-2.5 py-2 text-[11px] font-bold text-[var(--text-primary)] outline-none cursor-pointer appearance-none">
                      <option value="">Unassigned</option>
                      {circle.members?.map(m => (
                        <option key={m.userId} value={m.userId}>{m.user?.username || 'member'}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Description</label>
                  <textarea value={detailDesc} onChange={e => setDetailDesc(e.target.value)} rows={3}
                    placeholder="Add a description..."
                    className="w-full bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] rounded-xl px-3.5 py-2.5 text-[13px] text-[var(--text-primary)] placeholder-[#5A6478] focus:border-[#7B5CFA]/30 outline-none transition font-medium resize-none" />
                  {detailDesc !== (selectedTask.description || '') && (
                    <button onClick={() => updateTaskDetails(selectedTask.id, { description: detailDesc })}
                      className="mt-2 bg-[#7B5CFA] text-white px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-[#6B4CE0] transition">
                      Save
                    </button>
                  )}
                </div>

                {/* Subtasks */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Subtasks</label>
                    <span className="text-[9px] font-bold text-[var(--text-muted)] bg-white/[0.04] px-2 py-0.5 rounded-md">
                      {selectedTask.subtasks?.filter(s => s.status === 'APPROVED' || s.status === 'COMPLETED').length || 0}/{selectedTask.subtasks?.length || 0}
                    </span>
                  </div>

                  <div className="space-y-1.5 mb-2.5">
                    {selectedTask.subtasks?.map(sub => (
                      <div key={sub.id} className="flex items-center gap-2.5 bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] px-3 py-2 rounded-lg">
                        <input 
                          type="checkbox"
                          checked={sub.status === 'APPROVED' || sub.status === 'COMPLETED'}
                          onChange={async (e) => {
                            const newSubStatus = e.target.checked ? 'APPROVED' : 'TODO';
                            try {
                              await axios.patch(`/api/tasks/${sub.id}`, { status: newSubStatus }, { headers });
                              const tasksRes = await axios.get(`/api/circles/${id}/tasks`, { headers });
                              setTasks(tasksRes.data);
                              const updatedParent = tasksRes.data.find(t => t.id === selectedTask.id);
                              if (updatedParent) setSelectedTask(updatedParent);
                            } catch (err) {
                              alert("Failed to toggle subtask.");
                            }
                          }}
                          className="w-3.5 h-3.5 rounded text-[#7B5CFA] border-[var(--border-secondary)] cursor-pointer accent-[#7B5CFA]"
                        />
                        <span className={`text-[12px] font-medium ${sub.status === 'APPROVED' || sub.status === 'COMPLETED' ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-primary)]'}`}>
                          {sub.title}
                        </span>
                      </div>
                    ))}
                    
                    {(!selectedTask.subtasks || selectedTask.subtasks.length === 0) && (
                      <p className="text-[11px] text-[var(--text-muted)] italic bg-[var(--bg-surface-alt)] p-3 rounded-lg border border-dashed border-[var(--border-primary)] text-center">
                        No subtasks yet
                      </p>
                    )}
                  </div>

                  <form onSubmit={handleAddSubtask} className="flex items-center gap-2">
                    <input type="text" value={newSubtaskTitle} onChange={e => setNewSubtaskTitle(e.target.value)}
                      placeholder="+ Add subtask..." className="flex-1 bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] rounded-lg px-3 py-2 text-[12px] text-[var(--text-primary)] placeholder-[#5A6478] focus:border-[#7B5CFA]/30 outline-none transition font-medium" />
                    <button type="submit" className="bg-white/[0.06] hover:bg-white/[0.1] text-[var(--text-primary)] px-3 py-2 rounded-lg text-[10px] font-bold transition">
                      Add
                    </button>
                  </form>
                </div>

                {/* Comments */}
                <div className="border-t border-[var(--border-primary)] pt-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Comments</label>
                    <span className="text-[9px] font-bold text-[var(--text-muted)] bg-white/[0.04] px-2 py-0.5 rounded-md">
                      {selectedTask.comments?.length || 0}
                    </span>
                  </div>

                  <form onSubmit={handleAddTaskComment} className="flex items-start gap-2">
                    <input type="text" value={commentInput} onChange={e => setCommentInput(e.target.value)}
                      placeholder="Write a comment..." className="flex-1 bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] rounded-lg px-3 py-2 text-[12px] text-[var(--text-primary)] placeholder-[#5A6478] focus:border-[#7B5CFA]/30 outline-none transition font-medium" />
                    <button type="submit" className="bg-[#7B5CFA] hover:bg-[#6B4CE0] text-white px-3 py-2 rounded-lg text-[10px] font-bold transition">
                      Post
                    </button>
                  </form>

                  <div className="space-y-2 max-h-52 overflow-y-auto no-scrollbar">
                    {selectedTask.comments?.slice().sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt)).map(c => {
                      const isSystem = c.user?.username === 'SYSTEM' || !c.user;
                      return (
                        <div key={c.id} className={`p-3 rounded-xl border ${isSystem ? 'bg-[#FFAB4C]/5 border-[#FFAB4C]/10' : 'bg-[var(--bg-surface-alt)] border-[var(--border-primary)]'}`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold text-[var(--text-primary)]">
                              {isSystem ? '⚙ System' : `${c.user?.username}`}
                            </span>
                            <span className="text-[9px] text-[var(--text-muted)]">
                              {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">{c.content}</p>
                        </div>
                      );
                    })}
                    {(!selectedTask.comments || selectedTask.comments.length === 0) && (
                      <p className="text-[11px] text-[var(--text-muted)] italic text-center py-2">No comments yet</p>
                    )}
                  </div>
                </div>

                {/* Audit Trail */}
                <div className="border-t border-[var(--border-primary)] pt-5 space-y-2.5">
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Activity Log</label>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto no-scrollbar">
                    {(() => {
                      let logs = [];
                      try {
                        if (selectedTask.activityLog) {
                          logs = typeof selectedTask.activityLog === 'string' 
                            ? JSON.parse(selectedTask.activityLog) 
                            : selectedTask.activityLog;
                        }
                      } catch (err) { console.error(err); }
                      
                      if (logs.length === 0) {
                        return <p className="text-[11px] text-[var(--text-muted)] italic text-center py-2">No activity logged yet</p>;
                      }

                      return logs.slice().reverse().map((log, idx) => (
                        <div key={idx} className="flex items-start gap-2 bg-[var(--bg-surface-alt)]/60 p-2.5 rounded-lg border border-[var(--border-primary)] text-[10px]">
                          <Clock size={11} className="mt-0.5 text-[var(--text-muted)] flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[var(--text-primary)] font-medium">
                              <span className="text-[#7B5CFA]">{log.user || 'Someone'}</span> {log.action}
                            </p>
                            <p className="text-[9px] text-[var(--text-muted)] mt-0.5">
                              {new Date(log.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══ Rejection Modal ═══ */}
      <AnimatePresence>
        {isRejectionModalOpen && pendingRejectionTask && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[160] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] rounded-2xl w-full max-w-md shadow-2xl p-6"
            >
              <div className="flex items-center gap-2.5 text-[#FF4757] mb-4">
                <AlertTriangle size={22} />
                <h3 className="text-lg font-bold">Return Task</h3>
              </div>

              <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed mb-4">
                You're moving <span className="font-bold text-[var(--text-primary)]">{pendingRejectionTask.taskCode}</span> backwards. 
                Please explain what changes are needed.
              </p>

              <textarea 
                value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} required rows={4}
                placeholder="Describe what needs to change..."
                className="w-full bg-[var(--bg-base)] border border-[var(--border-primary)] rounded-xl px-3.5 py-2.5 text-[13px] text-[var(--text-primary)] placeholder-[#5A6478] outline-none focus:border-[#FF4757]/30 transition font-medium resize-none"
              />

              <div className="flex gap-3 mt-5">
                <button type="button"
                  onClick={() => { setIsRejectionModalOpen(false); setPendingRejectionTask(null); setPendingRejectionStatus(null); }}
                  className="flex-1 py-2.5 bg-white/[0.04] border border-[var(--border-primary)] rounded-xl text-[11px] font-bold text-[var(--text-secondary)] hover:bg-white/[0.06] hover:text-[var(--text-primary)] transition">
                  Cancel
                </button>
                <button type="button"
                  onClick={() => {
                    if (!rejectionReason.trim()) { alert("Please provide a reason."); return; }
                    updateTaskStatus(pendingRejectionTask.id, pendingRejectionStatus, rejectionReason.trim());
                    setIsRejectionModalOpen(false);
                    setPendingRejectionTask(null);
                    setPendingRejectionStatus(null);
                  }}
                  className="flex-1 py-2.5 bg-[#FF4757] hover:bg-[#FF3344] text-[var(--text-primary)] rounded-xl text-[11px] font-bold shadow-lg shadow-[#FF4757]/20 transition">
                  Confirm Return
                </button>
              </div>
            </motion.div>
          </div>
          )}
        </AnimatePresence>

      <InviteMemberModal 
        isOpen={isInviteModalOpen} 
        onClose={() => setIsInviteModalOpen(false)} 
        circleId={id} 
      />
    </div>
  );
};

export default CircleWorkspace;
