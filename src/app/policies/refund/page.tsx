import React from 'react';
import Header from '@/components/storefront/Header';
import Footer from '@/components/storefront/Footer';

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-12 w-full space-y-8">
        <div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-950">Return & Refund Policy</h1>
          <p className="text-xs text-slate-500 mt-1">Last updated: October 2026</p>
        </div>

        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-sm space-y-6 text-sm text-slate-600 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">1. Eligibility for Return</h2>
            <p>
              At Toto Elite Mart, we offer a <b>7-day replacement guarantee</b> for any items that arrive defective, damaged during transit, or substantially different from the product description.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">2. Conditions for Return</h2>
            <ul className="list-disc list-inside space-y-1 text-xs text-slate-600">
              <li>The product must be in its original unused condition with all original packaging, barcodes, and tags intact.</li>
              <li>A video or clear photographic proof of the defect or damage during unboxing is requested.</li>
              <li>Perishable organic food items (such as opened honey or oil) cannot be returned once unsealed unless defective prior to opening.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">3. Refund Processing</h2>
            <p>
              If a replacement is not available in our inventory, a full refund will be issued via bKash, Nagad, or Bank Transfer within 3 to 5 business days upon receiving the returned package at our fulfillment center.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
