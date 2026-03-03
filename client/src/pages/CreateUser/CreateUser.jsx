import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./CreateUser.module.css";
import Logo from "../../components/Logo";
import { validatePassword, PASSWORD_POLICY_MESSAGE } from "../../utils/validators";

function Rule({ ok, text }) {
  return (
    <div className={ok ? styles.ruleOk : styles.ruleNo}>
      <span className={styles.ruleIcon}>{ok ? "✓" : "•"}</span>
      <span>{text}</span>
    </div>
  );
}

function Toast({ message, onClose }) {
  return (
    <div className={styles.toastOverlay}>
      <div className={styles.toast}>
        <div className={styles.toastIcon}>✓</div>
        <div className={styles.toastContent}>
          <div className={styles.toastTitle}>Request Submitted!</div>
          <div className={styles.toastMessage}>{message}</div>
        </div>
        <button className={styles.toastClose} onClick={onClose}>×</button>
      </div>
    </div>
  );
}

export default function CreateUser() {
  const nav = useNavigate();

  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [address, setAddress] = useState("");
  const [dob, setDob] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("USER");
  const [msg, setMsg] = useState("");
  const [showToast, setShowToast] = useState(false);

  const { rules: passwordRules } = validatePassword(password);

  const handleClearAll = () => {
    setFirst("");
    setLast("");
    setAddress("");
    setDob("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setRole("USER");
    setMsg("");
  };

  function handleToastClose() {
    setShowToast(false);
    nav("/login");
  }

  async function onSubmit(e) {
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
      const response = await fetch("http://localhost:8080/api/auth/request-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: first.trim(),
          lastName: last.trim(),
          userAddress: address.trim(),
          dateOfBirth: dob,
          email: email.trim(),
          password,
          userRole: role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMsg(data?.message || "Could not submit request.");
        return;
      }

      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        nav("/login");
      }, 5000);
    } catch (err) {
      setMsg("Something went wrong. Please try again.");
    }
  }

  return (
    <div className={styles.page}>
      {showToast && (
        <Toast
          message="Your access request has been received. An administrator will review it and email you if approved."
          onClose={handleToastClose}
        />
      )}

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
            placeholder="Street, City, State"
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
            placeholder="example@email.com"
          />

          <label className={styles.label}>Password</label>
          <input
            className={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create A Strong Password"
            autoComplete="new-password"
          />

          <label className={styles.label}>Confirm Password</label>
          <input
            className={styles.input}
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-Enter Your Password"
            autoComplete="new-password"
          />

          <label className={styles.label}>Request Role</label>
          <select
            className={styles.select}
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="USER">User</option>
            <option value="MANAGER">Manager</option>
            <option value="ADMINISTRATOR">Administrator</option>
          </select>

          <div className={styles.passwordRules}>
            <div className={styles.rulesTitle}>Password must:</div>
            <Rule ok={passwordRules.minLen} text="Be at least 8 characters" />
            <Rule ok={passwordRules.startsWithLetter} text="Start with a letter" />
            <Rule ok={passwordRules.letter} text="Contain a letter" />
            <Rule ok={passwordRules.number} text="Contain a number" />
            <Rule ok={passwordRules.symbol} text="Contain a special character" />
          </div>

          {msg && <div className={styles.msg}>{msg}</div>}

          <div className={styles.buttonGroup}>
          <button className={styles.secondaryBtn} type="button" onClick={handleClearAll}>
               Clear All Fields
            </button>
            <button className={styles.primaryBtn} type="submit">
              Submit Access Request
            </button>
          </div>
        </form>

        <div className={styles.actions}>
          <Link to="/login">← Back to Login</Link>
        </div>
      </div>
    </div>
  );
}