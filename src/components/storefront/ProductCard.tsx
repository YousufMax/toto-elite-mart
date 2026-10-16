'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Zap, ChevronLeft, ChevronRight, Plus, Minus, Star, CheckCircle2 } from 'lucide-react';
import { useCart } from './CartContext';
import { formatBDT } from '@/lib/currency';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    sku: string;
    sellingPrice: number;
    salePrice?: number | null;
    stockQuantity: number;
    lowStockThreshold?: number;
    category?: { name: string; slug: string };
    images?: Array<{ url: string; isPrimary?: boolean }>;
    rating?: number;
    reviewCount?: number;
    colorVariants?: Array<{
      id?: string;
      name?: string;
      colorCode?: string;
      price?: number | null;
      isActive?: boolean;
      stockQuantity?: number;
      imageUrl?: string | null;
    }>;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const { addItem, items, updateQuantity, storeSettings } = useCart();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Dynamic Product Rating & Reviews (Directly matched to Real Storefront Reviews)
  const reviewCount = product.reviewCount !== undefined ? Number(product.reviewCount) : 0;
  const productRating = reviewCount > 0 ? Number(product.rating || 5) : 0;

  const itemInCart = items.find((i) => i.id === product.id);
  const qtyInCart = itemInCart ? itemInCart.quantity : 0;

  const [hasManuallyNavigated, setHasManuallyNavigated] = useState(false);

  // Extract all distinct images (product gallery + variant assigned photos)
  const rawImages =
    product.images && product.images.length > 0
      ? product.images.map((img) => img.url).filter(Boolean)
      : [];

  const variantImages = (product.colorVariants || [])
    .map((v: any) => v.imageUrl)
    .filter((u: any): u is string => Boolean(u && typeof u === 'string' && u.trim()));

  const combinedImages = Array.from(new Set([...rawImages, ...variantImages]));
  const imageList =
    combinedImages.length > 0
      ? combinedImages
      : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80'];

  // Current displayed image (on desktop hover, preview second image if not manually navigated)
  const displayedIndex =
    !hasManuallyNavigated && isHovered && activeImageIndex === 0 && imageList.length > 1 && !touchStartX
      ? 1
      : activeImageIndex;

  const currentImageUrl = imageList[displayedIndex] || imageList[0];

  // Variant custom pricing detection
  const variantPrices = (product.colorVariants || [])
    .filter((v: any) => v.isActive !== false && v.price != null && Number(v.price) > 0)
    .map((v: any) => Number(v.price));
  const minVariantPrice = variantPrices.length > 0 ? Math.min(...variantPrices) : null;
  const maxVariantPrice = variantPrices.length > 0 ? Math.max(...variantPrices) : null;
  const hasVariableVariantPricing = minVariantPrice !== null && maxVariantPrice !== null && minVariantPrice !== maxVariantPrice;

  const activeVariants = (product.colorVariants || []).filter((v: any) => v.isActive !== false);
  const defaultVariant =
    activeVariants.length > 0
      ? activeVariants.find((v: any) => (v.stockQuantity || 0) > 0) || activeVariants[0]
      : null;

  const effectiveVariant = defaultVariant;
  const effectiveVariantPrice =
    effectiveVariant && effectiveVariant.price != null && Number(effectiveVariant.price) > 0
      ? Number(effectiveVariant.price)
      : null;

  // Active price: follows default variant price, or minimum variant price, or sale/selling price
  const currentPrice = effectiveVariantPrice !== null
    ? effectiveVariantPrice
    : (minVariantPrice !== null ? minVariantPrice : (product.salePrice || product.sellingPrice));

  // The base display price shown on the card
  const displayPrice = (hasVariableVariantPricing && minVariantPrice !== null)
    ? minVariantPrice
    : currentPrice;

  // Compare-at benchmark price: if displayPrice is less than product.sellingPrice or salePrice is active
  const compareAtPrice = product.sellingPrice && displayPrice < product.sellingPrice
    ? product.sellingPrice
    : (product.salePrice && product.salePrice < product.sellingPrice ? product.sellingPrice : null);

  // Accurate discount percentage: matches compareAtPrice and displayPrice
  const hasDiscount = Boolean(compareAtPrice && compareAtPrice > displayPrice);
  const discountPercent = hasDiscount && compareAtPrice
    ? Math.round(((compareAtPrice - displayPrice) / compareAtPrice) * 100)
    : 0;

  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= (product.lowStockThreshold || 5);
  const isOutOfStock = product.stockQuantity <= 0;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 30 && imageList.length > 1) {
      setHasManuallyNavigated(true);
      if (diff > 0) {
        // Swipe left -> Next image
        setActiveImageIndex((prev) => (prev + 1) % imageList.length);
      } else {
        // Swipe right -> Prev image
        setActiveImageIndex((prev) => (prev - 1 + imageList.length) % imageList.length);
      }
    }
    setTouchStartX(null);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setHasManuallyNavigated(true);
    setActiveImageIndex((prev) => (prev - 1 + imageList.length) % imageList.length);
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setHasManuallyNavigated(true);
    setActiveImageIndex((prev) => (prev + 1) % imageList.length);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    addItem({
      id: product.id,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      price: currentPrice,
      originalPrice: compareAtPrice || product.sellingPrice,
      imageUrl: effectiveVariant?.imageUrl || imageList[0],
      stockQuantity: effectiveVariant?.stockQuantity || product.stockQuantity,
      selectedColor: effectiveVariant?.name || undefined,
      variantId: effectiveVariant?.id || undefined,
    });
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    addItem({
      id: product.id,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      price: currentPrice,
      originalPrice: compareAtPrice || product.sellingPrice,
      imageUrl: effectiveVariant?.imageUrl || imageList[0],
      stockQuantity: effectiveVariant?.stockQuantity || product.stockQuantity,
      selectedColor: effectiveVariant?.name || undefined,
      variantId: effectiveVariant?.id || undefined,
    });
    router.push('/checkout');
  };

  return (
    <div
      className="group bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 hover:border-amber-400/90 overflow-hidden shadow-2xs hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div>
        {/* Product Image Area with Mobile Swipe & Multi-Photo Switcher */}
        <div
          className="relative aspect-square bg-slate-50 overflow-hidden select-none"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <Link href={`/product/${product.slug}`} className="block w-full h-full">
            <img
              src={currentImageUrl}
              alt={product.name}
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';
              }}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </Link>

          {/* Badges */}
          <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 flex flex-col gap-1 sm:gap-1.5 z-10 pointer-events-none">
            {hasDiscount && storeSettings?.cardShowDiscountBadge !== false && (
              <span className="bg-gradient-to-r from-red-600 to-rose-600 text-white font-black text-[9.5px] sm:text-[11px] px-2 sm:px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-0.5 sm:gap-1 tracking-tight">
                <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-white" />
                <span>-{discountPercent}% OFF</span>
              </span>
            )}
            {isLowStock && storeSettings?.cardShowStockWarning !== false && (
              <span className="bg-amber-500 text-slate-950 font-black text-[9px] sm:text-[10px] px-2 sm:px-2.5 py-0.5 rounded-full shadow-sm tracking-tight">
                Only {product.stockQuantity} Left
              </span>
            )}
            {isOutOfStock && (
              <span className="bg-slate-900 text-white font-bold text-[9px] sm:text-[10px] px-2 sm:px-2.5 py-0.5 rounded-full shadow-sm">
                Out of Stock
              </span>
            )}
          </div>

          {/* Multi-Photo Counter Badge */}
          {imageList.length > 1 && (
            <div className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 z-10 pointer-events-none bg-slate-950/65 backdrop-blur-xs text-white font-mono text-[8.5px] sm:text-[9.5px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full shadow-2xs">
              {displayedIndex + 1}/{imageList.length}
            </div>
          )}

          {/* Multi-Photo Left/Right Arrows (Visible on mobile + on desktop hover) */}
          {imageList.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrevImage}
                aria-label="Previous photo"
                className="absolute left-1.5 top-1/2 -translate-y-1/2 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-slate-900/65 hover:bg-slate-950 text-white flex items-center justify-center transition opacity-90 sm:opacity-0 sm:group-hover:opacity-100 z-20 shadow-md active:scale-95"
              >
                <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>

              <button
                type="button"
                onClick={handleNextImage}
                aria-label="Next photo"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-slate-900/65 hover:bg-slate-950 text-white flex items-center justify-center transition opacity-90 sm:opacity-0 sm:group-hover:opacity-100 z-20 shadow-md active:scale-95"
              >
                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>

              {/* Multi-Photo Dot Indicators */}
              <div className="absolute bottom-2 inset-x-0 flex justify-center items-center gap-1.5 z-20 pointer-events-auto">
                {imageList.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setActiveImageIndex(idx);
                    }}
                    aria-label={`View photo ${idx + 1}`}
                    className={`transition-all duration-300 rounded-full ${
                      idx === displayedIndex
                        ? 'w-4 h-1.5 bg-amber-500 shadow-sm'
                        : 'w-1.5 h-1.5 bg-white/70 hover:bg-white shadow-2xs'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Content Area - Compact Mobile Proportions */}
        <div className="p-2.5 xs:p-3 sm:p-4 space-y-1.5 sm:space-y-2">
          {/* Category & SKU */}
          <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500 font-medium gap-1">
            <span className="truncate max-w-[100px] xs:max-w-[130px] font-bold text-amber-700 bg-amber-500/10 px-1.5 py-0.5 rounded text-[8.5px] xs:text-[9.5px] uppercase tracking-wider">
              {product.category?.name || 'Category'}
            </span>
            <span className="text-slate-400 font-mono text-[9px] xs:text-[10px] shrink-0 truncate max-w-[70px] xs:max-w-none text-right">{product.sku}</span>
          </div>

          {/* Title with World-Class E-Commerce Typography */}
          <Link href={`/product/${product.slug}`} className="block">
            <h3 className="font-display font-bold text-slate-900 text-xs sm:text-[13.5px] line-clamp-2 group-hover:text-amber-600 transition-colors min-h-[2rem] sm:min-h-[2.5rem] leading-snug tracking-tight">
              {product.name}
            </h3>
          </Link>

          {/* World-Class Mart Review Rating Strip */}
          {storeSettings?.cardShowRating !== false && (
            reviewCount > 0 ? (
              <div className="flex items-center gap-1 sm:gap-1.5 pt-0.5 flex-nowrap overflow-hidden">
                <div className="flex items-center text-amber-400 shrink-0">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 ${
                        star <= Math.floor(productRating)
                          ? 'fill-amber-400 text-amber-400'
                          : star - 0.5 <= productRating
                          ? 'fill-amber-400/60 text-amber-400'
                          : 'fill-slate-200 text-slate-200'
                      }`}
                    />
                  ))}
                </div>
                <span className="font-price font-bold text-slate-900 text-[10.5px] sm:text-xs leading-none shrink-0">
                  {productRating.toFixed(1)}
                </span>
                <span className="text-[9.5px] sm:text-[10.5px] font-semibold text-slate-500 leading-none shrink-0">
                  ({reviewCount})
                </span>
                <span className="hidden xs:inline text-slate-300 text-[10px] leading-none shrink-0">•</span>
                <span className="hidden xs:inline-flex items-center gap-0.5 text-[8.5px] sm:text-[9.5px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-100 leading-none shrink-0">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                  <span>Verified</span>
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1 sm:gap-1.5 pt-0.5 flex-nowrap overflow-hidden">
                <div className="flex items-center text-slate-200 shrink-0">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 fill-slate-200 text-slate-200"
                    />
                  ))}
                </div>
                <span className="text-[9.5px] sm:text-[10.5px] font-medium text-slate-400 leading-none shrink-0">
                  (0)
                </span>
                <span className="hidden xs:inline text-slate-300 text-[10px] leading-none shrink-0">•</span>
                <span className="hidden xs:inline-flex items-center gap-0.5 text-[8.5px] sm:text-[9.5px] font-semibold text-slate-500 bg-slate-100 px-1 py-0.5 rounded leading-none shrink-0">
                  <span>New</span>
                </span>
              </div>
            )
          )}
        </div>
      </div>

      {/* Pricing & Dual Action Buttons */}
      <div className="p-2.5 xs:p-3 sm:p-4 pt-0 space-y-2 sm:space-y-2.5">
        <div className="flex items-center justify-between gap-1 flex-wrap">
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <span className="font-price text-[15px] sm:text-lg font-black text-slate-950 tracking-tight">
              {hasVariableVariantPricing
                ? `From ${formatBDT(minVariantPrice!)}`
                : formatBDT(currentPrice)}
            </span>
            {hasDiscount && compareAtPrice && (
              <span className="font-price text-[10.5px] sm:text-xs text-slate-400 line-through font-medium">
                {formatBDT(compareAtPrice)}
              </span>
            )}
          </div>

          {/* Elite Reward Points Cashback Chip */}
          {storeSettings?.rewardPointsEnabled !== false && (
            <span className="hidden xs:inline-flex items-center gap-0.5 text-[8.5px] sm:text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 rounded shrink-0">
              <span>🪙</span>
              <span>+{Math.max(1, Math.floor(currentPrice / (storeSettings?.rewardPointsEarnRate || 100)))} pts</span>
            </span>
          )}
        </div>

        {/* Dual Actions: Add to Cart (Icon on Mobile, Text on Desktop) + Buy Now */}
        <div className="flex items-center gap-1.5 sm:grid sm:grid-cols-2 sm:gap-2">
          {storeSettings?.cardStepperEnabled !== false && qtyInCart > 0 && itemInCart ? (
            <div className="flex items-center justify-between bg-amber-500 text-slate-950 font-black rounded-xl p-0.5 sm:p-1 shadow-sm border border-amber-400 select-none shrink-0 sm:shrink min-w-[76px] sm:min-w-0">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  updateQuantity(itemInCart.itemKey || itemInCart.id, qtyInCart - 1);
                }}
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-black/10 hover:bg-slate-950 hover:text-white flex items-center justify-center transition active:scale-90 shrink-0"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3 h-3 stroke-[3]" />
              </button>
              <span className="font-price font-black text-[10px] sm:text-xs px-1 text-slate-950 truncate">
                <span className="sm:hidden">{qtyInCart}</span>
                <span className="hidden sm:inline">{qtyInCart} in Bag</span>
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const maxStock = itemInCart.stockQuantity || product.stockQuantity || 99;
                  if (qtyInCart < maxStock) {
                    updateQuantity(itemInCart.itemKey || itemInCart.id, qtyInCart + 1);
                  }
                }}
                disabled={qtyInCart >= (itemInCart.stockQuantity || product.stockQuantity || 99)}
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-black/10 hover:bg-slate-950 hover:text-white disabled:opacity-30 flex items-center justify-center transition active:scale-90 shrink-0"
                aria-label="Increase quantity"
              >
                <Plus className="w-3 h-3 stroke-[3]" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              aria-label={isOutOfStock ? 'Out of Stock' : 'Cart'}
              title={isOutOfStock ? 'Out of Stock' : 'Cart'}
              className={`py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-xl font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1 sm:gap-1.5 transition-all duration-200 active:scale-95 border shrink-0 sm:shrink w-9 h-9 sm:w-auto sm:h-auto ${
                isOutOfStock
                  ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-white hover:bg-slate-100 border-slate-300/80 text-slate-800 shadow-2xs hover:shadow-xs'
              }`}
            >
              <ShoppingBag className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-slate-700 shrink-0" />
              <span className="hidden sm:inline whitespace-nowrap">{isOutOfStock ? 'Sold Out' : 'Cart'}</span>
            </button>
          )}

          <button
            onClick={handleBuyNow}
            disabled={isOutOfStock}
            aria-label={isOutOfStock ? 'Out of Stock' : 'Buy Now'}
            title={isOutOfStock ? 'Out of Stock' : 'Buy Now'}
            className={`flex-1 py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl font-display font-black text-[11px] sm:text-xs flex items-center justify-center gap-1 transition-all duration-200 active:scale-95 shadow-sm h-9 sm:h-auto ${
              isOutOfStock
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#FF5E00] via-[#FF6A00] to-[#E64A19] hover:from-[#F4511E] hover:to-[#D84315] text-white shadow-md shadow-orange-500/25 hover:shadow-lg hover:shadow-orange-500/35'
            }`}
          >
            <Zap className="w-3.5 h-3.5 fill-white text-white shrink-0" />
            <span className="truncate tracking-wide">Buy Now</span>
          </button>
        </div>
      </div>
    </div>
  );
}
