"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { ProfitDisplay } from "@/components/profit-display";
import {
  formatCurrency,
  formatDate,
  PLATFORMS,
  PAYMENT_STATUSES,
  platformLabel,
  paymentStatusLabel,
  addDays,
} from "@/lib/utils";
import { calculateNetProfit } from "@/lib/calculations";
import { Plus, Search, Filter } from "lucide-react";

interface Order {
  id: string;
  orderId: string;
  platform: string;
  productName: string;
  quantity: number;
  sellingPrice: number;
  productCost: number;
  orderDate: string;
  expectedPaymentDate: string;
  paymentStatus: string;
  netProfit: number;
  isReturned: boolean;
  platformCommission: number;
  shippingCharge: number;
  gstTax: number;
  otherCharges: number;
  returnCharges: number;
}

const DATE_FILTERS = [
  { value: "", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "lastmonth", label: "Last Month" },
];

function getDateRange(filter: string): { from?: string; to?: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (filter) {
    case "today":
      return { from: today.toISOString(), to: now.toISOString() };
    case "yesterday": {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      const yEnd = new Date(y);
      yEnd.setHours(23, 59, 59);
      return { from: y.toISOString(), to: yEnd.toISOString() };
    }
    case "week": {
      const w = new Date(today);
      w.setDate(w.getDate() - 7);
      return { from: w.toISOString(), to: now.toISOString() };
    }
    case "month":
      return {
        from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
        to: now.toISOString(),
      };
    case "lastmonth": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      return { from: start.toISOString(), to: end.toISOString() };
    }
    default:
      return {};
  }
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [platformFilter, setPlatformFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [returnFilter, setReturnFilter] = useState("");

  const [form, setForm] = useState({
    orderId: "",
    platform: "AMAZON",
    productId: "",
    productName: "",
    sku: "",
    barcode: "",
    size: "",
    color: "",
    quantity: 1,
    productCost: 0,
    sellingPrice: 0,
    customerRef: "",
    orderDate: new Date().toISOString().split("T")[0],
    expectedPaymentDate: "",
    paymentStatus: "PENDING",
    shippingCharge: 0,
    platformCommission: 0,
    gstTax: 0,
    otherCharges: 0,
    notes: "",
  });

  const expectedDate = useMemo(() => {
    if (form.expectedPaymentDate) return form.expectedPaymentDate;
    if (form.orderDate) {
      return addDays(new Date(form.orderDate), 15).toISOString().split("T")[0];
    }
    return "";
  }, [form.orderDate, form.expectedPaymentDate]);

  const netProfit = useMemo(
    () =>
      calculateNetProfit({
        sellingPrice: form.sellingPrice,
        productCost: form.productCost,
        platformCommission: form.platformCommission,
        shippingCharge: form.shippingCharge,
        gstTax: form.gstTax,
        otherCharges: form.otherCharges,
        quantity: form.quantity,
      }),
    [form]
  );

  const totalExpenses =
    form.productCost * form.quantity +
    form.platformCommission +
    form.shippingCharge +
    form.gstTax +
    form.otherCharges;

  const fetchOrders = async () => {
    const range = getDateRange(dateFilter);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (platformFilter) params.set("platform", platformFilter);
    if (paymentFilter) params.set("paymentStatus", paymentFilter);
    if (returnFilter) params.set("returnStatus", returnFilter);
    if (range.from) params.set("dateFrom", range.from);
    if (range.to) params.set("dateTo", range.to);

    const res = await fetch(`/api/orders?${params}`);
    const data = await res.json();
    setOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, [search, dateFilter, platformFilter, paymentFilter, returnFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, expectedPaymentDate: expectedDate }),
    });

    if (res.ok) {
      setShowAdd(false);
      fetchOrders();
      setForm({
        orderId: "",
        platform: "AMAZON",
        productId: "",
        productName: "",
        sku: "",
        barcode: "",
        size: "",
        color: "",
        quantity: 1,
        productCost: 0,
        sellingPrice: 0,
        customerRef: "",
        orderDate: new Date().toISOString().split("T")[0],
        expectedPaymentDate: "",
        paymentStatus: "PENDING",
        shippingCharge: 0,
        platformCommission: 0,
        gstTax: 0,
        otherCharges: 0,
        notes: "",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-slate-500 text-sm">{orders.length} orders</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4" />
          Add Order
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5"
            placeholder="Search Order ID, Product, SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="secondary" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {showFilters && (
        <div className="grid grid-cols-2 gap-2 p-4 rounded-xl bg-slate-50">
          <Select
            label="Date"
            options={DATE_FILTERS}
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
          <Select
            label="Platform"
            options={[{ value: "", label: "All" }, ...PLATFORMS]}
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
          />
          <Select
            label="Payment"
            options={[{ value: "", label: "All" }, ...PAYMENT_STATUSES]}
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
          />
          <Select
            label="Return Status"
            options={[
              { value: "", label: "All" },
              { value: "returned", label: "Returned" },
              { value: "not_returned", label: "Not Returned" },
            ]}
            value={returnFilter}
            onChange={(e) => setReturnFilter(e.target.value)}
          />
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-slate-500">Loading...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <p>No orders found</p>
          <Button className="mt-4" onClick={() => setShowAdd(true)}>
            Add Your First Order
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="block rounded-2xl border border-slate-200 bg-white p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{order.orderId}</p>
                  <p className="text-sm text-slate-600">{order.productName}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {platformLabel(order.platform)} • {formatDate(order.orderDate)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    {formatCurrency(order.sellingPrice * order.quantity)}
                  </p>
                  <p
                    className={`text-sm font-medium ${
                      order.netProfit >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {order.netProfit >= 0 ? "Profit" : "Loss"}:{" "}
                    {formatCurrency(Math.abs(order.netProfit))}
                  </p>
                  <span
                    className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                      order.isReturned
                        ? "bg-red-100 text-red-700"
                        : order.paymentStatus === "PAID"
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {order.isReturned
                      ? "Returned"
                      : paymentStatusLabel(order.paymentStatus)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Order" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Order ID *"
              value={form.orderId}
              onChange={(e) => setForm({ ...form, orderId: e.target.value })}
              required
            />
            <Select
              label="Platform *"
              options={[...PLATFORMS]}
              value={form.platform}
              onChange={(e) => setForm({ ...form, platform: e.target.value })}
            />
          </div>

          <Input
            label="Order Date *"
            type="date"
            value={form.orderDate}
            onChange={(e) =>
              setForm({ ...form, orderDate: e.target.value, expectedPaymentDate: "" })
            }
            required
          />

          <div className="rounded-xl bg-blue-50 p-3 text-sm">
            <span className="text-blue-700">Expected Payment Date: </span>
            <span className="font-semibold text-blue-900">
              {expectedDate ? formatDate(expectedDate) : "—"}
            </span>
            <span className="text-blue-600 ml-2">(Order Date + 15 days)</span>
          </div>

          <Input
            label="Override Expected Payment Date"
            type="date"
            value={form.expectedPaymentDate}
            onChange={(e) => setForm({ ...form, expectedPaymentDate: e.target.value })}
          />

          <Input
            label="Product Name *"
            value={form.productName}
            onChange={(e) => setForm({ ...form, productName: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="SKU"
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
            />
            <Input
              label="Barcode"
              value={form.barcode}
              onChange={(e) => setForm({ ...form, barcode: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Size"
              value={form.size}
              onChange={(e) => setForm({ ...form, size: e.target.value })}
            />
            <Input
              label="Color"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
            />
            <Input
              label="Quantity"
              type="number"
              min={1}
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Product Cost (₹)"
              type="number"
              min={0}
              value={form.productCost}
              onChange={(e) => setForm({ ...form, productCost: Number(e.target.value) })}
            />
            <Input
              label="Selling Price (₹)"
              type="number"
              min={0}
              value={form.sellingPrice}
              onChange={(e) => setForm({ ...form, sellingPrice: Number(e.target.value) })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Platform Commission (₹)"
              type="number"
              min={0}
              value={form.platformCommission}
              onChange={(e) =>
                setForm({ ...form, platformCommission: Number(e.target.value) })
              }
            />
            <Input
              label="Shipping Charge (₹)"
              type="number"
              min={0}
              value={form.shippingCharge}
              onChange={(e) => setForm({ ...form, shippingCharge: Number(e.target.value) })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="GST/Tax (₹)"
              type="number"
              min={0}
              value={form.gstTax}
              onChange={(e) => setForm({ ...form, gstTax: Number(e.target.value) })}
            />
            <Input
              label="Other Charges (₹)"
              type="number"
              min={0}
              value={form.otherCharges}
              onChange={(e) => setForm({ ...form, otherCharges: Number(e.target.value) })}
            />
          </div>

          <ProfitDisplay
            sellingPrice={form.sellingPrice}
            productCost={form.productCost}
            totalExpenses={totalExpenses}
            netProfit={netProfit}
            quantity={form.quantity}
          />

          <Input
            label="Customer/Order Reference"
            value={form.customerRef}
            onChange={(e) => setForm({ ...form, customerRef: e.target.value })}
          />

          <Button type="submit" className="w-full" size="lg">
            Save Order
          </Button>
        </form>
      </Modal>
    </div>
  );
}
