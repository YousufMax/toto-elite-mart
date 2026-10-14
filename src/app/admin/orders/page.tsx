'use client';

import React, { useState, useEffect } from 'react';
import { formatBDT } from '@/lib/currency';
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
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Futuristic Super Admin Order Deletion States
  const [orderToDelete, setOrderToDelete] = useState<any>(null);
  const [restoreInventory, setRestoreInventory] = useState(true);
  const [deleteReason, setDeleteReason] = useState('Duplicate/Test order purge');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const url = `/api/orders?status=${filterStatus}${search ? `&search=${encodeURIComponent(search)}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders || []);
        if (data.currentUser) {
          setCurrentUser(data.currentUser);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filterStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
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
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, orderStatus: newStatus } : o))
        );
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder((prev: any) => ({ ...prev, orderStatus: newStatus }));
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
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, paymentStatus: newPaymentStatus } : o))
        );
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

      // Optimistically remove from list
      setOrders((prev) => prev.filter((o) => o.id !== orderToDelete.id));

      if (selectedOrder?.id === orderToDelete.id) {
        setSelectedOrder(null);
      }
      setOrderToDelete(null);
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Error deleting order');
    } finally {
      setDeleting(false);
    }
  };

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-950">Customer Order Processing</h1>
            {isSuperAdmin && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                Super Admin Access
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage status transitions, customer dispatch, payment settlements, and Super Admin order governance.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition shadow-sm hover:shadow"
        >
          Refresh Orders
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order #, phone, customer..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </form>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {STATUS_OPTIONS.map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold shrink-0 transition ${
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

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Order #</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Destination</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-4">Order Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
                    <span>Loading orders...</span>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No orders match your filter criteria.
                  </td>
                </tr>
              ) : (
                orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{ord.orderNumber}</td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(ord.createdAt).toLocaleDateString('en-BD')}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{ord.customerName}</div>
                      <div className="text-[11px] font-mono text-slate-500">{ord.customerPhone}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div>{ord.deliveryCity}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{ord.deliveryAddress}</div>
                    </td>
                    <td className="py-3.5 px-4 font-black text-slate-950">{formatBDT(ord.totalAmount)}</td>
                    <td className="py-3.5 px-4">
                      <select
                        value={ord.paymentStatus}
                        onChange={(e) => handleUpdatePaymentStatus(ord.id, e.target.value)}
                        disabled={updatingId === ord.id}
                        className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      >
                        <option value="UNPAID">UNPAID</option>
                        <option value="PARTIAL">PARTIAL</option>
                        <option value="PAID">PAID</option>
                        <option value="REFUNDED">REFUNDED</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={ord.orderStatus}
                        onChange={(e) => handleUpdateStatus(ord.id, e.target.value)}
                        disabled={updatingId === ord.id}
                        className="bg-amber-50 border border-amber-200 text-amber-900 rounded-lg px-2.5 py-1 text-[11px] font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
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
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedOrder(ord)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                          title="View Details & Invoice"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Super Admin Exclusive Delete Button */}
                        {isSuperAdmin && (
                          <button
                            onClick={() => {
                              setOrderToDelete(ord);
                              setDeleteError('');
                              setRestoreInventory(ord.orderStatus !== 'CANCELLED' && ord.orderStatus !== 'RETURNED');
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details & Invoice Modal */}
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
                <p className="text-xs text-slate-400">Placed on {new Date(selectedOrder.createdAt).toLocaleString('en-BD')}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Invoice</span>
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

      {/* Futuristic Super Admin Order Purge Confirmation Modal */}
      {orderToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-rose-100 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Top gradient accent line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600" />

            {/* Header with Cyber Warning Indicator */}
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

            {/* Interactive Settings for Deletion */}
            <form onSubmit={handleDeleteOrder} className="space-y-4">
              {/* Inventory Restoration Checkbox */}
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

              {/* Deletion Reason */}
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

              {/* Warning Disclaimer */}
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-amber-900 text-[11px]">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>
                  Once confirmed, this order record will be permanently purged from the system.
                </span>
              </div>

              {/* Action Buttons */}
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
    </div>
  );
}
