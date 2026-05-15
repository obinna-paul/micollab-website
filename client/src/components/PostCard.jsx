import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsUp, MessageSquare, Repeat2, Send, MoreHorizontal, Globe, UserPlus, Star, Edit2, Archive, Trash2, X, Check, Briefcase } from 'lucide-react';
import axios from 'axios';
import useAuthStore from '../store/useAuthStore';

const PostCard = ({ post }) => {
  const { id, creator, caption: initialCaption, mediaUrl, _count, contentType, createdAt, isEdited: initialIsEdited } = post;
  const { user, token } = useAuthStore();
  const navigate = useNavigate();
  
  const mediaUrls = mediaUrl ? mediaUrl.split(',') : [];
  const isVideo = (url) => url.match(/\.(mp4|webm|mov|mkv)$/i);

  const fallbackAvatar = 'https://ui-avatars.com/api/?name=' + (creator?.username || 'User') + '&background=0A66C2&color=fff';

  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(_count?.likes || 0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [caption, setCaption] = useState(initialCaption);
  const [isEdited, setIsEdited] = useState(initialIsEdited);
  const [isDeleted, setIsDeleted] = useState(false);
  const [isArchived, setIsArchived] = useState(false);
  const [loading, setLoading] = useState(false);

  const isOwnPost = user?.username === creator?.username;

  if (isDeleted || isArchived) return null;

  const handleLike = () => {
    setLiked(!liked);
    setLikesCount(prev => liked ? prev - 1 : prev + 1);
  };

  const handleUpdate = async () => {
    if (!caption.trim() || caption === initialCaption) {
      setIsEditing(false);
      return;
    }

    setLoading(true);
    try {
      await axios.put(`http://localhost:5000/api/posts/${id}`, { caption }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsEdited(true);
      setIsEditing(false);
    } catch (error) {
      console.error(error);
      alert('Failed to update post');
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!window.confirm('Archive this post? It will be hidden from the feed.')) return;
    
    setLoading(true);
    try {
      await axios.put(`http://localhost:5000/api/posts/${id}/archive`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsArchived(true);
    } catch (error) {
      console.error(error);
      alert('Failed to archive post');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post permanently?')) return;

    setLoading(true);
    try {
      await axios.delete(`http://localhost:5000/api/posts/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsDeleted(true);
    } catch (error) {
      console.error(error);
      alert('Failed to delete post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="card mb-4"
    >
      {/* Header */}
      <div className="p-3 flex items-start justify-between">
        <div className="flex gap-2 min-w-0">
          <Link to={`/profile/${creator.username}`}>
            <img 
              src={creator.profileImage || fallbackAvatar} 
              alt={creator.username} 
              className="w-12 h-12 rounded-full object-cover border border-divider"
              onError={(e) => e.target.src = fallbackAvatar}
            />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <Link to={`/profile/${creator.username}`} className="font-bold text-sm text-textMain hover:text-primary hover:underline truncate">
                @{creator.username}
              </Link>
              {creator.verified && <Star size={12} className="text-primary fill-primary flex-shrink-0" />}
              <span className="text-textMuted text-[10px]">• 1st</span>
            </div>
            <p className="text-[10px] text-textMuted leading-tight truncate">{creator.category || 'Creative Professional'}</p>
            <p className="text-[10px] text-textLight flex items-center gap-1 mt-0.5">
              {new Date(createdAt).toLocaleDateString()} • <Globe size={10} />
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1 flex-shrink-0 relative">
           {!isOwnPost && (
             <button className="flex items-center gap-1 text-primary hover:bg-primary/5 px-3 py-1 rounded-full transition font-bold text-xs">
               <UserPlus size={14} /> Connect
             </button>
           )}
           
           {isOwnPost && (
             <div className="relative">
               <button 
                 onClick={() => setIsMenuOpen(!isMenuOpen)}
                 className="text-textMuted p-1 hover:bg-gray-100 rounded-full transition"
               >
                 <MoreHorizontal size={18} />
               </button>

               <AnimatePresence>
                 {isMenuOpen && (
                   <>
                     <div 
                       className="fixed inset-0 z-10" 
                       onClick={() => setIsMenuOpen(false)} 
                     />
                     <motion.div 
                       initial={{ opacity: 0, scale: 0.95, y: -10 }}
                       animate={{ opacity: 1, scale: 1, y: 0 }}
                       exit={{ opacity: 0, scale: 0.95, y: -10 }}
                       className="absolute right-0 mt-2 w-48 bg-white border border-divider rounded-xl shadow-xl z-20 overflow-hidden"
                     >
                       <button 
                         onClick={() => { setIsEditing(true); setIsMenuOpen(false); }}
                         className="w-full flex items-center gap-3 px-4 py-3 text-sm text-textMain hover:bg-gray-50 transition"
                       >
                         <Edit2 size={16} className="text-textMuted" /> Edit post
                       </button>
                       <button 
                         onClick={() => { handleArchive(); setIsMenuOpen(false); }}
                         className="w-full flex items-center gap-3 px-4 py-3 text-sm text-textMain hover:bg-gray-50 transition"
                       >
                         <Archive size={16} className="text-textMuted" /> Archive post
                       </button>
                       <div className="border-t border-divider" />
                       <button 
                         onClick={() => { handleDelete(); setIsMenuOpen(false); }}
                         className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition"
                       >
                         <Trash2 size={16} /> Delete post
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
      <div className="px-3 pb-3">
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full bg-background border border-divider rounded-xl p-3 text-sm text-textMain outline-none focus:border-primary transition min-h-[100px] resize-none"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => { setIsEditing(false); setCaption(initialCaption); }}
                className="px-4 py-1.5 text-xs font-bold text-textMuted hover:bg-gray-100 rounded-full transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdate}
                disabled={loading || !caption.trim()}
                className="px-4 py-1.5 text-xs font-bold bg-primary text-white rounded-full transition disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-textMain whitespace-pre-wrap leading-normal font-normal">
            {caption}
            {isEdited && <span className="text-[10px] text-textMuted ml-2 font-medium">(edited)</span>}
          </p>
        )}
      </div>

      {/* Collab Activity Card */}
      {post.isCollabCard && post.gig && (
        <div className="mx-3 mb-3 bg-surface border border-divider rounded-2xl overflow-hidden shadow-sm hover:border-primary transition-colors group cursor-pointer" onClick={() => navigate(`/collabs/${post.gig.id}`)}>
           <div className="p-4 bg-primary/5 flex items-start justify-between">
              <div>
                 <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-white px-2 py-0.5 rounded-full shadow-sm">Collab Opportunity</span>
                 <h3 className="text-base font-bold text-textMain mt-2 group-hover:text-primary transition-colors">{post.gig.title}</h3>
              </div>
              <Briefcase size={20} className="text-primary opacity-50" />
           </div>
           <div className="p-4 flex items-center justify-between gap-4 border-t border-divider">
              <div className="flex gap-4">
                 <div>
                    <p className="text-[10px] text-textMuted font-black uppercase tracking-tighter">Budget</p>
                    <p className="text-xs font-bold text-textMain">{post.gig.budget}</p>
                 </div>
                 <div className="border-l border-divider pl-4">
                    <p className="text-[10px] text-textMuted font-black uppercase tracking-tighter">Category</p>
                    <p className="text-xs font-bold text-textMain">{post.gig.category}</p>
                 </div>
              </div>
              <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">View Details</button>
           </div>
        </div>
      )}

      {/* Event Details */}
      {post.postCategory === 'EVENT' && (
        <div className="mx-3 mb-3 bg-primary/5 border border-primary/20 rounded-xl p-4 flex flex-col gap-2">
           {post.eventDate && (
             <p className="flex items-center gap-2 text-sm text-textMain font-bold">
               <span className="w-6 h-6 bg-white rounded-md flex items-center justify-center text-primary shadow-sm"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg></span>
               {post.eventDate}
               {post.eventTime && <span className="text-textMuted font-normal text-xs ml-1">• {post.eventTime}</span>}
             </p>
           )}
           {post.eventLocation && (
             <p className="flex items-center gap-2 text-sm text-textMain font-bold">
               <span className="w-6 h-6 bg-white rounded-md flex items-center justify-center text-primary shadow-sm"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg></span>
               {post.eventLocation}
             </p>
           )}
           {post.inviteTarget && post.inviteTarget !== 'NONE' && (
             <p className="flex items-center gap-2 text-xs text-textMuted mt-1">
               <span className="w-6 h-6 bg-white rounded-md flex items-center justify-center text-textMuted shadow-sm"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg></span>
               {post.inviteTarget === 'ALL_NETWORK' ? 'Open to entire network' : 'Exclusive Invitation'}
             </p>
           )}
        </div>
      )}

      {/* Media / Flyer */}
      {mediaUrls.length > 0 && (
        <div className="border-y border-divider bg-gray-50 flex overflow-x-auto snap-x snap-mandatory no-scrollbar relative">
          {mediaUrls.map((url, index) => (
            <div key={index} className="w-full flex-shrink-0 snap-center flex justify-center items-center overflow-hidden max-h-[500px] bg-black/5 relative">
              {mediaUrls.length > 1 && (
                <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full font-bold z-10">
                  {index + 1} / {mediaUrls.length}
                </div>
              )}
              {isVideo(url) ? (
                <video src={url} controls className="w-full h-auto max-h-[500px] object-contain bg-black" />
              ) : (
                <img src={url} alt="Post content" className="w-full h-auto max-h-[500px] object-contain" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="px-3 py-2 flex items-center justify-between border-b border-divider">
        <div className="flex items-center gap-1">
          <div className="flex -space-x-1">
            <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center border border-white shadow-sm"><ThumbsUp size={8} className="text-white" /></div>
          </div>
          <span className="text-[10px] text-textMuted font-bold hover:text-primary hover:underline cursor-pointer ml-1">
            {likesCount}
          </span>
        </div>
        <div className="text-[10px] text-textMuted flex gap-2 font-bold">
          <span className="hover:text-primary hover:underline cursor-pointer">{_count?.comments || 0} comments</span>
          <span className="hover:text-primary hover:underline cursor-pointer">4 reposts</span>
        </div>
      </div>

      {/* Interactions */}
      <div className="px-1 py-1 flex items-center justify-between gap-1">
        <button 
          onClick={handleLike}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 font-bold text-sm rounded-lg transition ${liked ? 'text-primary bg-primary/5' : 'text-textMuted hover:bg-gray-100'}`}
        >
          <ThumbsUp size={18} className={liked ? 'fill-primary' : ''} /> Like
        </button>
        <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-textMuted font-bold text-sm hover:bg-gray-100 rounded-lg transition">
          <MessageSquare size={18} /> Comment
        </button>
        <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-textMuted font-bold text-sm hover:bg-gray-100 rounded-lg transition">
          <Repeat2 size={18} /> Repost
        </button>
        <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-textMuted font-bold text-sm hover:bg-gray-100 rounded-lg transition">
          <Send size={18} /> Send
        </button>
      </div>
    </motion.div>
  );
};

export default PostCard;
