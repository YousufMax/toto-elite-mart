import { NextResponse } from 'next/server';
import { getCategories, createCategory } from '@/lib/data-store';
import { prisma } from '@/lib/prisma';
import { getSessionUser, hasPermission } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function GET() {
  try {
    const categories = await getCategories();
    return NextResponse.json({ success: true, count: categories.length, categories });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || !hasPermission(user.role, 'categories:write')) {
      return NextResponse.json({ error: 'Unauthorized. Category write permissions required.' }, { status: 403 });
    }

    const { name, slug, description, imageUrl, sortOrder } = await req.json();
    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const cleanSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const created = await createCategory({
      name,
      slug: cleanSlug,
      description: description || undefined,
      imageUrl: imageUrl || undefined,
      sortOrder: sortOrder ? Number(sortOrder) : undefined,
    });

    await logAudit({
      userId: user.userId,
      action: 'CREATE_CATEGORY',
      entityType: 'CATEGORY',
      entityId: created.id,
      afterState: { name, slug: cleanSlug },
    });

    return NextResponse.json({ success: true, category: created });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
