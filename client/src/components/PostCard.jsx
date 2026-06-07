import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ThumbsUp, MessageSquare, Repeat2, Share2,
  MoreHorizontal, Globe, UserPlus, Star, Edit2,
  Archive, Trash2, X, Users, Copy, Check, Send, Loader2, Briefcase
} from 'lucide-react';
import axios from 'axios';
import useAuthStore from '../store/useAuthStore';

const PostCard = ({ post }) => {
  const { id, creator, caption: initialCaption, mediaUrl, likes, commentsCount, createdAt, isEdited: initialIsEdited, originalPost } = post;
  const { user, token } = useAuthStore();
  const navigate = useNavigate();

  const mediaUrls = mediaUrl ? mediaUrl.split(',') : [];
  const isVideo = (url) => url.match(/\.(mp4|webm|mov|mkv)$/i);
  const fallbackAvatar = `https://ui-avatars.com/api/?name=${creator?.username || 'U'}&background=0A66C2&color=fff`;

  const [liked, setLiked]         = useState(false);
  const [likesCount, setLikesCount] = useState(likes || 0);
  const [commentCount, setCommentCount] = useState(commentsCount || 0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing]   = useState(false);
  const [caption, setCaption]       = useState(initialCaption);
  const [isEdited, setIsEdited]     = useState(initialIsEdited);
  const [isDeleted, setIsDeleted]   = useState(false);
  const [isArchived, setIsArchived] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [showShare, setShowShare]   = useState(false);
  const [copied, setCopied]         = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  
  // Comment & Repost State
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments]         = useState([]);
  const [newComment, setNewComment]     = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [isReposting, setIsReposting]   = useState(false);
  const [reposted, setReposted]         = useState(false);

  const isOwnPost = user?.username === creator?.username;
  const postUrl   = `${window.location.origin}/posts/${id}`;

  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [showComments]);

  const fetchComments = async () => {
    try {
      const res = await axios.get(`/api/posts/${id}/comments`);
      setComments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (isDeleted || isArchived) return null;

  const handleLike = () => {
    setLiked(prev => !prev);
    setLikesCount(prev => liked ? prev - 1 : prev + 1);
  };

  const handleRepost = async () => {
    if (isReposting) return;
    
    setIsReposting(true);
    try {
      await axios.post(`/api/posts/${id}/repost`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReposted(true);
      window.dispatchEvent(new CustomEvent('postCreated'));
    } catch (err) {
      console.error(err);
      alert('Failed to repost');
    } finally {
      setIsReposting(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || isPostingComment) return;

    setIsPostingComment(true);
    try {
      const res = await axios.post(`/api/posts/${id}/comments`, { content: newComment }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComments(prev => [res.data, ...prev]);
      setNewComment('');
      setCommentCount(prev => prev + 1);
    } catch (err) {
      console.error(err);
      alert('Failed to add comment');
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(postUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUpdate = async () => {
    if (!caption.trim() || caption === initialCaption) { setIsEditing(false); return; }
    setLoading(true);
    try {
      await axios.put(`/api/posts/${id}`, { caption }, { headers: { Authorization: `Bearer ${token}` } });
      setIsEdited(true); setIsEditing(false);
    } catch { alert('Failed to update post'); }
    finally { setLoading(false); }
  };

  const handleArchive = async () => {
    if (!window.confirm('Archive this post?')) return;
    setLoading(true);
    try {
      await axios.put(`/api/posts/${id}/archive`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setIsArchived(true);
    } catch { alert('Failed to archive post'); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this post permanently?')) return;
    setLoading(true);
    try {
      await axios.delete(`/api/posts/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setIsDeleted(true);
    } catch { alert('Failed to delete post'); }
    finally { setLoading(false); }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-[var(--bg-surface-alt)] rounded-2xl border border-[var(--border-primary)] mb-6 overflow-hidden"
      >
        {/* Repost Header */}
        {originalPost && (
          <div className="px-4 py-2 border-b border-divider bg-gray-50 flex items-center gap-2">
            <Repeat2 size={14} className="text-primary" />
            <span className="text-[10px] font-bold text-textMuted">
              Reposted by <Link to={`/profile/${creator.username}`} className="text-primary">@{creator.username}</Link>
            </span>
          </div>
        )}

        {/* Header */}
        <div className="p-4 flex items-start justify-between">
          <div className="flex gap-3 min-w-0">
            <Link to={`/profile/${originalPost ? originalPost.creator.username : creator.username}`}>
              <img src={(originalPost ? originalPost.creator.profileImage : creator.profileImage) || fallbackAvatar} alt={originalPost ? originalPost.creator.username : creator.username}
                className="w-10 h-10 rounded-full object-cover border border-[#181D2A]"
                onError={e => e.target.src = fallbackAvatar} />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-1 flex-wrap">
                <Link to={`/profile/${originalPost ? originalPost.creator.username : creator.username}`} className="font-bold text-sm text-[var(--text-primary)] hover:text-[#7B5CFA] hover:underline truncate tracking-tight">
                  {originalPost ? originalPost.creator.name || originalPost.creator.username : creator.name || creator.username}
                </Link>
                {(originalPost ? originalPost.creator.isVerified : creator.isVerified) && <Star size={11} className="text-[#7B5CFA] fill-[#7B5CFA] flex-shrink-0" />}
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] leading-tight">
                {originalPost ? originalPost.creator.profileType : (creator.profileType || 'Creative')} • {new Date(createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0 relative">
            {!isOwnPost && (
              <button 
                onClick={async () => {
                  if (loading || hasRequested) return;
                  try {
                    setLoading(true);
                    await axios.post('/api/network/connect', { receiverId: originalPost ? originalPost.creator.id : creator.id }, { headers: { Authorization: `Bearer ${token}` } });
                    setHasRequested(true);
                  } catch (err) {
                    console.error(err);
                    if (err.response?.data?.error === 'Connection request already exists' || err.response?.data?.error === 'Already connected') {
                      setHasRequested(true);
                    }
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading || hasRequested}
                className={`flex items-center gap-1 px-3 py-1 rounded-full transition font-bold text-xs disabled:opacity-50 ${hasRequested ? 'bg-transparent text-gray-400 border border-gray-400/30' : 'text-primary hover:bg-primary/5'}`}
              >
                {hasRequested ? <Check size={13} /> : <UserPlus size={13} />}
                {hasRequested ? 'Request Sent' : 'Connect'}
              </button>
            )}
            {isOwnPost && (
              <div className="relative">
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-textMuted p-1 hover:bg-gray-100 rounded-full transition">
                  <MoreHorizontal size={18} />
                </button>
                <AnimatePresence>
                  {isMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute right-0 mt-2 w-48 bg-white border border-divider rounded-xl shadow-xl z-20 overflow-hidden"
                      >
                        <button onClick={() => { setIsEditing(true); setIsMenuOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-textMain hover:bg-gray-50">
                          <Edit2 size={15} className="text-textMuted" /> Edit post
                        </button>
                        <button onClick={() => { handleArchive(); setIsMenuOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-textMain hover:bg-gray-50">
                          <Archive size={15} className="text-textMuted" /> Archive
                        </button>
                        <div className="border-t border-divider" />
                        <button onClick={() => { handleDelete(); setIsMenuOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50">
                          <Trash2 size={15} /> Delete
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-4 pb-3">
          {isEditing ? (
            <div className="space-y-3">
              <textarea value={caption} onChange={e => setCaption(e.target.value)}
                className="w-full bg-[var(--bg-base)] border border-[var(--border-primary)] rounded-xl p-3 text-sm text-[var(--text-primary)] outline-none focus:border-[#7B5CFA] transition min-h-[100px] resize-none"
                autoFocus />
              <div className="flex justify-end gap-2">
                <button onClick={() => { setIsEditing(false); setCaption(initialCaption); }}
                  className="px-4 py-1.5 text-xs font-bold text-[var(--text-secondary)] hover:bg-white/5 rounded-full">Cancel</button>
                <button onClick={handleUpdate} disabled={loading || !caption.trim()}
                  className="px-4 py-1.5 text-xs font-bold bg-[#7B5CFA] text-white rounded-full disabled:opacity-50">
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-[13px] text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">
              {originalPost ? originalPost.caption : caption}
              {isEdited && <span className="text-[10px] text-[var(--text-secondary)] ml-2">(edited)</span>}
            </p>
          )}
        </div>

        {/* Media */}
        {(originalPost ? (originalPost.mediaUrl?.split(',') || []) : mediaUrls).length > 0 && (
          <div className="px-4 pb-4">
            <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar rounded-xl overflow-hidden relative">
              {(originalPost ? (originalPost.mediaUrl?.split(',') || []) : mediaUrls).map((url, i) => (
                <div key={i} className="w-full flex-shrink-0 snap-center flex justify-center items-center max-h-[480px] bg-[var(--bg-base)]">
                  {(originalPost ? (originalPost.mediaUrl?.split(',') || []) : mediaUrls).length > 1 && (
                    <div className="absolute top-3 right-3 bg-black/60 text-[var(--text-primary)] text-xs px-2 py-1 rounded-full font-bold z-10">
                      {i + 1}/{(originalPost ? (originalPost.mediaUrl?.split(',') || []) : mediaUrls).length}
                    </div>
                  )}
                  {isVideo(url)
                    ? <video src={url} controls className="w-full h-auto max-h-[480px] object-cover" />
                    : <img src={url} alt="Post" className="w-full h-auto max-h-[480px] object-cover" />}
                </div>
              ))}
              
              {/* If it's a collab post (isCollabCard), we show the Collab Request pill inside the media container at bottom right */}
              {post.isCollabCard && (
                <Link to={`/collabs/${post.collabId}`} className="absolute bottom-4 right-4 bg-[#7B5CFA] hover:bg-[#684CE0] text-white text-xs font-bold py-2 px-4 rounded-xl flex items-center gap-2 shadow-lg transition">
                  <Briefcase size={14} />
                  Collab Request
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Actions Footer */}
        <div className="px-4 py-3 flex items-center justify-between border-t border-[var(--border-primary)]">
          <div className="flex items-center gap-6">
            <button onClick={handleLike} className={`flex items-center gap-1.5 text-[11px] font-bold transition group ${liked ? 'text-[#7B5CFA]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
              <ThumbsUp size={16} className={liked ? 'fill-[#7B5CFA]' : 'group-hover:text-[var(--text-primary)]'} />
              <span>{likesCount}</span>
            </button>
            <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition group">
              <MessageSquare size={16} />
              <span>{commentCount}</span>
            </button>
            <button onClick={() => setShowShare(true)} className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition group">
              <Share2 size={16} />
            </button>
          </div>

          <button className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition">
            <Archive size={16} />
          </button>
        </div>

        {/* Desktop Inline Comments */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="hidden md:block overflow-hidden border-t border-divider"
            >
              <div className="p-4 space-y-4">
                {/* Input */}
                <form onSubmit={handleCommentSubmit} className="flex gap-3">
                  <img src={user?.profileImage || fallbackAvatar} className="w-8 h-8 rounded-full object-cover border border-[#181D2A]" alt="Your avatar" />
                  <div className="flex-1 relative">
                    <input 
                      type="text" 
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="w-full bg-[var(--bg-base)] border border-[var(--border-primary)] rounded-full px-4 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-[#7B5CFA] transition"
                    />
                    <button 
                      type="submit" 
                      disabled={!newComment.trim() || isPostingComment}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#7B5CFA] hover:bg-[#7B5CFA]/10 p-1.5 rounded-full transition disabled:opacity-30"
                    >
                      {isPostingComment ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    </button>
                  </div>
                </form>

                {/* List */}
                <div className="space-y-4 pt-2">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <img src={comment.user.profileImage || fallbackAvatar} className="w-8 h-8 rounded-full object-cover border border-[var(--border-primary)]" alt={comment.user.username} />
                      <div className="flex-1 bg-[var(--bg-base)] rounded-2xl p-3 border border-[var(--border-primary)]">
                        <div className="flex justify-between items-start mb-1">
                          <div>
                            <Link to={`/profile/${comment.user.username}`} className="text-xs font-bold text-[var(--text-primary)] hover:text-[#7B5CFA] hover:underline transition">@{comment.user.username}</Link>
                            <span className="text-[9px] text-[var(--text-secondary)] ml-2">{new Date(comment.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <p className="text-xs text-[var(--text-primary)] leading-relaxed">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                  {comments.length === 0 && (
                    <p className="text-xs text-[var(--text-secondary)] text-center py-2">No comments yet. Be the first to share your thoughts!</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Mobile Comment Sheet ── */}
      <AnimatePresence>
        {showComments && (
          <div className="md:hidden fixed inset-0 z-[400] flex items-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowComments(false)} />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 250 }}
              className="relative w-full bg-[var(--bg-surface-alt)] rounded-t-3xl shadow-2xl z-10 max-h-[90svh] flex flex-col border border-[var(--border-secondary)]"
            >
              <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 bg-white/20 rounded-full" /></div>
              <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border-secondary)]">
                <h3 className="font-black text-[var(--text-primary)] tracking-tight">Comments</h3>
                <button onClick={() => setShowComments(false)} className="p-1.5 hover:bg-white/5 rounded-xl text-[var(--text-secondary)]"><X size={17} /></button>
              </div>

              <div className="overflow-y-auto flex-1 p-4 space-y-5">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <img src={comment.user.profileImage || fallbackAvatar} className="w-9 h-9 rounded-full object-cover border border-[var(--border-primary)]" alt={comment.user.username} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Link to={`/profile/${comment.user.username}`} className="text-xs font-black text-[var(--text-primary)] hover:text-[#7B5CFA] hover:underline transition">@{comment.user.username}</Link>
                        <span className="text-[9px] text-[var(--text-secondary)]">{new Date(comment.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-[var(--text-primary)] leading-relaxed">{comment.content}</p>
                    </div>
                  </div>
                ))}
                {comments.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 opacity-50 text-[var(--text-secondary)]">
                    <MessageSquare size={40} className="mb-2" />
                    <p className="text-xs font-bold">No comments yet</p>
                  </div>
                )}
              </div>

              {/* Mobile Input (Sticky at bottom) */}
              <div className="p-4 border-t border-[var(--border-secondary)] pb-safe bg-[var(--bg-surface-alt)]">
                <form onSubmit={handleCommentSubmit} className="flex items-center gap-3">
                  <img src={user?.profileImage || fallbackAvatar} className="w-8 h-8 rounded-full border border-[var(--border-primary)] object-cover" alt="You" />
                  <div className="flex-1 relative">
                    <input 
                      type="text" 
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="w-full bg-[var(--bg-base)] border border-[var(--border-primary)] rounded-full px-4 py-2.5 text-xs text-[var(--text-primary)] outline-none focus:border-[#7B5CFA] transition"
                      autoFocus
                    />
                    <button type="submit" disabled={!newComment.trim() || isPostingComment} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#7B5CFA] p-1.5 disabled:opacity-30">
                      {isPostingComment ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Share Sheet ── */}
      <AnimatePresence>
        {showShare && (
          <div className="fixed inset-0 z-[400] flex items-end md:items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowShare(false)}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 250 }}
              className="relative w-full md:max-w-sm bg-[var(--bg-surface-alt)] rounded-t-3xl md:rounded-3xl shadow-2xl z-10 overflow-hidden border border-[var(--border-secondary)]"
            >
              <div className="flex justify-center pt-3 pb-1 md:hidden"><div className="w-10 h-1 bg-white/20 rounded-full" /></div>
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-secondary)]">
                <h3 className="font-black text-[var(--text-primary)] tracking-tight">Share Post</h3>
                <button onClick={() => setShowShare(false)} className="p-1.5 hover:bg-white/5 rounded-xl text-[var(--text-secondary)]"><X size={17} /></button>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 gap-3">
                  <button className="flex items-center gap-3 p-4 rounded-2xl border border-[var(--border-secondary)] hover:border-[#7B5CFA] hover:bg-[#7B5CFA]/5 transition-all group text-left">
                    <div className="w-10 h-10 bg-[#7B5CFA]/10 rounded-xl flex items-center justify-center text-[#7B5CFA] flex-shrink-0"><Users size={18} /></div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-[var(--text-primary)] group-hover:text-[#7B5CFA] leading-tight">Network</p>
                      <p className="text-[9px] text-[var(--text-secondary)] mt-0.5">Share to connections</p>
                    </div>
                  </button>
                  <button onClick={handleCopyLink}
                    className="flex items-center gap-3 p-4 rounded-2xl border border-[var(--border-secondary)] hover:border-[#7B5CFA] hover:bg-[#7B5CFA]/5 transition-all group text-left">
                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#7B5CFA]/10 group-hover:text-[#7B5CFA] text-[var(--text-secondary)] transition-all">
                      {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                    </div>
                    <div>
                      <p className="text-xs font-black text-[var(--text-primary)] group-hover:text-[#7B5CFA] leading-tight">{copied ? 'Copied!' : 'Copy Link'}</p>
                      <p className="text-[9px] text-[var(--text-secondary)] mt-0.5">Share anywhere</p>
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PostCard;
