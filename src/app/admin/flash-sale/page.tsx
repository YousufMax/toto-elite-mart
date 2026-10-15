'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  ChevronDown,
  ChevronUp,
  Copy,
  RefreshCw,
  Filter,
  DollarSign,
  Tag,
  ArrowUpRight,
  ShieldCheck,
  AlertTriangle,
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
    purchaseCost?: number;
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

  // Catalog products and categories
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  // Filter & Search states
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SCHEDULED' | 'PAUSED' | 'ENDED'>('ALL');
  const [campaignSearch, setCampaignSearch] = useState('');

  // Expanded rows accordion (holds IDs of expanded campaigns)
  const [expandedCampaigns, setExpandedCampaigns] = useState<Record<string, boolean>>({});

  // Full Campaign Modal (Create / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedItems, setSelectedItems] = useState<FlashSaleItem[]>([]);
  const [saving, setSaving] = useState(false);

  // Quick "Add Product to Existing Campaign" Modal
  const [quickAddCampaignId, setQuickAddCampaignId] = useState<string | null>(null);
  const [quickAddSearch, setQuickAddSearch] = useState('');
  const [quickAddSelectedCategory, setQuickAddSelectedCategory] = useState<string>('ALL');
  const [quickAddProduct, setQuickAddProduct] = useState<any | null>(null);
  const [quickAddDiscountPercent, setQuickAddDiscountPercent] = useState<number>(20);
  const [quickAddFlashPrice, setQuickAddFlashPrice] = useState<number>(0);
  const [quickAddAllocatedStock, setQuickAddAllocatedStock] = useState<number>(10);

  // Inline Item Edit Modal / State
  const [inlineEditingItem, setInlineEditingItem] = useState<{
    campaignId: string;
    item: FlashSaleItem;
    flashPrice: number;
    allocatedStock: number;
  } | null>(null);

  // Auto-dismiss feedback message
  useEffect(() => {
    if (!successMsg && !error) return;
    const t = setTimeout(() => {
      setSuccessMsg('');
      setError('');
    }, 4500);
    return () => clearTimeout(t);
  }, [successMsg, error]);

  // Fetch campaigns
  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/flash-sales');
      const data = await res.json();
      if (data.success && Array.isArray(data.campaigns)) {
        setCampaigns(data.campaigns);
        // Automatically expand active campaign for convenience
        const active = data.campaigns.find((c: any) => c.status === 'ACTIVE' || c.computedStatus === 'ACTIVE');
        if (active) {
          setExpandedCampaigns((prev) => ({ ...prev, [active.id]: true }));
        }
      } else {
        setError(data.error || 'Failed to load campaigns');
      }
    } catch {
      setError('Network error loading campaigns');
    } finally {
      setLoading(false);
    }
  };

  // Fetch catalog products & categories
  const fetchCatalogAndCategories = async () => {
    try {
      const [pRes, cRes] = await Promise.all([
        fetch('/api/products?limit=100'),
        fetch('/api/categories'),
      ]);
      const pData = await pRes.json();
      const cData = await cRes.json();
      if (pData.success && Array.isArray(pData.products)) {
        setCatalogProducts(pData.products);
      }
      if (cData.success && Array.isArray(cData.categories)) {
        setCategories(cData.categories);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchCampaigns();
    fetchCatalogAndCategories();
  }, []);

  // Format local datetime for input (YYYY-MM-DDTHH:mm)
  const toLocalInputString = (isoString?: string) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().slice(0, 16);
  };

  // KPI calculations
  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter((c) => (c.computedStatus || c.status) === 'ACTIVE' && c.isActive);
  const totalAllocatedAll = campaigns.reduce((sum, c) => sum + (c.totalAllocated || 0), 0);
  const totalSoldAll = campaigns.reduce((sum, c) => sum + (c.totalSold || 0), 0);
  const totalRevenueAll = campaigns.reduce((sum, c) => sum + (c.totalRevenue || 0), 0);

  // Toggle row expansion
  const toggleExpand = (id: string) => {
    setExpandedCampaigns((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filtered campaigns
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      const effectiveStatus = c.computedStatus || c.status;
      const isPaused = !c.isActive;

      if (statusFilter === 'ACTIVE' && (effectiveStatus !== 'ACTIVE' || isPaused)) return false;
      if (statusFilter === 'SCHEDULED' && (effectiveStatus !== 'SCHEDULED' || isPaused)) return false;
      if (statusFilter === 'PAUSED' && !isPaused) return false;
      if (statusFilter === 'ENDED' && effectiveStatus !== 'ENDED') return false;

      if (campaignSearch.trim()) {
        const q = campaignSearch.toLowerCase();
        const matchesTitle = c.title?.toLowerCase().includes(q) || c.subtitle?.toLowerCase().includes(q);
        const matchesProduct = c.items?.some((i) => i.product?.name?.toLowerCase().includes(q) || i.product?.sku?.toLowerCase().includes(q));
        if (!matchesTitle && !matchesProduct) return false;
      }

      return true;
    });
  }, [campaigns, statusFilter, campaignSearch]);

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
      (c.items || []).map((i) => ({
        id: i.id,
        productId: i.productId,
        flashPrice: i.flashPrice,
        originalPrice: i.originalPrice,
        allocatedStock: i.allocatedStock,
        soldCount: i.soldCount || 0,
        product: i.product || catalogProducts.find((p) => p.id === i.productId),
      }))
    );
    setIsModalOpen(true);
  };

  // Duplicate campaign
  const handleDuplicateCampaign = async (c: FlashSaleCampaign) => {
    try {
      const now = new Date();
      const threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      const res = await fetch('/api/admin/flash-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${c.title} (Copy)`,
          subtitle: c.subtitle,
          bannerUrl: c.bannerUrl,
          startDate: now.toISOString(),
          endDate: threeDays.toISOString(),
          status: 'SCHEDULED',
          isActive: true,
          items: (c.items || []).map((i) => ({
            productId: i.productId,
            flashPrice: i.flashPrice,
            originalPrice: i.originalPrice,
            allocatedStock: i.allocatedStock,
          })),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Campaign cloned successfully as "${data.campaign.title}"`);
        fetchCampaigns();
      } else {
        setError(data.error || 'Failed to duplicate campaign');
      }
    } catch {
      setError('Network error duplicating campaign');
    }
  };

  // Quick Extend Campaign Expiration
  const handleExtendDuration = async (campaignId: string, hours: number) => {
    const target = campaigns.find((c) => c.id === campaignId);
    if (!target) return;

    try {
      const currentEnd = new Date(target.endDate);
      const baseTime = currentEnd.getTime() > Date.now() ? currentEnd.getTime() : Date.now();
      const newEnd = new Date(baseTime + hours * 3600 * 1000).toISOString();

      const res = await fetch(`/api/admin/flash-sales/${campaignId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endDate: newEnd, status: 'ACTIVE', isActive: true }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Campaign extended by +${hours >= 24 ? `${hours / 24} day(s)` : `${hours} hour(s)`}!`);
        fetchCampaigns();
      } else {
        setError(data.error || 'Failed to extend campaign');
      }
    } catch {
      setError('Network error extending campaign');
    }
  };

  // Toggle Active / Pause on campaign
  const handleToggleActive = async (campaignId: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/flash-sales/${campaignId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(currentActive ? 'Campaign paused' : 'Campaign activated and published!');
        fetchCampaigns();
      } else {
        setError(data.error || 'Failed to update campaign state');
      }
    } catch {
      setError('Network error toggling campaign');
    }
  };

  // Delete Campaign
  const handleDeleteCampaign = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to permanently delete campaign "${title}"?`)) return;

    try {
      const res = await fetch(`/api/admin/flash-sales/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Campaign deleted successfully');
        fetchCampaigns();
      } else {
        setError(data.error || 'Failed to delete campaign');
      }
    } catch {
      setError('Network error deleting campaign');
    }
  };

  // Remove a product from a campaign directly from expanded accordion
  const handleRemoveProductFromCampaign = async (campaignId: string, productId: string) => {
    const campaign = campaigns.find((c) => c.id === campaignId);
    if (!campaign) return;
    if (!confirm('Remove this product from the flash sale?')) return;

    try {
      const updatedItems = campaign.items
        .filter((i) => i.productId !== productId)
        .map((i) => ({
          productId: i.productId,
          flashPrice: i.flashPrice,
          originalPrice: i.originalPrice,
          allocatedStock: i.allocatedStock,
          soldCount: i.soldCount || 0,
        }));

      const res = await fetch(`/api/admin/flash-sales/${campaignId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: updatedItems }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Product removed from flash sale campaign');
        fetchCampaigns();
      } else {
        setError(data.error || 'Failed to remove product');
      }
    } catch {
      setError('Network error updating campaign items');
    }
  };

  // Save Inline Edit for a Flash Item
  const handleSaveInlineItem = async () => {
    if (!inlineEditingItem) return;
    const { campaignId, item, flashPrice, allocatedStock } = inlineEditingItem;
    const campaign = campaigns.find((c) => c.id === campaignId);
    if (!campaign) return;

    try {
      const updatedItems = campaign.items.map((i) => {
        if (i.productId === item.productId) {
          return {
            productId: i.productId,
            flashPrice: Number(flashPrice),
            originalPrice: i.originalPrice,
            allocatedStock: Number(allocatedStock),
            soldCount: i.soldCount || 0,
          };
        }
        return {
          productId: i.productId,
          flashPrice: i.flashPrice,
          originalPrice: i.originalPrice,
          allocatedStock: i.allocatedStock,
          soldCount: i.soldCount || 0,
        };
      });

      const res = await fetch(`/api/admin/flash-sales/${campaignId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: updatedItems }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Product flash price and allocated stock updated!');
        setInlineEditingItem(null);
        fetchCampaigns();
      } else {
        setError(data.error || 'Failed to update item deal');
      }
    } catch {
      setError('Network error updating deal');
    }
  };

  // Open "Quick Add Product" Modal for a specific campaign
  const handleOpenQuickAdd = (campaignId: string) => {
    setQuickAddCampaignId(campaignId);
    setQuickAddSearch('');
    setQuickAddProduct(null);
    setQuickAddDiscountPercent(25);
    setQuickAddFlashPrice(0);
    setQuickAddAllocatedStock(10);
  };

  // When a catalog product is chosen in Quick Add
  const handleSelectQuickAddProduct = (prod: any) => {
    setQuickAddProduct(prod);
    const original = Number(prod.sellingPrice) || 0;
    const computedFlash = Math.round(original * (1 - quickAddDiscountPercent / 100));
    setQuickAddFlashPrice(computedFlash);
    setQuickAddAllocatedStock(Math.min(10, prod.stockQuantity || 10));
  };

  // When discount % changes in Quick Add
  const handleQuickAddDiscountChange = (pct: number) => {
    setQuickAddDiscountPercent(pct);
    if (quickAddProduct) {
      const original = Number(quickAddProduct.sellingPrice) || 0;
      setQuickAddFlashPrice(Math.round(original * (1 - pct / 100)));
    }
  };

  // When Flash Price changes in Quick Add
  const handleQuickAddPriceChange = (val: number) => {
    setQuickAddFlashPrice(val);
    if (quickAddProduct && Number(quickAddProduct.sellingPrice) > 0) {
      const original = Number(quickAddProduct.sellingPrice);
      const computedPct = Math.round(((original - val) / original) * 100);
      setQuickAddDiscountPercent(Math.max(1, computedPct));
    }
  };

  // Submit Quick Add Product into existing campaign
  const handleSubmitQuickAdd = async () => {
    if (!quickAddCampaignId || !quickAddProduct) return;
    const campaign = campaigns.find((c) => c.id === quickAddCampaignId);
    if (!campaign) return;

    if (quickAddFlashPrice <= 0) {
      setError('Please set a valid Flash Price greater than 0');
      return;
    }
    if (quickAddAllocatedStock <= 0) {
      setError('Please allocate at least 1 unit of stock');
      return;
    }

    try {
      const existingWithout = campaign.items.filter((i) => i.productId !== quickAddProduct.id);
      const newItems = [
        ...existingWithout.map((i) => ({
          productId: i.productId,
          flashPrice: i.flashPrice,
          originalPrice: i.originalPrice,
          allocatedStock: i.allocatedStock,
          soldCount: i.soldCount || 0,
        })),
        {
          productId: quickAddProduct.id,
          flashPrice: Number(quickAddFlashPrice),
          originalPrice: Number(quickAddProduct.sellingPrice),
          allocatedStock: Number(quickAddAllocatedStock),
          soldCount: 0,
        },
      ];

      const res = await fetch(`/api/admin/flash-sales/${quickAddCampaignId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: newItems }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`"${quickAddProduct.name}" added to flash sale campaign!`);
        setQuickAddCampaignId(null);
        setQuickAddProduct(null);
        fetchCampaigns();
      } else {
        setError(data.error || 'Failed to add product');
      }
    } catch {
      setError('Network error adding product to campaign');
    }
  };

  // Submit full campaign modal (Create / Edit)
  const handleSubmitCampaignModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Campaign title is required');
      return;
    }
    if (!startDate || !endDate) {
      setError('Start date and expiration date are required');
      return;
    }
    if (new Date(startDate) >= new Date(endDate)) {
      setError('Expiration date must be after start date');
      return;
    }
    if (selectedItems.length === 0) {
      setError('Please add at least 1 product deal to the campaign');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        title: title.trim(),
        subtitle: subtitle.trim() || undefined,
        bannerUrl: bannerUrl.trim() || undefined,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        isActive: true,
        items: selectedItems.map((i) => ({
          productId: i.productId,
          flashPrice: Number(i.flashPrice),
          originalPrice: Number(i.originalPrice),
          allocatedStock: Number(i.allocatedStock) || 1,
          soldCount: i.soldCount || 0,
        })),
      };

      let res: Response;
      if (editingCampaignId) {
        res = await fetch(`/api/admin/flash-sales/${editingCampaignId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/admin/flash-sales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(editingCampaignId ? 'Campaign updated successfully!' : 'Campaign created and scheduled!');
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

  // Quick Catalog search in Create/Edit Modal
  const [modalCatalogSearch, setModalCatalogSearch] = useState('');
  const filteredModalCatalog = useMemo(() => {
    if (!modalCatalogSearch.trim()) return [];
    const q = modalCatalogSearch.toLowerCase();
    return catalogProducts.filter(
      (p) => p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q)
    );
  }, [catalogProducts, modalCatalogSearch]);

  const handleAddModalProduct = (prod: any) => {
    if (selectedItems.some((i) => i.productId === prod.id)) return;
    const original = Number(prod.sellingPrice) || 0;
    const defaultFlash = Math.round(original * 0.75); // 25% off default
    setSelectedItems((prev) => [
      ...prev,
      {
        productId: prod.id,
        flashPrice: defaultFlash,
        originalPrice: original,
        allocatedStock: Math.min(10, prod.stockQuantity || 10),
        soldCount: 0,
        product: prod,
      },
    ]);
  };

  // Quick catalog search in Quick-Add Drawer
  const filteredQuickAddCatalog = useMemo(() => {
    return catalogProducts.filter((p) => {
      if (quickAddSelectedCategory !== 'ALL' && p.categoryId !== quickAddSelectedCategory) return false;
      if (quickAddSearch.trim()) {
        const q = quickAddSearch.toLowerCase();
        return p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [catalogProducts, quickAddSearch, quickAddSelectedCategory]);

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-16">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 p-6 sm:p-7 rounded-3xl text-white shadow-xl border border-slate-800">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-tr from-amber-500 to-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-950/40 ring-2 ring-white/10">
              <Flame className="w-7 h-7 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">Flash Sale Management System</h1>
                <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                  <span>Full Control Center</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300">
                Authoritative server scheduling, catalog product deal pricing, real-time stock limits & live storefront synchronization.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <a
            href="/flash-sale"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition border border-slate-700 shadow-sm"
          >
            <span>Live Storefront Deals</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={handleOpenCreate}
            className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white rounded-xl font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-red-900/30 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create Campaign</span>
          </button>
        </div>
      </div>

      {/* Toast Feedback */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 text-xs sm:text-sm font-semibold shadow-sm animate-fadeIn">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="flex-1">{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center gap-3 text-xs sm:text-sm font-semibold shadow-sm animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')} className="text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Performance Cards Header */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Active Campaigns</span>
            <Flame className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-950">{activeCampaigns.length}</div>
          <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live server countdown active</span>
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Total Units Allocated</span>
            <Package className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-950">{totalAllocatedAll}</div>
          <div className="text-[11px] text-slate-400 font-medium">Locked in promotional stock pool</div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Units Sold Under Flash</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-950">{totalSoldAll}</div>
          <div className="text-[11px] text-amber-600 font-semibold">
            {totalAllocatedAll > 0 ? `${Math.round((totalSoldAll / totalAllocatedAll) * 100)}% Stock Claimed` : '0%'}
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Total Flash Revenue</span>
            <Sparkles className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-price font-black text-slate-950">
            {formatBDT(totalRevenueAll)}
          </div>
          <div className="text-[11px] text-slate-400 font-medium">Direct orders placed</div>
        </div>
      </div>

      {/* Main Campaign Management Panel */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4 p-5 sm:p-6">
        {/* Filter Bar & Search */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(['ALL', 'ACTIVE', 'SCHEDULED', 'PAUSED', 'ENDED'] as const).map((tab) => {
              const isActive = statusFilter === tab;
              const count =
                tab === 'ALL'
                  ? campaigns.length
                  : tab === 'ACTIVE'
                  ? activeCampaigns.length
                  : tab === 'PAUSED'
                  ? campaigns.filter((c) => !c.isActive).length
                  : campaigns.filter((c) => (c.computedStatus || c.status) === tab).length;

              return (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-slate-950 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{tab === 'ALL' ? 'All Campaigns' : tab.charAt(0) + tab.slice(1).toLowerCase()}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Bar & Refresh */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={campaignSearch}
                onChange={(e) => setCampaignSearch(e.target.value)}
                placeholder="Search campaigns or products..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-red-600 transition"
              />
            </div>

            <button
              onClick={() => {
                fetchCampaigns();
                fetchCatalogAndCategories();
              }}
              title="Refresh"
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Campaign List Table with Accordion Rows */}
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading campaigns and catalog...</div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl mx-auto flex items-center justify-center">
              <Flame className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-slate-800">No Flash Sale Campaigns Found</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {campaignSearch.trim() || statusFilter !== 'ALL'
                ? 'No campaigns match your current filters. Try resetting search or status.'
                : 'Create your first promotional flash sale campaign to offer exciting discounts.'}
            </p>
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition"
            >
              + Create Campaign Now
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCampaigns.map((c) => {
              const effectiveStatus = c.computedStatus || c.status;
              const isExpanded = Boolean(expandedCampaigns[c.id]);
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

              // Calculate time remaining / elapsed
              const nowMs = Date.now();
              const endMs = new Date(c.endDate).getTime();
              const startMs = new Date(c.startDate).getTime();
              const isExpired = nowMs >= endMs;
              const hasStarted = nowMs >= startMs;

              let timeRemainingBadge = null;
              if (effectiveStatus === 'ACTIVE' && c.isActive && !isExpired) {
                const diffSec = Math.max(0, Math.floor((endMs - nowMs) / 1000));
                const h = Math.floor(diffSec / 3600);
                const m = Math.floor((diffSec % 3600) / 60);
                timeRemainingBadge = (
                  <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md">
                    <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
                    <span>
                      {h}h {m}m left
                    </span>
                  </span>
                );
              } else if (!hasStarted) {
                timeRemainingBadge = (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md">
                    <Clock className="w-3 h-3 text-blue-600" />
                    <span>Starts {startStr}</span>
                  </span>
                );
              }

              return (
                <div
                  key={c.id}
                  className={`rounded-2xl border transition-all ${
                    isExpanded
                      ? 'border-red-300 bg-white shadow-md'
                      : 'border-slate-200/90 bg-white hover:border-slate-300'
                  }`}
                >
                  {/* Campaign Header / Summary Bar */}
                  <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Expand Toggle & Campaign Identity */}
                    <div className="flex items-start gap-3 min-w-0">
                      <button
                        onClick={() => toggleExpand(c.id)}
                        className={`p-2 rounded-xl border transition shrink-0 mt-0.5 ${
                          isExpanded
                            ? 'bg-red-50 border-red-200 text-red-600'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                        title={isExpanded ? 'Collapse products' : 'Expand product roster'}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-black text-slate-950 text-sm sm:text-base tracking-tight truncate">
                            {c.title}
                          </h3>

                          {/* Status Badge */}
                          {effectiveStatus === 'ACTIVE' && c.isActive && !isExpired ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span>Live Active</span>
                            </span>
                          ) : effectiveStatus === 'SCHEDULED' && c.isActive && !isExpired ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              <Clock className="w-3 h-3 text-blue-600" />
                              <span>Scheduled</span>
                            </span>
                          ) : !c.isActive ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <Pause className="w-3 h-3 text-rose-600" />
                              <span>Paused</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              <CheckCircle className="w-3 h-3 text-slate-400" />
                              <span>Ended</span>
                            </span>
                          )}

                          {timeRemainingBadge}
                        </div>

                        {c.subtitle && (
                          <p className="text-xs text-slate-500 font-medium truncate max-w-xl">{c.subtitle}</p>
                        )}

                        <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-0.5 flex-wrap">
                          <span className="flex items-center gap-1 font-semibold text-slate-700">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>
                              {startStr} → {endStr}
                            </span>
                          </span>
                          <span className="text-slate-300">•</span>
                          <span>
                            <strong className="text-slate-900">{c.items?.length || 0}</strong> products in deal
                          </span>
                          <span className="text-slate-300">•</span>
                          <span>
                            Revenue: <strong className="font-price text-slate-900">{formatBDT(c.totalRevenue || 0)}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Quick Action Controls */}
                    <div className="flex items-center gap-1.5 flex-wrap lg:justify-end shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      {/* Direct "Add Product" to this campaign */}
                      <button
                        onClick={() => handleOpenQuickAdd(c.id)}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Product</span>
                      </button>

                      {/* Quick Extend Dropdown / Button (+24h) */}
                      <button
                        onClick={() => handleExtendDuration(c.id, 24)}
                        title="Extend campaign expiration by 24 hours"
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition"
                      >
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>+24h</span>
                      </button>

                      {/* Pause / Resume Toggle */}
                      <button
                        onClick={() => handleToggleActive(c.id, c.isActive)}
                        title={c.isActive ? 'Pause Campaign' : 'Resume Campaign'}
                        className={`p-2 rounded-xl border transition ${
                          c.isActive
                            ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        {c.isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      </button>

                      {/* Duplicate */}
                      <button
                        onClick={() => handleDuplicateCampaign(c)}
                        title="Duplicate Campaign"
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => handleOpenEdit(c)}
                        title="Edit Full Campaign Details"
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteCampaign(c.id, c.title)}
                        title="Delete Campaign"
                        className="p-2 bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 rounded-xl transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Product Deals Accordion */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/70 p-4 sm:p-5 rounded-b-2xl space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-red-500" />
                          <h4 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">
                            Products in Flash Sale ({c.items?.length || 0})
                          </h4>
                          <span className="text-[11px] text-slate-400">
                            • Click any product to adjust its flash price or stock allocation
                          </span>
                        </div>

                        <button
                          onClick={() => handleOpenQuickAdd(c.id)}
                          className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add More Products</span>
                        </button>
                      </div>

                      {/* Product Deals Grid */}
                      {!c.items || c.items.length === 0 ? (
                        <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 space-y-2">
                          <p className="text-xs text-slate-500">No products assigned to this campaign yet.</p>
                          <button
                            onClick={() => handleOpenQuickAdd(c.id)}
                            className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition"
                          >
                            + Browse Catalog & Add Deals
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                          {c.items.map((item) => {
                            const prod = item.product || catalogProducts.find((p) => p.id === item.productId);
                            const original = Number(item.originalPrice) || Number(prod?.sellingPrice) || 0;
                            const flash = Number(item.flashPrice) || 0;
                            const discountPct = original > 0 ? Math.round(((original - flash) / original) * 100) : 0;
                            const allocated = Number(item.allocatedStock) || 0;
                            const sold = Number(item.soldCount) || 0;
                            const remaining = Math.max(0, allocated - sold);
                            const cost = Number(prod?.purchaseCost) || 0;
                            const profit = flash - cost;

                            const isEditing =
                              inlineEditingItem?.campaignId === c.id &&
                              inlineEditingItem?.item.productId === item.productId;

                            return (
                              <div
                                key={item.id || item.productId}
                                className="bg-white p-3.5 rounded-2xl border border-slate-200 hover:border-slate-300 shadow-2xs space-y-3 flex flex-col justify-between transition"
                              >
                                <div className="space-y-2">
                                  {/* Product Header */}
                                  <div className="flex items-start gap-2.5">
                                    <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                                      <img
                                        src={
                                          prod?.images?.[0]?.url ||
                                          (typeof prod?.images?.[0] === 'string' ? prod?.images?.[0] : null) ||
                                          '/placeholder.png'
                                        }
                                        alt={prod?.name || 'Product'}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="font-bold text-slate-900 text-xs truncate">
                                        {prod?.name || 'Unknown Product'}
                                      </div>
                                      <div className="text-[10px] text-slate-400 font-mono">
                                        SKU: {prod?.sku || item.productId}
                                      </div>
                                      <div className="text-[10px] text-slate-500 font-medium">
                                        Warehouse Total: {prod?.stockQuantity ?? '—'} units
                                      </div>
                                    </div>

                                    {/* Discount Badge */}
                                    <span className="bg-red-50 text-red-600 font-black text-[10px] px-2 py-0.5 rounded-full border border-red-200 shrink-0">
                                      -{discountPct}%
                                    </span>
                                  </div>

                                  {/* Pricing Box */}
                                  {isEditing ? (
                                    <div className="space-y-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <label className="text-[10px] font-bold text-slate-500 uppercase">
                                            Flash Price
                                          </label>
                                          <input
                                            type="number"
                                            value={inlineEditingItem.flashPrice}
                                            onChange={(e) =>
                                              setInlineEditingItem({
                                                ...inlineEditingItem,
                                                flashPrice: Number(e.target.value),
                                              })
                                            }
                                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold outline-none focus:border-red-600"
                                          />
                                        </div>
                                        <div>
                                          <label className="text-[10px] font-bold text-slate-500 uppercase">
                                            Stock Limit
                                          </label>
                                          <input
                                            type="number"
                                            value={inlineEditingItem.allocatedStock}
                                            onChange={(e) =>
                                              setInlineEditingItem({
                                                ...inlineEditingItem,
                                                allocatedStock: Number(e.target.value),
                                              })
                                            }
                                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold outline-none focus:border-red-600"
                                          />
                                        </div>
                                      </div>

                                      <div className="flex justify-end gap-1.5 pt-1">
                                        <button
                                          onClick={() => setInlineEditingItem(null)}
                                          className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 rounded-md text-[11px] font-bold text-slate-700"
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          onClick={handleSaveInlineItem}
                                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-[11px] font-bold"
                                        >
                                          Save
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-baseline justify-between pt-1">
                                      <div>
                                        <span className="font-price text-sm sm:text-base font-black text-red-600">
                                          {formatBDT(flash)}
                                        </span>
                                        <span className="font-price text-xs text-slate-400 line-through ml-1.5">
                                          {formatBDT(original)}
                                        </span>
                                      </div>

                                      {/* Margin info */}
                                      {cost > 0 && (
                                        <span
                                          className={`text-[10px] font-bold ${
                                            profit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                          }`}
                                        >
                                          {profit >= 0 ? `+৳${profit} margin` : `⚠️ ৳${Math.abs(profit)} loss`}
                                        </span>
                                      )}
                                    </div>
                                  )}

                                  {/* Stock Progress Bar */}
                                  <div className="space-y-1">
                                    <div className="flex justify-between items-center text-[10px] font-bold">
                                      <span className="text-slate-600">
                                        Sold {sold} / {allocated} units
                                      </span>
                                      <span className={remaining <= 2 ? 'text-red-600' : 'text-slate-500'}>
                                        {remaining} left in flash
                                      </span>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-gradient-to-r from-red-500 to-amber-500 rounded-full"
                                        style={{
                                          width: `${Math.min(
                                            100,
                                            allocated > 0 ? Math.round((sold / allocated) * 100) : 0
                                          )}%`,
                                        }}
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Item Action Footer */}
                                {!isEditing && (
                                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                                    <button
                                      onClick={() =>
                                        setInlineEditingItem({
                                          campaignId: c.id,
                                          item,
                                          flashPrice: flash,
                                          allocatedStock: allocated,
                                        })
                                      }
                                      className="text-slate-600 hover:text-slate-900 font-bold text-[11px] flex items-center gap-1 transition"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                      <span>Edit Deal</span>
                                    </button>

                                    <button
                                      onClick={() => handleRemoveProductFromCampaign(c.id, item.productId)}
                                      className="text-rose-500 hover:text-rose-700 font-bold text-[11px] flex items-center gap-1 transition"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      <span>Remove</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* QUICK ADD PRODUCT TO CAMPAIGN MODAL */}
      {quickAddCampaignId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-scaleUp border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900">Add Product Deal to Campaign</h3>
                <p className="text-xs text-slate-500">
                  Select a product from the catalog, configure flash price with profit margin protection, and set allocated stock limit.
                </p>
              </div>
              <button
                onClick={() => setQuickAddCampaignId(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Catalog Search & Category Filter */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={quickAddSearch}
                  onChange={(e) => setQuickAddSearch(e.target.value)}
                  placeholder="Search catalog by name or SKU..."
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium outline-none focus:bg-white focus:border-red-600 transition"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setQuickAddSelectedCategory('ALL')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition shrink-0 ${
                    quickAddSelectedCategory === 'ALL'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setQuickAddSelectedCategory(cat.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition shrink-0 ${
                      quickAddSelectedCategory === cat.id
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Catalog Product Selection List */}
              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                {filteredQuickAddCatalog.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">No matching products found in catalog.</div>
                ) : (
                  filteredQuickAddCatalog.map((prod) => {
                    const isSelected = quickAddProduct?.id === prod.id;
                    return (
                      <div
                        key={prod.id}
                        onClick={() => handleSelectQuickAddProduct(prod)}
                        className={`p-2.5 flex items-center justify-between gap-3 cursor-pointer transition ${
                          isSelected ? 'bg-red-50/80 border-l-4 border-red-600' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                            <img
                              src={
                                prod.images?.[0]?.url ||
                                (typeof prod.images?.[0] === 'string' ? prod.images?.[0] : null) ||
                                '/placeholder.png'
                              }
                              alt={prod.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 text-xs truncate">{prod.name}</div>
                            <div className="text-[10px] text-slate-400">
                              SKU: {prod.sku} • In Warehouse: {prod.stockQuantity} units
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="font-price font-bold text-slate-900 text-xs">
                            {formatBDT(prod.sellingPrice)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Cost: {formatBDT(prod.purchaseCost || 0)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Deal Settings when a product is selected */}
            {quickAddProduct && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <div className="font-bold text-slate-900 text-xs">
                  Configure Flash Deal for: <span className="text-red-600 font-black">{quickAddProduct.name}</span>
                </div>

                {/* Preset Discount Chips */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase">
                    Quick Discount Presets
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {[10, 15, 20, 25, 30, 40, 50].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => handleQuickAddDiscountChange(pct)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-black transition ${
                          quickAddDiscountPercent === pct
                            ? 'bg-red-600 text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        -{pct}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price and Stock Inputs */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                      Flash Price (BDT ৳) *
                    </label>
                    <input
                      type="number"
                      value={quickAddFlashPrice}
                      onChange={(e) => handleQuickAddPriceChange(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs sm:text-sm font-bold text-red-600 outline-none focus:border-red-600"
                    />
                    <div className="text-[10px] text-slate-400 mt-1">
                      Original: {formatBDT(quickAddProduct.sellingPrice)} (-{quickAddDiscountPercent}%)
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                      Stock Limit to Allocate *
                    </label>
                    <input
                      type="number"
                      value={quickAddAllocatedStock}
                      onChange={(e) => setQuickAddAllocatedStock(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs sm:text-sm font-bold outline-none focus:border-red-600"
                    />
                    <div className="text-[10px] text-slate-400 mt-1">
                      Available in Warehouse: {quickAddProduct.stockQuantity}
                    </div>
                  </div>
                </div>

                {/* Profit Margin Guard Check */}
                {(() => {
                  const cost = Number(quickAddProduct.purchaseCost) || 0;
                  const margin = quickAddFlashPrice - cost;
                  const isLoss = margin < 0;

                  return (
                    <div
                      className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
                        isLoss
                          ? 'bg-rose-50 border-rose-200 text-rose-700'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      }`}
                    >
                      {isLoss ? (
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      ) : (
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                      <span>
                        {isLoss
                          ? `⚠️ Warning: Flash price is below product purchase cost (৳${Math.abs(margin)} loss per unit sold).`
                          : `Profit Margin Protected: +৳${margin} profit per unit sold.`}
                      </span>
                    </div>
                  );
                })()}
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setQuickAddCampaignId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!quickAddProduct || quickAddFlashPrice <= 0 || quickAddAllocatedStock <= 0}
                onClick={handleSubmitQuickAdd}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-40"
              >
                Add Deal to Flash Sale
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL CREATE / EDIT CAMPAIGN MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-6 animate-scaleUp border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {editingCampaignId ? 'Edit Flash Sale Campaign' : 'Create New Flash Sale Campaign'}
                </h3>
                <p className="text-xs text-slate-500">
                  Set campaign timing, add products from catalog, and configure deal pricing.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCampaignModal} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Campaign Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Flash Sale Discounts"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold outline-none focus:border-red-600"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Subtitle / Catchphrase</label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="e.g. Limited stock discounts on selected customer favourites"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none focus:border-red-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Start Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold outline-none focus:border-red-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Expiration Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold outline-none focus:border-red-600"
                  />
                </div>
              </div>

              {/* Product Deals Selector */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase">
                      Assigned Products ({selectedItems.length})
                    </h4>
                    <p className="text-[11px] text-slate-500">Search catalog below to add deals to this campaign</p>
                  </div>
                </div>

                {/* Catalog Search Input */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={modalCatalogSearch}
                    onChange={(e) => setModalCatalogSearch(e.target.value)}
                    placeholder="Search catalog to add products (name, SKU)..."
                    className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-red-600"
                  />
                </div>

                {/* Catalog Search Quick Results */}
                {modalCatalogSearch.trim() && (
                  <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                    {filteredModalCatalog.slice(0, 6).map((prod) => {
                      const isAdded = selectedItems.some((i) => i.productId === prod.id);
                      return (
                        <div
                          key={prod.id}
                          className="p-2 flex items-center justify-between gap-2 hover:bg-slate-50 text-xs"
                        >
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate">{prod.name}</div>
                            <div className="text-[10px] text-slate-400">
                              SKU: {prod.sku} • Price: {formatBDT(prod.sellingPrice)}
                            </div>
                          </div>
                          <button
                            type="button"
                            disabled={isAdded}
                            onClick={() => handleAddModalProduct(prod)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition shrink-0 ${
                              isAdded
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-red-600 hover:bg-red-700 text-white'
                            }`}
                          >
                            {isAdded ? 'Added' : '+ Add'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Assigned Items Cards */}
                {selectedItems.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    No products added yet. Use the search box above to add deals.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {selectedItems.map((item, idx) => {
                      const prod = item.product || catalogProducts.find((p) => p.id === item.productId);
                      const original = Number(item.originalPrice) || Number(prod?.sellingPrice) || 0;
                      const discount =
                        original > 0
                          ? Math.round(((original - Number(item.flashPrice)) / original) * 100)
                          : 0;

                      return (
                        <div
                          key={item.productId}
                          className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-slate-900 truncate">{prod?.name || item.productId}</div>
                            <div className="text-[10px] text-slate-500">
                              Original: {formatBDT(original)} • SKU: {prod?.sku}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div>
                              <label className="text-[9px] uppercase font-bold text-slate-400 block">Flash Price</label>
                              <input
                                type="number"
                                value={item.flashPrice}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setSelectedItems((prev) =>
                                    prev.map((it, i) => (i === idx ? { ...it, flashPrice: val } : it))
                                  );
                                }}
                                className="w-20 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-red-600"
                              />
                            </div>

                            <div>
                              <label className="text-[9px] uppercase font-bold text-slate-400 block">Stock Limit</label>
                              <input
                                type="number"
                                value={item.allocatedStock}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setSelectedItems((prev) =>
                                    prev.map((it, i) => (i === idx ? { ...it, allocatedStock: val } : it))
                                  );
                                }}
                                className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                              />
                            </div>

                            <span className="font-bold text-red-600 text-[11px] shrink-0">-{discount}%</span>

                            <button
                              type="button"
                              onClick={() => setSelectedItems((prev) => prev.filter((_, i) => i !== idx))}
                              className="p-1.5 hover:bg-rose-100 text-rose-500 rounded-lg transition"
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

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || selectedItems.length === 0}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-40"
                >
                  {saving ? 'Saving...' : editingCampaignId ? 'Update Campaign' : 'Create & Schedule Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
