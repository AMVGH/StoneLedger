import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./CreateUser.module.css";
import Logo from "../../components/Logo";
import { generateUsername } from "../../utils/usernameGenerator";
import { useAuth } from "../../context/AuthContext";

/**
 * Password rules:
 * - minimum 8 characters
 * - must start with a letter
 * - must have a letter, a number, and a special character
 */
function validatePasswordRules(password) {
  return {
    minLength: password.length >= 8,
    startsWithLetter: /^[A-Za-z]/.test(password),
    hasLetter: /[A-Za-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };
}

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
  const [role, setRole] = useState("ACCOUNTANT");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    setUsername(generateUsername(first, last));
  }, [first, last]);

  const rules = useMemo(() => validatePasswordRules(password), [password]);
  const passwordOk = useMemo(() => Object.values(rules).every(Boolean), [rules]);

  function onSubmit(e) {
    e.preventDefault();
    setMsg("");

    if (!first.trim() || !last.trim()) {
      setMsg("Please enter first and last name.");
      return;
    }

    if (!username) {
      setMsg("Username could not be generated. Check names and try again.");
      return;
    }

    if (!passwordOk) {
      setMsg("Password does not meet the required guidelines.");
      return;
    }

    try {
      auth.signup({
        firstName: first.trim(),
        lastName: last.trim(),
        username,
        role,
        password,
      });

      setMsg("User created. You can now log in.");
      setTimeout(() => nav("/login"), 400);
    } catch (err) {
      setMsg(err?.message || "Could not create user.");
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoRow}>
          <Logo size={60} />
        </div>

        <h2 className={styles.title}>Create New User</h2>

        <form onSubmit={onSubmit}>
          <div className={styles.row}>
            <div>
              <label>First Name</label>
              <input value={first} onChange={(e) => setFirst(e.target.value)} />
            </div>

            <div>
              <label>Last Name</label>
              <input value={last} onChange={(e) => setLast(e.target.value)} />
            </div>
          </div>

          <label>Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className={styles.select}
          >
            <option value="ADMIN">Administrator</option>
            <option value="MANAGER">Manager</option>
            <option value="ACCOUNTANT">Regular User (Accountant)</option>
          </select>

          <label>Username (auto-generated)</label>
          <input value={username} readOnly />

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter a strong password"
            aria-describedby="passwordRules"
          />

          {/* Live password rules helper box */}
          <div id="passwordRules" className={styles.passwordRules}>
            <div className={styles.rulesTitle}>Password must:</div>
            <Rule ok={rules.minLength} text="Be at least 8 characters" />
            <Rule ok={rules.startsWithLetter} text="Start with a letter" />
            <Rule ok={rules.hasLetter} text="Contain a letter" />
            <Rule ok={rules.hasNumber} text="Contain a number" />
            <Rule ok={rules.hasSpecial} text="Contain a special character" />
          </div>

          {msg && <div className={styles.msg}>{msg}</div>}

          <button className={styles.primaryBtn} type="submit" disabled={!passwordOk}>
            Create Account
          </button>
        </form>

        <div className={styles.actions}>
          <Link to="/login">← Back to Login</Link>
        </div>
      </div>
    </div>
  );
}


