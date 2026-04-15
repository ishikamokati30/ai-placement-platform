import { useState } from "react";
import API, { getApiErrorMessage } from "../services/api";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      setErrorMessage("Email and password are required.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await API.post("/auth/login", {
        email: trimmedEmail,
        password,
      });

      localStorage.setItem("token", res.data.token);
      navigate("/dashboard");
    } catch (err) {
      const message = getApiErrorMessage(err);

      console.error("Login request failed:", {
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
    <div style={{ padding: "40px" }}>
      <h2>Login</h2>
      {errorMessage ? (
        <p style={{ color: "crimson", marginBottom: "16px" }}>{errorMessage}</p>
      ) : null}

      <input
        value={email}
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />
      <br /><br />

      <input
        type="password"
        value={password}
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />
      <br /><br />

      <button onClick={handleLogin} disabled={isSubmitting}>
        {isSubmitting ? "Logging in..." : "Login"}
      </button>
    </div>
  );
}
