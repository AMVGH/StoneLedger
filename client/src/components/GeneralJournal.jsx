import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import styles from "./GeneralJournal.module.css";
import useUserContext from "../API/UserContext";
import useTransactionContext from '../API/TransactionControl';

function formatDateTime(value) {
  if (!value) return "—";
  if (Array.isArray(value)) {
    const [year, month, day] = value;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  return String(value).slice(0, 10);
}

function toDateStr(value) { return formatDateTime(value); }

const TRANSACTION_TYPES = [
  { value: "STANDARD",   label: "Standard"   },
  { value: "REVERSAL",   label: "Reversal"   },
  { value: "ADJUSTMENT", label: "Adjustment" },
  { value: "CLOSING",    label: "Closing"    },
];

function RejectionPopover({ comment }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const popoverRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (
        btnRef.current && !btnRef.current.contains(e.target) &&
        popoverRef.current && !popoverRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top + window.scrollY - 8,
        left: rect.left + window.scrollX + rect.width / 2,
      });
    }
    setOpen((p) => !p);
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={styles.rejectionCommentBtn}
        onClick={handleOpen}
        title="View rejection reason"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>
      {open && createPortal(
        <div
          ref={popoverRef}
          className={styles.rejectionPopover}
          style={{
            position: "absolute",
            top: coords.top,
            left: coords.left,
            transform: "translate(-50%, -100%)",
            zIndex: 9999,
          }}
        >
          <p className={styles.rejectionPopoverTitle}>Rejection Reason</p>
          <p className={styles.rejectionPopoverBody}>{comment || "No reason provided."}</p>
        </div>,
        document.body
      )}
    </>
  );
}

export default function GeneralJournal({ userRole, onAccountSelect }) {
  const { getFinancialAccounts } = useUserContext();
  const { createNewTransaction, getTransactionsForPage, getTotalPages, approveTransaction, rejectTransaction } = useTransactionContext();

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showDatePopup, setShowDatePopup] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [transactionDescription, setTransactionDescription] = useState("");
  const [transactionFiles, setTransactionFiles] = useState([]);
  const [transactionLines, setTransactionLines] = useState([
    { accountId: "", debit: "", credit: "" },
    { accountId: "", debit: "", credit: "" },
  ]);
  const [transactionComment, setTransactionComment] = useState("");
  const [transactionType, setTransactionType] = useState("STANDARD");

  const [actionModal, setActionModal] = useState(null);
  const [actionComment, setActionComment] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  const [transactions, setTransactions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: "",
    type: "",
    minValue: "",
    maxValue: "",
  });

  const popupRef = useRef(null);
  const token = localStorage.getItem("authToken");
  const storedUser = (() => { try { return JSON.parse(localStorage.getItem("user")) || null; } catch { return null; } })();
  const loggedInUserId = storedUser?.id ?? null;

  const getAccountName = useCallback((accountId) => {
    if (!accountId) return "—";
    const found = accounts.find(a => String(a.id) === String(accountId));
    return found ? `${found.accountNumber} — ${found.accountName}` : `Account #${accountId}`;
  }, [accounts]);

  const fetchAccounts = useCallback(async () => {
    try {
      const data = await getFinancialAccounts(token);
      setAccounts(data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to fetch accounts.");
    }
  }, [getFinancialAccounts, token]);

  const fetchJournalData = useCallback(async (page) => {
    setLoading(true);
    setError(null);
    try {
      const [pagesRes, txnRes] = await Promise.all([
        getTotalPages(),
        getTransactionsForPage(page),
      ]);
      setTotalPages(pagesRes.data || 1);
      setTransactions(txnRes.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to fetch journal entries.");
    } finally {
      setLoading(false);
    }
  }, [getTotalPages, getTransactionsForPage]);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);
  useEffect(() => { fetchJournalData(currentPage); }, [currentPage]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (popupRef.current && !popupRef.current.contains(e.target)) setShowDatePopup(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredTransactions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return transactions
      .filter((txn) => {
        const dateStr = toDateStr(txn.createdDate);
        if (selectedDate && dateStr > selectedDate) return false;

        if (filters.status && txn.transactionStatus !== filters.status) return false;
        if (filters.type && txn.transactionType !== filters.type) return false;

        const totalDebit  = (txn.accountsImpacted || [])
          .filter(e => e.entryType === "DEBIT")
          .reduce((sum, e) => sum + Number(e.amount || 0), 0);

        const totalCredit = (txn.accountsImpacted || [])
          .filter(e => e.entryType === "CREDIT")
          .reduce((sum, e) => sum + Number(e.amount || 0), 0);

        const txnValue = Math.max(totalDebit, totalCredit);

        if (filters.minValue !== "" && txnValue < Number(filters.minValue)) return false;
        if (filters.maxValue !== "" && txnValue > Number(filters.maxValue)) return false;

        if (query) {
          const accountNames = (txn.accountsImpacted || [])
            .map(e => getAccountName(e.accountId)).join(" ");

          const amounts = (txn.accountsImpacted || [])
            .map(e => String(e.amount || "")).join(" ");

          const match = [
            txn.id,
            txn.transactionDescription,
            txn.transactionType,
            txn.transactionStatus,
            txn.approvalComment,
            accountNames,
            amounts,
          ].join(" ").toLowerCase().includes(query);

          if (!match) return false;
        }

        return true;
      })
  }, [transactions, searchTerm, selectedDate, filters, getAccountName]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => setFilters({ status: "", type: "", minValue: "", maxValue: "" });

  const fmt = (val) => Number(val).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleLineChange = (index, field, value) => {
    setTransactionLines((prev) => prev.map((line, i) => i === index ? { ...line, [field]: value } : line));
  };

  const addLine = () => {
    setTransactionLines((prev) => [...prev, { accountId: "", debit: "", credit: "", description: "" }]);
  };

  const removeLine = (index) => {
    if (transactionLines.length <= 2) return;
    setTransactionLines((prev) => prev.filter((_, i) => i !== index));
  };

  const resetModal = () => {
    setTransactionLines([
      { accountId: "", debit: "", credit: "", description: "" },
      { accountId: "", debit: "", credit: "", description: "" },
    ]);
    setTransactionComment("");
    setTransactionDescription("");
    setTransactionFiles([]);
    setTransactionType("STANDARD");
    setShowAddModal(false);
  };

  const handleAddTransaction = async () => {
    if (!loggedInUserId) {
      setError('User info not loaded. Please log in again or refresh the page.');
      return;
    }
    const transaction = {
      transactionType,
      transactionDescription,
      createdBy: Number(loggedInUserId),
      accountsImpacted: transactionLines
        .filter(line => line.accountId && (parseFloat(line.debit) || parseFloat(line.credit)))
        .flatMap(line => {
          const entries = [];
          if (parseFloat(line.debit))  entries.push({ accountId: Number(line.accountId), entryType: 'DEBIT',  amount: parseFloat(line.debit)  });
          if (parseFloat(line.credit)) entries.push({ accountId: Number(line.accountId), entryType: 'CREDIT', amount: parseFloat(line.credit) });
          return entries;
        })
    };
    const attachment = transactionFiles.length > 0 ? transactionFiles[0].file : null;
    try {
      setLoading(true);
      await createNewTransaction(transaction, attachment);
      resetModal();
      await fetchJournalData(currentPage);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to add transaction.");
    } finally {
      setLoading(false);
    }
  };

  const openActionModal = async (txnId, action) => {
    if (action === "APPROVE") {
      setActionLoading(true);
      try {
        await approveTransaction(txnId, "Accepted", loggedInUserId);
        await fetchJournalData(currentPage);
      } catch (err) {
        setError(err.response?.data?.message || err.message || "Approval failed. Please try again.");
      } finally {
        setActionLoading(false);
      }
      return;
    }
    setActionModal({ txnId, action });
    setActionComment("");
    setActionError("");
  };

  const closeActionModal = () => {
    setActionModal(null);
    setActionComment("");
    setActionError("");
  };

  const handleActionSubmit = async () => {
    if (!actionComment.trim()) {
      setActionError("A comment is required.");
      return;
    }
    setActionLoading(true);
    setActionError("");
    try {
      await rejectTransaction(actionModal.txnId, actionComment.trim(), loggedInUserId);
      closeActionModal();
      await fetchJournalData(currentPage);
    } catch (err) {
      setActionError(err.response?.data?.message || err.message || "Action failed. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files).map(file => ({
      name: file.name,
      type: file.type ? file.type.split('/').pop() : file.name.split('.').pop(),
      file,
      url: URL.createObjectURL(file),
    }));
    setTransactionFiles(files);
  };

  const isManager = userRole === "MANAGER";
  const totalCols = isManager ? 10 : 9;

  if (loading) return <div className={styles.page}><section className={styles.content}><p style={{ padding: "2rem" }}>Loading journal entries…</p></section></div>;
  if (error)   return <div className={styles.page}><section className={styles.content}><p style={{ padding: "2rem", color: "red" }}>{error}</p><button onClick={() => fetchJournalData(currentPage)}>Retry</button></section></div>;

  return (
    <div className={styles.page}>

      {/* ── Reject modal (only) ── */}
      {actionModal && (
        <div className={styles.modalOverlay} onClick={closeActionModal}>
          <div className={styles.modal} style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Reject Transaction</h3>
              <button type="button" className={styles.modalClose} onClick={closeActionModal}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ fontSize: 13, color: "#374151", marginBottom: 12 }}>
                Please provide a reason for rejecting this transaction.
              </p>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Comment <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <textarea
                  className={styles.formInput}
                  rows={4}
                  placeholder="Rejection reason…"
                  value={actionComment}
                  onChange={(e) => setActionComment(e.target.value)}
                  style={{ resize: "vertical", width: "100%", boxSizing: "border-box" }}
                />
              </div>
              {actionError && <p style={{ fontSize: 12, color: "#ef4444", marginTop: 6 }}>{actionError}</p>}
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.cancelBtn} onClick={closeActionModal} disabled={actionLoading}>Cancel</button>
              <button
                type="button"
                className={styles.submitBtn}
                onClick={handleActionSubmit}
                disabled={actionLoading}
                style={{ background: "#ef4444" }}
              >
                {actionLoading ? "Submitting…" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Transaction modal ── */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={resetModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Add Transaction</h3>
              <button type="button" className={styles.modalClose} onClick={resetModal}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup} style={{ marginBottom: 14 }}>
                <label className={styles.formLabel}>Transaction Type</label>
                <select className={styles.formSelect} value={transactionType} onChange={(e) => setTransactionType(e.target.value)}>
                  {TRANSACTION_TYPES.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div className={styles.linesHeader}>
                <span className={styles.linesHeaderCell}>Account</span>
                <span className={styles.linesHeaderCell}>Debit</span>
                <span className={styles.linesHeaderCell}>Credit</span>
                <span className={styles.linesHeaderCellSmall}></span>
              </div>
              {transactionLines.map((line, idx) => (
                <div key={idx} className={styles.lineRow}>
                  <select className={styles.formSelect} value={line.accountId} onChange={(e) => handleLineChange(idx, "accountId", e.target.value)}>
                    <option value="">Select account</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.accountNumber} — {a.accountName}</option>
                    ))}
                  </select>
                  <input type="number" className={styles.formInput} placeholder="0.00" step="0.01" value={line.debit}  onChange={(e) => handleLineChange(idx, "debit",  e.target.value)} />
                  <input type="number" className={styles.formInput} placeholder="0.00" step="0.01" value={line.credit} onChange={(e) => handleLineChange(idx, "credit", e.target.value)} />
                  <button type="button" className={styles.removeLineBtn} onClick={() => removeLine(idx)} disabled={transactionLines.length <= 2} title="Remove line">✕</button>
                </div>
              ))}
              <button type="button" className={styles.addLineBtn} onClick={addLine}>+ Add Line</button>
              <div className={styles.formGroup} style={{ marginTop: 14 }}>
                <label className={styles.formLabel}>Description</label>
                <input type="text" className={styles.formInput} placeholder="Transaction description" value={transactionDescription} onChange={(e) => setTransactionDescription(e.target.value)} />
              </div>
              <div className={styles.formGroup} style={{ marginTop: 8 }}>
                <label className={styles.formLabel}>Comment</label>
                <input type="text" className={styles.formInput} placeholder="Optional comment" value={transactionComment} onChange={(e) => setTransactionComment(e.target.value)} />
              </div>
              <div className={styles.formGroup} style={{ marginTop: 8 }}>
                <label className={styles.formLabel}>Attach Source Document</label>
                <input type="file" className={styles.formInput} accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png" onChange={handleFileChange} />
                <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Allowed: PDF, Word, Excel, CSV, JPG, PNG</div>
                {transactionFiles.length > 0 && (
                  <ul style={{ margin: '8px 0 0 0', padding: 0, listStyle: 'none' }}>
                    {transactionFiles.map((f, i) => (
                      <li key={i} style={{ fontSize: 13, color: '#333' }}>{f.name} ({f.type ? f.type.toUpperCase() : f.name.split('.').pop().toUpperCase()})</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.cancelBtn} onClick={resetModal}>Cancel</button>
              <button type="button" className={styles.submitBtn} onClick={handleAddTransaction}>Create Transaction</button>
            </div>
          </div>
        </div>
      )}

      <section className={styles.content}>
        <div className={styles.tableHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.datePickerWrapper} ref={popupRef}>
              <button
                type="button"
                className={`${styles.calendarBtn} ${selectedDate ? styles.calendarBtnActive : ""}`}
                onClick={() => setShowDatePopup((prev) => !prev)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                {selectedDate || "Select Date"}
              </button>
              {showDatePopup && (
                <div className={styles.datePopup}>
                  <input type="date" className={styles.datePopupInput} value={selectedDate} onChange={(e) => { setSelectedDate(e.target.value); setShowDatePopup(false); }} />
                  {selectedDate && (
                    <button type="button" className={styles.datePopupClear} onClick={() => { setSelectedDate(""); setShowDatePopup(false); }}>Clear</button>
                  )}
                </div>
              )}
            </div>
            <div className={styles.searchBar}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search by description, account, or amount…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className={styles.headerRight}>
            <button type="button" className={`${styles.filterBtn} ${showFilters ? styles.filterBtnActive : ""}`} onClick={() => setShowFilters((prev) => !prev)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              {showFilters ? "Hide Filters" : "Filter"}
            </button>
            <button type="button" className={styles.addEntryBtn} onClick={() => setShowAddModal(true)}>
              + Add Transaction
            </button>
          </div>
        </div>

        {/* ── Filter panel ── */}
        {showFilters && !showAddModal && (
          <div className={styles.filterPanel}>
            <div className={styles.filterGrid}>

              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Status</label>
                <select name="status" className={styles.filterSelect} value={filters.status} onChange={handleFilterChange}>
                  <option value="">All</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Type</label>
                <select name="type" className={styles.filterSelect} value={filters.type} onChange={handleFilterChange}>
                  <option value="">All</option>
                  {TRANSACTION_TYPES.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Min Value ($)</label>
                <input
                  type="number"
                  name="minValue"
                  className={styles.filterInput}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  value={filters.minValue}
                  onChange={handleFilterChange}
                />
              </div>

              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Max Value ($)</label>
                <input
                  type="number"
                  name="maxValue"
                  className={styles.filterInput}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  value={filters.maxValue}
                  onChange={handleFilterChange}
                />
              </div>

            </div>
            <div className={styles.filterActions}>
              <span className={styles.resultCount}>{filteredTransactions.length} entries</span>
              <button type="button" className={styles.filterBtn} onClick={clearFilters}>Clear Filters</button>
            </div>
          </div>
        )}

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Type</th>
                <th>Created Date</th>
                <th>Account Affected</th>
                <th>Debit</th>
                <th>Credit</th>
                <th>Description</th>
                <th>Attachment</th>
                <th>Status</th>
                {isManager && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((txn) =>
                  txn.accountsImpacted && txn.accountsImpacted.length > 0 ? (
                    txn.accountsImpacted.map((line, idx) => (
                      <tr key={`${txn.id}-${idx}`} className={styles.rowClickable}>

                        {idx === 0 ? <td rowSpan={txn.accountsImpacted.length}>{txn.id}</td> : null}

                        {idx === 0 ? (
                          <td rowSpan={txn.accountsImpacted.length}>
                            <span className={styles.badge}>
                              {txn.transactionType
                                ? txn.transactionType.charAt(0) + txn.transactionType.slice(1).toLowerCase()
                                : "—"}
                            </span>
                          </td>
                        ) : null}

                        {idx === 0 ? (
                          <td rowSpan={txn.accountsImpacted.length}>{toDateStr(txn.createdDate)}</td>
                        ) : null}

                        <td>
                          <button
                            type="button"
                            className={styles.linkLikeBtn}
                            onClick={() => {
                              const acct = accounts.find(a => String(a.id) === String(line.accountId));
                              if (acct && typeof onAccountSelect === 'function') onAccountSelect(acct);
                            }}
                          >
                            {getAccountName(line.accountId)}
                          </button>
                        </td>

                        <td className={styles.money}>
                          {line.entryType === 'DEBIT' ? `$${fmt(line.amount)}` : "—"}
                        </td>

                        <td className={styles.money}>
                          {line.entryType === 'CREDIT' ? `$${fmt(line.amount)}` : "—"}
                        </td>

                        {idx === 0 ? (
                          <td rowSpan={txn.accountsImpacted.length}>{txn.transactionDescription || "—"}</td>
                        ) : null}

                        {idx === 0 ? (
                          <td rowSpan={txn.accountsImpacted.length}>
                            {txn.attachmentName
                              ? <span style={{ fontSize: 13, color: '#4f46e5' }}>{txn.attachmentName}</span>
                              : <span style={{ color: '#aaa', fontSize: 13 }}>—</span>}
                          </td>
                        ) : null}

                        {idx === 0 ? (
                          <td rowSpan={txn.accountsImpacted.length}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span className={`${styles.badge} ${
                                txn.transactionStatus === "APPROVED" ? styles.badgeApproved
                                : txn.transactionStatus === "REJECTED" ? styles.badgeRejected
                                : styles.badgePending
                              }`}>
                                {txn.transactionStatus === "APPROVED" ? "Approved"
                                  : txn.transactionStatus === "REJECTED" ? "Rejected"
                                  : "Pending"}
                              </span>
                              {txn.transactionStatus === "REJECTED" && (
                                <RejectionPopover comment={txn.approvalComment} />
                              )}
                            </div>
                          </td>
                        ) : null}

                        {isManager && idx === 0 ? (
                          <td rowSpan={txn.accountsImpacted.length}>
                            {txn.transactionStatus === "PENDING" ? (
                              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                <button type="button" className={styles.approveBtn} onClick={() => openActionModal(txn.id, "APPROVE")} disabled={actionLoading}>Accept</button>
                                <button type="button" className={styles.rejectBtn}  onClick={() => openActionModal(txn.id, "REJECT")}>Reject</button>
                              </div>
                            ) : (
                              <span style={{ fontSize: 12, color: "#9ca3af" }}>—</span>
                            )}
                          </td>
                        ) : isManager && idx !== 0 ? null : null}

                      </tr>
                    ))
                  ) : null
                )
              ) : (
                <tr>
                  <td colSpan={totalCols} style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>
                    No journal entries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        <div className={styles.pagination}>
          <button
            type="button"
            className={styles.pageBtn}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            ← Prev
          </button>
          <input
            type="number"
            className={styles.pageInput}
            value={currentPage}
            min={1}
            max={totalPages}
            onChange={(e) => {
              const val = Number(e.target.value);
              if (val >= 1 && val <= totalPages) setCurrentPage(val);
            }}
          />
          <span className={styles.pageInfo}>of {totalPages}</span>
          <button
            type="button"
            className={styles.pageBtn}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next →
          </button>
        </div>

      </section>
    </div>
  );
}