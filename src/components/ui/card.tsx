import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className, onClick }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm",
        onClick && "cursor-pointer hover:shadow-md transition-shadow",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function StatCard({
  title,
  value,
  subtitle,
  trend,
  variant = "default",
}: {
  title: string;
  value: string;
  subtitle?: string;
  trend?: number;
  variant?: "default" | "success" | "danger" | "warning";
}) {
  const colors = {
    default: "text-slate-900",
    success: "text-green-600",
    danger: "text-red-600",
    warning: "text-amber-600",
  };

  return (
    <Card>
      <p className="text-sm text-slate-500">{title}</p>
      <p className={cn("mt-1 text-2xl font-bold", colors[variant])}>{value}</p>
      {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
      {trend !== undefined && (
        <p className={cn("mt-1 text-xs font-medium", trend >= 0 ? "text-green-600" : "text-red-600")}>
          {trend >= 0 ? "↑" : "↓"} {Math.abs(trend).toFixed(1)}% vs last month
        </p>
      )}
    </Card>
  );
}
