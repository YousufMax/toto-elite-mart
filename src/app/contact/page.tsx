import React from 'react';
import Header from '@/components/storefront/Header';
import Footer from '@/components/storefront/Footer';
import { PhoneCall, Mail, MapPin } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-12 w-full space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">Get In Touch</span>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-950">Contact & Customer Care</h1>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Have questions about your order or want to inquire about bulk wholesale purchases?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contact Details Card */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Support Contacts</h2>

            <div className="space-y-4 text-xs text-slate-600">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div>
                  <span className="block font-bold text-slate-900">Direct Hotline:</span>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">+880 1712-000000</p>
                  <p className="text-[11px] text-slate-400">Available Saturday to Thursday (10:00 AM – 10:00 PM)</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="block font-bold text-slate-900">Email Address:</span>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">support@totoelitemart.com</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="block font-bold text-slate-900">Office & Fulfillment Hub:</span>
                  <p className="mt-0.5">House 24, Road 7, Dhanmondi, Dhaka-1205, Bangladesh</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Message Box */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Send a Message</h2>

            <form className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Your Name</label>
                <input
                  type="text"
                  placeholder="Full Name"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mobile Number</label>
                <input
                  type="tel"
                  placeholder="01XXXXXXXXX"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Message</label>
                <textarea
                  rows={3}
                  placeholder="How can we assist you today?"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <button
                type="button"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition"
              >
                Submit Inquiry
              </button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
