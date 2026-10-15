'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { formatBDT } from '@/lib/currency';
import type {
  ComprehensiveFinancialReport,
  FinancialTimeRange,
  TimeSeriesTrendPoint,
} from '@/lib/financial-analytics';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  Printer,
  RefreshCw,
  Calendar,
  DollarSign,
  PackageCheck,
  CreditCard,
  Truck,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  BarChart3,
  Layers,
  FileText,
  SlidersHorizontal,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  X,
  PieChart as PieChartIcon,
  Clock,
  AlertTriangle
} from 'lucide-react';

export default function AdminReportsPage() {
  const [report, setReport] = useState<ComprehensiveFinancialReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [range, setRange] = useState<FinancialTimeRange>('this_month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showCustomModal, setShowCustomModal] = useState(false);

  // Tabs: 'overview' | 'products' | 'orders' | 'statement'
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'statement'>('overview');

  // Product tab search & sort
  const [productSearch, setProductSearch] = useState('');
  const [productSortBy, setProductSortBy] = useState<'profit' | 'revenue' | 'units' | 'margin'>('profit');

  // Order ledger search & filter
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('ALL');
  const [agingFilter, setAgingFilter] = useState('ALL');

  // Export dropdown
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Chart view mode & interaction
  const [chartViewMode, setChartViewMode] = useState<'sales' | 'profit' | 'all'>('sales');
  const [hoveredPoint, setHoveredPoint] = useState<TimeSeriesTrendPoint | null>(null);

  const fetchReport = async (rangeParam = range, start = startDate, end = endDate) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('range', rangeParam);
      if (rangeParam === 'custom' && start && end) {
        params.set('startDate', start);
        params.set('endDate', end);
      }
      const res = await fetch(`/api/reports/dashboard?${params.toString()}`);
      const data = await res.json();
      if (data.success && data.report) {
        setReport(data.report);
      } else {
        setError(data.error || 'Failed to load financial report');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Network error loading report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(range, startDate, endDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  const handleRangeChange = (newRange: FinancialTimeRange) => {
    if (newRange === 'custom') {
      setShowCustomModal(true);
    } else {
      setRange(newRange);
    }
  };

  const applyCustomRange = () => {
    if (!startDate || !endDate) return;
    setShowCustomModal(false);
    setRange('custom');
    fetchReport('custom', startDate, endDate);
  };

  const handleExport = (type: 'summary' | 'products' | 'orders') => {
    setShowExportMenu(false);
    const params = new URLSearchParams();
    params.set('type', type);
    params.set('range', range);
    if (range === 'custom' && startDate && endDate) {
      params.set('startDate', startDate);
      params.set('endDate', endDate);
    }
    window.location.href = `/api/reports/export?${params.toString()}`;
  };

  const handlePrint = () => {
    window.print();
  };

  // Filtered & sorted products
  const filteredProducts = useMemo(() => {
    if (!report?.productProfitability) return [];
    return report.productProfitability
      .filter((p) => {
        const query = productSearch.toLowerCase().trim();
        if (!query) return true;
        return (
          p.productName.toLowerCase().includes(query) ||
          p.sku.toLowerCase().includes(query) ||
          p.categoryName.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        if (productSortBy === 'profit') return b.grossProfit - a.grossProfit;
        if (productSortBy === 'revenue') return b.totalRevenue - a.totalRevenue;
        if (productSortBy === 'units') return b.unitsSold - a.unitsSold;
        if (productSortBy === 'margin') return b.marginPercent - a.marginPercent;
        return 0;
      });
  }, [report, productSearch, productSortBy]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    if (!report?.orderLedger) return [];
    return report.orderLedger.filter((order) => {
      const query = orderSearch.toLowerCase().trim();
      const matchQuery =
        !query ||
        order.orderNumber.toLowerCase().includes(query) ||
        order.customerName.toLowerCase().includes(query) ||
        order.customerPhone.toLowerCase().includes(query);

      const matchOrderStatus =
        orderStatusFilter === 'ALL' || order.orderStatus === orderStatusFilter;

      const matchPaymentStatus =
        paymentStatusFilter === 'ALL' || order.paymentStatus === paymentStatusFilter;

      const matchAging =
        agingFilter === 'ALL' || order.agingStatus === agingFilter;

      return matchQuery && matchOrderStatus && matchPaymentStatus && matchAging;
    });
  }, [report, orderSearch, orderStatusFilter, paymentStatusFilter, agingFilter]);

  // Render trend badge
  const renderTrendBadge = (changePercent: number, trend: 'UP' | 'DOWN' | 'NEUTRAL', invert = false) => {
    // Invert = true for costs/expenses where UP is red and DOWN is green
    const isPositive = invert ? changePercent <= 0 : changePercent >= 0;
    const isZero = changePercent === 0;

    if (isZero) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
          <Minus className="w-3 h-3" />
          <span>0.0%</span>
        </span>
      );
    }

    return (
      <span
        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
          isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
        }`}
      >
        {trend === 'UP' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        <span>
          {changePercent > 0 ? `+${changePercent}%` : `${changePercent}%`}
        </span>
      </span>
    );
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 print:p-0 print:m-0 print:max-w-none">
      {/* ===================== Header & Controls ===================== */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-950 tracking-tight">
              Executive Financial Reporting
            </h1>
            <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 tracking-wider">
              GAAP Accrual
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Accurate P&L ledger tracking recognized delivered revenue, historical COGS, cash collections, and true net operating margin.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Refresh */}
          <button
            onClick={() => fetchReport(range, startDate, endDate)}
            disabled={loading}
            className="p-2.5 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition disabled:opacity-50"
            title="Refresh Report"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 py-2 text-xs">
                <button
                  onClick={() => handleExport('summary')}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-slate-700 flex items-center justify-between"
                >
                  <span className="font-semibold">Financial Statement (P&L)</span>
                  <span className="text-[10px] text-slate-400">CSV/Excel</span>
                </button>
                <button
                  onClick={() => handleExport('products')}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-slate-700 flex items-center justify-between"
                >
                  <span className="font-semibold">Product Profitability</span>
                  <span className="text-[10px] text-slate-400">CSV/Excel</span>
                </button>
                <button
                  onClick={() => handleExport('orders')}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-slate-700 flex items-center justify-between"
                >
                  <span className="font-semibold">Order Financial Ledger</span>
                  <span className="text-[10px] text-slate-400">CSV/Excel</span>
                </button>
              </div>
            )}
          </div>

          {/* Print PDF */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print PDF</span>
          </button>
        </div>
      </div>

      {/* ===================== Time Period Filter Pills ===================== */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-100/80 p-2 rounded-2xl print:hidden">
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => handleRangeChange('today')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              range === 'today'
                ? 'bg-white text-slate-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => handleRangeChange('this_week')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              range === 'this_week'
                ? 'bg-white text-slate-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => handleRangeChange('this_month')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              range === 'this_month'
                ? 'bg-white text-slate-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => handleRangeChange('this_year')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              range === 'this_year'
                ? 'bg-white text-slate-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            This Year
          </button>
          <button
            onClick={() => handleRangeChange('custom')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              range === 'custom'
                ? 'bg-white text-slate-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Custom Range</span>
          </button>
        </div>

        {/* Date Window Information */}
        {report && (
          <div className="text-[11px] text-slate-500 font-medium px-2 flex items-center gap-1">
            <span className="font-bold text-slate-800">{report.filter.startDate}</span> to{' '}
            <span className="font-bold text-slate-800">{report.filter.endDate}</span>
            <span className="text-slate-400">
              (vs {report.filter.previousStartDate} to {report.filter.previousEndDate})
            </span>
          </div>
        )}
      </div>

      {/* ===================== Print Only Brand Header ===================== */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-950">
              TOTO ELITE MART — EXECUTIVE FINANCIAL STATEMENT
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Official Accounting & P&L Analysis Report (Strict Accrual Basis)
            </p>
          </div>
          <div className="text-right text-xs text-slate-600">
            <div>Generated: {new Date().toLocaleDateString('en-US', { dateStyle: 'full' })}</div>
            {report && (
              <div>
                Period: {report.filter.startDate} to {report.filter.endDate}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => fetchReport()}
            className="ml-auto underline font-bold hover:text-rose-950"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading state skeleton */}
      {loading && !report && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-3xl border border-slate-200/80 animate-pulse h-32 space-y-3"
              >
                <div className="h-4 bg-slate-100 rounded w-1/2" />
                <div className="h-7 bg-slate-100 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/3" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================== Main Report Content ===================== */}
      {report && (
        <>
          {/* ===================== 8 Primary KPI Cards ===================== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Booked Sales (GMV) */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-2 hover:border-slate-300 transition">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Booked Sales (GMV)
                </span>
                {renderTrendBadge(
                  report.summary.bookedSales.changePercent,
                  report.summary.bookedSales.trend
                )}
              </div>
              <div className="text-2xl font-black text-slate-950">
                {formatBDT(report.summary.bookedSales.current)}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                <span>Prev Period: {formatBDT(report.summary.bookedSales.previous)}</span>
                <span>{report.orderCounts.totalPlaced} orders placed</span>
              </div>
            </div>

            {/* 2. Recognized Delivered Revenue */}
            <div className="bg-white p-5 rounded-3xl border border-emerald-200/80 bg-emerald-50/20 shadow-sm space-y-2 hover:border-emerald-300 transition">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                  Delivered Revenue
                </span>
                {renderTrendBadge(
                  report.summary.deliveredRevenue.changePercent,
                  report.summary.deliveredRevenue.trend
                )}
              </div>
              <div className="text-2xl font-black text-emerald-950">
                {formatBDT(report.summary.deliveredRevenue.current)}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-emerald-100">
                <span>Prev: {formatBDT(report.summary.deliveredRevenue.previous)}</span>
                <span className="font-bold text-emerald-700">
                  {report.orderCounts.delivered} delivered ({report.orderCounts.fulfillmentRate}%)
                </span>
              </div>
            </div>

            {/* 3. Actual Cash Collections */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-2 hover:border-slate-300 transition">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Cash Collections
                </span>
                {renderTrendBadge(
                  report.summary.cashCollected.changePercent,
                  report.summary.cashCollected.trend
                )}
              </div>
              <div className="text-2xl font-black text-slate-950">
                {formatBDT(report.summary.cashCollected.current)}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                <span>Prev: {formatBDT(report.summary.cashCollected.previous)}</span>
                <span className="text-emerald-600 font-semibold">Settled & In Bank</span>
              </div>
            </div>

            {/* 4. Outstanding Receivables */}
            <div className="bg-white p-5 rounded-3xl border border-amber-200/80 bg-amber-50/20 shadow-sm space-y-2 hover:border-amber-300 transition">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                  Outstanding Receivables
                </span>
                {renderTrendBadge(
                  report.summary.outstandingReceivables.changePercent,
                  report.summary.outstandingReceivables.trend,
                  true
                )}
              </div>
              <div className="text-2xl font-black text-amber-950">
                {formatBDT(report.summary.outstandingReceivables.current)}
              </div>
              <div className="flex items-center justify-between text-[11px] text-amber-700/80 pt-1 border-t border-amber-100">
                <span>In-Transit COD & Unpaid</span>
                <span>{report.orderCounts.inTransitOrProcessing + report.orderCounts.pending} active</span>
              </div>
            </div>

            {/* 5. Product Costs (COGS) */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-2 hover:border-slate-300 transition">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Product Costs (COGS)
                </span>
                {renderTrendBadge(
                  report.summary.cogs.changePercent,
                  report.summary.cogs.trend,
                  true
                )}
              </div>
              <div className="text-2xl font-black text-slate-950">
                {formatBDT(report.summary.cogs.current)}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                <span>Prev: {formatBDT(report.summary.cogs.previous)}</span>
                <span>Delivered inventory cost</span>
              </div>
            </div>

            {/* 6. Operating Expenses (OPEX) */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-2 hover:border-slate-300 transition">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Operating Expenses
                </span>
                {renderTrendBadge(
                  report.summary.operatingExpenses.changePercent,
                  report.summary.operatingExpenses.trend,
                  true
                )}
              </div>
              <div className="text-2xl font-black text-slate-950">
                {formatBDT(report.summary.operatingExpenses.current)}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                <span>Prev: {formatBDT(report.summary.operatingExpenses.previous)}</span>
                <span>{report.expensesByCategory.length} categories</span>
              </div>
            </div>

            {/* 7. Gross Profit */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-2 hover:border-slate-300 transition">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Gross Profit
                </span>
                {renderTrendBadge(
                  report.summary.grossProfit.changePercent,
                  report.summary.grossProfit.trend
                )}
              </div>
              <div className="text-2xl font-black text-slate-950">
                {formatBDT(report.summary.grossProfit.current)}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                <span>Margin: <strong className="text-slate-800">{report.summary.grossMarginPercent}%</strong></span>
                <span>Delivered Rev − COGS</span>
              </div>
            </div>

            {/* 8. Net Profit */}
            <div className={`p-5 rounded-3xl border shadow-sm space-y-2 transition ${
              report.summary.netProfit.current >= 0
                ? 'bg-emerald-600 text-white border-emerald-700'
                : 'bg-rose-600 text-white border-rose-700'
            }`}>
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-bold uppercase tracking-wider opacity-90">
                  Net Operating Profit
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white">
                  {report.summary.netProfit.trend === 'UP' ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>
                    {report.summary.netProfit.changePercent > 0
                      ? `+${report.summary.netProfit.changePercent}%`
                      : `${report.summary.netProfit.changePercent}%`}
                  </span>
                </span>
              </div>
              <div className="text-2xl font-black">
                {formatBDT(report.summary.netProfit.current)}
              </div>
              <div className="flex items-center justify-between text-[11px] opacity-80 pt-1 border-t border-white/20">
                <span>Net Margin: <strong>{report.summary.netMarginPercent}%</strong></span>
                <span>After All Costs & OPEX</span>
              </div>
            </div>
          </div>

          {/* ===================== Interactive SVG Time-Series Chart ===================== */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-950 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  <span>Financial Trajectory & Sales Volume</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Visualizing daily transaction velocity, booked sales (GMV), delivered revenue, and cost trends.
                </p>
              </div>

              {/* View Mode Switcher Pills */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setChartViewMode('sales')}
                  className={`px-3 py-1.5 rounded-xl transition ${
                    chartViewMode === 'sales'
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  Sales & Orders (GMV)
                </button>
                <button
                  type="button"
                  onClick={() => setChartViewMode('profit')}
                  className={`px-3 py-1.5 rounded-xl transition ${
                    chartViewMode === 'profit'
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  P&L & Profitability
                </button>
                <button
                  type="button"
                  onClick={() => setChartViewMode('all')}
                  className={`px-3 py-1.5 rounded-xl transition ${
                    chartViewMode === 'all'
                      ? 'bg-white text-slate-950 shadow-sm'
                      : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  All 5 Streams
                </button>
              </div>
            </div>

            {/* Quick Stat Highlights */}
            {(() => {
              const points = report.timeSeriesTrends;
              const peakSales = points.reduce(
                (max, p) => (p.bookedSales > max.bookedSales ? p : max),
                points[0] || { bookedSales: 0, label: '-' }
              );
              const activeDays = points.filter((p) => p.bookedSales > 0 || p.deliveredRevenue > 0).length;

              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Total Booked GMV
                    </span>
                    <span className="font-black text-indigo-950 text-sm">
                      {formatBDT(report.summary.bookedSales.current)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Peak Sales Day
                    </span>
                    <span className="font-bold text-slate-800 text-xs">
                      {peakSales.label} ({formatBDT(peakSales.bookedSales)})
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Delivered Revenue
                    </span>
                    <span className="font-bold text-emerald-700 text-sm">
                      {formatBDT(report.summary.deliveredRevenue.current)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Active Trading Days
                    </span>
                    <span className="font-bold text-slate-700 text-xs">
                      {activeDays} of {points.length} days active
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Hover Inspector Banner */}
            <div className="h-10 flex items-center px-4 rounded-xl bg-slate-900 text-white text-xs font-medium justify-between shadow-sm">
              {hoveredPoint ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-400">{hoveredPoint.label}</span>
                    <span className="text-slate-400">({hoveredPoint.date})</span>
                  </div>
                  <div className="flex items-center gap-4 text-[11px]">
                    <span>
                      Booked Sales: <strong className="text-indigo-300">{formatBDT(hoveredPoint.bookedSales)}</strong>
                    </span>
                    <span>
                      Delivered: <strong className="text-emerald-300">{formatBDT(hoveredPoint.deliveredRevenue)}</strong>
                    </span>
                    <span>
                      COGS: <strong className="text-rose-300">-{formatBDT(hoveredPoint.cogs)}</strong>
                    </span>
                    <span>
                      Net Profit: <strong className={hoveredPoint.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {formatBDT(hoveredPoint.netProfit)}
                      </strong>
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Hover over any day bar or data column below to inspect detailed figures.</span>
                </div>
              )}
            </div>

            {/* Responsive Native SVG Bar/Trend Chart */}
            <div className="w-full overflow-x-auto pb-2">
              {report.timeSeriesTrends.length === 0 ? (
                <div className="py-16 text-center text-xs text-slate-400">
                  No transaction data available for this time window.
                </div>
              ) : (
                <div className="min-w-[700px]">
                  {(() => {
                    const points = report.timeSeriesTrends;

                    // Calculate maxVal according to current view mode
                    const maxVal = Math.max(
                      1000,
                      ...points.map((p) => {
                        if (chartViewMode === 'sales') {
                          return Math.max(p.bookedSales, p.deliveredRevenue);
                        }
                        if (chartViewMode === 'profit') {
                          return Math.max(p.deliveredRevenue, p.cogs, p.expenses, Math.abs(p.netProfit));
                        }
                        return Math.max(p.bookedSales, p.deliveredRevenue, p.cogs, p.expenses, Math.abs(p.netProfit));
                      })
                    );

                    const svgHeight = 280;
                    const chartTop = 25;
                    const chartBottom = 230;
                    const chartHeight = chartBottom - chartTop;
                    const pointSpacing = 72;
                    const leftMargin = 75;
                    const svgWidth = points.length * pointSpacing + leftMargin + 40;

                    // Helper to get bar height without ghost bumps on 0
                    const getBarH = (val: number) => {
                      if (!val || val <= 0) return 0;
                      return Math.max(3, (val / maxVal) * chartHeight);
                    };

                    // Trendline polyline points for sales
                    const trendPolylinePoints = points
                      .map((p, idx) => {
                        const x = leftMargin + idx * pointSpacing + 25;
                        const y = chartBottom - getBarH(p.bookedSales);
                        return `${x},${y}`;
                      })
                      .join(' ');

                    return (
                      <div className="relative">
                        <svg
                          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                          className="w-full h-72 overflow-visible select-none"
                        >
                          <defs>
                            <linearGradient id="salesBarGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#6366f1" />
                              <stop offset="100%" stopColor="#4338ca" />
                            </linearGradient>
                            <linearGradient id="deliveredBarGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#10b981" />
                              <stop offset="100%" stopColor="#059669" />
                            </linearGradient>
                          </defs>

                          {/* Y-Axis Grid Lines & Tick Labels */}
                          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                            const y = chartBottom - ratio * chartHeight;
                            const labelVal = Math.round(maxVal * ratio);
                            return (
                              <g key={ratio}>
                                <line
                                  x1={leftMargin - 15}
                                  y1={y}
                                  x2={svgWidth - 20}
                                  y2={y}
                                  stroke="#f1f5f9"
                                  strokeDasharray="4 4"
                                />
                                <text
                                  x={leftMargin - 20}
                                  y={y + 4}
                                  textAnchor="end"
                                  className="text-[10px] fill-slate-400 font-mono font-medium"
                                >
                                  {formatBDT(labelVal, false)}
                                </text>
                              </g>
                            );
                          })}

                          {/* Sales Trendline (rendered behind bars in sales mode) */}
                          {chartViewMode === 'sales' && (
                            <polyline
                              fill="none"
                              stroke="#c7d2fe"
                              strokeWidth="2"
                              strokeDasharray="4 4"
                              points={trendPolylinePoints}
                            />
                          )}

                          {/* Data points for each date bucket */}
                          {points.map((p, idx) => {
                            const groupX = leftMargin + idx * pointSpacing;
                            const isHovered = hoveredPoint?.date === p.date;

                            if (chartViewMode === 'sales') {
                              // Sales Mode: Prominent Booked Sales (GMV) + Delivered Revenue
                              const bookedH = getBarH(p.bookedSales);
                              const deliveredH = getBarH(p.deliveredRevenue);

                              return (
                                <g
                                  key={p.date}
                                  className="cursor-pointer"
                                  onMouseEnter={() => setHoveredPoint(p)}
                                  onMouseLeave={() => setHoveredPoint(null)}
                                >
                                  {/* Hover background column */}
                                  <rect
                                    x={groupX - 6}
                                    y={chartTop - 10}
                                    width={pointSpacing - 8}
                                    height={chartHeight + 20}
                                    fill={isHovered ? '#eef2ff' : '#f8fafc'}
                                    rx="10"
                                    className="transition-colors"
                                  />

                                  {/* Bar 1: Total Booked Sales (GMV) */}
                                  {bookedH > 0 && (
                                    <rect
                                      x={groupX}
                                      y={chartBottom - bookedH}
                                      width={20}
                                      height={bookedH}
                                      fill="url(#salesBarGrad)"
                                      rx="5"
                                      className="transition-all hover:opacity-90"
                                    />
                                  )}

                                  {/* Bar 2: Delivered Revenue */}
                                  {deliveredH > 0 && (
                                    <rect
                                      x={groupX + 22}
                                      y={chartBottom - deliveredH}
                                      width={16}
                                      height={deliveredH}
                                      fill="url(#deliveredBarGrad)"
                                      rx="4"
                                      className="transition-all hover:opacity-90"
                                    />
                                  )}

                                  {/* Top label for high volume days */}
                                  {p.bookedSales > 0 && (
                                    <text
                                      x={groupX + 10}
                                      y={Math.max(chartTop + 10, chartBottom - bookedH - 6)}
                                      textAnchor="middle"
                                      className="text-[9px] fill-indigo-900 font-bold font-mono"
                                    >
                                      {Math.round(p.bookedSales / 1000)}k
                                    </text>
                                  )}

                                  {/* X-Axis Date Label */}
                                  <text
                                    x={groupX + 18}
                                    y={chartBottom + 20}
                                    textAnchor="middle"
                                    className={`text-[10px] font-semibold ${
                                      isHovered
                                        ? 'fill-indigo-950 font-bold'
                                        : p.bookedSales > 0
                                        ? 'fill-slate-800'
                                        : 'fill-slate-400'
                                    }`}
                                  >
                                    {p.label}
                                  </text>
                                </g>
                              );
                            }

                            if (chartViewMode === 'profit') {
                              // Profitability Mode: Delivered Revenue, COGS, Net Profit
                              const deliveredH = getBarH(p.deliveredRevenue);
                              const cogsH = getBarH(p.cogs);
                              const netH = getBarH(Math.abs(p.netProfit));

                              return (
                                <g
                                  key={p.date}
                                  className="cursor-pointer"
                                  onMouseEnter={() => setHoveredPoint(p)}
                                  onMouseLeave={() => setHoveredPoint(null)}
                                >
                                  {/* Hover background */}
                                  <rect
                                    x={groupX - 4}
                                    y={chartTop - 10}
                                    width={pointSpacing - 8}
                                    height={chartHeight + 20}
                                    fill={isHovered ? '#ecfdf5' : '#f8fafc'}
                                    rx="10"
                                    className="transition-colors"
                                  />

                                  {/* Delivered Revenue */}
                                  {deliveredH > 0 && (
                                    <rect
                                      x={groupX}
                                      y={chartBottom - deliveredH}
                                      width={14}
                                      height={deliveredH}
                                      fill="#10b981"
                                      rx="4"
                                    />
                                  )}

                                  {/* COGS */}
                                  {cogsH > 0 && (
                                    <rect
                                      x={groupX + 16}
                                      y={chartBottom - cogsH}
                                      width={14}
                                      height={cogsH}
                                      fill="#fb7185"
                                      rx="4"
                                    />
                                  )}

                                  {/* Net Profit */}
                                  {netH > 0 && (
                                    <rect
                                      x={groupX + 32}
                                      y={chartBottom - netH}
                                      width={14}
                                      height={netH}
                                      fill={p.netProfit >= 0 ? '#0284c7' : '#ef4444'}
                                      rx="4"
                                    />
                                  )}

                                  <text
                                    x={groupX + 23}
                                    y={chartBottom + 20}
                                    textAnchor="middle"
                                    className={`text-[10px] font-semibold ${
                                      isHovered ? 'fill-slate-950 font-bold' : 'fill-slate-400'
                                    }`}
                                  >
                                    {p.label}
                                  </text>
                                </g>
                              );
                            }

                            // 'all' Mode: 5 grouped bars
                            const barW = 8;
                            const bookedH = getBarH(p.bookedSales);
                            const deliveredH = getBarH(p.deliveredRevenue);
                            const cogsH = getBarH(p.cogs);
                            const expH = getBarH(p.expenses);
                            const netH = getBarH(Math.abs(p.netProfit));

                            return (
                              <g
                                key={p.date}
                                className="cursor-pointer"
                                onMouseEnter={() => setHoveredPoint(p)}
                                onMouseLeave={() => setHoveredPoint(null)}
                              >
                                <rect
                                  x={groupX - 4}
                                  y={chartTop - 10}
                                  width={pointSpacing - 8}
                                  height={chartHeight + 20}
                                  fill={isHovered ? '#f1f5f9' : '#f8fafc'}
                                  rx="8"
                                  className="transition-colors"
                                />

                                {bookedH > 0 && (
                                  <rect
                                    x={groupX}
                                    y={chartBottom - bookedH}
                                    width={barW}
                                    height={bookedH}
                                    fill="#6366f1"
                                    rx="2"
                                  />
                                )}
                                {deliveredH > 0 && (
                                  <rect
                                    x={groupX + 9}
                                    y={chartBottom - deliveredH}
                                    width={barW}
                                    height={deliveredH}
                                    fill="#10b981"
                                    rx="2"
                                  />
                                )}
                                {cogsH > 0 && (
                                  <rect
                                    x={groupX + 18}
                                    y={chartBottom - cogsH}
                                    width={barW}
                                    height={cogsH}
                                    fill="#fb7185"
                                    rx="2"
                                  />
                                )}
                                {expH > 0 && (
                                  <rect
                                    x={groupX + 27}
                                    y={chartBottom - expH}
                                    width={barW}
                                    height={expH}
                                    fill="#fbbf24"
                                    rx="2"
                                  />
                                )}
                                {netH > 0 && (
                                  <rect
                                    x={groupX + 36}
                                    y={chartBottom - netH}
                                    width={barW}
                                    height={netH}
                                    fill={p.netProfit >= 0 ? '#0284c7' : '#ef4444'}
                                    rx="2"
                                  />
                                )}

                                <text
                                  x={groupX + 22}
                                  y={chartBottom + 20}
                                  textAnchor="middle"
                                  className={`text-[10px] font-semibold ${
                                    isHovered ? 'fill-slate-950 font-bold' : 'fill-slate-400'
                                  }`}
                                >
                                  {p.label}
                                </text>
                              </g>
                            );
                          })}
                        </svg>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Interactive Legend for Active View Mode */}
            <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-100 text-xs">
              <div className="flex flex-wrap items-center gap-5 font-semibold">
                {chartViewMode === 'sales' && (
                  <>
                    <span className="inline-flex items-center gap-1.5 text-indigo-700">
                      <span className="w-3.5 h-3.5 rounded bg-indigo-600 inline-block" />
                      <span>Total Booked Sales (GMV)</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-emerald-700">
                      <span className="w-3.5 h-3.5 rounded bg-emerald-500 inline-block" />
                      <span>Delivered Revenue</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-slate-500">
                      <span className="w-4 h-0.5 bg-indigo-300 inline-block border-t border-dashed border-indigo-400" />
                      <span>Sales Trajectory</span>
                    </span>
                  </>
                )}

                {chartViewMode === 'profit' && (
                  <>
                    <span className="inline-flex items-center gap-1.5 text-emerald-700">
                      <span className="w-3.5 h-3.5 rounded bg-emerald-500 inline-block" />
                      <span>Delivered Revenue</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-rose-600">
                      <span className="w-3.5 h-3.5 rounded bg-rose-400 inline-block" />
                      <span>COGS (Procurement)</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-sky-700">
                      <span className="w-3.5 h-3.5 rounded bg-sky-600 inline-block" />
                      <span>Net Operating Margin</span>
                    </span>
                  </>
                )}

                {chartViewMode === 'all' && (
                  <>
                    <span className="inline-flex items-center gap-1.5 text-indigo-700">
                      <span className="w-3 h-3 rounded bg-indigo-600 inline-block" />
                      <span>Booked Sales</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-emerald-700">
                      <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
                      <span>Delivered</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-rose-600">
                      <span className="w-3 h-3 rounded bg-rose-400 inline-block" />
                      <span>COGS</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-amber-600">
                      <span className="w-3 h-3 rounded bg-amber-400 inline-block" />
                      <span>Expenses</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-sky-700">
                      <span className="w-3 h-3 rounded bg-sky-600 inline-block" />
                      <span>Net Profit</span>
                    </span>
                  </>
                )}
              </div>

              <span className="text-[11px] text-slate-400">
                Data updated in real time from PostgreSQL order ledger
              </span>
            </div>
          </div>

          {/* ===================== Middle Row: Expenses, Payments & COD ===================== */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Expense Distribution */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-sm text-slate-950 flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-slate-600" />
                  <span>Expense Breakdown</span>
                </h3>
                <span className="text-xs font-black text-slate-900">
                  {formatBDT(report.summary.operatingExpenses.current)}
                </span>
              </div>

              {report.expensesByCategory.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No operating expenses recorded for this period.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {report.expensesByCategory.map((cat) => (
                    <div key={cat.category} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-700 font-semibold">{cat.category}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{formatBDT(cat.amount)}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ({cat.percentage}%)
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-slate-800 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(3, cat.percentage))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Methods Distribution */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-sm text-slate-950 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-slate-600" />
                  <span>Payment Channels</span>
                </h3>
                <span className="text-xs font-medium text-slate-400">
                  {report.orderCounts.totalPlaced} orders
                </span>
              </div>

              <div className="space-y-3">
                {report.paymentDistribution.map((pm) => (
                  <div
                    key={pm.method}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900 uppercase tracking-wide">
                        {pm.method}
                      </span>
                      <span className="font-mono text-slate-500 text-[11px]">
                        {pm.orderCount} orders
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">Total Volume:</span>
                      <span className="font-bold text-slate-900">{formatBDT(pm.totalVolume)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] pt-1 border-t border-slate-200/50">
                      <span className="text-emerald-700">Collected:</span>
                      <span className="font-bold text-emerald-800">
                        {formatBDT(pm.collectedVolume)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* COD Custody & Reconciliation */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-sm text-slate-950 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-amber-600" />
                  <span>COD Custody & Flow</span>
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                  Reconciliation
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-600">Total Booked COD:</span>
                  <span className="font-bold text-slate-900">
                    {formatBDT(report.codTracking.bookedVolume)}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50 bg-emerald-50/50 px-2 rounded-lg">
                  <span className="text-emerald-900 font-semibold">Settled & Collected:</span>
                  <span className="font-black text-emerald-800">
                    {formatBDT(report.codTracking.collectedVolume)}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50 bg-amber-50/50 px-2 rounded-lg">
                  <span className="text-amber-900 font-semibold">In Courier Custody (Transit):</span>
                  <span className="font-black text-amber-800">
                    {formatBDT(report.codTracking.inTransitVolume)}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50 bg-rose-50/50 px-2 rounded-lg">
                  <span className="text-rose-900 font-semibold">Returned / Cancelled:</span>
                  <span className="font-black text-rose-800">
                    {formatBDT(report.codTracking.returnedVolume)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 text-[11px] font-bold">
                  <span className="text-slate-500">Collection Efficiency:</span>
                  <span className="text-slate-900">
                    {report.codTracking.collectionRatePercent}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ===================== Tab Navigation ===================== */}
          <div className="border-b border-slate-200 print:hidden">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition ${
                  activeTab === 'overview'
                    ? 'border-slate-950 text-slate-950'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Executive P&L Statement</span>
              </button>
              <button
                onClick={() => setActiveTab('products')}
                className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition ${
                  activeTab === 'products'
                    ? 'border-slate-950 text-slate-950'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Product Profitability ({report.productProfitability.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition ${
                  activeTab === 'orders'
                    ? 'border-slate-950 text-slate-950'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Order Financial Ledger ({report.orderLedger.length})</span>
              </button>
            </div>
          </div>

          {/* ===================== Tab 1: Formal P&L Statement ===================== */}
          {(activeTab === 'overview' || activeTab === 'statement') && (
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-4 gap-2">
                <div>
                  <h3 className="text-lg font-black text-slate-950">
                    Profit & Loss Income Statement
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Prepared under GAAP accrual revenue recognition standard (all values in BDT ৳).
                  </p>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  Period: {report.filter.startDate} — {report.filter.endDate}
                </div>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {/* 1. Operating Revenue */}
                <div className="py-4 space-y-2">
                  <div className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    1. Operating Revenue
                  </div>
                  <div className="flex justify-between py-1 text-slate-700">
                    <span>Gross Booked Sales (Placed Orders)</span>
                    <span className="font-semibold text-slate-900">
                      {formatBDT(report.summary.bookedSales.current)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-500">
                    <span>Less: Non-Delivered & Active Orders</span>
                    <span className="font-mono text-slate-600">
                      -{formatBDT(report.summary.bookedSales.current - report.summary.deliveredRevenue.current)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 bg-emerald-50/60 px-3 rounded-xl font-bold text-emerald-950">
                    <span>Recognized Delivered Product Revenue</span>
                    <span className="text-sm font-black">
                      {formatBDT(report.summary.deliveredRevenue.current)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-700">
                    <span>Delivery Charge Income (Customer Paid)</span>
                    <span className="font-semibold text-slate-900">
                      +{formatBDT(report.summary.deliveryRevenue.current)}
                    </span>
                  </div>
                </div>

                {/* 2. Direct Cost of Sales */}
                <div className="py-4 space-y-2">
                  <div className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    2. Direct Cost of Sales (COGS & Logistics)
                  </div>
                  <div className="flex justify-between py-1 text-slate-700">
                    <span>Procurement & Inventory Purchase Cost (COGS)</span>
                    <span className="font-semibold text-rose-600">
                      -{formatBDT(report.summary.cogs.current)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-700">
                    <span>Third-Party Courier & Shipping Logistics Cost</span>
                    <span className="font-semibold text-rose-600">
                      -{formatBDT(report.summary.deliveryCost.current)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 bg-slate-50 px-3 rounded-xl text-slate-700 text-[11px]">
                    <span>Net Delivery Margin (Customer Paid − Logistics Cost)</span>
                    <span className={`font-bold ${
                      report.summary.deliveryRevenue.current - report.summary.deliveryCost.current >= 0
                        ? 'text-emerald-700'
                        : 'text-rose-700'
                    }`}>
                      {formatBDT(report.summary.deliveryRevenue.current - report.summary.deliveryCost.current)}
                    </span>
                  </div>
                </div>

                {/* 3. Gross Operating Profit */}
                <div className="py-4 space-y-2">
                  <div className="flex justify-between py-2.5 bg-slate-900 text-white px-4 rounded-2xl items-center">
                    <div>
                      <div className="font-black text-sm">Gross Profit</div>
                      <div className="text-[10px] opacity-70">
                        Delivered Product Revenue − Direct Procurement COGS
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black">
                        {formatBDT(report.summary.grossProfit.current)}
                      </div>
                      <div className="text-[10px] opacity-70">
                        Margin: {report.summary.grossMarginPercent}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Operating Expenses (OPEX) */}
                <div className="py-4 space-y-2">
                  <div className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    4. Operating Expenses (OPEX)
                  </div>
                  {report.expensesByCategory.map((exp) => (
                    <div key={exp.category} className="flex justify-between py-1 text-slate-600">
                      <span>{exp.category}</span>
                      <span className="font-semibold text-rose-600">-{formatBDT(exp.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-1.5 border-t border-slate-100 font-bold text-slate-900">
                    <span>Total Operating Expenses</span>
                    <span className="text-rose-600">
                      -{formatBDT(report.summary.operatingExpenses.current)}
                    </span>
                  </div>
                </div>

                {/* 5. Deductions & Returns */}
                <div className="py-4 space-y-2">
                  <div className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    5. Deductions & Refunds
                  </div>
                  <div className="flex justify-between py-1 text-slate-600">
                    <span>Customer Returns, Damaged Replacements & Refunds</span>
                    <span className="font-semibold text-rose-600">
                      -{formatBDT(report.summary.refundsAndReturns.current)}
                    </span>
                  </div>
                </div>

                {/* 6. Net Operating Profit */}
                <div className="pt-6">
                  <div
                    className={`flex justify-between items-center p-5 rounded-2xl ${
                      report.summary.netProfit.current >= 0
                        ? 'bg-emerald-600 text-white'
                        : 'bg-rose-600 text-white'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-black uppercase tracking-wider">
                        Net Operating Income (Bottom Line)
                      </div>
                      <div className="text-xs opacity-80 mt-0.5">
                        Gross Profit + Delivery Margin − Operating Expenses − Refunds
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl sm:text-3xl font-black">
                        {formatBDT(report.summary.netProfit.current)}
                      </div>
                      <div className="text-xs opacity-90 font-bold mt-1">
                        Net Margin: {report.summary.netMarginPercent}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================== Tab 2: Product Profitability ===================== */}
          {activeTab === 'products' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-950">
                    Product-Wise Margin & Profitability
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Analyzes revenue, purchase costs, gross margin, and unit volumes across all delivered products.
                  </p>
                </div>

                {/* Search & Sort Controls */}
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search product or SKU..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>

                  <select
                    value={productSortBy}
                    onChange={(e) => setProductSortBy(e.target.value as any)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                  >
                    <option value="profit">Sort by Gross Profit</option>
                    <option value="revenue">Sort by Revenue</option>
                    <option value="units">Sort by Units Sold</option>
                    <option value="margin">Sort by Margin %</option>
                  </select>

                  <button
                    onClick={() => handleExport('products')}
                    className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition"
                    title="Export Product Profitability"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                      <th className="pb-3 pl-2">Product Name & SKU</th>
                      <th className="pb-3">Category</th>
                      <th className="pb-3 text-right">Units Sold</th>
                      <th className="pb-3 text-right">Revenue</th>
                      <th className="pb-3 text-right">Total COGS</th>
                      <th className="pb-3 text-right">Gross Profit</th>
                      <th className="pb-3 text-right pr-2">Gross Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          No product sales match your search or filter.
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((p) => {
                        const isHighMargin = p.marginPercent >= 30;
                        const isNegative = p.grossProfit < 0;

                        return (
                          <tr key={p.productId} className="hover:bg-slate-50/80 transition">
                            <td className="py-3 pl-2">
                              <div className="font-bold text-slate-900 line-clamp-1">
                                {p.productName}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">{p.sku}</div>
                            </td>
                            <td className="py-3 text-slate-600">{p.categoryName}</td>
                            <td className="py-3 text-right font-semibold text-slate-900">
                              {p.unitsSold}
                            </td>
                            <td className="py-3 text-right font-bold text-slate-900">
                              {formatBDT(p.totalRevenue)}
                            </td>
                            <td className="py-3 text-right text-rose-600 font-medium">
                              -{formatBDT(p.totalCost)}
                            </td>
                            <td className="py-3 text-right font-black text-slate-950">
                              {formatBDT(p.grossProfit)}
                            </td>
                            <td className="py-3 text-right pr-2">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-md font-bold text-[11px] ${
                                  isNegative
                                    ? 'bg-rose-100 text-rose-800'
                                    : isHighMargin
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {p.marginPercent}%
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===================== Tab 3: Order Financial Ledger ===================== */}
          {activeTab === 'orders' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-950">Order-Wise Financial Ledger</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Individual order financial statement showing retail value, procurement cost, gross profit, and net contribution.
                  </p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-56">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search order #, customer..."
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>

                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                  >
                    <option value="ALL">All Order Statuses</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="PENDING">Pending</option>
                    <option value="IN_TRANSIT">In Transit</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>

                  <select
                    value={paymentStatusFilter}
                    onChange={(e) => setPaymentStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                  >
                    <option value="ALL">All Payment Statuses</option>
                    <option value="PAID">Paid</option>
                    <option value="PENDING">Pending</option>
                    <option value="REFUNDED">Refunded</option>
                  </select>

                  <select
                    value={agingFilter}
                    onChange={(e) => setAgingFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                  >
                    <option value="ALL">All Aging / SLA</option>
                    <option value="OVERDUE">⚠️ Overdue</option>
                    <option value="URGENT">⚡ Urgent (&lt;12h)</option>
                    <option value="ON_TRACK">⏱️ On Track</option>
                    <option value="DELIVERED">✅ Delivered</option>
                    <option value="CANCELLED">❌ Cancelled</option>
                  </select>

                  <button
                    onClick={() => handleExport('orders')}
                    className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition"
                    title="Export Orders Ledger"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Order Ledger Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                      <th className="pb-3 pl-2">Order #</th>
                      <th className="pb-3">Date & Aging</th>
                      <th className="pb-3">Customer</th>
                      <th className="pb-3">Status & SLA</th>
                      <th className="pb-3 text-right">Order Value</th>
                      <th className="pb-3 text-right">Collected / Bal</th>
                      <th className="pb-3 text-right">COGS</th>
                      <th className="pb-3 text-right">Gross Profit</th>
                      <th className="pb-3 text-right pr-2">Net Contribution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-400">
                          No orders found matching the filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => {
                        const isDelivered = order.orderStatus === 'DELIVERED';
                        const isCancelled = order.orderStatus === 'CANCELLED';
                        const isOverdue = order.isOverdue || order.agingStatus === 'OVERDUE';
                        const isUrgent = order.agingStatus === 'URGENT';

                        return (
                          <tr key={order.id} className="hover:bg-slate-50/80 transition">
                            <td className="py-3 pl-2 font-mono font-bold text-slate-900">
                              {order.orderNumber}
                            </td>
                            <td className="py-3">
                              <div className="text-slate-900 font-medium text-[11px]">
                                {new Date(order.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </div>
                              <div className="flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span className={`text-[10px] font-mono ${
                                  isOverdue ? 'text-rose-600 font-black' : isUrgent ? 'text-amber-600 font-bold' : 'text-slate-500'
                                }`}>
                                  {order.elapsedText || 'N/A'}
                                </span>
                              </div>
                            </td>
                            <td className="py-3">
                              <div className="font-semibold text-slate-900">
                                {order.customerName}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {order.customerPhone}
                              </div>
                            </td>
                            <td className="py-3">
                              <div className="flex flex-col gap-1 items-start">
                                <div className="flex items-center gap-1">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      isDelivered
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : isCancelled
                                        ? 'bg-rose-100 text-rose-800'
                                        : 'bg-amber-100 text-amber-800'
                                    }`}
                                  >
                                    {order.orderStatus}
                                  </span>

                                  {isOverdue && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-600 text-white animate-pulse">
                                      OVERDUE
                                    </span>
                                  )}
                                  {isUrgent && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500 text-white">
                                      URGENT
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {order.paymentMethod} • {order.paymentStatus}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 text-right font-bold text-slate-900">
                              {formatBDT(order.totalAmount)}
                              <div className="text-[10px] font-normal text-slate-400">
                                Ship: {formatBDT(order.deliveryFee)}
                              </div>
                            </td>
                            <td className="py-3 text-right">
                              <div className="font-bold text-emerald-700">
                                {formatBDT(order.collectedAmount ?? (order.paymentStatus === 'PAID' ? order.totalAmount : 0))}
                              </div>
                              {(order.outstandingBalance ?? (order.paymentStatus === 'PAID' ? 0 : order.totalAmount)) > 0 ? (
                                <div className="text-[10px] font-bold text-rose-600">
                                  Bal: {formatBDT(order.outstandingBalance ?? order.totalAmount)}
                                </div>
                              ) : (
                                <div className="text-[10px] font-medium text-slate-400">
                                  Settled
                                </div>
                              )}
                            </td>
                            <td className="py-3 text-right font-medium text-rose-600">
                              {isCancelled ? '-' : `-${formatBDT(order.cogs)}`}
                            </td>
                            <td className="py-3 text-right font-bold text-slate-950">
                              {isCancelled ? '-' : formatBDT(order.grossProfit)}
                            </td>
                            <td className="py-3 text-right pr-2">
                              {isCancelled ? (
                                <span className="text-slate-400 font-mono">৳0</span>
                              ) : (
                                <span
                                  className={`font-black ${
                                    order.netContribution >= 0
                                      ? 'text-emerald-700'
                                      : 'text-rose-700'
                                  }`}
                                >
                                  {formatBDT(order.netContribution)}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ===================== Custom Date Range Modal ===================== */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-950">Select Custom Date Window</h3>
              <button
                onClick={() => setShowCustomModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="pt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Quick Presets
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const end = new Date();
                      const start = new Date();
                      start.setDate(end.getDate() - 30);
                      setStartDate(start.toISOString().slice(0, 10));
                      setEndDate(end.toISOString().slice(0, 10));
                    }}
                    className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold text-center"
                  >
                    Last 30 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const end = new Date();
                      const start = new Date();
                      start.setDate(end.getDate() - 90);
                      setStartDate(start.toISOString().slice(0, 10));
                      setEndDate(end.toISOString().slice(0, 10));
                    }}
                    className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold text-center"
                  >
                    Last 90 Days
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={applyCustomRange}
                disabled={!startDate || !endDate}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs disabled:opacity-50 transition"
              >
                Apply Range
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

