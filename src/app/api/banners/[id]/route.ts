import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { updateBanner, deleteBanner } from '@/lib/data-store';
import { getSessionUser, hasPermission } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user || !hasPermission(user.role, 'products:write')) {
      return NextResponse.json({ error: 'Unauthorized. Banner management permissions required.' }, { status: 403 });
    }

    const body = await req.json();
    const { title, subtitle, imageUrl, targetUrl, isActive, sortOrder } = body;

    const updated = await updateBanner(params.id, {
      title: title ? title.trim() : undefined,
      subtitle: subtitle !== undefined ? subtitle.trim() : undefined,
      imageUrl: imageUrl ? imageUrl.trim() : undefined,
      targetUrl: targetUrl ? targetUrl.trim() : undefined,
      isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      sortOrder: sortOrder !== undefined ? Number(sortOrder) : undefined,
    });

    await logAudit({
      userId: user.userId,
      action: 'UPDATE_BANNER',
      entityType: 'BANNER',
      entityId: params.id,
      afterState: { isActive, title },
    });

    try {
      revalidatePath('/', 'page');
      revalidatePath('/admin/banners', 'page');
    } catch (e) {
      // ignore
    }

    return NextResponse.json({ success: true, banner: updated });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user || !hasPermission(user.role, 'products:write')) {
      return NextResponse.json({ error: 'Unauthorized. Banner deletion permissions required.' }, { status: 403 });
    }

    await deleteBanner(params.id);

    await logAudit({
      userId: user.userId,
      action: 'DELETE_BANNER',
      entityType: 'BANNER',
      entityId: params.id,
    });

    try {
      revalidatePath('/', 'page');
      revalidatePath('/admin/banners', 'page');
    } catch (e) {
      // ignore
    }

    return NextResponse.json({ success: true, message: 'Banner deleted successfully' });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
