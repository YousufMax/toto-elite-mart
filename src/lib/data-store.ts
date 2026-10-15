import fs from 'fs';
import path from 'path';
import { prisma } from './prisma';
import { hashPassword } from './auth';
import {
  SEED_CATEGORIES,
  SEED_PRODUCTS,
  SEED_BANNERS,
  SEED_COUPONS,
} from './seed-data';
import { calculateOrderTotals } from './currency';
import { queueNotification } from './telegram';
import { logAudit } from './audit';
import { normalizeBdPhone } from './fraud-engine';

const STORE_FILE = path.join(process.cwd(), 'data', 'local-store.json');

// In-memory fallback cache when PostgreSQL is not yet connected
interface GlobalMemoryStore {
  fallbackInitialized: boolean;
  categories: any[];
  products: any[];
  orders: any[];
  expenses: any[];
  banners: any[];
  coupons: any[];
  movements: any[];
  users: any[];
  settings?: Record<string, any>;
  reviews?: any[];
  rewards?: Record<string, any>;
  fraudBlacklist?: string[];
  fraudWhitelist?: string[];
  flashSaleCampaigns?: any[];
}

export function saveStoreToDisk() {
  try {
    const store = getStore();
    const dir = path.dirname(STORE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (e) {
    // ignore
  }
}

function loadStoreFromDisk(): GlobalMemoryStore | null {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const content = fs.readFileSync(STORE_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.products) && parsed.products.length > 0) {
        // Ensure colorVariants is initialized on all products
        for (const p of parsed.products) {
          if (!p.colorVariants || p.colorVariants.length === 0) {
            const seed = SEED_PRODUCTS.find((sp) => sp.id === p.id || sp.sku === p.sku);
            if (seed && seed.colorVariants && seed.colorVariants.length > 0) {
              p.colorVariants = seed.colorVariants.map((cv, idx) => ({
                id: cv.id || `var-${p.id}-${idx}`,
                productId: p.id,
                name: cv.name,
                colorCode: cv.colorCode,
                price: cv.price != null && Number(cv.price) > 0 ? Number(cv.price) : null,
                imageUrl: cv.imageUrl || null,
                stockQuantity: cv.stockQuantity,
                isActive: cv.isActive !== false,
                sortOrder: cv.sortOrder ?? idx,
                createdAt: new Date(),
                updatedAt: new Date(),
              }));
            } else {
              p.colorVariants = p.colorVariants || [];
            }
          } else {
            // Ensure price is preserved on existing variants
            for (const cv of p.colorVariants) {
              cv.price = cv.price != null && Number(cv.price) > 0 ? Number(cv.price) : null;
            }
          }

          // Synchronize master product stock with active color variants
          if (p.colorVariants && p.colorVariants.length > 0) {
            const activeVarStock = p.colorVariants
              .filter((cv: any) => cv.isActive !== false)
              .reduce((sum: number, cv: any) => sum + (Number(cv.stockQuantity) || 0), 0);
            if (activeVarStock > 0 && (Number(p.stockQuantity) || 0) <= 0) {
              p.stockQuantity = activeVarStock;
              p.status = 'ACTIVE';
            } else if (activeVarStock > 0 && Number(p.stockQuantity) < activeVarStock) {
              p.stockQuantity = activeVarStock;
              p.status = 'ACTIVE';
            }
          }
        }
        return parsed;
      }
    }
  } catch (e) {
    // ignore
  }
  return null;
}

function getStore(): GlobalMemoryStore {
  if (!(globalThis as any).__totoGlobalMemoryStore) {
    const diskData = loadStoreFromDisk();
    if (diskData) {
      (globalThis as any).__totoGlobalMemoryStore = diskData;
    } else {
      (globalThis as any).__totoGlobalMemoryStore = {
        fallbackInitialized: false,
        categories: [...SEED_CATEGORIES],
        products: [],
        orders: [],
        expenses: [],
        banners: [...SEED_BANNERS],
        coupons: SEED_COUPONS.map((c) => ({ ...c, isActive: true })),
        movements: [],
        users: [],
        settings: {
          freeDeliveryEnabled: true,
          freeDeliveryThreshold: 1500,
          freeDeliveryBannerText: 'Add ৳{remaining} more for FREE Delivery! 🚚',
          freeDeliveryUnlockedText: '🎉 You have unlocked FREE Delivery!',
          cardStepperEnabled: true,
          reviewAutoApprove: true,
        },
        reviews: [],
      };
    }
  }

  const currentStore = (globalThis as any).__totoGlobalMemoryStore;
  if (!currentStore.settings) {
    currentStore.settings = { ...DEFAULT_STORE_SETTINGS };
  } else {
    currentStore.settings = { ...DEFAULT_STORE_SETTINGS, ...currentStore.settings };
  }
  if (!currentStore.rewards) {
    currentStore.rewards = {};
  }
  if (!Array.isArray(currentStore.fraudBlacklist)) {
    currentStore.fraudBlacklist = [];
  }
  if (!Array.isArray(currentStore.fraudWhitelist)) {
    currentStore.fraudWhitelist = [];
  }
  if (!Array.isArray(currentStore.flashSaleCampaigns) || currentStore.flashSaleCampaigns.length === 0) {
    const now = new Date();
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    currentStore.flashSaleCampaigns = [
      {
        id: 'fsc-seed-1',
        title: 'Flash Sale Discounts',
        subtitle: 'Limited stock discounts on selected customer favourites',
        bannerUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&auto=format&fit=crop&q=80',
        startDate: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        endDate: threeDaysLater.toISOString(),
        status: 'ACTIVE',
        isActive: true,
        items: [
          {
            id: 'fsi-1',
            campaignId: 'fsc-seed-1',
            productId: 'prod-1',
            flashPrice: 1199,
            originalPrice: 1850,
            allocatedStock: 30,
            soldCount: 18,
            sortOrder: 1,
          },
          {
            id: 'fsi-2',
            campaignId: 'fsc-seed-1',
            productId: 'prod-6',
            flashPrice: 750,
            originalPrice: 950,
            allocatedStock: 25,
            soldCount: 16,
            sortOrder: 2,
          },
          {
            id: 'fsi-3',
            campaignId: 'fsc-seed-1',
            productId: 'prod-2',
            flashPrice: 799,
            originalPrice: 1250,
            allocatedStock: 20,
            soldCount: 14,
            sortOrder: 3,
          },
          {
            id: 'fsi-4',
            campaignId: 'fsc-seed-1',
            productId: 'prod-4',
            flashPrice: 1599,
            originalPrice: 2450,
            allocatedStock: 15,
            soldCount: 11,
            sortOrder: 4,
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }
  if (!Array.isArray(currentStore.reviews) || currentStore.reviews.length === 0) {
    currentStore.reviews = [
      {
        id: 'rev-seed-1',
        productId: 'prod-1',
        customerName: 'Tanvir Ahmed',
        customerPhone: '01712******',
        rating: 5,
        comment: 'The active noise cancellation is remarkably good for this price. Battery easily lasts 2 days of heavy usage. Toto Elite Mart delivered to Khulna within 48 hours!',
        images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600'],
        isVerified: true,
        status: 'APPROVED',
        createdAt: new Date('2026-10-10T10:00:00Z'),
      },
      {
        id: 'rev-seed-2',
        productId: 'prod-1',
        customerName: 'Nusrat Jahan',
        customerPhone: '01819******',
        rating: 5,
        comment: 'Great sound quality and bass. Premium matte finish feels solid in hand. Very satisfied with Toto Elite Mart packaging!',
        images: ['https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=600'],
        isVerified: true,
        status: 'APPROVED',
        createdAt: new Date('2026-10-11T14:30:00Z'),
      },
      {
        id: 'rev-seed-3',
        productId: 'prod-6',
        customerName: 'Kamrul Islam',
        customerPhone: '01911******',
        rating: 5,
        comment: '১০০% খাঁটি সুন্দরবনের মধু! স্বাদ ও প্রাকৃতিক ঘ্রাণ অসাধারণ। বাজারের ভেজাল মধুর চেয়ে সম্পূর্ণ আলাদা। ডেলিভারি সার্ভিসও চমৎকার।',
        images: ['https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600'],
        isVerified: true,
        status: 'APPROVED',
        createdAt: new Date('2026-10-12T16:00:00Z'),
      },
      {
        id: 'rev-seed-4',
        productId: 'prod-1791833597889',
        customerName: 'Farhana Akter',
        customerPhone: '01623******',
        rating: 5,
        comment: 'কাপড় ও এমব্রয়ডারি কোয়ালিটি অত্যন্ত প্রিমিয়াম। ছবির চেয়ে বাস্তবে আরো বেশি সুন্দর! সাইজ একদম পারফেক্ট।',
        images: ['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600'],
        isVerified: true,
        status: 'APPROVED',
        createdAt: new Date('2026-10-13T12:00:00Z'),
      },
      {
        id: 'rev-seed-5',
        productId: 'prod-1791994778690',
        customerName: 'Sultana Razia',
        customerPhone: '01552******',
        rating: 5,
        comment: 'Water dispenser is working perfectly. Fast delivery and original product received. Highly recommended!',
        images: ['https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRR_GpeJl6UD_-TTvBf3ToNORhd3dX920IBlsk6sKWJtw&s=10'],
        isVerified: true,
        status: 'APPROVED',
        createdAt: new Date('2026-10-14T09:00:00Z'),
      },
    ];
  }
  return currentStore;
}

const memoryCategories = new Proxy([] as any[], {
  get(_, prop) {
    const arr = getStore().categories;
    const val = (arr as any)[prop];
    return typeof val === 'function' ? val.bind(arr) : val;
  },
  set(_, prop, value) {
    (getStore().categories as any)[prop] = value;
    saveStoreToDisk();
    return true;
  },
});

const memoryProducts = new Proxy([] as any[], {
  get(_, prop) {
    const arr = getStore().products;
    const val = (arr as any)[prop];
    return typeof val === 'function' ? val.bind(arr) : val;
  },
  set(_, prop, value) {
    (getStore().products as any)[prop] = value;
    saveStoreToDisk();
    return true;
  },
});

const memoryOrders = new Proxy([] as any[], {
  get(_, prop) {
    const arr = getStore().orders;
    const val = (arr as any)[prop];
    return typeof val === 'function' ? val.bind(arr) : val;
  },
  set(_, prop, value) {
    (getStore().orders as any)[prop] = value;
    saveStoreToDisk();
    return true;
  },
});

const memoryExpenses = new Proxy([] as any[], {
  get(_, prop) {
    const arr = getStore().expenses;
    const val = (arr as any)[prop];
    return typeof val === 'function' ? val.bind(arr) : val;
  },
  set(_, prop, value) {
    (getStore().expenses as any)[prop] = value;
    saveStoreToDisk();
    return true;
  },
});

const memoryBanners = new Proxy([] as any[], {
  get(_, prop) {
    const arr = getStore().banners;
    const val = (arr as any)[prop];
    return typeof val === 'function' ? val.bind(arr) : val;
  },
  set(_, prop, value) {
    (getStore().banners as any)[prop] = value;
    saveStoreToDisk();
    return true;
  },
});

const memoryCoupons = new Proxy([] as any[], {
  get(_, prop) {
    const arr = getStore().coupons;
    const val = (arr as any)[prop];
    return typeof val === 'function' ? val.bind(arr) : val;
  },
  set(_, prop, value) {
    (getStore().coupons as any)[prop] = value;
    saveStoreToDisk();
    return true;
  },
});

const memoryMovements = new Proxy([] as any[], {
  get(_, prop) {
    const arr = getStore().movements;
    const val = (arr as any)[prop];
    return typeof val === 'function' ? val.bind(arr) : val;
  },
  set(_, prop, value) {
    (getStore().movements as any)[prop] = value;
    return true;
  },
});

const memoryUsers = new Proxy([] as any[], {
  get(_, prop) {
    const arr = getStore().users;
    const val = (arr as any)[prop];
    return typeof val === 'function' ? val.bind(arr) : val;
  },
  set(_, prop, value) {
    (getStore().users as any)[prop] = value;
    return true;
  },
});

async function initMemoryFallback() {
  const store = getStore();
  if (store.fallbackInitialized) return;
  const adminHash = await hashPassword('admin123');
  store.users = [
    {
      id: 'usr-admin-1',
      email: 'admin@totoelitemart.com',
      passwordHash: adminHash,
      fullName: 'Super Administrator',
      phone: '01711000000',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      createdAt: new Date(),
    },
    {
      id: 'usr-order-1',
      email: 'orders@totoelitemart.com',
      passwordHash: adminHash,
      fullName: 'Order Operations Manager',
      phone: '01811000000',
      role: 'ORDER_MANAGER',
      status: 'ACTIVE',
      createdAt: new Date(),
    },
  ];

  for (const sp of SEED_PRODUCTS) {
    const exists = store.products.some((p) => p.id === sp.id || p.sku === sp.sku);
    if (!exists) {
      const cat = store.categories.find((c) => c.slug === sp.categorySlug);
      store.products.push({
        ...sp,
        categoryId: cat?.id || 'cat-1',
        category: cat || store.categories[0],
        status: sp.stockQuantity > 0 ? 'ACTIVE' : 'OUT_OF_STOCK',
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        colorVariants: sp.colorVariants ? sp.colorVariants.map((cv, cIdx) => ({
          id: cv.id || `var-${sp.id}-${cIdx}`,
          productId: sp.id,
          name: cv.name,
          colorCode: cv.colorCode,
          price: cv.price != null && Number(cv.price) > 0 ? Number(cv.price) : null,
          imageUrl: cv.imageUrl || null,
          stockQuantity: cv.stockQuantity,
          isActive: cv.isActive !== false,
          sortOrder: cv.sortOrder ?? cIdx,
          createdAt: new Date(),
          updatedAt: new Date(),
        })) : [],
        images: sp.images.map((img, idx) => ({
          id: `img-${sp.id}-${idx}`,
          productId: sp.id,
          url: img.url,
          fileId: `file-${sp.id}-${idx}`,
          isPrimary: img.isPrimary,
          sortOrder: idx,
        })),
      });
    }
  }

  // Seed sample initial order
  if (store.orders.length === 0) {
    const sampleOrderItems = [
      {
        id: 'item-1',
        productId: 'prod-1',
        productName: 'Pro ANC Wireless Earbuds with ENC Mic',
        sku: 'TEM-TWS-001',
        unitPrice: 1599,
        purchaseCost: 1100,
        quantity: 1,
        totalPrice: 1599,
      },
    ];
    store.orders = [
      {
        id: 'ord-1001',
        orderNumber: 'TEM-2026-10001',
        customerName: 'Rafiqul Islam',
        customerPhone: '01712345678',
        deliveryAddress: 'House 42, Road 11, Banani',
        deliveryCity: 'Dhaka',
        deliveryZone: 'Inside Dhaka',
        subtotal: 1599,
        discount: 0,
        couponCode: null,
        deliveryFee: 60,
        totalAmount: 1659,
        paymentMethod: 'COD',
        paymentStatus: 'UNPAID',
        orderStatus: 'PENDING',
        notes: 'Please call before delivery',
        items: sampleOrderItems,
        createdAt: new Date(Date.now() - 3600 * 1000 * 2),
        updatedAt: new Date(),
      },
    ];
  }

  // Seed sample expenses
  if (store.expenses.length === 0) {
    store.expenses = [
      {
        id: 'exp-1',
        expenseDate: new Date(),
        category: 'Packaging',
        description: 'Custom corrugated boxes & bubble wrap roll',
        amount: 4500,
        paymentMethod: 'COD',
        createdAt: new Date(),
      },
      {
        id: 'exp-2',
        expenseDate: new Date(Date.now() - 86400000 * 3),
        category: 'Logistics',
        description: 'Pathao courier hub delivery shipment settlement',
        amount: 1850,
        paymentMethod: 'BKASH',
        createdAt: new Date(Date.now() - 86400000 * 3),
      },
    ];
  }

  store.fallbackInitialized = true;
  saveStoreToDisk();
}

let dbConnectionChecked = false;
let dbConnectedState = false;

/**
 * Check if PostgreSQL database is reachable
 */
export async function isDatabaseConnected(): Promise<boolean> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || dbUrl.includes('localhost:5432/toto_elite_mart') || dbUrl.startsWith('mock_')) {
    return false;
  }
  if (dbConnectionChecked) return dbConnectedState;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbConnectedState = true;
    dbConnectionChecked = true;
    return true;
  } catch {
    dbConnectedState = false;
    dbConnectionChecked = true;
    return false;
  }
}

/**
 * Seed the PostgreSQL database with seed catalog if empty
 */
export async function seedDatabaseIfEmpty(): Promise<void> {
  const isConnected = await isDatabaseConnected();
  if (!isConnected) return;

  try {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      const adminHash = await hashPassword('admin123');
      await prisma.user.createMany({
        data: [
          {
            email: 'admin@totoelitemart.com',
            passwordHash: adminHash,
            fullName: 'Super Administrator',
            phone: '01711000000',
            role: 'SUPER_ADMIN',
            status: 'ACTIVE',
          },
          {
            email: 'orders@totoelitemart.com',
            passwordHash: adminHash,
            fullName: 'Order Operations Manager',
            phone: '01811000000',
            role: 'ORDER_MANAGER',
            status: 'ACTIVE',
          },
        ],
      });
    }

    const catCount = await prisma.category.count();
    if (catCount === 0) {
      for (const cat of SEED_CATEGORIES) {
        await prisma.category.create({
          data: {
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            description: cat.description,
            imageUrl: cat.imageUrl,
            sortOrder: cat.sortOrder,
          },
        });
      }
    }

    const prodCount = await prisma.product.count();
    if (prodCount === 0) {
      for (const prod of SEED_PRODUCTS) {
        const cat = await prisma.category.findUnique({
          where: { slug: prod.categorySlug },
        });
        if (cat) {
          const created = await prisma.product.create({
            data: {
              id: prod.id,
              name: prod.name,
              slug: prod.slug,
              sku: prod.sku,
              description: prod.description,
              categoryId: cat.id,
              purchaseCost: prod.purchaseCost,
              sellingPrice: prod.sellingPrice,
              salePrice: prod.salePrice || null,
              stockQuantity: prod.stockQuantity,
              lowStockThreshold: prod.lowStockThreshold,
              isFeatured: prod.isFeatured,
              tags: prod.tags,
            },
          });

          for (let i = 0; i < prod.images.length; i++) {
            await prisma.productImage.create({
              data: {
                productId: created.id,
                url: prod.images[i].url,
                isPrimary: prod.images[i].isPrimary,
                sortOrder: i,
              },
            });
          }

          if (prod.colorVariants && prod.colorVariants.length > 0) {
            for (let c = 0; c < prod.colorVariants.length; c++) {
              const cv = prod.colorVariants[c];
              await prisma.colorVariant.create({
                data: {
                  id: cv.id || undefined,
                  productId: created.id,
                  name: cv.name,
                  colorCode: cv.colorCode,
                  imageUrl: cv.imageUrl || null,
                  stockQuantity: cv.stockQuantity,
                  isActive: cv.isActive !== false,
                  sortOrder: cv.sortOrder ?? c,
                },
              });
            }
          }
        }
      }
    }

    const bannerCount = await prisma.banner.count();
    if (bannerCount === 0) {
      for (const b of SEED_BANNERS) {
        await prisma.banner.create({
          data: {
            id: b.id,
            title: b.title,
            subtitle: b.subtitle,
            imageUrl: b.imageUrl,
            targetUrl: b.targetUrl,
            sortOrder: b.sortOrder,
          },
        });
      }
    }

    const couponCount = await prisma.coupon.count();
    if (couponCount === 0) {
      for (const c of SEED_COUPONS) {
        await prisma.coupon.create({
          data: {
            code: c.code,
            discountType: c.discountType,
            discountValue: c.discountValue,
            minOrderValue: c.minOrderValue,
            maxDiscountValue: c.maxDiscountValue || null,
            usageLimit: c.usageLimit,
          },
        });
      }
    }
  } catch (err) {
    console.warn('[SEED_EXECUTION_NOTICE]', err);
  }
}

// ==========================================
// STORE DATA REPOSITORY API
// ==========================================

export async function getCategories() {
  const isConnected = await isDatabaseConnected();
  if (isConnected) {
    try {
      return await prisma.category.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      });
    } catch {
      // fallback
    }
  }
  await initMemoryFallback();
  return memoryCategories.filter((c) => c);
}

export async function createCategory(data: {
  name: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  sortOrder?: number;
}) {
  const cleanSlug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const isConnected = await isDatabaseConnected();
  if (isConnected) {
    try {
      return await prisma.category.create({
        data: {
          name: data.name,
          slug: cleanSlug,
          description: data.description || null,
          imageUrl: data.imageUrl || null,
          sortOrder: data.sortOrder || 0,
        },
      });
    } catch (e) {
      console.warn('[PRISMA_CREATE_CATEGORY_FALLBACK]', e);
    }
  }

  await initMemoryFallback();
  const newCat = {
    id: `cat-${Date.now()}`,
    name: data.name,
    slug: cleanSlug,
    description: data.description || '',
    imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600',
    sortOrder: data.sortOrder || memoryCategories.length + 1,
    isActive: true,
  };
  memoryCategories.push(newCat);
  return newCat;
}

export async function getCategoryById(id: string) {
  const isConnected = await isDatabaseConnected();
  if (isConnected) {
    try {
      const cat = await prisma.category.findUnique({ where: { id } });
      if (cat) return cat;
    } catch {
      // fallback
    }
  }
  await initMemoryFallback();
  return memoryCategories.find((c) => c.id === id) || null;
}

export async function updateCategory(id: string, data: {
  name?: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  sortOrder?: number;
}) {
  const cleanSlug = data.slug || (data.name ? data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : undefined);
  const isConnected = await isDatabaseConnected();
  if (isConnected) {
    try {
      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (cleanSlug !== undefined) updateData.slug = cleanSlug;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
      if (data.sortOrder !== undefined) updateData.sortOrder = Number(data.sortOrder);

      return await prisma.category.update({
        where: { id },
        data: updateData,
      });
    } catch (e) {
      console.warn('[PRISMA_UPDATE_CATEGORY_FALLBACK]', e);
    }
  }

  await initMemoryFallback();
  const cat = memoryCategories.find((c) => c.id === id);
  if (!cat) throw new Error(`Category with ID "${id}" not found.`);

  if (data.name !== undefined) cat.name = data.name;
  if (cleanSlug !== undefined) cat.slug = cleanSlug;
  if (data.description !== undefined) cat.description = data.description;
  if (data.imageUrl !== undefined) cat.imageUrl = data.imageUrl;
  if (data.sortOrder !== undefined) cat.sortOrder = Number(data.sortOrder);
  return cat;
}

export async function deleteCategory(id: string) {
  const isConnected = await isDatabaseConnected();
  if (isConnected) {
    try {
      const assignedCount = await prisma.product.count({
        where: { categoryId: id, isArchived: false },
      });
      if (assignedCount > 0) {
        throw new Error(`Cannot delete category: ${assignedCount} active product(s) are assigned to it. Please reassign or delete the products first.`);
      }
      await prisma.category.delete({ where: { id } });
      return { success: true };
    } catch (e: any) {
      if (e.message && e.message.includes('Cannot delete category')) throw e;
      console.warn('[PRISMA_DELETE_CATEGORY_FALLBACK]', e);
    }
  }

  await initMemoryFallback();
  const assignedProducts = memoryProducts.filter((p) => p.categoryId === id && !p.isArchived);
  if (assignedProducts.length > 0) {
    throw new Error(`Cannot delete category: ${assignedProducts.length} active product(s) are assigned to it. Please reassign or delete the products first.`);
  }

  const idx = memoryCategories.findIndex((c) => c.id === id);
  if (idx !== -1) {
    memoryCategories.splice(idx, 1);
  }
  return { success: true };
}

function attachReviewStats(products: any[]) {
  const store = getStore();
  const allApprovedReviews = (store.reviews || []).filter((r: any) => r.status === 'APPROVED');

  return products.map((p) => {
    const pIdStr = String(p.id).toLowerCase();
    const pSlugStr = p.slug ? String(p.slug).toLowerCase() : '';
    const pSkuStr = p.sku ? String(p.sku).toLowerCase() : '';
    const pNameStr = p.name ? String(p.name).toLowerCase() : '';

    const pReviews = allApprovedReviews.filter((r: any) => {
      if (!r.productId) return false;
      const rProdId = String(r.productId).toLowerCase();
      return (
        rProdId === pIdStr ||
        (pSlugStr && rProdId === pSlugStr) ||
        (pSkuStr && rProdId === pSkuStr) ||
        (pNameStr && rProdId === pNameStr)
      );
    });

    const count = pReviews.length;
    const avg = count > 0
      ? Number((pReviews.reduce((sum: number, r: any) => sum + (Number(r.rating) || 5), 0) / count).toFixed(1))
      : 0;

    return {
      ...p,
      rating: avg,
      reviewCount: count,
    };
  });
}

function attachSingleReviewStats(p: any) {
  if (!p) return null;
  const store = getStore();
  const allApprovedReviews = (store.reviews || []).filter((r: any) => r.status === 'APPROVED');
  const pIdStr = String(p.id).toLowerCase();
  const pSlugStr = p.slug ? String(p.slug).toLowerCase() : '';
  const pSkuStr = p.sku ? String(p.sku).toLowerCase() : '';
  const pNameStr = p.name ? String(p.name).toLowerCase() : '';

  const pReviews = allApprovedReviews.filter((r: any) => {
    if (!r.productId) return false;
    const rProdId = String(r.productId).toLowerCase();
    return (
      rProdId === pIdStr ||
      (pSlugStr && rProdId === pSlugStr) ||
      (pSkuStr && rProdId === pSkuStr) ||
      (pNameStr && rProdId === pNameStr)
    );
  });

  const count = pReviews.length;
  const avg = count > 0
    ? Number((pReviews.reduce((sum: number, r: any) => sum + (Number(r.rating) || 5), 0) / count).toFixed(1))
    : 0;

  return {
    ...p,
    rating: avg,
    reviewCount: count,
  };
}

export async function getProducts(options?: {
  categorySlug?: string;
  search?: string;
  featuredOnly?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  status?: string;
}) {
  const isConnected = await isDatabaseConnected();
  if (isConnected) {
    try {
      const where: any = { isArchived: false };
      if (options?.categorySlug) {
        where.category = { slug: options.categorySlug };
      }
      if (options?.featuredOnly) {
        where.isFeatured = true;
      }
      if (options?.status) {
        where.status = options.status;
      }
      if (options?.search) {
        where.OR = [
          { name: { contains: options.search, mode: 'insensitive' } },
          { description: { contains: options.search, mode: 'insensitive' } },
          { sku: { contains: options.search, mode: 'insensitive' } },
          { tags: { contains: options.search, mode: 'insensitive' } },
        ];
      }

      let orderBy: any = { createdAt: 'desc' };
      if (options?.sort === 'price_asc') orderBy = { sellingPrice: 'asc' };
      if (options?.sort === 'price_desc') orderBy = { sellingPrice: 'desc' };
      if (options?.sort === 'name') orderBy = { name: 'asc' };

      const products = await prisma.product.findMany({
        where,
        include: {
          category: true,
          images: { orderBy: { sortOrder: 'asc' } },
          colorVariants: { orderBy: { sortOrder: 'asc' } },
        },
        orderBy,
      });

      const mapped = products.map((p) => ({
        ...p,
        purchaseCost: Number(p.purchaseCost),
        sellingPrice: Number(p.sellingPrice),
        salePrice: p.salePrice ? Number(p.salePrice) : null,
      }));

      return attachReviewStats(mapped);
    } catch (e) {
      console.warn('[PRISMA_PRODUCT_FETCH_FALLBACK]', e);
    }
  }

  await initMemoryFallback();
  let list = [...memoryProducts].filter((p) => !p.isArchived);

  if (options?.categorySlug) {
    list = list.filter((p) => p.categorySlug === options.categorySlug || p.category?.slug === options.categorySlug);
  }
  if (options?.featuredOnly) {
    list = list.filter((p) => p.isFeatured);
  }
  if (options?.search) {
    const q = options.search.toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.tags?.toLowerCase().includes(q)
    );
  }
  if (options?.minPrice) list = list.filter((p) => (p.salePrice || p.sellingPrice) >= options.minPrice!);
  if (options?.maxPrice) list = list.filter((p) => (p.salePrice || p.sellingPrice) <= options.maxPrice!);

  if (options?.sort === 'price_asc') {
    list.sort((a, b) => (a.salePrice || a.sellingPrice) - (b.salePrice || b.sellingPrice));
  } else if (options?.sort === 'price_desc') {
    list.sort((a, b) => (b.salePrice || b.sellingPrice) - (a.salePrice || a.sellingPrice));
  } else if (options?.sort === 'name') {
    list.sort((a, b) => a.name.localeCompare(b.name));
  }

  return attachReviewStats(list);
}

export async function getProductBySlugOrId(identifier: string) {
  if (!identifier) return null;
  const isConnected = await isDatabaseConnected();
  if (isConnected) {
    try {
      // First attempt lookup by slug
      let p = await prisma.product.findUnique({
        where: { slug: identifier },
        include: {
          category: true,
          images: { orderBy: { sortOrder: 'asc' } },
          colorVariants: { orderBy: { sortOrder: 'asc' } },
        },
      });
      // If not found by slug, attempt lookup by ID
      if (!p) {
        p = await prisma.product.findUnique({
          where: { id: identifier },
          include: {
            category: true,
            images: { orderBy: { sortOrder: 'asc' } },
            colorVariants: { orderBy: { sortOrder: 'asc' } },
          },
        });
      }
      if (p) {
        const productObj = {
          ...p,
          purchaseCost: Number(p.purchaseCost),
          sellingPrice: Number(p.sellingPrice),
          salePrice: p.salePrice ? Number(p.salePrice) : null,
        };
        return attachSingleReviewStats(productObj);
      }
    } catch {
      // fallback
    }
  }

  await initMemoryFallback();
  const idLower = identifier.trim().toLowerCase();

  // 1. Strict exact match by ID, slug, or SKU
  let found = memoryProducts.find(
    (p) =>
      p.id === identifier ||
      String(p.id).toLowerCase() === idLower ||
      (p.slug && p.slug.toLowerCase() === idLower) ||
      (p.sku && p.sku.toLowerCase() === idLower)
  );

  // 2. Fallback prefix/suffix match only if no exact match was found
  if (!found) {
    found = memoryProducts.find(
      (p) =>
        (p.slug && (idLower.startsWith(p.slug.toLowerCase() + '-') || p.slug.toLowerCase().startsWith(idLower + '-')))
    ) || null;
  }

  return attachSingleReviewStats(found);
}

export async function getProductBySlug(slug: string) {
  return getProductBySlugOrId(slug);
}

export async function createProduct(data: {
  name: string;
  slug?: string;
  sku: string;
  description?: string;
  categoryId: string;
  purchaseCost?: number;
  sellingPrice: number;
  salePrice?: number | null;
  stockQuantity?: number;
  lowStockThreshold?: number;
  isFeatured?: boolean;
  tags?: string;
  images?: Array<{ url: string; fileId?: string; isPrimary?: boolean }>;
  colorVariants?: Array<{
    id?: string;
    name: string;
    colorCode: string;
    price?: number | null;
    imageUrl?: string | null;
    stockQuantity?: number;
    isActive?: boolean;
    sortOrder?: number;
  }>;
}) {
  const cleanSku = data.sku.trim().toUpperCase();
  const cleanSlug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const isConnected = await isDatabaseConnected();

  const variantStockTotal = data.colorVariants && data.colorVariants.length > 0
    ? data.colorVariants.filter((cv: any) => cv.isActive !== false).reduce((sum: number, cv: any) => sum + (Number(cv.stockQuantity) || 0), 0)
    : 0;
  const initialStock = variantStockTotal > 0
    ? Math.max(Number(data.stockQuantity) || 0, variantStockTotal)
    : (Number(data.stockQuantity) || 0);

  if (isConnected) {
    try {
      const existingSku = await prisma.product.findUnique({ where: { sku: cleanSku } });
      if (existingSku) {
        throw new Error(`A product with SKU "${cleanSku}" already exists.`);
      }

      const created = await prisma.product.create({
        data: {
          name: data.name,
          slug: cleanSlug,
          sku: cleanSku,
          description: data.description || null,
          categoryId: data.categoryId,
          purchaseCost: data.purchaseCost ? Number(data.purchaseCost) : 0,
          sellingPrice: Number(data.sellingPrice),
          salePrice: data.salePrice ? Number(data.salePrice) : null,
          stockQuantity: initialStock,
          lowStockThreshold: Number(data.lowStockThreshold) || 5,
          isFeatured: Boolean(data.isFeatured),
          tags: data.tags || null,
          images: data.images && data.images.length > 0 ? {
            create: data.images.slice(0, 5).map((img, idx) => ({
              url: img.url,
              fileId: img.fileId || null,
              isPrimary: img.isPrimary || idx === 0,
              sortOrder: idx,
            })),
          } : undefined,
          colorVariants: data.colorVariants && data.colorVariants.length > 0 ? {
            create: data.colorVariants.map((cv, idx) => ({
              name: cv.name.trim(),
              colorCode: cv.colorCode.trim(),
              price: cv.price != null && Number(cv.price) > 0 ? Number(cv.price) : null,
              imageUrl: cv.imageUrl || null,
              stockQuantity: Number(cv.stockQuantity) || 0,
              isActive: cv.isActive !== false,
              sortOrder: cv.sortOrder ?? idx,
            })),
          } : undefined,
        },
        include: { category: true, images: true, colorVariants: { orderBy: { sortOrder: 'asc' } } },
      });
      return created;
    } catch (e: any) {
      if (e.message && e.message.includes('already exists')) throw e;
      console.warn('[PRISMA_CREATE_PRODUCT_FALLBACK]', e);
    }
  }

  await initMemoryFallback();
  const existingSku = memoryProducts.find((p) => p.sku === cleanSku && !p.isArchived);
  if (existingSku) {
    throw new Error(`A product with SKU "${cleanSku}" already exists.`);
  }

  const cat = memoryCategories.find((c) => c.id === data.categoryId) || memoryCategories[0];
  const newProduct: any = {
    id: `prod-${Date.now()}`,
    name: data.name,
    slug: cleanSlug,
    sku: cleanSku,
    description: data.description || null,
    categoryId: cat?.id || 'cat-1',
    category: cat,
    purchaseCost: data.purchaseCost ? Number(data.purchaseCost) : 0,
    sellingPrice: Number(data.sellingPrice),
    salePrice: data.salePrice ? Number(data.salePrice) : null,
    stockQuantity: initialStock,
    lowStockThreshold: Number(data.lowStockThreshold) || 5,
    status: initialStock > 0 ? 'ACTIVE' : 'OUT_OF_STOCK',
    isFeatured: Boolean(data.isFeatured),
    tags: data.tags || null,
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    colorVariants: data.colorVariants && data.colorVariants.length > 0 ? data.colorVariants.map((cv, idx) => ({
      id: cv.id || `var-${Date.now()}-${idx}`,
      productId: `prod-${Date.now()}`,
      name: cv.name.trim(),
      colorCode: cv.colorCode.trim(),
      price: cv.price != null && Number(cv.price) > 0 ? Number(cv.price) : null,
      imageUrl: cv.imageUrl || null,
      stockQuantity: Number(cv.stockQuantity) || 0,
      isActive: cv.isActive !== false,
      sortOrder: cv.sortOrder ?? idx,
      createdAt: new Date(),
      updatedAt: new Date(),
    })) : [],
    images: data.images && data.images.length > 0 ? data.images.map((img, idx) => ({
      id: `img-${Date.now()}-${idx}`,
      url: img.url,
      fileId: img.fileId || null,
      isPrimary: img.isPrimary || idx === 0,
      sortOrder: idx,
    })) : [
      {
        id: `img-${Date.now()}-0`,
        url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
        fileId: null,
        isPrimary: true,
        sortOrder: 0,
      }
    ],
  };

  memoryProducts.unshift(newProduct);
  saveStoreToDisk();
  return newProduct;
}

export async function getProductById(id: string) {
  const isConnected = await isDatabaseConnected();
  if (isConnected) {
    try {
      const p = await prisma.product.findUnique({
        where: { id },
        include: {
          category: true,
          images: { orderBy: { sortOrder: 'asc' } },
          colorVariants: { orderBy: { sortOrder: 'asc' } },
        },
      });
      if (p) {
        return {
          ...p,
          purchaseCost: Number(p.purchaseCost),
          sellingPrice: Number(p.sellingPrice),
          salePrice: p.salePrice ? Number(p.salePrice) : null,
        };
      }
    } catch {
      // fallback
    }
  }

  await initMemoryFallback();
  return memoryProducts.find((p) => p.id === id) || null;
}

export async function updateProduct(id: string, data: {
  name?: string;
  slug?: string;
  sku?: string;
  description?: string;
  categoryId?: string;
  purchaseCost?: number;
  sellingPrice?: number;
  salePrice?: number | null;
  stockQuantity?: number;
  lowStockThreshold?: number;
  isFeatured?: boolean;
  tags?: string;
  images?: Array<{ url: string; fileId?: string; isPrimary?: boolean }>;
  colorVariants?: Array<{
    id?: string;
    name: string;
    colorCode: string;
    price?: number | null;
    imageUrl?: string | null;
    stockQuantity?: number;
    isActive?: boolean;
    sortOrder?: number;
  }>;
}) {
  const isConnected = await isDatabaseConnected();
  const cleanSku = data.sku ? data.sku.trim().toUpperCase() : undefined;

  if (isConnected) {
    try {
      if (cleanSku) {
        const existing = await prisma.product.findFirst({
          where: { sku: cleanSku, id: { not: id } },
        });
        if (existing) {
          throw new Error(`SKU "${cleanSku}" is already in use by another product.`);
        }
      }

      if (data.images && data.images.length > 0) {
        const safeImgs = data.images.slice(0, 5);
        await prisma.productImage.deleteMany({ where: { productId: id } });
        for (let i = 0; i < safeImgs.length; i++) {
          await prisma.productImage.create({
            data: {
              productId: id,
              url: safeImgs[i].url,
              fileId: safeImgs[i].fileId || null,
              isPrimary: safeImgs[i].isPrimary ?? (i === 0),
              sortOrder: i,
            },
          });
        }
      }

      if (data.colorVariants !== undefined) {
        await prisma.colorVariant.deleteMany({ where: { productId: id } });
        if (data.colorVariants.length > 0) {
          for (let i = 0; i < data.colorVariants.length; i++) {
            const cv = data.colorVariants[i];
            await prisma.colorVariant.create({
              data: {
                productId: id,
                name: cv.name.trim(),
                colorCode: cv.colorCode.trim(),
                price: cv.price != null && Number(cv.price) > 0 ? Number(cv.price) : null,
                imageUrl: cv.imageUrl || null,
                stockQuantity: Number(cv.stockQuantity) || 0,
                isActive: cv.isActive !== false,
                sortOrder: cv.sortOrder ?? i,
              },
            });
          }
        }
      }

      const updateData: any = {};
      if (data.name !== undefined) {
        updateData.name = data.name;
        if (!data.slug) {
          updateData.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        }
      }
      if (data.slug !== undefined) updateData.slug = data.slug;
      if (cleanSku !== undefined) updateData.sku = cleanSku;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
      if (data.purchaseCost !== undefined) updateData.purchaseCost = Number(data.purchaseCost);
      if (data.sellingPrice !== undefined) updateData.sellingPrice = Number(data.sellingPrice);
      if (data.salePrice !== undefined) updateData.salePrice = data.salePrice ? Number(data.salePrice) : null;
      if (data.stockQuantity !== undefined || data.colorVariants !== undefined) {
        const reqStock = data.stockQuantity !== undefined ? Number(data.stockQuantity) : undefined;
        let finalStock = reqStock;
        if (data.colorVariants !== undefined && data.colorVariants.length > 0) {
          const varSum = data.colorVariants.filter((cv: any) => cv.isActive !== false).reduce((sum: number, cv: any) => sum + (Number(cv.stockQuantity) || 0), 0);
          finalStock = Math.max(reqStock || 0, varSum);
        }
        if (finalStock !== undefined) {
          updateData.stockQuantity = finalStock;
          updateData.status = finalStock > 0 ? 'ACTIVE' : 'OUT_OF_STOCK';
        }
      }
      if (data.lowStockThreshold !== undefined) updateData.lowStockThreshold = Number(data.lowStockThreshold);
      if (data.isFeatured !== undefined) updateData.isFeatured = Boolean(data.isFeatured);
      if (data.tags !== undefined) updateData.tags = data.tags;

      const updated = await prisma.product.update({
        where: { id },
        data: updateData,
        include: {
          category: true,
          images: { orderBy: { sortOrder: 'asc' } },
          colorVariants: { orderBy: { sortOrder: 'asc' } },
        },
      });
      return {
        ...updated,
        purchaseCost: Number(updated.purchaseCost),
        sellingPrice: Number(updated.sellingPrice),
        salePrice: updated.salePrice ? Number(updated.salePrice) : null,
      };
    } catch (e: any) {
      if (e.message && e.message.includes('already in use')) throw e;
      console.warn('[PRISMA_UPDATE_PRODUCT_FALLBACK]', e);
    }
  }

  await initMemoryFallback();
  const prodIndex = memoryProducts.findIndex((p) => p.id === id);
  if (prodIndex === -1) {
    throw new Error(`Product with ID "${id}" not found.`);
  }

  if (cleanSku) {
    const existing = memoryProducts.find((p) => p.sku === cleanSku && p.id !== id && !p.isArchived);
    if (existing) {
      throw new Error(`SKU "${cleanSku}" is already in use by another product.`);
    }
  }

  const existingProd = memoryProducts[prodIndex];
  let cat = existingProd.category;
  if (data.categoryId && data.categoryId !== existingProd.categoryId) {
    cat = memoryCategories.find((c) => c.id === data.categoryId) || cat;
  }

  let images = existingProd.images;
  if (data.images && data.images.length > 0) {
    images = data.images.slice(0, 5).map((img, idx) => ({
      id: `img-${id}-${Date.now()}-${idx}`,
      productId: id,
      url: img.url,
      fileId: img.fileId || null,
      isPrimary: img.isPrimary ?? (idx === 0),
      sortOrder: idx,
    }));
  }

  let colorVariants = existingProd.colorVariants || [];
  if (data.colorVariants !== undefined) {
    colorVariants = data.colorVariants.map((cv, idx) => ({
      id: cv.id || `var-${id}-${Date.now()}-${idx}`,
      productId: id,
      name: cv.name.trim(),
      colorCode: cv.colorCode.trim(),
      price: cv.price != null && Number(cv.price) > 0 ? Number(cv.price) : null,
      imageUrl: cv.imageUrl || null,
      stockQuantity: Number(cv.stockQuantity) || 0,
      isActive: cv.isActive !== false,
      sortOrder: cv.sortOrder ?? idx,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }

  let finalMemoryStock = data.stockQuantity !== undefined ? Number(data.stockQuantity) : existingProd.stockQuantity;
  if (colorVariants.length > 0) {
    const varSum = colorVariants.filter((cv: any) => cv.isActive !== false).reduce((sum: number, cv: any) => sum + (Number(cv.stockQuantity) || 0), 0);
    if (varSum > 0) {
      finalMemoryStock = Math.max(finalMemoryStock || 0, varSum);
    }
  }

  const updatedProd = {
    ...existingProd,
    name: data.name !== undefined ? data.name : existingProd.name,
    slug: data.slug || (data.name ? data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : existingProd.slug),
    sku: cleanSku !== undefined ? cleanSku : existingProd.sku,
    description: data.description !== undefined ? data.description : existingProd.description,
    categoryId: data.categoryId || existingProd.categoryId,
    category: cat,
    purchaseCost: data.purchaseCost !== undefined ? Number(data.purchaseCost) : existingProd.purchaseCost,
    sellingPrice: data.sellingPrice !== undefined ? Number(data.sellingPrice) : existingProd.sellingPrice,
    salePrice: data.salePrice !== undefined ? (data.salePrice ? Number(data.salePrice) : null) : existingProd.salePrice,
    stockQuantity: finalMemoryStock,
    lowStockThreshold: data.lowStockThreshold !== undefined ? Number(data.lowStockThreshold) : existingProd.lowStockThreshold,
    status: finalMemoryStock > 0 ? 'ACTIVE' : 'OUT_OF_STOCK',
    isFeatured: data.isFeatured !== undefined ? Boolean(data.isFeatured) : existingProd.isFeatured,
    tags: data.tags !== undefined ? data.tags : existingProd.tags,
    images,
    colorVariants,
    updatedAt: new Date(),
  };

  memoryProducts[prodIndex] = updatedProd;
  saveStoreToDisk();
  return updatedProd;
}

export async function deleteProduct(id: string) {
  const isConnected = await isDatabaseConnected();
  if (isConnected) {
    try {
      await prisma.product.update({
        where: { id },
        data: { isArchived: true, status: 'INACTIVE' },
      });
      return { success: true };
    } catch (e) {
      console.warn('[PRISMA_DELETE_PRODUCT_FALLBACK]', e);
    }
  }

  await initMemoryFallback();
  const prod = memoryProducts.find((p) => p.id === id);
  if (prod) {
    prod.isArchived = true;
    prod.status = 'INACTIVE';
  }
  return { success: true };
}

export async function getBanners(includeInactive: boolean = false) {
  const isConnected = await isDatabaseConnected();
  if (isConnected) {
    try {
      return await prisma.banner.findMany({
        where: includeInactive ? undefined : { isActive: true },
        orderBy: { sortOrder: 'asc' },
      });
    } catch {
      // fallback
    }
  }
  await initMemoryFallback();
  return includeInactive ? [...memoryBanners] : memoryBanners.filter((b) => b.isActive !== false);
}

export async function createBanner(data: {
  title: string;
  subtitle?: string;
  imageUrl: string;
  fileId?: string;
  targetUrl?: string;
  sortOrder?: number;
}) {
  const isConnected = await isDatabaseConnected();
  if (isConnected) {
    try {
      return await prisma.banner.create({
        data: {
          title: data.title,
          subtitle: data.subtitle || null,
          imageUrl: data.imageUrl,
          fileId: data.fileId || null,
          targetUrl: data.targetUrl || '/shop',
          sortOrder: data.sortOrder ? Number(data.sortOrder) : 0,
        },
      });
    } catch (e) {
      console.warn('[PRISMA_CREATE_BANNER_FALLBACK]', e);
    }
  }

  await initMemoryFallback();
  const newBanner = {
    id: `ban-${Date.now()}`,
    title: data.title,
    subtitle: data.subtitle || '',
    imageUrl: data.imageUrl,
    fileId: data.fileId || null,
    targetUrl: data.targetUrl || '/shop',
    sortOrder: data.sortOrder || memoryBanners.length + 1,
    isActive: true,
  };
  memoryBanners.push(newBanner);
  return newBanner;
}

export async function updateBanner(id: string, data: {
  title?: string;
  subtitle?: string;
  imageUrl?: string;
  targetUrl?: string;
  isActive?: boolean;
  sortOrder?: number;
}) {
  const isConnected = await isDatabaseConnected();
  if (isConnected) {
    try {
      const updateData: any = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.subtitle !== undefined) updateData.subtitle = data.subtitle || null;
      if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
      if (data.targetUrl !== undefined) updateData.targetUrl = data.targetUrl;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;
      if (data.sortOrder !== undefined) updateData.sortOrder = Number(data.sortOrder);

      return await prisma.banner.update({
        where: { id },
        data: updateData,
      });
    } catch (e) {
      console.warn('[PRISMA_UPDATE_BANNER_FALLBACK]', e);
    }
  }

  await initMemoryFallback();
  const ban = memoryBanners.find((b) => b.id === id);
  if (!ban) throw new Error(`Banner with ID "${id}" not found.`);
  if (data.title !== undefined) ban.title = data.title;
  if (data.subtitle !== undefined) ban.subtitle = data.subtitle;
  if (data.imageUrl !== undefined) ban.imageUrl = data.imageUrl;
  if (data.targetUrl !== undefined) ban.targetUrl = data.targetUrl;
  if (data.isActive !== undefined) ban.isActive = data.isActive;
  if (data.sortOrder !== undefined) ban.sortOrder = Number(data.sortOrder);
  return ban;
}

export async function deleteBanner(id: string) {
  const isConnected = await isDatabaseConnected();
  if (isConnected) {
    try {
      await prisma.banner.delete({ where: { id } });
      return { success: true };
    } catch (e) {
      console.warn('[PRISMA_DELETE_BANNER_FALLBACK]', e);
    }
  }

  await initMemoryFallback();
  const idx = memoryBanners.findIndex((b) => b.id === id);
  if (idx !== -1) {
    memoryBanners.splice(idx, 1);
  }
  return { success: true };
}

export interface CouponInput {
  code: string;
  discountType?: 'PERCENTAGE' | 'FIXED_BDT';
  discountValue: number;
  minOrderValue?: number;
  maxDiscountValue?: number | null;
  usageLimit?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  isActive?: boolean;
}

export async function getAllCoupons(options?: { search?: string; status?: string }) {
  const isConnected = await isDatabaseConnected();
  let coupons: any[] = [];

  if (isConnected) {
    try {
      coupons = await prisma.coupon.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } catch {
      // fallback
    }
  }

  if (coupons.length === 0) {
    await initMemoryFallback();
    coupons = [...memoryCoupons];
  }

  const now = new Date();

  // Ensure all memory coupons have an id
  for (const c of memoryCoupons) {
    if (!c.id) {
      c.id = `coup-${c.code.toLowerCase()}`;
    }
  }

  const enriched = coupons.map((c) => {
    let computedStatus = 'ACTIVE';
    if (c.isActive === false) {
      computedStatus = 'INACTIVE';
    } else if (c.startDate && new Date(c.startDate) > now) {
      computedStatus = 'SCHEDULED';
    } else if (c.endDate && new Date(c.endDate) < now) {
      computedStatus = 'EXPIRED';
    } else if (c.usageLimit && Number(c.timesUsed || 0) >= Number(c.usageLimit)) {
      computedStatus = 'EXHAUSTED';
    }

    const couponId = c.id || `coup-${c.code.toLowerCase()}`;

    return {
      id: couponId,
      code: c.code,
      discountType: c.discountType,
      discountValue: Number(c.discountValue),
      minOrderValue: Number(c.minOrderValue || 0),
      maxDiscountValue: c.maxDiscountValue ? Number(c.maxDiscountValue) : null,
      usageLimit: c.usageLimit ? Number(c.usageLimit) : null,
      timesUsed: Number(c.timesUsed || 0),
      startDate: c.startDate ? new Date(c.startDate).toISOString() : null,
      endDate: c.endDate ? new Date(c.endDate).toISOString() : null,
      isActive: c.isActive !== false,
      createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: c.updatedAt ? new Date(c.updatedAt).toISOString() : new Date().toISOString(),
      computedStatus,
    };
  });

  const stats = {
    total: enriched.length,
    active: enriched.filter((c) => c.computedStatus === 'ACTIVE').length,
    scheduled: enriched.filter((c) => c.computedStatus === 'SCHEDULED').length,
    expired: enriched.filter((c) => c.computedStatus === 'EXPIRED' || c.computedStatus === 'EXHAUSTED').length,
    inactive: enriched.filter((c) => c.computedStatus === 'INACTIVE').length,
    totalRedemptions: enriched.reduce((sum, c) => sum + (c.timesUsed || 0), 0),
  };

  let filtered = enriched;
  if (options?.search) {
    const q = options.search.trim().toUpperCase();
    filtered = filtered.filter((c) => c.code.includes(q));
  }
  if (options?.status && options.status !== 'ALL') {
    filtered = filtered.filter((c) => c.computedStatus === options.status);
  }

  return { coupons: filtered, stats };
}

export async function getCouponById(id: string) {
  if (!id) return null;
  const isConnected = await isDatabaseConnected();
  if (isConnected) {
    try {
      const coup = await prisma.coupon.findFirst({
        where: {
          OR: [
            { id },
            { code: id.toUpperCase() },
          ],
        },
      });
      if (coup) return coup;
    } catch {}
  }
  await initMemoryFallback();
  return memoryCoupons.find((c) => c.id === id || c.code === id || c.code === id.toUpperCase()) || null;
}

export async function createCoupon(data: CouponInput) {
  const normalizedCode = data.code.trim().toUpperCase();
  if (!normalizedCode) throw new Error('Coupon code is required.');

  const isConnected = await isDatabaseConnected();
  if (isConnected) {
    try {
      const existing = await prisma.coupon.findUnique({ where: { code: normalizedCode } });
      if (existing) throw new Error(`Coupon code "${normalizedCode}" already exists.`);

      return await prisma.coupon.create({
        data: {
          code: normalizedCode,
          discountType: data.discountType || 'PERCENTAGE',
          discountValue: Number(data.discountValue),
          minOrderValue: Number(data.minOrderValue || 0),
          maxDiscountValue: data.maxDiscountValue ? Number(data.maxDiscountValue) : null,
          usageLimit: data.usageLimit ? Number(data.usageLimit) : null,
          startDate: data.startDate ? new Date(data.startDate) : null,
          endDate: data.endDate ? new Date(data.endDate) : null,
          isActive: data.isActive !== false,
          timesUsed: 0,
        },
      });
    } catch (e: any) {
      if (e.message?.includes('already exists')) throw e;
      console.warn('[PRISMA_CREATE_COUPON_FALLBACK]', e);
    }
  }

  await initMemoryFallback();
  const existingMemory = memoryCoupons.find((c) => c.code === normalizedCode);
  if (existingMemory) throw new Error(`Coupon code "${normalizedCode}" already exists.`);

  const newCoupon = {
    id: `coup-${Date.now()}`,
    code: normalizedCode,
    discountType: data.discountType || 'PERCENTAGE',
    discountValue: Number(data.discountValue),
    minOrderValue: Number(data.minOrderValue || 0),
    maxDiscountValue: data.maxDiscountValue ? Number(data.maxDiscountValue) : null,
    usageLimit: data.usageLimit ? Number(data.usageLimit) : null,
    startDate: data.startDate ? new Date(data.startDate) : null,
    endDate: data.endDate ? new Date(data.endDate) : null,
    isActive: data.isActive !== false,
    timesUsed: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  memoryCoupons.unshift(newCoupon);
  saveStoreToDisk();
  return newCoupon;
}

export async function updateCoupon(id: string, data: Partial<CouponInput>) {
  if (!id) throw new Error('Coupon identifier is required.');
  const isConnected = await isDatabaseConnected();
  if (isConnected) {
    try {
      const updateData: any = {};
      if (data.code !== undefined) updateData.code = data.code.trim().toUpperCase();
      if (data.discountType !== undefined) updateData.discountType = data.discountType;
      if (data.discountValue !== undefined) updateData.discountValue = Number(data.discountValue);
      if (data.minOrderValue !== undefined) updateData.minOrderValue = Number(data.minOrderValue);
      if (data.maxDiscountValue !== undefined) updateData.maxDiscountValue = data.maxDiscountValue ? Number(data.maxDiscountValue) : null;
      if (data.usageLimit !== undefined) updateData.usageLimit = data.usageLimit ? Number(data.usageLimit) : null;
      if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
      if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;

      // Find by id or code
      const target = await prisma.coupon.findFirst({
        where: {
          OR: [{ id }, { code: id.toUpperCase() }],
        },
      });

      if (target) {
        return await prisma.coupon.update({
          where: { id: target.id },
          data: updateData,
        });
      }
    } catch (e) {
      console.warn('[PRISMA_UPDATE_COUPON_FALLBACK]', e);
    }
  }

  await initMemoryFallback();
  const coup = memoryCoupons.find((c) => c.id === id || c.code === id || c.code === id.toUpperCase());
  if (!coup) throw new Error(`Coupon with ID or code "${id}" not found.`);

  if (data.code !== undefined) coup.code = data.code.trim().toUpperCase();
  if (data.discountType !== undefined) coup.discountType = data.discountType;
  if (data.discountValue !== undefined) coup.discountValue = Number(data.discountValue);
  if (data.minOrderValue !== undefined) coup.minOrderValue = Number(data.minOrderValue);
  if (data.maxDiscountValue !== undefined) coup.maxDiscountValue = data.maxDiscountValue ? Number(data.maxDiscountValue) : null;
  if (data.usageLimit !== undefined) coup.usageLimit = data.usageLimit ? Number(data.usageLimit) : null;
  if (data.startDate !== undefined) coup.startDate = data.startDate ? new Date(data.startDate) : null;
  if (data.endDate !== undefined) coup.endDate = data.endDate ? new Date(data.endDate) : null;
  if (data.isActive !== undefined) coup.isActive = data.isActive;
  coup.updatedAt = new Date();
  saveStoreToDisk();
  return coup;
}

export async function deleteCoupon(id: string) {
  if (!id) throw new Error('Coupon identifier is required.');
  const isConnected = await isDatabaseConnected();
  if (isConnected) {
    try {
      const target = await prisma.coupon.findFirst({
        where: {
          OR: [{ id }, { code: id.toUpperCase() }],
        },
      });
      if (target) {
        await prisma.coupon.delete({ where: { id: target.id } });
        return { success: true };
      }
    } catch (e) {
      console.warn('[PRISMA_DELETE_COUPON_FALLBACK]', e);
    }
  }

  await initMemoryFallback();
  const idx = memoryCoupons.findIndex((c) => c.id === id || c.code === id || c.code === id.toUpperCase());
  if (idx !== -1) {
    memoryCoupons.splice(idx, 1);
    saveStoreToDisk();
  }
  return { success: true };
}

export async function toggleCouponStatus(id: string, isActive: boolean) {
  return updateCoupon(id, { isActive });
}

export async function validateCoupon(code: string, subtotal: number) {
  const upperCode = code.trim().toUpperCase();
  if (!upperCode) {
    return { valid: false, message: 'Please enter a coupon code.' };
  }

  const isConnected = await isDatabaseConnected();

  let coupon: any = null;
  if (isConnected) {
    try {
      coupon = await prisma.coupon.findUnique({
        where: { code: upperCode },
      });
    } catch {
      // fallback
    }
  }

  if (!coupon) {
    await initMemoryFallback();
    coupon = memoryCoupons.find((c) => c.code === upperCode);
  }

  if (!coupon) {
    return { valid: false, message: `Coupon code "${upperCode}" is invalid or does not exist.` };
  }

  if (coupon.isActive === false) {
    return { valid: false, message: `Coupon "${upperCode}" is currently inactive.` };
  }

  const now = new Date();
  if (coupon.startDate && new Date(coupon.startDate) > now) {
    return { valid: false, message: `Coupon "${upperCode}" is not active yet.` };
  }

  if (coupon.endDate && new Date(coupon.endDate) < now) {
    return { valid: false, message: `Coupon "${upperCode}" has expired.` };
  }

  if (coupon.usageLimit && Number(coupon.timesUsed || 0) >= Number(coupon.usageLimit)) {
    return { valid: false, message: `Coupon "${upperCode}" has reached its maximum redemption limit.` };
  }

  const minOrder = Number(coupon.minOrderValue || 0);
  if (subtotal < minOrder) {
    return {
      valid: false,
      message: `Minimum order amount of ৳${minOrder.toLocaleString()} is required for coupon "${upperCode}".`,
      minOrderValue: minOrder,
    };
  }

  let discountAmount = 0;
  if (coupon.discountType === 'PERCENTAGE') {
    discountAmount = Math.round((subtotal * Number(coupon.discountValue)) / 100);
    if (coupon.maxDiscountValue && discountAmount > Number(coupon.maxDiscountValue)) {
      discountAmount = Number(coupon.maxDiscountValue);
    }
  } else {
    discountAmount = Math.min(subtotal, Number(coupon.discountValue));
  }

  return {
    valid: true,
    code: coupon.code,
    discountAmount,
    discountType: coupon.discountType,
    discountValue: Number(coupon.discountValue),
    minOrderValue: minOrder,
    maxDiscountValue: coupon.maxDiscountValue ? Number(coupon.maxDiscountValue) : null,
    message: `Coupon "${coupon.code}" applied! You save ৳${discountAmount.toLocaleString()}`,
  };
}

/**
 * Generate human-readable unique order number safely
 * Format: TEM-YYYY-XXXXX
 */
export async function generateOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(10000 + Math.random() * 90000);
  return `TEM-${year}-${randomSuffix}`;
}

/**
 * Place a customer order with accurate calculations, stock updates & notifications
 */
export async function createOrder(data: {
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryZone: string;
  deliveryFee: number;
  paymentMethod: 'COD' | 'BKASH' | 'NAGAD' | 'ROCKET';
  couponCode?: string;
  notes?: string;
  rewardPointsRedeemed?: number;
  rewardDiscount?: number;
  fraudRiskScore?: number;
  fraudRiskTier?: 'LOW' | 'MEDIUM' | 'HIGH';
  fraudRiskFlags?: string[];
  items: Array<{
    productId: string;
    quantity: number;
    selectedColor?: string;
    variantId?: string;
  }>;
}) {
  await initMemoryFallback();

  // Validate items and fetch prices
  const lineItems: any[] = [];
  const allProducts = await getProducts();
  for (const itemReq of data.items) {
    let product = allProducts.find((p: any) => p.id === itemReq.productId);
    if (!product && itemReq.productId) {
      product = allProducts.find((p: any) =>
        p.slug === itemReq.productId ||
        (p.sku && p.sku.toLowerCase() === itemReq.productId.toLowerCase()) ||
        p.id.toLowerCase() === itemReq.productId.toLowerCase()
      );
    }
    if (!product) {
      throw new Error(`Product not found: ${itemReq.productId}`);
    }
    const activeVariants = (product.colorVariants || []).filter((v: any) => v.isActive !== false);
    const variantStockSum = activeVariants.reduce((sum: number, v: any) => sum + (Number(v.stockQuantity) || 0), 0);
    const availableStock = activeVariants.length > 0
      ? Math.max(product.stockQuantity || 0, variantStockSum)
      : (product.stockQuantity || 0);

    if (availableStock < itemReq.quantity) {
      throw new Error(`Insufficient stock for product "${product.name}". Available: ${availableStock}`);
    }

    // Color variant resolution - Graceful & Fault-Tolerant (never blocks checkout)
    let matchedVariant: any = null;
    if (activeVariants.length > 0) {
      if (itemReq.selectedColor || itemReq.variantId) {
        matchedVariant = activeVariants.find(
          (v: any) =>
            (itemReq.variantId && v.id === itemReq.variantId) ||
            (itemReq.selectedColor && v.name && v.name.toLowerCase() === itemReq.selectedColor.trim().toLowerCase())
        );
      }
      // Graceful fallback to first in-stock active variant or first active variant
      if (!matchedVariant) {
        matchedVariant = activeVariants.find((v: any) => v.stockQuantity >= itemReq.quantity) || activeVariants[0];
      }
      // If the selected variant has low stock, fallback to an in-stock active variant if available
      if (matchedVariant && matchedVariant.stockQuantity < itemReq.quantity) {
        const inStockAlt = activeVariants.find((v: any) => v.stockQuantity >= itemReq.quantity);
        if (inStockAlt) {
          matchedVariant = inStockAlt;
        }
      }
    }

    // Authoritative Flash Sale deal resolution
    const flashDeal = await getFlashSaleProductDeal(product.id);
    let isFlash = false;
    let flashCampaignId: string | null = null;
    let unitPrice = (matchedVariant && matchedVariant.price != null && Number(matchedVariant.price) > 0)
      ? Number(matchedVariant.price)
      : (product.salePrice || product.sellingPrice);

    if (flashDeal && flashDeal.remainingStock >= itemReq.quantity) {
      isFlash = true;
      flashCampaignId = flashDeal.campaignId;
      unitPrice = flashDeal.flashPrice;
    }

    const purchaseCost = product.purchaseCost || 0;
    lineItems.push({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      selectedColor: matchedVariant ? matchedVariant.name : (itemReq.selectedColor || null),
      variantId: matchedVariant ? matchedVariant.id : (itemReq.variantId || null),
      unitPrice,
      purchaseCost,
      quantity: itemReq.quantity,
      totalPrice: unitPrice * itemReq.quantity,
      isFlashSale: isFlash,
      flashCampaignId,
    });
  }

  // Calculate totals
  let discountAmount = 0;
  if (data.couponCode) {
    const subtotalTemp = lineItems.reduce((s, i) => s + i.totalPrice, 0);
    const coup = await validateCoupon(data.couponCode, subtotalTemp);
    if (coup.valid && coup.discountAmount) {
      discountAmount = coup.discountAmount;
    }
  }

  const rawSubtotal = lineItems.reduce((s, i) => s + i.totalPrice, 0);
  const settings = await getStoreSettings();
  const isFreeDelivery = settings.freeDeliveryEnabled && rawSubtotal >= settings.freeDeliveryThreshold;
  const effectiveDeliveryFee = isFreeDelivery ? 0 : data.deliveryFee;

  const rewardDiscount = Math.max(0, Number(data.rewardDiscount) || 0);

  const totals = calculateOrderTotals({
    items: lineItems,
    discountAmount: discountAmount + rewardDiscount,
    deliveryFee: effectiveDeliveryFee,
  });

  const orderNumber = await generateOrderNumber();
  const isConnected = await isDatabaseConnected();

  let savedOrder: any = null;

  if (isConnected) {
    try {
      // Use PostgreSQL database transaction
      savedOrder = await prisma.$transaction(async (tx) => {
        // Find or create customer
        let customer = await tx.customer.findUnique({
          where: { phone: data.customerPhone },
        });
        if (!customer) {
          customer = await tx.customer.create({
            data: {
              phone: data.customerPhone,
              name: data.customerName,
              address: data.deliveryAddress,
              city: data.deliveryCity,
            },
          });
        }

        // Create order
        const order = await tx.order.create({
          data: {
            orderNumber,
            customerId: customer.id,
            customerName: data.customerName,
            customerPhone: data.customerPhone,
            deliveryAddress: data.deliveryAddress,
            deliveryCity: data.deliveryCity,
            deliveryZone: data.deliveryZone,
            subtotal: totals.subtotal,
            discount: totals.discount,
            couponCode: data.couponCode || null,
            deliveryFee: totals.deliveryFee,
            totalAmount: totals.totalAmount,
            paymentMethod: data.paymentMethod as any,
            paymentStatus: 'UNPAID',
            orderStatus: 'PENDING',
            notes: data.notes || null,
          },
        });

        // Create items & deduct stock
        for (const item of lineItems) {
          await tx.orderItem.create({
            data: {
              orderId: order.id,
              productId: item.productId,
              productName: item.productName,
              sku: item.sku,
              selectedColor: item.selectedColor,
              variantId: item.variantId,
              unitPrice: item.unitPrice,
              purchaseCost: item.purchaseCost,
              quantity: item.quantity,
              totalPrice: item.totalPrice,
            },
          });

          // Deduct variant stock if variant exists
          if (item.variantId) {
            try {
              const currentVariant = await tx.colorVariant.findUnique({ where: { id: item.variantId } });
              if (currentVariant) {
                await tx.colorVariant.update({
                  where: { id: item.variantId },
                  data: {
                    stockQuantity: Math.max(0, currentVariant.stockQuantity - item.quantity),
                  },
                });
              }
            } catch (err) {
              console.warn('[COLOR_VARIANT_STOCK_DEDUCT_NOTICE]', err);
            }
          }

          // Stock deduction on product
          const currentProd = await tx.product.findUnique({
            where: { id: item.productId },
            include: { colorVariants: true },
          });
          if (currentProd) {
            let newStock: number;
            if (currentProd.colorVariants && currentProd.colorVariants.length > 0) {
              const activeVariants = await tx.colorVariant.findMany({
                where: { productId: item.productId, isActive: true },
              });
              newStock = activeVariants.reduce((sum, v) => sum + (Number(v.stockQuantity) || 0), 0);
            } else {
              newStock = Math.max(0, currentProd.stockQuantity - item.quantity);
            }
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stockQuantity: newStock,
                status: newStock === 0 ? 'OUT_OF_STOCK' : 'ACTIVE',
              },
            });

            // Record movement
            await tx.inventoryMovement.create({
              data: {
                productId: item.productId,
                movementType: 'SALE_DEDUCTION',
                quantity: -item.quantity,
                previousStock: currentProd.stockQuantity,
                newStock,
                reason: `Customer order ${orderNumber}${item.selectedColor ? ` (Color: ${item.selectedColor})` : ''}`,
                referenceId: order.id,
              },
            });
          }
        }

        // Increment coupon timesUsed
        if (data.couponCode) {
          try {
            await tx.coupon.update({
              where: { code: data.couponCode.trim().toUpperCase() },
              data: { timesUsed: { increment: 1 } },
            });
          } catch {
            // ignore
          }
        }

        return order;
      });

      if (savedOrder && data.rewardPointsRedeemed && data.rewardPointsRedeemed > 0) {
        await redeemRewardPoints(data.customerPhone, data.rewardPointsRedeemed, orderNumber);
      }
    } catch (e) {
      console.warn('[TRANSACTIONAL_ORDER_FALLBACK]', e);
    }
  }

  if (!savedOrder) {
    // In-memory fallback
    savedOrder = {
      id: `ord-${Date.now()}`,
      orderNumber,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      deliveryAddress: data.deliveryAddress,
      deliveryCity: data.deliveryCity,
      deliveryZone: data.deliveryZone,
      subtotal: totals.subtotal,
      discount: totals.discount,
      couponCode: data.couponCode || null,
      deliveryFee: totals.deliveryFee,
      totalAmount: totals.totalAmount,
      paymentMethod: data.paymentMethod,
      paymentStatus: 'UNPAID',
      orderStatus: 'PENDING',
      notes: data.notes || null,
      rewardPointsRedeemed: data.rewardPointsRedeemed || 0,
      rewardDiscount: rewardDiscount,
      fraudRiskScore: data.fraudRiskScore ?? null,
      fraudRiskTier: data.fraudRiskTier ?? null,
      fraudRiskFlags: data.fraudRiskFlags ?? [],
      items: lineItems,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (data.rewardPointsRedeemed && data.rewardPointsRedeemed > 0) {
      await redeemRewardPoints(data.customerPhone, data.rewardPointsRedeemed, orderNumber);
    }

    memoryOrders.unshift(savedOrder);
    saveStoreToDisk();

    // Increment coupon timesUsed in memory
    if (data.couponCode) {
      const targetCode = data.couponCode.trim().toUpperCase();
      const coup = memoryCoupons.find((c) => c.code === targetCode);
      if (coup) {
        coup.timesUsed = (coup.timesUsed || 0) + 1;
        saveStoreToDisk();
      }
    }

    // Deduct stock in memory
    for (const item of lineItems) {
      const prod = memoryProducts.find((p) => p.id === item.productId);
      if (prod) {
        if (item.variantId && prod.colorVariants) {
          const varObj = prod.colorVariants.find((v: any) => v.id === item.variantId || v.name === item.selectedColor);
          if (varObj) {
            varObj.stockQuantity = Math.max(0, varObj.stockQuantity - item.quantity);
          }
        }
        const prev = prod.stockQuantity;
        if (prod.colorVariants && prod.colorVariants.length > 0) {
          const remainingVarStock = prod.colorVariants
            .filter((v: any) => v.isActive !== false)
            .reduce((sum: number, v: any) => sum + (Number(v.stockQuantity) || 0), 0);
          prod.stockQuantity = remainingVarStock;
          prod.status = remainingVarStock > 0 ? 'ACTIVE' : 'OUT_OF_STOCK';
        } else {
          prod.stockQuantity = Math.max(0, prod.stockQuantity - item.quantity);
          if (prod.stockQuantity === 0) prod.status = 'OUT_OF_STOCK';
        }
        memoryMovements.push({
          id: `mov-${Date.now()}`,
          productId: prod.id,
          movementType: 'SALE_DEDUCTION',
          quantity: -item.quantity,
          previousStock: prev,
          newStock: prod.stockQuantity,
          reason: `Customer order ${orderNumber}${item.selectedColor ? ` (Color: ${item.selectedColor})` : ''}`,
          referenceId: savedOrder.id,
          createdAt: new Date(),
        });
      }
    }
  }

  // Deduct flash sale allocated stock if applicable
  for (const item of lineItems) {
    if (item.isFlashSale && item.flashCampaignId) {
      await recordFlashSalePurchase(item.flashCampaignId, item.productId, item.quantity);
    }
  }

  // Queue Telegram Outbox notification
  await queueNotification('NEW_ORDER', {
    orderNumber,
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    deliveryAddress: data.deliveryAddress,
    deliveryCity: data.deliveryCity,
    items: lineItems,
    totalAmount: totals.totalAmount,
    paymentMethod: data.paymentMethod,
    paymentStatus: 'UNPAID',
    createdAt: new Date().toISOString(),
  });

  // Auto-sync to Google Sheets in background
  try {
    const { pushOrderToGoogleSheets } = require('./google-sheets');
    pushOrderToGoogleSheets(savedOrder).catch((e: any) => console.warn('[SHEETS_SYNC_BG_WARN]', e));
  } catch {
    // ignore non-critical sync
  }

  // Increment flash sale item soldCount for any flash deals
  for (const item of lineItems) {
    if (item.isFlashSale && item.flashCampaignId) {
      try {
        await recordFlashSalePurchase(item.flashCampaignId, item.productId, item.quantity);
      } catch (err) {
        console.warn('[RECORD_FLASH_SALE_PURCHASE_FAIL]', err);
      }
    }
  }

  return savedOrder;
}

export async function getOrderByNumber(orderNumber: string, phone?: string) {
  const isConnected = await isDatabaseConnected();
  if (isConnected) {
    try {
      const where: any = { orderNumber, isDeleted: false };
      if (phone) where.customerPhone = phone;

      const order = await prisma.order.findFirst({
        where,
        include: { items: true, payments: true },
      });
      if (order) return order;
    } catch {
      // fallback
    }
  }

  await initMemoryFallback();
  return memoryOrders.find(
    (o) => o.orderNumber === orderNumber && (!phone || o.customerPhone === phone)
  );
}

export async function getAllOrders(filter?: { status?: string; search?: string }) {
  const isConnected = await isDatabaseConnected();
  if (isConnected) {
    try {
      const where: any = { isDeleted: false };
      if (filter?.status && filter.status !== 'ALL') {
        where.orderStatus = filter.status;
      }
      if (filter?.search) {
        where.OR = [
          { orderNumber: { contains: filter.search, mode: 'insensitive' } },
          { customerName: { contains: filter.search, mode: 'insensitive' } },
          { customerPhone: { contains: filter.search, mode: 'insensitive' } },
        ];
      }
      return await prisma.order.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      });
    } catch {
      // fallback
    }
  }

  await initMemoryFallback();
  let list = [...memoryOrders];
  if (filter?.status && filter.status !== 'ALL') {
    list = list.filter((o) => o.orderStatus === filter.status);
  }
  if (filter?.search) {
    const q = filter.search.toLowerCase();
    list = list.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.toLowerCase().includes(q)
    );
  }
  return list;
}

export async function updateOrderStatus(orderId: string, status: string, notes?: string, employeeId?: string) {
  const isConnected = await isDatabaseConnected();
  if (isConnected) {
    try {
      const existing = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (existing) {
        // If transitioning to CANCELLED and was not previously CANCELLED, restore inventory
        if (status === 'CANCELLED' && existing.orderStatus !== 'CANCELLED') {
          for (const item of existing.items) {
            const prod = await prisma.product.findUnique({ where: { id: item.productId } });
            if (prod) {
              const prevStock = prod.stockQuantity;
              const newStock = prevStock + item.quantity;
              await prisma.product.update({
                where: { id: prod.id },
                data: {
                  stockQuantity: newStock,
                  status: newStock > 0 ? 'ACTIVE' : prod.status,
                },
              });

              await prisma.inventoryMovement.create({
                data: {
                  productId: prod.id,
                  movementType: 'ORDER_CANCEL_RELEASE',
                  quantity: item.quantity,
                  previousStock: prevStock,
                  newStock,
                  reason: `Cancelled order ${existing.orderNumber}`,
                  referenceId: existing.id,
                },
              });
            }

            if ((item as any).isFlashSale && (item as any).flashCampaignId) {
              await restoreFlashSaleStock((item as any).flashCampaignId, item.productId, item.quantity);
            }
          }
        }

        const updated = await prisma.order.update({
          where: { id: orderId },
          data: {
            orderStatus: status as any,
            internalNotes: notes,
            assignedEmployeeId: employeeId,
          },
        });

        await logAudit({
          userId: employeeId,
          action: 'UPDATE_ORDER_STATUS',
          entityType: 'ORDER',
          entityId: orderId,
          afterState: { status, notes },
        });

        return updated;
      }
    } catch (e) {
      console.warn('[PRISMA_ORDER_STATUS_FALLBACK]', e);
    }
  }

  await initMemoryFallback();
  const ord = memoryOrders.find((o) => o.id === orderId);
  if (ord) {
    if (status === 'CANCELLED' && ord.orderStatus !== 'CANCELLED') {
      // Restore inventory stock
      for (const item of ord.items) {
        const prod = memoryProducts.find((p) => p.id === item.productId);
        if (prod) {
          const prev = prod.stockQuantity;
          prod.stockQuantity += item.quantity;
          if (prod.stockQuantity > 0) prod.status = 'ACTIVE';
          memoryMovements.push({
            id: `mov-${Date.now()}-${item.productId}`,
            productId: prod.id,
            movementType: 'ORDER_CANCEL_RELEASE',
            quantity: item.quantity,
            previousStock: prev,
            newStock: prod.stockQuantity,
            reason: `Cancelled order ${ord.orderNumber}`,
            referenceId: ord.id,
            createdAt: new Date(),
          });
        }

        if ((item as any).isFlashSale && (item as any).flashCampaignId) {
          await restoreFlashSaleStock((item as any).flashCampaignId, item.productId, item.quantity);
        }
      }

      // Refund redeemed points back to customer balance
      if (ord.rewardPointsRedeemed && ord.rewardPointsRedeemed > 0 && ord.customerPhone) {
        try {
          await creditRewardPoints(
            ord.customerPhone,
            ord.rewardPointsRedeemed,
            `Refund of redeemed points for cancelled order #${ord.orderNumber}`,
            ord.id
          );
        } catch (e) {
          console.warn('[REWARD_POINTS_CANCEL_REFUND_FAIL]', e);
        }
      }

      // Reverse cashback points if already credited from previous DELIVERED status
      if (ord.rewardPointsCredited && ord.pointsEarned && ord.customerPhone) {
        try {
          await redeemRewardPoints(
            ord.customerPhone,
            ord.pointsEarned,
            ord.id
          );
          ord.rewardPointsCredited = false;
        } catch (e) {
          console.warn('[REWARD_POINTS_CANCEL_REVERSAL_FAIL]', e);
        }
      }

      // Restore flash sale stock if order included flash sale deals
      if (Array.isArray(ord.items)) {
        for (const item of ord.items) {
          if (item.isFlashSale && item.flashCampaignId) {
            try {
              await restoreFlashSaleStock(item.flashCampaignId, item.productId, item.quantity);
            } catch (err) {
              console.warn('[FLASH_SALE_CANCEL_RESTORE_FAIL]', err);
            }
          }
        }
      }
    }

    ord.orderStatus = status;
    if (notes) ord.internalNotes = notes;
    ord.updatedAt = new Date();

    // Automatically award loyalty points when order is successfully DELIVERED
    if (status === 'DELIVERED' && !ord.rewardPointsCredited && ord.customerPhone) {
      try {
        const currentSettings = await getStoreSettings();
        if (currentSettings.rewardPointsEnabled) {
          const earnRate = currentSettings.rewardPointsEarnRate || 100;
          const pointsEarned = Math.floor((Number(ord.totalAmount) || 0) / earnRate);
          if (pointsEarned > 0) {
            await creditRewardPoints(
              ord.customerPhone,
              pointsEarned,
              `Cashback points for delivered order #${ord.orderNumber}`,
              ord.id
            );
            ord.rewardPointsCredited = true;
            ord.pointsEarned = pointsEarned;
          }
        }
      } catch (err) {
        console.warn('[REWARD_POINTS_DELIVERY_CREDIT_NOTICE]', err);
      }
    }
    saveStoreToDisk();
  }
  return ord;
}

export async function deleteOrder(
  orderId: string,
  options?: { restoreInventory?: boolean; reason?: string; employeeId?: string }
) {
  const restoreInventory = options?.restoreInventory !== false;
  const employeeId = options?.employeeId;
  const reason = options?.reason || 'Order deleted by Super Admin';

  const isConnected = await isDatabaseConnected();
  if (isConnected) {
    try {
      const existing = await prisma.order.findFirst({
        where: {
          OR: [{ id: orderId }, { orderNumber: orderId }],
        },
        include: { items: true },
      });

      if (existing) {
        // If restoreInventory is requested and order wasn't CANCELLED or RETURNED
        if (restoreInventory && existing.orderStatus !== 'CANCELLED' && existing.orderStatus !== 'RETURNED') {
          for (const item of existing.items) {
            const prod = await prisma.product.findUnique({ where: { id: item.productId } });
            if (prod) {
              const prevStock = prod.stockQuantity;
              const newStock = prevStock + item.quantity;
              await prisma.product.update({
                where: { id: prod.id },
                data: {
                  stockQuantity: newStock,
                  status: newStock > 0 ? 'ACTIVE' : prod.status,
                },
              });

              await prisma.inventoryMovement.create({
                data: {
                  productId: prod.id,
                  movementType: 'ORDER_CANCEL_RELEASE',
                  quantity: item.quantity,
                  previousStock: prevStock,
                  newStock,
                  reason: `Deleted order ${existing.orderNumber} - stock restored`,
                  referenceId: existing.id,
                },
              });
            }
          }
        }

        // Delete order items then order
        await prisma.orderItem.deleteMany({ where: { orderId: existing.id } });
        await prisma.order.delete({ where: { id: existing.id } });

        await logAudit({
          userId: employeeId,
          action: 'DELETE_ORDER',
          entityType: 'ORDER',
          entityId: existing.id,
          afterState: { orderNumber: existing.orderNumber, restoreInventory, reason },
        });

        return { success: true, orderNumber: existing.orderNumber };
      }
    } catch (e) {
      console.warn('[PRISMA_ORDER_DELETE_FALLBACK]', e);
    }
  }

  // Memory fallback
  await initMemoryFallback();
  const store = getStore();
  const existingIndex = store.orders.findIndex(
    (o: any) => o.id === orderId || o.orderNumber === orderId
  );

  if (existingIndex === -1) {
    throw new Error(`Order with ID "${orderId}" not found.`);
  }

  const existing = store.orders[existingIndex];

  if (restoreInventory && existing.orderStatus !== 'CANCELLED' && existing.orderStatus !== 'RETURNED') {
    for (const item of existing.items || []) {
      const prod = store.products.find((p: any) => p.id === item.productId);
      if (prod) {
        const prevStock = prod.stockQuantity;
        prod.stockQuantity = (Number(prod.stockQuantity) || 0) + (Number(item.quantity) || 1);
        if (prod.stockQuantity > 0) prod.status = 'ACTIVE';

        store.movements.push({
          id: `mov-${Date.now()}-${item.productId}`,
          productId: prod.id,
          movementType: 'ORDER_CANCEL_RELEASE',
          quantity: item.quantity,
          previousStock: prevStock,
          newStock: prod.stockQuantity,
          reason: `Deleted order ${existing.orderNumber} - stock restored`,
          referenceId: existing.id,
          createdAt: new Date(),
        });
      }
    }
  }

  // Remove order from memory store
  store.orders.splice(existingIndex, 1);
  saveStoreToDisk();

  await logAudit({
    userId: employeeId,
    action: 'DELETE_ORDER',
    entityType: 'ORDER',
    entityId: existing.id,
    afterState: { orderNumber: existing.orderNumber, restoreInventory, reason },
  });

  return { success: true, orderNumber: existing.orderNumber };
}


export async function getDashboardMetrics() {
  const orders = await getAllOrders();
  const products = await getProducts();
  const expenses = await getExpenses();

  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o: any) => o.orderStatus === 'PENDING').length;
  const inProgressOrders = orders.filter((o: any) => ['CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED'].includes(o.orderStatus)).length;
  const deliveredOrders = orders.filter((o: any) => o.orderStatus === 'DELIVERED').length;
  const cancelledOrders = orders.filter((o: any) => o.orderStatus === 'CANCELLED').length;

  const totalSales = orders
    .filter((o: any) => o.orderStatus !== 'CANCELLED')
    .reduce((s: number, o: any) => s + Number(o.totalAmount), 0);

  const deliveredRevenue = orders
    .filter((o: any) => o.orderStatus === 'DELIVERED')
    .reduce((s: number, o: any) => s + Number(o.totalAmount), 0);

  const collectedCash = orders
    .filter((o: any) => o.paymentStatus === 'PAID')
    .reduce((s: number, o: any) => s + Number(o.totalAmount), 0);

  const outstandingReceivables = orders
    .filter((o: any) => o.paymentStatus !== 'PAID' && o.orderStatus !== 'CANCELLED')
    .reduce((s: number, o: any) => s + Number(o.totalAmount), 0);

  const totalExpenses = expenses.reduce((s: number, e: any) => s + Number(e.amount), 0);

  // Calculate COGS (Cost of goods sold) from delivered orders
  let cogs = 0;
  let hasMissingCost = false;

  for (const o of orders.filter((ord: any) => ord.orderStatus === 'DELIVERED')) {
    if (o.items) {
      for (const itm of o.items) {
        if (!itm.purchaseCost || itm.purchaseCost === 0) {
          hasMissingCost = true;
        }
        cogs += (Number(itm.purchaseCost) || 0) * itm.quantity;
      }
    }
  }

  const grossProfit = deliveredRevenue - cogs;
  const netProfit = grossProfit - totalExpenses;

  const lowStockCount = products.filter((p: any) => p.stockQuantity <= p.lowStockThreshold && p.stockQuantity > 0).length;
  const outOfStockCount = products.filter((p: any) => p.stockQuantity === 0).length;

  return {
    totalOrders,
    pendingOrders,
    inProgressOrders,
    deliveredOrders,
    cancelledOrders,
    totalSales,
    deliveredRevenue,
    collectedCash,
    outstandingReceivables,
    totalExpenses,
    cogs,
    grossProfit,
    netProfit,
    hasMissingCost,
    productCount: products.length,
    lowStockCount,
    outOfStockCount,
    recentOrders: orders.slice(0, 5),
  };
}

export async function getExpenses() {
  const isConnected = await isDatabaseConnected();
  if (isConnected) {
    try {
      return await prisma.expense.findMany({
        where: { isDeleted: false },
        orderBy: { expenseDate: 'desc' },
      });
    } catch {
      // fallback
    }
  }

  await initMemoryFallback();
  return memoryExpenses.filter((e) => !e.isDeleted);
}

export async function addExpense(data: {
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  createdById?: string;
}) {
  const isConnected = await isDatabaseConnected();
  if (isConnected) {
    try {
      return await prisma.expense.create({
        data: {
          category: data.category,
          description: data.description,
          amount: data.amount,
          paymentMethod: data.paymentMethod as any,
          createdById: data.createdById,
        },
      });
    } catch {
      // fallback
    }
  }

  await initMemoryFallback();
  const exp = {
    id: `exp-${Date.now()}`,
    expenseDate: new Date(),
    ...data,
    createdAt: new Date(),
  };
  memoryExpenses.unshift(exp);
  return exp;
}

export async function getUserByEmail(email: string) {
  const isConnected = await isDatabaseConnected();
  if (isConnected) {
    try {
      return await prisma.user.findUnique({
        where: { email },
      });
    } catch {
      // fallback
    }
  }

  await initMemoryFallback();
  return memoryUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export async function getAllUsers() {
  const isConnected = await isDatabaseConnected();
  if (isConnected) {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          role: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      if (users && users.length > 0) {
        return users.map((u: any) => ({
          ...u,
          customPermissions: [],
        }));
      }
    } catch {
      // fallback
    }
  }

  await initMemoryFallback();
  return memoryUsers.map((u) => ({
    id: u.id,
    email: u.email,
    fullName: u.fullName,
    phone: u.phone,
    role: u.role,
    status: u.status,
    customPermissions: u.customPermissions || [],
    lastLoginAt: u.lastLoginAt,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  }));
}

export async function getUserById(id: string) {
  const isConnected = await isDatabaseConnected();
  if (isConnected) {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
      });
      if (user) return user;
    } catch {
      // fallback
    }
  }

  await initMemoryFallback();
  return memoryUsers.find((u) => u.id === id) || null;
}

export async function createUser(data: {
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  password: string;
  status?: string;
  customPermissions?: string[];
}) {
  const cleanEmail = data.email.trim().toLowerCase();
  const existing = await getUserByEmail(cleanEmail);
  if (existing) {
    throw new Error(`An employee with email "${cleanEmail}" is already registered.`);
  }

  const passwordHash = await hashPassword(data.password);
  const isConnected = await isDatabaseConnected();

  if (isConnected) {
    try {
      const created = await prisma.user.create({
        data: {
          email: cleanEmail,
          passwordHash,
          fullName: data.fullName.trim(),
          phone: data.phone ? data.phone.trim() : null,
          role: data.role as any,
          status: (data.status as any) || 'ACTIVE',
        },
      });
      return {
        id: created.id,
        email: created.email,
        fullName: created.fullName,
        phone: created.phone,
        role: created.role,
        status: created.status,
        customPermissions: data.customPermissions || [],
        createdAt: created.createdAt,
      };
    } catch (e: any) {
      console.warn('[PRISMA_CREATE_USER_FALLBACK]', e);
    }
  }

  await initMemoryFallback();
  const newUser = {
    id: `usr-${Date.now()}`,
    email: cleanEmail,
    passwordHash,
    fullName: data.fullName.trim(),
    phone: data.phone ? data.phone.trim() : null,
    role: data.role,
    status: data.status || 'ACTIVE',
    customPermissions: data.customPermissions || [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  memoryUsers.unshift(newUser);
  saveStoreToDisk();
  return {
    id: newUser.id,
    email: newUser.email,
    fullName: newUser.fullName,
    phone: newUser.phone,
    role: newUser.role,
    status: newUser.status,
    customPermissions: newUser.customPermissions,
    createdAt: newUser.createdAt,
  };
}

export async function updateUser(
  id: string,
  data: {
    fullName?: string;
    email?: string;
    phone?: string;
    role?: string;
    status?: string;
    customPermissions?: string[];
  }
) {
  const isConnected = await isDatabaseConnected();

  if (data.email) {
    const cleanEmail = data.email.trim().toLowerCase();
    const existing = await getUserByEmail(cleanEmail);
    if (existing && existing.id !== id) {
      throw new Error(`Email "${cleanEmail}" is already in use by another user.`);
    }
  }

  // Prevent locking out Super Admin
  if (data.status === 'INACTIVE' || (data.role && data.role !== 'SUPER_ADMIN')) {
    const allUsers = await getAllUsers();
    const superAdmins = allUsers.filter((u) => u.role === 'SUPER_ADMIN' && u.status === 'ACTIVE');
    if (superAdmins.length === 1 && superAdmins[0].id === id) {
      throw new Error('Cannot deactivate or remove the last active Super Administrator.');
    }
  }

  if (isConnected) {
    try {
      const updateData: any = {};
      if (data.fullName !== undefined) updateData.fullName = data.fullName.trim();
      if (data.email !== undefined) updateData.email = data.email.trim().toLowerCase();
      if (data.phone !== undefined) updateData.phone = data.phone.trim() || null;
      if (data.role !== undefined) updateData.role = data.role as any;
      if (data.status !== undefined) updateData.status = data.status as any;

      const updated = await prisma.user.update({
        where: { id },
        data: updateData,
      });
      return {
        id: updated.id,
        email: updated.email,
        fullName: updated.fullName,
        phone: updated.phone,
        role: updated.role,
        status: updated.status,
        customPermissions: data.customPermissions || [],
        updatedAt: updated.updatedAt,
      };
    } catch (e: any) {
      console.warn('[PRISMA_UPDATE_USER_FALLBACK]', e);
    }
  }

  await initMemoryFallback();
  const user = memoryUsers.find((u) => u.id === id);
  if (!user) throw new Error(`User with ID "${id}" not found.`);

  if (data.fullName !== undefined) user.fullName = data.fullName.trim();
  if (data.email !== undefined) user.email = data.email.trim().toLowerCase();
  if (data.phone !== undefined) user.phone = data.phone.trim() || null;
  if (data.role !== undefined) user.role = data.role;
  if (data.status !== undefined) user.status = data.status;
  if (data.customPermissions !== undefined) user.customPermissions = data.customPermissions;
  user.updatedAt = new Date();

  saveStoreToDisk();
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    role: user.role,
    status: user.status,
    customPermissions: user.customPermissions || [],
    updatedAt: user.updatedAt,
  };
}

export async function changeUserPassword(id: string, newPassword: string) {
  if (!newPassword || newPassword.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  const passwordHash = await hashPassword(newPassword);
  const isConnected = await isDatabaseConnected();

  if (isConnected) {
    try {
      await prisma.user.update({
        where: { id },
        data: { passwordHash },
      });
      return { success: true };
    } catch (e) {
      console.warn('[PRISMA_CHANGE_PASSWORD_FALLBACK]', e);
    }
  }

  await initMemoryFallback();
  const user = memoryUsers.find((u) => u.id === id);
  if (!user) throw new Error(`User with ID "${id}" not found.`);
  user.passwordHash = passwordHash;
  user.updatedAt = new Date();
  saveStoreToDisk();
  return { success: true };
}

export async function deleteUser(id: string) {
  const allUsers = await getAllUsers();
  const superAdmins = allUsers.filter((u) => u.role === 'SUPER_ADMIN' && u.status === 'ACTIVE');
  if (superAdmins.length === 1 && superAdmins[0].id === id) {
    throw new Error('Cannot delete the last active Super Administrator.');
  }

  const isConnected = await isDatabaseConnected();
  if (isConnected) {
    try {
      await prisma.user.update({
        where: { id },
        data: { status: 'INACTIVE' },
      });
      return { success: true };
    } catch (e) {
      console.warn('[PRISMA_DELETE_USER_FALLBACK]', e);
    }
  }

  await initMemoryFallback();
  const idx = memoryUsers.findIndex((u) => u.id === id);
  if (idx !== -1) {
    memoryUsers[idx].status = 'INACTIVE';
    saveStoreToDisk();
  }
  return { success: true };
}

// ==========================================
// STORE SETTINGS REPOSITORY (PHASE 1)
// ==========================================

export interface StoreSettings {
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
  // Phase 3: Rewards & Loyalty
  rewardPointsEnabled: boolean;
  rewardPointsEarnRate: number; // e.g. 100 means 1 point per ৳100
  rewardPointValueBdt: number;  // e.g. 1 means 1 point = ৳1 BDT
  rewardMinRedeemPoints: number; // e.g. 50
  // Phase 3: Fake COD & Fraud Shield
  fraudDetectionEnabled: boolean;
  fraudMaxCodAmount: number; // e.g. 4000
  fraudHighRiskAdvanceFeeRequired: boolean;
  blacklistedPhones: string[];
  whitelistedPhones: string[];
}

const DEFAULT_STORE_SETTINGS: StoreSettings = {
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
};

export async function getStoreSettings(): Promise<StoreSettings> {
  const isConnected = await isDatabaseConnected();
  if (isConnected) {
    try {
      const setting = await prisma.setting.findUnique({ where: { key: 'mart_store_settings' } });
      if (setting && setting.value) {
        return {
          ...DEFAULT_STORE_SETTINGS,
          ...JSON.parse(setting.value),
        };
      }
    } catch {
      // fallback
    }
  }

  const store = getStore();
  return {
    ...DEFAULT_STORE_SETTINGS,
    ...(store.settings || {}),
  };
}

export async function updateStoreSettings(patch: Partial<StoreSettings>): Promise<StoreSettings> {
  const current = await getStoreSettings();
  const updated: StoreSettings = { ...current, ...patch };

  const isConnected = await isDatabaseConnected();
  if (isConnected) {
    try {
      await prisma.setting.upsert({
        where: { key: 'mart_store_settings' },
        create: {
          key: 'mart_store_settings',
          value: JSON.stringify(updated),
          description: 'Toto Elite Mart Phase 1 Configuration',
        },
        update: {
          value: JSON.stringify(updated),
        },
      });
    } catch (e) {
      console.warn('[PRISMA_SETTINGS_UPDATE_FALLBACK]', e);
    }
  }

  const store = getStore();
  store.settings = updated;
  saveStoreToDisk();
  return updated;
}

// ==========================================
// CUSTOMER REVIEWS REPOSITORY (PHASE 1)
// ==========================================

export interface CustomerReview {
  id: string;
  productId: string;
  customerName: string;
  customerPhone?: string | null;
  rating: number;
  comment: string;
  images: string[];
  isVerified: boolean;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  adminReply?: string | null;
  createdAt: Date | string;
}

export async function getReviewsByProductId(productId: string, status = 'APPROVED'): Promise<CustomerReview[]> {
  const store = getStore();
  const reviews = (store.reviews || []) as CustomerReview[];

  // Find target product to resolve all possible identifiers (ID, slug, SKU, name)
  const pList = (store.products || []) as any[];
  const target = pList.find(
    (p) =>
      p.id === productId ||
      String(p.id).toLowerCase() === productId.toLowerCase() ||
      (p.slug && p.slug.toLowerCase() === productId.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase() === productId.toLowerCase()) ||
      (p.name && p.name.toLowerCase() === productId.toLowerCase())
  );

  const validIdentifiers = new Set<string>([productId.toLowerCase()]);
  if (target) {
    if (target.id) validIdentifiers.add(String(target.id).toLowerCase());
    if (target.slug) validIdentifiers.add(String(target.slug).toLowerCase());
    if (target.sku) validIdentifiers.add(String(target.sku).toLowerCase());
    if (target.name) validIdentifiers.add(String(target.name).toLowerCase());
  }

  return reviews
    .filter((r) => {
      if (!r.productId) return false;
      const rProdId = String(r.productId).toLowerCase();
      const matches = validIdentifiers.has(rProdId);
      return matches && (status === 'ALL' || r.status === status);
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getAllReviews(options?: { status?: string; search?: string }): Promise<CustomerReview[]> {
  const store = getStore();
  let list = [...(store.reviews || [])] as CustomerReview[];

  if (options?.status && options.status !== 'ALL') {
    list = list.filter((r) => r.status === options.status);
  }
  if (options?.search) {
    const q = options.search.toLowerCase();
    list = list.filter(
      (r) =>
        r.customerName.toLowerCase().includes(q) ||
        r.comment.toLowerCase().includes(q) ||
        (r.customerPhone && r.customerPhone.includes(q))
    );
  }
  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function createReview(data: {
  productId: string;
  customerName: string;
  customerPhone?: string;
  rating: number;
  comment: string;
  images?: string[];
  isVerified?: boolean;
  status?: 'APPROVED' | 'PENDING' | 'REJECTED';
}): Promise<CustomerReview> {
  const store = getStore();
  const settings = await getStoreSettings();
  const defaultStatus = data.status || (settings.reviewAutoApprove ? 'APPROVED' : 'PENDING');

  // Canonicalize productId to product ID
  let canonicalProductId = data.productId;
  const pList = (store.products || []) as any[];
  const matchedProd = pList.find(
    (p) =>
      p.id === data.productId ||
      String(p.id).toLowerCase() === data.productId.toLowerCase() ||
      (p.slug && p.slug.toLowerCase() === data.productId.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase() === data.productId.toLowerCase()) ||
      (p.name && p.name.toLowerCase() === data.productId.toLowerCase())
  );
  if (matchedProd && matchedProd.id) {
    canonicalProductId = matchedProd.id;
  }

  const newReview: CustomerReview = {
    id: `rev-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    productId: canonicalProductId,
    customerName: data.customerName.trim(),
    customerPhone: data.customerPhone?.trim() || null,
    rating: Math.max(1, Math.min(5, Number(data.rating) || 5)),
    comment: data.comment.trim(),
    images: Array.isArray(data.images) ? data.images.filter(Boolean) : [],
    isVerified: data.isVerified !== false,
    status: defaultStatus,
    createdAt: new Date(),
  };

  store.reviews = store.reviews || [];
  store.reviews.unshift(newReview);
  saveStoreToDisk();
  return newReview;
}

export async function auditAndSyncAllReviews(): Promise<{
  totalReviews: number;
  fixedReviews: number;
  totalProducts: number;
  syncedProducts: number;
}> {
  const store = getStore();
  const products = (store.products || []) as any[];
  const reviews = (store.reviews || []) as CustomerReview[];

  let fixed = 0;
  reviews.forEach((r) => {
    const matched = products.find(
      (p) =>
        p.id === r.productId ||
        String(p.id).toLowerCase() === String(r.productId).toLowerCase() ||
        (p.slug && p.slug.toLowerCase() === String(r.productId).toLowerCase()) ||
        (p.sku && p.sku.toLowerCase() === String(r.productId).toLowerCase()) ||
        (p.name && p.name.toLowerCase() === String(r.productId).toLowerCase())
    );
    if (matched && matched.id && r.productId !== matched.id) {
      r.productId = matched.id;
      fixed++;
    }
  });

  if (fixed > 0) {
    saveStoreToDisk();
  }

  return {
    totalReviews: reviews.length,
    fixedReviews: fixed,
    totalProducts: products.length,
    syncedProducts: products.filter((p) => {
      const stats = attachSingleReviewStats(p);
      return stats && stats.reviewCount > 0;
    }).length,
  };
}

export async function updateReviewStatus(
  id: string,
  status: 'APPROVED' | 'PENDING' | 'REJECTED',
  adminReply?: string
): Promise<CustomerReview | null> {
  const store = getStore();
  const rev = (store.reviews || []).find((r: CustomerReview) => r.id === id);
  if (!rev) return null;

  rev.status = status;
  if (adminReply !== undefined) rev.adminReply = adminReply;
  saveStoreToDisk();
  return rev;
}

export async function updateReview(
  id: string,
  data: Partial<Omit<CustomerReview, 'id' | 'createdAt'>>
): Promise<CustomerReview | null> {
  const store = getStore();
  const rev = (store.reviews || []).find((r: CustomerReview) => r.id === id);
  if (!rev) return null;

  if (data.productId !== undefined) rev.productId = data.productId;
  if (data.customerName !== undefined) rev.customerName = data.customerName.trim();
  if (data.customerPhone !== undefined) rev.customerPhone = data.customerPhone ? data.customerPhone.trim() : null;
  if (data.rating !== undefined) rev.rating = Math.max(1, Math.min(5, Number(data.rating) || 5));
  if (data.comment !== undefined) rev.comment = data.comment.trim();
  if (data.images !== undefined) rev.images = Array.isArray(data.images) ? data.images.filter(Boolean) : [];
  if (data.isVerified !== undefined) rev.isVerified = Boolean(data.isVerified);
  if (data.status !== undefined) rev.status = data.status;
  if (data.adminReply !== undefined) rev.adminReply = data.adminReply ? data.adminReply.trim() : null;

  saveStoreToDisk();
  return rev;
}

export async function deleteReview(id: string): Promise<boolean> {
  const store = getStore();
  const initialLen = (store.reviews || []).length;
  store.reviews = (store.reviews || []).filter((r: CustomerReview) => r.id !== id);
  if (store.reviews.length !== initialLen) {
    saveStoreToDisk();
    return true;
  }
  return false;
}

// ==========================================
// ELITE REWARDS & LOYALTY REPOSITORY (PHASE 3)
// ==========================================

export interface RewardTransaction {
  id: string;
  type: 'EARNED' | 'REDEEMED' | 'ADJUSTED_CREDIT' | 'ADJUSTED_DEBIT';
  points: number;
  reason: string;
  orderId?: string | null;
  createdAt: string;
}

export interface CustomerRewardProfile {
  phone: string;
  points: number;
  totalEarned: number;
  totalRedeemed: number;
  history: RewardTransaction[];
  updatedAt: string;
}

export async function getCustomerRewardProfile(phone: string): Promise<CustomerRewardProfile> {
  const normalized = normalizeBdPhone(phone);
  const store = getStore();
  if (!store.rewards) store.rewards = {};
  if (!store.rewards[normalized]) {
    store.rewards[normalized] = {
      phone: normalized,
      points: 0,
      totalEarned: 0,
      totalRedeemed: 0,
      history: [],
      updatedAt: new Date().toISOString(),
    };
  }
  return store.rewards[normalized];
}

export async function creditRewardPoints(
  phone: string,
  points: number,
  reason: string,
  orderId?: string
): Promise<CustomerRewardProfile> {
  const profile = await getCustomerRewardProfile(phone);
  const pts = Math.max(0, Math.floor(points));
  if (pts <= 0) return profile;

  profile.points += pts;
  profile.totalEarned += pts;
  profile.history.unshift({
    id: `rw-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: 'EARNED',
    points: pts,
    reason,
    orderId: orderId || null,
    createdAt: new Date().toISOString(),
  });
  profile.updatedAt = new Date().toISOString();
  saveStoreToDisk();
  return profile;
}

export async function redeemRewardPoints(
  phone: string,
  points: number,
  orderId?: string
): Promise<{ success: boolean; redeemedPoints: number; remainingPoints: number; message: string }> {
  const profile = await getCustomerRewardProfile(phone);
  const pts = Math.max(0, Math.floor(points));
  if (pts <= 0) {
    return { success: false, redeemedPoints: 0, remainingPoints: profile.points, message: 'Invalid point amount' };
  }
  if (profile.points < pts) {
    return {
      success: false,
      redeemedPoints: 0,
      remainingPoints: profile.points,
      message: `Insufficient points. Available: ${profile.points}`,
    };
  }

  profile.points -= pts;
  profile.totalRedeemed += pts;
  profile.history.unshift({
    id: `rw-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: 'REDEEMED',
    points: pts,
    reason: `Redeemed for order discount`,
    orderId: orderId || null,
    createdAt: new Date().toISOString(),
  });
  profile.updatedAt = new Date().toISOString();
  saveStoreToDisk();

  return { success: true, redeemedPoints: pts, remainingPoints: profile.points, message: 'Points successfully redeemed' };
}

// ==========================================
// FRAUD & BLACKLIST REPOSITORY (PHASE 3)
// ==========================================

export async function getBlacklistedPhones(): Promise<string[]> {
  const settings = await getStoreSettings();
  const store = getStore();
  const set = new Set([...(settings.blacklistedPhones || []), ...(store.fraudBlacklist || [])]);
  return Array.from(set).map(normalizeBdPhone).filter(Boolean);
}

export async function addBlacklistedPhone(phone: string): Promise<string[]> {
  const normalized = normalizeBdPhone(phone);
  if (!normalized) return await getBlacklistedPhones();

  const store = getStore();
  if (!Array.isArray(store.fraudBlacklist)) store.fraudBlacklist = [];
  if (!store.fraudBlacklist.includes(normalized)) {
    store.fraudBlacklist.push(normalized);
  }

  // Also remove from whitelist if present
  if (Array.isArray(store.fraudWhitelist)) {
    store.fraudWhitelist = store.fraudWhitelist.filter((p) => p !== normalized);
  }

  await updateStoreSettings({
    blacklistedPhones: store.fraudBlacklist,
    whitelistedPhones: store.fraudWhitelist,
  });

  saveStoreToDisk();
  return store.fraudBlacklist;
}

export async function removeBlacklistedPhone(phone: string): Promise<string[]> {
  const normalized = normalizeBdPhone(phone);
  const store = getStore();
  if (Array.isArray(store.fraudBlacklist)) {
    store.fraudBlacklist = store.fraudBlacklist.filter((p) => p !== normalized);
  }
  await updateStoreSettings({
    blacklistedPhones: store.fraudBlacklist || [],
  });
  saveStoreToDisk();
  return store.fraudBlacklist || [];
}

export async function getWhitelistedPhones(): Promise<string[]> {
  const settings = await getStoreSettings();
  const store = getStore();
  const set = new Set([...(settings.whitelistedPhones || []), ...(store.fraudWhitelist || [])]);
  return Array.from(set).map(normalizeBdPhone).filter(Boolean);
}

export async function addWhitelistedPhone(phone: string): Promise<string[]> {
  const normalized = normalizeBdPhone(phone);
  if (!normalized) return await getWhitelistedPhones();

  const store = getStore();
  if (!Array.isArray(store.fraudWhitelist)) store.fraudWhitelist = [];
  if (!store.fraudWhitelist.includes(normalized)) {
    store.fraudWhitelist.push(normalized);
  }

  // Also remove from blacklist if present
  if (Array.isArray(store.fraudBlacklist)) {
    store.fraudBlacklist = store.fraudBlacklist.filter((p) => p !== normalized);
  }

  await updateStoreSettings({
    blacklistedPhones: store.fraudBlacklist,
    whitelistedPhones: store.fraudWhitelist,
  });

  saveStoreToDisk();
  return store.fraudWhitelist;
}

export async function removeWhitelistedPhone(phone: string): Promise<string[]> {
  const normalized = normalizeBdPhone(phone);
  const store = getStore();
  if (Array.isArray(store.fraudWhitelist)) {
    store.fraudWhitelist = store.fraudWhitelist.filter((p) => p !== normalized);
  }
  await updateStoreSettings({
    whitelistedPhones: store.fraudWhitelist || [],
  });
  saveStoreToDisk();
  return store.fraudWhitelist || [];
}

// ==========================================
// FLASH SALE MANAGEMENT REPOSITORY
// ==========================================

export interface FlashSaleItemData {
  id: string;
  campaignId: string;
  productId: string;
  flashPrice: number;
  originalPrice: number;
  allocatedStock: number;
  soldCount: number;
  sortOrder?: number;
  remainingStock?: number;
  isSoldOut?: boolean;
  discountPercent?: number;
  product?: any;
}

export interface FlashSaleCampaignData {
  id: string;
  title: string;
  subtitle?: string | null;
  bannerUrl?: string | null;
  startDate: string;
  endDate: string;
  status: 'SCHEDULED' | 'ACTIVE' | 'ENDED' | 'CANCELLED';
  isActive: boolean;
  items: FlashSaleItemData[];
  createdAt: string;
  updatedAt: string;
}

export function computeAuthoritativeCampaignStatus(
  campaign: { startDate: string | Date; endDate: string | Date; status?: string; isActive?: boolean },
  nowMs: number = Date.now()
): 'SCHEDULED' | 'ACTIVE' | 'ENDED' | 'CANCELLED' {
  if (campaign.status === 'CANCELLED' || campaign.isActive === false) {
    return 'CANCELLED';
  }
  const startMs = new Date(campaign.startDate).getTime();
  const endMs = new Date(campaign.endDate).getTime();
  if (nowMs < startMs) {
    return 'SCHEDULED';
  }
  if (nowMs >= startMs && nowMs <= endMs) {
    return 'ACTIVE';
  }
  return 'ENDED';
}

export async function getActiveFlashSaleCampaign(): Promise<{
  campaign: FlashSaleCampaignData | null;
  serverTime: string;
  secondsRemaining: number;
}> {
  const now = new Date();
  const nowIso = now.toISOString();
  const nowMs = now.getTime();

  const isConnected = await isDatabaseConnected();
  if (isConnected) {
    try {
      const activePrisma = await (prisma as any).flashSaleCampaign.findFirst({
        where: {
          isActive: true,
          status: { in: ['ACTIVE', 'SCHEDULED'] },
          startDate: { lte: now },
          endDate: { gte: now },
        },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: { orderBy: { sortOrder: 'asc' } },
                  category: true,
                },
              },
            },
            orderBy: { sortOrder: 'asc' },
          },
        },
        orderBy: { startDate: 'desc' },
      });

      if (activePrisma) {
        const computedStatus = computeAuthoritativeCampaignStatus(activePrisma, nowMs);
        if (computedStatus === 'ACTIVE') {
          const endMs = new Date(activePrisma.endDate).getTime();
          const mappedItems: FlashSaleItemData[] = activePrisma.items.map((it: any) => {
            const prod = it.product;
            const originalPrice = Number(it.originalPrice || prod.sellingPrice);
            const flashPrice = Number(it.flashPrice);
            const allocatedStock = Number(it.allocatedStock);
            const soldCount = Number(it.soldCount || 0);
            const remainingStock = Math.max(0, allocatedStock - soldCount);
            const discountPercent = originalPrice > 0 ? Math.round(((originalPrice - flashPrice) / originalPrice) * 100) : 0;
            return {
              id: it.id,
              campaignId: it.campaignId,
              productId: it.productId,
              flashPrice,
              originalPrice,
              allocatedStock,
              soldCount,
              sortOrder: it.sortOrder,
              remainingStock,
              isSoldOut: soldCount >= allocatedStock || prod.stockQuantity <= 0,
              discountPercent,
              product: {
                ...prod,
                purchaseCost: Number(prod.purchaseCost || 0),
                sellingPrice: Number(prod.sellingPrice),
                salePrice: prod.salePrice ? Number(prod.salePrice) : null,
              },
            };
          });

          return {
            campaign: {
              id: activePrisma.id,
              title: activePrisma.title,
              subtitle: activePrisma.subtitle,
              bannerUrl: activePrisma.bannerUrl,
              startDate: new Date(activePrisma.startDate).toISOString(),
              endDate: new Date(activePrisma.endDate).toISOString(),
              status: 'ACTIVE',
              isActive: true,
              items: mappedItems,
              createdAt: new Date(activePrisma.createdAt).toISOString(),
              updatedAt: new Date(activePrisma.updatedAt).toISOString(),
            },
            serverTime: nowIso,
            secondsRemaining: Math.max(0, Math.floor((endMs - nowMs) / 1000)),
          };
        }
      }
    } catch (e) {
      console.warn('[PRISMA_ACTIVE_FLASH_SALE_FALLBACK]', e);
    }
  }

  // In-memory fallback
  const store = getStore();
  const allCampaigns: FlashSaleCampaignData[] = store.flashSaleCampaigns || [];
  const activeCampaign = allCampaigns.find((c) => {
    const computed = computeAuthoritativeCampaignStatus(c, nowMs);
    return computed === 'ACTIVE' && c.isActive !== false;
  });

  if (!activeCampaign) {
    return {
      campaign: null,
      serverTime: nowIso,
      secondsRemaining: 0,
    };
  }

  const endMs = new Date(activeCampaign.endDate).getTime();
  const allProds = await getProducts();

  const mappedItems: FlashSaleItemData[] = (activeCampaign.items || []).map((it) => {
    const prod = allProds.find((p: any) => p.id === it.productId) || {
      id: it.productId,
      name: 'Flash Sale Product',
      stockQuantity: 10,
      images: [],
    };
    const originalPrice = Number(it.originalPrice || prod.sellingPrice || 1000);
    const flashPrice = Number(it.flashPrice);
    const allocatedStock = Number(it.allocatedStock);
    const soldCount = Number(it.soldCount || 0);
    const remainingStock = Math.max(0, allocatedStock - soldCount);
    const discountPercent = originalPrice > 0 ? Math.round(((originalPrice - flashPrice) / originalPrice) * 100) : 0;

    return {
      ...it,
      flashPrice,
      originalPrice,
      allocatedStock,
      soldCount,
      remainingStock,
      isSoldOut: soldCount >= allocatedStock || Number(prod.stockQuantity) <= 0,
      discountPercent,
      product: prod,
    };
  });

  return {
    campaign: {
      ...activeCampaign,
      status: 'ACTIVE',
      items: mappedItems,
    },
    serverTime: nowIso,
    secondsRemaining: Math.max(0, Math.floor((endMs - nowMs) / 1000)),
  };
}

export async function getFlashSaleProductDeal(productId: string): Promise<{
  isFlashSale: boolean;
  campaignId: string;
  flashPrice: number;
  originalPrice: number;
  remainingStock: number;
  discountPercent: number;
} | null> {
  const { campaign } = await getActiveFlashSaleCampaign();
  if (!campaign || campaign.status !== 'ACTIVE') return null;

  const item = (campaign.items || []).find((i) => i.productId === productId);
  if (!item) return null;

  const remaining = Math.max(0, item.allocatedStock - item.soldCount);
  if (remaining <= 0) return null;

  return {
    isFlashSale: true,
    campaignId: campaign.id,
    flashPrice: Number(item.flashPrice),
    originalPrice: Number(item.originalPrice),
    remainingStock: remaining,
    discountPercent: (item as any).discountPercent || Math.round(((item.originalPrice - item.flashPrice) / item.originalPrice) * 100),
  };
}

export async function getAllFlashSaleCampaigns(): Promise<any[]> {
  const nowMs = Date.now();
  const isConnected = await isDatabaseConnected();
  if (isConnected) {
    try {
      const campaigns = await (prisma as any).flashSaleCampaign.findMany({
        include: {
          items: {
            include: {
              product: {
                select: { id: true, name: true, sku: true, sellingPrice: true, stockQuantity: true, images: true },
              },
            },
            orderBy: { sortOrder: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return campaigns.map((c: any) => {
        const computedStatus = computeAuthoritativeCampaignStatus(c, nowMs);
        const totalAllocated = c.items.reduce((s: number, i: any) => s + (Number(i.allocatedStock) || 0), 0);
        const totalSold = c.items.reduce((s: number, i: any) => s + (Number(i.soldCount) || 0), 0);
        const totalRevenue = c.items.reduce(
          (s: number, i: any) => s + (Number(i.soldCount) || 0) * (Number(i.flashPrice) || 0),
          0
        );
        return {
          ...c,
          startDate: new Date(c.startDate).toISOString(),
          endDate: new Date(c.endDate).toISOString(),
          computedStatus,
          totalAllocated,
          totalSold,
          totalRevenue,
          items: c.items.map((i: any) => ({
            ...i,
            flashPrice: Number(i.flashPrice),
            originalPrice: Number(i.originalPrice),
            allocatedStock: Number(i.allocatedStock),
            soldCount: Number(i.soldCount || 0),
          })),
        };
      });
    } catch (e) {
      console.warn('[PRISMA_ALL_FLASH_SALE_FALLBACK]', e);
    }
  }

  // In-memory fallback
  const store = getStore();
  const allCampaigns: FlashSaleCampaignData[] = store.flashSaleCampaigns || [];
  const allProds = await getProducts();

  return allCampaigns.map((c) => {
    const computedStatus = computeAuthoritativeCampaignStatus(c, nowMs);
    const totalAllocated = (c.items || []).reduce((s, i) => s + (Number(i.allocatedStock) || 0), 0);
    const totalSold = (c.items || []).reduce((s, i) => s + (Number(i.soldCount) || 0), 0);
    const totalRevenue = (c.items || []).reduce(
      (s, i) => s + (Number(i.soldCount) || 0) * (Number(i.flashPrice) || 0),
      0
    );

    const enrichedItems = (c.items || []).map((i) => {
      const prod = allProds.find((p: any) => p.id === i.productId);
      return {
        ...i,
        product: prod || { name: 'Product ' + i.productId },
      };
    });

    return {
      ...c,
      computedStatus,
      totalAllocated,
      totalSold,
      totalRevenue,
      items: enrichedItems,
    };
  });
}

export async function createFlashSaleCampaign(data: {
  title: string;
  subtitle?: string;
  bannerUrl?: string;
  startDate: string;
  endDate: string;
  status?: 'SCHEDULED' | 'ACTIVE' | 'ENDED' | 'CANCELLED';
  isActive?: boolean;
  items: Array<{
    productId: string;
    flashPrice: number;
    originalPrice?: number;
    allocatedStock: number;
  }>;
}): Promise<any> {
  const isConnected = await isDatabaseConnected();
  const allProds = await getProducts();

  if (isConnected) {
    try {
      const created = await (prisma as any).flashSaleCampaign.create({
        data: {
          title: data.title,
          subtitle: data.subtitle || null,
          bannerUrl: data.bannerUrl || null,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          status: data.status || 'SCHEDULED',
          isActive: data.isActive !== false,
          items: {
            create: data.items.map((i, idx) => {
              const prod = allProds.find((p: any) => p.id === i.productId);
              const orig = i.originalPrice || (prod ? Number(prod.sellingPrice) : Number(i.flashPrice));
              return {
                productId: i.productId,
                flashPrice: Number(i.flashPrice),
                originalPrice: orig,
                allocatedStock: Number(i.allocatedStock) || 1,
                soldCount: 0,
                sortOrder: idx + 1,
              };
            }),
          },
        },
        include: { items: true },
      });
      return created;
    } catch (e) {
      console.warn('[PRISMA_CREATE_FLASH_SALE_FALLBACK]', e);
    }
  }

  // Memory fallback
  const store = getStore();
  if (!Array.isArray(store.flashSaleCampaigns)) store.flashSaleCampaigns = [];

  const newId = `fsc-${Date.now()}`;
  const campaignItems: FlashSaleItemData[] = data.items.map((i, idx) => {
    const prod = allProds.find((p: any) => p.id === i.productId);
    const orig = i.originalPrice || (prod ? Number(prod.sellingPrice) : Number(i.flashPrice));
    return {
      id: `fsi-${Date.now()}-${idx}`,
      campaignId: newId,
      productId: i.productId,
      flashPrice: Number(i.flashPrice),
      originalPrice: orig,
      allocatedStock: Number(i.allocatedStock) || 1,
      soldCount: 0,
      sortOrder: idx + 1,
    };
  });

  const newCampaign: FlashSaleCampaignData = {
    id: newId,
    title: data.title,
    subtitle: data.subtitle || '',
    bannerUrl: data.bannerUrl || '',
    startDate: new Date(data.startDate).toISOString(),
    endDate: new Date(data.endDate).toISOString(),
    status: data.status || 'SCHEDULED',
    isActive: data.isActive !== false,
    items: campaignItems,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.flashSaleCampaigns.unshift(newCampaign);
  saveStoreToDisk();
  return newCampaign;
}

export async function updateFlashSaleCampaign(
  id: string,
  data: Partial<{
    title: string;
    subtitle: string;
    bannerUrl: string;
    startDate: string;
    endDate: string;
    status: 'SCHEDULED' | 'ACTIVE' | 'ENDED' | 'CANCELLED';
    isActive: boolean;
    items: Array<{
      productId: string;
      flashPrice: number;
      originalPrice?: number;
      allocatedStock: number;
      soldCount?: number;
    }>;
  }>
): Promise<any> {
  const isConnected = await isDatabaseConnected();
  const allProds = await getProducts();

  if (isConnected) {
    try {
      const updateData: any = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.subtitle !== undefined) updateData.subtitle = data.subtitle;
      if (data.bannerUrl !== undefined) updateData.bannerUrl = data.bannerUrl;
      if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
      if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);
      if (data.status !== undefined) updateData.status = data.status;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;

      if (Array.isArray(data.items)) {
        await (prisma as any).flashSaleItem.deleteMany({ where: { campaignId: id } });
        updateData.items = {
          create: data.items.map((i, idx) => {
            const prod = allProds.find((p: any) => p.id === i.productId);
            const orig = i.originalPrice || (prod ? Number(prod.sellingPrice) : Number(i.flashPrice));
            return {
              productId: i.productId,
              flashPrice: Number(i.flashPrice),
              originalPrice: orig,
              allocatedStock: Number(i.allocatedStock) || 1,
              soldCount: Number(i.soldCount || 0),
              sortOrder: idx + 1,
            };
          }),
        };
      }

      return await (prisma as any).flashSaleCampaign.update({
        where: { id },
        data: updateData,
        include: { items: true },
      });
    } catch (e) {
      console.warn('[PRISMA_UPDATE_FLASH_SALE_FALLBACK]', e);
    }
  }

  // Memory fallback
  const store = getStore();
  if (!Array.isArray(store.flashSaleCampaigns)) store.flashSaleCampaigns = [];
  const campaign = store.flashSaleCampaigns.find((c) => c.id === id);
  if (!campaign) throw new Error('Flash sale campaign not found');

  if (data.title !== undefined) campaign.title = data.title;
  if (data.subtitle !== undefined) campaign.subtitle = data.subtitle;
  if (data.bannerUrl !== undefined) campaign.bannerUrl = data.bannerUrl;
  if (data.startDate !== undefined) campaign.startDate = new Date(data.startDate).toISOString();
  if (data.endDate !== undefined) campaign.endDate = new Date(data.endDate).toISOString();
  if (data.status !== undefined) campaign.status = data.status;
  if (data.isActive !== undefined) campaign.isActive = data.isActive;

  if (Array.isArray(data.items)) {
    campaign.items = data.items.map((i, idx) => {
      const prod = allProds.find((p: any) => p.id === i.productId);
      const orig = i.originalPrice || (prod ? Number(prod.sellingPrice) : Number(i.flashPrice));
      const existing = (campaign.items || []).find((old: any) => old.productId === i.productId);
      return {
        id: existing?.id || `fsi-${Date.now()}-${idx}`,
        campaignId: campaign.id,
        productId: i.productId,
        flashPrice: Number(i.flashPrice),
        originalPrice: orig,
        allocatedStock: Number(i.allocatedStock) || 1,
        soldCount: i.soldCount !== undefined ? Number(i.soldCount) : (existing?.soldCount || 0),
        sortOrder: idx + 1,
      };
    });
  }
  campaign.updatedAt = new Date().toISOString();
  saveStoreToDisk();
  return campaign;
}

export async function deleteFlashSaleCampaign(id: string): Promise<boolean> {
  const isConnected = await isDatabaseConnected();
  if (isConnected) {
    try {
      await (prisma as any).flashSaleCampaign.delete({ where: { id } });
      return true;
    } catch (e) {
      console.warn('[PRISMA_DELETE_FLASH_SALE_FALLBACK]', e);
    }
  }

  const store = getStore();
  if (Array.isArray(store.flashSaleCampaigns)) {
    store.flashSaleCampaigns = store.flashSaleCampaigns.filter((c) => c.id !== id);
    saveStoreToDisk();
  }
  return true;
}

export async function recordFlashSalePurchase(campaignId: string, productId: string, quantity: number): Promise<void> {
  const isConnected = await isDatabaseConnected();
  if (isConnected) {
    try {
      await (prisma as any).flashSaleItem.updateMany({
        where: { campaignId, productId },
        data: { soldCount: { increment: quantity } },
      });
      return;
    } catch (e) {
      console.warn('[PRISMA_RECORD_FLASH_SALE_PURCHASE_FALLBACK]', e);
    }
  }

  const store = getStore();
  const campaign = (store.flashSaleCampaigns || []).find((c) => c.id === campaignId);
  if (campaign && Array.isArray(campaign.items)) {
    const item = campaign.items.find((i: any) => i.productId === productId);
    if (item) {
      item.soldCount = (Number(item.soldCount) || 0) + quantity;
      saveStoreToDisk();
    }
  }
}

export async function restoreFlashSaleStock(campaignId: string, productId: string, quantity: number): Promise<void> {
  const isConnected = await isDatabaseConnected();
  if (isConnected) {
    try {
      const item = await (prisma as any).flashSaleItem.findFirst({ where: { campaignId, productId } });
      if (item) {
        await (prisma as any).flashSaleItem.update({
          where: { id: item.id },
          data: { soldCount: Math.max(0, item.soldCount - quantity) },
        });
      }
      return;
    } catch (e) {
      console.warn('[PRISMA_RESTORE_FLASH_SALE_STOCK_FALLBACK]', e);
    }
  }

  const store = getStore();
  const campaign = (store.flashSaleCampaigns || []).find((c) => c.id === campaignId);
  if (campaign && Array.isArray(campaign.items)) {
    const item = campaign.items.find((i: any) => i.productId === productId);
    if (item) {
      item.soldCount = Math.max(0, (Number(item.soldCount) || 0) - quantity);
      saveStoreToDisk();
    }
  }
}



