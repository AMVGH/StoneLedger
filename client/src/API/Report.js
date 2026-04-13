import api from './api';

// reportType: 'UNADJUSTED' | 'ADJUSTED' | 'POST_CLOSING'
// periodEnd: ISO datetime string e.g. "2024-12-31T23:59:59"
export const getTrialBalanceContent = async (reportType, periodEnd) => {
  try {
    const response = await api.post('/reports/gather-trial-balance-content', {
      reportType,
      periodEnd,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// periodEnd: ISO datetime string
export const getIncomeStatementContent = async (periodEnd) => {
  try {
    const response = await api.post('/reports/gather-income-statement-content', {
      periodEnd,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// periodEnd: ISO datetime string
export const getBalanceSheetContent = async (periodEnd) => {
  try {
    const response = await api.post('/reports/gather-balance-sheet-content', {
      periodEnd,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// retainedEarningsTargetAccount: account name string
// period: 'YYYY-MM' string — NOT a full datetime, just year-month
export const getRetainedEarningsContent = async (retainedEarningsTargetAccount, period) => {
  try {
    const response = await api.post('/reports/gather-retained-earnings-content', {
      retainedEarningsTargetAccount,
      period,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};