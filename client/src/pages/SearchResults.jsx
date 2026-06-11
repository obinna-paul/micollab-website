import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import PostCard from '../components/PostCard';
import { Search, User, Briefcase, FileText, Circle } from 'lucide-react';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q');
  
  const [results, setResults] = useState({ users: [], posts: [], collabs: [], circles: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await axios.get(`/api/search?q=${encodeURIComponent(query)}`);
        setResults(res.data);
      } catch (err) {
        console.error('Failed to fetch search results:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [query]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-10 h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#7B5CFA]"></div>
      </div>
    );
  }

  if (!query) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-10 h-full">
        <Search size={48} className="text-[var(--text-muted)] mb-4 opacity-50" />
        <h2 className="text-xl font-black text-[var(--text-primary)]">Start Searching</h2>
        <p className="text-[var(--text-secondary)] mt-2">Type a keyword in the search bar above to find creatives, gigs, and posts.</p>
      </div>
    );
  }

  const { users, posts, collabs, circles } = results;
  const hasResults = users.length > 0 || posts.length > 0 || collabs.length > 0 || circles.length > 0;

  return (
    <div className="flex-1 overflow-y-auto bg-[var(--bg-base)]">
      <div className="max-w-4xl mx-auto py-10 px-4 md:px-8">
        <h1 className="text-3xl font-black text-[var(--text-primary)] mb-2">Search Results for "{query}"</h1>
        <p className="text-[var(--text-secondary)] font-bold mb-8">
          {hasResults ? 'Found matching content across our platform.' : 'No matches found. Try a different keyword.'}
        </p>

        {hasResults && (
          <div className="space-y-12">
            
            {/* Users Section */}
            {users.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4 border-b border-[var(--border-primary)] pb-2">
                  <User size={20} className="text-[#A37BFF]" />
                  <h2 className="text-xl font-black text-[var(--text-primary)]">People</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {users.map(u => (
                    <Link key={u.id} to={`/profile/${u.username}`} className="bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-primary)] hover:border-[#7B5CFA] transition group flex items-center gap-3">
                      <img src={u.profileImage || `https://ui-avatars.com/api/?name=${u.username}&background=7B5CFA&color=fff`} alt={u.username} className="w-12 h-12 rounded-full object-cover" />
                      <div className="overflow-hidden">
                        <p className="text-sm font-bold text-[var(--text-primary)] truncate group-hover:text-[#7B5CFA] transition">{u.name || `${u.username}`}</p>
                        <p className="text-xs text-[var(--text-secondary)] font-bold uppercase truncate">{u.profileType || 'CREATIVE'}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Collabs Section */}
            {collabs.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4 border-b border-[var(--border-primary)] pb-2">
                  <Briefcase size={20} className="text-[#34D399]" />
                  <h2 className="text-xl font-black text-[var(--text-primary)]">Collab Gigs</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {collabs.map(c => (
                    <Link key={c.id} to={`/collabs`} className="bg-[var(--bg-surface)] p-5 rounded-2xl border border-[var(--border-primary)] hover:border-[#34D399] transition">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-black text-[#34D399] uppercase tracking-widest">{c.category}</span>
                        <span className="text-xs font-bold text-[var(--text-secondary)] bg-[var(--bg-surface-alt)] px-2 py-1 rounded-full">{c.status}</span>
                      </div>
                      <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">{c.title}</h3>
                      <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-3">{c.description}</p>
                      <div className="flex items-center gap-2">
                        <img src={c.poster?.profileImage || `https://ui-avatars.com/api/?name=${c.poster?.username}`} className="w-5 h-5 rounded-full" alt="" />
                        <span className="text-xs font-bold text-[var(--text-secondary)]">{c.poster?.username}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Circles Section */}
            {circles.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4 border-b border-[var(--border-primary)] pb-2">
                  <Circle size={20} className="text-[#FBBF24]" />
                  <h2 className="text-xl font-black text-[var(--text-primary)]">Circles (Workspaces)</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {circles.map(c => (
                    <div key={c.id} className="bg-[var(--bg-surface)] p-5 rounded-2xl border border-[var(--border-primary)] hover:border-[#FBBF24] transition">
                      <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">{c.title}</h3>
                      <p className="text-sm text-[var(--text-secondary)] mb-3 line-clamp-2">{c.description}</p>
                      <span className="text-xs font-bold text-[#FBBF24] bg-[#FBBF24]/10 px-2 py-1 rounded-lg">{c._count.members} Members</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Posts Section */}
            {posts.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4 border-b border-[var(--border-primary)] pb-2">
                  <FileText size={20} className="text-[#60A5FA]" />
                  <h2 className="text-xl font-black text-[var(--text-primary)]">Posts</h2>
                </div>
                <div className="flex flex-col gap-4 max-w-2xl">
                  {posts.map(p => (
                    <PostCard key={p.id} post={p} />
                  ))}
                </div>
              </section>
            )}
            
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
