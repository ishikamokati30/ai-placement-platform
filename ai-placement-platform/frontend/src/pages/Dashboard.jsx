import { useEffect, useState } from "react";
import API from "../services/api";
import Navbar from "../components/Navbar";

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const res = await API.get("/dashboard");
      setData(res.data);
    };

    fetchData();
  }, []);

  if (!data) return <p>Loading...</p>;


return (
  <div style={{ padding: "40px", background: "#f5f5f5", minHeight: "100vh" }}>
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