import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShieldCheck, Banknote, CheckCircle, XCircle } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

const AdminWithdrawals = () => {
  const { token } = useAuthStore();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const fetchRequests = async () => {
    try {
      const res = await axios.get('/api/admin/withdrawals', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchRequests();
  }, [token]);

  const handleProcess = async (id, action) => {
    const notes = window.prompt(`Enter notes for ${action.toUpperCase()}:`);
    if (notes === null) return;

    setProcessingId(id);
    try {
      const endpoint = `/api/admin/withdrawals/${id}/${action}`; // action is 'process' or 'reject'
      await axios.post(endpoint, { notes }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`Request ${action}ed successfully.`);
      fetchRequests();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || `Failed to ${action} request`);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return <div className="p-20 text-center font-bold text-[var(--text-secondary)] animate-pulse">Loading admin dashboard...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <div className="flex items-center gap-3 mb-10 border-b border-[var(--border-primary)] pb-4">
        <div className="p-3 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20">
          <ShieldCheck size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-[var(--text-primary)]">Admin: Pending Withdrawals</h1>
          <p className="text-xs font-bold text-[var(--text-secondary)] mt-1 uppercase tracking-widest">Process payout requests from creatives</p>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="bg-[var(--bg-surface)] p-20 text-center rounded-3xl border border-[var(--border-primary)] shadow-sm">
          <Banknote size={48} className="text-[var(--text-muted)] mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-black text-[var(--text-primary)]">No pending withdrawals</h3>
          <p className="text-[var(--text-secondary)] font-medium mt-2">All payout requests have been processed.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {requests.map(req => {
            const details = JSON.parse(req.payoutDetails || '{}');
            return (
              <div key={req.id} className="bg-[var(--bg-surface)] p-6 rounded-2xl border border-[var(--border-primary)] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group hover:border-[#7B5CFA]/50 transition-colors">
                
                <div className="flex items-center gap-4">
                  <img src={req.user.profileImage || `https://ui-avatars.com/api/?name=${req.user.username}`} alt="" className="w-14 h-14 rounded-xl object-cover bg-[var(--bg-base)] border border-[var(--border-primary)]" />
                  <div>
                    <h3 className="font-black text-[var(--text-primary)] text-lg">@{req.user.username}</h3>
                    <p className="text-[10px] font-bold text-[var(--text-secondary)] mt-0.5">{req.user.email}</p>
                    <p className="text-[9px] font-black uppercase text-[#7B5CFA] bg-[#7B5CFA]/10 px-2 py-0.5 rounded-md inline-block mt-2">Requested: {new Date(req.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex-1 bg-[var(--bg-base)] p-4 rounded-xl border border-[var(--border-primary)]">
                  <div className="flex justify-between items-center mb-3 border-b border-[var(--border-primary)] pb-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Amount</span>
                    <span className="text-lg font-black text-green-500">₦{req.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] block mb-1">Method: {req.payoutMethod.replace('_', ' ')}</span>
                    {req.payoutMethod === 'BANK_ACCOUNT' ? (
                      <div className="text-xs font-bold text-[var(--text-primary)]">
                        <p>{details.bankName}</p>
                        <p className="text-[#7B5CFA]">{details.accountNumber}</p>
                        <p className="text-[10px] text-[var(--text-secondary)]">{details.accountName}</p>
                      </div>
                    ) : (
                      <p className="text-xs font-bold text-[#7B5CFA]">{details.email}</p>
                    )}
                  </div>
                </div>

                <div className="flex md:flex-col gap-2 w-full md:w-auto">
                  <button 
                    onClick={() => handleProcess(req.id, 'process')}
                    disabled={processingId === req.id}
                    className="flex-1 md:w-40 py-3 bg-green-500 hover:bg-green-600 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-colors shadow-lg flex justify-center items-center gap-2"
                  >
                    <CheckCircle size={16} /> Mark Paid
                  </button>
                  <button 
                    onClick={() => handleProcess(req.id, 'reject')}
                    disabled={processingId === req.id}
                    className="flex-1 md:w-40 py-3 bg-[var(--bg-base)] border border-[var(--border-primary)] text-red-500 hover:bg-red-500/10 font-black text-xs uppercase tracking-widest rounded-xl transition-colors flex justify-center items-center gap-2"
                  >
                    <XCircle size={16} /> Reject
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminWithdrawals;
