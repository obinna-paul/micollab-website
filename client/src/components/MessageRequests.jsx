import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Check, X, Loader2, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

const MessageRequests = ({ onRequestHandled }) => {
  const { token } = useAuthStore();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/message-requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (requestId, status) => {
    try {
      await axios.put(`http://localhost:5000/api/message-requests/${requestId}`, 
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setRequests(requests.filter(req => req.id !== requestId));
      
      if (status === 'ACCEPTED' && onRequestHandled) {
        onRequestHandled(); // Trigger a refresh of the main conversation list
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>;
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-10 px-6">
        <p className="text-textMuted text-xs font-bold">No pending message requests.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-xs font-black uppercase tracking-widest text-textMuted mb-2">Pending Requests ({requests.length})</h3>
      {requests.map(req => (
        <div key={req.id} className="card p-4 border border-primary/20 bg-primary/5">
          <div className="flex items-start gap-3">
            <Link to={`/profile/${req.sender.username}`}>
              <img 
                src={req.sender.profileImage || `https://ui-avatars.com/api/?name=${req.sender.username}`} 
                alt="" 
                className="w-12 h-12 rounded-full object-cover border border-primary/30 hover:opacity-80 transition"
              />
            </Link>
            <div className="flex-1">
              <Link to={`/profile/${req.sender.username}`} className="font-bold text-sm text-textMain hover:underline block">
                @{req.sender.username}
              </Link>
              <p className="text-[10px] font-black uppercase text-primary tracking-widest mb-2">{req.sender.profileType || 'Creative'}</p>
              
              <div className="bg-surface border border-divider rounded-xl p-3 text-sm text-textMain relative mb-3">
                {/* Little triangle pointer */}
                <div className="absolute -top-2 left-4 w-4 h-4 bg-surface border-t border-l border-divider transform rotate-45"></div>
                <div className="relative z-10 italic">"{req.message}"</div>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleRespond(req.id, 'ACCEPTED')}
                  className="btn-primary flex items-center gap-1 text-[10px] py-1.5 px-4 rounded-full shadow-md shadow-primary/20"
                >
                  <Check size={14} /> Accept Request
                </button>
                <button 
                  onClick={() => handleRespond(req.id, 'REJECTED')}
                  className="btn-outline flex items-center gap-1 text-[10px] py-1.5 px-4 rounded-full hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                >
                  <X size={14} /> Ignore
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MessageRequests;
