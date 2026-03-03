import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import styles from "./Login.module.css";
import heroImg from "../../assets/suit.jpg";
import sLogo from "../../assets/SmLogo.jpg";

export default function Login() {
  const nav = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");

    console.log("Form submitted");
    console.log("Username:", username);
    console.log("Password:", password);

    try {
      console.log("Attempting fetch...");
      
      const response = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      const data = await response.json();
      console.log("Response data:", data);

      if (!response.ok) {
        const errorMsg = data?.message || "";
        console.log("Error message from backend:", errorMsg);
        if (errorMsg.includes("SUSPENDED")) {
          setMsg("Account suspended after 3 wrong attempts. Contact an administrator.");
        } else {
          setMsg("Invalid username or password.");
        }
        return;
      }

      const loginData = data.data;
      console.log("Login data:", loginData);
      localStorage.setItem("token", loginData.jsonWebToken);
      localStorage.setItem("user", JSON.stringify(loginData));

      nav("/dashboard");
    } catch (err) {
      console.log("Catch block hit, error:", err);
      setMsg("Something went wrong. Please try again.");
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        {/* Left (Form) */}
        <section className={styles.left}>
          <div className={styles.logoRow}>
            <img src={sLogo} alt="App Logo"  className={styles.logo} />
          </div>

          <h1 className={styles.title}>Log in</h1>

          <form onSubmit={onSubmit} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>Username</label>
              <input
                className={styles.input}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="  Your Username"
                autoComplete="username"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Password</label>
              <input
                className={styles.input}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </div>

            {msg && <div className={styles.error}>{msg}</div>}

            <button className={styles.primaryBtn} type="submit">
              Login
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




