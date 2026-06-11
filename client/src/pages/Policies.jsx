import React from 'react';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Policies = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--bg-background)] text-[var(--text-primary)] pt-12 md:pt-24 px-4 md:px-6 pb-20">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center text-sm font-bold text-[var(--text-muted)] hover:text-primary transition mb-8"
        >
          <ArrowLeft size={16} className="mr-2" /> Back
        </button>

        <header className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-black uppercase tracking-widest text-[10px] mb-4 border border-primary/20">
            <ShieldCheck size={12} /> Official Guidelines
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">
            Usage Policies
          </h1>
          <p className="text-lg text-[var(--text-secondary)]">
            Guidelines and rules for maintaining a professional and safe environment for all creatives and posters.
          </p>
        </header>

        <div className="space-y-8">
          <section className="bg-[var(--bg-surface)] p-8 rounded-3xl border border-[var(--border-primary)] shadow-xl hover:border-primary/50 transition duration-300">
            <h2 className="text-2xl font-black mb-4">1. Respectful Conduct</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              We expect all users to interact professionally and respectfully. Harassment, hate speech, bullying, or abusive behavior towards other creatives, posters, or administrators will result in an immediate and permanent ban.
            </p>
          </section>

          <section className="bg-[var(--bg-surface)] p-8 rounded-3xl border border-[var(--border-primary)] shadow-xl hover:border-primary/50 transition duration-300">
            <h2 className="text-2xl font-black mb-4">2. Authentic Profiles & Work</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Users must provide accurate information on their profiles. Plagiarism, stealing portfolios, or misrepresenting your skills and experience is strictly prohibited. You may only claim work that you have personally created or significantly contributed to.
            </p>
          </section>

          <section className="bg-[var(--bg-surface)] p-8 rounded-3xl border border-[var(--border-primary)] shadow-xl hover:border-primary/50 transition duration-300">
            <h2 className="text-2xl font-black mb-4">3. Escrow and Payments</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              All financial transactions must occur within the platform's escrow system to guarantee protection. Attempting to circumvent the payment system to avoid fees, or defrauding the escrow system, will lead to account suspension. In the event of a dispute, administrators have the final say on fund allocation.
            </p>
          </section>

          <section className="bg-[var(--bg-surface)] p-8 rounded-3xl border border-[var(--border-primary)] shadow-xl hover:border-primary/50 transition duration-300">
            <h2 className="text-2xl font-black mb-4">4. Spam and Solicitation</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Spamming users with unsolicited links, advertising services outside the scope of open Collabs, or mass messaging users without their consent is not allowed. Keep communication relevant to the projects at hand.
            </p>
          </section>

          <section className="bg-[var(--bg-surface)] p-8 rounded-3xl border border-[var(--border-primary)] shadow-xl border-red-500/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <ShieldCheck size={120} />
            </div>
            <h2 className="text-2xl font-black mb-4 text-red-500 relative z-10">Enforcement & Bans</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed relative z-10">
              Administrators actively monitor the platform. Violation of any of these policies will result in appropriate action, up to and including a <strong className="text-[var(--text-primary)]">permanent ban</strong> from the platform and forfeiture of active escrow funds. Banned users lose access to their wallets, networks, and active collaborations.
            </p>
          </section>
        </div>

        <footer className="mt-16 text-center text-[var(--text-muted)] text-sm font-bold uppercase tracking-widest">
          Last Updated: June 2026
        </footer>
      </div>
    </div>
  );
};

export default Policies;
