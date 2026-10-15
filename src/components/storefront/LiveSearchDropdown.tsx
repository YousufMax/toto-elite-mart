'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, X, Loader2, ArrowRight, Sparkles, TrendingUp, CheckCircle, Package } from 'lucide-react';
import { formatBDT } from '@/lib/currency';

interface SearchProduct {
  id: string;
  name: string;
  slug: string;
  sellingPrice: number;
  salePrice?: number | null;
  images?: string[];
  stockQuantity: number;
  category?: {
    name: string;
    slug: string;
  };
}

const TRENDING_SEARCHES = [
  'Headphone',
  'Watch',
  'Honey',
  'Polo Shirt',
  'Rice',
  'Earbuds',
  'Olive Oil',
];

export default function LiveSearchDropdown({
  onCloseMobile,
  className = '',
}: {
  onCloseMobile?: () => void;
  className?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search query
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(trimmed)}&limit=6`);
        const data = await res.json();
        if (data.success && Array.isArray(data.products)) {
          setResults(data.products);
        } else {
          setResults([]);
        }
      } catch (e) {
        console.error(e);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIndex >= 0 && results[selectedIndex]) {
      const p = results[selectedIndex];
      router.push(`/product/${p.slug || p.id}`);
      setIsOpen(false);
      if (onCloseMobile) onCloseMobile();
      return;
    }
    if (query.trim()) {
      router.push(`/shop?search=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
      if (onCloseMobile) onCloseMobile();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  };

  const handleSelectTrending = (term: string) => {
    setQuery(term);
    router.push(`/shop?search=${encodeURIComponent(term)}`);
    setIsOpen(false);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search products, brands, groceries, gadgets..."
          className="w-full bg-slate-50 hover:bg-white focus:bg-white text-slate-800 text-sm font-medium rounded-full pl-10 pr-20 py-2 sm:py-2.5 border border-slate-300 focus:border-red-600 focus:ring-2 focus:ring-red-100 transition-all outline-none placeholder:text-slate-400 shadow-inner"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />

        <div className="absolute right-2.5 flex items-center gap-1.5">
          {loading && <Loader2 className="w-4 h-4 text-red-600 animate-spin" />}
          {query && !loading && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setResults([]);
                setSelectedIndex(-1);
                inputRef.current?.focus();
              }}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="submit"
            className="hidden sm:inline-flex px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-full transition shadow-sm"
          >
            Search
          </button>
        </div>
      </form>

      {/* Live Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Query Empty: Show Trending Searches */}
          {query.trim().length < 2 ? (
            <div className="p-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                <TrendingUp className="w-3.5 h-3.5 text-red-500" />
                Popular Trending Searches
              </div>
              <div className="flex flex-wrap gap-2">
                {TRENDING_SEARCHES.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => handleSelectTrending(term)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-600 hover:border-red-200 border border-slate-200 text-xs font-medium text-slate-700 rounded-full transition flex items-center gap-1.5 group"
                  >
                    <Search className="w-3 h-3 text-slate-400 group-hover:text-red-500 transition" />
                    {term}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length > 0 ? (
            <div>
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Matching Products ({results.length})</span>
                <span className="text-[11px] text-slate-400">Use ↑ ↓ arrows & enter</span>
              </div>
              <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
                {results.map((product, idx) => {
                  const effectivePrice =
                    product.salePrice != null && product.salePrice > 0
                      ? product.salePrice
                      : product.sellingPrice;
                  const hasDiscount =
                    product.salePrice != null &&
                    product.salePrice > 0 &&
                    product.salePrice < product.sellingPrice;
                  const isSelected = selectedIndex === idx;

                  return (
                    <Link
                      key={product.id}
                      href={`/product/${product.slug || product.id}`}
                      onClick={() => {
                        setIsOpen(false);
                        if (onCloseMobile) onCloseMobile();
                      }}
                      className={`flex items-center gap-3.5 p-3 transition ${
                        isSelected ? 'bg-red-50/80 text-red-950' : 'hover:bg-slate-50 text-slate-900'
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="w-12 h-12 rounded-xl bg-slate-100 shrink-0 border border-slate-200 overflow-hidden flex items-center justify-center">
                        {product.images && product.images[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <Package className="w-5 h-5 text-slate-400" />
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold truncate leading-tight">{product.name}</h4>
                          {product.stockQuantity > 0 ? (
                            <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded shrink-0">
                              In Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                              Stock Out
                            </span>
                          )}
                        </div>

                        {product.category && (
                          <p className="text-xs text-slate-500 truncate mt-0.5">{product.category.name}</p>
                        )}

                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-black text-red-600">
                            {formatBDT(effectivePrice)}
                          </span>
                          {hasDiscount && (
                            <span className="text-xs text-slate-400 line-through">
                              {formatBDT(product.sellingPrice)}
                            </span>
                          )}
                        </div>
                      </div>

                      <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                    </Link>
                  );
                })}
              </div>

              {/* View all results button */}
              <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={() => {
                    router.push(`/shop?search=${encodeURIComponent(query.trim())}`);
                    setIsOpen(false);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className="w-full py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  <span>View All Results for &ldquo;{query}&rdquo;</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500">
              <Search className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium">No products found matching &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-slate-400 mt-1">Try checking for typos or searching a broader term.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
