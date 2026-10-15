import { NextResponse } from 'next/server';
import { getActiveFlashSaleCampaign } from '@/lib/data-store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const { campaign, serverTime, secondsRemaining } = await getActiveFlashSaleCampaign();

    return NextResponse.json({
      success: true,
      active: Boolean(campaign && campaign.status === 'ACTIVE' && secondsRemaining > 0),
      campaign,
      serverTime,
      secondsRemaining,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error fetching active flash sale';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
