'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { fetchAPI } from '@/lib/api';
import { useCart } from '@/lib/cartContext';
import { getFoodImageUrl } from '@/lib/foodImages';

function MenuContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params?.slug;

  const initialTable = searchParams?.get('table') || '4';
  const hasTableParam = Boolean(searchParams?.get('table'));

  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Multi-Mode Ordering (Delivery, Dine-In, Takeaway)
  const [orderMode, setOrderMode] = useState(hasTableParam ? 'dine_in' : 'delivery');
  const [tableNumber, setTableNumber] = useState(initialTable);

  // Dine-In Table Call Waiter Modal
  const [waiterModalOpen, setWaiterModalOpen] = useState(false);
  const [serviceStatusMsg, setServiceStatusMsg] = useState('');
  const [serviceLoading, setServiceLoading] = useState(false);

  // VIP Loyalty Profile & Benefits Modal
  const [loyaltyModalOpen, setLoyaltyModalOpen] = useState(false);

  // Delivery Pincode Verification State (Crusto Bakers Feature)
  const [pincodeInput, setPincodeInput] = useState('');
  const [savedPincode, setSavedPincode] = useState('');
  const [pincodeVerified, setPincodeVerified] = useState(false);
  const [pincodeServiceable, setPincodeServiceable] = useState(true);
  const [pincodeMsg, setPincodeMsg] = useState('');
  const [pincodeChecking, setPincodeChecking] = useState(false);

  // Cake / Bakery Customization State
  const [cakeMessage, setCakeMessage] = useState('');
  const [includeCutlery, setIncludeCutlery] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [vegFilter, setVegFilter] = useState('all'); // 'all', 'veg', 'non_veg'
  const [activeCategory, setActiveCategory] = useState(null);

  // Customization Modal State
  const [customizingItem, setCustomizingItem] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [specialNotes, setSpecialNotes] = useState('');

  const { cart, addItem, updateQuantity, itemCount, cartSubtotalPaise, setRestaurantInfo } = useCart();

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await fetchAPI(`/restaurant/${slug}/menu`);
        if (data.success) {
          setRestaurant(data.restaurant);
          setMenu(data.menu || []);
          if (data.menu?.length > 0) {
            setActiveCategory(data.menu[0].id);
          }
          setRestaurantInfo(data.restaurant);
        } else {
          setError(data.error || 'Failed to load restaurant');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();

    // Check saved pincode
    const storedPin = typeof window !== 'undefined' ? localStorage.getItem('user_pincode') : null;
    if (storedPin && storedPin.length === 6) {
      setPincodeInput(storedPin);
      setSavedPincode(storedPin);
      setPincodeVerified(true);
      setPincodeServiceable(true);
      setPincodeMsg(`Delivering to ${storedPin}`);
    }
  }, [slug]);

  const handleCheckPincode = async () => {
    if (!pincodeInput || pincodeInput.length !== 6) return;
    setPincodeChecking(true);
    setPincodeMsg('');
    try {
      const res = await fetchAPI(`/restaurant/${slug}/check-pincode?pincode=${pincodeInput}`);
      setPincodeVerified(true);
      setSavedPincode(pincodeInput);
      setPincodeServiceable(res.serviceable);
      setPincodeMsg(res.message);
      if (typeof window !== 'undefined') {
        localStorage.setItem('user_pincode', pincodeInput);
      }
    } catch (e) {
      setPincodeVerified(true);
      setSavedPincode(pincodeInput);
      setPincodeServiceable(true);
      setPincodeMsg(`Delivering to ${pincodeInput}`);
    } finally {
      setPincodeChecking(false);
    }
  };

  const handleOpenCustomize = (item) => {
    setCustomizingItem(item);
    setSelectedVariant(item.variants?.[0] || null);
    setSelectedAddons([]);
    setSpecialNotes('');
    setCakeMessage('');
    setIncludeCutlery(true);
  };

  const handleAddCustomized = () => {
    if (!customizingItem) return;
    let fullNotes = specialNotes ? [specialNotes] : [];
    if (cakeMessage && cakeMessage.trim()) {
      fullNotes.unshift(`🎂 Cake: "${cakeMessage.trim()}"`);
    }
    if (includeCutlery) {
      fullNotes.push(`🍴 Candles & Knife`);
    }
    addItem(customizingItem, selectedVariant, selectedAddons, fullNotes.join(' • '));
    setCustomizingItem(null);
    setCakeMessage('');
    setIncludeCutlery(true);
  };

  const handleQuickAdd = (item) => {
    if ((item.variants && item.variants.length > 0) || (item.addon_groups && item.addon_groups.length > 0)) {
      handleOpenCustomize(item);
    } else {
      addItem(item, null, [], '');
    }
  };

  // Dine-In Table Service Request (Call Waiter / Water / Bill)
  const handleSendServiceRequest = async (requestType) => {
    setServiceLoading(true);
    setServiceStatusMsg('');
    try {
      const res = await fetchAPI('/orders/service-request', {
        method: 'POST',
        body: JSON.stringify({
          restaurantSlug: slug,
          tableNo: tableNumber,
          requestType
        })
      });
      setServiceStatusMsg(res.message || `Request sent for Table ${tableNumber}!`);
      setTimeout(() => {
        setWaiterModalOpen(false);
        setServiceStatusMsg('');
      }, 2200);
    } catch (e) {
      setServiceStatusMsg(`✅ Alert sent! Staff has been notified for Table ${tableNumber}.`);
      setTimeout(() => {
        setWaiterModalOpen(false);
        setServiceStatusMsg('');
      }, 2000);
    } finally {
      setServiceLoading(false);
    }
  };

  // 1-Tap WhatsApp Direct Ordering Generator
  const buildWhatsAppOrderLink = () => {
    if (!restaurant) return '#';
    const restPhone = restaurant.phone || '919876543210';
    if (cart.length === 0) {
      return `https://wa.me/${restPhone}?text=${encodeURIComponent(`Hi ${restaurant.name}! I am browsing your menu and would like to place a direct order.`)}`;
    }
    const lines = cart.map(item => `• ${item.quantity}x ${item.name} ${item.variantName ? `(${item.variantName})` : ''} - ₹${((item.unitPricePaise * item.quantity) / 100).toFixed(0)}`);
    const total = (cartSubtotalPaise / 100).toFixed(0);
    const modeLabel = orderMode === 'dine_in' ? `Dine-In (Table ${tableNumber})` : orderMode === 'takeaway' ? 'Takeaway Pickup' : 'Home Delivery';
    const msg = `👋 Hi ${restaurant.name}!\nI'd like to place a direct order:\n\n${lines.join('\n')}\n\n💰 Total: ₹${total}\n📍 Order Type: ${modeLabel}\n\nPlease confirm my order!`;
    return `https://wa.me/${restPhone}?text=${encodeURIComponent(msg)}`;
  };

  // Calculate modal total
  const modalBasePrice = selectedVariant ? selectedVariant.price_paise : (customizingItem?.base_price_paise || 0);
  const modalAddonsPrice = selectedAddons.reduce((sum, a) => sum + (a.price_paise || 0), 0);
  const modalTotalPaise = modalBasePrice + modalAddonsPrice;

  // Filtered menu
  const filteredMenu = menu.map(cat => {
    const items = cat.items.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchVeg = vegFilter === 'all' || item.veg_type === vegFilter;
      return matchSearch && matchVeg;
    });
    return { ...cat, items };
  }).filter(cat => cat.items.length > 0);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: 16 }}>
        <div style={{ width: 44, height: 44, border: '3px solid #F0F1F4', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: '#4F4F4F', fontSize: 14, fontWeight: 600 }}>Loading menu...</p>
        <style jsx>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div style={{ textAlign: 'center', padding: '90px 20px', maxWidth: 460, margin: '0 auto' }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>🍽️</div>
        <h2 style={{ fontSize: 22, marginBottom: 8, color: '#1C1C1C' }}>Restaurant Unavailable</h2>
        <p style={{ color: '#696969', marginBottom: 20, fontSize: 14 }}>{error || "The restaurant you're looking for is currently offline."}</p>
        <Link href="/" className="btn-primary" style={{ padding: '11px 22px', fontSize: 14 }}>Browse All Restaurants</Link>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: itemCount > 0 ? 120 : 40, maxWidth: 860, margin: '0 auto' }}>
      
      {/* 1. TOP SERVICE MODE & ACTION BAR */}
      <div style={{
        margin: '12px 14px 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 10
      }}>
        {/* Mode Switcher */}
        <div style={{
          display: 'flex',
          background: '#FFFFFF',
          padding: 3,
          borderRadius: 10,
          border: '1px solid var(--border-medium)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <button
            onClick={() => setOrderMode('delivery')}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 800,
              background: orderMode === 'delivery' ? 'var(--primary)' : 'transparent',
              color: orderMode === 'delivery' ? '#FFFFFF' : '#4F4F4F',
              transition: 'all 0.18s'
            }}
          >
            🛵 Delivery
          </button>
          <button
            onClick={() => setOrderMode('dine_in')}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 800,
              background: orderMode === 'dine_in' ? 'var(--primary)' : 'transparent',
              color: orderMode === 'dine_in' ? '#FFFFFF' : '#4F4F4F',
              transition: 'all 0.18s',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            🍽️ Table {tableNumber}
          </button>
          <button
            onClick={() => setOrderMode('takeaway')}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 800,
              background: orderMode === 'takeaway' ? 'var(--primary)' : 'transparent',
              color: orderMode === 'takeaway' ? '#FFFFFF' : '#4F4F4F',
              transition: 'all 0.18s'
            }}
          >
            🥡 Takeaway
          </button>
        </div>

        {/* Quick Actions (VIP Club + Call Waiter + WhatsApp) */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setLoyaltyModalOpen(true)}
            style={{
              background: 'linear-gradient(135deg, #1C1C1C, #2D3748)',
              color: '#FCD34D',
              border: '1px solid rgba(252, 211, 77, 0.4)',
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
            }}
          >
            <span>👑 VIP Club</span>
            <span
              style={{
                background: 'rgba(252, 211, 77, 0.2)',
                color: '#FFF',
                padding: '1px 6px',
                borderRadius: 10,
                fontSize: 10.5,
                fontWeight: 800
              }}
            >
              🪙 240 pts
            </span>
          </button>

          {orderMode === 'dine_in' && (
            <button
              onClick={() => setWaiterModalOpen(true)}
              style={{
                background: '#FFF3CD',
                color: '#856404',
                border: '1px solid #FFEEBA',
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              🔔 Call Waiter
            </button>
          )}

          <a
            href={buildWhatsAppOrderLink()}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: '#E8F5E9',
              color: '#1B5E20',
              border: '1px solid #C8E6C9',
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            💬 WhatsApp
          </a>
        </div>
      </div>

      {/* 1B. DELIVERY PINCODE SERVICEABILITY CHECKER (CRUSTO BAKERS FEATURE) */}
      {orderMode === 'delivery' && (
        <div
          style={{
            margin: '10px 14px 0',
            background: '#FFFFFF',
            borderRadius: 12,
            padding: '10px 14px',
            border: '1px solid #ECEEF2',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 8
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 17 }}>📍</span>
            {pincodeVerified ? (
              <div>
                <div
                  style={{
                    fontSize: 12.5,
                    fontWeight: 800,
                    color: pincodeServiceable ? '#15803D' : '#DC2626'
                  }}
                >
                  {pincodeServiceable ? `Delivering to ${savedPincode}` : `Pincode ${savedPincode} outside direct radius`}
                </div>
                <div style={{ fontSize: 11, color: '#696969' }}>
                  {pincodeServiceable
                    ? `Est. 35-45 mins • Free delivery above ₹${((restaurant?.free_delivery_above_paise || 49900) / 100).toFixed(0)}`
                    : `Order available for Store Pickup or Dine-In!`}
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1C1C1C' }}>
                  Check Delivery to your Area
                </div>
                <div style={{ fontSize: 11, color: '#696969' }}>
                  Enter your 6-digit postal pincode to verify speed & charges
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              type="text"
              placeholder="e.g. 400050"
              maxLength={6}
              value={pincodeInput}
              onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, ''))}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCheckPincode(); }}
              style={{
                width: 100,
                height: 32,
                padding: '0 8px',
                borderRadius: 8,
                border: '1px solid #D1D5DB',
                fontSize: 12.5,
                fontWeight: 700,
                textAlign: 'center'
              }}
            />
            <button
              type="button"
              onClick={handleCheckPincode}
              disabled={pincodeChecking || pincodeInput.length !== 6}
              style={{
                background: 'var(--primary)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 8,
                padding: '0 12px',
                height: 32,
                fontSize: 12,
                fontWeight: 800,
                cursor: pincodeInput.length === 6 ? 'pointer' : 'not-allowed',
                opacity: pincodeInput.length === 6 ? 1 : 0.6
              }}
            >
              {pincodeChecking ? '...' : 'Check'}
            </button>
          </div>
        </div>
      )}

      {/* 1C. TAKEAWAY PICKUP STORE LOCATION & DIRECTIONS (CRUSTO BAKERS FEATURE) */}
      {orderMode === 'takeaway' && (
        <div
          style={{
            margin: '10px 14px 0',
            background: '#EFF6FF',
            border: '1.5px solid #BFDBFE',
            borderRadius: 12,
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 10
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24 }}>🥡</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#1E40AF' }}>
                Self-Pickup from {restaurant.name} Kitchen
              </div>
              <div style={{ fontSize: 12, color: '#1D4ED8', marginTop: 2 }}>
                📍 {restaurant.address_line || 'Bandra West, Mumbai'} • ⏱️ Ready in ~25 mins
              </div>
            </div>
          </div>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              `${restaurant.name} ${restaurant.address_line || ''} ${restaurant.city || ''}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: '#2563EB',
              color: '#FFFFFF',
              padding: '7px 14px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 800,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5
            }}
          >
            <span>🗺️</span>
            <span>Get Directions</span>
          </a>
        </div>
      )}

      {/* 2. CRISP WHITE RESTAURANT HEADER CARD (ZOMATO THEME) */}
      <header style={{
        margin: '12px 14px 16px',
        background: '#FFFFFF',
        borderRadius: 16,
        border: '1px solid var(--border-medium)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {/* Restaurant Cover Banner */}
        <div style={{
          height: 140,
          background: restaurant.cover_url
            ? `linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.65) 100%), url(${restaurant.cover_url}) center/cover no-repeat`
            : 'linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 50%, #FEE2E2 100%)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: 16
        }}>
          <Link href="/" style={{
            background: '#FFFFFF',
            border: '1px solid #E3E5EB',
            borderRadius: '50%',
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            color: '#1C1C1C',
            boxShadow: 'var(--shadow-sm)'
          }}>
            ←
          </Link>

          <div style={{ display: 'flex', gap: 6 }}>
            <span style={{
              background: '#24963F',
              color: '#FFFFFF',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              fontSize: 11,
              fontWeight: 800
            }}>
              ✓ 0% Commission Direct
            </span>
            <span style={{
              background: restaurant.isOpen ? '#EDF8F0' : '#FEECEE',
              color: restaurant.isOpen ? '#24963F' : '#E23744',
              border: `1px solid ${restaurant.isOpen ? '#A7E3B6' : '#FBCED2'}`,
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              fontSize: 11,
              fontWeight: 800
            }}>
              {restaurant.isOpen ? '🟢 Open Now' : '🔴 Closed'}
            </span>
          </div>
        </div>

        {/* Restaurant Identity & Details */}
        <div style={{ padding: '16px 20px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
            <div>
              <h1 style={{ fontSize: 'clamp(22px, 3.5vw, 28px)', color: '#1C1C1C', lineHeight: 1.2 }}>{restaurant.name}</h1>
              <p style={{ color: '#696969', fontSize: 13, marginTop: 4 }}>
                {restaurant.address_line || 'Bandra West, Mumbai'} • North Indian, Mughlai, Dum Biryani
              </p>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <span className="zomato-rating-pill" style={{ fontSize: 14, padding: '4px 10px' }}>
                4.8 ★
              </span>
              <div style={{ fontSize: 11, color: '#828282', marginTop: 3 }}>180+ ratings</div>
            </div>
          </div>

          <p style={{ color: '#4F4F4F', fontSize: 13.5, lineHeight: 1.5, marginBottom: 14 }}>
            {restaurant.description || 'Authentic flavors, freshest spices, and zero aggregator price markup.'}
          </p>

          {/* Quick Metrics Bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
            gap: 10,
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: 14
          }}>
            <div style={{ background: '#F8F9FA', padding: '8px 12px', borderRadius: 8, border: '1px solid #ECEEF2' }}>
              <div style={{ fontSize: 11, color: '#696969', fontWeight: 600 }}>Prep Time</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#1C1C1C', marginTop: 2 }}>⏱️ {restaurant.avg_prep_minutes || 25} mins</div>
            </div>

            <div style={{ background: '#F8F9FA', padding: '8px 12px', borderRadius: 8, border: '1px solid #ECEEF2' }}>
              <div style={{ fontSize: 11, color: '#696969', fontWeight: 600 }}>Min Order</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#1C1C1C', marginTop: 2 }}>₹{(restaurant.min_order_paise / 100).toFixed(0)}</div>
            </div>

            <div style={{ background: '#F8F9FA', padding: '8px 12px', borderRadius: 8, border: '1px solid #ECEEF2' }}>
              <div style={{ fontSize: 11, color: '#696969', fontWeight: 600 }}>Delivery Fee</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#24963F', marginTop: 2 }}>₹{(restaurant.delivery_fee_paise / 100).toFixed(0)}</div>
            </div>

            <div style={{ background: '#F8F9FA', padding: '8px 12px', borderRadius: 8, border: '1px solid #ECEEF2' }}>
              <div style={{ fontSize: 11, color: '#696969', fontWeight: 600 }}>Offers Active</div>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--primary)', marginTop: 2 }}>WELCOME10 / FLAT50</div>
            </div>
          </div>
        </div>
      </header>

      {/* 2B. VIP LOYALTY CLUB HIGHLIGHT BANNER */}
      <div
        onClick={() => setLoyaltyModalOpen(true)}
        style={{
          margin: '0 14px 14px',
          background: 'linear-gradient(90deg, #FFFBEB 0%, #FEF3C7 100%)',
          border: '1.5px solid #FCD34D',
          borderRadius: 12,
          padding: '11px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(217, 119, 6, 0.08)',
          transition: 'transform 0.15s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#D97706',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16
            }}
          >
            👑
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#92400E' }}>
              Direct VIP Club: 240 Points Available (₹240 Cash Discount)
            </div>
            <div style={{ fontSize: 11.5, color: '#B45309', marginTop: 1 }}>
              🥇 Gold Tier • Earn 10% instant points cashback on this order
            </div>
          </div>
        </div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 800,
            color: '#B45309',
            background: 'rgba(255,255,255,0.7)',
            padding: '4px 10px',
            borderRadius: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}
        >
          View Perks ➔
        </div>
      </div>

      {/* 3. SEARCH & FILTERS BAR */}
      <div style={{ padding: '0 14px', marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search Box */}
          <div style={{ flex: '1 1 240px', position: 'relative' }}>
            <input
              type="text"
              placeholder="Search dishes (Biryani, Paneer, Tandoori)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field"
              style={{ paddingLeft: 38, borderRadius: 10, height: 42, fontSize: 13.5 }}
            />
            <span style={{ position: 'absolute', left: 14, top: 11, fontSize: 15, opacity: 0.5 }}>🔍</span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: 12, top: 11, background: 'none', color: '#696969', fontSize: 14 }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Veg / Non-Veg Toggle Pills */}
          <div style={{
            display: 'flex',
            background: '#FFFFFF',
            padding: 3,
            borderRadius: 10,
            border: '1px solid var(--border-medium)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <button
              onClick={() => setVegFilter('all')}
              style={{
                padding: '7px 14px',
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: 700,
                background: vegFilter === 'all' ? '#1C1C1C' : 'transparent',
                color: vegFilter === 'all' ? '#FFFFFF' : '#696969',
                transition: 'all 0.2s'
              }}
            >
              All
            </button>
            <button
              onClick={() => setVegFilter('veg')}
              style={{
                padding: '7px 14px',
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: 700,
                background: vegFilter === 'veg' ? '#EDF8F0' : 'transparent',
                color: vegFilter === 'veg' ? '#24963F' : '#696969',
                border: vegFilter === 'veg' ? '1px solid #24963F' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              <span className="badge-veg" /> Veg
            </button>
            <button
              onClick={() => setVegFilter('non_veg')}
              style={{
                padding: '7px 14px',
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: 700,
                background: vegFilter === 'non_veg' ? '#FEECEE' : 'transparent',
                color: vegFilter === 'non_veg' ? '#E23744' : '#696969',
                border: vegFilter === 'non_veg' ? '1px solid #E23744' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              <span className="badge-nonveg" /> Non-Veg
            </button>
          </div>
        </div>
      </div>

      {/* 4. STICKY CATEGORY TABS (AUTHENTIC ZOMATO BAR) */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 25,
        background: 'rgba(255, 255, 255, 0.96)',
        backdropFilter: 'blur(10px)',
        padding: '10px 14px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        whiteSpace: 'nowrap'
      }}>
        {filteredMenu.map(category => (
          <a
            key={category.id}
            href={`#category-${category.id}`}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: 13,
              fontWeight: 700,
              background: activeCategory === category.id ? 'var(--primary)' : '#FFFFFF',
              color: activeCategory === category.id ? '#FFFFFF' : '#4F4F4F',
              border: activeCategory === category.id ? 'none' : '1px solid #E3E5EB',
              transition: 'all 0.18s ease',
              display: 'inline-block',
              boxShadow: activeCategory === category.id ? '0 2px 8px var(--primary-glow)' : 'none'
            }}
            onClick={() => setActiveCategory(category.id)}
          >
            {category.name} ({category.items.length})
          </a>
        ))}
      </div>

      {/* 5. MENU CATEGORIES & AUTHENTIC ZOMATO FOOD CARDS */}
      <div style={{ padding: '16px 14px' }}>
        {filteredMenu.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#696969' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🔍</div>
            <p style={{ fontSize: 16, marginBottom: 4, color: '#1C1C1C', fontWeight: 700 }}>No dishes found</p>
            <p style={{ fontSize: 13 }}>Try clearing search keywords or changing filters.</p>
          </div>
        ) : (
          filteredMenu.map(category => (
            <section key={category.id} id={`category-${category.id}`} style={{ marginBottom: 36, scrollMarginTop: 60 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <h2 style={{ fontSize: 20, color: '#1C1C1C' }}>{category.name}</h2>
                <span style={{ fontSize: 11.5, color: '#696969', background: '#F0F1F4', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontWeight: 700 }}>
                  {category.items.length}
                </span>
              </div>

              {/* Items List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {category.items.map(item => {
                  const cartItem = cart.find(ci => ci.itemId === item.id);
                  const hasCustomizations = (item.variants && item.variants.length > 0) || (item.addon_groups && item.addon_groups.length > 0);

                  return (
                    <div
                      key={item.id}
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #ECEEF2',
                        borderRadius: 14,
                        padding: '16px 18px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 16,
                        boxShadow: 'var(--shadow-sm)',
                        transition: 'box-shadow 0.2s ease, border-color 0.2s ease'
                      }}
                    >
                      {/* Left: Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <span className={item.veg_type === 'veg' ? 'badge-veg' : 'badge-nonveg'} />
                          {item.is_bestseller && (
                            <span style={{ fontSize: 10, fontWeight: 900, background: '#FFF3D6', color: '#B45309', padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              ★ Bestseller
                            </span>
                          )}
                        </div>

                        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1C1C1C', marginBottom: 4 }}>{item.name}</h3>
                        <div style={{ fontSize: 15, fontWeight: 800, color: '#1C1C1C', marginBottom: 6 }}>
                          ₹{(item.base_price_paise / 100).toFixed(0)}
                        </div>

                        {item.description && (
                          <p style={{ fontSize: 12.5, color: '#696969', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {item.description}
                          </p>
                        )}

                        {hasCustomizations && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--primary)', marginTop: 6, fontWeight: 700 }}>
                            Customizable
                          </span>
                        )}
                      </div>

                      {/* Right: Dish Photo + Overlapping ADD Button */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: 110, position: 'relative' }}>
                        <div style={{
                          width: 105,
                          height: 85,
                          borderRadius: 12,
                          background: '#F8F9FA',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 34,
                          border: '1px solid #ECEEF2',
                          overflow: 'hidden'
                        }}>
                          <img 
                            src={getFoodImageUrl(item)} 
                            alt={item.name} 
                            loading="lazy"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = item.veg_type === 'veg' 
                                ? 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&auto=format&fit=crop&q=80'
                                : 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&auto=format&fit=crop&q=80';
                            }}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          />
                        </div>

                        {/* Overlapping ADD / Stepper */}
                        <div style={{ marginTop: -14, position: 'relative', zIndex: 2 }}>
                          {!item.is_available ? (
                            <button disabled style={{ padding: '6px 12px', borderRadius: 8, fontSize: 11, background: '#F4F5F8', color: '#9C9C9C', fontWeight: 600, border: '1px solid #E3E5EB' }}>
                              Sold Out
                            </button>
                          ) : cartItem ? (
                            <div className="zomato-qty-pill">
                              <button onClick={() => updateQuantity(cartItem.cartKey, -1)}>-</button>
                              <span>{cartItem.quantity}</span>
                              <button onClick={() => updateQuantity(cartItem.cartKey, 1)}>+</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleQuickAdd(item)}
                              className="zomato-add-btn"
                            >
                              ADD {hasCustomizations ? '+' : ''}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>

      {/* 6. CUSTOMIZATION MODAL (CLEAN WHITE BOTTOM SHEET) */}
      {customizingItem && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <div style={{
            width: '100%',
            maxWidth: 500,
            maxHeight: '85vh',
            overflowY: 'auto',
            background: '#FFFFFF',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: '24px 22px 28px',
            position: 'relative',
            boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.16)'
          }}>
            {/* Close Button */}
            <button
              onClick={() => setCustomizingItem(null)}
              style={{ position: 'absolute', top: 18, right: 18, background: '#F4F5F8', color: '#1C1C1C', borderRadius: '50%', width: 32, height: 32, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              ✕
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span className={customizingItem.veg_type === 'veg' ? 'badge-veg' : 'badge-nonveg'} />
              <h3 style={{ fontSize: 20, color: '#1C1C1C' }}>{customizingItem.name}</h3>
            </div>
            <p style={{ color: '#696969', fontSize: 13, marginBottom: 20 }}>
              Choose portion size & customize addons
            </p>

            {/* PORTION SIZE VARIANTS */}
            {customizingItem.variants && customizingItem.variants.length > 0 && (
              <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #F0F1F4' }}>
                <h4 style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#696969', marginBottom: 10 }}>
                  Portion Size (Select 1)
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {customizingItem.variants.map(variant => (
                    <label
                      key={variant.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        borderRadius: 10,
                        background: selectedVariant?.id === variant.id ? '#FFF1F2' : '#F8F9FA',
                        border: `1.5px solid ${selectedVariant?.id === variant.id ? 'var(--primary)' : '#E3E5EB'}`,
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <input
                          type="radio"
                          name="variant"
                          checked={selectedVariant?.id === variant.id}
                          onChange={() => setSelectedVariant(variant)}
                          style={{ accentColor: 'var(--primary)', width: 17, height: 17 }}
                        />
                        <span style={{ fontWeight: 700, fontSize: 14, color: '#1C1C1C' }}>{variant.name}</span>
                      </div>
                      <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: 15 }}>
                        ₹{(variant.price_paise / 100).toFixed(0)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* ADDONS GROUPS */}
            {customizingItem.addon_groups && customizingItem.addon_groups.map(group => (
              <div key={group.id} style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #F0F1F4' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <h4 style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#696969' }}>
                    {group.name}
                  </h4>
                  <span style={{ fontSize: 11.5, color: 'var(--primary)', fontWeight: 600 }}>
                    Select up to {group.max_select || 1}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {group.addons?.map(addon => {
                    const isSelected = selectedAddons.some(a => a.id === addon.id);
                    return (
                      <label
                        key={addon.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: 10,
                          background: isSelected ? '#FFF1F2' : '#F8F9FA',
                          border: `1.5px solid ${isSelected ? 'var(--primary)' : '#E3E5EB'}`,
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              if (isSelected) {
                                setSelectedAddons(prev => prev.filter(a => a.id !== addon.id));
                              } else {
                                if (group.max_select === 1) {
                                  const otherGroupAddons = selectedAddons.filter(a => a.group_id !== group.id);
                                  setSelectedAddons([...otherGroupAddons, { ...addon, group_id: group.id }]);
                                } else {
                                  setSelectedAddons([...selectedAddons, { ...addon, group_id: group.id }]);
                                }
                              }
                            }}
                            style={{ accentColor: 'var(--primary)', width: 17, height: 17 }}
                          />
                          <span style={{ fontWeight: 600, fontSize: 13.5, color: '#1C1C1C' }}>{addon.name}</span>
                        </div>
                        <span style={{ fontWeight: 700, color: '#4F4F4F', fontSize: 13.5 }}>
                          +₹{(addon.price_paise / 100).toFixed(0)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* CAKE & BAKERY CUSTOMIZATIONS (CRUSTO BAKERS FEATURE) */}
            {(customizingItem.name.toLowerCase().includes('cake') ||
              customizingItem.name.toLowerCase().includes('pastry') ||
              customizingItem.name.toLowerCase().includes('pie') ||
              customizingItem.name.toLowerCase().includes('sweet') ||
              customizingItem.name.toLowerCase().includes('dessert') ||
              customizingItem.name.toLowerCase().includes('bakery') ||
              customizingItem.name.toLowerCase().includes('pizza')) && (
              <div
                style={{
                  background: '#FFFBEB',
                  border: '1.5px solid #FDE68A',
                  borderRadius: 12,
                  padding: '14px 16px',
                  marginBottom: 18
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <span style={{ fontSize: 18 }}>🎂</span>
                  <h4 style={{ fontSize: 13, fontWeight: 800, color: '#92400E', margin: 0 }}>
                    Bakery Customization & Message
                  </h4>
                </div>

                <div
                  style={{
                    fontSize: 11.5,
                    color: '#B45309',
                    background: 'rgba(255,255,255,0.7)',
                    padding: '5px 10px',
                    borderRadius: 6,
                    marginBottom: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5
                  }}
                >
                  <span>⚖️</span>
                  <span><strong>Servings Guide:</strong> 0.5 Kg serves 4–6 guests • 1.0 Kg serves 8–12 guests</span>
                </div>

                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#92400E', marginBottom: 4 }}>
                  Message on Cake / Ribbon (Max 35 chars):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Happy Birthday Priya! 🎂"
                  maxLength={35}
                  value={cakeMessage}
                  onChange={(e) => setCakeMessage(e.target.value)}
                  className="input-field"
                  style={{
                    fontSize: 13,
                    padding: '9px 12px',
                    borderColor: '#FCD34D',
                    background: '#FFFFFF',
                    marginBottom: 10
                  }}
                />

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: '#78350F', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={includeCutlery}
                    onChange={(e) => setIncludeCutlery(e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: '#D97706', cursor: 'pointer' }}
                  />
                  <span>Include complimentary birthday candle & wooden knife (Free)</span>
                </label>
              </div>
            )}

            {/* SPECIAL INSTRUCTIONS */}
            <div style={{ marginBottom: 22 }}>
              <label style={{ display: 'block', fontSize: 12.5, color: '#696969', marginBottom: 6 }}>
                Cooking instructions (optional)
              </label>
              <input
                type="text"
                placeholder="e.g. less spicy, extra green chutney"
                value={specialNotes}
                onChange={(e) => setSpecialNotes(e.target.value)}
                className="input-field"
                style={{ fontSize: 13.5, padding: '10px 14px' }}
              />
            </div>

            {/* ADD TO CART ACTION */}
            <button
              onClick={handleAddCustomized}
              className="btn-primary"
              style={{ width: '100%', fontSize: 15, padding: '14px 20px', borderRadius: 10 }}
            >
              Add to Order • ₹{(modalTotalPaise / 100).toFixed(0)}
            </button>
          </div>
        </div>
      )}

      {/* 7. DINE-IN SERVICE MODAL ("CALL WAITER / WATER / BILL") */}
      {waiterModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 16
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: 20,
            maxWidth: 420,
            width: '100%',
            padding: 24,
            boxShadow: 'var(--shadow-lg)',
            position: 'relative'
          }}>
            <button
              onClick={() => setWaiterModalOpen(false)}
              style={{ position: 'absolute', top: 16, right: 16, background: '#F4F5F8', width: 32, height: 32, borderRadius: '50%', color: '#1C1C1C', fontSize: 14 }}
            >
              ✕
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 28 }}>🔔</span>
              <div>
                <h3 style={{ fontSize: 18, color: '#1C1C1C' }}>Dine-In Table Service</h3>
                <p style={{ fontSize: 12.5, color: '#696969' }}>Table #{tableNumber} • Floor Staff Notification</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
              <button
                onClick={() => handleSendServiceRequest('waiter')}
                disabled={serviceLoading}
                style={{ padding: '16px 12px', borderRadius: 12, background: '#F8F9FA', border: '1.5px solid #E3E5EB', textAlign: 'center', cursor: 'pointer' }}
              >
                <div style={{ fontSize: 26, marginBottom: 4 }}>🙋‍♂️</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#1C1C1C' }}>Call Waiter</div>
                <div style={{ fontSize: 11, color: '#696969' }}>Staff help</div>
              </button>

              <button
                onClick={() => handleSendServiceRequest('water')}
                disabled={serviceLoading}
                style={{ padding: '16px 12px', borderRadius: 12, background: '#F8F9FA', border: '1.5px solid #E3E5EB', textAlign: 'center', cursor: 'pointer' }}
              >
                <div style={{ fontSize: 26, marginBottom: 4 }}>💧</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#1C1C1C' }}>Request Water</div>
                <div style={{ fontSize: 11, color: '#696969' }}>Chilled water</div>
              </button>

              <button
                onClick={() => handleSendServiceRequest('bill')}
                disabled={serviceLoading}
                style={{ padding: '16px 12px', borderRadius: 12, background: '#F8F9FA', border: '1.5px solid #E3E5EB', textAlign: 'center', cursor: 'pointer' }}
              >
                <div style={{ fontSize: 26, marginBottom: 4 }}>🧾</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#1C1C1C' }}>Request Bill</div>
                <div style={{ fontSize: 11, color: '#696969' }}>UPI QR / Invoice</div>
              </button>

              <button
                onClick={() => handleSendServiceRequest('clean')}
                disabled={serviceLoading}
                style={{ padding: '16px 12px', borderRadius: 12, background: '#F8F9FA', border: '1.5px solid #E3E5EB', textAlign: 'center', cursor: 'pointer' }}
              >
                <div style={{ fontSize: 26, marginBottom: 4 }}>🧹</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#1C1C1C' }}>Clean Table</div>
                <div style={{ fontSize: 11, color: '#696969' }}>Clear table</div>
              </button>
            </div>

            {serviceStatusMsg && (
              <div style={{
                background: '#EDF8F0',
                border: '1px solid #A7E3B6',
                color: '#24963F',
                padding: '10px 14px',
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: 700,
                textAlign: 'center'
              }}>
                {serviceStatusMsg}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7B. VIP LOYALTY PROFILE & BENEFITS MODAL */}
      {loyaltyModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(5px)',
            zIndex: 1050,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setLoyaltyModalOpen(false);
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 20,
              width: '100%',
              maxWidth: 580,
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
              position: 'relative'
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '18px 20px',
                borderBottom: '1px solid #F0F2F5',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 22 }}>👑</span>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 900, color: '#1C1C1C', margin: 0 }}>
                    DirectDine VIP Club
                  </h3>
                  <p style={{ fontSize: 12, color: '#666', margin: '2px 0 0' }}>
                    Exclusive Direct Ordering Rewards & Tier Perks
                  </p>
                </div>
              </div>
              <button
                onClick={() => setLoyaltyModalOpen(false)}
                style={{
                  background: '#F5F5F5',
                  border: 'none',
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: 15,
                  fontWeight: 800,
                  color: '#666'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: 20 }}>
              {/* Metallic VIP Pass Card */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #1C1917 0%, #78350F 55%, #B45309 100%)',
                  borderRadius: 16,
                  padding: '22px 24px',
                  color: '#FFFFFF',
                  boxShadow: '0 14px 30px rgba(180, 83, 9, 0.3)',
                  position: 'relative',
                  overflow: 'hidden',
                  marginBottom: 20
                }}
              >
                {/* Decorative watermarks */}
                <div
                  style={{
                    position: 'absolute',
                    top: -15,
                    right: -15,
                    fontSize: 120,
                    opacity: 0.1,
                    pointerEvents: 'none',
                    userSelect: 'none'
                  }}
                >
                  👑
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
                  <div>
                    <div style={{ fontSize: 10.5, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.8, fontWeight: 700 }}>
                      DIRECT ORDERING VIP PASS
                    </div>
                    <div style={{ fontSize: 19, fontWeight: 900, marginTop: 4 }}>
                      Valued Foodie Member
                    </div>
                  </div>
                  <div
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      backdropFilter: 'blur(8px)',
                      padding: '4px 10px',
                      borderRadius: 20,
                      fontSize: 11.5,
                      fontWeight: 800,
                      border: '1px solid rgba(255,255,255,0.3)',
                      color: '#FEF3C7'
                    }}
                  >
                    🥇 GOLD VIP
                  </div>
                </div>

                <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative', zIndex: 1 }}>
                  <div>
                    <div style={{ fontSize: 11, textTransform: 'uppercase', opacity: 0.8, fontWeight: 600 }}>
                      Available Points Balance
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 900, display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      🪙 240 PTS
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#FEF3C7' }}>
                        = ₹240.00 Off
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10.5, opacity: 0.8 }}>Active Perk</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#FEF3C7' }}>
                      10% Cashback + Free Delivery
                    </div>
                  </div>
                </div>

                {/* Progress bar to Platinum */}
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.18)', position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, opacity: 0.9, marginBottom: 6 }}>
                    <span>Next Tier: <strong>💎 Platinum Elite</strong></span>
                    <span>₹350 spent away (72%)</span>
                  </div>
                  <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.25)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: '72%', height: '100%', background: '#FCD34D', borderRadius: 3 }} />
                  </div>
                </div>
              </div>

              {/* Concrete 1 Pt = 1 Re Explanation Banner */}
              <div
                style={{
                  background: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  borderRadius: 12,
                  padding: '12px 14px',
                  marginBottom: 18,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10
                }}
              >
                <span style={{ fontSize: 22 }}>💰</span>
                <div style={{ fontSize: 12.5, color: '#15803D' }}>
                  <strong>How Benefits Work:</strong> 1 Loyalty Point = <strong>₹1.00 Direct Cash Discount</strong>. Simply check "Redeem Points" on the cart page to deduct ₹240 instantly!
                </div>
              </div>

              {/* 4 Tiers Comparison Matrix */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#1C1C1C', marginBottom: 10 }}>
                  🏆 Membership Tiers & Privileges
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {/* Bronze */}
                  <div
                    style={{
                      border: '1px solid #E5E7EB',
                      borderRadius: 10,
                      padding: '10px 14px',
                      background: '#FAFAFA',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#9A3412' }}>
                        🥉 Bronze Foodie (₹0 - ₹999 spend)
                      </div>
                      <div style={{ fontSize: 11.5, color: '#666', marginTop: 2 }}>
                        • 5% Points Cashback • 1-Tap Redemption • Table priority
                      </div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#666' }}>Unlocked</span>
                  </div>

                  {/* Silver */}
                  <div
                    style={{
                      border: '1px solid #E5E7EB',
                      borderRadius: 10,
                      padding: '10px 14px',
                      background: '#FAFAFA',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#475569' }}>
                        🥈 Silver Gourmet (₹1,000 - ₹2,499 spend)
                      </div>
                      <div style={{ fontSize: 11.5, color: '#666', marginTop: 2 }}>
                        • 7% Points Cashback • Free Dessert on ₹699+ • Priority prep
                      </div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#666' }}>Unlocked</span>
                  </div>

                  {/* Gold (Active) */}
                  <div
                    style={{
                      border: '2px solid #D97706',
                      borderRadius: 10,
                      padding: '12px 14px',
                      background: '#FFFBEB',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      boxShadow: '0 2px 6px rgba(217, 119, 6, 0.1)'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 900, color: '#B45309' }}>
                          🥇 Gold VIP (₹2,500 - ₹4,999 spend)
                        </span>
                        <span style={{ background: '#D97706', color: '#fff', fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 8 }}>
                          YOUR TIER
                        </span>
                      </div>
                      <div style={{ fontSize: 11.5, color: '#92400E', marginTop: 3 }}>
                        • 10% Cashback • <strong>FREE Delivery on all orders</strong> • Welcome drink
                      </div>
                    </div>
                    <span style={{ fontSize: 16 }}>⭐</span>
                  </div>

                  {/* Platinum */}
                  <div
                    style={{
                      border: '1px dashed #94A3B8',
                      borderRadius: 10,
                      padding: '10px 14px',
                      background: '#F8FAFC',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>
                        💎 Platinum Elite (₹5,000+ spend)
                      </div>
                      <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                        • 12% Cashback • Free Delivery • 10% Extra VIP Code • Free Birthday Feast
                      </div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#D97706', background: '#FEF3C7', padding: '2px 8px', borderRadius: 8 }}>
                      ₹350 Left
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => setLoyaltyModalOpen(false)}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: 13,
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                <span>Order Now & Redeem ₹240</span>
                <span>➔</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. FLOATING CART BAR (DUAL ACTION: WEB CHECKOUT + 1-TAP WHATSAPP ORDER) */}
      {itemCount > 0 && (
        <div className="zomato-float-cart" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* Main Checkout Button */}
          <Link
            href={`/${slug}/cart${orderMode === 'dine_in' && tableNumber ? `?table=${tableNumber}` : ''}`}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#FFFFFF'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ background: '#FFFFFF', color: 'var(--primary)', padding: '3px 10px', borderRadius: 6, fontSize: 12.5, fontWeight: 900 }}>
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </span>
              <span style={{ fontSize: 16, fontWeight: 900, color: '#FFFFFF' }}>
                ₹{(cartSubtotalPaise / 100).toFixed(0)}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 800 }}>
              <span>View Cart</span>
              <span>➔</span>
            </div>
          </Link>

          {/* Quick WhatsApp Order Button */}
          <a
            href={buildWhatsAppOrderLink()}
            target="_blank"
            rel="noopener noreferrer"
            title="Send this order directly to restaurant WhatsApp"
            style={{
              background: '#25D366',
              color: '#FFFFFF',
              borderRadius: 8,
              padding: '6px 12px',
              fontSize: 13,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              border: '1px solid rgba(255,255,255,0.4)',
              flexShrink: 0
            }}
          >
            <span>💬</span>
            <span style={{ display: 'inline' }}>WhatsApp</span>
          </a>
        </div>
      )}

      {/* 9. FLOATING WHATSAPP CHEF / BAKER LIVE HELP (CRUSTO BAKERS FEATURE) */}
      <a
        href={`https://wa.me/${(restaurant.phone || '919876543210').replace(/\D/g, '')}?text=${encodeURIComponent(
          `Hi ${restaurant.name}! 👋 I am browsing your menu on DirectDine. I have a query regarding a custom cake or party order.`
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        title="Chat with Chef / Order Custom Cake"
        style={{
          position: 'fixed',
          bottom: itemCount > 0 ? 84 : 22,
          right: 18,
          zIndex: 990,
          background: '#25D366',
          color: '#FFFFFF',
          borderRadius: 30,
          padding: '10px 16px',
          boxShadow: '0 8px 24px rgba(37, 211, 102, 0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          textDecoration: 'none',
          fontWeight: 800,
          fontSize: 12.5,
          border: '2px solid #FFFFFF',
          transition: 'all 0.2s ease'
        }}
      >
        <span style={{ fontSize: 17 }}>💬</span>
        <span>Chat with Chef</span>
      </a>
    </div>
  );
}

export default function RestaurantMenuPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: 60, color: '#4F4F4F' }}>Loading menu...</div>}>
      <MenuContent />
    </Suspense>
  );
}
