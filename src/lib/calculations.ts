export interface ProfitInput {
  sellingPrice: number;
  productCost: number;
  platformCommission?: number;
  shippingCharge?: number;
  gstTax?: number;
  otherCharges?: number;
  returnCharges?: number;
  quantity?: number;
}

export function calculateGrossProfit(input: ProfitInput): number {
  const qty = input.quantity ?? 1;
  return input.sellingPrice * qty - input.productCost * qty;
}

export function calculateTotalExpenses(input: ProfitInput): number {
  const qty = input.quantity ?? 1;
  return (
    input.productCost * qty +
    (input.platformCommission ?? 0) +
    (input.shippingCharge ?? 0) +
    (input.gstTax ?? 0) +
    (input.otherCharges ?? 0) +
    (input.returnCharges ?? 0)
  );
}

export function calculateNetProfit(input: ProfitInput): number {
  const qty = input.quantity ?? 1;
  const revenue = input.sellingPrice * qty;
  const expenses =
    input.productCost * qty +
    (input.platformCommission ?? 0) +
    (input.shippingCharge ?? 0) +
    (input.gstTax ?? 0) +
    (input.otherCharges ?? 0) +
    (input.returnCharges ?? 0);
  return revenue - expenses;
}

export function isLoss(netProfit: number): boolean {
  return netProfit < 0;
}

export function calculateReturnRate(totalOrders: number, totalReturns: number): number {
  if (totalOrders === 0) return 0;
  return (totalReturns / totalOrders) * 100;
}

export interface OrderStats {
  totalOrders: number;
  totalReturns: number;
  totalQuantityReturned: number;
  returnPercentage: number;
  returnCharges: number;
  shippingLoss: number;
  productLoss: number;
  totalReturnLoss: number;
}

export function calculateReturnStats(
  totalOrders: number,
  returns: Array<{
    quantity: number;
    returnCharge: number;
    reverseShippingCharge: number;
    lossAmount: number;
  }>
): OrderStats {
  const totalReturns = returns.length;
  const totalQuantityReturned = returns.reduce((sum, r) => sum + r.quantity, 0);
  const returnCharges = returns.reduce((sum, r) => sum + r.returnCharge, 0);
  const shippingLoss = returns.reduce((sum, r) => sum + r.reverseShippingCharge, 0);
  const productLoss = returns.reduce((sum, r) => sum + r.lossAmount, 0);

  return {
    totalOrders,
    totalReturns,
    totalQuantityReturned,
    returnPercentage: calculateReturnRate(totalOrders, totalReturns),
    returnCharges,
    shippingLoss,
    productLoss,
    totalReturnLoss: returnCharges + shippingLoss + productLoss,
  };
}

export interface DashboardMetrics {
  orders: number;
  sales: number;
  productCost: number;
  platformCharges: number;
  shippingCharges: number;
  returnCharges: number;
  otherExpenses: number;
  profit: number;
  loss: number;
  returns: number;
  pendingPayments: number;
  productsSold: number;
}

export function aggregateOrderMetrics(
  orders: Array<{
    quantity: number;
    sellingPrice: number;
    productCost: number;
    platformCommission: number;
    shippingCharge: number;
    gstTax: number;
    otherCharges: number;
    returnCharges: number;
    netProfit: number;
    isReturned: boolean;
    paymentStatus: string;
  }>
): DashboardMetrics {
  let profit = 0;
  let loss = 0;
  let pendingPayments = 0;

  const metrics: DashboardMetrics = {
    orders: orders.length,
    sales: 0,
    productCost: 0,
    platformCharges: 0,
    shippingCharges: 0,
    returnCharges: 0,
    otherExpenses: 0,
    profit: 0,
    loss: 0,
    returns: 0,
    pendingPayments: 0,
    productsSold: 0,
  };

  for (const order of orders) {
    const qty = order.quantity;
    metrics.sales += order.sellingPrice * qty;
    metrics.productCost += order.productCost * qty;
    metrics.platformCharges += order.platformCommission;
    metrics.shippingCharges += order.shippingCharge;
    metrics.returnCharges += order.returnCharges;
    metrics.otherExpenses += order.gstTax + order.otherCharges;
    metrics.productsSold += qty;

    if (order.isReturned) metrics.returns += 1;

    if (order.netProfit >= 0) {
      profit += order.netProfit;
    } else {
      loss += Math.abs(order.netProfit);
    }

    if (order.paymentStatus === "PENDING" || order.paymentStatus === "PROCESSING") {
      pendingPayments += order.sellingPrice * qty;
    }
  }

  metrics.profit = profit;
  metrics.loss = loss;
  metrics.pendingPayments = pendingPayments;

  return metrics;
}
