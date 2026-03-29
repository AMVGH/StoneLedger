import api from './api';
import { create } from 'zustand';

const useTransactionContext = create((set) => ({

		// Create a new journal transaction
		createNewTransaction: async (transaction, file = null) => {
			set({ loading: true, error: null });
			try {
				let response;
				if (file) {
					const formData = new FormData();
					formData.append('transaction', JSON.stringify(transaction));
					formData.append('file', file);
					response = await api.post('/transactions/create-journal-transaction', formData);
				} else {
					response = await api.post('/transactions/create-journal-transaction', transaction);
				}
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


	
	approveTransaction: async (transactionStatusUpdate) => {
		set({ loading: true, error: null });
		try {
			const response = await api.post('/transactions/approve-transaction', transactionStatusUpdate);
			set({ loading: false });
			return response.data;
		} catch (error) {
			const errorMsg = error.response?.data?.message || error.message || 'Failed to approve transaction';
			set({ error: errorMsg, loading: false });
			throw error;
		}
	},

	rejectTransaction: async (transactionStatusUpdate) => {
		set({ loading: true, error: null });
		try {
			const response = await api.post('/transactions/reject-transaction', transactionStatusUpdate);
			set({ loading: false });
			return response.data;
		} catch (error) {
			const errorMsg = error.response?.data?.message || error.message || 'Failed to reject transaction';
			set({ error: errorMsg, loading: false });
			throw error;
		}
	},

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

	clearError: () => set({ error: null })
}));

export default useTransactionContext;
