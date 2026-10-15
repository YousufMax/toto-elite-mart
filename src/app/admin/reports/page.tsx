'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { formatBDT } from '@/lib/currency';
import type { ComprehensiveFinancialReport, FinancialTimeRange } from '@/lib/financial-analytics';
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
  PieChart as PieChartIcon
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

  // Export dropdown
  const [showExportMenu, setShowExportMenu] = useState(false);

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

      return matchQuery && matchOrderStatus && matchPaymentStatus;
    });
  }, [report, orderSearch, orderStatusFilter, paymentStatusFilter]);

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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-950 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  <span>Financial Trajectory Over Time</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Comparison of Delivered Revenue, Product COGS, Operating Expenses, and Net Profit across selected timeline.
                </p>
              </div>

              {/* Chart Legend */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
                <span className="inline-flex items-center gap-1.5 text-emerald-700">
                  <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
                  <span>Delivered Revenue</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-rose-600">
                  <span className="w-3 h-3 rounded bg-rose-400 inline-block" />
                  <span>COGS</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-amber-600">
                  <span className="w-3 h-3 rounded bg-amber-400 inline-block" />
                  <span>Expenses</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-indigo-700">
                  <span className="w-3 h-3 rounded bg-indigo-600 inline-block" />
                  <span>Net Profit</span>
                </span>
              </div>
            </div>

            {/* Responsive Native SVG Bar/Trend Chart */}
            <div className="w-full overflow-x-auto pb-2">
              {report.timeSeriesTrends.length === 0 ? (
                <div className="py-16 text-center text-xs text-slate-400">
                  No transaction data available for this time window.
                </div>
              ) : (
                <div className="min-w-[650px]">
                  {(() => {
                    const points = report.timeSeriesTrends;
                    const maxVal = Math.max(
                      1000,
                      ...points.map((p) => Math.max(p.deliveredRevenue, p.cogs, p.expenses, Math.abs(p.netProfit)))
                    );

                    const svgHeight = 260;
                    const chartTop = 20;
                    const chartBottom = 210;
                    const chartHeight = chartBottom - chartTop;

                    return (
                      <div className="relative">
                        <svg
                          viewBox={`0 0 ${points.length * 75 + 100} ${svgHeight}`}
                          className="w-full h-64 overflow-visible"
                        >
                          {/* Y-Axis Grid Lines */}
                          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                            const y = chartBottom - ratio * chartHeight;
                            const labelVal = Math.round(maxVal * ratio);
                            return (
                              <g key={ratio}>
                                <line
                                  x1="60"
                                  y1={y}
                                  x2={points.length * 75 + 80}
                                  y2={y}
                                  stroke="#f1f5f9"
                                  strokeDasharray="4 4"
                                />
                                <text
                                  x="50"
                                  y={y + 4}
                                  textAnchor="end"
                                  className="text-[10px] fill-slate-400 font-mono font-medium"
                                >
                                  {formatBDT(labelVal, false)}
                                </text>
                              </g>
                            );
                          })}

                          {/* Data points (group of bars for each date bucket) */}
                          {points.map((p, idx) => {
                            const groupX = 80 + idx * 75;
                            const barWidth = 10;

                            const revHeight = Math.max(2, (p.deliveredRevenue / maxVal) * chartHeight);
                            const revY = chartBottom - revHeight;

                            const cogsHeight = Math.max(2, (p.cogs / maxVal) * chartHeight);
                            const cogsY = chartBottom - cogsHeight;

                            const expHeight = Math.max(2, (p.expenses / maxVal) * chartHeight);
                            const expY = chartBottom - expHeight;

                            const netVal = p.netProfit;
                            const netHeight = Math.max(2, (Math.abs(netVal) / maxVal) * chartHeight);
                            const netY = chartBottom - netHeight;

                            return (
                              <g key={p.date} className="group cursor-pointer">
                                {/* Hover background pill */}
                                <rect
                                  x={groupX - 6}
                                  y={chartTop}
                                  width="54"
                                  height={chartHeight + 10}
                                  fill="#f8fafc"
                                  rx="8"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                                />

                                {/* Bar 1: Delivered Revenue */}
                                <rect
                                  x={groupX}
                                  y={revY}
                                  width={barWidth}
                                  height={revHeight}
                                  fill="#10b981"
                                  rx="3"
                                />

                                {/* Bar 2: COGS */}
                                <rect
                                  x={groupX + 11}
                                  y={cogsY}
                                  width={barWidth}
                                  height={cogsHeight}
                                  fill="#fb7185"
                                  rx="3"
                                />

                                {/* Bar 3: OPEX */}
                                <rect
                                  x={groupX + 22}
                                  y={expY}
                                  width={barWidth}
                                  height={expHeight}
                                  fill="#fbbf24"
                                  rx="3"
                                />

                                {/* Bar 4: Net Profit */}
                                <rect
                                  x={groupX + 33}
                                  y={netY}
                                  width={barWidth}
                                  height={netHeight}
                                  fill={netVal >= 0 ? '#4f46e5' : '#ef4444'}
                                  rx="3"
                                />

                                {/* X-Axis Date Label */}
                                <text
                                  x={groupX + 20}
                                  y={chartBottom + 20}
                                  textAnchor="middle"
                                  className="text-[10px] fill-slate-500 font-semibold"
                                >
                                  {p.label}
                                </text>

                                {/* Native SVG Tooltip */}
                                <title>
                                  {`${p.label} (${p.date})
• Delivered Revenue: ${formatBDT(p.deliveredRevenue)}
• Product COGS: ${formatBDT(p.cogs)}
• Operating Expenses: ${formatBDT(p.expenses)}
• Net Operating Profit: ${formatBDT(p.netProfit)}`}
                                </title>
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
                      <th className="pb-3">Date</th>
                      <th className="pb-3">Customer</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Order Value</th>
                      <th className="pb-3 text-right">Delivery</th>
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

                        return (
                          <tr key={order.id} className="hover:bg-slate-50/80 transition">
                            <td className="py-3 pl-2 font-mono font-bold text-slate-900">
                              {order.orderNumber}
                            </td>
                            <td className="py-3 text-slate-500 text-[11px]">
                              {new Date(order.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
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
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {order.paymentMethod} • {order.paymentStatus}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 text-right font-bold text-slate-900">
                              {formatBDT(order.totalAmount)}
                            </td>
                            <td className="py-3 text-right text-slate-500">
                              {formatBDT(order.deliveryFee)}
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

