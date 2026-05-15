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
          const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
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

      register: async (userData) => {
        try {
          const res = await axios.post('http://localhost:5000/api/auth/register', userData);
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

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        delete axios.defaults.headers.common['Authorization'];
      },

      updateProfile: async (profileData) => {
        try {
          const res = await axios.put('http://localhost:5000/api/users/profile', profileData);
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
            const res = await axios.get('http://localhost:5000/api/auth/me');
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
