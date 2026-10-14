import { NextResponse } from 'next/server';
import { getOrderByNumber } from '@/lib/data-store';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderNumber = searchParams.get('orderNumber');
    const phone = searchParams.get('phone');

    if (!orderNumber || !phone) {
      return NextResponse.json({ error: 'Order number and phone number are both required' }, { status: 400 });
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const cleanOrderNumber = orderNumber.trim().toUpperCase();

    const order = await getOrderByNumber(cleanOrderNumber, cleanPhone);
    if (!order) {
      return NextResponse.json(
        { error: 'No matching order found for this order number and phone combination.' },
        { status: 404 }
      );
    }

    // Return sanitized public tracking info
    return NextResponse.json({
      success: true,
      order: {
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        deliveryCity: order.deliveryCity,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        items: order.items?.map((item: any) => ({
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        })),
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
