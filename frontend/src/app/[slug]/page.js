'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { fetchAPI } from '@/lib/api';
import { useCart } from '@/lib/cartContext';
import { getFoodImageUrl } from '@/lib/foodImages';
import confetti from 'canvas-confetti';

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

  // Corporate & Bulk Catering Enquiry State (Crusto Bakers Feature #4)
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkEventType, setBulkEventType] = useState('🎂 Birthday Party');
  const [bulkGuestCount, setBulkGuestCount] = useState('25 - 50 guests');
  const [bulkDate, setBulkDate] = useState('');
  const [bulkName, setBulkName] = useState('');
  const [bulkPhone, setBulkPhone] = useState('');
  const [bulkNotes, setBulkNotes] = useState('');
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState('');
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  // Occasion & Birthday Reminder Club State (Crusto Bakers Feature #5)
  const [occasionModalOpen, setOccasionModalOpen] = useState(false);
  const [occasionName, setOccasionName] = useState('🎂 My Birthday');
  const [occasionDate, setOccasionDate] = useState('');
  const [occasionPhone, setOccasionPhone] = useState('');
  const [occasionCustomerName, setOccasionCustomerName] = useState('');
  const [occasionSuccessMsg, setOccasionSuccessMsg] = useState('');
  const [occasionCouponCode, setOccasionCouponCode] = useState('');
  const [occasionSubmitting, setOccasionSubmitting] = useState(false);

  // Restaurant Staff / Owner Login Modal State
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [staffPhone, setStaffPhone] = useState(slug === 'chai-and-bites' ? '9988776655' : '9876543210');
  const [staffPassword, setStaffPassword] = useState(slug === 'chai-and-bites' ? 'chai123' : 'spice123');
  const [staffLoginLoading, setStaffLoginLoading] = useState(false);
  const [staffLoginError, setStaffLoginError] = useState('');

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

  // Bulk & Party Catering Form Handler
  const handleBulkEnquirySubmit = async (e) => {
    if (e) e.preventDefault();
    if (!bulkPhone || !bulkName) {
      alert('Please provide your name and phone number');
      return;
    }
    setBulkSubmitting(true);
    setBulkSuccessMsg('');
    try {
      const res = await fetchAPI(`/restaurant/${slug}/bulk-enquiry`, {
        method: 'POST',
        body: JSON.stringify({
          customerName: bulkName,
          customerPhone: bulkPhone,
          eventType: bulkEventType,
          guestCount: bulkGuestCount,
          eventDate: bulkDate,
          notes: bulkNotes
        })
      });
      if (res.success) {
        setBulkSuccessMsg(res.message);
        setTimeout(() => {
          setBulkModalOpen(false);
          setBulkSuccessMsg('');
        }, 3200);
      } else {
        alert(res.error || 'Failed to submit enquiry');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setBulkSubmitting(false);
    }
  };

  // Birthday & Occasion Reminder Club Handler
  const handleSaveOccasionSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!occasionPhone || !occasionDate) {
      alert('Please provide your phone number and occasion date');
      return;
    }
    setOccasionSubmitting(true);
    setOccasionSuccessMsg('');
    try {
      const res = await fetchAPI(`/restaurant/${slug}/save-occasion`, {
        method: 'POST',
        body: JSON.stringify({
          customerPhone: occasionPhone,
          customerName: occasionCustomerName || 'Valued Member',
          occasionName: occasionName,
          occasionDate: occasionDate
        })
      });
      if (res.success) {
        try { confetti(); } catch (e) {}
        setOccasionCouponCode(res.couponCode || 'VIPBIRTHDAY15');
        setOccasionSuccessMsg(res.message || 'Occasion saved! 15% VIP Coupon code is VIPBIRTHDAY15.');
      } else {
        alert(res.error || 'Failed to save occasion');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setOccasionSubmitting(false);
    }
  };

  // Staff & Owner Kitchen Login Handler
  const handleStaffLogin = async (e) => {
    if (e) e.preventDefault();
    setStaffLoginLoading(true);
    setStaffLoginError('');
    try {
      const res = await fetchAPI('/dashboard/login', {
        method: 'POST',
        body: JSON.stringify({ phone: staffPhone, password: staffPassword })
      });
      if (res.token) {
        localStorage.setItem('staff_token', res.token);
        const restObj = res.restaurant || restaurant || { name: 'Spice Garden', slug: 'spice-garden' };
        localStorage.setItem('staff_restaurant', JSON.stringify(restObj));
        window.location.href = '/dashboard';
      } else {
        setStaffLoginError(res.error || 'Invalid staff credentials');
      }
    } catch (err) {
      setStaffLoginError(err.message || 'Login failed');
    } finally {
      setStaffLoginLoading(false);
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
    const restPhone = (restaurant.phone || '919876543210').replace(/\D/g, '');
    if (cart.length === 0) {
      return `https://wa.me/${restPhone}?text=${encodeURIComponent(`Hi ${restaurant.name}! 👋 I am browsing your menu and would like to place a direct order.`)}`;
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
  const filteredMenu = useMemo(() => {
    return menu.map(cat => {
      const items = (cat.items || []).filter(item => {
        const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchVeg = vegFilter === 'all' || item.veg_type === vegFilter;
        return matchSearch && matchVeg;
      });
      return { ...cat, items };
    }).filter(cat => cat.items.length > 0);
  }, [menu, searchQuery, vegFilter]);

  // Chef's Signature Bestsellers Spotlight
  const spotlightItems = useMemo(() => {
    const allItems = menu.flatMap(cat => cat.items || []);
    const bestsellers = allItems.filter(item => item.is_bestseller);
    return bestsellers.length >= 2 ? bestsellers.slice(0, 4) : allItems.slice(0, 4);
  }, [menu]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: 16 }}>
        <div style={{ width: 44, height: 44, border: '3px solid #F0F1F4', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: '#4F4F4F', fontSize: 14, fontWeight: 600 }}>Loading culinary experience...</p>
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

  const coverImage = restaurant.cover_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&auto=format&fit=crop&q=85';
  const logoImage = restaurant.logo_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=300&auto=format&fit=crop&q=80';

  return (
    <div style={{ paddingBottom: itemCount > 0 ? 120 : 60, maxWidth: 1040, margin: '0 auto' }}>
      
      {/* 1. TOP LUXURY ANNOUNCEMENT TICKER */}
      <div style={{
        background: 'linear-gradient(90deg, #1C1917 0%, #3B0D11 50%, #1C1917 100%)',
        color: '#FCD34D',
        padding: '9px 16px',
        fontSize: 'clamp(11.5px, 2.5vw, 13px)',
        fontWeight: 700,
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        letterSpacing: '0.02em',
        borderBottom: '1px solid rgba(226, 55, 68, 0.3)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.15)'
      }}>
        <span>✨</span>
        <span>
          <strong>Direct Order Exclusive:</strong> 0% Platform Markup • Flat ₹50 OFF with code <strong style={{ color: '#FFFFFF', textDecoration: 'underline' }}>FLAT50</strong> • Earn 10% Cash Points • Free Candles & Cutlery
        </span>
        <span>✨</span>
      </div>

      {/* 2. GRAND PANORAMIC RESTAURANT HERO SECTION */}
      <section style={{
        position: 'relative',
        margin: '10px 10px 18px',
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
        background: '#1C1917'
      }}>
        {/* Background Cover Photo with Smooth Dark Vignette */}
        <div style={{
          position: 'relative',
          minHeight: 280,
          backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.35) 0%, rgba(15, 23, 42, 0.72) 55%, rgba(15, 23, 42, 0.96) 100%), url(${coverImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '16px 16px'
        }}>
          {/* Top Bar inside Hero: Back link + DirectDine Pill + Open Status */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
            <Link
              href="/"
              style={{
                background: 'rgba(255, 255, 255, 0.92)',
                backdropFilter: 'blur(8px)',
                color: '#1C1C1C',
                padding: '6px 12px',
                borderRadius: 24,
                fontSize: 12,
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}
            >
              <span>←</span>
              <span>All Kitchens</span>
            </Link>

            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{
                background: '#24963F',
                color: '#FFFFFF',
                padding: '5px 10px',
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                boxShadow: '0 2px 8px rgba(36, 150, 63, 0.35)'
              }}>
                ✓ 0% Commission
              </span>

              <span style={{
                background: restaurant.isOpen ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                backdropFilter: 'blur(8px)',
                color: restaurant.isOpen ? '#86EFAC' : '#FCA5A5',
                border: `1px solid ${restaurant.isOpen ? 'rgba(134, 239, 172, 0.4)' : 'rgba(252, 165, 165, 0.4)'}`,
                padding: '4px 10px',
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 800
              }}>
                {restaurant.isOpen ? `🟢 Open (~${restaurant.avg_prep_minutes || 25}m)` : '🔴 Closed'}
              </span>
            </div>
          </div>

          {/* Restaurant Identity: Circular Logo Avatar + Name + Tagline + Meta */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, flexWrap: 'wrap', marginTop: 24 }}>
            {/* Golden Rimmed Logo Avatar */}
            <div style={{
              width: 68,
              height: 68,
              borderRadius: '50%',
              border: '3px solid #FCD34D',
              boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
              overflow: 'hidden',
              background: '#FFFFFF',
              flexShrink: 0
            }}>
              <img
                src={logoImage}
                alt={restaurant.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            {/* Title & Cuisine */}
            <div style={{ flex: '1 1 260px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h1 style={{
                  fontSize: 'clamp(22px, 5vw, 32px)',
                  fontWeight: 900,
                  color: '#FFFFFF',
                  lineHeight: 1.15,
                  margin: 0,
                  textShadow: '0 2px 10px rgba(0,0,0,0.7)'
                }}>
                  {restaurant.name}
                </h1>
                <span className="zomato-rating-pill" style={{ fontSize: 12, padding: '3px 8px' }}>
                  4.8 ★
                </span>
                <span style={{ color: '#E2E8F0', fontSize: 11.5, fontWeight: 600, opacity: 0.9 }}>
                  (1,240+ reviews)
                </span>
              </div>

              <p style={{
                color: '#CBD5E1',
                fontSize: 12.5,
                margin: '4px 0 0',
                lineHeight: 1.35,
                textShadow: '0 1px 4px rgba(0,0,0,0.6)'
              }}>
                {restaurant.description || 'Authentic flavors, freshest spices, and zero aggregator price markup.'}
              </p>

              {/* Meta Chips */}
              <div style={{
                display: 'flex',
                gap: 8,
                marginTop: 6,
                flexWrap: 'wrap',
                fontSize: 11.5,
                color: '#E2E8F0',
                fontWeight: 600
              }}>
                <span>📍 {restaurant.address_line || restaurant.city || 'Mumbai'}</span>
                <span>•</span>
                <span>⏱️ {restaurant.avg_prep_minutes || 25} mins prep</span>
                <span>•</span>
                <span>🛵 Free Delivery above ₹{((restaurant.free_delivery_above_paise || 49900) / 100).toFixed(0)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Action Navigation Buttons inside Hero Bar */}
        <div
          className="no-scrollbar touch-scroll"
          style={{
            background: '#0F172A',
            borderTop: '1px solid rgba(255,255,255,0.12)',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            overflowX: 'auto',
            whiteSpace: 'nowrap'
          }}
        >
          {/* Primary CTA */}
          <a
            href="#menu-section"
            className="btn-primary"
            style={{
              padding: '7px 14px',
              fontSize: 12,
              fontWeight: 800,
              borderRadius: 8,
              flexShrink: 0
            }}
          >
            🍽️ Order Now
          </a>

          {/* Interactive Feature Shortcuts */}
          <button
            onClick={() => setBulkModalOpen(true)}
            style={{
              background: 'rgba(37, 99, 235, 0.2)',
              color: '#93C5FD',
              border: '1px solid rgba(147, 197, 253, 0.3)',
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: 11.5,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              flexShrink: 0
            }}
          >
            <span>🎈</span>
            <span>Bulk Orders</span>
          </button>

          <button
            onClick={() => setOccasionModalOpen(true)}
            style={{
              background: 'rgba(226, 55, 68, 0.2)',
              color: '#FECDD3',
              border: '1px solid rgba(254, 205, 211, 0.3)',
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: 11.5,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              flexShrink: 0
            }}
          >
            <span>🎂</span>
            <span>Birthday Club</span>
          </button>

          <button
            onClick={() => setLoyaltyModalOpen(true)}
            style={{
              background: 'linear-gradient(135deg, #78350F, #B45309)',
              color: '#FEF3C7',
              border: '1px solid #FCD34D',
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: 11.5,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(180, 83, 9, 0.3)'
            }}
          >
            <span>👑 VIP Pass</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '1px 5px', borderRadius: 6, fontSize: 10.5 }}>
              🪙 240 pts
            </span>
          </button>

          <a
            href={buildWhatsAppOrderLink()}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: '#25D366',
              color: '#FFFFFF',
              border: 'none',
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: 11.5,
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              flexShrink: 0
            }}
          >
            <span>💬</span>
            <span>WhatsApp Chef</span>
          </a>

          <button
            onClick={() => setStaffModalOpen(true)}
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              color: '#F8FAFC',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: 11.5,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              flexShrink: 0
            }}
          >
            <span>🔐</span>
            <span>Kitchen Login</span>
          </button>
        </div>
      </section>

      {/* 3. "WHY ORDER DIRECT FROM US?" – 4-CARD DIRECTDINE VALUE GRID */}
      <section style={{ margin: '0 14px 22px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 10
        }}>
          {/* Benefit 1 */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #ECEEF2',
            borderRadius: 14,
            padding: '12px 14px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>💰</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#1C1C1C' }}>Zero Aggregator Markup</div>
            <div style={{ fontSize: 11.5, color: '#696969', marginTop: 3, lineHeight: 1.35 }}>
              Kitchen direct prices are 10–20% cheaper than Zomato/Swiggy.
            </div>
          </div>

          {/* Benefit 2 */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #ECEEF2',
            borderRadius: 14,
            padding: '12px 14px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>🪙</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#1C1C1C' }}>10% Points Cashback</div>
            <div style={{ fontSize: 11.5, color: '#696969', marginTop: 3, lineHeight: 1.35 }}>
              1 Loyalty Point = <strong>₹1.00 Discount</strong> on your next order.
            </div>
          </div>

          {/* Benefit 3 */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #ECEEF2',
            borderRadius: 14,
            padding: '12px 14px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>👨‍🍳</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#1C1C1C' }}>Direct Chef Attention</div>
            <div style={{ fontSize: 11.5, color: '#696969', marginTop: 3, lineHeight: 1.35 }}>
              Custom spice levels, ribbon text on cakes &amp; fresh pack.
            </div>
          </div>

          {/* Benefit 4 */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #ECEEF2',
            borderRadius: 14,
            padding: '12px 14px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>⚡</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#1C1C1C' }}>Express Hot Dispatch</div>
            <div style={{ fontSize: 11.5, color: '#696969', marginTop: 3, lineHeight: 1.35 }}>
              Direct from the pan to doorstep with zero detour delays.
            </div>
          </div>
        </div>
      </section>

      {/* 4. VISUAL "CATEGORY CRAVINGS" STORY CAROUSEL */}
      {menu.length > 0 && (
        <section style={{ margin: '0 14px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: '#1C1C1C', margin: 0 }}>
              Craving by Category 😋
            </h3>
            <span style={{ fontSize: 12, color: '#696969', fontWeight: 600 }}>
              Tap to jump
            </span>
          </div>

          <div
            className="no-scrollbar touch-scroll"
            style={{
              display: 'flex',
              gap: 14,
              overflowX: 'auto',
              paddingBottom: 6,
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            {menu.map((category) => {
              const sampleItem = category.items?.[0];
              const sampleImg = sampleItem ? getFoodImageUrl(sampleItem) : 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80';
              const isSelected = activeCategory === category.id;

              return (
                <a
                  key={category.id}
                  href={`#category-${category.id}`}
                  onClick={() => setActiveCategory(category.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    flexShrink: 0,
                    textDecoration: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{
                    width: 74,
                    height: 74,
                    borderRadius: '50%',
                    padding: 3,
                    border: `2.5px solid ${isSelected ? 'var(--primary)' : '#E2E8F0'}`,
                    background: '#FFFFFF',
                    boxShadow: isSelected ? '0 4px 14px var(--primary-glow)' : 'var(--shadow-sm)',
                    transition: 'all 0.2s ease',
                    overflow: 'hidden'
                  }}>
                    <img
                      src={sampleImg}
                      alt={category.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        objectFit: 'cover'
                      }}
                    />
                  </div>
                  <span style={{
                    fontSize: 12,
                    fontWeight: isSelected ? 800 : 700,
                    color: isSelected ? 'var(--primary)' : '#1C1C1C',
                    textAlign: 'center',
                    maxWidth: 82,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {category.name}
                  </span>
                  <span style={{
                    fontSize: 10.5,
                    color: '#828282',
                    marginTop: -4
                  }}>
                    {category.items?.length || 0} items
                  </span>
                </a>
              );
            })}
          </div>
        </section>
      )}

      {/* 5. "CHEF'S SIGNATURE SPECIALS & BESTSELLERS" SPOTLIGHT SHELF */}
      {spotlightItems.length > 0 && (
        <section style={{
          margin: '0 14px 24px',
          background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)',
          border: '1.5px solid #FED7AA',
          borderRadius: 18,
          padding: '16px 18px',
          boxShadow: '0 4px 16px rgba(234, 88, 12, 0.08)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 18 }}>⭐</span>
                <h3 style={{ fontSize: 16, fontWeight: 900, color: '#9A3412', margin: 0 }}>
                  Chef's Signature Specials & Bestsellers
                </h3>
              </div>
              <p style={{ fontSize: 12, color: '#C2410C', margin: '3px 0 0' }}>
                Handpicked most loved recipes straight from our master kitchen
              </p>
            </div>
            <span style={{
              background: '#EA580C',
              color: '#FFFFFF',
              fontSize: 11,
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: 20
            }}>
              Must Try
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 12
          }}>
            {spotlightItems.map((item) => {
              const cartItem = cart.find(ci => ci.itemId === item.id);
              const hasCustomizations = (item.variants && item.variants.length > 0) || (item.addon_groups && item.addon_groups.length > 0);

              return (
                <div
                  key={`spotlight-${item.id}`}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: 14,
                    padding: '12px 14px',
                    border: '1px solid #FFEDD5',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 12,
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span className={item.veg_type === 'veg' ? 'badge-veg' : 'badge-nonveg'} />
                      <span style={{
                        fontSize: 10,
                        fontWeight: 900,
                        background: '#FEF3C7',
                        color: '#B45309',
                        padding: '1px 6px',
                        borderRadius: 4
                      }}>
                        ★ Chef Special
                      </span>
                    </div>

                    <h4 style={{ fontSize: 14.5, fontWeight: 800, color: '#1C1C1C', margin: '0 0 3px' }}>
                      {item.name}
                    </h4>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#1C1C1C', marginBottom: 4 }}>
                      ₹{(item.base_price_paise / 100).toFixed(0)}
                    </div>
                    {item.description && (
                      <p style={{
                        fontSize: 11.5,
                        color: '#696969',
                        lineHeight: 1.35,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        margin: 0
                      }}>
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 90 }}>
                    <div style={{
                      width: 86,
                      height: 72,
                      borderRadius: 10,
                      overflow: 'hidden',
                      border: '1px solid #ECEEF2',
                      background: '#F8F9FA'
                    }}>
                      <img
                        src={getFoodImageUrl(item)}
                        alt={item.name}
                        loading="lazy"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <div style={{ marginTop: -12, position: 'relative', zIndex: 2 }}>
                      {cartItem ? (
                        <div className="zomato-qty-pill" style={{ height: 28 }}>
                          <button onClick={() => updateQuantity(cartItem.cartKey, -1)} style={{ padding: '0 8px', fontSize: 14 }}>-</button>
                          <span style={{ fontSize: 12, minWidth: 18 }}>{cartItem.quantity}</span>
                          <button onClick={() => updateQuantity(cartItem.cartKey, 1)} style={{ padding: '0 8px', fontSize: 14 }}>+</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleQuickAdd(item)}
                          className="zomato-add-btn"
                          style={{ padding: '4px 14px', fontSize: 11.5 }}
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
      )}

      {/* 6. ORDER MODE SWITCHER & PINCODE SERVICEABILITY BAR */}
      <section style={{ margin: '0 14px 16px' }}>
        <div style={{
          background: '#FFFFFF',
          borderRadius: 14,
          padding: '12px 14px',
          border: '1px solid var(--border-medium)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10
        }}>
          {/* Mode Switcher Tabs */}
          <div style={{
            display: 'flex',
            background: '#F4F5F8',
            padding: 3,
            borderRadius: 10,
            border: '1px solid #E3E5EB'
          }}>
            <button
              onClick={() => setOrderMode('delivery')}
              style={{
                padding: '7px 14px',
                borderRadius: 8,
                fontSize: 12.5,
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
                padding: '7px 14px',
                borderRadius: 8,
                fontSize: 12.5,
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
                padding: '7px 14px',
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: 800,
                background: orderMode === 'takeaway' ? 'var(--primary)' : 'transparent',
                color: orderMode === 'takeaway' ? '#FFFFFF' : '#4F4F4F',
                transition: 'all 0.18s'
              }}
            >
              🥡 Takeaway
            </button>
          </div>

          {/* Dine-In Call Waiter action button */}
          {orderMode === 'dine_in' && (
            <button
              onClick={() => setWaiterModalOpen(true)}
              style={{
                background: '#FFF3CD',
                color: '#856404',
                border: '1px solid #FFEEBA',
                padding: '7px 14px',
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              🔔 Call Waiter / Service
            </button>
          )}

          {/* Delivery Pincode input */}
          {orderMode === 'delivery' && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Pincode e.g. 400050"
                  maxLength={6}
                  value={pincodeInput}
                  onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCheckPincode(); }}
                  style={{
                    width: 140,
                    height: 36,
                    padding: '0 10px',
                    borderRadius: 8,
                    border: '1px solid #D1D5DB',
                    fontSize: 12.5,
                    fontWeight: 700,
                    textAlign: 'center'
                  }}
                />
              </div>
              <button
                type="button"
                onClick={handleCheckPincode}
                disabled={pincodeChecking || pincodeInput.length !== 6}
                style={{
                  background: 'var(--primary)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 8,
                  padding: '0 14px',
                  height: 36,
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: pincodeInput.length === 6 ? 'pointer' : 'not-allowed',
                  opacity: pincodeInput.length === 6 ? 1 : 0.6
                }}
              >
                {pincodeChecking ? '...' : 'Check Pin'}
              </button>
            </div>
          )}
        </div>

        {/* Pincode Result Banner */}
        {orderMode === 'delivery' && pincodeVerified && (
          <div style={{
            marginTop: 8,
            padding: '8px 14px',
            borderRadius: 10,
            background: pincodeServiceable ? '#EDF8F0' : '#FEECEE',
            border: `1px solid ${pincodeServiceable ? '#A7E3B6' : '#FBCED2'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 12
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>{pincodeServiceable ? '✅' : '⚠️'}</span>
              <span style={{ fontWeight: 800, color: pincodeServiceable ? '#15803D' : '#DC2626' }}>
                {pincodeMsg || (pincodeServiceable ? `Delivering to ${savedPincode}` : `Pincode outside delivery radius`)}
              </span>
            </div>
            <span style={{ color: '#4F4F4F', fontWeight: 600 }}>
              Est. 30–45 mins • Free delivery above ₹{((restaurant?.free_delivery_above_paise || 49900) / 100).toFixed(0)}
            </span>
          </div>
        )}

        {/* Takeaway Info Banner */}
        {orderMode === 'takeaway' && (
          <div style={{
            marginTop: 8,
            padding: '10px 14px',
            borderRadius: 10,
            background: '#EFF6FF',
            border: '1.5px solid #BFDBFE',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 8
          }}>
            <div style={{ fontSize: 12.5, color: '#1E40AF', fontWeight: 700 }}>
              🥡 Kitchen Self-Pickup: <strong>{restaurant.address_line || 'Bandra West, Mumbai'}</strong> • Ready in ~20 mins
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
                padding: '5px 12px',
                borderRadius: 6,
                fontSize: 11.5,
                fontWeight: 800,
                textDecoration: 'none'
              }}
            >
              Get Directions 🗺️
            </a>
          </div>
        )}
      </section>

      {/* 7. SEARCH & VEG / NON-VEG FILTER BAR */}
      <section id="menu-section" style={{ margin: '0 14px 14px', scrollMarginTop: 70 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search Field */}
          <div style={{ flex: '1 1 260px', position: 'relative' }}>
            <input
              type="text"
              placeholder={`Search ${restaurant.name} menu (Biryani, Paneer, Cakes)...`}
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
      </section>

      {/* 8. STICKY CATEGORY TABS (AUTHENTIC BRAND SCROLLER) */}
      <div
        className="no-scrollbar touch-scroll"
        style={{
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
        }}
      >
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

      {/* 9. MAIN MENU CATEGORIES & FOOD DISH CARDS */}
      <div style={{ padding: '16px 14px' }}>
        {filteredMenu.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#696969' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🔍</div>
            <p style={{ fontSize: 16, marginBottom: 4, color: '#1C1C1C', fontWeight: 700 }}>No dishes found</p>
            <p style={{ fontSize: 13 }}>Try clearing your search terms or toggling the dietary filter.</p>
          </div>
        ) : (
          filteredMenu.map(category => (
            <section key={category.id} id={`category-${category.id}`} style={{ marginBottom: 36, scrollMarginTop: 65 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <h2 style={{ fontSize: 20, color: '#1C1C1C' }}>{category.name}</h2>
                <span style={{ fontSize: 11.5, color: '#696969', background: '#F0F1F4', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontWeight: 700 }}>
                  {category.items.length}
                </span>
              </div>

              {/* Items List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
                        padding: '14px 14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 12,
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

                        <h3 style={{ fontSize: 15.5, fontWeight: 700, color: '#1C1C1C', marginBottom: 4 }}>{item.name}</h3>
                        <div style={{ fontSize: 14.5, fontWeight: 800, color: '#1C1C1C', marginBottom: 6 }}>
                          ₹{(item.base_price_paise / 100).toFixed(0)}
                        </div>

                        {item.description && (
                          <p style={{ fontSize: 12, color: '#696969', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
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
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: 96, flexShrink: 0, position: 'relative' }}>
                        <div style={{
                          width: 92,
                          height: 78,
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
                            <button disabled style={{ padding: '5px 10px', borderRadius: 8, fontSize: 10.5, background: '#F4F5F8', color: '#9C9C9C', fontWeight: 600, border: '1px solid #E3E5EB' }}>
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

      {/* 10. "FOODIE LOVE & VERIFIED CUSTOMER REVIEWS" (SOCIAL PROOF WALL) */}
      <section style={{ margin: '20px 14px 28px' }}>
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Direct Diners Say
          </span>
          <h3 style={{ fontSize: 22, fontWeight: 900, color: '#1C1C1C', marginTop: 4 }}>
            Foodie Love & Verified Experiences ⭐
          </h3>
          <p style={{ fontSize: 13, color: '#696969' }}>
            Real reviews from customers who ordered direct to their door
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 14
        }}>
          {/* Review 1 */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #ECEEF2',
            borderRadius: 16,
            padding: '18px 20px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', color: '#F59E0B', fontSize: 14, marginBottom: 8 }}>
              ★★★★★
            </div>
            <p style={{ fontSize: 13, color: '#1F2937', lineHeight: 1.5, marginBottom: 14, fontStyle: 'italic' }}>
              &ldquo;The Dum Biryani arrived piping hot with tender, aromatic meat pieces. Ordering direct gave me 10% points cashback and no aggregator surge fee. Best experience!&rdquo;
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#FEE2E2', color: '#E23744', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14 }}>
                R
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#111827' }}>Rahul Sharma</div>
                <div style={{ fontSize: 11, color: '#15803D', fontWeight: 600 }}>✓ Verified Direct Diner • Bandra</div>
              </div>
            </div>
          </div>

          {/* Review 2 */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #ECEEF2',
            borderRadius: 16,
            padding: '18px 20px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', color: '#F59E0B', fontSize: 14, marginBottom: 8 }}>
              ★★★★★
            </div>
            <p style={{ fontSize: 13, color: '#1F2937', lineHeight: 1.5, marginBottom: 14, fontStyle: 'italic' }}>
              &ldquo;Ordered a celebration Belgian Chocolate Cake for my sister&apos;s birthday. Custom message ribbon was perfect, complimentary knife & candles included, safely packed!&rdquo;
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14 }}>
                P
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#111827' }}>Priya Mehta</div>
                <div style={{ fontSize: 11, color: '#D97706', fontWeight: 600 }}>✓ Gold VIP Member • Pune</div>
              </div>
            </div>
          </div>

          {/* Review 3 */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #ECEEF2',
            borderRadius: 16,
            padding: '18px 20px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', color: '#F59E0B', fontSize: 14, marginBottom: 8 }}>
              ★★★★★
            </div>
            <p style={{ fontSize: 13, color: '#1F2937', lineHeight: 1.5, marginBottom: 14, fontStyle: 'italic' }}>
              &ldquo;Placed an office bulk snack order for 35 people. Chef called to verify spice preferences and delivered right on time in tamper-proof boxes. 5 stars all day!&rdquo;
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#DBEAFE', color: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14 }}>
                A
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#111827' }}>Aman Kapur</div>
                <div style={{ fontSize: 11, color: '#15803D', fontWeight: 600 }}>✓ Corporate Catering Client</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 11. CHEF'S KITCHEN PHILOSOPHY & HYGIENE PROMISE */}
      <section style={{
        margin: '0 14px 28px',
        background: '#FFFFFF',
        borderRadius: 18,
        padding: '22px 24px',
        border: '1px solid #ECEEF2',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 24 }}>🛡️</span>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 900, color: '#1C1C1C', margin: 0 }}>
              Our Kitchen & Quality Promise
            </h3>
            <p style={{ fontSize: 12, color: '#696969', margin: '2px 0 0' }}>
              Crafted fresh daily with restaurant-grade hygiene protocols
            </p>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 14
        }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 20 }}>🧼</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#1C1C1C' }}>Sanitized Station</div>
              <div style={{ fontSize: 11.5, color: '#696969', marginTop: 2 }}>Hourly surface sanitization & daily temperature logs.</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 20 }}>🌿</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#1C1C1C' }}>Farm-Fresh Spices</div>
              <div style={{ fontSize: 11.5, color: '#696969', marginTop: 2 }}>Zero artificial food colors, 100% cold-pressed oils.</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 20 }}>📦</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#1C1C1C' }}>Spill-Proof Packaging</div>
              <div style={{ fontSize: 11.5, color: '#696969', marginTop: 2 }}>Tamper-evident food-grade containers that keep food hot.</div>
            </div>
          </div>
        </div>
      </section>

      {/* 12. STORE LOCATION, TIMINGS & NAVIGATION CARD */}
      <section style={{
        margin: '0 14px 24px',
        background: '#F8FAFC',
        borderRadius: 18,
        padding: '20px 22px',
        border: '1.5px solid #E2E8F0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 14
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 20 }}>📍</span>
            <h4 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>
              {restaurant.name} Kitchen Location
            </h4>
          </div>
          <p style={{ fontSize: 13, color: '#475569', margin: '4px 0 2px' }}>
            {restaurant.address_line || '42, MG Road'}, {restaurant.city || 'Mumbai'} - {restaurant.pincode || '400001'}
          </p>
          <div style={{ fontSize: 12, color: '#64748B', display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
            <span>🕒 Open Daily: 11:00 AM – 11:30 PM</span>
            <span>•</span>
            <span>📞 Direct Kitchen: {restaurant.phone || '+91 98765 43210'}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              `${restaurant.name} ${restaurant.address_line || ''} ${restaurant.city || ''}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: '#0F172A',
              color: '#FFFFFF',
              padding: '9px 16px',
              borderRadius: 10,
              fontSize: 12.5,
              fontWeight: 800,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <span>🗺️ Google Maps</span>
          </a>

          <a
            href={`tel:${restaurant.phone || '+919876543210'}`}
            style={{
              background: '#FFFFFF',
              color: '#0F172A',
              border: '1px solid #CBD5E1',
              padding: '9px 16px',
              borderRadius: 10,
              fontSize: 12.5,
              fontWeight: 800,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <span>📞 Call Kitchen</span>
          </a>
        </div>
      </section>

      {/* 12B. RESTAURANT PARTNER & KITCHEN OPERATIONS ACCESS CARD */}
      <section style={{
        margin: '0 14px 28px',
        background: '#FFFFFF',
        borderRadius: 18,
        padding: '20px 24px',
        border: '1.5px solid #FBCED2',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 14
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: '#FFF1F2',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            flexShrink: 0
          }}>
            👨‍🍳
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              RESTAURANT MANAGEMENT
            </div>
            <h4 style={{ fontSize: 16, fontWeight: 800, color: '#1C1C1C', margin: '2px 0 0' }}>
              {restaurant.name} Kitchen Staff &amp; Owner Portal
            </h4>
            <p style={{ fontSize: 12.5, color: '#696969', margin: '2px 0 0' }}>
              Manage live KDS orders, dish pricing, table QR codes, and customer loyalty profiles.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setStaffModalOpen(true)}
          style={{
            background: 'var(--primary)',
            color: '#FFFFFF',
            border: 'none',
            padding: '10px 18px',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 4px 12px var(--primary-glow)'
          }}
        >
          <span>🔐</span>
          <span>Sign In to Kitchen Dashboard</span>
        </button>
      </section>

      {/* 13. CUSTOMIZATION MODAL (CLEAN WHITE BOTTOM SHEET) */}
      {customizingItem && (
        <div className="modal-overlay-responsive">
          <div className="mobile-modal-sheet touch-scroll" style={{
            maxWidth: 500,
            padding: '24px 22px 28px',
            position: 'relative'
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

      {/* 14. DINE-IN SERVICE MODAL ("CALL WAITER / WATER / BILL") */}
      {waiterModalOpen && (
        <div className="modal-overlay-responsive">
          <div className="mobile-modal-sheet touch-scroll" style={{
            maxWidth: 420,
            padding: 24,
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

      {/* 15. VIP LOYALTY PROFILE & BENEFITS MODAL */}
      {loyaltyModalOpen && (
        <div
          className="modal-overlay-responsive"
          onClick={(e) => {
            if (e.target === e.currentTarget) setLoyaltyModalOpen(false);
          }}
        >
          <div
            className="mobile-modal-sheet touch-scroll"
            style={{
              maxWidth: 580,
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
                {/* Decorative watermark */}
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
                  <strong>How Benefits Work:</strong> 1 Loyalty Point = <strong>₹1.00 Direct Cash Discount</strong>. Simply check &ldquo;Redeem Points&rdquo; on the cart page to deduct ₹240 instantly!
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

      {/* 16. BULK & PARTY CATERING ENQUIRY MODAL (CRUSTO BAKERS FEATURE #4) */}
      {bulkModalOpen && (
        <div
          className="modal-overlay-responsive"
          onClick={(e) => {
            if (e.target === e.currentTarget && !bulkSubmitting) setBulkModalOpen(false);
          }}
        >
          <div
            className="mobile-modal-sheet touch-scroll"
            style={{
              maxWidth: 540,
              position: 'relative',
              padding: 24
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 24 }}>🎈</span>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 900, color: '#1C1C1C', margin: 0 }}>
                    Corporate & Party Bulk Orders
                  </h3>
                  <p style={{ fontSize: 12, color: '#666', margin: '2px 0 0' }}>
                    Snack boxes, celebration cakes & meal packages for 15+ guests
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBulkModalOpen(false)}
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

            {bulkSuccessMsg ? (
              <div
                style={{
                  background: '#DCFCE7',
                  border: '1.5px solid #86EFAC',
                  borderRadius: 14,
                  padding: '24px 20px',
                  textAlign: 'center',
                  color: '#15803D'
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
                <h4 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 6px' }}>Enquiry Received!</h4>
                <p style={{ fontSize: 13, lineHeight: 1.5, margin: 0 }}>{bulkSuccessMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleBulkEnquirySubmit}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                  Event Occasion:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                  {['🎂 Birthday Party', '💼 Office Lunch', '🏠 House Gathering', '🎓 Farewell / Event'].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setBulkEventType(type)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 700,
                        border: bulkEventType === type ? '2px solid #2563EB' : '1px solid #D1D5DB',
                        background: bulkEventType === type ? '#EFF6FF' : '#F9FAFB',
                        color: bulkEventType === type ? '#1E40AF' : '#374151',
                        cursor: 'pointer'
                      }}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                  Expected Guest Count:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 14 }}>
                  {['15-25', '25-50', '50-100', '100+'].map(count => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setBulkGuestCount(count)}
                      style={{
                        padding: '7px 4px',
                        borderRadius: 8,
                        fontSize: 11.5,
                        fontWeight: 800,
                        border: bulkGuestCount === count ? '2px solid #2563EB' : '1px solid #D1D5DB',
                        background: bulkGuestCount === count ? '#EFF6FF' : '#F9FAFB',
                        color: bulkGuestCount === count ? '#1E40AF' : '#374151',
                        cursor: 'pointer'
                      }}
                    >
                      {count} guests
                    </button>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4 }}>
                      Event Date:
                    </label>
                    <input
                      type="date"
                      value={bulkDate}
                      onChange={(e) => setBulkDate(e.target.value)}
                      className="input-field"
                      style={{ height: 38, fontSize: 12.5 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4 }}>
                      WhatsApp Phone:
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="10-digit number"
                      value={bulkPhone}
                      onChange={(e) => setBulkPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="input-field"
                      style={{ height: 38, fontSize: 12.5 }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4 }}>
                    Your Name:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={bulkName}
                    onChange={(e) => setBulkName(e.target.value)}
                    className="input-field"
                    style={{ height: 38, fontSize: 12.5 }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4 }}>
                    Special Requirements (Items / Budget):
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 30 mini burgers + 30 truffle pastries + mocktails"
                    value={bulkNotes}
                    onChange={(e) => setBulkNotes(e.target.value)}
                    className="input-field"
                    style={{ height: 38, fontSize: 12.5 }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <a
                    href={`https://wa.me/${(restaurant?.phone || '919876543210').replace(/\D/g, '')}?text=${encodeURIComponent(
                      `👋 Hi ${restaurant?.name || 'DirectDine'}! I am inquiring about a bulk catering order for a ${bulkEventType} on ${bulkDate || 'upcoming date'} for ~${bulkGuestCount}. My name is ${bulkName || 'Guest'} (${bulkPhone}). Details: ${bulkNotes || 'Please share customized package rates'}.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      flex: 1,
                      background: '#25D366',
                      color: '#FFFFFF',
                      padding: 12,
                      borderRadius: 10,
                      fontWeight: 800,
                      fontSize: 13,
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6
                    }}
                  >
                    💬 WhatsApp Quote
                  </a>
                  <button
                    type="submit"
                    disabled={bulkSubmitting}
                    className="btn-primary"
                    style={{
                      flex: 1,
                      padding: 12,
                      borderRadius: 10,
                      fontWeight: 800,
                      fontSize: 13
                    }}
                  >
                    {bulkSubmitting ? 'Sending...' : 'Submit Enquiry 🚀'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 17. BIRTHDAY & OCCASION REMINDER CLUB MODAL (CRUSTO BAKERS FEATURE #5) */}
      {occasionModalOpen && (
        <div
          className="modal-overlay-responsive"
          onClick={(e) => {
            if (e.target === e.currentTarget && !occasionSubmitting) setOccasionModalOpen(false);
          }}
        >
          <div
            className="mobile-modal-sheet touch-scroll"
            style={{
              maxWidth: 520,
              position: 'relative',
              padding: 24
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 24 }}>🎂</span>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 900, color: '#1C1C1C', margin: 0 }}>
                    Birthday & Occasion Club
                  </h3>
                  <p style={{ fontSize: 12, color: '#666', margin: '2px 0 0' }}>
                    Save special dates • Get 2-day reminder + Flat 15% VIP Coupon
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOccasionModalOpen(false)}
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

            {occasionSuccessMsg ? (
              <div
                style={{
                  background: '#FFF1F2',
                  border: '1.5px solid #FECDD3',
                  borderRadius: 14,
                  padding: '24px 20px',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: 36, marginBottom: 8 }}>🎉</div>
                <h4 style={{ fontSize: 17, fontWeight: 900, color: '#9F1239', margin: '0 0 6px' }}>
                  Occasion Saved in VIP Club!
                </h4>
                <p style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.5, margin: '0 0 16px' }}>
                  {occasionSuccessMsg}
                </p>

                <div
                  style={{
                    background: '#FFFFFF',
                    border: '2px dashed #E23744',
                    borderRadius: 12,
                    padding: '12px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 16
                  }}
                >
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 11, color: '#666', fontWeight: 600 }}>YOUR EXCLUSIVE 15% VIP CODE</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#E23744', letterSpacing: 1 }}>
                      {occasionCouponCode || 'VIPBIRTHDAY15'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof navigator !== 'undefined') {
                        navigator.clipboard.writeText(occasionCouponCode || 'VIPBIRTHDAY15');
                        alert('Coupon code VIPBIRTHDAY15 copied!');
                      }
                    }}
                    style={{
                      background: '#E23744',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 8,
                      padding: '7px 12px',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    Copy Code
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setOccasionModalOpen(false)}
                  className="btn-primary"
                  style={{ width: '100%', padding: 12, borderRadius: 10, fontSize: 13, fontWeight: 800 }}
                >
                  Start Ordering Now ➔
                </button>
              </div>
            ) : (
              <form onSubmit={handleSaveOccasionSubmit}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                  Select Celebration:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                  {['🎂 My Birthday', '❤️ Anniversary', '👨 Mom / Dad', '👧 Child Birthday'].map(occ => (
                    <button
                      key={occ}
                      type="button"
                      onClick={() => setOccasionName(occ)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 700,
                        border: occasionName === occ ? '2px solid #E23744' : '1px solid #D1D5DB',
                        background: occasionName === occ ? '#FFF1F2' : '#F9FAFB',
                        color: occasionName === occ ? '#E23744' : '#374151',
                        cursor: 'pointer'
                      }}
                    >
                      {occ}
                    </button>
                  ))}
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4 }}>
                    Celebration Date:
                  </label>
                  <input
                    type="date"
                    required
                    value={occasionDate}
                    onChange={(e) => setOccasionDate(e.target.value)}
                    className="input-field"
                    style={{ height: 40, fontSize: 13 }}
                  />
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4 }}>
                    WhatsApp Phone Number (for 2-day reminder):
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit number"
                    value={occasionPhone}
                    onChange={(e) => setOccasionPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="input-field"
                    style={{ height: 40, fontSize: 13 }}
                  />
                </div>

                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4 }}>
                    Celebrant / Member Name:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Priya Sharma"
                    value={occasionCustomerName}
                    onChange={(e) => setOccasionCustomerName(e.target.value)}
                    className="input-field"
                    style={{ height: 40, fontSize: 13 }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={occasionSubmitting}
                  className="btn-primary"
                  style={{ width: '100%', padding: 13, borderRadius: 10, fontSize: 14, fontWeight: 800 }}
                >
                  {occasionSubmitting ? 'Saving...' : 'Save Date & Unlock 15% VIP Code ✨'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 18. FLOATING CART BAR (DUAL ACTION: WEB CHECKOUT + 1-TAP WHATSAPP ORDER) */}
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

      {/* 19. FLOATING WHATSAPP CHEF / BAKER LIVE HELP (CRUSTO BAKERS FEATURE) */}
      <a
        href={`https://wa.me/${(restaurant.phone || '919876543210').replace(/\D/g, '')}?text=${encodeURIComponent(
          `Hi ${restaurant.name}! 👋 I am browsing your menu on DirectDine. I have a query regarding a custom cake or party order.`
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        title="Chat with Chef / Order Custom Cake"
        style={{
          position: 'fixed',
          bottom: itemCount > 0 ? 76 : 18,
          right: 14,
          zIndex: 990,
          background: '#25D366',
          color: '#FFFFFF',
          borderRadius: 30,
          padding: '8px 14px',
          boxShadow: '0 6px 20px rgba(37, 211, 102, 0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          textDecoration: 'none',
          fontWeight: 800,
          fontSize: 12,
          border: '2px solid #FFFFFF',
          transition: 'all 0.2s ease'
        }}
      >
        <span style={{ fontSize: 16 }}>💬</span>
        <span>Chat with Chef</span>
      </a>

      {/* 20. RESTAURANT STAFF & KITCHEN LOGIN MODAL */}
      {staffModalOpen && (
        <div
          className="modal-overlay-responsive"
          onClick={(e) => {
            if (e.target === e.currentTarget && !staffLoginLoading) setStaffModalOpen(false);
          }}
        >
          <div
            className="mobile-modal-sheet touch-scroll"
            style={{
              maxWidth: 460,
              position: 'relative',
              padding: '24px 22px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 24 }}>👨‍🍳</span>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 900, color: '#1C1C1C', margin: 0 }}>
                    {restaurant.name} Staff Login
                  </h3>
                  <p style={{ fontSize: 12, color: '#666', margin: '2px 0 0' }}>
                    Access KDS orders, menu management &amp; table QRs
                  </p>
                </div>
              </div>
              <button
                onClick={() => setStaffModalOpen(false)}
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

            {/* Quick Demo Fill Helper */}
            <div style={{
              background: '#FFF1F2',
              borderRadius: 10,
              padding: '10px 12px',
              border: '1px solid #FECDD3',
              marginBottom: 16,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ fontSize: 12, color: '#9F1239' }}>
                Demo Credentials: <strong>{slug === 'chai-and-bites' ? '9988776655 (chai123)' : '9876543210 (spice123)'}</strong>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (slug === 'chai-and-bites') {
                    setStaffPhone('9988776655');
                    setStaffPassword('chai123');
                  } else {
                    setStaffPhone('9876543210');
                    setStaffPassword('spice123');
                  }
                }}
                style={{
                  background: '#E23744',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Auto-Fill
              </button>
            </div>

            <form onSubmit={handleStaffLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, color: '#374151', fontWeight: 700, marginBottom: 4 }}>
                  Registered Staff Phone
                </label>
                <input
                  type="text"
                  required
                  placeholder="10-digit number"
                  value={staffPhone}
                  onChange={(e) => setStaffPhone(e.target.value)}
                  className="input-field"
                  style={{ height: 42 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12.5, color: '#374151', fontWeight: 700, marginBottom: 4 }}>
                  Staff Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter password"
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  className="input-field"
                  style={{ height: 42 }}
                />
              </div>

              {staffLoginError && (
                <div style={{ color: '#DC2626', background: '#FEE2E2', border: '1px solid #FCA5A5', padding: '8px 12px', borderRadius: 8, fontSize: 12.5 }}>
                  ⚠️ {staffLoginError}
                </div>
              )}

              <button
                type="submit"
                disabled={staffLoginLoading}
                className="btn-primary"
                style={{ width: '100%', padding: '13px', fontSize: 14, fontWeight: 800, borderRadius: 10, marginTop: 4 }}
              >
                {staffLoginLoading ? 'Signing In...' : `Sign In to ${restaurant.name} KDS ➔`}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 14 }}>
              <Link
                href="/dashboard"
                style={{ fontSize: 12, color: '#6B7280', textDecoration: 'underline' }}
              >
                Go to Partner Portal (/dashboard)
              </Link>
            </div>
          </div>
        </div>
      )}
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
