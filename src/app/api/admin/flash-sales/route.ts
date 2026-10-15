import { NextResponse } from 'next/server';
import {
  getAllFlashSaleCampaigns,
  createFlashSaleCampaign,
} from '@/lib/data-store';
import { getSessionUser, hasPermission } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || !hasPermission(user.role, 'products:read')) {
      return NextResponse.json({ error: 'Unauthorized. Admin permissions required.' }, { status: 403 });
    }

    const campaigns = await getAllFlashSaleCampaigns();
    return NextResponse.json({ success: true, count: campaigns.length, campaigns });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch campaigns';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || !hasPermission(user.role, 'products:write')) {
      return NextResponse.json({ error: 'Unauthorized. Admin permissions required.' }, { status: 403 });
    }

    const body = await req.json();
    const { title, subtitle, bannerUrl, startDate, endDate, items, status, isActive } = body;

    if (!title || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Campaign title, start date/time, and end date/time are required.' },
        { status: 400 }
      );
    }

    const startMs = new Date(startDate).getTime();
    const endMs = new Date(endDate).getTime();
    if (isNaN(startMs) || isNaN(endMs) || endMs <= startMs) {
      return NextResponse.json(
        { error: 'End date & time must be strictly after the start date & time.' },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'At least one product must be selected for the Flash Sale campaign.' },
        { status: 400 }
      );
    }

    // Validate each item
    for (const item of items) {
      if (!item.productId || typeof item.flashPrice !== 'number' || item.flashPrice <= 0) {
        return NextResponse.json(
          { error: 'Each product must have a valid positive Flash Price.' },
          { status: 400 }
        );
      }
      if (typeof item.allocatedStock !== 'number' || item.allocatedStock <= 0) {
        return NextResponse.json(
          { error: 'Each product must have an allocated Flash Stock quantity greater than 0.' },
          { status: 400 }
        );
      }
    }

    const created = await createFlashSaleCampaign({
      title: title.trim(),
      subtitle: subtitle ? subtitle.trim() : null,
      bannerUrl: bannerUrl ? bannerUrl.trim() : null,
      startDate,
      endDate,
      status: status || 'SCHEDULED',
      isActive: isActive !== false,
      items,
    });

    await logAudit({
      userId: user.userId,
      action: 'CREATE_FLASH_SALE',
      entityType: 'SETTING',
      entityId: created.id,
      afterState: { title, startDate, endDate, itemCount: items.length },
    });

    return NextResponse.json({ success: true, campaign: created }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create campaign';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
