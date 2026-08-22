"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  ScanLine,
  RotateCcw,
  Package,
  CreditCard,
  Receipt,
  BarChart3,
  Settings,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/scan", label: "Scan", icon: ScanLine, highlight: true },
  { href: "/returns", label: "Returns", icon: RotateCcw },
  { href: "/products", label: "Products", icon: Package },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh flex flex-col md:flex-row">
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white border-r border-slate-200">
        <div className="p-6">
          <h1 className="text-xl font-bold text-blue-600">SellTrack</h1>
          <p className="text-xs text-slate-500 mt-1">E-Commerce Manager</p>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 md:ml-64 pb-20 md:pb-6">
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-slate-200 px-4 py-3 md:px-6">
          <div className="flex items-center justify-between">
            <div className="md:hidden">
              <h1 className="text-lg font-bold text-blue-600">SellTrack</h1>
            </div>
            <Link
              href="/notifications"
              className="ml-auto rounded-full p-2 hover:bg-slate-100"
            >
              <Bell className="h-5 w-5 text-slate-600" />
            </Link>
          </div>
        </header>
        <div className="px-4 py-4 md:px-6 md:py-6">{children}</div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 md:hidden safe-area-pb">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl min-w-[60px]",
                  item.highlight && "relative -mt-4",
                  isActive ? "text-blue-600" : "text-slate-500"
                )}
              >
                {item.highlight ? (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg">
                    <Icon className="h-6 w-6" />
                  </div>
                ) : (
                  <Icon className="h-5 w-5" />
                )}
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
          <Link
            href="/menu"
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl min-w-[60px]",
              pathname === "/menu" ? "text-blue-600" : "text-slate-500"
            )}
          >
            <Settings className="h-5 w-5" />
            <span className="text-[10px] font-medium">More</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
