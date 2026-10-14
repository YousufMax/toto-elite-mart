import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getBanners, createBanner } from '@/lib/data-store';
import { prisma } from '@/lib/prisma';
import { getSessionUser, hasPermission } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get('all') === 'true';
    const banners = await getBanners(includeInactive);
    return NextResponse.json({ success: true, count: banners.length, banners });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || !hasPermission(user.role, 'products:write')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { title, subtitle, imageUrl, fileId, targetUrl, sortOrder } = await req.json();
    if (!title || !imageUrl) {
      return NextResponse.json({ error: 'Title and image URL are required' }, { status: 400 });
    }

    const banner = await createBanner({
      title,
      subtitle: subtitle || undefined,
      imageUrl,
      fileId: fileId || undefined,
      targetUrl: targetUrl || '/shop',
      sortOrder: sortOrder ? Number(sortOrder) : 0,
    });

    try {
      revalidatePath('/', 'page');
      revalidatePath('/admin/banners', 'page');
    } catch (e) {
      // ignore in dev/mock environments
    }

    return NextResponse.json({ success: true, banner });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
