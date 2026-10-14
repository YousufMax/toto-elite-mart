'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Truck,
  RefreshCw,
  Lock,
  Award,
  PhoneCall,
  Clock,
  MapPin,
  CheckCircle2,
  Send,
  CreditCard,
  MessageCircle,
} from 'lucide-react';

export default function Footer() {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setSubscribed(true);
      setTimeout(() => {
        setNewsletterEmail('');
      }, 3500);
    }
  };

  return (
    <footer className="bg-white text-slate-700 text-xs border-t border-slate-200 mt-20 select-none">
      {/* 1. VIP Club & Deals Newsletter Strip (World-Class Clean Luxury Dark Bar) */}
      <div className="bg-slate-950 text-white border-b border-slate-800/90 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                Toto Elite Members Club
              </span>
              <span className="text-[11px] text-slate-300">৳100 Welcome Voucher</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Get Exclusive Offers & New Arrival Alerts
            </h3>
            <p className="text-xs text-slate-400">
              Subscribe to receive weekly secret vouchers, fresh organic harvest updates, and gadget releases.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubscribe} className="w-full lg:w-auto flex items-center gap-2 max-w-md">
            <div className="relative flex-1">
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 text-white rounded-xl text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm shrink-0 active:scale-95"
            >
              {subscribed ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>Subscribed</span>
                </>
              ) : (
                <>
                  <span>Subscribe</span>
                  <Send className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* 2. Four Core Value Pillars (Handcrafted, Unified & Professional - No Cheap Pastels) */}
      <div className="bg-slate-50/70 border-b border-slate-200/80 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Pillar 1: Cash on Delivery */}
          <div className="flex items-start gap-3.5 p-3 rounded-2xl hover:bg-white transition duration-200">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-center text-slate-900 shrink-0">
              <CreditCard className="w-5 h-5 text-slate-800" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                Cash on Delivery (COD)
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Pay comfortably after inspecting your parcel anywhere in 64 districts.
              </p>
            </div>
          </div>

          {/* Pillar 2: 100% Authentic Quality */}
          <div className="flex items-start gap-3.5 p-3 rounded-2xl hover:bg-white transition duration-200">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-center text-slate-900 shrink-0">
              <ShieldCheck className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                100% Authentic Guaranteed
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Direct brand sourcing with pure Sundarban honey & lab-tested goods.
              </p>
            </div>
          </div>

          {/* Pillar 3: Fast Nationwide Delivery */}
          <div className="flex items-start gap-3.5 p-3 rounded-2xl hover:bg-white transition duration-200">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-center text-slate-900 shrink-0">
              <Truck className="w-5 h-5 text-slate-800" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                Fast Doorstep Delivery
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                24-48 hours inside Dhaka, 48-72 hours across all districts nationwide.
              </p>
            </div>
          </div>

          {/* Pillar 4: 7-Day Easy Exchange */}
          <div className="flex items-start gap-3.5 p-3 rounded-2xl hover:bg-white transition duration-200">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-center text-slate-900 shrink-0">
              <RefreshCw className="w-5 h-5 text-slate-800" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                7 Days Easy Replacement
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Hassle-free exchange & customer friendly refund support guarantee.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Multi-Column E-Commerce Architecture (Clean Professional Hierarchy) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 sm:gap-10 text-slate-600">
          {/* Column 1 & 2: Brand Information & Concierge Hotline */}
          <div className="lg:col-span-2 space-y-4">
            {/* Brand Logo & Company Name (Exact Match with Header Logo) */}
            <Link href="/" className="inline-flex items-center gap-2 sm:gap-2.5 shrink-0 group">
              <img
                src="https://cdn.jsdelivr.net/gh/YousufMax/image-server-001@main/toto%20elite%20mart%20logo%20final%20(1).png"
                alt="TOTO ELITE MART"
                height={44}
                style={{ maxHeight: '48px', width: 'auto' }}
                className="h-10 sm:h-11 w-auto object-contain shrink-0 transition-transform duration-200 group-hover:scale-102"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement | null;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              {/* Fallback Symbol Mark */}
              <div className="hidden w-10 h-10 bg-red-600 rounded-xl items-center justify-center text-white font-black text-xl shadow-md shrink-0">
                T
              </div>
              {/* Professional Mart Typography (Exact Header Match) */}
              <div className="flex flex-col justify-center leading-none select-none">
                <div className="flex items-center gap-1 sm:gap-1.5 font-brand">
                  <span className="text-lg sm:text-xl md:text-2xl font-black text-slate-950 uppercase tracking-tighter">
                    TOTO
                  </span>
                  <span className="text-lg sm:text-xl md:text-2xl font-black text-red-600 uppercase tracking-tighter">
                    ELITE
                  </span>
                  <span className="bg-slate-950 text-white font-black text-[10px] sm:text-[11px] md:text-xs px-2 py-0.5 rounded-md tracking-wider uppercase shadow-xs">
                    MART
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[8px] sm:text-[9px] md:text-[9.5px] font-black uppercase tracking-[0.22em] text-slate-400">
                    ONLINE SHOPPING
                  </span>
                  <span className="inline-block w-1 h-1 rounded-full bg-slate-300" />
                  <span className="inline-block text-[8px] sm:text-[8.5px] font-bold text-slate-500 uppercase tracking-wider">
                    PREMIER MART
                  </span>
                </div>
              </div>
            </Link>

            <p className="text-xs text-slate-500 leading-relaxed pr-3">
              Premier lifestyle, smart gadgets, and 100% pure organic food destination in Bangladesh. Delivering genuine quality to all 64 districts with Cash on Delivery convenience.
            </p>

            {/* Concierge & Customer Care Widget */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">
                  Customer Concierge
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  Live Support
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <a
                  href="tel:01623363623"
                  className="font-mono text-base sm:text-lg font-black text-slate-950 hover:text-amber-600 transition flex items-center gap-1.5"
                >
                  <PhoneCall className="w-4 h-4 text-amber-500" />
                  <span>01623363623</span>
                </a>
                <span className="text-slate-300">|</span>
                <a
                  href="https://wa.me/8801623363623"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-2xs"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              </div>

              <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>9:00 AM – 11:00 PM</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span>Dhaka, Bangladesh</span>
                </div>
              </div>
            </div>
          </div>

          {/* Column 3: Shop Categories */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Shop Categories
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href="/shop?category=smart-gadgets"
                  className="hover:text-amber-600 transition inline-block text-slate-600"
                >
                  Smart Gadgets & Audio
                </Link>
              </li>
              <li>
                <Link
                  href="/shop?category=fashion-lifestyle"
                  className="hover:text-amber-600 transition inline-block text-slate-600"
                >
                  Fashion & Lifestyle
                </Link>
              </li>
              <li>
                <Link
                  href="/shop?category=organic-food"
                  className="hover:text-amber-600 transition inline-block text-slate-600"
                >
                  100% Pure Organic Food
                </Link>
              </li>
              <li>
                <Link
                  href="/shop?category=home-kitchen"
                  className="hover:text-amber-600 transition inline-block text-slate-600"
                >
                  Home & Kitchen Living
                </Link>
              </li>
              <li>
                <Link
                  href="/shop?sort=newest"
                  className="hover:text-amber-600 transition inline-block text-slate-600"
                >
                  New In Stock
                </Link>
              </li>
              <li>
                <Link
                  href="/shop?sort=popular"
                  className="hover:text-amber-600 transition inline-block text-amber-600 font-semibold"
                >
                  Flash Deals & Offers
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Customer Support */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Customer Support
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href="/track-order"
                  className="hover:text-amber-600 transition inline-block text-slate-600"
                >
                  Track Your Order
                </Link>
              </li>
              <li>
                <Link
                  href="/policies/refund"
                  className="hover:text-amber-600 transition inline-block text-slate-600"
                >
                  Return & Exchange Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/policies/terms"
                  className="hover:text-amber-600 transition inline-block text-slate-600"
                >
                  Shipping & Delivery Info
                </Link>
              </li>
              <li>
                <Link
                  href="/checkout"
                  className="hover:text-amber-600 transition inline-block text-slate-600"
                >
                  Cash on Delivery Guide
                </Link>
              </li>
              <li>
                <Link
                  href="/checkout"
                  className="hover:text-amber-600 transition inline-block text-slate-600"
                >
                  bKash & Nagad Payment Guide
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-amber-600 transition inline-block text-slate-600"
                >
                  Help Center & FAQs
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 5: About Toto Elite */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              About Toto Elite
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href="/about"
                  className="hover:text-amber-600 transition inline-block text-slate-600"
                >
                  Our Brand Story
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="hover:text-amber-600 transition inline-block text-slate-600"
                >
                  Authenticity Promise
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="hover:text-amber-600 transition inline-block text-slate-600"
                >
                  Sundarban Honey Purity
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="hover:text-amber-600 transition inline-block text-slate-600"
                >
                  Quality Testing Standards
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-amber-600 transition inline-block text-slate-600"
                >
                  Corporate Gifts & Bulk Orders
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-amber-600 transition inline-block text-slate-600"
                >
                  Contact Our Team
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 6: Policies & Social Media */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Policies & Connect
            </h4>
            <ul className="space-y-2 text-xs mb-3">
              <li>
                <Link
                  href="/policies/terms"
                  className="hover:text-amber-600 transition inline-block text-slate-600"
                >
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link
                  href="/policies/privacy"
                  className="hover:text-amber-600 transition inline-block text-slate-600"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/policies/refund"
                  className="hover:text-amber-600 transition inline-block text-slate-600"
                >
                  Refund & Cancellation
                </Link>
              </li>
            </ul>

            <div className="pt-2">
              <span className="text-[11px] font-bold text-slate-900 block mb-2">
                Official Channels
              </span>
              {/* Branded Social Icons row */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Facebook */}
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Facebook"
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-[#1877F2] text-slate-600 hover:text-white flex items-center justify-center transition border border-slate-200 shadow-2xs hover:scale-105"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>

                {/* WhatsApp */}
                <a
                  href="https://wa.me/8801623363623"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="WhatsApp"
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-[#25D366] text-slate-600 hover:text-white flex items-center justify-center transition border border-slate-200 shadow-2xs hover:scale-105"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                  </svg>
                </a>

                {/* Instagram */}
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Instagram"
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-gradient-to-tr hover:from-amber-500 hover:via-pink-500 hover:to-purple-600 text-slate-600 hover:text-white flex items-center justify-center transition border border-slate-200 shadow-2xs hover:scale-105"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>

                {/* YouTube */}
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="YouTube"
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-[#FF0000] text-slate-600 hover:text-white flex items-center justify-center transition border border-slate-200 shadow-2xs hover:scale-105"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>

                {/* LinkedIn */}
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="LinkedIn"
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-[#0A66C2] text-slate-600 hover:text-white flex items-center justify-center transition border border-slate-200 shadow-2xs hover:scale-105"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Trust Badges & Bangladesh Payment Methods Row (Clean Structured Bottom Bar) */}
      <div className="border-t border-slate-200 bg-slate-50/70 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col xl:flex-row items-center justify-between gap-6">
            {/* Left: Security & Trust Seals */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
              {/* ID Check Badge */}
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
                <div className="flex -space-x-1">
                  <div className="w-3.5 h-3.5 rounded-full bg-[#EB001B] opacity-90" />
                  <div className="w-3.5 h-3.5 rounded-full bg-[#F79E1B] opacity-90" />
                </div>
                <span className="text-[10px] font-black text-slate-800 tracking-tight">ID Check</span>
              </div>

              {/* PCI DSS Badge */}
              <div className="flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
                <div className="px-1 py-0.5 rounded bg-emerald-700 text-[8px] font-black text-white leading-none">
                  PCI
                </div>
                <span className="text-[10px] font-black text-slate-800 tracking-tight">DSS Compliant</span>
              </div>

              {/* SSL 256-Bit Badge */}
              <div className="flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-2xs text-emerald-700">
                <Lock className="w-3 h-3 text-emerald-600" />
                <span className="text-[10px] font-black text-slate-800 tracking-tight">SSL 256-BIT</span>
              </div>

              {/* Verisign / Verified */}
              <div className="flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
                <div className="w-3.5 h-3.5 rounded-full bg-sky-600 flex items-center justify-center text-white text-[8px] font-bold">
                  ✓
                </div>
                <span className="text-[10px] font-black text-slate-800 tracking-wider">VERISIGN</span>
              </div>

              {/* Visa Secure */}
              <div className="flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-black text-[#1A1F71] italic">VISA</span>
                <span className="text-[9px] font-bold text-slate-600">SECURE</span>
              </div>

              {/* 100% Protection */}
              <div className="flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-2xs text-amber-600">
                <Award className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black text-slate-800">100% Protected</span>
              </div>
            </div>

            {/* Vertical divider for large screens */}
            <div className="hidden xl:block h-6 w-px bg-slate-300" />

            {/* Right: Bangladesh & Global Payment Method Badges (Standardized Official Size) */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
              {[
                { name: 'bKash', src: '/images/payments/bkash.svg', alt: 'bKash Official Logo', hover: 'hover:border-[#E2126E]' },
                { name: 'Nagad', src: '/images/payments/nagad.svg', alt: 'Nagad Official Logo', hover: 'hover:border-[#EA1D25]' },
                { name: 'DBBL Rocket', src: '/images/payments/rocket.svg', alt: 'DBBL Rocket Official Logo', hover: 'hover:border-[#8C3392]' },
                { name: 'Upay', src: '/images/payments/upay.svg', alt: 'Upay Official Logo', hover: 'hover:border-[#0D56A6]' },
                { name: 'Cash on Delivery', src: '/images/payments/cod.svg', alt: 'Cash on Delivery Official', hover: 'hover:border-emerald-500' },
                { name: 'VISA', src: '/images/payments/visa.svg', alt: 'VISA Official', hover: 'hover:border-blue-600' },
                { name: 'Mastercard', src: '/images/payments/mastercard.svg', alt: 'Mastercard Official', hover: 'hover:border-red-500' },
                { name: 'American Express', src: '/images/payments/amex.svg', alt: 'American Express (AMEX)', hover: 'hover:border-sky-700' },
                { name: 'PayPal', src: '/images/payments/paypal.svg', alt: 'PayPal Official', hover: 'hover:border-blue-700' },
                { name: 'Apple Pay', src: '/images/payments/apple-pay.svg', alt: 'Apple Pay Official', hover: 'hover:border-slate-800' },
                { name: 'Google Pay', src: '/images/payments/google-pay.svg', alt: 'Google Pay Official', hover: 'hover:border-blue-500' },
                { name: 'UnionPay', src: '/images/payments/unionpay.svg', alt: 'UnionPay Official', hover: 'hover:border-red-600' },
                { name: 'Bank T/T', src: '/images/payments/bank-transfer.svg', alt: 'Bank Wire Transfer (T/T)', hover: 'hover:border-slate-700' },
              ].map((badge) => (
                <div
                  key={badge.name}
                  title={badge.name}
                  className={`w-[52px] sm:w-[60px] h-[30px] sm:h-[34px] bg-white rounded-md border border-slate-200/90 shadow-2xs ${badge.hover} hover:shadow-xs flex items-center justify-center p-1 sm:p-1.5 overflow-hidden transition-all shrink-0`}
                >
                  <img
                    src={badge.src}
                    alt={badge.alt}
                    className="max-h-full max-w-full w-auto h-auto object-contain select-none"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Copyright & Country Statement */}
      <div className="bg-slate-100/80 border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span className="font-semibold text-slate-700">Bangladesh Official Flagship Store</span>
            <span className="text-slate-400">|</span>
            <span>English • ৳ BDT • Nationwide 64 Districts Transit</span>
          </div>
          <p>© {new Date().getFullYear()} TOTO ELITE MART. All rights reserved. World-Class E-Commerce Standards.</p>
        </div>
      </div>
    </footer>
  );
}
