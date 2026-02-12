import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./CreateUser.module.css";
import Logo from "../../components/Logo";
import { useAuth } from "../../context/AuthContext";

export default function CreateUser() {
  const nav = useNavigate();
  const auth = useAuth();

  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [address, setAddress] = useState("");
  const [dob, setDob] = useState("");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  function onSubmit(e) {
    e.preventDefault();
    setMsg("");

    if (!first.trim() || !last.trim() || !address.trim() || !dob || !email.trim()) {
      setMsg("Please complete first name, last name, address, DOB, and email.");
      return;
    }

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!emailOk) {
      setMsg("Please enter a valid email address.");
      return;
    }

    try {
      auth.requestAccess({
        firstName: first.trim(),
        lastName: last.trim(),
        address: address.trim(),
        dob,
        email: email.trim(),
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


