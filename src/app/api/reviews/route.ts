import { NextResponse } from 'next/server';
import { getReviewsByProductId, getAllReviews, createReview, auditAndSyncAllReviews } from '@/lib/data-store';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const forAdmin = searchParams.get('forAdmin') === 'true';

    if (forAdmin) {
      const user = await getSessionUser();
      if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN' && user.role !== 'ORDER_MANAGER')) {
        return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
      }
      const reviews = await getAllReviews({ status, search });
      return NextResponse.json({ success: true, count: reviews.length, reviews });
    }

    if (!productId) {
      return NextResponse.json({ error: 'productId is required.' }, { status: 400 });
    }

    const reviews = await getReviewsByProductId(productId, 'APPROVED');
    return NextResponse.json({ success: true, count: reviews.length, reviews });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.action === 'sync') {
      const user = await getSessionUser();
      if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
        return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
      }
      const report = await auditAndSyncAllReviews();
      return NextResponse.json({ success: true, report });
    }

    const { productId, customerName, customerPhone, rating, comment, images } = body;

    if (!productId || !customerName || !rating || !comment) {
      return NextResponse.json(
        { error: 'Product ID, name, rating (1-5), and review text are required.' },
        { status: 400 }
      );
    }

    const review = await createReview({
      productId,
      customerName,
      customerPhone,
      rating: Number(rating),
      comment,
      images: Array.isArray(images) ? images : [],
      isVerified: true,
    });

    return NextResponse.json({ success: true, review });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
