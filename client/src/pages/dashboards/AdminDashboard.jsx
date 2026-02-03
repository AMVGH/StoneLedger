function Card({ title, desc }) {
  return (
    <div style={{
      border: "1px solid #23304a", borderRadius: 14, padding: 14,
      background: "#121a2a"
    }}>
      <div style={{ fontWeight: 800 }}>{title}</div>
      <div style={{ color: "#9bb0d1", marginTop: 6 }}>{desc}</div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <div>
      <h2>Administrator Dashboard</h2>
      <p style={{ color: "#9bb0d1" }}>Full system access.</p>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        <Card title="User Management" desc="Create users, assign roles, unlock suspended accounts." />
        <Card title="Chart of Accounts" desc="Add accounts (admin-only), deactivate accounts, view report." />
        <Card title="Approvals & Posting" desc="Approve/reject transactions and post approved ones." />
        <Card title="Reports" desc="Trial balance, income statement, balance sheet, cash flow, ratios." />
        <Card title="Help / Table of Contents" desc="Built-in help and navigation hub." />
      </div>
    </div>
  );
}
