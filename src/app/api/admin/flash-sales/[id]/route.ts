import { NextResponse } from 'next/server';
import {
  updateFlashSaleCampaign,
  deleteFlashSaleCampaign,
  getAllFlashSaleCampaigns,
} from '@/lib/data-store';
import { getSessionUser, hasPermission } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user || !hasPermission(user.role, 'products:read')) {
      return NextResponse.json({ error: 'Unauthorized. Admin permissions required.' }, { status: 403 });
    }

    const { id } = await params;
    const all = await getAllFlashSaleCampaigns();
    const found = all.find((c) => c.id === id);
    if (!found) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, campaign: found });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user || !hasPermission(user.role, 'products:write')) {
      return NextResponse.json({ error: 'Unauthorized. Admin permissions required.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const updated = await updateFlashSaleCampaign(id, body);

    await logAudit({
      userId: user.userId,
      action: 'UPDATE_FLASH_SALE',
      entityType: 'SETTING',
      entityId: id,
      afterState: body,
    });

    return NextResponse.json({ success: true, campaign: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update campaign';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user || !hasPermission(user.role, 'products:write')) {
      return NextResponse.json({ error: 'Unauthorized. Admin permissions required.' }, { status: 403 });
    }

    const { id } = await params;
    await deleteFlashSaleCampaign(id);

    await logAudit({
      userId: user.userId,
      action: 'DELETE_FLASH_SALE',
      entityType: 'SETTING',
      entityId: id,
    });

    return NextResponse.json({ success: true, message: 'Flash sale campaign deleted successfully' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete campaign';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
