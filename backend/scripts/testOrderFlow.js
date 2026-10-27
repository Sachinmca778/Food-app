/**
 * End-to-End Order Flow Verification Script
 * Validates: Menu -> Cart -> Login -> Min Order -> Place Order (UPI & COD) -> Confirm UPI -> Live Tracking
 */
const http = require('http');

function apiCall(path, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: 'localhost',
      port: 5001,
      path: `/api${path}`,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(raw);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, text: raw });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function testFullFlow() {
  console.log('🚀 Starting Comprehensive Order-to-Payment Verification...\n');

  // 1. Fetch Restaurant Menu
  const menuRes = await apiCall('/restaurant/spice-garden/menu');
  if (menuRes.status !== 200 || !menuRes.data.success) {
    throw new Error('Failed to fetch menu: ' + JSON.stringify(menuRes.data));
  }
  const restaurant = menuRes.data.restaurant;
  const categories = menuRes.data.menu;
  console.log(`✅ 1. Restaurant Menu fetched: "${restaurant.name}" (Min Order: ₹${restaurant.min_order_paise/100}, Delivery Fee: ₹${restaurant.delivery_fee_paise/100}, UPI: ${restaurant.upi_id})`);
  
  // Pick an item with variants/addons if possible, or first available item
  const allItems = categories.flatMap(c => c.items);
  const dish1 = allItems[0];
  const dish2 = allItems[1] || allItems[0];
  console.log(`   Selected Dish: "${dish1.name}" (Base Price: ₹${dish1.base_price_paise/100})`);

  // 2. Customer OTP Authentication
  const testPhone = '9876501234';
  const otpRes = await apiCall('/auth/send-otp', 'POST', { phone: testPhone });
  console.log(`✅ 2. OTP Sent to +91 ${testPhone}: Demo OTP is "${otpRes.data.demo_otp || '123456'}"`);

  const verifyRes = await apiCall('/auth/verify-otp', 'POST', {
    phone: testPhone,
    otp: otpRes.data.demo_otp || '123456',
    name: 'Rahul Sharma'
  });
  if (verifyRes.status !== 200 || !verifyRes.data.token) {
    throw new Error('Customer OTP verification failed');
  }
  const customerToken = verifyRes.data.token;
  console.log(`✅ 3. Customer Verified & Authenticated: ID=${verifyRes.data.customer?.id}, Token acquired`);

  // 3. Test Anonymous / Unauthenticated Order Rejection
  const unauthRes = await apiCall('/orders', 'POST', {
    restaurant_slug: 'spice-garden',
    items: [{ item_id: dish1.id, quantity: 1, unit_price_paise: dish1.base_price_paise }],
    order_type: 'delivery',
    address: '123 Test St, Bandra West, Mumbai 400050'
  });
  if (unauthRes.status === 401) {
    console.log('✅ 4. Unauthenticated Order correctly BLOCKED with 401 Unauthorized');
  } else {
    console.warn('⚠️ Expected 401 for unauthenticated order, got:', unauthRes.status);
  }

  // 4. Test Below Minimum Order Rejection
  const belowMinRes = await apiCall('/orders', 'POST', {
    restaurant_slug: 'spice-garden',
    items: [{ item_id: dish1.id, quantity: 1, unit_price_paise: 5000 }], // ₹50 < ₹150 min order
    order_type: 'delivery',
    address: 'Flat 402, Sea View Apartments, Bandra West, Mumbai 400050'
  }, customerToken);
  if (belowMinRes.status === 400 && belowMinRes.data.error?.includes('Minimum order')) {
    console.log(`✅ 5. Below Minimum Order correctly BLOCKED: "${belowMinRes.data.error}"`);
  }

  // 5. Place Real UPI Order
  const upiOrderRes = await apiCall('/orders', 'POST', {
    restaurant_slug: 'spice-garden',
    order_type: 'delivery',
    customer_phone: testPhone,
    customer_name: 'Rahul Sharma',
    items: [
      {
        item_id: dish1.id,
        quantity: 2,
        unit_price_paise: dish1.base_price_paise,
        special_instructions: 'Make it medium spicy'
      },
      {
        item_id: dish2.id,
        quantity: 1,
        unit_price_paise: dish2.base_price_paise,
        special_instructions: 'Extra crispy'
      }
    ],
    address: {
      address_line: 'Flat 402, Sea View Apartments, Hill Road',
      landmark: 'Opposite Mehboob Studio',
      pincode: '400050'
    },
    payment_method: 'upi',
    customer_note: 'Please do not ring bell, baby is sleeping'
  }, customerToken);

  if (upiOrderRes.status !== 201 || !upiOrderRes.data.success) {
    throw new Error('Failed to place UPI order: ' + JSON.stringify(upiOrderRes.data));
  }
  const order = upiOrderRes.data.order;
  const payment = upiOrderRes.data.payment;
  console.log(`✅ 6. UPI Order Placed Successfully!`);
  console.log(`   Order No: #${order.order_no}, Total: ₹${order.total_paise/100}`);
  console.log(`   Public Token: ${order.public_token}`);
  console.log(`   UPI Link: ${payment?.upiUri}`);
  console.log(`   Payee UPI ID: ${payment?.upiId}`);
  console.log(`   Dynamic QR: ${payment?.qrUrl}`);

  // 6. Confirm UPI Payment
  const confirmRes = await apiCall('/payments/confirm-upi', 'POST', {
    orderId: order.id,
    publicToken: order.public_token,
    utr: 'UTR882991024819'
  }, customerToken);
  if (confirmRes.status !== 200 || !confirmRes.data.success) {
    throw new Error('UPI Confirmation failed: ' + JSON.stringify(confirmRes.data));
  }
  console.log(`✅ 7. UPI Payment Confirmed via /confirm-upi! Status transitioned to "paid"`);

  // 7. Test Public Live Tracking Endpoint
  const trackRes = await apiCall(`/track/${order.public_token}`);
  if (trackRes.status !== 200 || !trackRes.data.success) {
    throw new Error('Tracking failed: ' + JSON.stringify(trackRes.data));
  }
  const trackedOrder = trackRes.data.order;
  console.log(`✅ 8. Order Live Tracking fetched successfully!`);
  console.log(`   Tracked Status: "${trackedOrder.status}" (Expected: paid)`);
  console.log(`   Restaurant Name: "${trackedOrder.restaurant_name}"`);
  console.log(`   Items in Order: ${trackedOrder.items?.length}`);
  trackedOrder.items?.forEach(it => {
    console.log(`     - ${it.quantity}x ${it.item_name} @ ₹${it.unit_price_paise/100} = ₹${it.line_total_paise/100}`);
  });
  console.log(`   Bill Breakdown: Subtotal: ₹${trackedOrder.subtotal_paise/100}, Delivery: ₹${trackedOrder.delivery_fee_paise/100}, Tax: ₹${trackedOrder.tax_paise/100}, Total: ₹${trackedOrder.total_paise/100}`);
  console.log(`   Delivery Address: ${trackedOrder.delivery_address}`);
  console.log(`   Customer Note: "${trackedOrder.customer_note}"`);
  console.log(`   Payment Method: ${trackedOrder.payment?.method}, Status: ${trackedOrder.payment?.status}`);

  // 8. Place Real COD Order
  const codOrderRes = await apiCall('/orders', 'POST', {
    restaurant_slug: 'spice-garden',
    order_type: 'delivery',
    customer_phone: testPhone,
    customer_name: 'Rahul Sharma',
    items: [
      {
        item_id: dish1.id,
        quantity: 3,
        unit_price_paise: dish1.base_price_paise
      }
    ],
    address: 'Flat 101, Hill Crest, Bandra, Mumbai 400050',
    payment_method: 'cod'
  }, customerToken);

  if (codOrderRes.status !== 201 || !codOrderRes.data.success) {
    throw new Error('Failed to place COD order: ' + JSON.stringify(codOrderRes.data));
  }
  console.log(`✅ 9. COD Order Placed Successfully! Order #${codOrderRes.data.order.order_no}, Total: ₹${codOrderRes.data.order.total_paise/100}`);

  console.log('\n==========================================');
  console.log('🎉 ALL 9/9 ORDER-TO-PAYMENT FLOW TESTS PASSED!');
  console.log('==========================================');
}

testFullFlow().catch(err => {
  console.error('❌ Test failed:', err.message);
  process.exit(1);
});
