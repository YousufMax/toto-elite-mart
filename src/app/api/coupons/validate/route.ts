import { NextResponse } from 'next/server';
import { validateCoupon } from '@/lib/data-store';

export async function POST(req: Request) {
  try {
    const { code, subtotal } = await req.json();

    if (!code) {
      return NextResponse.json({ valid: false, message: 'Coupon code is required' }, { status: 400 });
    }

    const result = await validateCoupon(code, Number(subtotal) || 0);
    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error('[COUPON_VALIDATE_ERROR]', err);
    const errorMsg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ valid: false, message: errorMsg }, { status: 500 });
  }
}
