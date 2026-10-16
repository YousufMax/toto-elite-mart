'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, Tag, ChevronLeft, ChevronRight } from 'lucide-react';

export interface BannerItem {
  id: string;
  title: string;
  subtitle?: string | null;
  imageUrl: string;
  targetUrl?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

interface HeroBannerSliderProps {
  banners: BannerItem[];
}

export default function HeroBannerSlider({ banners }: HeroBannerSliderProps) {
  // Filter active banners
  const activeBanners =
    banners && banners.length > 0 ? banners.filter((b) => b.isActive !== false) : [];

  const defaultBanner: BannerItem = {
    id: 'default-hero',
    title: 'Discover Elite Quality at Fair Prices',
    subtitle:
      'From high-performance audio gadgets and smart accessories to 100% pure organic Sundarban honey, shop trusted essentials with reliable Cash on Delivery nationwide.',
    imageUrl:
      'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1600&auto=format&fit=crop&q=80',
    targetUrl: '/shop',
  };

  const displayBanners = activeBanners.length > 0 ? activeBanners : [defaultBanner];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const resumeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Touch Swipe State
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchDeltaX, setTouchDeltaX] = useState<number>(0);

  // Temporary pause with auto-resume helper
  const pauseBriefly = () => {
    setIsPaused(true);
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 4500);
  };

  // Auto slide if multiple banners exist
  useEffect(() => {
    if (displayBanners.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayBanners.length);
    }, 4200);

    return () => clearInterval(timer);
  }, [displayBanners.length, isPaused, currentIndex]);

  // Ensure index stays valid if banners change
  useEffect(() => {
    if (currentIndex >= displayBanners.length) {
      setCurrentIndex(0);
    }
  }, [displayBanners.length, currentIndex]);

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, []);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + displayBanners.length) % displayBanners.length);
    pauseBriefly();
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % displayBanners.length);
    pauseBriefly();
  };

  const goToSlide = (idx: number) => {
    setCurrentIndex(idx);
    pauseBriefly();
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchDeltaX(0);
    setIsPaused(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const currentX = e.touches[0].clientX;
    setTouchDeltaX(currentX - touchStartX);
  };

  const handleTouchEnd = () => {
    if (touchStartX !== null) {
      if (touchDeltaX < -45) {
        // Swiped Left -> Next Slide
        setCurrentIndex((prev) => (prev + 1) % displayBanners.length);
      } else if (touchDeltaX > 45) {
        // Swiped Right -> Previous Slide
        setCurrentIndex((prev) => (prev - 1 + displayBanners.length) % displayBanners.length);
      }
    }
    setTouchStartX(null);
    setTouchDeltaX(0);
    pauseBriefly();
  };

  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6">
      {/* Standard E-Commerce Responsive Banner Container - Fluid height for Mobile & Desktop */}
      <div
        className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl sm:shadow-2xl bg-slate-900 w-full h-[200px] xs:h-[230px] sm:h-[300px] md:h-[360px] lg:h-[400px] transition-all duration-300 group select-none"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Horizontal Sliding Carousel Track */}
        <div
          className="flex h-full w-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {displayBanners.map((banner, idx) => (
            <div
              key={banner.id || idx}
              className="w-full shrink-0 h-full relative flex items-center overflow-hidden"
            >
              {/* Banner Photo - Vibrant, Full Coverage */}
              <img
                src={banner.imageUrl || defaultBanner.imageUrl}
                alt={banner.title}
                width={1200}
                height={400}
                loading="eager"
                decoding="async"
                draggable={false}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = defaultBanner.imageUrl;
                }}
                className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
              />

              {/* Soft, Light Left Vignette (Keeps picture clear & text readable) */}
              <div className="absolute inset-y-0 left-0 w-2/3 sm:w-1/2 bg-gradient-to-r from-slate-950/70 via-slate-950/20 to-transparent z-[1] pointer-events-none" />

              {/* Compact, Sleek Floating Text Card */}
              <div className="relative z-10 p-2.5 xs:p-3 sm:p-6 lg:p-8 max-w-[70%] xs:max-w-[64%] sm:max-w-md lg:max-w-lg">
                <div className="backdrop-blur-md bg-slate-950/70 p-2.5 xs:p-3 sm:p-4.5 md:p-5 rounded-xl sm:rounded-2xl border border-white/15 shadow-xl space-y-1 xs:space-y-1.5 sm:space-y-2.5">
                  <div className="inline-flex items-center gap-1 sm:gap-1.5 bg-amber-500/20 border border-amber-500/35 text-amber-400 px-1.5 sm:px-2.5 py-0.5 rounded-full text-[8.5px] sm:text-[10px] font-bold tracking-wide uppercase shadow-2xs">
                    <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
                    <span className="truncate max-w-[120px] sm:max-w-none">
                      <span className="sm:hidden">Special Offer</span>
                      <span className="hidden sm:inline">Premier Online Mart in Bangladesh</span>
                    </span>
                  </div>

                  {/* Dynamic Banner Title */}
                  <h1 className="text-xs xs:text-sm sm:text-2xl lg:text-3xl font-black tracking-tight leading-snug sm:leading-tight text-white drop-shadow-md line-clamp-2">
                    {banner.title}
                  </h1>

                  {/* Dynamic Banner Subtitle */}
                  {banner.subtitle && (
                    <p className="text-slate-200 text-[9px] xs:text-[10px] sm:text-xs leading-tight sm:leading-normal line-clamp-1 sm:line-clamp-2 font-medium drop-shadow">
                      {banner.subtitle}
                    </p>
                  )}

                  {/* CTA & Voucher Code */}
                  <div className="flex items-center gap-1.5 sm:gap-2 pt-0.5 flex-wrap">
                    <Link
                      href={banner.targetUrl || '/shop'}
                      className="px-2.5 py-1 sm:px-4 sm:py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg sm:rounded-xl text-[9px] xs:text-[10px] sm:text-xs shadow-md shadow-amber-500/20 flex items-center gap-1 sm:gap-1.5 transition hover:-translate-y-0.5 active:translate-y-0 shrink-0"
                    >
                      <span>Explore</span>
                      <span className="hidden xs:inline"> Catalog</span>
                      <ArrowRight className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                    </Link>

                    <div className="hidden xs:flex items-center gap-1 bg-slate-900/85 border border-slate-700/80 px-2 py-0.5 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-[8.5px] sm:text-[11px] text-slate-300 font-semibold shadow-2xs shrink-0">
                      <Tag className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400 shrink-0" />
                      <span>
                        Code: <b className="text-white">WELCOME100</b>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Carousel Navigation Arrows - Sleek & Compact */}
        {displayBanners.length > 1 && (
          <div className="absolute right-3 sm:right-5 bottom-3 sm:bottom-4 z-20 flex items-center gap-1.5 pointer-events-auto">
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              aria-label="Previous Slide"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-900/80 hover:bg-amber-500 hover:text-slate-950 text-white border border-slate-700/80 backdrop-blur-md flex items-center justify-center transition active:scale-95 shadow-md cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              aria-label="Next Slide"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-900/80 hover:bg-amber-500 hover:text-slate-950 text-white border border-slate-700/80 backdrop-blur-md flex items-center justify-center transition active:scale-95 shadow-md cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Carousel Pagination Indicators */}
        {displayBanners.length > 1 && (
          <div className="absolute left-4 sm:left-8 bottom-2.5 sm:bottom-3 z-20 flex items-center gap-1 pointer-events-auto">
            {displayBanners.map((b, idx) => (
              <button
                key={b.id || idx}
                onClick={(e) => {
                  e.stopPropagation();
                  goToSlide(idx);
                }}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === currentIndex
                    ? 'w-5 sm:w-6 bg-amber-400 shadow-sm shadow-amber-400/50'
                    : 'w-1.5 bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
