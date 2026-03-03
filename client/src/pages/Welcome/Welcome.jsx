import { Link } from "react-router-dom";
import styles from "./Welcome.module.css";
import heroImg from "../../assets/High_Definition_Mountains.png";
import sLogo from "../../assets/mountain.png";

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
            A web-based accounting system designed for financial {" "}
            <b>Administrators</b>, <b>Managers</b>, and <b>Accountants</b> alike.
          </p>

          <div className={styles.features}>
            <div className={styles.featureItem}>
              <div className={styles.featureTitle}>Tailored Dashboards</div>
              <div className={styles.featureText}>
                Only the tools you need, right when you need them.
              </div>
            </div>

            <div className={styles.featureItem}>
              <div className={styles.featureTitle}>Multi Platform</div>
              <div className={styles.featureText}>
                Your data, anywhere you are.
              </div>
            </div>

            <div className={styles.featureItem}>
              <div className={styles.featureTitle}>Modern Setup</div>
              <div className={styles.featureText}>
                Simple setup, powerful results.
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
