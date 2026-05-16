import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import PostCard from '../components/PostCard';
import CreatePost from '../components/CreatePost';
import { Briefcase, ArrowRight, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

const Feed = () => {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedMode, setFeedMode] = useState('GLOBAL'); // GLOBAL, NETWORK

  useEffect(() => {
    fetchPosts();
  }, [feedMode]);

  // Listen for posts created via mobile sheet
  useEffect(() => {
    const handler = () => fetchPosts();
    window.addEventListener('postCreated', handler);
    return () => window.removeEventListener('postCreated', handler);
  }, [feedMode]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const endpoint = feedMode === 'NETWORK' ? '/api/network/feed' : '/api/posts';
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const res = await axios.get(endpoint, { headers });
      setPosts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
  };

  const CollabActivityCard = ({ post }) => (
    <div className="bg-white border border-primary/20 rounded-[30px] p-8 shadow-xl shadow-primary/5 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
         <Briefcase size={80} className="text-primary rotate-12" />
      </div>
      
      <div className="flex items-center gap-4 mb-6">
        <img 
          src={post.creator?.profileImage || `https://ui-avatars.com/api/?name=${post.creator?.username}`} 
          className="w-12 h-12 rounded-2xl border-2 border-white shadow-sm object-cover" 
          alt="" 
        />
        <div>
          <p className="text-sm font-black text-textMain tracking-tight">
            <Link to={`/profile/${post.creator?.username}`} className="hover:text-primary transition-colors hover:underline">@{post.creator?.username}</Link>
          </p>
          <p className="text-[10px] text-textMuted font-black uppercase tracking-widest">{post.creator?.profileType} • Shared a New Opportunity</p>
        </div>
      </div>
      
      <div className="bg-primary/5 border border-primary/10 p-6 rounded-3xl">
        <h4 className="font-black text-textMain text-xl mb-4 tracking-tighter leading-tight">
          {post.caption.split('"')[1] || post.caption}
        </h4>
        <Link 
          to={`/collabs/${post.collabId}`}
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:gap-3 transition-all"
        >
          Explore Details <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto py-2">
      {/* Route to Collabs (Desktop Only) */}
      <div className="hidden md:block card mb-6 overflow-hidden border-none bg-white shadow-sm ring-1 ring-primary/5">
        <div className="bg-primary/[0.03] p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-primary uppercase tracking-widest">Looking to hire?</p>
            <p className="text-sm text-textMain font-medium mt-0.5">Post gigs and find talent in the Collabs Hub.</p>
          </div>
          <button 
            onClick={() => navigate('/collabs/new')}
            className="bg-white text-primary text-xs font-bold px-4 py-2 rounded-xl shadow-sm border border-divider hover:border-primary/50 transition-all flex items-center gap-2 group"
          >
            <Briefcase size={14} className="group-hover:scale-110 transition-transform" /> 
            <span>Post Collab</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Mobile Feed Tabs (TikTok/X Style) */}
      <div className="flex border-b border-divider mb-4 sticky top-14 bg-background/80 backdrop-blur-xl z-40 md:hidden">
        <button
          onClick={() => setFeedMode('GLOBAL')}
          className={`flex-1 py-3 text-[11px] font-black uppercase tracking-[0.2em] transition-all relative ${feedMode === 'GLOBAL' ? 'text-primary' : 'text-textMuted'}`}
        >
          For You
          {feedMode === 'GLOBAL' && (
            <motion.div layoutId="feed-tab-mobile" className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full" />
          )}
        </button>
        <button
          onClick={() => setFeedMode('NETWORK')}
          className={`flex-1 py-3 text-[11px] font-black uppercase tracking-[0.2em] transition-all relative ${feedMode === 'NETWORK' ? 'text-primary' : 'text-textMuted'}`}
        >
          Network
          {feedMode === 'NETWORK' && (
            <motion.div layoutId="feed-tab-mobile" className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full" />
          )}
        </button>
      </div>
      
      {/* Desktop Feed Toggle */}
      <div className="hidden md:flex bg-white/40 backdrop-blur-xl p-1.5 rounded-2xl border border-divider mb-8 sticky top-2 z-40">
        <button
          onClick={() => setFeedMode('GLOBAL')}
          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${feedMode === 'GLOBAL' ? 'bg-white text-primary shadow-sm' : 'text-textMuted hover:text-textMain'}`}
        >
          For You
        </button>
        <button
          onClick={() => setFeedMode('NETWORK')}
          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${feedMode === 'NETWORK' ? 'bg-white text-primary shadow-sm' : 'text-textMuted hover:text-textMain'}`}
        >
          My Network
        </button>
      </div>

      <div className="hidden md:block">
        <CreatePost onPostCreated={handlePostCreated} />
      </div>

      {loading ? (
        <div className="py-20 text-center flex flex-col items-center gap-4">
           <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div>
           <p className="text-textMuted font-bold animate-pulse">Syncing with your network...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            post.isCollabCard ? (
              <CollabActivityCard key={post.id} post={post} />
            ) : (
              <PostCard key={post.id} post={post} />
            )
          ))}
          
          {posts.length === 0 && (
            <div className="card p-20 text-center">
              <p className="text-textMuted font-bold">Your feed is quiet. Start following creatives to see their work!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Feed;
