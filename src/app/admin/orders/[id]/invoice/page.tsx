import React from 'react';
import { notFound } from 'next/navigation';
import { getOrderByNumber } from '@/lib/data-store';
import OrderInvoicePrint from '@/components/admin/OrderInvoicePrint';

export const dynamic = 'force-dynamic';

export default async function AdminOrderInvoicePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { autoPrint?: string; mode?: string };
}) {
  const order = await getOrderByNumber(params.id);

  if (!order) {
    notFound();
  }

  // Format Decimal objects safely for client component to prevent React serialization warnings
  const baseOrder = JSON.parse(JSON.stringify(order));
  const sanitizedOrder = {
    ...baseOrder,
    subtotal: Number(order.subtotal || 0),
    discount: Number(order.discount || 0),
    deliveryFee: Number(order.deliveryFee || 0),
    totalAmount: Number(order.totalAmount || 0),
    items: (order.items || []).map((item: any) => ({
      ...JSON.parse(JSON.stringify(item)),
      unitPrice: Number(item.unitPrice || 0),
      purchaseCost: Number(item.purchaseCost || 0),
      totalPrice: Number(item.totalPrice || item.unitPrice * item.quantity || 0),
    })),
  };

  const initialMode = searchParams.mode === 'slip' ? 'slip' : 'invoice';
  const autoPrint = searchParams.autoPrint === 'true';

  return (
    <div className="min-h-screen bg-slate-900 py-0 sm:py-8">
      <OrderInvoicePrint
        order={sanitizedOrder}
        initialMode={initialMode}
        autoPrint={autoPrint}
      />
    </div>
  );
}
