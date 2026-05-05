import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import LogoImg from "../../assets/Logo.JPG";
import styles from "./ForgotPassword.module.css";
import { validatePassword, PASSWORD_POLICY_MESSAGE } from "../../utils/validators";
import { SECURITY_QUESTIONS } from "../../utils/SecurityQuestions";
import useUserContext from "../../API/UserContext";

export default function ForgotPassword() {
  const nav = useNavigate();
  const { validateSecurityQuestion, updatePassword } = useUserContext();

  const [step, setStep] = useState(1);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const [identity, setIdentity] = useState({ email: "", userId: "" });
  const [security, setSecurity] = useState({ securityQuestion: "", securityAnswer: "" });
  const [passwords, setPasswords] = useState({ newPassword: "", confirmPassword: "" });

  const handleIdentityChange = (e) => {
    setMsg("");
    setIdentity((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSecurityChange = (e) => {
    setMsg("");
    setSecurity((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePasswordChange = (e) => {
    setMsg("");
    setPasswords((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Step 1 — frontend only, verify fields are populated
  function handleVerifyIdentity(e) {
    e.preventDefault();
    setMsg("");
    if (!identity.email.trim() || !identity.userId.trim()) {
      setMsg("Please enter both email address and user ID.");
      return;
    }
    setStep(2);
  }

  // Step 2 — validate security question + answer against backend
  async function handleVerifySecurityQuestion(e) {
    e.preventDefault();
    setMsg("");
    if (!security.securityQuestion || !security.securityAnswer.trim()) {
      setMsg("Please select a question and provide an answer.");
      return;
    }

    setLoading(true);
    try {
      const isValid = await validateSecurityQuestion({
        id: Number(identity.userId),
        securityQuestion: security.securityQuestion,
        securityQuestionAnswer: security.securityAnswer.trim(),
      });

      if (!isValid) {
        setMsg("Security question or answer did not match.");
        return;
      }

      setStep(3);
    } catch (err) {
      setMsg(err.message || "Security question or answer did not match.");
    } finally {
      setLoading(false);
    }
  }

  // Step 3 — update password via backend
  async function handleResetPassword(e) {
    e.preventDefault();
    setMsg("");

    if (!passwords.newPassword || !passwords.confirmPassword) {
      setMsg("Please fill in both password fields.");
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setMsg("Passwords do not match.");
      return;
    }

    const { ok } = validatePassword(passwords.newPassword);
    if (!ok) {
      setMsg(PASSWORD_POLICY_MESSAGE);
      return;
    }

    setLoading(true);
    try {
      await updatePassword({
        id: Number(identity.userId),
        updatedPassword: passwords.newPassword,
      });

      setStep(4);
      setTimeout(() => nav("/login"), 2500);
    } catch (err) {
      setMsg(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  }

  return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.logoArea}>
            <img src={LogoImg} alt="Logo" style={{ width: 70, height: 70, objectFit: "contain" }} />
          </div>
          <h2 className={styles.title}>Forgot Password</h2>

          {/* Step Indicator */}
          {step < 4 && (
              <div className={styles.stepIndicator}>
                <div className={`${styles.step} ${step >= 1 ? styles.active : ""}`}>
                  1. Verify Identity
                </div>
                <div className={`${styles.step} ${step >= 2 ? styles.active : ""}`}>
                  2. Security Question
                </div>
                <div className={`${styles.step} ${step >= 3 ? styles.active : ""}`}>
                  3. New Password
                </div>
              </div>
          )}

          {/* Step 1 — Identity */}
          {step === 1 && (
              <form onSubmit={handleVerifyIdentity}>
                <label className={styles.label}>Email Address</label>
                <input
                    className={styles.input}
                    type="email"
                    name="email"
                    value={identity.email}
                    onChange={handleIdentityChange}
                    placeholder="Enter your email address"
                    autoComplete="email"
                    disabled={loading}
                />

                <label className={styles.label}>User ID</label>
                <input
                    className={styles.input}
                    type="text"
                    name="userId"
                    value={identity.userId}
                    onChange={handleIdentityChange}
                    placeholder="Enter your user ID"
                    disabled={loading}
                />

                {msg && <div className={styles.msg}>{msg}</div>}

                <button className={styles.primaryBtn} type="submit" disabled={loading}>
                  Continue
                </button>
              </form>
          )}

          {/* Step 2 — Security Question */}
          {step === 2 && (
              <form onSubmit={handleVerifySecurityQuestion}>
                <label className={styles.label}>Security Question</label>
                <select
                    className={styles.select}
                    name="securityQuestion"
                    value={security.securityQuestion}
                    onChange={handleSecurityChange}
                    disabled={loading}
                >
                  <option value="">Select A Question</option>
                  {SECURITY_QUESTIONS.map((q) => (
                      <option key={q} value={q}>{q}</option>
                  ))}
                </select>

                <label className={styles.label}>Answer</label>
                <input
                    className={styles.input}
                    type="text"
                    name="securityAnswer"
                    value={security.securityAnswer}
                    onChange={handleSecurityChange}
                    placeholder="Enter your answer"
                    disabled={loading}
                />

                {msg && <div className={styles.msg}>{msg}</div>}

                <div className={styles.btnRow}>
                  <button
                      className={styles.secondaryBtn}
                      type="button"
                      onClick={() => { setMsg(""); setStep(1); }}
                      disabled={loading}
                  >
                    ← Back
                  </button>
                  <button className={styles.primaryBtn} type="submit" disabled={loading}>
                    {loading ? "Verifying..." : "Continue"}
                  </button>
                </div>
              </form>
          )}

          {/* Step 3 — New Password */}
          {step === 3 && (
              <form onSubmit={handleResetPassword}>
                <label className={styles.label}>New Password</label>
                <input
                    className={styles.input}
                    type="password"
                    name="newPassword"
                    value={passwords.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter new password"
                    autoComplete="new-password"
                    disabled={loading}
                />

                <label className={styles.label}>Confirm New Password</label>
                <input
                    className={styles.input}
                    type="password"
                    name="confirmPassword"
                    value={passwords.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                    disabled={loading}
                />

                {msg && <div className={styles.msg}>{msg}</div>}

                <div className={styles.btnRow}>
                  <button
                      className={styles.secondaryBtn}
                      type="button"
                      onClick={() => { setMsg(""); setStep(2); }}
                      disabled={loading}
                  >
                    ← Back
                  </button>
                  <button className={styles.primaryBtn} type="submit" disabled={loading}>
                    {loading ? "Resetting..." : "Set New Password"}
                  </button>
                </div>
              </form>
          )}

          {/* Step 4 — Success */}
          {step === 4 && (
              <div className={styles.successState}>
                <div className={styles.successIcon}>✓</div>
                <p className={styles.successMsg}>Password reset successfully!</p>
                <p className={styles.successSub}>Redirecting you to login...</p>
              </div>
          )}

          <div className={styles.actions}>
            <Link to="/login">← Back to Login</Link>
          </div>
        </div>
      </div>
  );
}