'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { formatBDT } from '@/lib/currency';
import {
  Sliders,
  Truck,
  PlusCircle,
  Star,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  ShoppingBag,
  Edit2,
  Trash2,
  Plus,
  Check,
  X,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  ShieldCheck,
  Palette,
  Layers,
  Sparkles,
} from 'lucide-react';

interface StoreSettings {
  freeDeliveryEnabled: boolean;
  freeDeliveryThreshold: number;
  freeDeliveryOutsideThreshold: number;
  freeDeliveryBannerText: string;
  freeDeliveryUnlockedText: string;
  freeDeliveryBarColor: 'amber' | 'emerald' | 'indigo' | 'rose';
  minOrderAmount: number;
  cardStepperEnabled: boolean;
  cardShowDiscountBadge: boolean;
  cardShowRating: boolean;
  cardShowStockWarning: boolean;
  reviewAutoApprove: boolean;
  reviewAllowImages: boolean;
  reviewMinCharacters: number;
  // Phase 3 Settings
  rewardPointsEnabled: boolean;
  rewardPointsEarnRate: number;
  rewardPointValueBdt: number;
  rewardMinRedeemPoints: number;
  fraudDetectionEnabled: boolean;
  fraudMaxCodAmount: number;
  fraudHighRiskAdvanceFeeRequired: boolean;
  blacklistedPhones: string[];
  whitelistedPhones: string[];
}

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

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<'delivery' | 'reviews' | 'cards' | 'rewards' | 'fraud'>('delivery');

  // Settings State
  const [settings, setSettings] = useState<StoreSettings>({
    freeDeliveryEnabled: true,
    freeDeliveryThreshold: 1500,
    freeDeliveryOutsideThreshold: 2000,
    freeDeliveryBannerText: 'Add ৳{remaining} more for FREE Delivery! 🚚',
    freeDeliveryUnlockedText: '🎉 You have unlocked FREE Delivery!',
    freeDeliveryBarColor: 'amber',
    minOrderAmount: 0,
    cardStepperEnabled: true,
    cardShowDiscountBadge: true,
    cardShowRating: true,
    cardShowStockWarning: true,
    reviewAutoApprove: true,
    reviewAllowImages: true,
    reviewMinCharacters: 5,
    rewardPointsEnabled: true,
    rewardPointsEarnRate: 100,
    rewardPointValueBdt: 1,
    rewardMinRedeemPoints: 50,
    fraudDetectionEnabled: true,
    fraudMaxCodAmount: 4000,
    fraudHighRiskAdvanceFeeRequired: true,
    blacklistedPhones: [],
    whitelistedPhones: [],
  });

  // Fraud Phone Management State
  const [newBlacklistPhone, setNewBlacklistPhone] = useState('');
  const [newWhitelistPhone, setNewWhitelistPhone] = useState('');
  const [phoneActionLoading, setPhoneActionLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Interactive Live Simulator Cart Value
  const [simulatedCart, setSimulatedCart] = useState<number>(950);

  // Reviews Management State
  const [reviews, setReviews] = useState<Review[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewSearch, setReviewSearch] = useState('');
  const [reviewStatusFilter, setReviewStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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

  // Add Review Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [newImages, setNewImages] = useState<string[]>(['']);
  const [creatingReview, setCreatingReview] = useState(false);

  // Photo viewer modal
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
    fetchReviews();
    fetchProducts();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.success && data.settings) {
        setSettings((prev) => ({
          ...prev,
          freeDeliveryEnabled: data.settings.freeDeliveryEnabled !== false,
          freeDeliveryThreshold: Number(data.settings.freeDeliveryThreshold) || 1500,
          freeDeliveryOutsideThreshold: Number(data.settings.freeDeliveryOutsideThreshold) || 2000,
          freeDeliveryBannerText: data.settings.freeDeliveryBannerText || 'Add ৳{remaining} more for FREE Delivery! 🚚',
          freeDeliveryUnlockedText: data.settings.freeDeliveryUnlockedText || '🎉 You have unlocked FREE Delivery!',
          freeDeliveryBarColor: data.settings.freeDeliveryBarColor || 'amber',
          minOrderAmount: Number(data.settings.minOrderAmount) || 0,
          cardStepperEnabled: data.settings.cardStepperEnabled !== false,
          cardShowDiscountBadge: data.settings.cardShowDiscountBadge !== false,
          cardShowRating: data.settings.cardShowRating !== false,
          cardShowStockWarning: data.settings.cardShowStockWarning !== false,
          reviewAutoApprove: data.settings.reviewAutoApprove !== false,
          reviewAllowImages: data.settings.reviewAllowImages !== false,
          reviewMinCharacters: Number(data.settings.reviewMinCharacters) || 5,
          rewardPointsEnabled: data.settings.rewardPointsEnabled !== false,
          rewardPointsEarnRate: Number(data.settings.rewardPointsEarnRate) || 100,
          rewardPointValueBdt: Number(data.settings.rewardPointValueBdt) || 1,
          rewardMinRedeemPoints: Number(data.settings.rewardMinRedeemPoints) || 50,
          fraudDetectionEnabled: data.settings.fraudDetectionEnabled !== false,
          fraudMaxCodAmount: Number(data.settings.fraudMaxCodAmount) || 4000,
          fraudHighRiskAdvanceFeeRequired: data.settings.fraudHighRiskAdvanceFeeRequired !== false,
          blacklistedPhones: Array.isArray(data.settings.blacklistedPhones) ? data.settings.blacklistedPhones : [],
          whitelistedPhones: Array.isArray(data.settings.whitelistedPhones) ? data.settings.whitelistedPhones : [],
        }));
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
      setErrorMessage('Could not load current settings. Using defaults.');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    setReviewsLoading(true);
    try {
      const res = await fetch('/api/reviews?forAdmin=true');
      const data = await res.json();
      if (data.success && Array.isArray(data.reviews)) {
        setReviews(data.reviews);
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setReviewsLoading(false);
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

  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to update store settings');
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Save error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddBlacklist = async () => {
    if (!newBlacklistPhone.trim()) return;
    setPhoneActionLoading(true);
    try {
      const res = await fetch('/api/fraud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'blacklist', phone: newBlacklistPhone.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setSettings((prev) => ({
          ...prev,
          blacklistedPhones: data.blacklisted || [...(prev.blacklistedPhones || []), newBlacklistPhone.trim()],
        }));
        setNewBlacklistPhone('');
      } else {
        alert(data.error || 'Failed to add to blacklist');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setPhoneActionLoading(false);
    }
  };

  const handleRemoveBlacklist = async (phone: string) => {
    setPhoneActionLoading(true);
    try {
      const res = await fetch('/api/fraud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unblacklist', phone }),
      });
      const data = await res.json();
      if (data.success) {
        setSettings((prev) => ({
          ...prev,
          blacklistedPhones: data.blacklisted || (prev.blacklistedPhones || []).filter((p) => p !== phone),
        }));
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setPhoneActionLoading(false);
    }
  };

  const handleAddWhitelist = async () => {
    if (!newWhitelistPhone.trim()) return;
    setPhoneActionLoading(true);
    try {
      const res = await fetch('/api/fraud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'whitelist', phone: newWhitelistPhone.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setSettings((prev) => ({
          ...prev,
          whitelistedPhones: data.whitelisted || [...(prev.whitelistedPhones || []), newWhitelistPhone.trim()],
        }));
        setNewWhitelistPhone('');
      } else {
        alert(data.error || 'Failed to add to whitelist');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setPhoneActionLoading(false);
    }
  };

  const handleRemoveWhitelist = async (phone: string) => {
    setPhoneActionLoading(true);
    try {
      const res = await fetch('/api/fraud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unwhitelist', phone }),
      });
      const data = await res.json();
      if (data.success) {
        setSettings((prev) => ({
          ...prev,
          whitelistedPhones: data.whitelisted || (prev.whitelistedPhones || []).filter((p) => p !== phone),
        }));
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setPhoneActionLoading(false);
    }
  };

  // Review Actions
  const handleUpdateReviewStatus = async (id: string, newStatus: 'APPROVED' | 'REJECTED' | 'PENDING') => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to update review status');

      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this customer review?')) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/reviews/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to delete review');

      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setActionLoading(null);
    }
  };

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

  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !newCustomerName.trim() || !newComment.trim()) {
      alert('Please fill in product, customer name, and comment.');
      return;
    }

    setCreatingReview(true);
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
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to create review');

      setNewCustomerName('');
      setNewCustomerPhone('');
      setNewComment('');
      setNewImages(['']);
      await fetchReviews();
      setIsAddModalOpen(false);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setCreatingReview(false);
    }
  };

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      if (reviewStatusFilter !== 'ALL' && r.status !== reviewStatusFilter) return false;
      if (reviewSearch.trim()) {
        const q = reviewSearch.toLowerCase();
        const matchesName = r.customerName?.toLowerCase().includes(q);
        const matchesComment = r.comment?.toLowerCase().includes(q);
        const matchesProduct = r.productId?.toLowerCase().includes(q);
        return matchesName || matchesComment || matchesProduct;
      }
      return true;
    });
  }, [reviews, reviewStatusFilter, reviewSearch]);

  // Review statistics
  const reviewStats = useMemo(() => {
    const total = reviews.length;
    const pending = reviews.filter((r) => r.status === 'PENDING').length;
    const approved = reviews.filter((r) => r.status === 'APPROVED').length;
    const rejected = reviews.filter((r) => r.status === 'REJECTED').length;
    return { total, pending, approved, rejected };
  }, [reviews]);

  // Dynamic Free Delivery Preview Calculations
  const previewThreshold = settings.freeDeliveryThreshold || 1500;
  const previewRemaining = Math.max(0, previewThreshold - simulatedCart);
  const previewProgress = Math.min(100, Math.round((simulatedCart / previewThreshold) * 100));
  const previewUnlocked = simulatedCart >= previewThreshold;

  // Color theme classes for the progress bar
  const getProgressBarColor = () => {
    switch (settings.freeDeliveryBarColor) {
      case 'emerald':
        return 'from-emerald-400 to-emerald-500';
      case 'indigo':
        return 'from-indigo-500 to-violet-600';
      case 'rose':
        return 'from-rose-500 to-red-600';
      case 'amber':
      default:
        return 'from-amber-400 to-amber-500';
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
              Mart Settings & Super Admin Controls
            </h1>
            <span className="bg-amber-100 text-amber-800 text-xs font-black px-2.5 py-0.5 rounded-full">
              Full Super Admin Access
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete customization of Dynamic Free Delivery, Product Card Steppers, and Super Admin Customer Reviews (Show, Edit, Delete).
          </p>
        </div>

        <button
          onClick={() => handleSaveSettings()}
          disabled={saving || loading}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black transition shadow-sm active:scale-95 disabled:opacity-50 shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving Changes...' : 'Save All Settings'}</span>
        </button>
      </div>

      {/* Save Success Alert */}
      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2.5 shadow-2xs animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <div>Mart settings updated successfully!</div>
            <div className="text-[11px] font-normal text-emerald-700">
              Changes are immediately active across Storefront, Cart Drawer, and Checkout.
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('delivery')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition shrink-0 ${
            activeTab === 'delivery'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Dynamic Free Delivery Engine</span>
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition shrink-0 ${
            activeTab === 'reviews'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Star className="w-4 h-4" />
          <span>Customer Reviews & Ratings ({reviews.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('cards')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition shrink-0 ${
            activeTab === 'cards'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Product Cards & Steppers</span>
        </button>

        <button
          onClick={() => setActiveTab('rewards')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition shrink-0 ${
            activeTab === 'rewards'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>Elite Rewards & Cashback</span>
        </button>

        <button
          onClick={() => setActiveTab('fraud')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition shrink-0 ${
            activeTab === 'fraud'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-rose-600" />
          <span>Zero-Return Fraud & COD Shield</span>
        </button>
      </div>

      {/* TAB 1: DYNAMIC FREE DELIVERY ENGINE */}
      {activeTab === 'delivery' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            {/* Header & Toggle */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 font-bold shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-slate-950">
                    Dynamic Free Delivery Progress Engine
                  </h2>
                  <p className="text-xs text-slate-500">
                    Motivates customers to increase cart size to qualify for free shipping.
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.freeDeliveryEnabled}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, freeDeliveryEnabled: e.target.checked }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            <div className="p-6 space-y-6">
              {/* Thresholds */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Inside Dhaka / Standard Free Delivery Threshold (BDT ৳) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      ৳
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      required
                      value={settings.freeDeliveryThreshold}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          freeDeliveryThreshold: Math.max(0, Number(e.target.value) || 0),
                        }))
                      }
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Orders equal to or exceeding this subtotal automatically receive ৳0 delivery fee at checkout.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Outside Dhaka Free Delivery Threshold (BDT ৳)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      ৳
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={settings.freeDeliveryOutsideThreshold}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          freeDeliveryOutsideThreshold: Math.max(0, Number(e.target.value) || 0),
                        }))
                      }
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Higher free delivery qualification for outside Dhaka deliveries.
                  </p>
                </div>
              </div>

              {/* Text Customization */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Progress Bar Prompt Text *
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.freeDeliveryBannerText}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, freeDeliveryBannerText: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    placeholder="Add ৳{remaining} more for FREE Delivery! 🚚"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Use <code className="bg-slate-100 px-1 py-0.5 rounded text-amber-700 font-bold">&#123;remaining&#125;</code> as the dynamic amount placeholder.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Celebration (Unlocked) Text *
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.freeDeliveryUnlockedText}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, freeDeliveryUnlockedText: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    placeholder="🎉 You have unlocked FREE Delivery!"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Displayed once the cart reaches or exceeds the threshold.
                  </p>
                </div>
              </div>

              {/* Color Theme Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  Progress Bar Color Theme
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'amber', label: 'Mart Amber', gradient: 'from-amber-400 to-amber-500' },
                    { id: 'emerald', label: 'Emerald Green', gradient: 'from-emerald-400 to-emerald-500' },
                    { id: 'indigo', label: 'Cyber Indigo', gradient: 'from-indigo-500 to-violet-600' },
                    { id: 'rose', label: 'Crimson Red', gradient: 'from-rose-500 to-red-600' },
                  ].map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() =>
                        setSettings((s) => ({ ...s, freeDeliveryBarColor: theme.id as any }))
                      }
                      className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition ${
                        settings.freeDeliveryBarColor === theme.id
                          ? 'border-amber-500 bg-amber-50/50 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${theme.gradient}`} />
                      <span className="text-xs font-bold text-slate-800">{theme.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Minimum Order Value */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Minimum Order Value to Checkout (BDT ৳) <span className="text-slate-400 font-normal">(0 = No Minimum)</span>
                </label>
                <div className="relative max-w-xs">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    ৳
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={settings.minOrderAmount}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        minOrderAmount: Math.max(0, Number(e.target.value) || 0),
                      }))
                    }
                    className="w-full pl-8 pr-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Interactive Live Storefront Simulator */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-black text-slate-900">
                    <Eye className="w-4 h-4 text-amber-500" />
                    <span>Interactive Storefront Simulator</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500 font-medium">Test Cart Subtotal:</span>
                    <input
                      type="number"
                      min="0"
                      max="5000"
                      step="50"
                      value={simulatedCart}
                      onChange={(e) => setSimulatedCart(Math.max(0, Number(e.target.value) || 0))}
                      className="w-24 px-2 py-1 rounded-lg border border-slate-300 font-black text-slate-900 text-center"
                    />
                    <span className="font-bold text-slate-600">৳</span>
                  </div>
                </div>

                {/* Slider */}
                <input
                  type="range"
                  min="0"
                  max="3000"
                  step="50"
                  value={simulatedCart}
                  onChange={(e) => setSimulatedCart(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />

                {/* Live Output */}
                {settings.freeDeliveryEnabled ? (
                  <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <div className="flex items-center gap-1.5 text-slate-800">
                        <Truck className="w-4 h-4 text-amber-500 animate-pulse" />
                        <span>
                          {previewUnlocked
                            ? settings.freeDeliveryUnlockedText
                            : settings.freeDeliveryBannerText.replace(
                                '{remaining}',
                                previewRemaining.toString()
                              )}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 font-bold">
                        {previewProgress}%
                      </span>
                    </div>

                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${getProgressBarColor()} rounded-full transition-all duration-300`}
                        style={{ width: `${previewProgress}%` }}
                      />
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                      <span>Simulated Cart: ৳{simulatedCart}</span>
                      <span>
                        Delivery Fee at Checkout:{' '}
                        {previewUnlocked ? (
                          <strong className="text-emerald-600 font-black">FREE ৳0</strong>
                        ) : (
                          <span className="font-bold text-slate-700">৳60 (Standard)</span>
                        )}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 italic text-center py-3">
                    Free Delivery Progress Bar is currently DISABLED.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CUSTOMER REVIEWS (SHOW ALL, EDIT, DELETE - SUPER ADMIN) */}
      {activeTab === 'reviews' && (
        <div className="space-y-6">
          {/* Top Actions & Moderation Policy */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-slate-950">
                    Customer Reviews & Moderation Center
                  </h2>
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-2.5 py-0.5 rounded-full">
                    Super Admin Mode
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Full control: View every review, edit review text & photos, delete spam, or add authentic reviews.
                </p>
              </div>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold transition shadow-2xs shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Verified Review</span>
              </button>
            </div>

            {/* Quick Policy Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                <div>
                  <div className="text-xs font-bold text-slate-900">Auto-Approve New Reviews</div>
                  <div className="text-[11px] text-slate-500">
                    Reviews go live immediately without waiting for admin approval.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.reviewAutoApprove}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, reviewAutoApprove: e.target.checked }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                <div>
                  <div className="text-xs font-bold text-slate-900">Allow Photo Uploads</div>
                  <div className="text-[11px] text-slate-500">
                    Permit buyers to upload unboxing photos in review modal.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.reviewAllowImages}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, reviewAllowImages: e.target.checked }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-slate-500 font-semibold">Total Reviews</span>
              <div className="text-2xl font-black text-slate-950 mt-0.5">{reviewStats.total}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-amber-700 font-semibold">Pending Approval</span>
              <div className="text-2xl font-black text-amber-600 mt-0.5">{reviewStats.pending}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-emerald-700 font-semibold">Approved & Live</span>
              <div className="text-2xl font-black text-emerald-600 mt-0.5">{reviewStats.approved}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-red-700 font-semibold">Rejected / Spam</span>
              <div className="text-2xl font-black text-red-600 mt-0.5">{reviewStats.rejected}</div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
              {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setReviewStatusFilter(tab)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                    reviewStatusFilter === tab
                      ? 'bg-slate-950 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab === 'ALL' && `All (${reviewStats.total})`}
                  {tab === 'PENDING' && `Pending (${reviewStats.pending})`}
                  {tab === 'APPROVED' && `Approved (${reviewStats.approved})`}
                  {tab === 'REJECTED' && `Rejected (${reviewStats.rejected})`}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search reviews..."
                value={reviewSearch}
                onChange={(e) => setReviewSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Reviews List / Table with EDIT & DELETE */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            {reviewsLoading ? (
              <div className="text-center py-16 text-xs text-slate-400">
                <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Loading reviews...
              </div>
            ) : filteredReviews.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-xs">
                No reviews found matching your filter.
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
                          <div className="w-8 h-8 rounded-full bg-slate-900 text-amber-400 font-black text-xs flex items-center justify-center shrink-0">
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
                                <span className="text-[10px] font-mono text-slate-400">{rev.customerPhone}</span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                              <span>Product:</span>{' '}
                              <strong className="text-slate-900 font-black">
                                {matchedProduct ? matchedProduct.name : rev.productId}
                              </strong>
                              {matchedProduct?.sku && (
                                <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200">
                                  SKU: {matchedProduct.sku}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions: Edit, Delete, Status */}
                        <div className="flex items-center gap-2 self-start sm:self-center">
                          <span
                            className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                              rev.status === 'APPROVED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : rev.status === 'PENDING'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-red-50 text-red-700 border-red-200'
                            }`}
                          >
                            {rev.status}
                          </span>

                          {/* EDIT Button */}
                          <button
                            type="button"
                            onClick={() => openEditModal(rev)}
                            className="p-1.5 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-800 rounded-lg text-xs font-bold transition flex items-center gap-1"
                            title="Edit Review"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-amber-600" />
                            <span className="text-[11px]">Edit</span>
                          </button>

                          {/* 1-Click Status */}
                          {rev.status !== 'APPROVED' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateReviewStatus(rev.id, 'APPROVED')}
                              disabled={actionLoading === rev.id}
                              className="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[11px] font-bold transition"
                              title="Approve"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          )}

                          {rev.status !== 'REJECTED' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateReviewStatus(rev.id, 'REJECTED')}
                              disabled={actionLoading === rev.id}
                              className="px-2 py-1 bg-slate-200 hover:bg-red-500 hover:text-white text-slate-700 rounded-lg text-[11px] font-bold transition"
                              title="Reject"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}

                          {/* DELETE Button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteReview(rev.id)}
                            disabled={actionLoading === rev.id}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition"
                            title="Delete Permanently"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Stars & Comment */}
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((st) => (
                          <Star
                            key={st}
                            className={`w-3.5 h-3.5 ${
                              st <= rev.rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'
                            }`}
                          />
                        ))}
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                        {rev.comment}
                      </p>

                      {/* Photos */}
                      {rev.images && rev.images.length > 0 && (
                        <div className="flex items-center gap-2 pt-1 overflow-x-auto">
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
        </div>
      )}

      {/* TAB 3: PRODUCT CARDS & STEPPERS */}
      {activeTab === 'cards' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 font-bold shrink-0">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-950">
                  Product Card Quick-Add Quantity Stepper (+ / -)
                </h2>
                <p className="text-xs text-slate-500">
                  Enables 1-click quantity adjustments directly on product cards without opening drawer.
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.cardStepperEnabled}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, cardStepperEnabled: e.target.checked }))
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900">Show Discount % Badge</div>
                <div className="text-[11px] text-slate-500">e.g. &ldquo;SAVE 20%&rdquo; on card</div>
              </div>
              <input
                type="checkbox"
                checked={settings.cardShowDiscountBadge}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, cardShowDiscountBadge: e.target.checked }))
                }
                className="rounded accent-amber-500 w-4 h-4 cursor-pointer"
              />
            </div>

            <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900">Show Star Rating on Cards</div>
                <div className="text-[11px] text-slate-500">Displays avg stars & review count</div>
              </div>
              <input
                type="checkbox"
                checked={settings.cardShowRating}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, cardShowRating: e.target.checked }))
                }
                className="rounded accent-amber-500 w-4 h-4 cursor-pointer"
              />
            </div>

            <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900">Show Low Stock Warning</div>
                <div className="text-[11px] text-slate-500">e.g. &ldquo;Only 3 left in stock&rdquo;</div>
              </div>
              <input
                type="checkbox"
                checked={settings.cardShowStockWarning}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, cardShowStockWarning: e.target.checked }))
                }
                className="rounded accent-amber-500 w-4 h-4 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ELITE REWARDS & CASHBACK SYSTEM */}
      {activeTab === 'rewards' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            {/* Header & Toggle */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 font-bold shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-slate-950">
                    Elite Rewards & Cashback System
                  </h2>
                  <p className="text-xs text-slate-500">
                    Automatic loyalty point accumulation and checkout discounts to maximize repeat orders.
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.rewardPointsEnabled}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, rewardPointsEnabled: e.target.checked }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {/* Controls Grid */}
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Earn Rate */}
                <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                  <label className="block text-xs font-bold text-slate-900">
                    Spend (BDT) to Earn 1 Point
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">৳</span>
                    <input
                      type="number"
                      min={10}
                      step={10}
                      value={settings.rewardPointsEarnRate}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          rewardPointsEarnRate: Math.max(1, Number(e.target.value) || 100),
                        }))
                      }
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    e.g. ৳100 spent = 1 point earned on delivered orders (1% cashback).
                  </p>
                </div>

                {/* Point Value */}
                <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                  <label className="block text-xs font-bold text-slate-900">
                    1 Point Discount Value (BDT)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">৳</span>
                    <input
                      type="number"
                      min={0.1}
                      step={0.5}
                      value={settings.rewardPointValueBdt}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          rewardPointValueBdt: Math.max(0.1, Number(e.target.value) || 1),
                        }))
                      }
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Value of 1 point when redeemed at checkout (Default: ৳1 BDT).
                  </p>
                </div>

                {/* Min Redeem Limit */}
                <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                  <label className="block text-xs font-bold text-slate-900">
                    Minimum Points to Redeem
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={10}
                    value={settings.rewardMinRedeemPoints}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        rewardMinRedeemPoints: Math.max(0, Number(e.target.value) || 0),
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-500">
                    Customer must have at least this balance to apply discounts (Default: 50).
                  </p>
                </div>
              </div>

              {/* Live Cashback Simulator Preview */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🪙</span>
                    <h3 className="text-xs font-black text-amber-950 uppercase tracking-wider">
                      Live Storefront Simulator Preview
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-200/70 px-2 py-0.5 rounded-full">
                    Interactive
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-2xs space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-500">Customer Product Card Chip</div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-black text-amber-800 bg-amber-50 border border-amber-300 px-3 py-1 rounded-lg">
                      <span>🪙</span>
                      <span>+{Math.floor(1500 / (settings.rewardPointsEarnRate || 100))} pts Cashback</span>
                    </div>
                    <p className="text-[10px] text-slate-400">Displays on ৳1,500 product cards.</p>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-2xs space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-500">Checkout Redemption Widget</div>
                    <div className="text-xs font-bold text-slate-800">
                      Balance: 120 Points = <span className="text-amber-600 font-mono font-black">{formatBDT(120 * (settings.rewardPointValueBdt || 1))}</span>
                    </div>
                    <div className="text-[11px] text-emerald-700 font-bold">
                      ✓ Eligible for instant checkout deduction
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ZERO-RETURN FRAUD & COD SHIELD */}
      {activeTab === 'fraud' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            {/* Header & Toggle */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600 font-bold shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-slate-950">
                    Zero-Return Fraud & COD Protection Shield
                  </h2>
                  <p className="text-xs text-slate-500">
                    Real-time risk scoring, velocity checks, and advance courier fee enforcement to stop fake order losses.
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.fraudDetectionEnabled}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, fraudDetectionEnabled: e.target.checked }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {/* Policy Controls */}
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Max COD Amount */}
                <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                  <label className="block text-xs font-bold text-slate-900">
                    Max Safe COD Order Amount (BDT)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">৳</span>
                    <input
                      type="number"
                      min={1000}
                      step={500}
                      value={settings.fraudMaxCodAmount}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          fraudMaxCodAmount: Math.max(500, Number(e.target.value) || 4000),
                        }))
                      }
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Orders above this value flag for mandatory phone verification before dispatch.
                  </p>
                </div>

                {/* Advance Fee Requirement for High Risk */}
                <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-900">
                      Require Advance Courier Fee for High-Risk
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Prompts high-risk buyers to pay ৳60 / ৳120 courier charge via bKash/Nagad before dispatch.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.fraudHighRiskAdvanceFeeRequired}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        fraudHighRiskAdvanceFeeRequired: e.target.checked,
                      }))
                    }
                    className="rounded accent-rose-600 w-4 h-4 cursor-pointer"
                  />
                </div>
              </div>

              {/* Active Blacklist Manager */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-rose-600 font-bold">🚫</span>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Fraud Blacklist Manager ({(settings.blacklistedPhones || []).length} Numbers)
                    </h3>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="tel"
                    placeholder="Enter 11-digit phone (e.g. 01712345678)"
                    value={newBlacklistPhone}
                    onChange={(e) => setNewBlacklistPhone(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddBlacklist}
                    disabled={phoneActionLoading || !newBlacklistPhone.trim()}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shrink-0"
                  >
                    Add to Blacklist
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {(settings.blacklistedPhones || []).length === 0 ? (
                    <span className="text-xs text-slate-400 italic">No blacklisted phone numbers currently.</span>
                  ) : (
                    settings.blacklistedPhones.map((ph) => (
                      <span
                        key={ph}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-rose-200 text-rose-800 text-xs font-mono font-bold rounded-lg shadow-2xs"
                      >
                        <span>{ph}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveBlacklist(ph)}
                          title="Remove from Blacklist"
                          className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Active Whitelist Manager */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 font-bold">⭐</span>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Trusted VIP Whitelist ({(settings.whitelistedPhones || []).length} Numbers)
                    </h3>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="tel"
                    placeholder="Enter 11-digit VIP phone (e.g. 01812345678)"
                    value={newWhitelistPhone}
                    onChange={(e) => setNewWhitelistPhone(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddWhitelist}
                    disabled={phoneActionLoading || !newWhitelistPhone.trim()}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shrink-0"
                  >
                    Add to Whitelist
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {(settings.whitelistedPhones || []).length === 0 ? (
                    <span className="text-xs text-slate-400 italic">No whitelisted numbers currently.</span>
                  ) : (
                    settings.whitelistedPhones.map((ph) => (
                      <span
                        key={ph}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-emerald-200 text-emerald-800 text-xs font-mono font-bold rounded-lg shadow-2xs"
                      >
                        <span>{ph}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveWhitelist(ph)}
                          title="Remove from Whitelist"
                          className="text-slate-400 hover:text-emerald-600 p-0.5 rounded transition"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUPER ADMIN EDIT REVIEW MODAL */}
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

      {/* ADD REVIEW MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-lg font-black text-slate-950">Add Verified Customer Review</h2>
              <p className="text-xs text-slate-500">Post an authentic customer review with star ratings and photos.</p>
            </div>

            <form onSubmit={handleCreateReview} className="space-y-4">
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

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mahfuzur Rahman"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone (Optional)</label>
                <input
                  type="text"
                  placeholder="01712-XXXXXX"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Rating</label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setNewRating(st)}
                      className="p-1"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          st <= newRating ? 'fill-amber-400 text-amber-400' : 'fill-slate-100 text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-600 ml-2">{newRating} Stars</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Review Comment *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Review comments..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Photo URLs</label>
                  <button
                    type="button"
                    onClick={() => setNewImages((p) => [...p, ''])}
                    className="text-[11px] font-bold text-amber-600 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Photo</span>
                  </button>
                </div>
                {newImages.map((u, i) => (
                  <input
                    key={i}
                    type="url"
                    placeholder="https://..."
                    value={u}
                    onChange={(e) => {
                      const copy = [...newImages];
                      copy[i] = e.target.value;
                      setNewImages(copy);
                    }}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                ))}
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingReview}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black transition shadow-sm disabled:opacity-50"
                >
                  {creatingReview ? 'Posting...' : 'Post Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PHOTO PREVIEW MODAL */}
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
    </div>
  );
}
