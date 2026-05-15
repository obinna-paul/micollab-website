import React, { useState } from 'react';
import axios from 'axios';
import { Image, Video, FileText, Send, Loader2, Link as LinkIcon, Calendar, Briefcase, ChevronRight, Clock, MapPin, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

const CreatePost = ({ onPostCreated }) => {
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
        
        const uploadRes = await axios.post('http://localhost:5000/api/upload', formData, {
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

      const res = await axios.post('http://localhost:5000/api/posts', payload, {
         headers: { Authorization: `Bearer ${token}` }
      });
      
      onPostCreated(res.data);
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
      <div className="card mb-6 overflow-hidden">

      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <img 
            src={user?.profileImage || `https://ui-avatars.com/api/?name=${user?.username}`} 
            className="w-10 h-10 rounded-full border border-divider object-cover" 
            alt="" 
          />
          <h3 className="font-bold text-textMain">Share something cool</h3>
        </div>

        <form onSubmit={handleSubmit}>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder={
              activeTab === 'UPDATE' ? "What's new in your creative journey?" :
              activeTab === 'EVENT' ? "Describe your event... (Agenda, Speakers, Requirements)" :
              "Drop a caption for your media..."
            }
            className="w-full bg-transparent resize-none outline-none text-textMain placeholder:text-textMuted/60 min-h-[80px]"
          />

          {activeTab === 'MEDIA' && (
            <div className="mb-4">
              <label 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                  isDragging 
                    ? 'border-primary bg-primary/10' 
                    : 'border-divider hover:border-primary/50 bg-background'
                }`}
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6 pointer-events-none">
                  <Image className={`w-8 h-8 mb-3 ${isDragging ? 'text-primary' : 'text-textMuted'}`} />
                  <p className={`mb-2 text-sm ${isDragging ? 'text-primary' : 'text-textMuted'}`}>
                    <span className="font-bold text-primary">Drop it like it's hot!</span>
                  </p>
                  <p className="text-xs text-textMuted text-center px-4">Or click to select Images/Videos</p>
                </div>
                <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
              </label>
            </div>
          )}

          {activeTab === 'EVENT' && (
             <div className="mb-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 bg-background border border-divider rounded-xl px-3 py-2">
                    <Calendar size={16} className="text-textMuted" />
                    <input 
                      type="date" 
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="bg-transparent border-none outline-none text-sm w-full text-textMain"
                    />
                  </div>
                  <div className="flex items-center gap-2 bg-background border border-divider rounded-xl px-3 py-2">
                    <Clock size={16} className="text-textMuted" />
                    <input 
                      type="time" 
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      className="bg-transparent border-none outline-none text-sm w-full text-textMain"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-background border border-divider rounded-xl px-3 py-2">
                  <MapPin size={16} className="text-textMuted" />
                  <input 
                    type="text" 
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    placeholder="Event Location (e.g. Lagos, Zoom, etc.)"
                    className="bg-transparent border-none outline-none text-sm w-full text-textMain"
                  />
                </div>

                <div className="flex items-center gap-2 bg-background border border-divider rounded-xl px-3 py-2 cursor-pointer hover:border-primary/50 relative">
                  <Image size={16} className="text-textMuted" />
                  <span className="text-sm text-textMuted">{mediaFiles.length > 0 ? `${mediaFiles.length} file(s) selected` : 'Upload Event Flyer Image/Video (Optional)'}</span>
                  <input 
                    type="file" 
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>

                <div className="flex items-center gap-2 bg-background border border-divider rounded-xl px-3 py-2">
                  <Users size={16} className="text-textMuted" />
                  <select 
                    value={inviteTarget}
                    onChange={(e) => setInviteTarget(e.target.value)}
                    className="bg-transparent border-none outline-none text-sm w-full text-textMain font-medium"
                  >
                    <option value="NONE">No Special Invitations</option>
                    <option value="ALL_NETWORK">Invite Entire Network</option>
                    <option value="SELECTED">Invite Select Connections</option>
                  </select>
                </div>
                
                {inviteTarget === 'SELECTED' && (
                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl text-xs text-primary font-bold">
                    * Selective invitations feature will prompt you to select connections after posting.
                  </div>
                )}
             </div>
          )}

          {/* PREVIEWS */}
          {previewUrls.length > 0 && (
            <div className="mb-4 flex gap-2 overflow-x-auto pb-2 snap-x">
              {previewUrls.map((url, idx) => (
                <div key={idx} className="relative flex-shrink-0 snap-start">
                  {mediaFiles[idx]?.type.startsWith('video/') ? (
                    <video src={url} className="w-32 h-32 object-cover rounded-xl border border-divider" muted />
                  ) : (
                    <img src={url} className="w-32 h-32 object-cover rounded-xl border border-divider" alt="Preview" />
                  )}
                  <button 
                    type="button" 
                    onClick={() => removeFile(idx)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-md hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-divider">
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveTab('UPDATE')}
                className={`p-2 rounded-full transition-colors flex items-center gap-2 px-4 text-xs font-bold whitespace-nowrap ${activeTab === 'UPDATE' ? 'bg-primary/10 text-primary' : 'text-textMuted hover:bg-gray-100'}`}
              >
                <FileText size={18} /> <span className="hidden sm:inline">Update</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('MEDIA')}
                className={`p-2 rounded-full transition-colors flex items-center gap-2 px-4 text-xs font-bold whitespace-nowrap ${activeTab === 'MEDIA' ? 'bg-primary/10 text-primary' : 'text-textMuted hover:bg-gray-100'}`}
              >
                <Image size={18} /> <span className="hidden sm:inline">Media</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('EVENT')}
                className={`p-2 rounded-full transition-colors flex items-center gap-2 px-4 text-xs font-bold whitespace-nowrap ${activeTab === 'EVENT' ? 'bg-primary/10 text-primary' : 'text-textMuted hover:bg-gray-100'}`}
              >
                <Calendar size={18} /> <span className="hidden sm:inline">Event</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || (!caption.trim() && mediaFiles.length === 0 && activeTab !== 'EVENT')}
              className="btn-primary py-2 px-6 flex items-center gap-2 shadow-lg shadow-primary/20"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <><Send size={18} /> Post</>}
            </button>
          </div>
        </form>
        </div>
      </div>
    </>
  );
};

export default CreatePost;
