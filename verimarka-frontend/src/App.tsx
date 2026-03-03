import { useEffect, useState } from "react";

function App() {
  const [status, setStatus] = useState("Loading...");

  useEffect(() => {
    fetch("/api/")
      .then((res) => setStatus(`API status: ${res.status}`))
      .catch(() => setStatus("API 연결 실패"));
  }, []);

  return (
    <div style={{ padding: 40 }}>
      <h1>Verimarka</h1>
      <p>{status}</p>
    </div>
  );
}

export default App;