import { NextResponse } from 'next/server';
import { getProducts, createProduct } from '@/lib/data-store';
import { prisma } from '@/lib/prisma';
import { getSessionUser, hasPermission } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const categorySlug = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;
    const featuredOnly = searchParams.get('featured') === 'true';
    const sort = searchParams.get('sort') || undefined;
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined;

    let products = await getProducts({
      categorySlug,
      search,
      featuredOnly,
      sort,
      minPrice,
      maxPrice,
    });

    if (limit && limit > 0) {
      products = products.slice(0, limit);
    }

    return NextResponse.json({ success: true, count: products.length, products });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function POST(req: Request) {
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

    if (!name || !sku || !categoryId || !sellingPrice) {
      return NextResponse.json({ error: 'Name, SKU, category, and selling price are required.' }, { status: 400 });
    }

    const created = await createProduct({
      name,
      slug,
      sku,
      description,
      categoryId,
      purchaseCost: purchaseCost ? Number(purchaseCost) : 0,
      sellingPrice: Number(sellingPrice),
      salePrice: salePrice ? Number(salePrice) : null,
      stockQuantity: Number(stockQuantity) || 0,
      lowStockThreshold: Number(lowStockThreshold) || 5,
      isFeatured: Boolean(isFeatured),
      tags,
      images,
      colorVariants,
    });

    await logAudit({
      userId: user.userId,
      action: 'CREATE_PRODUCT',
      entityType: 'PRODUCT',
      entityId: created.id,
      afterState: { name, sku, sellingPrice, stockQuantity },
    });

    return NextResponse.json({ success: true, product: created });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
