import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet as WalletIcon, TrendingUp, DollarSign, ArrowUpRight, Lock, CheckCircle, X, Banknote, Clock } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

const StatCard = ({ label, value, icon: Icon, color, subtext }) => (
  <div className="bg-[var(--bg-surface)] p-6 rounded-2xl border border-[var(--border-primary)] shadow-sm relative overflow-hidden group">
    <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 transition-transform group-hover:scale-110 ${color}`}></div>
    <div className="flex justify-between items-start mb-4 relative z-10">
      <div className={`p-3 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border-primary)]`}>
        <Icon size={24} className={color.replace('bg-', 'text-')} />
      </div>
    </div>
    <p className="text-[var(--text-secondary)] text-xs font-bold uppercase tracking-wider mb-1 relative z-10">{label}</p>
    <h3 className="text-3xl font-black text-[var(--text-primary)] relative z-10">₦{value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
    {subtext && <p className="text-[10px] text-[var(--text-secondary)] mt-2 font-semibold">{subtext}</p>}
  </div>
);

const Wallet = () => {
  const { token, user } = useAuthStore();
  const [wallet, setWallet] = useState({ availableBalance: 0, escrowBalance: 0 });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  // Withdraw Form State
  const [amount, setAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('BANK_ACCOUNT');
  const [bankDetails, setBankDetails] = useState({ bankName: '', accountNumber: '', accountName: '' });
  const [paypalEmail, setPaypalEmail] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [walletRes, txRes] = await Promise.all([
        axios.get('/api/wallet', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/wallet/transactions', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setWallet(walletRes.data);
      setTransactions(txRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setWithdrawError('');
    setWithdrawing(true);
    
    const payoutDetails = payoutMethod === 'BANK_ACCOUNT' ? bankDetails : { email: paypalEmail };

    try {
      await axios.post('/api/wallet/withdraw', {
        amount: parseFloat(amount),
        payoutMethod,
        payoutDetails
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      setIsWithdrawOpen(false);
      fetchData(); // Refresh balances and history
    } catch (err) {
      setWithdrawError(err.response?.data?.error || 'Failed to request withdrawal');
    } finally {
      setWithdrawing(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-500 bg-green-500/10';
      case 'PENDING': return 'text-amber-500 bg-amber-500/10';
      case 'FAILED': case 'REJECTED': return 'text-red-500 bg-red-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'DEPOSIT': return <ArrowUpRight size={16} className="text-green-500" />;
      case 'WITHDRAWAL': return <Banknote size={16} className="text-amber-500" />;
      case 'ESCROW_HOLD': return <Lock size={16} className="text-purple-500" />;
      case 'ESCROW_RELEASE': return <CheckCircle size={16} className="text-blue-500" />;
      default: return <TrendingUp size={16} className="text-gray-500" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 md:px-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-black text-[var(--text-primary)] flex items-center gap-3">
            <WalletIcon className="text-[#7B5CFA]" size={32} />
            My Wallet
          </h1>
          <p className="text-[var(--text-secondary)] text-sm font-bold mt-2">Manage your earnings, escrows, and withdrawals.</p>
        </div>
        <button 
          onClick={() => setIsWithdrawOpen(true)}
          className="bg-[#7B5CFA] hover:bg-[#684CE0] text-white px-6 py-3 font-black text-sm rounded-xl shadow-lg transition-colors flex items-center gap-2"
        >
          <Banknote size={18} /> Withdraw Funds
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-20">
          <div className="w-8 h-8 border-4 border-[#7B5CFA] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <StatCard 
              label="Available Balance" 
              value={wallet.availableBalance} 
              icon={DollarSign} 
              color="bg-green-500"
              subtext="Funds available for immediate withdrawal."
            />
            <StatCard 
              label="In Escrow" 
              value={wallet.escrowBalance} 
              icon={Lock} 
              color="bg-purple-500"
              subtext="Funds held securely for ongoing gigs. Released upon completion."
            />
          </div>

          <div className="bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-2xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-[var(--border-primary)] bg-[var(--bg-surface-alt)]">
              <h3 className="font-black text-[var(--text-primary)] text-lg flex items-center gap-2">
                <Clock size={20} className="text-[var(--text-secondary)]" /> Transaction History
              </h3>
            </div>
            
            {transactions.length === 0 ? (
              <div className="p-10 text-center text-[var(--text-secondary)] font-bold text-sm">
                No transactions yet. Start collaborating to earn!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[var(--bg-base)] text-[10px] text-[var(--text-secondary)] font-black uppercase tracking-widest border-b border-[var(--border-primary)]">
                    <tr>
                      <th className="px-6 py-4">Transaction</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-primary)] text-sm">
                    {transactions.map(tx => (
                      <tr key={tx.id} className="hover:bg-[var(--bg-surface-alt)] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-[var(--bg-base)] border border-[var(--border-primary)]">
                              {getTypeIcon(tx.type)}
                            </div>
                            <div>
                              <p className="font-bold text-[var(--text-primary)]">{tx.type.replace('_', ' ')}</p>
                              {tx.description && <p className="text-[10px] text-[var(--text-secondary)] font-semibold mt-0.5">{tx.description}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-black text-[var(--text-primary)]">
                          {tx.type === 'WITHDRAWAL' ? '-' : '+'}₦{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-current ${getStatusColor(tx.status)}`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-[var(--text-secondary)] font-bold text-xs">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Withdraw Modal */}
      <AnimatePresence>
        {isWithdrawOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsWithdrawOpen(false)}></div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--bg-surface)] w-full max-w-md rounded-3xl border border-[var(--border-primary)] shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="p-6 border-b border-[var(--border-primary)] flex justify-between items-center bg-[var(--bg-surface-alt)]">
                <h3 className="font-black text-[var(--text-primary)] text-xl">Request Withdrawal</h3>
                <button onClick={() => setIsWithdrawOpen(false)} className="text-[var(--text-secondary)] hover:text-red-500 transition-colors p-1">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6">
                <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <p className="text-[10px] text-green-600 font-black uppercase tracking-widest mb-1">Available to Withdraw</p>
                  <p className="text-2xl font-black text-green-600">₦{wallet.availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>

                <form onSubmit={handleWithdraw} className="space-y-4">
                  {withdrawError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold rounded-xl text-center">
                      {withdrawError}
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-2">Amount (₦)</label>
                    <input 
                      type="number" 
                      required
                      min="1000"
                      max={wallet.availableBalance}
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      className="w-full bg-[var(--bg-base)] border border-[var(--border-primary)] text-[var(--text-primary)] rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[#7B5CFA] transition-colors"
                      placeholder="Enter amount (Min ₦1,000)"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-2">Payout Method</label>
                    <div className="flex gap-2">
                      <button 
                        type="button"
                        onClick={() => setPayoutMethod('BANK_ACCOUNT')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${payoutMethod === 'BANK_ACCOUNT' ? 'bg-[#7B5CFA]/10 border-[#7B5CFA] text-[#7B5CFA]' : 'border-[var(--border-primary)] text-[var(--text-secondary)] hover:bg-[var(--bg-base)]'}`}
                      >
                        Local Bank
                      </button>
                      <button 
                        type="button"
                        onClick={() => setPayoutMethod('PAYPAL')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${payoutMethod === 'PAYPAL' ? 'bg-[#7B5CFA]/10 border-[#7B5CFA] text-[#7B5CFA]' : 'border-[var(--border-primary)] text-[var(--text-secondary)] hover:bg-[var(--bg-base)]'}`}
                      >
                        PayPal
                      </button>
                    </div>
                  </div>

                  {payoutMethod === 'BANK_ACCOUNT' ? (
                    <div className="space-y-3 pt-2 border-t border-[var(--border-primary)]">
                      <input 
                        type="text" required placeholder="Bank Name (e.g. GTBank)" value={bankDetails.bankName}
                        onChange={e => setBankDetails({...bankDetails, bankName: e.target.value})}
                        className="w-full bg-[var(--bg-base)] border border-[var(--border-primary)] text-[var(--text-primary)] rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-[#7B5CFA]"
                      />
                      <input 
                        type="text" required placeholder="Account Number" value={bankDetails.accountNumber}
                        onChange={e => setBankDetails({...bankDetails, accountNumber: e.target.value})}
                        className="w-full bg-[var(--bg-base)] border border-[var(--border-primary)] text-[var(--text-primary)] rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-[#7B5CFA]"
                      />
                      <input 
                        type="text" required placeholder="Account Name" value={bankDetails.accountName}
                        onChange={e => setBankDetails({...bankDetails, accountName: e.target.value})}
                        className="w-full bg-[var(--bg-base)] border border-[var(--border-primary)] text-[var(--text-primary)] rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-[#7B5CFA]"
                      />
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-[var(--border-primary)]">
                      <input 
                        type="email" required placeholder="PayPal Email Address" value={paypalEmail}
                        onChange={e => setPaypalEmail(e.target.value)}
                        className="w-full bg-[var(--bg-base)] border border-[var(--border-primary)] text-[var(--text-primary)] rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:border-[#7B5CFA]"
                      />
                    </div>
                  )}

                  <button 
                    type="submit"
                    disabled={withdrawing || wallet.availableBalance <= 0}
                    className="w-full bg-[#7B5CFA] hover:bg-[#684CE0] disabled:bg-gray-600 text-white py-3.5 rounded-xl font-black text-sm uppercase tracking-widest mt-6 transition-colors shadow-lg"
                  >
                    {withdrawing ? 'Processing...' : 'Submit Request'}
                  </button>
                  <p className="text-center text-[10px] text-[var(--text-secondary)] font-semibold">Withdrawals are processed manually within 24-48 hours.</p>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Wallet;
