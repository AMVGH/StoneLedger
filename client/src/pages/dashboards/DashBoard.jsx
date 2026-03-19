import React, { useState } from "react";
import styles from "./DashBoard.module.css";
import Logo from "../../components/Logo";
import UsersTable from "../../components/UsersTable";
import PendingTable from "../../components/PendingTable";
import ExpiredPasswords from "../../components/ExpiredPasswords";
import CreateUserPage from "../../components/CreateUserPage";
import useUserContext from "../../API/UserContext";
import usePasswordContext from "../../API/Passwords";
import { useNavigate } from "react-router-dom";
import ChartOfAccounts from "../../components/ChartOfAccounts";
import EventLogs from "../../components/EventLogs";

export default function DashBoard() {
  const [nav, setNav] = useState("User Management");
  const [notification, setNotification] = useState(null);
  const [resetStep, setResetStep] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetData, setResetData] = useState({
    email: "",
    userId: "",
    securityAnswer1: "",
    securityAnswer2: "",
    newPassword: "",
    confirmPassword: "",
  });

  const { logout } = useUserContext();
  const { updatePassword } = usePasswordContext();
  const navigate = useNavigate();

  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  })();

  const loggedInUser = storedUser
    ? {
        username: storedUser.username,
        name: `${storedUser.firstName} ${storedUser.lastName}`,
        role: storedUser.userRole,
        email: storedUser.email,
        profilePicture:
          storedUser.profilePictureUrl ||
          "https://images.rawpixel.com/image_png_800/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIzLTAxL3JtNjA5LXNvbGlkaWNvbi13LTAwMi1wLnBuZw.png",
      }
    : {
        username: "—",
        name: "—",
        role: "—",
        email: "",
        profilePicture:
          "https://images.rawpixel.com/image_png_800/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIzLTAxL3JtNjA5LXNvbGlkaWNvbi13LTAwMi1wLnBuZw.png",
      };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    logout();
    navigate("/");
  };

  const notify = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleApprove = (user) => {
    notify("success", `${user.name} has been approved and added to the user table.`);
  };

  const handleDeny = (user) => {
    notify("error", `${user.name}'s request has been denied and deleted.`);
  };

  // ── Reset Password ──
  const handleResetChange = (e) => {
    const { name, value } = e.target;
    setResetData((prev) => ({ ...prev, [name]: value }));
  };

  const handleVerifyIdentity = () => {
    if (resetData.email && resetData.userId) {
      setResetStep(2);
    } else {
      notify("error", "Please enter both email and user ID.");
    }
  };

  const handleVerifySecurityQuestions = () => {
    if (resetData.securityAnswer1 && resetData.securityAnswer2) {
      setResetStep(3);
    } else {
      notify("error", "Please answer both security questions.");
    }
  };

  const handleResetPassword = async () => {
    if (!resetData.newPassword || !resetData.confirmPassword) {
      notify("error", "Please fill in both password fields.");
      return;
    }
    if (resetData.newPassword !== resetData.confirmPassword) {
      notify("error", "Passwords do not match.");
      return;
    }
    try {
      const token = localStorage.getItem("authToken");
      await updatePassword(resetData.userId, resetData.newPassword, token);
      notify("success", "Password has been reset successfully!");
      handleCancelReset();
    } catch (error) {
      notify("error", error.response?.data?.message || "Failed to reset password.");
    }
  };

  const handleCancelReset = () => {
    setResetStep(1);
    setResetData({
      email: "",
      userId: "",
      securityAnswer1: "",
      securityAnswer2: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const securityQuestions = {
    question1: "What is your mother's maiden name?",
    question2: "What was the name of your first pet?",
  };

  const handleUserCreated = () => {
    notify("success", "User created successfully!");
    // Optionally switch to User Management tab to see the new user
    // setNav("User Management");
  };

  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <Logo size={225} />
        </div>

        <nav className={styles.nav}>
          {loggedInUser.role === "ADMINISTRATOR" && (
            <>
              <button
                className={`${styles.navItem} ${nav === "User Management" ? styles.activeNav : ""}`}
                onClick={() => setNav("User Management")}
              >
                User Management
              </button>
              <button
                className={`${styles.navItem} ${nav === "Create User" ? styles.activeNav : ""}`}
                onClick={() => setNav("Create User")}
              >
                Create User
              </button>
              <button
                className={`${styles.navItem} ${nav === "Pending" ? styles.activeNav : ""}`}
                onClick={() => setNav("Pending")}
              >
                Pending
              </button>
              <button
                className={`${styles.navItem} ${nav === "Expired Passwords" ? styles.activeNav : ""}`}
                onClick={() => setNav("Expired Passwords")}
              >
                Expired Passwords
              </button>
        
          
          
            <button
              className={`${styles.navItem} ${nav === "Chart of Accounts" ? styles.activeNav : ""}`}
              onClick={() => setNav("Chart of Accounts")}
            >
              Chart of Accounts
            </button>    
              <button
              className={`${styles.navItem} ${nav === "Event Logs" ? styles.activeNav : ""}`}
              onClick={() => setNav("Event Logs")}
            >
              Event Logs
            </button>    
            </>
        )}
      
        </nav>

        <div className={styles.navSpacer}></div>

        <nav className={styles.navBottom}>
          <button className={styles.navItem} onClick={handleLogout}>
            Logout
          </button>
        </nav>
      </aside>

      <main className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.topbarContent}>
            <div className={styles.spacer}></div>

            <div className={styles.rightSection}>
              <div className={styles.settingsWrap}>
                <button
                  className={styles.iconBtn}
                  title="Settings"
                  onClick={() => setShowSettings((prev) => !prev)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                </button>

                {showSettings && (
                  <div className={styles.settingsDropdown}>
                    <button
                      className={styles.settingsItem}
                      onClick={() => {
                        setShowResetModal(true);
                        setResetStep(1);
                        setShowSettings(false);
                      }}
                    >
                      Reset Password
                    </button>
                  </div>
                )}
              </div>

              <button className={styles.iconBtn} title="Help">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </button>

              <div className={styles.profile}>
                <div className={styles.userInfo}>
                  <span className={styles.username}>{loggedInUser.username}</span>
                  <span className={styles.userRole}>{loggedInUser.role}</span>
                </div>
                <div className={styles.avatar}>
                  <img
                    src={loggedInUser.profilePicture}
                    alt={loggedInUser.name}
                    className={styles.avatarImg}
                  />
                </div>
              </div>
            </div>
          </div>
        </header>

        {notification && (
          <div className={`${styles.notification} ${styles[notification.type]}`}>
            {notification.message}
          </div>
        )}

        {nav === "User Management" && loggedInUser.role === "ADMINISTRATOR" && (
          <section className={styles.content}>
            <h2>User Management</h2>
            <p>Manage users, roles, and permissions.</p>
            <UsersTable />
          </section>
        )}

        {nav === "Create User" && loggedInUser.role === "ADMINISTRATOR" && (
          <section className={styles.content}>
            <CreateUserPage
              onUserCreated={handleUserCreated}
              standalone={true}
            />
          </section>
        )}

        {nav === "Pending" && loggedInUser.role === "ADMINISTRATOR" && (
          <section className={styles.content}>
            <h2>Pending Requests</h2>
            <p>Approve or deny pending user access requests.</p>
            <PendingTable onApprove={handleApprove} onDeny={handleDeny} />
          </section>
        )}

        {nav === "Expired Passwords" && loggedInUser.role === "ADMINISTRATOR" && (
          <section className={styles.content}>
            <h2>Expired Passwords</h2>
            <p>View and manage users with expired passwords.</p>
            <ExpiredPasswords />
          </section>
        )}

        {nav === "Chart of Accounts" && loggedInUser.role === "ADMINISTRATOR" && (
          <section className={styles.content}>
            <h2>Chart of Accounts</h2>
            <p>View and manage the chart of accounts.</p>
            <ChartOfAccounts />
          </section>
        )}

        {nav === "Event Logs" && loggedInUser.role === "ADMINISTRATOR" && (
          <section className={styles.content}>
            <h2>Event Logs</h2>
            <p>View system event logs for auditing and monitoring.</p>
            <EventLogs />
          </section>
        )}

        {/* Reset Password Modal */}
        {showResetModal && loggedInUser.role === "Admin" && (
          <div className={styles.modalOverlay} onClick={() => { setShowResetModal(false); handleCancelReset(); }}>
            <div className={styles.resetModal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.resetModalHeader}>
                <h2>Reset User Password</h2>
                <button
                  className={styles.modalCloseBtn}
                  onClick={() => { setShowResetModal(false); handleCancelReset(); }}
                >
                  ✕
                </button>
              </div>
              <p>Help users reset their password by verifying their identity.</p>

              <div className={styles.stepIndicator}>
                <div className={`${styles.step} ${resetStep >= 1 ? styles.active : ""}`}>
                  1. Verify Identity
                </div>
                <div className={`${styles.step} ${resetStep >= 2 ? styles.active : ""}`}>
                  2. Security Questions
                </div>
                <div className={`${styles.step} ${resetStep >= 3 ? styles.active : ""}`}>
                  3. New Password
                </div>
              </div>

              {resetStep === 1 && (
                <div className={styles.resetCard}>
                  <h3>Step 1: Verify Identity</h3>
                  <p>Enter the email address and user ID provided when the credentials were created.</p>
                  <div className={styles.resetFormGroup}>
                    <label>Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={resetData.email}
                      onChange={handleResetChange}
                      placeholder="Enter user's email address"
                    />
                  </div>
                  <div className={styles.resetFormGroup}>
                    <label>User ID</label>
                    <input
                      type="text"
                      name="userId"
                      value={resetData.userId}
                      onChange={handleResetChange}
                      placeholder="Enter user ID"
                    />
                  </div>
                  <div className={styles.resetActions}>
                    <button className={styles.primaryBtn} onClick={handleVerifyIdentity}>
                      Continue
                    </button>
                  </div>
                </div>
              )}

              {resetStep === 2 && (
                <div className={styles.resetCard}>
                  <h3>Step 2: Security Questions</h3>
                  <p>Answer the security questions to verify your identity.</p>
                  <div className={styles.resetFormGroup}>
                    <label>{securityQuestions.question1}</label>
                    <input
                      type="text"
                      name="securityAnswer1"
                      value={resetData.securityAnswer1}
                      onChange={handleResetChange}
                      placeholder="Your answer"
                    />
                  </div>
                  <div className={styles.resetFormGroup}>
                    <label>{securityQuestions.question2}</label>
                    <input
                      type="text"
                      name="securityAnswer2"
                      value={resetData.securityAnswer2}
                      onChange={handleResetChange}
                      placeholder="Your answer"
                    />
                  </div>
                  <div className={styles.resetActions}>
                    <button className={styles.secondaryBtn} onClick={() => setResetStep(1)}>Back</button>
                    <button className={styles.primaryBtn} onClick={handleVerifySecurityQuestions}>Continue</button>
                  </div>
                </div>
              )}

              {resetStep === 3 && (
                <div className={styles.resetCard}>
                  <h3>Step 3: Set New Password</h3>
                  <p>Create a new password for the user.</p>
                  <div className={styles.resetFormGroup}>
                    <label>New Password</label>
                    <input
                      type="password"
                      name="newPassword"
                      value={resetData.newPassword}
                      onChange={handleResetChange}
                      placeholder="Enter new password"
                    />
                  </div>
                  <div className={styles.resetFormGroup}>
                    <label>Confirm Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={resetData.confirmPassword}
                      onChange={handleResetChange}
                      placeholder="Confirm new password"
                    />
                  </div>
                  <div className={styles.resetActions}>
                    <button className={styles.secondaryBtn} onClick={() => setResetStep(2)}>Back</button>
                    <button className={styles.primaryBtn} onClick={handleResetPassword}>Reset Password</button>
                  </div>
                </div>
              )}

              {resetStep > 1 && (
                <button className={styles.cancelResetBtn} onClick={handleCancelReset}>
                  Cancel and Start Over
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}