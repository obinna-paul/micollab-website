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
          
          return { success: true, user };
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
          
          return { success: true, user };
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
          if (res.status === 202) {
            return { requiresOTP: true, success: true };
          }
          // Fallback if backend still returns 201 somehow
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

      verifyOTP: async (email, otp) => {
        try {
          const res = await axios.post('/api/auth/verify-otp', { email, otp });
          const { user, token } = res.data;
          
          set({ user, token, isAuthenticated: true });
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          return { success: true };
        } catch (error) {
          return {
            success: false,
            error: error.response?.data?.error || 'Verification failed'
          };
        }
      },

      resendOTP: async (email) => {
        try {
          const res = await axios.post('/api/auth/resend-otp', { email });
          return { success: true, message: res.data.message };
        } catch (error) {
          return {
            success: false,
            error: error.response?.data?.error || 'Failed to resend code'
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
            error: error.response?.data?.error || 'Failed to check availability',
            field: error.response?.data?.field || null,
            suggestions: error.response?.data?.suggestions || []
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
      },

      forgotPassword: async (email) => {
        try {
          const res = await axios.post('/api/auth/forgot-password', { email });
          return { success: true, message: res.data.message };
        } catch (error) {
          return { success: false, error: error.response?.data?.error || 'Failed to send reset link' };
        }
      },

      resetPassword: async (token, newPassword) => {
        try {
          const res = await axios.post('/api/auth/reset-password', { token, newPassword });
          return { success: true, message: res.data.message };
        } catch (error) {
          return { success: false, error: error.response?.data?.error || 'Failed to reset password' };
        }
      },

      changePassword: async (currentPassword, newPassword) => {
        try {
          const res = await axios.put('/api/users/settings/password', { currentPassword, newPassword });
          return { success: true, message: res.data.message };
        } catch (error) {
          return { success: false, error: error.response?.data?.error || 'Failed to change password' };
        }
      },

      updateEmail: async (newEmail) => {
        try {
          const res = await axios.put('/api/users/settings/email', { newEmail });
          set({ user: { ...get().user, email: res.data.email } });
          return { success: true };
        } catch (error) {
          return { success: false, error: error.response?.data?.error || 'Failed to update email' };
        }
      },

      updatePreferences: async (preferencesData) => {
        try {
          const res = await axios.put('/api/users/settings/preferences', preferencesData);
          set({ user: { ...get().user, ...res.data.preferences } });
          return { success: true };
        } catch (error) {
          return { success: false, error: error.response?.data?.error || 'Failed to update preferences' };
        }
      },

      deleteAccount: async () => {
        try {
          await axios.delete('/api/users/settings/account');
          get().logout();
          return { success: true };
        } catch (error) {
          return { success: false, error: error.response?.data?.error || 'Failed to delete account' };
        }
      }
    }),
    {
      name: 'micollab-auth'
    }
  )
);

export default useAuthStore;
