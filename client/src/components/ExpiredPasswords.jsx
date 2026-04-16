import React, { useState, useEffect } from "react";
import styles from "./ExpiredPasswords.module.css";
import useUserContext from "../API/UserContext";

export default function ExpiredPasswords() {
  const { allUsers, getAllUsers, adminRestore, loading, error } = useUserContext();
  const [inactiveExpiredUsers, setInactiveExpiredUsers] = useState([]);
  const [passwords, setPasswords] = useState({});
  const [resettingUserId, setResettingUserId] = useState(null);
  const [resetMessage, setResetMessage] = useState({});

  // Fetch users on component mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    getAllUsers(token).catch(err => {
      console.error("Failed to fetch users:", err);
    });
  }, [getAllUsers]);

  // Filter users with activity = false AND password expiration date elapsed
  useEffect(() => {
    if (allUsers && allUsers.length > 0) {
      const now = new Date();
      const filteredUsers = allUsers
        .filter(user => {
          // Check if activity is false and password has expired
          const isInactive = user.active === false;
          const hasExpiredPassword = user.passwordExpirationDate &&
            new Date(user.passwordExpirationDate) < now;
          return isInactive && hasExpiredPassword;
        })
        .map(user => ({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: user.userRole,
          status: "Inactive",
          passwordExpirationDate: user.passwordExpirationDate
        }));

      setInactiveExpiredUsers(filteredUsers);

      // Initialize password state for each user
      const initialPasswords = {};
      filteredUsers.forEach(user => {
        initialPasswords[user.id] = "";
      });
      setPasswords(initialPasswords);
    }
  }, [allUsers]);

  const handlePasswordChange = (userId, value) => {
    setPasswords(prev => ({
      ...prev,
      [userId]: value
    }));
    // Clear any previous message for this user
    if (resetMessage[userId]) {
      setResetMessage(prev => ({
        ...prev,
        [userId]: null
      }));
    }
  };

  const handleResetPassword = async (userId) => {
    const newPassword = passwords[userId];

    // Validate password is not empty
    if (!newPassword || newPassword.trim() === "") {
      setResetMessage(prev => ({
        ...prev,
        [userId]: { type: "error", text: "Please enter a new password" }
      }));
      return;
    }

    setResettingUserId(userId);
    setResetMessage(prev => ({
      ...prev,
      [userId]: null
    }));

    try {
      const token = localStorage.getItem('authToken');
      await adminRestore({
        id: userId,
        updatedPassword: newPassword
      }, token);

      // Show success message
      setResetMessage(prev => ({
        ...prev,
        [userId]: { type: "success", text: "Password reset successfully!" }
      }));

      // Clear the password field for this user
      setPasswords(prev => ({
        ...prev,
        [userId]: ""
      }));

      // Remove the user from the table after a delay
      setTimeout(() => {
        setInactiveExpiredUsers(prev => prev.filter(user => user.id !== userId));
        // Also clean up state for this user
        setPasswords(prev => {
          const newPasswords = { ...prev };
          delete newPasswords[userId];
          return newPasswords;
        });
        setResetMessage(prev => {
          const newMessages = { ...prev };
          delete newMessages[userId];
          return newMessages;
        });
      }, 2000);

    } catch (err) {
      console.error("Failed to reset password:", err);
      setResetMessage(prev => ({
        ...prev,
        [userId]: { type: "error", text: "Failed to reset password. Please try again." }
      }));
    } finally {
      setResettingUserId(null);
    }
  };

  if (loading && inactiveExpiredUsers.length === 0 && !allUsers?.length) {
    return <div className={styles.container}><p>Loading users...</p></div>;
  }

  if (error && inactiveExpiredUsers.length === 0 && !allUsers?.length) {
    return <div className={styles.container}><p>Error loading data: {error}</p></div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.summary}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryValue}>{inactiveExpiredUsers.length}</span>
          <span className={styles.summaryLabel}>Inactive Users with Expired Passwords</span>
        </div>
      </div>

      {inactiveExpiredUsers.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No inactive users with expired passwords found</p>
        </div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>ID</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>New Password</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {inactiveExpiredUsers.map((user) => (
              <tr key={user.id} className={styles.row}>
                <td>{user.name}</td>
                <td>{user.id}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>
                  <span className={`${styles.badge} ${styles.inactive}`}>
                    {user.status}
                  </span>
                </td>
                <td>
                  <input
                    type="password"
                    value={passwords[user.id] || ""}
                    onChange={(e) => handlePasswordChange(user.id, e.target.value)}
                    placeholder="Enter new password"
                    className={styles.passwordInput}
                    disabled={resettingUserId === user.id}
                  />
                  {resetMessage[user.id] && (
                    <div className={`${styles.message} ${styles[resetMessage[user.id].type]}`}>
                      {resetMessage[user.id].text}
                    </div>
                  )}
                </td>
                <td>
                  <button
                    className={styles.resetBtn}
                    onClick={() => handleResetPassword(user.id)}
                    disabled={resettingUserId === user.id}
                  >
                    {resettingUserId === user.id ? "Resetting..." : "Reset Password"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}