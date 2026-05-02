import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./CreateUser.module.css";
import Logo from "../../assets/mountain.png";
import { validatePassword, PASSWORD_POLICY_MESSAGE } from "../../utils/validators";
import { SECURITY_QUESTIONS } from "../../utils/SecurityQuestions";
import useUserContext from "../../API/UserContext";

function Rule({ ok, text }) {
  return (
      <div className={ok ? styles.ruleOk : styles.ruleNo}>
        <span className={styles.ruleIcon}>{ok ? "✓" : "•"}</span>
        <span>{text}</span>
      </div>
  );
}

function Toast({ message, onClose }) {
  return (
      <div className={styles.toastOverlay}>
        <div className={styles.toast}>
          <div className={styles.toastIcon}>✓</div>
          <div className={styles.toastContent}>
            <div className={styles.toastTitle}>Request Submitted!</div>
            <div className={styles.toastMessage}>{message}</div>
          </div>
          <button className={styles.toastClose} onClick={onClose}>×</button>
        </div>
      </div>
  );
}

function SecurityModal({ onConfirm, onCancel }) {
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityQuestionAnswer, setSecurityQuestionAnswer] = useState("");
  const [modalMsg, setModalMsg] = useState("");

  function handleConfirm() {
    if (!securityQuestion) {
      setModalMsg("Please select a security question.");
      return;
    }
    if (!securityQuestionAnswer.trim()) {
      setModalMsg("Please provide an answer.");
      return;
    }
    onConfirm({ securityQuestion, securityQuestionAnswer: securityQuestionAnswer.trim() });
  }

  return (
      <div className={styles.toastOverlay}>
        <div className={styles.modal}>
          <h3 className={styles.modalTitle}>Security Question</h3>
          <p className={styles.modalSubtitle}>
            Set up a security question to help verify your identity if you ever need account recovery.
          </p>

          <label className={styles.label}>Select a Security Question</label>
          <select
              className={styles.select}
              value={securityQuestion}
              onChange={(e) => setSecurityQuestion(e.target.value)}
          >
            <option value="">Choose A Security Question</option>
            {SECURITY_QUESTIONS.map((q) => (
                <option key={q} value={q}>{q}</option>
            ))}
          </select>

          <label className={styles.label}>Your Answer</label>
          <input
              className={styles.input}
              type="text"
              value={securityQuestionAnswer}
              onChange={(e) => setSecurityQuestionAnswer(e.target.value)}
              placeholder="Enter your answer"
          />

          {modalMsg && <div className={styles.msg}>{modalMsg}</div>}

          <div className={styles.buttonGroup}>
            <button className={styles.secondaryBtn} type="button" onClick={onCancel}>
              ← Back
            </button>
            <button className={styles.primaryBtn} type="button" onClick={handleConfirm}>
              Submit Request
            </button>
          </div>
        </div>
      </div>
  );
}

export default function CreateUser() {
  const nav = useNavigate();
  const { requestAccess } = useUserContext();

  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [address, setAddress] = useState("");
  const [dob, setDob] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("USER");
  const [msg, setMsg] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const { rules: passwordRules } = validatePassword(password);

  const handleClearAll = () => {
    setFirst("");
    setLast("");
    setAddress("");
    setDob("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setRole("USER");
    setMsg("");
  };

  function handleToastClose() {
    setShowToast(false);
    nav("/login");
  }

  // Step 1: Validate the main form, then show the security modal
  function onSubmit(e) {
    e.preventDefault();
    setMsg("");

    if (!first.trim() || !last.trim() || !address.trim() || !dob || !email.trim() || !password || !confirmPassword) {
      setMsg("Please complete first name, last name, address, DOB, email, and password.");
      return;
    }

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!emailOk) {
      setMsg("Please enter a valid email address.");
      return;
    }

    const { ok: passwordOk } = validatePassword(password);
    if (!passwordOk) {
      setMsg(PASSWORD_POLICY_MESSAGE);
      return;
    }

    if (password !== confirmPassword) {
      setMsg("Password and confirm password do not match.");
      return;
    }

    // All valid — open the security question modal
    setShowSecurityModal(true);
  }

  // Step 2: Called by the modal with the security fields, fires the API request
  async function handleSecurityConfirm({ securityQuestion, securityQuestionAnswer }) {
    setShowSecurityModal(false);
    setLoading(true);

    try {
      await requestAccess({
        firstName: first.trim(),
        lastName: last.trim(),
        userAddress: address.trim(),
        dateOfBirth: dob,
        email: email.trim(),
        password,
        userRole: role,
        securityQuestion,
        securityQuestionAnswer,
      });

      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        nav("/login");
      }, 5000);
    } catch (err) {
      setMsg(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
      <div className={styles.page}>
        {showToast && (
            <Toast
                message="Your access request has been received. An administrator will review it and email you if approved."
                onClose={handleToastClose}
            />
        )}

        {showSecurityModal && (
            <SecurityModal
                onConfirm={handleSecurityConfirm}
                onCancel={() => setShowSecurityModal(false)}
            />
        )}

        <div className={styles.card}>
          <div className={styles.logoRow}>
            <img src={Logo} alt="App Logo" className={styles.logo} style={{ width: 40, height: 40 }} />
          </div>

          <h2 className={styles.title}>Request Access</h2>

          <form onSubmit={onSubmit}>
            <div className={styles.row}>
              <div>
                <label className={styles.label}>First Name</label>
                <input
                    className={styles.input}
                    value={first}
                    onChange={(e) => setFirst(e.target.value)}
                    disabled={loading}
                />
              </div>

              <div>
                <label className={styles.label}>Last Name</label>
                <input
                    className={styles.input}
                    value={last}
                    onChange={(e) => setLast(e.target.value)}
                    disabled={loading}
                />
              </div>
            </div>

            <label className={styles.label}>Address</label>
            <input
                className={styles.input}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street, City, State"
                disabled={loading}
            />

            <label className={styles.label}>Date of Birth</label>
            <input
                className={styles.input}
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                disabled={loading}
            />

            <label className={styles.label}>Email</label>
            <input
                className={styles.input}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                disabled={loading}
            />

            <label className={styles.label}>Password</label>
            <input
                className={styles.input}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create A Strong Password"
                autoComplete="new-password"
                disabled={loading}
            />

            <label className={styles.label}>Confirm Password</label>
            <input
                className={styles.input}
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-Enter Your Password"
                autoComplete="new-password"
                disabled={loading}
            />

            <label className={styles.label}>Request Role</label>
            <select
                className={styles.select}
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={loading}
            >
              <option value="USER">User</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMINISTRATOR">Administrator</option>
            </select>

            <div className={styles.passwordRules}>
              <div className={styles.rulesTitle}>Password must:</div>
              <Rule ok={passwordRules.minLen} text="Be at least 8 characters" />
              <Rule ok={passwordRules.startsWithLetter} text="Start with a letter" />
              <Rule ok={passwordRules.letter} text="Contain a letter" />
              <Rule ok={passwordRules.number} text="Contain a number" />
              <Rule ok={passwordRules.symbol} text="Contain a special character" />
            </div>

            {msg && <div className={styles.msg}>{msg}</div>}

            <div className={styles.buttonGroup}>
              <button className={styles.secondaryBtn} type="button" onClick={handleClearAll} disabled={loading}>
                Clear All Fields
              </button>
              <button className={styles.primaryBtn} type="submit" disabled={loading}>
                {loading ? "Submitting..." : "Next →"}
              </button>
            </div>
          </form>

          <div className={styles.actions}>
            <Link to="/login">← Back to Login</Link>
          </div>
        </div>
      </div>
  );
}