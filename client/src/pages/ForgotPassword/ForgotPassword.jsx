import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../../components/Logo";
import styles from "./ForgotPassword.module.css";
import { useAuth } from "../../context/AuthContext";
import { validatePassword } from "../../utils/validators";

export default function ForgotPassword() {
  const nav = useNavigate();
  const auth = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [stage, setStage] = useState("identify");
  const [msg, setMsg] = useState("");

  function submitIdentify(e) {
    e.preventDefault();
    setMsg("");

    if (!username.trim() || !email.trim()) {
      setMsg("Please enter both User ID and email address.");
      return;
    }

    try {
      const q = auth.getSecurityQuestionsForReset({
        username: username.trim(),
        email: email.trim(),
      });
      setQuestions(q);
      setAnswers(q.reduce((acc, item) => ({ ...acc, [item.id]: "" }), {}));
      setStage("verify");
    } catch (err) {
      setMsg(err?.message || "Could not start password reset.");
    }
  }

  function submitVerify(e) {
    e.preventDefault();
    setMsg("");

    const allAnswered = questions.every((q) => String(answers[q.id] || "").trim());
    if (!allAnswered) {
      setMsg("Please answer all security questions.");
      return;
    }

    try {
      auth.verifySecurityAnswers({
        username: username.trim(),
        email: email.trim(),
        answers,
      });
      setStage("reset");
    } catch (err) {
      setMsg(err?.message || "Could not verify security answers.");
    }
  }

  function submitReset(e) {
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
      setMsg("Password must be 12+ chars and include upper, lower, number, and symbol.");
      return;
    }

    try {
      auth.resetPasswordBySecurity({
        username: username.trim(),
        email: email.trim(),
        answers,
        newPassword,
      });
      setStage("done");
      setMsg("Password changed successfully. Redirecting to login...");
      setTimeout(() => nav("/login"), 900);
    } catch (err) {
      setMsg(err?.message || "Could not reset password.");
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

        {stage === "verify" && (
          <form onSubmit={submitVerify}>
            {questions.map((q) => (
              <div key={q.id} className={styles.group}>
                <label className={styles.label}>{q.question}</label>
                <input
                  className={styles.input}
                  value={answers[q.id] || ""}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                />
              </div>
            ))}

            {msg && <div className={styles.msg}>{msg}</div>}
            <button className={styles.primaryBtn} type="submit">Verify Answers</button>
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
