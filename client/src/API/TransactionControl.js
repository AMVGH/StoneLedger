import api from './api';
import { create } from 'zustand';

const useTransactionContext = create((set) => ({

  createNewTransaction: async (transaction, file = null) => {
    set({ loading: true, error: null });
    try {
      const formData = new FormData();
      formData.append(
        'transaction',
        new Blob([JSON.stringify(transaction)], { type: 'application/json' })
      );
      if (file) {
        formData.append('attachment', file);
      }
      const response = await api.post(
        '/transactions/create-journal-transaction',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      set({ loading: false });
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to create journal transaction';
      set({ error: errorMsg, loading: false });
      throw error;
    }
  },

  loading: false,
  error: null,

  getPendingEntries: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/transactions/get-pending-entries');
      set({ loading: false });
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to fetch pending entries';
      set({ error: errorMsg, loading: false });
      throw error;
    }
  },

  approveTransaction: async (txnId, comment, userId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post(`/transactions/approve-transaction`, {
        transactionId: txnId,
        statusUpdateReason: comment,
        userId: userId
      });
      set({ loading: false });
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to approve transaction';
      set({ error: errorMsg, loading: false });
      throw error;
    }
  },

  rejectTransaction: async (txnId, comment, userId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post(`/transactions/reject-transaction`, {
        transactionId: txnId,
        statusUpdateReason: comment,
        userId: userId
      });
      set({ loading: false });
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to reject transaction';
      set({ error: errorMsg, loading: false });
      throw error;
    }
  },

  getApprovedEntriesForLedger: async (accountId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/transaction-entries/get-approved-transaction-entries/${accountId}`);
      set({ loading: false });
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to fetch ledger entries';
      set({ error: errorMsg, loading: false });
      throw error;
    }
  },

  getTotalPages: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/general-journal/get-total-pages');
      set({ loading: false });
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to fetch total pages';
      set({ error: errorMsg, loading: false });
      throw error;
    }
  },

  getTransactionsForPage: async (pageNumber) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/general-journal/get-transactions-for-page/${pageNumber}`);
      set({ loading: false });
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to fetch transactions for page';
      set({ error: errorMsg, loading: false });
      throw error;
    }
  },

  getPageReference: async (transactionId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/general-journal/get-page-reference/${transactionId}`);
      set({ loading: false });
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to fetch page reference';
      set({ error: errorMsg, loading: false });
      throw error;
    }
  },

  getParentTransaction: async (transactionEntryId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/transaction-entries/get-parent-transaction/${transactionEntryId}`);
      set({ loading: false });
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to fetch parent transaction';
      set({ error: errorMsg, loading: false });
      throw error;
    }
  },

  getAttachment: async (transactionId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/general-journal/get-attachment/transaction/${transactionId}`, {
        responseType: 'blob'
      });
      const url = URL.createObjectURL(response.data);
      set({ loading: false });
      return { url, filename: response.headers['content-disposition'] };
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to fetch attachment';
      set({ error: errorMsg, loading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null })
}));

export default useTransactionContext;