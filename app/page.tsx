"use client";

import { useState } from "react";
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
  const [loading, setLoading] = useState(false);
  const [liveData, setLiveData] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);

  const upload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);

    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/analyze",
        formData
      );
      setData(res.data);
    } catch (err) {
      console.error(err);
      alert("Error analyzing logs");
    }

    setLoading(false);
  };

  const getSeverityColor = (severity: string) => {
    if (severity === "High") return "bg-red-500";
    if (severity === "Medium") return "bg-yellow-500";
    return "bg-green-500";
  };

  const startLiveLogs = () => {
    const ws = new WebSocket("ws://127.0.0.1:8000/ws/logs");

    ws.onopen = () => {
      console.log("Connected to WebSocket");

      // simulate log stream
      setInterval(() => {
        ws.send("[ERROR] Random failure in service");
      }, 3000);
    };

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        setLiveData(parsed);

        // Add new point to chart
        setChartData((prev) => [
          ...prev.slice(-10), // keep last 10 points
          {
            time: new Date().toLocaleTimeString(),
            errors: parsed.metrics?.error_count || 0,
            warnings: parsed.metrics?.warning_count || 0,
          },
        ]);
      } catch {
        console.log("Raw:", event.data);
      }
    };

    ws.onclose = () => {
      console.log("Disconnected");
    };
  };

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <h1 className="text-3xl font-bold mb-6">
        AI Observability Copilot 🚀
      </h1>

      {/* Upload Section */}
      <div className="bg-white p-6 rounded shadow">
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="border p-2"
        />

        <button
          onClick={upload}
          className="bg-blue-500 text-white px-4 py-2 ml-2 rounded"
        >
          {loading ? "Analyzing..." : "Analyze"}
        </button>

        <button
          onClick={startLiveLogs}
          className="bg-green-500 text-white px-4 py-2 ml-2 rounded"
        >
          Start Live Logs
        </button>
      </div>


      {/* Results */}
      {data && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Severity */}
          <div className={`p-4 text-white rounded shadow ${getSeverityColor(data.severity)}`}>
            <h2 className="font-semibold text-lg">Severity</h2>
            <p className="text-xl">{data.severity}</p>
          </div>

          {/* Root Cause */}
          <div className="bg-white p-4 rounded shadow">
            <h2 className="font-semibold text-lg mb-2">Root Cause</h2>
            <p>{data.root_cause}</p>
          </div>

          {/* Errors */}
          <div className="bg-white p-4 rounded shadow">
            <h2 className="font-semibold text-lg mb-2">Errors</h2>
            <ul className="list-disc ml-6">
              {data.errors?.map((e: string, i: number) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>

          {/* Suggestions */}
          <div className="bg-white p-4 rounded shadow">
            <h2 className="font-semibold text-lg mb-2">Suggestions</h2>
            <ul className="list-disc ml-6">
              {data.suggestions?.map((s: string, i: number) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>

        </div>
      )}
      {liveData && (
        <div className="mt-8 border-t pt-6">
          <h2 className="text-2xl font-bold mb-4">🔴 Live Monitoring</h2>

          <div className={`p-4 text-white rounded ${getSeverityColor(liveData.severity)}`}>
            Severity: {liveData.severity}
          </div>

          <div className="bg-white p-4 mt-4 rounded shadow">
            <h3 className="font-semibold">Root Cause</h3>
            <p>{liveData.root_cause}</p>
          </div>
        </div>
      )}
      {liveData?.metrics && (
        <div className="mt-6 bg-black text-white p-4 rounded">
          <h3 className="text-lg font-bold">📊 System Metrics</h3>

          <p>Errors: {liveData.metrics.error_count}</p>
          <p>Warnings: {liveData.metrics.warning_count}</p>

          <p className="mt-2 text-yellow-400">
            Prediction: {liveData.metrics.prediction}
          </p>
        </div>
      )}
      {chartData.length > 0 && (
        <div className="mt-8 bg-white p-4 rounded shadow">
          <h2 className="text-xl font-bold mb-4">📈 Error Trend</h2>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />

              <Line type="monotone" dataKey="errors" />
              <Line type="monotone" dataKey="warnings" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}