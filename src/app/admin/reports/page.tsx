import React from 'react';
import { getSessionUser } from '@/lib/auth';
import { getDashboardMetrics } from '@/lib/data-store';
import { formatBDT } from '@/lib/currency';
import { redirect } from 'next/navigation';

export const revalidate = 0;

export default async function AdminReportsPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect('/admin/login');
  }

  const metrics = await getDashboardMetrics();

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-950">Financial Statements & P&L Reports</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict accounting standards: recognized delivered revenue, cost of goods, cash collected, and net operating profit.
          </p>
        </div>
      </div>

      {/* P&L Statement Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-sm space-y-6">
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
          <span>Profit & Loss Statement (Year-to-Date in BDT)</span>
          <span className="text-xs font-mono text-slate-400">All figures in ৳</span>
        </h2>

        <div className="space-y-4 text-xs">
          {/* Revenue Section */}
          <div className="space-y-2">
            <div className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
              1. Sales & Revenue
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-700">Gross Orders Placed</span>
              <span className="font-semibold text-slate-900">{formatBDT(metrics.totalSales)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 bg-emerald-50/40 px-2 rounded-lg font-bold">
              <span className="text-emerald-900">Recognized Delivered Revenue</span>
              <span className="text-emerald-950 font-black">{formatBDT(metrics.deliveredRevenue)}</span>
            </div>
          </div>

          {/* Cost of Goods Sold */}
          <div className="space-y-2 pt-2">
            <div className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
              2. Cost of Goods Sold (COGS)
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-700">Procurement & Product Unit Cost</span>
              <span className="font-semibold text-red-600">-{formatBDT(metrics.cogs)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 bg-slate-50 px-2 rounded-lg font-bold">
              <span className="text-slate-900">Gross Operating Profit</span>
              <span className="text-slate-950 font-black">{formatBDT(metrics.grossProfit)}</span>
            </div>
          </div>

          {/* Operating Expenses */}
          <div className="space-y-2 pt-2">
            <div className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
              3. Operating Expenses (OPEX)
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-700">Packaging, Logistics, Marketing & Utilities</span>
              <span className="font-semibold text-red-600">-{formatBDT(metrics.totalExpenses)}</span>
            </div>
          </div>

          {/* Net Result */}
          <div className="pt-4 border-t-2 border-slate-900 flex justify-between items-baseline text-sm font-black">
            <span className="text-slate-950">Net Operating Result (Net Profit / Loss)</span>
            <span className="text-2xl text-emerald-600 font-black">{formatBDT(metrics.netProfit)}</span>
          </div>
        </div>
      </div>

      {/* Cash Flow & Collections Reconciliation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
            Cash Collections Reconciliation
          </h3>
          <div className="space-y-3 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Actual Cash Deposited / Collected:</span>
              <span className="font-black text-emerald-700 text-sm">{formatBDT(metrics.collectedCash)}</span>
            </div>
            <div className="flex justify-between">
              <span>Outstanding Receivables (Pending & In Transit):</span>
              <span className="font-bold text-amber-700 text-sm">{formatBDT(metrics.outstandingReceivables)}</span>
            </div>
            <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-50">
              All uncollected amounts represent Cash on Delivery parcels pending courier rider handover or delivery in transit.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
            Order Fulfillment Breakdown
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-600">Total Placed Orders:</span>
              <span className="font-bold text-slate-900">{metrics.totalOrders}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-600">Delivered Successfully:</span>
              <span className="font-bold text-emerald-600">{metrics.deliveredOrders}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-600">Cancelled / Rejected Orders:</span>
              <span className="font-bold text-red-600">{metrics.cancelledOrders}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-600">Active In Transit / Pending:</span>
              <span className="font-bold text-amber-600">{metrics.inProgressOrders + metrics.pendingOrders}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
