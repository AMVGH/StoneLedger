// src/API/FinancialAccounts.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';

export const getFinancialAccounts = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/financial-accounts/get-financial-accounts`);
    return response.data;
  } catch (error) {
    console.error('Error fetching financial accounts:', error);
    throw error;
  }
};