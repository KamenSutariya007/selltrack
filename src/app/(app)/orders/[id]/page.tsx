"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, platformLabel, paymentStatusLabel } from "@/lib/utils";
import { ProfitDisplay } from "@/components/profit-display";
import { ArrowLeft } from "lucide-react";

interface TimelineEvent {
  id: string;
  status: string;
  note: string | null;
  createdAt: string;
}

interface OrderDetail {
  id: string;
  orderId: string;
  platform: string;
  productName: string;
  sku: string | null;
  barcode: string | null;
  size: string | null;
  color: string | null;
  quantity: number;
  sellingPrice: number;
  productCost: number;
  orderDate: string;
  expectedPaymentDate: string;
  actualPaymentDate: string | null;
  paymentStatus: string;
  orderStatus: string;
  shippingCharge: number;
  platformCommission: number;
  gstTax: number;
  otherCharges: number;
  returnCharges: number;
  netProfit: number;
  isReturned: boolean;
  notes: string | null;
  totalExpenses: number;
  timeline: TimelineEvent[];
}

const STATUS_LABELS: Record<string, string> = {
  CREATED: "Order Created",
  SHIPPED: "Order Shipped",
  DELIVERED: "Delivered",
  PAYMENT_EXPECTED: "Payment Expected",
  PAYMENT_RECEIVED: "Payment Received",
  RETURN_REQUESTED: "Return Requested",
  RETURNED: "Returned",
  RETURN_RECEIVED: "Return Received",
  REFUND_ADJUSTED: "Refund/Adjustment",
  CANCELLED: "Cancelled",
};

export default function OrderDetailPage() {
  const params = useParams();
  const [order, setOrder] = useState<OrderDetail | null>(null);

  useEffect(() => {
    fetch(`/api/orders/${params.id}`)
      .then((r) => r.json())
      .then(setOrder);
  }, [params.id]);

  const markAsPaid = async () => {
    const paymentDate = prompt("Enter payment date (YYYY-MM-DD)", new Date().toISOString().split("T")[0]);
    if (!paymentDate) return;

    await fetch(`/api/orders/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentStatus: "PAID",
        actualPaymentDate: paymentDate,
        orderStatus: "PAYMENT_RECEIVED",
      }),
    });

    const res = await fetch(`/api/orders/${params.id}`);
    setOrder(await res.json());
  };

  if (!order) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Link href="/orders" className="inline-flex items-center gap-2 text-sm text-slate-500">
        <ArrowLeft className="h-4 w-4" />
        Back to Orders
      </Link>

      <div>
        <h1 className="text-2xl font-bold">{order.orderId}</h1>
        <p className="text-slate-500">{order.productName}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-slate-500">Platform</p>
          <p className="font-medium">{platformLabel(order.platform)}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-slate-500">Order Date</p>
          <p className="font-medium">{formatDate(order.orderDate)}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-slate-500">Payment Status</p>
          <p className="font-medium">{paymentStatusLabel(order.paymentStatus)}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-slate-500">Expected Payment</p>
          <p className="font-medium">{formatDate(order.expectedPaymentDate)}</p>
        </div>
      </div>

      <ProfitDisplay
        sellingPrice={order.sellingPrice}
        productCost={order.productCost}
        totalExpenses={order.totalExpenses}
        netProfit={order.netProfit}
        quantity={order.quantity}
      />

      {order.paymentStatus !== "PAID" && !order.isReturned && (
        <Button onClick={markAsPaid} variant="success" className="w-full" size="lg">
          Mark as Paid
        </Button>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-3">Order Timeline</h2>
        <div className="space-y-0">
          {order.timeline.map((event, i) => (
            <div key={event.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="h-3 w-3 rounded-full bg-blue-600" />
                {i < order.timeline.length - 1 && (
                  <div className="w-0.5 flex-1 bg-slate-200 my-1" />
                )}
              </div>
              <div className="pb-4">
                <p className="font-medium text-sm">
                  {STATUS_LABELS[event.status] || event.status}
                </p>
                {event.note && <p className="text-xs text-slate-500">{event.note}</p>}
                <p className="text-xs text-slate-400">{formatDate(event.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
