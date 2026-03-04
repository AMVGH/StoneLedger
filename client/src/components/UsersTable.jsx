import React, { useState, useEffect } from "react";
import styles from "./UsersTable.module.css";
import useUserContext from "../API/UserContext";

export default function UsersTable() {
  const {
    allUsers,
    getAllUsers,
    updateUserInformation,
    updateUserRole,
    updateUserActivity,
    suspendUser: apiSuspendUser,
    revokeSuspension: apiRevokeSuspension,
    issueEmailToUser,
    loading,
    error,
  } = useUserContext();

  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  
  // Form states for different sections
  const [infoFormData, setInfoFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    userAddress: "",
    dateOfBirth: "",
  });
  
  const [roleFormData, setRoleFormData] = useState({
    userRole: "",
  });
  
  const [activityFormData, setActivityFormData] = useState({
    activityStatus: true,
    activityEndDate: "",
  });

  const [emailUser, setEmailUser] = useState(null);
  const [emailData, setEmailData] = useState({ subject: "", message: "" });
  const [suspendUserData, setSuspendUserData] = useState(null);
  const [suspendData, setSuspendData] = useState({
    startDate: "",
    expiryDate: "",
    reason: "",
  });

  const [activeQuadrant, setActiveQuadrant] = useState(null); // 'info', 'role', 'activity', 'suspend'

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    getAllUsers(token).catch((err) => {
      console.error("Failed to fetch users:", err);
    });
  }, [getAllUsers]);

  useEffect(() => {
    if (allUsers && allUsers.length > 0) {
      const activeUsers = allUsers.filter(
        (user) => user.active || user.activityStartDate
      );
      setUsers(activeUsers);
    }
  }, [allUsers]);

  const getStatusLabel = (user) => {
    if (user.suspended) return "Suspended";
    if (user.active) return "Active";
    return "Inactive";
  };

  const getStatusClass = (user) => {
    if (user.suspended) return styles.statusSuspended;
    if (user.active) return styles.statusActive;
    return styles.statusInactive;
  };

  const handleRowClick = (user) => {
    setEditingUser(user);
    setInfoFormData({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      userAddress: user.userAddress || "",
      dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split("T")[0] : "",
    });
    setRoleFormData({
      userRole: user.userRole || "USER",
    });
    setActivityFormData({
      activityStatus: user.active || false,
      activityEndDate: user.activityEndDate ? user.activityEndDate.split("T")[0] : "",
    });
    setActiveQuadrant(null); // Reset active quadrant
  };

  // Info section handlers
  const handleInfoChange = (e) => {
    const { name, value } = e.target;
    setInfoFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateInfo = async () => {
    try {
      const token = localStorage.getItem("authToken");
      await updateUserInformation(
        {
          id: editingUser.id,
          firstName: infoFormData.firstName,
          lastName: infoFormData.lastName,
          email: infoFormData.email,
          userAddress: infoFormData.userAddress,
          dateOfBirth: infoFormData.dateOfBirth || null,
        },
        token
      );
      await getAllUsers(token);
      setActiveQuadrant(null);
      alert("User information updated successfully.");
    } catch (err) {
      console.error("Failed to update user info:", err);
      alert("Failed to update user information. Please try again.");
    }
  };

  // Role section handlers
  const handleRoleChange = (e) => {
    const { name, value } = e.target;
    setRoleFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateRole = async () => {
    try {
      const token = localStorage.getItem("authToken");
      await updateUserRole(
        {
          id: editingUser.id,
          userRole: roleFormData.userRole,
        },
        token
      );
      await getAllUsers(token);
      setActiveQuadrant(null);
      alert("Role updated successfully.");
    } catch (err) {
      console.error("Failed to update role:", err);
      alert("Failed to update role. Please try again.");
    }
  };

  // Activity section handlers
  const handleActivityChange = (e) => {
    const { name, value, type, checked } = e.target;
    setActivityFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleUpdateActivity = async () => {
    try {
      const token = localStorage.getItem("authToken");
      await updateUserActivity(
        {
          id: editingUser.id,
          activityStatus: activityFormData.activityStatus,
          activityEndDate: activityFormData.activityEndDate 
            ? new Date(activityFormData.activityEndDate).toISOString()
            : null,
        },
        token
      );
      await getAllUsers(token);
      setActiveQuadrant(null);
      alert("Activity status updated successfully.");
    } catch (err) {
      console.error("Failed to update activity:", err);
      alert("Failed to update activity status. Please try again.");
    }
  };

  // Suspend section handlers
  const handleSuspendUser = () => {
    setSuspendUserData(editingUser);
    setSuspendData({
      startDate: new Date().toISOString().split("T")[0],
      expiryDate: "",
      reason: "",
    });
    setEditingUser(null);
  };

  const handleRevokeSuspension = async () => {
    try {
      const token = localStorage.getItem("authToken");
      await apiRevokeSuspension(editingUser.id, token);
      await getAllUsers(token);
      setEditingUser(null);
      alert("Suspension revoked successfully.");
    } catch (err) {
      console.error("Failed to revoke suspension:", err);
      alert("Failed to revoke suspension. Please try again.");
    }
  };

  const handleSuspendChange = (e) => {
    const { name, value } = e.target;
    setSuspendData((prev) => ({ ...prev, [name]: value }));
  };

  const confirmSuspend = async () => {
    try {
      const token = localStorage.getItem("authToken");
      await apiSuspendUser(
        {
          id: suspendUserData.id,
          suspensionStartDate: suspendData.startDate ? `${suspendData.startDate}T00:00:00` : null,
          suspensionEndDate: suspendData.expiryDate ? `${suspendData.expiryDate}T00:00:00` : null,
        },
        token
      );
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

  // Email handlers
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
      const token = localStorage.getItem("authToken");
      await issueEmailToUser(
        {
          targetEmail: emailUser.email,
          emailBody: emailData.message,
        },
        token
      );
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

  const handleCancel = () => {
    setEditingUser(null);
    setActiveQuadrant(null);
  };

  if (loading && users.length === 0) {
    return (
      <div className={styles.container}>
        <p>Loading users...</p>
      </div>
    );
  }

  if (error && users.length === 0) {
    return (
      <div className={styles.container}>
        <p>Error loading users: {error}</p>
      </div>
    );
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
            <th>Status</th>
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
              <td>
                {user.firstName} {user.lastName}
              </td>
              <td>{user.email}</td>
              <td>{user.userRole}</td>
              <td>
                <span className={`${styles.statusBadge} ${getStatusClass(user)}`}>
                  {getStatusLabel(user)}
                </span>
              </td>
              <td>{user.dateOfBirth ? user.dateOfBirth.split("T")[0] : "—"}</td>
              <td>{user.userAddress || "—"}</td>
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

      {/* Edit User Modal - Quadrant Layout */}
      {editingUser && (
        <div className={styles.modal} onClick={handleCancel}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3>
              Manage User: {editingUser.firstName} {editingUser.lastName}
            </h3>

            {/* Four Quadrant Grid */}
            <div className={styles.quadrantGrid}>
              {/* Quadrant 1: Update Information */}
              <div className={`${styles.quadrant} ${activeQuadrant === 'info' ? styles.activeQuadrant : ''}`}>
                <div className={styles.quadrantHeader}>
                  <h4>Update Information</h4>
                  {activeQuadrant !== 'info' && (
                    <button 
                      className={styles.quadrantEditBtn}
                      onClick={() => setActiveQuadrant('info')}
                    >
                      Edit
                    </button>
                  )}
                </div>
                
                {activeQuadrant === 'info' ? (
                  <div className={styles.quadrantForm}>
                    <div className={styles.formGroup}>
                      <label>First Name</label>
                      <input
                        type="text"
                        name="firstName"
                        value={infoFormData.firstName}
                        onChange={handleInfoChange}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Last Name</label>
                      <input
                        type="text"
                        name="lastName"
                        value={infoFormData.lastName}
                        onChange={handleInfoChange}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Email</label>
                      <input
                        type="email"
                        name="email"
                        value={infoFormData.email}
                        onChange={handleInfoChange}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Address</label>
                      <input
                        type="text"
                        name="userAddress"
                        value={infoFormData.userAddress}
                        onChange={handleInfoChange}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Date of Birth</label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={infoFormData.dateOfBirth}
                        onChange={handleInfoChange}
                      />
                    </div>
                    <div className={styles.quadrantActions}>
                      <button 
                        className={styles.saveBtn} 
                        onClick={handleUpdateInfo}
                      >
                        Save Changes
                      </button>
                      <button 
                        className={styles.cancelBtn} 
                        onClick={() => setActiveQuadrant(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.quadrantPreview}>
                    <p><strong>Name:</strong> {infoFormData.firstName} {infoFormData.lastName}</p>
                    <p><strong>Email:</strong> {infoFormData.email}</p>
                    <p><strong>Address:</strong> {infoFormData.userAddress || "—"}</p>
                    <p><strong>DOB:</strong> {infoFormData.dateOfBirth || "—"}</p>
                  </div>
                )}
              </div>

              {/* Quadrant 2: Update Role */}
              <div className={`${styles.quadrant} ${activeQuadrant === 'role' ? styles.activeQuadrant : ''}`}>
                <div className={styles.quadrantHeader}>
                  <h4>Update Role</h4>
                  {activeQuadrant !== 'role' && (
                    <button 
                      className={styles.quadrantEditBtn}
                      onClick={() => setActiveQuadrant('role')}
                    >
                      Edit
                    </button>
                  )}
                </div>
                
                {activeQuadrant === 'role' ? (
                  <div className={styles.quadrantForm}>
                    <div className={styles.formGroup}>
                      <label>User Role</label>
                      <select
                        name="userRole"
                        value={roleFormData.userRole}
                        onChange={handleRoleChange}
                      >
                        <option value="USER">USER</option>
                        <option value="MANAGER">MANAGER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </div>
                    <div className={styles.quadrantActions}>
                      <button 
                        className={styles.saveBtn} 
                        onClick={handleUpdateRole}
                      >
                        Update Role
                      </button>
                      <button 
                        className={styles.cancelBtn} 
                        onClick={() => setActiveQuadrant(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.quadrantPreview}>
                    <p><strong>Current Role:</strong> {roleFormData.userRole}</p>
                  </div>
                )}
              </div>

              {/* Quadrant 3: Update Activity */}
              <div className={`${styles.quadrant} ${activeQuadrant === 'activity' ? styles.activeQuadrant : ''}`}>
                <div className={styles.quadrantHeader}>
                  <h4>Update Activity</h4>
                  {activeQuadrant !== 'activity' && (
                    <button 
                      className={styles.quadrantEditBtn}
                      onClick={() => setActiveQuadrant('activity')}
                    >
                      Edit
                    </button>
                  )}
                </div>
                
                {activeQuadrant === 'activity' ? (
                  <div className={styles.quadrantForm}>
                    <div className={styles.checkboxGroup}>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          name="activityStatus"
                          checked={activityFormData.activityStatus}
                          onChange={handleActivityChange}
                        />
                        Active User
                      </label>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Activity End Date (Optional)</label>
                      <input
                        type="date"
                        name="activityEndDate"
                        value={activityFormData.activityEndDate}
                        onChange={handleActivityChange}
                      />
                      <small className={styles.helpText}>Leave empty for indefinite activity</small>
                    </div>
                    <div className={styles.quadrantActions}>
                      <button 
                        className={styles.saveBtn} 
                        onClick={handleUpdateActivity}
                      >
                        Update Activity
                      </button>
                      <button 
                        className={styles.cancelBtn} 
                        onClick={() => setActiveQuadrant(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.quadrantPreview}>
                    <p>
                      <strong>Status:</strong>{" "}
                      <span className={activityFormData.activityStatus ? styles.statusActive : styles.statusInactive}>
                        {activityFormData.activityStatus ? "Active" : "Inactive"}
                      </span>
                    </p>
                    <p><strong>End Date:</strong> {activityFormData.activityEndDate || "Indefinite"}</p>
                  </div>
                )}
              </div>

              {/* Quadrant 4: Suspend Management */}
              <div className={`${styles.quadrant} ${styles.suspendQuadrant}`}>
                <div className={styles.quadrantHeader}>
                  <h4>Suspension Management</h4>
                </div>
                
                <div className={styles.suspendActions}>
                  <button 
                    className={styles.suspendBtn}
                    onClick={handleSuspendUser}
                  >
                    Suspend User
                  </button>
                  <button 
                    className={styles.revokeBtn}
                    onClick={handleRevokeSuspension}
                  >
                    Revoke Suspension
                  </button>
                </div>
                
                {editingUser.suspended && (
                  <div className={styles.suspendedInfo}>
                    <p className={styles.suspendedWarning}>
                      ⚠️ User is currently suspended
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send Email Modal */}
      {emailUser && (
        <div className={styles.modal} onClick={() => setEmailUser(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3>
              Send Email to {emailUser.firstName} {emailUser.lastName}
            </h3>
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

      {/* Suspend User Modal */}
      {suspendUserData && (
        <div className={styles.modal} onClick={() => setSuspendUserData(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3>Suspend User</h3>
            <p className={styles.suspendInfo}>
              Suspending:{" "}
              <strong>
                {suspendUserData.firstName} {suspendUserData.lastName}
              </strong>
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