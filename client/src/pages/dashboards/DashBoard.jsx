import React, { useState, useEffect, useCallback, useRef } from "react";
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
import GeneralJournal from "../../components/GeneralJournal";
import EmailService from "../../components/EmailService";
import { SECURITY_QUESTIONS } from "../../utils/SecurityQuestions";
import Reports from "../../components/Reports";

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

// ── Notification Bell (Manager only) ──────────────────────────────────────────
function NotificationBell({ onNavigateToJournal }) {
  const [entries, setEntries] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const modalRef = useRef(null);
  const token = localStorage.getItem("authToken");

  const fetchPending = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:8080/api/transactions/get-pending-entries", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setEntries(json?.data || []);
    } catch {
      setError("Failed to load pending entries.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Poll every 30 seconds for badge count
  useEffect(() => {
    fetchPending();
    const interval = setInterval(fetchPending, 30000);
    return () => clearInterval(interval);
  }, [fetchPending]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (modalRef.current && !modalRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleOpen = () => {
    setOpen((p) => !p);
    if (!open) fetchPending();
  };

  const formatDate = (val) => {
    if (!val) return "—";
    const d = new Date(val);
    return isNaN(d) ? String(val).slice(0, 10) : d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const count = entries.length;

  return (
    <div style={{ position: "relative" }}>
      {/* Bell button */}
      <button
        title="Pending Transactions"
        onClick={handleOpen}
        style={{
          position: "relative",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: open ? "#4f46e5" : "#6b7280",
          borderRadius: "6px",
          transition: "color 0.15s",
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {count > 0 && (
          <span style={{
            position: "absolute",
            top: "-2px",
            right: "-4px",
            background: "#ef4444",
            color: "#fff",
            borderRadius: "999px",
            fontSize: "10px",
            fontWeight: 700,
            minWidth: "16px",
            height: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 4px",
            lineHeight: 1,
            boxShadow: "0 0 0 2px #fff",
            pointerEvents: "none",
          }}>
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {/* Dropdown modal */}
      {open && (
        <div
          ref={modalRef}
          style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            right: 0,
            width: "380px",
            maxHeight: "480px",
            background: "#fff",
            border: "0.5px solid #e5e7eb",
            borderRadius: "12px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px 12px",
            borderBottom: "0.5px solid #f3f4f6",
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>Pending Transactions</span>
              {count > 0 && (
                <span style={{
                  background: "#fef2f2",
                  color: "#ef4444",
                  border: "0.5px solid #fecaca",
                  borderRadius: "999px",
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "1px 7px",
                }}>
                  {count} pending
                </span>
              )}
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: "16px", lineHeight: 1, padding: "0 2px" }}
            >✕</button>
          </div>

          {/* Body */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {loading ? (
              <div style={{ padding: "32px 16px", textAlign: "center", color: "#6b7280", fontSize: "13px" }}>
                Loading…
              </div>
            ) : error ? (
              <div style={{ padding: "24px 16px", textAlign: "center", color: "#ef4444", fontSize: "13px" }}>{error}</div>
            ) : entries.length === 0 ? (
              <div style={{ padding: "40px 16px", textAlign: "center" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"
                  fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                  style={{ display: "block", margin: "0 auto 10px" }}>
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <p style={{ fontSize: "13px", color: "#9ca3af", margin: 0 }}>No pending transactions</p>
              </div>
            ) : (
              <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {entries.map((entry, idx) => (
                  <li
                    key={entry.transactionId ?? idx}
                    style={{
                      padding: "12px 16px",
                      borderBottom: idx < entries.length - 1 ? "0.5px solid #f3f4f6" : "none",
                    }}
                  >
                    {/* Row: ID + date */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#4f46e5",
                        background: "#eef2ff",
                        borderRadius: "5px",
                        padding: "2px 7px",
                      }}>
                        TXN #{entry.transactionId}
                      </span>
                      <span style={{ fontSize: "11px", color: "#9ca3af" }}>
                        {formatDate(entry.transactionAddDate)}
                      </span>
                    </div>

                    {/* Accounts */}
                    {entry.accountsImpacted && entry.accountsImpacted.length > 0 ? (
                      <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "4px" }}>
                        {entry.accountsImpacted.map((acct, ai) => (
                          <li key={ai} style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            fontSize: "12px",
                            color: "#374151",
                            background: "#f9fafb",
                            borderRadius: "5px",
                            padding: "4px 8px",
                          }}>
                            <span style={{ fontWeight: 500 }}>
                              {acct.accountNumber ? `${acct.accountNumber} — ` : ""}{acct.accountName || `Account #${acct.accountId ?? acct.id ?? "?"}`}
                            </span>
                            <div style={{ display: "flex", gap: "8px", flexShrink: 0, marginLeft: "8px" }}>
                              {acct.debit != null && Number(acct.debit) !== 0 && (
                                <span style={{ color: "#059669", fontWeight: 600 }}>
                                  Dr ${Number(acct.debit).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                </span>
                              )}
                              {acct.credit != null && Number(acct.credit) !== 0 && (
                                <span style={{ color: "#dc2626", fontWeight: 600 }}>
                                  Cr ${Number(acct.credit).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                </span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p style={{ fontSize: "12px", color: "#9ca3af", margin: 0 }}>No accounts listed.</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          {entries.length > 0 && (
            <div style={{
              padding: "10px 16px",
              borderTop: "0.5px solid #f3f4f6",
              flexShrink: 0,
              display: "flex",
              justifyContent: "flex-end",
            }}>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Help Accordion Component ─────────────────────────────────────────────────
function HelpAccordion() {
  const [openSections, setOpenSections] = useState({
    welcome: true,
    admin: false,
    manager: false,
    user: false,
    generalJournal: false,
    accountLedger: false,
  });

  const toggleSection = (section) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const accordionItemStyle = {
    borderBottom: "0.5px solid #e5e7eb",
    marginBottom: "0px",
  };

  const accordionHeaderStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 16px",
    cursor: "pointer",
    background: "#f9fafb",
    fontWeight: 600,
    fontSize: "15px",
    color: "#111827",
    borderRadius: "8px",
    marginBottom: "4px",
  };

  const accordionContentStyle = {
    padding: "16px 20px",
    fontSize: "13px",
    lineHeight: "1.6",
    color: "#374151",
    background: "#fff",
  };

  const listStyle = {
    marginTop: "8px",
    marginBottom: "8px",
    paddingLeft: "20px",
  };

  const subListStyle = {
    marginTop: "4px",
    marginBottom: "4px",
    paddingLeft: "24px",
    listStyleType: "circle",
  };

  const strongStyle = {
    fontWeight: 600,
    color: "#1f2937",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {/* 1. Welcome */}
      <div style={accordionItemStyle}>
        <div style={accordionHeaderStyle} onClick={() => toggleSection("welcome")}>
          <span>1. Welcome & Getting Started</span>
          <span>{openSections.welcome ? "▼" : "▶"}</span>
        </div>
        {openSections.welcome && (
          <div style={accordionContentStyle}>
            <p>Upon first visiting StoneLedger, you will be met with a welcome page providing information about the platform and its tools. Click the "Go to Login" button to proceed.</p>
            <p><strong style={strongStyle}>a. Navigating the Login Page</strong><br />
              The login page offers three options: Log-in (for approved users), Forgot Password (to reset access), and Register Here (to create a new account).
            </p>
            <p><strong style={strongStyle}>b. Creating an Account</strong><br />
              Click "Register Here" to fill out the registration form with: First Name, Last Name, Address, Date of Birth, Email, Password (min 8 chars, starts with a letter, contains letter, number & special char), and Requested Role (User/Manager/Administrator). After registering, you will set up two security questions and answers. Once submitted, an administrator must approve your request before you can log in.
            </p>
            <p><strong style={strongStyle}>c. Logging In</strong><br />
              After receiving an approval email, return to the login page and enter your issued username and password. Click "Login" to access your dashboard.
            </p>
            <p><strong style={strongStyle}>d. Recovering an Account</strong><br />
              Click "Forgot Password" on the login page, enter your email and user ID, then answer your security question to set a new password.
            </p>
          </div>
        )}
      </div>

      {/* 2. Administration */}
      <div style={accordionItemStyle}>
        <div style={accordionHeaderStyle} onClick={() => toggleSection("admin")}>
          <span>2. Administrator Dashboard</span>
          <span>{openSections.admin ? "▼" : "▶"}</span>
        </div>
        {openSections.admin && (
          <div style={accordionContentStyle}>
            <p><strong style={strongStyle}>a. Navigating the Dashboard</strong><br />
              Top bar: Settings (dropdown with user preferences) and Help (opens this manual). Left navigation bar includes: User Management, Create User, Pending, Expired Passwords, Chart of Accounts, Event Log, and Logout.
            </p>
            <p><strong style={strongStyle}>b. Managing Users</strong><br />
              Click on any user row in the User Management table to open the Manage User popup. Here you can: Update Information (edit name, email, address, DOB), Update Activity (set active/inactive with optional end date), Update Role (USER/MANAGER/ADMINISTRATOR), and Suspension Management (suspend with start/expiry date/reason, or revoke suspension).
            </p>
            <p><strong style={strongStyle}>c. Creating Users</strong><br />
              Fill out the Create User form with required fields: First Name, Last Name, Email, Password, Address, Date of Birth, Role, Activity Start Date, and Activity Status. Activity End Date is optional. Click "Create User" to add them immediately to the system.
            </p>
            <p><strong style={strongStyle}>d. Managing Pending Requests</strong><br />
              The Pending table shows all registration requests waiting for approval. Click "Approve" to accept or "Reject" to deny.
            </p>
            <p><strong style={strongStyle}>e. Expired Passwords</strong><br />
              This report displays users with expired passwords, including counts for total expired, recently expired, warning, and critical statuses.
            </p>
            <p><strong style={strongStyle}>f. Chart of Accounts (Admin)</strong><br />
              Full management: Add Account (fill out required fields: Account Name, Normal Side, Category, Subcategory, Initial Balance, Debit, Credit, Balance, Order, Statement), Edit Account (pencil icon), Deactivate/Activate accounts (non-zero balance accounts cannot be deactivated), View Account Ledger (eye icon), Filter by date or by token, and Search by name/number.
            </p>
            <p><strong style={strongStyle}>g. Event Log</strong><br />
              Displays an audit trail with table impacted, operation, date, before image, and after image for all actions in the system.
            </p>
          </div>
        )}
      </div>

      {/* 3. Managers */}
      <div style={accordionItemStyle}>
        <div style={accordionHeaderStyle} onClick={() => toggleSection("manager")}>
          <span>3. Manager Dashboard</span>
          <span>{openSections.manager ? "▼" : "▶"}</span>
        </div>
        {openSections.manager && (
          <div style={accordionContentStyle}>
            <p><strong style={strongStyle}>a. Navigating the Dashboard</strong><br />
              Manager dashboard includes: Settings (top bar), Help (this manual), Chart of Accounts, Event Log, and General Journal in the left navigation bar.
            </p>
            <p><strong style={strongStyle}>b. Chart of Accounts (Manager)</strong><br />
              Read-only view of all financial accounts with fields: ID, Account #, Name, Description, Normal Side, Category, Subcategory, Initial Balance, Debit, Credit, Add Date, User ID, Order, Statement, Comments.
            </p>
            <p><strong style={strongStyle}>c. General Journal (Manager)</strong><br />
              Managers can view all journal entries and approve or reject pending entries. To approve, click "Accept" – the entry status changes to Approved and posts to ledgers. To reject, click "Reject" and provide a required rejection reason. Filter entries by Status, Transaction Type, Value range, or date. Search by description, account name, or amount.
            </p>
            <p><strong style={strongStyle}>d. Event Log (Manager)</strong><br />
              Same audit trail as Administrator, showing all system events.
            </p>
          </div>
        )}
      </div>

      {/* 4. Users (Accountants) */}
      <div style={accordionItemStyle}>
        <div style={accordionHeaderStyle} onClick={() => toggleSection("user")}>
          <span>4. User (Accountant) Dashboard</span>
          <span>{openSections.user ? "▼" : "▶"}</span>
        </div>
        {openSections.user && (
          <div style={accordionContentStyle}>
            <p><strong style={strongStyle}>a. Navigating the Dashboard</strong><br />
              User dashboard includes: Settings, Help, Chart of Accounts (read-only), Event Log, and General Journal.
            </p>
            <p><strong style={strongStyle}>b. General Journal (User)</strong><br />
              Users can create, view, and monitor journal entries. Click "+ Add Transaction" to open the transaction modal. Fill out: Transaction Type (Standard, Reversal, Adjustment, Closing), at least one debit and one credit line item, Description, and optional Comment. Debits and credits must balance (total debit = total credit). Attach source documents (PDF, Word, Excel, CSV, JPG, PNG) if needed. Click "Create Transaction" to submit – the entry will have a Pending status awaiting manager review. Rejected entries display a chat icon showing the rejection reason.
            </p>
            <p><strong style={strongStyle}>c. Viewing Entry Status</strong><br />
              Status badges: Pending (awaiting review), Approved (posted to ledgers), Rejected (denied with reason). All entries appear in a unified table.
            </p>
            <p><strong style={strongStyle}>d. Filtering & Searching Journal Entries</strong><br />
              Use the search bar (description, account name, amount) or click "Filter" to filter by Status, Transaction Type, Min/Max Value, or date range.
            </p>
            <p><strong style={strongStyle}>e. Account Ledger</strong><br />
              Click any account name in Chart of Accounts or in the Account Affected column of the General Journal to view the Account Ledger. The ledger shows summary cards (Normal Side, Initial Balance, Total Debit, Total Credit, Current Balance) and a transaction table with Date, Description, Debit, Credit, Balance, and PR (Post Reference) columns. The Balance column shows a running total based on the account's normal side.
            </p>
            <p><strong style={strongStyle}>f. Post Reference (PR) Links</strong><br />
              Click any "GJ#" link in the PR column to navigate directly to the specific journal entry that created that ledger posting in the General Journal.
            </p>
            <p><strong style={strongStyle}>g. Filtering the Ledger</strong><br />
              Use the search bar to find entries by description or amount. Click "Filter by Date" to set a From date, To date, or both. Click "Clear All" to reset filters.
            </p>
          </div>
        )}
      </div>

      {/* 5. General Journal (Combined) */}
      <div style={accordionItemStyle}>
        <div style={accordionHeaderStyle} onClick={() => toggleSection("generalJournal")}>
          <span>5. General Journal – Full Reference</span>
          <span>{openSections.generalJournal ? "▼" : "▶"}</span>
        </div>
        {openSections.generalJournal && (
          <div style={accordionContentStyle}>
            <p><strong style={strongStyle}>Creating a Journal Entry</strong><br />
              Click "+ Add Transaction". Fill in Transaction Type, debit/credit line items (add/remove lines as needed), Description, and optional Comment. The total of all debits must equal total credits. Attach a source document (optional). Click "Create Transaction" to submit. Entries cannot be deleted after submission.
            </p>
            <p><strong style={strongStyle}>Attaching Source Documents</strong><br />
              Supported formats: PDF, Word (.doc, .docx), Excel (.xls, .xlsx), CSV, JPG, PNG. Attached file names appear in the Attachment column.
            </p>
            <p><strong style={strongStyle}>Approving & Rejecting (Managers)</strong><br />
              Pending entries show "Accept" and "Reject" buttons in the Actions column. Accepting changes status to Approved and posts to ledgers. Rejecting requires a reason (cannot be blank) and changes status to Rejected.
            </p>
            <p><strong style={strongStyle}>Viewing Entry Status</strong><br />
              Status badges: Pending (yellow), Approved (green), Rejected (red). Rejected entries show a chat icon – click to view the rejection reason.
            </p>
            <p><strong style={strongStyle}>Filtering & Searching</strong><br />
              Search by description, account name, or amount. Filter by Status, Transaction Type, Min/Max Value, or date (calendar icon). Click "Clear Filters" to reset. Pagination controls allow navigation between pages.
            </p>
          </div>
        )}
      </div>

      {/* 6. Account Ledger (Combined) */}
      <div style={accordionItemStyle}>
        <div style={accordionHeaderStyle} onClick={() => toggleSection("accountLedger")}>
          <span>6. Account Ledger – Full Reference</span>
          <span>{openSections.accountLedger ? "▼" : "▶"}</span>
        </div>
        {openSections.accountLedger && (
          <div style={accordionContentStyle}>
            <p><strong style={strongStyle}>Viewing an Account Ledger</strong><br />
              Navigate by clicking an account name in the Chart of Accounts or in the Account Affected column of the General Journal. Use the "← Back" button to return.
            </p>
            <p><strong style={strongStyle}>Ledger Content</strong><br />
              Summary cards at the top show: Normal Side, Initial Balance, Total Debit, Total Credit, and Current Balance. The transaction table includes columns: Date, Description, Debit, Credit, Balance (running total), and PR (Post Reference).
            </p>
            <p><strong style={strongStyle}>Post Reference (PR) Links</strong><br />
              Each "GJ#" link (e.g., GJ1) is clickable and opens the General Journal to the exact page containing the originating journal entry.
            </p>
            <p><strong style={strongStyle}>Filtering & Searching the Ledger</strong><br />
              Use the search bar to filter entries by description or amount. Click "Filter by Date" to set a date range (From date, To date, or both). Click "Clear All" to reset date filters. The result count shows how many entries are currently visible.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function DashBoard() {
  const { user, getLoggedInUserInfo } = useUserContext();
  const token = localStorage.getItem("authToken");
  const initialUser = (() => { try { return JSON.parse(localStorage.getItem("user")) || null; } catch { return null; } })();
  const initialNav = (initialUser?.userRole === "MANAGER" || initialUser?.userRole === "ACCOUNTANT" || initialUser?.userRole === "USER") ? "Chart of Accounts" : "User Management";
  const [nav, setNav] = useState(initialNav);
  const [prevNav, setPrevNav] = useState("Chart of Accounts");

  useEffect(() => {
    if (!user && token) {
      getLoggedInUserInfo(token).catch(() => {});
    }
  }, [user, token, getLoggedInUserInfo]);

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
          {(loggedInUser.role === "MANAGER") && (
            <>
              <button
                className={`${styles.navItem} ${(nav === "Chart of Accounts" || nav === "Account Ledger") ? styles.activeNav : ""}`}
                onClick={() => { setNav("Chart of Accounts"); setSelectedAccount(null); }}
              >Chart of Accounts</button>
              <button className={`${styles.navItem} ${nav === "General Journal" ? styles.activeNav : ""}`} onClick={() => setNav("General Journal")}>General Journal</button>
              <button className={`${styles.navItem} ${nav === "Reports" ? styles.activeNav : ""}`} onClick={() => setNav("Reports")}>Reports</button>
              <button className={`${styles.navItem} ${nav === "Email Service" ? styles.activeNav : ""}`} onClick={() => setNav("Email Service")}>Email Service</button>
              <button className={`${styles.navItem} ${nav === "Event Logs" ? styles.activeNav : ""}`} onClick={() => setNav("Event Logs")}>Event Logs</button>
            </>
          )}
          {loggedInUser.role === "USER" && (
            <>
              <button
                className={`${styles.navItem} ${(nav === "Chart of Accounts" || nav === "Account Ledger") ? styles.activeNav : ""}`}
                onClick={() => { setNav("Chart of Accounts"); setSelectedAccount(null); }}
              >Chart of Accounts</button>
              <button className={`${styles.navItem} ${nav === "General Journal" ? styles.activeNav : ""}`} onClick={() => setNav("General Journal")}>General Journal</button>
              <button className={`${styles.navItem} ${nav === "Reports" ? styles.activeNav : ""}`} onClick={() => setNav("Reports")}>Reports</button>
              <button className={`${styles.navItem} ${nav === "Email Service" ? styles.activeNav : ""}`} onClick={() => setNav("Email Service")}>Email Service</button>
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

              {/* Notification Bell — managers only */}
              {loggedInUser.role === "MANAGER" && (
                <NotificationBell
                  onNavigateToJournal={() => setNav("General Journal")}
                />
              )}

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

        {nav === "User Management" && ["ADMINISTRATOR"].includes(loggedInUser.role) && (
          <section className={styles.content}><h2>User Management</h2><p>Manage users, roles, and permissions.</p><UsersTable /></section>
        )}
        {nav === "Create User" && loggedInUser.role === "ADMINISTRATOR" && (
          <section className={styles.content}><CreateUserPage onUserCreated={handleUserCreated} standalone={true} /></section>
        )}
        {nav === "Pending" && loggedInUser.role === "ADMINISTRATOR" && (
          <section className={styles.content}><h2>Pending Requests</h2><p>Approve or deny pending user access requests.</p><PendingTable onApprove={handleApprove} onDeny={handleDeny} /></section>
        )}
        {nav === "Expired Passwords" && ["ADMINISTRATOR"].includes(loggedInUser.role) && (
          <section className={styles.content}><h2>Expired Passwords</h2><p>View and manage users with expired passwords.</p><ExpiredPasswords /></section>
        )}

        {nav === "Chart of Accounts" && ["ADMINISTRATOR", "MANAGER", "USER"].includes(loggedInUser.role) && (
          <section className={styles.content}>
            <h2>Chart of Accounts</h2>
            <p>View and manage the chart of accounts.</p>
            <ChartOfAccounts
              onAccountSelect={(account) => {
                setSelectedAccount(account);
                setPrevNav("Chart of Accounts");
                setNav("Account Ledger");
              }}
              onEditAccount={loggedInUser.role === "ADMINISTRATOR" ? (account) => setEditingAccount(account) : undefined}
              refreshTrigger={refreshAccounts}
              userRole={loggedInUser.role}
            />
          </section>
        )}

        {nav === "Account Ledger" && ["ADMINISTRATOR", "MANAGER", "USER"].includes(loggedInUser.role) && (
          <section className={styles.content}>
            <AccountLedger account={selectedAccount} onBack={() => setNav(prevNav)} />
          </section>
        )}

        {nav === "Event Logs" && ["ADMINISTRATOR", "MANAGER", "USER"].includes(loggedInUser.role) && (
          <section className={styles.content}><h2>Event Logs</h2><p>View system event logs for auditing and monitoring.</p><EventLogs /></section>
        )}

        {nav === "General Journal" && ["MANAGER", "USER"].includes(loggedInUser.role) && (
          <section className={styles.content}>
            <h2>General Journal</h2>
            <p>View and manage journal entries.</p>
            <GeneralJournal
              userRole={loggedInUser?.role}
              onAccountSelect={(account) => {
                setSelectedAccount(account);
                setPrevNav("General Journal");
                setNav("Account Ledger");
              }}
            />
          </section>
        )}

        {nav === "Reports" && ["MANAGER", "USER"].includes(loggedInUser.role) && (
          <section className={styles.content}>
            <h2>Reports</h2>
            <p>Generate financial reports including Trial Balance, Income Statement, Balance Sheet, and Retained Earnings Statement.</p>
            <Reports />
          </section>
        )}

        {nav === "Email Service" && ["ADMINISTRATOR", "MANAGER", "USER"].includes(loggedInUser.role) && (
          <section className={styles.content}>
            <h2>Email Service</h2>
            <p>Configure and manage email service features.</p>
            <EmailService />
          </section>
        )}

        {/* Updated Help Modal with Accordion */}
        {showHelp && (
          <div className={styles.modalOverlay} onClick={() => setShowHelp(false)}>
            <div
              className={styles.resetModal}
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: "700px", maxHeight: "85vh", display: "flex", flexDirection: "column", overflow: "hidden" }}
            >
              <div className={styles.resetModalHeader}>
                <h2>Official StoneLedger User Manual</h2>
                <button className={styles.modalCloseBtn} onClick={() => setShowHelp(false)}>✕</button>
              </div>
              <div style={{ padding: "0 4px", overflowY: "auto", flex: 1 }}>
                <div style={{ padding: "20px 20px 24px 20px" }}>
                  <p style={{ fontSize: "14px", lineHeight: "1.6", color: "#4b5563", marginBottom: "20px" }}>
                    Welcome to StoneLedger, a comprehensive online accounting platform designed for financial administrators,
                    managers, and accountants alike. StoneLedger offers tailored dashboards providing only the exact tools you need,
                    right when you need them. This manual is designed to guide you through effectively navigating and utilizing the StoneLedger platform.
                  </p>
                  <HelpAccordion />
                </div>
              </div>
            </div>
          </div>
        )}

        {showResetModal && ["ADMINISTRATOR", "MANAGER", "USER"].includes(loggedInUser.role) && (
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