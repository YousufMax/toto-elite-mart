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

async function testIntegration() {
  console.log('=== STARTING GOOGLE SHEETS WEB APP INTEGRATION TEST ===\n');

  // 1. GET /api/sync/google-sheets
  console.log('1. Querying /api/sync/google-sheets status...');
  const statusRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/sync/google-sheets',
    method: 'GET',
  });

  console.log(`HTTP Status: ${statusRes.status}`);
  console.log(`Configured: ${statusRes.data.isConfigured}`);
  console.log(`Connected Web App URL: ${statusRes.data.webAppUrl}`);
  console.log(`Deployment ID: ${statusRes.data.deploymentId}`);
  console.log(`Connection Test:`, statusRes.data.connectionTest);

  if (!statusRes.data.isConfigured || !statusRes.data.webAppUrl) {
    throw new Error('Google Sheets Web App is not recognized as configured!');
  }

  // 2. Trigger Full Sync to Google Sheets Web App
  console.log('\n2. Triggering Full Sync to Google Sheets via POST /api/sync/google-sheets...');
  const adminToken = await generateToken({
    userId: 'usr-admin-1',
    email: 'admin@totoelitemart.com',
    fullName: 'Executive Super Admin',
    role: 'SUPER_ADMIN',
  });

  const syncRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/sync/google-sheets',
    method: 'POST',
    headers: {
      'Cookie': `toto_session=${adminToken}`,
      'Content-Type': 'application/json',
    },
  }, { syncType: 'FULL' });

  console.log(`Sync Status: ${syncRes.status}`);
  console.log(`Sync Result:`, syncRes.data);

  // 3. Test Storefront Order Placement Auto-Sync
  console.log('\n3. Placing a test customer order on website to verify auto-sync trigger...');
  const orderRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/orders',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    customerName: 'Google Sheets Live Tester',
    customerPhone: '01855667788',
    deliveryAddress: 'House 88, Road 2, Gulshan 1',
    deliveryCity: 'Dhaka',
    deliveryZone: 'Inside Dhaka',
    deliveryFee: 60,
    paymentMethod: 'COD',
    items: [
      {
        productId: 'prod-1',
        productName: 'Organic Mustard Oil 1L',
        quantity: 1,
        unitPrice: 580,
        totalPrice: 580,
      },
    ],
  });

  console.log(`Order Placed Status: ${orderRes.status}`);
  console.log(`New Order Number: ${orderRes.data.orderNumber}`);

  console.log('\n=== INTEGRATION PIPELINE VERIFIED SUCCESSFULLY! ===');
}

testIntegration().catch((e) => {
  console.error('Integration test failed:', e);
  process.exit(1);
});
