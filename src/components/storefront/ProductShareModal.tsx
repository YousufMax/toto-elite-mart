'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, Copy, Share2, ExternalLink } from 'lucide-react';
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
    <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal / Bottom Sheet Card */}
      <div
        className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 z-10"
        role="dialog"
        aria-modal="true"
        aria-label="Share this product"
      >
        {/* Mobile Swipe-down indicator */}
        <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto my-2.5 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-sm">Share Product</h3>
              <p className="text-[11px] text-slate-500">Spread the word with friends & family</p>
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

        {/* Content Body */}
        <div className="p-5 space-y-5">
          {/* Product Mini Preview Box */}
          <div className="flex items-center gap-3.5 p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-white border border-slate-200 shrink-0">
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

          {/* Social Platforms Grid */}
          <div>
            <span className="block text-[11px] font-bold text-slate-500 mb-3 uppercase tracking-wider">
              Share To Social Platforms
            </span>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
              {/* WhatsApp */}
              <button
                type="button"
                onClick={handleWhatsApp}
                className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-slate-50 transition group"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#25D366] text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.99.54 1.802.825 2.796.825 3.183 0 5.768-2.586 5.769-5.766 0-3.18-2.586-5.768-5.769-5.768zm4.49 8.219c-.19.53-1.09.98-1.51 1.02-.41.04-.92.05-2.8-0.69-2.31-.91-3.79-3.23-3.9-3.38-.11-.15-.94-1.25-.94-2.39 0-1.13.59-1.69.8-1.92.21-.23.46-.29.61-.29.15 0 .31 0 .44.01.14.01.32-.05.5.38.19.45.64 1.56.7 1.68.06.12.1.26.02.42-.08.16-.12.26-.24.4-.12.14-.25.31-.36.42-.12.12-.24.25-.1.49.14.24.62 1.02 1.33 1.65.91.81 1.68 1.06 1.92 1.18.24.12.38.1.52-.06.14-.16.61-.71.77-.95.16-.24.32-.2.53-.12.21.08 1.34.63 1.57.75.23.12.38.18.44.28.06.1.06.58-.13 1.11z" />
                  </svg>
                </div>
                <span className="text-[11px] font-semibold text-slate-700">WhatsApp</span>
              </button>

              {/* Facebook */}
              <button
                type="button"
                onClick={handleFacebook}
                className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-slate-50 transition group"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#1877F2] text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </div>
                <span className="text-[11px] font-semibold text-slate-700">Facebook</span>
              </button>

              {/* Messenger */}
              <button
                type="button"
                onClick={handleMessenger}
                className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-slate-50 transition group"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0084FF] via-[#00C6FF] to-[#0078FF] text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.082.3 2.23.464 3.443.464 6.627 0 12-4.975 12-11.111C24 4.974 18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26 6.559-6.963 3.13 3.259 5.889-3.259-6.56 6.963z" />
                  </svg>
                </div>
                <span className="text-[11px] font-semibold text-slate-700">Messenger</span>
              </button>

              {/* Telegram */}
              <button
                type="button"
                onClick={handleTelegram}
                className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-slate-50 transition group"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#229ED9] text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18.784-1.293 5.485-1.856 7.915-.238 1.028-.62 1.371-.986 1.405-.796.073-1.401-.527-2.172-1.033-1.206-.791-1.887-1.283-3.056-2.053-1.35-.89-.475-1.379.295-2.178.201-.209 3.7-3.39 3.768-3.68.009-.036.017-.17-.063-.241-.08-.071-.198-.047-.283-.028-.121.027-2.046 1.3-5.776 3.818-.546.375-1.04.558-1.482.548-.487-.01-1.424-.275-2.12-.501-.853-.277-1.532-.424-1.473-.895.031-.245.368-.496 1.011-.754 3.96-1.724 6.603-2.862 7.928-3.414 3.774-1.571 4.56-1.844 5.07-1.853.112-.002.364.026.527.158.138.112.176.262.194.368.018.106.04.34.022.525z" />
                  </svg>
                </div>
                <span className="text-[11px] font-semibold text-slate-700">Telegram</span>
              </button>

              {/* Instagram */}
              <button
                type="button"
                onClick={handleInstagram}
                className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-slate-50 transition group"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </div>
                <span className="text-[11px] font-semibold text-slate-700">Instagram</span>
              </button>

              {/* Native Share on Supported Devices */}
              {canNativeShare && (
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-slate-50 transition group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-700">More Apps</span>
                </button>
              )}
            </div>
          </div>

          {/* Copy Link Input Bar */}
          <div className="space-y-1.5">
            <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Or Copy Direct Link
            </span>
            <div className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-200 rounded-2xl focus-within:ring-2 focus-within:ring-amber-500 focus-within:bg-white transition">
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
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black shrink-0 transition active:scale-95 shadow-2xs ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Feedback Toast Banner */}
          {toastMessage && (
            <div className="p-3 bg-slate-900 text-white text-xs font-bold rounded-2xl flex items-center justify-between gap-2 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-150">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{toastMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setToastMessage(null)}
                className="text-slate-400 hover:text-white"
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
