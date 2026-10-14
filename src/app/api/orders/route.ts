import { NextResponse } from 'next/server';
import { createOrder, getAllOrders } from '@/lib/data-store';
import { getSessionUser, hasPermission } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || !hasPermission(user.role, 'orders:read')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;

    const orders = await getAllOrders({ status, search });
    return NextResponse.json({
      success: true,
      count: orders.length,
      orders,
      currentUser: {
        userId: user.userId,
        role: user.role,
        email: user.email,
        fullName: user.fullName,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      customerName,
      customerPhone,
      deliveryAddress,
      deliveryCity,
      deliveryZone,
      deliveryFee,
      paymentMethod,
      couponCode,
      notes,
      items,
    } = body;

    // Validate required fields
    if (!customerName || !customerPhone || !deliveryAddress) {
      return NextResponse.json(
        { error: 'Customer name, phone number, and delivery address are required.' },
        { status: 400 }
      );
    }

    // BD Phone validation: Must be 11 digits starting with 01
    const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
    if (!/^01[3-9]\d{8}$/.test(cleanPhone)) {
      return NextResponse.json(
        { error: 'Please enter a valid 11-digit Bangladeshi mobile number (e.g., 01712345678).' },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty. Please add items to checkout.' }, { status: 400 });
    }

    const order = await createOrder({
      customerName: customerName.trim(),
      customerPhone: cleanPhone,
      deliveryAddress: deliveryAddress.trim(),
      deliveryCity: deliveryCity || 'Dhaka',
      deliveryZone: deliveryZone || 'Inside Dhaka',
      deliveryFee: Number(deliveryFee) || 60,
      paymentMethod: paymentMethod || 'COD',
      couponCode: couponCode ? couponCode.trim() : undefined,
      notes: notes ? notes.trim() : undefined,
      items,
    });

    return NextResponse.json({
      success: true,
      message: 'Order placed successfully!',
      orderNumber: order.orderNumber,
      order,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to place order';
    return NextResponse.json({ error: errorMsg }, { status: 400 });
  }
}
