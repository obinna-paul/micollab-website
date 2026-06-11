import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShieldAlert, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const Disputes = () => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/disputes/my-disputes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDisputes(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load your disputes.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[var(--bg-background)] text-[var(--text-primary)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-background)] text-[var(--text-primary)] pt-24 px-6 pb-20">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <header className="flex items-center gap-4">
          <div className="p-4 bg-red-500/10 rounded-2xl">
            <ShieldAlert size={32} className="text-red-500" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">Dispute Center</h1>
            <p className="text-[var(--text-secondary)]">Manage and resolve your escrow disputes</p>
          </div>
        </header>

        {error && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl">{error}</div>}

        <div className="space-y-4">
          {disputes.length === 0 ? (
            <div className="text-center py-20 bg-[var(--bg-surface)] rounded-3xl border border-[var(--border-primary)] shadow-xl">
              <CheckCircle2 size={48} className="mx-auto text-green-500 mb-4 opacity-50" />
              <h3 className="text-xl font-bold mb-2">No Active Disputes</h3>
              <p className="text-[var(--text-secondary)]">You don't have any open or past disputes.</p>
            </div>
          ) : (
            disputes.map((dispute) => (
              <Link 
                to={`/disputes/${dispute.id}`} 
                key={dispute.id}
                className="block bg-[var(--bg-surface)] p-6 rounded-3xl border border-[var(--border-primary)] hover:border-primary/50 transition duration-300 shadow-xl group"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${
                        dispute.status === 'OPEN' 
                          ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' 
                          : 'bg-green-500/10 text-green-500 border border-green-500/20'
                      }`}>
                        {dispute.status.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">
                        Opened {new Date(dispute.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold group-hover:text-primary transition">
                      {dispute.proposal.collab.title}
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Opened by: <span className="font-bold text-[var(--text-primary)]">@{dispute.openedBy.username}</span>
                    </p>
                  </div>
                  <ChevronRight size={24} className="text-[var(--text-muted)] group-hover:text-primary transition transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))
          )}
        </div>

      </div>
    </div>
  );
};

export default Disputes;
