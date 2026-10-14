import React from 'react';
import Link from 'next/link';
import Header from '@/components/storefront/Header';
import Footer from '@/components/storefront/Footer';
import ProductCard from '@/components/storefront/ProductCard';
import { getProducts, getCategories } from '@/lib/data-store';
import { Filter, SlidersHorizontal } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ShopPage({
  searchParams,
}: {
  searchParams: { category?: string; search?: string; sort?: string };
}) {
  const [products, categories] = await Promise.all([
    getProducts({
      categorySlug: searchParams.category,
      search: searchParams.search,
      sort: searchParams.sort,
    }),
    getCategories(),
  ]);

  const activeCategory = categories.find((c) => c.slug === searchParams.category);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        {/* Breadcrumb & Header */}
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <Link href="/" className="hover:text-slate-900">Home</Link>
            <span>/</span>
            <span className="text-slate-900 font-semibold">Catalog</span>
            {activeCategory && (
              <>
                <span>/</span>
                <span className="text-amber-600 font-bold">{activeCategory.name}</span>
              </>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-950">
            {activeCategory ? activeCategory.name : searchParams.search ? `Results for "${searchParams.search}"` : 'All Products'}
          </h1>
          <p className="text-xs text-slate-500">
            Showing {products.length} {products.length === 1 ? 'item' : 'items'} available for delivery.
          </p>
        </div>

        {/* Filter Navigation Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Categories Horizontal Scroll */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            <Link
              href="/shop"
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
                !searchParams.category
                  ? 'bg-slate-950 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/shop?category=${cat.slug}${searchParams.sort ? `&sort=${searchParams.sort}` : ''}`}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
                  searchParams.category === cat.slug
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat.name}
              </Link>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto text-xs pt-2 md:pt-0 border-t border-slate-100 md:border-0">
            <SlidersHorizontal className="w-4 h-4 text-slate-400" />
            <span className="text-slate-500 font-medium">Sort by:</span>
            <div className="flex items-center gap-1 font-semibold flex-wrap">
              <Link
                href={`/shop?${searchParams.category ? `category=${searchParams.category}&` : ''}sort=price_asc`}
                className={`px-2.5 py-1 rounded-lg ${searchParams.sort === 'price_asc' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                Price: Low to High
              </Link>
              <Link
                href={`/shop?${searchParams.category ? `category=${searchParams.category}&` : ''}sort=price_desc`}
                className={`px-2.5 py-1 rounded-lg ${searchParams.sort === 'price_desc' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                Price: High to Low
              </Link>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        {products.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 shadow-sm max-w-md mx-auto my-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400 mb-4">
              <Filter className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No products found</h3>
            <p className="text-xs text-slate-500 mt-1 mb-6">
              We couldn&apos;t find any items matching your filter criteria. Try clearing the filters.
            </p>
            <Link
              href="/shop"
              className="px-5 py-2.5 bg-gradient-to-r from-[#FF5E00] to-[#E64A19] hover:from-[#F4511E] hover:to-[#D84315] text-white font-display font-black rounded-xl text-xs uppercase tracking-wider transition inline-block shadow-md shadow-orange-500/20"
            >
              Reset Filters
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
