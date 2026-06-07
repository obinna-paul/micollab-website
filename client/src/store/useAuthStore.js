import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email, password) => {
        try {
          const res = await axios.post('/api/auth/login', { email, password });
          const { user, token } = res.data;
          
          set({ user, token, isAuthenticated: true });
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          return { success: true };
        } catch (error) {
          return { 
            success: false, 
            error: error.response?.data?.error || 'Login failed' 
          };
        }
      },

      loginWithGoogle: async (credential, username = null) => {
        try {
          const res = await axios.post('/api/auth/google', { credential, username });
          
          if (res.status === 202) {
            return { requireUsername: true, suggestedName: res.data.suggestedName };
          }

          const { user, token } = res.data;
          set({ user, token, isAuthenticated: true });
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          return { success: true };
        } catch (error) {
          return {
            success: false,
            error: error.response?.data?.error || 'Google login failed'
          };
        }
      },

      register: async (userData) => {
        try {
          const res = await axios.post('/api/auth/register', userData);
          const { user, token } = res.data;
          
          set({ user, token, isAuthenticated: true });
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          return { success: true };
        } catch (error) {
          return { 
            success: false, 
            error: error.response?.data?.error || 'Registration failed' 
          };
        }
      },

      checkAvailability: async (username, email) => {
        try {
          const res = await axios.post('/api/auth/check-availability', { username, email });
          return { success: true, available: res.data.available };
        } catch (error) {
          return {
            success: false,
            error: error.response?.data?.error || 'Failed to check availability'
          };
        }
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        delete axios.defaults.headers.common['Authorization'];
      },

      updateProfile: async (profileData) => {
        try {
          const res = await axios.put('/api/users/profile', profileData);
          set({ user: { ...get().user, ...res.data } });
          return { success: true };
        } catch (error) {
          return { success: false, error: 'Failed to update profile' };
        }
      },

      initAuth: async () => {
        const { token } = get();
        if (token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          try {
            // Verify session with server
            const res = await axios.get('/api/auth/me');
            if (res.data) {
              set({ user: res.data, isAuthenticated: true });
            } else {
              get().logout();
            }
          } catch (error) {
            get().logout();
          }
        }
      }
    }),
    {
      name: 'micollab-auth'
    }
  )
);

export default useAuthStore;
