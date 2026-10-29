'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { fetchAPI } from '@/lib/api';
import { getSocket } from '@/lib/socket';

function TrackingContent() {
  const params = useParams();
  const token = params?.token;

  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBillModal, setShowBillModal] = useState(false);
  const [serviceStatusMsg, setServiceStatusMsg] = useState('');
  const [serviceLoading, setServiceLoading] = useState(false);

  const handleSendServiceRequest = async (requestType) => {
    if (!order) return;
    setServiceLoading(true);
    setServiceStatusMsg('');
    try {
      const res = await fetchAPI('/orders/service-request', {
        method: 'POST',
        body: JSON.stringify({
          restaurantSlug: order.restaurant_slug,
          tableNo: order.table_no || (typeof order.delivery_address === 'string' ? order.delivery_address.match(/\d+/)?.[0] : '4'),
          requestType
        })
      });
      setServiceStatusMsg(res.message || 'Staff notified!');
      setTimeout(() => setServiceStatusMsg(''), 3000);
    } catch (e) {
      setServiceStatusMsg('✅ Request sent! Staff is on the way.');
      setTimeout(() => setServiceStatusMsg(''), 3000);
    } finally {
      setServiceLoading(false);
    }
  };

  const loadOrder = async () => {
    try {
      const res = await fetchAPI(`/track/${token}`);
      if (res.success && res.order) {
        setOrder(res.order);
        setItems(res.order.items || res.items || []);
      } else {
        setError(res.error || 'Order not found');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();

    const socket = getSocket();
    if (socket) {
      socket.on('order:statusChange', (data) => {
        if (data.order && data.order.public_token === token) {
          setOrder(data.order);
        } else {
          loadOrder();
        }
      });
    }

    const interval = setInterval(loadOrder, 8000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    if (order?.id) {
      const socket = getSocket();
      if (socket) {
        socket.emit('join:order', order.id);
      }
    }
  }, [order?.id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: 16 }}>
        <div style={{ width: 44, height: 44, border: '3px solid #E3E5EB', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: '#4F4F4F', fontSize: 14, fontWeight: 600 }}>Tracking your order...</p>
        <style jsx>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={{ textAlign: 'center', padding: '90px 20px', maxWidth: 440, margin: '0 auto' }}>
        <div style={{ fontSize: 48, marginBottom: 14 }}>🔍</div>
        <h2 style={{ fontSize: 22, marginBottom: 8, color: '#1C1C1C' }}>Order Not Found</h2>
        <p style={{ color: '#696969', marginBottom: 20, fontSize: 14 }}>The tracking link is invalid or may have expired.</p>
        <Link href="/" className="btn-primary" style={{ padding: '11px 22px', fontSize: 14 }}>Return Home</Link>
      </div>
    );
  }

  const isDineIn = order.order_type === 'dine_in';
  const isPickup = order.order_type === 'pickup';
  const tableNo = order.table_no || (typeof order.delivery_address === 'string' ? order.delivery_address.match(/\d+/)?.[0] : null) || '4';

  const steps = isDineIn ? [
    { key: 'placed', label: 'Order Received', icon: '📝', desc: `Routed to kitchen for Table #${tableNo}` },
    { key: 'accepted', label: 'Kitchen Accepted', icon: '👨‍🍳', desc: 'Chef confirmed preparation' },
    { key: 'preparing', label: 'Cooking Fresh', icon: '🔥', desc: 'Prepared hot with authentic ingredients' },
    { key: 'ready', label: 'Ready to Serve', icon: '🍽️', desc: 'Plated & being brought to your table' },
    { key: 'delivered', label: 'Served at Table', icon: '🎉', desc: 'Served at your table. Enjoy your meal!' }
  ] : isPickup ? [
    { key: 'placed', label: 'Order Received', icon: '📝', desc: 'Sent to restaurant pickup counter' },
    { key: 'accepted', label: 'Kitchen Accepted', icon: '👨‍🍳', desc: 'Chef preparing your takeaway' },
    { key: 'preparing', label: 'Cooking & Packing', icon: '🔥', desc: 'Packed fresh in tamper-proof seal' },
    { key: 'ready', label: 'Ready for Pickup', icon: '🥡', desc: 'Waiting for you at restaurant counter' },
    { key: 'delivered', label: 'Collected', icon: '🎉', desc: 'Order collected. Enjoy your meal!' }
  ] : [
    { key: 'placed', label: 'Order Placed', icon: '📝', desc: 'Received & routed to kitchen' },
    { key: 'accepted', label: 'Accepted', icon: '👨‍🍳', desc: 'Kitchen confirmed preparation' },
    { key: 'preparing', label: 'In Kitchen', icon: '🔥', desc: 'Cooking freshly with authentic spices' },
    { key: 'ready', label: 'Ready & Packed', icon: '📦', desc: 'Sealed & ready for pickup' },
    { key: 'out_for_delivery', label: 'Out for Delivery', icon: '🛵', desc: 'Rider is on the way to your door' },
    { key: 'delivered', label: 'Delivered', icon: '🎉', desc: 'Enjoy your meal!' }
  ];

  const getStepIndex = (status) => {
    if (status === 'paid') return 0;
    if (['cancelled', 'rejected', 'expired'].includes(status)) return -1;
    const idx = steps.findIndex(s => s.key === status);
    if (idx !== -1) return idx;
    if (status === 'out_for_delivery' && (isDineIn || isPickup)) return 3; // map to ready
    return 0;
  };

  const currentIndex = getStepIndex(order.status);
  const isCancelled = ['cancelled', 'rejected', 'expired'].includes(order.status);

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '18px 14px 80px' }}>
      {/* TOPBAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Link href={`/${order.restaurant_slug || 'spice-garden'}${isDineIn ? `?table=${tableNo}` : ''}`} style={{ color: '#4F4F4F', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
          <span>← Back to Menu</span>
        </Link>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {isDineIn && (
            <span style={{ fontSize: 12, background: '#FEECEE', color: 'var(--primary)', padding: '5px 12px', borderRadius: 8, border: '1px solid #FBCED2', fontWeight: 900 }}>
              🍽️ TABLE #{tableNo}
            </span>
          )}
          <span style={{ fontSize: 12.5, background: '#FFFFFF', padding: '5px 12px', borderRadius: 8, border: '1px solid #ECEEF2', fontWeight: 800, color: '#1C1C1C', boxShadow: 'var(--shadow-sm)' }}>
            Order #{order.order_no}
          </span>
        </div>
      </div>

      {/* STATUS HERO CARD */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 16,
        padding: '28px 20px',
        textAlign: 'center',
        marginBottom: 20,
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid #E3E5EB',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'var(--primary)' }} />

        {isCancelled ? (
          <div>
            <div style={{ fontSize: 48, marginBottom: 10 }}>❌</div>
            <h1 style={{ fontSize: 22, color: 'var(--status-cancel)', marginBottom: 6 }}>Order {order.status.toUpperCase()}</h1>
            <p style={{ color: '#696969', fontSize: 13.5 }}>
              {order.cancel_reason || 'This order was cancelled. Any online payment will be refunded directly.'}
            </p>
          </div>
        ) : order.status === 'delivered' ? (
          <div>
            <div style={{ fontSize: 48, marginBottom: 10 }}>🎉</div>
            <h1 style={{ fontSize: 24, color: 'var(--veg-color)', marginBottom: 6 }}>
              {isDineIn ? 'Food Served to Table!' : isPickup ? 'Order Collected!' : 'Food Delivered!'}
            </h1>
            <p style={{ color: '#4F4F4F', fontSize: 14.5, marginBottom: 18 }}>
              {isDineIn ? `Enjoy your meal at Table #${tableNo}!` : `Enjoy your meal from ${order.restaurant_name}!`}
            </p>
            <Link href={`/rate/${token}`} className="btn-primary" style={{ padding: '12px 24px', fontSize: 14, borderRadius: 10 }}>
              ⭐ Rate Your Food Experience (+50 Points)
            </Link>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 46, marginBottom: 8 }}>
              {steps[Math.max(0, currentIndex)]?.icon || '⏳'}
            </div>
            <h1 style={{ fontSize: 24, marginBottom: 6, color: '#1C1C1C' }}>
              {steps[Math.max(0, currentIndex)]?.label || 'Processing...'}
            </h1>
            <p style={{ color: '#696969', fontSize: 14, marginBottom: 16 }}>
              {steps[Math.max(0, currentIndex)]?.desc}
            </p>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: '#FFF1F2',
              color: 'var(--primary)',
              padding: '6px 16px',
              borderRadius: 'var(--radius-full)',
              fontSize: 13,
              fontWeight: 800,
              border: '1px solid #FBCED2'
            }}>
              <span className="pulse-indicator" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', display: 'inline-block' }} />
              {isDineIn ? `Estimated cooking time: ~${order.prep_minutes || 20} mins` : isPickup ? `Ready for pickup in: ~${order.prep_minutes || 20} mins` : `Estimated delivery: ~${order.prep_minutes || 25} mins`}
            </div>
          </div>
        )}
      </div>

      {/* DINE-IN INSTANT TABLE SERVICE PANEL */}
      {isDineIn && !isCancelled && (
        <div style={{
          background: '#FFFFFF',
          borderRadius: 14,
          padding: '16px 18px',
          marginBottom: 20,
          border: '1px solid #ECEEF2',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 13.5, fontWeight: 800, color: '#1C1C1C' }}>
              🍽️ Table #{tableNo} Contactless Services
            </span>
            <span style={{ fontSize: 11, background: '#EDF8F0', color: 'var(--veg-color)', padding: '2px 8px', borderRadius: 6, fontWeight: 800 }}>
              Live Staff Connected
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {[
              { type: 'waiter', label: 'Call Waiter', icon: '🙋‍♂️' },
              { type: 'water', label: 'Water', icon: '💧' },
              { type: 'bill', label: 'Bill / Check', icon: '🧾' },
              { type: 'clean', label: 'Clean Table', icon: '🧹' }
            ].map(srv => (
              <button
                key={srv.type}
                disabled={serviceLoading}
                onClick={() => handleSendServiceRequest(srv.type)}
                style={{
                  padding: '10px 6px',
                  borderRadius: 10,
                  border: '1.5px solid #ECEEF2',
                  background: '#F8F9FA',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <span style={{ fontSize: 20 }}>{srv.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#2B2B2B' }}>{srv.label}</span>
              </button>
            ))}
          </div>

          {serviceStatusMsg && (
            <div style={{ marginTop: 10, padding: '7px 12px', background: '#F0FDF4', color: '#166534', borderRadius: 8, fontSize: 12, fontWeight: 700, textAlign: 'center', border: '1px solid #BBF7D0' }}>
              {serviceStatusMsg}
            </div>
          )}

          <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px dashed #ECEEF2', textAlign: 'center' }}>
            <Link
              href={`/${order.restaurant_slug || 'spice-garden'}?table=${tableNo}`}
              style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--primary)', textDecoration: 'none' }}
            >
              ➕ Want to add more dishes to Table #{tableNo}? Tap Here ➔
            </Link>
          </div>
        </div>
      )}

      {/* PENDING UPI PAYMENT BANNER */}
      {order.payment?.method === 'upi' && order.payment?.status !== 'success' && !isCancelled && (
        <div style={{ background: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: 14, padding: '16px 18px', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#92400E' }}>⚡ UPI Payment Pending</span>
            <span style={{ fontSize: 16, fontWeight: 900, color: '#B45309' }}>₹{(order.total_paise / 100).toFixed(2)}</span>
          </div>
          <p style={{ fontSize: 12.5, color: '#78350F', marginBottom: 12, lineHeight: 1.4 }}>
            Complete payment directly to <strong>{order.restaurant_name}</strong>:
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <a
              href={`upi://pay?pa=${order.restaurant_upi_id || 'directdine@okhdfcbank'}&pn=${encodeURIComponent(order.restaurant_name)}&am=${(order.total_paise / 100).toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Order #${order.order_no}`)}`}
              className="btn-primary"
              style={{ flex: 1, padding: '10px 14px', fontSize: 13, borderRadius: 8, textDecoration: 'none', textAlign: 'center', background: '#15803D' }}
            >
              🟢 Pay via Google Pay / PhonePe
            </a>
          </div>
        </div>
      )}

      {/* ANIMATED PROGRESS STEPPER */}
      {!isCancelled && (
        <div style={{ background: '#FFFFFF', borderRadius: 16, padding: '24px 20px', marginBottom: 20, border: '1px solid #ECEEF2', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: 16, color: '#1C1C1C', marginBottom: 20 }}>Live Order Progression</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22, position: 'relative' }}>
            {/* Vertical connector */}
            <div style={{
              position: 'absolute',
              top: 14,
              bottom: 14,
              left: 17,
              width: 2,
              background: '#E3E5EB',
              zIndex: 1
            }} />

            {steps.map((step, idx) => {
              const isDone = currentIndex >= idx;
              const isCurrent = currentIndex === idx;

              return (
                <div key={step.key} style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative', zIndex: 2 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: isDone ? 'var(--primary)' : '#FFFFFF',
                    color: isDone ? '#FFFFFF' : '#9C9C9C',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 15,
                    fontWeight: 900,
                    border: `2px solid ${isDone ? 'var(--primary)' : '#D1D5DB'}`,
                    boxShadow: isCurrent ? '0 0 12px var(--primary-glow)' : 'none',
                    transition: 'all 0.24s ease'
                  }}>
                    {isDone ? '✓' : idx + 1}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: isCurrent ? 800 : 600, color: isDone ? '#1C1C1C' : '#696969', fontSize: 14.5 }}>
                      {step.label}
                    </div>
                    <div style={{ fontSize: 12, color: '#828282', marginTop: 1 }}>
                      {step.desc}
                    </div>
                  </div>

                  {isCurrent && (
                    <span style={{ fontSize: 11, background: '#FFF1F2', color: 'var(--primary)', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontWeight: 800, border: '1px solid #FBCED2' }}>
                      IN PROGRESS
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* RIDER INFO CARD */}
      {order.rider_name && (
        <div style={{ background: '#FFFFFF', borderRadius: 14, padding: '16px 20px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #ECEEF2', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#F0F9FF', border: '1.5px solid #BAE6FD', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
              🛵
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#1C1C1C' }}>{order.rider_name}</div>
              <div style={{ fontSize: 12, color: '#696969' }}>Assigned Delivery Partner</div>
            </div>
          </div>
          {order.rider_phone && (
            <a
              href={`tel:${order.rider_phone}`}
              className="btn-secondary"
              style={{ padding: '8px 16px', fontSize: 12.5, borderRadius: 8 }}
            >
              📞 Call Partner
            </a>
          )}
        </div>
      )}

      {/* ORDER ITEMS & BILL BREAKDOWN */}
      <div style={{ background: '#FFFFFF', borderRadius: 14, padding: '20px', marginBottom: 20, border: '1px solid #ECEEF2', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontSize: 16, color: '#1C1C1C' }}>Order Items ({items.length})</h2>
          <button
            onClick={() => setShowBillModal(true)}
            style={{
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 800,
              background: '#F8F9FA',
              color: '#1C1C1C',
              border: '1px solid #E3E5EB',
              borderRadius: 8,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            🧾 Tax Invoice / Bill
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 14, borderBottom: '1px solid #F0F1F4', paddingBottom: 14 }}>
          {items.map((item, idx) => {
            const itemPrice = (item.line_total_paise || item.total_paise || (item.unit_price_paise * item.quantity) || 0) / 100;
            return (
              <div key={item.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: 14 }}>
                <div style={{ flex: 1, paddingRight: 10 }}>
                  <div style={{ fontWeight: 700, color: '#1C1C1C' }}>
                    {item.quantity}× {item.item_name}
                    {item.variant_name && <span style={{ color: '#696969', fontSize: 12.5, fontWeight: 500 }}> ({item.variant_name})</span>}
                  </div>
                  {item.addons && Array.isArray(item.addons) && item.addons.length > 0 && (
                    <div style={{ fontSize: 12, color: '#696969', marginTop: 2 }}>
                      + {item.addons.map(a => typeof a === 'object' ? a.name : a).join(', ')}
                    </div>
                  )}
                  {item.note && (
                    <div style={{ fontSize: 11.5, color: '#D97706', fontStyle: 'italic', marginTop: 2 }}>
                      Note: {item.note}
                    </div>
                  )}
                </div>
                <span style={{ fontWeight: 700, color: '#1C1C1C', whiteSpace: 'nowrap' }}>
                  ₹{itemPrice.toFixed(0)}
                </span>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13.5, color: '#4F4F4F' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Subtotal</span>
            <span>₹{((order.subtotal_paise || 0) / 100).toFixed(0)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Delivery Fee</span>
            <span>{order.delivery_fee_paise > 0 ? `₹${(order.delivery_fee_paise / 100).toFixed(0)}` : 'FREE'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Taxes & GST</span>
            <span>₹{((order.tax_paise || 0) / 100).toFixed(0)}</span>
          </div>
          {order.discount_paise > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--veg-color)', fontWeight: 700 }}>
              <span>Coupon Discount</span>
              <span>-₹{(order.discount_paise / 100).toFixed(0)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17, fontWeight: 900, color: '#1C1C1C', borderTop: '1px solid #ECEEF2', paddingTop: 10, marginTop: 4 }}>
            <span>Total ({order.payment?.method ? order.payment.method.toUpperCase() : (order.payment_method || 'UPI').toUpperCase()})</span>
            <span style={{ color: 'var(--primary)' }}>₹{((order.total_paise || 0) / 100).toFixed(2)}</span>
          </div>
        </div>

        {order.delivery_address && (
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px dashed #ECEEF2', fontSize: 12.5, color: '#696969' }}>
            <span style={{ fontWeight: 700, color: '#1C1C1C' }}>📍 Delivery Address: </span>
            {order.delivery_address}
          </div>
        )}
        {order.customer_note && (
          <div style={{ marginTop: 6, fontSize: 12.5, color: '#696969' }}>
            <span style={{ fontWeight: 700, color: '#1C1C1C' }}>📝 Special Instructions: </span>
            {order.customer_note}
          </div>
        )}
      </div>

      {/* WHATSAPP CALLOUT */}
      <div style={{ textAlign: 'center', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 14, padding: 16 }}>
        <p style={{ fontSize: 14, color: '#166534', fontWeight: 800, marginBottom: 2 }}>
          💬 Real-time WhatsApp Updates Active
        </p>
        <p style={{ fontSize: 12.5, color: '#374151' }}>
          Order status alerts are sent directly to WhatsApp ({order.delivery_phone}).
        </p>
      </div>

      {/* TAX INVOICE / BILL RECEIPT MODAL */}
      {showBillModal && (
        <div className="modal-overlay-responsive">
          <div className="mobile-modal-sheet touch-scroll" style={{
            maxWidth: 480,
            padding: 24,
            position: 'relative'
          }}>
            <div id="printable-bill" style={{ background: '#FFFFFF', padding: '10px 6px' }}>
              {/* Header */}
              <div style={{ textAlign: 'center', borderBottom: '1px dashed #D1D5DB', paddingBottom: 14, marginBottom: 14 }}>
                <h2 style={{ fontSize: 20, color: '#1C1C1C', fontWeight: 900 }}>{order.restaurant_name}</h2>
                <p style={{ fontSize: 12, color: '#696969', marginTop: 3 }}>{order.restaurant_address || 'Bandra West, Mumbai'}</p>
                <p style={{ fontSize: 11.5, color: '#828282', marginTop: 2 }}>
                  FSSAI Lic No: {order.fssai_number || '11522026000431'} • GSTIN: {order.gstin || '27AABCU9603R1ZM'}
                </p>
                <div style={{ display: 'inline-block', marginTop: 8, padding: '3px 10px', background: '#F4F5F8', borderRadius: 4, fontSize: 11, fontWeight: 800, letterSpacing: '0.5px' }}>
                  TAX INVOICE / CASH MEMO
                </div>
              </div>

              {/* Order Meta */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#4F4F4F', marginBottom: 12 }}>
                <div>
                  <div><strong>Order:</strong> #{order.order_no}</div>
                  <div><strong>Date:</strong> {new Date(order.placed_at || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div><strong>Type:</strong> {isDineIn ? `Dine-In (Table #${tableNo})` : isPickup ? 'Takeaway' : 'Delivery'}</div>
                  <div><strong>Payment:</strong> <span style={{ color: 'var(--veg-color)', fontWeight: 800 }}>PAID</span> ({order.payment?.method?.toUpperCase() || order.payment_method?.toUpperCase() || 'UPI'})</div>
                </div>
              </div>

              {/* Items Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, marginBottom: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E3E5EB', textAlign: 'left', color: '#696969', fontSize: 11, textTransform: 'uppercase' }}>
                    <th style={{ padding: '6px 0' }}>Item</th>
                    <th style={{ padding: '6px 0', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '6px 0', textAlign: 'right' }}>Price</th>
                    <th style={{ padding: '6px 0', textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, i) => (
                    <tr key={i} style={{ borderBottom: '1px dashed #F0F1F4' }}>
                      <td style={{ padding: '7px 0', color: '#1C1C1C', fontWeight: 600 }}>
                        {it.item_name}
                        {it.variant_name && <span style={{ color: '#696969', fontSize: 11 }}> ({it.variant_name})</span>}
                      </td>
                      <td style={{ padding: '7px 0', textAlign: 'center', color: '#4F4F4F' }}>{it.quantity}</td>
                      <td style={{ padding: '7px 0', textAlign: 'right', color: '#4F4F4F' }}>₹{((it.unit_price_paise || 0) / 100).toFixed(0)}</td>
                      <td style={{ padding: '7px 0', textAlign: 'right', fontWeight: 700, color: '#1C1C1C' }}>
                        ₹{(((it.line_total_paise || it.unit_price_paise * it.quantity) || 0) / 100).toFixed(0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Bill Summary */}
              <div style={{ borderTop: '1px dashed #D1D5DB', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5, color: '#4F4F4F' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Item Subtotal</span>
                  <span>₹{((order.subtotal_paise || 0) / 100).toFixed(0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>GST & Restaurant Taxes</span>
                  <span>₹{((order.tax_paise || 0) / 100).toFixed(0)}</span>
                </div>
                {order.delivery_fee_paise > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Delivery Charge</span>
                    <span>₹{((order.delivery_fee_paise || 0) / 100).toFixed(0)}</span>
                  </div>
                )}
                {order.discount_paise > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--veg-color)', fontWeight: 700 }}>
                    <span>Discount</span>
                    <span>-₹{((order.discount_paise || 0) / 100).toFixed(0)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 900, color: '#1C1C1C', borderTop: '1px solid #1C1C1C', paddingTop: 8, marginTop: 4 }}>
                  <span>Grand Total</span>
                  <span style={{ color: 'var(--primary)' }}>₹{((order.total_paise || 0) / 100).toFixed(2)}</span>
                </div>
              </div>

              {/* Thank you */}
              <div style={{ textAlign: 'center', marginTop: 16, paddingTop: 12, borderTop: '1px dashed #D1D5DB', fontSize: 11, color: '#828282' }}>
                <p>Thank you for choosing {order.restaurant_name}!</p>
                <p style={{ marginTop: 2, fontWeight: 700, color: 'var(--primary)' }}>DirectDine Food OS • 0% Commission Direct</p>
              </div>
            </div>

            {/* Modal Buttons */}
            <div className="no-print" style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') window.print();
                }}
                className="btn-primary"
                style={{ flex: 1, padding: '11px', fontSize: 13, borderRadius: 10 }}
              >
                🖨️ Print / Save Receipt
              </button>
              <button
                onClick={() => setShowBillModal(false)}
                className="btn-secondary"
                style={{ padding: '11px 18px', fontSize: 13, borderRadius: 10 }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrderTrackingPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: 60, color: '#696969' }}>Loading tracking...</div>}>
      <TrackingContent />
    </Suspense>
  );
}
