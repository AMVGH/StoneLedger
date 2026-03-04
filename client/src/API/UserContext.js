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

    // Create a new user
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
                userId: activityData.userId,
                active: activityData.active,
                activityStartDate: activityData.activityStartDate,
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
    updateUserRole: async (roleData, token = null) => {
        set({ loading: true, error: null });
        try {
            const response = await api.post('/users/update-role', {
                userId: roleData.userId,
                newRole: roleData.newRole
            }, {
                headers: token ? { Authorization: token } : {}
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

    // Clear errors
    clearError: () => set({ error: null })






}));
export default useUserContext;