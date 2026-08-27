"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Mail, CheckCircle, AlertCircle } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const registered = searchParams.get("registered") === "true";
  const success = searchParams.get("success") === "true";
  const error = searchParams.get("error");
  const verifyUrl = searchParams.get("verifyUrl") || "";
  const [resendMsg, setResendMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResend = async () => {
    if (!email) return;
    setLoading(true);
    setResendMsg("");

    const res = await fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    setResendMsg(data.message || data.error || "Request sent");
    setLoading(false);
  };

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 bg-gradient-to-br from-blue-50 to-slate-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 text-center space-y-4">
        {success ? (
          <>
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
            <h1 className="text-2xl font-bold">Email Verified!</h1>
            <p className="text-slate-600">Your email has been verified. You can now login.</p>
            <Link href="/login">
              <Button className="w-full" size="lg">
                Go to Login
              </Button>
            </Link>
          </>
        ) : error ? (
          <>
            <AlertCircle className="h-16 w-16 text-red-600 mx-auto" />
            <h1 className="text-2xl font-bold">Verification Failed</h1>
            <p className="text-slate-600">
              The verification link is invalid or expired. Request a new email below.
            </p>
            {email && (
              <Button onClick={handleResend} className="w-full" size="lg" disabled={loading}>
                {loading ? "Sending..." : "Resend Verification Email"}
              </Button>
            )}
            <Link href="/login" className="block text-sm text-blue-600">
              Back to Login
            </Link>
          </>
        ) : (
          <>
            <Mail className="h-16 w-16 text-blue-600 mx-auto" />
            <h1 className="text-2xl font-bold">Verify Your Email</h1>
            {registered && (
              <p className="text-green-700 text-sm font-medium">
                Registration successful!
              </p>
            )}
            <p className="text-slate-600">
              We sent a verification link to{" "}
              {email ? <strong>{email}</strong> : "your email"}.
              Please verify before logging in.
            </p>
            {verifyUrl && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-left text-sm">
                <p className="font-medium text-amber-800 mb-2">Verify now (click below):</p>
                <a href={verifyUrl} className="text-blue-600 break-all underline">
                  Verify Email
                </a>
              </div>
            )}
            {email && (
              <Button onClick={handleResend} variant="secondary" className="w-full" disabled={loading}>
                {loading ? "Sending..." : "Resend Verification Email"}
              </Button>
            )}
            {resendMsg && <p className="text-sm text-slate-500">{resendMsg}</p>}
            <Link href="/login" className="block text-sm text-blue-600">
              Back to Login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh flex items-center justify-center">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
