'use client';

import React, { useState, useEffect } from 'react';
import {
  Flame,
  Plus,
  Calendar,
  Clock,
  Sparkles,
  TrendingUp,
  Package,
  Trash2,
  Edit2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Play,
  Pause,
  ExternalLink,
  Search,
  Percent,
  Check,
  X,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { formatBDT } from '@/lib/currency';

interface FlashSaleItem {
  id?: string;
  productId: string;
  flashPrice: number;
  originalPrice: number;
  allocatedStock: number;
  soldCount?: number;
  product?: {
    id: string;
    name: string;
    sku: string;
    sellingPrice: number;
    stockQuantity: number;
    images?: Array<{ url: string } | string>;
  };
}

interface FlashSaleCampaign {
  id: string;
  title: string;
  subtitle?: string | null;
  bannerUrl?: string | null;
  startDate: string;
  endDate: string;
  status: 'SCHEDULED' | 'ACTIVE' | 'ENDED' | 'CANCELLED';
  computedStatus?: 'SCHEDULED' | 'ACTIVE' | 'ENDED' | 'CANCELLED';
  isActive: boolean;
  totalAllocated?: number;
  totalSold?: number;
  totalRevenue?: number;
  items: FlashSaleItem[];
}

export default function AdminFlashSalePage() {
  const [campaigns, setCampaigns] = useState<FlashSaleCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Catalog products for campaign creation
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedItems, setSelectedItems] = useState<FlashSaleItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [saving, setSaving] = useState(false);

  // Fetch campaigns
  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/flash-sales');
      const data = await res.json();
      if (data.success && Array.isArray(data.campaigns)) {
        setCampaigns(data.campaigns);
      } else {
        setError(data.error || 'Failed to load campaigns');
      }
    } catch {
      setError('Network error loading campaigns');
    } finally {
      setLoading(false);
    }
  };

  // Fetch catalog products
  const fetchCatalog = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success && Array.isArray(data.products)) {
        setCatalogProducts(data.products);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchCampaigns();
    fetchCatalog();
  }, []);

  // Format local datetime for input (YYYY-MM-DDTHH:mm)
  const toLocalInputString = (isoString?: string) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().slice(0, 16);
  };

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingCampaignId(null);
    setTitle('Flash Sale Discounts');
    setSubtitle('Limited stock discounts on selected customer favourites');
    setBannerUrl('');
    const now = new Date();
    const threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    setStartDate(toLocalInputString(now.toISOString()));
    setEndDate(toLocalInputString(threeDays.toISOString()));
    setSelectedItems([]);
    setProductSearch('');
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (c: FlashSaleCampaign) => {
    setEditingCampaignId(c.id);
    setTitle(c.title);
    setSubtitle(c.subtitle || '');
    setBannerUrl(c.bannerUrl || '');
    setStartDate(toLocalInputString(c.startDate));
    setEndDate(toLocalInputString(c.endDate));
    setSelectedItems(
      (c.items || []).map((it) => ({
        ...it,
        originalPrice: it.originalPrice || it.product?.sellingPrice || 1000,
        flashPrice: it.flashPrice,
        allocatedStock: it.allocatedStock,
        soldCount: it.soldCount || 0,
      }))
    );
    setProductSearch('');
    setIsModalOpen(true);
  };

  // Toggle Campaign active/pause
  const handleToggleActive = async (c: FlashSaleCampaign) => {
    try {
      const newActive = !c.isActive;
      const res = await fetch(`/api/admin/flash-sales/${c.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newActive }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Campaign ${newActive ? 'activated' : 'paused'} successfully.`);
        fetchCampaigns();
      }
    } catch {
      setError('Failed to toggle campaign status');
    }
  };

  // Delete Campaign
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this Flash Sale campaign?')) return;
    try {
      const res = await fetch(`/api/admin/flash-sales/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Campaign deleted.');
        fetchCampaigns();
      }
    } catch {
      setError('Failed to delete campaign');
    }
  };

  // Product Selector: Add item to form
  const handleSelectProduct = (prod: any) => {
    if (selectedItems.some((i) => i.productId === prod.id)) return;
    const defaultFlashPrice = prod.salePrice || Math.round(prod.sellingPrice * 0.8);
    const defaultStock = Math.min(20, Math.max(1, prod.stockQuantity));

    setSelectedItems([
      ...selectedItems,
      {
        productId: prod.id,
        originalPrice: prod.sellingPrice,
        flashPrice: defaultFlashPrice,
        allocatedStock: defaultStock,
        product: prod,
      },
    ]);
  };

  // Product Selector: Remove item from form
  const handleRemoveItem = (productId: string) => {
    setSelectedItems(selectedItems.filter((i) => i.productId !== productId));
  };

  // Product Selector: Update Flash Price
  const handleUpdateItemPrice = (productId: string, val: number) => {
    setSelectedItems(
      selectedItems.map((i) => (i.productId === productId ? { ...i, flashPrice: val } : i))
    );
  };

  // Product Selector: Update Allocated Stock
  const handleUpdateItemStock = (productId: string, val: number) => {
    setSelectedItems(
      selectedItems.map((i) => (i.productId === productId ? { ...i, allocatedStock: val } : i))
    );
  };

  // Save campaign (create or update)
  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDate || !endDate) {
      alert('Please fill in title, start date, and end date.');
      return;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      alert('End date must be strictly after the start date.');
      return;
    }
    if (selectedItems.length === 0) {
      alert('Please add at least one product to the Flash Sale.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        title: title.trim(),
        subtitle: subtitle.trim() || undefined,
        bannerUrl: bannerUrl.trim() || undefined,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        items: selectedItems.map((it) => ({
          productId: it.productId,
          flashPrice: Number(it.flashPrice),
          originalPrice: Number(it.originalPrice),
          allocatedStock: Number(it.allocatedStock),
          soldCount: it.soldCount || 0,
        })),
      };

      const url = editingCampaignId
        ? `/api/admin/flash-sales/${editingCampaignId}`
        : '/api/admin/flash-sales';
      const method = editingCampaignId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        setSuccessMsg(
          editingCampaignId
            ? 'Flash Sale Campaign updated successfully!'
            : 'New Flash Sale Campaign created and scheduled!'
        );
        setIsModalOpen(false);
        fetchCampaigns();
      } else {
        setError(data.error || 'Failed to save campaign');
      }
    } catch {
      setError('Network error saving campaign');
    } finally {
      setSaving(false);
    }
  };

  // Aggregate KPI metrics
  const activeCount = campaigns.filter(
    (c) => (c.computedStatus || c.status) === 'ACTIVE' && c.isActive !== false
  ).length;
  const totalAllocatedAll = campaigns.reduce((s, c) => s + (c.totalAllocated || 0), 0);
  const totalSoldAll = campaigns.reduce((s, c) => s + (c.totalSold || 0), 0);
  const totalRevenueAll = campaigns.reduce((s, c) => s + (c.totalRevenue || 0), 0);

  // Filter products in modal selector
  const filteredCatalog = catalogProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-gradient-to-br from-red-500 to-amber-500 rounded-xl text-white shadow-sm">
              <Flame className="w-5 h-5 fill-white" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
              Flash Sale Management System
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Schedule high-conversion limited-time promotions, control allocated stock, and monitor live deals.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href="/flash-sale"
            target="_blank"
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
          >
            <span>Live Storefront Deals</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Create Campaign</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="p-1 hover:text-emerald-950">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-2xl flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="p-1 hover:text-rose-950">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Performance Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Active Campaigns</span>
            <Flame className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-950">{activeCount}</div>
          <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Real-time authoritative timer active</span>
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Total Units Allocated</span>
            <Package className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-950">{totalAllocatedAll}</div>
          <div className="text-[11px] text-slate-400 font-medium">Synced with inventory ledger</div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Units Sold Under Flash</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-950">{totalSoldAll}</div>
          <div className="text-[11px] text-amber-600 font-semibold">
            {totalAllocatedAll > 0 ? `${Math.round((totalSoldAll / totalAllocatedAll) * 100)}% Stock Claimed` : '0%'}
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Total Flash Revenue</span>
            <Sparkles className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-price font-black text-slate-950">
            {formatBDT(totalRevenueAll)}
          </div>
          <div className="text-[11px] text-slate-400 font-medium">Direct orders generated</div>
        </div>
      </div>

      {/* Campaign List Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
              All Flash Sale Campaigns
            </h3>
            <p className="text-xs text-slate-500">
              Manage campaign schedules, allocated stock counts, and live publication.
            </p>
          </div>
          <button
            onClick={fetchCampaigns}
            className="text-xs font-bold text-amber-600 hover:text-amber-700 transition"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading campaigns...</div>
        ) : campaigns.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl mx-auto flex items-center justify-center">
              <Flame className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-slate-800">No Flash Sale Campaigns Yet</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Create your first promotional flash sale campaign to offer exciting discounts and drive high conversions.
            </p>
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-slate-950 text-white rounded-xl text-xs font-bold hover:bg-black transition"
            >
              + Create Campaign Now
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Campaign & Subtitle</th>
                  <th className="py-3 px-4">Schedule (Start - End)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Products & Stock</th>
                  <th className="py-3 px-4">Revenue</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {campaigns.map((c) => {
                  const effectiveStatus = c.computedStatus || c.status;
                  const startStr = new Date(c.startDate).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                  });
                  const endStr = new Date(c.endDate).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                  });

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 font-medium">
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          <Flame className="w-4 h-4 text-red-500 shrink-0" />
                          <span>{c.title}</span>
                        </div>
                        {c.subtitle && (
                          <div className="text-[11px] text-slate-500 truncate max-w-xs">{c.subtitle}</div>
                        )}
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          ID: <span className="font-mono">{c.id}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 text-slate-700 font-semibold">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{startStr}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-500 text-[11px] mt-0.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Until {endStr}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {effectiveStatus === 'ACTIVE' && c.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Live Active</span>
                          </span>
                        ) : effectiveStatus === 'SCHEDULED' && c.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <Clock className="w-3 h-3 text-blue-600" />
                            <span>Scheduled</span>
                          </span>
                        ) : effectiveStatus === 'ENDED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            <CheckCircle className="w-3 h-3 text-slate-400" />
                            <span>Ended</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <Pause className="w-3 h-3 text-rose-600" />
                            <span>Paused</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {c.items?.length || 0} Products
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {c.totalSold || 0} / {c.totalAllocated || 0} units sold
                        </div>
                        {/* Mini progress bar */}
                        <div className="w-28 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                          <div
                            className="h-full bg-gradient-to-r from-red-500 to-amber-500 rounded-full"
                            style={{
                              width: `${Math.min(
                                100,
                                c.totalAllocated && c.totalAllocated > 0
                                  ? Math.round(((c.totalSold || 0) / c.totalAllocated) * 100)
                                  : 0
                              )}%`,
                            }}
                          />
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-price font-bold text-slate-900 text-sm">
                        {formatBDT(c.totalRevenue || 0)}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Toggle Active / Pause */}
                          <button
                            type="button"
                            onClick={() => handleToggleActive(c)}
                            title={c.isActive ? 'Pause Campaign' : 'Resume Campaign'}
                            className={`p-1.5 rounded-lg border transition ${
                              c.isActive
                                ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {c.isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(c)}
                            title="Edit Campaign"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDelete(c.id)}
                            title="Delete Campaign"
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Campaign Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm sm:text-base">
                  {editingCampaignId ? 'Edit Flash Sale Campaign' : 'Create Flash Sale Campaign'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveCampaign} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Campaign Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Flash Sale Discounts"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold focus:border-red-600 focus:ring-2 focus:ring-red-100 outline-none transition"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Subtitle / Catchphrase
                  </label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="e.g. Limited stock discounts on selected customer favourites"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium focus:border-red-600 focus:ring-2 focus:ring-red-100 outline-none transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Start Date & Time (Server Time) *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold outline-none focus:border-red-600 transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    End Date & Time (Expiration) *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold outline-none focus:border-red-600 transition"
                  />
                </div>
              </div>

              {/* Product Selector Section */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Select Flash Sale Products & Allocations ({selectedItems.length} selected)
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Choose products from catalog and set custom flash sale prices and stock limits.
                    </p>
                  </div>
                </div>

                {/* Search Bar for Catalog */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search catalog to add products (name, SKU)..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium outline-none focus:bg-white focus:border-red-600 transition"
                  />
                </div>

                {/* Quick Add Grid */}
                {productSearch.trim().length > 0 && (
                  <div className="max-h-44 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                    {filteredCatalog.slice(0, 8).map((prod) => {
                      const isAdded = selectedItems.some((i) => i.productId === prod.id);
                      return (
                        <div
                          key={prod.id}
                          className="p-2.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 shrink-0 overflow-hidden">
                              <img
                                src={prod.images?.[0]?.url || prod.images?.[0] || '/placeholder.png'}
                                alt={prod.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 truncate">{prod.name}</div>
                              <div className="text-[10px] text-slate-400">
                                SKU: {prod.sku} • Stock: {prod.stockQuantity} • Price: {formatBDT(prod.sellingPrice)}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={isAdded}
                            onClick={() => handleSelectProduct(prod)}
                            className={`px-3 py-1 rounded-lg font-bold text-xs transition shrink-0 ${
                              isAdded
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-red-600 hover:bg-red-700 text-white'
                            }`}
                          >
                            {isAdded ? 'Added' : '+ Add Deal'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Selected Products Configuration Table */}
                {selectedItems.length === 0 ? (
                  <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center text-xs text-slate-400">
                    No products added yet. Use the search bar above to select products from your catalog.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                    <div className="p-3 bg-slate-50 grid grid-cols-12 gap-2 text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
                      <div className="col-span-5">Product</div>
                      <div className="col-span-2">Original</div>
                      <div className="col-span-2">Flash Price (৳)</div>
                      <div className="col-span-2">Flash Stock</div>
                      <div className="col-span-1 text-right">Del</div>
                    </div>

                    {selectedItems.map((item) => {
                      const discount =
                        item.originalPrice > item.flashPrice
                          ? Math.round(((item.originalPrice - item.flashPrice) / item.originalPrice) * 100)
                          : 0;

                      return (
                        <div
                          key={item.productId}
                          className="p-3 grid grid-cols-12 gap-2 items-center text-xs hover:bg-slate-50/60 transition"
                        >
                          <div className="col-span-5 min-w-0 pr-2">
                            <div className="font-bold text-slate-900 truncate">
                              {item.product?.name || `Product ${item.productId}`}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Avail Stock: {item.product?.stockQuantity ?? 'N/A'}
                            </div>
                          </div>

                          <div className="col-span-2 font-price text-slate-500 line-through">
                            {formatBDT(item.originalPrice)}
                          </div>

                          <div className="col-span-2">
                            <input
                              type="number"
                              min="1"
                              value={item.flashPrice}
                              onChange={(e) => handleUpdateItemPrice(item.productId, Number(e.target.value))}
                              className="w-full px-2 py-1 rounded-lg border border-slate-300 font-bold text-slate-900 text-xs focus:border-red-600 outline-none"
                            />
                            {discount > 0 && (
                              <span className="text-[10px] font-bold text-red-600 block mt-0.5">
                                -{discount}% OFF
                              </span>
                            )}
                          </div>

                          <div className="col-span-2">
                            <input
                              type="number"
                              min="1"
                              max={item.product?.stockQuantity || 999}
                              value={item.allocatedStock}
                              onChange={(e) => handleUpdateItemStock(item.productId, Number(e.target.value))}
                              className="w-full px-2 py-1 rounded-lg border border-slate-300 font-bold text-slate-900 text-xs focus:border-red-600 outline-none"
                            />
                            {item.product && item.allocatedStock > item.product.stockQuantity && (
                              <span className="text-[9.5px] font-bold text-amber-600 block mt-0.5">
                                Exceeds stock!
                              </span>
                            )}
                          </div>

                          <div className="col-span-1 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.productId)}
                              className="p-1 text-slate-400 hover:text-red-600 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Modal Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white text-xs font-bold shadow-md transition disabled:opacity-50"
                >
                  {saving
                    ? 'Saving Campaign...'
                    : editingCampaignId
                    ? 'Save Changes'
                    : 'Publish & Schedule Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
