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
    <div className="w-full pb-8">


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
