import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
import styles from "./ChartOfAccounts.module.css";
import useUserContext from "../API/UserContext";

// ── Enum options ────────────────────────────────────────────
const ACCOUNT_CATEGORIES = ["ASSET", "EXPENSE", "LIABILITY", "EQUITY", "REVENUE"];
const ACCOUNT_SUBCATEGORIES = ["SHORT_TERM", "LONG_TERM", "NONE"];
const NORMAL_SIDES = ["LEFT", "RIGHT"];
const ASSOCIATED_STATEMENTS = [
  "INCOME_STATEMENT",
  "BALANCE_SHEET",
  "RETAINED_EARNINGS_STATEMENT",
];

const EMPTY_FORM = {
  accountNumber: "",
  accountName: "",
  accountDescription: "",
  normalSide: "",
  accountCategory: "",
  accountSubcategory: "",
  initialBalance: "",
  debit: "",
  credit: "",
  balance: "",
  order: "",
  associatedStatement: "",
  comment: "",
};

function formatDateTime(value) {
  if (!value) return "—";
  if (Array.isArray(value)) {
    const [year, month, day] = value;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  return String(value).slice(0, 10);
}

function toDateStr(value) {
  return formatDateTime(value);
}

// ── Add Account Modal ───────────────────────────────────────
function AddAccountModal({ onClose, onSuccess }) {
  const { generateAccountNumber, createFinancialAccount } = useUserContext();

  const [form, setForm] = useState(EMPTY_FORM);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const token = localStorage.getItem("authToken");
  const storedUser = (() => {
    try { return JSON.parse(localStorage.getItem("user")) || null; } catch { return null; }
  })();
  const loggedInUserId = storedUser?.id ?? null;

  // Auto-generate account number when category changes
  const handleCategoryChange = async (e) => {
    const category = e.target.value;
    setForm((prev) => ({ ...prev, accountCategory: category, accountNumber: "" }));
    if (!category) return;
    setGenerating(true);
    setFormError("");
    try {
      const generated = await generateAccountNumber(category, token);
      setForm((prev) => ({ ...prev, accountNumber: String(generated) }));
    } catch (err) {
      setFormError("Failed to generate account number. Please try again.");
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

    // Basic required field validation
    const required = [
      "accountNumber", "accountName", "accountDescription",
      "normalSide", "accountCategory", "accountSubcategory",
      "initialBalance", "debit", "credit", "balance",
      "order", "associatedStatement",
    ];
    for (const field of required) {
      if (!form[field] && form[field] !== 0) {
        setFormError(`Please fill in all required fields. Missing: ${field}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      await createFinancialAccount(
        {
          accountNumber: Number(form.accountNumber),
          accountName: form.accountName,
          accountDescription: form.accountDescription,
          normalSide: form.normalSide,
          accountCategory: form.accountCategory,
          accountSubcategory: form.accountSubcategory,
          initialBalance: Number(form.initialBalance),
          debit: Number(form.debit),
          credit: Number(form.credit),
          balance: Number(form.balance),
          userId: loggedInUserId,
          order: Number(form.order),
          associatedStatement: form.associatedStatement,
          comment: form.comment,
        },
        token
      );
      onSuccess();
      onClose();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || "Failed to create account.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Add Account</h3>
          <button type="button" className={styles.modalClose} onClick={onClose}>✕</button>
        </div>

        <div className={styles.modalBody}>
          {formError && <div className={styles.modalError}>{formError}</div>}

          <div className={styles.formGrid}>
            {/* Account Category — first so number can auto-generate */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Account Category <span className={styles.required}>*</span></label>
              <select
                name="accountCategory"
                className={styles.formSelect}
                value={form.accountCategory}
                onChange={handleCategoryChange}
              >
                <option value="">Select category</option>
                {ACCOUNT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Account Number — auto-generated, read-only */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Account Number</label>
              <input
                type="text"
                className={styles.formInput}
                value={generating ? "Generating…" : form.accountNumber}
                readOnly
                style={{ background: "var(--color-background-secondary, #f9fafb)", color: "var(--color-text-secondary, #6b7280)" }}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Account Name <span className={styles.required}>*</span></label>
              <input
                type="text"
                name="accountName"
                className={styles.formInput}
                placeholder="e.g. Cash"
                value={form.accountName}
                onChange={handleChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Account Description <span className={styles.required}>*</span></label>
              <input
                type="text"
                name="accountDescription"
                className={styles.formInput}
                placeholder="Brief description"
                value={form.accountDescription}
                onChange={handleChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Normal Side <span className={styles.required}>*</span></label>
              <select
                name="normalSide"
                className={styles.formSelect}
                value={form.normalSide}
                onChange={handleChange}
              >
                <option value="">Select side</option>
                {NORMAL_SIDES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Account Subcategory <span className={styles.required}>*</span></label>
              <select
                name="accountSubcategory"
                className={styles.formSelect}
                value={form.accountSubcategory}
                onChange={handleChange}
              >
                <option value="">Select subcategory</option>
                {ACCOUNT_SUBCATEGORIES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Associated Statement <span className={styles.required}>*</span></label>
              <select
                name="associatedStatement"
                className={styles.formSelect}
                value={form.associatedStatement}
                onChange={handleChange}
              >
                <option value="">Select statement</option>
                {ASSOCIATED_STATEMENTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Order <span className={styles.required}>*</span></label>
              <input
                type="number"
                name="order"
                className={styles.formInput}
                placeholder="Display order"
                value={form.order}
                onChange={handleChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Initial Balance <span className={styles.required}>*</span></label>
              <input
                type="number"
                name="initialBalance"
                className={styles.formInput}
                placeholder="0.00"
                step="0.01"
                value={form.initialBalance}
                onChange={handleChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Debit <span className={styles.required}>*</span></label>
              <input
                type="number"
                name="debit"
                className={styles.formInput}
                placeholder="0.00"
                step="0.01"
                value={form.debit}
                onChange={handleChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Credit <span className={styles.required}>*</span></label>
              <input
                type="number"
                name="credit"
                className={styles.formInput}
                placeholder="0.00"
                step="0.01"
                value={form.credit}
                onChange={handleChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Balance <span className={styles.required}>*</span></label>
              <input
                type="number"
                name="balance"
                className={styles.formInput}
                placeholder="0.00"
                step="0.01"
                value={form.balance}
                onChange={handleChange}
              />
            </div>

            {/* Comment spans full width */}
            <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
              <label className={styles.formLabel}>Comment</label>
              <input
                type="text"
                name="comment"
                className={styles.formInput}
                placeholder="Optional comment"
                value={form.comment}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="button" className={styles.submitBtn} onClick={handleSubmit} disabled={submitting || generating}>
            {submitting ? "Creating…" : "Create Account"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────
export default function ChartOfAccounts({ onAccountSelect }) {
  const { getFinancialAccounts } = useUserContext();

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const [selectedDate, setSelectedDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showDatePopup, setShowDatePopup] = useState(false);
  const [filters, setFilters] = useState({
    accountName: "",
    accountNumber: "",
    category: "",
    subcategory: "",
    minBalance: "",
    maxBalance: "",
  });

  const popupRef = useRef(null);

  // ── Fetch accounts ──────────────────────────────────────────
  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("authToken");
      const data = await getFinancialAccounts(token);
      setAccounts(data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to fetch accounts.");
    } finally {
      setLoading(false);
    }
  }, [getFinancialAccounts]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // ── Close date popup on outside click ──────────────────────
  useEffect(() => {
    function handleClickOutside(e) {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setShowDatePopup(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Derived filter options ──────────────────────────────────
  const categories = useMemo(
    () => [...new Set(accounts.map((a) => a.accountCategory))],
    [accounts]
  );

  const subcategories = useMemo(() => {
    const source = filters.category
      ? accounts.filter((a) => a.accountCategory === filters.category)
      : accounts;
    return [...new Set(source.map((a) => a.accountSubcategory))];
  }, [accounts, filters.category]);

  // ── Filtered accounts ───────────────────────────────────────
  const filteredAccounts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const minBalance = Number(filters.minBalance);
    const maxBalance = Number(filters.maxBalance);

    return accounts.filter((acct) => {
      const dateStr = toDateStr(acct.accountAddDate);
      if (selectedDate && dateStr > selectedDate) return false;

      if (query) {
        const matchesSearch = [
          acct.accountNumber,
          acct.accountName,
          acct.accountDescription,
          acct.accountCategory,
          acct.accountSubcategory,
          acct.associatedStatement,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
        if (!matchesSearch) return false;
      }

      if (
        filters.accountName &&
        !acct.accountName?.toLowerCase().includes(filters.accountName.toLowerCase())
      ) return false;

      if (
        filters.accountNumber &&
        !String(acct.accountNumber).includes(filters.accountNumber)
      ) return false;

      if (filters.category && acct.accountCategory !== filters.category) return false;
      if (filters.subcategory && acct.accountSubcategory !== filters.subcategory) return false;

      const bal = Number(acct.balance);
      if (!Number.isNaN(minBalance) && filters.minBalance !== "" && bal < minBalance) return false;
      if (!Number.isNaN(maxBalance) && filters.maxBalance !== "" && bal > maxBalance) return false;

      return true;
    });
  }, [accounts, searchTerm, selectedDate, filters]);

  const handleFilterInput = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "category" && value !== prev.category) next.subcategory = "";
      return next;
    });
  };

  const clearFilters = () => {
    setFilters({
      accountName: "",
      accountNumber: "",
      category: "",
      subcategory: "",
      minBalance: "",
      maxBalance: "",
    });
  };

  const handleOpenLedger = (account) => {
    if (typeof onAccountSelect === "function") onAccountSelect(account);
  };

  const fmt = (val) =>
    Number(val).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // ── Render states ───────────────────────────────────────────
  if (loading) {
    return (
      <div className={styles.page}>
        <section className={styles.content}>
          <p style={{ padding: "2rem", color: "var(--color-text-secondary, #6b7280)" }}>
            Loading accounts…
          </p>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <section className={styles.content}>
          <p style={{ padding: "2rem", color: "red" }}>{error}</p>
          <button onClick={fetchAccounts}>Retry</button>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {showAddModal && (
        <AddAccountModal
          onClose={() => setShowAddModal(false)}
          onSuccess={fetchAccounts}
        />
      )}

      <section className={styles.content}>
        <div className={styles.tableHeader}>
          <div className={styles.headerLeft}>

            {/* Calendar button with date popup */}
            <div className={styles.datePickerWrapper} ref={popupRef}>
              <button
                type="button"
                className={`${styles.calendarBtn} ${selectedDate ? styles.calendarBtnActive : ""}`}
                onClick={() => setShowDatePopup((prev) => !prev)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                {selectedDate || "Select Date"}
              </button>

              {showDatePopup && (
                <div className={styles.datePopup}>
                  <input
                    type="date"
                    className={styles.datePopupInput}
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setShowDatePopup(false);
                    }}
                  />
                  {selectedDate && (
                    <button
                      type="button"
                      className={styles.datePopupClear}
                      onClick={() => {
                        setSelectedDate("");
                        setShowDatePopup(false);
                      }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className={styles.searchBar}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search accounts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.headerRight}>
            <button
              type="button"
              className={styles.filterBtn}
              onClick={() => setShowFilters((prev) => !prev)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              {showFilters ? "Hide Filters" : "Filter"}
            </button>
            <button
              type="button"
              className={styles.addAccountBtn}
              onClick={() => setShowAddModal(true)}
            >
              + Add Account
            </button>
          </div>
        </div>

        {showFilters && (
          <div className={styles.filterPanel}>
            <div className={styles.filterGrid}>
              <input
                type="text"
                name="accountName"
                className={styles.filterInput}
                placeholder="Account Name"
                value={filters.accountName}
                onChange={handleFilterInput}
              />
              <input
                type="text"
                name="accountNumber"
                className={styles.filterInput}
                placeholder="Account Number"
                value={filters.accountNumber}
                onChange={handleFilterInput}
              />
              <select
                name="category"
                className={styles.filterSelect}
                value={filters.category}
                onChange={handleFilterInput}
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select
                name="subcategory"
                className={styles.filterSelect}
                value={filters.subcategory}
                onChange={handleFilterInput}
              >
                <option value="">All Subcategories</option>
                {subcategories.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <input
                type="number"
                name="minBalance"
                className={styles.filterInput}
                placeholder="Min Balance"
                value={filters.minBalance}
                onChange={handleFilterInput}
              />
              <input
                type="number"
                name="maxBalance"
                className={styles.filterInput}
                placeholder="Max Balance"
                value={filters.maxBalance}
                onChange={handleFilterInput}
              />
            </div>
            <div className={styles.filterActions}>
              <span className={styles.resultCount}>{filteredAccounts.length} accounts</span>
              <button type="button" className={styles.filterBtn} onClick={clearFilters}>
                Clear Filters
              </button>
            </div>
          </div>
        )}

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Account #</th>
                <th>Account Name</th>
                <th>Account Description</th>
                <th>Normal Side</th>
                <th>Account Category</th>
                <th>Account Subcategory</th>
                <th>Initial Balance</th>
                <th>Debit</th>
                <th>Credit</th>
                <th>Balance</th>
                <th>Account Add Date</th>
                <th>UserID</th>
                <th>Order</th>
                <th>Statement</th>
                <th>Active</th>
                <th>Comments</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.map((acct) => (
                <tr
                  key={acct.id}
                  className={styles.rowClickable}
                  onClick={() => handleOpenLedger(acct)}
                >
                  <td>{acct.id}</td>
                  <td>
                    <button type="button" className={styles.linkLikeBtn}
                      onClick={(e) => { e.stopPropagation(); handleOpenLedger(acct); }}>
                      {acct.accountNumber}
                    </button>
                  </td>
                  <td>
                    <button type="button" className={styles.linkLikeBtn}
                      onClick={(e) => { e.stopPropagation(); handleOpenLedger(acct); }}>
                      {acct.accountName}
                    </button>
                  </td>
                  <td>{acct.accountDescription}</td>
                  <td>
                    <span className={`${styles.badge} ${acct.normalSide === "LEFT" ? styles.badgeDebit : styles.badgeCredit}`}>
                      {acct.normalSide}
                    </span>
                  </td>
                  <td>{acct.accountCategory}</td>
                  <td>{acct.accountSubcategory}</td>
                  <td className={styles.money}>${fmt(acct.initialBalance)}</td>
                  <td className={styles.money}>${fmt(acct.debit)}</td>
                  <td className={styles.money}>${fmt(acct.credit)}</td>
                  <td className={styles.money}>${fmt(acct.balance)}</td>
                  <td>{formatDateTime(acct.accountAddDate)}</td>
                  <td>{acct.userId}</td>
                  <td>{acct.order}</td>
                  <td>{acct.associatedStatement}</td>
                  <td>
                    <span className={`${styles.badge} ${acct.active ? styles.badgeCredit : styles.badgeDebit}`}>
                      {acct.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>{acct.comment || "—"}</td>
                  <td>
                    <div className={styles.actions}>
                      <button type="button" className={styles.actionBtn} title="Edit"
                        onClick={(e) => e.stopPropagation()}>✏️</button>
                      <button type="button" className={`${styles.actionBtn} ${styles.deactivateBtn}`} title="Deactivate"
                        onClick={(e) => e.stopPropagation()}>🚫</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredAccounts.length === 0 && (
                <tr>
                  <td colSpan={18} style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-secondary, #6b7280)" }}>
                    No accounts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}