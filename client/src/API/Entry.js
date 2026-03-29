import api from './api';

// Get approved transaction entries for a specific account
export const getApprovedTransactionEntriesForLedger = async (accountId) => {
	const response = await api.get(`/transaction-entries/get-approved-transaction-entries/${accountId}`);
	return response.data;
};
