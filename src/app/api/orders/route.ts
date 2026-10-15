import { NextResponse } from 'next/server';
import { createOrder, getAllOrders, getStoreSettings } from '@/lib/data-store';
import { getSessionUser, hasPermission } from '@/lib/auth';
import { evaluateOrderFraudRisk } from '@/lib/fraud-engine';

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

    // Retrieve settings and historical orders for fraud prevention
    const settings = await getStoreSettings();
    const pastOrders = await getAllOrders();

    const approxSubtotal = (items as any[]).reduce(
      (sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1),
      0
    );
    const approxTotal = Math.max(0, approxSubtotal + (Number(deliveryFee) || 60) - (Number(body.rewardDiscount) || 0));

    // Run Fraud Engine
    let fraudRisk: ReturnType<typeof evaluateOrderFraudRisk> | null = null;
    if (settings.fraudDetectionEnabled) {
      fraudRisk = evaluateOrderFraudRisk({
        phone: cleanPhone,
        name: customerName,
        address: deliveryAddress,
        city: deliveryCity,
        zone: deliveryZone,
        subtotal: approxSubtotal,
        totalAmount: approxTotal,
        paymentMethod: paymentMethod || 'COD',
        pastOrders,
        blacklistedPhones: settings.blacklistedPhones,
        whitelistedPhones: settings.whitelistedPhones,
        settings,
      });

      if (fraudRisk.isBlacklisted) {
        return NextResponse.json(
          { error: 'Sorry, this order cannot be processed. Please contact customer support for assistance.' },
          { status: 403 }
        );
      }
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
      rewardPointsRedeemed: Number(body.rewardPointsRedeemed) || 0,
      rewardDiscount: Number(body.rewardDiscount) || 0,
      fraudRiskScore: fraudRisk ? fraudRisk.riskScore : 0,
      fraudRiskTier: fraudRisk ? fraudRisk.riskTier : 'LOW',
      fraudRiskFlags: fraudRisk ? fraudRisk.flags : [],
      items,
    });

    return NextResponse.json({
      success: true,
      message: 'Order placed successfully!',
      orderNumber: order.orderNumber,
      order,
      fraudRecommendation: fraudRisk ? fraudRisk.recommendation : 'APPROVE',
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to place order';
    return NextResponse.json({ error: errorMsg }, { status: 400 });
  }
}
