"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BarcodeScanner } from "@/components/barcode-scanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { PLATFORMS } from "@/lib/utils";
import { ScanLine, Package, ShoppingCart, RotateCcw } from "lucide-react";

interface Product {
  id: string;
  productName: string;
  sku: string;
  barcode: string;
  size: string | null;
  color: string | null;
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  platform: string | null;
}

export default function ScanPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"menu" | "scan" | "manual">("menu");
  const [barcode, setBarcode] = useState("");
  const [product, setProduct] = useState<Product | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    productName: "",
    sku: "",
    barcode: "",
    size: "",
    color: "",
    costPrice: 0,
    sellingPrice: 0,
    currentStock: 0,
    platform: "AMAZON",
  });

  const lookupBarcode = async (code: string) => {
    setBarcode(code);
    const res = await fetch(`/api/products?barcode=${encodeURIComponent(code)}`);
    const data = await res.json();

    if (data && data.id) {
      setProduct(data);
      setNotFound(false);
    } else {
      setProduct(null);
      setNotFound(true);
      setNewProduct((p) => ({ ...p, barcode: code }));
    }
  };

  const saveProduct = async () => {
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newProduct),
    });

    if (res.ok) {
      const saved = await res.json();
      setProduct(saved);
      setNotFound(false);
      setShowAddProduct(false);
    }
  };

  const goToAddOrder = () => {
    if (!product) return;
    const params = new URLSearchParams({
      productId: product.id,
      productName: product.productName,
      sku: product.sku,
      barcode: product.barcode,
      size: product.size || "",
      color: product.color || "",
      productCost: String(product.costPrice),
      sellingPrice: String(product.sellingPrice),
      platform: product.platform || "AMAZON",
    });
    router.push(`/orders?${params}`);
  };

  if (mode === "menu") {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Quick Scan</h1>
          <p className="text-slate-500 text-sm">Scan barcode to identify product</p>
        </div>

        <Button onClick={() => setMode("scan")} size="lg" className="w-full h-16 text-lg">
          <ScanLine className="h-6 w-6" />
          Open Camera Scanner
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-slate-50 px-4 text-slate-500">or enter manually</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Enter barcode..."
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            className="flex-1"
          />
          <Button onClick={() => lookupBarcode(barcode)} disabled={!barcode}>
            Lookup
          </Button>
        </div>

        {product && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4 space-y-3">
            <div className="flex items-center gap-2 text-green-700">
              <Package className="h-5 w-5" />
              <span className="font-semibold">Product Found</span>
            </div>
            <div className="space-y-1 text-sm">
              <p className="font-medium text-lg">{product.productName}</p>
              <p>SKU: {product.sku}</p>
              <p>Stock: {product.currentStock}</p>
              <p>Cost: ₹{product.costPrice} | Sell: ₹{product.sellingPrice}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={goToAddOrder} className="flex-1">
                <ShoppingCart className="h-4 w-4" />
                Add Order
              </Button>
              <Button
                variant="secondary"
                onClick={() => router.push(`/returns?barcode=${product.barcode}`)}
                className="flex-1"
              >
                <RotateCcw className="h-4 w-4" />
                Return
              </Button>
            </div>
          </div>
        )}

        {notFound && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-3">
            <p className="font-semibold text-amber-800">
              Product not found – Add New Product
            </p>
            <p className="text-sm text-amber-700">Barcode: {barcode}</p>
            <Button onClick={() => setShowAddProduct(true)} className="w-full">
              Add New Product
            </Button>
          </div>
        )}

        <Modal
          isOpen={showAddProduct}
          onClose={() => setShowAddProduct(false)}
          title="Add New Product"
          size="lg"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveProduct();
            }}
            className="space-y-3"
          >
            <Input
              label="Product Name *"
              value={newProduct.productName}
              onChange={(e) => setNewProduct({ ...newProduct, productName: e.target.value })}
              required
            />
            <Input
              label="SKU *"
              value={newProduct.sku}
              onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
              required
            />
            <Input label="Barcode" value={newProduct.barcode} disabled />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Size"
                value={newProduct.size}
                onChange={(e) => setNewProduct({ ...newProduct, size: e.target.value })}
              />
              <Input
                label="Color"
                value={newProduct.color}
                onChange={(e) => setNewProduct({ ...newProduct, color: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Cost Price"
                type="number"
                value={newProduct.costPrice}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, costPrice: Number(e.target.value) })
                }
              />
              <Input
                label="Selling Price"
                type="number"
                value={newProduct.sellingPrice}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, sellingPrice: Number(e.target.value) })
                }
              />
            </div>
            <Input
              label="Initial Stock"
              type="number"
              value={newProduct.currentStock}
              onChange={(e) =>
                setNewProduct({ ...newProduct, currentStock: Number(e.target.value) })
              }
            />
            <Select
              label="Platform"
              options={[...PLATFORMS]}
              value={newProduct.platform}
              onChange={(e) => setNewProduct({ ...newProduct, platform: e.target.value })}
            />
            <Button type="submit" className="w-full" size="lg">
              Save Product
            </Button>
          </form>
        </Modal>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={() => setMode("menu")}>
        ← Back
      </Button>
      <BarcodeScanner
        onScan={lookupBarcode}
        onClose={() => setMode("menu")}
      />
      {product && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
          <p className="font-semibold">{product.productName}</p>
          <Button onClick={goToAddOrder} className="w-full mt-3">
            Add Order for this Product
          </Button>
        </div>
      )}
      {notFound && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="font-semibold text-amber-800">Product not found</p>
          <Button onClick={() => setShowAddProduct(true)} className="w-full mt-3">
            Add New Product
          </Button>
        </div>
      )}
    </div>
  );
}
