import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Download, Lock, FileText, ShieldAlert, Image as ImageIcon, Video, Music } from 'lucide-react';

const PublicSharePage = () => {
  const { linkId } = useParams();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fileDetails, setFileDetails] = useState(null);
  const [promptPassword, setPromptPassword] = useState(false);

  const fetchFileDetails = async (passcodeVal = '') => {
    setLoading(true);
    setError('');
    try {
      // POST to link resolver route
      const res = await axios.post(`/api/public/share/${linkId}`, {
        password: passcodeVal
      });

      if (res.data.passwordProtected) {
        setPromptPassword(true);
        setFileDetails(res.data);
      } else {
        setPromptPassword(false);
        setFileDetails(res.data);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to access public share link');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (linkId) {
      fetchFileDetails();
    }
  }, [linkId]);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (!password.trim()) return;
    fetchFileDetails(password);
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-[var(--text-primary)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading Secure File Gateway...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-slate-950 border border-slate-800 p-8 rounded-3xl text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-center justify-center mx-auto">
            <ShieldAlert size={28} />
          </div>
          <div>
            <h2 className="text-[var(--text-primary)] font-black text-lg uppercase tracking-wider">Access Restrained</h2>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed">{error}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-slate-800 hover:bg-slate-700 text-[var(--text-primary)] py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // Password Prompt Interface
  if (promptPassword) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-slate-950 border border-slate-800 p-8 rounded-3xl space-y-6 shadow-2xl">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock size={20} />
            </div>
            <h2 className="text-[var(--text-primary)] font-black text-lg uppercase tracking-wider">Passcode Protected</h2>
            <p className="text-slate-400 text-xs">This creative deliverable requires a passcode to preview and download.</p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Enter passcode</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Type password..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-[var(--text-primary)] text-xs font-bold outline-none focus:border-indigo-500 transition"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-[var(--text-primary)] py-3 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg transition"
            >
              Verify Passcode
            </button>
          </form>
        </div>
      </div>
    );
  }

  const isImg = fileDetails?.type.startsWith('image/');
  const isVid = fileDetails?.type.startsWith('video/');
  const isAud = fileDetails?.type.startsWith('audio/');

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-between text-[var(--text-primary)] font-sans">
      {/* Brand Header */}
      <header className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-[10px] text-[var(--text-primary)] uppercase">
            M
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Micollab Deliverable Gateway</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-12 flex flex-col items-center justify-center gap-8">
        
        {/* Preview Area */}
        <div className="w-full bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden aspect-video shadow-2xl flex items-center justify-center p-4">
          {isImg ? (
            <img src={fileDetails.fileUrl} alt={fileDetails.name} className="max-w-full max-h-full object-contain rounded-xl" />
          ) : isVid ? (
            <video src={fileDetails.fileUrl} controls className="w-full h-full object-contain rounded-xl" />
          ) : isAud ? (
            <div className="flex flex-col items-center gap-4 text-center max-w-md w-full">
              <Music size={48} className="text-indigo-500 animate-pulse" />
              <audio src={fileDetails.fileUrl} controls className="w-full" />
            </div>
          ) : (
            <div className="text-center p-8 space-y-4">
              <FileText size={64} className="text-slate-800 mx-auto" />
              <div>
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Preview Not Available Inline</p>
                <p className="text-[10px] text-slate-500 mt-1">Download below to inspect asset locally.</p>
              </div>
            </div>
          )}
        </div>

        {/* Deliverable Metadata Card */}
        <div className="w-full max-w-2xl bg-slate-950/60 border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 flex items-center justify-center flex-shrink-0">
              <FileText size={24} />
            </div>
            <div>
              <h3 className="font-black text-[var(--text-primary)] text-base leading-tight break-all max-w-sm">{fileDetails.name}</h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1.5 font-bold">
                Size: {formatSize(fileDetails.size)} • Type: {fileDetails.type}
              </p>
            </div>
          </div>

          {fileDetails.role === 'DOWNLOAD' ? (
            <a
              href={fileDetails.fileUrl}
              download={fileDetails.name}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-[var(--text-primary)] font-black text-xs uppercase tracking-widest px-6 py-3.5 rounded-2xl shadow-lg shadow-indigo-600/20 transition-all w-full md:w-auto justify-center"
            >
              <Download size={14} /> Download File
            </a>
          ) : (
            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 px-4 py-2.5 rounded-xl text-center w-full md:w-auto">
              View Only Permitted
            </span>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center border-t border-slate-800 bg-slate-950/20">
        <p className="text-[9px] font-black uppercase tracking-wider text-slate-600">
          Powered by Micollab Workspace Solutions. All file links are encrypted, tracked, and revocable.
        </p>
      </footer>
    </div>
  );
};

export default PublicSharePage;
