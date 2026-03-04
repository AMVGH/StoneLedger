import React, { useState, useEffect } from "react";
import styles from "./UsersTable.module.css";
import useUserContext from "../API/UserContext";

export default function UsersTable() {
  const { 
    allUsers, 
    getAllUsers, 
    updateUserInformation, 
    updateUserRole, 
    suspendUser: apiSuspendUser,
    issueEmailToUser,
    loading, 
    error 
  } = useUserContext();
  
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    userAddress: "",
    dateOfBirth: "",
    email: "",
    password: "",
    userRole: "",
  });
  const [emailUser, setEmailUser] = useState(null);
  const [emailData, setEmailData] = useState({ subject: "", message: "" });
  const [suspendUserData, setSuspendUserData] = useState(null);
  const [suspendData, setSuspendData] = useState({ startDate: "", expiryDate: "", reason: "" });

  // Fetch users on component mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    getAllUsers(token).catch(err => {
      console.error("Failed to fetch users:", err);
    });
  }, [getAllUsers]);

  // Update local users state when allUsers changes
  useEffect(() => {
    if (allUsers && allUsers.length > 0) {
      // Filter out pending users (inactive users without activity dates)
      const activeUsers = allUsers.filter(user => user.active || user.activityStartDate);
      setUsers(activeUsers);
    }
  }, [allUsers]);

  const handleRowClick = (user) => {
    setEditingUser(user);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      userAddress: user.userAddress,
      dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : "",
      email: user.email,
      password: "",
      userRole: user.userRole,
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      // Update user information
      await updateUserInformation({
        userId: editingUser.id,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        userAddress: formData.userAddress,
      }, token);
      
      // Update role if changed
      if (formData.userRole !== editingUser.userRole) {
        await updateUserRole({
          userId: editingUser.id,
          newRole: formData.userRole
        }, token);
      }
      
      // Refresh users list
      await getAllUsers(token);
      setEditingUser(null);
    } catch (err) {
      console.error("Failed to update user:", err);
      alert("Failed to update user. Please try again.");
    }
  };

  const handleCancel = () => {
    setEditingUser(null);
  };

  const handleSuspendUser = () => {
    setSuspendUserData(editingUser);
    setSuspendData({
      startDate: new Date().toISOString().split('T')[0],
      expiryDate: "",
      reason: "",
    });
    setEditingUser(null);
  };

  const handleSuspendChange = (e) => {
    const { name, value } = e.target;
    setSuspendData((prev) => ({ ...prev, [name]: value }));
  };

  const confirmSuspend = async () => {
    try {
      const token = localStorage.getItem('authToken');
      await apiSuspendUser({
        userId: suspendUserData.id,
        suspensionStartDate: suspendData.startDate,
        suspensionEndDate: suspendData.expiryDate
      }, token);
      
      // Refresh users list
      await getAllUsers(token);
      setSuspendUserData(null);
      setSuspendData({ startDate: "", expiryDate: "", reason: "" });
    } catch (err) {
      console.error("Failed to suspend user:", err);
      alert("Failed to suspend user. Please try again.");
    }
  };

  const cancelSuspend = () => {
    setSuspendUserData(null);
    setSuspendData({ startDate: "", expiryDate: "", reason: "" });
  };

  const handleEmailClick = (e, user) => {
    e.stopPropagation();
    setEmailUser(user);
    setEmailData({ subject: "", message: "" });
  };

  const handleEmailChange = (e) => {
    const { name, value } = e.target;
    setEmailData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSendEmail = async () => {
    try {
      const token = localStorage.getItem('authToken');
      await issueEmailToUser({
        userId: emailUser.id,
        subject: emailData.subject,
        message: emailData.message
      }, token);
      
      alert(`Email sent to ${emailUser.email}!`);
      setEmailUser(null);
      setEmailData({ subject: "", message: "" });
    } catch (err) {
      console.error("Failed to send email:", err);
      alert("Failed to send email. Please try again.");
    }
  };

  const handleEmailCancel = () => {
    setEmailUser(null);
    setEmailData({ subject: "", message: "" });
  };

  if (loading && users.length === 0) {
    return <div className={styles.container}><p>Loading users...</p></div>;
  }

  if (error && users.length === 0) {
    return <div className={styles.container}><p>Error loading users: {error}</p></div>;
  }

  return (
    <div className={styles.container}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Date of Birth</th>
            <th>Address</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr
              key={user.id}
              className={styles.row}
              onClick={() => handleRowClick(user)}
            >
              <td>{user.id}</td>
              <td>{user.firstName} {user.lastName}</td>
              <td>{user.email}</td>
              <td>
                {user.suspended ? (
                  <span className={styles.suspendedBadge}>Suspended</span>
                ) : (
                  user.userRole
                )}
              </td>
              <td>{user.dateOfBirth}</td>
              <td>{user.userAddress}</td>
              <td>
                <button
                  className={styles.emailBtn}
                  onClick={(e) => handleEmailClick(e, user)}
                >
                  Send Email
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editingUser && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Edit User</h3>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter new password to change"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Address</label>
              <input
                type="text"
                name="userAddress"
                value={formData.userAddress}
                onChange={handleChange}
              />
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Date of Birth</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Role</label>
                <select name="userRole" value={formData.userRole} onChange={handleChange}>
                  <option value="Admin">Admin</option>
                  <option value="Manager">Manager</option>
                  <option value="Accountant">Accountant</option>
                  <option value="User">User</option>
                </select>
              </div>
            </div>
            <div className={styles.actions}>
              <button className={styles.saveBtn} onClick={handleSave}>
                Save
              </button>
              <button className={styles.cancelBtn} onClick={handleCancel}>
                Cancel
              </button>
            </div>
            <div className={styles.suspendSection}>
              <button className={styles.suspendBtn} onClick={handleSuspendUser}>
                Suspend User
              </button>
            </div>
          </div>
        </div>
      )}

      {emailUser && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Send Email to {emailUser.firstName} {emailUser.lastName}</h3>
            <p className={styles.emailTo}>To: {emailUser.email}</p>
            <div className={styles.formGroup}>
              <label>Subject</label>
              <input
                type="text"
                name="subject"
                value={emailData.subject}
                onChange={handleEmailChange}
                placeholder="Enter email subject..."
              />
            </div>
            <div className={styles.formGroup}>
              <label>Message</label>
              <textarea
                name="message"
                value={emailData.message}
                onChange={handleEmailChange}
                placeholder="Type your message here..."
                className={styles.textarea}
                rows={5}
              />
            </div>
            <div className={styles.actions}>
              <button className={styles.sendBtn} onClick={handleSendEmail}>
                Send
              </button>
              <button className={styles.cancelBtn} onClick={handleEmailCancel}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {suspendUserData && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Suspend User</h3>
            <p className={styles.suspendInfo}>
              Suspending: <strong>{suspendUserData.firstName} {suspendUserData.lastName}</strong>
            </p>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={suspendData.startDate}
                  onChange={handleSuspendChange}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Expiry Date</label>
                <input
                  type="date"
                  name="expiryDate"
                  value={suspendData.expiryDate}
                  onChange={handleSuspendChange}
                />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Reason for Suspension</label>
              <textarea
                name="reason"
                value={suspendData.reason}
                onChange={handleSuspendChange}
                placeholder="e.g., Extended leave, medical leave, etc."
                className={styles.textarea}
                rows={3}
              />
            </div>
            <div className={styles.actions}>
              <button className={styles.confirmSuspendBtn} onClick={confirmSuspend}>
                Confirm Suspension
              </button>
              <button className={styles.cancelBtn} onClick={cancelSuspend}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
