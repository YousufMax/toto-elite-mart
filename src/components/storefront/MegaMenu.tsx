'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutGrid,
  ChevronDown,
  Headphones,
  Shirt,
  Leaf,
  UtensilsCrossed,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Gift,
  HeartPulse,
  Baby,
} from 'lucide-react';

interface MegaCategory {
  id: string;
  name: string;
  slug: string;
  icon: any;
  color: string;
  badge?: string;
  subcategories: Array<{ name: string; href: string }>;
}

const DEPARTMENTS: MegaCategory[] = [
  {
    id: 'dept-gadgets',
    name: 'Smart Gadgets & Audio',
    slug: 'smart-gadgets',
    icon: Headphones,
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    badge: 'Popular',
    subcategories: [
      { name: 'Wireless TWS Earbuds', href: '/shop?category=smart-gadgets&tag=earbuds' },
      { name: 'Smart Watches & Bands', href: '/shop?category=smart-gadgets&tag=watches' },
      { name: 'Fast Chargers & Cables', href: '/shop?category=smart-gadgets&tag=chargers' },
      { name: 'Bluetooth Speakers', href: '/shop?category=smart-gadgets&tag=speakers' },
      { name: 'Power Banks & Accessories', href: '/shop?category=smart-gadgets&tag=powerbank' },
    ],
  },
  {
    id: 'dept-organic',
    name: 'Organic & Pure Grocery',
    slug: 'organic-food',
    icon: Leaf,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    badge: '100% Pure',
    subcategories: [
      { name: 'Natural Honey (সুন্দরবনের মধু)', href: '/shop?category=organic-food&tag=honey' },
      { name: 'Organic Mustard Oil (ঘানি ভাঙা তেল)', href: '/shop?category=organic-food&tag=oil' },
      { name: 'Premium Ghee & Butter', href: '/shop?category=organic-food&tag=ghee' },
      { name: 'Nuts & Dry Fruits (ড্রাই ফ্রুটস)', href: '/shop?category=organic-food&tag=nuts' },
      { name: 'Aromatic Basmati & Rice', href: '/shop?category=organic-food&tag=rice' },
    ],
  },
  {
    id: 'dept-fashion',
    name: 'Fashion & Premium Lifestyle',
    slug: 'fashion-lifestyle',
    icon: Shirt,
    color: 'text-amber-600 bg-amber-50 border-amber-200',
    subcategories: [
      { name: "Men's Premium Polo Shirts", href: '/shop?category=fashion-lifestyle&tag=polo' },
      { name: 'Casual Cotton T-Shirts', href: '/shop?category=fashion-lifestyle&tag=tshirt' },
      { name: 'Leather Wallets & Belts', href: '/shop?category=fashion-lifestyle&tag=leather' },
      { name: 'Footwear & Comfort Slides', href: '/shop?category=fashion-lifestyle&tag=shoes' },
    ],
  },
  {
    id: 'dept-home',
    name: 'Home & Kitchen Essentials',
    slug: 'home-kitchen',
    icon: UtensilsCrossed,
    color: 'text-rose-600 bg-rose-50 border-rose-200',
    subcategories: [
      { name: 'Smart Kitchen Tools', href: '/shop?category=home-kitchen&tag=tools' },
      { name: 'Cookware & Frypans', href: '/shop?category=home-kitchen&tag=cookware' },
      { name: 'Storage & Organizers', href: '/shop?category=home-kitchen&tag=storage' },
      { name: 'Home Decor & Lighting', href: '/shop?category=home-kitchen&tag=decor' },
    ],
  },
];

export default function MegaMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<MegaCategory>(DEPARTMENTS[0]);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={menuRef} className="relative inline-block text-left">
      {/* Department Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm ${
          isOpen
            ? 'bg-red-600 text-white shadow-red-200'
            : 'bg-slate-900 hover:bg-black text-white hover:shadow'
        }`}
      >
        <LayoutGrid className="w-4 h-4 text-red-300" />
        <span>Shop by Department</span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-white' : 'text-slate-300'
          }`}
        />
      </button>

      {/* Mega Dropdown Panel */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-[720px] lg:w-[840px] bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="grid grid-cols-12 divide-x divide-slate-100 min-h-[380px]">
            {/* Left Column: Category Departments */}
            <div className="col-span-5 p-3 space-y-1 bg-slate-50/70">
              <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Departments
              </div>
              {DEPARTMENTS.map((dept) => {
                const Icon = dept.icon;
                const isSelected = activeCategory.id === dept.id;
                return (
                  <button
                    key={dept.id}
                    type="button"
                    onMouseEnter={() => setActiveCategory(dept)}
                    onClick={() => setActiveCategory(dept)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition ${
                      isSelected
                        ? 'bg-white text-slate-950 shadow-sm border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${dept.color}`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs sm:text-sm font-semibold truncate">
                        {dept.name}
                      </span>
                    </div>

                    {dept.badge && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700 shrink-0">
                        {dept.badge}
                      </span>
                    )}
                  </button>
                );
              })}

              <div className="pt-2 px-2">
                <Link
                  href="/shop"
                  onClick={() => setIsOpen(false)}
                  className="w-full py-2 px-3 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl transition flex items-center justify-between"
                >
                  <span>Explore All Products</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Middle Column: Subcategories */}
            <div className="col-span-4 p-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  {activeCategory.name}
                </h4>
                <Link
                  href={`/shop?category=${activeCategory.slug}`}
                  onClick={() => setIsOpen(false)}
                  className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline"
                >
                  View All
                </Link>
              </div>

              <div className="space-y-2">
                {activeCategory.subcategories.map((sub) => (
                  <Link
                    key={sub.name}
                    href={sub.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between p-2 rounded-lg text-xs sm:text-sm font-medium text-slate-700 hover:text-red-600 hover:bg-red-50/60 transition group"
                  >
                    <span>{sub.name}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-red-500 group-hover:translate-x-0.5 transition" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Right Column: Promotional Banner Card */}
            <div className="col-span-3 p-4 bg-gradient-to-br from-red-600 to-rose-700 text-white flex flex-col justify-between rounded-r-2xl relative overflow-hidden">
              <div className="relative z-10">
                <div className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider mb-2.5">
                  <Gift className="w-3 h-3 text-amber-300" />
                  Elite Cashback
                </div>
                <h5 className="text-sm font-black leading-snug">
                  Earn Cashback on Every Order!
                </h5>
                <p className="text-[11px] text-red-100 mt-1.5 leading-relaxed">
                  Join Toto Elite Mart loyalty: earn points automatically & redeem for instant cash discounts at checkout.
                </p>
              </div>

              <div className="relative z-10 pt-4">
                <Link
                  href="/shop"
                  onClick={() => setIsOpen(false)}
                  className="w-full py-2 bg-white hover:bg-slate-100 text-slate-950 text-xs font-bold rounded-xl transition text-center shadow-md block"
                >
                  Shop Now & Earn 🪙
                </Link>
              </div>

              {/* Decorative background glow */}
              <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
