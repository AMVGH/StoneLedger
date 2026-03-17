import React, { useState } from "react";
import styles from "./DashBoard.module.css";
import Logo from "../../components/Logo";
import UsersTable from "../../components/UsersTable";
import PendingTable from "../../components/PendingTable";
import ExpiredPasswords from "../../components/ExpiredPasswords";
import CreateUserPage from "../../components/CreateUserPage";
import useUserContext from "../../API/UserContext";
import { useNavigate } from "react-router-dom";
import { SECURITY_QUESTIONS } from "../../utils/SecurityQuestions";

export default function DashBoard() {
  const [nav, setNav] = useState("User Management");
  const [notification, setNotification] = useState(null);
  const [resetStep, setResetStep] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [modalError, setModalError] = useState("");
  const [resetData, setResetData] = useState({
    email: "",
    userId: "",
    securityQuestion: "",
    securityAnswer: "",
    newPassword: "",
    confirmPassword: "",
  });

  const { logout } = useUserContext();
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
        id: storedUser.id,
        email: storedUser.email,
        profilePicture:
          storedUser.profilePictureUrl ||
          "https://images.rawpixel.com/image_png_800/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIzLTAxL3JtNjA5LXNvbGlkaWNvbi13LTAwMi1wLnBuZw.png",
      }
    : {
        username: "—",
        name: "—",
        role: "—",
        id: "—",
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
    notify("success", `${user.firstName} ${user.lastName}'s request has been approved and added.`);
  };

  const handleDeny = (user) => {
    notify("error", `${user.firstName} ${user.lastName}'s request has been denied and deleted.`);
  };

  const handleResetChange = (e) => {
    const { name, value } = e.target;
    setModalError("");
    setResetData((prev) => ({ ...prev, [name]: value }));
  };

  const handleVerifyIdentity = () => {
    if (resetData.email && resetData.userId) {
      setModalError("");
      setResetStep(2);
    } else {
      setModalError("Please enter both email and user ID.");
    }
  };

  const handleVerifySecurityQuestion = async () => {
    if (!resetData.securityQuestion || !resetData.securityAnswer.trim()) {
      setModalError("Please select a question and provide an answer.");
      return;
    }
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("http://localhost:8080/api/passwords/validate-security-question", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: Number(resetData.userId),
          securityQuestion: resetData.securityQuestion,
          securityQuestionAnswer: resetData.securityAnswer.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setModalError(data?.message || "Security question or answer did not match.");
        return;
      }

      if (!data.data) {
        setModalError("Security question or answer did not match.");
        return;
      }

      setModalError("");
      setResetStep(3);
    } catch {
      setModalError("Something went wrong. Please try again.");
    }
  };

  const handleResetPassword = async () => {
    if (!resetData.newPassword || !resetData.confirmPassword) {
      setModalError("Please fill in both password fields.");
      return;
    }
    if (resetData.newPassword !== resetData.confirmPassword) {
      setModalError("Passwords do not match.");
      return;
    }
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("http://localhost:8080/api/passwords/update-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: Number(resetData.userId),
          updatedPassword: resetData.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setModalError(data?.message || "Failed to reset password.");
        return;
      }

      setShowResetModal(false);
      handleCancelReset();
      notify("success", "Password has been reset successfully!");
    } catch {
      setModalError("Something went wrong. Please try again.");
    }
  };

  const handleCancelReset = () => {
    setResetStep(1);
    setModalError("");
    setResetData({
      email: "",
      userId: "",
      securityQuestion: "",
      securityAnswer: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const handleUserCreated = () => {
    notify("success", "User created successfully!");
  };

  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <Logo size={225} />
        </div>

        <nav className={styles.nav}>
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

              <div className={styles.profile}>
                <div className={styles.userInfo}>
                  <span className={styles.username}>{loggedInUser.username}</span>
                  <span className={styles.userRole}>ID: {loggedInUser.id} | {loggedInUser.role}</span>
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

        {nav === "User Management" && (
          <section className={styles.content}>
            <h2>User Management</h2>
            <p>Manage users, roles, and permissions.</p>
            <UsersTable />
          </section>
        )}

        {nav === "Create User" && (
          <section className={styles.content}>
            <CreateUserPage onUserCreated={handleUserCreated} standalone={true} />
          </section>
        )}

        {nav === "Pending" && (
          <section className={styles.content}>
            <h2>Pending Requests</h2>
            <p>Approve or deny pending user access requests.</p>
            <PendingTable onApprove={handleApprove} onDeny={handleDeny} />
          </section>
        )}

        {nav === "Expired Passwords" && (
          <section className={styles.content}>
            <h2>Expired Passwords</h2>
            <p>View and manage users with expired passwords.</p>
            <ExpiredPasswords />
          </section>
        )}

        {showResetModal && (
          <div
            className={styles.modalOverlay}
            onClick={() => { setShowResetModal(false); handleCancelReset(); }}
          >
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
                  2. Security Question
                </div>
                <div className={`${styles.step} ${resetStep >= 3 ? styles.active : ""}`}>
                  3. New Password
                </div>
              </div>

              {resetStep === 1 && (
                <div className={styles.resetCard}>
                  <h3>Step 1: Verify Identity</h3>
                  <p>Enter the email address and user ID of the account to reset.</p>
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
                  {modalError && <div className={styles.modalError}>{modalError}</div>}
                  <div className={styles.resetActions}>
                    <button className={styles.primaryBtn} onClick={handleVerifyIdentity}>
                      Continue
                    </button>
                  </div>
                </div>
              )}

              {resetStep === 2 && (
                <div className={styles.resetCard}>
                  <h3>Step 2: Security Question</h3>
                  <p>Select and answer the security question associated with this account.</p>
                  <div className={styles.resetFormGroup}>
                    <label>Security Question</label>
                    <select
                      name="securityQuestion"
                      value={resetData.securityQuestion}
                      onChange={handleResetChange}
                    >
                      <option value="">Select A Question</option>
                      {SECURITY_QUESTIONS.map((q) => (
                        <option key={q} value={q}>{q}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.resetFormGroup}>
                    <label>Answer</label>
                    <input
                      type="text"
                      name="securityAnswer"
                      value={resetData.securityAnswer}
                      onChange={handleResetChange}
                      placeholder="Enter your answer"
                    />
                  </div>
                  {modalError && <div className={styles.modalError}>{modalError}</div>}
                  <div className={styles.resetActions}>
                    <button className={styles.secondaryBtn} onClick={() => setResetStep(1)}>
                      Back
                    </button>
                    <button className={styles.primaryBtn} onClick={handleVerifySecurityQuestion}>
                      Continue
                    </button>
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
                  {modalError && <div className={styles.modalError}>{modalError}</div>}
                  <div className={styles.resetActions}>
                    <button className={styles.secondaryBtn} onClick={() => setResetStep(2)}>
                      Back
                    </button>
                    <button className={styles.primaryBtn} onClick={handleResetPassword}>
                      Reset Password
                    </button>
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