import { create } from 'zustand';
import api from './api';

const useEventsLogAPI = create((set) => ({
  events: [],
  loading: false,
  error: null,
  // baseURL handled by shared api instance

  // Fetch all events
  getEvents: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/events/get-events');
      const events = response.data.data;
      set({ events, loading: false });
      return events;
    } catch (error) {
      const msg = error.response?.data?.message || error.message;
      console.error('Error fetching events:', msg);
      set({ error: msg, loading: false });
      throw error;
    }
  },

  // Clear stored error
  clearError: () => set({ error: null }),
}));

export default useEventsLogAPI;
