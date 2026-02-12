import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";

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
  const auth = useAuth();
  const [requests, setRequests] = useState([]);
  const [msg, setMsg] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailMsg, setEmailMsg] = useState("");
  const [outbox, setOutbox] = useState([]);

  function reloadRequests() {
    const list = auth.getAccessRequests();
    setRequests(list);
  }

  function reloadUsers() {
    const list = auth.getAllUsers();
    setUsers(list);
    if (!selectedUser && list.length > 0) {
      setSelectedUser(list[0].username);
    }
  }

  function reloadOutbox() {
    const emails = auth.getEmailOutbox();
    setOutbox(emails);
  }

  useEffect(() => {
    reloadRequests();
    reloadUsers();
    reloadOutbox();
  }, []);

  function approve(id) {
    setMsg("");
    try {
      auth.approveAccessRequest(id, auth.user?.username || "ADMIN");
      setMsg("Request approved and login email sent.");
      reloadRequests();
      reloadUsers();
      reloadOutbox();
    } catch (err) {
      setMsg(err?.message || "Could not approve request.");
    }
  }

  function reject(id) {
    setMsg("");
    try {
      auth.rejectAccessRequest(id, auth.user?.username || "ADMIN");
      setMsg("Request rejected and notification email sent.");
      reloadRequests();
      reloadOutbox();
    } catch (err) {
      setMsg(err?.message || "Could not reject request.");
    }
  }

  function sendUserEmail(e) {
    e.preventDefault();
    setEmailMsg("");

    try {
      auth.sendEmailToUser({
        username: selectedUser,
        subject: emailSubject,
        body: emailBody,
        from: `${auth.user?.username || "admin"}@stoneledger.local`,
      });

      setEmailMsg("Email queued successfully.");
      setEmailSubject("");
      setEmailBody("");
      reloadOutbox();
    } catch (err) {
      setEmailMsg(err?.message || "Could not send email.");
    }
  }

  const pending = requests.filter((r) => r.status === "PENDING");

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

      <div style={{ marginTop: 18, border: "1px solid #23304a", borderRadius: 14, padding: 14, background: "#121a2a" }}>
        <h3 style={{ marginTop: 0, marginBottom: 10 }}>Access Requests</h3>
        {msg && <div style={{ marginBottom: 12, color: "#c7f9cc" }}>{msg}</div>}

        {pending.length === 0 ? (
          <div style={{ color: "#9bb0d1" }}>No pending requests.</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {pending.map((r) => (
              <div key={r.id} style={{ border: "1px solid #2a3a58", borderRadius: 10, padding: 12 }}>
                <div style={{ fontWeight: 700 }}>{r.firstName} {r.lastName}</div>
                <div style={{ color: "#9bb0d1", marginTop: 4 }}>Email: {r.email}</div>
                <div style={{ color: "#9bb0d1" }}>Address: {r.address}</div>
                <div style={{ color: "#9bb0d1" }}>DOB: {r.dob}</div>
                <div style={{ color: "#9bb0d1", marginBottom: 8 }}>Requested: {new Date(r.createdAt).toLocaleString()}</div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => approve(r.id)}
                    style={{ border: "none", borderRadius: 8, padding: "8px 12px", background: "#16a34a", color: "#fff", fontWeight: 700, cursor: "pointer" }}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => reject(r.id)}
                    style={{ border: "none", borderRadius: 8, padding: "8px 12px", background: "#b91c1c", color: "#fff", fontWeight: 700, cursor: "pointer" }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: 18, border: "1px solid #23304a", borderRadius: 14, padding: 14, background: "#121a2a" }}>
        <h3 style={{ marginTop: 0, marginBottom: 10 }}>Send Email to User</h3>

        <form onSubmit={sendUserEmail}>
          <label style={{ display: "block", marginBottom: 6, color: "#9bb0d1" }}>User</label>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            style={{ width: "100%", marginBottom: 10, padding: "10px 12px", borderRadius: 10, border: "1px solid #2a3a58", background: "#0b0f17", color: "#e9eef8" }}
          >
            {users.map((u) => (
              <option key={u.username} value={u.username}>
                {u.username} ({u.email || "no-email"})
              </option>
            ))}
          </select>

          <label style={{ display: "block", marginBottom: 6, color: "#9bb0d1" }}>Subject</label>
          <input
            value={emailSubject}
            onChange={(e) => setEmailSubject(e.target.value)}
            style={{ width: "100%", marginBottom: 10, padding: "10px 12px", borderRadius: 10, border: "1px solid #2a3a58", background: "#0b0f17", color: "#e9eef8" }}
          />

          <label style={{ display: "block", marginBottom: 6, color: "#9bb0d1" }}>Message</label>
          <textarea
            value={emailBody}
            onChange={(e) => setEmailBody(e.target.value)}
            rows={4}
            style={{ width: "100%", marginBottom: 10, padding: "10px 12px", borderRadius: 10, border: "1px solid #2a3a58", background: "#0b0f17", color: "#e9eef8", resize: "vertical" }}
          />

          {emailMsg && <div style={{ marginBottom: 10, color: "#c7f9cc" }}>{emailMsg}</div>}

          <button
            type="submit"
            style={{ border: "none", borderRadius: 8, padding: "10px 14px", background: "#1d4ed8", color: "#fff", fontWeight: 700, cursor: "pointer" }}
          >
            Send Email
          </button>
        </form>
      </div>

      <div style={{ marginTop: 18, border: "1px solid #23304a", borderRadius: 14, padding: 14, background: "#121a2a" }}>
        <h3 style={{ marginTop: 0, marginBottom: 10 }}>Email Outbox</h3>

        {outbox.length === 0 ? (
          <div style={{ color: "#9bb0d1" }}>No emails sent yet.</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {outbox.slice(0, 10).map((mail) => (
              <div key={mail.id} style={{ border: "1px solid #2a3a58", borderRadius: 10, padding: 12 }}>
                <div style={{ fontWeight: 700 }}>{mail.subject}</div>
                <div style={{ color: "#9bb0d1", marginTop: 4 }}>To: {mail.to}</div>
                <div style={{ color: "#9bb0d1", marginTop: 2 }}>Sent: {new Date(mail.sentAt).toLocaleString()}</div>
                <div style={{ color: "#d4deef", marginTop: 8, whiteSpace: "pre-wrap" }}>{mail.body}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
