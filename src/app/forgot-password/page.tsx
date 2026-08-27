"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Request failed");
      setLoading(false);
      return;
    }

    setMessage(data.message);
    setLoading(false);
  };

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 bg-gradient-to-br from-blue-50 to-slate-100">
      <div className="w-full max-w-md">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold text-center">Forgot Password</h2>
          <p className="text-sm text-slate-500 text-center">
            Enter your email. If an authorized account exists, a reset link will be sent.
          </p>

          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}
          {message && (
            <div className="rounded-xl bg-green-50 p-3 text-sm text-green-700">{message}</div>
          )}

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="your@email.com"
          />

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </Button>

          <Link href="/login" className="block text-center text-sm text-blue-600">
            Back to Login
          </Link>
        </form>
      </div>
    </div>
  );
}
