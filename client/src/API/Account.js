import { create } from 'zustand';
import api from './api';

const useAccountAPI = create((set) => ({
  systemFinancialAccounts: [],
  loading: false,
  error: null,
  // baseURL handled by shared api instance

  // Fetch all financial accounts
  getFinancialAccounts: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/financial-accounts/get-accounts');
      const systemFinancialAccounts = response.data.data;
      set({ systemFinancialAccounts, loading: false });
      return systemFinancialAccounts;
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Failed to fetch accounts';
      console.error('Error fetching accounts:', msg);
      set({ error: msg, loading: false });
      throw error;
    }
  },

  // Create a new financial account
  createNewFinancialAccount: async (request) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/financial-accounts/create-account', request);
      const creationSuccess = response.data.data;
      set({ loading: false });
      return creationSuccess;
    } catch (error) {
      const msg = error.response?.data?.message || error.message;
      console.error('Error creating account:', msg);
      set({ error: msg, loading: false });
      throw error;
    }
  },

  // Generate an account number
  generateAccountNumber: async (request) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/financial-accounts/generate-account-number', request);
      const accountNumber = response.data.data;
      set({ loading: false });
      return accountNumber;
    } catch (error) {
      const msg = error.response?.data?.message || error.message;
      console.error('Error generating account number:', msg);
      set({ error: msg, loading: false });
      throw error;
    }
  },

  // Clear stored error
  clearError: () => set({ error: null }),
}));

export default useAccountAPI;
