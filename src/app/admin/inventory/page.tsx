'use client';

import React, { useState, useEffect } from 'react';
import { formatBDT } from '@/lib/currency';
import {
  Warehouse,
  Plus,
  Minus,
  AlertTriangle,
  History,
  CheckCircle,
  X,
  Loader2,
} from 'lucide-react';

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adjustProduct, setAdjustProduct] = useState<any>(null);
  const [adjustType, setAdjustType] = useState<'ADD' | 'DEDUCT'>('ADD');
  const [quantity, setQuantity] = useState('5');
  const [reason, setReason] = useState('New stock shipment arrived from supplier');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success) {
        setProducts(data.products || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustProduct) return;
    setSubmitting(true);
    setMessage('');

    const qtyNumber = parseInt(quantity, 10);
    const delta = adjustType === 'ADD' ? qtyNumber : -qtyNumber;
    const newStock = Math.max(0, adjustProduct.stockQuantity + delta);

    try {
      // Simulate backend update & movement record
      setProducts((prev) =>
        prev.map((p) =>
          p.id === adjustProduct.id ? { ...p, stockQuantity: newStock } : p
        )
      );
      setMessage(`Successfully adjusted stock for "${adjustProduct.name}". New stock: ${newStock}`);
      setAdjustProduct(null);
    } catch {
      setMessage('Error updating stock');
    } finally {
      setSubmitting(false);
    }
  };

  const lowStockProducts = products.filter((p) => p.stockQuantity <= p.lowStockThreshold);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-950">Inventory Ledger & Stock Control</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time stock monitoring, audit-logged adjustments, supplier replenishment, and alerts.
        </p>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="text-emerald-900 font-bold">×</button>
        </div>
      )}

      {/* Low Stock Alerts Strip */}
      {lowStockProducts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <span>Low Stock Attention Required ({lowStockProducts.length} items)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStockProducts.map((p) => (
              <div
                key={p.id}
                className="bg-white p-3.5 rounded-2xl border border-amber-200/60 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900 line-clamp-1">{p.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono">SKU: {p.sku}</div>
                </div>
                <div className="text-right">
                  <span className="font-black text-red-600">{p.stockQuantity} left</span>
                  <button
                    onClick={() => {
                      setAdjustProduct(p);
                      setAdjustType('ADD');
                    }}
                    className="block text-[11px] font-bold text-amber-600 hover:text-amber-700 mt-1"
                  >
                    + Restock
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Complete Stock Ledger Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Current Warehouse Stock Ledger</h2>
          <span className="text-xs text-slate-400 font-mono">Total SKUs: {products.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Product Name</th>
                <th className="py-3.5 px-4">SKU</th>
                <th className="py-3.5 px-4">In Stock</th>
                <th className="py-3.5 px-4">Safety Limit</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Adjustment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500" />
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{p.name}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">{p.sku}</td>
                    <td className="py-3.5 px-4">
                      <span className={`text-sm font-black ${
                        p.stockQuantity === 0 ? 'text-red-600' : p.stockQuantity <= p.lowStockThreshold ? 'text-amber-600' : 'text-slate-950'
                      }`}>
                        {p.stockQuantity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{p.lowStockThreshold} units</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        p.stockQuantity === 0 ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {p.stockQuantity === 0 ? 'OUT OF STOCK' : 'ACTIVE'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setAdjustProduct(p);
                          setAdjustType('ADD');
                        }}
                        className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg font-bold text-[11px]"
                      >
                        + Add Stock
                      </button>
                      <button
                        onClick={() => {
                          setAdjustProduct(p);
                          setAdjustType('DEDUCT');
                        }}
                        className="px-2.5 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg font-bold text-[11px]"
                      >
                        - Deduct
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {adjustProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setAdjustProduct(null)}
              className="absolute top-6 right-6 p-1 text-slate-400 hover:text-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                Traceable Stock Movement
              </span>
              <h2 className="text-lg font-black text-slate-900 mt-0.5">
                {adjustType === 'ADD' ? 'Add / Restock' : 'Deduct / Write-off'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {adjustProduct.name} ({adjustProduct.sku})
              </p>
            </div>

            <form onSubmit={handleStockAdjustment} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Adjustment Quantity</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason for Adjustment *</label>
                <textarea
                  rows={2}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Received new shipment from supplier / Damaged box in transit"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-slate-600 flex justify-between font-semibold">
                <span>Current Stock: <b>{adjustProduct.stockQuantity}</b></span>
                <span>
                  After Adjustment:{' '}
                  <b>
                    {adjustType === 'ADD'
                      ? adjustProduct.stockQuantity + (parseInt(quantity, 10) || 0)
                      : Math.max(0, adjustProduct.stockQuantity - (parseInt(quantity, 10) || 0))}
                  </b>
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustProduct(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition"
                >
                  {submitting ? 'Recording Movement...' : 'Confirm Movement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
