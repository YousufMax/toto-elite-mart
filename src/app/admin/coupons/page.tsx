'use client';

import React, { useState, useEffect } from 'react';
import {
  Ticket,
  Plus,
  Search,
  Loader2,
  Copy,
  Check,
  Edit2,
  Trash2,
  CopyPlus,
  AlertCircle,
  TrendingUp,
  Clock,
  Sparkles,
  X,
  CheckCircle2,
  XCircle,
  Zap,
  Tag,
  Calendar,
  Layers,
} from 'lucide-react';

interface Coupon {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED_BDT';
  discountValue: number;
  minOrderValue: number;
  maxDiscountValue: number | null;
  usageLimit: number | null;
  timesUsed: number;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  computedStatus: 'ACTIVE' | 'SCHEDULED' | 'EXPIRED' | 'EXHAUSTED' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

interface CouponStats {
  total: number;
  active: number;
  scheduled: number;
  expired: number;
  inactive: number;
  totalRedemptions: number;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [stats, setStats] = useState<CouponStats>({
    total: 0,
    active: 0,
    scheduled: 0,
    expired: 0,
    inactive: 0,
    totalRedemptions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  // Form Fields
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED_BDT',
    discountValue: '10',
    minOrderValue: '1000',
    maxDiscountValue: '300',
    usageLimit: '100',
    startDate: '',
    endDate: '',
    isActive: true,
  });

  // Action status message
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (statusFilter !== 'ALL') params.set('status', statusFilter);

      const res = await fetch(`/api/coupons?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setCoupons(data.coupons || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCoupons();
    }, 200);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleGenerateCode = () => {
    const prefixes = ['ELITE', 'TOTO', 'SPECIAL', 'MEGA', 'SAVE', 'VIP'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const val = formData.discountType === 'PERCENTAGE' ? formData.discountValue : '100';
    const rand = Math.floor(10 + Math.random() * 90);
    setFormData((prev) => ({ ...prev, code: `${prefix}${val}-${rand}`.toUpperCase() }));
  };

  const openCreateModal = () => {
    setEditingCoupon(null);
    setFormData({
      code: '',
      discountType: 'PERCENTAGE',
      discountValue: '10',
      minOrderValue: '1000',
      maxDiscountValue: '300',
      usageLimit: '100',
      startDate: '',
      endDate: '',
      isActive: true,
    });
    setModalError('');
    setShowModal(true);
  };

  const openEditModal = (coup: Coupon) => {
    setEditingCoupon(coup);
    setFormData({
      code: coup.code,
      discountType: coup.discountType,
      discountValue: coup.discountValue.toString(),
      minOrderValue: coup.minOrderValue ? coup.minOrderValue.toString() : '0',
      maxDiscountValue: coup.maxDiscountValue ? coup.maxDiscountValue.toString() : '',
      usageLimit: coup.usageLimit ? coup.usageLimit.toString() : '',
      startDate: coup.startDate ? coup.startDate.slice(0, 16) : '',
      endDate: coup.endDate ? coup.endDate.slice(0, 16) : '',
      isActive: coup.isActive,
    });
    setModalError('');
    setShowModal(true);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      setModalError('Please enter a coupon code.');
      return;
    }
    const val = Number(formData.discountValue);
    if (isNaN(val) || val <= 0) {
      setModalError('Discount value must be greater than 0.');
      return;
    }

    setModalSubmitting(true);
    setModalError('');

    try {
      const couponId = editingCoupon ? (editingCoupon.id || editingCoupon.code) : '';
      const url = editingCoupon ? `/api/coupons/${couponId}` : '/api/coupons';
      const method = editingCoupon ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: formData.code.trim().toUpperCase(),
          discountType: formData.discountType,
          discountValue: val,
          minOrderValue: Number(formData.minOrderValue) || 0,
          maxDiscountValue:
            formData.discountType === 'PERCENTAGE' && formData.maxDiscountValue
              ? Number(formData.maxDiscountValue)
              : null,
          usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
          startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
          endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
          isActive: formData.isActive,
        }),
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        setModalError(resData.error || 'Failed to save coupon');
        setModalSubmitting(false);
        return;
      }

      setShowModal(false);
      showToast('success', resData.message || 'Coupon saved successfully!');
      fetchCoupons();
    } catch {
      setModalError('Network error saving coupon');
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleToggleActive = async (coup: Coupon) => {
    const couponId = coup.id || coup.code;
    try {
      const res = await fetch(`/api/coupons/${couponId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !coup.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', `Coupon "${coup.code}" is now ${!coup.isActive ? 'ACTIVE' : 'INACTIVE'}`);
        fetchCoupons();
      } else {
        showToast('error', data.error || 'Failed to update status');
      }
    } catch {
      showToast('error', 'Network error updating coupon status');
    }
  };

  const handleDelete = async (coup: Coupon) => {
    const couponId = coup.id || coup.code;
    if (!window.confirm(`Are you sure you want to permanently delete coupon "${coup.code}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/coupons/${couponId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('success', `Coupon "${coup.code}" was deleted.`);
        fetchCoupons();
      } else {
        showToast('error', data.error || 'Failed to delete coupon');
      }
    } catch {
      showToast('error', 'Network error deleting coupon');
    }
  };

  const handleDuplicate = (coup: Coupon) => {
    setEditingCoupon(null);
    setFormData({
      code: `${coup.code}-COPY`,
      discountType: coup.discountType,
      discountValue: coup.discountValue.toString(),
      minOrderValue: coup.minOrderValue.toString(),
      maxDiscountValue: coup.maxDiscountValue ? coup.maxDiscountValue.toString() : '',
      usageLimit: coup.usageLimit ? coup.usageLimit.toString() : '',
      startDate: '',
      endDate: '',
      isActive: true,
    });
    setModalError('');
    setShowModal(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border text-xs sm:text-sm font-bold transition animate-in fade-in slide-in-from-bottom-4 ${
            notification.type === 'success'
              ? 'bg-emerald-950 text-emerald-100 border-emerald-800'
              : 'bg-rose-950 text-rose-100 border-rose-800'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <XCircle className="w-5 h-5 text-rose-400" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-950 tracking-tight flex items-center gap-2">
              Coupon & Promotion Engine
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 shadow-xs">
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              Promotion Control
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage promotional discount vouchers, redemption limits, order thresholds, and scheduled marketing deals.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md shadow-amber-500/20 transition active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Create New Coupon</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Active Promos */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Coupons</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-950">{stats.active}</span>
            <span className="text-xs text-emerald-600 font-bold">Live Now</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Available to customers</div>
        </div>

        {/* Total Redemptions */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Redemptions</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-600">{stats.totalRedemptions}</span>
            <span className="text-xs text-slate-500 font-bold">Orders</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Redeemed across campaigns</div>
        </div>

        {/* Scheduled Promos */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Scheduled Deals</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-blue-600">{stats.scheduled}</span>
            <span className="text-xs text-slate-500 font-bold">Upcoming</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Future start dates</div>
        </div>

        {/* Expired / Inactive */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Closed / Inactive</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 border border-slate-200 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {stats.expired + stats.inactive}
            </span>
            <span className="text-xs text-slate-500 font-bold">Paused</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Expired or limit reached</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search by coupon code (e.g., WELCOME100)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {['ALL', 'ACTIVE', 'SCHEDULED', 'EXPIRED', 'INACTIVE'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold shrink-0 transition ${
                statusFilter === tab
                  ? 'bg-slate-950 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab === 'ALL' ? `All (${stats.total})` : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
            <span className="text-xs font-semibold text-slate-600">Loading coupons...</span>
          </div>
        ) : coupons.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-3 border border-amber-200/60">
              <Ticket className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No coupons found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {search || statusFilter !== 'ALL'
                ? 'Try adjusting your search query or filter settings.'
                : 'Get started by creating your first promotional coupon for your customers.'}
            </p>
            {!search && statusFilter === 'ALL' && (
              <button
                onClick={openCreateModal}
                className="mt-4 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-sm transition"
              >
                Create Coupon Now
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 uppercase tracking-wider font-bold text-[10.5px]">
                  <th className="py-3.5 px-5">Coupon Code</th>
                  <th className="py-3.5 px-4">Discount Value</th>
                  <th className="py-3.5 px-4">Thresholds</th>
                  <th className="py-3.5 px-4">Redemptions</th>
                  <th className="py-3.5 px-4">Validity</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {coupons.map((coup) => {
                  const isPercent = coup.discountType === 'PERCENTAGE';
                  const usagePercent = coup.usageLimit
                    ? Math.min(100, Math.round((coup.timesUsed / coup.usageLimit) * 100))
                    : null;

                  return (
                    <tr
                      key={coup.id || coup.code}
                      className="hover:bg-slate-50/70 transition group"
                    >
                      {/* Code */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-xs text-slate-900 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200/80 tracking-wider shadow-2xs">
                            {coup.code}
                          </span>
                          <button
                            onClick={() => handleCopyCode(coup.code)}
                            title="Copy code to clipboard"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition"
                          >
                            {copiedCode === coup.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Discount Value */}
                      <td className="py-4 px-4">
                        <div className="font-black text-slate-950 text-sm">
                          {isPercent ? `${coup.discountValue}% OFF` : `৳${coup.discountValue.toLocaleString()} OFF`}
                        </div>
                        {isPercent && coup.maxDiscountValue && (
                          <span className="text-[11px] text-amber-600 font-semibold block">
                            Max discount: ৳{coup.maxDiscountValue.toLocaleString()}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          {isPercent ? 'Percentage off' : 'Fixed deduction'}
                        </span>
                      </td>

                      {/* Thresholds */}
                      <td className="py-4 px-4 space-y-0.5">
                        <div className="text-slate-800 font-bold">
                          {coup.minOrderValue > 0 ? (
                            <span>Min Order: ৳{coup.minOrderValue.toLocaleString()}</span>
                          ) : (
                            <span className="text-slate-400 font-normal">No minimum spend</span>
                          )}
                        </div>
                      </td>

                      {/* Redemptions Progress */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-slate-950">{coup.timesUsed}</span>
                          <span className="text-slate-400 text-xs">
                            / {coup.usageLimit ? coup.usageLimit : '∞'} used
                          </span>
                        </div>
                        {coup.usageLimit && (
                          <div className="w-28 h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden border border-slate-200/60">
                            <div
                              className={`h-full rounded-full transition-all ${
                                (usagePercent || 0) >= 90
                                  ? 'bg-rose-500'
                                  : (usagePercent || 0) >= 50
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${usagePercent}%` }}
                            />
                          </div>
                        )}
                      </td>

                      {/* Validity Dates */}
                      <td className="py-4 px-4 text-[11px] text-slate-500 space-y-0.5">
                        {coup.startDate && (
                          <div>
                            <span className="text-slate-400">From: </span>
                            <span className="font-semibold text-slate-700">{new Date(coup.startDate).toLocaleDateString('en-GB')}</span>
                          </div>
                        )}
                        {coup.endDate ? (
                          <div>
                            <span className="text-slate-400">Until: </span>
                            <span
                              className={`font-semibold ${
                                new Date(coup.endDate) < new Date() ? 'text-rose-600' : 'text-slate-700'
                              }`}
                            >
                              {new Date(coup.endDate).toLocaleDateString('en-GB')}
                            </span>
                          </div>
                        ) : (
                          <div className="text-slate-400">No expiry date</div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(coup)}
                            title={`Click to ${coup.isActive ? 'deactivate' : 'activate'}`}
                            className={`w-10 h-5 rounded-full transition p-0.5 flex items-center shadow-inner ${
                              coup.isActive ? 'bg-emerald-500 justify-end' : 'bg-slate-300 justify-start'
                            }`}
                          >
                            <span className="w-4 h-4 rounded-full bg-white shadow-md block transition-transform" />
                          </button>
                          <span
                            className={`text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                              coup.computedStatus === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : coup.computedStatus === 'SCHEDULED'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : coup.computedStatus === 'EXPIRED' || coup.computedStatus === 'EXHAUSTED'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {coup.computedStatus}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleDuplicate(coup)}
                            title="Duplicate Coupon"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition"
                          >
                            <CopyPlus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(coup)}
                            title="Edit Coupon Rules"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(coup)}
                            title="Delete Coupon"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-950 flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-amber-500" />
                  <span>
                    {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Create New Promotional Coupon'}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure discount value, minimum cart thresholds, and usage limits.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{modalError}</span>
              </div>
            )}

            {/* Live Customer Preview Card */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-4">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block mb-2">
                ⚡ Customer Storefront Card Preview:
              </span>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF5E00] to-[#E64A19] text-white flex items-center justify-center font-black text-base shadow-sm">
                    {formData.discountType === 'PERCENTAGE' ? '%' : '৳'}
                  </div>
                  <div>
                    <div className="font-mono font-black text-slate-950 text-base tracking-wider">
                      {formData.code.trim().toUpperCase() || 'COUPON_CODE'}
                    </div>
                    <div className="text-xs text-amber-600 font-bold">
                      {formData.discountType === 'PERCENTAGE'
                        ? `${formData.discountValue || '0'}% OFF`
                        : `৳${formData.discountValue || '0'} FLAT OFF`}
                      {formData.discountType === 'PERCENTAGE' && formData.maxDiscountValue && (
                        <span className="text-slate-500 font-normal"> (Up to ৳{formData.maxDiscountValue})</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-[11px] text-slate-500 text-left sm:text-right font-medium">
                  {Number(formData.minOrderValue) > 0 ? (
                    <div>Min. spend: ৳{Number(formData.minOrderValue).toLocaleString()}</div>
                  ) : (
                    <div>No min. order requirement</div>
                  )}
                  {formData.endDate && (
                    <div className="text-slate-400">
                      Ends: {new Date(formData.endDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveCoupon} className="space-y-4">
              {/* Code with Generator */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Coupon Code *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. WELCOME100, EID2026, SAVE15"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm font-bold text-slate-900 tracking-wider placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateCode}
                    className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap border border-slate-200"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Auto Generate</span>
                  </button>
                </div>
              </div>

              {/* Discount Type Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Discount Type *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, discountType: 'PERCENTAGE' })}
                    className={`p-3 rounded-xl border text-left transition flex items-center gap-3 ${
                      formData.discountType === 'PERCENTAGE'
                        ? 'bg-amber-50 border-amber-500 text-slate-900 ring-1 ring-amber-500'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                      %
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Percentage Off</div>
                      <div className="text-[10px] text-slate-500">e.g., 10%, 15%, 20% discount</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, discountType: 'FIXED_BDT' })}
                    className={`p-3 rounded-xl border text-left transition flex items-center gap-3 ${
                      formData.discountType === 'FIXED_BDT'
                        ? 'bg-amber-50 border-amber-500 text-slate-900 ring-1 ring-amber-500'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                      ৳
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Fixed Amount (BDT)</div>
                      <div className="text-[10px] text-slate-500">e.g., Flat ৳100, ৳250, ৳500 off</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Values row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {formData.discountType === 'PERCENTAGE' ? 'Discount Percentage (%) *' : 'Discount Amount (৳ BDT) *'}
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={formData.discountType === 'PERCENTAGE' ? 100 : 100000}
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {formData.discountType === 'PERCENTAGE' ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Max Discount Cap (৳ BDT)
                      <span className="text-[10px] text-slate-400 font-normal ml-1">(Optional cap)</span>
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 500"
                      value={formData.maxDiscountValue}
                      onChange={(e) => setFormData({ ...formData, maxDiscountValue: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Usage Limit (Total Redemptions)
                      <span className="text-[10px] text-slate-400 font-normal ml-1">(Optional)</span>
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 100 uses"
                      value={formData.usageLimit}
                      onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                )}
              </div>

              {/* Thresholds & Limit row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Minimum Order Subtotal (৳ BDT)
                  </label>
                  <input
                    type="number"
                    placeholder="0 for no minimum"
                    value={formData.minOrderValue}
                    onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {formData.discountType === 'PERCENTAGE' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Usage Limit (Total Redemptions)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 500 (blank for unlimited)"
                      value={formData.usageLimit}
                      onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                )}
              </div>

              {/* Date Validity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Start Date & Time (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    End / Expiry Date & Time (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-500 border-slate-300 focus:ring-amber-500"
                />
                <label htmlFor="isActiveToggle" className="text-xs font-bold text-slate-800 cursor-pointer select-none">
                  Enable Coupon Immediately (Active for shoppers)
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md shadow-amber-500/20 transition flex items-center gap-2"
                >
                  {modalSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingCoupon ? 'Update Coupon' : 'Save & Publish Coupon'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
