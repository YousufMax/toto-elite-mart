const http = require('http');
const { SignJWT } = require('jose');

const JWT_SECRET_STRING = process.env.JWT_SECRET || 'toto_elite_mart_dev_secret_key_2026_super_secure_998877';
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);

async function generateToken(payload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d')
    .sign(JWT_SECRET);
}

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const opts = { ...options, headers: { ...options.headers } };
    let payload = null;
    if (postData) {
      payload = typeof postData === 'string' ? postData : JSON.stringify(postData);
      opts.headers['Content-Length'] = Buffer.byteLength(payload);
    }
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, raw: data });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', (err) => reject(err));
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

async function runTests() {
  console.log('=== STARTING SUPER ADMIN ORDER DELETE E2E VERIFICATION ===');

  const superAdminToken = await generateToken({
    userId: 'usr-admin-1',
    email: 'admin@totoelitemart.com',
    fullName: 'Executive Super Admin',
    role: 'SUPER_ADMIN',
  });

  const orderManagerToken = await generateToken({
    userId: 'usr-order-1',
    email: 'orders@totoelitemart.com',
    fullName: 'Operations Lead',
    role: 'ORDER_MANAGER',
  });

  // 1. Fetch current orders
  console.log('\n1. Fetching orders list with Super Admin token...');
  const getRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/orders',
    method: 'GET',
    headers: {
      'Cookie': `toto_session=${superAdminToken}`,
    },
  });

  console.log(`Status: ${getRes.status}`);
  console.log(`Success: ${getRes.data.success}`);
  console.log(`Current User:`, getRes.data.currentUser);
  console.log(`Total Orders: ${getRes.data.count}`);

  if (!getRes.data.success || !getRes.data.currentUser || getRes.data.currentUser.role !== 'SUPER_ADMIN') {
    throw new Error('Failed to verify Super Admin user in orders response');
  }

  // 2. Create a test order to delete
  console.log('\n2. Creating a test order for deletion testing...');
  const createRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/orders',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    customerName: 'Test Deletion Customer',
    customerPhone: '01799887766',
    deliveryAddress: 'Banani Road 11, Dhaka',
    deliveryCity: 'Dhaka',
    deliveryZone: 'Inside Dhaka',
    deliveryFee: 60,
    items: [
      {
        productId: 'prod-1',
        productName: 'Organic Mustard Oil 1L',
        sku: 'OMO-1L',
        quantity: 2,
        unitPrice: 450,
        totalPrice: 900,
      },
    ],
  });

  console.log(`Order Create Status: ${createRes.status}`);
  console.log(`Order Number: ${createRes.data.orderNumber}`);
  const targetOrderId = createRes.data.order?.id || createRes.data.orderNumber;
  console.log(`Target Order ID: ${targetOrderId}`);

  // 3. Security Test: Attempt deletion with ORDER_MANAGER token (Must fail 403)
  console.log('\n3. Security Test: Attempting deletion as ORDER_MANAGER (Expect 403 Forbidden)...');
  const unauthorizedRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: `/api/orders/${targetOrderId}`,
    method: 'DELETE',
    headers: {
      'Cookie': `toto_session=${orderManagerToken}`,
      'Content-Type': 'application/json',
    },
  }, { restoreInventory: true, reason: 'Unauthorized attempt' });

  console.log(`Status: ${unauthorizedRes.status} (Expected: 403)`);
  console.log(`Error Message:`, unauthorizedRes.data.error);

  if (unauthorizedRes.status !== 403) {
    throw new Error(`Security failure! Expected status 403 but got ${unauthorizedRes.status}`);
  }

  // 4. Authorized Test: Deletion with SUPER_ADMIN token (Must succeed 200)
  console.log('\n4. Authorized Test: Deleting order as SUPER_ADMIN with stock restoration...');
  const authorizedDeleteRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: `/api/orders/${targetOrderId}`,
    method: 'DELETE',
    headers: {
      'Cookie': `toto_session=${superAdminToken}`,
      'Content-Type': 'application/json',
    },
  }, {
    restoreInventory: true,
    reason: 'Super Admin test order cleanup',
  });

  console.log(`Status: ${authorizedDeleteRes.status} (Expected: 200)`);
  console.log(`Response:`, authorizedDeleteRes.data);

  if (authorizedDeleteRes.status !== 200 || !authorizedDeleteRes.data.success) {
    throw new Error(`Failed to delete order as Super Admin: ${JSON.stringify(authorizedDeleteRes.data)}`);
  }

  // 5. Verification: Check order is gone
  console.log('\n5. Verifying order is removed from orders list...');
  const verifyRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: `/api/orders?search=${encodeURIComponent(createRes.data.orderNumber)}`,
    method: 'GET',
    headers: {
      'Cookie': `toto_session=${superAdminToken}`,
    },
  });

  const foundOrder = verifyRes.data.orders?.find(o => o.orderNumber === createRes.data.orderNumber);
  console.log(`Order found after purge?`, !!foundOrder);

  if (foundOrder) {
    throw new Error('Order still exists in order list after deletion!');
  }

  console.log('\n=== ALL SUPER ADMIN ORDER PURGE TESTS PASSED 100%! ===');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
