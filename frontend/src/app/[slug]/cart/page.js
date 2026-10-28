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

  const { cart, restaurant, updateQuantity, removeItem, clearCart, itemCount, cartSubtotalPaise, setRestaurantInfo } = useCart();

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

  // UPI & Card Payment Modals State
  const [upiPaymentModal, setUpiPaymentModal] = useState(null);
  const [cardPaymentModal, setCardPaymentModal] = useState(null);
  const [upiConfirming, setUpiConfirming] = useState(false);
  const [cardProcessing, setCardProcessing] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [upiUtr, setUpiUtr] = useState('');

  // Card Form State
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardError, setCardError] = useState('');

  const formatCardNumber = (val) => {
    const clean = val.replace(/\D/g, '').slice(0, 16);
    return clean.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatExpiry = (val) => {
    const clean = val.replace(/\D/g, '').slice(0, 4);
    if (clean.length > 2) {
      return `${clean.slice(0, 2)}/${clean.slice(2)}`;
    }
    return clean;
  };

  const getCardBrand = (num) => {
    const clean = num.replace(/\D/g, '');
    if (clean.startsWith('4')) return 'VISA';
    if (/^(5[1-5]|2[2-7])/.test(clean)) return 'MASTERCARD';
    if (/^(60|65|81|82)/.test(clean)) return 'RUPAY';
    return 'CARD';
  };

  // Ensure restaurant data is loaded even on direct page reload
  useEffect(() => {
    if (slug && (!restaurant || restaurant.slug !== slug)) {
      fetchAPI(`/restaurant/${slug}`)
        .then(res => {
          if (res.success && res.restaurant) {
            setRestaurantInfo(res.restaurant);
          }
        })
        .catch(() => {});
    }
  }, [slug, restaurant, setRestaurantInfo]);

  useEffect(() => {
    const savedCustomer = localStorage.getItem('customer_info');
    const token = localStorage.getItem('customer_token');
    if (savedCustomer && token) {
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
      } catch (e) {
        setIsLoggedIn(false);
      }
    } else {
      setIsLoggedIn(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('customer_token');
    localStorage.removeItem('customer_info');
    setIsLoggedIn(false);
    setOtpSent(false);
    setOtpCode('');
  };

  const handleSendOtp = async () => {
    if (!customerPhone || customerPhone.length < 10) {
      setOrderError('Please enter a valid 10-digit mobile number to verify.');
      return;
    }
    setAuthLoading(true);
    setOrderError('');
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
      setOrderError(err.message || 'Failed to send verification OTP');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length < 4) {
      setOrderError('Please enter the 6-digit OTP code');
      return;
    }
    setAuthLoading(true);
    setOrderError('');
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
          address: res.customer?.addresses?.[0] || res.addresses?.[0]
        }));
        setIsLoggedIn(true);
        setOtpSent(false);
        setOrderError('');
        if (res.customer?.addresses?.[0] || res.addresses?.[0]) {
          const addr = res.customer?.addresses?.[0] || res.addresses?.[0];
          setAddressLine(addr.address_line || '');
          setLandmark(addr.landmark || '');
          setPincode(addr.pincode || '400050');
        }
      }
    } catch (err) {
      setOrderError(err.message || 'OTP verification failed');
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

  // CALCULATE TOTALS & THRESHOLDS
  const minOrderPaise = restaurant?.min_order_paise || 0;
  const isBelowMinOrder = minOrderPaise > 0 && cartSubtotalPaise < minOrderPaise;
  const amountNeededForMinOrder = (minOrderPaise - cartSubtotalPaise) / 100;

  const isFreeDelivery = Boolean(restaurant?.free_delivery_above_paise && cartSubtotalPaise >= restaurant.free_delivery_above_paise);
  const deliveryFeePaise = orderType === 'delivery' ? (isFreeDelivery ? 0 : (restaurant?.delivery_fee_paise || 3000)) : 0;
  const gstPercent = restaurant?.gst_percent || 5;
  const gstPaise = Math.round((cartSubtotalPaise * gstPercent) / 100);
  const discountPaise = appliedCoupon?.discountPaise || 0;
  const loyaltyDiscountPaise = useLoyalty ? Math.min(loyaltyPoints * 50, cartSubtotalPaise / 2) : 0;

  const grandTotalPaise = Math.max(0, cartSubtotalPaise + deliveryFeePaise + gstPaise - discountPaise - loyaltyDiscountPaise);

  const handlePlaceOrder = async () => {
    // 1. Mandatory Customer Login check
    const token = typeof window !== 'undefined' ? localStorage.getItem('customer_token') : null;
    if (!isLoggedIn || !token) {
      setOrderError('🔒 Customer Login Required: Please verify your mobile number with OTP before placing your order.');
      const contactSection = document.getElementById('customer-contact-section');
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      if (customerPhone && customerPhone.length === 10 && !otpSent) {
        handleSendOtp();
      }
      return;
    }

    if (isBelowMinOrder) {
      setOrderError(`Minimum order value for ${restaurant?.name || 'this restaurant'} is ₹${(minOrderPaise / 100).toFixed(0)}. Please add ₹${amountNeededForMinOrder.toFixed(0)} more dishes.`);
      return;
    }

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
          special_instructions: item.notes || item.specialNotes || ''
        })),
        address: orderType === 'delivery' ? {
          address_line: addressLine,
          landmark,
          pincode
        } : null,
        table_no: tableNo || null,
        coupon_code: appliedCoupon ? appliedCoupon.code : null,
        loyalty_points_redeemed: useLoyalty ? Math.min(loyaltyPoints, Math.floor(cartSubtotalPaise / 100)) : 0,
        payment_method: paymentMethod,
        customer_note: cookingNotes || ''
      };

      const res = await fetchAPI('/orders', {
        method: 'POST',
        body: JSON.stringify(orderPayload)
      });

      if (res.success && res.order) {
        if (paymentMethod === 'upi') {
          // Open Interactive UPI Payment Sheet (Google Pay / PhonePe / Paytm / QR)
          const upiId = restaurant?.upi_id || res.payment?.upiId || 'directdine@okhdfcbank';
          const payeeName = restaurant?.name || res.payment?.payeeName || 'Restaurant';
          const amountRupees = (grandTotalPaise / 100).toFixed(2);
          const upiUri = res.payment?.upiUri || `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${amountRupees}&cu=INR&tn=${encodeURIComponent(`Order #${res.order.order_no}`)}`;
          const qrUrl = res.payment?.qrUrl || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiUri)}`;

          setUpiPaymentModal({
            order: res.order,
            payment: {
              upiId,
              payeeName,
              amountRupees,
              upiUri,
              qrUrl
            }
          });
          setSubmitting(false);
        } else if (paymentMethod === 'card') {
          // Open Secure Debit / Credit Card Payment Modal
          setCardPaymentModal({
            order: res.order,
            amountRupees: (grandTotalPaise / 100).toFixed(2)
          });
          setCardName(customerName || 'Valued Guest');
          setSubmitting(false);
        } else {
          // Cash on Delivery — Direct Confirmation
          try {
            confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
          } catch (e) {}
          clearCart();
          setTimeout(() => {
            router.push(`/track/${res.order.public_token}`);
          }, 400);
        }
      } else {
        setOrderError(res.error || 'Failed to place order');
        setSubmitting(false);
      }
    } catch (err) {
      setOrderError(err.message);
      setSubmitting(false);
    }
  };

  const handleCopyUpiId = (id) => {
    try {
      navigator.clipboard.writeText(id);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    } catch (e) {}
  };

  const handleConfirmUpiPayment = async () => {
    if (!upiPaymentModal?.order?.id) return;
    setUpiConfirming(true);
    try {
      await fetchAPI('/payments/confirm-upi', {
        method: 'POST',
        body: JSON.stringify({
          orderId: upiPaymentModal.order.id,
          publicToken: upiPaymentModal.order.public_token,
          utr: upiUtr.trim() || undefined
        })
      });
      try {
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
      } catch (e) {}
      clearCart();
      router.push(`/track/${upiPaymentModal.order.public_token}`);
    } catch (err) {
      clearCart();
      router.push(`/track/${upiPaymentModal.order.public_token}`);
    } finally {
      setUpiConfirming(false);
    }
  };

  const handleProcessCardPayment = async (e) => {
    e?.preventDefault();
    const cleanNum = cardNumber.replace(/\s/g, '');
    if (cleanNum.length < 15) {
      setCardError('Please enter a valid 16-digit card number');
      return;
    }
    if (cardExpiry.length < 5) {
      setCardError('Please enter expiry date in MM/YY format');
      return;
    }
    if (cardCvv.length < 3) {
      setCardError('Please enter valid 3-digit CVV');
      return;
    }
    if (!cardName.trim()) {
      setCardError('Please enter cardholder name');
      return;
    }

    setCardError('');
    setCardProcessing(true);

    try {
      await fetchAPI('/payments/confirm-card', {
        method: 'POST',
        body: JSON.stringify({
          orderId: cardPaymentModal.order.id,
          publicToken: cardPaymentModal.order.public_token,
          last4: cleanNum.slice(-4),
          cardBrand: getCardBrand(cardNumber)
        })
      });
      try {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      } catch (e) {}
      clearCart();
      setTimeout(() => {
        router.push(`/track/${cardPaymentModal.order.public_token}`);
      }, 500);
    } catch (err) {
      clearCart();
      router.push(`/track/${cardPaymentModal.order.public_token}`);
    } finally {
      setCardProcessing(false);
    }
  };

  if (itemCount === 0 && !upiPaymentModal && !cardPaymentModal) {
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

      {/* COOKING & DELIVERY INSTRUCTIONS */}
      <div style={{ background: '#FFFFFF', borderRadius: 14, padding: '16px 20px', marginBottom: 18, border: '1px solid #ECEEF2', boxShadow: 'var(--shadow-sm)' }}>
        <label style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: '#1C1C1C', marginBottom: 6 }}>
          📝 Cooking & Delivery Instructions (Optional)
        </label>
        <textarea
          value={cookingNotes}
          onChange={(e) => setCookingNotes(e.target.value)}
          placeholder="e.g. Less spicy, extra green chutney, please don't ring the doorbell"
          rows={2}
          className="input-field"
          style={{ width: '100%', resize: 'none', fontSize: 13, padding: '10px 12px' }}
        />
      </div>

      {/* CUSTOMER & DELIVERY INFO */}
      <div id="customer-contact-section" style={{ background: '#FFFFFF', borderRadius: 14, padding: '18px 20px', marginBottom: 18, border: isLoggedIn ? '1.5px solid #BBF7D0' : '1px solid #ECEEF2', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 style={{ fontSize: 16, color: '#1C1C1C', margin: 0 }}>
            {orderType === 'delivery' ? '📍 Delivery Address & Contact' : '👤 Customer Contact'}
          </h2>
          {isLoggedIn ? (
            <span style={{ fontSize: 11, background: '#DCFCE7', color: '#15803D', fontWeight: 800, padding: '3px 9px', borderRadius: 20 }}>
              ✓ Verified Customer
            </span>
          ) : (
            <span style={{ fontSize: 11, background: '#FEF3C7', color: '#B45309', fontWeight: 700, padding: '3px 9px', borderRadius: 20 }}>
              🔒 Login Required
            </span>
          )}
        </div>

        {isLoggedIn ? (
          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '12px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#166534' }}>
                Logged in as {customerName || 'Customer'}
              </div>
              <div style={{ fontSize: 12, color: '#15803D', marginTop: 2 }}>
                📱 +91 {customerPhone} (OTP Verified)
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              style={{ background: 'none', border: 'none', color: '#DC2626', fontSize: 12, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
            >
              Switch Number
            </button>
          </div>
        ) : (
          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 12.5, color: '#92400E' }}>
            🔒 <strong>Mobile verification required:</strong> Enter your 10-digit number to receive an instant OTP before placing order.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12.5, color: '#4F4F4F', fontWeight: 600, marginBottom: 5 }}>
              WhatsApp Phone Number {isLoggedIn && '✓'}
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                id="phone-input-field"
                type="tel"
                disabled={isLoggedIn}
                placeholder="10-digit mobile number"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="input-field"
                style={{ flex: 1, height: 42, background: isLoggedIn ? '#F9FAFB' : '#FFFFFF' }}
              />
              {!isLoggedIn && (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={authLoading || customerPhone.length < 10}
                  className="btn-secondary"
                  style={{ padding: '8px 16px', fontSize: 12.5, whiteSpace: 'nowrap', borderRadius: 8, opacity: customerPhone.length < 10 ? 0.6 : 1 }}
                >
                  {authLoading ? 'Sending...' : otpSent ? 'Resend OTP' : 'Send OTP'}
                </button>
              )}
            </div>
          </div>

          {otpSent && !isLoggedIn && (
            <div style={{ background: '#F8F9FA', padding: 14, borderRadius: 10, border: '1.5px solid #24963F' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ fontSize: 12, color: '#1C1C1C', fontWeight: 700 }}>
                  Enter 6-digit Verification Code
                </label>
                <span style={{ fontSize: 11, color: '#24963F', fontWeight: 700 }}>
                  📲 Sent to +91 {customerPhone}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="input-field"
                  style={{ flex: 1, height: 42, letterSpacing: 4, fontWeight: 700, textAlign: 'center', fontSize: 16 }}
                />
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={authLoading || otpCode.length < 4}
                  className="btn-primary"
                  style={{ padding: '8px 20px', fontSize: 13, borderRadius: 8 }}
                >
                  {authLoading ? 'Verifying...' : 'Verify OTP ✓'}
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
      <div style={{ background: '#FFFFFF', borderRadius: 14, padding: '18px 20px', marginBottom: 20, border: '1px solid #ECEEF2', boxShadow: 'var(--shadow-sm)' }}>
        <h2 style={{ fontSize: 16, color: '#1C1C1C', marginBottom: 14 }}>📋 Bill Details</h2>

        {/* Free Delivery / Threshold callout */}
        {restaurant?.free_delivery_above_paise && (
          <div style={{
            background: isFreeDelivery ? '#F0FDF4' : '#F8F9FA',
            border: isFreeDelivery ? '1px solid #BBF7D0' : '1px dashed #D1D5DB',
            borderRadius: 8,
            padding: '8px 12px',
            marginBottom: 12,
            fontSize: 12.5,
            color: isFreeDelivery ? '#15803D' : '#4F4F4F',
            fontWeight: isFreeDelivery ? 700 : 500
          }}>
            {isFreeDelivery
              ? '🎉 FREE Delivery Unlocked!'
              : `🚚 Add ₹${(((restaurant.free_delivery_above_paise - cartSubtotalPaise) / 100)).toFixed(0)} more for FREE Delivery!`}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#4F4F4F' }}>Item Total</span>
            <span style={{ fontWeight: 600, color: '#1C1C1C' }}>₹{(cartSubtotalPaise / 100).toFixed(2)}</span>
          </div>

          {orderType === 'delivery' && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#4F4F4F' }}>Delivery Partner Fee</span>
              <span style={{ fontWeight: 600, color: isFreeDelivery ? '#15803D' : '#1C1C1C' }}>
                {isFreeDelivery ? 'FREE' : `₹${(deliveryFeePaise / 100).toFixed(2)}`}
              </span>
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

      {/* MINIMUM ORDER VALUE WARNING */}
      {isBelowMinOrder && (
        <div style={{ background: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: 12, padding: '12px 16px', marginBottom: 18, fontSize: 13, color: '#92400E', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <strong>Min Order Required:</strong> ₹{(minOrderPaise / 100).toFixed(0)}
            <div style={{ fontSize: 12, color: '#B45309', marginTop: 2 }}>
              Add ₹{amountNeededForMinOrder.toFixed(0)} more dishes to checkout.
            </div>
          </div>
          <Link href={`/${slug}`} style={{ background: '#D97706', color: '#FFFFFF', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
            + Add Dishes
          </Link>
        </div>
      )}

      {orderError && (
        <div style={{ background: '#FEECEE', border: '1px solid #FBCED2', color: 'var(--status-cancel)', padding: 12, borderRadius: 10, marginBottom: 20, fontSize: 13.5 }}>
          ⚠️ {orderError}
        </div>
      )}

      {/* PLACE ORDER ACTION */}
      <button
        onClick={handlePlaceOrder}
        disabled={submitting || isBelowMinOrder}
        className="btn-primary"
        style={{
          width: '100%',
          padding: '16px 24px',
          fontSize: 16,
          fontWeight: 900,
          borderRadius: 12,
          cursor: (submitting || isBelowMinOrder) ? 'not-allowed' : 'pointer',
          opacity: (submitting || isBelowMinOrder) ? 0.65 : 1,
          background: isBelowMinOrder ? '#6B7280' : !isLoggedIn ? '#1C1C1C' : undefined
        }}
      >
        {submitting
          ? 'Connecting to Secure Payment...'
          : isBelowMinOrder
          ? `Add ₹${amountNeededForMinOrder.toFixed(0)} more (Min Order ₹${(minOrderPaise / 100).toFixed(0)})`
          : !isLoggedIn
          ? `🔒 Verify Mobile to Place Order (₹${(grandTotalPaise / 100).toFixed(2)}) ➔`
          : paymentMethod === 'upi'
          ? `Proceed to Pay ₹${(grandTotalPaise / 100).toFixed(2)} via UPI ➔`
          : paymentMethod === 'card'
          ? `Proceed to Pay ₹${(grandTotalPaise / 100).toFixed(2)} via Card ➔`
          : `Confirm Order with Cash on Delivery (₹${(grandTotalPaise / 100).toFixed(2)}) ➔`}
      </button>

      {/* REAL DIRECT UPI PAYMENT GATEWAY MODAL */}
      {upiPaymentModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.72)',
          backdropFilter: 'blur(6px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: 20,
            maxWidth: 440,
            width: '100%',
            padding: '24px 22px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            maxHeight: '92vh',
            overflowY: 'auto',
            textAlign: 'center',
            position: 'relative'
          }}>
            {/* Close / Cancel Button */}
            <button
              type="button"
              onClick={() => setUpiPaymentModal(null)}
              style={{
                position: 'absolute',
                top: 14,
                right: 14,
                background: '#F3F4F6',
                border: 'none',
                width: 32,
                height: 32,
                borderRadius: '50%',
                fontSize: 16,
                fontWeight: 700,
                color: '#4B5563',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Close payment window"
            >
              ✕
            </button>

            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, paddingRight: 32 }}>
              <div style={{ textAlign: 'left' }}>
                <span style={{ fontSize: 11, background: '#EDF8F0', color: '#1B7A32', fontWeight: 800, padding: '3px 8px', borderRadius: 6 }}>
                  ⚡ Instant UPI Payment
                </span>
                <h3 style={{ fontSize: 18, color: '#1C1C1C', marginTop: 4, margin: 0 }}>
                  Complete UPI Payment
                </h3>
                <div style={{ fontSize: 12, color: '#696969', marginTop: 2 }}>Order #{upiPaymentModal.order.order_no}</div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--primary)', textAlign: 'right' }}>
                ₹{upiPaymentModal.payment.amountRupees}
              </div>
            </div>

            <p style={{ fontSize: 13, color: '#4F4F4F', marginBottom: 18, textAlign: 'left', lineHeight: 1.4 }}>
              Choose your mobile UPI app or scan the QR code to pay <strong>{upiPaymentModal.payment.payeeName}</strong>:
            </p>

            {/* DIRECT MOBILE 1-TAP UPI APP LAUNCHERS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              <a
                href={upiPaymentModal.payment.upiUri}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: '#F0FDF4',
                  border: '1.5px solid #86EFAC',
                  textDecoration: 'none',
                  color: '#15803D',
                  fontWeight: 800,
                  fontSize: 14.5,
                  boxShadow: '0 2px 6px rgba(34, 197, 94, 0.12)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 22 }}>🟢</span>
                  <div style={{ textAlign: 'left' }}>
                    <div>Pay with Google Pay (GPay)</div>
                    <div style={{ fontSize: 11, color: '#166534', fontWeight: 500 }}>Auto-opens Google Pay app</div>
                  </div>
                </div>
                <span style={{ fontSize: 16 }}>➔</span>
              </a>

              <a
                href={upiPaymentModal.payment.upiUri}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: '#FAF5FF',
                  border: '1.5px solid #D8B4FE',
                  textDecoration: 'none',
                  color: '#6B21A8',
                  fontWeight: 800,
                  fontSize: 14.5,
                  boxShadow: '0 2px 6px rgba(168, 85, 247, 0.12)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 22 }}>🟣</span>
                  <div style={{ textAlign: 'left' }}>
                    <div>Pay with PhonePe</div>
                    <div style={{ fontSize: 11, color: '#581C87', fontWeight: 500 }}>Auto-opens PhonePe app</div>
                  </div>
                </div>
                <span style={{ fontSize: 16 }}>➔</span>
              </a>

              <a
                href={upiPaymentModal.payment.upiUri}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: '#F0F9FF',
                  border: '1.5px solid #BAE6FD',
                  textDecoration: 'none',
                  color: '#0369A1',
                  fontWeight: 800,
                  fontSize: 14.5
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 22 }}>🔵</span>
                  <div style={{ textAlign: 'left' }}>
                    <div>Pay with Paytm / Any UPI App</div>
                    <div style={{ fontSize: 11, color: '#075985', fontWeight: 500 }}>Paytm, BHIM, CRED, WhatsApp Pay</div>
                  </div>
                </div>
                <span style={{ fontSize: 16 }}>➔</span>
              </a>
            </div>

            {/* DYNAMIC UPI QR CODE SECTION */}
            <div style={{ background: '#F8F9FA', borderRadius: 14, padding: 14, marginBottom: 18, border: '1px solid #ECEEF2' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#696969', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Or Scan QR Code with Any UPI App
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                <div style={{ background: '#FFFFFF', padding: 8, borderRadius: 12, border: '1.5px solid #E3E5EB', display: 'inline-block' }}>
                  <img
                    src={upiPaymentModal.payment.qrUrl}
                    alt="UPI Payment QR"
                    width={180}
                    height={180}
                    style={{ display: 'block', borderRadius: 8 }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 12, color: '#4F4F4F' }}>
                <span>UPI ID: <strong>{upiPaymentModal.payment.upiId}</strong></span>
                <button
                  type="button"
                  onClick={() => handleCopyUpiId(upiPaymentModal.payment.upiId)}
                  style={{ background: '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: 6, padding: '3px 8px', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}
                >
                  {copiedUpi ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {/* OPTIONAL UTR / TRANSACTION ID INPUT */}
            <div style={{ marginBottom: 14, textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#4F4F4F', marginBottom: 5 }}>
                UPI Ref / UTR No. (Optional)
              </label>
              <input
                type="text"
                value={upiUtr}
                onChange={(e) => setUpiUtr(e.target.value.replace(/\D/g, '').slice(0, 12))}
                placeholder="12-digit UTR from GPay / PhonePe"
                className="input-field"
                style={{ width: '100%', height: 40, fontSize: 13, letterSpacing: 1 }}
              />
            </div>

            {/* CONFIRMATION ACTIONS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                type="button"
                onClick={handleConfirmUpiPayment}
                disabled={upiConfirming}
                className="btn-primary"
                style={{ width: '100%', padding: '14px', fontSize: 15, fontWeight: 800, borderRadius: 12 }}
              >
                {upiConfirming ? 'Verifying Payment...' : '✓ I Have Paid (Confirm & Track Order)'}
              </button>

              <button
                type="button"
                onClick={() => {
                  clearCart();
                  router.push(`/track/${upiPaymentModal.order.public_token}`);
                }}
                style={{ background: 'transparent', border: 'none', color: '#696969', fontSize: 13, cursor: 'pointer', padding: 8, textDecoration: 'underline' }}
              >
                Pay later on delivery / Continue to live tracking ➔
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECURE CARD PAYMENT GATEWAY MODAL */}
      {cardPaymentModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.72)',
          backdropFilter: 'blur(6px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: 20,
            maxWidth: 440,
            width: '100%',
            padding: '24px 22px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            maxHeight: '92vh',
            overflowY: 'auto',
            textAlign: 'left',
            position: 'relative'
          }}>
            {/* Close / Cancel Button */}
            <button
              type="button"
              onClick={() => setCardPaymentModal(null)}
              style={{
                position: 'absolute',
                top: 14,
                right: 14,
                background: '#F3F4F6',
                border: 'none',
                width: 32,
                height: 32,
                borderRadius: '50%',
                fontSize: 16,
                fontWeight: 700,
                color: '#4B5563',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Close payment window"
            >
              ✕
            </button>

            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, paddingRight: 32 }}>
              <div>
                <span style={{ fontSize: 11, background: '#EFF6FF', color: '#1D4ED8', fontWeight: 800, padding: '3px 8px', borderRadius: 6 }}>
                  🔒 256-Bit SSL Encrypted
                </span>
                <h3 style={{ fontSize: 18, color: '#1C1C1C', marginTop: 4, margin: 0 }}>
                  Card Payment
                </h3>
                <div style={{ fontSize: 12, color: '#696969', marginTop: 2 }}>Order #{cardPaymentModal.order.order_no}</div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--primary)', textAlign: 'right' }}>
                ₹{cardPaymentModal.amountRupees}
              </div>
            </div>

            {/* Virtual Card Preview */}
            <div style={{
              background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
              color: '#FFFFFF',
              borderRadius: 14,
              padding: '18px 20px',
              marginBottom: 18,
              boxShadow: '0 8px 18px rgba(15, 23, 42, 0.25)',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: 18 }}>💳</span>
                <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.5, color: '#93C5FD' }}>
                  {getCardBrand(cardNumber)}
                </span>
              </div>
              <div style={{ fontSize: 17, letterSpacing: 3, fontWeight: 600, fontFamily: 'monospace', marginBottom: 12, color: '#F8FAFC' }}>
                {cardNumber || '•••• •••• •••• ••••'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94A3B8' }}>
                <div>
                  <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5 }}>Cardholder</div>
                  <div style={{ color: '#FFFFFF', fontWeight: 700, fontSize: 12 }}>{cardName || 'YOUR NAME'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5 }}>Expires</div>
                  <div style={{ color: '#FFFFFF', fontWeight: 700, fontSize: 12 }}>{cardExpiry || 'MM/YY'}</div>
                </div>
              </div>
            </div>

            {/* Card Form */}
            <form onSubmit={handleProcessCardPayment} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4 }}>
                  Card Number
                </label>
                <input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  maxLength={19}
                  className="input-field"
                  style={{ width: '100%', height: 42, fontSize: 14, letterSpacing: 1 }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4 }}>
                  Cardholder Name
                </label>
                <input
                  type="text"
                  placeholder="Name printed on card"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value.toUpperCase())}
                  className="input-field"
                  style={{ width: '100%', height: 42, fontSize: 13, textTransform: 'uppercase' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4 }}>
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                    maxLength={5}
                    className="input-field"
                    style={{ width: '100%', height: 42, fontSize: 13, textAlign: 'center' }}
                    required
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4 }}>
                    CVV / CVC
                  </label>
                  <input
                    type="password"
                    placeholder="•••"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    maxLength={4}
                    className="input-field"
                    style={{ width: '100%', height: 42, fontSize: 14, textAlign: 'center', letterSpacing: 2 }}
                    required
                  />
                </div>
              </div>

              {cardError && (
                <div style={{ background: '#FEECEE', border: '1px solid #FBCED2', color: 'var(--status-cancel)', padding: '8px 12px', borderRadius: 8, fontSize: 12 }}>
                  ⚠️ {cardError}
                </div>
              )}

              <div style={{ fontSize: 11, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 6, margin: '4px 0 8px' }}>
                <span>🔒</span>
                <span>RBI compliant 3D Secure verification • Instant confirmation</span>
              </div>

              <button
                type="submit"
                disabled={cardProcessing}
                className="btn-primary"
                style={{ width: '100%', padding: '14px', fontSize: 15, fontWeight: 800, borderRadius: 12, marginTop: 4 }}
              >
                {cardProcessing ? 'Contacting Bank 3D Secure...' : `🔒 Pay ₹${cardPaymentModal.amountRupees} Securely`}
              </button>

              <button
                type="button"
                onClick={() => setCardPaymentModal(null)}
                style={{ background: 'transparent', border: 'none', color: '#696969', fontSize: 12.5, cursor: 'pointer', padding: 6, textAlign: 'center', textDecoration: 'underline' }}
              >
                ← Cancel & Return to Cart
              </button>
            </form>
          </div>
        </div>
      )}
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
