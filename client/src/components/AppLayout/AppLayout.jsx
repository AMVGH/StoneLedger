import { Link, Outlet } from "react-router-dom";
import Logo from "../Logo";
import styles from "./AppLayout.module.css";
import { useAuth } from "../../context/AuthContext";

export default function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <Logo />
          <div>
            <div className={styles.title}>StoneLedger</div>
            <div className={styles.sub}>
              {user?.username} · {user?.role}
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
