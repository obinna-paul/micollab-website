import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, Send, AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

const DisputeRoom = () => {
  const { id } = useParams();
  const { user } = useAuthStore();
  const [dispute, setDispute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  
  const token = localStorage.getItem('token');
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchDisputeDetails();
    // In a real app, you'd use websockets/socket.io here for real-time updates.
    // For now, we poll every 10 seconds.
    const interval = setInterval(fetchDisputeDetails, 10000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [dispute?.messages]);

  const fetchDisputeDetails = async () => {
    try {
      const res = await axios.get(`/api/disputes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDispute(res.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load dispute details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      setSending(true);
      const res = await axios.post(`/api/disputes/${id}/message`, { message }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDispute(prev => ({
        ...prev,
        messages: [...prev.messages, res.data]
      }));
      setMessage('');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (loading && !dispute) {
    return (
      <div className="flex justify-center items-center h-screen bg-[var(--bg-background)]">
        <Loader2 className="animate-spin text-primary w-12 h-12" />
      </div>
    );
  }

  if (error || !dispute) {
    return (
      <div className="flex justify-center items-center h-screen bg-[var(--bg-background)] text-white">
        <div className="p-6 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl">
          {error || 'Dispute not found'}
        </div>
      </div>
    );
  }

  const isResolved = dispute.status !== 'OPEN';

  return (
    <div className="min-h-screen bg-[var(--bg-background)] text-[var(--text-primary)] pt-24 px-4 md:px-6 pb-20 flex flex-col">
      <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col space-y-6">
        
        {/* Header */}
        <header className="bg-[var(--bg-surface)] p-6 rounded-3xl border border-[var(--border-primary)] shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <Link to={user.isAdmin ? "/admin" : "/disputes"} className="inline-flex items-center text-sm text-[var(--text-muted)] hover:text-primary mb-2 transition">
              <ArrowLeft size={16} className="mr-1" /> Back
            </Link>
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${isResolved ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                {isResolved ? <ShieldCheck size={24} /> : <AlertTriangle size={24} />}
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight">{dispute.proposal.collab.title}</h1>
                <p className="text-[var(--text-secondary)] text-sm">
                  Dispute ID: {dispute.id}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-[var(--bg-background)] p-4 rounded-2xl border border-[var(--border-primary)]">
            <div className="text-center">
              <p className="text-[10px] uppercase font-black text-[var(--text-muted)] tracking-widest">Poster</p>
              <p className="font-bold">@{dispute.proposal.collab.poster.username}</p>
            </div>
            <div className="text-2xl text-[var(--text-muted)] font-thin">vs</div>
            <div className="text-center">
              <p className="text-[10px] uppercase font-black text-[var(--text-muted)] tracking-widest">Creative</p>
              <p className="font-bold">@{dispute.proposal.user.username}</p>
            </div>
          </div>
        </header>

        {isResolved && (
          <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-500 rounded-2xl font-bold flex items-center justify-center gap-2">
            <ShieldCheck size={20} />
            This dispute has been resolved by an administrator. Status: {dispute.status.replace('_', ' ')}
          </div>
        )}

        {/* Chat Area */}
        <div className="flex-1 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-3xl shadow-xl flex flex-col overflow-hidden min-h-[500px]">
          
          <div className="p-4 bg-[var(--bg-background)] border-b border-[var(--border-primary)] text-center text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">
            3-Way Dispute Room
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="text-center text-sm text-[var(--text-muted)] mb-8">
              Dispute opened on {new Date(dispute.createdAt).toLocaleString()}
            </div>

            {dispute.messages.map((msg) => {
              const isMe = msg.senderId === user.id;
              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-full`}>
                  <div className="flex items-end gap-2 max-w-[85%] md:max-w-[70%]">
                    {!isMe && (
                      <img 
                        src={msg.sender.profileImage || 'https://via.placeholder.com/40'} 
                        alt="avatar" 
                        className="w-8 h-8 rounded-full object-cover mb-1 border border-[var(--border-primary)]"
                      />
                    )}
                    <div className="flex flex-col">
                      <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isMe ? 'text-right' : 'text-left'} ${msg.isAdmin ? 'text-blue-500' : 'text-[var(--text-muted)]'}`}>
                        {msg.isAdmin ? 'Administrator' : `@${msg.sender.username}`}
                      </div>
                      <div className={`p-4 rounded-2xl ${
                        msg.isAdmin 
                          ? 'bg-blue-500/10 border border-blue-500/20 text-blue-100' 
                          : isMe 
                            ? 'bg-primary text-black rounded-br-sm font-medium' 
                            : 'bg-[var(--bg-background)] border border-[var(--border-primary)] text-[var(--text-primary)] rounded-bl-sm'
                      }`}>
                        <p className="whitespace-pre-wrap">{msg.message}</p>
                      </div>
                      <div className={`text-[10px] text-[var(--text-muted)] mt-1 ${isMe ? 'text-right' : 'text-left'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {!isResolved && (
            <div className="p-4 bg-[var(--bg-background)] border-t border-[var(--border-primary)] space-y-4">
              <form onSubmit={handleSendMessage} className="flex gap-3">
                <textarea
                  className="flex-1 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-2xl p-4 text-[var(--text-primary)] focus:outline-none focus:border-primary resize-none placeholder-[var(--text-muted)] transition"
                  placeholder="Type your message or share evidence links..."
                  rows="2"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={!message.trim() || sending}
                  className="bg-primary hover:bg-[#00b3cc] disabled:opacity-50 disabled:cursor-not-allowed text-black p-4 rounded-2xl font-black flex items-center justify-center transition-all duration-300 w-16"
                >
                  {sending ? <Loader2 className="animate-spin" size={24} /> : <Send size={24} />}
                </button>
              </form>
              <p className="text-[10px] text-[var(--text-muted)] text-center uppercase tracking-widest font-black">
                Administrators can read all messages
              </p>

              {user.isAdmin && (
                <div className="pt-4 border-t border-[var(--border-primary)]">
                  <p className="text-center text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-3">Admin Actions: Resolve Escrow</p>
                  <div className="flex gap-4">
                    <button 
                      onClick={async () => {
                        if (window.confirm('Are you sure you want to refund the Poster?')) {
                          try {
                            await axios.post('/api/admin/disputes/resolve', { proposalId: dispute.proposalId, action: 'REFUND_POSTER', reason: 'Resolved via Dispute Room' }, { headers: { Authorization: `Bearer ${token}` }});
                            window.location.reload();
                          } catch (err) { alert('Error resolving dispute'); }
                        }
                      }}
                      className="flex-1 py-3 bg-red-500/10 border border-red-500 hover:bg-red-500/20 text-red-500 font-black text-xs uppercase tracking-widest rounded-xl transition"
                    >
                      Force Refund Poster
                    </button>
                    <button 
                      onClick={async () => {
                        if (window.confirm('Are you sure you want to pay the Creative?')) {
                          try {
                            await axios.post('/api/admin/disputes/resolve', { proposalId: dispute.proposalId, action: 'PAY_CREATIVE', reason: 'Resolved via Dispute Room' }, { headers: { Authorization: `Bearer ${token}` }});
                            window.location.reload();
                          } catch (err) { alert('Error resolving dispute'); }
                        }
                      }}
                      className="flex-1 py-3 bg-green-500/10 border border-green-500 hover:bg-green-500/20 text-green-500 font-black text-xs uppercase tracking-widest rounded-xl transition"
                    >
                      Force Pay Creative
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default DisputeRoom;
