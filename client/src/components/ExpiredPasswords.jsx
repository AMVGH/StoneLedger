import React, { useState, useEffect } from "react";
import styles from "./ExpiredPasswords.module.css";
import useUserContext from "../API/UserContext";

export default function ExpiredPasswords() {
  const { allUsers, getAllUsers, adminRestore, loading, error } = useUserContext();
  const [expiredUsers, setExpiredUsers] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: "daysSinceExpired", direction: "desc" });
  const [selectedUser, setSelectedUser] = useState(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  // Fetch users on component mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    getAllUsers(token).catch(err => {
      console.error("Failed to fetch users:", err);
    });
  }, [getAllUsers]);

  // Filter users with expired passwords when allUsers changes
  useEffect(() => {
    if (allUsers && allUsers.length > 0) {
      const now = new Date();
      const expired = allUsers
        .filter(user => {
          if (!user.passwordExpirationDate) return false;
          const expirationDate = new Date(user.passwordExpirationDate);
          return expirationDate < now;
        })
        .map(user => {
          const expirationDate = new Date(user.passwordExpirationDate);
          const daysSinceExpired = Math.floor((now - expirationDate) / (1000 * 60 * 60 * 24));
          return {
            id: user.id,
            username: user.username,
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            role: user.userRole,
            lastChanged: user.passwordExpirationDate ? 
              new Date(new Date(user.passwordExpirationDate).getTime() - (90 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0] : 'N/A',
            expirationDate: user.passwordExpirationDate ? 
              new Date(user.passwordExpirationDate).toISOString().split('T')[0] : 'N/A',
            daysSinceExpired: daysSinceExpired
          };
        });
      setExpiredUsers(expired);
    }
  }, [allUsers]);

  const sortedUsers = [...expiredUsers].sort((a, b) => {
    if (sortConfig.key === "daysSinceExpired") {
      return sortConfig.direction === "asc" ? a.daysSinceExpired - b.daysSinceExpired : b.daysSinceExpired - a.daysSinceExpired;
    }
    const aVal = a[sortConfig.key] || "";
    const bVal = b[sortConfig.key] || "";
    if (sortConfig.direction === "asc") {
      return aVal.localeCompare(bVal);
    }
    return bVal.localeCompare(aVal);
  });

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return "";
    return sortConfig.direction === "asc" ? " ↑" : " ↓";
  };

  const getSeverityClass = (days) => {
    if (days > 90) return styles.critical;
    if (days > 30) return styles.warning;
    return styles.recent;
  };

  const handleResetPassword = (user) => {
    setSelectedUser(user);
    setShowResetModal(true);
    setNewPassword("");
  };

  const confirmReset = async () => {
    if (!newPassword) {
      alert("Please enter a new password.");
      return;
    }
    
    try {
      const token = localStorage.getItem('authToken');
      await adminRestore({
        userId: selectedUser.id,
        newPassword: newPassword
      }, token);
      
      // Remove from expired list and refresh
      setExpiredUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
      setShowResetModal(false);
      setSelectedUser(null);
      setNewPassword("");
      
      // Refresh the users list
      await getAllUsers(token);
    } catch (err) {
      console.error("Failed to reset password:", err);
      alert("Failed to reset password. Please try again.");
    }
  };

  const cancelReset = () => {
    setShowResetModal(false);
    setSelectedUser(null);
    setNewPassword("");
  };

  const totalExpired = expiredUsers.length;
  const criticalCount = expiredUsers.filter((u) => u.daysSinceExpired > 90).length;
  const warningCount = expiredUsers.filter((u) => u.daysSinceExpired > 30 && u.daysSinceExpired <= 90).length;
  const recentCount = expiredUsers.filter((u) => u.daysSinceExpired <= 30).length;

  if (loading && expiredUsers.length === 0 && !allUsers?.length) {
    return <div className={styles.container}><p>Loading expired passwords...</p></div>;
  }

  if (error && expiredUsers.length === 0 && !allUsers?.length) {
    return <div className={styles.container}><p>Error loading data: {error}</p></div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.summary}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryValue}>{totalExpired}</span>
          <span className={styles.summaryLabel}>Total Expired</span>
        </div>
        <div className={`${styles.summaryCard} ${styles.criticalCard}`}>
          <span className={styles.summaryValue}>{criticalCount}</span>
          <span className={styles.summaryLabel}>Critical (&gt;90 days)</span>
        </div>
        <div className={`${styles.summaryCard} ${styles.warningCard}`}>
          <span className={styles.summaryValue}>{warningCount}</span>
          <span className={styles.summaryLabel}>Warning (31-90 days)</span>
        </div>
        <div className={`${styles.summaryCard} ${styles.recentCard}`}>
          <span className={styles.summaryValue}>{recentCount}</span>
          <span className={styles.summaryLabel}>Recent (≤30 days)</span>
        </div>
      </div>

      {expiredUsers.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No expired passwords found</p>
        </div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th onClick={() => handleSort("username")} className={styles.sortable}>
                Username{getSortIndicator("username")}
              </th>
              <th onClick={() => handleSort("name")} className={styles.sortable}>
                Name{getSortIndicator("name")}
              </th>
              <th onClick={() => handleSort("email")} className={styles.sortable}>
                Email{getSortIndicator("email")}
              </th>
              <th onClick={() => handleSort("role")} className={styles.sortable}>
                Role{getSortIndicator("role")}
              </th>
              <th onClick={() => handleSort("expirationDate")} className={styles.sortable}>
                Expiration Date{getSortIndicator("expirationDate")}
              </th>
              <th onClick={() => handleSort("daysSinceExpired")} className={styles.sortable}>
                Days Expired{getSortIndicator("daysSinceExpired")}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedUsers.map((user) => (
              <tr key={user.id} className={styles.row}>
                <td>{user.username}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>{user.expirationDate}</td>
                <td>
                  <span className={`${styles.badge} ${getSeverityClass(user.daysSinceExpired)}`}>
                    {user.daysSinceExpired} days
                  </span>
                </td>
                <td>
                  <button
                    className={styles.resetBtn}
                    onClick={() => handleResetPassword(user)}
                  >
                    Force Reset
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showResetModal && selectedUser && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Force Password Reset</h3>
            <p>
              Are you sure you want to force a password reset for{" "}
              <strong>{selectedUser.name}</strong> ({selectedUser.username})?
            </p>
            <div className={styles.formGroup}>
              <label>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className={styles.passwordInput}
              />
            </div>
            <p className={styles.infoText}>
              This will send a password reset email to {selectedUser.email} and remove them from the expired list.
            </p>
            <div className={styles.actions}>
              <button className={styles.confirmBtn} onClick={confirmReset}>
                Confirm Reset
              </button>
              <button className={styles.cancelBtn} onClick={cancelReset}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
