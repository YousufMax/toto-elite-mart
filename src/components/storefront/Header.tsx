'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  ShoppingBag,
  Search,
  Menu,
  X,
  PackageCheck,
  Home,
  LayoutGrid,
  Headphones,
  Shirt,
  Leaf,
  UtensilsCrossed,
  Info,
  PhoneCall,
  ChevronRight,
  MessageCircle,
  ShieldCheck,
} from 'lucide-react';
import { useCart } from './CartContext';
import LiveSearchDropdown from './LiveSearchDropdown';
import MegaMenu from './MegaMenu';

const NAV_LINKS = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'All Products', href: '/shop', icon: LayoutGrid },
  { name: 'Smart Gadgets', href: '/shop?category=smart-gadgets', icon: Headphones },
  { name: 'Fashion & Lifestyle', href: '/shop?category=fashion-lifestyle', icon: Shirt },
  { name: 'Organic Food', href: '/shop?category=organic-food', icon: Leaf },
  { name: 'Home & Kitchen', href: '/shop?category=home-kitchen', icon: UtensilsCrossed },
  { name: 'About Toto Elite', href: '/about', icon: Info },
  { name: 'Contact & Support', href: '/contact', icon: PhoneCall },
];

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { itemCount, setIsDrawerOpen } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      {/* Top Header Row */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex items-center justify-between gap-3">
        {/* Left: Mobile Menu Toggle + Brand Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open Navigation Menu"
            className="md:hidden p-2 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition focus:outline-none"
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Brand Logo & Company Name */}
          <Link href="/" className="flex items-center gap-2 sm:gap-2.5 shrink-0 group">
            <img
              src="https://cdn.jsdelivr.net/gh/YousufMax/image-server-001@main/toto%20elite%20mart%20logo%20final%20(1).png"
              alt="TOTO ELITE MART"
              height={44}
              style={{ maxHeight: '48px', width: 'auto' }}
              className="h-9 sm:h-11 md:h-12 w-auto object-contain shrink-0 transition-transform duration-200 group-hover:scale-102"
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
            {/* Professional Mart Typography */}
            <div className="flex flex-col justify-center leading-none select-none">
              <div className="flex items-center gap-1 sm:gap-1.5 font-brand">
                <span className="text-[17px] sm:text-xl md:text-2xl font-black text-slate-950 uppercase tracking-tighter">
                  TOTO
                </span>
                <span className="text-[17px] sm:text-xl md:text-2xl font-black text-red-600 uppercase tracking-tighter">
                  ELITE
                </span>
                <span className="bg-slate-950 text-white font-black text-[9px] sm:text-[11px] md:text-xs px-1.5 sm:px-2 py-0.5 rounded sm:rounded-md tracking-wider uppercase shadow-xs">
                  MART
                </span>
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5 mt-0.5 sm:mt-1">
                <span className="text-[7.5px] sm:text-[9px] md:text-[9.5px] font-black uppercase tracking-[0.22em] text-slate-400">
                  ONLINE SHOPPING
                </span>
                <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-slate-300" />
                <span className="hidden sm:inline-block text-[8px] font-bold text-slate-500 uppercase tracking-wider">
                  PREMIER MART
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Live Search Bar (Desktop) */}
        <div className="hidden md:flex flex-1 max-w-xl mx-4">
          <LiveSearchDropdown />
        </div>

        {/* Actions (Track Order, Cart) */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <Link
            href="/track-order"
            className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-amber-600 bg-slate-100 hover:bg-slate-200/80 px-3 py-2 rounded-xl transition"
          >
            <PackageCheck className="w-4 h-4 text-amber-500" />
            <span className="hidden md:inline">Track Order</span>
          </Link>

          {/* Cart Button */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="relative flex items-center gap-1.5 sm:gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-amber-500/20 transition active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Cart</span>
            {itemCount > 0 && (
              <span className="bg-slate-950 text-white text-[10px] sm:text-[11px] font-black rounded-full px-1.5 py-0.2 sm:px-2 sm:py-0.5 ml-0.5 sm:ml-1">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Quick Live Search Bar */}
      <div className="md:hidden px-3 pb-2.5">
        <LiveSearchDropdown onCloseMobile={() => setMobileMenuOpen(false)} />
      </div>

      {/* Horizontal Responsive Navigation Bar with Mega Menu */}
      <div className="bg-slate-50/90 border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-1.5 sm:py-2 scrollbar-none text-xs font-bold text-slate-700 whitespace-nowrap">
            {/* Mega Menu Dropdown Trigger (Desktop) */}
            <div className="hidden md:block shrink-0 mr-1">
              <MegaMenu />
            </div>
            {NAV_LINKS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname === item.href ||
                    (item.href !== '/shop' && pathname.includes(item.href));

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 shrink-0 ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-2xs font-extrabold'
                      : 'hover:bg-slate-200/70 text-slate-700 hover:text-amber-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0 opacity-80" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Full-Height Professional Mobile Slide-Out Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Dark Backdrop with Blur */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          />

          {/* Slide-in Drawer Container */}
          <div className="relative w-4/5 max-w-xs h-full bg-white shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-left duration-250">
            {/* Drawer Top Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 group"
              >
                <img
                  src="https://cdn.jsdelivr.net/gh/YousufMax/image-server-001@main/toto%20elite%20mart%20logo%20final%20(1).png"
                  alt="TOTO ELITE MART"
                  height={34}
                  style={{ maxHeight: '34px', width: 'auto' }}
                  className="h-8.5 w-auto object-contain rounded-md"
                />
                <div className="flex flex-col leading-none select-none">
                  <div className="flex items-center gap-1 font-brand">
                    <span className="text-[15px] font-black text-slate-950 uppercase tracking-tighter">
                      TOTO
                    </span>
                    <span className="text-[15px] font-black text-red-600 uppercase tracking-tighter">
                      ELITE
                    </span>
                    <span className="bg-slate-950 text-white font-black text-[9px] px-1.5 py-0.5 rounded tracking-wider uppercase">
                      MART
                    </span>
                  </div>
                  <span className="text-[7.5px] font-black uppercase tracking-[0.2em] text-slate-400 mt-0.5">
                    ONLINE SHOPPING
                  </span>
                </div>
              </Link>

              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition"
                aria-label="Close Navigation"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Scrollable Navigation Links */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Category Navigation Section */}
              <div>
                <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 px-2">
                  Navigation & Catalog
                </span>
                <div className="space-y-1">
                  {NAV_LINKS.map((link) => {
                    const Icon = link.icon;
                    const isActive =
                      link.href === '/'
                        ? pathname === '/'
                        : pathname === link.href ||
                          (link.href !== '/shop' && pathname.includes(link.href));

                    return (
                      <Link
                        key={link.name}
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition ${
                          isActive
                            ? 'bg-amber-500 text-slate-950 shadow-xs'
                            : 'text-slate-700 hover:bg-slate-100 hover:text-amber-600'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="w-4 h-4 opacity-80" />
                          <span>{link.name}</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Order Tracking & Quick Help */}
              <div className="border-t border-slate-100 pt-3 space-y-1">
                <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 px-2">
                  Customer Assistance
                </span>

                <Link
                  href="/track-order"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <PackageCheck className="w-4 h-4 text-amber-500" />
                    <span>Track Your Order</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                </Link>

                <a
                  href="https://wa.me/8801623363623"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <span>WhatsApp Live Support</span>
                  </div>
                  <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-emerald-200">
                    24/7
                  </span>
                </a>
              </div>
            </div>

            {/* Drawer Bottom Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-2 text-[11px] text-slate-500">
              <div className="flex items-center gap-2 text-slate-700 font-bold">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                <span>100% Genuine & Cash on Delivery</span>
              </div>
              <div className="text-[10px] text-slate-400">
                Hotline:{" "}
                <a
                  href="tel:+8809697192016"
                  className="font-mono text-slate-700 font-bold hover:text-amber-600 transition"
                >
                  +880 9697-192016
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
