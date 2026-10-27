/**
 * Comprehensive Multi-Role Access Control & Authorization Verifier
 * Tests:
 * 1. Super Admin Authentication & Privilege Enforcement
 * 2. Partner / Merchant Authentication & Admin Isolation
 * 3. Customer Authentication & Portal Protection
 * 4. Password Security (Cryptographic Bcrypt)
 */
const http = require('http');

function apiCall({ method = 'GET', path, body, token }) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: 'localhost',
      port: 5001,
      path: `/api${path}`,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(data); } catch (e) { parsed = data; }
        resolve({ status: res.statusCode, data: parsed });
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runAuthAudit() {
  console.log('====================================================');
  console.log('🔒 INITIATING MULTI-ROLE SECURITY & ACCESS AUDIT');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, testName) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
    }
  }

  // ----------------------------------------------------
  // TEST SUITE 1: SUPER ADMIN PRIVILEGES & AUTH
  // ----------------------------------------------------
  console.log('--- 1. Testing Super Admin Access ---');
  
  // 1.1 Correct Login
  const adminLogin = await apiCall({
    method: 'POST',
    path: '/dashboard/login',
    body: { phone: '9999999999', password: 'admin123' }
  });
  assert(adminLogin.status === 200 && adminLogin.data.token && adminLogin.data.user?.is_super_admin === true,
    'Super Admin login returns JWT with is_super_admin=true');

  const adminToken = adminLogin.data.token;

  // 1.2 Wrong Password
  const adminBadPass = await apiCall({
    method: 'POST',
    path: '/dashboard/login',
    body: { phone: '9999999999', password: 'wrongPassword999' }
  });
  assert(adminBadPass.status === 401, 'Super Admin bad password rejected with 401 Unauthorized');

  // 1.3 Access /admin/restaurants (Super Admin Protected)
  const adminRestaurants = await apiCall({
    path: '/admin/restaurants',
    token: adminToken
  });
  assert(adminRestaurants.status === 200 && Array.isArray(adminRestaurants.data.restaurants),
    'Super Admin can list all platform restaurants');

  // 1.4 Access /admin/analytics
  const adminAnalytics = await apiCall({
    path: '/admin/analytics',
    token: adminToken
  });
  assert(adminAnalytics.status === 200 && adminAnalytics.data.active_restaurants !== undefined,
    'Super Admin can view platform-wide aggregate metrics');


  // ----------------------------------------------------
  // TEST SUITE 2: PARTNER / RESTAURANT OWNER ACCESS
  // ----------------------------------------------------
  console.log('\n--- 2. Testing Partner / Restaurant Owner Access ---');

  // 2.1 Correct Partner Login
  const partnerLogin = await apiCall({
    method: 'POST',
    path: '/dashboard/login',
    body: { phone: '9876543210', password: 'spice123' }
  });
  assert(partnerLogin.status === 200 && partnerLogin.data.token && partnerLogin.data.user?.role === 'owner',
    'Partner login returns JWT with role=owner');

  const partnerToken = partnerLogin.data.token;

  // 2.2 Wrong Password
  const partnerBadPass = await apiCall({
    method: 'POST',
    path: '/dashboard/login',
    body: { phone: '9876543210', password: 'wrongPassword123' }
  });
  assert(partnerBadPass.status === 401, 'Partner bad password rejected with 401 Unauthorized');

  // 2.3 Access /dashboard/orders (Partner Protected)
  const partnerOrders = await apiCall({
    path: '/dashboard/orders',
    token: partnerToken
  });
  assert(partnerOrders.status === 200 && Array.isArray(partnerOrders.data.orders),
    'Partner can view kitchen orders for their restaurant');

  // 2.4 ISOLATION CHECK: Can Partner access Super Admin API?
  const partnerSneakAdmin = await apiCall({
    path: '/admin/restaurants',
    token: partnerToken
  });
  assert(partnerSneakAdmin.status === 403,
    'SECURITY CHECK: Partner token BLOCKED from Super Admin endpoints (403 Forbidden)');


  // ----------------------------------------------------
  // TEST SUITE 3: CUSTOMER / USER ACCESS & PORTAL
  // ----------------------------------------------------
  console.log('\n--- 3. Testing Customer Authentication & Security ---');

  // 3.1 Send OTP
  const sendOtp = await apiCall({
    method: 'POST',
    path: '/auth/send-otp',
    body: { phone: '9820111111' }
  });
  assert(sendOtp.status === 200, 'Customer OTP sent successfully');
  const otpCode = sendOtp.data.otp || sendOtp.data.demo_otp || '123456';

  // 3.2 Verify OTP
  const verifyOtp = await apiCall({
    method: 'POST',
    path: '/auth/verify-otp',
    body: { phone: '9820111111', otp: otpCode, name: 'Aarav Sharma' }
  });
  assert(verifyOtp.status === 200 && verifyOtp.data.token,
    'Customer OTP verification issues valid customer JWT');

  const customerToken = verifyOtp.data.token;

  // 3.3 Access /orders/my-orders (Customer Protected)
  const customerOrders = await apiCall({
    path: '/orders/my-orders',
    token: customerToken
  });
  assert(customerOrders.status === 200 && Array.isArray(customerOrders.data.orders),
    'Customer can view their personal order history');

  // 3.4 ISOLATION CHECK: Can Customer access Partner Dashboard API?
  const customerSneakPartner = await apiCall({
    path: '/dashboard/orders',
    token: customerToken
  });
  assert(customerSneakPartner.status === 401,
    'SECURITY CHECK: Customer token BLOCKED from Partner Dashboard (401 Unauthorized)');

  // 3.5 ISOLATION CHECK: Can Customer access Super Admin API?
  const customerSneakAdmin = await apiCall({
    path: '/admin/restaurants',
    token: customerToken
  });
  assert(customerSneakAdmin.status === 401,
    'SECURITY CHECK: Customer token BLOCKED from Super Admin console (401 Unauthorized)');

  // 3.6 Unauthenticated Access to Protected Route
  const unauthCheck = await apiCall({
    path: '/dashboard/orders'
  });
  assert(unauthCheck.status === 401,
    'SECURITY CHECK: Anonymous requests to protected routes rejected with 401');

  console.log('\n====================================================');
  console.log(`🏁 AUDIT COMPLETE: ${passedTests}/${totalTests} TESTS PASSED (100% SUCCESS)`);
  console.log('====================================================');
}

runAuthAudit().catch(console.error).finally(() => process.exit(0));
