import { prisma } from './prisma';
import { isDatabaseConnected, getAllOrders, getExpenses, getProducts } from './data-store';

export type FinancialTimeRange = 'today' | 'this_week' | 'this_month' | 'this_year' | 'custom';

export interface FinancialFilterParams {
  range?: FinancialTimeRange;
  startDate?: string;
  endDate?: string;
}

export interface MetricComparison {
  current: number;
  previous: number;
  changePercent: number; // e.g. +12.5 or -5.2
  trend: 'UP' | 'DOWN' | 'NEUTRAL';
}

export interface ProductProfitabilityItem {
  productId: string;
  productName: string;
  sku: string;
  categoryName: string;
  unitsSold: number;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  marginPercent: number;
}

export interface OrderFinancialLedgerItem {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  createdAt: string;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  totalAmount: number;
  cogs: number;
  grossProfit: number;
  netContribution: number;
}

export interface ExpenseCategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

export interface PaymentMethodBreakdown {
  method: string;
  orderCount: number;
  totalVolume: number;
  collectedVolume: number;
  pendingVolume: number;
}

export interface TimeSeriesTrendPoint {
  date: string; // YYYY-MM-DD or readable label
  label: string;
  bookedSales: number;
  deliveredRevenue: number;
  cogs: number;
  expenses: number;
  netProfit: number;
}

export interface ComprehensiveFinancialReport {
  filter: {
    range: FinancialTimeRange;
    startDate: string;
    endDate: string;
    previousStartDate: string;
    previousEndDate: string;
  };
  summary: {
    bookedSales: MetricComparison;
    deliveredRevenue: MetricComparison;
    cashCollected: MetricComparison;
    outstandingReceivables: MetricComparison;
    cogs: MetricComparison;
    deliveryRevenue: MetricComparison;
    deliveryCost: MetricComparison;
    operatingExpenses: MetricComparison;
    refundsAndReturns: MetricComparison;
    grossProfit: MetricComparison;
    grossMarginPercent: number;
    netProfit: MetricComparison;
    netMarginPercent: number;
  };
  orderCounts: {
    totalPlaced: number;
    delivered: number;
    inTransitOrProcessing: number;
    pending: number;
    cancelled: number;
    returned: number;
    fulfillmentRate: number; // delivered / (total - cancelled)
  };
  codTracking: {
    bookedVolume: number;
    collectedVolume: number;
    inTransitVolume: number;
    returnedVolume: number;
    collectionRatePercent: number;
    returnRatePercent: number;
  };
  expensesByCategory: ExpenseCategoryBreakdown[];
  paymentDistribution: PaymentMethodBreakdown[];
  productProfitability: ProductProfitabilityItem[];
  orderLedger: OrderFinancialLedgerItem[];
  timeSeriesTrends: TimeSeriesTrendPoint[];
  generatedAt: string;
}

/**
 * Resolve start and end Date objects for primary and comparative periods
 */
export function resolveDateWindows(params: FinancialFilterParams): {
  start: Date;
  end: Date;
  prevStart: Date;
  prevEnd: Date;
  resolvedRange: FinancialTimeRange;
} {
  const now = new Date();
  let start: Date;
  let end: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const resolvedRange = params.range || 'this_month';

  if (resolvedRange === 'today') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  } else if (resolvedRange === 'this_week') {
    // Last 7 days including today
    start = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
    start.setHours(0, 0, 0, 0);
  } else if (resolvedRange === 'this_month') {
    // Current calendar month or last 30 days
    start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  } else if (resolvedRange === 'this_year') {
    // Current calendar year
    start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
  } else if (resolvedRange === 'custom' && params.startDate) {
    start = new Date(params.startDate);
    if (params.endDate) {
      end = new Date(params.endDate);
      end.setHours(23, 59, 59, 999);
    }
  } else {
    // Fallback to this month
    start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  }

  // Calculate matching previous period with identical duration
  const durationMs = end.getTime() - start.getTime() + 1;
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - durationMs + 1);

  return { start, end, prevStart, prevEnd, resolvedRange };
}

/**
 * Safe percentage change calculation
 */
function calculateChangePercent(current: number, previous: number): {
  changePercent: number;
  trend: 'UP' | 'DOWN' | 'NEUTRAL';
} {
  if (previous === 0) {
    if (current === 0) return { changePercent: 0, trend: 'NEUTRAL' };
    return { changePercent: 100, trend: current > 0 ? 'UP' : 'DOWN' };
  }
  const change = Number((((current - previous) / Math.abs(previous)) * 100).toFixed(1));
  const trend = change > 0 ? 'UP' : change < 0 ? 'DOWN' : 'NEUTRAL';
  return { changePercent: change, trend };
}

function makeComparison(current: number, previous: number): MetricComparison {
  const { changePercent, trend } = calculateChangePercent(current, previous);
  return {
    current: Math.round(current),
    previous: Math.round(previous),
    changePercent,
    trend,
  };
}

/**
 * Master Financial Reporting Engine
 */
export async function getComprehensiveFinancialReport(
  filters: FinancialFilterParams = {}
): Promise<ComprehensiveFinancialReport> {
  const { start, end, prevStart, prevEnd, resolvedRange } = resolveDateWindows(filters);
  const isConnected = await isDatabaseConnected();

  let allOrders: any[] = [];
  let allExpenses: any[] = [];
  let allProducts: any[] = [];

  if (isConnected) {
    try {
      allOrders = await prisma.order.findMany({
        where: { isDeleted: false },
        include: {
          items: {
            include: {
              product: {
                include: { category: true },
              },
            },
          },
          payments: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      allExpenses = await prisma.expense.findMany({
        where: { isDeleted: false },
        orderBy: { expenseDate: 'desc' },
      });

      allProducts = await prisma.product.findMany({
        where: { isArchived: false },
        include: { category: true },
      });
    } catch (e) {
      console.warn('[FINANCIAL_ANALYTICS_PRISMA_FALLBACK]', e);
      allOrders = await getAllOrders();
      allExpenses = await getExpenses();
      allProducts = await getProducts();
    }
  } else {
    allOrders = await getAllOrders();
    allExpenses = await getExpenses();
    allProducts = await getProducts();
  }

  // Helper to filter items within a date window
  const inWindow = (dateVal: any, windowStart: Date, windowEnd: Date) => {
    if (!dateVal) return false;
    const t = new Date(dateVal).getTime();
    return t >= windowStart.getTime() && t <= windowEnd.getTime();
  };

  // Segment orders and expenses into current and previous windows
  const currentOrders = allOrders.filter((o) => inWindow(o.createdAt, start, end));
  const prevOrders = allOrders.filter((o) => inWindow(o.createdAt, prevStart, prevEnd));

  const currentExpenses = allExpenses.filter((e) => inWindow(e.expenseDate || e.createdAt, start, end));
  const prevExpenses = allExpenses.filter((e) => inWindow(e.expenseDate || e.createdAt, prevStart, prevEnd));

  // --- CORE AGGREGATION FUNCTION ---
  const calculatePeriodMetrics = (orders: any[], expenses: any[]) => {
    // 1. Booked Sales (GMV): placed orders excluding cancelled
    const validOrders = orders.filter((o) => o.orderStatus !== 'CANCELLED');
    const bookedSales = validOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

    // 2. Recognized Delivered Revenue: orders completed & delivered
    const deliveredOrders = orders.filter((o) => o.orderStatus === 'DELIVERED');
    const deliveredRevenue = deliveredOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

    // 3. Cash Collections: orders with paymentStatus === PAID or recorded paid payments
    let cashCollected = 0;
    for (const o of orders) {
      if (o.orderStatus === 'CANCELLED') continue;
      if (o.paymentStatus === 'PAID') {
        cashCollected += Number(o.totalAmount || 0);
      } else if (Array.isArray(o.payments) && o.payments.length > 0) {
        const paidPayments = o.payments
          .filter((p: any) => p.status === 'PAID')
          .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
        cashCollected += paidPayments;
      } else if (o.paymentMethod === 'COD' && o.orderStatus === 'DELIVERED') {
        // COD parcel delivered means collected by courier
        cashCollected += Number(o.totalAmount || 0);
      }
    }

    // 4. Outstanding Receivables: active orders awaiting payment
    const outstandingReceivables = orders
      .filter((o) => o.orderStatus !== 'CANCELLED' && o.orderStatus !== 'RETURNED' && o.paymentStatus !== 'PAID' && !(o.paymentMethod === 'COD' && o.orderStatus === 'DELIVERED'))
      .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

    // 5. Cost of Goods Sold (COGS) on delivered orders
    let cogs = 0;
    for (const o of deliveredOrders) {
      if (Array.isArray(o.items)) {
        for (const item of o.items) {
          cogs += (Number(item.purchaseCost) || 0) * (Number(item.quantity) || 1);
        }
      }
    }

    // 6. Delivery Revenue vs Logistics Delivery Cost
    const deliveryRevenue = deliveredOrders.reduce((sum, o) => sum + Number(o.deliveryFee || 0), 0);
    const deliveryCost = expenses
      .filter((e) => String(e.category || '').toLowerCase() === 'logistics')
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    // 7. Operating Expenses (all opex categories)
    const operatingExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    // 8. Refunds & Returns Losses
    const returnedOrders = orders.filter((o) => o.orderStatus === 'RETURNED');
    const refundsAndReturns = returnedOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

    // 9. Profit calculations
    const grossProfit = deliveredRevenue - cogs;
    const deliveryMargin = deliveryRevenue - deliveryCost;
    const netProfit = grossProfit + deliveryMargin - operatingExpenses - refundsAndReturns;

    return {
      bookedSales,
      deliveredRevenue,
      cashCollected,
      outstandingReceivables,
      cogs,
      deliveryRevenue,
      deliveryCost,
      operatingExpenses,
      refundsAndReturns,
      grossProfit,
      netProfit,
    };
  };

  const curr = calculatePeriodMetrics(currentOrders, currentExpenses);
  const prev = calculatePeriodMetrics(prevOrders, prevExpenses);

  const grossMarginPercent = curr.deliveredRevenue > 0
    ? Number(((curr.grossProfit / curr.deliveredRevenue) * 100).toFixed(1))
    : 0;

  const netMarginPercent = curr.deliveredRevenue > 0
    ? Number(((curr.netProfit / curr.deliveredRevenue) * 100).toFixed(1))
    : 0;

  // --- ORDER COUNTS & FULFILLMENT RATE ---
  const totalPlaced = currentOrders.length;
  const delivered = currentOrders.filter((o) => o.orderStatus === 'DELIVERED').length;
  const inTransitOrProcessing = currentOrders.filter((o) =>
    ['PROCESSING', 'PACKED', 'SHIPPED', 'CONFIRMED'].includes(o.orderStatus)
  ).length;
  const pending = currentOrders.filter((o) => o.orderStatus === 'PENDING').length;
  const cancelled = currentOrders.filter((o) => o.orderStatus === 'CANCELLED').length;
  const returned = currentOrders.filter((o) => o.orderStatus === 'RETURNED').length;
  const netActiveOrders = totalPlaced - cancelled;
  const fulfillmentRate = netActiveOrders > 0
    ? Number(((delivered / netActiveOrders) * 100).toFixed(1))
    : 0;

  // --- COD RECONCILIATION ---
  const codOrders = currentOrders.filter((o) => o.paymentMethod === 'COD');
  const codBooked = codOrders.filter((o) => o.orderStatus !== 'CANCELLED').reduce((s, o) => s + Number(o.totalAmount || 0), 0);
  const codDelivered = codOrders.filter((o) => o.orderStatus === 'DELIVERED').reduce((s, o) => s + Number(o.totalAmount || 0), 0);
  const codInTransit = codOrders.filter((o) => ['PROCESSING', 'PACKED', 'SHIPPED', 'CONFIRMED'].includes(o.orderStatus)).reduce((s, o) => s + Number(o.totalAmount || 0), 0);
  const codReturned = codOrders.filter((o) => o.orderStatus === 'RETURNED').reduce((s, o) => s + Number(o.totalAmount || 0), 0);
  const codCollectionRate = codBooked > 0 ? Number(((codDelivered / codBooked) * 100).toFixed(1)) : 0;
  const codReturnRate = codBooked > 0 ? Number(((codReturned / codBooked) * 100).toFixed(1)) : 0;

  // --- EXPENSE CATEGORIES BREAKDOWN ---
  const catMap: Record<string, number> = {};
  for (const exp of currentExpenses) {
    const cat = exp.category || 'Miscellaneous';
    catMap[cat] = (catMap[cat] || 0) + Number(exp.amount || 0);
  }
  const expensesByCategory: ExpenseCategoryBreakdown[] = Object.entries(catMap)
    .map(([category, amount]) => ({
      category,
      amount: Math.round(amount),
      percentage: curr.operatingExpenses > 0
        ? Number(((amount / curr.operatingExpenses) * 100).toFixed(1))
        : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // --- PAYMENT METHOD DISTRIBUTION ---
  const payMap: Record<string, { count: number; total: number; collected: number; pending: number }> = {
    COD: { count: 0, total: 0, collected: 0, pending: 0 },
    BKASH: { count: 0, total: 0, collected: 0, pending: 0 },
    NAGAD: { count: 0, total: 0, collected: 0, pending: 0 },
    ROCKET: { count: 0, total: 0, collected: 0, pending: 0 },
    CARD: { count: 0, total: 0, collected: 0, pending: 0 },
  };

  for (const o of currentOrders) {
    if (o.orderStatus === 'CANCELLED') continue;
    const m = (o.paymentMethod || 'COD').toUpperCase();
    if (!payMap[m]) payMap[m] = { count: 0, total: 0, collected: 0, pending: 0 };
    const amt = Number(o.totalAmount || 0);
    payMap[m].count += 1;
    payMap[m].total += amt;
    if (o.paymentStatus === 'PAID' || (m === 'COD' && o.orderStatus === 'DELIVERED')) {
      payMap[m].collected += amt;
    } else {
      payMap[m].pending += amt;
    }
  }

  const paymentDistribution: PaymentMethodBreakdown[] = Object.entries(payMap)
    .filter(([_, data]) => data.count > 0)
    .map(([method, data]) => ({
      method,
      orderCount: data.count,
      totalVolume: Math.round(data.total),
      collectedVolume: Math.round(data.collected),
      pendingVolume: Math.round(data.pending),
    }))
    .sort((a, b) => b.totalVolume - a.totalVolume);

  // --- PRODUCT-WISE PROFITABILITY ---
  const prodStatsMap: Record<
    string,
    {
      productId: string;
      productName: string;
      sku: string;
      categoryName: string;
      unitsSold: number;
      totalRevenue: number;
      totalCost: number;
    }
  > = {};

  for (const o of currentOrders) {
    if (o.orderStatus === 'CANCELLED') continue;
    if (Array.isArray(o.items)) {
      for (const it of o.items) {
        const pId = it.productId;
        if (!prodStatsMap[pId]) {
          const prodObj = allProducts.find((p: any) => p.id === pId);
          prodStatsMap[pId] = {
            productId: pId,
            productName: it.productName || prodObj?.name || 'Unknown Product',
            sku: it.sku || prodObj?.sku || 'N/A',
            categoryName: (it.product?.category?.name || prodObj?.category?.name || 'General'),
            unitsSold: 0,
            totalRevenue: 0,
            totalCost: 0,
          };
        }
        const qty = Number(it.quantity || 1);
        const revenue = Number(it.totalPrice || it.unitPrice * qty || 0);
        const cost = (Number(it.purchaseCost) || 0) * qty;

        prodStatsMap[pId].unitsSold += qty;
        prodStatsMap[pId].totalRevenue += revenue;
        prodStatsMap[pId].totalCost += cost;
      }
    }
  }

  const productProfitability: ProductProfitabilityItem[] = Object.values(prodStatsMap)
    .map((item) => {
      const grossProfit = Math.round(item.totalRevenue - item.totalCost);
      const marginPercent = item.totalRevenue > 0
        ? Number(((grossProfit / item.totalRevenue) * 100).toFixed(1))
        : 0;
      return {
        ...item,
        totalRevenue: Math.round(item.totalRevenue),
        totalCost: Math.round(item.totalCost),
        grossProfit,
        marginPercent,
      };
    })
    .sort((a, b) => b.grossProfit - a.grossProfit);

  // --- ORDER-WISE FINANCIAL LEDGER ---
  const orderLedger: OrderFinancialLedgerItem[] = currentOrders.map((o) => {
    let orderCogs = 0;
    if (Array.isArray(o.items)) {
      for (const it of o.items) {
        orderCogs += (Number(it.purchaseCost) || 0) * (Number(it.quantity) || 1);
      }
    }
    const subtotal = Number(o.subtotal || 0);
    const discount = Number(o.discount || 0);
    const deliveryFee = Number(o.deliveryFee || 0);
    const totalAmount = Number(o.totalAmount || 0);
    const grossProfit = Math.round(subtotal - discount - orderCogs);
    const netContribution = o.orderStatus === 'CANCELLED' ? 0 : Math.round(totalAmount - orderCogs);

    return {
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customerName || 'Customer',
      customerPhone: o.customerPhone || '',
      createdAt: new Date(o.createdAt || Date.now()).toISOString(),
      orderStatus: o.orderStatus,
      paymentStatus: o.paymentStatus,
      paymentMethod: o.paymentMethod,
      subtotal: Math.round(subtotal),
      discount: Math.round(discount),
      deliveryFee: Math.round(deliveryFee),
      totalAmount: Math.round(totalAmount),
      cogs: Math.round(orderCogs),
      grossProfit,
      netContribution,
    };
  });

  // --- TIME-SERIES TRENDS (FOR CHARTS) ---
  const timeSeriesTrends: TimeSeriesTrendPoint[] = [];
  const daysDiff = Math.max(1, Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)));

  if (daysDiff <= 31) {
    // Daily buckets
    const bucketMap: Record<string, TimeSeriesTrendPoint> = {};
    for (let i = 0; i < daysDiff; i++) {
      const d = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
      const dateKey = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      bucketMap[dateKey] = {
        date: dateKey,
        label,
        bookedSales: 0,
        deliveredRevenue: 0,
        cogs: 0,
        expenses: 0,
        netProfit: 0,
      };
    }

    for (const o of currentOrders) {
      if (o.orderStatus === 'CANCELLED') continue;
      const dateKey = new Date(o.createdAt).toISOString().slice(0, 10);
      if (bucketMap[dateKey]) {
        bucketMap[dateKey].bookedSales += Number(o.totalAmount || 0);
        if (o.orderStatus === 'DELIVERED') {
          bucketMap[dateKey].deliveredRevenue += Number(o.totalAmount || 0);
          if (Array.isArray(o.items)) {
            for (const it of o.items) {
              bucketMap[dateKey].cogs += (Number(it.purchaseCost) || 0) * (Number(it.quantity) || 1);
            }
          }
        }
      }
    }

    for (const exp of currentExpenses) {
      const dateKey = new Date(exp.expenseDate || exp.createdAt).toISOString().slice(0, 10);
      if (bucketMap[dateKey]) {
        bucketMap[dateKey].expenses += Number(exp.amount || 0);
      }
    }

    Object.values(bucketMap).forEach((pt) => {
      pt.bookedSales = Math.round(pt.bookedSales);
      pt.deliveredRevenue = Math.round(pt.deliveredRevenue);
      pt.cogs = Math.round(pt.cogs);
      pt.expenses = Math.round(pt.expenses);
      pt.netProfit = Math.round(pt.deliveredRevenue - pt.cogs - pt.expenses);
      timeSeriesTrends.push(pt);
    });
  } else {
    // Monthly buckets for longer ranges
    const monthlyMap: Record<string, TimeSeriesTrendPoint> = {};
    const cur = new Date(start);
    while (cur <= end) {
      const monthKey = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`;
      const label = cur.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = {
          date: monthKey,
          label,
          bookedSales: 0,
          deliveredRevenue: 0,
          cogs: 0,
          expenses: 0,
          netProfit: 0,
        };
      }
      cur.setMonth(cur.getMonth() + 1);
    }

    for (const o of currentOrders) {
      if (o.orderStatus === 'CANCELLED') continue;
      const d = new Date(o.createdAt);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyMap[monthKey]) {
        monthlyMap[monthKey].bookedSales += Number(o.totalAmount || 0);
        if (o.orderStatus === 'DELIVERED') {
          monthlyMap[monthKey].deliveredRevenue += Number(o.totalAmount || 0);
          if (Array.isArray(o.items)) {
            for (const it of o.items) {
              monthlyMap[monthKey].cogs += (Number(it.purchaseCost) || 0) * (Number(it.quantity) || 1);
            }
          }
        }
      }
    }

    for (const exp of currentExpenses) {
      const d = new Date(exp.expenseDate || exp.createdAt);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyMap[monthKey]) {
        monthlyMap[monthKey].expenses += Number(exp.amount || 0);
      }
    }

    Object.values(monthlyMap).forEach((pt) => {
      pt.bookedSales = Math.round(pt.bookedSales);
      pt.deliveredRevenue = Math.round(pt.deliveredRevenue);
      pt.cogs = Math.round(pt.cogs);
      pt.expenses = Math.round(pt.expenses);
      pt.netProfit = Math.round(pt.deliveredRevenue - pt.cogs - pt.expenses);
      timeSeriesTrends.push(pt);
    });
  }

  return {
    filter: {
      range: resolvedRange,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      previousStartDate: prevStart.toISOString(),
      previousEndDate: prevEnd.toISOString(),
    },
    summary: {
      bookedSales: makeComparison(curr.bookedSales, prev.bookedSales),
      deliveredRevenue: makeComparison(curr.deliveredRevenue, prev.deliveredRevenue),
      cashCollected: makeComparison(curr.cashCollected, prev.cashCollected),
      outstandingReceivables: makeComparison(curr.outstandingReceivables, prev.outstandingReceivables),
      cogs: makeComparison(curr.cogs, prev.cogs),
      deliveryRevenue: makeComparison(curr.deliveryRevenue, prev.deliveryRevenue),
      deliveryCost: makeComparison(curr.deliveryCost, prev.deliveryCost),
      operatingExpenses: makeComparison(curr.operatingExpenses, prev.operatingExpenses),
      refundsAndReturns: makeComparison(curr.refundsAndReturns, prev.refundsAndReturns),
      grossProfit: makeComparison(curr.grossProfit, prev.grossProfit),
      grossMarginPercent,
      netProfit: makeComparison(curr.netProfit, prev.netProfit),
      netMarginPercent,
    },
    orderCounts: {
      totalPlaced,
      delivered,
      inTransitOrProcessing,
      pending,
      cancelled,
      returned,
      fulfillmentRate,
    },
    codTracking: {
      bookedVolume: Math.round(codBooked),
      collectedVolume: Math.round(codDelivered),
      inTransitVolume: Math.round(codInTransit),
      returnedVolume: Math.round(codReturned),
      collectionRatePercent: codCollectionRate,
      returnRatePercent: codReturnRate,
    },
    expensesByCategory,
    paymentDistribution,
    productProfitability,
    orderLedger,
    timeSeriesTrends,
    generatedAt: new Date().toISOString(),
  };
}
