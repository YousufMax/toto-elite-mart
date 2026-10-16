'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Star, CheckCircle, Image as ImageIcon, ThumbsUp, X, Camera, MessageSquare, Plus } from 'lucide-react';

interface Review {
  id: string;
  productId: string;
  customerName: string;
  customerPhone?: string;
  rating: number;
  comment: string;
  images: string[];
  isVerified: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

interface ProductReviewsSectionProps {
  productId: string;
  productName: string;
  initialReviews?: any[];
}

export default function ProductReviewsSection({ productId, productName, initialReviews = [] }: ProductReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [loading, setLoading] = useState(false);
  const [filterRating, setFilterRating] = useState<number | 'all' | 'photos'>('all');
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; review: Review } | null>(null);

  // Review Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>(['']);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reviews?productId=${productId}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.reviews)) {
        setReviews(data.reviews);
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  // Aggregated Stats
  const { avgRating, totalReviews, ratingCounts, photoCount, recommendPercent } = useMemo(() => {
    if (!reviews.length) {
      return {
        avgRating: 5.0,
        totalReviews: 0,
        ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        photoCount: 0,
        recommendPercent: 100,
      };
    }
    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let totalScore = 0;
    let photos = 0;

    reviews.forEach((r) => {
      const score = Math.max(1, Math.min(5, Math.round(r.rating || 5)));
      counts[score] = (counts[score] || 0) + 1;
      totalScore += r.rating;
      if (r.images && r.images.length > 0) {
        photos += r.images.length;
      }
    });

    const positiveReviews = (counts[5] || 0) + (counts[4] || 0);
    const recommendRate = reviews.length > 0 ? Math.round((positiveReviews / reviews.length) * 100) : 100;

    return {
      avgRating: Number((totalScore / reviews.length).toFixed(1)),
      totalReviews: reviews.length,
      ratingCounts: counts,
      photoCount: photos,
      recommendPercent: recommendRate,
    };
  }, [reviews]);

  // Synchronize product review statistics across the entire page (Product Cards, Header, etc.)
  useEffect(() => {
    if (typeof window !== 'undefined' && reviews.length > 0) {
      window.dispatchEvent(
        new CustomEvent('product-review-updated', {
          detail: {
            productId,
            reviewCount: totalReviews,
            rating: avgRating,
          },
        })
      );
    }
  }, [productId, totalReviews, avgRating, reviews.length]);

  // Extract all photos with parent review reference for gallery
  const allCustomerPhotos = useMemo(() => {
    const list: { url: string; review: Review }[] = [];
    reviews.forEach((r) => {
      if (Array.isArray(r.images)) {
        r.images.forEach((imgUrl) => {
          if (imgUrl && imgUrl.trim()) {
            list.push({ url: imgUrl, review: r });
          }
        });
      }
    });
    return list;
  }, [reviews]);

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      if (filterRating === 'all') return true;
      if (filterRating === 'photos') return r.images && r.images.length > 0;
      return Math.round(r.rating) === filterRating;
    });
  }, [reviews, filterRating]);

  // Submit Review Handler
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!name.trim()) {
      setSubmitError('Please enter your full name.');
      return;
    }
    if (!comment.trim() || comment.length < 5) {
      setSubmitError('Please provide a meaningful review (at least 5 characters).');
      return;
    }

    setSubmitting(true);
    try {
      const validImages = imageUrls.map((u) => u.trim()).filter((u) => u.length > 0);
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          customerName: name,
          customerPhone: phone || undefined,
          rating,
          comment,
          images: validImages,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to submit review');
      }

      setSubmitSuccess('Thank you! Your verified review has been submitted.');
      setName('');
      setPhone('');
      setComment('');
      setImageUrls(['']);
      setRating(5);
      // Refresh reviews list
      await fetchReviews();
      setTimeout(() => {
        setIsModalOpen(false);
        setSubmitSuccess(null);
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Submission failed';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddImageUrl = () => {
    setImageUrls((prev) => [...prev, '']);
  };

  const handleUpdateImageUrl = (idx: number, val: string) => {
    setImageUrls((prev) => {
      const copy = [...prev];
      copy[idx] = val;
      return copy;
    });
  };

  const handleRemoveImageUrl = (idx: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-8">
      {/* Top Header & Write Review Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
              Customer Reviews & Ratings
            </h2>
            <span className="bg-amber-100 text-amber-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
              Verified Mart
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real feedback from verified purchasers of {productName}
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold transition shadow-sm hover:shadow active:scale-95 shrink-0"
        >
          <Camera className="w-4 h-4 text-amber-400" />
          <span>Write a Review</span>
        </button>
      </div>

      {/* Ratings & Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-slate-50/80 p-6 rounded-2xl border border-slate-100">
        {/* Left: Overall Score */}
        <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-4 border-b md:border-b-0 md:border-r border-slate-200/80">
          <div className="text-5xl font-price font-black text-slate-950 tracking-tight">
            {totalReviews > 0 ? avgRating : '5.0'}
          </div>
          <div className="flex items-center gap-1 my-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-5 h-5 ${
                  star <= Math.round(avgRating)
                    ? 'fill-amber-400 text-amber-400'
                    : 'fill-slate-200 text-slate-200'
                }`}
              />
            ))}
          </div>
          <p className="text-xs font-bold text-slate-700">
            Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
          </p>
          <div className="mt-2 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{recommendPercent}% of customers recommend this item</span>
          </div>
        </div>

        {/* Right: Star Distribution Bars */}
        <div className="md:col-span-8 space-y-2 max-w-lg mx-auto w-full">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = (ratingCounts as Record<number, number>)[stars] || 0;
            const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : stars === 5 ? 100 : 0;
            return (
              <div key={stars} className="flex items-center gap-3 text-xs">
                <button
                  onClick={() => setFilterRating(stars)}
                  className="flex items-center gap-1 w-14 font-bold text-slate-700 hover:text-amber-600 shrink-0 text-left"
                >
                  <span>{stars}</span>
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                </button>
                <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-10 text-right text-[11px] font-mono text-slate-500">{pct}%</span>
                <span className="w-8 text-right text-[11px] text-slate-400 font-semibold">({count})</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Customer Photos & Unboxing Gallery */}
      {allCustomerPhotos.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900">
                Customer Photos ({allCustomerPhotos.length})
              </h3>
            </div>
            <button
              onClick={() => setFilterRating('photos')}
              className="text-xs font-bold text-amber-600 hover:text-amber-700"
            >
              Filter with photos
            </button>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
            {allCustomerPhotos.map((item, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedPhoto(item)}
                className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border border-slate-200 shadow-2xs hover:shadow-md cursor-pointer shrink-0 group transition"
              >
                <img
                  src={item.url}
                  alt="Customer Review Photo"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/40 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <span className="text-[10px] font-bold text-white bg-slate-900/80 px-2 py-0.5 rounded-full">
                    View
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
        <button
          onClick={() => setFilterRating('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
            filterRating === 'all'
              ? 'bg-slate-950 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All ({totalReviews})
        </button>
        {photoCount > 0 && (
          <button
            onClick={() => setFilterRating('photos')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              filterRating === 'photos'
                ? 'bg-slate-950 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>With Photos ({photoCount})</span>
          </button>
        )}
        {[5, 4, 3, 2, 1].map((s) => {
          const count = (ratingCounts as Record<number, number>)[s] || 0;
          if (count === 0 && filterRating !== s) return null;
          return (
            <button
              key={s}
              onClick={() => setFilterRating(s)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                filterRating === s
                  ? 'bg-slate-950 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{s}</span>
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="text-[10px] opacity-75">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Review List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading customer reviews...
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">No reviews found for this selection</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Be the first verified customer to share your experience!</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-3 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold transition shadow-xs"
            >
              Write Review Now
            </button>
          </div>
        ) : (
          filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className="p-5 rounded-2xl bg-white border border-slate-100 hover:border-slate-200 shadow-2xs hover:shadow-xs transition space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-black text-sm flex items-center justify-center shrink-0 shadow-2xs">
                    {rev.customerName ? rev.customerName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{rev.customerName}</span>
                      {rev.isVerified && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                          <CheckCircle className="w-3 h-3" />
                          <span>Verified Purchase</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((st) => (
                          <Star
                            key={st}
                            className={`w-3.5 h-3.5 ${
                              st <= rev.rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'fill-slate-200 text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {rev.comment}
              </p>

              {/* Review Photos */}
              {rev.images && rev.images.length > 0 && (
                <div className="flex gap-2.5 pt-1 overflow-x-auto">
                  {rev.images.map((imgUrl, imgIdx) => (
                    <button
                      key={imgIdx}
                      type="button"
                      onClick={() => setSelectedPhoto({ url: imgUrl, review: rev })}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-slate-200 shrink-0 hover:opacity-90 transition"
                    >
                      <img src={imgUrl} alt="Review attachment" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative bg-white rounded-3xl overflow-hidden max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex-1 bg-black flex items-center justify-center overflow-hidden min-h-[300px]">
              <img
                src={selectedPhoto.url}
                alt="Enlarged Customer Photo"
                className="max-h-[60vh] w-auto object-contain"
              />
            </div>

            <div className="p-5 bg-white border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">{selectedPhoto.review.customerName}</span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>Verified Buyer</span>
                  </span>
                </div>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((st) => (
                    <Star
                      key={st}
                      className={`w-3.5 h-3.5 ${
                        st <= selectedPhoto.review.rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-slate-200 text-slate-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed italic">
                &ldquo;{selectedPhoto.review.comment}&rdquo;
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Write a Review Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-black text-slate-950">Share Your Experience</h3>
              <p className="text-xs text-slate-500 mt-0.5">Reviewing: {productName}</p>
            </div>

            {submitSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{submitSuccess}</span>
              </div>
            )}

            {submitError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-bold">
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmitReview} className="space-y-4">
              {/* Star Rating Select */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Overall Rating *</label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setRating(st)}
                      onMouseEnter={() => setHoverRating(st)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 transition-transform hover:scale-110 active:scale-95"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          st <= (hoverRating || rating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'fill-slate-100 text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-500 ml-2">
                    {hoverRating || rating} out of 5 stars
                  </span>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Your Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tanvir Ahmed"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Phone (optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Phone Number <span className="text-slate-400 font-normal">(Optional, for verification)</span>
                </label>
                <input
                  type="text"
                  placeholder="01XXXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Review Comment */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Your Review *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="What did you like or dislike? How was the quality, delivery, and packing?"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none"
                />
              </div>

              {/* Photo URLs */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Attach Unboxing Photos (URLs)</label>
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="text-[11px] font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Photo</span>
                  </button>
                </div>

                {imageUrls.map((url, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="url"
                      placeholder="https://example.com/photo.jpg"
                      value={url}
                      onChange={(e) => handleUpdateImageUrl(idx, e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                    {imageUrls.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveImageUrl(idx)}
                        className="p-2 text-slate-400 hover:text-red-500 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black transition shadow-sm active:scale-95 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Post Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
