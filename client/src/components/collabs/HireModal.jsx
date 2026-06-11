import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, ArrowRight, ShieldCheck, CreditCard, Layout } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';

const HireModal = ({ collab, proposal, isOpen, onClose }) => {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);

  if (!isOpen || !proposal) return null;

  const handleHireWithoutCircle = async () => {
    // Escrow deposit checkout for simple Collab
    try {
      setLoading(true);
      // We accept the proposal first
      await axios.patch(`/api/collabs/proposals/${proposal.id}/status`, { status: 'ACCEPTED' }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Redirect to a simple checkout page to fund the total budget
      navigate(`/escrow/checkout/collab/${collab.id}?proposalId=${proposal.id}`);
    } catch (err) {
      console.error(err);
      alert('Failed to process hire');
    } finally {
      setLoading(false);
    }
  };

  const handleHireWithCircle = async () => {
    // Create Circle from Collab logic
    try {
      setLoading(true);
      // Accept proposal
      await axios.patch(`/api/collabs/proposals/${proposal.id}/status`, { status: 'ACCEPTED' }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Backend route to convert Collab to Circle
      const res = await axios.post(`/api/collabs/${collab.id}/convertToCircle`, { proposalId: proposal.id }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Redirect to the newly created Circle workspace where they can create milestones
      navigate(`/circles/${res.data.circle.id}`);
    } catch (err) {
      console.error(err);
      alert('Failed to generate Circle workspace');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="relative w-full max-w-xl bg-[var(--bg-base)] border border-[var(--border-primary)] rounded-[2rem] shadow-2xl overflow-hidden"
        >
          <div className="p-6 md:p-8 relative z-10">
            <button onClick={onClose} className="absolute top-6 right-6 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors bg-[var(--bg-surface)] p-2 rounded-full">
              <X size={20} />
            </button>

            <div className="w-16 h-16 bg-[#34D399]/10 rounded-3xl flex items-center justify-center text-[#34D399] mb-6">
              <CheckCircle size={32} />
            </div>

            <h2 className="text-3xl font-black text-[var(--text-primary)] mb-2 tracking-tight">Hire {proposal.user?.username}</h2>
            <p className="text-[var(--text-secondary)] text-sm mb-8 leading-relaxed font-medium">
              You're about to hire this creative for <strong className="text-[var(--text-primary)]">{collab.title}</strong>. How would you like to manage this project and process payments?
            </p>

            <div className="space-y-4">
              {/* Option 1: Workspace */}
              <button 
                onClick={handleHireWithCircle}
                disabled={loading}
                className="w-full group text-left bg-[var(--bg-surface)] border border-[#7B5CFA]/30 hover:border-[#7B5CFA] hover:bg-[#7B5CFA]/5 p-5 md:p-6 rounded-3xl transition-all relative overflow-hidden"
              >
                <div className="flex gap-5 relative z-10">
                  <div className="w-12 h-12 bg-[#7B5CFA]/10 rounded-2xl flex items-center justify-center text-[#7B5CFA] shrink-0 group-hover:scale-110 transition-transform">
                    <Layout size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-black text-[var(--text-primary)]">Create a Workspace Circle</h3>
                      <span className="bg-[#34D399]/20 text-[#34D399] text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">Recommended</span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-3">
                      Break this project down into tasks, set up paid milestones, and chat seamlessly. Funds are only deposited when you fund a specific milestone.
                    </p>
                    <span className="text-[#7B5CFA] text-[10px] font-black uppercase tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all">
                      Continue to Workspace <ArrowRight size={12} />
                    </span>
                  </div>
                </div>
              </button>

              {/* Option 2: Simple Escrow */}
              <button 
                onClick={handleHireWithoutCircle}
                disabled={loading}
                className="w-full group text-left bg-[var(--bg-surface)] border border-[var(--border-primary)] hover:border-[#34D399] hover:bg-[#34D399]/5 p-5 md:p-6 rounded-3xl transition-all"
              >
                <div className="flex gap-5">
                  <div className="w-12 h-12 bg-[var(--bg-base)] border border-[var(--border-primary)] rounded-2xl flex items-center justify-center text-[var(--text-secondary)] shrink-0 group-hover:text-[#34D399] transition-colors">
                    <CreditCard size={24} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[var(--text-primary)] mb-1">Direct Escrow Checkout</h3>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-3">
                      Deposit the full project budget upfront. The funds are held securely until you mark the project as complete. Best for simple one-off tasks.
                    </p>
                    <span className="text-[#34D399] text-[10px] font-black uppercase tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all">
                      Proceed to Checkout <ArrowRight size={12} />
                    </span>
                  </div>
                </div>
              </button>
            </div>

            <div className="mt-8 flex items-center justify-center gap-2 text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest">
              <ShieldCheck size={14} /> Payments secured by Micollab Escrow
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default HireModal;
