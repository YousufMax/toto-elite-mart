import { NextResponse } from 'next/server';
import { getCustomerRewardProfile, getStoreSettings, creditRewardPoints } from '@/lib/data-store';
import { getSessionUser } from '@/lib/auth';
import { normalizeBdPhone } from '@/lib/fraud-engine';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawPhone = searchParams.get('phone');
    if (!rawPhone) {
      return NextResponse.json({ error: 'Phone number parameter is required' }, { status: 400 });
    }

    const phone = normalizeBdPhone(rawPhone);
    const settings = await getStoreSettings();

    if (!settings.rewardPointsEnabled) {
      return NextResponse.json({
        success: true,
        enabled: false,
        points: 0,
        pointValueBdt: 1,
        minRedeemPoints: 50,
        equivalentBdt: 0,
        canRedeem: false,
      });
    }

    const profile = await getCustomerRewardProfile(phone);
    const pointValueBdt = Number(settings.rewardPointValueBdt) || 1;
    const minRedeemPoints = Number(settings.rewardMinRedeemPoints) || 50;
    const equivalentBdt = profile.points * pointValueBdt;
    const canRedeem = profile.points >= minRedeemPoints;

    return NextResponse.json({
      success: true,
      enabled: true,
      phone,
      points: profile.points,
      totalEarned: profile.totalEarned,
      totalRedeemed: profile.totalRedeemed,
      history: profile.history.slice(0, 10),
      pointValueBdt,
      minRedeemPoints,
      equivalentBdt,
      canRedeem,
      earnRate: settings.rewardPointsEarnRate || 100, // e.g. 1 pt per ৳100
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { phone, points, reason } = body;
    if (!phone || typeof points !== 'number') {
      return NextResponse.json({ error: 'Valid phone and points amount are required' }, { status: 400 });
    }

    const profile = await creditRewardPoints(phone, points, reason || 'Manual Admin Adjustment');
    return NextResponse.json({ success: true, profile });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
