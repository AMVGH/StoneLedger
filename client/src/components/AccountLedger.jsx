import React, { useState, useEffect, useMemo, useCallback } from "react";
import styles from "./AccountLedger.module.css";
import useTransactionContext from "../API/TransactionControl";
import useUserContext from "../API/UserContext";

function currency(value) {
  return `$${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value) {
  if (!value) return "—";
  if (Array.isArray(value)) {
    const [year, month, day] = value;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  return String(value).slice(0, 10);
}

function formatDateTime(dateString) {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    return date.toLocaleString();
  } catch {
    return dateString;
  }
}

// Calculator Component
function Calculator({ onClose }) {
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState(null);
  const [operation, setOperation] = useState(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const inputDigit = (digit) => {
    if (waitingForOperand) {
      setDisplay(String(digit));
      setWaitingForOperand(false);
    } else {
      setDisplay(display === "0" ? String(digit) : display + digit);
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay("0.");
      setWaitingForOperand(false);
    } else if (!display.includes(".")) {
      setDisplay(display + ".");
    }
  };

  const clearDisplay = () => {
    setDisplay("0");
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const performOperation = (nextOperation) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      let newValue = currentValue;

      switch (operation) {
        case "+":
          newValue = currentValue + inputValue;
          break;
        case "-":
          newValue = currentValue - inputValue;
          break;
        case "×":
          newValue = currentValue * inputValue;
          break;
        case "÷":
          newValue = currentValue / inputValue;
          break;
        default:
          break;
      }

      setPreviousValue(newValue);
      setDisplay(String(newValue));
    }

    setOperation(nextOperation);
    setWaitingForOperand(true);
  };

  const calculateResult = () => {
    if (operation && previousValue !== null) {
      const inputValue = parseFloat(display);
      let result = previousValue;

      switch (operation) {
        case "+":
          result = previousValue + inputValue;
          break;
        case "-":
          result = previousValue - inputValue;
          break;
        case "×":
          result = previousValue * inputValue;
          break;
        case "÷":
          result = previousValue / inputValue;
          break;
        default:
          break;
      }

      setDisplay(String(result));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForOperand(true);
    }
  };

  const handleKeyboard = (e) => {
    if (e.key >= "0" && e.key <= "9") inputDigit(parseInt(e.key));
    if (e.key === ".") inputDecimal();
    if (e.key === "+") performOperation("+");
    if (e.key === "-") performOperation("-");
    if (e.key === "*") performOperation("×");
    if (e.key === "/") performOperation("÷");
    if (e.key === "Enter" || e.key === "=") calculateResult();
    if (e.key === "Escape") clearDisplay();
    if (e.key === "Backspace") setDisplay(display.slice(0, -1) || "0");
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [display, previousValue, operation, waitingForOperand]);

  return (
    <div className={styles.calculator}>
      <div className={styles.calculatorDisplay}>{display}</div>
      <div className={styles.calculatorButtons}>
        <button onClick={clearDisplay} className={styles.calculatorClear}>C</button>
        <button onClick={() => setDisplay(display.slice(0, -1) || "0")} className={styles.calculatorClear}>⌫</button>
        <button onClick={() => performOperation("÷")} className={styles.calculatorOperator}>÷</button>
        <button onClick={() => performOperation("×")} className={styles.calculatorOperator}>×</button>

        <button onClick={() => inputDigit(7)} className={styles.calculatorNumber}>7</button>
        <button onClick={() => inputDigit(8)} className={styles.calculatorNumber}>8</button>
        <button onClick={() => inputDigit(9)} className={styles.calculatorNumber}>9</button>
        <button onClick={() => performOperation("-")} className={styles.calculatorOperator}>-</button>

        <button onClick={() => inputDigit(4)} className={styles.calculatorNumber}>4</button>
        <button onClick={() => inputDigit(5)} className={styles.calculatorNumber}>5</button>
        <button onClick={() => inputDigit(6)} className={styles.calculatorNumber}>6</button>
        <button onClick={() => performOperation("+")} className={styles.calculatorOperator}>+</button>

        <button onClick={() => inputDigit(1)} className={styles.calculatorNumber}>1</button>
        <button onClick={() => inputDigit(2)} className={styles.calculatorNumber}>2</button>
        <button onClick={() => inputDigit(3)} className={styles.calculatorNumber}>3</button>
        <button onClick={calculateResult} className={styles.calculatorEquals}>=</button>

        <button onClick={() => inputDigit(0)} className={styles.calculatorNumberZero}>0</button>
        <button onClick={inputDecimal} className={styles.calculatorNumber}>.</button>
      </div>
    </div>
  );
}

export default function AccountLedger({ account, onBack, onJournalPageSelect, totalJournalPages, onAccountSelect }) {
  const { getApprovedEntriesForLedger, getTotalPages, getParentTransaction, getAttachment } = useTransactionContext();
  const { getFinancialAccounts } = useUserContext();

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(totalJournalPages || 1);
  const [accounts, setAccounts] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false); // Calculator state

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [parentTransaction, setParentTransaction] = useState(null);
  const [selectedEntryId, setSelectedEntryId] = useState(null);

  const token = localStorage.getItem("authToken");

  // Fetch accounts on component mount
  const fetchAccounts = useCallback(async () => {
    try {
      const data = await getFinancialAccounts(token);
      setAccounts(data || []);
    } catch (err) {
      console.error("Failed to fetch accounts:", err);
    }
  }, [getFinancialAccounts, token]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Get account name function - matches General Journal pattern
  const getAccountName = useCallback((accountId) => {
    if (!accountId) return "—";
    const found = accounts.find(a => String(a.id) === String(accountId));
    return found ? `${found.accountNumber} — ${found.accountName}` : `Account #${accountId}`;
  }, [accounts]);

  // Fetch total pages if not provided as prop
  useEffect(() => {
    const fetchTotalPages = async () => {
      if (!totalJournalPages) {
        try {
          const pagesRes = await getTotalPages();
          setTotalPages(pagesRes.data || 1);
        } catch (err) {
          console.error("Failed to fetch total pages:", err);
        }
      }
    };
    fetchTotalPages();
  }, [getTotalPages, totalJournalPages]);

  const fetchEntries = useCallback(async () => {
    if (!account?.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getApprovedEntriesForLedger(account.id);
      setEntries(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to fetch ledger entries.");
    } finally {
      setLoading(false);
    }
  }, [account?.id, getApprovedEntriesForLedger]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const filteredEntries = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return entries.filter((entry) => {
      const dateStr = formatDate(entry.date);
      if (dateFrom && dateStr < dateFrom) return false;
      if (dateTo && dateStr > dateTo) return false;
      if (query) {
        const haystack = [
          entry.description,
          entry.debit,
          entry.credit,
        ].join(" ").toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [entries, searchTerm, dateFrom, dateTo]);

  const rowsWithBalance = useMemo(() => {
    let balance = 0;
    return filteredEntries.map((entry) => {
      const debit = Number(entry.debit || 0);
      const credit = Number(entry.credit || 0);

      const normalSide = (account?.normalSide || "").toUpperCase();
      if (normalSide === "LEFT" || normalSide === "DEBIT") {
        balance += debit - credit;
      } else {
        balance += credit - debit;
      }

      return { ...entry, debit, credit, runningBalance: balance };
    });
  }, [filteredEntries, account]);

  const clearFilters = () => {
    setSearchTerm("");
    setDateFrom("");
    setDateTo("");
  };

  // Function to convert ascending page (from backend) to descending page (frontend display)
  const convertToDisplayPage = (ascendingPage) => {
    if (!ascendingPage) return 1;
    return totalPages - ascendingPage + 1;
  };

  // Handle journal page navigation with conversion
  const handleJournalPageSelect = (ascendingPageRef) => {
    if (typeof onJournalPageSelect === "function") {
      const displayPage = convertToDisplayPage(ascendingPageRef);
      onJournalPageSelect(displayPage);
    }
  };

  // Handle opening the modal and fetching parent transaction
  const handlePostReferenceClick = async (entryId, journalReference) => {
    if (!entryId) return;

    setModalOpen(true);
    setModalLoading(true);
    setModalError(null);
    setParentTransaction(null);
    setSelectedEntryId(entryId);

    try {
      const response = await getParentTransaction(entryId);
      let transactionData = null;

      if (response?.data?.data) {
        transactionData = response.data.data;
      } else if (response?.data) {
        transactionData = response.data;
      } else if (response) {
        transactionData = response;
      }

      setParentTransaction(transactionData);
    } catch (err) {
      console.error("Failed to fetch parent transaction:", err);
      setModalError(err.response?.data?.message || err.message || "Failed to load transaction details.");
    } finally {
      setModalLoading(false);
    }
  };

  // Close modal
  const closeModal = () => {
    setModalOpen(false);
    setParentTransaction(null);
    setModalError(null);
    setSelectedEntryId(null);
  };

  // Handle modal background click to close
  const handleModalBackgroundClick = (e) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  if (!account) {
    return (
      <section className={styles.card}>
        <h3>No Account Selected</h3>
        <p>Select an account from the Chart of Accounts to view its ledger.</p>
      </section>
    );
  }

  const downloadAttachment = async (transactionId) => {
    try {
      const result = await getAttachment(transactionId);
      if (result.url) {
        window.open(result.url, '_blank');
      }
    } catch (err) {
      console.error('Failed to download attachment:', err);
    }
  };

  return (
    <>
      <section className={styles.wrapper}>
        {/* ── Header ── */}
        <div className={styles.header}>
          <button type="button" title="Return to Previous Page" className={styles.backBtn} onClick={onBack}>
            ← Back
          </button>
          <div>
            <h2>Ledger: {account.accountName}</h2>
            <p>
              Account #{account.accountNumber} | {account.accountCategory} / {account.accountSubcategory}
            </p>
          </div>
        </div>

        {/* ── Summary cards ── */}
        <div className={styles.summaryGrid}>
          <div className={styles.statCard}>
            <span>Normal Side</span>
            <strong>{account.normalSide}</strong>
          </div>
          <div className={styles.statCard}>
            <span>Initial Balance</span>
            <strong>{currency(account.initialBalance)}</strong>
          </div>
          <div className={styles.statCard}>
            <span>Total Debit</span>
            <strong>{currency(account.debit)}</strong>
          </div>
          <div className={styles.statCard}>
            <span>Total Credit</span>
            <strong>{currency(account.credit)}</strong>
          </div>
          <div className={styles.statCard}>
            <span>Current Balance</span>
            <strong>{currency(account.balance)}</strong>
          </div>
        </div>

        {/* ── Search & filter toolbar ── */}
        <div className={styles.toolbar}>
          <div className={styles.searchBar}>
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search by description or amount…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            type="button"
            className={`${styles.filterToggleBtn} ${showFilters ? styles.filterToggleBtnActive : ""}`}
            title="Filter Transactions by Date"
            onClick={() => setShowFilters((p) => !p)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            {showFilters ? "Hide Filters" : "Filter by Date"}
          </button>

          {/* Calculator Button */}
          <button
            type="button"
            className={styles.calculatorBtn}
            onClick={() => setShowCalculator(true)}
            aria-label="Calculator"
            title="Open Calculator"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
              <line x1="8" y1="6" x2="16" y2="6"></line>
              <line x1="16" y1="14" x2="16" y2="18"></line>
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="12" cy="16" r="1"></circle>
              <circle cx="8" cy="16" r="1"></circle>
              <circle cx="8" cy="12" r="1"></circle>
              <circle cx="16" cy="12" r="1"></circle>
              <circle cx="16" cy="16" r="1"></circle>
            </svg>
          </button>
        </div>

        {showFilters && (
          <div className={styles.filterPanel}>
            <div className={styles.filterRow}>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>From</label>
                <input
                  type="date"
                  className={styles.filterInput}
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>To</label>
                <input
                  type="date"
                  className={styles.filterInput}
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
              <button type="button" className={styles.clearBtn} onClick={clearFilters}>
                Clear All
              </button>
            </div>
            <span className={styles.resultCount}>{rowsWithBalance.length} entries</span>
          </div>
        )}

        {/* ── Ledger table ── */}
        <div className={styles.tableWrap}>
          {loading && <p style={{ padding: "1.5rem", color: "#6b7280" }}>Loading entries…</p>}
          {error && (
            <p style={{ padding: "1.5rem", color: "#ef4444" }}>
              {error} <button onClick={fetchEntries}>Retry</button>
            </p>
          )}
          {!loading && !error && (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>PR</th>
                  <th>Debit</th>
                  <th>Credit</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                {rowsWithBalance.length > 0 ? (
                  rowsWithBalance.map((row, index) => (
                    <tr key={index}>
                      <td>{formatDate(row.date)}</td>
                      <td>{row.description || "—"}</td>
                      <td>
                        {row.id && row.journalReference ? (
                          <button
                            type="button"
                            className={styles.prLink}
                            title={`View transaction details for GJ-${convertToDisplayPage(Number(row.journalReference))}`}
                            onClick={() => handlePostReferenceClick(row.id, Number(row.journalReference))}
                          >
                            GJ-{convertToDisplayPage(Number(row.journalReference))}
                          </button>
                        ) : row.journalReference ? (
                          <button
                            type="button"
                            className={styles.prLink}
                            title={`Go to General Journal page ${convertToDisplayPage(Number(row.journalReference))}`}
                            onClick={() => handleJournalPageSelect(Number(row.journalReference))}
                          >
                            GJ-{convertToDisplayPage(Number(row.journalReference))}
                          </button>
                        ) : (
                          <span style={{ color: "#9ca3af", fontSize: 13 }}>—</span>
                        )}
                       </td>
                      <td className={styles.money}>
                        {row.debit > 0 ? currency(row.debit) : "—"}
                      </td>
                      <td className={styles.money}>
                        {row.credit > 0 ? currency(row.credit) : "—"}
                      </td>
                      <td className={styles.money}>
                        {currency(row.runningBalance)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>
                      No posted entries found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* ── Modal for Parent Transaction ── */}
      {modalOpen && (
        <div className={styles.modalOverlay} onClick={handleModalBackgroundClick}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Transaction Details</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={closeModal}
                aria-label="Close"
                title="Close"
              >
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              {modalLoading && (
                <div className={styles.modalLoading}>
                  <div className={styles.spinner}></div>
                  <p>Loading transaction details...</p>
                </div>
              )}

              {modalError && (
                <div className={styles.modalError}>
                  <p>{modalError}</p>
                  <button
                    type="button"
                    onClick={() => handlePostReferenceClick(selectedEntryId)}
                  >
                    Retry
                  </button>
                </div>
              )}

              {!modalLoading && !modalError && parentTransaction && (
                <div className={styles.transactionDetails}>
                  {/* Transaction Header Info - Grid Layout */}
                  <div className={styles.transactionHeaderInfo}>
                    <div className={styles.headerRow}>
                      <div className={styles.headerItem}>
                        <span className={styles.headerLabel}>Transaction ID:</span>
                        <span className={styles.headerValue}>#{parentTransaction.id || '—'}</span>
                      </div>
                      <div className={styles.headerItem}>
                        <span className={styles.headerLabel}>Type:</span>
                        <span
                          className={styles.headerValue}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            fontSize: "0.875rem",
                            fontWeight: 500,
                            lineHeight: "1.3",
                            color: "#111827"
                          }}
                        >
                          {parentTransaction.transactionType
                            ? parentTransaction.transactionType.charAt(0) +
                              parentTransaction.transactionType.slice(1).toLowerCase()
                            : "—"}
                        </span>
                      </div>
                      <div className={styles.headerItem}>
                        <span className={styles.headerLabel}>Status:</span>
                        <span className={`${styles.badge} ${
                          parentTransaction.transactionStatus === "APPROVED" ? styles.badgeApproved
                          : parentTransaction.transactionStatus === "REJECTED" ? styles.badgeRejected
                          : styles.badgePending
                        }`}>
                          {parentTransaction.transactionStatus === "APPROVED" ? "Approved"
                            : parentTransaction.transactionStatus === "REJECTED" ? "Rejected"
                            : parentTransaction.transactionStatus || "—"}
                        </span>
                      </div>
                      <div className={styles.headerItem}>
                        <span className={styles.headerLabel}>Creation Date:</span>
                        <span className={styles.headerValue}>{formatDateTime(parentTransaction.createdDate)}</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.descriptionSection}>
                    <div
                      className={styles.descriptionRow}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "12px",
                        marginBottom: "12px"
                      }}
                    >
                      <span
                        className={styles.descriptionLabel}
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          color: "#6b7280",
                          minWidth: "75px",
                          textTransform: "uppercase",
                          letterSpacing: "0.4px",
                          lineHeight: "1.4",
                          paddingTop: "2px"
                        }}
                      >
                        Description:
                      </span>
                      <span
                        className={styles.descriptionValue}
                        style={{
                          fontSize: "0.875rem",
                          color: "#374151",
                          flex: 1,
                          lineHeight: "1.4",
                          wordWrap: "break-word",
                          whiteSpace: "normal",
                          margin: 0,
                          padding: 0
                        }}
                      >
                        {parentTransaction.transactionDescription || "—"}
                      </span>
                    </div>

                    {parentTransaction.approvalComment && (
                      <div
                        className={styles.descriptionRow}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "12px"
                        }}
                      >
                        <span
                          className={styles.descriptionLabel}
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: "#6b7280",
                            minWidth: "130px",
                            textTransform: "uppercase",
                            letterSpacing: "0.4px",
                            lineHeight: "1.4",
                            paddingTop: "2px"
                          }}
                        >
                          Approval Comment:
                        </span>
                        <span
                          className={styles.descriptionValue}
                          style={{
                            fontSize: "0.875rem",
                            color: "#374151",
                            flex: 1,
                            lineHeight: "1.4",
                            wordWrap: "break-word",
                            whiteSpace: "normal",
                            margin: 0,
                            padding: 0
                          }}
                        >
                          {parentTransaction.approvalComment}
                        </span>
                      </div>
                    )}
                    <div
                        className={styles.descriptionRow}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "12px",
                          marginBottom: "-1px"
                        }}
                    >
                      <span
                          className={styles.descriptionLabel}
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: "#6b7280",
                            minWidth: "130px",
                            textTransform: "uppercase",
                            letterSpacing: "0.4px",
                            lineHeight: "1.4",
                            paddingTop: "2px"
                          }}
                      >
                        Transaction Attachment:
                      </span>
                      <span
                          className={styles.descriptionValue}
                          style={{
                            fontSize: "0.875rem",
                            color: "#374151",
                            flex: 1,
                            lineHeight: "1.4",
                            wordWrap: "break-word",
                            whiteSpace: "normal",
                            margin: 0,
                            padding: 0
                      }}
                      >
                        {parentTransaction.attachmentName ? (
                            <button
                                onClick={() => downloadAttachment(parentTransaction.id)}
                                style={{
                                  fontSize: 13,
                                  color: '#4f46e5',
                                  textDecoration: 'underline',
                                  cursor: 'pointer',
                                  background: 'none',
                                  border: 'none',
                                  padding: 0,
                                  fontFamily: 'inherit'
                                }}
                            >
                              {parentTransaction.attachmentName}
                            </button>
                        ) : (
                            <span style={{ color: '#9ca3af', fontSize: 13 }}>—</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Accounts Impacted Table - Using getAccountName like General Journal */}
                  {parentTransaction.accountsImpacted && parentTransaction.accountsImpacted.length > 0 && (
                      <div className={styles.modalTableWrapper}>
                        <table className={styles.modalJournalTable}>
                          <thead>
                          <tr>
                            <th>Account</th>
                            <th>Debit</th>
                            <th>Credit</th>
                          </tr>
                          </thead>
                          <tbody>
                          {parentTransaction.accountsImpacted.map((accountItem, idx) => {
                            const accountDisplayName = getAccountName(accountItem.accountId);
                            const fullAccount = accounts.find(a => String(a.id) === String(accountItem.accountId));
                            const isCredit = accountItem.entryType === 'CREDIT';

                            return (
                                <tr key={idx}>
                                  <td className={isCredit ? styles.creditAccountCell : styles.debitAccountCell}>
                                    {onAccountSelect && fullAccount ? (
                                        <button
                                            type="button"
                                            className={`${styles.linkLikeBtn} ${isCredit ? styles.creditLinkBtn : ''}`}
                                            onClick={() => {
                                              onAccountSelect(fullAccount);
                                              closeModal();
                                            }}
                                        >
                    <span className={isCredit ? styles.creditAccountName : styles.debitAccountName}>
                      {accountDisplayName}
                    </span>
                                        </button>
                                    ) : (
                                        <span className={isCredit ? styles.creditAccountName : styles.debitAccountName}>
                    {accountDisplayName}
                  </span>
                                    )}
                                  </td>
                                  <td className={styles.money}>
                                    {accountItem.entryType === 'DEBIT' ? currency(accountItem.amount) : "—"}
                                  </td>
                                  <td className={styles.money}>
                                    {accountItem.entryType === 'CREDIT' ? currency(accountItem.amount) : "—"}
                                  </td>
                                </tr>
                            );
                          })}
                          </tbody>
                          <tfoot>
                          <tr>
                            <td><strong>Total</strong></td>
                            <td className={styles.money}>
                              <strong>
                                {currency(
                                    parentTransaction.accountsImpacted
                                        .filter(a => a.entryType === 'DEBIT')
                                        .reduce((sum, a) => sum + Number(a.amount), 0)
                                )}
                              </strong>
                            </td>
                            <td className={styles.money}>
                              <strong>
                                {currency(
                                    parentTransaction.accountsImpacted
                                        .filter(a => a.entryType === 'CREDIT')
                                        .reduce((sum, a) => sum + Number(a.amount), 0)
                                )}
                              </strong>
                            </td>
                          </tr>
                          </tfoot>
                        </table>
                      </div>
                  )}
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button type="button" title="Close Transaction Details" className={styles.modalCloseFooterBtn} onClick={closeModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calculator Modal */}
      {showCalculator && (
        <div className={styles.calculatorOverlay} onClick={(e) => {
          if (e.target === e.currentTarget) setShowCalculator(false);
        }}>
          <div className={styles.calculatorModal}>
            <div className={styles.calculatorHeader}>
              <button
                type="button"
                className={styles.calculatorCloseBtn}
                onClick={() => setShowCalculator(false)}
              >
                ×
              </button>
            </div>
            <Calculator onClose={() => setShowCalculator(false)} />
          </div>
        </div>
      )}
    </>
  );
}