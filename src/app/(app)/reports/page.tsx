"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { exportToCSV, exportToExcel, exportToPDF } from "@/lib/export";
import { Download, FileSpreadsheet, FileText } from "lucide-react";

const REPORT_TYPES = [
  { value: "sales", label: "Sales Report" },
  { value: "profit", label: "Profit Report" },
  { value: "returns", label: "Return Report" },
  { value: "payments", label: "Payment Report" },
  { value: "products", label: "Product Report" },
];

export default function ReportsPage() {
  const [reportType, setReportType] = useState("sales");
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    const res = await fetch(`/api/reports?type=${reportType}`);
    const result = await res.json();
    setData(result);
    setLoading(false);
  };

  const handleExportCSV = () => {
    if (!data) return;
    const reportData = (data as { data: Record<string, unknown>[] }).data;
    if (Array.isArray(reportData)) {
      exportToCSV(reportData, `${reportType}-report`);
    }
  };

  const handleExportExcel = () => {
    if (!data) return;
    const reportData = (data as { data: Record<string, unknown>[] }).data;
    if (Array.isArray(reportData)) {
      exportToExcel(reportData, `${reportType}-report`);
    }
  };

  const handleExportPDF = async () => {
    if (!data) return;
    const reportData = (data as { data: Record<string, unknown>[] }).data;
    if (Array.isArray(reportData) && reportData.length > 0) {
      const headers = Object.keys(reportData[0]);
      const rows = reportData.map((row) =>
        headers.map((h) => String(row[h] ?? ""))
      );
      await exportToPDF(
        `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`,
        headers,
        rows,
        `${reportType}-report`
      );
    }
  };

  const renderReportData = () => {
    if (!data) return null;
    const result = data as { type: string; data: unknown; metrics?: Record<string, number> };

    if (result.type === "profit" && typeof result.data === "object") {
      const profitData = result.data as Record<string, number>;
      return (
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(profitData).map(([key, value]) => (
            <div key={key} className="rounded-xl bg-slate-50 p-3">
              <p className="text-sm text-slate-500 capitalize">{key}</p>
              <p className="font-semibold">{formatCurrency(value)}</p>
            </div>
          ))}
        </div>
      );
    }

    if (result.type === "returns" && typeof result.data === "object") {
      const returnData = result.data as Record<string, number>;
      return (
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(returnData).map(([key, value]) => (
            <div key={key} className="rounded-xl bg-slate-50 p-3">
              <p className="text-sm text-slate-500 capitalize">
                {key.replace(/([A-Z])/g, " $1")}
              </p>
              <p className="font-semibold">
                {key.includes("Rate") ? `${value.toFixed(1)}%` : 
                 typeof value === "number" && key !== "orders" && key !== "returns"
                   ? formatCurrency(value)
                   : value}
              </p>
            </div>
          ))}
        </div>
      );
    }

    if (Array.isArray(result.data)) {
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                {result.data.length > 0 &&
                  Object.keys(result.data[0]).map((key) => (
                    <th key={key} className="text-left p-2 font-medium capitalize">
                      {key}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {result.data.slice(0, 50).map((row, i) => (
                <tr key={i} className="border-b border-slate-100">
                  {Object.values(row as Record<string, unknown>).map((val, j) => (
                    <td key={j} className="p-2">
                      {String(val ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {result.data.length > 50 && (
            <p className="text-sm text-slate-500 mt-2">
              Showing 50 of {result.data.length} rows. Export for full data.
            </p>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-slate-500 text-sm">Generate and export business reports</p>
      </div>

      <Select
        label="Report Type"
        options={REPORT_TYPES}
        value={reportType}
        onChange={(e) => {
          setReportType(e.target.value);
          setData(null);
        }}
      />

      <Button onClick={generateReport} className="w-full" size="lg" disabled={loading}>
        {loading ? "Generating..." : "Generate Report"}
      </Button>

      {data && (
        <>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            {renderReportData()}
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleExportCSV} className="flex-1">
              <Download className="h-4 w-4" />
              CSV
            </Button>
            <Button variant="secondary" onClick={handleExportExcel} className="flex-1">
              <FileSpreadsheet className="h-4 w-4" />
              Excel
            </Button>
            <Button variant="secondary" onClick={handleExportPDF} className="flex-1">
              <FileText className="h-4 w-4" />
              PDF
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
