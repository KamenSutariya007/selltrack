"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { formatCurrency, PLATFORMS, platformLabel } from "@/lib/utils";
import { Plus, Search, AlertTriangle } from "lucide-react";

interface Product {
  id: string;
  productName: string;
  sku: string;
  barcode: string;
  category: string | null;
  size: string | null;
  color: string | null;
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  returnedStock: number;
  damagedStock: number;
  lostStock: number;
  minimumStock: number;
  platform: string | null;
  supplier: string | null;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    productName: "",
    sku: "",
    barcode: "",
    category: "",
    size: "",
    color: "",
    costPrice: 0,
    sellingPrice: 0,
    currentStock: 0,
    minimumStock: 5,
    platform: "",
    supplier: "",
    notes: "",
  });

  const fetchProducts = () => {
    const params = search ? `?search=${encodeURIComponent(search)}` : "";
    fetch(`/api/products${params}`)
      .then((r) => r.json())
      .then(setProducts);
  };

  useEffect(() => {
    fetchProducts();
  }, [search]);

  const generateBarcode = () => {
    const code = `BC${Date.now()}${Math.floor(Math.random() * 1000)}`;
    setForm({ ...form, barcode: code });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        platform: form.platform || undefined,
      }),
    });

    if (res.ok) {
      setShowAdd(false);
      fetchProducts();
      setForm({
        productName: "",
        sku: "",
        barcode: "",
        category: "",
        size: "",
        color: "",
        costPrice: 0,
        sellingPrice: 0,
        currentStock: 0,
        minimumStock: 5,
        platform: "",
        supplier: "",
        notes: "",
      });
    } else {
      const data = await res.json();
      alert(data.error || "Failed to save");
    }
  };

  const lowStock = products.filter((p) => p.currentStock <= p.minimumStock);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-slate-500 text-sm">{products.length} products</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      {lowStock.length > 0 && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
          <div className="flex items-center gap-2 text-amber-800 font-medium">
            <AlertTriangle className="h-4 w-4" />
            Low Stock Alerts
          </div>
          <div className="mt-2 space-y-1">
            {lowStock.map((p) => (
              <p key={p.id} className="text-sm text-amber-700">
                {p.productName} – Only {p.currentStock} left
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        {products.map((product) => (
          <div key={product.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold">{product.productName}</p>
                <p className="text-sm text-slate-500">
                  SKU: {product.sku} • {product.barcode}
                </p>
                {(product.size || product.color) && (
                  <p className="text-xs text-slate-400">
                    {[product.size, product.color].filter(Boolean).join(" / ")}
                  </p>
                )}
              </div>
              <div className="text-right text-sm">
                <p className="font-medium">{formatCurrency(product.sellingPrice)}</p>
                <p className="text-slate-500">Cost: {formatCurrency(product.costPrice)}</p>
              </div>
            </div>
            <div className="mt-3 flex gap-2 flex-wrap text-xs">
              <span
                className={`px-2 py-1 rounded-full ${
                  product.currentStock <= product.minimumStock
                    ? "bg-red-100 text-red-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                Stock: {product.currentStock}
              </span>
              {product.returnedStock > 0 && (
                <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                  Returned: {product.returnedStock}
                </span>
              )}
              {product.damagedStock > 0 && (
                <span className="px-2 py-1 rounded-full bg-red-100 text-red-700">
                  Damaged: {product.damagedStock}
                </span>
              )}
              {product.lostStock > 0 && (
                <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                  Lost: {product.lostStock}
                </span>
              )}
              {product.platform && (
                <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                  {platformLabel(product.platform)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Product" size="lg">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            label="Product Name *"
            value={form.productName}
            onChange={(e) => setForm({ ...form, productName: e.target.value })}
            required
          />
          <Input
            label="SKU *"
            value={form.sku}
            onChange={(e) => setForm({ ...form, sku: e.target.value })}
            required
          />
          <div className="flex gap-2">
            <Input
              label="Barcode *"
              value={form.barcode}
              onChange={(e) => setForm({ ...form, barcode: e.target.value })}
              required
              className="flex-1"
            />
            <Button type="button" variant="secondary" onClick={generateBarcode} className="mt-6">
              Generate
            </Button>
          </div>
          <Input
            label="Category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
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
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Purchase Cost (₹)"
              type="number"
              min={0}
              value={form.costPrice}
              onChange={(e) => setForm({ ...form, costPrice: Number(e.target.value) })}
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
              label="Current Stock"
              type="number"
              min={0}
              value={form.currentStock}
              onChange={(e) => setForm({ ...form, currentStock: Number(e.target.value) })}
            />
            <Input
              label="Minimum Stock"
              type="number"
              min={0}
              value={form.minimumStock}
              onChange={(e) => setForm({ ...form, minimumStock: Number(e.target.value) })}
            />
          </div>
          <Select
            label="Platform"
            options={[{ value: "", label: "None" }, ...PLATFORMS]}
            value={form.platform}
            onChange={(e) => setForm({ ...form, platform: e.target.value })}
          />
          <Input
            label="Supplier"
            value={form.supplier}
            onChange={(e) => setForm({ ...form, supplier: e.target.value })}
          />
          <Textarea
            label="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <Button type="submit" className="w-full" size="lg">
            Save Product
          </Button>
        </form>
      </Modal>
    </div>
  );
}
