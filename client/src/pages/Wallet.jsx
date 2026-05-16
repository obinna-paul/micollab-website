import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Wallet as WalletIcon, TrendingUp, Users, DollarSign, ArrowUpRight, Download, CreditCard, PieChart, Activity } from 'lucide-react';

const StatCard = ({ label, value, icon: Icon, color, trend }) => (
  <div className="card p-6">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2.5 rounded-lg ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      {trend && (
        <span className="flex items-center text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
          {trend} <ArrowUpRight size={10} />
        </span>
      )}
    </div>
    <p className="text-textMuted text-xs font-bold uppercase tracking-wider mb-1">{label}</p>
    <h3 className="text-2xl font-black text-textMain">{value}</h3>
  </div>
);

const Wallet = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeSubscribers: 0,
    pendingBalance: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const res = await axios.get('/api/monetization/earnings');
        setStats(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEarnings();
  }, []);

  return (
    <div className="max-w-5xl mx-auto py-2">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-textMain flex items-center gap-3">
            <Activity className="text-primary" size={28} />
            Professional Dashboard
          </h1>
          <p className="text-textMuted text-sm font-bold mt-1">Track your earnings, gig performance, and networking growth.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-outline flex items-center gap-2 py-2 px-4 text-xs">
            <Download size={16} /> Export Report
          </button>
          <button className="btn-primary flex items-center gap-2 py-2 px-6 text-xs">
            Withdraw Funds
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard 
          label="Total Earnings" 
          value={`₦${(stats.totalRevenue * 1500).toLocaleString()}`} // Nigerian Naira conversion mock
          icon={DollarSign} 
          trend="+15.2%"
          color="bg-primary"
        />
        <StatCard 
          label="Active Gigs" 
          value="4" 
          icon={TrendingUp} 
          trend="+2"
          color="bg-music"
        />
        <StatCard 
          label="Portfolio Views" 
          value="1,284" 
          icon={Users} 
          trend="+324"
          color="bg-photography"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transaction History */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="p-4 border-b border-divider flex justify-between items-center bg-surface">
            <h3 className="font-bold text-textMain text-sm">Recent Activity</h3>
            <button className="text-xs font-bold text-primary hover:underline">View Ledger</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-[9px] text-textMuted font-black uppercase tracking-widest border-b border-divider">
                <tr>
                  <th className="px-4 py-3">Client / Source</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {[
                  { name: 'Chocolate City', date: 'May 12, 2026', type: 'Gig Payment', amount: '₦250,000', status: 'Completed' },
                  { name: 'Greoh Studios', date: 'May 10, 2026', type: 'Proposal Hire', amount: '₦120,000', status: 'Pending' },
                  { name: 'Premium Fan #21', date: 'May 08, 2026', type: 'Subscription', amount: '₦15,000', status: 'Completed' },
                  { name: 'Brand Campaign X', date: 'May 05, 2026', type: 'Contract', amount: '₦500,000', status: 'Completed' }
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-primary font-bold text-[10px]">CC</div>
                      <span className="font-bold text-textMain text-xs">{row.name}</span>
                    </td>
                    <td className="px-4 py-3 text-[10px] text-textMuted">{row.date}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-gray-100 text-textMuted rounded text-[9px] font-bold uppercase">{row.type}</span>
                    </td>
                    <td className="px-4 py-3 font-bold text-textMain text-xs text-right">{row.amount}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-black uppercase ${row.status === 'Completed' ? 'text-green-600' : 'text-orange-500'}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payout Methods & Tips */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card p-5">
            <h3 className="font-bold text-textMain text-sm mb-4 flex items-center gap-2">
              <CreditCard size={18} className="text-primary" /> Payout Method
            </h3>
            <div className="bg-background p-4 rounded-xl border border-divider border-dashed flex flex-col items-center text-center gap-2">
              <p className="text-[10px] text-textMuted font-bold uppercase">No bank account connected</p>
              <button className="w-full py-2 bg-primary/10 text-primary border border-primary/10 font-bold rounded-lg hover:bg-primary/20 transition text-xs">
                Add Bank Details
              </button>
            </div>
          </div>

          <div className="card p-5 bg-gradient-to-br from-primary to-primaryHover shadow-lg border-none text-white">
            <h3 className="font-black text-lg mb-2">Grow Your Income</h3>
            <p className="text-white/80 text-[10px] leading-relaxed mb-4">
              Completing more gigs and getting positive reviews increases your **Reputation Score**, which helps you rank higher in talent searches.
            </p>
            <button className="w-full py-2 bg-white text-primary font-bold rounded-lg hover:bg-gray-100 transition text-xs shadow-md">
              Update Portfolio
            </button>
          </div>

          <div className="card p-5">
             <h3 className="font-bold text-textMain text-sm mb-4 flex items-center gap-2">
               <PieChart size={18} className="text-music" /> Category Stats
             </h3>
             <div className="space-y-3">
                {[
                  { label: 'Music Production', val: '65%', color: 'bg-music' },
                  { label: 'Writing Gigs', val: '25%', color: 'bg-writing' },
                  { label: 'Performances', val: '10%', color: 'bg-dance' }
                ].map((s, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-[10px] font-bold text-textMuted mb-1">
                      <span>{s.label}</span>
                      <span>{s.val}</span>
                    </div>
                    <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${s.color}`} style={{ width: s.val }}></div>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wallet;
