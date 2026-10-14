'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Star,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Plus,
  Search,
  Check,
  X,
  Image as ImageIcon,
  MessageSquare,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  Edit2,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

interface Review {
  id: string;
  productId: string;
  customerName: string;
  customerPhone?: string | null;
  rating: number;
  comment: string;
  images: string[];
  isVerified: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

interface ProductOption {
  id: string;
  name: string;
  slug: string;
  sku?: string;
  sellingPrice?: number;
  salePrice?: number | null;
  rating?: number;
  reviewCount?: number;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Sync / Diagnostic state
  const [syncing, setSyncing] = useState(false);
  const [syncReport, setSyncReport] = useState<string | null>(null);

  // Add Review Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [newImages, setNewImages] = useState<string[]>(['']);
  const [creating, setCreating] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Photo viewer modal
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  // Edit Review Modal State (Super Admin)
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [editProductId, setEditProductId] = useState('');
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editVerified, setEditVerified] = useState(true);
  const [editStatus, setEditStatus] = useState<'APPROVED' | 'PENDING' | 'REJECTED'>('APPROVED');
  const [savingEdit, setSavingEdit] = useState(false);

  const openEditModal = (rev: Review) => {
    setEditingReview(rev);
    setEditProductId(rev.productId);
    setEditName(rev.customerName);
    setEditPhone(rev.customerPhone || '');
    setEditRating(rev.rating);
    setEditComment(rev.comment);
    setEditImages(rev.images && rev.images.length > 0 ? [...rev.images] : ['']);
    setEditVerified(rev.isVerified);
    setEditStatus(rev.status);
  };

  const handleSaveEditReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReview) return;
    setSavingEdit(true);
    try {
      const validImages = editImages.map((u) => u.trim()).filter((u) => u.length > 0);
      const res = await fetch(`/api/reviews/${editingReview.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: editProductId,
          customerName: editName,
          customerPhone: editPhone || undefined,
          rating: editRating,
          comment: editComment,
          images: validImages,
          isVerified: editVerified,
          status: editStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to update review');

      setReviews((prev) =>
        prev.map((r) =>
          r.id === editingReview.id
            ? {
                ...r,
                productId: editProductId,
                customerName: editName,
                customerPhone: editPhone || null,
                rating: editRating,
                comment: editComment,
                images: validImages,
                isVerified: editVerified,
                status: editStatus,
              }
            : r
        )
      );
      setEditingReview(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleSyncAndAudit = async () => {
    setSyncing(true);
    setSyncReport(null);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync' }),
      });
      const data = await res.json();
      if (data.success && data.report) {
        setSyncReport(
          `✓ Catalog Review Health Verified: ${data.report.totalReviews} total reviews synced across ${data.report.syncedProducts}/${data.report.totalProducts} active products.`
        );
        await fetchReviews();
        await fetchProducts();
        setTimeout(() => setSyncReport(null), 8000);
      }
    } catch (err) {
      console.error('Audit failed:', err);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchReviews();
    fetchProducts();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reviews?forAdmin=true');
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

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products?limit=200');
      const data = await res.json();
      if (data.products && Array.isArray(data.products)) {
        setProducts(
          data.products.map((p: any) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            sku: p.sku,
            sellingPrice: p.sellingPrice,
            salePrice: p.salePrice,
            rating: p.rating,
            reviewCount: p.reviewCount,
          }))
        );
        if (data.products.length > 0 && !selectedProductId) {
          setSelectedProductId(data.products[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  };

  // Status metrics
  const stats = useMemo(() => {
    const total = reviews.length;
    const pending = reviews.filter((r) => r.status === 'PENDING').length;
    const approved = reviews.filter((r) => r.status === 'APPROVED').length;
    const rejected = reviews.filter((r) => r.status === 'REJECTED').length;
    const avg =
      total > 0
        ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / total).toFixed(1)
        : '5.0';
    return { total, pending, approved, rejected, avg };
  }, [reviews]);

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesName = r.customerName?.toLowerCase().includes(query);
        const matchesComment = r.comment?.toLowerCase().includes(query);
        const matchesProduct = r.productId?.toLowerCase().includes(query);
        return matchesName || matchesComment || matchesProduct;
      }
      return true;
    });
  }, [reviews, statusFilter, search]);

  const handleUpdateStatus = async (id: string, newStatus: 'APPROVED' | 'REJECTED' | 'PENDING') => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to update review status');
      }

      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this customer review?')) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/reviews/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to delete review');
      }

      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMsg(null);

    if (!selectedProductId) {
      setFeedbackMsg({ type: 'error', text: 'Please select a product.' });
      return;
    }
    if (!newCustomerName.trim() || !newComment.trim()) {
      setFeedbackMsg({ type: 'error', text: 'Name and review text are required.' });
      return;
    }

    setCreating(true);
    try {
      const validImages = newImages.map((u) => u.trim()).filter((u) => u.length > 0);
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProductId,
          customerName: newCustomerName,
          customerPhone: newCustomerPhone || undefined,
          rating: newRating,
          comment: newComment,
          images: validImages,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to create review');
      }

      setFeedbackMsg({ type: 'success', text: 'Review published successfully!' });
      setNewCustomerName('');
      setNewCustomerPhone('');
      setNewComment('');
      setNewImages(['']);
      await fetchReviews();

      setTimeout(() => {
        setIsAddModalOpen(false);
        setFeedbackMsg(null);
      }, 1200);
    } catch (err: unknown) {
      setFeedbackMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Submission failed',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleAddImageField = () => setNewImages((prev) => [...prev, '']);
  const handleUpdateImageField = (idx: number, val: string) => {
    setNewImages((prev) => {
      const copy = [...prev];
      copy[idx] = val;
      return copy;
    });
  };
  const handleRemoveImageField = (idx: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
              Customer Reviews Moderation
            </h1>
            <span className="bg-amber-100 text-amber-800 text-xs font-black px-2.5 py-0.5 rounded-full">
              Mart Trust Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Moderate incoming customer ratings, approve unboxing photos, and publish verified buyer reviews.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSyncAndAudit}
            disabled={syncing}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition shadow-2xs active:scale-95 disabled:opacity-50"
            title="Audit all review links across catalog and self-heal any discrepancies"
          >
            <Sparkles className={`w-3.5 h-3.5 text-amber-500 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Auditing Catalog...' : '1-Click Catalog Sync'}</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold transition shadow-sm active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Verified Review</span>
          </button>
        </div>
      </div>

      {/* Sync Diagnostic Report Toast */}
      {syncReport && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-between shadow-2xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{syncReport}</span>
          </div>
          <button onClick={() => setSyncReport(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500">Total Reviews</div>
          <div className="text-2xl font-black text-slate-950 mt-1">{stats.total}</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>Avg {stats.avg} / 5.0</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-amber-700 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Pending Review</span>
          </div>
          <div className="text-2xl font-black text-amber-600 mt-1">{stats.pending}</div>
          <div className="text-[11px] text-slate-400 mt-1">Requires approval</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            <span>Approved & Live</span>
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{stats.approved}</div>
          <div className="text-[11px] text-slate-400 mt-1">Visible on storefront</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-red-700 flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5 text-red-500" />
            <span>Rejected / Spam</span>
          </div>
          <div className="text-2xl font-black text-red-600 mt-1">{stats.rejected}</div>
          <div className="text-[11px] text-slate-400 mt-1">Filtered from public</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                statusFilter === tab
                  ? 'bg-slate-950 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab === 'ALL' && `All (${stats.total})`}
              {tab === 'PENDING' && `Pending (${stats.pending})`}
              {tab === 'APPROVED' && `Approved (${stats.approved})`}
              {tab === 'REJECTED' && `Rejected (${stats.rejected})`}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer, comment, product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Reviews Table / Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-xs text-slate-400">
            <div className="w-7 h-7 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading reviews data...
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">No reviews found</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Try altering your search or status filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredReviews.map((rev) => {
              const matchedProduct = products.find(
                (p) =>
                  p.id === rev.productId ||
                  String(p.id).toLowerCase() === String(rev.productId).toLowerCase() ||
                  (p.slug && p.slug.toLowerCase() === String(rev.productId).toLowerCase()) ||
                  (p.sku && p.sku.toLowerCase() === String(rev.productId).toLowerCase()) ||
                  (p.name && p.name.toLowerCase() === String(rev.productId).toLowerCase())
              );
              return (
                <div key={rev.id} className="p-5 hover:bg-slate-50/70 transition space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-900 text-amber-400 font-black text-xs flex items-center justify-center shrink-0">
                        {rev.customerName ? rev.customerName.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900">{rev.customerName}</span>
                          {rev.isVerified && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              <span>Verified Buyer</span>
                            </span>
                          )}
                          {rev.customerPhone && (
                            <span className="text-[10px] font-mono text-slate-400">
                              {rev.customerPhone}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-[11px] font-bold text-slate-500">
                            Product: <span className="text-slate-900 font-black">{matchedProduct ? matchedProduct.name : rev.productId}</span>
                          </span>
                          {matchedProduct?.sku && (
                            <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200">
                              SKU: {matchedProduct.sku}
                            </span>
                          )}
                          {matchedProduct && (
                            <a
                              href={`/product/${matchedProduct.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-amber-600 hover:text-amber-700 inline-flex items-center gap-0.5 text-[11px] font-bold"
                            >
                              <span>View</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status Badge & Actions */}
                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                          rev.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : rev.status === 'PENDING'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                      >
                        {rev.status}
                      </span>

                      {/* Super Admin Edit Button */}
                      <button
                        onClick={() => openEditModal(rev)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-800 rounded-lg text-[11px] font-bold flex items-center gap-1 transition"
                        title="Edit review"
                      >
                        <Edit2 className="w-3 h-3 text-amber-600" />
                        <span>Edit</span>
                      </button>

                      {/* 1-Click Approve / Reject */}
                      {rev.status !== 'APPROVED' && (
                        <button
                          onClick={() => handleUpdateStatus(rev.id, 'APPROVED')}
                          disabled={actionLoading === rev.id}
                          className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition shadow-2xs active:scale-95"
                          title="Approve review"
                        >
                          <Check className="w-3 h-3" />
                          <span>Approve</span>
                        </button>
                      )}

                      {rev.status !== 'REJECTED' && (
                        <button
                          onClick={() => handleUpdateStatus(rev.id, 'REJECTED')}
                          disabled={actionLoading === rev.id}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 rounded-lg text-[11px] font-bold flex items-center gap-1 transition"
                          title="Reject review"
                        >
                          <X className="w-3 h-3" />
                          <span>Reject</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(rev.id)}
                        disabled={actionLoading === rev.id}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition"
                        title="Delete permanently"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Rating Stars & Date */}
                  <div className="flex items-center gap-2">
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
                    <span className="text-[11px] text-slate-400">
                      {rev.createdAt ? new Date(rev.createdAt).toLocaleString() : 'N/A'}
                    </span>
                  </div>

                  {/* Comment Text */}
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {rev.comment}
                  </p>

                  {/* Attached Photos */}
                  {rev.images && rev.images.length > 0 && (
                    <div className="flex items-center gap-2 pt-1 overflow-x-auto">
                      <span className="text-[10px] font-bold text-slate-400 shrink-0">Attached Photos:</span>
                      {rev.images.map((imgUrl, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setPreviewPhoto(imgUrl)}
                          className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 shrink-0 hover:scale-105 transition"
                        >
                          <img src={imgUrl} alt="Review attachment" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Photo Preview Modal */}
      {previewPhoto && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative bg-white rounded-3xl overflow-hidden max-w-xl w-full shadow-2xl p-4">
            <button
              onClick={() => setPreviewPhoto(null)}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="bg-black rounded-2xl overflow-hidden flex items-center justify-center">
              <img src={previewPhoto} alt="Review Attachment" className="max-h-[70vh] object-contain" />
            </div>
          </div>
        </div>
      )}

      {/* Add Verified Review Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-lg font-black text-slate-950">Add Verified Customer Review</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Post an authentic customer review with star ratings and real unboxing photos to boost conversion.
              </p>
            </div>

            {feedbackMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  feedbackMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-red-50 text-red-600 border border-red-200'
                }`}
              >
                {feedbackMsg.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                <span>{feedbackMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleCreateReview} className="space-y-4">
              {/* Product Select */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Product *</label>
                <select
                  required
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-mono"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.sku ? `• SKU: ${p.sku}` : ''} • ৳{p.salePrice || p.sellingPrice || 0}
                    </option>
                  ))}
                </select>
              </div>

              {/* Customer Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shakib Al Hasan"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Customer Phone (optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Customer Phone (Optional)</label>
                <input
                  type="text"
                  placeholder="01712-XXXXXX"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Rating */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Rating *</label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewRating(star)}
                      className="p-1"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= newRating
                            ? 'fill-amber-400 text-amber-400'
                            : 'fill-slate-100 text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-600 ml-2">{newRating} Stars</span>
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Review Comment *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe product quality, delivery speed, packing..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none"
                />
              </div>

              {/* Unboxing Photos */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Unboxing Photo URLs</label>
                  <button
                    type="button"
                    onClick={handleAddImageField}
                    className="text-[11px] font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Photo</span>
                  </button>
                </div>

                {newImages.map((imgUrl, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/photo-..."
                      value={imgUrl}
                      onChange={(e) => handleUpdateImageField(idx, e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                    {newImages.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveImageField(idx)}
                        className="p-2 text-slate-400 hover:text-red-500"
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
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black transition shadow-sm disabled:opacity-50"
                >
                  {creating ? 'Publishing...' : 'Publish Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Super Admin Edit Review Modal */}
      {editingReview && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <button
              onClick={() => setEditingReview(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-lg font-black text-slate-950">Super Admin: Edit Customer Review</h2>
              <p className="text-xs text-slate-500">Editing review ID: {editingReview.id}</p>
            </div>

            <form onSubmit={handleSaveEditReview} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Product</label>
                <select
                  value={editProductId}
                  onChange={(e) => setEditProductId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.sku ? `• SKU: ${p.sku}` : ''} • ৳{p.salePrice || p.sellingPrice || 0}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Customer Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Customer Phone</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Star Rating (1 - 5)</label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setEditRating(st)}
                      className="p-1"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          st <= editRating ? 'fill-amber-400 text-amber-400' : 'fill-slate-100 text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-600 ml-2">{editRating} Stars</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Review Text</label>
                <textarea
                  rows={4}
                  required
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none"
                />
              </div>

              {/* Photos */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Attached Photos (URLs)</label>
                  <button
                    type="button"
                    onClick={() => setEditImages((p) => [...p, ''])}
                    className="text-[11px] font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Photo URL</span>
                  </button>
                </div>
                {editImages.map((url, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => {
                        const copy = [...editImages];
                        copy[idx] = e.target.value;
                        setEditImages(copy);
                      }}
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setEditImages((p) => p.filter((_, i) => i !== idx))}
                      className="p-1.5 text-slate-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Status & Verified */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Approval Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                  >
                    <option value="APPROVED">APPROVED (Live)</option>
                    <option value="PENDING">PENDING</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editVerified}
                      onChange={(e) => setEditVerified(e.target.checked)}
                      className="rounded accent-emerald-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-700">Verified Buyer Badge</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingReview(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black transition shadow-sm disabled:opacity-50"
                >
                  {savingEdit ? 'Saving...' : 'Save Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
