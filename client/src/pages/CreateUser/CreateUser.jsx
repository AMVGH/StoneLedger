import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./CreateUser.module.css";
import Logo from "../../components/Logo";
import { useAuth } from "../../context/AuthContext";
import { validatePassword, PASSWORD_POLICY_MESSAGE } from "../../utils/validators";

function Rule({ ok, text }) {
  return (
    <div className={ok ? styles.ruleOk : styles.ruleNo}>
      <span className={styles.ruleIcon}>{ok ? "✓" : "•"}</span>
      <span>{text}</span>
    </div>
  );
}

export default function CreateUser() {
  const nav = useNavigate();
  const auth = useAuth();

  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [address, setAddress] = useState("");
  const [dob, setDob] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [msg, setMsg] = useState("");

  const { rules: passwordRules } = validatePassword(password);

  function onSubmit(e) {
    e.preventDefault();
    setMsg("");

    if (!first.trim() || !last.trim() || !address.trim() || !dob || !email.trim() || !password || !confirmPassword) {
      setMsg("Please complete first name, last name, address, DOB, email, and password.");
      return;
    }

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!emailOk) {
      setMsg("Please enter a valid email address.");
      return;
    }

    const { ok: passwordOk } = validatePassword(password);
    if (!passwordOk) {
      setMsg(PASSWORD_POLICY_MESSAGE);
      return;
    }

    if (password !== confirmPassword) {
      setMsg("Password and confirm password do not match.");
      return;
    }

    try {
      auth.requestAccess({
        firstName: first.trim(),
        lastName: last.trim(),
        address: address.trim(),
        dob,
        email: email.trim(),
        password,
      });

      setMsg("Access request submitted. An administrator will review your request and email you the login link if approved.");
      setTimeout(() => nav("/login"), 1200);
    } catch (err) {
      setMsg(err?.message || "Could not submit request.");
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoRow}>
          <Logo size={60} />
        </div>

        <h2 className={styles.title}>Request Access</h2>

        <form onSubmit={onSubmit}>
          <div className={styles.row}>
            <div>
              <label className={styles.label}>First Name</label>
              <input
                className={styles.input}
                value={first}
                onChange={(e) => setFirst(e.target.value)}
              />
            </div>

            <div>
              <label className={styles.label}>Last Name</label>
              <input
                className={styles.input}
                value={last}
                onChange={(e) => setLast(e.target.value)}
              />
            </div>
          </div>

          <label className={styles.label}>Address</label>
          <input
            className={styles.input}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Street, city, state"
          />

          <label className={styles.label}>Date of Birth</label>
          <input
            className={styles.input}
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
          />

          <label className={styles.label}>Email</label>
          <input
            className={styles.input}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />

          <label className={styles.label}>Password</label>
          <input
            className={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a strong password"
            autoComplete="new-password"
          />

          <label className={styles.label}>Confirm Password</label>
          <input
            className={styles.input}
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your password"
            autoComplete="new-password"
          />

          <div className={styles.passwordRules}>
            <div className={styles.rulesTitle}>Password must:</div>
            <Rule ok={passwordRules.minLen} text="Be at least 8 characters" />
            <Rule ok={passwordRules.startsWithLetter} text="Start with a letter" />
            <Rule ok={passwordRules.letter} text="Contain a letter" />
            <Rule ok={passwordRules.number} text="Contain a number" />
            <Rule ok={passwordRules.symbol} text="Contain a special character" />
          </div>

          {msg && <div className={styles.msg}>{msg}</div>}

          <button className={styles.primaryBtn} type="submit">
            Submit Access Request
          </button>
        </form>

        <div className={styles.actions}>
          <Link to="/login">← Back to Login</Link>
        </div>
      </div>
    </div>
  );
}


