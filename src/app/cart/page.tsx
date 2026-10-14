'use client';

import React from 'react';
import Link from 'next/link';
import Header from '@/components/storefront/Header';
import Footer from '@/components/storefront/Footer';
import { useCart } from '@/components/storefront/CartContext';
import { formatBDT } from '@/lib/currency';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, Tag, Ticket, Loader2, X, Check } from 'lucide-react';
import FreeDeliveryBar from '@/components/storefront/FreeDeliveryBar';

export default function CartPage() {
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    itemCount,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    discountAmount,
  } = useCart();

  const [couponInput, setCouponInput] = React.useState('');
  const [couponLoading, setCouponLoading] = React.useState(false);
  const [couponError, setCouponError] = React.useState('');
  const [couponSuccess, setCouponSuccess] = React.useState('');

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;

    setCouponLoading(true);
    setCouponError('');
    setCouponSuccess('');

    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponInput.trim(), subtotal }),
      });
      const data = await res.json();

      if (data.valid) {
        applyCoupon({
          code: data.code,
          discountAmount: data.discountAmount,
          discountType: data.discountType,
          message: data.message,
        });
        setCouponInput('');
        setCouponSuccess(data.message || `Coupon "${data.code}" applied!`);
      } else {
        setCouponError(data.message || 'Invalid coupon code');
      }
    } catch {
      setCouponError('Network error checking coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleQuickApply = async (code: string) => {
    setCouponInput(code);
    setCouponLoading(true);
    setCouponError('');
    setCouponSuccess('');
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal }),
      });
      const data = await res.json();
      if (data.valid) {
        applyCoupon({
          code: data.code,
          discountAmount: data.discountAmount,
          discountType: data.discountType,
          message: data.message,
        });
        setCouponInput('');
        setCouponSuccess(data.message || `Coupon "${data.code}" applied!`);
      } else {
        setCouponError(data.message || 'Coupon requirement not met');
      }
    } catch {
      setCouponError('Network error');
    } finally {
      setCouponLoading(false);
    }
  };

  const netSubtotal = Math.max(0, subtotal - discountAmount);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-slate-950">
              Shopping Cart
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Review your items and proceed with fast checkout • Cash on Delivery available
            </p>
          </div>
          {items.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs font-display font-bold text-red-600 hover:text-red-700 transition px-3 py-1.5 rounded-lg hover:bg-red-50"
            >
              Clear Cart
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 shadow-sm max-w-lg mx-auto">
            <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto text-slate-400 mb-4 shadow-inner">
              <ShoppingBag className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-display font-black text-slate-900 tracking-tight">Your cart is currently empty</h2>
            <p className="text-xs text-slate-500 mt-1.5 mb-6 max-w-sm mx-auto leading-relaxed">
              Explore authentic gadgets, trending fashion, and organic lifestyle picks at Toto Elite Mart.
            </p>
            <Link
              href="/shop"
              className="px-8 py-3.5 bg-gradient-to-r from-[#FF5E00] to-[#E64A19] hover:from-[#F4511E] hover:to-[#D84315] text-white font-display font-black uppercase text-xs tracking-wider rounded-xl shadow-lg shadow-orange-500/20 transition active:scale-98 inline-block"
            >
              Start Shopping Now
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <FreeDeliveryBar subtotal={subtotal} variant="page" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Items List */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm divide-y divide-slate-100">
              {items.map((item) => {
                const itemIdentifier = item.itemKey || item.id;
                return (
                  <div key={itemIdentifier} className="py-4 sm:py-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 group">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 shrink-0 shadow-2xs">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <Link href={`/product/${item.slug}`} className="hover:text-amber-600 transition">
                        <h3 className="font-display font-bold text-sm text-slate-900 truncate tracking-tight">
                          {item.name}
                        </h3>
                      </Link>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[11px] font-mono text-slate-400">SKU: {item.sku}</span>
                        {item.selectedColor && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                            Color: {item.selectedColor}
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-price font-black text-slate-950 mt-1">
                        {formatBDT(item.price)}
                      </div>
                    </div>

                    {/* Quantity & Item Total */}
                    <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto gap-3 sm:gap-4 pt-2 sm:pt-0 border-t border-slate-100 sm:border-0">
                      <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50/80 shadow-2xs">
                        <button
                          onClick={() => updateQuantity(itemIdentifier, item.quantity - 1)}
                          className="px-2.5 py-1.5 text-slate-600 hover:bg-slate-200/80 transition"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 py-1 text-xs font-price font-bold text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(itemIdentifier, item.quantity + 1)}
                          className="px-2.5 py-1.5 text-slate-600 hover:bg-slate-200/80 transition"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-sm sm:text-base font-price font-black text-slate-950 sm:min-w-[90px] text-right tracking-tight">
                        {formatBDT(item.price * item.quantity)}
                      </div>

                      <button
                        onClick={() => removeItem(itemIdentifier)}
                        className="text-slate-400 hover:text-red-600 p-1.5 transition rounded-lg hover:bg-red-50"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Summary Box */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm h-fit space-y-5">
              <h2 className="text-base font-display font-black text-slate-950 border-b border-slate-100 pb-3 tracking-tight">
                Order Summary
              </h2>

              {/* Coupon / Voucher Section */}
              <div className="space-y-2.5 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Tag className="w-3.5 h-3.5 text-amber-500" />
                  <span>Promo / Discount Voucher</span>
                </div>

                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 text-emerald-800 p-2.5 rounded-xl text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-mono font-bold tracking-wider">{appliedCoupon.code}</span>
                        <span className="text-[11px] text-emerald-600 ml-1.5 font-bold">
                          (-{formatBDT(discountAmount)})
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-emerald-100/50 transition"
                      title="Remove coupon"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <form onSubmit={handleApplyCoupon} className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Enter coupon code"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
                      />
                      <button
                        type="submit"
                        disabled={couponLoading || !couponInput.trim()}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-xl text-xs font-bold transition flex items-center gap-1"
                      >
                        {couponLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                        <span>Apply</span>
                      </button>
                    </form>

                    {/* Quick promo suggestion */}
                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Available Promo:</span>
                      <button
                        type="button"
                        onClick={() => handleQuickApply('WELCOME100')}
                        className="font-mono font-bold text-amber-600 hover:text-amber-700 underline underline-offset-2"
                      >
                        WELCOME100
                      </button>
                    </div>

                    {couponError && (
                      <p className="mt-1.5 text-[11px] text-red-600 font-semibold">{couponError}</p>
                    )}
                    {couponSuccess && (
                      <p className="mt-1.5 text-[11px] text-emerald-600 font-semibold">{couponSuccess}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Subtotal lines */}
              <div className="space-y-2.5 text-xs sm:text-sm">
                <div className="flex justify-between text-slate-600">
                  <span className="font-display font-medium">Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
                  <span className="font-price font-bold text-slate-950">{formatBDT(subtotal)}</span>
                </div>

                {appliedCoupon && discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold text-xs">
                    <span className="flex items-center gap-1">
                      <Ticket className="w-3.5 h-3.5" />
                      Coupon Discount ({appliedCoupon.code})
                    </span>
                    <span className="font-price font-bold">-{formatBDT(discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600 text-xs">
                  <span className="font-display font-medium">Estimated Delivery</span>
                  <span className="text-slate-500 font-medium">From ৳60 (Dhaka) / ৳120 (All BD)</span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <div className="flex justify-between items-baseline mb-4">
                  <span className="text-xs font-display font-bold uppercase tracking-wider text-slate-500">
                    Net Total (Excl. delivery)
                  </span>
                  <span className="text-2xl font-price font-black text-slate-950 tracking-tight">
                    {formatBDT(netSubtotal)}
                  </span>
                </div>

                <Link
                  href="/checkout"
                  className="w-full py-4 bg-gradient-to-r from-[#FF5E00] via-[#FF6A00] to-[#E64A19] hover:from-[#F4511E] hover:to-[#D84315] text-white font-display font-black uppercase text-xs sm:text-sm tracking-wider rounded-2xl text-center shadow-xl shadow-orange-500/25 flex items-center justify-center gap-2 transition active:scale-[0.99]"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <div className="mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 text-center space-y-1">
                  <p className="font-semibold text-slate-700">🔒 100% Safe & Secure Ordering</p>
                  <p>Cash on Delivery • bKash • Nagad Personal</p>
                </div>
              </div>
            </div>
          </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
