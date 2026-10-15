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
      {/* Curved Vibrant Top Banner — Matched to User Reference Screenshot */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#D7261E] via-[#E84E1C] to-[#D35400] rounded-3xl p-5 sm:p-7 md:p-8 text-white shadow-xl mb-6">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          {/* Left Title & Icon Section */}
          <div className="flex items-center gap-3.5 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white shrink-0 shadow-inner">
              <Flame className="w-7 h-7 sm:w-8 sm:h-8 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-tight">
                  {campaign.title || 'Flash Sale Discounts'}
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 bg-black/25 backdrop-blur-xs text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-white/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>Live Deal</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-red-100 font-medium mt-0.5 opacity-95">
                {campaign.subtitle || 'Limited stock discounts on selected customer favourites'}
              </p>
            </div>
          </div>

          {/* Right Section: Authoritative Countdown + View All Deals Button */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full md:w-auto justify-between md:justify-end">
            {/* Live Synchronized Countdown Timer */}
            <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/20 text-center select-none shadow-sm">
              <Clock className="w-4 h-4 text-amber-300 shrink-0 mr-1 hidden sm:block" />
              {days > 0 && (
                <>
                  <div className="min-w-[28px] sm:min-w-[32px]">
                    <span className="block font-price font-black text-xs sm:text-sm leading-none">{pad(days)}</span>
                    <span className="text-[8px] font-bold uppercase tracking-wider text-white/70">Days</span>
                  </div>
                  <span className="font-bold text-white/50 text-xs sm:text-sm">:</span>
                </>
              )}
              <div className="min-w-[28px] sm:min-w-[32px]">
                <span className="block font-price font-black text-xs sm:text-sm leading-none">{pad(hours)}</span>
                <span className="text-[8px] font-bold uppercase tracking-wider text-white/70">Hours</span>
              </div>
              <span className="font-bold text-white/50 text-xs sm:text-sm">:</span>
              <div className="min-w-[28px] sm:min-w-[32px]">
                <span className="block font-price font-black text-xs sm:text-sm leading-none">{pad(minutes)}</span>
                <span className="text-[8px] font-bold uppercase tracking-wider text-white/70">Min</span>
              </div>
              <span className="font-bold text-white/50 text-xs sm:text-sm">:</span>
              <div className="min-w-[28px] sm:min-w-[32px]">
                <span className="block font-price font-black text-xs sm:text-sm leading-none text-amber-300">
                  {pad(seconds)}
                </span>
                <span className="text-[8px] font-bold uppercase tracking-wider text-white/70">Sec</span>
              </div>
            </div>

            {/* View All Deals Pill Button */}
            <Link
              href="/flash-sale"
              className="bg-white text-slate-950 hover:bg-slate-100 px-5 sm:px-6 py-2.5 rounded-full font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 shrink-0 flex items-center gap-1.5"
            >
              <span>View All Deals</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
            </Link>
          </div>
        </div>

        {/* Ambient subtle glow */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
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
