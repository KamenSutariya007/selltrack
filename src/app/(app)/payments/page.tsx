"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import {
  formatCurrency,
  formatDate,
  platformLabel,
  paymentStatusLabel,
} from "@/lib/utils";

interface Payment {
  id: string;
  expectedDate: string;
  paymentDate: string | null;
  amount: number;
  status: string;
  order: {
    orderId: string;
    platform: string;
    productName: string;
    id: string;
  };
}

interface PaymentSummary {
  totalOrderValue: number;
  paidAmount: number;
  pendingAmount: number;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [filter, setFilter] = useState("");
  const [markPaidModal, setMarkPaidModal] = useState<Payment | null>(null);
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const fetchPayments = () => {
    const params = filter ? `?status=${filter}` : "";
    fetch(`/api/payments${params}`)
      .then((r) => r.json())
      .then((data) => {
        setPayments(data.payments);
        setSummary(data.summary);
      });
  };

  useEffect(() => {
    fetchPayments();
  }, [filter]);

  const markAsPaid = async () => {
    if (!markPaidModal) return;

    await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderDbId: markPaidModal.order.id,
        status: "PAID",
        paymentDate,
      }),
    });

    setMarkPaidModal(null);
    fetchPayments();
  };

  const filters = [
    { value: "", label: "All" },
    { value: "PENDING", label: "Pending" },
    { value: "PROCESSING", label: "Processing" },
    { value: "PAID", label: "Paid" },
    { value: "RETURNED_ADJUSTED", label: "Returned" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Payments</h1>
        <p className="text-slate-500 text-sm">Track payment status</p>
      </div>

      {summary && (
        <div className="grid grid-cols-3 gap-3">
          <StatCard title="Total Value" value={formatCurrency(summary.totalOrderValue)} />
          <StatCard
            title="Paid"
            value={formatCurrency(summary.paidAmount)}
            variant="success"
          />
          <StatCard
            title="Pending"
            value={formatCurrency(summary.pendingAmount)}
            variant="warning"
          />
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-2">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              filter === f.value
                ? "bg-blue-600 text-white"
                : "bg-white border border-slate-200 text-slate-600"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {payments.map((payment) => (
          <div key={payment.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold">{payment.order.orderId}</p>
                <p className="text-sm text-slate-600">{payment.order.productName}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {platformLabel(payment.order.platform)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                <span
                  className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                    payment.status === "PAID"
                      ? "bg-green-100 text-green-700"
                      : payment.status === "RETURNED_ADJUSTED"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {paymentStatusLabel(payment.status)}
                </span>
              </div>
            </div>
            <div className="mt-3 flex justify-between items-center text-sm">
              <div>
                <p className="text-slate-500">
                  Expected: {formatDate(payment.expectedDate)}
                </p>
                {payment.paymentDate && (
                  <p className="text-green-600">
                    Paid: {formatDate(payment.paymentDate)}
                  </p>
                )}
              </div>
              {(payment.status === "PENDING" || payment.status === "PROCESSING") && (
                <Button size="sm" variant="success" onClick={() => setMarkPaidModal(payment)}>
                  Mark as Paid
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={!!markPaidModal}
        onClose={() => setMarkPaidModal(null)}
        title="Mark as Paid"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Order: {markPaidModal?.order.orderId} –{" "}
            {formatCurrency(markPaidModal?.amount || 0)}
          </p>
          <Input
            label="Actual Payment Date"
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
          />
          <Button onClick={markAsPaid} className="w-full" size="lg" variant="success">
            Confirm Payment
          </Button>
        </div>
      </Modal>
    </div>
  );
}
