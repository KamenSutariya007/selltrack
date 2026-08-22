"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/ui/card";
import { formatCurrency, formatPercent, platformLabel } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface DashboardData {
  today: {
    orders: number;
    sales: number;
    profit: number;
    loss: number;
    returns: number;
    otherExpenses: number;
    pendingPayments: number;
  };
  thisMonth: {
    orders: number;
    sales: number;
    productCost: number;
    platformCharges: number;
    shippingCharges: number;
    returnCharges: number;
    profit: number;
    loss: number;
    pendingPayments: number;
    returns: number;
  };
  overall: {
    orders: number;
    sales: number;
    profit: number;
    loss: number;
    pendingPayments: number;
    returns: number;
    productsSold: number;
  };
  platformStats: Array<{
    platform: string;
    orders: number;
    sales: number;
    profit: number;
    returns: number;
    pendingPayments: number;
  }>;
  analytics: {
    salesChange: number;
    profitChange: number;
    avgOrderValue: number;
    avgProfitPerOrder: number;
    returnPercentage: number;
    bestSelling?: { name: string; sold: number };
    mostProfitable?: { name: string; profit: number };
    highestReturn?: { name: string; returnRate: number };
    lowStockProducts: Array<{ productName: string; currentStock: number }>;
  };
  notifications: Array<{ id: string; title: string; message: string }>;
}

const COLORS = ["#2563eb", "#16a34a", "#d97706", "#64748b"];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!data) return <div>Failed to load dashboard</div>;

  const platformChartData = data.platformStats
    .filter((p) => p.orders > 0)
    .map((p) => ({
      name: platformLabel(p.platform),
      sales: p.sales,
      profit: p.profit,
      orders: p.orders,
    }));

  const todayExpenses =
    data.today.otherExpenses +
    (data.thisMonth.platformCharges / Math.max(data.thisMonth.orders, 1)) *
      data.today.orders;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-slate-500 text-sm">Your business at a glance</p>
      </div>

      {data.notifications.length > 0 && (
        <div className="space-y-2">
          {data.notifications.slice(0, 3).map((n) => (
            <div
              key={n.id}
              className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3"
            >
              <p className="font-medium text-amber-800">{n.title}</p>
              <p className="text-sm text-amber-700">{n.message}</p>
            </div>
          ))}
        </div>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-3">Today</h2>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <StatCard title="Orders" value={String(data.today.orders)} />
          <StatCard title="Sales" value={formatCurrency(data.today.sales)} />
          <StatCard title="Expenses" value={formatCurrency(todayExpenses)} />
          <StatCard
            title="Profit"
            value={formatCurrency(data.today.profit)}
            variant="success"
          />
          <StatCard title="Returns" value={String(data.today.returns)} variant="warning" />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">This Month</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            title="Total Sales"
            value={formatCurrency(data.thisMonth.sales)}
            trend={data.analytics.salesChange}
          />
          <StatCard title="Orders" value={String(data.thisMonth.orders)} />
          <StatCard
            title="Profit"
            value={formatCurrency(data.thisMonth.profit)}
            variant="success"
            trend={data.analytics.profitChange}
          />
          <StatCard
            title="Pending Payments"
            value={formatCurrency(data.thisMonth.pendingPayments)}
            variant="warning"
          />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
          <StatCard
            title="Product Cost"
            value={formatCurrency(data.thisMonth.productCost)}
          />
          <StatCard
            title="Platform Charges"
            value={formatCurrency(data.thisMonth.platformCharges)}
          />
          <StatCard
            title="Shipping"
            value={formatCurrency(data.thisMonth.shippingCharges)}
          />
          <StatCard
            title="Return Charges"
            value={formatCurrency(data.thisMonth.returnCharges)}
          />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Overall</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard title="Total Orders" value={String(data.overall.orders)} />
          <StatCard
            title="Products Sold"
            value={String(data.overall.productsSold)}
          />
          <StatCard
            title="Total Sales"
            value={formatCurrency(data.overall.sales)}
          />
          <StatCard
            title="Total Profit"
            value={formatCurrency(data.overall.profit)}
            variant="success"
          />
        </div>
      </section>

      {platformChartData.length > 0 && (
        <section className="grid lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="font-semibold mb-4">Platform Sales Comparison</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={platformChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="sales" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="font-semibold mb-4">Platform Profit Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={platformChartData}
                  dataKey="profit"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {platformChartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-3">Platform-wise Stats</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {data.platformStats.map((p) => (
            <div
              key={p.platform}
              className="rounded-2xl border border-slate-200 bg-white p-4"
            >
              <h3 className="font-semibold text-blue-600">
                {platformLabel(p.platform)}
              </h3>
              <div className="mt-2 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Orders</span>
                  <span>{p.orders}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sales</span>
                  <span>{formatCurrency(p.sales)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Profit</span>
                  <span className="text-green-600">{formatCurrency(p.profit)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Returns</span>
                  <span>{p.returns}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Pending</span>
                  <span className="text-amber-600">
                    {formatCurrency(p.pendingPayments)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Smart Analytics</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            title="Avg Order Value"
            value={formatCurrency(data.analytics.avgOrderValue)}
          />
          <StatCard
            title="Avg Profit/Order"
            value={formatCurrency(data.analytics.avgProfitPerOrder)}
            variant="success"
          />
          <StatCard
            title="Return Rate"
            value={formatPercent(data.analytics.returnPercentage)}
            variant="warning"
          />
          <StatCard
            title="Total Loss"
            value={formatCurrency(data.overall.loss)}
            variant="danger"
          />
        </div>

        <div className="grid sm:grid-cols-3 gap-3 mt-3">
          {data.analytics.bestSelling && (
            <div className="rounded-xl bg-green-50 p-4">
              <p className="text-sm text-green-700">Best Selling</p>
              <p className="font-semibold">{data.analytics.bestSelling.name}</p>
              <p className="text-sm">{data.analytics.bestSelling.sold} sold</p>
            </div>
          )}
          {data.analytics.mostProfitable && (
            <div className="rounded-xl bg-blue-50 p-4">
              <p className="text-sm text-blue-700">Most Profitable</p>
              <p className="font-semibold">{data.analytics.mostProfitable.name}</p>
              <p className="text-sm">
                {formatCurrency(data.analytics.mostProfitable.profit)}
              </p>
            </div>
          )}
          {data.analytics.highestReturn && data.analytics.highestReturn.returnRate > 0 && (
            <div className="rounded-xl bg-amber-50 p-4">
              <p className="text-sm text-amber-700">Highest Return</p>
              <p className="font-semibold">{data.analytics.highestReturn.name}</p>
              <p className="text-sm">
                {formatPercent(data.analytics.highestReturn.returnRate)}
              </p>
            </div>
          )}
        </div>

        {data.analytics.lowStockProducts.length > 0 && (
          <div className="mt-3 rounded-xl bg-red-50 border border-red-200 p-4">
            <p className="font-medium text-red-800">Low Stock Alerts</p>
            <div className="mt-2 space-y-1">
              {data.analytics.lowStockProducts.map((p) => (
                <p key={p.productName} className="text-sm text-red-700">
                  {p.productName} – Only {p.currentStock} left
                </p>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
