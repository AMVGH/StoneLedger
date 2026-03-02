import React from "react";
import styles from "./DashBoard.module.css";
import Logo from "../../components/Logo";

export default function DashBoard() {
  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <Logo size={40} />
          <span className={styles.brandText}>StoneLedger</span>
        </div>

        <nav className={styles.nav}>
          <button className={styles.navItem}>User Management</button>
          <button className={styles.navItem}>Pending</button>
          <button className={styles.navItem}>Requesting</button>
          <button className={styles.navItem}>Expired Passwords</button>
        </nav>
      </aside>

      <main className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.searchWrap}>
            <input className={styles.search} placeholder="Search users, requests..." />
          </div>

          <div className={styles.profile}>
            <div className={styles.avatar}>
              <Logo size={36} />
            </div>
            <div className={styles.name}>Admin User</div>
          </div>
        </header>

        <section className={styles.content}>
          <h2>Hellow World</h2>
          <p>This is a simple dashboard layout. Select an item from the sidebar.</p>
        </section>
      </main>
    </div>
  );
}
