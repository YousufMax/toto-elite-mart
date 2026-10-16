import React from 'react';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import Header from '@/components/storefront/Header';
import Footer from '@/components/storefront/Footer';
import ProductCard from '@/components/storefront/ProductCard';
import ProductDetailClient from './ProductDetailClient';
import { Metadata } from 'next';
import { getProductBySlugOrId, getProducts, getReviewsByProductId, getProductRedirect } from '@/lib/data-store';
import ProductReviewsSection from '@/components/storefront/ProductReviewsSection';
import { Truck, ShieldCheck, RefreshCw, PhoneCall } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  let product = await getProductBySlugOrId(params.slug);
  if (!product) {
    const redirectedSlug = await getProductRedirect(params.slug);
    if (redirectedSlug) {
      product = await getProductBySlugOrId(redirectedSlug);
    }
  }

  if (!product) {
    return {
      title: 'Product Not Found | Toto Elite Mart',
      description: 'The requested product could not be found.',
    };
  }

  const primaryImage =
    product.images?.[0]?.url ||
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800';
  const price = product.salePrice || product.sellingPrice;
  const canonicalUrl = `https://totoelitemart.com/product/${product.slug}`;
  const excerpt =
    product.description?.replace(/<[^>]+>/g, '').slice(0, 155) ||
    `Buy authentic ${product.name} at ৳${price} on Toto Elite Mart. Cash on Delivery across Bangladesh.`;

  return {
    title: `${product.name} | Best Price in Bangladesh — Toto Elite Mart`,
    description: `${product.name} at only ৳${price}. ${excerpt}`,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${product.name} — Only ৳${price} | Toto Elite Mart`,
      description: `Shop ${product.name} online in Bangladesh. Enjoy Cash on Delivery, fast 24-48h delivery, and 100% authentic quality guarantee.`,
      url: canonicalUrl,
      siteName: 'Toto Elite Mart',
      locale: 'en_US',
      type: 'website',
      images: [
        {
          url: `/product/${product.slug}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `${product.name} - Toto Elite Mart`,
        },
        {
          url: primaryImage,
          width: 800,
          height: 800,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} — ৳${price} | Toto Elite Mart`,
      description: `Cash on Delivery across Bangladesh. 100% genuine product.`,
      images: [`/product/${product.slug}/twitter-image`, primaryImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    other: {
      'product:price:amount': String(price),
      'product:price:currency': 'BDT',
      'product:availability': product.stockQuantity > 0 ? 'in stock' : 'out of stock',
      'product:brand': 'Toto Elite Mart',
    },
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  // 1. Check if the incoming slug was moved and has a registered 301 redirect
  const redirectSlug = await getProductRedirect(params.slug);
  if (redirectSlug && redirectSlug !== params.slug) {
    permanentRedirect(`/product/${redirectSlug}`);
  }

  // 2. Fetch product by slug or ID
  const product = await getProductBySlugOrId(params.slug);

  if (!product) {
    notFound();
  }

  // 3. If accessed by ID or non-canonical slug, permanently 301-redirect to canonical slug
  if (product.slug && product.slug !== params.slug) {
    permanentRedirect(`/product/${product.slug}`);
  }

  // Fetch approved customer reviews on server
  const initialReviews = await getReviewsByProductId(product.id, 'APPROVED');

  const avgScore =
    initialReviews.length > 0
      ? Number(
          (
            initialReviews.reduce(
              (sum: number, r: any) => sum + (Number(r.rating) || 5),
              0
            ) / initialReviews.length
          ).toFixed(1)
        )
      : 4.9;

  const currentPrice = Number(product.salePrice || product.sellingPrice || 0);
  const canonicalUrl = `https://totoelitemart.com/product/${product.slug}`;

  // Complete Google Rich Snippet (Schema.org) Product Specification
  const productJsonLd: any = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image:
      product.images && product.images.length > 0
        ? product.images.map((img: any) => img.url)
        : [
            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
          ],
    description: product.description?.replace(/<[^>]+>/g, '').slice(0, 300) || product.name,
    sku: product.sku || product.id,
    mpn: product.sku || product.id,
    brand: {
      '@type': 'Brand',
      name: 'Toto Elite Mart',
    },
    offers: {
      '@type': 'Offer',
      url: canonicalUrl,
      priceCurrency: 'BDT',
      price: currentPrice,
      priceValidUntil: '2027-12-31',
      itemCondition: 'https://schema.org/NewCondition',
      availability:
        product.stockQuantity > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Toto Elite Mart',
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'BD',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 7,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/FreeReturn',
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: '60',
          currency: 'BDT',
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'BD',
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 0,
            maxValue: 1,
            unitCode: 'DAY',
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 1,
            maxValue: 3,
            unitCode: 'DAY',
          },
        },
      },
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: avgScore,
      reviewCount: initialReviews.length > 0 ? initialReviews.length : 1,
      bestRating: 5,
      worstRating: 1,
    },
  };

  // Add individual reviews to schema if present
  if (initialReviews.length > 0) {
    productJsonLd.review = initialReviews.slice(0, 5).map((r: any) => ({
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: r.customerName || 'Verified Customer',
      },
      datePublished: r.createdAt
        ? new Date(r.createdAt).toISOString().split('T')[0]
        : '2026-10-15',
      reviewBody: r.comment,
      reviewRating: {
        '@type': 'Rating',
        ratingValue: Number(r.rating) || 5,
        bestRating: 5,
        worstRating: 1,
      },
    }));
  }

  // Breadcrumb Schema for Google SERP Navigation
  const breadcrumbElements: any[] = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: 'https://totoelitemart.com',
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Catalog',
      item: 'https://totoelitemart.com/shop',
    },
  ];

  if (product.category?.name) {
    breadcrumbElements.push({
      '@type': 'ListItem',
      position: 3,
      name: product.category.name,
      item: `https://totoelitemart.com/shop?category=${product.category.slug || product.categorySlug}`,
    });
    breadcrumbElements.push({
      '@type': 'ListItem',
      position: 4,
      name: product.name,
      item: canonicalUrl,
    });
  } else {
    breadcrumbElements.push({
      '@type': 'ListItem',
      position: 3,
      name: product.name,
      item: canonicalUrl,
    });
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbElements,
  };

  // Get related products from same category
  const allCategoryProducts = await getProducts({ categorySlug: product.category?.slug || product.categorySlug });
  const relatedProducts = allCategoryProducts.filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Schema.org Structured Data for Google Rich Snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
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
              <p className="text-[11px] text-slate-500">
                Call{" "}
                <a
                  href="tel:+8809697192016"
                  className="font-semibold text-slate-700 hover:text-amber-600 underline underline-offset-2 font-mono"
                >
                  +880 9697-192016
                </a>{" "}
                anytime.
              </p>
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-6">
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
