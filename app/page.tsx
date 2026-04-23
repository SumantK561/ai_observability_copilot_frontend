"use client";

import { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<any>(null);
  const [liveData, setLiveData] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState("");

  const wsRef = useRef<WebSocket | null>(null);
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) window.location.href = "/auth/login";
  }, []);

  const upload = async () => {
    if (!file || !apiKey) {
      alert("Upload file & enter API key");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", apiKey);

    setLoading(true);

    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/analyze`,
        formData
      );
      setData(res.data);
    } catch {
      alert("Error analyzing logs");
    }

    setLoading(false);
  };

  const startLiveLogs = async () => {
    const base = process.env.NEXT_PUBLIC_API_URL!;
    await fetch(base);

    const ws = new WebSocket(base.replace("https", "wss") + "/ws/logs");
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send("API_KEY:" + apiKey);

      if (intervalRef.current) clearInterval(intervalRef.current);

      intervalRef.current = setInterval(() => {
        ws.send("[ERROR] Live failure");
      }, 3000);
    };

    ws.onmessage = (event) => {
      const parsed = JSON.parse(event.data);
      setLiveData(parsed);

      setChartData((prev) => [
        ...prev.slice(-10),
        {
          time: new Date().toLocaleTimeString(),
          errors: parsed.metrics?.error_count || 0,
          warnings: parsed.metrics?.warning_count || 0,
        },
      ]);
    };

    ws.onclose = () => console.log("WS closed");
  };

  useEffect(() => {
    return () => {
      wsRef.current?.close();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const getColor = (s: string) =>
    s === "High" ? "bg-red-500" : s === "Medium" ? "bg-yellow-500" : "bg-green-500";

  return (
    <div className="p-10 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">AI Observability Copilot 🚀</h1>

      <button
        onClick={() => {
          localStorage.removeItem("token");
          window.location.href = "/auth/login";
        }}
        className="bg-red-500 text-white px-3 py-1 rounded mb-4"
      >
        Logout
      </button>

      <div className="bg-white p-6 rounded shadow">
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <input
          type="password"
          placeholder="OpenAI API Key"
          className="border p-2 w-full mt-3"
          onChange={(e) => setApiKey(e.target.value)}
        />

        <button onClick={upload} className="bg-blue-500 text-white px-4 py-2 mt-3">
          {loading ? "Analyzing..." : "Analyze"}
        </button>

        <button
          onClick={startLiveLogs}
          className="bg-green-500 text-white px-4 py-2 ml-2 mt-3"
        >
          Start Live Logs
        </button>
      </div>

      {data && (
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className={`p-4 text-white ${getColor(data.severity)}`}>
            {data.severity}
          </div>
          <div className="bg-white p-4">{data.root_cause}</div>
        </div>
      )}

      {liveData && (
        <div className="mt-6 bg-black text-white p-4 rounded">
          <p>Errors: {liveData.metrics.error_count}</p>
          <p>Warnings: {liveData.metrics.warning_count}</p>
          <p>Prediction: {liveData.metrics.prediction}</p>
        </div>
      )}

      {chartData.length > 0 && (
        <div className="mt-6 bg-white p-4 rounded">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line dataKey="errors" />
              <Line dataKey="warnings" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}