import { NextResponse } from 'next/server';
import { getStoreSettings, updateStoreSettings } from '@/lib/data-store';
import { getSessionUser } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function GET() {
  try {
    const settings = await getStoreSettings();
    return NextResponse.json({ success: true, settings });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized. Admin permissions required.' }, { status: 403 });
    }

    const body = await req.json();
    const updated = await updateStoreSettings({
      freeDeliveryEnabled: body.freeDeliveryEnabled !== undefined ? Boolean(body.freeDeliveryEnabled) : undefined,
      freeDeliveryThreshold: body.freeDeliveryThreshold !== undefined ? Math.max(0, Number(body.freeDeliveryThreshold) || 0) : undefined,
      freeDeliveryOutsideThreshold: body.freeDeliveryOutsideThreshold !== undefined ? Math.max(0, Number(body.freeDeliveryOutsideThreshold) || 0) : undefined,
      freeDeliveryBannerText: body.freeDeliveryBannerText !== undefined ? String(body.freeDeliveryBannerText) : undefined,
      freeDeliveryUnlockedText: body.freeDeliveryUnlockedText !== undefined ? String(body.freeDeliveryUnlockedText) : undefined,
      freeDeliveryBarColor: body.freeDeliveryBarColor && ['amber', 'emerald', 'indigo', 'rose'].includes(body.freeDeliveryBarColor) ? body.freeDeliveryBarColor : undefined,
      minOrderAmount: body.minOrderAmount !== undefined ? Math.max(0, Number(body.minOrderAmount) || 0) : undefined,
      cardStepperEnabled: body.cardStepperEnabled !== undefined ? Boolean(body.cardStepperEnabled) : undefined,
      cardShowDiscountBadge: body.cardShowDiscountBadge !== undefined ? Boolean(body.cardShowDiscountBadge) : undefined,
      cardShowRating: body.cardShowRating !== undefined ? Boolean(body.cardShowRating) : undefined,
      cardShowStockWarning: body.cardShowStockWarning !== undefined ? Boolean(body.cardShowStockWarning) : undefined,
      reviewAutoApprove: body.reviewAutoApprove !== undefined ? Boolean(body.reviewAutoApprove) : undefined,
      reviewAllowImages: body.reviewAllowImages !== undefined ? Boolean(body.reviewAllowImages) : undefined,
      reviewMinCharacters: body.reviewMinCharacters !== undefined ? Math.max(1, Number(body.reviewMinCharacters) || 1) : undefined,
    });

    await logAudit({
      userId: user.userId,
      action: 'UPDATE_STORE_SETTINGS',
      entityType: 'SETTING',
      entityId: 'mart_store_settings',
      afterState: updated as unknown as Record<string, unknown>,
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
