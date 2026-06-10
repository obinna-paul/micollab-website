import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  FolderOpen, HardDrive, Search, Grid, List, Plus, X, Folder, FileText,
  Download, Trash2, Edit3, Share2, Layers, Clock, Activity, Users, Lock,
  ChevronRight, Trash, Info, Sparkles, Move, ChevronDown, CheckCircle,
  Image as ImageIcon, Video, Music, Link2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../store/useAuthStore';
import FileDetailDrawer from '../components/files/FileDetailDrawer';

const FilesHub = ({ circleIdScope = null }) => {
  const { user, token } = useAuthStore();
  const location = useLocation();

  // Scope selection
  const [circles, setCircles] = useState([]);
  const [selectedCircleId, setSelectedCircleId] = useState(circleIdScope || '');
  const [circleMembers, setCircleMembers] = useState([]);
  const [isCircleSelectorOpen, setIsCircleSelectorOpen] = useState(false);

  // Layout & Navigation Sidebar
  const [sidebarTab, setSidebarTab] = useState('EXPLORER'); // EXPLORER, SHARED, TRASH, DASHBOARD
  const [viewMode, setViewMode] = useState('GRID'); // GRID or LIST
  const [categoryFilter, setCategoryFilter] = useState('ALL'); // ALL, IMAGE, VIDEO, AUDIO, DOCS, ARCHIVE
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('DATE_DESC'); // NAME_ASC, NAME_DESC, SIZE_DESC, DATE_DESC

  // Folder nesting hierarchy
  const [folders, setFolders] = useState([]);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  
  // Files states
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  // Creation Modals
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#3b82f6');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  // Storage Stats State
  const [storageStats, setStorageStats] = useState(null);
  const [loadingStorage, setLoadingStorage] = useState(false);

  // Drag and Drop State
  const [dragOverFolderId, setDragOverFolderId] = useState(null);

  const [loading, setLoading] = useState(true);

  const headers = { Authorization: `Bearer ${token}` };

  // Fetch user circles if no direct circleIdScope is passed
  useEffect(() => {
    const fetchCircles = async () => {
      try {
        const res = await axios.get('/api/circles', { headers });
        setCircles(res.data);
        if (!circleIdScope && res.data.length > 0) {
          // Check URL query parameters or search params first
          const params = new URLSearchParams(location.search);
          const circleQuery = params.get('circle');
          if (circleQuery && res.data.some(c => c.id === circleQuery)) {
            setSelectedCircleId(circleQuery);
          } else {
            setSelectedCircleId(res.data[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch circles:', err);
      }
    };

    if (token) fetchCircles();
  }, [token, circleIdScope, location.search]);

  // Fetch files and folders for the selected circle
  const fetchCircleData = async () => {
    if (!selectedCircleId) return;
    setLoading(true);
    try {
      const [filesRes, foldersRes, membersRes] = await Promise.all([
        axios.get(`/api/circles/${selectedCircleId}/files`, { headers }),
        axios.get(`/api/circles/${selectedCircleId}/folders`, { headers }),
        axios.get(`/api/circles/${selectedCircleId}/details`, { headers }) // contains members array
      ]);

      setFiles(filesRes.data);
      setFolders(foldersRes.data);
      setCircleMembers(membersRes.data.members || []);

      // If active drawer is open, refresh selected file state
      if (selectedFile) {
        const refreshedFile = filesRes.data.find(f => f.id === selectedFile.id);
        if (refreshedFile) setSelectedFile(refreshedFile);
      }
    } catch (err) {
      console.error('Failed to fetch circle asset folders & files:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCircleId) {
      setCurrentFolderId(null); // Reset navigation
      fetchCircleData();
      if (sidebarTab === 'DASHBOARD') fetchStorageStats();
    }
  }, [selectedCircleId, sidebarTab]);

  // Fetch storage stats
  const fetchStorageStats = async () => {
    if (!selectedCircleId) return;
    setLoadingStorage(true);
    try {
      const res = await axios.get(`/api/circles/${selectedCircleId}/storage`, { headers });
      setStorageStats(res.data);
    } catch (err) {
      console.error('Failed to fetch storage dashboard metrics:', err);
    } finally {
      setLoadingStorage(false);
    }
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim() || isCreatingFolder) return;
    setIsCreatingFolder(true);
    try {
      const res = await axios.post(`/api/circles/${selectedCircleId}/folders`, {
        name: newFolderName.trim(),
        parentId: currentFolderId,
        color: newFolderColor
      }, { headers });

      setFolders([...folders, res.data]);
      setNewFolderName('');
      setIsNewFolderModalOpen(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create folder');
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleManualUpload = async (e) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const formData = new FormData();
    for (let i = 0; i < selectedFiles.length; i++) {
      formData.append('files', selectedFiles[i]);
    }
    if (currentFolderId) {
      formData.append('folderId', currentFolderId);
    }

    try {
      const res = await axios.post(`/api/circles/${selectedCircleId}/files`, formData, {
        headers: {
          ...headers,
          'Content-Type': 'multipart/form-data'
        }
      });
      // Append returned uploads to grid
      const newFiles = Array.isArray(res.data) ? res.data : [res.data];
      setFiles([...newFiles, ...files]);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to upload files');
    }
  };

  // Drag and Drop movement
  const handleDragStart = (e, fileId) => {
    e.dataTransfer.setData('text/plain', fileId);
  };

  const handleDragOver = (e, folderId) => {
    e.preventDefault();
    setDragOverFolderId(folderId);
  };

  const handleDragLeave = () => {
    setDragOverFolderId(null);
  };

  const handleDrop = async (e, destFolderId) => {
    e.preventDefault();
    setDragOverFolderId(null);
    const fileId = e.dataTransfer.getData('text/plain');
    if (!fileId) return;

    try {
      const res = await axios.put(`/api/files/details/${fileId}`, {
        folderId: destFolderId
      }, { headers });

      // Refresh files list
      setFiles(files.map(f => f.id === fileId ? { ...f, folderId: destFolderId } : f));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to move file');
    }
  };

  // Trash commands
  const handleTrashOperation = async (fileId, action) => {
    if (action === 'HARD_DELETE' && !window.confirm('Are you sure you want to permanently delete this asset? This action is irreversible.')) return;
    try {
      await axios.post(`/api/files/trash/${fileId}`, { action }, { headers });
      if (action === 'TRASH') {
        setFiles(files.map(f => f.id === fileId ? { ...f, isDeleted: true } : f));
      } else if (action === 'RESTORE') {
        setFiles(files.map(f => f.id === fileId ? { ...f, isDeleted: false } : f));
      } else {
        setFiles(files.filter(f => f.id !== fileId));
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Trash command failed');
    }
  };

  const handleDeleteFolder = async (folderId) => {
    if (!window.confirm('Are you sure you want to delete this folder? All contained files will be moved to the Trash bin.')) return;
    try {
      await axios.delete(`/api/folders/${folderId}`, { headers });
      setFolders(folders.filter(f => f.id !== folderId));
      // Trashed files locally
      setFiles(files.map(f => f.folderId === folderId ? { ...f, isDeleted: true } : f));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete folder');
    }
  };

  // Breadcrumbs calculation
  const getBreadcrumbs = () => {
    const crumbs = [];
    let currentId = currentFolderId;
    while (currentId) {
      const folder = folders.find(f => f.id === currentId);
      if (folder) {
        crumbs.unshift(folder);
        currentId = folder.parentId;
      } else {
        currentId = null;
      }
    }
    return crumbs;
  };

  // Enforce filter queries
  const activeCircleName = circles.find(c => c.id === selectedCircleId)?.title || 'Workspace';

  // Folders inside active scoped folder
  const currentFolders = folders.filter(f => f.parentId === currentFolderId);

  // Active files inside current view
  let viewableFiles = [];
  if (sidebarTab === 'EXPLORER') {
    viewableFiles = files.filter(f => !f.isDeleted && f.folderId === currentFolderId);
  } else if (sidebarTab === 'SHARED') {
    // Shared with me: uploader !== current user
    viewableFiles = files.filter(f => !f.isDeleted && f.uploadedBy !== user?.id);
  } else if (sidebarTab === 'TRASH') {
    viewableFiles = files.filter(f => f.isDeleted);
  }

  // Enforce Category MIME filters
  if (categoryFilter !== 'ALL') {
    viewableFiles = viewableFiles.filter(f => {
      const type = (f.type || '').toLowerCase();
      const ext = f.originalName.substring(f.originalName.lastIndexOf('.')).toLowerCase();
      if (categoryFilter === 'IMAGE') return type.startsWith('image/') || ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'].includes(ext);
      if (categoryFilter === 'VIDEO') return type.startsWith('video/') || ['.mp4', '.mkv', '.avi', '.mov', '.webm'].includes(ext);
      if (categoryFilter === 'AUDIO') return type.startsWith('audio/') || ['.mp3', '.wav', '.ogg', '.m4a'].includes(ext);
      if (categoryFilter === 'ARCHIVE') return ['.zip', '.rar', '.tar', '.gz', '.7z'].includes(ext);
      if (categoryFilter === 'DOCS') return !type.startsWith('image/') && !type.startsWith('video/') && !type.startsWith('audio/') && !['.zip', '.rar'].includes(ext);
      return true;
    });
  }

  // Enforce Search Match
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    viewableFiles = viewableFiles.filter(f =>
      f.originalName.toLowerCase().includes(q) ||
      (f.sourceTaskId && f.sourceTaskId.toLowerCase().includes(q))
    );
  }

  // Sort calculations
  viewableFiles = viewableFiles.sort((a, b) => {
    if (sortBy === 'NAME_ASC') return a.originalName.localeCompare(b.originalName);
    if (sortBy === 'NAME_DESC') return b.originalName.localeCompare(a.originalName);
    if (sortBy === 'SIZE_DESC') return (b.size || 0) - (a.size || 0);
    if (sortBy === 'DATE_DESC') return new Date(b.createdAt) - new Date(a.createdAt);
    return 0;
  });

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIconColor = (mime, name) => {
    const ext = name.substring(name.lastIndexOf('.')).toLowerCase();
    if (mime.startsWith('image/')) return 'text-rose-500 bg-rose-50';
    if (mime.startsWith('video/')) return 'text-purple-500 bg-purple-50';
    if (mime.startsWith('audio/')) return 'text-emerald-500 bg-emerald-50';
    if (['.zip', '.rar', '.7z'].includes(ext)) return 'text-amber-500 bg-amber-50';
    if (ext === '.pdf') return 'text-red-500 bg-red-50';
    return 'text-blue-500 bg-blue-50';
  };

  const renderFileIcon = (mime, name, size = 18) => {
    const ext = name.substring(name.lastIndexOf('.')).toLowerCase();
    if (mime.startsWith('image/')) return <ImageIcon size={size} />;
    if (mime.startsWith('video/')) return <Video size={size} />;
    if (mime.startsWith('audio/')) return <Music size={size} />;
    if (['.zip', '.rar'].includes(ext)) return <Layers size={size} />;
    return <FileText size={size} />;
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex bg-[var(--bg-surface-alt)]/50">
      
      {/* ── SIDEBAR SECTIONS PANEL ── */}
      <div className="w-64 border-r border-[#0F131E]/5 bg-[var(--bg-base)] flex flex-col p-4 space-y-6">
        
        {/* Circle Selector */}
        {!circleIdScope && (
          <div className="relative">
            <button
              onClick={() => setIsCircleSelectorOpen(!isCircleSelectorOpen)}
              className="w-full bg-[var(--bg-surface-alt)] border border-[#0F131E]/5 hover:border-[#7B5CFA] rounded-xl px-4 py-3 text-left font-black text-xs text-[var(--text-primary)] flex items-center justify-between transition"
            >
              <span className="truncate uppercase tracking-wider">{activeCircleName}</span>
              <ChevronDown size={14} className="text-[var(--text-secondary)]" />
            </button>
            
            <AnimatePresence>
              {isCircleSelectorOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsCircleSelectorOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute left-0 right-0 mt-2 bg-[var(--bg-base)] border border-[#0F131E]/5 shadow-xl rounded-xl p-1.5 z-20 space-y-1 max-h-48 overflow-y-auto no-scrollbar"
                  >
                    {circles.map(c => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setSelectedCircleId(c.id);
                          setIsCircleSelectorOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs font-bold rounded-lg transition ${
                          c.id === selectedCircleId ? 'bg-[#7B5CFA]/5 text-[#7B5CFA]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-alt)]'
                        }`}
                      >
                        {c.title}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Action Sidebar buttons */}
        <div className="space-y-1.5">
          {[
            { id: 'EXPLORER', label: 'Circle Storage Explorer', icon: FolderOpen },
            { id: 'SHARED', label: 'Shared with Me', icon: Users },
            { id: 'TRASH', label: 'Trash Recycling Bin', icon: Trash },
            { id: 'DASHBOARD', label: 'Storage Dashboard', icon: HardDrive }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setSidebarTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition ${
                  sidebarTab === tab.id
                    ? 'bg-[#7B5CFA]/5 text-[#7B5CFA] border-l-4 border-[#7B5CFA]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-alt)]'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── EXPLORER MAIN CONTENTS AREA ── */}
      <div className="flex-1 flex flex-col p-6 space-y-6 overflow-x-hidden">
        
        {/* Explorer Toolbar header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-[#0F131E]/5 pb-4">
          
          {/* Breadcrumb Trail */}
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] flex-wrap">
            <button
              onClick={() => setCurrentFolderId(null)}
              className="hover:text-[#7B5CFA] font-black uppercase tracking-wider text-[10px]"
            >
              Root
            </button>
            {getBreadcrumbs().map((crumb, idx) => (
              <React.Fragment key={crumb.id || idx}>
                <ChevronRight size={10} />
                <button
                  onClick={() => setCurrentFolderId(crumb.id)}
                  style={{ color: crumb.color }}
                  className="hover:underline font-black uppercase tracking-wider text-[10px]"
                >
                  {crumb.name}
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* Quick upload / folder action button triggers */}
          {sidebarTab === 'EXPLORER' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsNewFolderModalOpen(true)}
                className="flex items-center gap-1.5 border border-[#0F131E]/5 hover:border-[#7B5CFA] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)] transition bg-[var(--bg-base)]"
              >
                <Plus size={14} /> New Folder
              </button>
              
              <label className="flex items-center gap-1.5 bg-[#7B5CFA] hover:bg-[#7B5CFA]Hover text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition cursor-pointer shadow-lg shadow-[#7B5CFA]/10">
                <Plus size={14} /> Upload Deliverable
                <input
                  type="file"
                  multiple
                  onChange={handleManualUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>

        {/* ── VIEW 1: EXPLORER / MY FILES ── */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#7B5CFA] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {sidebarTab === 'EXPLORER' && (
              <>
                {/* Categories Tabs Filter */}
                <div className="flex border-b border-[#0F131E]/5 p-0.5 max-w-lg bg-[var(--bg-base)] rounded-xl border">
                  {[
                    { id: 'ALL', label: 'All Files' },
                    { id: 'IMAGE', label: 'Images' },
                    { id: 'VIDEO', label: 'Videos' },
                    { id: 'AUDIO', label: 'Audio' },
                    { id: 'DOCS', label: 'Documents' },
                    { id: 'ARCHIVE', label: 'Archives' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setCategoryFilter(tab.id)}
                      className={`flex-1 py-1.5 text-center rounded-lg text-[9px] font-black uppercase tracking-wider transition ${
                        categoryFilter === tab.id
                          ? 'bg-[#7B5CFA]/5 text-[#7B5CFA]'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Subheader: Folder layout */}
                {currentFolders.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest flex items-center gap-1">
                      <Folder size={10} /> Directories Tree
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {currentFolders.map(folder => (
                        <div
                          key={folder.id}
                          onDragOver={(e) => handleDragOver(e, folder.id)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, folder.id)}
                          className={`relative border rounded-2xl p-4 bg-[var(--bg-base)] hover:shadow-md cursor-pointer transition flex items-center justify-between group ${
                            dragOverFolderId === folder.id ? 'border-[#7B5CFA] bg-[#7B5CFA]/5 ring-4 ring-primary/10' : 'border-[#0F131E]/5'
                          }`}
                          onClick={() => setCurrentFolderId(folder.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              style={{ backgroundColor: `${folder.color}15`, color: folder.color }}
                              className="w-10 h-10 rounded-xl flex items-center justify-center"
                            >
                              <Folder size={20} />
                            </div>
                            <div>
                              <p className="font-black text-[var(--text-primary)] text-xs leading-tight">{folder.name}</p>
                              <p className="text-[8px] font-black text-[var(--text-secondary)] uppercase tracking-widest mt-0.5">Dir Scope</p>
                            </div>
                          </div>

                          {/* Delete Folder button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFolder(folder.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-rose-50 rounded-lg text-rose-500 transition"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Subheader: Active Files Explorer */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest flex items-center gap-1">
                      <FileText size={10} /> Deliverables Explorer
                    </h4>
                    
                    {/* Grid/List View Toggles */}
                    <div className="flex border border-[#0F131E]/5 bg-[var(--bg-base)] rounded-lg p-0.5 gap-0.5">
                      <button
                        onClick={() => setViewMode('GRID')}
                        className={`p-1 rounded ${viewMode === 'GRID' ? 'bg-[#7B5CFA]/5 text-[#7B5CFA]' : 'text-[var(--text-secondary)] hover:text-white'}`}
                      >
                        <Grid size={14} />
                      </button>
                      <button
                        onClick={() => setViewMode('LIST')}
                        className={`p-1 rounded ${viewMode === 'LIST' ? 'bg-[#7B5CFA]/5 text-[#7B5CFA]' : 'text-[var(--text-secondary)] hover:text-white'}`}
                      >
                        <List size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Grid Layout View */}
                  {viewMode === 'GRID' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {viewableFiles.map(file => (
                        <div
                          key={file.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, file.id)}
                          onClick={() => {
                            setSelectedFile(file);
                            setIsDetailDrawerOpen(true);
                          }}
                          className="border border-[#0F131E]/5 rounded-2xl p-4 bg-[var(--bg-base)] hover:shadow-md cursor-pointer transition flex flex-col justify-between aspect-square group relative"
                        >
                          {/* File extension colored icon */}
                          <div className="flex justify-between items-start">
                            <div className={`p-3 rounded-xl flex items-center justify-center ${getFileIconColor(file.type, file.originalName)}`}>
                              {renderFileIcon(file.type, file.originalName, 22)}
                            </div>
                            
                            {/* Delete File to Trash */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTrashOperation(file.id, 'TRASH');
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg transition"
                            >
                              <Trash size={14} />
                            </button>
                          </div>

                          {/* File Details name / size */}
                          <div className="mt-4">
                            <h5 className="font-black text-[var(--text-primary)] text-xs leading-snug break-all line-clamp-2">{file.originalName}</h5>
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#0F131E]/5/50">
                              <span className="text-[9px] font-bold text-[var(--text-secondary)]">{formatSize(file.size)}</span>
                              <span className="text-[8px] font-black text-[#7B5CFA] uppercase tracking-wider bg-[#7B5CFA]/5 px-2 py-0.5 rounded">v{file.version}</span>
                            </div>
                          </div>
                        </div>
                      ))}

                      {viewableFiles.length === 0 && (
                        <div className="col-span-full border-2 border-dashed border-[#0F131E]/5 rounded-2xl py-12 text-center">
                          <FolderOpen className="text-[var(--text-secondary)] mx-auto opacity-50 mb-3" size={32} />
                          <p className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider">Directory is Empty</p>
                          <p className="text-[10px] text-[var(--text-secondary)] mt-1">Upload files or drag deliverables here.</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* List Layout View Table */
                    <div className="bg-[var(--bg-base)] border border-[#0F131E]/5 rounded-2xl overflow-hidden shadow-sm">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[#0F131E]/5 bg-[var(--bg-surface-alt)]/50 text-[8px] font-black text-[var(--text-secondary)] uppercase tracking-widest">
                            <th className="p-4">Name</th>
                            <th className="p-4">Size</th>
                            <th className="p-4">Type</th>
                            <th className="p-4">Uploaded By</th>
                            <th className="p-4">Version</th>
                            <th className="p-4">Task Source</th>
                            <th className="p-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-divider">
                          {viewableFiles.map(file => (
                            <tr
                              key={file.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, file.id)}
                              onClick={() => {
                                setSelectedFile(file);
                                setIsDetailDrawerOpen(true);
                              }}
                              className="hover:bg-[var(--bg-surface-alt)]/50 cursor-pointer transition text-xs font-medium text-[var(--text-primary)]"
                            >
                              <td className="p-4 flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${getFileIconColor(file.type, file.originalName)}`}>
                                  {renderFileIcon(file.type, file.originalName, 14)}
                                </div>
                                <span className="font-bold break-all max-w-xs">{file.originalName}</span>
                              </td>
                              <td className="p-4 text-[var(--text-secondary)] font-bold">{formatSize(file.size)}</td>
                              <td className="p-4 text-[var(--text-secondary)] truncate max-w-[100px]">{file.type}</td>
                              <td className="p-4 font-bold text-[#7B5CFA]">{file.uploader?.username || 'member'}</td>
                              <td className="p-4"><span className="text-[9px] font-black bg-[#7B5CFA]/5 px-2 py-0.5 rounded text-[#7B5CFA] border border-[#7B5CFA]/10">v{file.version}</span></td>
                              <td className="p-4">
                                {file.sourceTaskId ? (
                                  <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[8px] font-black px-2 py-0.5 rounded uppercase">{file.sourceTaskId}</span>
                                ) : (
                                  <span className="text-[var(--text-secondary)] opacity-60 text-[9px] font-bold">—</span>
                                )}
                              </td>
                              <td className="p-4 text-right">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTrashOperation(file.id, 'TRASH');
                                  }}
                                  className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                                >
                                  <Trash size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}

                          {viewableFiles.length === 0 && (
                            <tr>
                              <td colSpan="7" className="p-12 text-center">
                                <FolderOpen className="text-[var(--text-secondary)] mx-auto opacity-50 mb-3" size={32} />
                                <p className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider">No files explorer match</p>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ── VIEW 2: SHARED WITH ME ── */}
            {sidebarTab === 'SHARED' && (
              <div className="space-y-4">
                <div className="bg-indigo-50/50 border border-indigo-100 p-5 rounded-2xl flex gap-3 max-w-3xl">
                  <Users size={18} className="text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-black text-indigo-900 text-xs uppercase tracking-widest">Shared Deliverables Area</h4>
                    <p className="text-[10px] text-indigo-700 mt-1 leading-normal">
                      This page aggregates all design artifacts, audios, and documents completed across circles which team members have granted you access to.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {viewableFiles.map(file => (
                    <div
                      key={file.id}
                      onClick={() => {
                        setSelectedFile(file);
                        setIsDetailDrawerOpen(true);
                      }}
                      className="border border-[#0F131E]/5 rounded-2xl p-4 bg-[var(--bg-base)] hover:shadow-md cursor-pointer transition flex flex-col justify-between aspect-square group"
                    >
                      <div className={`p-3 rounded-xl self-start ${getFileIconColor(file.type, file.originalName)}`}>
                        {renderFileIcon(file.type, file.originalName, 22)}
                      </div>
                      
                      <div className="mt-4">
                        <h5 className="font-black text-[var(--text-primary)] text-xs leading-snug break-all line-clamp-2">{file.originalName}</h5>
                        <p className="text-[9px] font-bold text-[var(--text-secondary)] mt-1">From {file.uploader?.username || 'member'}</p>
                        
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#0F131E]/5/50">
                          <span className="text-[9px] font-bold text-[var(--text-secondary)]">{formatSize(file.size)}</span>
                          <span className="text-[8px] font-black text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded">v{file.version}</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {viewableFiles.length === 0 && (
                    <div className="col-span-full border-2 border-dashed border-[#0F131E]/5 rounded-2xl py-12 text-center bg-[var(--bg-base)]">
                      <Users className="text-[var(--text-secondary)] mx-auto opacity-50 mb-3" size={32} />
                      <p className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider">No files shared yet</p>
                      <p className="text-[10px] text-[var(--text-secondary)] mt-1">Files shared by team members will appear here.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── VIEW 3: TRASH RECYCLING BIN ── */}
            {sidebarTab === 'TRASH' && (
              <div className="space-y-4">
                <div className="bg-rose-50/50 border border-rose-100 p-5 rounded-2xl flex gap-3 max-w-3xl">
                  <Trash size={18} className="text-rose-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-black text-rose-900 text-xs uppercase tracking-widest">Trash Recycling Bin</h4>
                    <p className="text-[10px] text-rose-700 mt-1 leading-normal">
                      Deleted files reside here for 30 days before permanent auto-purging. Admins can roll files back to active storage or purge immediately.
                    </p>
                  </div>
                </div>

                <div className="bg-[var(--bg-base)] border border-[#0F131E]/5 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#0F131E]/5 bg-[var(--bg-surface-alt)]/50 text-[8px] font-black text-[var(--text-secondary)] uppercase tracking-widest">
                        <th className="p-4">Asset</th>
                        <th className="p-4">Size</th>
                        <th className="p-4">Deleted Date</th>
                        <th className="p-4 text-right">Recovery Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-divider">
                      {viewableFiles.map(file => (
                        <tr key={file.id} className="text-xs font-medium text-[var(--text-primary)]">
                          <td className="p-4 flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${getFileIconColor(file.type, file.originalName)}`}>
                              {renderFileIcon(file.type, file.originalName, 14)}
                            </div>
                            <span className="font-bold break-all">{file.originalName}</span>
                          </td>
                          <td className="p-4 text-[var(--text-secondary)] font-bold">{formatSize(file.size)}</td>
                          <td className="p-4 text-[var(--text-secondary)]">
                            {file.deletedAt ? new Date(file.deletedAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                          </td>
                          <td className="p-4 text-right flex justify-end gap-2">
                            <button
                              onClick={() => handleTrashOperation(file.id, 'RESTORE')}
                              className="text-[9px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest px-3 py-1.5 rounded-lg border border-indigo-100 hover:bg-indigo-50 transition"
                            >
                              Restore
                            </button>
                            <button
                              onClick={() => handleTrashOperation(file.id, 'HARD_DELETE')}
                              className="text-[9px] font-black text-rose-600 hover:text-rose-800 uppercase tracking-widest px-3 py-1.5 rounded-lg border border-rose-100 hover:bg-rose-50 transition"
                            >
                              Purge Permanent
                            </button>
                          </td>
                        </tr>
                      ))}

                      {viewableFiles.length === 0 && (
                        <tr>
                          <td colSpan="4" className="p-12 text-center text-[var(--text-secondary)] text-xs font-bold uppercase tracking-wider">
                            Recycling bin is completely clean!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── VIEW 4: STORAGE DASHBOARD OVERVIEW ── */}
            {sidebarTab === 'DASHBOARD' && (
              <div className="space-y-6">
                
                {loadingStorage || !storageStats ? (
                  <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-4 border-[#7B5CFA] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <>
                    {/* Storage progress details */}
                    <div className="bg-[var(--bg-base)] border border-[#0F131E]/5 rounded-3xl p-6 shadow-sm space-y-4 max-w-4xl">
                      <div className="flex justify-between items-center text-xs">
                        <div>
                          <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Workspace Storage Usage</p>
                          <p className="font-black text-[var(--text-primary)] text-lg mt-1">{formatSize(storageStats.totalUsed)} used <span className="text-[var(--text-secondary)] text-xs font-normal">of {formatSize(storageStats.limit)}</span></p>
                        </div>
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100 shadow-sm">
                          {((storageStats.totalUsed / storageStats.limit) * 100).toFixed(1)}% Capacity
                        </span>
                      </div>

                      {/* Custom Horizontal Progress Bar */}
                      <div className="h-4 bg-white/5 rounded-full overflow-hidden flex shadow-inner">
                        <div style={{ width: `${(storageStats.fileTypeStats.images / storageStats.limit) * 100}%` }} className="bg-rose-500 h-full" title="Images" />
                        <div style={{ width: `${(storageStats.fileTypeStats.video / storageStats.limit) * 100}%` }} className="bg-purple-500 h-full" title="Videos" />
                        <div style={{ width: `${(storageStats.fileTypeStats.audio / storageStats.limit) * 100}%` }} className="bg-emerald-500 h-full" title="Audio" />
                        <div style={{ width: `${(storageStats.fileTypeStats.archives / storageStats.limit) * 100}%` }} className="bg-amber-500 h-full" title="Archives" />
                        <div style={{ width: `${(storageStats.fileTypeStats.docs / storageStats.limit) * 100}%` }} className="bg-blue-500 h-full" title="Documents" />
                      </div>

                      {/* Colors Legend checklist */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 text-[10px] font-bold text-[var(--text-secondary)]">
                        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-rose-500 flex-shrink-0" /> Images ({formatSize(storageStats.fileTypeStats.images)})</div>
                        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-purple-500 flex-shrink-0" /> Videos ({formatSize(storageStats.fileTypeStats.video)})</div>
                        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500 flex-shrink-0" /> Audio ({formatSize(storageStats.fileTypeStats.audio)})</div>
                        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-500 flex-shrink-0" /> Archives ({formatSize(storageStats.fileTypeStats.archives)})</div>
                        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-blue-500 flex-shrink-0" /> Documents ({formatSize(storageStats.fileTypeStats.docs)})</div>
                      </div>
                    </div>

                    {/* Stat Cards Breakdown Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl">
                      <div className="bg-[var(--bg-base)] border border-[#0F131E]/5 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                        <div>
                          <p className="text-[8px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Active Public Links</p>
                          <p className="font-black text-[var(--text-primary)] text-xl mt-1">{storageStats.activePublicLinksCount}</p>
                        </div>
                        <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600"><Link2 size={18} /></div>
                      </div>
                      <div className="bg-[var(--bg-base)] border border-[#0F131E]/5 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                        <div>
                          <p className="text-[8px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Private Unshared Assets</p>
                          <p className="font-black text-[var(--text-primary)] text-xl mt-1">{storageStats.unsharedFilesCount}</p>
                        </div>
                        <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-600"><Lock size={18} /></div>
                      </div>
                      <div className="bg-[var(--bg-base)] border border-[#0F131E]/5 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                        <div>
                          <p className="text-[8px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Trashed Recovery Assets</p>
                          <p className="font-black text-[var(--text-primary)] text-xl mt-1">{storageStats.trashedCount}</p>
                        </div>
                        <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600"><Trash2 size={18} /></div>
                      </div>
                    </div>

                    {/* Largest Files Table List */}
                    <div className="bg-[var(--bg-base)] border border-[#0F131E]/5 rounded-2xl shadow-sm overflow-hidden max-w-4xl space-y-4 p-5">
                      <h4 className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest flex items-center gap-1.5"><Sparkles size={10} /> Top Largest Creative Assets</h4>
                      
                      <div className="divide-y divide-divider">
                        {storageStats.largestFiles.map((file, idx) => (
                          <div
                            key={file.id || idx}
                            onClick={() => {
                              // Find local file reference
                              const fObj = files.find(f => f.id === file.id);
                              if (fObj) {
                                setSelectedFile(fObj);
                                setIsDetailDrawerOpen(true);
                              }
                            }}
                            className="py-3 flex items-center justify-between hover:bg-[var(--bg-surface-alt)]/50 cursor-pointer transition text-xs font-bold"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-black text-[var(--text-secondary)] bg-white/5 px-2 py-0.5 rounded">#{idx + 1}</span>
                              <span className="text-[var(--text-primary)] break-all truncate max-w-xs">{file.name}</span>
                            </div>
                            <span className="text-[var(--text-secondary)] font-bold">{formatSize(file.size)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}

      </div>

      {/* ── CREATE FOLDER DIALOG MODAL ── */}
      <AnimatePresence>
        {isNewFolderModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNewFolderModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-[var(--bg-base)] border border-[#0F131E]/5 p-6 rounded-3xl shadow-2xl space-y-5 z-10"
            >
              <div className="text-center">
                <h3 className="font-black text-[var(--text-primary)] text-sm uppercase tracking-wider">Initialize Folder Directory</h3>
                <p className="text-[10px] text-[var(--text-secondary)] mt-1">Configure nested folders for team-sync deliverables.</p>
              </div>

              <form onSubmit={handleCreateFolder} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Directory Name</label>
                  <input
                    type="text"
                    required
                    value={newFolderName}
                    onChange={e => setNewFolderName(e.target.value)}
                    placeholder="E.g. Logo Deliverables..."
                    className="w-full bg-[var(--bg-surface-alt)] border border-[#0F131E]/5 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-[#7B5CFA] transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-black text-[var(--text-secondary)] uppercase tracking-widest block mb-1">Color Palette Accent</label>
                  <div className="flex gap-2.5">
                    {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'].map(color => (
                      <button
                        type="button"
                        key={color}
                        style={{ backgroundColor: color }}
                        onClick={() => setNewFolderColor(color)}
                        className={`w-6 h-6 rounded-full border-2 transition ${
                          newFolderColor === color ? 'border-black scale-110 shadow-md' : 'border-[#0F131E]'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isCreatingFolder || !newFolderName.trim()}
                  className="w-full bg-[#7B5CFA] hover:bg-[#7B5CFA]Hover text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#7B5CFA]/10 transition disabled:opacity-50"
                >
                  {isCreatingFolder ? 'Creating...' : 'Initialize Directory'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Slide-out details drawer */}
      <FileDetailDrawer
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        file={selectedFile}
        circleMembers={circleMembers}
        circleId={selectedCircleId}
        user={user}
        token={token}
        onFileUpdate={(updatedFile) => {
          // Replace locally updated file
          setFiles(files.map(f => f.id === updatedFile.id ? updatedFile : f));
          setSelectedFile(updatedFile);
        }}
      />

    </div>
  );
};

export default FilesHub;
