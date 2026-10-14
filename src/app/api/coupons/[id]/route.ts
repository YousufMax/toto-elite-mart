import { NextResponse } from 'next/server';
import { getCouponById, updateCoupon, deleteCoupon, toggleCouponStatus } from '@/lib/data-store';
import { getSessionUser, hasPermission } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user || !hasPermission(user.role, 'coupons:read')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!params.id || params.id === 'undefined') {
      return NextResponse.json({ error: 'Invalid coupon identifier' }, { status: 400 });
    }

    const coupon = await getCouponById(params.id);
    if (!coupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, coupon });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user || !hasPermission(user.role, 'coupons:write')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!params.id || params.id === 'undefined') {
      return NextResponse.json({ error: 'Invalid coupon identifier' }, { status: 400 });
    }

    const body = await req.json();
    const updated = await updateCoupon(params.id, body);

    return NextResponse.json({
      success: true,
      message: 'Coupon updated successfully!',
      coupon: updated,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to update coupon';
    return NextResponse.json({ error: errorMsg }, { status: 400 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user || !hasPermission(user.role, 'coupons:write')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!params.id || params.id === 'undefined') {
      return NextResponse.json({ error: 'Invalid coupon identifier' }, { status: 400 });
    }

    const body = await req.json();
    if (typeof body.isActive !== 'boolean') {
      return NextResponse.json({ error: 'isActive boolean flag required' }, { status: 400 });
    }

    const updated = await toggleCouponStatus(params.id, body.isActive);
    return NextResponse.json({
      success: true,
      message: `Coupon ${body.isActive ? 'activated' : 'deactivated'} successfully!`,
      coupon: updated,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to toggle coupon status';
    return NextResponse.json({ error: errorMsg }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user || !hasPermission(user.role, 'coupons:write')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!params.id || params.id === 'undefined') {
      return NextResponse.json({ error: 'Invalid coupon identifier' }, { status: 400 });
    }

    await deleteCoupon(params.id);
    return NextResponse.json({
      success: true,
      message: 'Coupon deleted successfully!',
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to delete coupon';
    return NextResponse.json({ error: errorMsg }, { status: 400 });
  }
}
