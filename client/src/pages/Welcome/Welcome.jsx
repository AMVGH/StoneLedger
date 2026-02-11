import { Link } from "react-router-dom";
import styles from "./Welcome.module.css";
import heroImg from "../../assets/suit.jpg"; // you can change this later
import sLogo from "../../assets/SmLogo.jpg"; // your small logo

export default function Welcome() {
  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        {/* Left (Content) */}
        <section className={styles.left}>
          <div className={styles.logoRow}>
            <img src={sLogo} alt="App Logo" className={styles.logo} />
          </div>

          <h1 className={styles.title}>Welcome to StoneLedger</h1>

          <p className={styles.subtitle}>
            A web-based accounting system with role-based access for{" "}
            <b>Administrators</b>, <b>Managers</b>, and <b>Accountants</b>.
          </p>

          <div className={styles.features}>
            <div className={styles.featureItem}>
              <div className={styles.featureTitle}>Role-based dashboards</div>
              <div className={styles.featureText}>
                Each user type sees the tools they need.
              </div>
            </div>

            <div className={styles.featureItem}>
              <div className={styles.featureTitle}>Web + responsive</div>
              <div className={styles.featureText}>
                Works on computers, tablets, and mobile.
              </div>
            </div>

            <div className={styles.featureItem}>
              <div className={styles.featureTitle}>Guided setup</div>
              <div className={styles.featureText}>
                Create users and enforce password rules.
              </div>
            </div>
          </div>

          <div className={styles.ctaRow}>
            <Link className={styles.primaryBtn} to="/login">
              Go to Login
            </Link>

          </div>

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
