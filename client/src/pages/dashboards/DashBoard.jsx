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
import FinancialRatioDashboard from "../FinancialRatioDashboard/FinancialRatioDashboard";

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
    managers: false,
    users: false,
    sharedFeatures: false,
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

  const subsectionStyle = {
    marginTop: "12px",
    marginBottom: "8px",
    paddingLeft: "20px",
  };

  const strongStyle = {
    fontWeight: 600,
    color: "#1f2937",
  };

  const romanBoldStyle = {
    fontWeight: 600,
    color: "#1f2937",
  };

  return (
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {/* 2. Welcome */}
        <div style={accordionItemStyle}>
          <div style={accordionHeaderStyle} onClick={() => toggleSection("welcome")}>
            <span>2. Welcome</span>
            <span>{openSections.welcome ? "▼" : "▶"}</span>
          </div>
          {openSections.welcome && (
              <div style={accordionContentStyle}>
                <p>Upon first visiting the StoneLedger application, you will be met with a welcome page in which you will be provided with information about the StoneLedger application and the different tools the platform offers for its users. To navigate to the login page, please click the "Go to Login" button.</p>

                <div style={subsectionStyle}>
                  <strong style={strongStyle}>2.1 Navigating the Login Page</strong>
                  <p style={{ marginTop: "4px", marginBottom: "4px" }}>Once on the login page, you will be greeted with the following:</p>
                  <div style={{ paddingLeft: "20px" }}>
                    <div><span style={romanBoldStyle}>i. Log-in:</span> This form allows you to log in to the StoneLedger application once you have received an approval email.</div>
                    <div><span style={romanBoldStyle}>ii. Forgot Password:</span> This form allows you to reset your password in the event that you are no longer able to access your account.</div>
                    <div><span style={romanBoldStyle}>iii. Register Here:</span> This form allows you to Register with the StoneLedger application.</div>
                  </div>
                </div>

                <div style={subsectionStyle}>
                  <strong style={strongStyle}>2.2 Creating an Account</strong>
                  <p style={{ marginTop: "4px", marginBottom: "4px" }}>In order to create an account, click on the "Register Here" hyperlink to be taken to a registration form. Once on the registration form, please fill out the form with the following information:</p>
                  <div style={{ paddingLeft: "20px" }}>
                    <div><span style={romanBoldStyle}>i. First Name</span></div>
                    <div><span style={romanBoldStyle}>ii. Last Name</span></div>
                    <div><span style={romanBoldStyle}>iii. Address</span></div>
                    <div><span style={romanBoldStyle}>iv. Date of Birth (mm/dd/yyyy)</span></div>
                    <div><span style={romanBoldStyle}>v. Email</span></div>
                    <div><span style={romanBoldStyle}>vi. Password / Password Confirmation</span></div>
                    <div style={{ paddingLeft: "20px" }}>
                      <div><span style={romanBoldStyle}>a. Password must:</span></div>
                      <div style={{ paddingLeft: "20px" }}>
                        <div><span style={romanBoldStyle}>i. Be at least 8 characters</span></div>
                        <div><span style={romanBoldStyle}>ii. Start with a letter</span></div>
                        <div><span style={romanBoldStyle}>iii. Contain at least 1 letter</span></div>
                        <div><span style={romanBoldStyle}>iv. Contain at least 1 number</span></div>
                        <div><span style={romanBoldStyle}>v. Contain at least 1 special character</span></div>
                      </div>
                    </div>
                    <div><span style={romanBoldStyle}>vii. Request Role (User/Manager/Administrator)</span></div>
                  </div>
                  <p style={{ marginTop: "8px", marginBottom: "4px" }}>If you wish to clear your responses at any time, click the "Clear All Fields" button in the bottom left of the form. If you wish to return to the login screen, click the "Back to Login" hyperlink in order to return to the registration form. Upon filling out this form, you will be redirected to a Security Questions form, on this form, please fill out the following information:</p>
                  <div style={{ paddingLeft: "20px" }}>
                    <div><span style={romanBoldStyle}>i. Security Question #1</span></div>
                    <div><span style={romanBoldStyle}>ii. Security Question #1 Answer</span></div>
                  </div>
                  <p style={{ marginTop: "4px", marginBottom: "4px" }}>If you wish to cancel this process at any point, click the "Back to Login" hyperlink to return to the login page. This information will be utilized in order to recover your account at any point. Once these fields are filled out, click the "Request Access" button. After clicking the "Request Access" button, you will receive a notification that your registration was received and will be redirected back to the login page.</p>
                </div>

                <div style={subsectionStyle}>
                  <strong style={strongStyle}>2.3 Logging into the StoneLedger Application</strong>
                  <p style={{ marginTop: "4px", marginBottom: "4px" }}>In order to login to the StoneLedger application, please ensure that an approval email was issued to the email you requested access to. If you have not received an approval email, you will not be able to access the StoneLedger application. If you believe this is a mistake and have received confirmation that you should have access to the system by an administrator within your organization, please contact ashtonsingleton125@gmail.com, a StoneLedger Support Administrator.</p>
                  <p style={{ marginTop: "4px", marginBottom: "4px" }}>Upon receiving an approval email, visit the StoneLedger login page. On the login page, enter the username that was issued to you in your approval email in the "Username" field. Next, supply the password associated with your account in the "Password" field. After supplying both the username and password for the authenticated account, click the "Login" button to access the system.</p>
                </div>

                <div style={subsectionStyle}>
                  <strong style={strongStyle}>2.4 Recovering an Account</strong>
                  <p style={{ marginTop: "4px", marginBottom: "4px" }}>In order to recover a StoneLedger account, visit the login page and click the "Forgot Password" hyperlink below the "Login" button. On this page, please supply the email address associated with the account in the "Email" field, and the user ID in the "ID" field. Upon hitting next, you will be taken to a Security Questions form. Please enter the answer to the question in the "Security Question Answer" field. If the answer provided is correct, you will be taken to a page to update the password associated with the account, please provide the new password in the "New Password" field and hit the "Submit" button.</p>
                </div>
              </div>
          )}
        </div>

        {/* 3. Administration */}
        <div style={accordionItemStyle}>
          <div style={accordionHeaderStyle} onClick={() => toggleSection("admin")}>
            <span>3. Administration</span>
            <span>{openSections.admin ? "▼" : "▶"}</span>
          </div>
          {openSections.admin && (
              <div style={accordionContentStyle}>
                <p>As an Administrator, you are responsible for creating new users, suspending new users, and managing all things pertaining to user information.</p>

                <div style={subsectionStyle}>
                  <strong style={strongStyle}>3.1 Navigating the Dashboard</strong>
                  <p style={{ marginTop: "4px", marginBottom: "4px" }}>Upon logging into the administrative dashboard, you will be greeted with the following:</p>
                  <div style={{ paddingLeft: "20px" }}>
                    <div><span style={romanBoldStyle}>i. Finance Dashboard:</span> Upon immediately logging into the StoneLedger application, a dashboard will appear will all relevant financial ratios according to the balances derived from active financial accounts. In order to refresh the dashboard information, click the "Refresh" button found at the top right of the dashboard.</div>
                    <div><span style={romanBoldStyle}>ii. Settings Button:</span> Located at the top Information Bar, this will provide a dropdown menu housing all settings information with regards to the user.</div>
                    <div><span style={romanBoldStyle}>iii. Help Button:</span> Located at the top Information Bar, this will open a new popup providing information about the entire StoneLedger platform organized by topic.</div>
                    <div><span style={romanBoldStyle}>iv. User Management:</span> Located at the top of the Left Navigation Bar, this report lists all users associated with the StoneLedger platform and houses all user management functions.</div>
                    <div><span style={romanBoldStyle}>v. Create User:</span> Located in the Left Navigation Bar, this form allows administrators to create new users with the StoneLedger application.</div>
                    <div><span style={romanBoldStyle}>vi. Pending:</span> Located in the Left Navigation Bar, this report lists all pending users and houses the approval and rejection functions.</div>
                    <div><span style={romanBoldStyle}>vii. Expired Passwords:</span> Located in the Left Navigation Bar, this report provides all users with expired passwords with the StoneLedger platform.</div>
                    <div><span style={romanBoldStyle}>viii. Chart of Accounts:</span> Located in the Left Navigation Bar, this report lists all the financial accounts associated with the StoneLedger platform and houses all of account management functions.</div>
                    <div><span style={romanBoldStyle}>ix. Event Log:</span> Located in the Left Navigation Bar, this report lists all events associated with actions performed within the StoneLedger application.</div>
                    <div><span style={romanBoldStyle}>x. Logout:</span> Located at the bottom of the left Navigation Bar, this will log you out of the StoneLedger system.</div>
                  </div>
                </div>

                <div style={subsectionStyle}>
                  <strong style={strongStyle}>3.2 Managing Users</strong>
                  <p style={{ marginTop: "4px", marginBottom: "4px" }}>In order to manage users, visit the User Management form at the top of the left Navigation Bar. Upon visiting the form, a table will serialize in the center of the screen showing all users registered with the application by ID, Name, Email, Role, Status, Date of Birth, Address, and any associated Actions. To manage a given user, hover over the user you wish to manage and click the entry. Upon clicking the entry, a Manage User pop-up will appear with the following features:</p>
                  <div style={{ paddingLeft: "20px" }}>
                    <div><span style={romanBoldStyle}>i. Update Information</span></div>
                    <div style={{ paddingLeft: "20px" }}>To update the information associated with the user, click on the "Edit" button at the top right of the Update Information card. Upon clicking this button, you will be able to update the information for the following fields: First Name, Last Name, Email, Address, and Date of Birth. Click on the field(s) you wish to update and provide the updated information. Clicking the "Cancel" button at any time will nullify any changes and close the Update Information form. In order to save the changes, click the "Save Changes" button at the bottom left of the Update Information form. Changes should be reflected immediately in the User Management table.</div>
                    <div><span style={romanBoldStyle}>ii. Update Activity</span></div>
                    <div style={{ paddingLeft: "20px" }}>To update the activity associated with the user, click on the "Edit" button at the top right of the Update Activity card. Upon clicking this button, you will be able to update the following fields: Active User, and Activity End Date (Optional). For activity status, a checked-in check box means the user will be active, while an unchecked box means the user will be inactive. For the activity end date, leaving it blank means that the update will be indefinite, while assigning a date to the field means that there is an end date associated with the activity status. Clicking the "Cancel" button at any time will nullify any changes and close the Update Activity form. In order to save the changes, click the "Save Changes" button at the bottom left of the Update Activity form. Changes should be reflected immediately in the User Management table.</div>
                    <div><span style={romanBoldStyle}>iii. Update Role</span></div>
                    <div style={{ paddingLeft: "20px" }}>To update the role associated with the user, click on the "Edit" button at the top right of the Update Role card. Upon clicking this button, you will be able to update the User Role field, with a drop-down menu with the following options: USER, MANAGER, ADMINISTRATOR. To change the role, click the role you wish to assign to the user from the drop down, then click the "Update Role" button. Changes should be reflected immediately in the User Management Table. To nullify changes made, click the "Cancel" button to close the Update Role form.</div>
                    <div><span style={romanBoldStyle}>iv. Suspension Management</span></div>
                    <div style={{ paddingLeft: "20px" }}>To suspend a user, click the "Suspend User" button at the top of the Suspension Management form. Upon clicking this button, you will be able to suspend the user by defining the following fields: Start Date, Expiry Date, and Reason for Suspension. Clicking the "Cancel" button at any time will nullify changes and return you to the User Management form. In order to save changes, click the "Save Changes" button at the bottom left of the Suspend User form. Changes should be reflected immediately in the User Management table.</div>
                    <div style={{ paddingLeft: "20px", marginTop: "4px" }}>To revoke a user's suspension, click the "Revoke Suspension" button below the "Suspend User" button. This will revoke any suspensions currently associated with the user's account. Changes should be reflected immediately in the User Management table.</div>
                  </div>
                </div>

                <div style={subsectionStyle}>
                  <strong style={strongStyle}>3.3 Creating Users</strong>
                  <p style={{ marginTop: "4px", marginBottom: "4px" }}>In order to create users, visit the Create User form below "User Management" in the left Navigation Bar. Upon visiting the page, a form will appear in the center of the page to create a new user. To create a new user, please fill out the following required fields: First Name, Last Name, Email, Password, Address, Date of Birth, Role, Activity Start Date, and Activity Status. Activity End Date is not required for users whose access should be indefinite. The active user checkbox indicates whether a user is active (checked) or inactive (unchecked). To create a new user, click the "Create User" button in the bottom left of the Create User form. All changes should be reflected immediately in the User Management Table. To reset the form entries, click the "Reset Form" button in the bottom right of the Create User form.</p>
                </div>

                <div style={subsectionStyle}>
                  <strong style={strongStyle}>3.4 Managing Pending Requests</strong>
                  <p style={{ marginTop: "4px", marginBottom: "4px" }}>In order to manage pending access requests, visit the Pending form below "Create User" in the left Navigation Bar. Any pending requests to the StoneLedger system will serialize in the center area. To approve a request, click the "Approve" button on the right side of the request entry. To deny a request, click the "Reject" button to the right of the "Approve" button.</p>
                </div>

                <div style={subsectionStyle}>
                  <strong style={strongStyle}>3.5 Viewing Expired Passwords</strong>
                  <p style={{ marginTop: "4px", marginBottom: "4px" }}>In order to view users with expired passwords with the StoneLedger application, visit the Expired Passwords form found in the left navigation bar. Upon visiting this form, a table will serialize in the center of the screen in which any user with an expired password on the platform will be listed, and the associated restoration functions will be provided.</p>
                </div>

                <div style={subsectionStyle}>
                  <strong style={strongStyle}>3.6 Chart of Accounts</strong>
                  <p style={{ marginTop: "4px", marginBottom: "4px" }}>In order to view and manage the financial accounts, visit the Chart of Accounts form found in the left Navigation Bar. Upon visiting this form, a table will series in the center of the screen showing all financial accounts registered with the application. The table will contain the following fields with regards to the financial accounts: ID, Account #, Account Name, Account Description, Normal Side, Account Category, Account Subcategory, Initial Balance, Debit, Credi, Account Add Date, User ID, Order, Statement, Comments, and any associated actions. On this page you will be able to perform the following actions:</p>
                  <div style={{ paddingLeft: "20px" }}>
                    <div><span style={romanBoldStyle}>i. Adding Accounts</span></div>
                    <div style={{ paddingLeft: "20px" }}>In order to create a new financial account, click the "Add Account" button in the top right of the Chart of Accounts page. Upon clicking this button, a form will appear in the center of the page to create a new financial account. To create a new financial account, please fill out the following required fields: Account Name, Normal Side, Account Category, Account Subcategory, Initial Balance, Debit, Credit, Balance, Order, and Associated Statement. Descriptions and comments for an account are optional. To create the new financial account, click the "Create Account" button in the bottom right of the Create Account form. All changes should be reflected immediately in the Chart of Accounts. To return to the Chart of Accounts form, click the "Cancel" button to the left of the "Create Account" button and all changes will immediately be mitigated.</div>
                    <div><span style={romanBoldStyle}>ii. Editing Accounts</span></div>
                    <div style={{ paddingLeft: "20px" }}>In order to edit the information associated with a financial account, navigate to the table located in the center of the Chart of Accounts form, and scroll to the right until the "Actions" column appears. In the "Actions" column, click the "Edit" button indicated by a pencil symbol. Upon clicking this button, a form will appear in the center of the page to edit an existing financial account. On this form, you will be able to update information for the following fields: Account Name, Account Description, Normal Side, Account Category, Account Subcategory, Initial Balance, Debit, Credit, Balance, Order, Associated Statement, and Comment. Click on the field(s) you wish to update and provide the updated information. Clicking the "Cancel" button at any time will nullify any changes and close the Edit Account form. In order to save changes, click the "Save Changes" button at the bottom right of the Edit Account Form. Changes should be reflected immediately in the Chart of Accounts form.</div>
                    <div><span style={romanBoldStyle}>iii. Deactivating Accounts</span></div>
                    <div style={{ paddingLeft: "20px" }}>To deactivate a financial account, navigate to the table located in the center of the Chart of Accounts form, and scroll to the right until the "Actions" column appears. In the "Actions" column, click the "Deactivate" button indicated by a red stop icon. Upon clicking this button, the account status should read INACTIVE. Accounts that are either already deactivated or have a non-zero balance cannot be deactivated.</div>
                    <div><span style={romanBoldStyle}>iv. Activating Accounts</span></div>
                    <div style={{ paddingLeft: "20px" }}>To activate a deactivated financial account, navigate to the table located in the center of the Chart of Accounts form, and scroll to the right until the "Actions" column appears. In the "Actions" column, click the "Activate" button indicated by a check icon. Upon clicking this button, the account status should read ACTIVE. Accounts that are already active cannot be activated.</div>
                    <div><span style={romanBoldStyle}>v. Viewing Account Ledgers</span></div>
                    <div style={{ paddingLeft: "20px" }}>To view an account's ledger, navigate to the table located in the center of the Chart of Accounts form and click on either the Account # or Account Name associated with the account.</div>
                    <div><span style={romanBoldStyle}>vi. Filtering Accounts by Date</span></div>
                    <div style={{ paddingLeft: "20px" }}>To filter financial accounts by date, click the calendar icon located at the top left and a series of calendar pickers will appear. Accounts shown in the Chart of Accounts will only appear up to the filtered date, after a filtered date, or between selected dates(s).</div>
                    <div><span style={romanBoldStyle}>vii. Filtering Accounts by Token</span></div>
                    <div style={{ paddingLeft: "20px" }}>To filter financial accounts by Account Name, Account Number, Account Category, Account Subcategory, or Amount, click the "Filter" button to the left of the "Add Account" button. Upon clicking the "Filter" button, a drop down will appear where the accounts shown in the Chart of Accounts can be filtered by the aforementioned tokens.</div>
                    <div><span style={romanBoldStyle}>viii. Searching Accounts by Name or Number</span></div>
                    <div style={{ paddingLeft: "20px" }}>To search financial accounts by Account Name or Account Number, click the Search Bar found to the right of the "Calendar" button. Typing either an Account Name or Account Number into this field will filter the accounts shown in the Chart of Accounts.</div>
                  </div>
                </div>

                <div style={subsectionStyle}>
                  <strong style={strongStyle}>3.7 Event Log</strong>
                  <p style={{ marginTop: "4px", marginBottom: "4px" }}>The Event Log provides an audit trail for actions performed within the StoneLedger application. On this form, key event information such as the table impacted, event operation, date of event, before image, and after image is displayed. In order to view the Event Log, click the Event Log button in the Left Navigation Bar and a table will serialize in the viewing area with events.</p>
                </div>
              </div>
          )}
        </div>

        {/* 4. Managers */}
        <div style={accordionItemStyle}>
          <div style={accordionHeaderStyle} onClick={() => toggleSection("managers")}>
            <span>4. Managers</span>
            <span>{openSections.managers ? "▼" : "▶"}</span>
          </div>
          {openSections.managers && (
              <div style={accordionContentStyle}>
                <p>As a Manager, you are responsible for generating financial statements in addition to reviewing and managing journal entries submitted by accountants.</p>

                <div style={subsectionStyle}>
                  <strong style={strongStyle}>4.1 Navigating the Dashboard</strong>
                  <p style={{ marginTop: "4px", marginBottom: "4px" }}>Upon logging into the Manager dashboard, you will be greeted with the following:</p>
                  <div style={{ paddingLeft: "20px" }}>
                    <div><span style={romanBoldStyle}>i. Finance Dashboard:</span> Upon immediately logging into the StoneLedger application, a dashboard will appear will all relevant financial ratios according to the balances derived from active financial accounts. In order to refresh the dashboard information, click the "Refresh" button found at the top right of the dashboard.</div>
                    <div><span style={romanBoldStyle}>ii. Settings Button:</span> Located at the top Information Bar, this will provide a dropdown menu housing all settings information with regards to the user.</div>
                    <div><span style={romanBoldStyle}>iii. Help Button:</span> Located at the top Information Bar, this will open a new popup providing information about the entire StoneLedger platform organized by topic.</div>
                    <div><span style={romanBoldStyle}>iv. Notification Button:</span> Located at the top Information Bar, this will open a new popup providing information about any pending General Journal transactions.</div>
                    <div><span style={romanBoldStyle}>v. Chart of Accounts:</span> Located in the Left Navigation Bar, this report lists all the financial accounts associated with the StoneLedger platform and houses all of account management functions.</div>
                    <div><span style={romanBoldStyle}>vi. General Journal:</span> Located in the Left Navigation Bar, this page allows accountants and managers managers to view, create, and manage journal entries.</div>
                    <div><span style={romanBoldStyle}>vii. Reports:</span> Located in the Left Navigation Bar, this page allows you to generate financial reports such as a Trial Balance, Income Statement, Balance Sheet, and Retained Earnings Statement for a particular date or date range.</div>
                    <div><span style={romanBoldStyle}>viii. Email Service:</span> Located in the Left Navigation Bar, this page allows accountants and managers to send emails with regards to financial accounts listed in the Chart of Accounts.</div>
                    <div><span style={romanBoldStyle}>ix. Event Log:</span> Located in the Left Navigation Bar, this report lists all events associated with actions performed within the StoneLedger application.</div>
                  </div>
                </div>

                <div style={subsectionStyle}>
                  <strong style={strongStyle}>4.2 Reports</strong>
                  <p style={{ marginTop: "4px", marginBottom: "4px" }}>In order to generate a financial report, visit the Financial Reports page found in the Left Navigation Bar. Upon visiting this form, a window will appear in the right side of the screen, providing a preview of the form to be generated. On the left side of the screen, a series of dropdown fields will appear, allowing you to select the type of statement, any subtypes of a given statement, the date/period of information you wish to receive, and finally a download button to download the final report. To generate a financial report, select all of the required fields and click the 'Download' button.</p>
                </div>
              </div>
          )}
        </div>

        {/* 5. Users */}
        <div style={accordionItemStyle}>
          <div style={accordionHeaderStyle} onClick={() => toggleSection("users")}>
            <span>5. Users</span>
            <span>{openSections.users ? "▼" : "▶"}</span>
          </div>
          {openSections.users && (
              <div style={accordionContentStyle}>
                <p>As a User, you are responsible for journalizing transactions for approval.</p>

                <div style={subsectionStyle}>
                  <strong style={strongStyle}>5.1 Navigating the Dashboard</strong>
                  <p style={{ marginTop: "4px", marginBottom: "4px" }}>Upon logging into the User dashboard, you will be greeted with the following:</p>
                  <div style={{ paddingLeft: "20px" }}>
                    <div><span style={romanBoldStyle}>i. Finance Dashboard:</span> Upon immediately logging into the StoneLedger application, a dashboard will appear will all relevant financial ratios according to the balances derived from active financial accounts. In order to refresh the dashboard information, click the "Refresh" button found at the top right of the dashboard.</div>
                    <div><span style={romanBoldStyle}>ii. Settings Button:</span> Located at the top Information Bar, this will provide a dropdown menu housing all settings information with regards to the user.</div>
                    <div><span style={romanBoldStyle}>iii. Help Button:</span> Located at the top Information Bar, this will open a new popup providing information about the entire StoneLedger platform organized by topic.</div>
                    <div><span style={romanBoldStyle}>iv. Chart of Accounts:</span> Located in the Left Navigation Bar, this report lists all the financial accounts associated with the StoneLedger platform and houses all of account management functions.</div>
                    <div><span style={romanBoldStyle}>v. Email Service:</span> Located in the Left Navigation Bar, this page allows accountants and managers to send emails with regards to financial accounts listed in the Chart of Accounts.</div>
                    <div><span style={romanBoldStyle}>vi. Event Log:</span> Located in the Left Navigation Bar, this report lists all events associated with actions performed within the StoneLedger application.</div>
                  </div>
                </div>
              </div>
          )}
        </div>

        {/* 6. User and Manager Shared Features */}
        <div style={accordionItemStyle}>
          <div style={accordionHeaderStyle} onClick={() => toggleSection("sharedFeatures")}>
            <span>6. User and Manager Shared Features</span>
            <span>{openSections.sharedFeatures ? "▼" : "▶"}</span>
          </div>
          {openSections.sharedFeatures && (
              <div style={accordionContentStyle}>
                <div style={subsectionStyle}>
                  <strong style={strongStyle}>6.1 Chart of Accounts</strong>
                  <p style={{ marginTop: "4px", marginBottom: "4px" }}>In order to view financial accounts, visit the Chart of Accounts form found in the left Navigation Bar. Upon visiting this form, a table will series in the center of the screen showing all financial accounts registered with the application. The table will contain the following fields with regards to the financial accounts: ID, Account #, Account Name, Account Description, Normal Side, Account Category, Account Subcategory, Initial Balance, Debit, Credi, Account Add Date, User ID, Order, Statement, and Comments.</p>
                  <div style={{ paddingLeft: "20px" }}>
                    <div><span style={romanBoldStyle}>i. Viewing Account Ledgers</span></div>
                    <div style={{ paddingLeft: "20px" }}>To view an account's ledger, navigate to the table located in the center of the Chart of Accounts form and click on either the Account # or Account Name associated with the account.</div>
                    <div><span style={romanBoldStyle}>ii. Filtering Accounts by Date</span></div>
                    <div style={{ paddingLeft: "20px" }}>To filter financial accounts by date, click the calendar icon located at the top left and a series of calendar pickers will appear. Accounts shown in the Chart of Accounts will only appear up to the filtered date, after a filtered date, or between selected dates(s).</div>
                    <div><span style={romanBoldStyle}>iii. Filtering Accounts by Token</span></div>
                    <div style={{ paddingLeft: "20px" }}>To filter financial accounts by Account Name, Account Number, Account Category, Account Subcategory, or Amount, click the "Filter" button to the left of the "Add Account" button. Upon clicking the "Filter" button, a drop down will appear where the accounts shown in the Chart of Accounts can be filtered by the aforementioned tokens.</div>
                    <div><span style={romanBoldStyle}>iv. Searching Accounts by Name or Number</span></div>
                    <div style={{ paddingLeft: "20px" }}>To search financial accounts by Account Name or Account Number, click the Search Bar found to the right of the "Calendar" button. Typing either an Account Name or Account Number into this field will filter the accounts shown in the Chart of Accounts.</div>
                  </div>
                </div>

                <div style={subsectionStyle}>
                  <strong style={strongStyle}>6.2 General Journal</strong>
                  <p style={{ marginTop: "4px", marginBottom: "4px" }}>The General Journal page allows managers to view, create, approve, and reject journal entries. To access the General Journal, click the General Journal button in the Left Navigation Bar.</p>
                  <div style={{ paddingLeft: "20px" }}>
                    <div><span style={romanBoldStyle}>i. Creating a Journal Entry</span></div>
                    <div style={{ paddingLeft: "20px" }}>To create a new journal entry, click the "+ Add Transaction" button in the upper right area of the General Journal page. An Add Transaction modal will appear. Fill out the following fields: Transaction Type (Standard, Reversal, Adjustment, or Closing), one or more debit line items, one or more credit line items, a Description, and an optional Comment. Each line item requires selecting an account from the Chart of Accounts and entering either a debit or credit amount. Additional line items can be added by clicking "+ Add Line" and removed using the "✕" button on each row. The total of all debit amounts must equal the total of all credit amounts before the entry can be submitted. To cancel the entry at any time, click the "Cancel" button or the "✕" at the top right of the modal to dismiss it without saving. To submit the entry, click the "Create Transaction" button. The new entry will appear in the journal table with a status of Pending.</div>
                    <div><span style={romanBoldStyle}>ii. Managing Journal Entries</span></div>
                    <div style={{ paddingLeft: "20px" }}>Managers are responsible for reviewing journal entries submitted by accountants. While accountants can view the status of a specific journal entry, they cannot manage entries beyond submitting them. When viewing the journal as a Manager, in the Actions column of the journal table, entries with a Pending status will display an "Accept" button and a "Reject" button. To approve a pending entry, click the "Accept" button. The entry status will update to Approved, and the entry will be posted to the corresponding account ledgers. To reject a pending entry, click the "Reject" button. A modal will appear requiring a rejection reason to be entered in the Comment field. This comment is required and cannot be left blank. Click "Reject" in the modal to confirm. The entry status will update to Rejected. A rejected entry's reason can be viewed by clicking the chat icon that appears alongside the Rejected status badge.</div>
                    <div><span style={romanBoldStyle}>iii. Filtering and Searching Journal Entries</span></div>
                    <div style={{ paddingLeft: "20px" }}>To search journal entries, use the search bar at the top of the page. Entries can be searched by description, account name, or amount. To filter entries, click the "Filter" button to expand the filter panel. The available filters are Status (Pending, Approved, Rejected), Transaction Type (Standard, Reversal, Adjustment, Closing), Minimum Value, and Maximum Value. To filter by date, click the calendar icon and select a date; only entries on or before the selected date will be shown. To clear all filters, click "Clear Filters" within the filter panel. Pagination controls at the bottom of the page allow navigation between pages of entries.</div>
                    <div><span style={romanBoldStyle}>iv. Account Ledger</span></div>
                    <div style={{ paddingLeft: "20px" }}>The Account Ledger displays all approved journal entries posted to a specific account, showing a running balance after each transaction. To navigate to an account's ledger, click the account name in the Chart of Accounts or in the Account Affected column of the General Journal. The ledger displays the following columns: Date, Description, Debit, Credit, Balance, and PR (Post Reference). The Balance column reflects a running total calculated against the account's normal side. To return to the previous page, click the "← Back" button at the top left of the ledger page.</div>
                    <div><span style={romanBoldStyle}>v. Filtering and Searching the Ledger</span></div>
                    <div style={{ paddingLeft: "20px" }}>To search ledger entries, use the search bar at the top of the ledger page. Entries can be searched by description or amount. To filter by date range, click the "Filter by Date" button to expand the filter panel, then supply a From date, a To date, or both. Click "Clear All" to reset the date filters. The result count shown in the filter panel reflects the number of entries currently visible after filtering.</div>
                    <div><span style={romanBoldStyle}>vi. Using the Post Reference (PR) Link</span></div>
                    <div style={{ paddingLeft: "20px" }}>Each entry in the Account Ledger table contains a clickable Post Reference (PR) in the rightmost column. The PR is displayed as a link in the format "GJ#" (e.g., GJ2). Clicking this link will open a pop-up where all of the transaction information is displayed.</div>
                  </div>
                </div>

                <div style={subsectionStyle}>
                  <strong style={strongStyle}>6.3 Email Service</strong>
                  <p style={{ marginTop: "4px", marginBottom: "4px" }}>The Email Service allows both managers and administrators to send inquiries with regards to financial accounts. In order to send an email regarding a financial account, use the 'Select a Financial Account' dropdown to select the account to create an inquiry for. Once selected, a text box will appear in which any information with regards to this inquiry can be entered. Select the 'Clear' button to clear any text within the box, and the 'Send Email' button to send an email to a system administrator.</p>
                </div>

                <div style={subsectionStyle}>
                  <strong style={strongStyle}>6.4 Event Log</strong>
                  <p style={{ marginTop: "4px", marginBottom: "4px" }}>The Event Log provides an audit trail for actions performed within the StoneLedger application. On this form, key event information such as the table impacted, event operation, date of event, before image, and after image is displayed. In order to view the Event Log, click the Event Log button in the Left Navigation Bar and a table will serialize in the viewing area with events.</p>
                </div>
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
  const initialNav = "Financial Ratios";
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

  const handleAccountSelect = (account) => {
    setSelectedAccount(account);
    setPrevNav("Reports");
    setNav("Account Ledger");
  };

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
              <button className={`${styles.navItem} ${nav === "Financial Ratios" ? styles.activeNav : ""}`} onClick={() => setNav("Financial Ratios")}>Financial Ratios</button>
              <button className={`${styles.navItem} ${nav === "User Management" ? styles.activeNav : ""}`} onClick={() => setNav("User Management")}>User Management</button>
              <button className={`${styles.navItem} ${nav === "Create User" ? styles.activeNav : ""}`} onClick={() => setNav("Create User")}>Create New Users</button>
              <button className={`${styles.navItem} ${nav === "Pending" ? styles.activeNav : ""}`} onClick={() => setNav("Pending")}>Pending Access Requests</button>
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
              <button className={`${styles.navItem} ${nav === "Financial Ratios" ? styles.activeNav : ""}`} onClick={() => setNav("Financial Ratios")}>Financial Ratios</button>
              <button
                className={`${styles.navItem} ${(nav === "Chart of Accounts" || nav === "Account Ledger") ? styles.activeNav : ""}`}
                onClick={() => { setNav("Chart of Accounts"); setSelectedAccount(null); }}
              >Chart of Accounts</button>
              <button className={`${styles.navItem} ${nav === "General Journal" ? styles.activeNav : ""}`} onClick={() => setNav("General Journal")}>General Journal</button>
              <button className={`${styles.navItem} ${nav === "Reports" ? styles.activeNav : ""}`} onClick={() => setNav("Reports")}>Financial Reports</button>
              <button className={`${styles.navItem} ${nav === "Email Service" ? styles.activeNav : ""}`} onClick={() => setNav("Email Service")}>Email Service</button>
              <button className={`${styles.navItem} ${nav === "Event Logs" ? styles.activeNav : ""}`} onClick={() => setNav("Event Logs")}>Event Logs</button>
            </>
          )}
          {loggedInUser.role === "USER" && (
            <>
              <button className={`${styles.navItem} ${nav === "Financial Ratios" ? styles.activeNav : ""}`} onClick={() => setNav("Financial Ratios")}>Financial Ratios</button>
              <button
                className={`${styles.navItem} ${(nav === "Chart of Accounts" || nav === "Account Ledger") ? styles.activeNav : ""}`}
                onClick={() => { setNav("Chart of Accounts"); setSelectedAccount(null); }}
              >Chart of Accounts</button>
              <button className={`${styles.navItem} ${nav === "General Journal" ? styles.activeNav : ""}`} onClick={() => setNav("General Journal")}>General Journal</button>
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
        {nav === "Financial Ratios" && ["ADMINISTRATOR", "MANAGER", "USER", "ACCOUNTANT"].includes(loggedInUser.role) && (
          <section className={styles.content}>
            <FinancialRatioDashboard/>
          </section>
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
            <Reports onAccountSelect={handleAccountSelect} />
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