import { NextResponse } from 'next/server';
import { updateReview, deleteReview, getProductReviewStats } from '@/lib/data-store';
import { getSessionUser } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { revalidatePath } from 'next/cache';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN' && user.role !== 'ORDER_MANAGER')) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const body = await req.json();
    const { status, adminReply, customerName, customerPhone, rating, comment, images, isVerified, productId } = body;

    if (status && !['APPROVED', 'PENDING', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Valid status (APPROVED, PENDING, REJECTED) is required.' }, { status: 400 });
    }

    const updated = await updateReview(params.id, {
      status,
      adminReply,
      customerName,
      customerPhone,
      rating: rating !== undefined ? Number(rating) : undefined,
      comment,
      images,
      isVerified,
      productId,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Review not found.' }, { status: 404 });
    }

    await logAudit({
      userId: user.userId,
      action: 'UPDATE_REVIEW',
      entityType: 'REVIEW' as any,
      entityId: params.id,
      afterState: updated as any,
    });

    const stats = updated.productId ? await getProductReviewStats(updated.productId) : null;
    try {
      revalidatePath('/', 'page');
      revalidatePath('/shop', 'page');
      revalidatePath('/product/[slug]', 'page');
    } catch {}

    return NextResponse.json({ success: true, review: updated, stats });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const deleted = await deleteReview(params.id);
    if (!deleted) {
      return NextResponse.json({ error: 'Review not found.' }, { status: 404 });
    }

    await logAudit({
      userId: user.userId,
      action: 'DELETE_REVIEW',
      entityType: 'REVIEW' as any,
      entityId: params.id,
    });

    try {
      revalidatePath('/', 'page');
      revalidatePath('/shop', 'page');
      revalidatePath('/product/[slug]', 'page');
    } catch {}

    return NextResponse.json({ success: true, message: 'Review deleted successfully.' });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
