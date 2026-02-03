export default function ManagerDashboard() {
  return (
    <div>
      <h2>Manager Dashboard</h2>
      <p style={{ color: "#9bb0d1" }}>Review and approve work, view reports.</p>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        <DashCard title="Review Transactions" desc="Review rejected/submitted entries and approve/reject." />
        <DashCard title="Posting" desc="Post approved transactions." />
        <DashCard title="Reports" desc="Trial balance and financial statements for selected year." />
        <DashCard title="Ratio Analysis" desc="Highlight ratios that are out of range." />
      </div>
    </div>
  );
}

function DashCard({ title, desc }) {
  return (
    <div style={{ border: "1px solid #23304a", borderRadius: 14, padding: 14, background: "#121a2a" }}>
      <div style={{ fontWeight: 800 }}>{title}</div>
      <div style={{ color: "#9bb0d1", marginTop: 6 }}>{desc}</div>
    </div>
  );
}
