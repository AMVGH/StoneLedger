import React, { useState, useEffect, useMemo, useCallback } from "react";
import styles from "./AccountLedger.module.css";
import useTransactionContext from "../API/TransactionControl";

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

export default function AccountLedger({ account, onBack, onJournalPageSelect }) {
  const { getApprovedEntriesForLedger } = useTransactionContext();

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

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
      if (dateTo   && dateStr > dateTo)   return false;
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
      const debit  = Number(entry.debit  || 0);
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

  if (!account) {
    return (
      <section className={styles.card}>
        <h3>No Account Selected</h3>
        <p>Select an account from the Chart of Accounts to view its ledger.</p>
      </section>
    );
  }

  return (
    <section className={styles.wrapper}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <button type="button" className={styles.backBtn} onClick={onBack}>
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
          onClick={() => setShowFilters((p) => !p)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          {showFilters ? "Hide Filters" : "Filter by Date"}
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
                <th>Debit</th>
                <th>Credit</th>
                <th>Balance</th>
                <th>PR</th>
              </tr>
            </thead>
            <tbody>
              {rowsWithBalance.length > 0 ? (
                rowsWithBalance.map((row, index) => (
                  <tr key={index}>
                    <td>{formatDate(row.date)}</td>
                    <td>{row.description || "—"}</td>
                    <td className={styles.money}>
                      {row.debit > 0 ? currency(row.debit) : "—"}
                    </td>
                    <td className={styles.money}>
                      {row.credit > 0 ? currency(row.credit) : "—"}
                    </td>
                    <td className={styles.money}>
                      {currency(row.runningBalance)}
                    </td>
                    <td>
                      {row.journalReference ? (
                        <button
                          type="button"
                          className={styles.prLink}
                          title={`Go to General Journal page ${row.journalReference}`}
                          onClick={() => {
                            if (typeof onJournalPageSelect === "function") {
                              onJournalPageSelect(Number(row.journalReference));
                            }
                          }}
                        >
                          GJ{row.journalReference}
                        </button>
                      ) : (
                        <span style={{ color: "#9ca3af", fontSize: 13 }}>—</span>
                      )}
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
  );
}