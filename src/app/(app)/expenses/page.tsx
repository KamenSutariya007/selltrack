"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { formatCurrency, formatDate, EXPENSE_CATEGORIES, PLATFORMS } from "@/lib/utils";
import { Plus } from "lucide-react";

interface Expense {
  id: string;
  date: string;
  category: string;
  amount: number;
  platform: string | null;
  description: string | null;
  order: { orderId: string } | null;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [total, setTotal] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    category: "OTHER",
    amount: 0,
    platform: "",
    orderDbId: "",
    description: "",
  });

  const fetchExpenses = () => {
    fetch("/api/expenses")
      .then((r) => r.json())
      .then((data) => {
        setExpenses(data.expenses);
        setTotal(data.total);
      });
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        platform: form.platform || undefined,
        orderDbId: form.orderDbId || undefined,
      }),
    });

    if (res.ok) {
      setShowAdd(false);
      fetchExpenses();
    }
  };

  const categoryLabel = (cat: string) =>
    EXPENSE_CATEGORIES.find((c) => c.value === cat)?.label || cat;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Expenses</h1>
          <p className="text-slate-500 text-sm">Total: {formatCurrency(total)}</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4" />
          Add Expense
        </Button>
      </div>

      <div className="space-y-3">
        {expenses.map((expense) => (
          <div key={expense.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex justify-between">
              <div>
                <p className="font-semibold">{categoryLabel(expense.category)}</p>
                <p className="text-sm text-slate-500">{expense.description}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {formatDate(expense.date)}
                  {expense.order && ` • ${expense.order.orderId}`}
                </p>
              </div>
              <p className="font-semibold text-red-600">
                {formatCurrency(expense.amount)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Expense">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            label="Expense Date"
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            required
          />
          <Select
            label="Category"
            options={[...EXPENSE_CATEGORIES]}
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
          <Input
            label="Amount (₹)"
            type="number"
            min={0}
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
            required
          />
          <Select
            label="Platform"
            options={[{ value: "", label: "None" }, ...PLATFORMS]}
            value={form.platform}
            onChange={(e) => setForm({ ...form, platform: e.target.value })}
          />
          <Input
            label="Order ID (optional)"
            value={form.orderDbId}
            onChange={(e) => setForm({ ...form, orderDbId: e.target.value })}
            placeholder="Link to order"
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <Button type="submit" className="w-full" size="lg">
            Save Expense
          </Button>
        </form>
      </Modal>
    </div>
  );
}
