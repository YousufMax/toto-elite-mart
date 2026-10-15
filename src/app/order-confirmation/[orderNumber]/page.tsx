import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Header from '@/components/storefront/Header';
import Footer from '@/components/storefront/Footer';
import { getOrderByNumber } from '@/lib/data-store';
import { formatBDT } from '@/lib/currency';
import { CheckCircle2, PackageCheck, ShoppingBag, Printer } from 'lucide-react';

export default async function OrderConfirmationPage({
  params,
}: {
  params: { orderNumber: string };
}) {
  const order = await getOrderByNumber(params.orderNumber);

  if (!order) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-12 w-full space-y-8">
        {/* Success Card Header */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-sm text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Order Confirmed & Placed Successfully
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-950">
              Thank You, {order.customerName}!
            </h1>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              We have received your order. Our warehouse team is preparing your package for courier handover.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 bg-slate-100 border border-slate-200 px-4 py-2 rounded-xl text-xs font-mono font-bold text-slate-900">
            <span>Order Number:</span>
            <span className="text-amber-600">{order.orderNumber}</span>
          </div>
        </div>

        {/* Order Details Breakdown */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
          <h2 className="text-base font-bold text-slate-950 border-b border-slate-100 pb-3">
            Delivery & Payment Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600">
            <div>
              <span className="block font-bold text-slate-800 mb-0.5">Customer Contact:</span>
              <p>{order.customerName}</p>
              <p className="font-mono">{order.customerPhone}</p>
            </div>

            <div>
              <span className="block font-bold text-slate-800 mb-0.5">Shipping Address:</span>
              <p>{order.deliveryAddress}</p>
              <p>{order.deliveryCity} ({order.deliveryZone || 'Inside Dhaka'})</p>
            </div>

            <div>
              <span className="block font-bold text-slate-800 mb-0.5">Payment Method:</span>
              <p className="font-semibold text-slate-900">
                {order.paymentMethod === 'BKASH'
                  ? 'bKash (বিকাশ সেন্ড মানি)'
                  : order.paymentMethod === 'NAGAD'
                  ? 'Nagad (নগদ সেন্ড মানি)'
                  : order.paymentMethod === 'ROCKET'
                  ? 'Rocket (রকেট)'
                  : 'Cash on Delivery (ক্যাশ অন ডেলিভারি)'}
              </p>
              <p className="text-slate-400">Status: {order.paymentStatus}</p>
            </div>

            <div>
              <span className="block font-bold text-slate-800 mb-0.5">Order Status:</span>
              <span className="inline-block px-2.5 py-1 bg-amber-100 text-amber-800 font-bold rounded-lg text-[11px]">
                {order.orderStatus}
              </span>
            </div>
          </div>

          {/* Items Table */}
          <div className="border-t border-slate-100 pt-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Ordered Items</h3>
            <div className="divide-y divide-slate-100">
              {order.items?.map((item: any) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900">{item.productName}</span>
                      {item.selectedColor && (
                        <span className="px-2 py-0.2 rounded-md text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                          Color: {item.selectedColor}
                        </span>
                      )}
                    </div>
                    <span className="text-slate-400 block font-mono text-[11px] mt-0.5">
                      {item.quantity} × {formatBDT(item.unitPrice)}
                    </span>
                  </div>
                  <span className="font-bold text-slate-900">{formatBDT(item.totalPrice)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Totals */}
          <div className="border-t border-slate-100 pt-4 space-y-2 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-bold text-slate-900">{formatBDT(order.subtotal)}</span>
            </div>
            {Number(order.discount) > 0 && (
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>Discount</span>
                <span>-{formatBDT(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Delivery Charge</span>
              <span className="font-bold text-slate-900">{formatBDT(order.deliveryFee)}</span>
            </div>
            <div className="border-t border-slate-200 pt-3 flex justify-between items-baseline text-base font-black text-slate-950">
              <span>Amount Payable on Delivery</span>
              <span className="text-xl text-amber-600">{formatBDT(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Next Actions */}
        <div className="flex flex-col sm:flex-row gap-3.5 justify-center pt-2">
          <Link
            href={`/admin/orders/${order.orderNumber}/invoice`}
            target="_blank"
            className="px-5 py-3.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-2xs"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Official Invoice / রসিদ</span>
          </Link>

          <Link
            href={`/track-order?orderNumber=${order.orderNumber}&phone=${order.customerPhone}`}
            className="px-5 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition"
          >
            <PackageCheck className="w-4 h-4 text-amber-400" />
            <span>Track Order Status</span>
          </Link>

          <Link
            href="/shop"
            className="px-5 py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Continue Shopping</span>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
