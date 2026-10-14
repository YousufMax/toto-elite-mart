import { NextResponse } from 'next/server';
import { getProductById, updateProduct, deleteProduct } from '@/lib/data-store';
import { getSessionUser, hasPermission } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const product = await getProductById(params.id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, product });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user || !hasPermission(user.role, 'products:write')) {
      return NextResponse.json({ error: 'Unauthorized. Admin permissions required.' }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      slug,
      sku,
      description,
      categoryId,
      purchaseCost,
      sellingPrice,
      salePrice,
      stockQuantity,
      lowStockThreshold,
      isFeatured,
      tags,
      images,
      colorVariants,
    } = body;

    const updated = await updateProduct(params.id, {
      name: name ? name.trim() : undefined,
      slug: slug ? slug.trim() : undefined,
      sku: sku ? sku.trim().toUpperCase() : undefined,
      description: description !== undefined ? description.trim() : undefined,
      categoryId,
      purchaseCost: purchaseCost !== undefined ? Number(purchaseCost) : undefined,
      sellingPrice: sellingPrice !== undefined ? Number(sellingPrice) : undefined,
      salePrice: salePrice !== undefined ? (salePrice ? Number(salePrice) : null) : undefined,
      stockQuantity: stockQuantity !== undefined ? Number(stockQuantity) : undefined,
      lowStockThreshold: lowStockThreshold !== undefined ? Number(lowStockThreshold) : undefined,
      isFeatured: isFeatured !== undefined ? Boolean(isFeatured) : undefined,
      tags,
      images,
      colorVariants,
    });

    await logAudit({
      userId: user.userId,
      action: 'UPDATE_PRODUCT',
      entityType: 'PRODUCT',
      entityId: params.id,
      afterState: { name, sku, sellingPrice, stockQuantity },
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error updating product';
    return NextResponse.json({ error: errorMsg }, { status: 400 });
  }
}

export const PUT = PATCH;

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user || !hasPermission(user.role, 'products:write')) {
      return NextResponse.json({ error: 'Unauthorized. Admin permissions required.' }, { status: 403 });
    }

    await deleteProduct(params.id);

    await logAudit({
      userId: user.userId,
      action: 'ARCHIVE_PRODUCT',
      entityType: 'PRODUCT',
      entityId: params.id,
    });

    return NextResponse.json({ success: true, message: 'Product archived successfully' });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error archiving product';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
