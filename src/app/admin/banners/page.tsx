'use client';

import React, { useState, useEffect } from 'react';
import {
  Image as ImageIcon,
  Plus,
  Loader2,
  X,
  Edit2,
  Trash2,
  CheckCircle,
  EyeOff,
  Layers,
  ArrowUpRight,
  Info,
  Smartphone,
  Monitor,
} from 'lucide-react';

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'ARCHIVED'>('ALL');

  // Add Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [targetUrl, setTargetUrl] = useState('/shop');
  const [sortOrder, setSortOrder] = useState('0');
  const [submitting, setSubmitting] = useState(false);

  // Edit Modal State
  const [editingBanner, setEditingBanner] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editTargetUrl, setEditTargetUrl] = useState('');
  const [editSortOrder, setEditSortOrder] = useState('0');
  const [editIsActive, setEditIsActive] = useState(true);
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/banners?all=true');
      const data = await res.json();
      if (data.success) setBanners(data.banners || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !imageUrl.trim()) return;
    setSubmitting(true);

    try {
      const res = await fetch('/api/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          subtitle: subtitle.trim() || undefined,
          imageUrl: imageUrl.trim(),
          targetUrl: targetUrl.trim() || '/shop',
          sortOrder: Number(sortOrder) || 0,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setTitle('');
        setSubtitle('');
        setImageUrl('');
        setTargetUrl('/shop');
        setSortOrder('0');
        fetchBanners();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (banner: any) => {
    try {
      const res = await fetch(`/api/banners/${banner.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !banner.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        fetchBanners();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openEditModal = (b: any) => {
    setEditingBanner(b);
    setEditTitle(b.title || '');
    setEditSubtitle(b.subtitle || '');
    setEditImageUrl(b.imageUrl || '');
    setEditTargetUrl(b.targetUrl || '/shop');
    setEditSortOrder(String(b.sortOrder ?? 0));
    setEditIsActive(b.isActive !== false);
  };

  const handleUpdateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner || !editTitle.trim() || !editImageUrl.trim()) return;
    setSubmittingEdit(true);

    try {
      const res = await fetch(`/api/banners/${editingBanner.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          subtitle: editSubtitle.trim() || undefined,
          imageUrl: editImageUrl.trim(),
          targetUrl: editTargetUrl.trim() || '/shop',
          sortOrder: Number(editSortOrder) || 0,
          isActive: editIsActive,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingBanner(null);
        fetchBanners();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleDeleteBanner = async (id: string, bannerTitle: string) => {
    if (!confirm(`Are you sure you want to delete banner "${bannerTitle}"?`)) return;
    try {
      const res = await fetch(`/api/banners/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchBanners();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredBanners = banners.filter((b) => {
    if (activeTab === 'ACTIVE') return b.isActive !== false;
    if (activeTab === 'ARCHIVED') return b.isActive === false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-950 flex items-center gap-2">
            <Layers className="w-6 h-6 text-red-600" />
            Banner Library & Campaign Manager
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create, toggle, edit, and reactivate hero banners and flash promotional sliders from your library.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md shadow-red-600/20 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Banner</span>
        </button>
      </div>

      {/* Professional Banner Dimension & Responsive Guidelines (Research Based) */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 rounded-2xl p-4 sm:p-5 text-xs text-slate-700 shadow-2xs space-y-2">
        <div className="flex items-center gap-2 text-amber-900 font-black text-sm">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Professional Banner Dimension & Safe-Zone Guide (রিসার্চ ও সেরা প্র্যাকটিস)</span>
        </div>
        <p className="text-[11px] text-slate-600 leading-relaxed">
          ওয়েবসাইটের ব্যানার যেন সকল ডিভাইস (মোবাইল, ট্যাবলেট, ল্যাপটপ, ডেস্কটপ)-এ নিঁখুত ও প্রফেশনাল দেখায়, সেজন্য নিচের মাপগুলো মেনে ছবি তৈরি করুন:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-[11px]">
          <div className="bg-white/80 p-3 rounded-xl border border-amber-200/70 space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <Monitor className="w-3.5 h-3.5 text-amber-600" />
              <span>ডেস্কটপ স্ট্যান্ডার্ড সাইজ:</span>
            </div>
            <p className="text-slate-600">
              <strong className="text-slate-900 font-mono">1920 × 640 px</strong> বা <strong className="text-slate-900 font-mono">1600 × 540 px</strong> (অনুপাত ৩:১ / ২১:৯)।
            </p>
          </div>

          <div className="bg-white/80 p-3 rounded-xl border border-amber-200/70 space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-amber-600" />
              <span>মোবাইল রেসপনসিভনেস:</span>
            </div>
            <p className="text-slate-600">
              স্মার্টফোনে ব্যানার স্বয়ংক্রিয়ভাবে ফ্লুইডলি স্কেল হয় (হাইট ২০০-২৩০px)। কোনো টেক্সট বা ছবি কাটবে না।
            </p>
          </div>

          <div className="bg-white/80 p-3 rounded-xl border border-amber-200/70 space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>ডিজাইন সেফ জোন:</span>
            </div>
            <p className="text-slate-600">
              মূল পণ্য বা অফারের বড় ছবি ব্যানারের <strong>ডানপাশে ও মাঝে</strong> রাখুন; বামপাশের ৩৫%-এ সাইটের অফার বক্সটি স্মার্টলি ভাসবে।
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 text-xs font-bold">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-3.5 py-1.5 rounded-lg transition ${
            activeTab === 'ALL'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All in Library ({banners.length})
        </button>
        <button
          onClick={() => setActiveTab('ACTIVE')}
          className={`px-3.5 py-1.5 rounded-lg transition ${
            activeTab === 'ACTIVE'
              ? 'bg-emerald-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Live on Homepage ({banners.filter((b) => b.isActive !== false).length})
        </button>
        <button
          onClick={() => setActiveTab('ARCHIVED')}
          className={`px-3.5 py-1.5 rounded-lg transition ${
            activeTab === 'ARCHIVED'
              ? 'bg-amber-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Saved Library Archives ({banners.filter((b) => b.isActive === false).length})
        </button>
      </div>

      {/* Banners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 text-center py-16 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-red-600" />
            <p className="text-xs mt-2">Loading banner library...</p>
          </div>
        ) : filteredBanners.length === 0 ? (
          <div className="col-span-2 text-center py-16 bg-white rounded-3xl border border-slate-200 text-slate-400 space-y-2">
            <ImageIcon className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-bold text-slate-600">No banners found in this view.</p>
            <p className="text-xs text-slate-400">Click &ldquo;New Banner&rdquo; to add a hero slider campaign.</p>
          </div>
        ) : (
          filteredBanners.map((b) => (
            <div
              key={b.id}
              className={`bg-white rounded-3xl border transition-all duration-200 shadow-sm overflow-hidden flex flex-col justify-between ${
                b.isActive !== false ? 'border-slate-200/90' : 'border-dashed border-slate-300 opacity-75'
              }`}
            >
              <div>
                {/* Banner Image Preview */}
                <div className="aspect-[21/9] bg-slate-900 overflow-hidden relative group">
                  <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" />
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1 ${
                        b.isActive !== false
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-900/80 text-amber-300'
                      }`}
                    >
                      {b.isActive !== false ? (
                        <>
                          <CheckCircle className="w-3 h-3" /> Live
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3" /> In Library
                        </>
                      )}
                    </span>
                    <span className="bg-black/60 backdrop-blur-sm text-white text-[10px] font-mono px-2 py-0.5 rounded-full">
                      Sort: {b.sortOrder ?? 0}
                    </span>
                  </div>
                </div>

                {/* Banner Details */}
                <div className="p-5 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{b.title}</h3>
                      {b.subtitle && <p className="text-xs text-slate-500 mt-0.5">{b.subtitle}</p>}
                    </div>
                  </div>

                  <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1 pt-1">
                    <span>Link:</span>
                    <a
                      href={b.targetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-red-600 hover:underline truncate max-w-[240px] flex items-center gap-0.5"
                    >
                      {b.targetUrl}
                      <ArrowUpRight className="w-3 h-3 shrink-0" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 pt-0 border-t border-slate-100 flex items-center justify-between gap-2 bg-slate-50/50 mt-2">
                <button
                  onClick={() => handleToggleActive(b)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
                    b.isActive !== false
                      ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                  }`}
                >
                  {b.isActive !== false ? 'Deactivate' : 'Reactivate to Live'}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(b)}
                    className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition"
                    title="Edit Banner"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteBanner(b.id, b.title)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                    title="Delete Banner"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Banner Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-6 right-6 p-1 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-black text-slate-900">Add Campaign Banner</h2>
            <p className="text-xs text-slate-500">Banner will be saved to your library and set live immediately.</p>

            <form onSubmit={handleCreateBanner} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Banner Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Eid Mega Flash Sale"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Subtitle / Callout</label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="e.g. Up to 50% Off On Lifestyle & Gadgets"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Image URL / ImageKit CDN *</label>
                <input
                  type="url"
                  required
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://ik.imagekit.io/... or https://..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  💡 <strong>রিকমেন্ডেড ব্যানার সাইজ:</strong> ১৯২০ × ৬৪০ px বা ১৬০০ × ৫৪০ px (৩:১ অনুপাত)। মূল ছবি ডানে রাখুন।
                </p>
                {imageUrl && (
                  <div className="mt-2 aspect-[21/9] rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Link</label>
                  <input
                    type="text"
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    placeholder="/shop"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Display Order</label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    placeholder="0"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition"
                >
                  {submitting ? 'Saving to Library...' : 'Save & Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Banner Modal */}
      {editingBanner && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setEditingBanner(null)}
              className="absolute top-6 right-6 p-1 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-black text-slate-900">Edit Campaign Banner</h2>
            <p className="text-xs text-slate-500">Update banner copy, image URL, link, or toggle active status.</p>

            <form onSubmit={handleUpdateBanner} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Banner Title *</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Subtitle / Callout</label>
                <input
                  type="text"
                  value={editSubtitle}
                  onChange={(e) => setEditSubtitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Image URL / ImageKit CDN *</label>
                <input
                  type="url"
                  required
                  value={editImageUrl}
                  onChange={(e) => setEditImageUrl(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  💡 <strong>রিকমেন্ডেড ব্যানার সাইজ:</strong> ১৯২০ × ৬৪০ px বা ১৬০০ × ৫৪০ px (৩:১ অনুপাত)। মূল ছবি ডানে রাখুন।
                </p>
                {editImageUrl && (
                  <div className="mt-2 aspect-[21/9] rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                    <img src={editImageUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Link</label>
                  <input
                    type="text"
                    value={editTargetUrl}
                    onChange={(e) => setEditTargetUrl(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Display Order</label>
                  <input
                    type="number"
                    value={editSortOrder}
                    onChange={(e) => setEditSortOrder(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editIsActiveCheck"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                  className="rounded text-red-600 focus:ring-red-500"
                />
                <label htmlFor="editIsActiveCheck" className="font-bold text-slate-700">
                  Active (Live on Homepage Slider)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingBanner(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition"
                >
                  {submittingEdit ? 'Saving...' : 'Update Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
