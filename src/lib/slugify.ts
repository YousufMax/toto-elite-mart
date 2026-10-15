import { prisma } from './prisma';

async function checkDbConnected(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

/**
 * Generates a clean, lowercase, hyphen-separated SEO slug.
 * - Converts accents/diacritics to ASCII (e.g. é -> e)
 * - Replaces '&' with 'and'
 * - Replaces non-alphanumeric characters with hyphens
 * - Collapses consecutive hyphens
 * - Trims hyphens from start and end
 * - Limits length safely to max 90 characters
 */
export function slugify(text: string): string {
  if (!text) return '';

  return text
    .toString()
    .normalize('NFKD') // Normalize unicode
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .toLowerCase()
    .trim()
    .replace(/&+/g, '-and-') // Replace & with 'and'
    .replace(/[@#%*+=_~^$!?;:,.<>()\[\]{}"'\\\/|]/g, '-') // Replace punctuation with hyphen
    .replace(/[^a-z0-9\-]+/g, '-') // Remove any remaining non-alphanumeric chars
    .replace(/-+/g, '-') // Collapse multiple hyphens into single hyphen
    .replace(/^-+|-+$/g, '') // Trim leading and trailing hyphens
    .slice(0, 90) // Safe max length
    .replace(/-+$/, ''); // Trim hyphen if sliced at hyphen boundary
}

/**
 * Resolves a unique product slug, avoiding collisions with existing products and redirects.
 * Appends -2, -3 etc. if a collision is found.
 */
export async function resolveUniqueProductSlug(
  baseInput: string,
  excludeProductId?: string
): Promise<string> {
  const baseSlug = slugify(baseInput) || 'product';
  let candidate = baseSlug;
  let counter = 1;

  try {
    const isConnected = await checkDbConnected();
    if (isConnected) {
      while (true) {
        // 1. Check collision in Product table
        const existingProduct = await prisma.product.findFirst({
          where: {
            slug: candidate,
            ...(excludeProductId ? { id: { not: excludeProductId } } : {}),
          },
          select: { id: true },
        });

        // 2. Check collision in ProductRedirect table (old slugs)
        let existingRedirect = null;
        try {
          existingRedirect = await (prisma as any).productRedirect.findUnique({
            where: { oldSlug: candidate },
            select: { id: true, productId: true },
          });
        } catch {
          // If table not yet ready during initial migration
        }

        const isCollision =
          existingProduct !== null ||
          (existingRedirect !== null &&
            (!excludeProductId || existingRedirect.productId !== excludeProductId));

        if (!isCollision) {
          return candidate;
        }

        counter++;
        candidate = `${baseSlug}-${counter}`;
      }
    }
  } catch {
    // Fallback if db offline
  }

  return candidate;
}
