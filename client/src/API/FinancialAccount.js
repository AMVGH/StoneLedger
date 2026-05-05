// src/API/FinancialAccounts.js
import api from './api';

export const getFinancialAccounts = async () => {
  try {
    const response = await api.get('/financial-accounts/get-financial-accounts');
    return response.data;
  } catch (error) {
    console.error('Error fetching financial accounts:', error);
    throw error;
  }
};