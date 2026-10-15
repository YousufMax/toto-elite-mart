'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Printer,
  Download,
  X,
  FileText,
  Package,
  Phone,
  Globe,
  Mail,
  ShieldCheck,
  CheckCircle,
  Truck,
  AlertCircle,
  QrCode,
  ExternalLink,
} from 'lucide-react';
import { formatBDT } from '@/lib/currency';
import { formatLocalOrderDate } from '@/lib/order-aging';
import { generateBarcodeSvgPath } from '@/lib/barcode';

interface OrderInvoicePrintProps {
  order: any;
  onClose?: () => void;
  autoPrint?: boolean;
  initialMode?: 'invoice' | 'slip';
}

// Converts number to words (Bengali/English representation for Taka)
function numberToWordsBDT(amount: number): string {
  const num = Math.round(amount);
  if (num === 0) return 'Zero Taka Only';

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety',
  ];

  function convertChunk(n: number): string {
    let str = '';
    if (n >= 100) {
      str += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      str += ones[n] + ' ';
    }
    return str.trim();
  }

  let result = '';
  const crore = Math.floor(num / 10000000);
  let rem = num % 10000000;
  const lakh = Math.floor(rem / 100000);
  rem %= 100000;
  const thousand = Math.floor(rem / 1000);
  rem %= 1000;
  const remainder = rem;

  if (crore > 0) result += convertChunk(crore) + ' Crore ';
  if (lakh > 0) result += convertChunk(lakh) + ' Lakh ';
  if (thousand > 0) result += convertChunk(thousand) + ' Thousand ';
  if (remainder > 0) result += convertChunk(remainder) + ' ';

  return result.trim() + ' Taka Only';
}

export default function OrderInvoicePrint({
  order,
  onClose,
  autoPrint = false,
  initialMode = 'invoice',
}: OrderInvoicePrintProps) {
  const [mode, setMode] = useState<'invoice' | 'slip'>(initialMode);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoPrint) {
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoPrint]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!printAreaRef.current) return;
    setIsGeneratingPdf(true);

    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(printAreaRef.current, {
        scale: 2, // 2x high resolution
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: mode === 'slip' ? [105, 148] : 'a4', // A5/4x6" for slip, A4 for invoice
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(
        `${mode === 'slip' ? 'PackingSlip' : 'Invoice'}-${order.orderNumber || order.id}.pdf`
      );
    } catch (err) {
      console.error('PDF generation error:', err);
      // Fallback to native print if html2canvas/jspdf fails
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Safe numerical calculations
  const subtotal = Number(order.subtotal || 0);
  const deliveryFee = Number(order.deliveryFee || 0);
  const discount = Number(order.discount || 0);
  const totalAmount = Number(order.totalAmount || subtotal + deliveryFee - discount);
  const isPaid = order.paymentStatus === 'PAID';

  // Barcode SVG
  const barcodeData = generateBarcodeSvgPath(order.orderNumber || order.id || 'ORDER', 45);

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-900/80 backdrop-blur-xs overflow-y-auto flex flex-col items-center justify-start p-0 sm:p-6 print:p-0 print:bg-white print:static print:z-auto print:overflow-visible">
      {/* 1. Interactive Action Control Header (Hidden on Print) */}
      <div className="w-full max-w-4xl bg-slate-950 text-white rounded-none sm:rounded-2xl p-4 mb-4 shadow-xl flex flex-wrap items-center justify-between gap-3 sticky top-0 sm:top-2 z-50 print:hidden border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm text-white">Order {order.orderNumber}</h2>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono px-2 py-0.5 rounded-full border border-amber-500/30">
                {order.paymentMethod || 'COD'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {order.customerName} • {formatBDT(totalAmount)}
            </p>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setMode('invoice')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
              mode === 'invoice'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Full Invoice (A4)</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('slip')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
              mode === 'slip'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Courier Slip (চালান)</span>
          </button>
        </div>

        {/* Actions: Print, Download PDF, Close */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-md transition active:scale-95"
            title="Print to connected printer or Save as PDF (Ctrl + P)"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 border border-slate-700 transition active:scale-95 disabled:opacity-50"
            title="Download PDF directly to your device"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition ml-1"
              aria-label="Close invoice viewer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. PRINTABLE CANVAS AREA */}
      <div
        ref={printAreaRef}
        id="invoice-print-area"
        className={`bg-white text-slate-900 shadow-2xl transition-all print:shadow-none print:m-0 print:border-none print:w-full ${
          mode === 'invoice'
            ? 'w-full max-w-4xl p-6 sm:p-10 rounded-none sm:rounded-2xl border border-slate-200'
            : 'w-full max-w-lg p-5 sm:p-6 rounded-none sm:rounded-2xl border-2 border-slate-900'
        }`}
        style={{
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        {/* ========================================================================= */}
        {/* LAYOUT A: FULL RETAIL TAX INVOICE (A4)                                    */}
        {/* ========================================================================= */}
        {mode === 'invoice' ? (
          <div className="space-y-6">
            {/* Top Brand & Invoice Header */}
            <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-slate-900 pb-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-950 text-amber-500 font-black text-xl flex items-center justify-center border border-amber-500/30">
                    T
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 uppercase leading-none">
                      Toto Elite Mart
                    </h1>
                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest block mt-0.5">
                      Premium Lifestyle & E-Commerce Store
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-600 space-y-0.5 pt-1">
                  <p className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Customer Care Hotline: <strong>+880 9697-192016</strong></span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Website: <strong>https://totoelitemart.com</strong></span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Support: <strong>support@totoelitemart.com</strong></span>
                  </p>
                  <p className="text-[11px] text-slate-500">Dhaka, Bangladesh • Trade License Reg. Certified</p>
                </div>
              </div>

              {/* Invoice Meta & Barcode */}
              <div className="text-right space-y-2 shrink-0">
                <div className="inline-block bg-slate-950 text-white px-3 py-1 rounded-lg text-xs font-black tracking-wider uppercase">
                  Retail Sales Invoice
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-mono">Invoice Number</div>
                  <div className="text-base sm:text-lg font-black font-mono text-slate-950">
                    {order.orderNumber}
                  </div>
                  <div className="text-xs text-slate-500">
                    Date: {formatLocalOrderDate(order.createdAt)}
                  </div>
                </div>

                {/* Scannable Code 128 Barcode */}
                <div className="inline-flex flex-col items-end pt-1">
                  <svg
                    viewBox={barcodeData.viewBox}
                    className="h-9 w-auto max-w-[200px]"
                    preserveAspectRatio="none"
                  >
                    <path d={barcodeData.path} fill="#000000" />
                  </svg>
                  <span className="font-mono text-[9px] text-slate-500 tracking-widest mt-0.5">
                    *{order.orderNumber}*
                  </span>
                </div>
              </div>
            </div>

            {/* Bill To & Courier Destination Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200">
              {/* Customer Box */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Billed To / Customer:
                </span>
                <h3 className="font-black text-slate-900 text-sm">{order.customerName}</h3>
                <p className="text-sm font-bold font-mono text-slate-950 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{order.customerPhone}</span>
                </p>
                <p className="text-xs text-slate-700 leading-relaxed pt-0.5">
                  {order.deliveryAddress}
                </p>
                <p className="text-xs font-semibold text-slate-600">
                  {order.deliveryCity} {order.deliveryZone ? `(${order.deliveryZone})` : ''}
                </p>
              </div>

              {/* Order & Payment Summary Box */}
              <div className="space-y-2 sm:text-right border-t sm:border-t-0 sm:border-l border-slate-200 pt-3 sm:pt-0 sm:pl-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Payment & Shipping Info:
                </span>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between sm:justify-end gap-3">
                    <span className="text-slate-500">Payment Method:</span>
                    <strong className="text-slate-900">
                      {order.paymentMethod === 'COD' ? 'Cash on Delivery (COD)' : order.paymentMethod}
                    </strong>
                  </div>
                  <div className="flex justify-between sm:justify-end gap-3 items-center">
                    <span className="text-slate-500">Payment Status:</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        isPaid
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}
                    >
                      {order.paymentStatus || 'UNPAID'}
                    </span>
                  </div>
                  <div className="flex justify-between sm:justify-end gap-3">
                    <span className="text-slate-500">Order Status:</span>
                    <strong className="text-slate-900 uppercase">{order.orderStatus}</strong>
                  </div>
                  {order.notes && (
                    <div className="text-left bg-white p-2 rounded-lg border border-slate-200 mt-2">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">
                        Customer Note:
                      </span>
                      <p className="text-[11px] text-slate-700 italic">{order.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Product Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-3 text-center w-10">#</th>
                    <th className="py-3 px-4">Item Description</th>
                    <th className="py-3 px-3 font-mono">SKU</th>
                    <th className="py-3 px-3 text-right">Price</th>
                    <th className="py-3 px-3 text-center">Qty</th>
                    <th className="py-3 px-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item: any, idx: number) => {
                      const itemTotal = Number(item.totalPrice || item.unitPrice * item.quantity);
                      return (
                        <tr key={item.id || idx} className="hover:bg-slate-50/50">
                          <td className="py-3 px-3 text-center text-slate-400 font-mono">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{item.productName}</div>
                            {item.selectedColor && (
                              <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
                                <span>Variant: <strong>{item.selectedColor}</strong></span>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                            {item.sku || 'N/A'}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-slate-700">
                            {formatBDT(Number(item.unitPrice))}
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-slate-900">
                            {item.quantity}
                          </td>
                          <td className="py-3 px-4 text-right font-black font-mono text-slate-950">
                            {formatBDT(itemTotal)}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-slate-400 italic">
                        No product item records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Calculations & Total Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              {/* Terms, Guarantee & In-Words */}
              <div className="space-y-3">
                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 text-xs text-amber-950">
                  <span className="font-bold text-[10px] uppercase tracking-wider block text-amber-800">
                    Amount In Words:
                  </span>
                  <p className="font-semibold italic text-amber-950">
                    {numberToWordsBDT(totalAmount)}
                  </p>
                </div>

                <div className="text-[11px] text-slate-600 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="font-bold text-slate-900 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Customer Warranty & Return Policy:</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-0.5 text-[10px] text-slate-500">
                    <li>7-day replacement warranty for manufacturing defects.</li>
                    <li>Please inspect the parcel contents in front of delivery agent.</li>
                    <li>For any delivery dispute, call Hotline <strong>+880 9697-192016</strong> immediately.</li>
                  </ul>
                </div>
              </div>

              {/* Price Calculation Table */}
              <div className="space-y-2">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono font-bold text-slate-900">{formatBDT(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Delivery Charge:</span>
                    <span className="font-mono font-bold text-slate-900">{formatBDT(deliveryFee)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Discount / Voucher:</span>
                      <span className="font-mono font-bold">-{formatBDT(discount)}</span>
                    </div>
                  )}
                  <div className="border-t border-slate-200 pt-2 flex justify-between items-baseline text-sm">
                    <span className="font-black text-slate-950">Total Payable Amount:</span>
                    <span className="font-mono font-black text-base text-slate-950">
                      {formatBDT(totalAmount)}
                    </span>
                  </div>
                </div>

                {/* COD Callout Box */}
                {!isPaid && (
                  <div className="p-3 bg-red-50 border-2 border-red-500 rounded-xl text-center">
                    <span className="text-[10px] font-black uppercase text-red-700 tracking-wider block">
                      Cash On Delivery (COD) Amount to Collect
                    </span>
                    <span className="text-xl font-black font-mono text-red-600">
                      {formatBDT(totalAmount)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Signature & Seal Footer */}
            <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs">
              <div>
                <div className="w-36 h-10 border-b border-dashed border-slate-400 mx-auto" />
                <span className="text-[10px] text-slate-500 uppercase font-semibold block mt-1">
                  Customer Received Signature & Date
                </span>
              </div>
              <div>
                <div className="w-36 h-10 border-b border-dashed border-slate-400 mx-auto flex items-end justify-center pb-1">
                  <span className="font-serif italic font-bold text-slate-700 text-xs">Toto Elite Mart</span>
                </div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold block mt-1">
                  Authorized Signatory & Seal
                </span>
              </div>
            </div>

            {/* Print Timestamp */}
            <div className="text-center text-[9px] text-slate-400 pt-4 border-t border-slate-100">
              System generated invoice • Powered by Toto Elite Mart Operations • {new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' })} BST
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* LAYOUT B: COURIER PARCEL PACKING SLIP (চালান / 4x6" & A5 Label)           */
          /* ========================================================================= */
          <div className="space-y-4">
            {/* Courier Slip Header */}
            <div className="border-b-2 border-slate-950 pb-3 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-md bg-slate-950 text-amber-500 font-bold flex items-center justify-center text-xs">
                    T
                  </div>
                  <h2 className="text-base font-black text-slate-950 uppercase tracking-tight">
                    Toto Elite Mart
                  </h2>
                </div>
                <p className="text-[10px] text-slate-500">Courier Delivery Dispatch Slip / চালান</p>
              </div>

              <div className="text-right">
                <span className="bg-slate-950 text-white font-mono text-xs font-black px-2.5 py-1 rounded">
                  {order.orderNumber}
                </span>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {formatLocalOrderDate(order.createdAt)}
                </p>
              </div>
            </div>

            {/* High-Contrast COD Collection Banner */}
            <div className="p-3 bg-slate-950 text-white rounded-xl text-center border-2 border-black">
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 block">
                Cash On Delivery (COD) আদায়যোগ্য টাকা
              </span>
              <div className="text-2xl font-black font-mono text-white mt-0.5">
                {isPaid ? 'PAID (0.00)' : formatBDT(totalAmount)}
              </div>
              <span className="text-[10px] text-slate-300 block">
                {isPaid ? 'Already Paid Online • Do Not Collect' : 'Please Collect Full Amount Before Unboxing'}
              </span>
            </div>

            {/* Recipient & Sender Split Boxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Recipient Box (Large for Courier Driver) */}
              <div className="p-3 bg-slate-50 rounded-xl border-2 border-slate-300 space-y-1">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block bg-slate-200 px-1.5 py-0.5 rounded w-fit">
                  RECIPIENT / প্রাপক
                </span>
                <div className="font-black text-slate-950 text-sm">{order.customerName}</div>
                <div className="text-base font-black font-mono text-slate-950 bg-amber-100/70 px-2 py-0.5 rounded border border-amber-300 inline-block">
                  ☎ {order.customerPhone}
                </div>
                <p className="text-xs text-slate-800 leading-tight pt-1 font-medium">
                  {order.deliveryAddress}
                </p>
                <p className="text-xs font-bold text-slate-900">
                  {order.deliveryCity} {order.deliveryZone ? `• ${order.deliveryZone}` : ''}
                </p>
              </div>

              {/* Sender Box */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-slate-600">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
                  SENDER / প্রেরক
                </span>
                <div className="font-bold text-slate-900 text-xs">Toto Elite Mart Logistics</div>
                <div className="font-mono text-xs font-bold text-slate-800">
                  Hotline: 09697-192016
                </div>
                <p className="text-[11px] text-slate-600">
                  Dhaka Warehouse Hub, Bangladesh
                </p>
                <p className="text-[10px] text-slate-500 pt-1">
                  Website: totoelitemart.com
                </p>
              </div>
            </div>

            {/* Barcode Block */}
            <div className="border border-slate-200 rounded-xl p-2.5 flex flex-col items-center justify-center bg-white">
              <svg
                viewBox={barcodeData.viewBox}
                className="h-11 w-full max-w-[260px]"
                preserveAspectRatio="none"
              >
                <path d={barcodeData.path} fill="#000000" />
              </svg>
              <span className="font-mono text-xs font-bold text-slate-900 tracking-wider mt-1">
                *{order.orderNumber}*
              </span>
            </div>

            {/* Package Contents Itemization */}
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <div className="bg-slate-100 px-3 py-1.5 font-bold text-slate-700 text-[10px] uppercase flex justify-between">
                <span>Parcel Contents ({order.items?.length || 0} items)</span>
                <span>Qty</span>
              </div>
              <div className="divide-y divide-slate-100 p-1">
                {order.items?.map((item: any, idx: number) => (
                  <div key={idx} className="p-2 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate text-[11px]">
                        {item.productName}
                      </p>
                      {item.selectedColor && (
                        <p className="text-[10px] text-slate-500">Color: {item.selectedColor}</p>
                      )}
                    </div>
                    <span className="font-black font-mono text-xs bg-slate-100 px-2 py-0.5 rounded shrink-0">
                      x{item.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Courier Dispatch Notes */}
            <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[10px] text-amber-950 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>ডেলিভারি নির্দেশিকা:</strong> পার্সেল ডেলিভারি দেওয়ার আগে কাস্টমারের সাথে কথা বলুন। কোনো সমস্যা হলে প্রেরকের হটলাইনে (<strong>09697-192016</strong>) কল করুন।
              </div>
            </div>

            <div className="text-center text-[9px] text-slate-400">
              Toto Elite Mart • Automated Courier Dispatch Slip
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
