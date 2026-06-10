import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Minus, Maximize2, Send, Smile } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import useChatStore from '../../store/useChatStore';
import { useLocation } from 'react-router-dom';

const FloatingChatWidget = () => {
  const { user, token } = useAuthStore();
  const { activeConversation, messages, sendMessage, setActiveConversation } = useChatStore();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [msgInput, setMsgInput] = useState('');

  // Don't show if we are already on the full messages page
  if (location.pathname === '/messages') return null;
  if (!activeConversation) return null;

  const handleSend = (e) => {
    e.preventDefault();
    if (!msgInput.trim()) return;
    sendMessage(token, msgInput.trim());
    setMsgInput('');
  };

  const partner = activeConversation?.participants?.find(p => p.userId !== user?.id)?.user;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="w-80 h-[450px] bg-surface border border-divider rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-3 bg-primary text-[var(--text-primary)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src={partner?.profileImage || 'https://via.placeholder.com/150'} className="w-8 h-8 rounded-full border border-white/20" />
                <p className="text-xs font-bold truncate">{partner?.username}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded"><Minus size={14} /></button>
                <button onClick={() => setActiveConversation(null)} className="p-1 hover:bg-white/10 rounded"><X size={14} /></button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 no-scrollbar bg-background/50">
              {messages.map((msg) => {
                const isMine = msg.senderId === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-2 rounded-xl text-xs ${
                      isMine ? 'bg-primary text-[var(--text-primary)] rounded-tr-none' : 'bg-white border border-divider text-textMain rounded-tl-none shadow-sm'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-divider bg-surface">
              <form onSubmit={handleSend} className="flex items-center gap-2">
                <input 
                  value={msgInput}
                  onChange={(e) => setMsgInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-background border border-divider rounded-full py-1.5 px-3 text-xs outline-none focus:border-primary font-medium"
                />
                <button type="submit" disabled={!msgInput.trim()} className="text-primary hover:scale-110 transition disabled:opacity-50">
                  <Send size={18} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-primary text-[var(--text-primary)] rounded-full shadow-xl flex items-center justify-center relative group"
      >
        <MessageSquare size={24} />
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-surface">
           2
        </span>
      </motion.button>
    </div>
  );
};

export default FloatingChatWidget;
