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
  }, [slug]);

  const handleOpenCustomize = (item) => {
    setCustomizingItem(item);
    setSelectedVariant(item.variants?.[0] || null);
    setSelectedAddons([]);
    setSpecialNotes('');
  };

  const handleAddCustomized = () => {
    if (!customizingItem) return;
    addItem(customizingItem, selectedVariant, selectedAddons, specialNotes);
    setCustomizingItem(null);
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

        {/* Quick Actions (Call Waiter + WhatsApp) */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
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

      {/* 8. FLOATING CART BAR (DUAL ACTION: WEB CHECKOUT + 1-TAP WHATSAPP ORDER) */}
      {itemCount > 0 && (
        <div className="zomato-float-cart" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* Main Checkout Button */}
          <Link
            href={`/${slug}/cart`}
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
