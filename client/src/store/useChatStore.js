import { create } from 'zustand';
import { io } from 'socket.io-client';
import axios from 'axios';

const useChatStore = create((set, get) => ({
  socket: null,
  conversations: [],
  activeConversation: null,
  messages: [],
  typingStatus: {}, // { conversationId: { username: true } }
  loading: false,

  initSocket: (token) => {
    if (get().socket) return;

    const socketUrl = import.meta.env.VITE_API_URL || '';
    const socket = io(socketUrl, {
      auth: { token }
    });

    socket.on('new_message', (message) => {
      // If message belongs to active conversation, add it
      if (get().activeConversation?.id === message.conversationId) {
        set((state) => ({ messages: [...state.messages, message] }));
      }
      
      // Update conversations list with the latest message
      set((state) => ({
        conversations: state.conversations.map(conv => 
          conv.id === message.conversationId 
            ? { ...conv, messages: [message], updatedAt: message.createdAt }
            : conv
        ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      }));
    });

    socket.on('user_typing', ({ conversationId, username }) => {
      set((state) => ({
        typingStatus: {
          ...state.typingStatus,
          [conversationId]: { ...state.typingStatus[conversationId], [username]: true }
        }
      }));
    });

    socket.on('user_stopped_typing', ({ conversationId, userId }) => {
      // This is slightly tricky as we only have userId here. 
      // For simplicity, we'll clear all for now or wait for a specific username event
    });

    set({ socket });
  },

  fetchConversations: async (token, tab = 'PRIMARY') => {
    set({ loading: true });
    try {
      const res = await axios.get(`/api/messages/conversations?tab=${tab}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ conversations: res.data });
    } catch (err) {
      console.error('Failed to fetch conversations', err);
    } finally {
      set({ loading: false });
    }
  },

  setActiveConversation: async (token, conversation) => {
    set({ activeConversation: conversation, messages: [], loading: true });
    try {
      const res = await axios.get(`/api/messages/history/${conversation.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ messages: res.data });
      
      // Join socket room
      get().socket?.emit('join_conversation', conversation.id);
    } catch (err) {
      console.error('Failed to fetch messages', err);
    } finally {
      set({ loading: false });
    }
  },

  sendMessage: async (token, content, messageType = 'TEXT') => {
    const { activeConversation } = get();
    if (!activeConversation) return;

    try {
      await axios.post('/api/messages/send', {
        conversationId: activeConversation.id,
        content,
        messageType
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Socket event 'new_message' will be received by the sender too and update the state
    } catch (err) {
      console.error('Failed to send message', err);
    }
  },

  setTyping: (isTyping) => {
    const { activeConversation, socket } = get();
    if (!activeConversation || !socket) return;

    if (isTyping) {
      socket.emit('typing_start', { conversationId: activeConversation.id });
    } else {
      socket.emit('typing_stop', { conversationId: activeConversation.id });
    }
  },

  startConversation: async (token, targetUserId) => {
    try {
      const res = await axios.post('/api/messages/conversation', {
        targetUserId,
        type: 'DIRECT'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const conversation = res.data;
      
      // Fetch from PRIMARY
      let fullRes = await axios.get('/api/messages/conversations?tab=PRIMARY', {
        headers: { Authorization: `Bearer ${token}` }
      });
      let fullConv = fullRes.data.find(c => c.id === conversation.id);
      
      // If not in PRIMARY, it might be in REQUESTS
      if (!fullConv) {
        const reqRes = await axios.get('/api/messages/conversations?tab=REQUESTS', {
          headers: { Authorization: `Bearer ${token}` }
        });
        fullConv = reqRes.data.find(c => c.id === conversation.id);
        if (fullConv) {
          // Temporarily add it to conversations array so UI works seamlessly
          set({ conversations: reqRes.data });
        }
      } else {
        set({ conversations: fullRes.data });
      }
      
      if (fullConv) {
        get().setActiveConversation(token, fullConv);
      }
      return conversation;
    } catch (err) {
      console.error('Failed to start conversation', err);
    }
  }
}));

export default useChatStore;
