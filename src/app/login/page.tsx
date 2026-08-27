"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!username.trim()) {
      setError("Username is required");
      setLoading(false);
      return;
    }

    if (!password) {
      setError("Password is required");
      setLoading(false);
      return;
    }

    const checkRes = await fetch("/api/auth/check-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const checkData = await checkRes.json();

    if (!checkRes.ok) {
      setError(checkData.error || "Login failed");
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      username: username.trim(),
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid username or password");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 bg-gradient-to-br from-blue-50 to-slate-100">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600">SellTrack</h1>
          <p className="text-slate-500 mt-2">E-Commerce Business Manager</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold text-center">Sign In</h2>

          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          <Input
            label="Username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            placeholder="Enter username"
            autoComplete="username"
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Enter password"
            autoComplete="current-password"
          />

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  );
}
