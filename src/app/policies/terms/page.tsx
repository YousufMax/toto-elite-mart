import React from 'react';
import Header from '@/components/storefront/Header';
import Footer from '@/components/storefront/Footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-12 w-full space-y-8">
        <div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-950">Terms & Delivery Conditions</h1>
          <p className="text-xs text-slate-500 mt-1">Last updated: October 2026</p>
        </div>

        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-sm space-y-6 text-sm text-slate-600 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">1. Delivery Zones & Timelines</h2>
            <p>
              Toto Elite Mart delivers products across all 64 districts of Bangladesh through verified courier partners:
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs text-slate-600">
              <li><b>Inside Dhaka City:</b> Delivery fee ৳60. Typical delivery within 24 to 48 hours.</li>
              <li><b>Outside Dhaka / Nationwide:</b> Delivery fee ৳120. Typical delivery within 48 to 72 hours.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">2. Cash on Delivery (COD) Inspection</h2>
            <p>
              Customers are warmly invited to inspect the outer packaging and verify the parcel in the presence of the delivery rider before handing over the cash payment.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">3. Pricing and Order Validity</h2>
            <p>
              All prices shown on the website are in Bangladeshi Taka (BDT, ৳). We reserve the right to verify orders by phone before dispatching from our central fulfillment hub.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
