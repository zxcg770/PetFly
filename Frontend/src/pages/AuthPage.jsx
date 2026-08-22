import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const AuthPage = () => {
  //set and update form state, loading state and error message
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    securityQuestion: "",
    securityAnswer: "",
  });

  const SECURITY_QUESTIONS = [
    "What was your childhood nickname?",
    "What city were you born in?",
    "What is your mother's name?",
    "What was the name of your first school?",
  ];

  const { login } = useAuth();
  const navigate = useNavigate();

  // Handle input changes
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Basic validation
    if (!form.email || !form.password) {
      setError("Please fill in all required fields");
      setLoading(false);
      return;
    }

    if (isSignUp && (!form.firstName || !form.lastName)) {
      setError("Please fill in your first and last name");
      setLoading(false);
      return;
    }

    if (isSignUp && !form.securityQuestion) {
      setError("Please select a security question");
      setLoading(false);
      return;
    }

    if (isSignUp && form.securityAnswer.trim().length < 2) {
      setError("Please provide an answer to your security question");
      setLoading(false);
      return;
    }

    if (isSignUp && !/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(form.password)) {
      setError("Password must be at least 8 characters and include a letter and a number");
      setLoading(false);
      return;
    }

    try {
      const endpoint = isSignUp ? "/auth/register" : "/auth/login";
      const { data } = await api.post(endpoint, form);

      //save user and token
      login(data.user, data.token);

      //redirect to passport verification page
      navigate(isSignUp ? "/passport-verification" : "/browse");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>

        {/* Back button */}
        <button
          onClick={() => navigate("/")}
          style={styles.backButton}
        >
          ‹ Back to home
        </button>

        {/* Logo */}
        <div style={styles.logoRow}>
          <div style={styles.logoIcon}>
            ✈
          </div>
          <span style={styles.logoText}>PetFly</span>
        </div>

        {/* Title */}
        <div style={styles.titleBlock}>
          <h1 style={styles.title}>
            {isSignUp ? "Create your account" : "Welcome back"}
          </h1>
          <p style={styles.subtitle}>
            {isSignUp
              ? "Join thousands of pet owners and travelers"
              : "Sign in to continue to your dashboard"}
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div style={styles.errorBox}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>

          {/* First and last name — only on sign up */}
          {isSignUp && (
            <>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>First name</label>
                <div style={styles.inputWrapper}>
                  <span style={styles.inputIcon}>👤</span>
                  <input
                    type="text"
                    name="firstName"
                    placeholder="Sarah"
                    value={form.firstName}
                    onChange={handleChange}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Last name</label>
                <div style={styles.inputWrapper}>
                  <span style={styles.inputIcon}>👤</span>
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Johnson"
                    value={form.lastName}
                    onChange={handleChange}
                    style={styles.input}
                  />
                </div>
              </div>
            </>
          )}

          {/* Email */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Email</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>✉</span>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                style={styles.input}
              />
            </div>
          </div>

          {/* Password */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>🔒</span>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                style={styles.input}
              />
            </div>
            {isSignUp && (
              <p style={styles.hint}>At least 8 characters, with a letter and a number</p>
            )}
          </div>

          {/* Security question — only on sign up */}
          {isSignUp && (
            <>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Security question</label>
                <select
                  name="securityQuestion"
                  value={form.securityQuestion}
                  onChange={handleChange}
                  style={styles.select}
                >
                  <option value="">Select a question...</option>
                  {SECURITY_QUESTIONS.map((q) => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Your answer</label>
                <div style={styles.inputWrapper}>
                  <span style={styles.inputIcon}>🔑</span>
                  <input
                    type="text"
                    name="securityAnswer"
                    placeholder="Your answer"
                    value={form.securityAnswer}
                    onChange={handleChange}
                    style={styles.input}
                    autoComplete="off"
                  />
                </div>
                <p style={styles.hint}>Used to recover your account if you forget your password</p>
              </div>
            </>
          )}

          {/* Forgot password — only on sign in */}
          {!isSignUp && (
            <div style={{ textAlign: "right", marginTop: "-8px" }}>
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                style={styles.forgotLink}
              >
                Forgot password?
              </button>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            style={loading ? styles.buttonDisabled : styles.button}
          >
            {loading
              ? "Please wait..."
              : isSignUp
              ? "Next step"
              : "Sign in"}
          </button>
        </form>

        {/* Toggle login/register */}
        <div style={styles.toggleRow}>
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError("");
            }}
            style={styles.toggleButton}
          >
            {isSignUp ? (
              <>
                Already have an account?{" "}
                <span style={styles.toggleLink}>Sign in</span>
              </>
            ) : (
              <>
                Don't have an account?{" "}
                <span style={styles.toggleLink}>Sign up</span>
              </>
            )}
          </button>
        </div>

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
  titleBlock: {
    marginBottom: "24px",
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#1a1a1a",
    margin: "0 0 6px 0",
  },
  subtitle: {
    fontSize: "14px",
    color: "#888",
    margin: "0",
  },
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
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#1a1a1a",
  },
  hint: {
    fontSize: "12px",
    color: "#999",
    margin: "2px 0 0",
  },
  inputWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  inputIcon: {
    position: "absolute",
    left: "14px",
    fontSize: "16px",
    color: "#aaa",
    pointerEvents: "none",
  },
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
  toggleRow: {
    textAlign: "center",
    marginTop: "20px",
  },
  toggleButton: {
    background: "none",
    border: "none",
    fontSize: "14px",
    color: "#888",
    cursor: "pointer",
  },
  toggleLink: {
    color: "#5AACDC",
    fontWeight: "600",
  },
  select: {
    width: "100%",
    padding: "12px 14px",
    backgroundColor: "#f5f5f0",
    border: "1px solid #e8e8e8",
    borderRadius: "12px",
    fontSize: "14px",
    color: "#1a1a1a",
    outline: "none",
    boxSizing: "border-box",
    cursor: "pointer",
  },
  forgotLink: {
    background: "none",
    border: "none",
    color: "#5AACDC",
    fontSize: "13px",
    cursor: "pointer",
    padding: 0,
  },
};

export default AuthPage;