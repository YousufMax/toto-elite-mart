import React from 'react';
import Header from '@/components/storefront/Header';
import Footer from '@/components/storefront/Footer';
import { Award, ShieldCheck, HeartHandshake, Truck } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-12 w-full space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">Our Story & Commitment</span>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-950">About Toto Elite Mart</h1>
          <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            Building Bangladesh&apos;s most reliable, transparent, and customer-first online marketplace.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-sm space-y-6 text-sm text-slate-600 leading-relaxed">
          <h2 className="text-xl font-bold text-slate-900">Who We Are</h2>
          <p>
            Toto Elite Mart was founded with a straightforward goal: providing authentic, premium lifestyle products, original electronics and pure organic goods to Bangladeshi shoppers without counterfeit risks or unfair pricing.
          </p>
          <p>
            Whether you are ordering high-grade wireless audio earbuds, traditional pure Sundarban honey, modern kitchen essentials or Eid attire, every item in our catalog is rigorously verified before stocking.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
            <div className="space-y-2">
              <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900">Authenticity Guarantee</h3>
              <p className="text-xs text-slate-500">
                We reject replicas and low-grade counterfeits. Every item carries our quality assurance stamp.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center font-bold">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900">Nationwide Reach</h3>
              <p className="text-xs text-slate-500">
                From Dhaka city to rural upazilas across 64 districts, our courier partners ensure speedy delivery.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
