import React, { useState } from "react";
import styles from "./ChartOfAccounts.module.css";
import logo from "../assets/StoneLedgerLogo-removebg-preview (1).png";
import { useNavigate } from "react-router-dom";

const mockUser = {
  username: "admin01",
  name: "John Doe",
  role: "Admin",
  profilePicture:
    "https://images.rawpixel.com/image_png_800/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIzLTAxL3JtNjA5LXNvbGlkaWNvbi13LTAwMi1wLnBuZw.png",
};

const mockAccounts = [
  {
    accountNumber: 101,
    accountName: "Cash",
    accountDescription: "Main cash account",
    normalSide: "Debit",
    accountCategory: "Asset",
    accountSubcategory: "Current Asset",
    initialBalance: 50000.0,
    debit: 12000.0,
    credit: 7000.0,
    balance: 55000.0,
    accountAddDate: "2026-01-15",
    userId: "admin01",
    order: 1,
    statement: "Balance Sheet",
    comments: "Primary operating cash",
  },
  {
    accountNumber: 102,
    accountName: "Accounts Receivable",
    accountDescription: "Amounts owed by customers",
    normalSide: "Debit",
    accountCategory: "Asset",
    accountSubcategory: "Current Asset",
    initialBalance: 25000.0,
    debit: 18000.0,
    credit: 10000.0,
    balance: 33000.0,
    accountAddDate: "2026-01-15",
    userId: "admin01",
    order: 2,
    statement: "Balance Sheet",
    comments: "",
  },
  {
    accountNumber: 201,
    accountName: "Accounts Payable",
    accountDescription: "Amounts owed to suppliers",
    normalSide: "Credit",
    accountCategory: "Liability",
    accountSubcategory: "Current Liability",
    initialBalance: 15000.0,
    debit: 5000.0,
    credit: 12000.0,
    balance: 22000.0,
    accountAddDate: "2026-01-16",
    userId: "admin01",
    order: 3,
    statement: "Balance Sheet",
    comments: "Trade payables",
  },
  {
    accountNumber: 301,
    accountName: "Owner's Equity",
    accountDescription: "Owner investment in business",
    normalSide: "Credit",
    accountCategory: "Equity",
    accountSubcategory: "Owner's Equity",
    initialBalance: 100000.0,
    debit: 0.0,
    credit: 5000.0,
    balance: 105000.0,
    accountAddDate: "2026-01-15",
    userId: "admin01",
    order: 4,
    statement: "Balance Sheet",
    comments: "Initial capital contribution",
  },
  {
    accountNumber: 401,
    accountName: "Service Revenue",
    accountDescription: "Revenue from services rendered",
    normalSide: "Credit",
    accountCategory: "Revenue",
    accountSubcategory: "Operating Revenue",
    initialBalance: 0.0,
    debit: 0.0,
    credit: 45000.0,
    balance: 45000.0,
    accountAddDate: "2026-01-20",
    userId: "admin01",
    order: 5,
    statement: "Income Statement",
    comments: "Consulting services",
  },
  {
    accountNumber: 501,
    accountName: "Rent Expense",
    accountDescription: "Monthly office rent",
    normalSide: "Debit",
    accountCategory: "Expense",
    accountSubcategory: "Operating Expense",
    initialBalance: 0.0,
    debit: 6000.0,
    credit: 0.0,
    balance: 6000.0,
    accountAddDate: "2026-02-01",
    userId: "admin01",
    order: 6,
    statement: "Income Statement",
    comments: "Office lease",
  },
  {
    accountNumber: 103,
    accountName: "Inventory",
    accountDescription: "Goods available for sale",
    normalSide: "Debit",
    accountCategory: "Asset",
    accountSubcategory: "Current Asset",
    initialBalance: 30000.0,
    debit: 15000.0,
    credit: 8000.0,
    balance: 37000.0,
    accountAddDate: "2026-01-18",
    userId: "admin01",
    order: 7,
    statement: "Balance Sheet",
    comments: "Merchandise inventory",
  },
  {
    accountNumber: 104,
    accountName: "Prepaid Insurance",
    accountDescription: "Insurance paid in advance",
    normalSide: "Debit",
    accountCategory: "Asset",
    accountSubcategory: "Current Asset",
    initialBalance: 12000.0,
    debit: 12000.0,
    credit: 2000.0,
    balance: 22000.0,
    accountAddDate: "2026-01-22",
    userId: "admin01",
    order: 8,
    statement: "Balance Sheet",
    comments: "Annual policy prepayment",
  },
  {
    accountNumber: 202,
    accountName: "Unearned Revenue",
    accountDescription: "Revenue received but not yet earned",
    normalSide: "Credit",
    accountCategory: "Liability",
    accountSubcategory: "Current Liability",
    initialBalance: 10000.0,
    debit: 3000.0,
    credit: 8000.0,
    balance: 15000.0,
    accountAddDate: "2026-02-05",
    userId: "admin01",
    order: 9,
    statement: "Balance Sheet",
    comments: "Advance client payments",
  },
  {
    accountNumber: 502,
    accountName: "Salaries Expense",
    accountDescription: "Employee wages and salaries",
    normalSide: "Debit",
    accountCategory: "Expense",
    accountSubcategory: "Operating Expense",
    initialBalance: 0.0,
    debit: 24000.0,
    credit: 0.0,
    balance: 24000.0,
    accountAddDate: "2026-02-01",
    userId: "admin01",
    order: 10,
    statement: "Income Statement",
    comments: "Monthly payroll",
  },
  {
    accountNumber: 503,
    accountName: "Utilities Expense",
    accountDescription: "Electric, water, and internet bills",
    normalSide: "Debit",
    accountCategory: "Expense",
    accountSubcategory: "Operating Expense",
    initialBalance: 0.0,
    debit: 3500.0,
    credit: 0.0,
    balance: 3500.0,
    accountAddDate: "2026-02-10",
    userId: "admin01",
    order: 11,
    statement: "Income Statement",
    comments: "Monthly utility costs",
  },
];

export default function ChartOfAccounts() {
  const [showSettings, setShowSettings] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
        {/* Chart of Accounts Table */}
        <section className={styles.content}>
          <div className={styles.tableHeader}>
            <div className={styles.headerLeft}>
              <label className={styles.calendarBtn}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                {selectedDate || "Select Date"}
                <input
                  type="date"
                  className={styles.hiddenDateInput}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </label>

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
              <button className={styles.filterBtn}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
                Filter
              </button>
              <button className={styles.addAccountBtn}>
                + Add Account
              </button>
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
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
                  <th>Comments</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {mockAccounts.map((acct) => (
                  <tr key={acct.accountNumber}>
                    <td>{acct.accountNumber}</td>
                    <td>{acct.accountName}</td>
                    <td>{acct.accountDescription}</td>
                    <td>
                      <span className={`${styles.badge} ${acct.normalSide === "Debit" ? styles.badgeDebit : styles.badgeCredit}`}>
                        {acct.normalSide}
                      </span>
                    </td>
                    <td>{acct.accountCategory}</td>
                    <td>{acct.accountSubcategory}</td>
                    <td className={styles.money}>${acct.initialBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                    <td className={styles.money}>${acct.debit.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                    <td className={styles.money}>${acct.credit.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                    <td className={styles.money}>${acct.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                    <td>{acct.accountAddDate}</td>
                    <td>{acct.userId}</td>
                    <td>{acct.order}</td>
                    <td>{acct.statement}</td>
                    <td>{acct.comments || "—"}</td>
                    <td>
                      <div className={styles.actions}>
                        <button className={styles.actionBtn} title="View">👁️</button>
                        <button className={styles.actionBtn} title="Edit">✏️</button>
                        <button className={`${styles.actionBtn} ${styles.deactivateBtn}`} title="Deactivate">🚫</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
    </div>
  );
}