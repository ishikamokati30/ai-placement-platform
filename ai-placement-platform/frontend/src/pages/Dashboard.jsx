import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Navbar from "../components/Navbar";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await API.get("/dashboard");
        setData(res.data);
      } catch (error) {
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/", { replace: true });
          return;
        }

        setErrorMessage("Unable to load dashboard.");
      }
    };

    fetchData();
  }, [navigate]);

  if (errorMessage) return <p style={{ padding: "40px" }}>{errorMessage}</p>;
  if (!data) return <p style={{ padding: "40px" }}>Loading...</p>;


return (
  <div style={{ padding: "40px", background: "#f5f5f5", minHeight: "100vh" }}>
    <Navbar />
    <h1>Dashboard</h1>

    <div style={{
      display: "flex",
      gap: "20px",
      marginTop: "20px"
    }}>
      <div style={{
        background: "white",
        padding: "20px",
        borderRadius: "10px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
      }}>
        <h3>Readiness Score</h3>
        <h1>{data.readinessScore}%</h1>
      </div>

      <div style={{
        background: "white",
        padding: "20px",
        borderRadius: "10px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
      }}>
        <h3>Status</h3>
        <p>{data.message}</p>
      </div>
    </div>

    <button
      style={{
        marginTop: "20px",
        padding: "10px 20px",
        background: "#4CAF50",
        color: "white",
        border: "none",
        borderRadius: "5px"
      }}
      onClick={() => navigate("/interview")}
    >
      Start Interview
    </button>
  </div>
);
}
