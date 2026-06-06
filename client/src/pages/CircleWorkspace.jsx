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

  // Task Layout, Search & Filter States
  const [tasksLayout, setTasksLayout]         = useState('board'); // 'board' or 'list'
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [taskAssigneeFilter, setTaskAssigneeFilter] = useState('ALL');
  const [taskPriorityFilter, setTaskPriorityFilter] = useState('ALL');
  const [taskLabelFilter, setTaskLabelFilter]       = useState('ALL');
  const [taskMyTasksOnly, setTaskMyTasksOnly]       = useState(false);
  const [taskSortField, setTaskSortField]           = useState('createdAt');
  const [taskSortOrder, setTaskSortOrder]           = useState('desc');
  const [taskDueDateFilter, setTaskDueDateFilter]   = useState('ALL');

  // Task Creation States
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle]             = useState('');
  const [taskDesc, setTaskDesc]               = useState('');
  const [taskPriority, setTaskPriority]       = useState('MEDIUM');
  const [taskAssignee, setTaskAssignee]       = useState('');
  const [taskDeadline, setTaskDeadline]       = useState('');
  const [taskEffort, setTaskEffort]           = useState('');
  const [taskLabels, setTaskLabels]           = useState('');
  const [taskSaving, setTaskSaving]           = useState(false);

  // Task Detail Panel States
  const [selectedTask, setSelectedTask]       = useState(null);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle]   = useState(false);
  const [detailTitle, setDetailTitle]         = useState('');
  const [detailDesc, setDetailDesc]           = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [commentInput, setCommentInput]       = useState('');

  // Rejection Dialog Modal States
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [pendingRejectionTask, setPendingRejectionTask] = useState(null);
  const [pendingRejectionStatus, setPendingRejectionStatus] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

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

  // Deep-link direct task sharing integration
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
      
      // Reset Modal Form
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
      
      // Refresh circle tasks
      const tasksRes = await axios.get(`/api/circles/${id}/tasks`, { headers });
      setTasks(tasksRes.data);
      
      // Update selected task
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#7B5CFA]" />
        <p className="text-[#8B95A5] text-sm font-medium">Powering up workspace...</p>
      </div>
    );
  }

  if (!circle) return null;

  // ── Component Panels ────────────────────────────────

  const OverviewPanel = () => (
    <div className="space-y-6 pb-12">
      <div className="bg-[#0F131E] border border-[#0F131E]/5 rounded-[2rem] p-8 shadow-sm">
        <div className="flex items-center gap-3 text-[#7B5CFA] font-black uppercase text-[10px] tracking-widest mb-4">
          <Target size={14} /> Project Vision
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight mb-4">{circle.title}</h2>
        <p className="text-sm text-[#8B95A5] font-medium leading-relaxed">
          {circle.description || "Establish a clear vision for this collaboration by adding a project description."}
        </p>
        
        <div className="mt-8 pt-8 border-t border-[#0F131E]/5 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#181D2A] p-4 rounded-2xl">
             <p className="text-[8px] font-black text-[#8B95A5] uppercase tracking-widest mb-1">Status</p>
             <p className="text-xs font-black text-emerald-600 uppercase">{circle.status}</p>
          </div>
          <div className="bg-[#181D2A] p-4 rounded-2xl">
             <p className="text-[8px] font-black text-[#8B95A5] uppercase tracking-widest mb-1">Category</p>
             <p className="text-xs font-black text-white">{circle.category}</p>
          </div>
          <div className="bg-[#181D2A] p-4 rounded-2xl">
             <p className="text-[8px] font-black text-[#8B95A5] uppercase tracking-widest mb-1">Members</p>
             <p className="text-xs font-black text-white">{circle.members?.length || 0}</p>
          </div>
          <div className="bg-[#181D2A] p-4 rounded-2xl">
             <p className="text-[8px] font-black text-[#8B95A5] uppercase tracking-widest mb-1">Tasks</p>
             <p className="text-xs font-black text-white">{tasks.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#0F131E] border border-[#0F131E]/5 rounded-[2rem] p-8">
           <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-white tracking-tight">Active Team</h3>
              <button className="text-[10px] font-black text-[#7B5CFA] uppercase tracking-widest">Recruit +</button>
           </div>
           <div className="space-y-4">
              {circle.members?.map((m, i) => (
                <div key={i} className="flex items-center gap-3">
                   <img src={m.user?.profileImage || `https://ui-avatars.com/api/?name=${m.user?.username}`} className="w-10 h-10 rounded-xl object-cover" />
                   <div>
                      <p className="font-black text-white text-xs">@{m.user?.username}</p>
                      <p className="text-[9px] font-black text-[#8B95A5] uppercase tracking-widest">{m.role}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>
        
        <div className="bg-slate-900 text-white rounded-[2rem] p-8 relative overflow-hidden">
           <Zap className="absolute -top-4 -right-4 w-24 h-24 text-white/5 opacity-20" />
           <h3 className="font-black tracking-tight mb-2">Upcoming Deadline</h3>
           <p className="text-sm text-white/60 mb-6">No immediate deadlines set. Add milestones to track progress.</p>
           <button className="w-full py-3 bg-[#0F131E]/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#0F131E]/20 transition">
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
      <div className="bg-[#0F131E] border border-[#0F131E]/5 rounded-2xl p-4 shadow-sm mb-6 space-y-3">
        <div className="flex justify-between items-center text-xs">
          <span className="font-extrabold text-white flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
            <Zap size={13} className="text-[#7B5CFA]" /> Workspace Progress
          </span>
          <span className="text-[10px] font-black text-[#7B5CFA] bg-[#7B5CFA]/5 px-2.5 py-1 rounded-lg border border-[#7B5CFA]/10">
            {progressPercent.toFixed(0)}% Shipped ({approvedCount}/{total} Tasks)
          </span>
        </div>
        
        {/* Sleek, thin stacked progress line */}
        <div className="relative w-full bg-white/5 rounded-full h-2 overflow-hidden flex shadow-inner">
          {todoPercent > 0 && <div style={{ width: `${todoPercent}%` }} className="bg-rose-500 h-full" title={`To Do: ${todoCount} (${todoPercent.toFixed(0)}%)`} />}
          {inProgressPercent > 0 && <div style={{ width: `${inProgressPercent}%` }} className="bg-amber-500 h-full" title={`In Progress: ${inProgressCount} (${inProgressPercent.toFixed(0)}%)`} />}
          {reviewPercent > 0 && <div style={{ width: `${reviewPercent}%` }} className="bg-yellow-400 h-full" title={`Under Review: ${reviewCount} (${reviewPercent.toFixed(0)}%)`} />}
          {approvedPercent > 0 && <div style={{ width: `${approvedPercent}%` }} className="bg-emerald-500 h-full" title={`Approved: ${approvedCount} (${approvedPercent.toFixed(0)}%)`} />}
        </div>
        
        {/* Compact, elegant legends in a single line */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[9px] font-bold text-[#8B95A5] uppercase tracking-wider">
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500" /> To Do ({todoCount})</div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" /> In Progress ({inProgressCount})</div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-400" /> Review ({reviewCount})</div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Approved ({approvedCount})</div>
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

    // Calculate Distinct Labels/Tags for the dropdown filter
    const distinctTags = Array.from(new Set(
      tasks
        .map(t => t.labels || '')
        .flatMap(l => l.split(','))
        .map(s => s.trim())
        .filter(s => s.length > 0)
    ));

    // FILTER LOGIC (Parent Tasks Only)
    const filteredTasks = tasks.filter(t => {
      // Don't show subtasks in top-level lists/boards
      if (t.parentId) return false;

      // 1. Text Search
      const query = taskSearchQuery.toLowerCase().trim();
      const matchesSearch = !query || 
        t.taskCode?.toLowerCase().includes(query) ||
        t.title.toLowerCase().includes(query) ||
        (t.description && t.description.toLowerCase().includes(query));

      // 2. Assignee Filter
      const matchesAssignee = taskAssigneeFilter === 'ALL' || t.assignedTo === taskAssigneeFilter;

      // 3. Priority Filter
      const matchesPriority = taskPriorityFilter === 'ALL' || t.priority === taskPriorityFilter;

      // 4. Label Tag Filter
      const matchesLabel = taskLabelFilter === 'ALL' || 
        (t.labels && t.labels.split(',').map(s => s.trim().toLowerCase()).includes(taskLabelFilter.toLowerCase()));

      // 5. My Tasks quick toggle
      const matchesMyTasks = !taskMyTasksOnly || t.assignedTo === user?.id;

      // 6. Due Date filters
      let matchesDueDate = true;
      if (taskDueDateFilter === 'OVERDUE') {
        matchesDueDate = t.deadline && new Date(t.deadline) < new Date() && t.status !== 'APPROVED';
      } else if (taskDueDateFilter === 'THIS_WEEK') {
        if (!t.deadline) {
          matchesDueDate = false;
        } else {
          const diff = new Date(t.deadline) - new Date();
          const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
          matchesDueDate = days >= 0 && days <= 7;
        }
      }

      return matchesSearch && matchesAssignee && matchesPriority && matchesLabel && matchesMyTasks && matchesDueDate;
    });

    // Handle HTML5 Drag and Drop Events
    const handleDragStart = (e, taskId) => {
      e.dataTransfer.setData('text/plain', taskId);
    };

    const handleDragOver = (e) => {
      e.preventDefault();
    };

    const handleDrop = (e, targetStatus) => {
      e.preventDefault();
      const taskId = e.dataTransfer.getData('text/plain');
      if (!taskId) return;

      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const isCircleAdminOrOwner = circle.ownerId === user?.id || 
        circle.members?.some(m => m.userId === user?.id && m.role === 'ADMIN');
      const isMyTask = task.assignedTo === user?.id;

      if (!isCircleAdminOrOwner && !isMyTask) {
        alert("🔒 View Only: You do not have permission to move this task. You must be the assignee or an Admin.");
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

    // Sort list items dynamically
    const getSortedTasks = () => {
      const items = [...filteredTasks];
      items.sort((a, b) => {
        let valA = a[taskSortField];
        let valB = b[taskSortField];

        // Format dates
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

    const isCircleAdminOrOwner = circle.ownerId === user?.id || 
      circle.members?.some(m => m.userId === user?.id && m.role === 'ADMIN');

    return (
      <div className="space-y-6 pb-12">
        {/* Workspace Title bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
           <div>
              <h3 className="text-xl font-black text-white tracking-tight">Circle Board & Task Workspace</h3>
              <p className="text-xs text-[#8B95A5] mt-0.5">Manage priorities, assignees, subtask details, and audit history logs.</p>
           </div>
           <button 
             onClick={() => setIsTaskModalOpen(true)}
             className="bg-[#7B5CFA] hover:bg-[#7B5CFA]Hover text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#7B5CFA]/20 flex items-center gap-2 transition w-fit"
           >
              <Plus size={14} /> Create Task
           </button>
        </div>

        {/* Dynamic Progress Indicator */}
        <TaskProgressBar />

        {/* JIRA FILTER & SEARCH TOOLBAR */}
        <div className="bg-[#0F131E] border border-[#0F131E]/5 rounded-[2rem] p-4 flex flex-col gap-3 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Left elements: Text search + Toggle View */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64 bg-[#181D2A] border border-[#0F131E]/5 rounded-xl px-3 py-2 flex items-center gap-2 focus-within:border-[#7B5CFA] transition-all">
                <Search size={14} className="text-[#8B95A5]" />
                <input 
                  type="text"
                  value={taskSearchQuery}
                  onChange={e => setTaskSearchQuery(e.target.value)}
                  placeholder="Search Task ID, title, or body..."
                  className="bg-transparent text-xs w-full focus:outline-none font-bold"
                />
              </div>
              
              <div className="flex bg-white/5 p-1 rounded-xl border border-[#0F131E]/5">
                <button 
                  onClick={() => setTasksLayout('board')}
                  className={`p-1.5 rounded-lg transition-all ${tasksLayout === 'board' ? 'bg-[#0F131E] shadow-sm text-[#7B5CFA]' : 'text-[#8B95A5] hover:text-white'}`}
                  title="Kanban Board View"
                >
                  <Grid size={14} />
                </button>
                <button 
                  onClick={() => setTasksLayout('list')}
                  className={`p-1.5 rounded-lg transition-all ${tasksLayout === 'list' ? 'bg-[#0F131E] shadow-sm text-[#7B5CFA]' : 'text-[#8B95A5] hover:text-white'}`}
                  title="Spreadsheet List View"
                >
                  <List size={14} />
                </button>
              </div>
            </div>

            {/* Right elements: Dropdown selectors & Toggle */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Assignee Filter */}
              <select 
                value={taskAssigneeFilter}
                onChange={e => setTaskAssigneeFilter(e.target.value)}
                className="bg-[#181D2A] border border-[#0F131E]/5 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-wider outline-none transition"
              >
                <option value="ALL">Assignee: All</option>
                {circle.members?.map(m => (
                  <option key={m.userId} value={m.userId}>@{m.user?.username || 'member'}</option>
                ))}
              </select>

              {/* Priority Filter */}
              <select 
                value={taskPriorityFilter}
                onChange={e => setTaskPriorityFilter(e.target.value)}
                className="bg-[#181D2A] border border-[#0F131E]/5 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-wider outline-none transition"
              >
                <option value="ALL">Priority: All</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>

              {/* Label Tag Filter */}
              <select 
                value={taskLabelFilter}
                onChange={e => setTaskLabelFilter(e.target.value)}
                className="bg-[#181D2A] border border-[#0F131E]/5 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-wider outline-none transition"
              >
                <option value="ALL">Tag: All</option>
                {distinctTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>

              {/* Due Date Filter */}
              <select 
                value={taskDueDateFilter}
                onChange={e => setTaskDueDateFilter(e.target.value)}
                className="bg-[#181D2A] border border-[#0F131E]/5 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-wider outline-none transition"
              >
                <option value="ALL">Due Date: All</option>
                <option value="OVERDUE">Overdue Tasks</option>
                <option value="THIS_WEEK">Due This Week</option>
              </select>

              {/* Quick toggle: My Tasks */}
              <button 
                onClick={() => setTaskMyTasksOnly(!taskMyTasksOnly)}
                className={`px-3 py-2 border rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${taskMyTasksOnly ? 'bg-[#7B5CFA] border-[#7B5CFA] text-white shadow-sm shadow-[#7B5CFA]/20' : 'bg-[#181D2A] border-[#0F131E]/5 text-[#8B95A5] hover:text-white'}`}
              >
                My Tasks Only
              </button>
            </div>
          </div>
        </div>

        {/* DYNAMIC VIEW OUTPUT */}
        {tasksLayout === 'board' ? (
          /* Kanban Board columns with independent vertical scrolls */
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {columns.map(col => {
              const colTasks = filteredTasks.filter(t => {
                if (col.id === 'APPROVED') {
                  return t.status === 'APPROVED' || t.status === 'COMPLETED';
                }
                return t.status === col.id;
              });

              return (
                <div 
                  key={col.id} 
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, col.id)}
                  className={`flex flex-col bg-slate-50/40 border border-[#0F131E]/5 rounded-2xl p-3 border-t-4 ${col.color} min-h-[500px] max-h-[680px]`}
                >
                  <div className="flex items-center justify-between mb-3 px-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 text-white">
                      <div className={`w-2 h-2 rounded-full ${col.iconBg}`} /> {col.title}
                    </span>
                    <span className="text-[9px] font-extrabold bg-[#0F131E] px-1.5 py-0.5 rounded border border-[#0F131E]/5 shadow-sm text-[#8B95A5]">
                      {colTasks.length}
                    </span>
                  </div>

                  {/* Independent Vertically Scrollable Columns */}
                  <div className="space-y-2.5 flex-1 overflow-y-auto no-scrollbar pr-0.5 pb-2">
                    {colTasks.length === 0 && (
                      <div className="h-24 rounded-xl border border-dashed border-[#0F131E]/5 bg-[#0F131E]/60 flex flex-col items-center justify-center text-center p-3">
                        <ListTodo size={16} className="text-[#8B95A5] opacity-25 mb-1" />
                        <p className="text-[9px] font-extrabold text-[#8B95A5] uppercase tracking-wider">No tasks</p>
                      </div>
                    )}

                    {colTasks.map(task => {
                      const isMyTask = task.assignedTo === user?.id;
                      const hasSubtasks = task.subtasks && task.subtasks.length > 0;
                      const completedSubtasks = hasSubtasks ? task.subtasks.filter(s => s.status === 'APPROVED' || s.status === 'COMPLETED').length : 0;
                      
                      // Identify Overdue status
                      const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'APPROVED';

                      // Parse tags
                      const tagsList = task.labels ? task.labels.split(',').map(t => t.trim()).filter(t => t.length > 0) : [];

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
                          className={`bg-[#0F131E] border rounded-xl p-3 hover:border-[#7B5CFA] hover:shadow-md transition duration-200 group flex flex-col justify-between cursor-pointer relative ${isOverdue ? 'border-red-200 bg-red-50/5' : 'border-[#0F131E]/5'}`}
                        >
                          <div className="space-y-2">
                            {/* Top Header Row with Code & Priority */}
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[9px] font-extrabold text-[#7B5CFA] bg-[#7B5CFA]/5 px-2 py-0.5 rounded border border-[#7B5CFA]/10">
                                {task.taskCode || 'TASK'}
                              </span>
                              <div className="flex gap-1 items-center">
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${getPriorityBadge(task.priority)}`}>
                                  {task.priority}
                                </span>
                                {task.estimatedEffort && (
                                  <span className="bg-purple-50 border border-purple-100 text-purple-600 px-1.5 py-0.5 rounded text-[8px] font-extrabold" title="Story Points Effort">
                                    {task.estimatedEffort} SP
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Title & Description */}
                            <div>
                              <h4 className="font-extrabold text-white text-xs leading-snug group-hover:text-[#7B5CFA] transition-colors">{task.title}</h4>
                              {task.description && (
                                <p className="text-[10px] text-[#8B95A5] mt-1 line-clamp-2 leading-relaxed">{task.description}</p>
                              )}
                            </div>

                            {/* Tags */}
                            {tagsList.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {tagsList.map(tag => (
                                  <span key={tag} className="text-[8px] font-extrabold text-indigo-600 bg-indigo-50/60 px-1.5 py-0.5 rounded border border-indigo-100/30">
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Returned rejection badge warning inside card */}
                            {task.rejectionComment && (
                              <div className="px-2 py-1 bg-red-50 border border-red-100 rounded-lg flex items-center gap-1 text-[8px] font-extrabold text-red-600 uppercase tracking-wider">
                                <AlertTriangle size={10} className="text-red-500 flex-shrink-0" /> Changes Requested
                              </div>
                            )}
                          </div>

                          {/* Meta info footer (very compact, borderless/subtle) */}
                          <div className="pt-2.5 border-t border-gray-100 mt-2.5 flex items-center justify-between text-[9px] font-bold text-[#8B95A5]">
                            <div className="flex items-center gap-1.5 min-w-0">
                              {task.assignee ? (
                                <>
                                  <img src={task.assignee.profileImage || `https://ui-avatars.com/api/?name=${task.assignee.username}`} className="w-4 h-4 rounded-full object-cover flex-shrink-0" />
                                  <span className="truncate">@{task.assignee.username}</span>
                                </>
                              ) : (
                                <span className="text-slate-400">Unassigned</span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              {task.deadline && (
                                <span className={`flex items-center gap-0.5 ${isOverdue ? 'text-red-600 font-extrabold animate-pulse' : ''}`}>
                                  <Calendar size={9} /> {new Date(task.deadline).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                </span>
                              )}
                              {hasSubtasks && (
                                <span className="bg-[#181D2A] border border-[#0F131E]/5 px-1.5 py-0.5 rounded text-[8px]">
                                  {completedSubtasks}/{task.subtasks.length}
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
          /* Spreadsheet Tabular View sortable */
          <div className="bg-[#0F131E] border border-[#0F131E]/5 rounded-[2rem] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-[#181D2A] border-b border-[#0F131E]/5">
                    <th 
                      onClick={() => {
                        setTaskSortField('taskCode');
                        setTaskSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                      }}
                      className="px-6 py-4 text-[9px] font-black text-[#8B95A5] uppercase tracking-widest cursor-pointer hover:bg-white/5 transition"
                    >
                      Task ID {taskSortField === 'taskCode' ? (taskSortOrder === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th 
                      onClick={() => {
                        setTaskSortField('title');
                        setTaskSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                      }}
                      className="px-6 py-4 text-[9px] font-black text-[#8B95A5] uppercase tracking-widest cursor-pointer hover:bg-white/5 transition"
                    >
                      Title {taskSortField === 'title' ? (taskSortOrder === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th 
                      onClick={() => {
                        setTaskSortField('status');
                        setTaskSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                      }}
                      className="px-6 py-4 text-[9px] font-black text-[#8B95A5] uppercase tracking-widest cursor-pointer hover:bg-white/5 transition"
                    >
                      Status {taskSortField === 'status' ? (taskSortOrder === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th 
                      onClick={() => {
                        setTaskSortField('priority');
                        setTaskSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                      }}
                      className="px-6 py-4 text-[9px] font-black text-[#8B95A5] uppercase tracking-widest cursor-pointer hover:bg-white/5 transition"
                    >
                      Priority {taskSortField === 'priority' ? (taskSortOrder === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th className="px-6 py-4 text-[9px] font-black text-[#8B95A5] uppercase tracking-widest">Assignee</th>
                    <th 
                      onClick={() => {
                        setTaskSortField('deadline');
                        setTaskSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                      }}
                      className="px-6 py-4 text-[9px] font-black text-[#8B95A5] uppercase tracking-widest cursor-pointer hover:bg-white/5 transition"
                    >
                      Due Date {taskSortField === 'deadline' ? (taskSortOrder === 'asc' ? '▲' : '▼') : ''}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider">
                  {getSortedTasks().length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-[#8B95A5] text-xs font-bold uppercase tracking-wider">
                        No tasks match the selected filters
                      </td>
                    </tr>
                  )}
                  {getSortedTasks().map(task => {
                    const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'APPROVED';
                    return (
                      <tr 
                        key={task.id} 
                        onClick={() => {
                          setSelectedTask(task);
                          setDetailTitle(task.title);
                          setDetailDesc(task.description || '');
                          setIsDetailPanelOpen(true);
                        }}
                        className={`hover:bg-[#181D2A]/50 transition-all cursor-pointer group ${isOverdue ? 'bg-red-50/10' : ''}`}
                      >
                        <td className="px-6 py-4 font-bold text-xs text-[#7B5CFA]">{task.taskCode || 'TASK'}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-white text-xs group-hover:text-[#7B5CFA] transition">{task.title}</span>
                            {task.rejectionComment && (
                              <span className="text-[8px] font-black text-red-600 uppercase tracking-widest mt-0.5 flex items-center gap-0.5">
                                <AlertTriangle size={8} /> Returned Needs Changes
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider border ${
                            task.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            task.status === 'REVIEW' ? 'bg-yellow-50 text-yellow-600 border-yellow-100 animate-pulse' :
                            task.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                            'bg-rose-50 text-rose-600 border-rose-100'
                          }`}>
                            {task.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider border ${getPriorityBadge(task.priority)}`}>
                            {task.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {task.assignee ? (
                              <>
                                <img src={task.assignee.profileImage || `https://ui-avatars.com/api/?name=${task.assignee.username}`} className="w-5 h-5 rounded-md object-cover" />
                                <span className="text-[10px] font-black text-[#8B95A5] uppercase tracking-widest">@{task.assignee.username}</span>
                              </>
                            ) : (
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unassigned</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {task.deadline ? (
                            <span className={`text-xs font-bold ${isOverdue ? 'text-red-600 animate-pulse' : 'text-[#8B95A5]'}`}>
                              {new Date(task.deadline).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-slate-300">-</span>
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
    <div className="flex flex-col h-full bg-[#0F131E] md:border md:border-[#0F131E]/5 md:rounded-[2rem] overflow-hidden shadow-sm">
       <div className="p-4 border-b border-[#0F131E]/5 bg-[#181D2A]/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <MessageSquare size={16} className="text-[#7B5CFA]" />
             <span className="text-[10px] font-black text-white uppercase tracking-widest">Internal Sync</span>
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
                    <div className={`px-4 py-2.5 rounded-2xl text-sm ${isMine ? 'bg-[#7B5CFA] text-white rounded-tr-none' : 'bg-white/5 text-white rounded-tl-none'}`}>
                       {msg.content}
                    </div>
                    <p className="text-[8px] font-black text-[#8B95A5] uppercase mt-1 px-1 tracking-widest">
                       {msg.sender?.username} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                 </div>
              </div>
            );
          })}
       </div>

       <form onSubmit={handleSendMessage} className="p-4 border-t border-[#0F131E]/5">
          <div className="flex gap-2 bg-[#181D2A] border border-[#0F131E]/5 rounded-2xl p-2 focus-within:border-[#7B5CFA] transition-all">
             <input 
               value={msgInput}
               onChange={e => setMsgInput(e.target.value)}
               placeholder="Write an update..."
               className="flex-1 bg-transparent border-none outline-none text-sm px-2"
             />
             <button type="submit" className="bg-[#7B5CFA] text-white p-2.5 rounded-xl shadow-lg shadow-[#7B5CFA]/20">
                <Send size={16} />
             </button>
          </div>
       </form>
    </div>
  );

  // FilesPanel replaced by global FilesHub component

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
           <button onClick={() => navigate('/network')} className="p-2.5 bg-[#0F131E] border border-[#0F131E]/5 rounded-xl hover:text-[#7B5CFA] transition shadow-sm">
              <ChevronLeft size={20} />
           </button>
           <div className="min-w-0">
              <div className="flex items-center gap-2 text-[#7B5CFA] font-black uppercase text-[9px] tracking-widest mb-0.5">
                 <Shield size={10} /> Secure Circle
              </div>
              <h1 className="text-xl md:text-3xl font-black text-white tracking-tighter leading-tight truncate">{circle.title}</h1>
           </div>
        </div>
        <div className="hidden md:flex items-center gap-3">
           <div className="flex -space-x-3">
              {circle.members?.map((m, i) => (
                <img key={i} src={m.user?.profileImage} className="w-10 h-10 rounded-full border-4 border-[#0F131E] shadow-sm" />
              ))}
           </div>
           <button className="p-3 bg-[#0F131E] border border-[#0F131E]/5 rounded-xl text-[#8B95A5] hover:text-[#7B5CFA] transition shadow-sm">
              <MoreHorizontal size={20} />
           </button>
        </div>
      </div>

      {/* Navigation Tabs (Mobile) */}
      <div className="md:hidden flex border-b border-[#0F131E]/5 -mx-4 mb-6 sticky top-14 bg-[#0F131E]/95 backdrop-blur-md z-40">
        {TABS.map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-4 flex flex-col items-center gap-1.5 transition-all relative ${activeTab === tab.id ? 'text-[#7B5CFA]' : 'text-[#8B95A5]'}`}
          >
            <tab.icon size={16} />
            <span className="text-[9px] font-black uppercase tracking-widest">{tab.label}</span>
            {activeTab === tab.id && <motion.div layoutId="tab-active" className="absolute bottom-0 w-8 h-0.5 bg-[#7B5CFA] rounded-full" />}
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
               {activeTab === 'FILES' && <FilesHub circleIdScope={id} />}
               {activeTab === 'TASKS' && <TasksPanel />}
               {activeTab === 'UPDATES' && <div className="h-[calc(100svh-18rem)]"><ChatPanel /></div>}
             </motion.div>
           </AnimatePresence>
        </div>

        {/* Desktop View */}
        <div className="hidden md:flex flex-col h-[calc(100vh-280px)]">
           {/* Tab Selector Desktop */}
           <div className="flex gap-2 mb-8 bg-[#181D2A]/50 p-1.5 rounded-2xl border border-[#0F131E]/5 w-fit flex-shrink-0">
              {TABS.map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-[#0F131E] text-[#7B5CFA] shadow-sm' : 'text-[#8B95A5] hover:text-white'}`}
                >
                   {tab.label}
                </button>
              ))}
           </div>
           
           <div className={`flex-1 min-h-0 pr-2 ${activeTab === 'UPDATES' ? '' : 'overflow-y-auto no-scrollbar'}`}>
              {activeTab === 'OVERVIEW' && <OverviewPanel />}
              {activeTab === 'FILES' && <FilesHub circleIdScope={id} />}
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
              className="bg-[#0F131E] border border-[#0F131E]/5 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden"
            >
              <div className="p-6 md:p-8 border-b border-[#0F131E]/5 bg-[#181D2A]/80 backdrop-blur-sm flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight">Create Workspace Task</h3>
                  <p className="text-xs text-[#8B95A5] mt-0.5">Assign deliverables to creatives in this circle.</p>
                </div>
                <button 
                  onClick={() => setIsTaskModalOpen(false)}
                  className="p-2 hover:bg-gray-200/50 rounded-xl text-[#8B95A5] transition"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="p-6 md:p-8 space-y-5 max-h-[70vh] overflow-y-auto pr-2 no-scrollbar">
                <div>
                  <label className="block text-[9px] font-black text-[#8B95A5] uppercase tracking-widest mb-2">Task Title</label>
                  <input 
                    type="text" 
                    required
                    value={taskTitle}
                    onChange={e => setTaskTitle(e.target.value)}
                    placeholder="e.g. Design Home Hero Section"
                    className="w-full bg-[#181D2A] border border-[#0F131E]/5 rounded-xl px-4 py-3 text-sm focus:border-[#7B5CFA] focus:bg-[#0F131E] outline-none transition font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-black text-[#8B95A5] uppercase tracking-widest mb-2">Description</label>
                  <textarea 
                    value={taskDesc}
                    onChange={e => setTaskDesc(e.target.value)}
                    rows={3}
                    placeholder="Specify requirements, deliverables, or inspiration..."
                    className="w-full bg-[#181D2A] border border-[#0F131E]/5 rounded-xl px-4 py-3 text-sm focus:border-[#7B5CFA] focus:bg-[#0F131E] outline-none transition font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-black text-[#8B95A5] uppercase tracking-widest mb-2">Priority</label>
                    <select 
                      value={taskPriority}
                      onChange={e => setTaskPriority(e.target.value)}
                      className="w-full bg-[#181D2A] border border-[#0F131E]/5 rounded-xl px-4 py-3 text-sm focus:border-[#7B5CFA] focus:bg-[#0F131E] outline-none transition font-bold"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-[#8B95A5] uppercase tracking-widest mb-2">Deadline</label>
                    <input 
                      type="date" 
                      value={taskDeadline}
                      onChange={e => setTaskDeadline(e.target.value)}
                      className="w-full bg-[#181D2A] border border-[#0F131E]/5 rounded-xl px-4 py-3 text-sm focus:border-[#7B5CFA] focus:bg-[#0F131E] outline-none transition font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-black text-[#8B95A5] uppercase tracking-widest mb-2">Effort (Story Points)</label>
                    <input 
                      type="number" 
                      min="1"
                      value={taskEffort}
                      onChange={e => setTaskEffort(e.target.value)}
                      placeholder="e.g. 5 Story Points"
                      className="w-full bg-[#181D2A] border border-[#0F131E]/5 rounded-xl px-4 py-3 text-sm focus:border-[#7B5CFA] focus:bg-[#0F131E] outline-none transition font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-[#8B95A5] uppercase tracking-widest mb-2">Labels / Tags</label>
                    <input 
                      type="text" 
                      value={taskLabels}
                      onChange={e => setTaskLabels(e.target.value)}
                      placeholder="e.g. UI, Frontend, draft"
                      className="w-full bg-[#181D2A] border border-[#0F131E]/5 rounded-xl px-4 py-3 text-sm focus:border-[#7B5CFA] focus:bg-[#0F131E] outline-none transition font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-black text-[#8B95A5] uppercase tracking-widest mb-2">Assign Creative</label>
                  <select 
                    value={taskAssignee}
                    onChange={e => setTaskAssignee(e.target.value)}
                    className="w-full bg-[#181D2A] border border-[#0F131E]/5 rounded-xl px-4 py-3 text-sm focus:border-[#7B5CFA] focus:bg-[#0F131E] outline-none transition font-bold"
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
                    className="flex-1 py-3.5 bg-[#181D2A] border border-[#0F131E]/5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={taskSaving}
                    className="flex-1 py-3.5 bg-[#7B5CFA] hover:bg-[#7B5CFA]Hover text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#7B5CFA]/25 disabled:opacity-50 transition"
                  >
                    {taskSaving ? 'Saving...' : 'Create Task'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Right Slide-out Task Detail Side Panel Drawer */}
      <AnimatePresence>
        {isDetailPanelOpen && selectedTask && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-end">
            {/* Click outside to close */}
            <div className="absolute inset-0 cursor-default" onClick={() => setIsDetailPanelOpen(false)} />
            
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-xl bg-[#0F131E] h-full shadow-2xl flex flex-col border-l border-[#0F131E]/5 z-10"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-[#0F131E]/5 flex items-center justify-between bg-[#181D2A]/80">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-[#7B5CFA] bg-[#7B5CFA]/10 border border-[#7B5CFA]/20 px-2.5 py-1 rounded-md">
                    {selectedTask.taskCode || 'TASK'}
                  </span>
                  
                  {/* Share / Copy direct link button */}
                  <button 
                    onClick={() => {
                      const shareUrl = `${window.location.origin}${window.location.pathname}?task=${selectedTask.id}`;
                      navigator.clipboard.writeText(shareUrl);
                      alert("🔗 Link copied to clipboard! Share it with team members.");
                    }}
                    className="p-2 hover:bg-gray-200 rounded-xl text-[#8B95A5] hover:text-[#7B5CFA] transition flex items-center gap-1.5 border border-[#0F131E]/5 bg-[#0F131E]"
                    title="Copy direct shareable link"
                  >
                    <Share2 size={12} />
                    <span className="text-[9px] font-black uppercase tracking-wider">Copy Link</span>
                  </button>
                </div>

                <button 
                  onClick={() => setIsDetailPanelOpen(false)}
                  className="p-2 hover:bg-gray-200 rounded-xl text-[#8B95A5] transition"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                {/* 1. Inline click-to-edit Title */}
                <div>
                  <label className="block text-[8px] font-black text-[#8B95A5] uppercase tracking-widest mb-1">Task Title</label>
                  {isEditingTitle ? (
                    <input 
                      type="text"
                      value={detailTitle}
                      onChange={e => setDetailTitle(e.target.value)}
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
                      className="w-full bg-[#181D2A] border border-[#7B5CFA] rounded-xl px-3 py-2 text-base font-bold outline-none"
                    />
                  ) : (
                    <h3 
                      onClick={() => setIsEditingTitle(true)}
                      className="text-lg font-black text-white cursor-pointer hover:bg-[#181D2A] p-2 rounded-xl border border-transparent hover:border-[#0F131E]/5 transition flex items-center gap-2"
                    >
                      {selectedTask.title} <Edit2 size={14} className="text-[#8B95A5] opacity-0 hover:opacity-100 transition" />
                    </h3>
                  )}
                </div>

                {/* 2. Rejection alert badge warning inside details */}
                {selectedTask.rejectionComment && (
                  <div className="bg-red-50 border border-red-100 p-4 rounded-2xl">
                    <div className="flex items-center gap-2 text-xs font-black text-red-600 uppercase tracking-wider">
                      <AlertTriangle size={14} className="text-red-500" /> Changes Requested by Reviewer
                    </div>
                    <p className="text-xs text-red-950 font-medium mt-1.5 leading-relaxed bg-[#0F131E] border border-red-100 p-3 rounded-xl italic">
                      "{selectedTask.rejectionComment}"
                    </p>
                  </div>
                )}

                {/* 3. Fields control block grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-[#181D2A]/50 border border-[#0F131E]/5 p-4 rounded-2xl">
                  {/* Status selection */}
                  <div>
                    <label className="block text-[8px] font-black text-[#8B95A5] uppercase tracking-widest mb-1.5">Status</label>
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
                      className="w-full bg-[#0F131E] border border-[#0F131E]/5 rounded-xl px-2.5 py-2 text-xs font-bold outline-none cursor-pointer"
                    >
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="REVIEW">Under Review</option>
                      <option value="APPROVED">Approved</option>
                    </select>
                  </div>

                  {/* Priority selection */}
                  <div>
                    <label className="block text-[8px] font-black text-[#8B95A5] uppercase tracking-widest mb-1.5">Priority</label>
                    <select 
                      value={selectedTask.priority}
                      onChange={e => updateTaskDetails(selectedTask.id, { priority: e.target.value })}
                      className="w-full bg-[#0F131E] border border-[#0F131E]/5 rounded-xl px-2.5 py-2 text-xs font-bold outline-none cursor-pointer"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>

                  {/* Effort */}
                  <div>
                    <label className="block text-[8px] font-black text-[#8B95A5] uppercase tracking-widest mb-1.5">Story Effort</label>
                    <input 
                      type="number"
                      min="1"
                      value={selectedTask.estimatedEffort || ''}
                      onChange={e => updateTaskDetails(selectedTask.id, { estimatedEffort: e.target.value ? parseInt(e.target.value) : null })}
                      placeholder="e.g. 5"
                      className="w-full bg-[#0F131E] border border-[#0F131E]/5 rounded-xl px-2.5 py-1.5 text-xs font-bold outline-none"
                    />
                  </div>

                  {/* Labels input */}
                  <div>
                    <label className="block text-[8px] font-black text-[#8B95A5] uppercase tracking-widest mb-1.5">Labels / Tags</label>
                    <input 
                      type="text"
                      value={selectedTask.labels || ''}
                      onChange={e => updateTaskDetails(selectedTask.id, { labels: e.target.value })}
                      placeholder="e.g. design, UI"
                      className="w-full bg-[#0F131E] border border-[#0F131E]/5 rounded-xl px-2.5 py-1.5 text-xs font-bold outline-none"
                    />
                  </div>

                  {/* Deadline selection */}
                  <div>
                    <label className="block text-[8px] font-black text-[#8B95A5] uppercase tracking-widest mb-1.5">Deadline</label>
                    <input 
                      type="date"
                      value={selectedTask.deadline ? selectedTask.deadline.split('T')[0] : ''}
                      onChange={e => updateTaskDetails(selectedTask.id, { deadline: e.target.value || null })}
                      className="w-full bg-[#0F131E] border border-[#0F131E]/5 rounded-xl px-2.5 py-1.5 text-xs font-bold outline-none cursor-pointer"
                    />
                  </div>

                  {/* Assignee selection */}
                  <div>
                    <label className="block text-[8px] font-black text-[#8B95A5] uppercase tracking-widest mb-1.5">Assignee</label>
                    <select 
                      value={selectedTask.assignedTo || ''}
                      onChange={e => updateTaskDetails(selectedTask.id, { assignedTo: e.target.value || null })}
                      className="w-full bg-[#0F131E] border border-[#0F131E]/5 rounded-xl px-2.5 py-2 text-xs font-bold outline-none cursor-pointer"
                    >
                      <option value="">Unassigned</option>
                      {circle.members?.map(m => (
                        <option key={m.userId} value={m.userId}>@{m.user?.username || 'member'}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 4. Description editor */}
                <div>
                  <label className="block text-[9px] font-black text-[#8B95A5] uppercase tracking-widest mb-2">Description</label>
                  <textarea 
                    value={detailDesc}
                    onChange={e => setDetailDesc(e.target.value)}
                    rows={4}
                    placeholder="Provide a description..."
                    className="w-full bg-[#181D2A] border border-[#0F131E]/5 rounded-2xl px-4 py-3 text-sm focus:border-[#7B5CFA] focus:bg-[#0F131E] outline-none transition font-medium"
                  />
                  {detailDesc !== (selectedTask.description || '') && (
                    <button 
                      onClick={() => updateTaskDetails(selectedTask.id, { description: detailDesc })}
                      className="mt-2 bg-[#7B5CFA] text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-[#7B5CFA]Hover transition"
                    >
                      Save Description
                    </button>
                  )}
                </div>

                {/* 5. Subtasks Checklist System */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-[9px] font-black text-[#8B95A5] uppercase tracking-widest">📋 Hierarchical Checklist Subtasks</label>
                    <span className="text-[8px] font-black text-[#8B95A5] bg-white/5 px-2 py-0.5 rounded">
                      {selectedTask.subtasks?.filter(s => s.status === 'APPROVED' || s.status === 'COMPLETED').length || 0} / {selectedTask.subtasks?.length || 0} done
                    </span>
                  </div>

                  {/* Subtask list */}
                  <div className="space-y-2 mb-3">
                    {selectedTask.subtasks?.map(sub => (
                      <div key={sub.id} className="flex items-center gap-3 bg-[#181D2A] border border-[#0F131E]/5 px-3 py-2 rounded-xl">
                        <input 
                          type="checkbox"
                          checked={sub.status === 'APPROVED' || sub.status === 'COMPLETED'}
                          onChange={async (e) => {
                            const newSubStatus = e.target.checked ? 'APPROVED' : 'TODO';
                            try {
                              await axios.patch(`/api/tasks/${sub.id}`, { status: newSubStatus }, { headers });
                              
                              // Refresh tasks and selected task subtasks
                              const tasksRes = await axios.get(`/api/circles/${id}/tasks`, { headers });
                              setTasks(tasksRes.data);
                              
                              const updatedParent = tasksRes.data.find(t => t.id === selectedTask.id);
                              if (updatedParent) {
                                setSelectedTask(updatedParent);
                              }
                            } catch (err) {
                              alert("Failed to toggle subtask checkmark status.");
                            }
                          }}
                          className="w-4 h-4 rounded text-[#7B5CFA] focus:ring-primary border-[#0F131E]/5 cursor-pointer"
                        />
                        <span className={`text-xs font-bold ${sub.status === 'APPROVED' || sub.status === 'COMPLETED' ? 'line-through text-[#8B95A5]' : 'text-white'}`}>
                          {sub.title}
                        </span>
                      </div>
                    ))}
                    
                    {(!selectedTask.subtasks || selectedTask.subtasks.length === 0) && (
                      <p className="text-[10px] text-[#8B95A5] italic bg-[#181D2A] p-3 rounded-xl border border-[#0F131E]/5 border-dashed text-center">
                        No checklist subtasks added yet. Define minor tasks to unlock goals!
                      </p>
                    )}
                  </div>

                  {/* Add Subtask Form */}
                  <form onSubmit={handleAddSubtask} className="flex items-center gap-2">
                    <input 
                      type="text"
                      value={newSubtaskTitle}
                      onChange={e => setNewSubtaskTitle(e.target.value)}
                      placeholder="+ Add checklist subtask..."
                      className="flex-1 bg-[#181D2A] border border-[#0F131E]/5 rounded-xl px-3 py-2 text-xs focus:border-[#7B5CFA] outline-none transition font-bold"
                    />
                    <button 
                      type="submit"
                      className="bg-gray-900 hover:bg-black text-white px-3.5 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition"
                    >
                      Add
                    </button>
                  </form>
                </div>

                {/* 6. Chronological Comments System */}
                <div className="border-t border-[#0F131E]/5 pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-[9px] font-black text-[#8B95A5] uppercase tracking-widest">💬 Task Comments feed</label>
                    <span className="text-[8px] font-black bg-white/5 text-[#8B95A5] px-2 py-0.5 rounded">
                      {selectedTask.comments?.length || 0} Comments
                    </span>
                  </div>

                  {/* Comment input form */}
                  <form onSubmit={handleAddTaskComment} className="flex items-start gap-2">
                    <input 
                      type="text"
                      value={commentInput}
                      onChange={e => setCommentInput(e.target.value)}
                      placeholder="Discuss changes, ask clarification, or comment..."
                      className="flex-1 bg-[#181D2A] border border-[#0F131E]/5 rounded-xl px-3 py-2 text-xs focus:border-[#7B5CFA] outline-none transition font-medium"
                    />
                    <button 
                      type="submit"
                      className="bg-[#7B5CFA] hover:bg-[#7B5CFA]Hover text-white px-3.5 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition"
                    >
                      Comment
                    </button>
                  </form>

                  {/* Chronological comments thread */}
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1 no-scrollbar">
                    {selectedTask.comments?.slice().sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt)).map(c => {
                      const isSystem = c.user?.username === 'SYSTEM' || !c.user;
                      return (
                        <div key={c.id} className={`p-3 rounded-2xl border ${isSystem ? 'bg-amber-50/50 border-amber-100/50 text-amber-900' : 'bg-[#181D2A] border-[#0F131E]/5'}`}>
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase tracking-wider">
                              {isSystem ? '⚠️ SYSTEM UPDATE' : `@${c.user?.username}`}
                            </span>
                            <span className="text-[8px] text-[#8B95A5]">
                              {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs mt-1 font-medium leading-relaxed">{c.content}</p>
                        </div>
                      );
                    })}

                    {(!selectedTask.comments || selectedTask.comments.length === 0) && (
                      <p className="text-[10px] text-[#8B95A5] italic text-center py-2">
                        No team discussion yet. Start the conversation!
                      </p>
                    )}
                  </div>
                </div>

                {/* 7. Chronological Audit Trail Activity Log */}
                <div className="border-t border-[#0F131E]/5 pt-6 space-y-3">
                  <label className="block text-[9px] font-black text-[#8B95A5] uppercase tracking-widest">⏳ Audit Trail Activity Log</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1 no-scrollbar">
                    {(() => {
                      let logs = [];
                      try {
                        if (selectedTask.activityLog) {
                          logs = typeof selectedTask.activityLog === 'string' 
                            ? JSON.parse(selectedTask.activityLog) 
                            : selectedTask.activityLog;
                        }
                      } catch (err) {
                        console.error(err);
                      }
                      
                      if (logs.length === 0) {
                        return <p className="text-[10px] text-[#8B95A5] italic text-center py-2">No activity events logged yet.</p>;
                      }

                      return logs.slice().reverse().map((log, idx) => (
                        <div key={idx} className="flex items-start gap-2 bg-[#181D2A]/60 p-2 rounded-lg border border-[#0F131E]/5 text-[10px] text-[#8B95A5] font-bold">
                          <Clock size={12} className="mt-0.5 text-[#8B95A5] flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-white font-black">
                              {log.user ? `${log.user}` : 'Someone'} {log.action}
                            </p>
                            <p className="text-[8px] text-[#8B95A5] mt-0.5">
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

      {/* Mandatory Rejection Prompt Modal Dialog */}
      <AnimatePresence>
        {isRejectionModalOpen && pendingRejectionTask && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[160] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0F131E] border border-[#0F131E]/5 rounded-[2rem] w-full max-w-md shadow-2xl p-6 relative overflow-hidden"
            >
              <div className="flex items-center gap-2.5 text-rose-600 mb-3">
                <AlertTriangle size={24} className="text-rose-500 animate-bounce" />
                <h3 className="text-lg font-black tracking-tight uppercase">Mandatory Rejection Comment</h3>
              </div>

              <p className="text-xs text-[#8B95A5] font-medium leading-relaxed mb-4">
                You are regressing task <span className="font-bold text-white">({pendingRejectionTask.taskCode})</span> back from Under Review/Approved. 
                Please enter a mandatory rejection explanation so the assigned creative knows what changes are requested.
              </p>

              <textarea 
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                required
                rows={4}
                placeholder="e.g. Hero design needs more rounded corners. Font is also too small..."
                className="w-full bg-[#181D2A] border border-[#0F131E]/5 rounded-xl px-4 py-3 text-xs outline-none focus:border-rose-500 focus:bg-[#0F131E] transition font-medium"
              />

              <div className="flex gap-3 mt-5">
                <button 
                  type="button"
                  onClick={() => {
                    setIsRejectionModalOpen(false);
                    setPendingRejectionTask(null);
                    setPendingRejectionStatus(null);
                  }}
                  className="flex-1 py-3 bg-[#181D2A] border border-[#0F131E]/5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    if (!rejectionReason.trim()) {
                      alert("Rejection reason cannot be blank.");
                      return;
                    }
                    updateTaskStatus(pendingRejectionTask.id, pendingRejectionStatus, rejectionReason.trim());
                    setIsRejectionModalOpen(false);
                    setPendingRejectionTask(null);
                    setPendingRejectionStatus(null);
                  }}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-600/25 transition animate-pulse"
                >
                  Confirm Rejection
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CircleWorkspace;
