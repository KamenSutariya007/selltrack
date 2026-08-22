"use client";

import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Download, Upload, LogOut, User } from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();

  const handleExport = async () => {
    const res = await fetch("/api/backup");
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `selltrack-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const text = await file.text();
      const data = JSON.parse(text);

      const res = await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        alert("Data imported successfully!");
      } else {
        alert("Import failed");
      }
    };
    input.click();
  };

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-slate-500 text-sm">Manage your account and data</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
            <User className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="font-semibold">{session?.user?.name}</p>
            <p className="text-sm text-slate-500">{session?.user?.email}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold">Data Backup</h2>
        <p className="text-sm text-slate-500">
          Export your business data for backup or import previously exported data.
        </p>
        <Button onClick={handleExport} variant="secondary" className="w-full">
          <Download className="h-4 w-4" />
          Export All Data (JSON)
        </Button>
        <Button onClick={handleImport} variant="secondary" className="w-full">
          <Upload className="h-4 w-4" />
          Import Data
        </Button>
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold">Cloud Database</h2>
        <p className="text-sm text-slate-500">
          Your data is stored securely in a server database (not browser storage).
          For production, configure PostgreSQL in your .env file.
        </p>
      </div>

      <Button
        onClick={() => signOut({ callbackUrl: "/login" })}
        variant="danger"
        className="w-full"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </Button>
    </div>
  );
}
