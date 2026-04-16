import api from './api';

// Helper function to convert date to EOD format (YYYY-MM-DDT23:59:59)
const formatToEOD = (periodEnd) => {
  if (!periodEnd) return null;

  console.log('[formatToEOD] Input:', periodEnd);

  // Extract just the date part (YYYY-MM-DD)
  const datePart = periodEnd.split('T')[0];

  // Return in the exact format Postman uses
  const eodFormat = `${datePart}T23:59:59`;
  console.log('[formatToEOD] Output:', eodFormat);

  return eodFormat;
};

// reportType: 'UNADJUSTED' | 'ADJUSTED' | 'POST_CLOSING'
// periodEnd: ISO datetime string e.g. "2024-12-31T23:59:59"
export const getTrialBalanceContent = async (reportType, periodEnd) => {
  const payload = {
    reportType,
    periodEnd: formatToEOD(periodEnd),
  };
  console.log('[getTrialBalanceContent] Sending payload:', payload);

  try {
    const response = await api.post('/reports/gather-trial-balance-content', payload);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// periodEnd: ISO datetime string
export const getIncomeStatementContent = async (periodEnd) => {
  const payload = {
    periodEnd: formatToEOD(periodEnd),
  };
  console.log('[getIncomeStatementContent] Sending payload:', payload);

  try {
    const response = await api.post('/reports/gather-income-statement-content', payload);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// periodEnd: ISO datetime string
export const getBalanceSheetContent = async (periodEnd) => {
  const payload = {
    periodEnd: formatToEOD(periodEnd),
  };
  console.log('[getBalanceSheetContent] Sending payload:', payload);

  try {
    const response = await api.post('/reports/gather-balance-sheet-content', payload);
    console.log('[getBalanceSheetContent] Response received');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// retainedEarningsTargetAccount: account name string
// dividendsDistributedTargetAccount: account name string
// period: 'YYYY-MM' string — NOT a full datetime, just year-month
export const getRetainedEarningsContent = async (retainedEarningsTargetAccount, dividendsDistributedTargetAccount, period) => {
  const payload = {
    retainedEarningsTargetAccount: retainedEarningsTargetAccount,
    dividendsDistributedTargetAccount: dividendsDistributedTargetAccount,
    period: period,
  };
  console.log('[getRetainedEarningsContent] Sending payload:', payload);

  try {
    const response = await api.post('/reports/gather-retained-earnings-content', payload);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const issuePostClosingWarning = async () => {
  try {
    const response = await api.get('/reports/issue-post-closing-warning');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};