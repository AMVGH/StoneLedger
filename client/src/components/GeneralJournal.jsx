import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
import styles from "./GeneralJournal.module.css";
import useUserContext from "../API/UserContext";
import { getTotalJournalPages, getTransactionsForPage } from '../API/GeneralJournal';
import useTransactionContext from '../API/TransactionControl';
import { getApprovedTransactionEntriesForLedger } from '../API/Entry';


function formatDateTime(value) {
  if (!value) return "—";
  if (Array.isArray(value)) {
    const [year, month, day] = value;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  return String(value).slice(0, 10);
}


function toDateStr(value) { return formatDateTime(value); }

export default function GeneralJournal({ userRole }) {
  const { getFinancialAccounts,  } = useUserContext();
  const { createNewTransaction } = useTransactionContext();

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showDatePopup, setShowDatePopup] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [transactionDescription, setTransactionDescription] = useState("");
  const [transactionFiles, setTransactionFiles] = useState([]); // [{name, type, file, url}]
  const [transactionLines, setTransactionLines] = useState([
    { accountId: "", debit: "", credit: "" },
    { accountId: "", debit: "", credit: "" },
  ]);
  const [transactionComment, setTransactionComment] = useState("");
  const [transactionAmount, setTransactionAmount] = useState(0);

  // Transactions state from backend
  const [transactions, setTransactions] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    accountName: "", accountNumber: "", category: "",
    minBalance: "", maxBalance: "",
  });

  const popupRef = useRef(null);
  const token = localStorage.getItem("authToken");
  const storedUser = (() => { try { return JSON.parse(localStorage.getItem("user")) || null; } catch { return null; } })();
  const loggedInUserId = storedUser?.id ?? null;

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getFinancialAccounts(token);
      setAccounts(data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to fetch journal entries.");
    } finally {
      setLoading(false);
    }
  }, [getFinancialAccounts, token]);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (popupRef.current && !popupRef.current.contains(e.target)) setShowDatePopup(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const categories = useMemo(() => [...new Set(accounts.map((a) => a.accountCategory))], [accounts]);

  const filteredAccounts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const minBalance = Number(filters.minBalance);
    const maxBalance = Number(filters.maxBalance);
    return accounts.filter((acct) => {
      const dateStr = toDateStr(acct.accountAddDate);
      if (selectedDate && dateStr > selectedDate) return false;
      if (query) {
        const match = [acct.accountNumber, acct.accountName, acct.accountDescription,
          acct.accountCategory, acct.associatedStatement]
          .join(" ").toLowerCase().includes(query);
        if (!match) return false;
      }
      if (filters.accountName && !acct.accountName?.toLowerCase().includes(filters.accountName.toLowerCase())) return false;
      if (filters.accountNumber && !String(acct.accountNumber).includes(filters.accountNumber)) return false;
      if (filters.category && acct.accountCategory !== filters.category) return false;
      const bal = Number(acct.balance);
      if (!Number.isNaN(minBalance) && filters.minBalance !== "" && bal < minBalance) return false;
      if (!Number.isNaN(maxBalance) && filters.maxBalance !== "" && bal > maxBalance) return false;
      return true;
    });
  }, [accounts, searchTerm, selectedDate, filters]);

  const handleFilterInput = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => setFilters({ accountName: "", accountNumber: "", category: "", minBalance: "", maxBalance: "" });
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
    setShowAddModal(false);
  };

  // Add Transaction handler
  const handleAddTransaction = async () => {
    // Guard: Ensure user info is loaded
    if (!loggedInUserId) {
      setError('User info not loaded. Please log in again or refresh the page.');
      return;
    }
    // Prepare transaction object for backend (TransactionCreationDTO)
    const transaction = {
      transactionType: 'STANDARD', // or let user select, default to STANDARD
      transactionDescription: transactionDescription,
      createdBy: Number(loggedInUserId),
      accountsImpacted: transactionLines
        .filter(line => line.accountId && (parseFloat(line.debit) || parseFloat(line.credit)))
        .flatMap(line => {
          const entries = [];
          if (parseFloat(line.debit)) {
            entries.push({
              accountId: Number(line.accountId),
              entryType: 'DEBIT',
              amount: parseFloat(line.debit)
            });
          }
          if (parseFloat(line.credit)) {
            entries.push({
              accountId: Number(line.accountId),
              entryType: 'CREDIT',
              amount: parseFloat(line.credit)
            });
          }
          return entries;
        })
    };
    // Only send the first file for now (backend expects one file)
    const attachment = transactionFiles.length > 0 ? transactionFiles[0].file : null;
    try {
      setLoading(true);
      await createNewTransaction(transaction, attachment);
      resetModal();
      await fetchJournalData();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to add transaction.");
    } finally {
      setLoading(false);
    }
  };

  // Pagination state
  const [page, setPage] = useState(1);
  const goToPage = (p) => setPage(Math.max(1, Math.min(totalPages, p)));

  // Fetch transactions and total pages from backend
  const fetchJournalData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const totalRes = await getTotalJournalPages();
      setTotalPages(totalRes.data || 1);
      const txnRes = await getTransactionsForPage(page);
      setTransactions(txnRes.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to fetch journal entries.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchJournalData(); }, [fetchJournalData]);

  if (loading) return <div className={styles.page}><section className={styles.content}><p style={{ padding: "2rem" }}>Loading journal entries…</p></section></div>;
  if (error) return <div className={styles.page}><section className={styles.content}><p style={{ padding: "2rem", color: "red" }}>{error}</p><button onClick={fetchJournalData}>Retry</button></section></div>;

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files).map(file => ({
      name: file.name,
      type: file.type ? file.type.split('/').pop() : file.name.split('.').pop(),
      file,
      url: URL.createObjectURL(file),
    }));
    setTransactionFiles(files);
  };

  return (
    <div className={styles.page}>
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={resetModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Add Transaction</h3>
              <button type="button" className={styles.modalClose} onClick={resetModal}>✕</button>
            </div>
            <div className={styles.modalBody}>
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
                    {accounts.map((a) => <option key={a.id} value={a.id}>{a.accountNumber} — {a.accountName}</option>)}
                  </select>
                  <input type="number" className={styles.formInput} placeholder="0.00" step="0.01" value={line.debit} onChange={(e) => handleLineChange(idx, "debit", e.target.value)} />
                  <input type="number" className={styles.formInput} placeholder="0.00" step="0.01" value={line.credit} onChange={(e) => handleLineChange(idx, "credit", e.target.value)} />
                  <button type="button" className={styles.removeLineBtn} onClick={() => removeLine(idx)} disabled={transactionLines.length <= 2} title="Remove line">✕</button>
                </div>
              ))}
              <button type="button" className={styles.addLineBtn} onClick={addLine}>+ Add Line</button>
              <div className={styles.formGroup} style={{ marginTop: 14 }}>
                <label className={styles.formLabel}>Comment</label>
                <input type="text" className={styles.formInput} placeholder="Optional comment" value={transactionComment} onChange={(e) => setTransactionComment(e.target.value)} />
              </div>
              <div className={styles.formGroup} style={{ marginTop: 8 }}>
                <label className={styles.formLabel}>Description</label>
                <input type="text" className={styles.formInput} placeholder="Transaction description" value={transactionDescription} onChange={e => setTransactionDescription(e.target.value)} />
              </div>
              <div className={styles.formGroup} style={{ marginTop: 8 }}>
                <label className={styles.formLabel}>Attach Source Documents</label>
                <input
                  type="file"
                  className={styles.formInput}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png"
                  multiple
                  onChange={handleFileChange}
                />
                <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                  Allowed: PDF, Word, Excel, CSV, JPG, PNG
                </div>
                {transactionFiles.length > 0 && (
                  <ul style={{ margin: '8px 0 0 0', padding: 0, listStyle: 'none' }}>
                    {transactionFiles.map((f, i) => (
                      <li key={i} style={{ fontSize: 13, color: '#333' }}>{f.name} ({f.type || f.name.split('.').pop().toUpperCase()})</li>
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
              <button type="button" className={`${styles.calendarBtn} ${selectedDate ? styles.calendarBtnActive : ""}`} onClick={() => setShowDatePopup((prev) => !prev)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                {selectedDate || "Select Date"}
              </button>
              {showDatePopup && (
                <div className={styles.datePopup}>
                  <input type="date" className={styles.datePopupInput} value={selectedDate}
                    onChange={(e) => { setSelectedDate(e.target.value); setShowDatePopup(false); }} />
                  {selectedDate && <button type="button" className={styles.datePopupClear} onClick={() => { setSelectedDate(""); setShowDatePopup(false); }}>Clear</button>}
                </div>
              )}
            </div>
            <div className={styles.searchBar}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input type="text" className={styles.searchInput} placeholder="Search journal entries..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <div className={styles.headerRight}>
            <button type="button" className={styles.filterBtn} onClick={() => setShowFilters((prev) => !prev)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              {showFilters ? "Hide Filters" : "Filter"}
            </button>
            <button type="button" className={styles.addEntryBtn} onClick={() => setShowAddModal(true)}>+ Add Transaction</button>
          </div>
        </div>

        {showFilters && !showAddModal && (
          <div className={styles.filterPanel}>
            <div className={styles.filterGrid}>
              <input type="text" name="accountName" className={styles.filterInput} placeholder="Account Name" value={filters.accountName} onChange={handleFilterInput} />
            </div>
            <div className={styles.filterActions}>
              <span className={styles.resultCount}>{filteredAccounts.length} entries</span>
              <button type="button" className={styles.filterBtn} onClick={clearFilters}>Clear Filters</button>
            </div>
          </div>
        )}

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Transaction ID</th><th>Account Affected</th><th>Debit</th>
                <th>Credit</th><th>Description</th><th>Files</th><th>Status</th><th>Comments</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length > 0 ? (
                transactions.map((txn) =>
                  txn.transactionEntries && txn.transactionEntries.length > 0 ? (
                    txn.transactionEntries.map((line, idx) => (
                      <tr key={`${txn.id}-${idx}`} className={styles.rowClickable}>
                        {idx === 0 ? (
                          <td rowSpan={txn.transactionEntries.length}><span className={styles.linkLikeBtn}>{txn.id}</span></td>
                        ) : null}
                        <td>{line.accountName}</td>
                        <td className={styles.money}>{line.debit ? `$${fmt(line.debit)}` : "—"}</td>
                        <td className={styles.money}>{line.credit ? `$${fmt(line.credit)}` : "—"}</td>
                        {idx === 0 ? (
                          <td rowSpan={txn.transactionEntries.length}>{txn.description}</td>
                        ) : null}
                        {idx === 0 ? (
                          <td rowSpan={txn.transactionEntries.length}>
                            {txn.files && txn.files.length > 0 ? (
                              <div style={{ marginTop: 0 }}>
                                {txn.files.map((f, i) => (
                                  <a
                                    key={i}
                                    href={f.url}
                                    download={f.name}
                                    style={{
                                      display: 'inline-block',
                                      marginRight: 8,
                                      color: '#4f46e5',
                                      textDecoration: 'underline',
                                      fontSize: 13,
                                      cursor: 'pointer',
                                    }}
                                    title={`Download ${f.name}`}
                                  >
                                    [{f.type ? f.type.toUpperCase() : ''}]
                                  </a>
                                ))}
                              </div>
                            ) : <span style={{ color: '#aaa', fontSize: 13 }}>—</span>}
                          </td>
                        ) : null}
                        {idx === 0 ? (
                          <td rowSpan={txn.transactionEntries.length}><span className={`${styles.badge} ${txn.status === "APPROVED" ? styles.badgeApproved : txn.status === "REJECTED" ? styles.badgeRejected : styles.badgePending}`}>{txn.status === "APPROVED" ? "Approved" : txn.status === "REJECTED" ? "Rejected" : "Pending"}</span></td>
                        ) : null}
                        {idx === 0 ? (
                          <td rowSpan={txn.transactionEntries.length}>{txn.comment || "—"}</td>
                        ) : null}
                      </tr>
                    ))
                  ) : null
                )
              ) : (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>No journal entries found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <span className={styles.pageInfo}>Page </span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={page}
              onChange={e => {
                let val = Number(e.target.value);
                if (!val) val = 1;
                goToPage(val);
                document.getElementById('gj-pagination')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              className={styles.pageInput}
              style={{ width: 40, textAlign: 'center', marginRight: 6 }}
            />
            <span className={styles.pageInfo}>of {totalPages}</span>
            <button className={styles.pageBtn} onClick={() => goToPage(page - 1)} disabled={page === 1}>&laquo;</button>
            <button className={styles.pageBtn} onClick={() => goToPage(page + 1)} disabled={page === totalPages}>&raquo;</button>
          </div>
        )}
        <div id="gj-pagination" style={{ height: 1 }}></div>
      </section>
    </div>
  );
}