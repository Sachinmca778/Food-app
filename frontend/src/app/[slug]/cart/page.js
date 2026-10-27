'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import { fetchAPI } from '@/lib/api';
import { useCart } from '@/lib/cartContext';

function CartContent() {
  const params = useParams();
  const slug = params?.slug;
  const router = useRouter();

  const { cart, restaurant, updateQuantity, removeItem, clearCart, itemCount, cartSubtotalPaise } = useCart();

  // Order Details
  const [orderType, setOrderType] = useState('delivery'); // 'delivery' or 'pickup'
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pincode, setPincode] = useState('400050');
  const [tableNo, setTableNo] = useState('');
  const [cookingNotes, setCookingNotes] = useState('');

  // OTP Auth State
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // Loyalty & Coupon
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [useLoyalty, setUseLoyalty] = useState(false);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi', 'card', 'cod'
  const [submitting, setSubmitting] = useState(false);
  const [orderError, setOrderError] = useState('');

  useEffect(() => {
    const savedCustomer = localStorage.getItem('customer_info');
    if (savedCustomer) {
      try {
        const c = JSON.parse(savedCustomer);
        setCustomerPhone(c.phone || '');
        setCustomerName(c.name || '');
        if (c.address) {
          setAddressLine(c.address.address_line || '');
          setLandmark(c.address.landmark || '');
          setPincode(c.address.pincode || '400050');
        }
        setIsLoggedIn(true);
      } catch (e) {}
    }
  }, []);

  const handleSendOtp = async () => {
    if (!customerPhone || customerPhone.length < 10) {
      alert('Please enter a valid 10-digit mobile number');
      return;
    }
    setAuthLoading(true);
    try {
      const res = await fetchAPI('/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ phone: customerPhone })
      });
      setOtpSent(true);
      if (res.demo_otp) {
        setOtpCode(res.demo_otp);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setAuthLoading(true);
    try {
      const res = await fetchAPI('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ phone: customerPhone, otp: otpCode, name: customerName })
      });
      if (res.token) {
        localStorage.setItem('customer_token', res.token);
        localStorage.setItem('customer_info', JSON.stringify({
          phone: customerPhone,
          name: res.customer?.name || customerName,
          address: res.addresses?.[0]
        }));
        setIsLoggedIn(true);
        if (res.addresses?.[0]) {
          setAddressLine(res.addresses[0].address_line);
          setLandmark(res.addresses[0].landmark || '');
          setPincode(res.addresses[0].pincode || '400050');
        }
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleApplyCoupon = (codeToApply) => {
    const code = (codeToApply || couponCode).trim().toUpperCase();
    setCouponError('');
    if (!code) return;

    if (code === 'WELCOME10') {
      const discount = Math.min(Math.round(cartSubtotalPaise * 0.1), 10000);
      setAppliedCoupon({ code: 'WELCOME10', discountPaise: discount, type: 'percent', value: 10 });
    } else if (code === 'FLAT50') {
      if (cartSubtotalPaise < 30000) {
        setCouponError('Minimum order of ₹300 required for FLAT50');
        return;
      }
      setAppliedCoupon({ code: 'FLAT50', discountPaise: 5000, type: 'flat', value: 50 });
    } else {
      setCouponError('Invalid coupon code. Try WELCOME10 or FLAT50');
    }
  };

  // CALCULATE TOTALS
  const deliveryFeePaise = orderType === 'delivery' ? (restaurant?.delivery_fee_paise || 4000) : 0;
  const gstPercent = restaurant?.gst_percent || 5;
  const gstPaise = Math.round((cartSubtotalPaise * gstPercent) / 100);
  const discountPaise = appliedCoupon?.discountPaise || 0;
  const loyaltyDiscountPaise = useLoyalty ? Math.min(loyaltyPoints * 50, cartSubtotalPaise / 2) : 0;

  const grandTotalPaise = Math.max(0, cartSubtotalPaise + deliveryFeePaise + gstPaise - discountPaise - loyaltyDiscountPaise);

  const handlePlaceOrder = async () => {
    if (!customerPhone || customerPhone.length < 10) {
      setOrderError('Please provide a valid 10-digit WhatsApp number');
      return;
    }
    if (orderType === 'delivery' && !addressLine) {
      setOrderError('Please provide your complete delivery address');
      return;
    }

    setSubmitting(true);
    setOrderError('');

    try {
      const orderPayload = {
        restaurant_slug: slug,
        order_type: orderType,
        customer_phone: customerPhone,
        customer_name: customerName || 'Valued Guest',
        items: cart.map(item => ({
          item_id: item.itemId,
          variant_id: item.variantId,
          addons: item.addons?.map(a => a.id) || [],
          quantity: item.quantity,
          unit_price_paise: item.unitPricePaise,
          special_instructions: item.specialNotes
        })),
        address: orderType === 'delivery' ? {
          address_line: addressLine,
          landmark,
          pincode
        } : null,
        table_no: tableNo || null,
        coupon_code: appliedCoupon ? appliedCoupon.code : null,
        loyalty_points_redeemed: useLoyalty ? Math.min(loyaltyPoints, Math.floor(cartSubtotalPaise / 100)) : 0,
        payment_method: paymentMethod
      };

      const res = await fetchAPI('/orders', {
        method: 'POST',
        body: JSON.stringify(orderPayload)
      });

      if (res.success && res.order) {
        try {
          confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
        } catch (e) {}

        clearCart();

        setTimeout(() => {
          router.push(`/track/${res.order.public_token}`);
        }, 600);
      } else {
        setOrderError(res.error || 'Failed to place order');
        setSubmitting(false);
      }
    } catch (err) {
      setOrderError(err.message);
      setSubmitting(false);
    }
  };

  if (itemCount === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', maxWidth: 440, margin: '0 auto' }}>
        <div style={{ fontSize: 54, marginBottom: 14 }}>🛒</div>
        <h2 style={{ fontSize: 24, marginBottom: 8, color: '#1C1C1C' }}>Your Cart is Empty</h2>
        <p style={{ color: '#696969', marginBottom: 24, fontSize: 14 }}>Explore delicious dishes crafted with authentic spices.</p>
        <Link href={`/${slug}`} className="btn-primary" style={{ padding: '12px 26px', fontSize: 14, borderRadius: 10 }}>
          Browse Full Menu ➔
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '18px 14px 80px' }}>
      {/* HEADER BAR */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <Link href={`/${slug}`} style={{ background: '#FFFFFF', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, border: '1px solid #E3E5EB', boxShadow: 'var(--shadow-sm)' }}>
          ←
        </Link>
        <div>
          <h1 style={{ fontSize: 22, color: '#1C1C1C', lineHeight: 1.15 }}>Order & Checkout</h1>
          <p style={{ color: '#696969', fontSize: 12.5, marginTop: 2 }}>{restaurant?.name || 'Restaurant'}</p>
        </div>
      </div>

      {/* DELIVERY OR PICKUP SELECTOR */}
      <div style={{ background: '#FFFFFF', padding: 4, display: 'flex', gap: 6, marginBottom: 18, borderRadius: 12, border: '1px solid #E3E5EB', boxShadow: 'var(--shadow-sm)' }}>
        <button
          onClick={() => setOrderType('delivery')}
          style={{
            flex: 1,
            padding: '11px 16px',
            borderRadius: 8,
            fontWeight: 800,
            fontSize: 13.5,
            background: orderType === 'delivery' ? 'var(--primary)' : 'transparent',
            color: orderType === 'delivery' ? '#FFFFFF' : '#4F4F4F',
            transition: 'all 0.18s ease'
          }}
        >
          🛵 Home Delivery
        </button>
        <button
          onClick={() => setOrderType('pickup')}
          style={{
            flex: 1,
            padding: '11px 16px',
            borderRadius: 8,
            fontWeight: 800,
            fontSize: 13.5,
            background: orderType === 'pickup' ? 'var(--primary)' : 'transparent',
            color: orderType === 'pickup' ? '#FFFFFF' : '#4F4F4F',
            transition: 'all 0.18s ease'
          }}
        >
          🥡 Takeaway / Pickup
        </button>
      </div>

      {/* ITEMS IN CART */}
      <div style={{ background: '#FFFFFF', borderRadius: 14, padding: '18px 20px', marginBottom: 18, border: '1px solid #ECEEF2', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, color: '#1C1C1C' }}>Order Items ({itemCount})</h2>
          <Link href={`/${slug}`} style={{ fontSize: 12.5, color: 'var(--primary)', fontWeight: 700 }}>+ Add More Dishes</Link>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {cart.map(item => (
            <div key={item.cartKey} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 14, borderBottom: '1px solid #F0F1F4' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span className={item.veg_type === 'veg' ? 'badge-veg' : 'badge-nonveg'} style={{ marginTop: 3 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#1C1C1C' }}>{item.name}</div>
                  {item.variantName && (
                    <div style={{ fontSize: 12, color: '#696969' }}>Size: {item.variantName}</div>
                  )}
                  {item.addons && item.addons.length > 0 && (
                    <div style={{ fontSize: 12, color: '#696969' }}>
                      + {item.addons.map(a => a.name).join(', ')}
                    </div>
                  )}
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#1C1C1C', marginTop: 4 }}>
                    ₹{(item.unitPricePaise / 100).toFixed(0)} × {item.quantity} = ₹{((item.unitPricePaise * item.quantity) / 100).toFixed(0)}
                  </div>
                </div>
              </div>

              {/* Quantity Counter */}
              <div className="zomato-qty-pill">
                <button onClick={() => updateQuantity(item.cartKey, -1)}>-</button>
                <span>{item.quantity}</span>
                <button onClick={() => updateQuantity(item.cartKey, 1)}>+</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CUSTOMER & DELIVERY INFO */}
      <div style={{ background: '#FFFFFF', borderRadius: 14, padding: '18px 20px', marginBottom: 18, border: '1px solid #ECEEF2', boxShadow: 'var(--shadow-sm)' }}>
        <h2 style={{ fontSize: 16, color: '#1C1C1C', marginBottom: 14 }}>
          {orderType === 'delivery' ? '📍 Delivery Address' : '👤 Customer Contact'}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12.5, color: '#4F4F4F', fontWeight: 600, marginBottom: 5 }}>
              WhatsApp Phone Number (for order alerts)
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="tel"
                placeholder="10-digit mobile number"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="input-field"
                style={{ flex: 1, height: 42 }}
              />
              {!isLoggedIn && (
                <button
                  onClick={handleSendOtp}
                  disabled={authLoading}
                  className="btn-secondary"
                  style={{ padding: '8px 16px', fontSize: 12.5, whiteSpace: 'nowrap', borderRadius: 8 }}
                >
                  {otpSent ? 'Resend' : 'Send OTP'}
                </button>
              )}
            </div>
          </div>

          {otpSent && !isLoggedIn && (
            <div style={{ background: '#FFF1F2', padding: 12, borderRadius: 10, border: '1px solid #FBCED2' }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--primary)', fontWeight: 700, marginBottom: 5 }}>
                Enter OTP sent to your WhatsApp (Demo OTP: 123456)
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="input-field"
                  style={{ flex: 1, height: 40 }}
                />
                <button
                  onClick={handleVerifyOtp}
                  disabled={authLoading}
                  className="btn-primary"
                  style={{ padding: '8px 16px', fontSize: 12.5, borderRadius: 8 }}
                >
                  Verify
                </button>
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: 12.5, color: '#4F4F4F', fontWeight: 600, marginBottom: 5 }}>
              Your Name
            </label>
            <input
              type="text"
              placeholder="e.g. Priya Sharma"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="input-field"
              style={{ height: 42 }}
            />
          </div>

          {orderType === 'delivery' && (
            <>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, color: '#4F4F4F', fontWeight: 600, marginBottom: 5 }}>
                  Complete Street Address
                </label>
                <input
                  type="text"
                  placeholder="Flat No, Wing, Apartment, Street name"
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  className="input-field"
                  style={{ height: 42 }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12.5, color: '#4F4F4F', fontWeight: 600, marginBottom: 5 }}>
                    Landmark
                  </label>
                  <input
                    type="text"
                    placeholder="Near landmark"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    className="input-field"
                    style={{ height: 42 }}
                  />
                </div>
                <div style={{ width: 130 }}>
                  <label style={{ display: 'block', fontSize: 12.5, color: '#4F4F4F', fontWeight: 600, marginBottom: 5 }}>
                    Pincode
                  </label>
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="input-field"
                    style={{ height: 42 }}
                  />
                </div>
              </div>
            </>
          )}

          {orderType === 'pickup' && (
            <div>
              <label style={{ display: 'block', fontSize: 12.5, color: '#4F4F4F', fontWeight: 600, marginBottom: 5 }}>
                Table Number (if dining in)
              </label>
              <input
                type="text"
                placeholder="e.g. Table 4 (Optional)"
                value={tableNo}
                onChange={(e) => setTableNo(e.target.value)}
                className="input-field"
                style={{ height: 42 }}
              />
            </div>
          )}
        </div>
      </div>

      {/* COUPONS SECTION */}
      <div style={{ background: '#FFFFFF', borderRadius: 14, padding: '18px 20px', marginBottom: 18, border: '1px solid #ECEEF2', boxShadow: 'var(--shadow-sm)' }}>
        <h2 style={{ fontSize: 16, color: '#1C1C1C', marginBottom: 12 }}>🎟️ Coupons & Offers</h2>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <input
            type="text"
            placeholder="Enter promo code"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            className="input-field"
            style={{ flex: 1, textTransform: 'uppercase', height: 40 }}
          />
          <button
            onClick={() => handleApplyCoupon()}
            className="btn-secondary"
            style={{ padding: '8px 18px', fontSize: 13, borderRadius: 8 }}
          >
            Apply
          </button>
        </div>

        {/* Promo Code Chips */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => { setCouponCode('WELCOME10'); handleApplyCoupon('WELCOME10'); }}
            style={{ background: '#FFF1F2', border: '1px dashed var(--primary)', padding: '5px 12px', borderRadius: 6, fontSize: 12, color: 'var(--primary)', fontWeight: 700 }}
          >
            WELCOME10 (10% OFF)
          </button>
          <button
            onClick={() => { setCouponCode('FLAT50'); handleApplyCoupon('FLAT50'); }}
            style={{ background: '#FFF1F2', border: '1px dashed var(--primary)', padding: '5px 12px', borderRadius: 6, fontSize: 12, color: 'var(--primary)', fontWeight: 700 }}
          >
            FLAT50 (₹50 OFF on ₹300+)
          </button>
        </div>

        {appliedCoupon && (
          <div style={{ marginTop: 10, color: 'var(--veg-color)', fontSize: 13, fontWeight: 700 }}>
            ✓ Coupon {appliedCoupon.code} applied! Saved ₹{(appliedCoupon.discountPaise / 100).toFixed(0)}
          </div>
        )}
        {couponError && (
          <div style={{ marginTop: 10, color: 'var(--status-cancel)', fontSize: 13 }}>
            ⚠️ {couponError}
          </div>
        )}
      </div>

      {/* PAYMENT METHOD SELECTION */}
      <div style={{ background: '#FFFFFF', borderRadius: 14, padding: '18px 20px', marginBottom: 18, border: '1px solid #ECEEF2', boxShadow: 'var(--shadow-sm)' }}>
        <h2 style={{ fontSize: 16, color: '#1C1C1C', marginBottom: 14 }}>💳 Payment Mode</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderRadius: 10,
            background: paymentMethod === 'upi' ? '#FFF1F2' : '#F8F9FA',
            border: `1.5px solid ${paymentMethod === 'upi' ? 'var(--primary)' : '#E3E5EB'}`,
            cursor: 'pointer'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === 'upi'}
                onChange={() => setPaymentMethod('upi')}
                style={{ accentColor: 'var(--primary)', width: 17, height: 17 }}
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#1C1C1C' }}>UPI (GPay / PhonePe / Paytm / QR)</div>
                <div style={{ fontSize: 11.5, color: '#696969' }}>Instant confirmation directly to restaurant</div>
              </div>
            </div>
            <span style={{ fontSize: 20 }}>⚡</span>
          </label>

          <label style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderRadius: 10,
            background: paymentMethod === 'card' ? '#FFF1F2' : '#F8F9FA',
            border: `1.5px solid ${paymentMethod === 'card' ? 'var(--primary)' : '#E3E5EB'}`,
            cursor: 'pointer'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === 'card'}
                onChange={() => setPaymentMethod('card')}
                style={{ accentColor: 'var(--primary)', width: 17, height: 17 }}
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#1C1C1C' }}>Credit / Debit Card</div>
                <div style={{ fontSize: 11.5, color: '#696969' }}>Visa, MasterCard, RuPay</div>
              </div>
            </div>
            <span style={{ fontSize: 20 }}>💳</span>
          </label>

          <label style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderRadius: 10,
            background: paymentMethod === 'cod' ? '#FFF1F2' : '#F8F9FA',
            border: `1.5px solid ${paymentMethod === 'cod' ? 'var(--primary)' : '#E3E5EB'}`,
            cursor: 'pointer'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === 'cod'}
                onChange={() => setPaymentMethod('cod')}
                style={{ accentColor: 'var(--primary)', width: 17, height: 17 }}
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#1C1C1C' }}>Cash on Delivery (COD)</div>
                <div style={{ fontSize: 11.5, color: '#696969' }}>Pay in cash or UPI to delivery rider</div>
              </div>
            </div>
            <span style={{ fontSize: 20 }}>💵</span>
          </label>
        </div>
      </div>

      {/* ITEMIZED BILL BREAKDOWN */}
      <div style={{ background: '#FFFFFF', borderRadius: 14, padding: '18px 20px', marginBottom: 24, border: '1px solid #ECEEF2', boxShadow: 'var(--shadow-sm)' }}>
        <h2 style={{ fontSize: 16, color: '#1C1C1C', marginBottom: 14 }}>📋 Bill Details</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#4F4F4F' }}>Item Total</span>
            <span style={{ fontWeight: 600, color: '#1C1C1C' }}>₹{(cartSubtotalPaise / 100).toFixed(2)}</span>
          </div>

          {orderType === 'delivery' && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#4F4F4F' }}>Delivery Partner Fee</span>
              <span style={{ fontWeight: 600, color: '#1C1C1C' }}>₹{(deliveryFeePaise / 100).toFixed(2)}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#4F4F4F' }}>Taxes & GST ({gstPercent}%)</span>
            <span style={{ fontWeight: 600, color: '#1C1C1C' }}>₹{(gstPaise / 100).toFixed(2)}</span>
          </div>

          {appliedCoupon && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--veg-color)', fontWeight: 700 }}>
              <span>Coupon Discount ({appliedCoupon.code})</span>
              <span>-₹{(discountPaise / 100).toFixed(2)}</span>
            </div>
          )}

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            borderTop: '1px solid #ECEEF2',
            paddingTop: 14,
            marginTop: 4,
            fontSize: 18,
            fontWeight: 900,
            color: '#1C1C1C'
          }}>
            <span>To Pay</span>
            <span style={{ color: 'var(--primary)' }}>₹{(grandTotalPaise / 100).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {orderError && (
        <div style={{ background: '#FEECEE', border: '1px solid #FBCED2', color: 'var(--status-cancel)', padding: 12, borderRadius: 10, marginBottom: 20, fontSize: 13.5 }}>
          ⚠️ {orderError}
        </div>
      )}

      {/* PLACE ORDER ACTION */}
      <button
        onClick={handlePlaceOrder}
        disabled={submitting}
        className="btn-primary"
        style={{
          width: '100%',
          padding: '16px 24px',
          fontSize: 16,
          fontWeight: 900,
          borderRadius: 12,
          cursor: submitting ? 'not-allowed' : 'pointer',
          opacity: submitting ? 0.7 : 1
        }}
      >
        {submitting ? 'Placing Order...' : `Pay ₹${(grandTotalPaise / 100).toFixed(2)} & Place Order ➔`}
      </button>

      <p style={{ textAlign: 'center', fontSize: 12, color: '#696969', marginTop: 12 }}>
        🔒 256-bit Encrypted Checkout. Payment goes directly to the restaurant.
      </p>
    </div>
  );
}

export default function CartAndCheckoutPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: 60, color: '#696969' }}>Loading cart...</div>}>
      <CartContent />
    </Suspense>
  );
}
