import { NextResponse } from 'next/server';
import { getCategoryById, updateCategory, deleteCategory } from '@/lib/data-store';
import { getSessionUser, hasPermission } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const category = await getCategoryById(params.id);
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, category });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user || !hasPermission(user.role, 'categories:write')) {
      return NextResponse.json({ error: 'Unauthorized. Category write permissions required.' }, { status: 403 });
    }

    const { name, slug, description, imageUrl, sortOrder } = await req.json();

    const updated = await updateCategory(params.id, {
      name: name ? name.trim() : undefined,
      slug: slug ? slug.trim() : undefined,
      description: description !== undefined ? description.trim() : undefined,
      imageUrl: imageUrl !== undefined ? imageUrl.trim() : undefined,
      sortOrder: sortOrder !== undefined ? Number(sortOrder) : undefined,
    });

    await logAudit({
      userId: user.userId,
      action: 'UPDATE_CATEGORY',
      entityType: 'CATEGORY',
      entityId: params.id,
      afterState: { name, slug },
    });

    return NextResponse.json({ success: true, category: updated });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error updating category';
    return NextResponse.json({ error: errorMsg }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user || !hasPermission(user.role, 'categories:write')) {
      return NextResponse.json({ error: 'Unauthorized. Category write permissions required.' }, { status: 403 });
    }

    await deleteCategory(params.id);

    await logAudit({
      userId: user.userId,
      action: 'DELETE_CATEGORY',
      entityType: 'CATEGORY',
      entityId: params.id,
    });

    return NextResponse.json({ success: true, message: 'Category deleted successfully' });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error deleting category';
    return NextResponse.json({ error: errorMsg }, { status: 400 });
  }
}
