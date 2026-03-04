import { create } from 'zustand';
import api from './api';

// Context for password operations (update, admin reset, etc.)
const usePasswordContext = create((set) => ({
  loading: false,
  error: null,
      // baseURL handled by shared api instance


  // Update a user's password
  updatePassword: async (id, newPassword, token = null) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post(
        '/passwords/update-password',
        { id, updatedPassword: newPassword },
        {
          headers: token ? { Authorization: token } : {},
        }
      );
      set({ loading: false });
      return response.data.data;
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || error.message || 'Failed to update password';
      console.error('Error updating password:', errorMsg);
      set({ error: errorMsg, loading: false });
      throw error;
    }
  },

  // Clear stored error
  clearError: () => set({ error: null }),
}));

export default usePasswordContext;
