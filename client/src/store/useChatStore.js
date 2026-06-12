import { create } from 'zustand';
import { io } from 'socket.io-client';
import axios from 'axios';
import useAuthStore from './useAuthStore';

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
      const activeConv = get().activeConversation;
      const currentUserId = useAuthStore.getState().user?.id;

      if (activeConv?.id === message.conversationId) {
        set((state) => ({ messages: [...state.messages, message] }));
        
        // Mark as read immediately if it's from the partner and we are in the active chat
        if (message.senderId !== currentUserId) {
          axios.patch(`/api/messages/read/${message.conversationId}`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(console.error);
        }
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

    socket.on('user_stopped_typing', ({ conversationId, username }) => {
      set((state) => {
        const conversationStatus = { ...state.typingStatus[conversationId] };
        if (username) {
          delete conversationStatus[username];
        }
        return {
          typingStatus: {
            ...state.typingStatus,
            [conversationId]: conversationStatus
          }
        };
      });
    });

    socket.on('messages_read', ({ conversationId, readerId }) => {
      // If active conversation is read, mark all messages we sent as read
      if (get().activeConversation?.id === conversationId) {
        set((state) => ({
          messages: state.messages.map(msg => 
            msg.senderId !== readerId ? { ...msg, isRead: true, isDelivered: true } : msg
          )
        }));
      }
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
    if (!conversation) {
      set({ activeConversation: null, messages: [] });
      return;
    }
    set({ activeConversation: conversation, messages: [], loading: true });
    try {
      // Mark as read in backend
      await axios.patch(`/api/messages/read/${conversation.id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

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

  sendMessage: async (token, content, mediaUrl = null, mediaType = null, replyToId = null) => {
    const { activeConversation } = get();
    if (!activeConversation) return;

    try {
      const res = await axios.post('/api/messages/send', {
        conversationId: activeConversation.id,
        content,
        mediaUrl,
        mediaType,
        replyToId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
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
      
      get().setActiveConversation(token, conversation);
      
      return conversation;
    } catch (err) {
      console.error('Failed to start conversation', err);
    }
  },

  blockUser: async (token, userIdToBlock) => {
    try {
      await axios.post('/api/trust/block', { userIdToBlock }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Filter out the blocked user from conversations list
      set((state) => ({
        conversations: state.conversations.filter(c => 
          !c.participants.some(p => p.userId === userIdToBlock)
        ),
        activeConversation: state.activeConversation?.participants.some(p => p.userId === userIdToBlock) 
          ? null 
          : state.activeConversation
      }));
      return true;
    } catch (err) {
      console.error('Failed to block user', err);
      return false;
    }
  },

  reportUser: async (token, reportedId, reason) => {
    try {
      await axios.post('/api/trust/report', { reportedId, reason }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return true;
    } catch (err) {
      console.error('Failed to report user', err);
      return false;
    }
  }
}));

export default useChatStore;
