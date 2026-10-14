'use client';

import React from 'react';
import Link from 'next/link';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Ticket } from 'lucide-react';
import { useCart } from './CartContext';
import { formatBDT } from '@/lib/currency';
import FreeDeliveryBar from './FreeDeliveryBar';

export default function CartDrawer() {
  const {
    items,
    isDrawerOpen,
    setIsDrawerOpen,
    removeItem,
    updateQuantity,
    subtotal,
    itemCount,
    appliedCoupon,
    discountAmount,
  } = useCart();

  if (!isDrawerOpen) return null;

  const netSubtotal = Math.max(0, subtotal - discountAmount);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => setIsDrawerOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-full sm:max-w-md bg-white shadow-2xl flex flex-col h-full max-h-screen">
          {/* Header */}
          <div className="px-4 sm:px-6 py-4 sm:py-5 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-4 h-4 text-amber-400" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-display font-black tracking-tight text-white flex items-center gap-2 truncate">
                  <span>Shopping Bag</span>
                  <span className="text-xs font-bold font-price px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 shrink-0">
                    {itemCount}
                  </span>
                </h2>
                <p className="text-[10px] sm:text-[11px] text-slate-400 tracking-tight truncate">Toto Elite Mart • Guaranteed Authentic</p>
              </div>
            </div>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition shrink-0"
              aria-label="Close cart drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Delivery Progress Bar */}
          {items.length > 0 && (
            <div className="px-4 sm:px-6 pt-3 pb-1 bg-white shrink-0 border-b border-slate-100">
              <FreeDeliveryBar subtotal={subtotal} variant="drawer" />
            </div>
          )}

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-2 divide-y divide-slate-100">
            {items.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-4 shadow-inner">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-base font-display font-bold text-slate-900 tracking-tight">Your shopping bag is empty</h3>
                <p className="text-xs text-slate-500 mt-1 mb-6 max-w-xs leading-relaxed">
                  Explore our curated catalog of authentic gadgets, premium fashion, and lifestyle picks.
                </p>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="px-6 py-3 bg-gradient-to-r from-[#FF5E00] to-[#E64A19] hover:from-[#F4511E] hover:to-[#D84315] text-white font-display font-black rounded-xl text-xs uppercase tracking-wider shadow-md shadow-orange-500/20 transition active:scale-98"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              items.map((item) => {
                const itemIdentifier = item.itemKey || item.id;
                return (
                  <div key={itemIdentifier} className="py-3 sm:py-4 flex gap-3 sm:gap-4 items-center group">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 relative rounded-xl overflow-hidden border border-slate-200/80 shrink-0 bg-slate-50 shadow-2xs">
                      <img
                        src={item.imageUrl || '/placeholder.png'}
                        alt={item.name}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs sm:text-sm font-display font-bold text-slate-900 truncate tracking-tight group-hover:text-amber-600 transition">
                        {item.name}
                      </h4>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] sm:text-[11px] font-mono text-slate-400">SKU: {item.sku}</span>
                        {item.selectedColor && (
                          <span className="inline-flex items-center px-2 py-0.2 rounded-md text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                            Color: {item.selectedColor}
                          </span>
                        )}
                      </div>
                      <div className="text-xs sm:text-sm font-price font-black text-slate-950 tracking-tight">
                        {formatBDT(item.price)}
                      </div>

                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50/80 shadow-2xs">
                          <button
                            onClick={() => updateQuantity(itemIdentifier, item.quantity - 1)}
                            className="p-1 sm:p-1.5 hover:bg-slate-200/80 text-slate-600 transition"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                          </button>
                          <span className="px-2.5 sm:px-3 py-0.5 text-xs font-price font-bold text-slate-900">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(itemIdentifier, item.quantity + 1)}
                            className="p-1 sm:p-1.5 hover:bg-slate-200/80 text-slate-600 transition"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeItem(itemIdentifier)}
                          className="text-slate-400 hover:text-red-600 p-1.5 transition rounded-lg hover:bg-red-50"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer & Checkout */}
          {items.length > 0 && (
            <div className="p-4 sm:p-6 bg-slate-50/90 border-t border-slate-200/80 space-y-3 sm:space-y-4 shrink-0">
              <div className="space-y-1.5">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="font-display font-medium text-slate-500">
                    Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})
                  </span>
                  <span className="font-price font-bold text-slate-800">
                    {formatBDT(subtotal)}
                  </span>
                </div>

                {appliedCoupon && discountAmount > 0 && (
                  <div className="flex justify-between items-baseline text-xs text-emerald-600 font-semibold">
                    <span className="flex items-center gap-1 font-display">
                      <Ticket className="w-3.5 h-3.5" />
                      Coupon ({appliedCoupon.code})
                    </span>
                    <span className="font-price font-bold">
                      -{formatBDT(discountAmount)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-baseline pt-1 border-t border-slate-200/60">
                  <span className="text-xs font-display font-black uppercase tracking-wider text-slate-900">
                    Net Total
                  </span>
                  <span className="text-lg sm:text-xl font-price font-black text-slate-950 tracking-tight">
                    {formatBDT(netSubtotal)}
                  </span>
                </div>
              </div>

              <div className="p-2 sm:p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10.5px] sm:text-[11px] text-amber-900 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="truncate">Cash on Delivery available inside & outside Dhaka.</span>
              </div>

              <div className="flex flex-col gap-2 pt-0.5">
                <Link
                  href="/checkout"
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-[#FF5E00] via-[#FF6A00] to-[#E64A19] hover:from-[#F4511E] hover:to-[#D84315] text-white font-display font-black uppercase text-xs sm:text-sm tracking-wider rounded-2xl text-center shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition active:scale-[0.99]"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-full py-2 text-xs font-display font-bold text-slate-500 hover:text-slate-900 text-center uppercase tracking-wider transition"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
