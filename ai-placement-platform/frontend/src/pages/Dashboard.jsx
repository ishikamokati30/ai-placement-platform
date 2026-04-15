import { useEffect, useState } from "react";
import API from "../services/api";

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
    <div style={{ padding: "50px" }}>
      <h1>Dashboard</h1>

      <h2>{data.message}</h2>

      <h3>Readiness Score: {data.readinessScore}%</h3>
    </div>
  );
}