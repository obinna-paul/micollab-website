import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  X, Download, Trash2, Edit3, Share2, Link2, Users, Lock,
  ShieldAlert, Clock, Activity, CheckCircle2, FileText, Image as ImageIcon,
  Video, Music, Layers, Plus, ChevronRight, Info, CornerDownRight, Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FileDetailDrawer = ({
  isOpen,
  onClose,
  file,
  circleMembers = [],
  circleId,
  user,
  token,
  onFileUpdate
}) => {
  const [activeSubTab, setActiveSubTab] = useState('INFO'); // INFO, VERSION, SHARE, ANNOTATION, LOG
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  // Sharing states
  const [searchMemberQuery, setSearchMemberQuery] = useState('');
  const [selectedShareUser, setSelectedShareUser] = useState('');
  const [shareRole, setShareRole] = useState('DOWNLOAD'); // DOWNLOAD or EDIT
  const [isSharing, setIsSharing] = useState(false);

  // Version states
  const fileVersionRef = useRef(null);
  const [isUploadingVersion, setIsUploadingVersion] = useState(false);

  // Public Links states
  const [expiresInDays, setExpiresInDays] = useState('0'); // 0=Never, 1, 7, 30
  const [sharePassword, setSharePassword] = useState('');
  const [shareRoleLink, setShareRoleLink] = useState('VIEW'); // VIEW or DOWNLOAD
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [copiedLink, setCopiedLink] = useState('');

  // Comment & Annotations states
  const imagePreviewRef = useRef(null);
  const [commentInput, setCommentInput] = useState('');
  const [newPin, setNewPin] = useState(null); // { x, y }
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (file) {
      setEditedName(file.originalName || '');
      setIsEditingName(false);
      setNewPin(null);
      setCommentInput('');
    }
  }, [file]);

  if (!file) return null;

  // Enforce roles
  const isAdmin = file.permission === 'EDIT';
  const permissionLevel = file.permission || 'NONE'; // NONE, DOWNLOAD, EDIT

  // Parsed metadata columns
  let historyList = [];
  try { historyList = JSON.parse(file.versionHistory || '[]'); } catch (e) {}
  
  let sharingList = [];
  try { sharingList = JSON.parse(file.accessList || '[]'); } catch (e) {}

  let publicLinksList = [];
  try { publicLinksList = JSON.parse(file.publicLinks || '[]'); } catch (e) {}

  let commentsList = [];
  try { commentsList = JSON.parse(file.comments || '[]'); } catch (e) {}

  let activityList = [];
  try { activityList = JSON.parse(file.activityLog || '[]'); } catch (e) {}

  // File type checks
  const getExt = (fileUrl) => {
    const filename = fileUrl.substring(fileUrl.lastIndexOf('/') + 1);
    return filename.substring(filename.lastIndexOf('.')).toLowerCase();
  };
  const isImg = file.type.startsWith('image/') || ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'].includes(getExt(file.fileUrl));
  const isVid = file.type.startsWith('video/') || ['.mp4', '.mkv', '.avi', '.mov', '.webm'].includes(getExt(file.fileUrl));
  const isAud = file.type.startsWith('audio/') || ['.mp3', '.wav', '.ogg', '.m4a'].includes(getExt(file.fileUrl));
  const isPdf = getExt(file.fileUrl) === '.pdf' || file.type === 'application/pdf';

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleRename = async () => {
    if (!editedName.trim() || isSavingName) return;
    setIsSavingName(true);
    try {
      const res = await axios.put(`/api/files/details/${file.id}`, { name: editedName.trim() }, { headers });
      setIsEditingName(false);
      onFileUpdate(res.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to rename file');
    } finally {
      setIsSavingName(false);
    }
  };

  const handleGrantAccess = async (e) => {
    e.preventDefault();
    if (!selectedShareUser || isSharing) return;
    setIsSharing(true);
    try {
      const updatedSharing = [...sharingList.filter(s => s.userId !== selectedShareUser), {
        userId: selectedShareUser,
        role: shareRole
      }];

      const res = await axios.post(`/api/files/access/${file.id}`, {
        accessList: JSON.stringify(updatedSharing)
      }, { headers });

      setSelectedShareUser('');
      setSearchMemberQuery('');
      onFileUpdate(res.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to grant access');
    } finally {
      setIsSharing(false);
    }
  };

  const handleRevokeAccess = async (targetUserId) => {
    try {
      const updatedSharing = sharingList.filter(s => s.userId !== targetUserId);
      const res = await axios.post(`/api/files/access/${file.id}`, {
        accessList: JSON.stringify(updatedSharing)
      }, { headers });
      onFileUpdate(res.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to revoke access');
    }
  };

  const handleNewVersionUpload = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setIsUploadingVersion(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await axios.post(`/api/files/version/${file.id}`, formData, {
        headers: {
          ...headers,
          'Content-Type': 'multipart/form-data'
        }
      });
      onFileUpdate(res.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to upload version');
    } finally {
      setIsUploadingVersion(false);
      if (fileVersionRef.current) fileVersionRef.current.value = '';
    }
  };

  const handleRestoreVersion = async (verNum) => {
    if (!window.confirm(`Are you sure you want to restore file back to version v${verNum}?`)) return;
    try {
      const res = await axios.post(`/api/files/restore-version/${file.id}`, { version: verNum }, { headers });
      onFileUpdate(res.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to restore version');
    }
  };

  const handleCreatePublicLink = async (e) => {
    e.preventDefault();
    if (isGeneratingLink) return;
    setIsGeneratingLink(true);
    try {
      const res = await axios.post(`/api/files/public-links/${file.id}`, {
        action: 'CREATE',
        role: shareRoleLink,
        expiresInDays: parseInt(expiresInDays) || null,
        password: sharePassword
      }, { headers });

      setSharePassword('');
      setExpiresInDays('0');
      onFileUpdate(res.data.file);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create public link');
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleRevokePublicLink = async (linkId) => {
    try {
      const res = await axios.post(`/api/files/public-links/${file.id}`, {
        action: 'REVOKE',
        linkId
      }, { headers });
      onFileUpdate(res.data.file);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to revoke link');
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentInput.trim() || isSubmittingComment) return;
    setIsSubmittingComment(true);
    try {
      const pinsPayload = newPin ? [{ x: parseFloat(newPin.x.toFixed(2)), y: parseFloat(newPin.y.toFixed(2)), text: commentInput.trim() }] : null;

      const res = await axios.post(`/api/files/comments/${file.id}`, {
        action: 'ADD',
        content: commentInput.trim(),
        pins: pinsPayload
      }, { headers });

      setCommentInput('');
      setNewPin(null);
      onFileUpdate(res.data.file);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleResolveComment = async (commentId) => {
    try {
      const res = await axios.post(`/api/files/comments/${file.id}`, {
        action: 'RESOLVE',
        commentId
      }, { headers });
      onFileUpdate(res.data.file);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to resolve annotation');
    }
  };

  const handleImageClick = (e) => {
    if (permissionLevel !== 'EDIT' && !isAdmin) return;
    const rect = imagePreviewRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setNewPin({ x, y });
    setActiveSubTab('ANNOTATION');
  };

  const copyToClipboard = (linkId) => {
    const fullLink = `${window.location.origin}/share/${linkId}`;
    navigator.clipboard.writeText(fullLink);
    setCopiedLink(linkId);
    setTimeout(() => setCopiedLink(''), 2000);
  };

  // Find users that can be shared with (exclude already added ones, creator, and current user)
  const shareableUsers = circleMembers.filter(member => {
    if (member.userId === user?.id) return false;
    if (member.userId === file.uploadedBy) return false;
    const alreadyShared = sharingList.some(s => s.userId === member.userId);
    return !alreadyShared;
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Drawer content */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col z-10 border-l border-divider overflow-hidden"
          >
            {/* Header bar */}
            <div className="p-5 border-b border-divider flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-primary" />
                <span className="text-[10px] font-black text-textMain uppercase tracking-widest">Asset Workspace</span>
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-xl transition text-textMuted hover:text-textMain">
                <X size={18} />
              </button>
            </div>

            {/* Sidebar Subtabs Navigation */}
            <div className="flex bg-gray-50 border-b border-divider p-1">
              {[
                { id: 'INFO', label: 'File Info' },
                { id: 'VERSION', label: 'Versions' },
                { id: 'SHARE', label: 'Access Control' },
                { id: 'ANNOTATION', label: 'Discussion' },
                { id: 'LOG', label: 'Audit Log' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id)}
                  className={`flex-1 py-2 text-center rounded-lg text-[9px] font-black uppercase tracking-wider transition ${
                    activeSubTab === tab.id
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-textMuted hover:text-textMain'
                  }`}
                >
                  {tab.id === 'ANNOTATION' && commentsList.filter(c => !c.resolved).length > 0 ? (
                    <span className="relative inline-block">
                      {tab.label}
                      <span className="absolute -top-1.5 -right-2.5 bg-rose-500 text-[var(--text-primary)] text-[7px] w-3 h-3 rounded-full flex items-center justify-center font-black">
                        {commentsList.filter(c => !c.resolved).length}
                      </span>
                    </span>
                  ) : tab.label}
                </button>
              ))}
            </div>

            {/* Content view scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
              
              {/* ── INTERACTIVE PREVIEW PANEL ── */}
              <div className="relative bg-slate-950 rounded-2xl overflow-hidden aspect-video border border-slate-900 flex items-center justify-center shadow-inner group">
                {isImg ? (
                  <div className="relative w-full h-full cursor-crosshair" ref={imagePreviewRef} onClick={handleImageClick}>
                    <img src={file.fileUrl} alt={file.originalName} className="w-full h-full object-contain" />
                    {/* Render visual pins */}
                    {commentsList.map((comm, idx) => {
                      if (!comm.pins || comm.resolved) return null;
                      return comm.pins.map((pin, pIdx) => (
                        <div
                          key={`${comm.id}-${idx}-${pIdx}`}
                          style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                          className="absolute -translate-x-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-700 text-[var(--text-primary)] font-black text-[9px] w-5 h-5 rounded-full flex items-center justify-center shadow-lg border-2 border-white cursor-pointer select-none animate-bounce"
                          title={`#${idx + 1}: ${pin.text}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveSubTab('ANNOTATION');
                          }}
                        >
                          {idx + 1}
                        </div>
                      ));
                    })}
                    {/* Current temporary pin being dropped */}
                    {newPin && (
                      <div
                        style={{ left: `${newPin.x}%`, top: `${newPin.y}%` }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 bg-rose-500 text-[var(--text-primary)] font-black text-[9px] w-5 h-5 rounded-full flex items-center justify-center shadow-lg border-2 border-white select-none animate-pulse"
                      >
                        ?
                      </div>
                    )}
                  </div>
                ) : isVid ? (
                  <video src={file.fileUrl} controls className="w-full h-full object-contain" />
                ) : isAud ? (
                  <div className="flex flex-col items-center gap-3 p-6 text-center w-full">
                    <Music size={40} className="text-emerald-400" />
                    <audio src={file.fileUrl} controls className="w-full" />
                  </div>
                ) : (
                  <div className="text-center p-6 space-y-4">
                    <FileText size={48} className="text-slate-700 mx-auto" />
                    <div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Preview Not Supported Inline</p>
                      <p className="text-[10px] text-slate-500 mt-1">Download to inspect document locally.</p>
                    </div>
                  </div>
                )}

                {/* Grid Overlay Action buttons */}
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a
                    href={file.fileUrl}
                    download={file.originalName}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl text-[var(--text-primary)] transition flex items-center justify-center border border-white/15"
                  >
                    <Download size={14} />
                  </a>
                </div>
              </div>

              {/* ── TAB 1: FILE INFO ── */}
              {activeSubTab === 'INFO' && (
                <div className="space-y-6">
                  {/* File Name Editor */}
                  <div className="bg-white border border-divider rounded-2xl p-4 shadow-sm relative">
                    <div className="text-[8px] font-black text-textMuted uppercase tracking-widest mb-1.5 flex justify-between items-center">
                      <span>Asset Name</span>
                      {isAdmin && (
                        <button 
                          onClick={() => {
                            if (isEditingName) handleRename();
                            else setIsEditingName(true);
                          }}
                          className="text-primary hover:underline font-black text-[9px] uppercase tracking-wider"
                        >
                          {isEditingName ? 'Save' : 'Rename'}
                        </button>
                      )}
                    </div>
                    {isEditingName ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editedName}
                          onChange={e => setEditedName(e.target.value)}
                          className="w-full bg-gray-50 border border-divider rounded-xl px-3 py-1.5 text-xs font-bold outline-none focus:border-primary transition"
                        />
                        <button onClick={() => setIsEditingName(false)} className="text-xs text-rose-500 font-bold px-2 py-1">Cancel</button>
                      </div>
                    ) : (
                      <h3 className="font-black text-textMain text-sm leading-tight break-all">{file.originalName}</h3>
                    )}
                  </div>

                  {/* Metadata fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-xl border border-divider">
                      <p className="text-[8px] font-black text-textMuted uppercase tracking-widest">File Size</p>
                      <p className="text-xs font-black text-textMain mt-1">{formatSize(file.size)}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl border border-divider">
                      <p className="text-[8px] font-black text-textMuted uppercase tracking-widest">Type</p>
                      <p className="text-xs font-black text-textMain mt-1 truncate">{file.type}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl border border-divider">
                      <p className="text-[8px] font-black text-textMuted uppercase tracking-widest">Uploader</p>
                      <p className="text-xs font-black text-primary mt-1">@{file.uploader?.username || 'member'}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl border border-divider">
                      <p className="text-[8px] font-black text-textMuted uppercase tracking-widest">Version</p>
                      <p className="text-xs font-black text-textMain mt-1">v{file.version}</p>
                    </div>
                  </div>

                  {/* Originating task link */}
                  {file.sourceTaskId && (
                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-indigo-600" />
                        <div>
                          <p className="text-[8px] font-black text-indigo-700 uppercase tracking-widest">Originated from Task</p>
                          <p className="text-[10px] font-bold text-indigo-900 mt-0.5">Auto-pushed into files on approval</p>
                        </div>
                      </div>
                      <a
                        href={`/circles/${circleId}?task=${file.sourceTaskId}`}
                        className="flex items-center gap-1 text-[9px] font-black text-indigo-700 hover:text-indigo-900 uppercase tracking-widest bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-200 transition"
                      >
                        View Task <ChevronRight size={10} />
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* ── TAB 2: VERSION HISTORY ── */}
              {activeSubTab === 'VERSION' && (
                <div className="space-y-6">
                  {/* Version uploader box */}
                  {isAdmin && (
                    <div className="border border-dashed border-divider p-4 rounded-2xl bg-gray-50/50 flex flex-col items-center justify-center text-center">
                      <Layers size={24} className="text-textMuted opacity-60 mb-2" />
                      <p className="text-[10px] font-black text-textMain uppercase tracking-widest">Submit New Revision</p>
                      <p className="text-[9px] text-textMuted max-w-xs mt-1">Old versions are preserved. Editors or Admins can revert to them anytime.</p>
                      <input
                        type="file"
                        ref={fileVersionRef}
                        onChange={handleNewVersionUpload}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileVersionRef.current?.click()}
                        disabled={isUploadingVersion}
                        className="mt-3 bg-primary hover:bg-primaryHover text-[var(--text-primary)] px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition disabled:opacity-50"
                      >
                        {isUploadingVersion ? 'Uploading revision...' : 'Choose File'}
                      </button>
                    </div>
                  )}

                  {/* Versions history checklist */}
                  <div className="relative border-l-2 border-divider ml-2 pl-6 space-y-6">
                    {historyList.slice().reverse().map((hist, i) => {
                      const isActive = hist.version === file.version;
                      return (
                        <div key={hist.version || i} className="relative group">
                          {/* Dot marker */}
                          <div className={`absolute -left-[31px] top-1.5 w-3 h-3 rounded-full border-2 bg-white ${
                            isActive ? 'border-primary ring-4 ring-primary/10 bg-primary' : 'border-divider'
                          }`} />
                          
                          <div className={`p-4 rounded-xl border transition ${
                            isActive ? 'bg-white border-primary shadow-sm' : 'bg-gray-50/50 border-divider'
                          }`}>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black text-textMain uppercase tracking-wider flex items-center gap-1.5">
                                Version {hist.version} {isActive && <span className="bg-primary/10 border border-primary/20 text-primary text-[7px] font-black px-1.5 py-0.5 rounded uppercase">Active</span>}
                              </span>
                              <span className="text-[9px] font-bold text-textMuted">
                                {new Date(hist.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            <p className="text-[10px] text-textMuted mt-1">Uploaded by @{hist.uploaderName || 'member'}</p>
                            
                            <div className="flex items-center justify-between pt-3 border-t border-divider/50 mt-3">
                              <span className="text-[9px] font-bold text-textMuted">Size: {formatSize(hist.size)}</span>
                              
                              <div className="flex gap-2">
                                <a
                                  href={hist.fileUrl}
                                  download={hist.originalName || file.originalName}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[9px] font-black text-textMuted hover:text-primary uppercase tracking-widest"
                                >
                                  Download
                                </a>
                                {isAdmin && !isActive && (
                                  <button
                                    onClick={() => handleRestoreVersion(hist.version)}
                                    className="text-[9px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest"
                                  >
                                    Restore Active
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── TAB 3: ACCESS & EXTERNAL LINKS ── */}
              {activeSubTab === 'SHARE' && (
                <div className="space-y-6">
                  {/* Share with team member */}
                  {isAdmin && (
                    <div className="bg-white border border-divider rounded-2xl p-5 shadow-sm space-y-4">
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-primary" />
                        <h4 className="font-black text-textMain text-xs uppercase tracking-widest">Share with Team</h4>
                      </div>

                      <form onSubmit={handleGrantAccess} className="space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                          <select
                            value={selectedShareUser}
                            onChange={e => setSelectedShareUser(e.target.value)}
                            required
                            className="col-span-2 bg-gray-50 border border-divider rounded-xl px-3 py-2 text-xs font-bold outline-none"
                          >
                            <option value="">Choose team member...</option>
                            {shareableUsers.map(m => (
                              <option key={memberKey(m)} value={m.userId}>@{m.user?.username || 'member'}</option>
                            ))}
                          </select>
                          <select
                            value={shareRole}
                            onChange={e => setShareRole(e.target.value)}
                            className="bg-gray-50 border border-divider rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-wider outline-none"
                          >
                            <option value="DOWNLOAD">Download</option>
                            <option value="EDIT">Edit</option>
                          </select>
                        </div>
                        <button
                          type="submit"
                          disabled={!selectedShareUser || isSharing}
                          className="w-full bg-primary hover:bg-primaryHover text-[var(--text-primary)] py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition disabled:opacity-50"
                        >
                          {isSharing ? 'Sharing...' : 'Grant Access'}
                        </button>
                      </form>
                    </div>
                  )}

                  {/* Active team lists */}
                  <div className="space-y-3">
                    <h5 className="text-[9px] font-black text-textMuted uppercase tracking-widest">Current Access Lists</h5>
                    
                    <div className="space-y-2">
                      {/* Owner list item always active */}
                      <div className="bg-gray-50 border border-divider rounded-xl p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center font-black text-primary text-xs uppercase">
                            C
                          </div>
                          <div>
                            <p className="font-black text-textMain text-xs">Circle Creator</p>
                            <p className="text-[8px] font-black text-textMuted uppercase tracking-widest">Owner</p>
                          </div>
                        </div>
                        <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Full Owner Control</span>
                      </div>

                      {/* Custom shared permissions */}
                      {sharingList.map((perm, idx) => {
                        const member = circleMembers.find(m => m.userId === perm.userId);
                        return (
                          <div key={perm.userId || idx} className="bg-white border border-divider rounded-xl p-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <img
                                src={member?.user?.profileImage || `https://ui-avatars.com/api/?name=${member?.user?.username || 'member'}`}
                                className="w-8 h-8 rounded-lg object-cover"
                                alt=""
                              />
                              <div>
                                <p className="font-black text-textMain text-xs">@{member?.user?.username || 'member'}</p>
                                <p className="text-[8px] font-black text-textMuted uppercase tracking-widest">{perm.role === 'EDIT' ? 'Editor' : 'Viewer'}</p>
                              </div>
                            </div>
                            
                            {isAdmin ? (
                              <button
                                onClick={() => handleRevokeAccess(perm.userId)}
                                className="text-[9px] font-black text-rose-600 hover:underline uppercase tracking-wider"
                              >
                                Revoke
                              </button>
                            ) : (
                              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded border border-divider">{perm.role} Access</span>
                            )}
                          </div>
                        );
                      })}

                      {sharingList.length === 0 && (
                        <p className="text-center py-6 text-textMuted text-xs font-bold uppercase tracking-wider border-2 border-dashed border-divider rounded-xl">No active guest shares. File is private.</p>
                      )}
                    </div>
                  </div>

                  <hr className="border-divider my-4" />

                  {/* External public link generator */}
                  {isAdmin && (
                    <div className="bg-white border border-divider rounded-2xl p-5 shadow-sm space-y-4">
                      <div className="flex items-center gap-2">
                        <Link2 size={16} className="text-primary" />
                        <h4 className="font-black text-textMain text-xs uppercase tracking-widest">Generate Public Guest Link</h4>
                      </div>

                      <form onSubmit={handleCreatePublicLink} className="space-y-4">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[8px] font-black text-textMuted uppercase tracking-widest block mb-1">Link Permission</label>
                            <select
                              value={shareRoleLink}
                              onChange={e => setShareRoleLink(e.target.value)}
                              className="w-full bg-gray-50 border border-divider rounded-xl px-3 py-2 text-xs font-bold"
                            >
                              <option value="VIEW">Preview Only</option>
                              <option value="DOWNLOAD">Preview & Download</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[8px] font-black text-textMuted uppercase tracking-widest block mb-1">Expiration window</label>
                            <select
                              value={expiresInDays}
                              onChange={e => setExpiresInDays(e.target.value)}
                              className="w-full bg-gray-50 border border-divider rounded-xl px-3 py-2 text-xs font-bold"
                            >
                              <option value="0">Never Expire</option>
                              <option value="1">24 Hours</option>
                              <option value="7">7 Days</option>
                              <option value="30">30 Days</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="text-[8px] font-black text-textMuted uppercase tracking-widest block mb-1">Password Lock (Optional)</label>
                          <input
                            type="password"
                            value={sharePassword}
                            onChange={e => setSharePassword(e.target.value)}
                            placeholder="Set guest passcode locking..."
                            className="w-full bg-gray-50 border border-divider rounded-xl px-3 py-2 text-xs font-bold outline-none"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={isGeneratingLink}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-[var(--text-primary)] py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md transition disabled:opacity-50"
                        >
                          {isGeneratingLink ? 'Generating...' : 'Generate Public Link'}
                        </button>
                      </form>
                    </div>
                  )}

                  {/* Active external links list */}
                  <div className="space-y-3">
                    <h5 className="text-[9px] font-black text-textMuted uppercase tracking-widest">Active External Share Links</h5>
                    <div className="space-y-2">
                      {publicLinksList.map((link, idx) => {
                        const isCopied = copiedLink === link.linkId;
                        const isExpired = link.expiresAt && new Date(link.expiresAt) < new Date();
                        return (
                          <div key={link.linkId || idx} className={`border rounded-xl p-3 flex flex-col gap-2 ${
                            isExpired ? 'bg-red-50/50 border-red-100' : 'bg-white border-divider shadow-sm'
                          }`}>
                            <div className="flex items-center justify-between">
                              <span className="text-[8px] font-black text-textMain uppercase tracking-wider bg-gray-100 px-2 py-0.5 rounded">
                                Role: {link.role}
                              </span>
                              
                              {link.passwordProtected && (
                                <span className="text-[7px] font-black text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 uppercase flex items-center gap-0.5">
                                  <Lock size={8} /> Passcode Protected
                                </span>
                              )}
                            </div>

                            <p className="text-[9px] text-textMuted">
                              Expires: {link.expiresAt ? new Date(link.expiresAt).toLocaleDateString() : 'Never'}
                            </p>

                            <div className="flex items-center justify-between pt-2 border-t border-divider mt-1">
                              <button
                                onClick={() => copyToClipboard(link.linkId)}
                                className={`text-[9px] font-black uppercase tracking-widest transition-all ${
                                  isCopied ? 'text-emerald-600 font-bold' : 'text-primary hover:text-primaryHover'
                                }`}
                              >
                                {isCopied ? '✓ Copied' : 'Copy Link URL'}
                              </button>

                              {isAdmin && (
                                <button
                                  onClick={() => handleRevokePublicLink(link.linkId)}
                                  className="text-[9px] font-black text-rose-600 hover:text-rose-800 uppercase tracking-widest"
                                >
                                  Revoke Link
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {publicLinksList.length === 0 && (
                        <p className="text-center py-6 text-textMuted text-xs font-bold uppercase tracking-wider border-2 border-dashed border-divider rounded-xl">No active public guest links.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB 4: COMMENTS & ANNOTATIONS ── */}
              {activeSubTab === 'ANNOTATION' && (
                <div className="space-y-6">
                  {/* Instructions on annotations pins */}
                  {isImg && (
                    <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex gap-3">
                      <Info size={16} className="text-indigo-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[9px] font-black text-indigo-900 uppercase tracking-wider">Visual Annotations Pinning</p>
                        <p className="text-[10px] text-indigo-700 mt-0.5 leading-normal">
                          Click anywhere on the image preview container above to drop a coordinate pin. Then type a comment below to link the visual pin directly to the thread!
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Discussion Comments list */}
                  <div className="space-y-4">
                    <h5 className="text-[9px] font-black text-textMuted uppercase tracking-widest">Discussion Thread</h5>
                    
                    <div className="space-y-3">
                      {commentsList.map((comm, idx) => (
                        <div key={comm.id || idx} className={`p-4 rounded-xl border flex flex-col gap-2 transition ${
                          comm.resolved ? 'bg-gray-50/50 border-divider opacity-50' : 'bg-white border-divider shadow-sm'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <img src={comm.userAvatar} className="w-6 h-6 rounded-md object-cover" alt="" />
                              <div>
                                <span className="font-bold text-xs text-textMain">@{comm.username}</span>
                                <span className="text-[8px] font-bold text-textMuted ml-2">
                                  {new Date(comm.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              {comm.pins && (
                                <span className="bg-indigo-50 border border-indigo-100 text-indigo-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">
                                  Pin #{idx + 1}
                                </span>
                              )}
                              {!comm.resolved && isAdmin && (
                                <button
                                  onClick={() => handleResolveComment(comm.id)}
                                  className="text-[8px] font-black text-emerald-600 hover:text-emerald-800 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100"
                                >
                                  Resolve
                                </button>
                              )}
                              {comm.resolved && (
                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded">Resolved</span>
                              )}
                            </div>
                          </div>

                          <p className="text-xs text-textMain font-medium leading-relaxed pl-1">{comm.content}</p>
                        </div>
                      ))}

                      {commentsList.length === 0 && (
                        <p className="text-center py-10 text-textMuted text-xs font-bold uppercase tracking-wider border-2 border-dashed border-divider rounded-xl">No comments posted yet. Begin discussion sync.</p>
                      )}
                    </div>
                  </div>

                  {/* Comment submit form */}
                  <form onSubmit={handleCommentSubmit} className="pt-4 border-t border-divider">
                    {newPin && (
                      <div className="bg-indigo-50/50 border border-indigo-100 px-3 py-2 rounded-xl mb-3 flex items-center justify-between text-[9px] font-black text-indigo-700 uppercase tracking-widest">
                        <span>Pinning Visual Spot at X: {newPin.x.toFixed(0)}% Y: {newPin.y.toFixed(0)}%</span>
                        <button type="button" onClick={() => setNewPin(null)} className="text-rose-500 font-bold hover:underline">Clear Pin</button>
                      </div>
                    )}
                    <div className="flex gap-2 bg-gray-50 border border-divider rounded-2xl p-2 focus-within:border-primary transition-all">
                      <input
                        value={commentInput}
                        onChange={e => setCommentInput(e.target.value)}
                        placeholder={newPin ? "Write annotation comment..." : "Write a comment..."}
                        className="flex-1 bg-transparent border-none outline-none text-xs px-2"
                        required
                      />
                      <button
                        type="submit"
                        disabled={isSubmittingComment || !commentInput.trim()}
                        className="bg-primary text-[var(--text-primary)] p-2.5 rounded-xl shadow-lg shadow-primary/20 transition disabled:opacity-50"
                      >
                        <Send size={14} />
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* ── TAB 5: LIFECYCLE AUDIT LOG ── */}
              {activeSubTab === 'LOG' && (
                <div className="space-y-4">
                  <h5 className="text-[9px] font-black text-textMuted uppercase tracking-widest">Audit Event Trail</h5>
                  
                  <div className="relative border-l border-divider ml-2 pl-4 space-y-4">
                    {activityList.slice().reverse().map((log, idx) => (
                      <div key={log.id || idx} className="relative">
                        {/* Dot marker */}
                        <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-slate-400 border border-white" />
                        
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black text-textMain uppercase tracking-wider">
                              {log.action}
                            </span>
                            <span className="text-[8px] font-bold text-textMuted">
                              {new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[10px] text-textMuted mt-0.5 leading-relaxed">
                            {log.details} • Triggered by @{log.username}
                          </p>
                        </div>
                      </div>
                    ))}

                    {activityList.length === 0 && (
                      <p className="text-center py-6 text-textMuted text-xs font-bold uppercase tracking-wider">No audit history recorded.</p>
                    )}
                  </div>
                </div>
              )}

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const memberKey = (m) => m.userId || String(Math.random());

export default FileDetailDrawer;
