import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Header from '@/components/storefront/Header';
import Footer from '@/components/storefront/Footer';
import ProductCard from '@/components/storefront/ProductCard';
import ProductDetailClient from './ProductDetailClient';
import { Metadata } from 'next';
import { getProductBySlugOrId, getProducts, getReviewsByProductId } from '@/lib/data-store';
import ProductReviewsSection from '@/components/storefront/ProductReviewsSection';
import { Truck, ShieldCheck, RefreshCw, PhoneCall } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await getProductBySlugOrId(params.slug);
  if (!product) {
    return {
      title: 'Product Not Found | Toto Elite Mart',
      description: 'The requested product could not be found.',
    };
  }

  const primaryImage = product.images?.[0]?.url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800';
  const price = product.salePrice || product.sellingPrice;

  return {
    title: `${product.name} | Toto Elite Mart`,
    description: product.description?.slice(0, 160) || `Buy ${product.name} at ৳${price} on Toto Elite Mart. Fast delivery across Bangladesh.`,
    alternates: {
      canonical: `/product/${product.slug}`,
    },
    openGraph: {
      title: `${product.name} - Toto Elite Mart`,
      description: product.description?.slice(0, 160) || `Buy authentic ${product.name} online in Bangladesh.`,
      url: `/product/${product.slug}`,
      images: [
        {
          url: primaryImage,
          width: 800,
          height: 800,
          alt: product.name,
        },
      ],
    },
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProductBySlugOrId(params.slug);

  if (!product) {
    notFound();
  }

  // Fetch approved customer reviews on server
  const initialReviews = await getReviewsByProductId(product.id, 'APPROVED');

  const avgScore = initialReviews.length > 0
    ? Number((initialReviews.reduce((sum: number, r: any) => sum + (Number(r.rating) || 5), 0) / initialReviews.length).toFixed(1))
    : 5.0;

  // Schema.org JSON-LD Structured Data
  const jsonLd: any = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.images?.map((img: any) => img.url) || [],
    description: product.description || product.name,
    sku: product.sku,
    offers: {
      '@type': 'Offer',
      url: `https://totoelitemart.com/product/${product.slug}`,
      priceCurrency: 'BDT',
      price: product.salePrice || product.sellingPrice,
      availability: product.stockQuantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Toto Elite Mart',
      },
    },
  };

  if (initialReviews.length > 0) {
    jsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: avgScore,
      reviewCount: initialReviews.length,
      bestRating: 5,
      worstRating: 1,
    };
  }

  // Get related products from same category
  const allCategoryProducts = await getProducts({ categorySlug: product.category?.slug || product.categorySlug });
  const relatedProducts = allCategoryProducts.filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-12">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <Link href="/" className="hover:text-slate-900">Home</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-slate-900">Catalog</Link>
          <span>/</span>
          {product.category && (
            <>
              <Link href={`/shop?category=${product.category.slug}`} className="hover:text-slate-900">
                {product.category.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-slate-900 font-semibold truncate max-w-xs">{product.name}</span>
        </div>

        {/* Product Main Section (Client Component for Gallery & Quantity) */}
        <ProductDetailClient product={product} />

        {/* Delivery & Assurance Perks */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Cash on Delivery</h4>
              <p className="text-[11px] text-slate-500">Pay in cash upon delivery anywhere in BD.</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Original & Authentic</h4>
              <p className="text-[11px] text-slate-500">100% brand warranty & genuine quality.</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center text-sky-600 shrink-0">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">7-Day Replacement</h4>
              <p className="text-[11px] text-slate-500">Instant exchange for any defective units.</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center text-violet-600 shrink-0">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Order by Phone</h4>
              <p className="text-[11px] text-slate-500">Call +880 1712-000000 anytime.</p>
            </div>
          </div>
        </div>

        {/* Mart Customer Reviews & Ratings */}
        <ProductReviewsSection
          productId={product.id}
          productName={product.name}
          initialReviews={initialReviews}
        />

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="space-y-6 pt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-black text-slate-950">You May Also Like</h2>
              <Link
                href={`/shop?category=${product.category?.slug || product.categorySlug}`}
                className="text-xs font-bold text-amber-600 hover:text-amber-700"
              >
                View Category
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map((relProd) => (
                <ProductCard key={relProd.id} product={relProd} />
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
