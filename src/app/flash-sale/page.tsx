import React from 'react';
import Header from '@/components/storefront/Header';
import Footer from '@/components/storefront/Footer';
import FlashSaleSection from '@/components/storefront/FlashSaleSection';
import { getActiveFlashSaleCampaign, getProducts } from '@/lib/data-store';
import { Flame, ShieldCheck, Truck, RotateCcw, Award } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function FlashSalePage() {
  const { campaign } = await getActiveFlashSaleCampaign();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 py-6 sm:py-10 space-y-8 sm:space-y-12">
        {/* Breadcrumb Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
            <Link href="/" className="hover:text-red-600 transition">
              Home
            </Link>
            <span>/</span>
            <span className="font-bold text-slate-900">Flash Sale Deals</span>
          </div>
        </div>

        {/* Live Flash Sale Section with Countdown & Cards */}
        <FlashSaleSection />

        {/* Mart Guarantees Bar */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Fast Nationwide Shipping</h4>
                <p className="text-[11px] text-slate-500">Inside & Outside Dhaka COD</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">100% Genuine Products</h4>
                <p className="text-[11px] text-slate-500">Verified Mart Guarantee</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Elite Reward Cashback</h4>
                <p className="text-[11px] text-slate-500">Earn points on every deal</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Easy Return & Support</h4>
                <p className="text-[11px] text-slate-500">Dedicated customer care</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
