import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShieldCheck, ArrowLeft, CreditCard, CheckCircle, Loader2 } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

const EscrowCheckout = () => {
  const { id: collabId } = useParams();
  const [searchParams] = useSearchParams();
  const proposalId = searchParams.get('proposalId');
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  
  const [collab, setCollab] = useState(null);
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchData();
  }, [collabId, proposalId]);

  const fetchData = async () => {
    try {
      const collabRes = await axios.get(`/api/collabs/${collabId}`);
      setCollab(collabRes.data);
      const matchedProposal = collabRes.data.proposals.find(p => p.id === proposalId);
      setProposal(matchedProposal);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    setProcessing(true);
    try {
      // In a real application, this would call Paystack/Stripe API
      // We will simulate a successful funding for now
      await axios.post(`/api/escrow/deposit`, { 
        collabId, 
        proposalId,
        amount: proposal?.bidAmount || collab?.budget
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Deposit Successful! Funds are now securely held in Escrow.');
      navigate(`/collabs/manage/${collabId}`);
    } catch (err) {
      console.error(err);
      alert('Failed to process deposit');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return (
    <div className="py-40 flex justify-center">
      <Loader2 size={40} className="animate-spin text-[#7B5CFA]" />
    </div>
  );

  if (!collab || !proposal) return <div className="p-20 text-center">Data not found</div>;

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] hover:text-[#7B5CFA] mb-8">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="bg-[var(--bg-base)] border border-[var(--border-primary)] rounded-[3rem] p-8 md:p-12 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-[#34D399]/10 rounded-2xl flex items-center justify-center text-[#34D399]">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[var(--text-primary)]">Secure Escrow Deposit</h1>
            <p className="text-sm font-medium text-[var(--text-secondary)]">Funds are held safely until you approve the work.</p>
          </div>
        </div>

        <div className="bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] rounded-3xl p-6 mb-8">
          <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-4">Project Details</h3>
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-[var(--text-secondary)]">Project Name</span>
            <span className="text-sm font-bold text-[var(--text-primary)]">{collab.title}</span>
          </div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-[var(--text-secondary)]">Creative</span>
            <span className="text-sm font-bold text-[var(--text-primary)]">{proposal.user?.username}</span>
          </div>
          <div className="h-px bg-[var(--border-primary)] w-full my-4" />
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-[var(--text-secondary)]">Total Budget</span>
            <span className="text-xl font-black text-[#7B5CFA]">{proposal.bidAmount || collab.budget}</span>
          </div>
        </div>

        <button 
          onClick={handleDeposit}
          disabled={processing}
          className="w-full bg-[#34D399] hover:bg-[#10B981] text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-[#34D399]/20 transition-colors flex items-center justify-center gap-2"
        >
          {processing ? <Loader2 size={20} className="animate-spin" /> : <CreditCard size={20} />}
          {processing ? 'Processing...' : 'Deposit Funds'}
        </button>

        <p className="text-center text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mt-6 flex items-center justify-center gap-2">
          <CheckCircle size={14} className="text-[#34D399]" /> 100% Payment Protection Guarantee
        </p>
      </div>
    </div>
  );
};

export default EscrowCheckout;
