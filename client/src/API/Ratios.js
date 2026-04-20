import api from './api';

export const getFinancialRatios = async () => {
    try {
        const response = await api.get('/ratios/gather-finance-ratios');
        return response;
    } catch (error) {
        console.error('Error fetching financial ratios:', error);
        throw error;
    }
};
