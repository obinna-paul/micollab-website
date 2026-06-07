import React, { useState } from 'react';
import axios from 'axios';
import { Image, Video, FileText, Send, Loader2, Link as LinkIcon, Calendar, Briefcase, ChevronRight, Clock, MapPin, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

const CreatePost = ({ onPostCreated, mobile }) => {
  const [caption, setCaption] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [activeTab, setActiveTab] = useState('UPDATE');
  const [loading, setLoading] = useState(false);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  
  // Event Specific State
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [inviteTarget, setInviteTarget] = useState('NONE');

  const { user, token } = useAuthStore();
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    processFiles(files);
  };

  const processFiles = (files) => {
    const validFiles = files.filter(file => file.type.startsWith('image/') || file.type.startsWith('video/'));
    if (validFiles.length > 0) {
      setMediaFiles(prev => [...prev, ...validFiles]);
      const urls = validFiles.map(file => URL.createObjectURL(file));
      setPreviewUrls(prev => [...prev, ...urls]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const removeFile = (index) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!caption.trim() && mediaFiles.length === 0 && activeTab !== 'EVENT') return;

    setLoading(true);
    try {
      let finalMediaUrl = '';

      if (mediaFiles.length > 0) {
        const formData = new FormData();
        mediaFiles.forEach(file => formData.append('media', file));
        
        const uploadRes = await axios.post('/api/upload', formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        
        finalMediaUrl = uploadRes.data.urls.join(',');
      }

      const payload = {
        caption,
        mediaUrl: finalMediaUrl,
        contentType: mediaFiles.length > 0 || (activeTab === 'EVENT' && finalMediaUrl) ? 'IMAGE' : 'TEXT',
        postCategory: activeTab
      };

      if (activeTab === 'EVENT') {
        payload.eventDate = eventDate;
        payload.eventTime = eventTime;
        payload.eventLocation = eventLocation;
        payload.inviteTarget = inviteTarget;
      }

      const res = await axios.post('/api/posts', payload, {
         headers: { Authorization: `Bearer ${token}` }
      });
      
      onPostCreated(res.data);
      setCaption('');
      setMediaFiles([]);
      setPreviewUrls([]);
      setEventDate('');
      setEventTime('');
      setEventLocation('');
      setInviteTarget('NONE');
      setActiveTab('UPDATE');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <div className="bg-[var(--bg-surface-alt)] rounded-2xl border border-[var(--border-primary)] mb-8 overflow-hidden">
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-4">
          <img 
            src={user?.profileImage || `https://ui-avatars.com/api/?name=${user?.username}&background=7B5CFA&color=fff`} 
            className="w-10 h-10 rounded-full border border-[var(--border-primary)] object-cover" 
            alt="" 
          />
          <h3 className="font-bold text-[var(--text-primary)] tracking-tight">Share something cool</h3>
        </div>

        <form onSubmit={handleSubmit}>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder={
              activeTab === 'UPDATE' ? "Share a brief, concept, or current project..." :
              activeTab === 'EVENT' ? "Describe your event... (Agenda, Speakers, Requirements)" :
              "Drop a caption for your media..."
            }
            className="w-full bg-transparent resize-none outline-none text-[var(--text-primary)] placeholder-[#8B95A5] min-h-[60px]"
          />

          {activeTab === 'MEDIA' && (
            <div className="mb-4">
              <label 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                  isDragging 
                    ? 'border-[#7B5CFA] bg-[#7B5CFA]/10' 
                    : 'border-[var(--border-secondary)] hover:border-[#7B5CFA]/50 bg-[var(--bg-base)]'
                }`}
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6 pointer-events-none">
                  <Image className={`w-8 h-8 mb-3 ${isDragging ? 'text-[#7B5CFA]' : 'text-[var(--text-secondary)]'}`} />
                  <p className={`mb-2 text-sm ${isDragging ? 'text-[#7B5CFA]' : 'text-[var(--text-secondary)]'}`}>
                    <span className="font-bold text-[#7B5CFA]">
                      {mobile ? 'Upload Media' : "Drop it like it's hot!"}
                    </span>
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] text-center px-4">
                    {mobile ? 'Tap to select photos or videos' : 'Or click to select Images/Videos'}
                  </p>
                </div>
                <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
              </label>
            </div>
          )}

          {activeTab === 'EVENT' && (
             <div className="mb-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 bg-[var(--bg-base)] border border-[var(--border-primary)] rounded-xl px-3 py-2">
                    <Calendar size={16} className="text-[var(--text-secondary)]" />
                    <input 
                      type="date" 
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="bg-transparent border-none outline-none text-sm w-full text-[var(--text-primary)]"
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                  <div className="flex items-center gap-2 bg-[var(--bg-base)] border border-[var(--border-primary)] rounded-xl px-3 py-2">
                    <Clock size={16} className="text-[var(--text-secondary)]" />
                    <input 
                      type="time" 
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      className="bg-transparent border-none outline-none text-sm w-full text-[var(--text-primary)]"
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-[var(--bg-base)] border border-[var(--border-primary)] rounded-xl px-3 py-2">
                  <MapPin size={16} className="text-[var(--text-secondary)]" />
                  <input 
                    type="text" 
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    placeholder="Event Location (e.g. Lagos, Zoom, etc.)"
                    className="bg-transparent border-none outline-none text-sm w-full text-[var(--text-primary)] placeholder-[#8B95A5]"
                  />
                </div>

                <div className="flex items-center gap-2 bg-[var(--bg-base)] border border-[var(--border-primary)] rounded-xl px-3 py-2 cursor-pointer hover:border-[#7B5CFA]/50 relative">
                  <Image size={16} className="text-[var(--text-secondary)]" />
                  <span className="text-sm text-[var(--text-secondary)]">{mediaFiles.length > 0 ? `${mediaFiles.length} file(s) selected` : 'Upload Event Flyer Image/Video (Optional)'}</span>
                  <input 
                    type="file" 
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>

                <div className="flex items-center gap-2 bg-[var(--bg-base)] border border-[var(--border-primary)] rounded-xl px-3 py-2">
                  <Users size={16} className="text-[var(--text-secondary)]" />
                  <select 
                    value={inviteTarget}
                    onChange={(e) => setInviteTarget(e.target.value)}
                    className="bg-transparent border-none outline-none text-sm w-full text-[var(--text-primary)] font-medium"
                  >
                    <option value="NONE" className="bg-[var(--bg-surface-alt)]">No Special Invitations</option>
                    <option value="ALL_NETWORK" className="bg-[var(--bg-surface-alt)]">Invite Entire Network</option>
                    <option value="SELECTED" className="bg-[var(--bg-surface-alt)]">Invite Select Connections</option>
                  </select>
                </div>
                
                {inviteTarget === 'SELECTED' && (
                  <div className="p-3 bg-[#7B5CFA]/10 border border-[#7B5CFA]/20 rounded-xl text-xs text-[#7B5CFA] font-bold">
                    * Selective invitations feature will prompt you to select connections after posting.
                  </div>
                )}
             </div>
          )}

          {/* PREVIEWS */}
          {previewUrls.length > 0 && (
            <div className="mb-4 flex gap-2 overflow-x-auto pb-2 snap-x ml-1">
              {previewUrls.map((url, idx) => (
                <div key={idx} className="relative flex-shrink-0 snap-start">
                  {mediaFiles[idx]?.type.startsWith('video/') ? (
                    <video src={url} className="w-24 h-24 object-cover rounded-xl border border-[var(--border-primary)]" muted />
                  ) : (
                    <img src={url} className="w-24 h-24 object-cover rounded-xl border border-[var(--border-primary)]" alt="Preview" />
                  )}
                  <button 
                    type="button" 
                    onClick={() => removeFile(idx)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-md hover:bg-red-600 text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 border-t border-[var(--border-primary)] gap-4">
            <div className="flex gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setActiveTab('UPDATE')}
                className={`p-2 rounded-full transition-colors flex items-center gap-2 px-4 text-xs font-bold whitespace-nowrap ${
                  activeTab === 'UPDATE' 
                    ? 'bg-[#7B5CFA]/10 text-[#7B5CFA]' 
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'
                }`}
              >
                <FileText size={16} /> <span>Update</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('MEDIA')}
                className={`p-2 rounded-full transition-colors flex items-center gap-2 px-4 text-xs font-bold whitespace-nowrap ${
                  activeTab === 'MEDIA' 
                    ? 'bg-[#7B5CFA]/10 text-[#7B5CFA]' 
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'
                }`}
              >
                <Image size={16} /> <span>Media</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('EVENT')}
                className={`p-2 rounded-full transition-colors flex items-center gap-2 px-4 text-xs font-bold whitespace-nowrap ${
                  activeTab === 'EVENT' 
                    ? 'bg-[#7B5CFA]/10 text-[#7B5CFA]' 
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'
                }`}
              >
                <Calendar size={16} /> <span>Event</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || (!caption.trim() && mediaFiles.length === 0 && activeTab !== 'EVENT')}
              className="bg-[#7B5CFA] hover:bg-[#684CE0] text-white text-xs font-bold py-2.5 px-6 rounded-full flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(123,92,250,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : <><Send size={16} /> Post</>}
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
};

export default CreatePost;
