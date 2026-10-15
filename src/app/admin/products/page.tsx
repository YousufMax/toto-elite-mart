'use client';

import React, { useState, useEffect } from 'react';
import { formatBDT } from '@/lib/currency';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  Upload,
  Check,
  X,
  Loader2,
  Image as ImageIcon,
  Edit2,
  Trash2,
  Palette,
  ChevronUp,
  ChevronDown,
  Camera,
  CheckCircle2,
  Sparkles,
  Star,
  ExternalLink,
  Globe,
} from 'lucide-react';
import { slugify } from '@/lib/slugify';

interface AdminColorVariant {
  id?: string;
  name: string;
  colorCode: string;
  price?: number | null;
  imageUrl?: string;
  stockQuantity: number;
  isActive: boolean;
  sortOrder: number;
}

const PRESET_COLORS = [
  { name: 'Black', code: '#000000' },
  { name: 'White', code: '#FFFFFF' },
  { name: 'Midnight Blue', code: '#1E3A8A' },
  { name: 'Navy', code: '#0F172A' },
  { name: 'Space Gray', code: '#4B5563' },
  { name: 'Silver', code: '#E2E8F0' },
  { name: 'Crimson Red', code: '#DC2626' },
  { name: 'Forest Green', code: '#15803D' },
  { name: 'Emerald', code: '#10B981' },
  { name: 'Gold', code: '#D97706' },
  { name: 'Rose Gold', code: '#F472B6' },
  { name: 'Deep Purple', code: '#7C3AED' },
  { name: 'Sky Blue', code: '#0EA5E9' },
  { name: 'Orange', code: '#EA580C' },
  { name: 'Maroon', code: '#881337' },
];

function ColorVariantsSection({
  variants,
  onChange,
  availableImages,
}: {
  variants: AdminColorVariant[];
  onChange: (variants: AdminColorVariant[]) => void;
  availableImages: string[];
}) {
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);
  const [photoAssigningIdx, setPhotoAssigningIdx] = useState<number | null>(null);
  const [customPhotoUrl, setCustomPhotoUrl] = useState('');
  const [batchStockValue, setBatchStockValue] = useState('10');
  const [batchPriceValue, setBatchPriceValue] = useState('');

  // Custom Color State
  const [customName, setCustomName] = useState('');
  const [customCode, setCustomCode] = useState('#2563EB');
  const [customStock, setCustomStock] = useState('10');
  const [customPrice, setCustomPrice] = useState('');
  const [customImage, setCustomImage] = useState('');

  // 1-Click Instant Preset Adding
  const handleQuickAddPreset = (preset: { name: string; code: string }) => {
    const existing = variants.find(
      (v) => v.name.toLowerCase() === preset.name.toLowerCase() || v.colorCode.toLowerCase() === preset.code.toLowerCase()
    );
    if (existing) {
      alert(`"${preset.name}" is already in your variants list!`);
      return;
    }
    const newVariant: AdminColorVariant = {
      name: preset.name,
      colorCode: preset.code,
      price: null,
      stockQuantity: 10,
      isActive: true,
      sortOrder: variants.length,
    };
    onChange([...variants, newVariant]);
  };

  const handleAddCustom = () => {
    if (!customName.trim()) {
      alert('Please enter a color title (e.g. Royal Gold)');
      return;
    }
    const parsedPrice = customPrice.trim() ? Math.max(0, parseFloat(customPrice) || 0) : null;
    const newVariant: AdminColorVariant = {
      name: customName.trim(),
      colorCode: customCode,
      price: parsedPrice,
      imageUrl: customImage.trim() || undefined,
      stockQuantity: Math.max(0, parseInt(customStock) || 0),
      isActive: true,
      sortOrder: variants.length,
    };
    onChange([...variants, newVariant]);
    setCustomName('');
    setCustomCode('#2563EB');
    setCustomStock('10');
    setCustomPrice('');
    setCustomImage('');
    setShowCustomBuilder(false);
  };

  const handleRemove = (idx: number) => {
    const updated = variants.filter((_, i) => i !== idx);
    onChange(updated);
  };

  const handleUpdate = (idx: number, patch: Partial<AdminColorVariant>) => {
    const updated = variants.map((v, i) => (i === idx ? { ...v, ...patch } : v));
    onChange(updated);
  };

  const handleMove = (idx: number, direction: 'up' | 'down') => {
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === variants.length - 1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const copy = [...variants];
    const temp = copy[idx];
    copy[idx] = copy[targetIdx];
    copy[targetIdx] = temp;
    onChange(copy);
  };

  const handleApplyBatchStock = () => {
    const val = Math.max(0, parseInt(batchStockValue) || 0);
    const updated = variants.map((v) => ({ ...v, stockQuantity: val }));
    onChange(updated);
  };

  const handleApplyBatchPrice = () => {
    const val = batchPriceValue.trim() === '' ? null : Math.max(0, parseFloat(batchPriceValue) || 0);
    const updated = variants.map((v) => ({ ...v, price: val }));
    onChange(updated);
  };

  const totalVariantStock = variants.reduce((acc, v) => acc + (v.isActive ? v.stockQuantity : 0), 0);

  return (
    <div className="bg-slate-50/90 rounded-2xl p-4 sm:p-5 border border-slate-200/90 space-y-4 shadow-2xs">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold shrink-0">
            <Palette className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
              <span>Product Color Variants</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200/60">
                {variants.length} {variants.length === 1 ? 'Color' : 'Colors'}
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Manage color swatches, assign gallery photos, control stock per color, and reorder.
            </p>
          </div>
        </div>

        {variants.length > 0 && (
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <div className="text-[11px] font-semibold text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
              Combined Stock: <span className="font-extrabold text-slate-900">{totalVariantStock} units</span>
            </div>
            {/* Batch Stock Quick Tool */}
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 pl-1">Set stock:</span>
              <input
                type="number"
                min="0"
                value={batchStockValue}
                onChange={(e) => setBatchStockValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleApplyBatchStock();
                  }
                }}
                className="w-12 px-1.5 py-0.5 text-center text-xs font-bold border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={handleApplyBatchStock}
                className="px-2 py-1 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition"
                title="Apply this stock quantity to all active variants"
              >
                Apply
              </button>
            </div>
            {/* Batch Price Quick Tool */}
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 pl-1">Set price:</span>
              <input
                type="number"
                min="0"
                placeholder="৳"
                value={batchPriceValue}
                onChange={(e) => setBatchPriceValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleApplyBatchPrice();
                  }
                }}
                className="w-14 px-1.5 py-0.5 text-center text-xs font-bold border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={handleApplyBatchPrice}
                className="px-2 py-1 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition"
                title="Apply this price to all variants"
              >
                Apply
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Preset Color Buttons (1-Click Instant Add) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Click any color below to add it instantly:</span>
          </label>
          <button
            type="button"
            onClick={() => setShowCustomBuilder(!showCustomBuilder)}
            className="text-[11px] font-bold text-amber-600 hover:text-amber-700 hover:underline flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showCustomBuilder ? 'Close Custom Color' : '+ Custom Color'}</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {PRESET_COLORS.map((p) => {
            const isAdded = variants.some(
              (v) => v.name.toLowerCase() === p.name.toLowerCase() || v.colorCode.toLowerCase() === p.code.toLowerCase()
            );
            return (
              <button
                key={p.name}
                type="button"
                onClick={() => handleQuickAddPreset(p)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all shadow-2xs ${
                  isAdded
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 ring-1 ring-emerald-400/20'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-amber-500 hover:bg-amber-50/40 hover:scale-102'
                }`}
                title={isAdded ? 'Already added' : `Click to add ${p.name}`}
              >
                <span
                  className="w-3.5 h-3.5 rounded-full border border-black/15 shadow-2xs shrink-0"
                  style={{ backgroundColor: p.code }}
                />
                <span>{p.name}</span>
                {isAdded ? (
                  <Check className="w-3 h-3 text-emerald-600 shrink-0 stroke-[3]" />
                ) : (
                  <Plus className="w-3 h-3 text-slate-400 group-hover:text-amber-600 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Expandable Custom Color Builder */}
      {showCustomBuilder && (
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border-2 border-amber-300 shadow-sm space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-amber-500" />
              <span>Create Custom Color Variant</span>
            </span>
            <button
              type="button"
              onClick={() => setShowCustomBuilder(false)}
              className="text-slate-400 hover:text-slate-700 text-xs"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-3">
              <label className="block text-[10px] font-bold text-slate-600 mb-1">Color Palette & Hex</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value)}
                  className="w-9 h-9 rounded-xl border border-slate-300 cursor-pointer p-0.5 bg-white shrink-0"
                  title="Pick exact color"
                />
                <input
                  type="text"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustom();
                    }
                  }}
                  placeholder="#2563EB"
                  className="w-full px-2.5 py-1.5 text-xs font-mono uppercase rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[10px] font-bold text-slate-600 mb-1">Color Title *</label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustom();
                  }
                }}
                placeholder="e.g. Royal Sapphire Blue"
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-slate-600 mb-1">Stock (Units)</label>
              <input
                type="number"
                min="0"
                value={customStock}
                onChange={(e) => setCustomStock(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustom();
                  }
                }}
                placeholder="10"
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-slate-600 mb-1">Price (৳) (Opt.)</label>
              <input
                type="number"
                min="0"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustom();
                  }
                }}
                placeholder="Default"
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="sm:col-span-2">
              <button
                type="button"
                onClick={handleAddCustom}
                className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Variant</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Variants Matrix Table */}
      {variants.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 px-1">
            <span>Configured Variants ({variants.length})</span>
            <span className="text-[10px] text-slate-400">Click camera to assign photo • Drag / arrows to reorder</span>
          </div>

          <div className="divide-y divide-slate-200/80 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
            {variants.map((v, idx) => (
              <div
                key={v.id || idx}
                className={`p-3 sm:px-4 sm:py-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 transition ${
                  !v.isActive ? 'bg-slate-50/70 opacity-60' : 'hover:bg-slate-50/50'
                }`}
              >
                {/* Left: Reorder + Swatch + Title */}
                <div className="flex items-center gap-3 w-full md:w-auto">
                  {/* Up / Down reorder */}
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMove(idx, 'up')}
                      className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-20 hover:bg-slate-100 rounded transition"
                      title="Move Up"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === variants.length - 1}
                      onClick={() => handleMove(idx, 'down')}
                      className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-20 hover:bg-slate-100 rounded transition"
                      title="Move Down"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Color Swatch Picker */}
                  <div className="relative group shrink-0">
                    <input
                      type="color"
                      value={v.colorCode}
                      onChange={(e) => handleUpdate(idx, { colorCode: e.target.value })}
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 border-white shadow-md cursor-pointer p-0"
                      style={{ backgroundColor: v.colorCode }}
                      title="Click to adjust color hex"
                    />
                  </div>

                  {/* Title & Hex input */}
                  <div className="flex-1 min-w-[140px]">
                    <input
                      type="text"
                      value={v.name}
                      onChange={(e) => handleUpdate(idx, { name: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.preventDefault();
                      }}
                      placeholder="Color Name"
                      className="w-full px-2.5 py-1 text-xs font-black text-slate-900 rounded-lg border border-transparent hover:border-slate-300 focus:border-amber-500 focus:bg-white focus:outline-none transition"
                    />
                    <div className="text-[10px] font-mono text-slate-400 px-2.5">
                      {v.colorCode}
                    </div>
                  </div>
                </div>

                {/* Right: Stock, Photo Picker, Status & Delete */}
                <div className="flex items-center gap-2.5 sm:gap-3 w-full md:w-auto justify-between md:justify-end flex-wrap">
                  {/* Stock Input */}
                  <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500">Stock:</span>
                    <input
                      type="number"
                      min="0"
                      value={v.stockQuantity}
                      onChange={(e) =>
                        handleUpdate(idx, { stockQuantity: Math.max(0, parseInt(e.target.value) || 0) })
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.preventDefault();
                      }}
                      className="w-14 px-1.5 py-0.5 text-xs font-black text-slate-900 text-center rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  {/* Price (৳) Input */}
                  <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200" title="Custom variant price in BDT (৳). Leave empty to use product's default price.">
                    <span className="text-[10px] font-bold text-slate-500">Price (৳):</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="Default"
                      value={v.price !== undefined && v.price !== null ? v.price : ''}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        handleUpdate(idx, { price: val === '' ? null : Math.max(0, parseFloat(val) || 0) });
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.preventDefault();
                      }}
                      className="w-16 px-1.5 py-0.5 text-xs font-black text-slate-900 text-center rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  {/* Assigned Photo Slot */}
                  <div>
                    {v.imageUrl ? (
                      <button
                        type="button"
                        onClick={() => setPhotoAssigningIdx(idx)}
                        className="group relative flex items-center gap-1.5 p-1 rounded-xl border border-slate-200 bg-white hover:border-amber-400 transition shadow-2xs"
                        title="Click to change assigned photo"
                      >
                        <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-100 bg-slate-100 shrink-0">
                          <img src={v.imageUrl} alt={v.name} className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-700 pr-1 group-hover:text-amber-600">
                          Photo Set
                        </span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setPhotoAssigningIdx(idx)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-dashed border-slate-300 hover:border-amber-500 hover:bg-amber-50/50 text-slate-600 hover:text-amber-700 text-[10px] font-bold transition shadow-2xs"
                        title="Assign photo for this color"
                      >
                        <Camera className="w-3.5 h-3.5 text-slate-400" />
                        <span>Assign Photo</span>
                      </button>
                    )}
                  </div>

                  {/* Active Toggle Switch */}
                  <button
                    type="button"
                    onClick={() => handleUpdate(idx, { isActive: !v.isActive })}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1 transition shadow-2xs ${
                      v.isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}
                    title={v.isActive ? 'Active (Click to disable)' : 'Disabled (Click to activate)'}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${v.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    <span>{v.isActive ? 'Active' : 'Disabled'}</span>
                  </button>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                    title="Remove this color variant"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-6 text-center border border-dashed border-slate-300 space-y-2">
          <Palette className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-xs font-bold text-slate-700">No Color Variants Added Yet</p>
          <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
            Click any of the quick preset colors above (Black, White, Navy, etc.) or click &quot;+ Custom Color&quot; to add color options for this product.
          </p>
        </div>
      )}

      {/* Interactive Photo Assignment Modal */}
      {photoAssigningIdx !== null && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full border border-black/15 shadow-2xs shrink-0"
                  style={{ backgroundColor: variants[photoAssigningIdx]?.colorCode }}
                />
                <h4 className="font-black text-slate-900 text-sm">
                  Assign Photo: {variants[photoAssigningIdx]?.name}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPhotoAssigningIdx(null);
                  setCustomPhotoUrl('');
                }}
                className="p-1 text-slate-400 hover:text-slate-800 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Option A: Select from Product Gallery Images */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-2">
                1. Select from Product Gallery Photos:
              </label>
              {availableImages.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                  {availableImages.map((imgUrl, i) => {
                    const isCurrent = variants[photoAssigningIdx]?.imageUrl === imgUrl;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          handleUpdate(photoAssigningIdx, { imageUrl: imgUrl });
                          setPhotoAssigningIdx(null);
                          setCustomPhotoUrl('');
                        }}
                        className={`group relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                          isCurrent
                            ? 'border-amber-500 ring-2 ring-amber-500/30'
                            : 'border-slate-200 hover:border-amber-400 hover:scale-102'
                        }`}
                      >
                        <img src={imgUrl} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                        <span className="absolute bottom-0 inset-x-0 bg-slate-950/70 text-white text-[9px] font-bold py-0.5 text-center">
                          Photo #{i + 1}
                        </span>
                        {isCurrent && (
                          <div className="absolute top-1 right-1 w-5 h-5 bg-amber-500 text-slate-950 rounded-full flex items-center justify-center shadow">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                  No images in the product gallery yet. You can paste a direct URL below or add photos to the product above.
                </div>
              )}
            </div>

            {/* Option B: Enter Custom Photo URL */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="block text-[11px] font-bold text-slate-700">
                2. Or Paste Image CDN / ImageKit URL:
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={customPhotoUrl}
                  onChange={(e) => setCustomPhotoUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (customPhotoUrl.trim()) {
                        handleUpdate(photoAssigningIdx, { imageUrl: customPhotoUrl.trim() });
                        setPhotoAssigningIdx(null);
                        setCustomPhotoUrl('');
                      }
                    }
                  }}
                  placeholder="https://ik.imagekit.io/... or https://images.unsplash.com/..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <button
                  type="button"
                  disabled={!customPhotoUrl.trim()}
                  onClick={() => {
                    if (customPhotoUrl.trim()) {
                      handleUpdate(photoAssigningIdx, { imageUrl: customPhotoUrl.trim() });
                      setPhotoAssigningIdx(null);
                      setCustomPhotoUrl('');
                    }
                  }}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl text-xs shrink-0 transition"
                >
                  Assign
                </button>
              </div>
            </div>

            {/* Option C: Remove Photo Button */}
            {variants[photoAssigningIdx]?.imageUrl && (
              <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                <span className="text-[11px] text-slate-500">Currently assigned photo</span>
                <button
                  type="button"
                  onClick={() => {
                    handleUpdate(photoAssigningIdx, { imageUrl: undefined });
                    setPhotoAssigningIdx(null);
                    setCustomPhotoUrl('');
                  }}
                  className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline"
                >
                  Remove Photo
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugCustomized, setIsSlugCustomized] = useState(false);
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [purchaseCost, setPurchaseCost] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('10');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');
  const [imageUrl, setImageUrl] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isFeatured, setIsFeatured] = useState(false);
  const [colorVariants, setColorVariants] = useState<AdminColorVariant[]>([]);

  // Edit Product State
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editSku, setEditSku] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPurchaseCost, setEditPurchaseCost] = useState('');
  const [editSellingPrice, setEditSellingPrice] = useState('');
  const [editSalePrice, setEditSalePrice] = useState('');
  const [editStockQuantity, setEditStockQuantity] = useState('');
  const [editLowStockThreshold, setEditLowStockThreshold] = useState('');
  const [editIsFeatured, setEditIsFeatured] = useState(false);
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editImageUrls, setEditImageUrls] = useState<string[]>([]);
  const [editColorVariants, setEditColorVariants] = useState<AdminColorVariant[]>([]);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  const openEditModal = (p: any) => {
    setEditingProduct(p);
    setEditName(p.name || '');
    setEditSlug(p.slug || '');
    setEditSku(p.sku || '');
    setEditCategoryId(p.categoryId || p.category?.id || (categories[0]?.id || ''));
    setEditDescription(p.description || '');
    setEditPurchaseCost(String(p.purchaseCost || 0));
    setEditSellingPrice(String(p.sellingPrice || 0));
    setEditSalePrice(p.salePrice ? String(p.salePrice) : '');
    setEditStockQuantity(String(p.stockQuantity ?? 0));
    setEditLowStockThreshold(String(p.lowStockThreshold ?? 5));
    setEditIsFeatured(Boolean(p.isFeatured));
    const currentImgs = p.images?.map((img: any) => img.url) || [];
    setEditImageUrls(currentImgs.slice(0, 5));
    setEditImageUrl('');
    setEditColorVariants(
      Array.isArray(p.colorVariants)
        ? p.colorVariants.map((v: any, idx: number) => ({
            id: v.id,
            name: v.name,
            colorCode: v.colorCode,
            price: v.price != null && Number(v.price) > 0 ? Number(v.price) : null,
            imageUrl: v.imageUrl || '',
            stockQuantity: Number(v.stockQuantity ?? 0),
            isActive: v.isActive !== false,
            sortOrder: v.sortOrder ?? idx,
          }))
        : []
    );
    setEditError('');
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setEditError('');
    setSubmittingEdit(true);
    try {
      const finalImgs = [...editImageUrls];
      if (editImageUrl.trim() && !finalImgs.includes(editImageUrl.trim()) && finalImgs.length < 5) {
        finalImgs.push(editImageUrl.trim());
      }
      for (const v of editColorVariants) {
        if (v.imageUrl?.trim() && !finalImgs.includes(v.imageUrl.trim()) && finalImgs.length < 5) {
          finalImgs.push(v.imageUrl.trim());
        }
      }

      const payload: any = {
        name: editName.trim(),
        slug: editSlug.trim() || undefined,
        sku: editSku.trim().toUpperCase(),
        categoryId: editCategoryId || categories[0]?.id || 'cat-1',
        description: editDescription.trim(),
        purchaseCost: Number(editPurchaseCost) || 0,
        sellingPrice: Number(editSellingPrice),
        salePrice: editSalePrice ? Number(editSalePrice) : null,
        stockQuantity: Number(editStockQuantity) || 0,
        lowStockThreshold: Number(editLowStockThreshold) || 5,
        isFeatured: editIsFeatured,
        images: finalImgs.slice(0, 5).map((url, idx) => ({
          url,
          isPrimary: idx === 0,
          sortOrder: idx,
        })),
        colorVariants: editColorVariants.map((v, idx) => ({
          id: v.id,
          name: v.name.trim(),
          colorCode: v.colorCode.trim(),
          price: v.price != null && Number(v.price) > 0 ? Number(v.price) : null,
          imageUrl: v.imageUrl?.trim() || null,
          stockQuantity: Number(v.stockQuantity) || 0,
          isActive: Boolean(v.isActive),
          sortOrder: idx,
        })),
      };
      const res = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update product');
      }
      setEditingProduct(null);
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating product';
      setEditError(msg);
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleDeleteProduct = async (id: string, prodName: string) => {
    if (!confirm(`Are you sure you want to archive "${prodName}"?`)) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || 'Failed to archive product');
        return;
      }
      fetchData();
    } catch {
      alert('Network error archiving product');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch(`/api/products${search ? `?search=${encodeURIComponent(search)}` : ''}`),
        fetch('/api/categories'),
      ]);
      const prodData = await prodRes.json();
      const catData = await catRes.json();

      if (prodData.success) setProducts(prodData.products || []);
      if (catData.success) {
        setCategories(catData.categories || []);
        if (catData.categories?.length > 0 && !categoryId) {
          setCategoryId(catData.categories[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const finalImgs = [...imageUrls];
      if (imageUrl.trim() && !finalImgs.includes(imageUrl.trim()) && finalImgs.length < 5) {
        finalImgs.push(imageUrl.trim());
      }
      for (const v of colorVariants) {
        if (v.imageUrl?.trim() && !finalImgs.includes(v.imageUrl.trim()) && finalImgs.length < 5) {
          finalImgs.push(v.imageUrl.trim());
        }
      }

      const payload = {
        name: name.trim(),
        slug: slug.trim() || undefined,
        sku: sku.trim().toUpperCase(),
        categoryId: categoryId || categories[0]?.id || 'cat-1',
        description: description.trim(),
        purchaseCost: Number(purchaseCost) || 0,
        sellingPrice: Number(sellingPrice),
        salePrice: salePrice ? Number(salePrice) : null,
        stockQuantity: Number(stockQuantity) || 0,
        lowStockThreshold: Number(lowStockThreshold) || 5,
        isFeatured,
        images: finalImgs.slice(0, 5).map((url, idx) => ({
          url,
          isPrimary: idx === 0,
          sortOrder: idx,
        })),
        colorVariants: colorVariants.map((v, idx) => ({
          name: v.name.trim(),
          colorCode: v.colorCode.trim(),
          price: v.price != null && Number(v.price) > 0 ? Number(v.price) : null,
          imageUrl: v.imageUrl?.trim() || null,
          stockQuantity: Number(v.stockQuantity) || 0,
          isActive: Boolean(v.isActive),
          sortOrder: idx,
        })),
      };

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save product');
      }

      setShowAddModal(false);
      // Reset form
      setName('');
      setSlug('');
      setIsSlugCustomized(false);
      setSku('');
      setDescription('');
      setPurchaseCost('');
      setSellingPrice('');
      setSalePrice('');
      setImageUrl('');
      setImageUrls([]);
      setColorVariants([]);
      fetchData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error creating product';
      setFormError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-950">Product Catalog & Inventory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create products, configure pricing, manage low stock limits, and upload ImageKit CDN media.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-md shadow-amber-500/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchData()}
            placeholder="Search by product name, SKU, tags..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Total Products: <b>{products.length}</b>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Item</th>
                <th className="py-3.5 px-4">SKU</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Cost Price</th>
                <th className="py-3.5 px-4">Selling Price</th>
                <th className="py-3.5 px-4">Stock</th>
                <th className="py-3.5 px-4">Reviews & Rating</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Featured</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
                    <span>Loading catalog...</span>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No products found. Click &quot;Add New Product&quot; to create one.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const isLow = p.stockQuantity <= p.lowStockThreshold && p.stockQuantity > 0;
                  const isOut = p.stockQuantity <= 0;
                  const thumb = p.images?.[0]?.url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                          <img src={thumb} alt={p.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold text-slate-900 line-clamp-1">{p.name}</span>
                          <span className="block text-[10px] font-mono text-slate-400 truncate max-w-[190px]">
                            /product/{p.slug}
                          </span>
                          {p.colorVariants && p.colorVariants.length > 0 && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <div className="flex items-center -space-x-1">
                                {p.colorVariants.slice(0, 5).map((v: any, i: number) => (
                                  <span
                                    key={v.id || i}
                                    style={{ backgroundColor: v.colorCode }}
                                    className="w-3 h-3 rounded-full border border-white shadow-2xs inline-block"
                                    title={`${v.name} (${v.stockQuantity} in stock)`}
                                  />
                                ))}
                              </div>
                              <span className="text-[10px] font-bold text-slate-400">
                                {p.colorVariants.length} {p.colorVariants.length === 1 ? 'color' : 'colors'}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">{p.sku}</td>
                      <td className="py-3.5 px-4 text-slate-600">{p.category?.name || 'Category'}</td>
                      <td className="py-3.5 px-4 text-slate-500">{formatBDT(p.purchaseCost)}</td>
                      <td className="py-3.5 px-4 font-black text-slate-950">
                        {formatBDT(p.salePrice || p.sellingPrice)}
                        {p.salePrice && (
                          <span className="block text-[10px] text-slate-400 line-through">
                            {formatBDT(p.sellingPrice)}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-bold ${isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-slate-900'}`}>
                            {p.stockQuantity}
                          </span>
                          {isLow && (
                            <span title="Low stock threshold met">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <div className="flex items-center text-amber-500">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span className="font-black text-slate-900 ml-1">
                              {p.rating > 0 ? Number(p.rating).toFixed(1) : '0.0'}
                            </span>
                          </div>
                          <span className="text-[11px] font-bold text-slate-500">
                            ({p.reviewCount || 0})
                          </span>
                          <a
                            href={`/admin/reviews?search=${encodeURIComponent(p.name)}`}
                            className="text-[10px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200 transition"
                            title="Manage or add reviews for this product"
                          >
                            + Review
                          </a>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isOut
                            ? 'bg-red-100 text-red-800'
                            : isLow
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isOut ? 'OUT OF STOCK' : p.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {p.isFeatured ? (
                          <span className="text-amber-500 font-bold text-[10px] bg-amber-50 px-2 py-0.5 rounded-full">
                            ★ Featured
                          </span>
                        ) : (
                          <span className="text-slate-300 text-[10px]">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={`/product/${p.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="View Live Product Page"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                            title="Edit Product & Cover Image"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Archive Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6">
          <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl relative flex flex-col max-h-[92vh] overflow-hidden my-auto border border-slate-200">
            {/* Sticky Header */}
            <div className="px-6 py-4.5 sm:px-8 sm:py-5 border-b border-slate-200 flex items-center justify-between shrink-0 bg-white">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900">Add New Product to Catalog</h2>
                <p className="text-xs text-slate-500">Provide product specifications, pricing in BDT, media, and color variants.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleCreateProduct} className="overflow-y-auto flex-1 flex flex-col justify-between">
              <div className="p-5 sm:p-8 space-y-5 text-xs">
                {formError && (
                  <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-600 font-bold">
                    {formError}
                  </div>
                )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Product Title *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setName(val);
                      if (!isSlugCustomized) {
                        setSlug(slugify(val));
                      }
                    }}
                    placeholder="e.g. Wireless ANC Earbuds"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unique SKU Code *</label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value.toUpperCase())}
                    placeholder="e.g. TEM-TWS-009"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* SEO URL Slug Field */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 font-bold text-slate-800">
                    <Globe className="w-3.5 h-3.5 text-amber-500" />
                    <span>SEO URL Slug (Permalink)</span>
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Auto-generated from title • Editable
                  </span>
                </div>
                <div className="flex items-center rounded-xl border border-slate-300 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-amber-500">
                  <span className="px-3 py-2 text-slate-400 bg-slate-100 border-r border-slate-200 font-mono text-[11px] shrink-0 select-none">
                    /product/
                  </span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => {
                      setIsSlugCustomized(true);
                      setSlug(slugify(e.target.value));
                    }}
                    placeholder="product-url-slug"
                    className="w-full px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  Clean, lowercase, hyphen-separated. Determines the exact product URL for Google search and social share cards.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    required
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-slate-700">Product Images (Max 5)</label>
                    <span className="text-[10px] font-bold text-slate-400">
                      {imageUrls.length + (imageUrl.trim() ? 1 : 0)} / 5 images
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (imageUrl.trim() && imageUrls.length < 5 && !imageUrls.includes(imageUrl.trim())) {
                            setImageUrls([...imageUrls, imageUrl.trim()]);
                            setImageUrl('');
                          }
                        }
                      }}
                      placeholder="Paste Image URL / ImageKit CDN..."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (imageUrl.trim() && imageUrls.length < 5 && !imageUrls.includes(imageUrl.trim())) {
                          setImageUrls([...imageUrls, imageUrl.trim()]);
                          setImageUrl('');
                        }
                      }}
                      disabled={!imageUrl.trim() || imageUrls.length >= 5}
                      className="px-3 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl text-xs shrink-0 transition"
                    >
                      Add
                    </button>
                  </div>
                  {imageUrls.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {imageUrls.map((url, idx) => (
                        <div key={idx} className="relative group w-14 h-14 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 shrink-0">
                          <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                          <span className={`absolute bottom-0 inset-x-0 text-[8px] font-black text-center py-0.5 ${idx === 0 ? 'bg-red-600 text-white' : 'bg-slate-900/80 text-white'}`}>
                            {idx === 0 ? 'Cover' : `#${idx + 1}`}
                          </span>
                          <button
                            type="button"
                            onClick={() => setImageUrls(imageUrls.filter((_, i) => i !== idx))}
                            className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-600 text-white rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Purchase Cost (৳)</label>
                  <input
                    type="number"
                    value={purchaseCost}
                    onChange={(e) => setPurchaseCost(e.target.value)}
                    placeholder="1100"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Regular Price (৳) *</label>
                  <input
                    type="number"
                    required
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    placeholder="1850"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sale Price (৳)</label>
                  <input
                    type="number"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    placeholder="1599"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Initial Stock Quantity</label>
                  <input
                    type="number"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Low-Stock Alert Limit</label>
                  <input
                    type="number"
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Color Variants Section */}
              <ColorVariantsSection
                variants={colorVariants}
                onChange={setColorVariants}
                availableImages={[...imageUrls, ...(imageUrl.trim() ? [imageUrl.trim()] : [])]}
              />

              <div>
                <label className="block font-bold text-slate-700 mb-1">Product Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Key features, specifications, and warranty information..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featuredCheck"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-500"
                />
                <label htmlFor="featuredCheck" className="font-semibold text-slate-700">
                  Feature on Homepage Hero & Trending Grid
                </label>
              </div>

              </div>

              {/* Sticky Footer */}
              <div className="px-6 py-4 sm:px-8 border-t border-slate-200 bg-slate-50/90 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-white text-xs transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-slate-950 font-black rounded-xl text-xs shadow-md transition flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{submitting ? 'Saving to Database...' : 'Save Product'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6">
          <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl relative flex flex-col max-h-[92vh] overflow-hidden my-auto border border-slate-200">
            {/* Sticky Header */}
            <div className="px-6 py-4.5 sm:px-8 sm:py-5 border-b border-slate-200 flex items-center justify-between shrink-0 bg-white">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900">Edit Product & Variants</h2>
                <p className="text-xs text-slate-500">Update pricing, SKU, stock inventory, media, and color variants.</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleUpdateProduct} className="overflow-y-auto flex-1 flex flex-col justify-between">
              <div className="p-5 sm:p-8 space-y-5 text-xs">
                {editError && (
                  <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-600 font-bold">
                    {editError}
                  </div>
                )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Product Title *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g. Wireless ANC Earbuds"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unique SKU Code *</label>
                  <input
                    type="text"
                    required
                    value={editSku}
                    onChange={(e) => setEditSku(e.target.value.toUpperCase())}
                    placeholder="e.g. TEM-TWS-009"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* SEO URL Slug Field & 301 Redirect Advisory */}
              <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 font-bold text-slate-900">
                    <Globe className="w-4 h-4 text-amber-600" />
                    <span>SEO URL Slug (Permalink)</span>
                  </label>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                    301 Redirect Protected
                  </span>
                </div>
                <div className="flex items-center rounded-xl border border-amber-300 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-amber-500">
                  <span className="px-3 py-2 text-slate-400 bg-slate-100 border-r border-slate-200 font-mono text-[11px] shrink-0 select-none">
                    /product/
                  </span>
                  <input
                    type="text"
                    value={editSlug}
                    onChange={(e) => setEditSlug(slugify(e.target.value))}
                    placeholder="product-url-slug"
                    className="w-full px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none"
                  />
                </div>
                <div className="flex items-start gap-2 text-[11px] text-slate-600">
                  <span className="text-amber-600 font-bold shrink-0">⚡ SEO Note:</span>
                  <span>
                    If you change this slug, a permanent <strong>301 redirect</strong> will automatically be registered in the database so old backlinks, Facebook shares, and Google rankings never break.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    required
                    value={editCategoryId}
                    onChange={(e) => setEditCategoryId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-slate-700">Gallery & Cover Images (Max 5)</label>
                    <span className="text-[10px] font-bold text-slate-400">
                      {editImageUrls.length + (editImageUrl.trim() ? 1 : 0)} / 5 images
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={editImageUrl}
                      onChange={(e) => setEditImageUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (editImageUrl.trim() && editImageUrls.length < 5 && !editImageUrls.includes(editImageUrl.trim())) {
                            setEditImageUrls([...editImageUrls, editImageUrl.trim()]);
                            setEditImageUrl('');
                          }
                        }
                      }}
                      placeholder="Paste Image URL / ImageKit CDN..."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (editImageUrl.trim() && editImageUrls.length < 5 && !editImageUrls.includes(editImageUrl.trim())) {
                          setEditImageUrls([...editImageUrls, editImageUrl.trim()]);
                          setEditImageUrl('');
                        }
                      }}
                      disabled={!editImageUrl.trim() || editImageUrls.length >= 5}
                      className="px-3 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl text-xs shrink-0 transition"
                    >
                      Add
                    </button>
                  </div>
                  {editImageUrls.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {editImageUrls.map((url, idx) => (
                        <div key={idx} className="relative group w-14 h-14 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 shrink-0">
                          <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                          <span className={`absolute bottom-0 inset-x-0 text-[8px] font-black text-center py-0.5 ${idx === 0 ? 'bg-red-600 text-white' : 'bg-slate-900/80 text-white'}`}>
                            {idx === 0 ? 'Cover' : `#${idx + 1}`}
                          </span>
                          {idx !== 0 && (
                            <button
                              type="button"
                              title="Make Primary Cover"
                              onClick={() => {
                                const reordered = [url, ...editImageUrls.filter((_, i) => i !== idx)];
                                setEditImageUrls(reordered);
                              }}
                              className="absolute top-0.5 left-0.5 w-4 h-4 bg-amber-500 text-slate-950 rounded-full flex items-center justify-center text-[9px] font-bold opacity-0 group-hover:opacity-100 transition shadow"
                            >
                              ★
                            </button>
                          )}
                          <button
                            type="button"
                            title="Remove Image"
                            onClick={() => setEditImageUrls(editImageUrls.filter((_, i) => i !== idx))}
                            className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-600 text-white rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition shadow"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Purchase Cost (৳)</label>
                  <input
                    type="number"
                    value={editPurchaseCost}
                    onChange={(e) => setEditPurchaseCost(e.target.value)}
                    placeholder="1100"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Regular Price (৳) *</label>
                  <input
                    type="number"
                    required
                    value={editSellingPrice}
                    onChange={(e) => setEditSellingPrice(e.target.value)}
                    placeholder="1850"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sale Price (৳)</label>
                  <input
                    type="number"
                    value={editSalePrice}
                    onChange={(e) => setEditSalePrice(e.target.value)}
                    placeholder="1599"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    value={editStockQuantity}
                    onChange={(e) => setEditStockQuantity(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Low-Stock Alert Limit</label>
                  <input
                    type="number"
                    value={editLowStockThreshold}
                    onChange={(e) => setEditLowStockThreshold(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Color Variants Section */}
              <ColorVariantsSection
                variants={editColorVariants}
                onChange={setEditColorVariants}
                availableImages={[...editImageUrls, ...(editImageUrl.trim() ? [editImageUrl.trim()] : [])]}
              />

              <div>
                <label className="block font-bold text-slate-700 mb-1">Product Description</label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Key features, specifications, and warranty information..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editIsFeatured"
                  checked={editIsFeatured}
                  onChange={(e) => setEditIsFeatured(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-400"
                />
                <label htmlFor="editIsFeatured" className="text-slate-700 font-bold cursor-pointer">
                  Feature on Homepage Hero & Trending Grid
                </label>
              </div>

              </div>

              {/* Sticky Footer */}
              <div className="px-6 py-4 sm:px-8 border-t border-slate-200 bg-slate-50/90 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-white text-xs transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-slate-950 font-black rounded-xl text-xs shadow-md transition flex items-center gap-2"
                >
                  {submittingEdit && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{submittingEdit ? 'Updating Changes...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
