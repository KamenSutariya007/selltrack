import { cn, formatCurrency } from "@/lib/utils";

export function ProfitDisplay({
  sellingPrice,
  productCost,
  totalExpenses,
  netProfit,
  quantity = 1,
}: {
  sellingPrice: number;
  productCost: number;
  totalExpenses: number;
  netProfit: number;
  quantity?: number;
}) {
  const isLoss = netProfit < 0;

  return (
    <div className="rounded-xl bg-slate-50 p-4 space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-slate-500">Selling Price</span>
        <span>{formatCurrency(sellingPrice * quantity)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-slate-500">Product Cost</span>
        <span>{formatCurrency(productCost * quantity)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-slate-500">Total Expenses</span>
        <span>{formatCurrency(totalExpenses)}</span>
      </div>
      <div className="border-t border-slate-200 pt-2 flex justify-between font-semibold">
        <span>{isLoss ? "Loss" : "Net Profit"}</span>
        <span className={cn(isLoss ? "text-red-600" : "text-green-600")}>
          {isLoss ? "-" : ""}
          {formatCurrency(Math.abs(netProfit))}
        </span>
      </div>
    </div>
  );
}
