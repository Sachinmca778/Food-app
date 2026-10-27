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

  const loadOrder = async () => {
    try {
      const res = await fetchAPI(`/track/${token}`);
      if (res.success && res.order) {
        setOrder(res.order);
        setItems(res.items || []);
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

  const steps = [
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
    return steps.findIndex(s => s.key === status);
  };

  const currentIndex = getStepIndex(order.status);
  const isCancelled = ['cancelled', 'rejected', 'expired'].includes(order.status);

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '18px 14px 80px' }}>
      {/* TOPBAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Link href={`/${order.restaurant_slug || 'spice-garden'}`} style={{ color: '#4F4F4F', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
          <span>← Back to Menu</span>
        </Link>
        <span style={{ fontSize: 12.5, background: '#FFFFFF', padding: '5px 12px', borderRadius: 8, border: '1px solid #ECEEF2', fontWeight: 800, color: '#1C1C1C', boxShadow: 'var(--shadow-sm)' }}>
          Order #{order.order_no}
        </span>
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
            <h1 style={{ fontSize: 24, color: 'var(--veg-color)', marginBottom: 6 }}>Food Delivered!</h1>
            <p style={{ color: '#4F4F4F', fontSize: 14.5, marginBottom: 18 }}>
              Enjoy your meal from {order.restaurant_name}!
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
              Estimated delivery: ~{order.prep_minutes || 25} minutes
            </div>
          </div>
        )}
      </div>

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
        <h2 style={{ fontSize: 16, color: '#1C1C1C', marginBottom: 14 }}>Order Items ({items.length})</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14, borderBottom: '1px solid #F0F1F4', paddingBottom: 14 }}>
          {items.map(item => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <div>
                <span style={{ fontWeight: 700, color: '#1C1C1C' }}>{item.quantity}× {item.item_name}</span>
                {item.variant_name && <span style={{ color: '#696969', fontSize: 12 }}> ({item.variant_name})</span>}
              </div>
              <span style={{ fontWeight: 700, color: '#1C1C1C' }}>₹{(item.total_paise / 100).toFixed(0)}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13.5, color: '#4F4F4F' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Subtotal</span>
            <span>₹{(order.subtotal_paise / 100).toFixed(0)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Delivery Fee</span>
            <span>₹{(order.delivery_fee_paise / 100).toFixed(0)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Taxes & GST</span>
            <span>₹{(order.tax_paise / 100).toFixed(0)}</span>
          </div>
          {order.discount_paise > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--veg-color)', fontWeight: 700 }}>
              <span>Coupon Discount</span>
              <span>-₹{(order.discount_paise / 100).toFixed(0)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17, fontWeight: 900, color: '#1C1C1C', borderTop: '1px solid #ECEEF2', paddingTop: 10, marginTop: 4 }}>
            <span>Total Paid ({order.payment_method?.toUpperCase()})</span>
            <span style={{ color: 'var(--primary)' }}>₹{(order.total_paise / 100).toFixed(2)}</span>
          </div>
        </div>
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
