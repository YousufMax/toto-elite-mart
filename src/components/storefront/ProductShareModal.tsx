'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, Copy, Share2 } from 'lucide-react';
import { formatBDT } from '@/lib/currency';

interface ProductShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    slug: string;
    sellingPrice: number;
    salePrice?: number | null;
    images?: Array<{ url: string } | string>;
    category?: { name: string };
  };
}

// 1. Official WhatsApp App Icon
function WhatsAppIcon({ className = 'w-full h-full' }: { className?: string }) {
  return (
    <svg viewBox="0 0 175.216 175.552" className={className}>
      <defs>
        <linearGradient id="wa-official-grad" x1="85.915" x2="86.535" y1="32.567" y2="137.092" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#57d163" />
          <stop offset="1" stopColor="#23b33a" />
        </linearGradient>
      </defs>
      {/* Outer White Border */}
      <path
        fill="#FFFFFF"
        d="m12.966 161.238 10.439-38.114a73.42 73.42 0 0 1-9.821-36.772c.017-40.556 33.021-73.55 73.578-73.55 19.681.01 38.154 7.669 52.047 21.572s21.537 32.383 21.53 52.037c-.018 40.553-33.027 73.553-73.578 73.553h-.032c-12.313-.005-24.412-3.094-35.159-8.954z"
      />
      {/* Green Circle Badge */}
      <path
        fill="url(#wa-official-grad)"
        d="M87.184 25.227c-33.733 0-61.166 27.423-61.178 61.13a60.98 60.98 0 0 0 9.349 32.535l1.455 2.313-6.179 22.558 23.146-6.069 2.235 1.324c9.387 5.571 20.15 8.517 31.126 8.523h.023c33.707 0 61.14-27.426 61.153-61.135a60.75 60.75 0 0 0-17.895-43.251 60.75 60.75 0 0 0-43.235-17.928z"
      />
      {/* White Phone Receiver inside */}
      <path
        fill="#FFFFFF"
        fillRule="evenodd"
        d="M68.772 55.603c-1.378-3.061-2.828-3.123-4.137-3.176l-3.524-.043c-1.226 0-3.218.46-4.902 2.3s-6.435 6.287-6.435 15.332 6.588 17.785 7.506 19.013 12.718 20.381 31.405 27.75c15.529 6.124 18.689 4.906 22.061 4.6s10.877-4.447 12.408-8.74 1.532-7.971 1.073-8.74-1.685-1.226-3.525-2.146-10.877-5.367-12.562-5.981-2.91-.919-4.137.921-4.746 5.979-5.819 7.206-2.144 1.381-3.984.462-7.76-2.861-14.784-9.124c-5.465-4.873-9.154-10.891-10.228-12.73s-.114-2.835.808-3.751c.825-.824 1.838-2.147 2.759-3.22s1.224-1.84 1.836-3.065.307-2.301-.153-3.22-4.032-10.011-5.666-13.647"
      />
    </svg>
  );
}

// 2. Official Facebook App Icon
function FacebookIcon({ className = 'w-full h-full' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className}>
      <defs>
        <linearGradient id="fb-official-grad" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#0062e0" />
          <stop offset="1%" stopColor="#19afff" />
        </linearGradient>
      </defs>
      <path
        fill="url(#fb-official-grad)"
        d="M16.7 39.8C7.2 38.1 0 29.9 0 20 0 9 9 0 20 0s20 9 20 20c0 9.9-7.2 18.1-16.7 19.8l-1.1-.9h-4.4l-1.1.9z"
      />
      <path
        fill="#FFFFFF"
        d="m27.8 25.6.9-5.6h-5.3v-3.9c0-1.6.6-2.8 3-2.8H29V8.2c-1.4-.2-3-.4-4.4-.4-4.6 0-7.8 2.8-7.8 7.8V20h-5v5.6h5v14.1c1.1.2 2.2.3 3.3.3 1.1 0 2.2-.1 3.3-.3V25.6h4.4z"
      />
    </svg>
  );
}

// 3. Official Messenger App Icon
function MessengerIcon({ className = 'w-full h-full' }: { className?: string }) {
  return (
    <svg viewBox="0 0 800 800" className={className}>
      <defs>
        <radialGradient id="msg-official-grad" cx="20%" cy="100%" r="100%">
          <stop offset="0%" stopColor="#0099ff" />
          <stop offset="60%" stopColor="#a033ff" />
          <stop offset="90%" stopColor="#ff5280" />
          <stop offset="100%" stopColor="#ff7061" />
        </radialGradient>
      </defs>
      <path
        fill="url(#msg-official-grad)"
        d="M400 0C174.7 0 0 165.1 0 388c0 116.6 47.8 217.4 125.6 287 6.5 5.8 10.5 14 10.7 22.8l2.2 71.2a32 32 0 0 0 44.9 28.3l79.4-35c6.7-3 14.3-3.5 21.4-1.6 36.5 10 75.3 15.4 115.8 15.4 225.3 0 400-165.1 400-388S625.3 0 400 0z"
      />
      <path
        fill="#FFFFFF"
        d="m159.8 501.5 117.5-186.4a60 60 0 0 1 86.8-16l93.5 70.1a24 24 0 0 0 28.9-.1l126.2-95.8c16.8-12.8 38.8 7.4 27.6 25.3L522.7 484.9a60 60 0 0 1-86.8 16l-93.5-70.1a24 24 0 0 0-28.9.1l-126.2 95.8c-16.8 12.8-38.8-7.3-27.5-25.2z"
      />
    </svg>
  );
}

// 4. Official Telegram App Icon
function TelegramIcon({ className = 'w-full h-full' }: { className?: string }) {
  return (
    <svg viewBox="0 0 496 512" className={className}>
      <defs>
        <linearGradient id="tg-official-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2AABEE" />
          <stop offset="100%" stopColor="#229ED9" />
        </linearGradient>
      </defs>
      <circle cx="248" cy="256" r="248" fill="url(#tg-official-grad)" />
      <path
        fill="#FFFFFF"
        d="M362.952,176.66c-3.732,39.215-19.881,134.378-28.1,178.3-3.476,18.584-10.322,24.816-16.948,25.425-14.4,1.326-25.338-9.517-39.287-18.661-21.827-14.308-34.158-23.215-55.346-37.177-24.485-16.135-8.612-25,5.342-39.5,3.652-3.793,67.107-61.51,68.335-66.746.153-.655.3-3.1-1.154-4.384s-3.59-.849-5.135-.5q-3.283.746-104.608,69.142-14.845,10.194-26.894,9.934c-8.855-.191-25.888-5.006-38.551-9.123-15.531-5.048-27.875-7.717-26.8-16.291q.84-6.7,18.45-13.7,108.446-47.248,144.628-62.3c68.872-28.647,83.183-33.623,92.511-33.789,2.052-.034,6.639.474,9.61,2.885a10.452,10.452,0,0,1,3.53,6.716A43.765,43.765,0,0,1,362.952,176.66Z"
      />
    </svg>
  );
}

// 5. Official Instagram App Icon
function InstagramIcon({ className = 'w-full h-full' }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className}>
      <defs>
        <radialGradient id="ig-official-grad" cx="20%" cy="115%" r="135%">
          <stop offset="0%" stopColor="#FFDC80" />
          <stop offset="10%" stopColor="#FCAF45" />
          <stop offset="30%" stopColor="#F77737" />
          <stop offset="50%" stopColor="#F56040" />
          <stop offset="65%" stopColor="#FD1D1D" />
          <stop offset="80%" stopColor="#E1306C" />
          <stop offset="90%" stopColor="#C13584" />
          <stop offset="100%" stopColor="#833AB4" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="512" height="512" rx="120" fill="url(#ig-official-grad)" />
      {/* Camera Outer Rounded Box */}
      <rect
        x="96"
        y="96"
        width="320"
        height="320"
        rx="80"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="38"
      />
      {/* Center Lens Circle */}
      <circle
        cx="256"
        cy="256"
        r="78"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="38"
      />
      {/* Flash Dot */}
      <circle cx="346" cy="166" r="22" fill="#FFFFFF" />
    </svg>
  );
}

// 6. Native Share / More Apps Icon
function MoreAppsIcon() {
  return (
    <div className="w-full h-full rounded-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white flex items-center justify-center shadow-sm">
      <Share2 className="w-5 h-5 sm:w-6 sm:h-6 text-white stroke-[2.2]" />
    </div>
  );
}

export default function ProductShareModal({
  isOpen,
  onClose,
  product,
}: ProductShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      setCanNativeShare(true);
    }
  }, []);

  // Listen for Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Resolve public product share URL
  const getShareUrl = () => {
    if (typeof window !== 'undefined') {
      const isLocalhost =
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';
      if (!isLocalhost) {
        return `${window.location.origin}/product/${product.slug}`;
      }
    }
    return `https://totoelitemart.com/product/${product.slug}`;
  };

  const shareUrl = getShareUrl();
  const currentPrice = Number(product.salePrice || product.sellingPrice || 0);
  const shareTitle = `${product.name} — Only ${formatBDT(currentPrice)} | Toto Elite Mart`;
  const shareText = `Check out ${product.name} on Toto Elite Mart! 100% Genuine with Cash on Delivery nationwide.`;

  // Primary image
  const primaryImage =
    (typeof product.images?.[0] === 'string'
      ? product.images[0]
      : product.images?.[0]?.url) ||
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Copy Link action
  const handleCopy = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        if (navigator.vibrate) {
          navigator.vibrate([30, 40, 30]);
        }
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      showToast('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      showToast('Failed to copy. Please select and copy manually.');
    }
  };

  // Platform Actions
  const handleWhatsApp = () => {
    const text = `${shareTitle}\n\n${shareUrl}`;
    window.open(
      `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const handleFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      '_blank',
      'width=620,height=580,noopener,noreferrer'
    );
  };

  const handleMessenger = () => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = `fb-messenger://share/?link=${encodeURIComponent(shareUrl)}`;
      setTimeout(() => {
        // Fallback if app doesn't open
        handleCopy();
        showToast('Link copied! Open Messenger to paste into your chat.');
      }, 1500);
    } else {
      // Desktop web dialog
      window.open(
        `https://www.facebook.com/dialog/send?link=${encodeURIComponent(shareUrl)}&app_id=291494419107518&redirect_uri=${encodeURIComponent(shareUrl)}`,
        '_blank',
        'width=620,height=580,noopener,noreferrer'
      );
    }
  };

  const handleTelegram = () => {
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const handleInstagram = async () => {
    if (canNativeShare) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch {
        // If user cancelled, fall through
      }
    }
    // Instagram doesn't support web direct links, so copy and guide user
    await handleCopy();
    showToast('Link copied! Paste into Instagram Stories or Direct Message.');
  };

  const handleNativeShare = async () => {
    if (canNativeShare) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // User cancelled or share dismissed
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[99999] overflow-y-auto bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Share this product"
    >
      {/* Click outside backdrop */}
      <div
        className="fixed inset-0 -z-10 bg-transparent"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal / Bottom Sheet Card */}
      <div
        className="relative bg-white w-full sm:max-w-md max-h-[92vh] sm:max-h-[88vh] rounded-t-[28px] sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-0 sm:my-auto transform transition-all animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Swipe-down indicator */}
        <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/60 shrink-0">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-sm tracking-tight leading-tight">Share Product</h3>
              <p className="text-[11px] text-slate-500 leading-tight">Share with friends on your favorite app</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
            aria-label="Close share dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto overscroll-contain">
          {/* Product Mini Preview Box */}
          <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-2xl border border-slate-200/80">
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-white border border-slate-200 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={primaryImage}
                alt={product.name}
                className="w-full h-full object-contain p-1"
              />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full inline-block mb-0.5">
                {product.category?.name || 'Toto Elite Mart'}
              </span>
              <h4 className="font-bold text-xs text-slate-900 truncate">
                {product.name}
              </h4>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm font-black text-slate-950 font-price">
                  {formatBDT(currentPrice)}
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                  ✓ Cash on Delivery
                </span>
              </div>
            </div>
          </div>

          {/* Social Platforms Grid - Exact 3 columns on mobile, 6 on desktop */}
          <div>
            <span className="block text-[11px] font-bold text-slate-500 mb-2.5 uppercase tracking-wider">
              Share To Social Platforms
            </span>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-2.5">
              {/* WhatsApp */}
              <button
                type="button"
                onClick={handleWhatsApp}
                className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-2xl hover:bg-slate-100/70 active:bg-slate-200/60 transition group cursor-pointer"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center shrink-0 group-hover:scale-105 active:scale-95 transition-transform duration-200 drop-shadow-sm">
                  <WhatsAppIcon />
                </div>
                <span className="text-[11px] sm:text-xs font-semibold text-slate-700 group-hover:text-slate-950 text-center tracking-tight">
                  WhatsApp
                </span>
              </button>

              {/* Facebook */}
              <button
                type="button"
                onClick={handleFacebook}
                className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-2xl hover:bg-slate-100/70 active:bg-slate-200/60 transition group cursor-pointer"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center shrink-0 group-hover:scale-105 active:scale-95 transition-transform duration-200 drop-shadow-sm">
                  <FacebookIcon />
                </div>
                <span className="text-[11px] sm:text-xs font-semibold text-slate-700 group-hover:text-slate-950 text-center tracking-tight">
                  Facebook
                </span>
              </button>

              {/* Messenger */}
              <button
                type="button"
                onClick={handleMessenger}
                className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-2xl hover:bg-slate-100/70 active:bg-slate-200/60 transition group cursor-pointer"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center shrink-0 group-hover:scale-105 active:scale-95 transition-transform duration-200 drop-shadow-sm">
                  <MessengerIcon />
                </div>
                <span className="text-[11px] sm:text-xs font-semibold text-slate-700 group-hover:text-slate-950 text-center tracking-tight">
                  Messenger
                </span>
              </button>

              {/* Telegram */}
              <button
                type="button"
                onClick={handleTelegram}
                className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-2xl hover:bg-slate-100/70 active:bg-slate-200/60 transition group cursor-pointer"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center shrink-0 group-hover:scale-105 active:scale-95 transition-transform duration-200 drop-shadow-sm">
                  <TelegramIcon />
                </div>
                <span className="text-[11px] sm:text-xs font-semibold text-slate-700 group-hover:text-slate-950 text-center tracking-tight">
                  Telegram
                </span>
              </button>

              {/* Instagram */}
              <button
                type="button"
                onClick={handleInstagram}
                className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-2xl hover:bg-slate-100/70 active:bg-slate-200/60 transition group cursor-pointer"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center shrink-0 group-hover:scale-105 active:scale-95 transition-transform duration-200 drop-shadow-sm">
                  <InstagramIcon />
                </div>
                <span className="text-[11px] sm:text-xs font-semibold text-slate-700 group-hover:text-slate-950 text-center tracking-tight">
                  Instagram
                </span>
              </button>

              {/* More Apps (Native Share) */}
              <button
                type="button"
                onClick={handleNativeShare}
                className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-2xl hover:bg-slate-100/70 active:bg-slate-200/60 transition group cursor-pointer"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center shrink-0 group-hover:scale-105 active:scale-95 transition-transform duration-200 drop-shadow-sm">
                  <MoreAppsIcon />
                </div>
                <span className="text-[11px] sm:text-xs font-semibold text-slate-700 group-hover:text-slate-950 text-center tracking-tight">
                  More Apps
                </span>
              </button>
            </div>
          </div>

          {/* Copy Link Input Bar */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Or Copy Direct Link
            </span>
            <div className="flex items-center gap-2 p-1 bg-slate-50 border border-slate-200 rounded-2xl focus-within:ring-2 focus-within:ring-amber-500 focus-within:bg-white transition">
              <input
                type="text"
                readOnly
                value={shareUrl}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                className="w-full bg-transparent px-3 py-1.5 text-xs font-mono text-slate-700 select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopy}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black shrink-0 transition active:scale-95 shadow-2xs ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Feedback Toast Banner */}
          {toastMessage && (
            <div className="p-3 bg-slate-900 text-white text-xs font-medium rounded-xl flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-150">
              <span>{toastMessage}</span>
              <button
                type="button"
                onClick={() => setToastMessage(null)}
                className="text-slate-400 hover:text-white ml-2"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
