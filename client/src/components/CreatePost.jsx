import React, { useState } from 'react';
import axios from 'axios';
import { Image, Video, FileText, Send, Loader2, Link as LinkIcon, Calendar, Briefcase, ChevronRight, Clock, MapPin, Users, Flame } from 'lucide-react';
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
    <div className="bg-[#181D2A] rounded-2xl border border-white/5 p-4 mb-8">
      <div className="flex gap-3 mb-4">
        <img 
          src={user?.profileImage || `https://ui-avatars.com/api/?name=${user?.username}&background=7B5CFA&color=fff`} 
          className="w-10 h-10 rounded-full object-cover border border-[#181D2A]" 
          alt="" 
        />
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Share a brief, concept, or current project..."
          className="w-full bg-transparent resize-none outline-none text-white placeholder-[#8B95A5] min-h-[40px] pt-2"
        />
      </div>

      {/* PREVIEWS */}
      {previewUrls.length > 0 && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-2 snap-x ml-13">
          {previewUrls.map((url, idx) => (
            <div key={idx} className="relative flex-shrink-0 snap-start">
              {mediaFiles[idx]?.type.startsWith('video/') ? (
                <video src={url} className="w-24 h-24 object-cover rounded-xl border border-white/5" muted />
              ) : (
                <img src={url} className="w-24 h-24 object-cover rounded-xl border border-white/5" alt="Preview" />
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

      <div className="flex items-center justify-between pt-3 border-t border-white/5 ml-13">
        <div className="flex gap-4">
          <label className="cursor-pointer group relative">
            <Image size={18} className="text-[#00B5D8] group-hover:opacity-80 transition" />
            <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
          </label>
          <label className="cursor-pointer group relative">
            <FileText size={18} className="text-[#EC4899] group-hover:opacity-80 transition" />
            <input type="file" multiple accept=".pdf,.doc,.docx" className="hidden" onChange={handleFileChange} />
          </label>
          <button type="button" className="group">
             <Flame size={18} className="text-[#FF5C00] group-hover:opacity-80 transition" />
          </button>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || (!caption.trim() && mediaFiles.length === 0)}
          className="bg-[#7B5CFA] hover:bg-[#684CE0] text-white text-xs font-bold py-2 px-5 rounded-full flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_10px_rgba(123,92,250,0.3)]"
        >
          {loading ? <Loader2 className="animate-spin" size={14} /> : (
            <>Post <Send size={14} /></>
          )}
        </button>
      </div>
    </div>
    </>
  );
};

export default CreatePost;
