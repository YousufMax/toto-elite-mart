'use client';

import React, { useState, useEffect } from 'react';
import { Truck, CheckCircle2, Sparkles } from 'lucide-react';
import { formatBDT } from '@/lib/currency';

interface FreeDeliveryBarProps {
  subtotal: number;
  variant?: 'drawer' | 'page' | 'checkout' | 'banner';
  customThreshold?: number;
  onUnlockedChange?: (unlocked: boolean) => void;
}

export default function FreeDeliveryBar({
  subtotal,
  variant = 'drawer',
  customThreshold,
  onUnlockedChange,
}: FreeDeliveryBarProps) {
  const [enabled, setEnabled] = useState(true);
  const [threshold, setThreshold] = useState(customThreshold || 1500);
  const [bannerText, setBannerText] = useState('Add ৳{remaining} more for FREE Delivery! 🚚');
  const [unlockedText, setUnlockedText] = useState('🎉 You have unlocked FREE Delivery!');
  const [barColor, setBarColor] = useState<'amber' | 'emerald' | 'indigo' | 'rose'>('amber');

  useEffect(() => {
    let isMounted = true;
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && data.settings) {
          if (data.settings.freeDeliveryEnabled !== undefined) setEnabled(data.settings.freeDeliveryEnabled);
          if (data.settings.freeDeliveryThreshold && !customThreshold) {
            setThreshold(Number(data.settings.freeDeliveryThreshold));
          }
          if (data.settings.freeDeliveryBannerText) setBannerText(data.settings.freeDeliveryBannerText);
          if (data.settings.freeDeliveryUnlockedText) setUnlockedText(data.settings.freeDeliveryUnlockedText);
          if (data.settings.freeDeliveryBarColor) setBarColor(data.settings.freeDeliveryBarColor);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [customThreshold]);

  if (!enabled || threshold <= 0) return null;

  const isUnlocked = subtotal >= threshold;
  const remaining = Math.max(0, threshold - subtotal);
  const percent = Math.min(100, Math.max(0, Math.round((subtotal / threshold) * 100)));

  // Format message text
  const message = isUnlocked
    ? unlockedText
    : bannerText.replace('{remaining}', formatBDT(remaining)).replace('{threshold}', formatBDT(threshold));

  if (variant === 'banner') {
    return (
      <div className={`px-3 py-1.5 text-center text-xs font-bold transition-all ${
        isUnlocked
          ? 'bg-emerald-600 text-white'
          : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-slate-950'
      }`}>
        <div className="flex items-center justify-center gap-2">
          {isUnlocked ? <Sparkles className="w-3.5 h-3.5" /> : <Truck className="w-3.5 h-3.5" />}
          <span>{message}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl transition-all duration-300 border ${
        isUnlocked
          ? 'bg-emerald-50/90 border-emerald-300/80 shadow-xs'
          : 'bg-amber-50/80 border-amber-200/90 shadow-2xs'
      } ${variant === 'drawer' ? 'p-3' : 'p-3.5 sm:p-4'}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
              isUnlocked ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-slate-950 font-black'
            }`}
          >
            {isUnlocked ? <CheckCircle2 className="w-4 h-4 stroke-[2.5]" /> : <Truck className="w-3.5 h-3.5" />}
          </div>
          <div className="text-xs font-bold truncate">
            {isUnlocked ? (
              <span className="text-emerald-800 font-black">{unlockedText}</span>
            ) : (
              <span className="text-slate-800">
                Add <b className="text-orange-600 font-price font-black">{formatBDT(remaining)}</b> more for <b className="text-slate-950">FREE Delivery!</b>
              </span>
            )}
          </div>
        </div>

        <span
          className={`text-[10px] font-black font-price px-2 py-0.5 rounded-full shrink-0 ${
            isUnlocked
              ? 'bg-emerald-200/80 text-emerald-900 border border-emerald-300'
              : 'bg-amber-200/80 text-amber-900 border border-amber-300'
          }`}
        >
          {isUnlocked ? 'FREE UNLOCKED' : `${percent}%`}
        </span>
      </div>

      {/* Progress Track */}
      <div className="relative w-full h-2.5 bg-black/10 rounded-full overflow-hidden p-0.5">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            isUnlocked
              ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm shadow-emerald-500/50'
              : barColor === 'emerald'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
              : barColor === 'indigo'
              ? 'bg-gradient-to-r from-indigo-500 to-violet-600'
              : barColor === 'rose'
              ? 'bg-gradient-to-r from-rose-500 to-red-600'
              : 'bg-gradient-to-r from-amber-500 to-orange-500'
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Milestone info */}
      <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold mt-1.5 px-0.5">
        <span>Cart: {formatBDT(subtotal)}</span>
        <span>Goal: {formatBDT(threshold)}</span>
      </div>
    </div>
  );
}
