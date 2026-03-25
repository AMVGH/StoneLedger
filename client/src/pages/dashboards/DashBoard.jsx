import React, { useState } from "react";
import styles from "./DashBoard.module.css";
import Logo from "../../components/Logo";
import UsersTable from "../../components/UsersTable";
import PendingTable from "../../components/PendingTable";
import ExpiredPasswords from "../../components/ExpiredPasswords";
import CreateUserPage from "../../components/CreateUserPage";
import useUserContext from "../../API/UserContext";
import { useNavigate } from "react-router-dom";
import ChartOfAccounts from "../../components/ChartOfAccounts";
import EventLogs from "../../components/EventLogs";
import AccountLedger from "../../components/AccountLedger";
import { SECURITY_QUESTIONS } from "../../utils/SecurityQuestions";

const ACCOUNT_CATEGORIES = ["ASSET", "EXPENSE", "LIABILITY", "EQUITY", "REVENUE"];
const ACCOUNT_SUBCATEGORIES = ["SHORT_TERM", "LONG_TERM", "NONE"];
const NORMAL_SIDES = ["LEFT", "RIGHT"];
const ASSOCIATED_STATEMENTS = [
  "INCOME_STATEMENT",
  "BALANCE_SHEET",
  "RETAINED_EARNINGS_STATEMENT",
];

function EditAccountModal({ account, onClose, onSuccess }) {
  const { generateAccountNumber, editFinancialAccount } = useUserContext();
  const [form, setForm] = React.useState({
    accountNumber: String(account.accountNumber),
    accountName: account.accountName || "",
    accountDescription: account.accountDescription || "",
    normalSide: account.normalSide || "",
    accountCategory: account.accountCategory || "",
    accountSubcategory: account.accountSubcategory || "",
    initialBalance: account.initialBalance ?? "",
    debit: account.debit ?? "",
    credit: account.credit ?? "",
    balance: account.balance ?? "",
    order: account.order ?? "",
    associatedStatement: account.associatedStatement || "",
    comment: account.comment || "",
  });
  const [generating, setGenerating] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState("");

  const token = localStorage.getItem("authToken");
  const storedUser = (() => { try { return JSON.parse(localStorage.getItem("user")) || null; } catch { return null; } })();
  const loggedInUserId = storedUser?.id ?? null;

  const handleCategoryChange = async (e) => {
    const category = e.target.value;
    setForm((prev) => ({ ...prev, accountCategory: category, accountNumber: "" }));
    if (!category) return;
    setGenerating(true);
    setFormError("");
    try {
      const generated = await generateAccountNumber(category, token);
      setForm((prev) => ({ ...prev, accountNumber: String(generated) }));
    } catch {
      setFormError("Failed to generate account number.");
    } finally {
      setGenerating(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setFormError("");
    const required = ["accountNumber", "accountName", "accountDescription", "normalSide",
      "accountCategory", "accountSubcategory", "initialBalance", "debit", "credit", "balance",
      "order", "associatedStatement"];
    for (const field of required) {
      if (!form[field] && form[field] !== 0) {
        setFormError(`Please fill in all required fields. Missing: ${field}`);
        return;
      }
    }
    setSubmitting(true);
    try {
      await editFinancialAccount({
        id: account.id,
        accountNumber: Number(form.accountNumber),
        accountName: form.accountName,
        accountDescription: form.accountDescription,
        normalSide: form.normalSide,
        accountCategory: form.accountCategory,
        accountSubcategory: form.accountSubcategory,
        initialBalance: parseFloat(Number(form.initialBalance).toFixed(2)),
        debit: parseFloat(Number(form.debit).toFixed(2)),
        credit: parseFloat(Number(form.credit).toFixed(2)),
        balance: parseFloat(Number(form.balance).toFixed(2)),
        userId: loggedInUserId,
        order: Number(form.order),
        associatedStatement: form.associatedStatement,
        comment: form.comment,
      }, token);
      onSuccess();
      onClose();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || "Failed to update account.");
    } finally {
      setSubmitting(false);
    }
  };

  const overlayStyle = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" };
  const modalStyle = { background: "#fff", borderRadius: "12px", border: "0.5px solid #e5e7eb", boxShadow: "0 8px 32px rgba(0,0,0,0.12)", width: "680px", maxWidth: "95vw", maxHeight: "90vh", display: "flex", flexDirection: "column" };
  const headerStyle = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px 14px", borderBottom: "0.5px solid #f3f4f6" };
  const bodyStyle = { padding: "20px 24px", overflowY: "auto", flex: 1 };
  const footerStyle = { display: "flex", justifyContent: "flex-end", gap: "10px", padding: "14px 24px 18px", borderTop: "0.5px solid #f3f4f6" };
  const gridStyle = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" };
  const groupStyle = { display: "flex", flexDirection: "column", gap: "5px" };
  const labelStyle = { fontSize: "12px", fontWeight: 500, color: "#374151" };
  const inputStyle = { padding: "7px 10px", border: "0.5px solid #d1d5db", borderRadius: "6px", fontSize: "13px", color: "#111827", background: "#fff", outline: "none", width: "100%", boxSizing: "border-box" };
  const selectStyle = { ...inputStyle, cursor: "pointer" };
  const cancelBtnStyle = { padding: "7px 16px", border: "0.5px solid #d1d5db", borderRadius: "6px", background: "#fff", fontSize: "13px", color: "#374151", cursor: "pointer" };
  const submitBtnStyle = { padding: "7px 18px", border: "none", borderRadius: "6px", background: "#4f46e5", color: "#fff", fontSize: "13px", cursor: "pointer", fontWeight: 500 };
  const errorStyle = { background: "#fef2f2", border: "0.5px solid #fecaca", color: "#b91c1c", borderRadius: "6px", padding: "8px 12px", fontSize: "13px", marginBottom: "14px" };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 500 }}>Edit Account</h3>
          <button style={{ background: "none", border: "none", fontSize: "16px", cursor: "pointer", color: "#6b7280" }} onClick={onClose}>✕</button>
        </div>
        <div style={bodyStyle}>
          {formError && <div style={errorStyle}>{formError}</div>}
          <div style={gridStyle}>
            <div style={groupStyle}><label style={labelStyle}>Account Category *</label>
              <select style={selectStyle} name="accountCategory" value={form.accountCategory} onChange={handleCategoryChange}>
                <option value="">Select category</option>
                {ACCOUNT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={groupStyle}><label style={labelStyle}>Account Number</label>
              <input style={{ ...inputStyle, background: "#f9fafb", color: "#6b7280" }} type="text" value={generating ? "Generating…" : form.accountNumber} readOnly />
            </div>
            <div style={groupStyle}><label style={labelStyle}>Account Name *</label>
              <input style={inputStyle} type="text" name="accountName" value={form.accountName} onChange={handleChange} placeholder="e.g. Cash" />
            </div>
            <div style={groupStyle}><label style={labelStyle}>Account Description *</label>
              <input style={inputStyle} type="text" name="accountDescription" value={form.accountDescription} onChange={handleChange} placeholder="Brief description" />
            </div>
            <div style={groupStyle}><label style={labelStyle}>Normal Side *</label>
              <select style={selectStyle} name="normalSide" value={form.normalSide} onChange={handleChange}>
                <option value="">Select side</option>
                {NORMAL_SIDES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={groupStyle}><label style={labelStyle}>Account Subcategory *</label>
              <select style={selectStyle} name="accountSubcategory" value={form.accountSubcategory} onChange={handleChange}>
                <option value="">Select subcategory</option>
                {ACCOUNT_SUBCATEGORIES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={groupStyle}><label style={labelStyle}>Associated Statement *</label>
              <select style={selectStyle} name="associatedStatement" value={form.associatedStatement} onChange={handleChange}>
                <option value="">Select statement</option>
                {ASSOCIATED_STATEMENTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={groupStyle}><label style={labelStyle}>Order *</label>
              <input style={inputStyle} type="number" name="order" value={form.order} onChange={handleChange} placeholder="Display order" />
            </div>
            <div style={groupStyle}><label style={labelStyle}>Initial Balance *</label>
              <input style={inputStyle} type="number" name="initialBalance" value={form.initialBalance} onChange={handleChange} placeholder="0.00" step="0.01" />
            </div>
            <div style={groupStyle}><label style={labelStyle}>Debit *</label>
              <input style={inputStyle} type="number" name="debit" value={form.debit} onChange={handleChange} placeholder="0.00" step="0.01" />
            </div>
            <div style={groupStyle}><label style={labelStyle}>Credit *</label>
              <input style={inputStyle} type="number" name="credit" value={form.credit} onChange={handleChange} placeholder="0.00" step="0.01" />
            </div>
            <div style={groupStyle}><label style={labelStyle}>Balance *</label>
              <input style={inputStyle} type="number" name="balance" value={form.balance} onChange={handleChange} placeholder="0.00" step="0.01" />
            </div>
            <div style={{ ...groupStyle, gridColumn: "1 / -1" }}><label style={labelStyle}>Comment</label>
              <input style={inputStyle} type="text" name="comment" value={form.comment} onChange={handleChange} placeholder="Optional comment" />
            </div>
          </div>
        </div>
        <div style={footerStyle}>
          <button style={cancelBtnStyle} onClick={onClose} disabled={submitting}>Cancel</button>
          <button style={submitBtnStyle} onClick={handleSubmit} disabled={submitting || generating}>
            {submitting ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DashBoard() {
  const initialUser = (() => { try { return JSON.parse(localStorage.getItem("user")) || null; } catch { return null; } })();
  const initialNav = (initialUser?.userRole === "MANAGER" || initialUser?.userRole === "ACCOUNTANT") ? "Chart of Accounts" : "User Management";
  const [nav, setNav] = useState(initialNav);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [editingAccount, setEditingAccount] = useState(null);
  const [refreshAccounts, setRefreshAccounts] = useState(0);
  const [notification, setNotification] = useState(null);
  const [resetStep, setResetStep] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [modalError, setModalError] = useState("");
  const [resetData, setResetData] = useState({
    email: "", userId: "", securityQuestion: "",
    securityAnswer: "", newPassword: "", confirmPassword: "",
  });

  const { logout } = useUserContext();
  const navigate = useNavigate();

  const storedUser = (() => {
    try { return JSON.parse(localStorage.getItem("user")) || null; } catch { return null; }
  })();

  const loggedInUser = storedUser
    ? {
        username: storedUser.username,
        name: `${storedUser.firstName} ${storedUser.lastName}`,
        role: storedUser.userRole,
        id: storedUser.id,
        email: storedUser.email,
        profilePicture: storedUser.profilePictureUrl ||
          "https://images.rawpixel.com/image_png_800/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIzLTAxL3JtNjA5LXNvbGlkaWNvbi13LTAwMi1wLnBuZw.png",
      }
    : {
        username: "—", name: "—", role: "—", id: "—", email: "",
        profilePicture: "https://images.rawpixel.com/image_png_800/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIzLTAxL3JtNjA5LXNvbGlkaWNvbi13LTAwMi1wLnBuZw.png",
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

  const handleApprove = (user) => notify("success", `${user.firstName} ${user.lastName}'s request has been approved and added.`);
  const handleDeny = (user) => notify("error", `${user.firstName} ${user.lastName}'s request has been denied and deleted.`);

  const handleResetChange = (e) => {
    const { name, value } = e.target;
    setModalError("");
    setResetData((prev) => ({ ...prev, [name]: value }));
  };

  const handleVerifyIdentity = () => {
    if (resetData.email && resetData.userId) { setModalError(""); setResetStep(2); }
    else setModalError("Please enter both email and user ID.");
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
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          id: Number(resetData.userId),
          securityQuestion: resetData.securityQuestion,
          securityQuestionAnswer: resetData.securityAnswer.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.data) { setModalError(data?.message || "Security question or answer did not match."); return; }
      setModalError("");
      setResetStep(3);
    } catch { setModalError("Something went wrong. Please try again."); }
  };

  const handleResetPassword = async () => {
    if (!resetData.newPassword || !resetData.confirmPassword) { setModalError("Please fill in both password fields."); return; }
    if (resetData.newPassword !== resetData.confirmPassword) { setModalError("Passwords do not match."); return; }
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("http://localhost:8080/api/passwords/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: Number(resetData.userId), updatedPassword: resetData.newPassword }),
      });
      const data = await response.json();
      if (!response.ok) { setModalError(data?.message || "Failed to reset password."); return; }
      notify("success", "Password has been reset successfully!");
      setShowResetModal(false);
      handleCancelReset();
    } catch { setModalError("Something went wrong. Please try again."); }
  };

  const handleCancelReset = () => {
    setResetStep(1);
    setModalError("");
    setResetData({ email: "", userId: "", securityQuestion: "", securityAnswer: "", newPassword: "", confirmPassword: "" });
  };

  const handleUserCreated = () => notify("success", "User created successfully!");

  return (
    <div className={styles.page}>
      {editingAccount && (
        <EditAccountModal
          account={editingAccount}
          onClose={() => setEditingAccount(null)}
          onSuccess={() => {
            setEditingAccount(null);
            setRefreshAccounts((prev) => prev + 1);
          }}
        />
      )}

      <aside className={styles.sidebar}>
        <div className={styles.brand}><Logo size={225} /></div>
        <nav className={styles.nav}>
          {loggedInUser.role === "ADMINISTRATOR" && (
            <>
              <button className={`${styles.navItem} ${nav === "User Management" ? styles.activeNav : ""}`} onClick={() => setNav("User Management")}>User Management</button>
              <button className={`${styles.navItem} ${nav === "Create User" ? styles.activeNav : ""}`} onClick={() => setNav("Create User")}>Create User</button>
              <button className={`${styles.navItem} ${nav === "Pending" ? styles.activeNav : ""}`} onClick={() => setNav("Pending")}>Pending</button>
              <button className={`${styles.navItem} ${nav === "Expired Passwords" ? styles.activeNav : ""}`} onClick={() => setNav("Expired Passwords")}>Expired Passwords</button>
              <button
                className={`${styles.navItem} ${(nav === "Chart of Accounts" || nav === "Account Ledger") ? styles.activeNav : ""}`}
                onClick={() => { setNav("Chart of Accounts"); setSelectedAccount(null); }}
              >Chart of Accounts</button>
              <button className={`${styles.navItem} ${nav === "Event Logs" ? styles.activeNav : ""}`} onClick={() => setNav("Event Logs")}>Event Logs</button>
            </>
          )}
          {(loggedInUser.role === "MANAGER" || loggedInUser.role === "ACCOUNTANT") && (
            <>
              <button
                className={`${styles.navItem} ${(nav === "Chart of Accounts" || nav === "Account Ledger") ? styles.activeNav : ""}`}
                onClick={() => { setNav("Chart of Accounts"); setSelectedAccount(null); }}
              >Chart of Accounts</button>
              <button className={`${styles.navItem} ${nav === "Event Logs" ? styles.activeNav : ""}`} onClick={() => setNav("Event Logs")}>Event Logs</button>
            </>
          )}
        </nav>
        <div className={styles.navSpacer}></div>
        <nav className={styles.navBottom}>
          <button className={styles.navItem} onClick={handleLogout}>Logout</button>
        </nav>
      </aside>

      <main className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.topbarContent}>
            <div className={styles.spacer}></div>
            <div className={styles.rightSection}>
              <div className={styles.settingsWrap}>
                <button className={styles.iconBtn} title="Settings" onClick={() => setShowSettings((prev) => !prev)}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                </button>
                {showSettings && (
                  <div className={styles.settingsDropdown}>
                    <button className={styles.settingsItem} onClick={() => { setShowResetModal(true); setResetStep(1); setShowSettings(false); }}>Reset Password</button>
                  </div>
                )}
              </div>
              <button className={styles.iconBtn} title="Help" onClick={() => setShowHelp(true)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </button>
              <div className={styles.profile}>
                <div className={styles.userInfo}>
                  <span className={styles.username}>{loggedInUser.username}</span>
                  <span className={styles.userRole}>ID: {loggedInUser.id} | {loggedInUser.role}</span>
                </div>
                <div className={styles.avatar}>
                  <img src={loggedInUser.profilePicture} alt={loggedInUser.name} className={styles.avatarImg} />
                </div>
              </div>
            </div>
          </div>
        </header>

        {notification && (
          <div className={`${styles.notification} ${styles[notification.type]}`}>{notification.message}</div>
        )}

        {nav === "User Management" && ["ADMINISTRATOR", "MANAGER", "ACCOUNTANT"].includes(loggedInUser.role) && (
          <section className={styles.content}><h2>User Management</h2><p>Manage users, roles, and permissions.</p><UsersTable /></section>
        )}
        {nav === "Create User" && loggedInUser.role === "ADMINISTRATOR" && (
          <section className={styles.content}><CreateUserPage onUserCreated={handleUserCreated} standalone={true} /></section>
        )}
        {nav === "Pending" && loggedInUser.role === "ADMINISTRATOR" && (
          <section className={styles.content}><h2>Pending Requests</h2><p>Approve or deny pending user access requests.</p><PendingTable onApprove={handleApprove} onDeny={handleDeny} /></section>
        )}
        {nav === "Expired Passwords" && ["ADMINISTRATOR", "MANAGER", "ACCOUNTANT"].includes(loggedInUser.role) && (
          <section className={styles.content}><h2>Expired Passwords</h2><p>View and manage users with expired passwords.</p><ExpiredPasswords /></section>
        )}

        {nav === "Chart of Accounts" && ["ADMINISTRATOR", "MANAGER", "ACCOUNTANT"].includes(loggedInUser.role) && (
          <section className={styles.content}>
            <h2>Chart of Accounts</h2>
            <p>View and manage the chart of accounts.</p>
            <ChartOfAccounts
              onAccountSelect={(account) => {
                setSelectedAccount(account);
                setNav("Account Ledger");
              }}
              onEditAccount={loggedInUser.role === "ADMINISTRATOR" ? (account) => setEditingAccount(account) : undefined}
              refreshTrigger={refreshAccounts}
              userRole={loggedInUser.role}
            />
          </section>
        )}

        {nav === "Account Ledger" && ["ADMINISTRATOR", "MANAGER", "ACCOUNTANT"].includes(loggedInUser.role) && (
          <section className={styles.content}>
            <AccountLedger account={selectedAccount} onBack={() => setNav("Chart of Accounts")} />
          </section>
        )}
        {nav === "Event Logs" && ["ADMINISTRATOR", "MANAGER", "ACCOUNTANT"].includes(loggedInUser.role) && (
          <section className={styles.content}><h2>Event Logs</h2><p>View system event logs for auditing and monitoring.</p><EventLogs /></section>
        )}

        {showHelp && (
          <div className={styles.modalOverlay} onClick={() => setShowHelp(false)}>
            <div className={styles.resetModal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: "540px" }}>
              <div className={styles.resetModalHeader}>
                <h2>Official StoneLedger User Manual</h2>
                <button className={styles.modalCloseBtn} onClick={() => setShowHelp(false)}>✕</button>
              </div>
              <div style={{ padding: "20px 24px", fontSize: "14px", lineHeight: "1.7", color: "#374151" }}>
                <p>Welcome to StoneLedger, a comprehensive online accounting platform designed for financial administrators, managers, and accountants alike. StoneLedger offers tailored dashboards providing only the exact tools you need, right when you need them. This manual is designed to guide you through effectively navigating and utilizing the StoneLedger platform.</p>
                <p style={{ marginTop: "14px" }}><a href="https://kennesawedu-my.sharepoint.com/:w:/r/personal/avalen31_students_kennesaw_edu/Documents/School%20Work/Spring%202026/SWE%204713%20(SWE%20Application%20Domain)/Project%20Documents/Group%204%20User%20Manual.docx?d=w826c53ead27c44a181f78d63acd99c92&csf=1&web=1&e=8n5maV" target="_blank" rel="noopener noreferrer" style={{ color: "#4f46e5", textDecoration: "underline" }}>View Full User Manual</a></p>
              </div>
            </div>
          </div>
        )}

        {showResetModal && ["ADMINISTRATOR", "MANAGER", "ACCOUNTANT"].includes(loggedInUser.role) && (
          <div className={styles.modalOverlay} onClick={() => { setShowResetModal(false); handleCancelReset(); }}>
            <div className={styles.resetModal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.resetModalHeader}>
                <h2>Reset User Password</h2>
                <button className={styles.modalCloseBtn} onClick={() => { setShowResetModal(false); handleCancelReset(); }}>✕</button>
              </div>
              <p>Help users reset their password by verifying their identity.</p>
              <div className={styles.stepIndicator}>
                <div className={`${styles.step} ${resetStep >= 1 ? styles.active : ""}`}>1. Verify Identity</div>
                <div className={`${styles.step} ${resetStep >= 2 ? styles.active : ""}`}>2. Security Question</div>
                <div className={`${styles.step} ${resetStep >= 3 ? styles.active : ""}`}>3. New Password</div>
              </div>
              {resetStep === 1 && (
                <div className={styles.resetCard}>
                  <h3>Step 1: Verify Identity</h3>
                  <p>Enter the email address and user ID of the account to reset.</p>
                  <div className={styles.resetFormGroup}><label>Email Address</label><input type="email" name="email" value={resetData.email} onChange={handleResetChange} placeholder="Enter user's email address" /></div>
                  <div className={styles.resetFormGroup}><label>User ID</label><input type="text" name="userId" value={resetData.userId} onChange={handleResetChange} placeholder="Enter user ID" /></div>
                  {modalError && <div className={styles.modalError}>{modalError}</div>}
                  <div className={styles.resetActions}><button className={styles.primaryBtn} onClick={handleVerifyIdentity}>Continue</button></div>
                </div>
              )}
              {resetStep === 2 && (
                <div className={styles.resetCard}>
                  <h3>Step 2: Security Question</h3>
                  <p>Select and answer the security question associated with this account.</p>
                  <div className={styles.resetFormGroup}>
                    <label>Security Question</label>
                    <select name="securityQuestion" value={resetData.securityQuestion} onChange={handleResetChange}>
                      <option value="">Select A Question</option>
                      {SECURITY_QUESTIONS.map((q) => <option key={q} value={q}>{q}</option>)}
                    </select>
                  </div>
                  <div className={styles.resetFormGroup}><label>Answer</label><input type="text" name="securityAnswer" value={resetData.securityAnswer} onChange={handleResetChange} placeholder="Enter your answer" /></div>
                  {modalError && <div className={styles.modalError}>{modalError}</div>}
                  <div className={styles.resetActions}>
                    <button className={styles.secondaryBtn} onClick={() => { setModalError(""); setResetStep(1); }}>Back</button>
                    <button className={styles.primaryBtn} onClick={handleVerifySecurityQuestion}>Continue</button>
                  </div>
                </div>
              )}
              {resetStep === 3 && (
                <div className={styles.resetCard}>
                  <h3>Step 3: Set New Password</h3>
                  <p>Create a new password for the user.</p>
                  <div className={styles.resetFormGroup}><label>New Password</label><input type="password" name="newPassword" value={resetData.newPassword} onChange={handleResetChange} placeholder="Enter new password" /></div>
                  <div className={styles.resetFormGroup}><label>Confirm Password</label><input type="password" name="confirmPassword" value={resetData.confirmPassword} onChange={handleResetChange} placeholder="Confirm new password" /></div>
                  {modalError && <div className={styles.modalError}>{modalError}</div>}
                  <div className={styles.resetActions}>
                    <button className={styles.secondaryBtn} onClick={() => { setModalError(""); setResetStep(2); }}>Back</button>
                    <button className={styles.primaryBtn} onClick={handleResetPassword}>Reset Password</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}