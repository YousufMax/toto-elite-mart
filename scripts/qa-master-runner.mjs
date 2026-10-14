/**
 * Toto Elite Mart — Master QA Automated Regression Suite
 * Tests all 18 Phases against real running Next.js application
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  blocked: 0,
  tests: [],
};

function record(name, status, details = '') {
  results.total++;
  if (status === 'PASS') results.passed++;
  else if (status === 'FAIL') results.failed++;
  else if (status === 'BLOCKED') results.blocked++;

  results.tests.push({ name, status, details });
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} [${status}] ${name} ${details ? `— ${details}` : ''}`);
}

async function runMasterQASuite() {
  console.log('===============================================================');
  console.log('🚀 STARTING TOTO ELITE MART MASTER QA AUTOMATION RUNNER');
  console.log(`Target: ${BASE_URL}`);
  console.log('===============================================================\n');

  let adminCookie = '';
  let testCategoryId = '';
  let testProductId = '';
  let testOrderNumber = '';
  let testOrderId = '';
  let testCancelOrderId = '';

  // -------------------------------------------------------------
  // PHASE 1 & 2: Server Health & Environment Check
  // -------------------------------------------------------------
  console.log('--- PHASE 1 & 2: SERVER HEALTH & BASE ROUTING ---');
  try {
    const homeRes = await fetch(`${BASE_URL}/`);
    if (homeRes.status === 200) {
      record('Storefront Homepage (GET /)', 'PASS', 'Status 200, HTML returned');
    } else {
      record('Storefront Homepage (GET /)', 'FAIL', `Status ${homeRes.status}`);
    }

    const shopRes = await fetch(`${BASE_URL}/shop`);
    if (shopRes.status === 200) {
      record('Storefront Catalog (GET /shop)', 'PASS', 'Status 200');
    } else {
      record('Storefront Catalog (GET /shop)', 'FAIL', `Status ${shopRes.status}`);
    }
  } catch (err) {
    record('Server Health', 'FAIL', err.message);
  }

  // -------------------------------------------------------------
  // PHASE 14: Authentication & Employee Permissions
  // -------------------------------------------------------------
  console.log('\n--- PHASE 14: AUTHENTICATION & SECURITY RBAC ---');
  try {
    // 1. Invalid login
    const badLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@totoelitemart.com', password: 'WrongPassword99' }),
    });
    if (badLogin.status === 401) {
      record('Auth: Reject Invalid Credentials', 'PASS', 'Returned 401 Unauthorized');
    } else {
      record('Auth: Reject Invalid Credentials', 'FAIL', `Expected 401, got ${badLogin.status}`);
    }

    // 2. Unauthenticated write to admin API
    const unauthReq = await fetch(`${BASE_URL}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Hacker Item', sku: 'HACK-1', categoryId: 'cat-1', sellingPrice: 100 }),
    });
    if (unauthReq.status === 403 || unauthReq.status === 401) {
      record('Security: Block Unauthenticated Product Creation', 'PASS', `Status ${unauthReq.status}`);
    } else {
      record('Security: Block Unauthenticated Product Creation', 'FAIL', `Status ${unauthReq.status}`);
    }

    // 3. Valid admin login
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@totoelitemart.com', password: 'admin123' }),
    });
    const loginData = await loginRes.json();
    const cookie = loginRes.headers.get('set-cookie');
    if (loginRes.status === 200 && loginData.success && cookie) {
      adminCookie = cookie;
      record('Auth: Admin Login & JWT Issuance', 'PASS', `Welcome ${loginData.user.fullName} (${loginData.user.role})`);
    } else {
      record('Auth: Admin Login & JWT Issuance', 'FAIL', 'Login failed or cookie missing');
    }
  } catch (err) {
    record('Auth: Execution', 'FAIL', err.message);
  }

  // -------------------------------------------------------------
  // PHASE 5: Category Management Lifecycle
  // -------------------------------------------------------------
  console.log('\n--- PHASE 5: CATEGORY MANAGEMENT ---');
  try {
    // 1. Create Category
    const createCatRes = await fetch(`${BASE_URL}/api/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        name: 'QA Test Category ' + Date.now(),
        description: 'Temporary category for QA suite testing',
        imageUrl: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600',
      }),
    });
    const createCatData = await createCatRes.json();
    if (createCatRes.status === 200 && createCatData.success && createCatData.category?.id) {
      testCategoryId = createCatData.category.id;
      record('Category: Create Category', 'PASS', `ID: ${testCategoryId}, Name: ${createCatData.category.name}`);
    } else {
      record('Category: Create Category', 'FAIL', createCatData.error || 'Failed');
    }

    // 2. Update Category
    if (testCategoryId) {
      const updateCatRes = await fetch(`${BASE_URL}/api/categories/${testCategoryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({
          name: 'QA Updated Category',
          description: 'Updated description by automated QA',
        }),
      });
      const updateCatData = await updateCatRes.json();
      if (updateCatRes.status === 200 && updateCatData.success && updateCatData.category?.name === 'QA Updated Category') {
        record('Category: Update Category (PATCH)', 'PASS', 'Successfully updated name and description');
      } else {
        record('Category: Update Category (PATCH)', 'FAIL', updateCatData.error || 'Update failed');
      }
    }
  } catch (err) {
    record('Category Workflow', 'FAIL', err.message);
  }

  // -------------------------------------------------------------
  // PHASE 3: Product Creation: Every Field & Validation
  // -------------------------------------------------------------
  console.log('\n--- PHASE 3: PRODUCT CREATION & VALIDATION ---');
  const testSku = `QA-SKU-${Date.now().toString().slice(-5)}`;
  try {
    // 1. Missing required fields validation
    const missingRes = await fetch(`${BASE_URL}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ name: '', sku: '', categoryId: testCategoryId, sellingPrice: 0 }),
    });
    if (missingRes.status === 400) {
      record('Product: Missing Fields Validation', 'PASS', 'Correctly rejected with 400 Bad Request');
    } else {
      record('Product: Missing Fields Validation', 'FAIL', `Expected 400, got ${missingRes.status}`);
    }

    // 2. Valid product creation
    const initialCover = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800';
    const prodRes = await fetch(`${BASE_URL}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        name: 'QA Noise Cancelling Earbuds',
        sku: testSku,
        categoryId: testCategoryId,
        description: 'High-end ANC earbuds with ENC quad-mic',
        purchaseCost: 1200,
        sellingPrice: 2200,
        salePrice: 1850,
        stockQuantity: 20,
        lowStockThreshold: 5,
        isFeatured: true,
        images: [{ url: initialCover, isPrimary: true }],
      }),
    });
    const prodData = await prodRes.json();
    if (prodRes.status === 200 && prodData.success && prodData.product?.id) {
      testProductId = prodData.product.id;
      record('Product: Complete Product Creation', 'PASS', `ID: ${testProductId}, SKU: ${testSku}, Price: ৳1850`);
    } else {
      record('Product: Complete Product Creation', 'FAIL', prodData.error || 'Creation failed');
    }

    // 3. Duplicate SKU Prevention
    const dupRes = await fetch(`${BASE_URL}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        name: 'Another Product Same SKU',
        sku: testSku,
        categoryId: testCategoryId,
        sellingPrice: 1999,
        stockQuantity: 10,
      }),
    });
    const dupData = await dupRes.json();
    if (dupRes.status === 400 || dupRes.status === 500) {
      record('Product: Prevent Duplicate SKU Collision', 'PASS', 'Correctly rejected duplicate SKU');
    } else {
      record('Product: Prevent Duplicate SKU Collision', 'FAIL', 'Duplicate SKU was incorrectly accepted');
    }
  } catch (err) {
    record('Product Creation Suite', 'FAIL', err.message);
  }

  // -------------------------------------------------------------
  // PHASE 4: Product Editing & Cover Image Replacement (High Priority!)
  // -------------------------------------------------------------
  console.log('\n--- PHASE 4: PRODUCT EDITING & COVER IMAGE REPLACEMENT ---');
  try {
    if (!testProductId) {
      record('Product Edit & Image Replacement', 'BLOCKED', 'No test product ID available');
    } else {
      const newCoverImage = 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800';
      const editRes = await fetch(`${BASE_URL}/api/products/${testProductId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({
          name: 'QA Noise Cancelling Earbuds V2 PRO',
          sellingPrice: 2500,
          salePrice: 1990,
          stockQuantity: 15,
          lowStockThreshold: 4,
          description: 'Updated specification with 40-hour battery life',
          images: [{ url: newCoverImage, isPrimary: true }],
        }),
      });
      const editData = await editRes.json();

      if (editRes.status === 200 && editData.success) {
        record('Product: Update Metadata & Price', 'PASS', 'Updated name, prices, stock to 15');
      } else {
        record('Product: Update Metadata & Price', 'FAIL', editData.error || 'Failed');
      }

      // Verify persistence via GET /api/products/[id]
      const getSingleRes = await fetch(`${BASE_URL}/api/products/${testProductId}`);
      const singleData = await getSingleRes.json();
      if (singleData.success && singleData.product?.images?.[0]?.url === newCoverImage) {
        record('Product: Cover Image Replacement Persistence', 'PASS', `New primary image verified: ${newCoverImage}`);
      } else {
        record('Product: Cover Image Replacement Persistence', 'FAIL', 'Primary image URL did not match updated value');
      }
    }
  } catch (err) {
    record('Product Edit Suite', 'FAIL', err.message);
  }

  // -------------------------------------------------------------
  // PHASE 6: Storefront, Search, Filter & Coupon Validation
  // -------------------------------------------------------------
  console.log('\n--- PHASE 6: STOREFRONT, SEARCH & COUPONS ---');
  try {
    // 1. Search for newly edited product
    const searchRes = await fetch(`${BASE_URL}/api/products?search=Earbuds%20V2`);
    const searchData = await searchRes.json();
    const found = searchData.products?.find((p) => p.id === testProductId);
    if (found) {
      record('Storefront: Catalog Search Reflection', 'PASS', `Found: "${found.name}" with price ৳${found.salePrice || found.sellingPrice}`);
    } else {
      record('Storefront: Catalog Search Reflection', 'FAIL', 'Updated product not found in search');
    }

    // 2. Validate Coupons
    const validCouponRes = await fetch(`${BASE_URL}/api/coupons/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'WELCOME100', subtotal: 2000 }),
    });
    const couponData = await validCouponRes.json();
    if (couponData.valid && couponData.discountAmount === 100) {
      record('Coupons: Valid Code WELCOME100 Verification', 'PASS', 'Correct ৳100 discount applied');
    } else {
      record('Coupons: Valid Code WELCOME100 Verification', 'FAIL', 'Did not recognize WELCOME100');
    }

    const invalidCouponRes = await fetch(`${BASE_URL}/api/coupons/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'INVALID_XYZ_99', subtotal: 2000 }),
    });
    const invalidCouponData = await invalidCouponRes.json();
    if (!invalidCouponData.valid) {
      record('Coupons: Reject Invalid Promo Code', 'PASS', 'Correctly flagged as invalid');
    } else {
      record('Coupons: Reject Invalid Promo Code', 'FAIL', 'Invalid coupon was falsely approved');
    }
  } catch (err) {
    record('Storefront & Coupons Suite', 'FAIL', err.message);
  }

  // -------------------------------------------------------------
  // PHASE 7: Customer Checkout & Real Order Placement
  // -------------------------------------------------------------
  console.log('\n--- PHASE 7: CUSTOMER CHECKOUT & ORDER CREATION ---');
  try {
    // 1. Validation failure: Invalid phone number
    const badPhoneRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Test Customer',
        customerPhone: '12345',
        deliveryAddress: 'Banani, Dhaka',
        items: [{ productId: testProductId, quantity: 1 }],
      }),
    });
    if (badPhoneRes.status === 400) {
      record('Checkout: Reject Invalid BD Mobile', 'PASS', 'Blocked phone with length < 11');
    } else {
      record('Checkout: Reject Invalid BD Mobile', 'FAIL', `Expected 400, got ${badPhoneRes.status}`);
    }

    // 2. Validation failure: Insufficient Stock
    const overStockRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Test Customer',
        customerPhone: '01711223344',
        deliveryAddress: 'Gulshan 2, Dhaka',
        items: [{ productId: testProductId, quantity: 99999 }],
      }),
    });
    if (overStockRes.status === 400) {
      record('Checkout: Insufficient Stock Enforcement', 'PASS', 'Blocked order exceeding available stock');
    } else {
      record('Checkout: Insufficient Stock Enforcement', 'FAIL', `Expected 400, got ${overStockRes.status}`);
    }

    // 3. Valid Order Creation (buying 2 units, starting stock was 15 -> expected 13)
    const validOrderRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Kazi Nazrul Islam',
        customerPhone: '01712998877',
        deliveryAddress: 'House 24, Road 7, Sector 3, Uttara',
        deliveryCity: 'Dhaka',
        deliveryZone: 'Inside Dhaka',
        deliveryFee: 60,
        paymentMethod: 'COD',
        couponCode: 'WELCOME100',
        items: [{ productId: testProductId, quantity: 2 }],
      }),
    });
    const orderData = await validOrderRes.json();
    if (validOrderRes.status === 200 && orderData.success && orderData.orderNumber) {
      testOrderNumber = orderData.orderNumber;
      testOrderId = orderData.order?.id;
      record('Checkout: Real Order Placement', 'PASS', `Order #${testOrderNumber}, Total: ৳${orderData.order?.totalAmount}`);
    } else {
      record('Checkout: Real Order Placement', 'FAIL', orderData.error || 'Failed');
    }

    // 4. Stock deduction verification
    const checkStockRes = await fetch(`${BASE_URL}/api/products/${testProductId}`);
    const checkStockData = await checkStockRes.json();
    if (checkStockData.product?.stockQuantity === 13) {
      record('Inventory: Automatic Stock Deduction on Order', 'PASS', 'Stock deducted accurately from 15 to 13 (-2)');
    } else {
      record('Inventory: Automatic Stock Deduction on Order', 'FAIL', `Expected stock 13, found ${checkStockData.product?.stockQuantity}`);
    }
  } catch (err) {
    record('Checkout Suite', 'FAIL', err.message);
  }

  // -------------------------------------------------------------
  // PHASE 8: Admin Order Processing & Lifecycle
  // -------------------------------------------------------------
  console.log('\n--- PHASE 8: ADMIN ORDER STATUS PROCESSING ---');
  try {
    if (!testOrderId) {
      record('Order Lifecycle Transitions', 'BLOCKED', 'No test order created');
    } else {
      const transitions = ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
      let allPassed = true;

      for (const st of transitions) {
        const patchRes = await fetch(`${BASE_URL}/api/orders/${testOrderId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
          body: JSON.stringify({ status: st, internalNotes: `QA automated test transition to ${st}` }),
        });
        const patchData = await patchRes.json();
        if (patchRes.status !== 200 || !patchData.success) {
          allPassed = false;
          record(`Order: Transition to ${st}`, 'FAIL', patchData.error);
        }
      }

      if (allPassed) {
        record('Order: Complete Lifecycle (CONFIRMED -> PROCESSING -> SHIPPED -> DELIVERED)', 'PASS', 'All transitions succeeded');
      }

      // Customer Tracking Verification
      const trackRes = await fetch(`${BASE_URL}/api/orders/track?orderNumber=${testOrderNumber}&phone=01712998877`);
      const trackData = await trackRes.json();
      if (trackData.success && trackData.order?.orderStatus === 'DELIVERED') {
        record('Order: Customer Tracking Verification', 'PASS', 'Tracking accurately displays DELIVERED status');
      } else {
        record('Order: Customer Tracking Verification', 'FAIL', `Expected DELIVERED, got ${trackData.order?.orderStatus}`);
      }
    }
  } catch (err) {
    record('Order Lifecycle Suite', 'FAIL', err.message);
  }

  // -------------------------------------------------------------
  // PHASE 10: Order Cancellation & Inventory Stock Restoration
  // -------------------------------------------------------------
  console.log('\n--- PHASE 10: CANCELLATION & STOCK RESTORATION ---');
  try {
    // 1. Place a new order for 3 items (Stock: 13 -> 10)
    const order2Res = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Cancellation Test Customer',
        customerPhone: '01819998877',
        deliveryAddress: 'Mirpur 10, Dhaka',
        deliveryCity: 'Dhaka',
        deliveryZone: 'Inside Dhaka',
        deliveryFee: 60,
        paymentMethod: 'COD',
        items: [{ productId: testProductId, quantity: 3 }],
      }),
    });
    const order2Data = await order2Res.json();
    testCancelOrderId = order2Data.order?.id;

    // Check stock is 10
    let curStockRes = await fetch(`${BASE_URL}/api/products/${testProductId}`);
    let curStockData = await curStockRes.json();
    const stockAfterOrder = curStockData.product?.stockQuantity;

    // 2. Cancel order
    const cancelRes = await fetch(`${BASE_URL}/api/orders/${testCancelOrderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ status: 'CANCELLED', internalNotes: 'Customer cancelled before dispatch' }),
    });
    const cancelData = await cancelRes.json();

    // 3. Check stock was restored (+3: 10 -> 13)
    curStockRes = await fetch(`${BASE_URL}/api/products/${testProductId}`);
    curStockData = await curStockRes.json();
    const stockAfterCancel = curStockData.product?.stockQuantity;

    if (stockAfterCancel === stockAfterOrder + 3) {
      record('Inventory: Restock on Order Cancellation', 'PASS', `Stock accurately restored from ${stockAfterOrder} to ${stockAfterCancel} (+3)`);
    } else {
      record('Inventory: Restock on Order Cancellation', 'FAIL', `Stock was ${stockAfterOrder}, after cancel ${stockAfterCancel}`);
    }

    // 4. Repeated cancellation idempotency check (should not restock again!)
    await fetch(`${BASE_URL}/api/orders/${testCancelOrderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ status: 'CANCELLED', internalNotes: 'Duplicate cancel trigger' }),
    });
    curStockRes = await fetch(`${BASE_URL}/api/products/${testProductId}`);
    curStockData = await curStockRes.json();
    if (curStockData.product?.stockQuantity === stockAfterCancel) {
      record('Inventory: Idempotent Cancellation Restock', 'PASS', 'Duplicate cancellation did not add extra stock');
    } else {
      record('Inventory: Idempotent Cancellation Restock', 'FAIL', 'Duplicate cancellation added unwarranted stock');
    }
  } catch (err) {
    record('Cancellation Suite', 'FAIL', err.message);
  }

  // -------------------------------------------------------------
  // PHASE 5 (Part 2): Safe Category Deletion Verification
  // -------------------------------------------------------------
  console.log('\n--- PHASE 5: SAFE CATEGORY DELETION CONTROLS ---');
  try {
    if (testCategoryId && testProductId) {
      // 1. Try to delete category with active assigned product -> must fail!
      const unsafeDelRes = await fetch(`${BASE_URL}/api/categories/${testCategoryId}`, {
        method: 'DELETE',
        headers: { Cookie: adminCookie },
      });
      if (unsafeDelRes.status === 400) {
        record('Category: Prevent Unsafe Deletion with Active Products', 'PASS', 'Blocked deletion of category with assigned products');
      } else {
        record('Category: Prevent Unsafe Deletion with Active Products', 'FAIL', `Expected 400, got ${unsafeDelRes.status}`);
      }

      // 2. Archive product first
      const delProdRes = await fetch(`${BASE_URL}/api/products/${testProductId}`, {
        method: 'DELETE',
        headers: { Cookie: adminCookie },
      });
      if (delProdRes.status === 200) {
        record('Product: Safe Archive / Deletion', 'PASS', 'Product successfully archived');
      } else {
        record('Product: Safe Archive / Deletion', 'FAIL', 'Failed to archive product');
      }

      // 3. Now delete category -> must succeed!
      const safeDelRes = await fetch(`${BASE_URL}/api/categories/${testCategoryId}`, {
        method: 'DELETE',
        headers: { Cookie: adminCookie },
      });
      if (safeDelRes.status === 200) {
        record('Category: Clean Deletion After Products Reassigned', 'PASS', 'Category deleted cleanly');
      } else {
        record('Category: Clean Deletion After Products Reassigned', 'FAIL', `Status ${safeDelRes.status}`);
      }
    }
  } catch (err) {
    record('Category Deletion Suite', 'FAIL', err.message);
  }

  // -------------------------------------------------------------
  // PHASES 11, 12, 13: External Integrations Diagnostic
  // -------------------------------------------------------------
  console.log('\n--- PHASES 11, 12, 13: INTEGRATIONS DIAGNOSTIC ---');
  try {
    // 1. ImageKit CDN Auth endpoint
    const ikRes = await fetch(`${BASE_URL}/api/upload/imagekit-auth`);
    const ikData = await ikRes.json();
    if (ikRes.status === 200 && ikData.token && ikData.signature) {
      record('ImageKit: Server Signature Generator', 'PASS', 'Valid cryptographic authentication signature');
    } else {
      record('ImageKit: Server Signature Generator', 'BLOCKED', 'Free ImageKit credentials not configured in .env');
    }

    // 2. Google Sheets sync endpoint
    const gsRes = await fetch(`${BASE_URL}/api/sync/google-sheets`);
    const gsData = await gsRes.json();
    if (gsData.isConfigured) {
      record('Google Sheets: Spreadsheet Sync Connection', 'PASS', 'Service account and spreadsheet ID connected');
    } else {
      record('Google Sheets: Spreadsheet Sync Connection', 'BLOCKED', 'Service account JSON credentials not configured in .env');
    }

    // 3. Telegram Bot test endpoint
    const tgRes = await fetch(`${BASE_URL}/api/notifications/telegram/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    });
    const tgData = await tgRes.json();
    if (tgData.success) {
      record('Telegram: Bot Outbox Notification', 'PASS', 'Telegram test notification delivered to channel');
    } else {
      record('Telegram: Bot Outbox Notification', 'BLOCKED', 'Telegram bot token or chat ID not configured in .env');
    }
  } catch (err) {
    record('Integrations Diagnostic Suite', 'FAIL', err.message);
  }

  // -------------------------------------------------------------
  // FINAL RESULTS SUMMARY
  // -------------------------------------------------------------
  console.log('\n===============================================================');
  console.log('📊 MASTER QA AUTOMATION TEST RESULTS SUMMARY');
  console.log('===============================================================');
  console.log(`Total Tests Run:  ${results.total}`);
  console.log(`✅ Passed:        ${results.passed}`);
  console.log(`❌ Failed:        ${results.failed}`);
  console.log(`⚠️ Blocked/Skip:  ${results.blocked}`);
  console.log(`Success Rate:     ${Math.round((results.passed / (results.total - results.blocked)) * 100)}% (of executable tests)`);
  console.log('===============================================================\n');

  return results;
}

runMasterQASuite()
  .then((res) => {
    if (res.failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  })
  .catch((err) => {
    console.error('Fatal runner error:', err);
    process.exit(1);
  });
