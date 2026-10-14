import React from 'react';
import Link from 'next/link';
import Header from '@/components/storefront/Header';
import Footer from '@/components/storefront/Footer';
import ProductCard from '@/components/storefront/ProductCard';
import { getProducts, getCategories, getBanners } from '@/lib/data-store';
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
  const flashDeals = products.filter((p) => p.salePrice && p.salePrice < p.sellingPrice).slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 space-y-12 pb-16">
        {/* Dynamic Hero Section - 100% synchronized with Banner Manager */}
        <HeroBannerSlider banners={banners} />


        {/* Categories Bar */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-950">Featured Categories</h2>
              <p className="text-xs text-slate-500 mt-0.5">Explore our curated collections</p>
            </div>
            <Link
              href="/shop"
              className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 transition"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/shop?category=${cat.slug}`}
                className="group bg-white rounded-2xl border border-slate-200/80 hover:border-amber-400 p-4 text-center transition-all hover:shadow-lg flex flex-col items-center"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-slate-100 mb-3 border-2 border-slate-100 group-hover:border-amber-400 transition">
                  <img
                    src={cat.imageUrl || '/placeholder.png'}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                  />
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-amber-600 transition line-clamp-1">
                  {cat.name}
                </h3>
              </Link>
            ))}
          </div>
        </section>

        {/* Flash Deals / Special Discounts Section */}
        {flashDeals.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-r from-red-600 to-amber-600 rounded-3xl p-6 sm:p-8 text-white mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white">
                  <Flame className="w-7 h-7 fill-white" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight">Flash Sale Discounts</h2>
                  <p className="text-xs text-red-100 mt-0.5">Limited stock discounts on selected customer favourites</p>
                </div>
              </div>

              <Link
                href="/shop"
                className="bg-white text-slate-950 hover:bg-slate-100 px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition shrink-0"
              >
                View All Deals
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {flashDeals.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* Featured Products Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-950">Trending at Toto Elite Mart</h2>
              <p className="text-xs text-slate-500 mt-0.5">Top-rated quality items backed by authentic warranty</p>
            </div>
            <Link
              href="/shop"
              className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 transition"
            >
              <span>Explore All ({products.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
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
