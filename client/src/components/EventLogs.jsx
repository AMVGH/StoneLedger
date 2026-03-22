import React, { useState, useEffect, useCallback } from "react";
import styles from "./EventLogs.module.css";
import useUserContext from "../API/UserContext";

function formatDateTime(value) {
  if (!value) return "—";
  if (Array.isArray(value)) {
    const [year, month, day, hour, min, sec] = value;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")} ${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}:${String(sec ?? 0).padStart(2, "0")}`;
  }
  return String(value).replace("T", " ").slice(0, 19);
}

export default function EventLogs() {
  const { getEvents } = useUserContext();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("authToken");
      const data = await getEvents(token);
      setEvents(data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to fetch events.");
    } finally {
      setLoading(false);
    }
  }, [getEvents]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const filtered = events.filter((e) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return [e.id, e.userId, e.tableAffected, e.eventAction]
      .join(" ").toLowerCase().includes(q);
  });

  if (loading) return <div className={styles.page}><section className={styles.content}><p style={{ padding: "2rem" }}>Loading events…</p></section></div>;
  if (error) return <div className={styles.page}><section className={styles.content}><p style={{ padding: "2rem", color: "red" }}>{error}</p><button onClick={fetchEvents}>Retry</button></section></div>;

  return (
    <div className={styles.page}>
      <section className={styles.content}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", border: "0.5px solid #d1d5db", borderRadius: "6px", padding: "5px 9px", background: "#fff" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: "none", outline: "none", background: "transparent", fontSize: "13px", width: "200px", color: "#111827" }}
            />
          </div>
          <span style={{ fontSize: "12px", color: "#6b7280" }}>{filtered.length} events</span>
        </div>

        <div style={{ overflowX: "auto", border: "0.5px solid #e5e7eb", borderRadius: "10px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>User ID</th>
                <th style={thStyle}>Timestamp</th>
                <th style={thStyle}>Table Affected</th>
                <th style={thStyle}>Action</th>
                <th style={thStyle}>Before Image</th>
                <th style={thStyle}>After Image</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((event) => (
                <React.Fragment key={event.id}>
                  <tr
                    style={{ borderBottom: "0.5px solid #f3f4f6", cursor: "pointer" }}
                    onClick={() => setExpandedRow(expandedRow === event.id ? null : event.id)}
                  >
                    <td style={tdStyle}>{event.id}</td>
                    <td style={tdStyle}>{event.userId}</td>
                    <td style={tdStyle}>{formatDateTime(event.timestamp)}</td>
                    <td style={tdStyle}>
                      <span style={{ background: "#f3f4f6", borderRadius: "99px", padding: "2px 8px", fontSize: "11px", fontWeight: 500, color: "#374151" }}>
                        {event.tableAffected}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        borderRadius: "99px", padding: "2px 8px", fontSize: "11px", fontWeight: 500,
                        background: event.eventAction === "CREATE" ? "#dcfce7" : event.eventAction === "DELETE" ? "#fee2e2" : "#dbeafe",
                        color: event.eventAction === "CREATE" ? "#166534" : event.eventAction === "DELETE" ? "#991b1b" : "#1e40af",
                      }}>
                        {event.eventAction}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      {event.beforeImage
                        ? <span style={{ color: "#6366f1", textDecoration: "underline", cursor: "pointer" }}>View</span>
                        : <span style={{ color: "#9ca3af" }}>—</span>}
                    </td>
                    <td style={tdStyle}>
                      {event.afterImage
                        ? <span style={{ color: "#6366f1", textDecoration: "underline", cursor: "pointer" }}>View</span>
                        : <span style={{ color: "#9ca3af" }}>—</span>}
                    </td>
                  </tr>
                  {expandedRow === event.id && (
                    <tr style={{ background: "#f9fafb" }}>
                      <td colSpan={7} style={{ padding: "12px 16px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                          <div>
                            <p style={{ fontSize: "12px", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>Before Image</p>
                            <pre style={{ fontSize: "11px", background: "#fff", border: "0.5px solid #e5e7eb", borderRadius: "6px", padding: "10px", overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all", color: "#374151", margin: 0 }}>
                              {event.beforeImage ? JSON.stringify(JSON.parse(event.beforeImage), null, 2) : "null"}
                            </pre>
                          </div>
                          <div>
                            <p style={{ fontSize: "12px", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>After Image</p>
                            <pre style={{ fontSize: "11px", background: "#fff", border: "0.5px solid #e5e7eb", borderRadius: "6px", padding: "10px", overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all", color: "#374151", margin: 0 }}>
                              {event.afterImage ? JSON.stringify(JSON.parse(event.afterImage), null, 2) : "null"}
                            </pre>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>No events found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

const thStyle = {
  padding: "8px 12px", textAlign: "left", fontSize: "12px",
  fontWeight: 500, color: "#6b7280", borderBottom: "0.5px solid #e5e7eb",
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "8px 12px", color: "#111827", whiteSpace: "nowrap",
};