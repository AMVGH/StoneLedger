export default function AccountantDashboard() {
  return (
    <div>
      <h2>Accountant Dashboard</h2>
      <p style={{ color: "#9bb0d1" }}>Daily accounting tasks.</p>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        <Card title="Journalize Transactions" desc="Enter multi-line debits/credits (must balance)." />
        <Card title="Attach Source Documents" desc="Upload files tied to transactions (demo UI now, backend later)." />
        <Card title="View Journal by Date" desc="Filter journal entries by date." />
        <Card title="Reports" desc="View trial balance & statements (as allowed)." />
      </div>
    </div>
  );
}

function Card({ title, desc }) {
  return (
    <div style={{ border: "1px solid #23304a", borderRadius: 14, padding: 14, background: "#121a2a" }}>
      <div style={{ fontWeight: 800 }}>{title}</div>
      <div style={{ color: "#9bb0d1", marginTop: 6 }}>{desc}</div>
    </div>
  );
}
