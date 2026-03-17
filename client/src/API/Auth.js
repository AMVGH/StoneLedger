import { create } from 'zustand';
import api from './api';

const useAuthAPI = create((set) => ({
  token: null,
  user: null,
  loading: false,
  error: null,
  // baseURL handled by shared api instance


  // send a registration/request-access submission
  requestAccess: async (registrationData) => {
    set({ loading: true, error: null });
    try {
      await api.post('/auth/request-access', registrationData);
      set({ loading: false });
      return true;
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Registration failed';
      console.error('Registration error:', msg);
      set({ error: msg, loading: false });
      throw error;
    }
  },

  // login and store JWT token
  login: async ({ username, password }) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/auth/login', { username, password });
      const token = response.data.data;
      // decode user info if necessary or store token only
      localStorage.setItem('authToken', token);
      set({ token, loading: false });
      return token;
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Login failed';
      console.error('Login error:', msg);
      set({ error: msg, loading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('authToken');
    set({ token: null, user: null });
  },

  clearError: () => set({ error: null })
}));

export default useAuthAPI;
