import { useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const navigate = useNavigate();

  const handleSubmit = async () => {
    try {
      const url = isLogin ? "/auth/login" : "/auth/signup";

      const res = await API.post(url, form);

      if (isLogin) {
        localStorage.setItem("token", res.data.token);
        navigate("/dashboard");
      } else {
        alert("Signup successful. Please login.");
        setIsLogin(true);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Error");
    }
  };

  return (
    <div style={{
      height: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "#f5f5f5"
    }}>
      <div style={{
        background: "white",
        padding: "30px",
        borderRadius: "10px",
        width: "300px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
      }}>
        <h2>{isLogin ? "Login" : "Signup"}</h2>

        {!isLogin && (
          <>
            <input
              placeholder="Name"
              style={{ width: "100%", marginBottom: "10px" }}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
            />
          </>
        )}

        <input
          placeholder="Email"
          style={{ width: "100%", marginBottom: "10px" }}
          onChange={(e) =>
            setForm({ ...form, email: e.target.value })
          }
        />

        <input
          type="password"
          placeholder="Password"
          style={{ width: "100%", marginBottom: "10px" }}
          onChange={(e) =>
            setForm({ ...form, password: e.target.value })
          }
        />

        <button
          style={{
            width: "100%",
            padding: "10px",
            background: "#4CAF50",
            color: "white",
            border: "none"
          }}
          onClick={handleSubmit}
        >
          {isLogin ? "Login" : "Signup"}
        </button>

        <p style={{ marginTop: "10px", textAlign: "center" }}>
          {isLogin ? "New user?" : "Already have account?"}
        </p>

        <button
          style={{
            width: "100%",
            padding: "8px",
            background: "#ddd",
            border: "none"
          }}
          onClick={() => setIsLogin(!isLogin)}
        >
          {isLogin ? "Go to Signup" : "Go to Login"}
        </button>
      </div>
    </div>
  );
}