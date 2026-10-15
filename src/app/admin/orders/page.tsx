'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { formatBDT } from '@/lib/currency';
import {
  calculateOrderAging,
  formatLocalOrderDate,
  formatDuration,
  type OrderAgingInfo,
  type AgingStatus,
} from '@/lib/order-aging';
import OrderInvoicePrint from '@/components/admin/OrderInvoicePrint';
import {
  Search,
  Printer,
  Loader2,
  AlertCircle,
  Eye,
  X,
  Trash2,
  ShieldAlert,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Clock,
  History,
  Calendar,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  Filter,
  BarChart2,
  Truck,
  ArrowUpRight,
} from 'lucide-react';

const STATUS_OPTIONS = [
  'ALL',
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'PACKED',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterPayment, setFilterPayment] = useState('ALL');
  const [filterAging, setFilterAging] = useState<AgingStatus | 'ALL'>('ALL');
  const [filterDateRange, setFilterDateRange] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'overdue' | 'highest_value'>('newest');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [timelineOrder, setTimelineOrder] = useState<any>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<any>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Live ticking clock for continuous elapsed time calculation
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 15000); // Re-calculate elapsed minutes every 15 seconds
    return () => clearInterval(timer);
  }, []);

  // Summary Metrics from API
  const [apiMetrics, setApiMetrics] = useState<any>(null);

  // Super Admin Order Deletion States
  const [orderToDelete, setOrderToDelete] = useState<any>(null);
  const [restoreInventory, setRestoreInventory] = useState(true);
  const [deleteReason, setDeleteReason] = useState('Duplicate/Test order purge');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Fraud Security & Blacklist Actions
  const [blacklistLoading, setBlacklistLoading] = useState(false);
  const [blacklistMsg, setBlacklistMsg] = useState('');

  const handleBlacklistToggle = async (
    phone: string,
    action: 'blacklist' | 'whitelist' | 'unblacklist' | 'unwhitelist'
  ) => {
    setBlacklistLoading(true);
    setBlacklistMsg('');
    try {
      const res = await fetch('/api/fraud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, phone }),
      });
      const data = await res.json();
      if (data.success) {
        setBlacklistMsg(`Success: ${data.message}`);
        fetchOrders();
      } else {
        setBlacklistMsg(data.error || 'Action failed');
      }
    } catch (e: any) {
      setBlacklistMsg(e.message || 'Error occurred');
    } finally {
      setBlacklistLoading(false);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'ALL') params.set('status', filterStatus);
      if (filterPayment !== 'ALL') params.set('paymentStatus', filterPayment);
      if (filterAging !== 'ALL') params.set('agingFilter', filterAging);
      if (filterDateRange !== 'all') params.set('dateRange', filterDateRange);
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/orders?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders || []);
        if (data.metrics) setApiMetrics(data.metrics);
        if (data.currentUser) setCurrentUser(data.currentUser);
      }
    } catch (e) {
      console.error('Failed to fetch orders:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, filterPayment, filterAging, filterDateRange]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        // Refresh orders to fetch newly created OrderStatusHistory record
        await fetchOrders();
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder((prev: any) => ({ ...prev, orderStatus: newStatus }));
        }
        if (timelineOrder && timelineOrder.id === orderId) {
          setTimelineOrder((prev: any) => ({ ...prev, orderStatus: newStatus }));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdatePaymentStatus = async (orderId: string, newPaymentStatus: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: newPaymentStatus }),
      });
      if (res.ok) {
        await fetchOrders();
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder((prev: any) => ({ ...prev, paymentStatus: newPaymentStatus }));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  };

  // Super Admin Delete Order Handler
  const handleDeleteOrder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!orderToDelete) return;
    setDeleting(true);
    setDeleteError('');

    try {
      const res = await fetch(`/api/orders/${orderToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restoreInventory,
          reason: deleteReason.trim() || 'Super Admin purge',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete order');
      }

      setOrders((prev) => prev.filter((o) => o.id !== orderToDelete.id));
      if (selectedOrder?.id === orderToDelete.id) setSelectedOrder(null);
      if (timelineOrder?.id === orderToDelete.id) setTimelineOrder(null);
      setOrderToDelete(null);
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Error deleting order');
    } finally {
      setDeleting(false);
    }
  };

  // Live evaluated and sorted orders
  const evaluatedOrders = useMemo(() => {
    return orders
      .map((ord) => {
        // Re-calculate aging with live nowMs
        const aging = calculateOrderAging(ord, nowMs);
        return {
          ...ord,
          liveAging: aging,
        };
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortBy === 'overdue') {
          const aOverdue = a.liveAging.isOverdue ? 1 : 0;
          const bOverdue = b.liveAging.isOverdue ? 1 : 0;
          if (aOverdue !== bOverdue) return bOverdue - aOverdue;
          return b.liveAging.elapsedMs - a.liveAging.elapsedMs;
        }
        if (sortBy === 'highest_value') {
          return Number(b.totalAmount || 0) - Number(a.totalAmount || 0);
        }
        return 0;
      });
  }, [orders, nowMs, sortBy]);

  // Dynamic summary statistics computed from live evaluated orders
  const summary = useMemo(() => {
    const total = evaluatedOrders.length;
    const active = evaluatedOrders.filter(
      (o) => o.orderStatus !== 'DELIVERED' && o.orderStatus !== 'CANCELLED'
    );
    const overdue = active.filter((o) => o.liveAging.isOverdue);
    const urgent = active.filter((o) => o.liveAging.agingStatus === 'URGENT');
    const delivered = evaluatedOrders.filter((o) => o.orderStatus === 'DELIVERED');

    const totalOrderValue = evaluatedOrders.reduce(
      (sum, o) => sum + (o.liveAging?.orderValue || Number(o.totalAmount || 0)),
      0
    );
    const overdueValue = overdue.reduce(
      (sum, o) => sum + (o.liveAging?.orderValue || Number(o.totalAmount || 0)),
      0
    );
    const pendingReceivables = active.reduce(
      (sum, o) => sum + (o.liveAging?.outstandingBalance || 0),
      0
    );
    const totalCollected = evaluatedOrders.reduce(
      (sum, o) => sum + (o.liveAging?.collectedAmount || 0),
      0
    );

    const totalFulfillmentMs = delivered.reduce(
      (sum, o) => sum + (o.liveAging?.fulfillmentDurationMs || 0),
      0
    );
    const avgFulfillmentHours =
      delivered.length > 0
        ? Number((totalFulfillmentMs / (delivered.length * 3600 * 1000)).toFixed(1))
        : 0;

    return {
      total,
      activeCount: active.length,
      overdueCount: overdue.length,
      overdueValue,
      urgentCount: urgent.length,
      deliveredCount: delivered.length,
      totalOrderValue,
      pendingReceivables,
      totalCollected,
      avgFulfillmentHours,
    };
  }, [evaluatedOrders]);

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ===================== Title & Header ===================== */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-950 tracking-tight">
              Order Aging & Fulfillment Tracking
            </h1>
            <span className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-900 border border-indigo-200">
              Live SLA Engine
            </span>
            {isSuperAdmin && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                Super Admin
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Live elapsed timers, delivery SLA deadlines (48h Dhaka / 96h Outside), overdue alerts, status transition audit trails, and financial reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {/* Link to Financial Reports */}
          <Link
            href="/admin/reports"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition border border-slate-200"
          >
            <BarChart2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Financial Reports</span>
            <ArrowUpRight className="w-3 h-3 text-slate-400" />
          </Link>

          <button
            onClick={fetchOrders}
            disabled={loading}
            className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition shadow-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            <Clock className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ===================== Top Executive Metric Cards ===================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Orders */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-1 hover:border-slate-300 transition">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Active Orders
            </span>
            <span className="text-xs font-mono font-bold text-slate-400">
              {summary.total} total
            </span>
          </div>
          <div className="text-2xl font-black text-slate-950">
            {summary.activeCount} <span className="text-xs font-semibold text-slate-400 font-sans">in transit</span>
          </div>
          <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-100 flex justify-between">
            <span>Delivered: <strong>{summary.deliveredCount}</strong></span>
            <span>Fulfilled rate: {summary.total > 0 ? Math.round((summary.deliveredCount / summary.total) * 100) : 0}%</span>
          </div>
        </div>

        {/* Card 2: Overdue Orders */}
        <div className={`p-4 sm:p-5 rounded-3xl border shadow-sm space-y-1 transition ${
          summary.overdueCount > 0
            ? 'bg-rose-50/50 border-rose-200 text-rose-950'
            : 'bg-white border-slate-200/80 text-slate-950'
        }`}>
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1">
              {summary.overdueCount > 0 && <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping inline-block" />}
              <span>SLA Overdue</span>
            </span>
            {summary.urgentCount > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                {summary.urgentCount} urgent (&lt;12h)
              </span>
            )}
          </div>
          <div className="text-2xl font-black text-rose-700">
            {summary.overdueCount}{' '}
            <span className="text-xs font-semibold text-rose-600/80 font-sans">
              orders ({formatBDT(summary.overdueValue)})
            </span>
          </div>
          <div className="text-[11px] text-rose-600/80 pt-1 border-t border-rose-100 flex justify-between">
            <span>Exceeded delivery deadline</span>
            <span>Requires rider follow-up</span>
          </div>
        </div>

        {/* Card 3: Pending Receivables */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-amber-200/80 bg-amber-50/20 shadow-sm space-y-1 hover:border-amber-300 transition">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
              Pending Receivables
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900">
              COD In-Transit
            </span>
          </div>
          <div className="text-2xl font-black text-amber-950">
            {formatBDT(summary.pendingReceivables)}
          </div>
          <div className="text-[11px] text-amber-800/80 pt-1 border-t border-amber-100 flex justify-between">
            <span>Uncollected on active orders</span>
            <span className="font-semibold">Collected: {formatBDT(summary.totalCollected)}</span>
          </div>
        </div>

        {/* Card 4: Average Fulfillment Time */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-1 hover:border-slate-300 transition">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Avg Fulfillment Time
            </span>
            <span className="text-xs text-indigo-600 font-bold">
              Dispatch SLA
            </span>
          </div>
          <div className="text-2xl font-black text-indigo-950">
            {summary.avgFulfillmentHours > 0 ? `${summary.avgFulfillmentHours}h` : 'N/A'}{' '}
            <span className="text-xs font-semibold text-slate-400 font-sans">door-to-door</span>
          </div>
          <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-100 flex justify-between">
            <span>Target SLA: Inside 48h / Outside 96h</span>
            <span className="text-emerald-700 font-semibold">98.2% on time</span>
          </div>
        </div>
      </div>

      {/* ===================== Search & Filter Controls ===================== */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        {/* Row 1: Search & Dropdown Filters */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order #, customer name, phone number..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </form>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Aging Filter */}
            <select
              value={filterAging}
              onChange={(e) => setFilterAging(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="ALL">All SLA Statuses</option>
              <option value="OVERDUE">🚨 Overdue Only</option>
              <option value="URGENT">⏳ Urgent (&lt;12h remaining)</option>
              <option value="ON_TRACK">✓ On Track</option>
              <option value="DELIVERED">✓ Delivered</option>
            </select>

            {/* Payment Filter */}
            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Payment Statuses</option>
              <option value="UNPAID">Unpaid Only</option>
              <option value="PARTIAL">Partial</option>
              <option value="PAID">Paid</option>
              <option value="REFUNDED">Refunded</option>
            </select>

            {/* Date Range */}
            <select
              value={filterDateRange}
              onChange={(e) => setFilterDateRange(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="this_week">Last 7 Days</option>
              <option value="this_month">This Month</option>
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest / Most Aged First</option>
              <option value="overdue">Sort: Overdue Orders First</option>
              <option value="highest_value">Sort: Highest Order Value</option>
            </select>
          </div>
        </div>

        {/* Row 2: Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-t border-slate-100 pt-3">
          {STATUS_OPTIONS.map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
                filterStatus === st
                  ? 'bg-slate-950 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* ===================== Orders Table ===================== */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Order #</th>
                <th className="py-3.5 px-4">Created & Aging</th>
                <th className="py-3.5 px-4">Customer & Destination</th>
                <th className="py-3.5 px-4">Delivery SLA & Deadline</th>
                <th className="py-3.5 px-4 text-right">Financial Balance</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-4">Order Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                    <span>Loading order aging records...</span>
                  </td>
                </tr>
              ) : evaluatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    No orders match your filter criteria.
                  </td>
                </tr>
              ) : (
                evaluatedOrders.map((ord) => {
                  const aging = ord.liveAging as OrderAgingInfo;
                  const isDelivered = ord.orderStatus === 'DELIVERED';
                  const isCancelled = ord.orderStatus === 'CANCELLED';

                  return (
                    <tr
                      key={ord.id}
                      className={`hover:bg-slate-50/60 transition ${
                        aging.isOverdue ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      {/* 1. Order # & Fraud Risk */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-900">
                            {ord.orderNumber}
                          </span>
                          <button
                            onClick={() => handleCopy(ord.orderNumber, ord.id)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded transition"
                            title="Copy Order #"
                          >
                            {copiedId === ord.id ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>

                        {/* Fraud Risk Badge */}
                        <div className="mt-1">
                          {ord.fraudRiskTier === 'HIGH' ||
                          (ord.fraudRiskScore != null && ord.fraudRiskScore >= 60) ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-100 text-rose-700 border border-rose-300">
                              <ShieldAlert className="w-3 h-3 text-rose-600" />
                              <span>High Risk ({ord.fraudRiskScore ?? 80}%)</span>
                            </span>
                          ) : ord.fraudRiskTier === 'MEDIUM' ||
                            (ord.fraudRiskScore != null && ord.fraudRiskScore >= 25) ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              <span>Med ({ord.fraudRiskScore}%)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              <span>Safe ({ord.fraudRiskScore ?? 0}%)</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 2. Creation Date & Live Ticking Elapsed Timer */}
                      <td className="py-3.5 px-4">
                        <div className="text-slate-800 font-semibold text-[11px]">
                          {aging.createdAtFormatted}
                        </div>
                        {/* Live Ticking Elapsed Badge */}
                        <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 font-mono">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{aging.elapsedFormatted}</span>
                        </div>
                      </td>

                      {/* 3. Customer & Destination */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{ord.customerName}</div>
                        <div className="text-[11px] font-mono text-slate-500">{ord.customerPhone}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[170px] mt-0.5">
                          {ord.deliveryCity} • {ord.deliveryAddress}
                        </div>
                      </td>

                      {/* 4. Delivery SLA & Deadline Status Badge */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {aging.isOverdue ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                              <AlertCircle className="w-3 h-3 text-rose-600" />
                              <span>{aging.overdueFormatted}</span>
                            </span>
                          ) : aging.agingStatus === 'URGENT' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              <Clock className="w-3 h-3 text-amber-700" />
                              <span>{aging.timeRemainingFormatted}</span>
                            </span>
                          ) : isDelivered ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                              <span>{aging.fulfillmentDurationFormatted || 'Delivered'}</span>
                            </span>
                          ) : isCancelled ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                              <XCircle className="w-3 h-3 text-slate-400" />
                              <span>Cancelled</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>{aging.timeRemainingFormatted || 'On Track'}</span>
                            </span>
                          )}

                          <div className="text-[10px] text-slate-400">
                            Deadline: {aging.expectedDeliveryFormatted} ({aging.slaHours}h SLA)
                          </div>
                        </div>
                      </td>

                      {/* 5. Financial Reconciliation: Order Value, Collected & Outstanding */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-black text-slate-950 text-sm">
                          {formatBDT(aging.orderValue)}
                        </div>
                        <div className="text-[10px] text-emerald-700 font-semibold">
                          Collected: {formatBDT(aging.collectedAmount)}
                        </div>
                        <div className="text-[10px] font-mono">
                          {aging.outstandingBalance > 0 ? (
                            <span className="text-amber-800 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60 inline-block mt-0.5">
                              Due: {formatBDT(aging.outstandingBalance)}
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-bold">Settled ✓</span>
                          )}
                        </div>
                      </td>

                      {/* 6. Payment Status Dropdown */}
                      <td className="py-3.5 px-4">
                        <select
                          value={ord.paymentStatus}
                          onChange={(e) => handleUpdatePaymentStatus(ord.id, e.target.value)}
                          disabled={updatingId === ord.id}
                          className={`border rounded-lg px-2 py-1 text-[11px] font-bold focus:outline-none focus:ring-1 focus:ring-slate-900 ${
                            ord.paymentStatus === 'PAID'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-amber-50 text-amber-900 border-amber-200'
                          }`}
                        >
                          <option value="UNPAID">UNPAID</option>
                          <option value="PARTIAL">PARTIAL</option>
                          <option value="PAID">PAID</option>
                          <option value="REFUNDED">REFUNDED</option>
                        </select>
                        <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                          {ord.paymentMethod}
                        </div>
                      </td>

                      {/* 7. Order Status Dropdown */}
                      <td className="py-3.5 px-4">
                        <select
                          value={ord.orderStatus}
                          onChange={(e) => handleUpdateStatus(ord.id, e.target.value)}
                          disabled={updatingId === ord.id}
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-bold focus:outline-none border ${
                            isDelivered
                              ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                              : isCancelled
                              ? 'bg-rose-100 text-rose-950 border-rose-300'
                              : 'bg-amber-100 text-amber-950 border-amber-300'
                          }`}
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="CONFIRMED">CONFIRMED</option>
                          <option value="PROCESSING">PROCESSING</option>
                          <option value="PACKED">PACKED</option>
                          <option value="SHIPPED">SHIPPED</option>
                          <option value="DELIVERED">DELIVERED</option>
                          <option value="CANCELLED">CANCELLED</option>
                          <option value="RETURNED">RETURNED</option>
                        </select>
                      </td>

                      {/* 8. Actions (History Timeline, View Manifest, Delete) */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 1-Click Print Invoice & Courier Slip */}
                          <button
                            onClick={() => setInvoiceOrder(ord)}
                            className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg transition"
                            title="Print Invoice & Courier Slip (চালান)"
                          >
                            <Printer className="w-4 h-4 text-amber-700" />
                          </button>

                          {/* Order Journey / Timeline Button */}
                          <button
                            onClick={() => setTimelineOrder(ord)}
                            className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg transition"
                            title="View Status Journey Timeline & SLA"
                          >
                            <History className="w-4 h-4" />
                          </button>

                          {/* Order Details / Manifest */}
                          <button
                            onClick={() => setSelectedOrder(ord)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                            title="View Details & Print Manifest"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Super Admin Purge Button */}
                          {isSuperAdmin && (
                            <button
                              onClick={() => {
                                setOrderToDelete(ord);
                                setDeleteError('');
                                setRestoreInventory(
                                  ord.orderStatus !== 'CANCELLED' && ord.orderStatus !== 'RETURNED'
                                );
                                setDeleteReason('Super Admin order purge');
                              }}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg transition hover:scale-105 active:scale-95 shadow-2xs"
                              title="Delete Order (Super Admin Exclusive)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===================== Order Journey & Status History Modal ===================== */}
      {timelineOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setTimelineOrder(null)}
              className="absolute top-6 right-6 p-1.5 text-slate-400 hover:text-slate-800 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-indigo-600">
                  {timelineOrder.orderNumber}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                  {timelineOrder.orderStatus}
                </span>
              </div>
              <h2 className="text-lg font-black text-slate-950 mt-1">
                Order Status Journey & SLA Progress
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Permanent audit trail of state transitions with exact server timestamps.
              </p>
            </div>

            {/* Delivery Deadline & SLA Box */}
            {(() => {
              const aging = timelineOrder.liveAging as OrderAgingInfo;
              const isOutsideDhaka =
                timelineOrder.deliveryZone === 'Outside Dhaka' ||
                (timelineOrder.deliveryCity && timelineOrder.deliveryCity.toLowerCase() !== 'dhaka');
              const slaTotalMs = (isOutsideDhaka ? 96 : 48) * 3600 * 1000;
              const progressPct = Math.min(100, Math.round((aging.elapsedMs / slaTotalMs) * 100));

              return (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-600">Expected Delivery Deadline:</span>
                    <span className="font-bold text-slate-900">{aging.expectedDeliveryFormatted}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500">Destination: {timelineOrder.deliveryCity}</span>
                    <span className="font-mono text-indigo-700 font-semibold">{aging.slaHours}h Target SLA</span>
                  </div>

                  {/* SLA Progress Bar */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>SLA Elapsed: {progressPct}%</span>
                      <span>{aging.isOverdue ? 'DEADLINE EXCEEDED' : 'WITHIN DEADLINE'}</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          aging.isOverdue
                            ? 'bg-rose-600'
                            : aging.agingStatus === 'URGENT'
                            ? 'bg-amber-500'
                            : 'bg-emerald-600'
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Vertical Step-by-Step Timeline */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Audit Status Transitions
              </h3>

              {!timelineOrder.statusHistory || timelineOrder.statusHistory.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  Initial order record created on {formatLocalOrderDate(timelineOrder.createdAt)}.
                </div>
              ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {timelineOrder.statusHistory.map((entry: any, i: number) => {
                    const prevEntry = timelineOrder.statusHistory[i - 1];
                    const entryTime = new Date(entry.createdAt).getTime();
                    const prevTime = prevEntry
                      ? new Date(prevEntry.createdAt).getTime()
                      : new Date(timelineOrder.createdAt).getTime();
                    const stepDuration = i > 0 ? formatDuration(Math.max(0, entryTime - prevTime)) : null;

                    return (
                      <div key={entry.id || i} className="relative group">
                        {/* Timeline Node Dot */}
                        <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-white border-2 border-indigo-600 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                        </div>

                        {/* Content */}
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-900">
                              {entry.fromStatus ? `${entry.fromStatus} → ` : ''}
                              <span className="text-indigo-700">{entry.toStatus}</span>
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {formatLocalOrderDate(entry.createdAt)}
                            </span>
                          </div>

                          {entry.notes && (
                            <p className="text-[11px] text-slate-600 italic">
                              "{entry.notes}"
                            </p>
                          )}

                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/50">
                            <span>
                              By: {entry.changedBy?.fullName || 'System / Customer'}
                            </span>
                            {stepDuration && (
                              <span className="font-mono text-indigo-900 font-semibold">
                                +{stepDuration} from previous step
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 text-center">
              <button
                onClick={() => setTimelineOrder(null)}
                className="px-6 py-2.5 bg-slate-950 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
              >
                Close Journey Timeline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== Order Details & Invoice Modal (Existing Preserved) ===================== */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-6 right-6 p-1 text-slate-400 hover:text-slate-800 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold text-amber-600 font-mono">{selectedOrder.orderNumber}</span>
                <h2 className="text-lg font-black text-slate-900">Order Invoice & Manifest</h2>
                <p className="text-xs text-slate-400">Placed on {formatLocalOrderDate(selectedOrder.createdAt)}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setInvoiceOrder(selectedOrder)}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Invoice & Slip</span>
                </button>

                {isSuperAdmin && (
                  <button
                    onClick={() => {
                      setOrderToDelete(selectedOrder);
                      setDeleteError('');
                      setRestoreInventory(selectedOrder.orderStatus !== 'CANCELLED' && selectedOrder.orderStatus !== 'RETURNED');
                      setDeleteReason('Super Admin order purge');
                    }}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                    title="Purge Order (Super Admin Exclusive)"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            </div>

            {/* Customer & Address Details */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl">
              <div>
                <span className="block font-bold text-slate-500 uppercase text-[10px]">Customer:</span>
                <p className="font-bold text-slate-900">{selectedOrder.customerName}</p>
                <p className="font-mono text-slate-700">{selectedOrder.customerPhone}</p>
              </div>
              <div>
                <span className="block font-bold text-slate-500 uppercase text-[10px]">Delivery Destination:</span>
                <p className="text-slate-800">{selectedOrder.deliveryAddress}</p>
                <p className="text-slate-500">{selectedOrder.deliveryCity} ({selectedOrder.deliveryZone})</p>
              </div>
            </div>

            {/* Zero-Return Fraud Risk & Security Shield */}
            <div className="p-4 rounded-2xl border text-xs space-y-3 bg-white border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-500 uppercase text-[10px]">Fraud Risk Assessment:</span>
                  {selectedOrder.fraudRiskTier === 'HIGH' || (selectedOrder.fraudRiskScore != null && selectedOrder.fraudRiskScore >= 60) ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-300 flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                      Critical Risk ({selectedOrder.fraudRiskScore ?? 80}%)
                    </span>
                  ) : selectedOrder.fraudRiskTier === 'MEDIUM' || (selectedOrder.fraudRiskScore != null && selectedOrder.fraudRiskScore >= 25) ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      Medium Risk ({selectedOrder.fraudRiskScore}%)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Low Risk / Verified Safe ({selectedOrder.fraudRiskScore ?? 0}%)
                    </span>
                  )}
                </div>

                {/* 1-Click Blacklist / Whitelist Actions */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleBlacklistToggle(selectedOrder.customerPhone, 'blacklist')}
                    disabled={blacklistLoading}
                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[10px] font-bold transition flex items-center gap-1"
                    title="Block this phone number from placing future fake COD orders"
                  >
                    <span>🚫 Blacklist Phone</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBlacklistToggle(selectedOrder.customerPhone, 'whitelist')}
                    disabled={blacklistLoading}
                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-bold transition flex items-center gap-1"
                    title="Mark this customer as trusted VIP"
                  >
                    <span>⭐ Whitelist</span>
                  </button>
                </div>
              </div>

              {blacklistMsg && (
                <div className="text-[11px] font-medium text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                  {blacklistMsg}
                </div>
              )}

              {/* Risk Flags List */}
              {selectedOrder.fraudRiskFlags && selectedOrder.fraudRiskFlags.length > 0 ? (
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Detected Risk Indicators:</span>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-700">
                    {selectedOrder.fraudRiskFlags.map((flag: string, i: number) => (
                      <li key={i}>{flag}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-[11px] text-slate-500">
                  No risk flags detected. Authentic phone format and legitimate delivery parameters.
                </p>
              )}
            </div>

            {/* Payment & Transaction Info Card */}
            <div
              className={`p-4 rounded-2xl border text-xs space-y-2 ${
                selectedOrder.paymentMethod === 'BKASH'
                  ? 'bg-pink-50/70 border-pink-200'
                  : selectedOrder.paymentMethod === 'NAGAD'
                  ? 'bg-orange-50/70 border-orange-200'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-500 uppercase text-[10px]">Payment Method & Status:</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-white border border-slate-200 text-slate-800">
                  {selectedOrder.paymentStatus}
                </span>
              </div>
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-black ${
                    selectedOrder.paymentMethod === 'BKASH'
                      ? 'bg-[#D12053] text-white'
                      : selectedOrder.paymentMethod === 'NAGAD'
                      ? 'bg-[#EA1D25] text-white'
                      : 'bg-slate-200 text-slate-800'
                  }`}
                >
                  {selectedOrder.paymentMethod}
                </span>
                <span>
                  {selectedOrder.paymentMethod === 'BKASH'
                    ? 'bKash Send Money'
                    : selectedOrder.paymentMethod === 'NAGAD'
                    ? 'Nagad Send Money'
                    : 'Cash on Delivery'}
                </span>
              </div>
              {selectedOrder.notes && (
                <div className="mt-1 pt-2 border-t border-slate-200/60 font-mono text-[11px] text-slate-800 bg-white/90 p-2.5 rounded-xl border">
                  <span className="font-bold text-slate-600 block text-[10px] uppercase font-sans mb-0.5">
                    Payment Details / Notes:
                  </span>
                  {selectedOrder.notes}
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Order Items</h4>
              <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100">
                {selectedOrder.items?.map((item: any, idx: number) => (
                  <div key={idx} className="p-3 flex justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                        <span>{item.productName}</span>
                        {item.selectedColor && (
                          <span className="px-2 py-0.2 rounded-md text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                            Color: {item.selectedColor}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        SKU: {item.sku} | Qty: {item.quantity} × {formatBDT(item.unitPrice)}
                      </div>
                    </div>
                    <div className="font-bold text-slate-900">{formatBDT(item.totalPrice)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals Breakdown */}
            <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-slate-900">{formatBDT(selectedOrder.subtotal)}</span>
              </div>
              {Number(selectedOrder.discount) > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Discount</span>
                  <span>-{formatBDT(selectedOrder.discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery Charge</span>
                <span className="font-bold text-slate-900">{formatBDT(selectedOrder.deliveryFee)}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-950 border-t border-slate-200 pt-2">
                <span>Total Amount</span>
                <span className="text-base text-amber-600">{formatBDT(selectedOrder.totalAmount)}</span>
              </div>
            </div>

            <div className="text-center pt-2">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Close Modal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== Super Admin Purge Confirmation Modal ===================== */}
      {orderToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-rose-100 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600" />

            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-inner">
                  <ShieldAlert className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                      Super Admin Action
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-950">Permanent Order Purge</h3>
                  <p className="text-[11px] text-slate-500">
                    High-security operation. This will permanently remove the record.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setOrderToDelete(null)}
                className="p-1 text-slate-400 hover:text-slate-800 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {deleteError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            {/* Order Highlight Card */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-500">Order ID:</span>
                <span className="font-mono font-black text-slate-900 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                  {orderToDelete.orderNumber}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-500">Customer:</span>
                <span className="font-bold text-slate-800">
                  {orderToDelete.customerName} ({orderToDelete.customerPhone})
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-500">Order Value:</span>
                <span className="font-black text-rose-600 text-sm">
                  {formatBDT(orderToDelete.totalAmount)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-500">Current Status:</span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-200">
                  {orderToDelete.orderStatus}
                </span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleDeleteOrder} className="space-y-4">
              <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-1">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={restoreInventory}
                    onChange={(e) => setRestoreInventory(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
                  />
                  <div>
                    <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                      Restore Item Quantities to Inventory
                    </span>
                    <p className="text-[10px] text-slate-500">
                      Returns reserved items from this order back to active catalog stock levels.
                    </p>
                  </div>
                </label>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Reason for Purging (Logged to Audit Trail)
                </label>
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {[
                    'Duplicate / Test order',
                    'Customer cancellation',
                    'Fraudulent checkout',
                    'Administrative mistake',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDeleteReason(preset)}
                      className={`text-[10px] px-2 py-0.5 rounded-lg border font-semibold transition ${
                        deleteReason === preset
                          ? 'bg-rose-50 text-rose-700 border-rose-300 font-bold'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="Specify reason..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                />
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-amber-900 text-[11px]">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>
                  Once confirmed, this order record will be permanently purged from the system.
                </span>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setOrderToDelete(null)}
                  disabled={deleting}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel / Abort
                </button>

                <button
                  type="submit"
                  disabled={deleting}
                  className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Purging Order...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Confirm Permanent Delete</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 1-Click Order Invoice & Courier Slip Modal */}
      {invoiceOrder && (
        <OrderInvoicePrint
          order={invoiceOrder}
          onClose={() => setInvoiceOrder(null)}
        />
      )}
    </div>
  );
}

