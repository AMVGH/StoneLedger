import { useNavigate } from "react-router-dom";
import logo from "../../assets/WhiteMtn.png";
import styles from "./Welcome.module.css";

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div
      className={styles.page}
      style={{ backgroundImage: `url(${logo})` }}
    >
      <div className={styles.card}>
        <h1 className={styles.title}>Stone Ledger</h1>

        <p className={styles.subtitle}>
          A web-based accounting system with role-based access for
          <b> Administrator</b>, <b> Manager</b>, and <b> Accountant</b>.
        </p>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.button}
            onClick={() => navigate("/login")}
          >
            Go to Login
          </button>
        </div>
      </div>
    </div>
  );
}
