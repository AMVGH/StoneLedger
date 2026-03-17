import React, { useState, useEffect } from "react";
import styles from "./PendingTable.module.css";
import useUserContext from "../API/UserContext";

export default function PendingTable({ onApprove, onDeny }) {
  const { getPendingUsers, approveUser, rejectUser, loading, error } = useUserContext();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [confirmAction, setConfirmAction] = useState(null);
  const [activityEndDate, setActivityEndDate] = useState("");

  useEffect(() => {
    const fetchPendingUsers = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const users = await getPendingUsers(token);
        setPendingUsers(users || []);
      } catch (err) {
        console.error("Failed to fetch pending users:", err);
      }
    };
    fetchPendingUsers();
  }, [getPendingUsers]);

  const handleApprove = (user) => {
    setConfirmAction({ type: "approve", user });
    const defaultEndDate = new Date();
    defaultEndDate.setFullYear(defaultEndDate.getFullYear() + 1);
    setActivityEndDate(defaultEndDate.toISOString().split("T")[0]);
  };

  const handleDeny = (user) => {
    setConfirmAction({ type: "deny", user });
  };

  const confirmApprove = async () => {
    const user = confirmAction.user;
    try {
      const token = localStorage.getItem("authToken");
      await approveUser(user.id, activityEndDate || null, token);
      setPendingUsers((prev) => prev.filter((u) => u.id !== user.id));
      if (onApprove) onApprove(user);
    } catch (err) {
      console.error("Failed to approve user:", err);
      alert("Failed to approve user. Please try again.");
    }
    setConfirmAction(null);
    setActivityEndDate("");
  };

  const confirmDeny = async () => {
    const user = confirmAction.user;
    try {
      const token = localStorage.getItem("authToken");
      await rejectUser(user.id, token);
      setPendingUsers((prev) => prev.filter((u) => u.id !== user.id));
      if (onDeny) onDeny(user);
    } catch (err) {
      console.error("Failed to reject user:", err);
      alert("Failed to reject user. Please try again.");
    }
    setConfirmAction(null);
  };

  const cancelAction = () => {
    setConfirmAction(null);
    setActivityEndDate("");
  };

  if (loading && pendingUsers.length === 0) {
    return <div className={styles.container}><p>Loading pending requests...</p></div>;
  }

  if (error && pendingUsers.length === 0) {
    return <div className={styles.container}><p>Error loading pending requests: {error}</p></div>;
  }

  return (
    <div className={styles.container}>
      {pendingUsers.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No pending requests</p>
        </div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Request Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingUsers.map((user) => (
              <tr key={user.id} className={styles.row}>
                <td>{user.id}</td>
                <td>{user.firstName} {user.lastName}</td>
                <td>{user.email}</td>
                <td>{user.accountCreationDate ? new Date(user.accountCreationDate).toLocaleDateString() : "N/A"}</td>
                <td className={styles.actionCell}>
                  <button className={styles.approveBtn} onClick={() => handleApprove(user)}>
                    Approve
                  </button>
                  <button className={styles.denyBtn} onClick={() => handleDeny(user)}>
                    Deny
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {confirmAction && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>
              {confirmAction.type === "approve" ? "Approve User" : "Deny User"}
            </h3>
            <p>
              Are you sure you want to {confirmAction.type}{" "}
              <strong>{confirmAction.user.firstName} {confirmAction.user.lastName}</strong>?
            </p>
            {confirmAction.type === "approve" && (
              <>
                <p className={styles.infoText}>
                  This user will be added to the system with default permissions.
                </p>
                <div className={styles.formGroup}>
                  <label>Activity End Date (Optional)</label>
                  <input
                    type="date"
                    value={activityEndDate}
                    onChange={(e) => setActivityEndDate(e.target.value)}
                    className={styles.dateInput}
                  />
                </div>
              </>
            )}
            {confirmAction.type === "deny" && (
              <p className={styles.warningText}>
                This action cannot be undone. The user's request will be deleted.
              </p>
            )}
            <div className={styles.actions}>
              {confirmAction.type === "approve" ? (
                <button className={styles.confirmApproveBtn} onClick={confirmApprove}>
                  Confirm Approval
                </button>
              ) : (
                <button className={styles.confirmDenyBtn} onClick={confirmDeny}>
                  Confirm Denial
                </button>
              )}
              <button className={styles.cancelBtn} onClick={cancelAction}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}