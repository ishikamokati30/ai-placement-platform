import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      padding: "10px 20px",
      background: "#eee"
    }}>
      <h3>AI Placement</h3>

      <div>
        <button onClick={() => navigate("/dashboard")}>
          Dashboard
        </button>

        <button onClick={() => navigate("/interview")}>
          Interview
        </button>

        <button onClick={logout}>Logout</button>
      </div>
    </div>
  );
}