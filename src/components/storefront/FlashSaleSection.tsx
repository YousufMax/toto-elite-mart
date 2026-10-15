'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Flame,
  Clock,
  Sparkles,
  ArrowRight,
  ShoppingBag,
  Zap,
  CheckCircle,
  PackageX,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { formatBDT } from '@/lib/currency';
import { useCart } from './CartContext';

interface FlashSaleItem {
  id: string;
  productId: string;
  flashPrice: number;
  originalPrice: number;
  allocatedStock: number;
  soldCount: number;
  remainingStock: number;
  isSoldOut: boolean;
  discountPercent: number;
  product: {
    id: string;
    name: string;
    slug: string;
    sku: string;
    sellingPrice: number;
    salePrice?: number | null;
    stockQuantity: number;
    images?: Array<{ url: string } | string>;
    colorVariants?: any[];
  };
}

interface FlashSaleCampaign {
  id: string;
  title: string;
  subtitle?: string | null;
  bannerUrl?: string | null;
  startDate: string;
  endDate: string;
  status: string;
  items: FlashSaleItem[];
}

export default function FlashSaleSection() {
  const router = useRouter();
  const { addItem, storeSettings } = useCart();

  const [campaign, setCampaign] = useState<FlashSaleCampaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);

  // Fetch active flash sale campaign from authoritative server API
  useEffect(() => {
    let isMounted = true;
    async function loadActiveCampaign() {
      try {
        const res = await fetch('/api/flash-sales/active');
        const data = await res.json();
        if (isMounted && data.success && data.active && data.campaign) {
          setCampaign(data.campaign);
          setSecondsRemaining(data.secondsRemaining || 0);
        } else if (isMounted) {
          setCampaign(null);
        }
      } catch {
        // silent fail
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadActiveCampaign();
    return () => {
      isMounted = false;
    };
  }, []);

  // Live Authoritative Countdown Ticker
  useEffect(() => {
    if (secondsRemaining <= 0) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsRemaining]);

  if (loading) {
    return null; // Smooth zero-flicker loading
  }

  if (!campaign || secondsRemaining <= 0 || !campaign.items || campaign.items.length === 0) {
    return null;
  }

  // Format countdown time
  const days = Math.floor(secondsRemaining / (3600 * 24));
  const hours = Math.floor((secondsRemaining % (3600 * 24)) / 3600);
  const minutes = Math.floor((secondsRemaining % 3600) / 60);
  const seconds = secondsRemaining % 60;

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Curved Vibrant Top Banner — Ultra-Premium Glassmorphic Design */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#D7261E] via-[#E84E1C] to-[#D35400] rounded-3xl p-5 sm:p-7 md:p-8 text-white shadow-2xl mb-8 border border-red-500/30">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Left Title & Flame Icon Section with Pulsing Radial Glow */}
          <div className="flex items-center gap-3.5 sm:gap-4">
            <div className="relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-tr from-amber-400 to-red-600 rounded-2xl shrink-0 shadow-xl shadow-red-950/40 ring-4 ring-white/20">
              <span className="absolute inset-0 rounded-2xl bg-amber-400/40 blur-md animate-pulse" />
              <Flame className="w-7 h-7 sm:w-8 sm:h-8 fill-white text-white drop-shadow relative z-10 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-tight text-white drop-shadow-sm">
                  {campaign.title || 'Flash Sale Discounts'}
                </h2>
                <span className="inline-flex items-center gap-1.5 bg-black/40 backdrop-blur-md text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full border border-white/25 shadow-inner">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                  </span>
                  <span className="tracking-wider text-emerald-300">Live Deal</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-red-100 font-medium mt-1 opacity-95">
                {campaign.subtitle || 'Limited stock discounts on selected customer favourites'}
              </p>
            </div>
          </div>

          {/* Right Section: World-Class Tabular Flip-Digit Countdown + View All Deals Button */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full md:w-auto justify-between md:justify-end">
            {/* World-Class Digit Cards */}
            <div className="flex items-center gap-1 sm:gap-1.5 select-none">
              <div className="flex items-center gap-1 sm:gap-1.5 bg-black/50 backdrop-blur-xl p-1.5 sm:p-2 rounded-2xl border border-white/20 shadow-2xl shadow-black/40">
                {days > 0 && (
                  <>
                    <div className="flex flex-col items-center justify-center bg-gradient-to-b from-white/20 to-white/5 border border-white/20 rounded-xl px-2.5 py-1 sm:px-3 sm:py-1.5 min-w-[42px] sm:min-w-[48px] shadow-inner">
                      <span className="font-mono font-black text-base sm:text-xl md:text-2xl text-white tracking-tight tabular-nums leading-none drop-shadow">
                        {pad(days)}
                      </span>
                      <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-white/80 mt-1">
                        Days
                      </span>
                    </div>
                    <span className="font-black text-amber-300 text-sm sm:text-lg animate-pulse px-0.5">:</span>
                  </>
                )}

                <div className="flex flex-col items-center justify-center bg-gradient-to-b from-white/20 to-white/5 border border-white/20 rounded-xl px-2.5 py-1 sm:px-3 sm:py-1.5 min-w-[42px] sm:min-w-[48px] shadow-inner">
                  <span className="font-mono font-black text-base sm:text-xl md:text-2xl text-white tracking-tight tabular-nums leading-none drop-shadow">
                    {pad(hours)}
                  </span>
                  <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-white/80 mt-1">
                    Hours
                  </span>
                </div>

                <span className="font-black text-amber-300 text-sm sm:text-lg animate-pulse px-0.5">:</span>

                <div className="flex flex-col items-center justify-center bg-gradient-to-b from-white/20 to-white/5 border border-white/20 rounded-xl px-2.5 py-1 sm:px-3 sm:py-1.5 min-w-[42px] sm:min-w-[48px] shadow-inner">
                  <span className="font-mono font-black text-base sm:text-xl md:text-2xl text-white tracking-tight tabular-nums leading-none drop-shadow">
                    {pad(minutes)}
                  </span>
                  <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-white/80 mt-1">
                    Mins
                  </span>
                </div>

                <span className="font-black text-amber-300 text-sm sm:text-lg animate-pulse px-0.5">:</span>

                {/* Fiery Seconds Box with Pulsing Glow */}
                <div className="flex flex-col items-center justify-center bg-gradient-to-b from-amber-500/30 to-red-500/20 border border-amber-400/50 rounded-xl px-2.5 py-1 sm:px-3 sm:py-1.5 min-w-[42px] sm:min-w-[48px] shadow-inner ring-1 ring-amber-400/40">
                  <span className="font-mono font-black text-base sm:text-xl md:text-2xl text-amber-300 tracking-tight tabular-nums leading-none drop-shadow animate-pulse">
                    {pad(seconds)}
                  </span>
                  <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-amber-200 mt-1">
                    Secs
                  </span>
                </div>
              </div>

              {/* View All Deals Pill Button */}
              <Link
                href="/flash-sale"
                className="group relative overflow-hidden bg-white hover:bg-slate-50 text-slate-950 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full font-black text-xs sm:text-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 shrink-0 flex items-center gap-1.5 border border-white/50"
              >
                <span>View All Deals</span>
                <ArrowRight className="w-4 h-4 text-slate-800 group-hover:translate-x-1.5 transition-transform duration-300" />
              </Link>
            </div>
          </div>
        </div>

        {/* Ambient subtle glow light streaks */}
        <div className="absolute -top-16 -right-16 w-60 h-60 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-60 h-60 bg-red-900/30 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Flash Sale Product Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-5 lg:gap-6">
        {campaign.items.map((item) => {
          const prod = item.product;
          if (!prod) return null;

          // Safe image URL extraction
          const rawImages =
            prod.images && prod.images.length > 0
              ? prod.images.map((img: any) => (typeof img === 'string' ? img : img?.url)).filter(Boolean)
              : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80'];
          const displayImage = rawImages[0];

          const isSoldOut = item.isSoldOut || item.remainingStock <= 0;
          const claimedPercent = Math.min(
            100,
            item.allocatedStock > 0 ? Math.round((item.soldCount / item.allocatedStock) * 100) : 0
          );

          const handleAddToCart = (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            if (isSoldOut) return;

            addItem({
              id: prod.id,
              name: prod.name,
              slug: prod.slug,
              sku: prod.sku,
              price: item.flashPrice,
              originalPrice: item.originalPrice,
              imageUrl: displayImage,
              stockQuantity: Math.min(item.remainingStock, prod.stockQuantity),
              isFlashSale: true,
              flashSalePrice: item.flashPrice,
              campaignId: campaign.id,
            } as any);
          };

          const handleBuyNow = (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            if (isSoldOut) return;

            addItem({
              id: prod.id,
              name: prod.name,
              slug: prod.slug,
              sku: prod.sku,
              price: item.flashPrice,
              originalPrice: item.originalPrice,
              imageUrl: displayImage,
              stockQuantity: Math.min(item.remainingStock, prod.stockQuantity),
              isFlashSale: true,
              flashSalePrice: item.flashPrice,
              campaignId: campaign.id,
            } as any);

            router.push('/checkout');
          };

          return (
            <div
              key={item.id || item.productId}
              className="group bg-white rounded-2xl border border-slate-200/80 hover:border-red-400 overflow-hidden flex flex-col justify-between shadow-2xs hover:shadow-xl transition-all duration-200"
            >
              {/* Top Media Container */}
              <div className="relative aspect-square w-full bg-slate-50 overflow-hidden">
                <Link href={`/product/${prod.slug || prod.id}`} className="block w-full h-full">
                  <img
                    src={displayImage}
                    alt={prod.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';
                    }}
                  />
                </Link>

                {/* Discount Badge */}
                {item.discountPercent > 0 && (
                  <div className="absolute top-2.5 left-2.5 z-10">
                    <span className="inline-flex items-center gap-1 bg-[#D7261E] text-white font-black text-[10px] sm:text-[11px] px-2.5 py-1 rounded-full shadow-md">
                      <Zap className="w-3 h-3 fill-white" />
                      <span>-{item.discountPercent}% OFF</span>
                    </span>
                  </div>
                )}

                {/* Photo Count Pill */}
                {rawImages.length > 1 && (
                  <div className="absolute top-2.5 right-2.5 z-10 pointer-events-none bg-slate-950/65 backdrop-blur-xs text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded-full shadow-2xs">
                    1/{rawImages.length}
                  </div>
                )}

                {/* Sold Out Overlay */}
                {isSoldOut && (
                  <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-2xs flex flex-col items-center justify-center text-white z-20 select-none">
                    <PackageX className="w-8 h-8 text-red-400 mb-1" />
                    <span className="font-black text-xs sm:text-sm tracking-wider uppercase">
                      Flash Deal Sold Out
                    </span>
                    <span className="text-[10px] text-slate-300">Allocated stock exhausted</span>
                  </div>
                )}
              </div>

              {/* Product Info & Stock Progress */}
              <div className="p-3.5 sm:p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <Link href={`/product/${prod.slug || prod.id}`}>
                    <h3 className="font-display font-bold text-xs sm:text-sm text-slate-900 group-hover:text-red-600 transition line-clamp-2 leading-snug">
                      {prod.name}
                    </h3>
                  </Link>

                  {/* Pricing Box */}
                  <div className="flex items-baseline gap-2 pt-0.5 flex-wrap">
                    <span className="font-price text-base sm:text-lg font-black text-red-600 tracking-tight">
                      {formatBDT(item.flashPrice)}
                    </span>
                    <span className="font-price text-xs text-slate-400 line-through">
                      {formatBDT(item.originalPrice)}
                    </span>
                  </div>

                  {/* Stock Availability Indicator Bar */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between items-center text-[10.5px] font-bold">
                      <span className="text-slate-600 flex items-center gap-1">
                        <Flame className="w-3 h-3 text-red-500 fill-red-500" />
                        <span>{isSoldOut ? 'Sold Out' : `${item.soldCount} Sold`}</span>
                      </span>
                      <span className={item.remainingStock <= 5 ? 'text-red-600' : 'text-slate-500'}>
                        {isSoldOut ? '0 Left' : `${item.remainingStock} Available`}
                      </span>
                    </div>

                    {/* Progress Fill */}
                    <div className="w-full h-1.5 sm:h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isSoldOut
                            ? 'bg-slate-300'
                            : claimedPercent >= 80
                            ? 'bg-gradient-to-r from-red-600 to-rose-600'
                            : 'bg-gradient-to-r from-amber-500 to-red-500'
                        }`}
                        style={{ width: `${claimedPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Dual Action Buttons */}
                <div className="grid grid-cols-2 gap-1.5 sm:gap-2 pt-2">
                  <button
                    type="button"
                    disabled={isSoldOut}
                    onClick={handleAddToCart}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold rounded-xl transition active:scale-95 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-1"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span className="truncate">Add to Bag</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSoldOut}
                    onClick={handleBuyNow}
                    className="w-full py-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-xs transition active:scale-95 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-1"
                  >
                    <Zap className="w-3.5 h-3.5 fill-white" />
                    <span className="truncate">Buy Now</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
