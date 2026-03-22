import React from "react";
import styles from "./AccountLedger.module.css";

function currency(value) {
  return `$${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function AccountLedger({ account, onBack }) {
  if (!account) {
    return (
      <section className={styles.card}>
        <h3>No Account Selected</h3>
        <p>Select an account from the Chart of Accounts to view its ledger.</p>
      </section>
    );
  }

  const ledgerRows = [
    {
      date: account.accountAddDate,
      description: "Opening balance",
      debit: account.normalSide === "Debit" ? account.initialBalance : 0,
      credit: account.normalSide === "Credit" ? account.initialBalance : 0,
    },
    {
      date: account.accountAddDate,
      description: "Recorded period debit",
      debit: account.debit,
      credit: 0,
    },
    {
      date: account.accountAddDate,
      description: "Recorded period credit",
      debit: 0,
      credit: account.credit,
    },
  ];

  return (
    <section className={styles.wrapper}>
      <div className={styles.header}>
        <div>
          <h2>Ledger: {account.accountName}</h2>
          <p>
            Account #{account.accountNumber} | {account.accountCategory} / {account.accountSubcategory}
          </p>
        </div>
        <button type="button" className={styles.backBtn} onClick={onBack}>
          Back to Chart of Accounts
        </button>
      </div>

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

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Debit</th>
              <th>Credit</th>
            </tr>
          </thead>
          <tbody>
            {ledgerRows.map((row, index) => (
              <tr key={`${row.description}-${index}`}>
                <td>{row.date}</td>
                <td>{row.description}</td>
                <td className={styles.money}>{currency(row.debit)}</td>
                <td className={styles.money}>{currency(row.credit)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
