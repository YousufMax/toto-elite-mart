export interface SeedCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  sortOrder: number;
}

export interface SeedColorVariant {
  id?: string;
  name: string;
  colorCode: string;
  price?: number | null;
  imageUrl?: string;
  stockQuantity: number;
  isActive?: boolean;
  sortOrder?: number;
}

export interface SeedProduct {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  categorySlug: string;
  purchaseCost: number;
  sellingPrice: number;
  salePrice?: number;
  stockQuantity: number;
  lowStockThreshold: number;
  isFeatured: boolean;
  tags: string;
  images: Array<{ url: string; isPrimary: boolean }>;
  colorVariants?: SeedColorVariant[];
}

export interface SeedBanner {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  targetUrl: string;
  sortOrder: number;
}

export interface SeedCoupon {
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED_BDT';
  discountValue: number;
  minOrderValue: number;
  maxDiscountValue?: number;
  usageLimit: number;
}

export const SEED_CATEGORIES: SeedCategory[] = [
  {
    id: 'cat-1',
    name: 'Smart Gadgets & Audio',
    slug: 'smart-gadgets',
    description: 'TWS earbuds, smartwatches, power banks & mobile accessories.',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
    sortOrder: 1,
  },
  {
    id: 'cat-2',
    name: 'Fashion & Lifestyle',
    slug: 'fashion-lifestyle',
    description: 'Premium panjabis, polo shirts, stylish watches & genuine leather wallets.',
    imageUrl: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&auto=format&fit=crop&q=80',
    sortOrder: 2,
  },
  {
    id: 'cat-3',
    name: 'Organic & Food Essentials',
    slug: 'organic-food',
    description: '100% pure Sundarban honey, mustard oil, premium ghee & nuts.',
    imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80',
    sortOrder: 3,
  },
  {
    id: 'cat-4',
    name: 'Home & Kitchen Appliances',
    slug: 'home-kitchen',
    description: 'Modern blenders, electric kettles, cookware & air fryers.',
    imageUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop&q=80',
    sortOrder: 4,
  },
  {
    id: 'cat-5',
    name: 'Beauty & Personal Care',
    slug: 'beauty-personal-care',
    description: 'Authentic skincare, hair oils, grooming kits & organic soaps.',
    imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80',
    sortOrder: 5,
  },
];

export const SEED_PRODUCTS: SeedProduct[] = [
  {
    id: 'prod-1',
    name: 'Pro ANC Wireless Earbuds with ENC Mic',
    slug: 'pro-anc-wireless-earbuds',
    sku: 'TEM-TWS-001',
    description: 'Active Noise Cancellation up to 35dB, 40 hours total playtime with charging case, Bluetooth 5.3, IPX5 water resistance. Ultra-low latency for gaming.',
    categorySlug: 'smart-gadgets',
    purchaseCost: 1100,
    sellingPrice: 1850,
    salePrice: 1599,
    stockQuantity: 45,
    lowStockThreshold: 10,
    isFeatured: true,
    tags: 'earbuds, audio, bluetooth, wireless, anc',
    images: [
      { url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=800&auto=format&fit=crop&q=80', isPrimary: false },
    ],
    colorVariants: [
      { id: 'var-tws-1', name: 'Matte Black', colorCode: '#111827', imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80', stockQuantity: 25, isActive: true, sortOrder: 0 },
      { id: 'var-tws-2', name: 'Pearl White', colorCode: '#F8FAFC', imageUrl: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=800&auto=format&fit=crop&q=80', stockQuantity: 15, isActive: true, sortOrder: 1 },
      { id: 'var-tws-3', name: 'Midnight Blue', colorCode: '#1E3A8A', imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80', stockQuantity: 5, isActive: true, sortOrder: 2 },
    ],
  },
  {
    id: 'prod-2',
    name: 'AMOLED Smart Watch with BT Calling',
    slug: 'amoled-smart-watch-bt-calling',
    sku: 'TEM-SWT-002',
    description: '1.43" HD AMOLED Always-On Display, crystal clear Bluetooth calling, 120+ sports modes, 24/7 heart rate & SpO2 monitor. Zinc alloy metallic body.',
    categorySlug: 'smart-gadgets',
    purchaseCost: 1800,
    sellingPrice: 2890,
    salePrice: 2490,
    stockQuantity: 28,
    lowStockThreshold: 5,
    isFeatured: true,
    tags: 'smartwatch, fitness, amoled, bluetooth call',
    images: [
      { url: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&auto=format&fit=crop&q=80', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&auto=format&fit=crop&q=80', isPrimary: false },
    ],
    colorVariants: [
      { id: 'var-swt-1', name: 'Space Black', colorCode: '#18181B', imageUrl: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&auto=format&fit=crop&q=80', stockQuantity: 14, isActive: true, sortOrder: 0 },
      { id: 'var-swt-2', name: 'Silver Chrome', colorCode: '#CBD5E1', imageUrl: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&auto=format&fit=crop&q=80', stockQuantity: 10, isActive: true, sortOrder: 1 },
      { id: 'var-swt-3', name: 'Rose Gold', colorCode: '#FB7185', imageUrl: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&auto=format&fit=crop&q=80', stockQuantity: 4, isActive: true, sortOrder: 2 },
    ],
  },
  {
    id: 'prod-3',
    name: '20000mAh 22.5W Fast Charging Power Bank',
    slug: '20000mah-fast-charging-power-bank',
    sku: 'TEM-PB-003',
    description: 'PD 20W + QC 3.0 dual fast charging ports, smart LED digital display showing exact battery percentage, airplane safe, multi-layer circuit protection.',
    categorySlug: 'smart-gadgets',
    purchaseCost: 950,
    sellingPrice: 1650,
    salePrice: 1399,
    stockQuantity: 62,
    lowStockThreshold: 12,
    isFeatured: false,
    tags: 'powerbank, charger, mobile accessory, travel',
    images: [
      { url: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800&auto=format&fit=crop&q=80', isPrimary: true },
    ],
  },
  {
    id: 'prod-4',
    name: 'Premium Semi-Pure Silk Designer Panjabi',
    slug: 'premium-semi-pure-silk-designer-panjabi',
    sku: 'TEM-PAN-004',
    description: 'Exquisite jacquard weaving with embroidered collar & placket. Breathable and comfortable for festive occasions, weddings and Eid.',
    categorySlug: 'fashion-lifestyle',
    purchaseCost: 1400,
    sellingPrice: 2450,
    salePrice: 2150,
    stockQuantity: 30,
    lowStockThreshold: 6,
    isFeatured: true,
    tags: 'panjabi, eid collection, traditional, fashion',
    images: [
      { url: 'https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?w=800&auto=format&fit=crop&q=80', isPrimary: true },
    ],
    colorVariants: [
      { id: 'var-pan-1', name: 'Royal Navy', colorCode: '#0F172A', imageUrl: 'https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?w=800&auto=format&fit=crop&q=80', stockQuantity: 12, isActive: true, sortOrder: 0 },
      { id: 'var-pan-2', name: 'Emerald Green', colorCode: '#065F46', imageUrl: 'https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?w=800&auto=format&fit=crop&q=80', stockQuantity: 10, isActive: true, sortOrder: 1 },
      { id: 'var-pan-3', name: 'Crimson Maroon', colorCode: '#831843', imageUrl: 'https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?w=800&auto=format&fit=crop&q=80', stockQuantity: 8, isActive: true, sortOrder: 2 },
    ],
  },
  {
    id: 'prod-5',
    name: 'Genuine Cowhide Leather Bi-fold Wallet',
    slug: 'genuine-cowhide-leather-bifold-wallet',
    sku: 'TEM-WAL-005',
    description: '100% full grain genuine leather with RFID blocking protection. 8 card slots, 2 currency compartments, and dedicated coin pocket.',
    categorySlug: 'fashion-lifestyle',
    purchaseCost: 550,
    sellingPrice: 1150,
    salePrice: 890,
    stockQuantity: 4, // Intentionally low stock to test alerts!
    lowStockThreshold: 8,
    isFeatured: false,
    tags: 'wallet, leather, accessories, gift',
    images: [
      { url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=80', isPrimary: true },
    ],
  },
  {
    id: 'prod-6',
    name: 'Pure Raw Sundarban Wild Honey (500g)',
    slug: 'pure-raw-sundarban-wild-honey-500g',
    sku: 'TEM-HNY-006',
    description: 'Directly collected from the deep mangrove forest of Sundarban. Unprocessed, unheated, free from artificial sugar or chemical preservatives.',
    categorySlug: 'organic-food',
    purchaseCost: 450,
    sellingPrice: 850,
    salePrice: 750,
    stockQuantity: 50,
    lowStockThreshold: 15,
    isFeatured: true,
    tags: 'honey, organic, sundarban, natural food',
    images: [
      { url: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&auto=format&fit=crop&q=80', isPrimary: true },
    ],
  },
  {
    id: 'prod-7',
    name: 'Cold Pressed Wood Pressed Mustard Oil (1 Litre)',
    slug: 'cold-pressed-mustard-oil-1l',
    sku: 'TEM-OIL-007',
    description: 'Traditional Ghani wood-pressed pure mustard oil from premium Bangladeshi mustard seeds. Rich pungent aroma and natural health benefits.',
    categorySlug: 'organic-food',
    purchaseCost: 220,
    sellingPrice: 380,
    salePrice: 340,
    stockQuantity: 80,
    lowStockThreshold: 20,
    isFeatured: false,
    tags: 'mustard oil, ghani, organic, cooking',
    images: [
      { url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&auto=format&fit=crop&q=80', isPrimary: true },
    ],
  },
  {
    id: 'prod-8',
    name: 'Digital Touch Screen Air Fryer 5.5L',
    slug: 'digital-touch-screen-air-fryer-5-5l',
    sku: 'TEM-AF-008',
    description: '85% less oil frying, 360-degree rapid air heating, 8 preset cooking programs, non-stick detachable basket, easy dishwasher safe cleanup.',
    categorySlug: 'home-kitchen',
    purchaseCost: 3800,
    sellingPrice: 6200,
    salePrice: 5490,
    stockQuantity: 15,
    lowStockThreshold: 4,
    isFeatured: true,
    tags: 'air fryer, kitchen, appliance, healthy cooking',
    images: [
      { url: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=800&auto=format&fit=crop&q=80', isPrimary: true },
    ],
  },
  {
    id: 'prod-9',
    name: '1.8L Double Wall Stainless Steel Electric Kettle',
    slug: 'double-wall-electric-kettle-1-8l',
    sku: 'TEM-KET-009',
    description: '1500W rapid boil, food-grade 304 stainless steel interior, anti-scalding cool-touch exterior, auto shut-off & boil-dry protection.',
    categorySlug: 'home-kitchen',
    purchaseCost: 750,
    sellingPrice: 1350,
    salePrice: 1150,
    stockQuantity: 34,
    lowStockThreshold: 8,
    isFeatured: false,
    tags: 'kettle, tea, appliances, kitchen',
    images: [
      { url: 'https://images.unsplash.com/photo-1594213114663-d94db9e1f126?w=800&auto=format&fit=crop&q=80', isPrimary: true },
    ],
  },
  {
    id: 'prod-1791700536997',
    name: 'Cooker',
    slug: 'rice-cooker-eg-45',
    sku: 'EG-45',
    description: 'Multifunctional premium electric cooker with non-stick inner pot, automatic keep-warm mode, and energy-saving fast heating.',
    categorySlug: 'home-kitchen',
    purchaseCost: 1200,
    sellingPrice: 2000,
    salePrice: 1700,
    stockQuantity: 20,
    lowStockThreshold: 5,
    isFeatured: true,
    tags: 'cooker, rice cooker, kitchen essentials, electric',
    images: [
      { url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSjpBzss83dv8MZQncjUSnrqblwMgw2NZAKxkdh5PUbiA&s=10', isPrimary: true },
    ],
  },
];

export const SEED_BANNERS: SeedBanner[] = [
  {
    id: 'ban-1',
    title: 'Grand Opening Special — Toto Elite Mart',
    subtitle: 'Flat ৳100 off on your first order! Use code WELCOME100',
    imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1600&auto=format&fit=crop&q=80',
    targetUrl: '/shop',
    sortOrder: 1,
  },
  {
    id: 'ban-2',
    title: 'Top Gadgets & Audio Gear',
    subtitle: 'Experience true wireless freedom with ANC earbuds & smartwatches.',
    imageUrl: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=1600&auto=format&fit=crop&q=80',
    targetUrl: '/shop?category=smart-gadgets',
    sortOrder: 2,
  },
  {
    id: 'ban-3',
    title: '100% Pure Organic Delights',
    subtitle: 'From Sundarban wild honey to traditional wood-pressed oils.',
    imageUrl: 'https://images.unsplash.com/photo-1506484381205-f7945653044d?w=1600&auto=format&fit=crop&q=80',
    targetUrl: '/shop?category=organic-food',
    sortOrder: 3,
  },
];

export const SEED_COUPONS: SeedCoupon[] = [
  {
    code: 'WELCOME100',
    discountType: 'FIXED_BDT',
    discountValue: 100,
    minOrderValue: 800,
    usageLimit: 1000,
  },
  {
    code: 'ELITE10',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    minOrderValue: 1500,
    maxDiscountValue: 300,
    usageLimit: 500,
  },
];
