import api from './api';

// Get total number of journal pages
export const getTotalJournalPages = async () => {
	const response = await api.get('/general-journal/get-total-pages');
	return response.data;
};

// Get transactions for a specific page
export const getTransactionsForPage = async (pageNumber) => {
	const response = await api.get(`/general-journal/get-transactions-for-page/${pageNumber}`);
	return response.data;
};

// Get the page reference for a specific transaction
export const getTransactionPage = async (transactionId) => {
	const response = await api.get(`/general-journal/get-page-reference/${transactionId}`);
	return response.data;
};
