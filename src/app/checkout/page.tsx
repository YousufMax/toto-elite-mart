'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/storefront/Header';
import Footer from '@/components/storefront/Footer';
import { useCart } from '@/components/storefront/CartContext';
import { formatBDT } from '@/lib/currency';
import {
  Truck,
  ShieldCheck,
  Tag,
  AlertCircle,
  Loader2,
  Lock,
  X,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';
import FreeDeliveryBar from '@/components/storefront/FreeDeliveryBar';

export default function CheckoutPage() {
  const router = useRouter();
  const {
    items,
    subtotal,
    clearCart,
    removeItem,
    appliedCoupon: cartCoupon,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('Dhaka');
  const [deliveryZone, setDeliveryZone] = useState<'Inside Dhaka' | 'Outside Dhaka'>('Inside Dhaka');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'BKASH' | 'NAGAD' | 'ROCKET'>('COD');
  const [notes, setNotes] = useState('');

  // Mobile Payment details
  const [senderNumber, setSenderNumber] = useState('');
  const [trxId, setTrxId] = useState('');
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);

  const copyToClipboard = (num: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(num);
      setCopiedNumber(num);
      setTimeout(() => setCopiedNumber(null), 2500);
    }
  };

  // Coupon state synced with CartContext
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
    discountType?: 'PERCENTAGE' | 'FIXED_BDT';
    message?: string;
  } | null>(cartCoupon || null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  useEffect(() => {
    if (cartCoupon && !appliedCoupon) {
      setAppliedCoupon(cartCoupon);
    }
  }, [cartCoupon]);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Free delivery settings from store
  const [storeSettings, setStoreSettings] = useState<{
    freeDeliveryEnabled: boolean;
    freeDeliveryThreshold: number;
  }>({ freeDeliveryEnabled: true, freeDeliveryThreshold: 1500 });

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings) {
          setStoreSettings({
            freeDeliveryEnabled: data.settings.freeDeliveryEnabled !== false,
            freeDeliveryThreshold: Number(data.settings.freeDeliveryThreshold) || 1500,
          });
        }
      })
      .catch(() => {});
  }, []);

  const isFreeDelivery = Boolean(
    storeSettings.freeDeliveryEnabled && subtotal >= storeSettings.freeDeliveryThreshold
  );
  const baseDeliveryFee = deliveryZone === 'Inside Dhaka' ? 60 : 120;
  const deliveryFee = isFreeDelivery ? 0 : baseDeliveryFee;
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const totalAmount = Math.max(0, subtotal - discountAmount + deliveryFee);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;

    setCouponLoading(true);
    setCouponError('');

    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponInput.trim(), subtotal }),
      });
      const data = await res.json();

      if (data.valid) {
        const coupObj = {
          code: data.code,
          discountAmount: data.discountAmount,
          discountType: data.discountType,
          message: data.message,
        };
        setAppliedCoupon(coupObj);
        applyCoupon(coupObj);
        setCouponInput('');
      } else {
        setCouponError(data.message || 'Invalid coupon code');
      }
    } catch {
      setCouponError('Network error checking coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    removeCoupon();
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMessage('');

    if (items.length === 0) {
      setErrorMessage('Your cart is empty. Please add items to checkout.');
      return;
    }

    if (!customerName.trim() || !customerPhone.trim() || !deliveryAddress.trim()) {
      setErrorMessage('Please fill in your name, mobile number, and delivery address.');
      return;
    }

    // BD Phone validation
    const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
    if (!/^01[3-9]\d{8}$/.test(cleanPhone)) {
      setErrorMessage('Please enter a valid 11-digit Bangladeshi mobile number (e.g., 01712345678).');
      return;
    }

    // Mobile Payment validation
    if (paymentMethod === 'BKASH') {
      if (!senderNumber.trim()) {
        setErrorMessage('দয়া করে আপনার প্রেরক বিকাশ নম্বরটি লিখুন।');
        return;
      }
      if (!trxId.trim()) {
        setErrorMessage('দয়া করে বিকাশ Transaction ID (TrxID) টি লিখুন।');
        return;
      }
    } else if (paymentMethod === 'NAGAD') {
      if (!senderNumber.trim()) {
        setErrorMessage('দয়া করে আপনার প্রেরক নগদ নম্বরটি লিখুন।');
        return;
      }
      if (!trxId.trim()) {
        setErrorMessage('দয়া করে নগদ Transaction ID (TrxID) টি লিখুন।');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Build clean notes including payment verification details
      let formattedNotes = notes.trim();
      if (paymentMethod === 'BKASH') {
        const payTag = `[bKash Payment] Sender: ${senderNumber.trim()} | TrxID: ${trxId.trim()} | Sent to: 01623363623 (Personal)`;
        formattedNotes = formattedNotes ? `${payTag} • Note: ${formattedNotes}` : payTag;
      } else if (paymentMethod === 'NAGAD') {
        const payTag = `[Nagad Payment] Sender: ${senderNumber.trim()} | TrxID: ${trxId.trim()} | Sent to: 01407752016 (Personal)`;
        formattedNotes = formattedNotes ? `${payTag} • Note: ${formattedNotes}` : payTag;
      }

      const orderPayload = {
        customerName: customerName.trim(),
        customerPhone: cleanPhone,
        deliveryAddress: deliveryAddress.trim(),
        deliveryCity: deliveryCity.trim(),
        deliveryZone,
        deliveryFee,
        paymentMethod,
        couponCode: appliedCoupon?.code,
        notes: formattedNotes || undefined,
        paymentSenderPhone: senderNumber.trim() || undefined,
        paymentTrxId: trxId.trim() || undefined,
        items: items.map((i) => ({
          productId: i.id,
          quantity: i.quantity,
          selectedColor: i.selectedColor,
          variantId: i.variantId,
        })),
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to place order');
      }

      // Success: Clear cart & navigate to order confirmation
      clearCart();
      router.push(`/order-confirmation/${data.orderNumber}`);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error placing order';
      setErrorMessage(errorMsg);
      setIsSubmitting(false);
    }
  };

  if (items.length === 0 && !isSubmitting) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />
        <main className="flex-1 max-w-lg mx-auto px-4 py-20 text-center">
          <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-xl font-display font-black text-slate-900 tracking-tight">Your Cart is Empty</h2>
            <p className="text-xs text-slate-500">Add products to your cart before proceeding to checkout.</p>
            <button
              onClick={() => router.push('/shop')}
              className="px-6 py-3 bg-gradient-to-r from-[#FF5E00] to-[#E64A19] hover:from-[#F4511E] hover:to-[#D84315] text-white font-display font-black uppercase text-xs tracking-wider rounded-xl transition shadow-md shadow-orange-500/20"
            >
              Browse Catalog
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-slate-950">
            Secure Checkout
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete your delivery details • Cash on Delivery & Mobile Banking supported • Fast dispatch
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-red-700 text-xs font-semibold shadow-sm animate-in fade-in">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
            {items.some((i) => errorMessage.includes(i.id) || errorMessage.includes(i.name)) && (
              <button
                type="button"
                onClick={() => {
                  const badItem = items.find((i) => errorMessage.includes(i.id) || errorMessage.includes(i.name));
                  if (badItem) {
                    removeItem(badItem.itemKey || badItem.id, badItem.selectedColor);
                    removeItem(badItem.id);
                  }
                  setErrorMessage('');
                }}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shrink-0 active:scale-95"
              >
                Remove Unavailable Item & Continue
              </button>
            )}
          </div>
        )}

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Delivery & Customer Info */}
          <div className="lg:col-span-7 space-y-6">
            {/* Customer Details */}
            <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <span>1. Customer & Delivery Address</span>
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Mohammad Yousuf Ali"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mobile Phone Number (11 Digits) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. 01712345678"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Our delivery rider will call this number before arrival.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Detailed Delivery Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="House / Flat #, Road #, Sector / Area name"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">District / City</label>
                    <input
                      type="text"
                      value={deliveryCity}
                      onChange={(e) => setDeliveryCity(e.target.value)}
                      placeholder="e.g. Dhaka, Chittagong, Sylhet"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Order Notes (Optional)</label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Deliver after 4 PM"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Zone Selection */}
            <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-500" />
                <span>2. Delivery Zone</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  onClick={() => setDeliveryZone('Inside Dhaka')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer flex items-center justify-between transition ${
                    deliveryZone === 'Inside Dhaka'
                      ? 'border-amber-500 bg-amber-50/30'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="font-bold text-sm text-slate-900">Inside Dhaka</div>
                    <div className="text-xs text-slate-500 mt-0.5">Delivery in 24-48 Hours</div>
                  </div>
                  <div className="text-sm font-black text-slate-950">৳60</div>
                </label>

                <label
                  onClick={() => setDeliveryZone('Outside Dhaka')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer flex items-center justify-between transition ${
                    deliveryZone === 'Outside Dhaka'
                      ? 'border-amber-500 bg-amber-50/30'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="font-bold text-sm text-slate-900">Outside Dhaka</div>
                    <div className="text-xs text-slate-500 mt-0.5">Delivery in 48-72 Hours</div>
                  </div>
                  <div className="text-sm font-black text-slate-950">৳120</div>
                </label>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>3. Payment Method</span>
                </h2>
                <span className="text-[11px] font-semibold text-slate-500">
                  নিরাপদ পেমেন্ট গ্যারান্টি
                </span>
              </div>

              <div className="space-y-3.5">
                {/* 1. Cash on Delivery (COD) - NO Recommended Badge */}
                <label
                  onClick={() => setPaymentMethod('COD')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer flex items-center gap-3.5 transition ${
                    paymentMethod === 'COD'
                      ? 'border-amber-500 bg-amber-50/40 ring-1 ring-amber-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      paymentMethod === 'COD' ? 'border-amber-500' : 'border-slate-300'
                    }`}
                  >
                    {paymentMethod === 'COD' && <div className="w-2.5 h-2.5 bg-amber-500 rounded-full" />}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <span>Cash on Delivery (COD)</span>
                      <span className="text-[11px] font-normal text-slate-500">ক্যাশ অন ডেলিভারি</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      পার্সেল হাতে পেয়ে চেক করে ডেলিভারিম্যানকে ক্যাশ টাকা পরিশোধ করুন।
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-1">
                    <img src="/images/payments/cod.svg" alt="Cash on Delivery" className="h-7 w-auto object-contain" />
                  </div>
                </label>

                {/* 2. bKash (বিকাশ) */}
                <div className="space-y-2">
                  <label
                    onClick={() => setPaymentMethod('BKASH')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer flex items-center gap-3.5 transition ${
                      paymentMethod === 'BKASH'
                        ? 'border-[#D12053] bg-pink-50/30 ring-1 ring-[#D12053]/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        paymentMethod === 'BKASH' ? 'border-[#D12053]' : 'border-slate-300'
                      }`}
                    >
                      {paymentMethod === 'BKASH' && <div className="w-2.5 h-2.5 bg-[#D12053] rounded-full" />}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                        <span className="text-[#D12053]">bKash (বিকাশ)</span>
                        <span className="text-[10px] bg-pink-100 text-[#D12053] font-bold px-2 py-0.5 rounded-full">
                          Send Money
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        বিকাশ পার্সোনাল নম্বরে সেন্ড মানি করুন (ইনস্ট্যান্ট কনফার্মেশন)।
                      </div>
                    </div>
                    <div className="h-8 px-2.5 rounded-lg bg-white border border-pink-200 flex items-center justify-center shrink-0 shadow-2xs">
                      <img src="/images/payments/bkash.svg" alt="bKash" className="h-5 w-auto object-contain" />
                    </div>
                  </label>

                  {/* bKash Dynamic Interactive Card (Reveals upon selection) */}
                  {paymentMethod === 'BKASH' && (
                    <div className="bg-pink-50/50 border border-pink-200 rounded-2xl p-4 sm:p-5 space-y-4 animate-in fade-in duration-200">
                      {/* Number Display with 1-Click Copy */}
                      <div className="bg-white p-3.5 rounded-xl border border-pink-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                        <div className="flex items-center gap-3">
                          <div className="h-10 px-3 rounded-xl border border-pink-200 bg-white flex items-center justify-center shrink-0 shadow-2xs">
                            <img
                              src="/images/payments/bkash.svg"
                              alt="bKash Official"
                              className="h-6 w-auto object-contain"
                            />
                          </div>
                          <div>
                            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                              বিকাশ পার্সোনাল নম্বর (Personal Account):
                            </div>
                            <div className="font-mono text-xl font-black text-[#D12053] tracking-wide mt-0.5">
                              01623363623
                            </div>
                            <div className="text-[11px] text-slate-500">
                              প্রদেয় টাকার পরিমাণ: <span className="font-bold text-slate-900 font-mono">{formatBDT(totalAmount)}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => copyToClipboard('01623363623')}
                          className="w-full sm:w-auto px-4 py-2 bg-[#D12053] hover:bg-[#b01743] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition shadow-xs"
                        >
                          {copiedNumber === '01623363623' ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>নম্বর কপি হয়েছে!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>নম্বর কপি করুন</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Instructions */}
                      <div className="text-xs text-slate-600 bg-white/70 p-3 rounded-xl border border-pink-100 space-y-1">
                        <div className="font-bold text-slate-900 text-[11px] uppercase tracking-wide text-pink-700">
                          পেমেন্ট করার নিয়মাবলী:
                        </div>
                        <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600">
                          <li>আপনার বিকাশ অ্যাপে গিয়ে <strong>Send Money</strong> অপশন নির্বাচন করুন।</li>
                          <li>প্রাপক নম্বর হিসেবে <strong className="font-mono text-slate-900">01623363623</strong> দিন।</li>
                          <li>মোট প্রদেয় টাকা <strong>{formatBDT(totalAmount)}</strong> সেন্ড মানি করুন।</li>
                          <li>টাকা পাঠানোর পর যে নম্বর থেকে পাঠিয়েছেন এবং TrxID নিচে লিখুন।</li>
                        </ol>
                      </div>

                      {/* Inputs for Customer Sender Phone and TrxID */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1">
                            আপনার বিকাশ নম্বর (Sender Number) <span className="text-pink-600">*</span>
                          </label>
                          <input
                            type="tel"
                            value={senderNumber}
                            onChange={(e) => setSenderNumber(e.target.value)}
                            placeholder="01XXXXXXXXX"
                            className="w-full px-3.5 py-2.5 bg-white border border-pink-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#D12053]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1">
                            ট্রানজেকশন আইডি (TrxID) <span className="text-pink-600">*</span>
                          </label>
                          <input
                            type="text"
                            value={trxId}
                            onChange={(e) => setTrxId(e.target.value.toUpperCase())}
                            placeholder="যেমন: BL8A92K1L"
                            className="w-full px-3.5 py-2.5 bg-white border border-pink-200 rounded-xl text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#D12053]"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Nagad (নগদ) */}
                <div className="space-y-2">
                  <label
                    onClick={() => setPaymentMethod('NAGAD')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer flex items-center gap-3.5 transition ${
                      paymentMethod === 'NAGAD'
                        ? 'border-[#EA1D25] bg-orange-50/30 ring-1 ring-[#EA1D25]/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        paymentMethod === 'NAGAD' ? 'border-[#EA1D25]' : 'border-slate-300'
                      }`}
                    >
                      {paymentMethod === 'NAGAD' && <div className="w-2.5 h-2.5 bg-[#EA1D25] rounded-full" />}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                        <span className="text-[#EA1D25]">Nagad (নগদ)</span>
                        <span className="text-[10px] bg-orange-100 text-[#EA1D25] font-bold px-2 py-0.5 rounded-full">
                          Send Money
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        নগদ পার্সোনাল নম্বরে সেন্ড মানি করুন (ইনস্ট্যান্ট কনফার্মেশন)।
                      </div>
                    </div>
                    <div className="h-8 px-2.5 rounded-lg bg-white border border-orange-200 flex items-center justify-center shrink-0 shadow-2xs">
                      <img src="/images/payments/nagad.svg" alt="Nagad" className="h-5 w-auto object-contain" />
                    </div>
                  </label>

                  {/* Nagad Dynamic Interactive Card (Reveals upon selection) */}
                  {paymentMethod === 'NAGAD' && (
                    <div className="bg-orange-50/50 border border-orange-200 rounded-2xl p-4 sm:p-5 space-y-4 animate-in fade-in duration-200">
                      {/* Number Display with 1-Click Copy */}
                      <div className="bg-white p-3.5 rounded-xl border border-orange-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                        <div className="flex items-center gap-3">
                          <div className="h-10 px-3 rounded-xl border border-orange-200 bg-white flex items-center justify-center shrink-0 shadow-2xs">
                            <img
                              src="/images/payments/nagad.svg"
                              alt="Nagad Official"
                              className="h-6 w-auto object-contain"
                            />
                          </div>
                          <div>
                            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                              নগদ পার্সোনাল নম্বর (Personal Account):
                            </div>
                            <div className="font-mono text-xl font-black text-[#EA1D25] tracking-wide mt-0.5">
                              01407752016
                            </div>
                            <div className="text-[11px] text-slate-500">
                              প্রদেয় টাকার পরিমাণ: <span className="font-bold text-slate-900 font-mono">{formatBDT(totalAmount)}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => copyToClipboard('01407752016')}
                          className="w-full sm:w-auto px-4 py-2 bg-[#EA1D25] hover:bg-[#c9141c] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition shadow-xs"
                        >
                          {copiedNumber === '01407752016' ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>নম্বর কপি হয়েছে!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>নম্বর কপি করুন</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Instructions */}
                      <div className="text-xs text-slate-600 bg-white/70 p-3 rounded-xl border border-orange-100 space-y-1">
                        <div className="font-bold text-slate-900 text-[11px] uppercase tracking-wide text-orange-700">
                          পেমেন্ট করার নিয়মাবলী:
                        </div>
                        <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600">
                          <li>আপনার নগদ অ্যাপে গিয়ে <strong>Send Money</strong> অপশন নির্বাচন করুন।</li>
                          <li>প্রাপক নম্বর হিসেবে <strong className="font-mono text-slate-900">01407752016</strong> দিন।</li>
                          <li>মোট প্রদেয় টাকা <strong>{formatBDT(totalAmount)}</strong> সেন্ড মানি করুন।</li>
                          <li>টাকা পাঠানোর পর যে নম্বর থেকে পাঠিয়েছেন এবং TrxID নিচে লিখুন।</li>
                        </ol>
                      </div>

                      {/* Inputs for Customer Sender Phone and TrxID */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1">
                            আপনার নগদ নম্বর (Sender Number) <span className="text-orange-600">*</span>
                          </label>
                          <input
                            type="tel"
                            value={senderNumber}
                            onChange={(e) => setSenderNumber(e.target.value)}
                            placeholder="01XXXXXXXXX"
                            className="w-full px-3.5 py-2.5 bg-white border border-orange-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#EA1D25]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1">
                            ট্রানজেকশন আইডি (TrxID) <span className="text-orange-600">*</span>
                          </label>
                          <input
                            type="text"
                            value={trxId}
                            onChange={(e) => setTrxId(e.target.value.toUpperCase())}
                            placeholder="যেমন: NG9823415"
                            className="w-full px-3.5 py-2.5 bg-white border border-orange-200 rounded-xl text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#EA1D25]"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Placement */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
              <h2 className="text-base font-display font-black text-slate-900 border-b border-slate-100 pb-3 tracking-tight">
                Order Review ({items.length} {items.length === 1 ? 'item' : 'items'})
              </h2>

              {/* Items Preview */}
              <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto pr-1">
                {items.map((item) => {
                  const itemIdentifier = item.itemKey || item.id;
                  return (
                    <div key={itemIdentifier} className="py-2.5 flex items-center justify-between text-xs group">
                      <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
                        <span className="font-price font-bold text-slate-900 shrink-0">{item.quantity}×</span>
                        <div className="min-w-0 truncate">
                          <span className="font-display font-medium text-slate-800">{item.name}</span>
                          {item.selectedColor ? (
                            <span className="ml-1.5 inline-block text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                              {item.selectedColor}
                            </span>
                          ) : (
                            <span className="ml-1.5 inline-block text-[10px] font-medium text-slate-500 bg-slate-50 px-1.5 py-0.2 rounded border border-slate-200/60">
                              Standard
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-price font-bold text-slate-950">{formatBDT(item.price * item.quantity)}</span>
                        <button
                          type="button"
                          onClick={() => removeItem(itemIdentifier)}
                          title={`Remove ${item.name}`}
                          className="text-slate-400 hover:text-red-600 transition p-0.5 rounded"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Coupon Code Section */}
              <div className="border-t border-slate-100 pt-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="Coupon Code (e.g. WELCOME100)"
                      className="w-full pl-9 pr-3 py-2 text-xs uppercase font-mono font-bold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponInput.trim()}
                    className="px-4 py-2 bg-slate-950 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-xl text-xs font-display font-bold uppercase tracking-wider transition"
                  >
                    {couponLoading ? '...' : 'Apply'}
                  </button>
                </div>

                {!appliedCoupon && (
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Available Promo:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setCouponInput('WELCOME100');
                      }}
                      className="font-mono font-bold text-amber-600 hover:text-amber-700 underline underline-offset-2"
                    >
                      WELCOME100
                    </button>
                  </div>
                )}

                {appliedCoupon && (
                  <div className="mt-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl flex items-center justify-between border border-emerald-200">
                    <span className="font-mono">
                      Coupon &quot;{appliedCoupon.code}&quot; applied: -{formatBDT(appliedCoupon.discountAmount)}
                    </span>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-slate-400 hover:text-red-600 p-0.5 rounded transition"
                      title="Remove coupon"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {couponError && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{couponError}</p>
                )}
              </div>

              {/* Free Delivery Bar in Checkout */}
              <FreeDeliveryBar subtotal={subtotal} variant="checkout" />

              {/* Calculation Breakdown */}
              <div className="border-t border-slate-100 pt-4 space-y-2.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="font-display font-medium">Subtotal</span>
                  <span className="font-price font-bold text-slate-900">{formatBDT(subtotal)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span className="font-display">Coupon Discount</span>
                    <span className="font-price">-{formatBDT(discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="font-display font-medium">Delivery Charge ({deliveryZone})</span>
                  {isFreeDelivery ? (
                    <div className="flex items-center gap-1.5 font-price font-bold text-emerald-600">
                      <span className="line-through text-slate-400 text-[11px]">{formatBDT(baseDeliveryFee)}</span>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded-md font-black">
                        FREE ৳0
                      </span>
                    </div>
                  ) : (
                    <span className="font-price font-bold text-slate-900">{formatBDT(deliveryFee)}</span>
                  )}
                </div>

                <div className="border-t border-slate-200 pt-3 flex justify-between items-baseline">
                  <span className="text-xs font-display font-bold uppercase tracking-wider text-slate-500">Payable Total</span>
                  <span className="text-2xl sm:text-3xl font-price font-black text-amber-600 tracking-tight">{formatBDT(totalAmount)}</span>
                </div>
              </div>

              {/* Place Order CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-gradient-to-r from-[#FF5E00] via-[#FF6A00] to-[#E64A19] hover:from-[#F4511E] hover:to-[#D84315] disabled:bg-slate-300 text-white font-display font-black uppercase text-xs sm:text-sm tracking-wider rounded-2xl shadow-xl shadow-orange-500/25 flex items-center justify-center gap-2 transition active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing Order...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Confirm Order • {formatBDT(totalAmount)}</span>
                  </>
                )}
              </button>

              <div className="text-[11px] text-slate-400 text-center space-y-1">
                <p>By placing this order you agree to our Terms of Service.</p>
                <p>You can track delivery status instantly with your mobile number.</p>
              </div>
            </div>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}
