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
  Check,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  CheckCircle2,
  Package,
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
  const paymentMethod = 'COD'; // Cash on Delivery only
  const [notes, setNotes] = useState('');

  // Mobile order summary accordion state
  const [isMobileSummaryOpen, setIsMobileSummaryOpen] = useState(false);

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

  // Phase 3: Reward Points State
  const [rewardData, setRewardData] = useState<{
    enabled: boolean;
    points: number;
    equivalentBdt: number;
    canRedeem: boolean;
    minRedeemPoints: number;
    pointValueBdt: number;
  } | null>(null);
  const [useRewards, setUseRewards] = useState(false);
  const [rewardLoading, setRewardLoading] = useState(false);

  // Phase 3: Fraud Security Notice State
  const [fraudRiskNotice, setFraudRiskNotice] = useState<string | null>(null);
  const [requiresAdvanceFee, setRequiresAdvanceFee] = useState(false);

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

  // Fetch Reward Points and Fraud Check when Phone reaches 11 digits
  useEffect(() => {
    const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.length === 11 && /^01[3-9]\d{8}$/.test(cleanPhone)) {
      setRewardLoading(true);
      fetch(`/api/rewards?phone=${cleanPhone}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.enabled) {
            setRewardData(data);
          } else {
            setRewardData(null);
            setUseRewards(false);
          }
        })
        .catch(() => {})
        .finally(() => setRewardLoading(false));

      fetch('/api/fraud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check',
          phone: cleanPhone,
          address: deliveryAddress,
          subtotal,
          totalAmount: subtotal + (deliveryZone === 'Inside Dhaka' ? 60 : 120),
          paymentMethod,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.evaluation) {
            if (data.evaluation.isBlacklisted) {
              setFraudRiskNotice('Sorry, this phone number is restricted. Please contact customer support.');
            } else if (data.evaluation.requiresAdvanceFee) {
              setRequiresAdvanceFee(true);
              setFraudRiskNotice(
                `Security Notice: Due to parcel history, an advance courier confirmation fee of ৳${data.evaluation.advanceFeeAmount} is required to ship this parcel.`
              );
            } else {
              setRequiresAdvanceFee(false);
              setFraudRiskNotice(null);
            }
          }
        })
        .catch(() => {});
    } else {
      setRewardData(null);
      setUseRewards(false);
      setFraudRiskNotice(null);
      setRequiresAdvanceFee(false);
    }
  }, [customerPhone, subtotal, deliveryAddress, deliveryZone]);

  const isFreeDelivery = Boolean(
    storeSettings.freeDeliveryEnabled && subtotal >= storeSettings.freeDeliveryThreshold
  );
  const baseDeliveryFee = deliveryZone === 'Inside Dhaka' ? 60 : 120;
  const deliveryFee = isFreeDelivery ? 0 : baseDeliveryFee;
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;

  // Reward points discount calculation
  const maxPossibleRewardDiscount = Math.max(0, subtotal - discountAmount);
  const rewardDiscount = useRewards && rewardData && rewardData.points > 0
    ? Math.min(rewardData.equivalentBdt, maxPossibleRewardDiscount)
    : 0;
  const rewardPointsRedeemed = rewardDiscount > 0 && rewardData
    ? Math.ceil(rewardDiscount / (rewardData.pointValueBdt || 1))
    : 0;

  const totalAmount = Math.max(0, subtotal - discountAmount - rewardDiscount + deliveryFee);

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

    setIsSubmitting(true);

    try {
      const orderPayload = {
        customerName: customerName.trim(),
        customerPhone: cleanPhone,
        deliveryAddress: deliveryAddress.trim(),
        deliveryCity: deliveryCity.trim(),
        deliveryZone,
        deliveryFee,
        paymentMethod: 'COD',
        couponCode: appliedCoupon?.code,
        notes: notes.trim() || undefined,
        rewardPointsRedeemed: useRewards ? rewardPointsRedeemed : 0,
        rewardDiscount: useRewards ? rewardDiscount : 0,
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
    <div className="min-h-screen flex flex-col bg-slate-50 overflow-x-hidden">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-10 w-full pb-32 lg:pb-12">
        {/* Page Header */}
        <div className="mb-4 sm:mb-8">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-black tracking-tight text-slate-950">
              Secure Checkout
            </h1>
            <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>100% Verified</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Complete your delivery details • Cash on Delivery (ক্যাশ অন ডেলিভারি) • Fast dispatch
          </p>
        </div>

        {/* Global Error Banner */}
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

        {/* ===================== MOBILE ORDER SUMMARY ACCORDION (< lg) ===================== */}
        <div className="lg:hidden mb-5">
          <button
            type="button"
            onClick={() => setIsMobileSummaryOpen(!isMobileSummaryOpen)}
            className="w-full bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between text-left transition active:bg-slate-50"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span>Order Summary</span>
                  <span className="text-[11px] font-semibold text-slate-500">
                    ({items.length} {items.length === 1 ? 'item' : 'items'})
                  </span>
                </div>
                <div className="text-[11px] text-amber-600 font-bold flex items-center gap-1">
                  <span>{isMobileSummaryOpen ? 'Hide details' : 'Show details & promo'}</span>
                  {isMobileSummaryOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-400 font-medium">Total Payable</div>
              <div className="font-price font-black text-base text-slate-950">{formatBDT(totalAmount)}</div>
            </div>
          </button>

          {/* Collapsible Content */}
          {isMobileSummaryOpen && (
            <div className="mt-2 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Items List */}
              <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto pr-1">
                {items.map((item) => {
                  const itemIdentifier = item.itemKey || item.id;
                  return (
                    <div key={itemIdentifier} className="py-2.5 flex items-center justify-between text-xs gap-3">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            width={40}
                            height={40}
                            loading="lazy"
                            decoding="async"
                            className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0 bg-slate-50"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-400">
                            <Package className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-slate-900 truncate">{item.name}</div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                            <span className="font-bold text-slate-700">{item.quantity}×</span>
                            <span>{formatBDT(item.price)}</span>
                            {item.selectedColor && (
                              <span className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded text-[10px] border border-slate-200">
                                {item.selectedColor}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-price font-bold text-slate-950">{formatBDT(item.price * item.quantity)}</span>
                        <button
                          type="button"
                          onClick={() => removeItem(itemIdentifier)}
                          className="p-1 text-slate-400 hover:text-red-600 transition"
                          title="Remove item"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Coupon input */}
              <div className="pt-2 border-t border-slate-100">
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
                    className="px-4 py-2 bg-slate-950 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition"
                  >
                    {couponLoading ? '...' : 'Apply'}
                  </button>
                </div>

                {!appliedCoupon && (
                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Available Promo:</span>
                    <button
                      type="button"
                      onClick={() => setCouponInput('WELCOME100')}
                      className="font-mono font-bold text-amber-600 underline"
                    >
                      WELCOME100
                    </button>
                  </div>
                )}

                {appliedCoupon && (
                  <div className="mt-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl flex items-center justify-between border border-emerald-200">
                    <span className="font-mono">
                      Coupon &quot;{appliedCoupon.code}&quot;: -{formatBDT(appliedCoupon.discountAmount)}
                    </span>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-slate-400 hover:text-red-600 p-0.5 rounded"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Free delivery bar */}
              <FreeDeliveryBar subtotal={subtotal} variant="checkout" />

              {/* Cost Breakdown */}
              <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-900">{formatBDT(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Coupon Discount</span>
                    <span>-{formatBDT(discountAmount)}</span>
                  </div>
                )}
                {useRewards && rewardDiscount > 0 && (
                  <div className="flex justify-between text-amber-600 font-bold">
                    <span>Loyalty Cashback</span>
                    <span>-{formatBDT(rewardDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span>Delivery ({deliveryZone})</span>
                  {isFreeDelivery ? (
                    <span className="font-bold text-emerald-600">FREE ৳0</span>
                  ) : (
                    <span className="font-bold text-slate-900">{formatBDT(deliveryFee)}</span>
                  )}
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline font-bold">
                  <span className="text-slate-900">Total Payable</span>
                  <span className="text-lg font-black text-amber-600">{formatBDT(totalAmount)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Grid: Form + Desktop Sidebar */}
        <form id="checkout-form" onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Left Column: Customer Details, Delivery Zone, Cash on Delivery */}
          <div className="lg:col-span-7 space-y-5 sm:space-y-6">
            {/* 1. Customer & Delivery Address */}
            <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">
                    1
                  </span>
                  <span>Customer & Delivery Address</span>
                </span>
                <span className="text-[11px] font-normal text-slate-400">কাস্টমার তথ্য</span>
              </h2>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Name (আপনার নাম) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    autoComplete="name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Mohammad Yousuf Ali"
                    className="w-full px-3.5 sm:px-4 py-3 rounded-xl border border-slate-300 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mobile Phone Number (মোবাইল নম্বর - ১১ ডিজিট) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. 01712345678"
                    className="w-full px-3.5 sm:px-4 py-3 rounded-xl border border-slate-300 text-sm sm:text-base font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    ডেলিভারিম্যান আপনার এই নম্বরে কল করে পার্সেল পৌঁছে দেবেন।
                  </p>

                  {/* Fraud Alert Notice if detected */}
                  {fraudRiskNotice && (
                    <div className="mt-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div className="leading-relaxed font-medium">
                        <span className="font-bold">Security Notice: </span>
                        {fraudRiskNotice}
                      </div>
                    </div>
                  )}

                  {/* Reward Points Cashback Redemption Widget */}
                  {rewardLoading && (
                    <div className="mt-2 text-xs text-amber-600 flex items-center gap-1.5 font-medium">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Checking Elite Loyalty Points...</span>
                    </div>
                  )}

                  {rewardData && rewardData.points > 0 && !rewardLoading && (
                    <div className="mt-2.5 p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500 text-white font-black text-lg flex items-center justify-center shrink-0 shadow-sm">
                          🪙
                        </div>
                        <div>
                          <div className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                            <span>Elite Loyalty Cashback</span>
                            <span className="bg-amber-200 text-amber-900 text-[10px] px-1.5 py-0.2 rounded font-bold">
                              {rewardData.points} Points Available
                            </span>
                          </div>
                          <div className="text-[11px] text-amber-800 mt-0.5">
                            Worth {formatBDT(rewardData.equivalentBdt)} BDT discount on your purchases.
                          </div>
                        </div>
                      </div>

                      {rewardData.canRedeem ? (
                        <button
                          type="button"
                          onClick={() => setUseRewards(!useRewards)}
                          className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0 shadow-xs active:scale-95 ${
                            useRewards
                              ? 'bg-amber-600 hover:bg-amber-700 text-white'
                              : 'bg-white hover:bg-amber-100 text-amber-900 border border-amber-300'
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{useRewards ? `Applied (-${formatBDT(rewardDiscount)})` : 'Redeem Points'}</span>
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100/70 px-2 py-1 rounded-lg shrink-0 text-center">
                          Min {rewardData.minRedeemPoints} pts needed
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Detailed Delivery Address (সম্পূর্ণ ঠিকানা) <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    autoComplete="street-address"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="House / Flat #, Road #, Sector / Village / Thana name"
                    className="w-full px-3.5 sm:px-4 py-3 rounded-xl border border-slate-300 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      District / City (জেলা / শহর)
                    </label>
                    <input
                      type="text"
                      value={deliveryCity}
                      onChange={(e) => setDeliveryCity(e.target.value)}
                      placeholder="e.g. Dhaka, Chittagong, Sylhet"
                      className="w-full px-3.5 sm:px-4 py-3 rounded-xl border border-slate-300 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Order Notes (ঐচ্ছিক নোট)
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Deliver after 4 PM"
                      className="w-full px-3.5 sm:px-4 py-3 rounded-xl border border-slate-300 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Delivery Zone Selection */}
            <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">
                    2
                  </span>
                  <Truck className="w-4 h-4 text-amber-500" />
                  <span>Delivery Zone (ডেলিভারি এলাকা)</span>
                </span>
                <span className="text-[11px] font-normal text-slate-400">এলাকা সিলেক্ট করুন</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  onClick={() => setDeliveryZone('Inside Dhaka')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer flex items-center justify-between transition active:scale-[0.99] ${
                    deliveryZone === 'Inside Dhaka'
                      ? 'border-amber-500 bg-amber-50/40 ring-1 ring-amber-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        deliveryZone === 'Inside Dhaka' ? 'border-amber-500' : 'border-slate-300'
                      }`}
                    >
                      {deliveryZone === 'Inside Dhaka' && <div className="w-2.5 h-2.5 bg-amber-500 rounded-full" />}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-900">Inside Dhaka</div>
                      <div className="text-xs text-slate-500 mt-0.5">ঢাকা সিটির ভিতরে (24-48 Hours)</div>
                    </div>
                  </div>
                  <div className="text-sm font-black text-slate-950 font-price">
                    {isFreeDelivery ? <span className="text-emerald-600">FREE</span> : '৳60'}
                  </div>
                </label>

                <label
                  onClick={() => setDeliveryZone('Outside Dhaka')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer flex items-center justify-between transition active:scale-[0.99] ${
                    deliveryZone === 'Outside Dhaka'
                      ? 'border-amber-500 bg-amber-50/40 ring-1 ring-amber-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        deliveryZone === 'Outside Dhaka' ? 'border-amber-500' : 'border-slate-300'
                      }`}
                    >
                      {deliveryZone === 'Outside Dhaka' && <div className="w-2.5 h-2.5 bg-amber-500 rounded-full" />}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-900">Outside Dhaka</div>
                      <div className="text-xs text-slate-500 mt-0.5">ঢাকা সিটির বাইরে (48-72 Hours)</div>
                    </div>
                  </div>
                  <div className="text-sm font-black text-slate-950 font-price">
                    {isFreeDelivery ? <span className="text-emerald-600">FREE</span> : '৳120'}
                  </div>
                </label>
              </div>
            </div>

            {/* 3. Payment Method: CASH ON DELIVERY ONLY */}
            <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">
                    3
                  </span>
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Payment Method (পেমেন্ট পদ্ধতি)</span>
                </h2>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60 flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>১০০% নিরাপদ ডেলিভারি</span>
                </span>
              </div>

              {/* Dedicated Cash on Delivery (COD) Card */}
              <div className="p-4 sm:p-5 rounded-2xl border-2 border-amber-500 bg-amber-50/40 ring-1 ring-amber-500/20 shadow-xs space-y-3.5">
                <div className="flex items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-5 h-5 rounded-full border-2 border-amber-500 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                      <div className="w-2.5 h-2.5 bg-amber-500 rounded-full" />
                    </div>
                    <div>
                      <div className="font-bold text-sm sm:text-base text-slate-900 flex flex-wrap items-center gap-2">
                        <span>Cash on Delivery (COD)</span>
                        <span className="text-[10px] sm:text-xs font-bold text-amber-900 bg-amber-100/90 px-2 py-0.5 rounded-md">
                          ক্যাশ অন ডেলিভারি
                        </span>
                      </div>
                      <div className="text-xs sm:text-[13px] text-slate-600 mt-1 leading-relaxed">
                        পার্সেল হাতে পেয়ে সম্পূর্ণ চেক করে ডেলিভারিম্যানকে ক্যাশ টাকা পরিশোধ করুন। কোনো অগ্রিম পেমেন্টের প্রয়োজন নেই।
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 hidden sm:flex items-center justify-center p-2 bg-white rounded-xl border border-amber-200/70 shadow-2xs">
                    <img src="/images/payments/cod.svg" alt="Cash on Delivery" className="h-8 w-auto object-contain" />
                  </div>
                </div>

                {/* Trust Benefits */}
                <div className="pt-2.5 border-t border-amber-200/60 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-700">
                  <div className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>কোনো অগ্রিম পেমেন্ট নেই</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>দেখে চেক করে রিসিভ</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>দ্রুততম হোম ডেলিভারি</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Order Review (Desktop / Tablet) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-sm space-y-6 lg:sticky lg:top-24">
              <h2 className="text-base font-display font-black text-slate-900 border-b border-slate-100 pb-3 tracking-tight flex items-center justify-between">
                <span>Order Review ({items.length} {items.length === 1 ? 'item' : 'items'})</span>
                <span className="text-xs font-normal text-slate-400">অর্ডার বিবরণ</span>
              </h2>

              {/* Items Preview */}
              <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto pr-1">
                {items.map((item) => {
                  const itemIdentifier = item.itemKey || item.id;
                  return (
                    <div key={itemIdentifier} className="py-2.5 flex items-center justify-between text-xs group gap-2">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            width={40}
                            height={40}
                            loading="lazy"
                            decoding="async"
                            className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0 bg-slate-50"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-400">
                            <Package className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="font-display font-medium text-slate-800 truncate">{item.name}</div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                            <span className="font-price font-bold text-slate-700">{item.quantity}×</span>
                            <span>{formatBDT(item.price)}</span>
                            {item.selectedColor ? (
                              <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                                {item.selectedColor}
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-1.5 py-0.2 rounded border border-slate-200/60">
                                Standard
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-price font-bold text-slate-950">{formatBDT(item.price * item.quantity)}</span>
                        <button
                          type="button"
                          onClick={() => removeItem(itemIdentifier)}
                          title={`Remove ${item.name}`}
                          className="text-slate-400 hover:text-red-600 transition p-1 rounded"
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
                      className="w-full pl-9 pr-3 py-2.5 text-xs uppercase font-mono font-bold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponInput.trim()}
                    className="px-4 py-2.5 bg-slate-950 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-xl text-xs font-display font-bold uppercase tracking-wider transition active:scale-95"
                  >
                    {couponLoading ? '...' : 'Apply'}
                  </button>
                </div>

                {!appliedCoupon && (
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Available Promo:</span>
                    <button
                      type="button"
                      onClick={() => setCouponInput('WELCOME100')}
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

                {useRewards && rewardDiscount > 0 && (
                  <div className="flex justify-between text-amber-600 font-bold">
                    <span className="font-display flex items-center gap-1">
                      <span>🪙</span>
                      <span>Elite Loyalty Discount</span>
                    </span>
                    <span className="font-price">-{formatBDT(rewardDiscount)}</span>
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
                  <span className="text-xs font-display font-bold uppercase tracking-wider text-slate-500">
                    Payable Total
                  </span>
                  <span className="text-2xl sm:text-3xl font-price font-black text-amber-600 tracking-tight">
                    {formatBDT(totalAmount)}
                  </span>
                </div>
              </div>

              {/* Desktop Place Order CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-gradient-to-r from-[#FF5E00] via-[#FF6A00] to-[#E64A19] hover:from-[#F4511E] hover:to-[#D84315] disabled:bg-slate-300 text-white font-display font-black uppercase text-xs sm:text-sm tracking-wider rounded-2xl shadow-xl shadow-orange-500/25 flex items-center justify-center gap-2 transition active:scale-[0.99] cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing Order...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Confirm Order (ক্যাশ অন ডেলিভারি) • {formatBDT(totalAmount)}</span>
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

      {/* ===================== MOBILE STICKY BOTTOM CHECKOUT BAR (< lg) ===================== */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-4 py-3 shadow-[0_-8px_25px_rgba(0,0,0,0.08)]">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          <div className="shrink-0">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Payable (ক্যাশ অন ডেলিভারি)
            </div>
            <div className="font-price font-black text-xl text-amber-600 leading-tight">
              {formatBDT(totalAmount)}
            </div>
          </div>

          <button
            type="submit"
            form="checkout-form"
            disabled={isSubmitting}
            className="flex-1 py-3.5 bg-gradient-to-r from-[#FF5E00] to-[#E64A19] hover:from-[#F4511E] hover:to-[#D84315] disabled:bg-slate-300 text-white font-display font-black uppercase text-xs tracking-wider rounded-xl shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>Confirm Order</span>
              </>
            )}
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
