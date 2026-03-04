import React, { useState, useEffect } from "react";
import styles from "./DashBoard.module.css";
import Logo from "../../components/Logo";
import UsersTable from "../../components/UsersTable";
import PendingTable from "../../components/PendingTable";
import ExpiredPasswords from "../../components/ExpiredPasswords";
import useUserContext from "../../API/UserContext";
import usePasswordContext from "../../API/Passwords";

export default function DashBoard() {
  const [nav, setNav] = useState("User Management");
  const [notification, setNotification] = useState(null);
  const [resetStep, setResetStep] = useState(1);
  const [resetData, setResetData] = useState({
    email: "",
    userId: "",
    securityAnswer1: "",
    securityAnswer2: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Get user context for logged-in user info
  const { user, getLoggedInUserInfo, loading: userLoading } = useUserContext();
  const { updatePassword } = usePasswordContext();

  // Fetch logged-in user info on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      getLoggedInUserInfo(token).catch(err => {
        console.error("Failed to fetch user info:", err);
      });
    }
  }, [getLoggedInUserInfo]);

  // Mock security questions (will be replaced when security questions endpoint is implemented)
  const securityQuestions = {
    question1: "What is your mother's maiden name?",
    question2: "What was the name of your first pet?",
  };

  // Use actual user data or default values if still loading
  const loggedInUser = user ? {
    username: user.username,
    name: `${user.firstName} ${user.lastName}`,
    role: user.userRole,
    email: user.email,
    profilePicture: user.profilePictureUrl || "https://images.rawpixel.com/image_png_800/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIzLTAxL3JtNjA5LXNvbGlkaWNvbi13LTAwMi1wLnBuZw.png",
  } : {
    username: "Loading...",
    name: "Loading...",
    role: "...",
    email: "",
    profilePicture: "https://images.rawpixel.com/image_png_800/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIzLTAxL3JtNjA5LXNvbGlkaWNvbi13LTAwMi1wLnBuZw.png",
  };

  const handleApprove = (user) => {
    setNotification({
      type: "success",
      message: `${user.name} has been approved and added to the user table.`,
    });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleDeny = (user) => {
    setNotification({
      type: "error",
      message: `${user.name}'s request has been denied and deleted.`,
    });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleResetChange = (e) => {
    const { name, value } = e.target;
    setResetData((prev) => ({ ...prev, [name]: value }));
  };

  const handleVerifyIdentity = () => {
    // Mock validation - just check fields are filled
    if (resetData.email && resetData.userId) {
      setResetStep(2);
    } else {
      setNotification({
        type: "error",
        message: "Please enter both email and user ID.",
      });
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleVerifySecurityQuestions = () => {
    if (resetData.securityAnswer1 && resetData.securityAnswer2) {
      setResetStep(3);
    } else {
      setNotification({
        type: "error",
        message: "Please answer both security questions.",
      });
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleResetPassword = async () => {
    if (!resetData.newPassword || !resetData.confirmPassword) {
      setNotification({
        type: "error",
        message: "Please fill in both password fields.",
      });
      setTimeout(() => setNotification(null), 4000);
      return;
    }
    if (resetData.newPassword !== resetData.confirmPassword) {
      setNotification({
        type: "error",
        message: "Passwords do not match.",
      });
      setTimeout(() => setNotification(null), 4000);
      return;
    }
    
    try {
      const token = localStorage.getItem('authToken');
      await updatePassword(resetData.userId, resetData.newPassword, token);
      setNotification({
        type: "success",
        message: "Password has been reset successfully!",
      });
      setTimeout(() => setNotification(null), 4000);
      setResetStep(1);
      setResetData({
        email: "",
        userId: "",
        securityAnswer1: "",
        securityAnswer2: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      setNotification({
        type: "error",
        message: error.response?.data?.message || "Failed to reset password.",
      });
      setTimeout(() => setNotification(null), 4000);
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

  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <Logo size={40} />
          <span className={styles.brandText}>StoneLedger</span>
        </div>

        <nav className={styles.nav}>
          <button className={styles.navItem} onClick={() => setNav("User Management")}>User Management</button>
          <button className={styles.navItem} onClick={() => setNav("Pending")}>Pending</button>
          <button className={styles.navItem} onClick={() => setNav("Expired Passwords")}>Expired Passwords</button>
        </nav>
        <div className={styles.navSpacer}></div>
        <nav className={styles.navBottom}>
          <button className={styles.navItem} onClick={() => { setNav("Reset Password"); setResetStep(1); }}>Reset Password</button>
        </nav>
      </aside>

      <main className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.searchWrap}>
            <input className={styles.search} placeholder="Search users, requests..." />
          </div>

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

        {nav === "Reset Password" && (
          <section className={styles.content}>
            <h2>Reset User Password</h2>
            <p>Help users reset their password by verifying their identity.</p>
            
            <div className={styles.resetContainer}>
              <div className={styles.stepIndicator}>
                <div className={`${styles.step} ${resetStep >= 1 ? styles.active : ""}`}>1. Verify Identity</div>
                <div className={`${styles.step} ${resetStep >= 2 ? styles.active : ""}`}>2. Security Questions</div>
                <div className={`${styles.step} ${resetStep >= 3 ? styles.active : ""}`}>3. New Password</div>
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
                    <button className={styles.secondaryBtn} onClick={() => setResetStep(1)}>
                      Back
                    </button>
                    <button className={styles.primaryBtn} onClick={handleVerifySecurityQuestions}>
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
          </section>
        )}
      </main>
    </div>
  );
}

