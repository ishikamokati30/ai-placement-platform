import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import API, { getApiErrorMessage } from "../services/api";
import { AuthContext } from "../context/AuthContext";

const initialForm = {
  name: "",
  email: "",
  password: "",
};

export default function Auth() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(initialForm);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const isLogin = mode === "login";

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setForm(initialForm);
    setErrorMessage("");
    setSuccessMessage("");
  };

  const validateForm = () => {
    const email = form.email.trim();
    const name = form.name.trim();

    if (!email || !form.password) {
      return "Email and password are required.";
    }

    if (!isLogin && !name) {
      return "Name is required.";
    }

    if (!isLogin && form.password.length < 6) {
      return "Password must be at least 6 characters.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      setSuccessMessage("");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      if (isLogin) {
        const res = await API.post("/auth/login", {
          email: form.email.trim(),
          password: form.password,
        });

        login(res.data.token, res.data.user);
        navigate("/dashboard", { replace: true });
        return;
      }

      const res = await API.post("/auth/signup", {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      login(res.data.token, res.data.user);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const message = getApiErrorMessage(err);

      console.error("Auth request failed:", {
        mode,
        message,
        status: err.response?.status,
        data: err.response?.data,
      });

      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main style={styles.page}>
      <section style={styles.panel} aria-label="Authentication form">
        <div style={styles.header}>
          <h1 style={styles.title}>AI Interview Platform</h1>
          <p style={styles.subtitle}>
            {isLogin ? "Sign in to continue." : "Create your account."}
          </p>
        </div>

        <div style={styles.tabs}>
          <button
            type="button"
            style={isLogin ? styles.activeTab : styles.tab}
            onClick={() => switchMode("login")}
          >
            Login
          </button>
          <button
            type="button"
            style={!isLogin ? styles.activeTab : styles.tab}
            onClick={() => switchMode("signup")}
          >
            Signup
          </button>
        </div>

        {errorMessage ? <p style={styles.error}>{errorMessage}</p> : null}
        {successMessage ? <p style={styles.success}>{successMessage}</p> : null}

        <form onSubmit={handleSubmit} style={styles.form}>
          {!isLogin ? (
            <label style={styles.label}>
              Name
              <input
                style={styles.input}
                type="text"
                value={form.name}
                autoComplete="name"
                onChange={(event) => updateField("name", event.target.value)}
              />
            </label>
          ) : null}

          <label style={styles.label}>
            Email
            <input
              style={styles.input}
              type="email"
              value={form.email}
              autoComplete="email"
              onChange={(event) => updateField("email", event.target.value)}
            />
          </label>

          <label style={styles.label}>
            Password
            <input
              style={styles.input}
              type="password"
              value={form.password}
              autoComplete={isLogin ? "current-password" : "new-password"}
              onChange={(event) => updateField("password", event.target.value)}
            />
          </label>

          <button type="submit" style={styles.submit} disabled={isSubmitting}>
            {isSubmitting ? "Please wait..." : isLogin ? "Login" : "Signup"}
          </button>
        </form>
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    background: "#eef2f7",
    color: "#111827",
    boxSizing: "border-box",
  },
  panel: {
    width: "100%",
    maxWidth: "420px",
    background: "#ffffff",
    border: "1px solid #d8dee8",
    borderRadius: "8px",
    padding: "28px",
    boxShadow: "0 16px 40px rgba(15, 23, 42, 0.12)",
    boxSizing: "border-box",
  },
  header: {
    marginBottom: "20px",
  },
  title: {
    margin: "0 0 8px",
    fontSize: "28px",
    lineHeight: 1.2,
  },
  subtitle: {
    margin: 0,
    color: "#4b5563",
  },
  tabs: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
    marginBottom: "18px",
  },
  tab: {
    height: "40px",
    border: "1px solid #cbd5e1",
    background: "#f8fafc",
    color: "#334155",
    borderRadius: "6px",
    cursor: "pointer",
  },
  activeTab: {
    height: "40px",
    border: "1px solid #2563eb",
    background: "#2563eb",
    color: "#ffffff",
    borderRadius: "6px",
    cursor: "pointer",
  },
  form: {
    display: "grid",
    gap: "14px",
  },
  label: {
    display: "grid",
    gap: "6px",
    fontSize: "14px",
    fontWeight: 600,
  },
  input: {
    height: "42px",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    padding: "0 12px",
    font: "inherit",
    boxSizing: "border-box",
  },
  submit: {
    height: "44px",
    border: "none",
    background: "#16a34a",
    color: "#ffffff",
    borderRadius: "6px",
    fontWeight: 700,
    cursor: "pointer",
  },
  error: {
    margin: "0 0 14px",
    color: "#b91c1c",
    background: "#fee2e2",
    border: "1px solid #fecaca",
    borderRadius: "6px",
    padding: "10px",
  },
  success: {
    margin: "0 0 14px",
    color: "#166534",
    background: "#dcfce7",
    border: "1px solid #bbf7d0",
    borderRadius: "6px",
    padding: "10px",
  },
};
