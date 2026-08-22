"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Package,
  CreditCard,
  Receipt,
  BarChart3,
  Settings,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { href: "/products", label: "Products", icon: Package },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function MenuPage() {
  const pathname = usePathname();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">More</h1>
      <div className="grid grid-cols-2 gap-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-md transition-shadow",
                pathname.startsWith(item.href) && "border-blue-200 bg-blue-50"
              )}
            >
              <Icon className="h-8 w-8 text-blue-600" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
