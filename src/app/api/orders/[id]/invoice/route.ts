import { NextResponse } from 'next/server';
import { getOrderByNumber } from '@/lib/data-store';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const order = await getOrderByNumber(params.id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      order: {
        ...order,
        subtotal: Number(order.subtotal || 0),
        discount: Number(order.discount || 0),
        deliveryFee: Number(order.deliveryFee || 0),
        totalAmount: Number(order.totalAmount || 0),
        items: (order.items || []).map((it: any) => ({
          ...it,
          unitPrice: Number(it.unitPrice || 0),
          totalPrice: Number(it.totalPrice || it.unitPrice * it.quantity || 0),
        })),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
