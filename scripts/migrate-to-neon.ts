/**
 * Toto Elite Mart - Neon Database Migration & Restore Utility
 * 
 * Usage:
 *   npx tsx scripts/migrate-to-neon.ts "postgresql://username:password@ep-xxxx.neon.tech/neondb?sslmode=require"
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

async function migrate() {
  const neonUrl = process.argv[2] || process.env.NEON_DATABASE_URL;

  if (!neonUrl) {
    console.error('\n❌ ERROR: Neon Database URL is required!');
    console.log('\nUsage:');
    console.log('  npx tsx scripts/migrate-to-neon.ts "postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require"\n');
    process.exit(1);
  }

  console.log('\n🚀 CONNECTING TO NEON DATABASE...');
  const neonPrisma = new PrismaClient({
    datasources: {
      db: {
        url: neonUrl,
      },
    },
  });

  const backupDir = path.join(process.cwd(), 'backups');
  const files = fs.readdirSync(backupDir).filter(f => f.startsWith('db_backup_') && f.endsWith('.json'));
  if (files.length === 0) {
    console.error('❌ No backup files found in backups/ directory!');
    process.exit(1);
  }

  // Get latest backup
  files.sort().reverse();
  const latestBackupFile = path.join(backupDir, files[0]);
  console.log(`📦 Loading backup from: ${files[0]}...`);
  const backup = JSON.parse(fs.readFileSync(latestBackupFile, 'utf8'));

  try {
    const { tables } = backup;

    console.log('\n--- RESTORING DATA TO NEON ---');

    // 1. Users
    if (tables.User?.length) {
      console.log(`Restoring ${tables.User.length} Users...`);
      for (const u of tables.User) {
        await neonPrisma.user.upsert({
          where: { id: u.id },
          create: u,
          update: u,
        });
      }
    }

    // 2. Categories
    if (tables.Category?.length) {
      console.log(`Restoring ${tables.Category.length} Categories...`);
      for (const c of tables.Category) {
        await neonPrisma.category.upsert({
          where: { id: c.id },
          create: c,
          update: c,
        });
      }
    }

    // 3. Products
    if (tables.Product?.length) {
      console.log(`Restoring ${tables.Product.length} Products...`);
      for (const p of tables.Product) {
        await neonPrisma.product.upsert({
          where: { id: p.id },
          create: p,
          update: p,
        });
      }
    }

    // 4. ColorVariants
    if (tables.ColorVariant?.length) {
      console.log(`Restoring ${tables.ColorVariant.length} Color Variants...`);
      for (const cv of tables.ColorVariant) {
        await neonPrisma.colorVariant.upsert({
          where: { id: cv.id },
          create: cv,
          update: cv,
        });
      }
    }

    // 5. ProductImages
    if (tables.ProductImage?.length) {
      console.log(`Restoring ${tables.ProductImage.length} Product Images...`);
      for (const img of tables.ProductImage) {
        await neonPrisma.productImage.upsert({
          where: { id: img.id },
          create: img,
          update: img,
        });
      }
    }

    // 6. ProductRedirects
    if (tables.ProductRedirect?.length) {
      console.log(`Restoring ${tables.ProductRedirect.length} Product Redirects...`);
      for (const r of tables.ProductRedirect) {
        await neonPrisma.productRedirect.upsert({
          where: { id: r.id },
          create: r,
          update: r,
        });
      }
    }

    // 7. Banners
    if (tables.Banner?.length) {
      console.log(`Restoring ${tables.Banner.length} Banners...`);
      for (const b of tables.Banner) {
        await neonPrisma.banner.upsert({
          where: { id: b.id },
          create: b,
          update: b,
        });
      }
    }

    // 8. Coupons
    if (tables.Coupon?.length) {
      console.log(`Restoring ${tables.Coupon.length} Coupons...`);
      for (const cp of tables.Coupon) {
        await neonPrisma.coupon.upsert({
          where: { id: cp.id },
          create: cp,
          update: cp,
        });
      }
    }

    // 9. Customers
    if (tables.Customer?.length) {
      console.log(`Restoring ${tables.Customer.length} Customers...`);
      for (const cust of tables.Customer) {
        await neonPrisma.customer.upsert({
          where: { id: cust.id },
          create: cust,
          update: cust,
        });
      }
    }

    // 10. Orders
    if (tables.Order?.length) {
      console.log(`Restoring ${tables.Order.length} Orders...`);
      for (const ord of tables.Order) {
        await neonPrisma.order.upsert({
          where: { id: ord.id },
          create: ord,
          update: ord,
        });
      }
    }

    // 11. OrderItems
    if (tables.OrderItem?.length) {
      console.log(`Restoring ${tables.OrderItem.length} Order Items...`);
      for (const oi of tables.OrderItem) {
        await neonPrisma.orderItem.upsert({
          where: { id: oi.id },
          create: oi,
          update: oi,
        });
      }
    }

    // 12. OrderStatusHistory
    if (tables.OrderStatusHistory?.length) {
      console.log(`Restoring ${tables.OrderStatusHistory.length} Status History...`);
      for (const sh of tables.OrderStatusHistory) {
        await neonPrisma.orderStatusHistory.upsert({
          where: { id: sh.id },
          create: sh,
          update: sh,
        });
      }
    }

    // 13. FlashSaleCampaigns & Items
    if (tables.FlashSaleCampaign?.length) {
      console.log(`Restoring ${tables.FlashSaleCampaign.length} Flash Sale Campaigns...`);
      for (const fsc of tables.FlashSaleCampaign) {
        await neonPrisma.flashSaleCampaign.upsert({
          where: { id: fsc.id },
          create: fsc,
          update: fsc,
        });
      }
    }
    if (tables.FlashSaleItem?.length) {
      console.log(`Restoring ${tables.FlashSaleItem.length} Flash Sale Items...`);
      for (const fsi of tables.FlashSaleItem) {
        await neonPrisma.flashSaleItem.upsert({
          where: { id: fsi.id },
          create: fsi,
          update: fsi,
        });
      }
    }

    console.log('\n🎉 ALL DATA SUCCESSFULLY RESTORED TO NEON POSTGRESQL!');
  } catch (err: any) {
    console.error('\n❌ Migration failed:', err.message);
  } finally {
    await neonPrisma.$disconnect();
  }
}

migrate();
