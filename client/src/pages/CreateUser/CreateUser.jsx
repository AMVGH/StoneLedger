import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./CreateUser.module.css";
import Logo from "../../components/Logo";
import { generateUsername } from "../../utils/usernameGenerator";
import { validatePassword } from "../../utils/validators";
import { useAuth } from "../../context/AuthContext";

export default function CreateUser() {
  const nav = useNavigate();
  const auth = useAuth();

  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [role, setRole] = useState("ACCOUNTANT");
  const [username, setUsername] = useState("");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");

  const v = validatePassword(pw);

  useEffect(() => {
    setUsername(generateUsername(first, last));
  }, [first, last]);

  function onSubmit(e) {
    e.preventDefault();
    setMsg("");

    if (!username) return setMsg("Enter first and last name.");
    if (!v.ok) return setMsg("Password does not meet complexity.");

    try {
      auth.signup({ firstName: first, lastName: last, username, role, password: pw });
      setMsg("User created. You can now log in.");
      setTimeout(() => nav("/login"), 400);
    } catch (err) {
      setMsg(err.message || "Could not create user.");
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoArea}><Logo size={70} /></div>
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
          <select value={role} onChange={(e) => setRole(e.target.value)} className={styles.select}>
            <option value="ADMIN">Administrator</option>
            <option value="MANAGER">Manager</option>
            <option value="ACCOUNTANT">Regular User (Accountant)</option>
          </select>

          <label>Username (auto)</label>
          <input value={username} readOnly />

          <label>Password</label>
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} />

          <div className={styles.hint}>
            Must be 12+ chars, upper/lower/number/symbol.
          </div>

          {msg && <div className={styles.msg}>{msg}</div>}

          <button className={styles.primaryBtn} type="submit">Create User</button>
        </form>

        <div className={styles.actions}>
          <Link to="/login">← Back to Login</Link>
        </div>
      </div>
    </div>
  );
}

