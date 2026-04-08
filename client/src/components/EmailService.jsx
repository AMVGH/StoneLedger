import React, { useEffect, useMemo, useState } from "react";
import useUserContext from "../API/UserContext";

export default function EmailService() {
  const { getFinancialAccounts, getAllUsers, issueEmailToUser } = useUserContext();
  const [chartAccounts, setChartAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState({ type: "", message: "" });
  const token = localStorage.getItem("authToken");

  useEffect(() => {
    let mounted = true;

    async function loadChartOfAccounts() {
      setLoading(true);
      setError("");
      try {
        const data = await getFinancialAccounts(token);
        const entries = Array.isArray(data) ? data : [];
        if (mounted) setChartAccounts(entries);
      } catch (err) {
        if (mounted) {
          setError(err?.response?.data?.message || err?.message || "Failed to fetch chart of accounts.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadChartOfAccounts();
    return () => {
      mounted = false;
    };
  }, [getFinancialAccounts, token]);

  const selectableAccounts = useMemo(() => {
    return (chartAccounts || [])
      .map((account) => ({
        id: String(account?.accountNumber ?? account?.id ?? "").trim(),
        accountNumber: account?.accountNumber ?? "",
        accountName: account?.accountName ?? "",
      }))
      .filter((account) => account.id)
      .sort((a, b) => {
      const nameA = `${a.accountNumber} ${a.accountName}`.toLowerCase();
      const nameB = `${b.accountNumber} ${b.accountName}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [chartAccounts]);

  const selectedAccount = selectableAccounts.find((account) => account.id === selectedAccountId) || null;

  const handleAccountChange = (value) => {
    setSelectedAccountId(value);
    setSendStatus({ type: "", message: "" });
    if (!value) {
      setEmailBody("");
      return;
    }

    const account = selectableAccounts.find((item) => item.id === value);
    const accountLabel = account
      ? `${account.accountNumber ? `${account.accountNumber} - ` : ""}${account.accountName}`
      : "selected account";

    setEmailBody(
      `Hello,\n\nAn update is available regarding impacted account ${accountLabel}.\n\nPlease review and contact support if you need assistance.\n\nThanks,\nStoneLedger`
    );
  };

  const handleSendEmail = async () => {
    setSendStatus({ type: "", message: "" });
    if (!emailBody.trim()) {
      setSendStatus({ type: "error", message: "Please enter an email message." });
      return;
    }

    setSending(true);
    try {
      const allUsers = await getAllUsers(token);
      const activeAdminEmails = (Array.isArray(allUsers) ? allUsers : [])
        .filter((user) => user?.userRole === "ADMINISTRATOR" && user?.active && user?.email)
        .map((user) => String(user.email).trim())
        .filter(Boolean);

      if (activeAdminEmails.length === 0) {
        setSendStatus({ type: "error", message: "No active administrator emails found." });
        return;
      }

      await Promise.all(
        activeAdminEmails.map((email) =>
          issueEmailToUser(
            {
              targetEmail: email,
              emailBody: emailBody.trim(),
            },
            token
          )
        )
      );

      setSendStatus({ type: "success", message: `Email sent to ${activeAdminEmails.length} active admin(s).` });
      setEmailBody("");
      setSelectedAccountId("");
    } catch (err) {
      setSendStatus({
        type: "error",
        message: err?.response?.data?.message || err?.message || "Failed to send email.",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "10px",
        padding: "20px",
        color: "#374151",
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: "8px", color: "#111827" }}>
        Email Service
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxWidth: "460px" }}>
        <label htmlFor="impactedAccountSelect" style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>
          Chart Of Accounts
        </label>
        <select
          id="impactedAccountSelect"
          value={selectedAccountId}
          onChange={(e) => handleAccountChange(e.target.value)}
          disabled={loading || selectableAccounts.length === 0}
          style={{
            height: "40px",
            borderRadius: "8px",
            border: "1px solid #d1d5db",
            padding: "0 10px",
            background: "#fff",
            color: "#111827",
          }}
        >
          <option value="">
            {loading ? "Loading chart of accounts..." : "Select a chart of accounts entry"}
          </option>
          {selectableAccounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.accountNumber ? `${account.accountNumber} - ` : ""}{account.accountName}
            </option>
          ))}
        </select>

        {error && <p style={{ margin: 0, color: "#b91c1c", fontSize: "13px" }}>{error}</p>}

        {!loading && !error && selectableAccounts.length === 0 && (
          <p style={{ margin: 0, color: "#6b7280", fontSize: "13px" }}>
            No chart of accounts data is available to select.
          </p>
        )}

        {selectedAccount && (
          <p style={{ margin: 0, color: "#374151", fontSize: "13px" }}>
            Connected account: {selectedAccount.accountNumber ? `${selectedAccount.accountNumber} - ` : ""}
            {selectedAccount.accountName}
          </p>
        )}

        {sendStatus.message && (
          <p style={{ margin: 0, color: sendStatus.type === "error" ? "#b91c1c" : "#166534", fontSize: "13px" }}>
            {sendStatus.message}
          </p>
        )}
      </div>

      {selectedAccount && (
        <div
          style={{
            marginTop: "14px",
            width: "100%",
            maxWidth: "560px",
            background: "#fff",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            padding: "18px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <h4 style={{ margin: 0, color: "#111827" }}>Send Email For Selected Account</h4>
          <p style={{ margin: 0, fontSize: "13px", color: "#374151" }}>
            {selectedAccount.accountNumber ? `${selectedAccount.accountNumber} - ` : ""}
            {selectedAccount.accountName}
          </p>

          <label htmlFor="emailBody" style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>
            Message
          </label>
          <textarea
            id="emailBody"
            value={emailBody}
            onChange={(e) => setEmailBody(e.target.value)}
            rows={8}
            placeholder="Write your email message"
            style={{
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              padding: "10px",
              resize: "vertical",
              fontSize: "14px",
              fontFamily: "inherit",
            }}
          />

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
            <button
              type="button"
              onClick={() => {
                setSelectedAccountId("");
                setEmailBody("");
                setSendStatus({ type: "", message: "" });
              }}
              disabled={sending}
              style={{
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                background: "#fff",
                padding: "8px 14px",
                fontSize: "13px",
                cursor: sending ? "not-allowed" : "pointer",
              }}
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleSendEmail}
              disabled={sending}
              style={{
                border: "none",
                borderRadius: "8px",
                background: "#2563eb",
                color: "#fff",
                padding: "8px 14px",
                fontSize: "13px",
                cursor: sending ? "not-allowed" : "pointer",
              }}
            >
              {sending ? "Sending..." : "Send Email"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
