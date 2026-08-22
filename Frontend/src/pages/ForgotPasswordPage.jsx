import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: email, 2: answer, 3: new password
  const [email, setEmail] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/forgot-password/question", { email });
      setSecurityQuestion(data.securityQuestion);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/forgot-password/verify", { email, securityAnswer: answer });
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || "Incorrect answer");
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(newPassword)) {
      setError("Password must be at least 8 characters and include a letter and a number");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { email, securityAnswer: answer, newPassword });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <button onClick={() => navigate("/auth")} style={styles.backButton}>
          ‹ Back to sign in
        </button>

        <div style={styles.logoRow}>
          <div style={styles.logoIcon}>✈</div>
          <span style={styles.logoText}>PetFly</span>
        </div>

        {success ? (
          <div style={{ textAlign: "center" }}>
            <div style={styles.successIcon}>✓</div>
            <h2 style={styles.title}>Password reset!</h2>
            <p style={styles.subtitle}>You can now sign in with your new password.</p>
            <button style={styles.button} onClick={() => navigate("/auth")}>
              Go to sign in
            </button>
          </div>
        ) : (
          <>
            <div style={styles.titleBlock}>
              <h1 style={styles.title}>Forgot password?</h1>
              <p style={styles.subtitle}>
                {step === 1 && "Enter your email and we'll show your security question."}
                {step === 2 && "Answer your security question to continue."}
                {step === 3 && "Choose a new password for your account."}
              </p>
            </div>

            {error && <div style={styles.errorBox}>{error}</div>}

            {step === 1 && (
              <form onSubmit={handleEmailSubmit} style={styles.form}>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Email</label>
                  <div style={styles.inputWrapper}>
                    <span style={styles.inputIcon}>✉</span>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={styles.input}
                      required
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading} style={loading ? styles.buttonDisabled : styles.button}>
                  {loading ? "Please wait..." : "Continue"}
                </button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleVerifySubmit} style={styles.form}>
                <div style={styles.questionBox}>
                  <p style={styles.questionLabel}>Your security question</p>
                  <p style={styles.questionText}>{securityQuestion}</p>
                </div>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Your answer</label>
                  <div style={styles.inputWrapper}>
                    <span style={styles.inputIcon}>🔑</span>
                    <input
                      type="text"
                      placeholder="Your answer"
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      style={styles.input}
                      autoComplete="off"
                      required
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading} style={loading ? styles.buttonDisabled : styles.button}>
                  {loading ? "Please wait..." : "Verify answer"}
                </button>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={handleResetSubmit} style={styles.form}>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>New password</label>
                  <div style={styles.inputWrapper}>
                    <span style={styles.inputIcon}>🔒</span>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      style={styles.input}
                      required
                    />
                  </div>
                  <p style={styles.hint}>At least 8 characters, with a letter and a number</p>
                </div>
                <button type="submit" disabled={loading} style={loading ? styles.buttonDisabled : styles.button}>
                  {loading ? "Please wait..." : "Reset password"}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#f5f5f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    padding: "40px",
    width: "100%",
    maxWidth: "420px",
    boxShadow: "0 2px 20px rgba(0,0,0,0.06)",
  },
  backButton: {
    background: "none",
    border: "none",
    color: "#888",
    fontSize: "14px",
    cursor: "pointer",
    padding: "0",
    marginBottom: "28px",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "28px",
  },
  logoIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    backgroundColor: "#5AACDC",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    color: "#fff",
  },
  logoText: {
    fontSize: "22px",
    fontWeight: "600",
    color: "#1a1a1a",
  },
  titleBlock: { marginBottom: "24px" },
  title: { fontSize: "28px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 6px 0" },
  subtitle: { fontSize: "14px", color: "#888", margin: "0" },
  errorBox: {
    backgroundColor: "#fff0f0",
    color: "#cc3333",
    border: "1px solid #ffcccc",
    borderRadius: "10px",
    padding: "10px 14px",
    fontSize: "13px",
    marginBottom: "16px",
    textAlign: "center",
  },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "14px", fontWeight: "500", color: "#1a1a1a" },
  hint: { fontSize: "12px", color: "#999", margin: "2px 0 0" },
  inputWrapper: { position: "relative", display: "flex", alignItems: "center" },
  inputIcon: { position: "absolute", left: "14px", fontSize: "16px", color: "#aaa", pointerEvents: "none" },
  input: {
    width: "100%",
    padding: "12px 14px 12px 42px",
    backgroundColor: "#f5f5f0",
    border: "1px solid #e8e8e8",
    borderRadius: "12px",
    fontSize: "14px",
    color: "#1a1a1a",
    outline: "none",
    boxSizing: "border-box",
  },
  button: {
    width: "100%",
    padding: "14px",
    backgroundColor: "#E8724A",
    color: "#ffffff",
    border: "none",
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "4px",
  },
  buttonDisabled: {
    width: "100%",
    padding: "14px",
    backgroundColor: "#f0a080",
    color: "#ffffff",
    border: "none",
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "not-allowed",
    marginTop: "4px",
  },
  questionBox: {
    backgroundColor: "#f0f7ff",
    border: "1px solid #c8e0f5",
    borderRadius: "12px",
    padding: "14px 16px",
  },
  questionLabel: { fontSize: "12px", color: "#5AACDC", fontWeight: "600", margin: "0 0 4px" },
  questionText: { fontSize: "14px", color: "#1a1a1a", margin: "0", fontWeight: "500" },
  successIcon: {
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    backgroundColor: "#22c55e",
    color: "#fff",
    fontSize: "28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 16px",
  },
};
