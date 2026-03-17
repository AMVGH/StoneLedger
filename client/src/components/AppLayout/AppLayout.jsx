import { Link, Outlet, useNavigate } from "react-router-dom";
import Logo from "../Logo";
import styles from "./AppLayout.module.css";

export default function AppLayout() {
  const nav = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    nav("/login");
  }

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <Logo />
          <div>
            <div className={styles.title}>StoneLedger</div>
            <div className={styles.sub}>
              {user?.username} · {user?.userRole}
            </div>
          </div>
        </div>

        <nav className={styles.nav}>
          <Link to="/app">Dashboard</Link>
          <button onClick={logout} className={styles.logout}>Logout</button>
        </nav>
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}