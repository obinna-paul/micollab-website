import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ShieldCheck, LayoutDashboard, Users, Banknote, 
  AlertTriangle, CheckCircle, XCircle, TrendingUp,
  Activity, Clock, DollarSign, Search, ShieldAlert
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

// We inline the Withdrawals and Disputes logic to keep it unified, or we could split them into sub-components.

const AdminDashboard = () => {
  const { token } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // Data States
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Action state
  const [processingId, setProcessingId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [metRes, usrRes, witRes, disRes] = await Promise.all([
        axios.get('/api/admin/metrics', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/admin/withdrawals', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/admin/disputes', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setMetrics(metRes.data);
      setUsers(usrRes.data);
      setWithdrawals(witRes.data);
      setDisputes(disRes.data);
    } catch (err) {
      console.error("Admin fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  // --- Actions ---

  const handleToggleAdmin = async (id) => {
    if (!window.confirm('Toggle Admin privileges for this user?')) return;
    try {
      await axios.patch(`/api/admin/users/${id}/toggle-admin`, {}, { headers: { Authorization: `Bearer ${token}` } });
      fetchData();
    } catch (err) { alert('Failed to toggle admin status'); }
  };

  const handleToggleBan = async (id) => {
    if (!window.confirm('Toggle Ban status for this user?')) return;
    try {
      await axios.patch(`/api/admin/users/${id}/toggle-ban`, {}, { headers: { Authorization: `Bearer ${token}` } });
      fetchData();
    } catch (err) { alert('Failed to toggle ban status'); }
  };

  const handleProcessWithdrawal = async (id, action) => {
    const notes = window.prompt(`Enter notes for ${action.toUpperCase()}:`);
    if (notes === null) return;
    setProcessingId(id);
    try {
      await axios.post(`/api/admin/withdrawals/${id}/${action}`, { notes }, { headers: { Authorization: `Bearer ${token}` } });
      alert(`Request ${action}ed successfully.`);
      fetchData();
    } catch (err) { alert('Failed to process request'); } finally { setProcessingId(null); }
  };

  const handleResolveDispute = async (proposalId, action) => {
    if (!window.confirm(`Are you sure you want to ${action.replace('_', ' ')}?`)) return;
    setProcessingId(proposalId);
    try {
      await axios.post(`/api/admin/disputes/resolve`, { proposalId, action }, { headers: { Authorization: `Bearer ${token}` } });
      alert('Dispute resolved.');
      fetchData();
    } catch (err) { alert('Failed to resolve dispute'); } finally { setProcessingId(null); }
  };

  // --- Renderers ---

  const renderOverview = () => {
    if (!metrics) return null;
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[var(--bg-surface)] p-6 rounded-2xl border border-[var(--border-primary)] shadow-sm">
            <Users size={24} className="text-blue-500 mb-3" />
            <p className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Total Users</p>
            <h3 className="text-3xl font-black text-[var(--text-primary)]">{metrics.totalUsers}</h3>
            <p className="text-xs text-green-500 font-bold mt-2 flex items-center gap-1"><TrendingUp size={14} /> +12% this week</p>
          </div>
          <div className="bg-[var(--bg-surface)] p-6 rounded-2xl border border-[var(--border-primary)] shadow-sm">
            <Activity size={24} className="text-green-500 mb-3" />
            <p className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Active Collabs</p>
            <h3 className="text-3xl font-black text-[var(--text-primary)]">{metrics.activeCollabs}</h3>
          </div>
          <div className="bg-[var(--bg-surface)] p-6 rounded-2xl border border-[var(--border-primary)] shadow-sm">
            <ShieldCheck size={24} className="text-purple-500 mb-3" />
            <p className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Total Escrow (Held)</p>
            <h3 className="text-3xl font-black text-[var(--text-primary)]">₦{metrics.totalEscrow.toLocaleString()}</h3>
          </div>
          <div className="bg-[var(--bg-surface)] p-6 rounded-2xl border border-[var(--border-primary)] shadow-sm">
            <DollarSign size={24} className="text-amber-500 mb-3" />
            <p className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Available (Ready to Withdraw)</p>
            <h3 className="text-3xl font-black text-[var(--text-primary)]">₦{metrics.totalAvailable.toLocaleString()}</h3>
          </div>
        </div>

        {/* Future expansion: Charts go here */}
        <div className="bg-[var(--bg-surface)] p-8 rounded-3xl border border-[var(--border-primary)] text-center shadow-sm">
           <Clock size={32} className="mx-auto text-[var(--text-muted)] mb-3" />
           <h3 className="text-xl font-black text-[var(--text-primary)]">Advanced Analytics Coming Soon</h3>
           <p className="text-[var(--text-secondary)]">Daily Active Users, Time spent on app, and Retention Cohorts are being instrumented.</p>
        </div>
      </div>
    );
  };

  const renderUsers = () => {
    const filtered = users.filter(u => u.username.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase()));
    return (
      <div className="space-y-4">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input 
            type="text" 
            placeholder="Search users by username or email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--bg-surface)] border border-[var(--border-primary)] text-[var(--text-primary)] rounded-xl pl-12 pr-4 py-3 text-sm font-bold focus:outline-none focus:border-[#7B5CFA]"
          />
        </div>
        
        <div className="bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-[var(--bg-surface-alt)] text-[10px] text-[var(--text-secondary)] font-black uppercase tracking-widest border-b border-[var(--border-primary)]">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4">Roles</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-primary)] text-sm">
              {filtered.map(u => (
                <tr key={u.id} className={`${u.isBanned ? 'bg-red-500/5' : 'hover:bg-[var(--bg-surface-alt)]'}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={u.profileImage} className="w-10 h-10 rounded-lg object-cover" alt=""/>
                      <div>
                        <p className="font-bold text-[var(--text-primary)]">@{u.username}</p>
                        <p className="text-xs text-[var(--text-secondary)]">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)]">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {u.isAdmin && <span className="text-[9px] font-black uppercase tracking-widest bg-purple-500/10 text-purple-500 px-2 py-1 rounded-md">Admin</span>}
                      {u.isBanned && <span className="text-[9px] font-black uppercase tracking-widest bg-red-500/10 text-red-500 px-2 py-1 rounded-md">Banned</span>}
                      {!u.isAdmin && !u.isBanned && <span className="text-[9px] font-black uppercase tracking-widest bg-[var(--bg-base)] border border-[var(--border-primary)] px-2 py-1 rounded-md text-[var(--text-secondary)]">Member</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleToggleAdmin(u.id)} className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-[var(--border-primary)] hover:bg-[var(--bg-surface-alt)]">
                        {u.isAdmin ? 'Revoke Admin' : 'Make Admin'}
                      </button>
                      <button onClick={() => handleToggleBan(u.id)} className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border ${u.isBanned ? 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'}`}>
                        {u.isBanned ? 'Unban' : 'Ban'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderWithdrawals = () => {
    if (withdrawals.length === 0) return (
      <div className="bg-[var(--bg-surface)] p-20 text-center rounded-3xl border border-[var(--border-primary)] shadow-sm">
        <CheckCircle size={48} className="text-green-500 mx-auto mb-4 opacity-50" />
        <h3 className="text-xl font-black text-[var(--text-primary)]">All Caught Up</h3>
        <p className="text-[var(--text-secondary)] font-medium mt-2">No pending withdrawal requests.</p>
      </div>
    );

    return (
      <div className="space-y-4">
        {withdrawals.map(req => {
          const details = JSON.parse(req.payoutDetails || '{}');
          return (
            <div key={req.id} className="bg-[var(--bg-surface)] p-6 rounded-2xl border border-[var(--border-primary)] shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="flex items-center gap-4">
                <img src={req.user.profileImage} alt="" className="w-12 h-12 rounded-xl object-cover" />
                <div>
                  <h3 className="font-black text-[var(--text-primary)] text-lg">@{req.user.username}</h3>
                  <p className="text-[10px] font-black uppercase text-[#7B5CFA] bg-[#7B5CFA]/10 px-2 py-0.5 rounded-md inline-block mt-1">Requested: {new Date(req.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex-1 bg-[var(--bg-base)] p-4 rounded-xl border border-[var(--border-primary)]">
                <p className="text-lg font-black text-green-500 mb-2">₦{req.amount.toLocaleString()}</p>
                <div className="text-xs font-bold text-[var(--text-primary)]">
                  <span className="text-[9px] font-black uppercase text-[var(--text-muted)] block mb-1">{req.payoutMethod.replace('_', ' ')}</span>
                  {req.payoutMethod === 'BANK_ACCOUNT' ? `${details.bankName} - ${details.accountNumber} (${details.accountName})` : details.email}
                </div>
              </div>
              <div className="flex gap-2 w-full lg:w-auto">
                <button onClick={() => handleProcessWithdrawal(req.id, 'process')} disabled={processingId === req.id} className="flex-1 lg:w-32 py-2 bg-green-500 text-white font-black text-[10px] uppercase rounded-lg">Mark Paid</button>
                <button onClick={() => handleProcessWithdrawal(req.id, 'reject')} disabled={processingId === req.id} className="flex-1 lg:w-32 py-2 bg-[var(--bg-base)] border border-[var(--border-primary)] text-red-500 font-black text-[10px] uppercase rounded-lg">Reject</button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDisputes = () => {
    if (disputes.length === 0) return (
      <div className="bg-[var(--bg-surface)] p-20 text-center rounded-3xl border border-[var(--border-primary)] shadow-sm">
        <ShieldCheck size={48} className="text-purple-500 mx-auto mb-4 opacity-50" />
        <h3 className="text-xl font-black text-[var(--text-primary)]">No Active Disputes</h3>
        <p className="text-[var(--text-secondary)] font-medium mt-2">All escrow contracts are running smoothly.</p>
      </div>
    );

    return (
      <div className="space-y-4">
        {disputes.map(d => (
          <div key={d.id} className="bg-[var(--bg-surface)] p-6 rounded-2xl border border-red-500/30 shadow-sm flex flex-col">
            <div className="flex items-center gap-2 text-red-500 font-black text-xs uppercase tracking-widest mb-4">
              <AlertTriangle size={16} /> Escrow Dispute
            </div>
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-6">
              <div>
                <h3 className="font-black text-[var(--text-primary)] text-xl mb-1">{d.collab.title}</h3>
                <p className="text-sm font-bold text-[var(--text-secondary)]">Poster: <span className="text-[var(--text-primary)]">@{d.collab.poster.username}</span> | Creative: <span className="text-[var(--text-primary)]">@{d.user.username}</span></p>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 px-6 py-3 rounded-xl text-center">
                <p className="text-[9px] font-black uppercase text-red-500 tracking-widest">Locked Amount</p>
                <p className="text-2xl font-black text-red-500">₦{parseFloat(d.bidAmount).toLocaleString()}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleResolveDispute(d.id, 'REFUND_POSTER')} disabled={processingId === d.id} className="flex-1 py-3 bg-[var(--bg-base)] border border-[var(--border-primary)] hover:border-red-500 text-red-500 font-black text-[10px] uppercase rounded-xl transition-colors">
                Force Refund Poster
              </button>
              <button onClick={() => handleResolveDispute(d.id, 'PAY_CREATIVE')} disabled={processingId === d.id} className="flex-1 py-3 bg-[var(--bg-base)] border border-[var(--border-primary)] hover:border-green-500 text-green-500 font-black text-[10px] uppercase rounded-xl transition-colors">
                Force Pay Creative
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) return <div className="p-40 flex justify-center"><div className="w-10 h-10 border-4 border-[#7B5CFA] border-t-transparent rounded-full animate-spin"></div></div>;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'users', label: 'Users & Moderation', icon: Users },
    { id: 'withdrawals', label: 'Withdrawals', icon: Banknote },
    { id: 'disputes', label: 'Disputes', icon: ShieldAlert },
  ];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 flex flex-col md:flex-row gap-8 min-h-[80vh]">
      {/* Sidebar */}
      <div className="w-full md:w-64 flex-shrink-0 space-y-2">
        <h2 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-4 ml-4">Admin Controls</h2>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-black tracking-wide transition-all ${activeTab === tab.id ? 'bg-[#7B5CFA] text-white shadow-lg' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]'}`}
          >
            <tab.icon size={18} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'withdrawals' && renderWithdrawals()}
        {activeTab === 'disputes' && renderDisputes()}
      </div>
    </div>
  );
};

export default AdminDashboard;
