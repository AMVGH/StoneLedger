import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import styles from "./Login.module.css";
import heroImg from "../../assets/High_Definition_Hero.png";
import sLogo from "../../assets/mountain.png";
import useUserContext from "../../API/UserContext";

export default function Login() {
  const nav = useNavigate();
  const { login } = useUserContext();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    try {
      const loginData = await login(username, password);

      // Store token and user data
      localStorage.setItem("authToken", loginData.jsonWebToken);
      localStorage.setItem("user", JSON.stringify(loginData));

      nav("/dashboard");
    } catch (err) {
      const errorMsg = err.message || "";
      if (errorMsg.includes("SUSPENDED")) {
        setMsg("Account suspended after 3 wrong attempts. Contact an administrator.");
      } else {
        setMsg("Invalid username or password.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
      <div className={styles.page}>
        <div className={styles.shell}>
          {/* Left (Form) */}
          <section className={styles.left}>
            <div className={styles.logoRow}>
              <img src={sLogo} alt="App Logo" className={styles.logo} />
            </div>

            <h1 className={styles.title}>Log in</h1>

            <form onSubmit={onSubmit} className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>Username</label>
                <input
                    className={styles.input}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                    autoComplete="username"
                    disabled={loading}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Password</label>
                <input
                    className={styles.input}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    autoComplete="current-password"
                    disabled={loading}
                />
              </div>

              {msg && <div className={styles.error}>{msg}</div>}

              <button className={styles.primaryBtn} type="submit" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </button>

              <div className={styles.linksRow}>
                <Link className={styles.link} to="/forgot-password">
                  Forgot password?
                </Link>
              </div>

              <div className={styles.footerRow}>
                <span className={styles.muted}>Don&apos;t have an account?</span>{" "}
                <Link className={styles.linkStrong} to="/create-user">
                  Register here
                </Link>
              </div>
            </form>
          </section>

          {/* Right (Image) */}
          <section
              className={styles.right}
              style={{ backgroundImage: `url(${heroImg})` }}
              aria-hidden="true"
          >
            <div className={styles.rightOverlay} />
          </section>
        </div>
      </div>
  );
}