import { create } from 'zustand';
import api from './api';

//Note -Update error messages to match the Error responses in the error database for better user feedback and debugging. Also consider adding more specific error handling based on status codes or error types returned by the API.

const useUserContext = create((set) => ({
    user: null,
    isLoggedIn: false,
    allUsers: [],
    error: null,
    loading: false,
    setUser: (user) => set({ user, isLoggedIn: true }),
    logout: () => set({ user: null, isLoggedIn: false }),
    // base URL is now handled by the shared `api` instance

    // Login user
    login: async (username, password) => {
        set({ loading: true, error: null });
        try {
            const response = await api.post('/auth/login', {
                username,
                password
            });
            const loginData = response.data.data;
            set({ user: loginData, isLoggedIn: true, loading: false });
            return loginData;
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || 'Failed to login';
            console.error('Error logging in:', errorMsg);
            set({ error: errorMsg, loading: false });
            throw error;
        }
    },

    // Request access (create new user registration)
    requestAccess: async (userData) => {
        set({ loading: true, error: null });
        try {
            const response = await api.post('/auth/request-access', {
                firstName: userData.firstName,
                lastName: userData.lastName,
                userAddress: userData.userAddress,
                dateOfBirth: userData.dateOfBirth,
                email: userData.email,
                password: userData.password,
                userRole: userData.userRole,
                securityQuestion: userData.securityQuestion,
                securityQuestionAnswer: userData.securityQuestionAnswer
            });
            set({ loading: false });
            return response.data.data;
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || 'Failed to submit access request';
            console.error('Error requesting access:', errorMsg);
            set({ error: errorMsg, loading: false });
            throw error;
        }
    },

    // Get all users from the system
    getAllUsers: async (token = null) => {
        set({ loading: true, error: null });
        try {
            const response = await api.get('/users/get-users', {
                headers: token ? { Authorization: token } : {}
            });
            set({ allUsers: response.data.data, loading: false });
            return response.data.data;
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || 'Failed to fetch users';
            console.error('Error fetching all users:', errorMsg);
            set({ error: errorMsg, loading: false });
            throw error;
        }
    },

    // Validate security question for password reset
    validateSecurityQuestion: async (data, token = null) => {
        set({ loading: true, error: null });
        try {
            const response = await api.post('/passwords/validate-security-question', {
                id: data.id,
                securityQuestion: data.securityQuestion,
                securityQuestionAnswer: data.securityQuestionAnswer
            }, {
                headers: token ? { Authorization: token } : {}
            });
            set({ loading: false });
            return response.data.data;
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || 'Failed to validate security question';
            console.error('Error validating security question:', errorMsg);
            set({ error: errorMsg, loading: false });
            throw error;
        }
    },

    // Update password
    updatePassword: async (data, token = null) => {
        set({ loading: true, error: null });
        try {
            const response = await api.post('/passwords/update-password', {
                id: data.id,
                updatedPassword: data.updatedPassword
            }, {
                headers: token ? { Authorization: token } : {}
            });
            set({ loading: false });
            return response.data.data;
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || 'Failed to update password';
            console.error('Error updating password:', errorMsg);
            set({ error: errorMsg, loading: false });
            throw error;
        }
    },

    // Get pending users from the system
    getPendingUsers: async (token = null) => {
        set({ loading: true, error: null });
        try {
            const response = await api.get('/users/get-pending-users', {
                headers: token ? { Authorization: token } : {}
            });
            set({ loading: false });
            return response.data.data;
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || 'Failed to fetch pending users';
            console.error('Error fetching pending users:', errorMsg);
            set({ error: errorMsg, loading: false });
            throw error;
        }
    },

    // Issue email to user
    issueEmailToUser: async (emailData, token = null) => {
        set({ loading: true, error: null });
        try {
            const response = await api.post('/users/issue-email', {
                targetEmail: emailData.targetEmail,
                emailBody: emailData.emailBody
            }, {
                headers: token ? { Authorization: token } : {}
            });
            set({ loading: false });
            return response.data.data;
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || 'Failed to send email';
            console.error('Error sending email:', errorMsg);
            set({ error: errorMsg, loading: false });
            throw error;
        }
    },

    // Update user information
    updateUserInformation: async (userData, token = null) => {
        set({ loading: true, error: null });
        try {
            const response = await api.post('/users/update-information', userData, {
                headers: token ? { Authorization: token } : {}
            });
            set({ loading: false });
            return response.data.data;
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || 'Failed to update user information';
            console.error('Error updating user information:', errorMsg);
            set({ error: errorMsg, loading: false });
            throw error;
        }
    },

    // Get logged-in user's personal information using JWT token
    getLoggedInUserInfo: async (token) => {
        set({ loading: true, error: null });
        try {
            const headers = token ? { Authorization: token } : {};
            const response = await api.get('/users/logged-in-instance-info', { headers });
            set({ user: response.data.data, isLoggedIn: true, loading: false });
            return response.data.data;
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || 'Failed to fetch user info';
            console.error('Error fetching logged-in user info:', errorMsg);
            set({ error: errorMsg, loading: false });
            throw error;
        }
    },

    // Create a new user (admin only)
    createUser: async (userData, token = null) => {
        set({ loading: true, error: null });
        try {
            const response = await api.post('/users/create', {
                firstName: userData.firstName,
                lastName: userData.lastName,
                email: userData.email,
                password: userData.password,
                userAddress: userData.userAddress,
                dateOfBirth: userData.dateOfBirth,
                userRole: userData.userRole,
                active: userData.active || false,
                activityStartDate: userData.activityStartDate,
                activityEndDate: userData.activityEndDate
            }, {
                headers: token ? { Authorization: token } : {}
            });
            set({ loading: false });
            return response.data.data;
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || 'Failed to create user';
            console.error('Error creating user:', errorMsg);
            set({ error: errorMsg, loading: false });
            throw error;
        }
    },

    // Approve a user by ID (admin only)
    approveUser: async (userId, activityEndDate = null, token = null) => {
        set({ loading: true, error: null });
        try {
            const url = activityEndDate
                ? `/users/approve/${userId}?activityEndDate=${activityEndDate}`
                : `/users/approve/${userId}`;

            const response = await api.post(url, {}, {
                headers: token ? { Authorization: token } : {}
            });
            set({ loading: false });
            return response.data.data;
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || 'Failed to approve user';
            console.error('Error approving user:', errorMsg);
            set({ error: errorMsg, loading: false });
            throw error;
        }
    },

    // Reject a user by ID (admin only)
    rejectUser: async (userId, token = null) => {
        set({ loading: true, error: null });
        try {
            const response = await api.post(`/users/reject/${userId}`, {}, {
                headers: token ? { Authorization: token } : {}
            });
            set({ loading: false });
            return response.data.data;
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || 'Failed to reject user';
            console.error('Error rejecting user:', errorMsg);
            set({ error: errorMsg, loading: false });
            throw error;
        }
    },

    // Update user activity status
    updateUserActivity: async (activityData, token = null) => {
        set({ loading: true, error: null });
        try {
            const response = await api.post('/users/update-activity', {
                id: activityData.id,
                activityStatus: activityData.activityStatus,
                activityEndDate: activityData.activityEndDate
            }, {
                headers: token ? { Authorization: token } : {}
            });
            set({ loading: false });
            return response.data.data;
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || 'Failed to update activity';
            console.error('Error updating user activity:', errorMsg);
            set({ error: errorMsg, loading: false });
            throw error;
        }
    },

    // Update user role (admin only)
    updateUserRole: async (roleData) => {
        set({ loading: true, error: null });
        try {
            const response = await api.post('/users/update-role', {
                id: roleData.userId,
                userRole: roleData.newRole
            });
            set({ loading: false });
            return response.data.data;
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || 'Failed to update role';
            console.error('Error updating user role:', errorMsg);
            set({ error: errorMsg, loading: false });
            throw error;
        }
    },

    // Suspend a user
    suspendUser: async (suspensionData, token = null) => {
        set({ loading: true, error: null });
        try {
            const response = await api.post('/users/suspend-user', {
                id: suspensionData.id,
                suspensionStartDate: suspensionData.suspensionStartDate,
                suspensionEndDate: suspensionData.suspensionEndDate,
            }, {
                headers: token ? { Authorization: token } : {}
            });
            set({ loading: false });
            return response.data.data;
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || 'Failed to suspend user';
            set({ error: errorMsg, loading: false });
            throw error;
        }
    },

    // Revoke user suspension
    revokeSuspension: async (userId, token = null) => {
        set({ loading: true, error: null });
        try {
            const response = await api.post(`/users/revoke-suspension/${userId}`, {}, {
                headers: token ? { Authorization: token } : {}
            });
            set({ loading: false });
            return response.data.data;
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || 'Failed to revoke suspension';
            console.error('Error revoking suspension:', errorMsg);
            set({ error: errorMsg, loading: false });
            throw error;
        }
    },

    // Reset login attempts
    resetLoginAttempts: async (userId, token = null) => {
        set({ loading: true, error: null });
        try {
            const response = await api.post(`/users/reset-login-attempts/${userId}`, {}, {
                headers: token ? { Authorization: token } : {}
            });
            set({ loading: false });
            return response.data.data;
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || 'Failed to reset login attempts';
            console.error('Error resetting login attempts:', errorMsg);
            set({ error: errorMsg, loading: false });
            throw error;
        }
    },

    // Admin restore - reset password and restore access
    adminRestore: async (restoreData, token = null) => {
        set({ loading: true, error: null });
        try {
            const response = await api.post('/users/admin-restore', {
                userId: restoreData.userId,
                newPassword: restoreData.newPassword
            }, {
                headers: token ? { Authorization: token } : {}
            });
            set({ loading: false });
            return response.data.data;
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || 'Failed to restore user access';
            console.error('Error restoring user access:', errorMsg);
            set({ error: errorMsg, loading: false });
            throw error;
        }
    },

    // Get all financial accounts
    getFinancialAccounts: async (token = null) => {
        set({ loading: true, error: null });
        try {
            const response = await api.get('/financial-accounts/get-financial-accounts', {
                headers: token ? { Authorization: token } : {}
            });
            set({ loading: false });
            return response.data.data;
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || 'Failed to fetch financial accounts';
            console.error('Error fetching financial accounts:', errorMsg);
            set({ error: errorMsg, loading: false });
            throw error;
        }
    },

    // Generate an account number based on account category
    generateAccountNumber: async (accountCategory, token = null) => {
        set({ loading: true, error: null });
        try {
            const response = await api.post('/financial-accounts/generate-account-number',
                { accountCategory },
                { headers: token ? { Authorization: token } : {} }
            );
            set({ loading: false });
            return response.data.data;
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || 'Failed to generate account number';
            console.error('Error generating account number:', errorMsg);
            set({ error: errorMsg, loading: false });
            throw error;
        }
    },

    // Create a new financial account
    createFinancialAccount: async (accountData, token = null) => {
        set({ loading: true, error: null });
        try {
            const response = await api.post('/financial-accounts/create-financial-account',
                accountData,
                { headers: token ? { Authorization: token } : {} }
            );
            set({ loading: false });
            return response.data.data;
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || 'Failed to create financial account';
            console.error('Error creating financial account:', errorMsg);
            set({ error: errorMsg, loading: false });
            throw error;
        }
    },

    // Edit an existing financial account
    editFinancialAccount: async (accountData, token = null) => {
        set({ loading: true, error: null });
        try {
            const response = await api.post('/financial-accounts/edit-financial-account',
                accountData,
                { headers: token ? { Authorization: token } : {} }
            );
            set({ loading: false });
            return response.data.data;
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || 'Failed to edit financial account';
            console.error('Error editing financial account:', errorMsg);
            set({ error: errorMsg, loading: false });
            throw error;
        }
    },

    // Activate a financial account
    activateFinancialAccount: async (userId, accountNumber, token = null) => {
        set({ loading: true, error: null });
        try {
            const response = await api.post('/financial-accounts/activate-financial-account',
                { userId, accountNumber },
                { headers: token ? { Authorization: token } : {} }
            );
            set({ loading: false });
            return response.data.data;
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || 'Failed to activate financial account';
            console.error('Error activating financial account:', errorMsg);
            set({ error: errorMsg, loading: false });
            throw error;
        }
    },

    // Deactivate a financial account
    deactivateFinancialAccount: async (userId, accountNumber, token = null) => {
        set({ loading: true, error: null });
        try {
            const response = await api.post('/financial-accounts/deactivate-financial-account',
                { userId, accountNumber },
                { headers: token ? { Authorization: token } : {} }
            );
            set({ loading: false });
            return response.data.data;
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || 'Failed to deactivate financial account';
            console.error('Error deactivating financial account:', errorMsg);
            set({ error: errorMsg, loading: false });
            throw error;
        }
    },

    // Get all event logs
    getEvents: async (token = null) => {
        set({ loading: true, error: null });
        try {
            const response = await api.get('/events/get-events', {
                headers: token ? { Authorization: token } : {}
            });
            set({ loading: false });
            return response.data.data;
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || 'Failed to fetch events';
            console.error('Error fetching events:', errorMsg);
            set({ error: errorMsg, loading: false });
            throw error;
        }
    },

    // Clear errors
    clearError: () => set({ error: null })

}));
export default useUserContext;