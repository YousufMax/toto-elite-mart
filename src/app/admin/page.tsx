import React from 'react';
import Link from 'next/link';
import { getSessionUser } from '@/lib/auth';
import { getDashboardMetrics } from '@/lib/data-store';
import { formatBDT } from '@/lib/currency';
import { redirect } from 'next/navigation';
import {
  ShoppingCart,
  TrendingUp,
  DollarSign,
  Package,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  Receipt,
} from 'lucide-react';

export const revalidate = 0; // Live metrics

export default async function AdminDashboardOverview() {
  const user = await getSessionUser();
  if (!user) {
    redirect('/admin/login');
  }

  const metrics = await getDashboardMetrics();

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
        <div>
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
            Business Control Center
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
            Welcome back, {user.fullName}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time business performance, order processing, and financial metrics in BDT (৳).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition shadow-md shadow-amber-500/20"
          >
            Manage Orders
          </Link>
          <Link
            href="/admin/products"
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition"
          >
            Add Product
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Sales */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gross Sales</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-950">{formatBDT(metrics.totalSales)}</div>
          <p className="text-[11px] text-slate-400">Total cumulative non-cancelled order values</p>
        </div>

        {/* Delivered Recognized Revenue */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Delivered Sales</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700">{formatBDT(metrics.deliveredRevenue)}</div>
          <p className="text-[11px] text-slate-400">Recognized delivered revenue</p>
        </div>

        {/* Cash Collected vs Receivables */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cash Collected</span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-950">{formatBDT(metrics.collectedCash)}</div>
          <p className="text-[11px] text-slate-400">
            Receivables: <b>{formatBDT(metrics.outstandingReceivables)}</b>
          </p>
        </div>

        {/* Net Profit */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Net Result</span>
            <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-950">{formatBDT(metrics.netProfit)}</div>
          <p className="text-[11px] text-slate-400">
            COGS: {formatBDT(metrics.cogs)} | Exp: {formatBDT(metrics.totalExpenses)}
          </p>
        </div>
      </div>

      {/* Orders & Inventory Status Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 text-center space-y-1">
          <div className="text-xs text-slate-500 font-semibold">Total Orders</div>
          <div className="text-xl font-black text-slate-900">{metrics.totalOrders}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 text-center space-y-1">
          <div className="text-xs text-amber-600 font-semibold">Pending Review</div>
          <div className="text-xl font-black text-amber-600">{metrics.pendingOrders}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 text-center space-y-1">
          <div className="text-xs text-blue-600 font-semibold">In Progress</div>
          <div className="text-xl font-black text-blue-600">{metrics.inProgressOrders}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 text-center space-y-1">
          <div className="text-xs text-emerald-600 font-semibold">Delivered</div>
          <div className="text-xl font-black text-emerald-600">{metrics.deliveredOrders}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 text-center space-y-1">
          <div className="text-xs text-red-600 font-semibold">Cancelled</div>
          <div className="text-xl font-black text-red-600">{metrics.cancelledOrders}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 text-center space-y-1">
          <div className="text-xs text-slate-700 font-semibold">Low Stock Items</div>
          <div className="text-xl font-black text-amber-500">{metrics.lowStockCount}</div>
        </div>
      </div>

      {/* Low Stock Warning Box */}
      {metrics.lowStockCount > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-slate-900">
                Low Inventory Warning ({metrics.lowStockCount} products below threshold)
              </h4>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Some catalog items have fallen below their minimum safety thresholds.
              </p>
            </div>
          </div>
          <Link
            href="/admin/inventory"
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs shrink-0 transition"
          >
            Review Inventory
          </Link>
        </div>
      )}

      {/* Recent Orders Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Customer Orders</h2>
            <p className="text-xs text-slate-500">Latest orders placed on Toto Elite Mart</p>
          </div>
          <Link
            href="/admin/orders"
            className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
          >
            <span>View All Orders</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-y border-slate-100 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">City</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Order Status</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {metrics.recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No orders placed yet.
                  </td>
                </tr>
              ) : (
                metrics.recentOrders.map((ord: any) => (
                  <tr key={ord.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{ord.orderNumber}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{ord.customerName}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{ord.customerPhone}</td>
                    <td className="py-3.5 px-4 text-slate-600">{ord.deliveryCity}</td>
                    <td className="py-3.5 px-4 font-black text-slate-950">{formatBDT(ord.totalAmount)}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        {ord.orderStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {ord.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/admin/orders`}
                        className="text-amber-600 hover:text-amber-700 font-bold text-xs"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
