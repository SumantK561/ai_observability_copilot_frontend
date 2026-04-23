"use client";

import { useState } from "react";
import axios from "axios";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const register = async () => {
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
        { email, password }
      );
      alert("User registered! Please login.");
    } catch (err: any) {
      alert(err.response?.data?.detail || "Error");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-6 rounded shadow w-80">
        <h1 className="text-xl font-bold mb-4">Register</h1>

        <input
          type="email"
          placeholder="Email"
          className="border p-2 w-full mb-3"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="border p-2 w-full mb-3"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={register}
          className="bg-blue-500 text-white w-full py-2 rounded"
        >
          Register
        </button>
      </div>
    </div>
  );
}