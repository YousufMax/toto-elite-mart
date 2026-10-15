/**
 * Order Aging, SLA Deadlines & Financial Balance Utility
 * Provides dynamic duration calculations, overdue tracking, and financial reconciliation.
 */

export type AgingStatus = 'OVERDUE' | 'URGENT' | 'ON_TRACK' | 'DELIVERED' | 'CANCELLED';

export interface OrderAgingInfo {
  createdAtIso: string;
  createdAtFormatted: string; // "Oct 15, 2026, 04:30 PM"
  elapsedMs: number;
  elapsedFormatted: string; // "2d 4h 12m ago" or "45m ago"
  slaHours: number; // 48 (Inside Dhaka) or 96 (Outside Dhaka)
  expectedDeliveryDate: string; // ISO string
  expectedDeliveryFormatted: string;
  isOverdue: boolean;
  overdueMs: number;
  overdueFormatted: string; // "Overdue by 1d 4h"
  timeRemainingMs: number;
  timeRemainingFormatted: string; // "Due in 18h 30m"
  fulfillmentDurationMs: number | null;
  fulfillmentDurationFormatted: string | null; // "Delivered in 1d 6h"
  agingStatus: AgingStatus;

  // Financial reconciliation (Zero double-counting)
  orderValue: number;
  collectedAmount: number;
  outstandingBalance: number;
  isFullyPaid: boolean;
  paymentStatus: string;
}

/**
 * Format milliseconds into human-readable days, hours, and minutes
 */
export function formatDuration(ms: number): string {
  if (ms < 0) ms = 0;
  const totalMinutes = Math.floor(ms / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  }
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  return `${Math.max(1, minutes)}m`;
}

/**
 * Format a Date object in Bangladesh local time (Asia/Dhaka)
 */
export function formatLocalOrderDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleString('en-US', {
    timeZone: 'Asia/Dhaka',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Compute SLA delivery deadline based on destination zone or city
 * Inside Dhaka: 48 hours; Outside Dhaka: 96 hours
 */
export function computeSlaDeadline(
  createdDate: Date | string | number,
  deliveryZoneOrCity?: string
): Date {
  const createdMs = new Date(createdDate).getTime();
  const text = (deliveryZoneOrCity || '').trim().toLowerCase();
  const isDhaka = text.includes('dhaka') && !text.includes('outside');
  const slaHours = isDhaka || text === 'inside dhaka' ? 48 : 96;
  return new Date(createdMs + slaHours * 3600 * 1000);
}

/**
 * Calculate complete aging, SLA, and financial metrics for an order
 */
export function calculateOrderAging(order: any, nowMs: number = Date.now()): OrderAgingInfo {
  const createdDate = new Date(order.createdAt || nowMs);
  const updatedDate = new Date(order.updatedAt || order.createdAt || nowMs);
  const createdMs = createdDate.getTime();
  const updatedMs = updatedDate.getTime();

  // SLA Configuration: 48h for Inside Dhaka, 96h for Outside Dhaka
  const locationString = `${order.deliveryZone || ''} ${order.deliveryCity || ''} ${order.shippingAddress || ''}`;
  const isOutsideDhaka =
    order.deliveryZone === 'Outside Dhaka' ||
    (order.deliveryCity && order.deliveryCity.trim().toLowerCase() !== 'dhaka' && !locationString.toLowerCase().includes('dhaka'));
  const slaHours = isOutsideDhaka ? 96 : 48;

  // Expected delivery date: manual override if set, else computed SLA
  const expectedDate = order.expectedDeliveryDate
    ? new Date(order.expectedDeliveryDate)
    : computeSlaDeadline(createdDate, locationString);
  const expectedMs = expectedDate.getTime();

  const isDelivered = order.orderStatus === 'DELIVERED';
  const isCancelled = order.orderStatus === 'CANCELLED';
  const isActive = !isDelivered && !isCancelled;

  // Elapsed time & fulfillment duration
  let deliveredDate: Date | null = null;
  if (isDelivered) {
    if (Array.isArray(order.statusHistory)) {
      const deliveredEntry = order.statusHistory.find((h: any) => h.toStatus === 'DELIVERED');
      if (deliveredEntry && deliveredEntry.createdAt) {
        deliveredDate = new Date(deliveredEntry.createdAt);
      }
    }
    if (!deliveredDate && order.updatedAt && new Date(order.updatedAt).getTime() > createdMs) {
      deliveredDate = new Date(order.updatedAt);
    }
    if (!deliveredDate) {
      deliveredDate = updatedDate;
    }
  }
  const deliveredMs = deliveredDate ? deliveredDate.getTime() : 0;

  const elapsedMs = isDelivered && deliveredMs > createdMs
    ? Math.max(0, deliveredMs - createdMs)
    : Math.max(0, nowMs - createdMs);
  const elapsedFormatted = `${formatDuration(elapsedMs)} ago`;

  // Fulfillment duration for delivered orders
  const fulfillmentDurationMs = isDelivered && deliveredMs > createdMs
    ? Math.max(0, deliveredMs - createdMs)
    : null;
  const fulfillmentDurationFormatted = fulfillmentDurationMs
    ? `Delivered in ${formatDuration(fulfillmentDurationMs)}`
    : null;

  // Overdue status: Only active orders can be overdue
  const isOverdue = isActive && nowMs > expectedMs;
  const overdueMs = isOverdue ? nowMs - expectedMs : 0;
  const overdueFormatted = isOverdue ? `Overdue by ${formatDuration(overdueMs)}` : '';

  const timeRemainingMs = isActive && !isOverdue ? Math.max(0, expectedMs - nowMs) : 0;
  const timeRemainingFormatted = isActive && !isOverdue ? `Due in ${formatDuration(timeRemainingMs)}` : '';

  // Aging status categorization
  let agingStatus: AgingStatus = 'ON_TRACK';
  if (isCancelled) {
    agingStatus = 'CANCELLED';
  } else if (isDelivered) {
    agingStatus = 'DELIVERED';
  } else if (isOverdue) {
    agingStatus = 'OVERDUE';
  } else if (timeRemainingMs <= 12 * 3600 * 1000) {
    agingStatus = 'URGENT'; // Less than 12 hours remaining
  } else {
    agingStatus = 'ON_TRACK';
  }

  // Financial balance calculation without double counting
  const orderValue = Math.round(Number(order.totalAmount || 0));
  let collectedAmount = 0;

  if (Array.isArray(order.payments) && order.payments.length > 0) {
    collectedAmount = order.payments
      .filter((p: any) => {
        const s = String(p.status || '').toUpperCase();
        return s === 'PAID' || s === 'SUCCESS' || s === 'COMPLETED';
      })
      .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
  }

  if (collectedAmount === 0 && order.paymentStatus === 'PAID') {
    // If marked PAID but no separate payments table entry, full value collected
    collectedAmount = orderValue;
  }

  collectedAmount = Math.round(collectedAmount);
  const outstandingBalance = Math.max(0, orderValue - collectedAmount);
  const isFullyPaid = order.paymentStatus === 'PAID' || outstandingBalance === 0;

  return {
    createdAtIso: createdDate.toISOString(),
    createdAtFormatted: formatLocalOrderDate(createdDate),
    elapsedMs,
    elapsedFormatted,
    slaHours,
    expectedDeliveryDate: expectedDate.toISOString(),
    expectedDeliveryFormatted: formatLocalOrderDate(expectedDate),
    isOverdue,
    overdueMs,
    overdueFormatted,
    timeRemainingMs,
    timeRemainingFormatted,
    fulfillmentDurationMs,
    fulfillmentDurationFormatted,
    agingStatus,
    orderValue,
    collectedAmount,
    outstandingBalance,
    isFullyPaid,
    paymentStatus: order.paymentStatus || 'UNPAID',
  };
}
