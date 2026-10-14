'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  id: string; // product id
  name: string;
  slug: string;
  sku: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  quantity: number;
  stockQuantity: number;
  selectedColor?: string;
  variantId?: string;
  itemKey?: string;
}

export interface AppliedCoupon {
  code: string;
  discountAmount: number;
  discountType?: 'PERCENTAGE' | 'FIXED_BDT';
  message?: string;
}

export interface StoreSettings {
  freeDeliveryEnabled: boolean;
  freeDeliveryThreshold: number;
  freeDeliveryOutsideThreshold?: number;
  freeDeliveryBannerText: string;
  freeDeliveryUnlockedText: string;
  freeDeliveryBarColor?: 'amber' | 'emerald' | 'indigo' | 'rose';
  minOrderAmount?: number;
  cardStepperEnabled: boolean;
  cardShowDiscountBadge?: boolean;
  cardShowRating?: boolean;
  cardShowStockWarning?: boolean;
  reviewAutoApprove: boolean;
  reviewAllowImages?: boolean;
  reviewMinCharacters?: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (id: string, selectedColor?: string) => void;
  updateQuantity: (id: string, quantity: number, selectedColor?: string) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  appliedCoupon: AppliedCoupon | null;
  applyCoupon: (coupon: AppliedCoupon) => void;
  removeCoupon: () => void;
  discountAmount: number;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  storeSettings: StoreSettings | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);

  const getItemKey = (i: { id: string; selectedColor?: string }) =>
    `${i.id}_${i.selectedColor || 'default'}`;

  // Load store settings
  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.settings) setStoreSettings(d.settings);
      })
      .catch(() => {});
  }, []);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('toto_cart');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setItems(parsed.map((item) => ({ ...item, itemKey: item.itemKey || getItemKey(item) })));
        }
      }
      const storedCoupon = localStorage.getItem('toto_coupon');
      if (storedCoupon) {
        setAppliedCoupon(JSON.parse(storedCoupon));
      }
    } catch {
      // ignore
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem('toto_cart', JSON.stringify(items));
      } catch {
        // ignore
      }
    }
  }, [items, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      try {
        if (appliedCoupon) {
          localStorage.setItem('toto_coupon', JSON.stringify(appliedCoupon));
        } else {
          localStorage.removeItem('toto_coupon');
        }
      } catch {
        // ignore
      }
    }
  }, [appliedCoupon, isLoaded]);

  const addItem = (product: Omit<CartItem, 'quantity'>, qty = 1) => {
    const key = product.itemKey || getItemKey(product);
    setItems((prev) => {
      const existing = prev.find((i) => (i.itemKey || getItemKey(i)) === key);
      if (existing) {
        const newQty = Math.min(existing.quantity + qty, product.stockQuantity || 99);
        return prev.map((i) => ((i.itemKey || getItemKey(i)) === key ? { ...i, quantity: newQty } : i));
      }
      return [...prev, { ...product, itemKey: key, quantity: Math.min(qty, product.stockQuantity || 99) }];
    });
    setIsDrawerOpen(true);
  };

  const removeItem = (idOrKey: string, selectedColor?: string) => {
    setItems((prev) =>
      prev.filter((i) => {
        if (selectedColor !== undefined) {
          return !(i.id === idOrKey && (i.selectedColor || '') === (selectedColor || ''));
        }
        const key = i.itemKey || getItemKey(i);
        return key !== idOrKey && i.id !== idOrKey;
      })
    );
  };

  const updateQuantity = (idOrKey: string, qty: number, selectedColor?: string) => {
    if (qty <= 0) {
      removeItem(idOrKey, selectedColor);
      return;
    }
    setItems((prev) =>
      prev.map((i) => {
        const match = selectedColor !== undefined
          ? i.id === idOrKey && (i.selectedColor || '') === (selectedColor || '')
          : (i.itemKey || getItemKey(i)) === idOrKey || i.id === idOrKey;
        return match ? { ...i, quantity: Math.min(qty, i.stockQuantity || 99) } : i;
      })
    );
  };

  const applyCoupon = (coupon: AppliedCoupon) => {
    setAppliedCoupon(coupon);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = appliedCoupon ? Math.min(subtotal, appliedCoupon.discountAmount) : 0;

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        itemCount,
        subtotal,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        discountAmount,
        isDrawerOpen,
        setIsDrawerOpen,
        storeSettings,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
