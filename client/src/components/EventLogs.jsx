import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
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

// Helper function to safely parse JSON with error handling
function safeJsonParse(value) {
  if (!value) return null;
  if (typeof value === 'object') return value;

  try {
    // Attempt to clean common JSON issues
    let cleaned = value;

    // Fix missing quotes around keys
    cleaned = cleaned.replace(/(\{|\,)\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');

    // Fix missing quotes around string values
    cleaned = cleaned.replace(/:\s*([a-zA-Z][a-zA-Z0-9_]*)(\s*[,}])/g, ':"$1"$2');

    // Fix unquoted null values
    cleaned = cleaned.replace(/:\s*null\s*(,|})/g, ':null$1');

    // Fix unquoted boolean values
    cleaned = cleaned.replace(/:\s*(true|false)\s*(,|})/g, ':$1$2');

    // Fix missing quotes around dates
    cleaned = cleaned.replace(/:\s*(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+)/g, ':"$1"');

    const parsed = JSON.parse(cleaned);
    return parsed;
  } catch (e) {
    console.warn("Failed to parse JSON:", value, e);
    return { raw: value, error: true };
  }
}

// Helper function to normalize and format JSON
function normalizeJsonString(value) {
  if (!value) return "null";

  const parsed = safeJsonParse(value);
  if (parsed && !parsed.error) {
    return JSON.stringify(parsed, null, 2);
  }

  // If parsing fails, return the raw string
  return String(value);
}

// Deep comparison to find all differences between two objects
function findDifferences(before, after, path = '') {
  const differences = [];

  const beforeObj = safeJsonParse(before);
  const afterObj = safeJsonParse(after);

  // Handle null/undefined cases
  if (!beforeObj && !afterObj) return differences;
  if (!beforeObj) {
    differences.push({ path: path || 'root', before: 'null', after: afterObj });
    return differences;
  }
  if (!afterObj) {
    differences.push({ path: path || 'root', before: beforeObj, after: 'null' });
    return differences;
  }

  // Recursive comparison function
  function compare(obj1, obj2, currentPath) {
    if (obj1 === obj2) return;

    // Handle different types
    if (typeof obj1 !== typeof obj2) {
      differences.push({
        path: currentPath,
        before: obj1,
        after: obj2,
        beforeType: typeof obj1,
        afterType: typeof obj2
      });
      return;
    }

    // Handle objects
    if (obj1 && obj2 && typeof obj1 === 'object' && typeof obj2 === 'object') {
      // Get all keys from both objects
      const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);

      for (const key of allKeys) {
        const newPath = currentPath ? `${currentPath}.${key}` : key;
        const val1 = obj1[key];
        const val2 = obj2[key];

        if (JSON.stringify(val1) !== JSON.stringify(val2)) {
          compare(val1, val2, newPath);
        }
      }
    }
    // Handle arrays
    else if (Array.isArray(obj1) && Array.isArray(obj2)) {
      const maxLength = Math.max(obj1.length, obj2.length);
      for (let i = 0; i < maxLength; i++) {
        const newPath = `${currentPath}[${i}]`;
        const val1 = obj1[i];
        const val2 = obj2[i];

        if (JSON.stringify(val1) !== JSON.stringify(val2)) {
          compare(val1, val2, newPath);
        }
      }
    }
    // Handle primitive values
    else if (obj1 !== obj2) {
      differences.push({
        path: currentPath,
        before: obj1,
        after: obj2
      });
    }
  }

  compare(beforeObj, afterObj, path);
  return differences;
}

// Component to render JSON with highlighted differences
function HighlightedJsonDiff({ before, after }) {
  const beforeParsed = safeJsonParse(before);
  const afterParsed = safeJsonParse(after);

  // Format the JSON strings
  let beforeFormatted = "null";
  let afterFormatted = "null";

  if (beforeParsed && !beforeParsed.error) {
    beforeFormatted = JSON.stringify(beforeParsed, null, 2);
  } else if (before) {
    beforeFormatted = String(before);
  }

  if (afterParsed && !afterParsed.error) {
    afterFormatted = JSON.stringify(afterParsed, null, 2);
  } else if (after) {
    afterFormatted = String(after);
  }

  // Find differences
  const differences = findDifferences(before, after);

  // Create a map of paths to highlight
  const diffPaths = new Map();
  differences.forEach(diff => {
    diffPaths.set(diff.path, { before: diff.before, after: diff.after });
  });

  // Function to highlight differences in JSON string
  const highlightJsonString = (jsonString, isBefore) => {
    if (!jsonString || jsonString === "null") return jsonString || "null";

    const lines = jsonString.split('\n');
    const highlightedLines = lines.map(line => {
      let shouldHighlight = false;
      let matchedPath = null;

      // Check if this line contains a field that has differences
      for (const [path, values] of diffPaths.entries()) {
        const fieldName = path.split('.').pop().replace(/\[\d+\]/, '');
        const linePattern = new RegExp(`"${fieldName}"\\s*:`);

        if (linePattern.test(line)) {
          shouldHighlight = true;
          matchedPath = path;
          break;
        }
      }

      if (shouldHighlight) {
        // Highlight the entire line in red
        return `<span style="color: #dc2626; font-weight: 500; background-color: #fee2e2; display: inline-block; width: 100%;">${escapeHtml(line)}</span>`;
      }

      return escapeHtml(line);
    });

    return highlightedLines.join('\n');
  };

  // Helper to escape HTML
  const escapeHtml = (str) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  const beforeHtml = highlightJsonString(beforeFormatted, true);
  const afterHtml = highlightJsonString(afterFormatted, false);

  return (
    <div style={{ display: "flex", gap: "16px", flexDirection: "column" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <div>
          <div style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "#374151",
            marginBottom: "8px",
            padding: "4px 8px",
            background: "#f3f4f6",
            borderRadius: "4px"
          }}>
            Before Image
          </div>
          <pre
            style={{
              fontSize: "11px",
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              padding: "12px",
              overflowX: "auto",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              fontFamily: "monospace",
              lineHeight: "1.5",
              margin: 0,
              maxHeight: "500px",
              overflowY: "auto"
            }}
            dangerouslySetInnerHTML={{ __html: beforeHtml }}
          />
        </div>
        <div>
          <div style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "#374151",
            marginBottom: "8px",
            padding: "4px 8px",
            background: "#f3f4f6",
            borderRadius: "4px"
          }}>
            After Image
            {differences.length > 0 && (
              <span style={{
                marginLeft: "8px",
                fontSize: "10px",
                color: "#dc2626",
                background: "#fee2e2",
                padding: "2px 6px",
                borderRadius: "12px"
              }}>
                {differences.length} change{differences.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <pre
            style={{
              fontSize: "11px",
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              padding: "12px",
              overflowX: "auto",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              fontFamily: "monospace",
              lineHeight: "1.5",
              margin: 0,
              maxHeight: "500px",
              overflowY: "auto"
            }}
            dangerouslySetInnerHTML={{ __html: afterHtml }}
          />
        </div>
      </div>
    </div>
  );
}

export default function EventLogs() {
  const { getEvents } = useUserContext();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showDatePopup, setShowDatePopup] = useState(false);
  const [filters, setFilters] = useState({
    tableAffected: "",
    eventAction: "",
    userId: "",
  });

  const datePopupRef = useRef(null);

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

  useEffect(() => {
    function handleClickOutside(e) {
      if (datePopupRef.current && !datePopupRef.current.contains(e.target)) setShowDatePopup(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get unique values for filter dropdowns
  const tableOptions = useMemo(() => {
    return [...new Set(events.map(e => e.tableAffected).filter(Boolean))];
  }, [events]);

  const actionOptions = useMemo(() => {
    return [...new Set(events.map(e => e.eventAction).filter(Boolean))];
  }, [events]);

  const userOptions = useMemo(() => {
    return [...new Set(events.map(e => e.userId).filter(Boolean))];
  }, [events]);

  // Apply filters to events
  const filtered = events.filter((e) => {
    // Search term filter
    const q = searchTerm.trim().toLowerCase();
    if (q && ![
      e.id?.toString(),
      e.userId?.toString(),
      e.tableAffected,
      e.eventAction
    ].join(" ").toLowerCase().includes(q)) {
      return false;
    }

    // Date range filter
    const eventDateStr = formatDateTime(e.timestamp).split(' ')[0];
    if (startDate && eventDateStr < startDate) return false;
    if (endDate && eventDateStr > endDate) return false;

    // Table affected filter
    if (filters.tableAffected && e.tableAffected !== filters.tableAffected) return false;

    // Action filter
    if (filters.eventAction && e.eventAction !== filters.eventAction) return false;

    // User ID filter
    if (filters.userId && String(e.userId) !== String(filters.userId)) return false;

    return true;
  });

  const handleFilterInput = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({ tableAffected: "", eventAction: "", userId: "" });
    setStartDate("");
    setEndDate("");
    setSearchTerm("");
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (startDate) count++;
    if (endDate) count++;
    if (filters.tableAffected) count++;
    if (filters.eventAction) count++;
    if (filters.userId) count++;
    return count;
  };

  if (loading) return <div className={styles.page}><section className={styles.content}><p style={{ padding: "2rem" }}>Loading events…</p></section></div>;
  if (error) return <div className={styles.page}><section className={styles.content}><p style={{ padding: "2rem", color: "red" }}>{error}</p><button onClick={fetchEvents}>Retry</button></section></div>;

  return (
    <div className={styles.page}>
      <section className={styles.content}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            {/* Consolidated Date Range Picker */}
            <div style={{ position: "relative" }} ref={datePopupRef}>
              <button
                onClick={() => setShowDatePopup((prev) => !prev)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "5px 12px",
                  border: "1px solid #90caf9",
                  borderRadius: "6px",
                  color: "#1565c0",
                  background: "#e3f2fd",
                  cursor: "pointer",
                  fontSize: "13px",
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                {startDate && endDate ? `${startDate} → ${endDate}` : (startDate || endDate || "Select Date Range")}
              </button>
              {showDatePopup && (
                <div style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  marginTop: "8px",
                  background: "white",
                  border: "1px solid #e1e8f0",
                  borderRadius: "8px",
                  padding: "12px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                  zIndex: 1000,
                  minWidth: "260px"
                }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div>
                      <label style={{ fontSize: "11px", fontWeight: 500, color: "#6b7280", display: "block", marginBottom: "4px" }}>Start Date</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        style={{
                          padding: "6px 10px",
                          border: "1px solid #d6dde6",
                          borderRadius: "6px",
                          fontSize: "0.85rem",
                          width: "100%",
                          boxSizing: "border-box"
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "11px", fontWeight: 500, color: "#6b7280", display: "block", marginBottom: "4px" }}>End Date</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        style={{
                          padding: "6px 10px",
                          border: "1px solid #d6dde6",
                          borderRadius: "6px",
                          fontSize: "0.85rem",
                          width: "100%",
                          boxSizing: "border-box"
                        }}
                      />
                    </div>
                  </div>
                  {(startDate || endDate) && (
                    <button
                      onClick={() => { setStartDate(""); setEndDate(""); }}
                      style={{
                        marginTop: "12px",
                        padding: "6px 12px",
                        background: "#f0f4fa",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "0.8rem",
                        cursor: "pointer",
                        width: "100%"
                      }}
                    >
                      Clear Dates
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Search Box */}
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

            {/* Filter Button */}
            <button
              onClick={() => setShowFilters((prev) => !prev)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "5px 12px",
                border: "0.5px solid #d1d5db",
                borderRadius: "6px",
                background: "#fff",
                cursor: "pointer",
                fontSize: "13px",
                color: "#374151",
                position: "relative"
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              {showFilters ? "Hide Filters" : "Filter"}
              {getActiveFilterCount() > 0 && (
                <span style={{
                  position: "absolute",
                  top: "-4px",
                  right: "-4px",
                  background: "#6366f1",
                  color: "white",
                  borderRadius: "50%",
                  width: "16px",
                  height: "16px",
                  fontSize: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  {getActiveFilterCount()}
                </span>
              )}
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {getActiveFilterCount() > 0 && (
              <button
                onClick={clearFilters}
                style={{
                  fontSize: "11px",
                  color: "#6366f1",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textDecoration: "underline"
                }}
              >
                Clear all filters
              </button>
            )}
            <span style={{ fontSize: "12px", color: "#6b7280" }}>{filtered.length} events</span>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div style={{
            border: "1px solid #e1e8f0",
            background: "#ffffff",
            borderRadius: "8px",
            padding: "12px",
            marginBottom: "12px"
          }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "10px"
            }}>
              <select
                name="tableAffected"
                value={filters.tableAffected}
                onChange={handleFilterInput}
                style={{
                  border: "1px solid #d6dde6",
                  borderRadius: "6px",
                  padding: "8px 10px",
                  fontSize: "0.82rem",
                  background: "#fff",
                  color: "#333"
                }}
              >
                <option value="">All Tables</option>
                {tableOptions.map((table) => (
                  <option key={table} value={table}>{table}</option>
                ))}
              </select>
              <select
                name="eventAction"
                value={filters.eventAction}
                onChange={handleFilterInput}
                style={{
                  border: "1px solid #d6dde6",
                  borderRadius: "6px",
                  padding: "8px 10px",
                  fontSize: "0.82rem",
                  background: "#fff",
                  color: "#333"
                }}
              >
                <option value="">All Actions</option>
                {actionOptions.map((action) => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
              <select
                name="userId"
                value={filters.userId}
                onChange={handleFilterInput}
                style={{
                  border: "1px solid #d6dde6",
                  borderRadius: "6px",
                  padding: "8px 10px",
                  fontSize: "0.82rem",
                  background: "#fff",
                  color: "#333"
                }}
              >
                <option value="">All Users</option>
                {userOptions.map((userId) => (
                  <option key={userId} value={userId}>{userId}</option>
                ))}
              </select>
            </div>
          </div>
        )}

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
                      <td colSpan={7} style={{ padding: "16px" }}>
                        <HighlightedJsonDiff
                          before={event.beforeImage}
                          after={event.afterImage}
                        />
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