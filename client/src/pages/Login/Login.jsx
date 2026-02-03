import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../../components/Logo";
import styles from "./Login.module.css";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const nav = useNavigate();
  const auth = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  function onSubmit(e) {
    e.preventDefault();
    setMsg("");

    try {
      auth.login({ username, password });
      nav("/app");
    } catch (err) {
      const code = String(err?.message || "");
      if (code.includes("SUSPENDED")) {
        setMsg("Account suspended after 3 wrong attempts. Contact an administrator.");
      } else {
        setMsg("Invalid username or password.");
      }
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoArea}><Logo size={90} /></div>
        <h2 className={styles.title}>Login</h2>

        <form onSubmit={onSubmit}>
          <div className={styles.field}>
            <label>Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>

          <div className={styles.field}>
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          {msg && <div className={styles.error}>{msg}</div>}

          <button className={styles.primaryBtn} type="submit">Sign In</button>
        </form>

        <div className={styles.actions}>
          <Link className={styles.linkBtn} to="/forgot-password">Forgot Password?</Link>
          <Link className={styles.linkBtn} to="/create-user">Create New User</Link>
        </div>
      </div>
    </div>
  );
}




