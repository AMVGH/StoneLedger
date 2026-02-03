import { useState } from "react";
import { Link } from "react-router-dom";
import Logo from "../../components/Logo";
import styles from "./ForgotPassword.module.css";

export default function ForgotPassword() {
  const [username, setUsername] = useState("");
  const [msg, setMsg] = useState("");

  function submit(e) {
    e.preventDefault();
    setMsg("Demo: In a real system, a reset link/token would be sent securely.");
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoArea}><Logo size={70} /></div>
        <h2 className={styles.title}>Forgot Password</h2>

        <form onSubmit={submit}>
          <label>Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} />
          {msg && <div className={styles.msg}>{msg}</div>}
          <button className={styles.primaryBtn} type="submit">Request Reset</button>
        </form>

        <div className={styles.actions}>
          <Link to="/login">← Back to Login</Link>
        </div>
      </div>
    </div>
  );
}
