import React from 'react';
import Link from 'next/link';
import Header from '@/components/storefront/Header';
import Footer from '@/components/storefront/Footer';
import ProductCard from '@/components/storefront/ProductCard';
import { getProducts, getCategories, getBanners } from '@/lib/data-store';
import FlashSaleSection from '@/components/storefront/FlashSaleSection';
import HeroBannerSlider from '@/components/storefront/HeroBannerSlider';
import {
  ArrowRight,
  Sparkles,
  Flame,
  Truck,
  ShieldCheck,
  RefreshCw,
  Award,
  Tag,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Immediate live updates for banners and inventory

export default async function HomePage() {
  const [products, categories, banners] = await Promise.all([
    getProducts(),
    getCategories(),
    getBanners(),
  ]);

  const featuredProducts = products.filter((p) => p.isFeatured).slice(0, 8);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 space-y-12 pb-16">
        {/* Dynamic Hero Section - 100% synchronized with Banner Manager */}
        <HeroBannerSlider banners={banners} />


        {/* Categories Bar */}
        <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h2 className="text-lg sm:text-2xl font-black text-slate-950">Featured Categories</h2>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">Explore our curated collections</p>
            </div>
            <Link
              href="/shop"
              className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 transition"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 sm:gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/shop?category=${cat.slug}`}
                className="group bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 hover:border-amber-400 p-2.5 sm:p-4 text-center transition-all hover:shadow-lg flex flex-col items-center"
              >
                <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-slate-100 mb-2 sm:mb-3 border-2 border-slate-100 group-hover:border-amber-400 transition">
                  <img
                    src={cat.imageUrl || '/placeholder.png'}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                  />
                </div>
                <h3 className="text-[11px] sm:text-sm font-bold text-slate-900 group-hover:text-amber-600 transition line-clamp-2 leading-tight">
                  {cat.name}
                </h3>
              </Link>
            ))}
          </div>
        </section>

        {/* Dynamic Authoritative Flash Sale Section */}
        <FlashSaleSection />

        {/* Featured Products Grid */}
        <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h2 className="text-lg sm:text-2xl font-black text-slate-950">Trending at Toto Elite Mart</h2>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">Top-rated quality items backed by authentic warranty</p>
            </div>
            <Link
              href="/shop"
              className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 transition"
            >
              <span>Explore All ({products.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* Trust & Guarantee Banner */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="bg-slate-900 rounded-3xl p-8 sm:p-12 text-white border border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-8 text-center sm:text-left">
            <div className="space-y-2">
              <div className="w-10 h-10 bg-amber-500/20 text-amber-400 rounded-xl flex items-center justify-center mb-3 mx-auto sm:mx-0">
                <Truck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-white">Cash on Delivery</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Pay cash directly when you receive and inspect your parcel.</p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center mb-3 mx-auto sm:mx-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-white">100% Genuine</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Guaranteed original items with strict quality control.</p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 bg-sky-500/20 text-sky-400 rounded-xl flex items-center justify-center mb-3 mx-auto sm:mx-0">
                <RefreshCw className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-white">7 Days Return</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Hassle-free replacement for any damaged or broken package.</p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 bg-violet-500/20 text-violet-400 rounded-xl flex items-center justify-center mb-3 mx-auto sm:mx-0">
                <Award className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-white">Verified BD Brand</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Trusted by thousands of happy customers in all 64 districts.</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
