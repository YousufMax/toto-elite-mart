'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Zap, Plus, Minus, CheckCircle, ShieldAlert, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useCart } from '@/components/storefront/CartContext';
import { formatBDT } from '@/lib/currency';

function isLightColor(hexStr?: string): boolean {
  if (!hexStr) return true;
  const hex = hexStr.replace('#', '');
  if (hex.length === 3) {
    const r = parseInt(hex[0] + hex[0], 16);
    const g = parseInt(hex[1] + hex[1], 16);
    const b = parseInt(hex[2] + hex[2], 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 165;
  }
  if (hex.length === 6) {
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 165;
  }
  return true;
}

export default function ProductDetailClient({ product }: { product: any }) {
  const router = useRouter();
  const { addItem } = useCart();

  // Combine gallery images + any variant photos (no duplicates)
  const rawImages = product.images && product.images.length > 0
    ? product.images.map((img: any) => img.url).filter(Boolean)
    : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80'];

  const variantImages = (product.colorVariants || [])
    .map((v: any) => v.imageUrl)
    .filter((u: any): u is string => Boolean(u && typeof u === 'string' && u.trim()));

  const allImages = Array.from(new Set([...rawImages, ...variantImages]));

  const activeVariants = (product.colorVariants || []).filter((v: any) => v.isActive !== false);

  const [selectedVariant, setSelectedVariant] = useState<any | null>(() => {
    if (activeVariants.length === 0) return null;
    return activeVariants.find((v: any) => v.stockQuantity > 0) || activeVariants[0] || null;
  });

  const [colorError, setColorError] = useState('');
  const [activeImageIndex, setActiveImageIndex] = useState<number>(() => {
    if (selectedVariant?.imageUrl) {
      const idx = allImages.findIndex((u: string) => u === selectedVariant.imageUrl);
      if (idx !== -1) return idx;
    }
    return 0;
  });
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);

  // Active displayed main image strictly follows activeImageIndex so clicking thumbnails or swatches always works
  const activeImage = allImages[activeImageIndex] || allImages[0];

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 30 && allImages.length > 1) {
      if (diff > 0) {
        // Swipe left -> Next photo
        setActiveImageIndex((prev) => (prev + 1) % allImages.length);
      } else {
        // Swipe right -> Prev photo
        setActiveImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
      }
    }
    setTouchStartX(null);
  };

  const hasCustomVariantPrice = selectedVariant && selectedVariant.price != null && Number(selectedVariant.price) > 0;
  const currentPrice = hasCustomVariantPrice
    ? Number(selectedVariant.price)
    : (product.salePrice || product.sellingPrice);
  const compareAtPrice = hasCustomVariantPrice
    ? (Number(selectedVariant.price) < product.sellingPrice ? product.sellingPrice : null)
    : (product.salePrice && product.salePrice < product.sellingPrice ? product.sellingPrice : null);
  const hasDiscount = Boolean(compareAtPrice && compareAtPrice > currentPrice);
  const savedAmount = hasDiscount && compareAtPrice ? compareAtPrice - currentPrice : 0;
  const discountPercent = hasDiscount && compareAtPrice
    ? Math.round(((compareAtPrice - currentPrice) / compareAtPrice) * 100)
    : 0;

  // Variant-specific or global stock determination
  const effectiveStock = selectedVariant ? selectedVariant.stockQuantity : product.stockQuantity;
  const isOutOfStock = effectiveStock <= 0;
  const isLowStock = effectiveStock > 0 && effectiveStock <= (product.lowStockThreshold || 5);

  const handleAddToCart = () => {
    if (activeVariants.length > 0 && !selectedVariant) {
      setColorError('Please select a color before adding to cart.');
      return;
    }
    if (isOutOfStock) {
      setColorError(`Selected color "${selectedVariant?.name || 'this item'}" is currently out of stock.`);
      return;
    }
    setColorError('');
    addItem(
      {
        id: product.id,
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        price: currentPrice,
        originalPrice: product.sellingPrice,
        imageUrl: activeImage,
        stockQuantity: effectiveStock,
        selectedColor: selectedVariant ? selectedVariant.name : undefined,
        variantId: selectedVariant ? selectedVariant.id : undefined,
      },
      quantity
    );
  };

  const handleBuyNow = () => {
    if (activeVariants.length > 0 && !selectedVariant) {
      setColorError('Please select a color before proceeding to buy.');
      return;
    }
    if (isOutOfStock) {
      setColorError(`Selected color "${selectedVariant?.name || 'this item'}" is currently out of stock.`);
      return;
    }
    handleAddToCart();
    router.push('/checkout');
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-sm grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
      {/* Product Image Gallery with Mobile Swipe */}
      <div className="space-y-4">
        <div
          className="aspect-square rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 relative select-none"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <img
            src={activeImage}
            alt={product.name}
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80';
            }}
            className="w-full h-full object-cover transition-all duration-300"
          />
          {hasDiscount && (
            <span className="absolute top-4 left-4 bg-red-500 text-white font-black text-xs px-3 py-1 rounded-full shadow-md">
              SAVE {discountPercent}%
            </span>
          )}

          {/* Mobile Next/Prev Arrows */}
          {allImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => setActiveImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white flex items-center justify-center transition active:scale-95 shadow-md"
                aria-label="Previous photo"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setActiveImageIndex((prev) => (prev + 1) % allImages.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white flex items-center justify-center transition active:scale-95 shadow-md"
                aria-label="Next photo"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Mobile Indicator Dots */}
              <div className="sm:hidden absolute bottom-3 inset-x-0 flex justify-center items-center gap-1.5 z-10">
                {allImages.map((_: string, idx: number) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`transition-all duration-300 rounded-full ${
                      idx === activeImageIndex ? 'w-5 h-1.5 bg-amber-500' : 'w-1.5 h-1.5 bg-white/70'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Thumbnail Selector */}
        {allImages.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-1">
            {allImages.map((imgUrl: string, idx: number) => (
              <button
                key={idx}
                onClick={() => setActiveImageIndex(idx)}
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 shrink-0 transition ${
                  activeImageIndex === idx ? 'border-amber-500 shadow-md' : 'border-slate-200 opacity-70 hover:opacity-100'
                }`}
              >
                <img src={imgUrl} alt="Thumbnail" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Information & Buy Actions */}
      <div className="flex flex-col justify-between space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold">
              {product.category?.name || 'Category'}
            </span>
            <span className="text-slate-400 text-xs font-mono">SKU: {product.sku}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-black text-slate-950 leading-tight tracking-tight">
            {product.name}
          </h1>

          {/* Pricing Box */}
          <div className="flex flex-wrap items-baseline gap-3 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-100">
            <span className="text-3xl sm:text-4xl font-price font-black text-slate-950 tracking-tight">
              {formatBDT(currentPrice)}
            </span>
            {hasDiscount && compareAtPrice && (
              <span className="text-base sm:text-lg font-price text-slate-400 line-through">
                {formatBDT(compareAtPrice)}
              </span>
            )}
            {hasDiscount && savedAmount > 0 && (
              <span className="ml-auto text-xs font-display font-bold text-red-600 bg-red-50 border border-red-100 px-3 py-1 rounded-xl">
                You save {formatBDT(savedAmount)}
              </span>
            )}
          </div>

          {/* Stock Availability */}
          <div className="flex items-center gap-2 text-xs font-semibold">
            {isOutOfStock ? (
              <span className="text-red-600 flex items-center gap-1.5 bg-red-50 px-3 py-1.5 rounded-lg">
                <ShieldAlert className="w-4 h-4" />
                {selectedVariant ? `Currently Out of Stock in ${selectedVariant.name}` : 'Currently Out of Stock'}
              </span>
            ) : isLowStock ? (
              <span className="text-amber-700 flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-lg">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                Hurry, only {effectiveStock} units left{selectedVariant ? ` in ${selectedVariant.name}` : ''}!
              </span>
            ) : (
              <span className="text-emerald-700 flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-lg">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                In Stock & Ready to Dispatch{selectedVariant ? ` (${effectiveStock} in ${selectedVariant.name})` : ''}
              </span>
            )}
          </div>

          {/* Color Variants Swatches Section - Matching User Specification & Screenshot 2 */}
          {activeVariants.length > 0 && (
            <div className="pt-2 pb-2 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span className="text-slate-600">Select Color:</span>
                  <span className="font-extrabold text-slate-950 px-2.5 py-0.5 bg-orange-50 border border-orange-200/80 text-orange-950 rounded-lg">
                    {selectedVariant
                      ? `${selectedVariant.name}${selectedVariant.price != null && Number(selectedVariant.price) > 0 ? ` • ৳${Number(selectedVariant.price).toLocaleString()}` : ''}`
                      : 'Choose below'}
                  </span>
                </div>
                {selectedVariant && (
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full ${
                      selectedVariant.stockQuantity > 5
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                        : selectedVariant.stockQuantity > 0
                        ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                        : 'bg-rose-50 text-rose-600 border border-rose-200/60'
                    }`}
                  >
                    {selectedVariant.stockQuantity > 0
                      ? `${selectedVariant.stockQuantity} in stock`
                      : 'Out of stock'}
                  </span>
                )}
              </div>

              {/* Swatches List - Standard Small Uniform Size Across All Devices */}
              <div className="flex flex-wrap items-start gap-3.5 sm:gap-4 pt-1">
                {activeVariants.map((variant: any) => {
                  const isSelected = selectedVariant?.id === variant.id || selectedVariant?.name === variant.name;
                  const isOOS = variant.stockQuantity <= 0;
                  const isLight = isLightColor(variant.colorCode);

                  return (
                    <button
                      key={variant.id || variant.name}
                      type="button"
                      onClick={() => {
                        setSelectedVariant(variant);
                        setColorError('');
                        if (variant.imageUrl) {
                          const idx = allImages.findIndex((u: string) => u === variant.imageUrl);
                          if (idx !== -1) setActiveImageIndex(idx);
                        }
                      }}
                      title={`${variant.name}${variant.price != null && Number(variant.price) > 0 ? ` (৳${Number(variant.price).toLocaleString()})` : ''} • ${variant.stockQuantity > 0 ? `${variant.stockQuantity} in stock` : 'Out of stock'}`}
                      className="group flex flex-col items-center cursor-pointer select-none focus:outline-none transition-transform active:scale-95"
                    >
                      {/* Circular Swatch - Standard Small Size (32px) Across All Devices */}
                      <div
                        className={`w-8 h-8 rounded-full relative flex items-center justify-center transition-all duration-200 ${
                          isSelected
                            ? 'ring-2 ring-orange-500 ring-offset-2 ring-offset-white scale-105 shadow-sm'
                            : 'hover:scale-105 border border-slate-300 hover:border-slate-500 shadow-2xs'
                        } ${isOOS ? 'opacity-40 grayscale-[30%]' : ''}`}
                        style={{
                          backgroundColor: variant.colorCode,
                        }}
                      >
                        {/* Checkmark when selected */}
                        {isSelected && (
                          <Check
                            className={`w-4 h-4 stroke-[2.75] ${
                              isLight ? 'text-slate-950' : 'text-white'
                            }`}
                          />
                        )}

                        {/* Diagonal slash when out of stock */}
                        {isOOS && !isSelected && (
                          <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-full">
                            <span className="w-full h-[1.5px] bg-red-600 rotate-45 block" />
                          </div>
                        )}
                      </div>

                      {/* Color Name & Price centered directly underneath */}
                      <div className="mt-1.5 flex flex-col items-center max-w-[76px]">
                        <span
                          className={`text-[11px] sm:text-xs tracking-tight text-center leading-tight break-words transition-colors ${
                            isSelected
                              ? 'font-bold text-slate-950'
                              : isOOS
                              ? 'text-slate-400 font-normal line-through'
                              : 'text-slate-600 font-medium group-hover:text-slate-900'
                          }`}
                        >
                          {variant.name}
                        </span>
                        {variant.price != null && Number(variant.price) > 0 && (
                          <span
                            className={`text-[10px] tracking-tight font-black transition-colors ${
                              isSelected ? 'text-orange-600 font-black' : 'text-slate-500 font-bold'
                            }`}
                          >
                            ৳{Number(variant.price).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {colorError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-bold flex items-center gap-1.5 animate-pulse">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{colorError}</span>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div className="pt-2">
            <h3 className="text-xs font-display font-bold uppercase tracking-wider text-slate-400 mb-2">Description</h3>
            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
              {product.description || 'Premium quality product certified by Toto Elite Mart quality standards.'}
            </p>
          </div>
        </div>

        {/* Quantity & CTA Buttons */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          {!isOutOfStock && (
            <div className="flex items-center gap-4">
              <span className="text-xs font-display font-bold text-slate-700">Quantity:</span>
              <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden bg-slate-50/80 shadow-2xs">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-200/80 transition"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-4 py-1 text-sm font-price font-bold text-slate-900">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.stockQuantity, q + 1))}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-200/80 transition"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`py-4 px-6 rounded-2xl font-display font-bold uppercase text-xs tracking-wider flex items-center justify-center gap-2 transition active:scale-98 ${
                isOutOfStock
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-950 hover:bg-slate-800 text-white shadow-md'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Add to Cart</span>
            </button>

            <button
              onClick={handleBuyNow}
              disabled={isOutOfStock}
              className={`py-4 px-6 rounded-2xl font-display font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 transition active:scale-98 ${
                isOutOfStock
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#FF5E00] via-[#FF6A00] to-[#E64A19] hover:from-[#F4511E] hover:to-[#D84315] text-white shadow-xl shadow-orange-500/30 hover:shadow-2xl hover:shadow-orange-500/40'
              }`}
            >
              <Zap className="w-4 h-4 fill-white text-white" />
              <span>Buy Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
