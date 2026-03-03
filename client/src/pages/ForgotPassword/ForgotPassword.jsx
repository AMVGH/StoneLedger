import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../../components/Logo";
import styles from "./ForgotPassword.module.css";
import { validatePassword, PASSWORD_POLICY_MESSAGE } from "../../utils/validators";

export default function ForgotPassword() {
  const nav = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [stage, setStage] = useState("identify");
  const [msg, setMsg] = useState("");

  async function submitIdentify(e) {
    e.preventDefault();
    setMsg("");

    if (!username.trim() || !email.trim()) {
      setMsg("Please enter both User ID and email address.");
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/api/auth/forgot-password/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMsg(data?.message || "Could not start password reset.");
        return;
      }

      setStage("reset");
    } catch (err) {
      setMsg("Something went wrong. Please try again.");
    }
  }

  async function submitReset(e) {
    e.preventDefault();
    setMsg("");

    if (!newPassword || !confirmPassword) {
      setMsg("Please enter and confirm your new password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMsg("New password and confirmation do not match.");
      return;
    }

    const { ok } = validatePassword(newPassword);
    if (!ok) {
      setMsg(PASSWORD_POLICY_MESSAGE);
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/api/auth/forgot-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), email: email.trim(), newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMsg(data?.message || "Could not reset password.");
        return;
      }

      setStage("done");
      setMsg("Password changed successfully. Redirecting to login...");
      setTimeout(() => nav("/login"), 900);
    } catch (err) {
      setMsg("Something went wrong. Please try again.");
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoArea}><Logo size={70} /></div>
        <h2 className={styles.title}>Forgot Password</h2>

        {stage === "identify" && (
          <form onSubmit={submitIdentify}>
            <label className={styles.label}>User ID</label>
            <input
              className={styles.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />

            <label className={styles.label}>Email Address</label>
            <input
              className={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />

            {msg && <div className={styles.msg}>{msg}</div>}
            <button className={styles.primaryBtn} type="submit">Continue</button>
          </form>
        )}

        {stage === "reset" && (
          <form onSubmit={submitReset}>
            <label className={styles.label}>New Password</label>
            <input
              className={styles.input}
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />

            <label className={styles.label}>Confirm New Password</label>
            <input
              className={styles.input}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />

            {msg && <div className={styles.msg}>{msg}</div>}
            <button className={styles.primaryBtn} type="submit">Set New Password</button>
          </form>
        )}

        {stage === "done" && (
          <div className={styles.msg}>{msg}</div>
        )}

        <div className={styles.actions}>
          <Link to="/login">← Back to Login</Link>
        </div>
      </div>
    </div>
  );
}