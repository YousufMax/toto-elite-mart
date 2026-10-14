'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Layers,
  Image as ImageIcon,
  DollarSign,
  BarChart3,
  RefreshCw,
  Users,
  Store,
  Warehouse,
  Ticket,
  Star,
  Sliders,
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard },
  { label: 'Order Processing', href: '/admin/orders', icon: ShoppingCart },
  { label: 'Product Catalog', href: '/admin/products', icon: Package },
  { label: 'Inventory Ledger', href: '/admin/inventory', icon: Warehouse },
  { label: 'Customer Reviews', href: '/admin/reviews', icon: Star },
  { label: 'Categories', href: '/admin/categories', icon: Layers },
  { label: 'Banners & Deals', href: '/admin/banners', icon: ImageIcon },
  { label: 'Coupons & Promos', href: '/admin/coupons', icon: Ticket },
  { label: 'Expense Tracker', href: '/admin/expenses', icon: DollarSign },
  { label: 'Financial Reports', href: '/admin/reports', icon: BarChart3 },
  { label: 'Integrations & Sync', href: '/admin/integrations', icon: RefreshCw },
  { label: 'Staff & Roles', href: '/admin/employees', icon: Users },
  { label: 'Mart Settings', href: '/admin/settings', icon: Sliders },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-950 text-slate-300 min-h-screen border-r border-slate-900 flex flex-col justify-between shrink-0">
      <div>
        {/* Brand */}
        <div className="p-6 border-b border-slate-900">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center text-slate-950 font-black text-lg shadow-md shadow-amber-500/20">
              T
            </div>
            <div>
              <span className="text-base font-black text-white tracking-tight">
                TOTO <span className="text-amber-500">ELITE</span>
              </span>
              <span className="block text-[9px] tracking-widest uppercase font-semibold text-slate-500">
                ADMIN CONTROL
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 text-xs font-semibold">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Storefront Link */}
      <div className="p-4 border-t border-slate-900">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-center gap-2 w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition"
        >
          <Store className="w-3.5 h-3.5 text-amber-400" />
          <span>View Live Storefront ↗</span>
        </Link>
      </div>
    </aside>
  );
}
