'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/storefront/Header';
import Footer from '@/components/storefront/Footer';
import { formatBDT } from '@/lib/currency';
import {
  Search,
  Clock,
  Check,
  AlertCircle,
  Loader2,
  PhoneCall,
} from 'lucide-react';

const ORDER_STEPS = [
  { key: 'PENDING', label: 'Order Placed', desc: 'Received & queued' },
  { key: 'CONFIRMED', label: 'Confirmed', desc: 'Verified by team' },
  { key: 'PROCESSING', label: 'Processing', desc: 'Preparing in warehouse' },
  { key: 'PACKED', label: 'Packed', desc: 'Boxed & labeled' },
  { key: 'SHIPPED', label: 'Shipped', desc: 'On delivery route' },
  { key: 'DELIVERED', label: 'Delivered', desc: 'Successfully handed over' },
];

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Prefill from query parameters if present
  useEffect(() => {
    const qOrder = searchParams.get('orderNumber');
    const qPhone = searchParams.get('phone');
    if (qOrder && qPhone) {
      setOrderNumber(qOrder);
      setPhone(qPhone);
      fetchOrder(qOrder, qPhone);
    }
  }, [searchParams]);

  const fetchOrder = async (ordNum: string, ph: string) => {
    setLoading(true);
    setError('');
    setOrderData(null);

    try {
      const res = await fetch(`/api/orders/track?orderNumber=${encodeURIComponent(ordNum)}&phone=${encodeURIComponent(ph)}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'No matching order found');
      }

      setOrderData(data.order);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error finding order';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim() || !phone.trim()) {
      setError('Please provide both Order Number and Phone Number.');
      return;
    }
    fetchOrder(orderNumber.trim(), phone.trim());
  };

  const getStepIndex = (status: string) => {
    const idx = ORDER_STEPS.findIndex((s) => s.key === status);
    return idx === -1 ? 0 : idx;
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-4xl font-black text-slate-950">Track Your Order</h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Enter your order number and mobile number to see real-time delivery status.
        </p>
      </div>

      {/* Lookup Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm max-w-2xl mx-auto">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Order Number</label>
              <input
                type="text"
                required
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                placeholder="e.g. TEM-2026-10001"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 01712345678"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Searching Order Records...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Check Status</span>
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Tracking Result View */}
      {orderData && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-sm space-y-8 animate-fadeIn">
          {/* Header Status Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6">
            <div>
              <span className="text-xs font-bold text-amber-600 font-mono">{orderData.orderNumber}</span>
              <h2 className="text-xl font-black text-slate-900">
                Recipient: {orderData.customerName}
              </h2>
              <p className="text-xs text-slate-500">Destination: {orderData.deliveryCity}</p>
            </div>

            <div className="text-right sm:text-right">
              <span className="block text-xs text-slate-500">Total Payable</span>
              <span className="text-2xl font-black text-slate-900">{formatBDT(orderData.totalAmount)}</span>
              <span className="block text-[11px] font-bold text-emerald-600">
                {orderData.paymentMethod} • {orderData.paymentStatus}
              </span>
            </div>
          </div>

          {/* Stepper Timeline */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6">
              Delivery Progress
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {ORDER_STEPS.map((step, idx) => {
                const currentIdx = getStepIndex(orderData.orderStatus);
                const isDone = idx <= currentIdx;
                const isCurrent = idx === currentIdx;

                return (
                  <div
                    key={step.key}
                    className={`p-3.5 rounded-2xl border text-center space-y-1 transition ${
                      isCurrent
                        ? 'border-amber-500 bg-amber-50/50 shadow-sm'
                        : isDone
                        ? 'border-emerald-300 bg-emerald-50/20'
                        : 'border-slate-100 bg-slate-50 opacity-60'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center mx-auto text-xs font-bold ${
                        isDone ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {isDone ? <Check className="w-4 h-4" /> : idx + 1}
                    </div>
                    <div className="font-bold text-xs text-slate-900">{step.label}</div>
                    <div className="text-[10px] text-slate-500">{step.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Items Summary */}
          <div className="border-t border-slate-100 pt-6">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Items in Parcel</h4>
            <div className="divide-y divide-slate-100">
              {orderData.items?.map((item: any, i: number) => (
                <div key={i} className="py-2 flex justify-between text-xs">
                  <span className="font-medium text-slate-800">
                    {item.productName} × {item.quantity}
                  </span>
                  <span className="font-bold text-slate-900">{formatBDT(item.totalPrice)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Support Callout */}
          <div className="bg-slate-50 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Need help or urgent update regarding this shipment?
            </span>
            <a
              href="tel:+8809697192016"
              className="font-bold text-slate-900 hover:text-amber-600 flex items-center gap-1.5 font-mono"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              Call +880 9697-192016
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-12 w-full">
        <Suspense
          fallback={
            <div className="text-center py-20">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-500" />
              <p className="text-xs text-slate-400 mt-2">Loading tracking portal...</p>
            </div>
          }
        >
          <TrackOrderContent />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
