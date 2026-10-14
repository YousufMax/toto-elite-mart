import { NextResponse } from 'next/server';
import { getAllCoupons, createCoupon } from '@/lib/data-store';
import { getSessionUser, hasPermission } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || !hasPermission(user.role, 'coupons:read')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;

    const data = await getAllCoupons({ search, status });
    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || !hasPermission(user.role, 'coupons:write')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const {
      code,
      discountType,
      discountValue,
      minOrderValue,
      maxDiscountValue,
      usageLimit,
      startDate,
      endDate,
      isActive,
    } = body;

    if (!code || !code.trim()) {
      return NextResponse.json({ error: 'Coupon code is required.' }, { status: 400 });
    }

    const parsedValue = Number(discountValue);
    if (isNaN(parsedValue) || parsedValue <= 0) {
      return NextResponse.json({ error: 'Discount value must be greater than 0.' }, { status: 400 });
    }

    if (discountType === 'PERCENTAGE' && parsedValue > 100) {
      return NextResponse.json({ error: 'Percentage discount cannot exceed 100%.' }, { status: 400 });
    }

    const coupon = await createCoupon({
      code: code.trim().toUpperCase(),
      discountType: discountType || 'PERCENTAGE',
      discountValue: parsedValue,
      minOrderValue: minOrderValue !== undefined && minOrderValue !== '' ? Number(minOrderValue) : 0,
      maxDiscountValue: maxDiscountValue !== undefined && maxDiscountValue !== '' ? Number(maxDiscountValue) : null,
      usageLimit: usageLimit !== undefined && usageLimit !== '' ? Number(usageLimit) : null,
      startDate: startDate || null,
      endDate: endDate || null,
      isActive: isActive !== false,
    });

    return NextResponse.json({
      success: true,
      message: `Coupon "${coupon.code}" created successfully!`,
      coupon,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: errorMsg }, { status: 400 });
  }
}
