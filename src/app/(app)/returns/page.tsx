"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BarcodeScanner } from "@/components/barcode-scanner";
import { Modal } from "@/components/ui/modal";
import {
  formatCurrency,
  formatDate,
  formatPercent,
  platformLabel,
  paymentStatusLabel,
  RETURN_REASONS,
  PRODUCT_CONDITIONS,
} from "@/lib/utils";
import { ScanLine, Plus } from "lucide-react";

interface Order {
  id: string;
  orderId: string;
  productName: string;
  sellingPrice: number;
  orderDate: string;
  paymentStatus: string;
  platform: string;
  quantity: number;
}

interface ReturnStats {
  totalOrders: number;
  totalReturns: number;
  returnPercentage: number;
  returnCharges: number;
  shippingLoss: number;
  productLoss: number;
  totalReturnLoss: number;
}

function ReturnsContent() {
  const searchParams = useSearchParams();
  const [showAdd, setShowAdd] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [returns, setReturns] = useState<Array<{ id: string; returnDate: string; reason: string; returnCharge: number; order: Order }>>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [stats, setStats] = useState<ReturnStats | null>(null);
  const [lookupValue, setLookupValue] = useState("");

  const [form, setForm] = useState({
    orderDbId: "",
    returnDate: new Date().toISOString().split("T")[0],
    quantity: 1,
    reason: RETURN_REASONS[0] as string,
    returnCharge: 0,
    reverseShippingCharge: 0,
    lossAmount: 0,
    productCondition: "GOOD",
    notes: "",
  });

  const fetchReturns = () => {
    fetch("/api/returns")
      .then((r) => r.json())
      .then(setReturns);
  };

  useEffect(() => {
    fetchReturns();
    const barcode = searchParams.get("barcode");
    if (barcode) {
      lookupByBarcode(barcode);
    }
  }, [searchParams]);

  const lookupOrder = async (orderId: string) => {
    const res = await fetch(`/api/returns?orderId=${encodeURIComponent(orderId)}`);
    const order = await res.json();
    if (order?.id) {
      setSelectedOrder(order);
      setForm((f) => ({ ...f, orderDbId: order.id, quantity: order.quantity }));
      setShowAdd(true);
    }
  };

  const lookupByBarcode = async (barcode: string) => {
    const res = await fetch(`/api/returns?barcode=${encodeURIComponent(barcode)}`);
    const data = await res.json();

    if (data.stats) {
      setStats(data.stats);
    }

    const orderRes = await fetch(`/api/orders?search=${encodeURIComponent(barcode)}`);
    const orders = await orderRes.json();
    const activeOrder = orders.find((o: Order & { isReturned: boolean }) => !o.isReturned);

    if (activeOrder) {
      setSelectedOrder(activeOrder);
      setForm((f) => ({ ...f, orderDbId: activeOrder.id, quantity: activeOrder.quantity }));
      setShowAdd(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/returns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setShowAdd(false);
      setSelectedOrder(null);
      fetchReturns();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Returns</h1>
          <p className="text-slate-500 text-sm">Manage product returns</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4" />
          Add Return
        </Button>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Enter Order ID..."
          value={lookupValue}
          onChange={(e) => setLookupValue(e.target.value)}
          className="flex-1"
        />
        <Button onClick={() => lookupOrder(lookupValue)} disabled={!lookupValue}>
          Find
        </Button>
        <Button variant="secondary" onClick={() => setShowScanner(true)}>
          <ScanLine className="h-4 w-4" />
        </Button>
      </div>

      {stats && (
        <div className="rounded-2xl bg-slate-50 p-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-slate-500">Orders</p>
            <p className="text-xl font-bold">{stats.totalOrders}</p>
          </div>
          <div>
            <p className="text-slate-500">Returns</p>
            <p className="text-xl font-bold">{stats.totalReturns}</p>
          </div>
          <div>
            <p className="text-slate-500">Return Rate</p>
            <p className="text-xl font-bold text-amber-600">
              {formatPercent(stats.returnPercentage)}
            </p>
          </div>
          <div>
            <p className="text-slate-500">Total Return Loss</p>
            <p className="text-xl font-bold text-red-600">
              {formatCurrency(stats.totalReturnLoss)}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {returns.map((ret) => (
          <div key={ret.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex justify-between">
              <div>
                <p className="font-semibold">{ret.order.orderId}</p>
                <p className="text-sm text-slate-600">{ret.order.productName}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {ret.reason} • {formatDate(ret.returnDate)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-red-600">
                  Charge: {formatCurrency(ret.returnCharge)}
                </p>
                <p className="text-xs text-slate-400">
                  {platformLabel(ret.order.platform)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={showScanner} onClose={() => setShowScanner(false)} title="Scan Barcode">
        <BarcodeScanner
          onScan={(code) => {
            lookupByBarcode(code);
            setShowScanner(false);
          }}
        />
      </Modal>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Return" size="lg">
        {selectedOrder && (
          <div className="rounded-xl bg-blue-50 p-4 mb-4 text-sm space-y-1">
            <p className="font-semibold">Original Order: {selectedOrder.orderId}</p>
            <p>Product: {selectedOrder.productName}</p>
            <p>Selling Price: {formatCurrency(selectedOrder.sellingPrice)}</p>
            <p>Order Date: {formatDate(selectedOrder.orderDate)}</p>
            <p>Payment: {paymentStatusLabel(selectedOrder.paymentStatus)}</p>
            <p>Platform: {platformLabel(selectedOrder.platform)}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {!selectedOrder && (
            <Input
              label="Order ID"
              placeholder="Enter order ID to find"
              onBlur={(e) => lookupOrder(e.target.value)}
            />
          )}

          <Input
            label="Return Date"
            type="date"
            value={form.returnDate}
            onChange={(e) => setForm({ ...form, returnDate: e.target.value })}
            required
          />

          <Select
            label="Return Reason"
            options={RETURN_REASONS.map((r) => ({ value: r, label: r }))}
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
          />

          <Input
            label="Quantity"
            type="number"
            min={1}
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Return Charge (₹)"
              type="number"
              min={0}
              value={form.returnCharge}
              onChange={(e) => setForm({ ...form, returnCharge: Number(e.target.value) })}
            />
            <Input
              label="Reverse Shipping (₹)"
              type="number"
              min={0}
              value={form.reverseShippingCharge}
              onChange={(e) =>
                setForm({ ...form, reverseShippingCharge: Number(e.target.value) })
              }
            />
          </div>

          <Input
            label="Damage/Loss Amount (₹)"
            type="number"
            min={0}
            value={form.lossAmount}
            onChange={(e) => setForm({ ...form, lossAmount: Number(e.target.value) })}
          />

          <Select
            label="Product Condition"
            options={[...PRODUCT_CONDITIONS]}
            value={form.productCondition}
            onChange={(e) => setForm({ ...form, productCondition: e.target.value })}
          />

          <Textarea
            label="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />

          <Button type="submit" className="w-full" size="lg">
            Process Return
          </Button>
        </form>
      </Modal>
    </div>
  );
}

export default function ReturnsPage() {
  return (
    <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
      <ReturnsContent />
    </Suspense>
  );
}
