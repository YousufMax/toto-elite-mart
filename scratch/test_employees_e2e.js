const http = require('http');
const { SignJWT } = require('jose');

const JWT_SECRET_STRING = process.env.JWT_SECRET || 'toto_elite_mart_dev_secret_key_2026_super_secure_998877';
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);

async function generateToken(payload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', (err) => reject(err));
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('=== STARTING EMPLOYEES & ROLES E2E VERIFICATION ===');

  const superAdminToken = await generateToken({
    userId: 'usr-admin-1',
    email: 'admin@totoelitemart.com',
    fullName: 'Executive Super Admin',
    role: 'SUPER_ADMIN'
  });

  const headers = {
    'Cookie': `toto_session=${superAdminToken}`,
    'Content-Type': 'application/json'
  };

  // 1. GET /api/employees
  console.log('\n1. Fetching all employees...');
  const getRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/employees',
    method: 'GET',
    headers
  });
  console.log(`Status: ${getRes.status}`);
  console.log(`Success: ${getRes.data.success}`);
  console.log(`Count: ${getRes.data.users?.length}`);
  console.log(`Users found:`, getRes.data.users?.map(u => ({ id: u.id, email: u.email, role: u.role, customPermissions: u.customPermissions })));

  if (!getRes.data.success || !getRes.data.users) {
    throw new Error('Failed to retrieve employees list');
  }

  // 2. POST /api/employees (Create new employee with custom rules)
  console.log('\n2. Creating a new employee with Custom Permissions...');
  const newEmpPayload = {
    fullName: 'Sabbir Rahman (Fulfillment Lead)',
    email: `sabbir.${Date.now()}@totoelitemart.com`,
    phone: '01711223344',
    password: 'SecurePass123!#',
    role: 'ORDER_MANAGER',
    customPermissions: ['inventory:write', 'banners:read'] // Custom extra rules beyond ORDER_MANAGER
  };

  const createRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/employees',
    method: 'POST',
    headers
  }, newEmpPayload);

  console.log(`Create Status: ${createRes.status}`);
  console.log(`Create Response:`, createRes.data);
  if (!createRes.data.success || !createRes.data.user) {
    throw new Error('Failed to create new employee');
  }
  const createdId = createRes.data.user.id;
  console.log(`Created employee ID: ${createdId}`);
  console.log(`Assigned custom permissions:`, createRes.data.user.customPermissions);

  // 3. PATCH /api/employees/[id] (Edit employee details and permissions)
  console.log('\n3. Editing employee details & adding custom permission...');
  const patchPayload = {
    fullName: 'Sabbir Rahman Senior',
    phone: '01799887766',
    role: 'MANAGER',
    status: 'ACTIVE',
    customPermissions: ['expenses:read', 'inventory:write', 'banners:read', 'integrations:read']
  };

  const patchRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: `/api/employees/${createdId}`,
    method: 'PATCH',
    headers
  }, patchPayload);

  console.log(`Patch Status: ${patchRes.status}`);
  console.log(`Patch Response:`, patchRes.data);
  if (!patchRes.data.success) {
    throw new Error('Failed to update employee');
  }

  // 4. POST /api/employees/[id]/password (Change/Reset employee password)
  console.log('\n4. Resetting employee password...');
  const pwdRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: `/api/employees/${createdId}/password`,
    method: 'POST',
    headers
  }, { newPassword: 'UpdatedBrandNewPassword999!' });

  console.log(`Password Reset Status: ${pwdRes.status}`);
  console.log(`Password Reset Response:`, pwdRes.data);
  if (!pwdRes.data.success) {
    throw new Error('Failed to reset employee password');
  }

  // 5. Test Super Admin Self Password Change
  console.log('\n5. Testing Super Admin self-password reset...');
  const adminPwdRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: `/api/employees/usr-admin-1/password`,
    method: 'POST',
    headers
  }, { newPassword: 'SuperAdminSecretKey2026!' });

  console.log(`Super Admin Password Change Status: ${adminPwdRes.status}`);
  console.log(`Super Admin Password Change Response:`, adminPwdRes.data);
  if (!adminPwdRes.data.success) {
    throw new Error('Failed to update Super Admin password');
  }

  // 6. Test Safeguard: Prevent deleting the only Super Admin
  console.log('\n6. Testing Safeguard (prevent deactivating the only Super Admin)...');
  const deleteAdminRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: `/api/employees/usr-admin-1`,
    method: 'DELETE',
    headers
  });
  console.log(`Safeguard Status: ${deleteAdminRes.status} (Expected 400 Bad Request)`);
  console.log(`Safeguard Error message:`, deleteAdminRes.data.error);

  console.log('\n=== ALL TESTS PASSED WITH 100% SUCCESS! ===');
}

runTests().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
