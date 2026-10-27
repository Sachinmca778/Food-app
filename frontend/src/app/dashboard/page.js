'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { fetchAPI } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { FOOD_PRESETS, getFoodImageUrl } from '@/lib/foodImages';

export default function RestaurantDashboardPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Dashboard State
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'menu', 'customers', 'analytics'
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedMenuCategory, setSelectedMenuCategory] = useState('all');
  const [menuSearchQuery, setMenuSearchQuery] = useState('');
  const [customers, setCustomers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);

  // Photo Upload Modal State
  const [photoModalItem, setPhotoModalItem] = useState(null);
  const [uploadTab, setUploadTab] = useState('device'); // 'device', 'presets', 'url'
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState('');
  const [devicePhotoData, setDevicePhotoData] = useState(null); // { base64, name, size }
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);
  const [photoSaveToast, setPhotoSaveToast] = useState('');
  const fileInputRef = useRef(null);

  // Add New Dish Modal State
  const [showAddDishModal, setShowAddDishModal] = useState(false);
  const [newDishName, setNewDishName] = useState('');
  const [newDishCategory, setNewDishCategory] = useState('');
  const [newDishPrice, setNewDishPrice] = useState('');
  const [newDishVegType, setNewDishVegType] = useState('veg');
  const [newDishDescription, setNewDishDescription] = useState('');
  const [newDishPhotoUrl, setNewDishPhotoUrl] = useState('');
  const [isCreatingDish, setIsCreatingDish] = useState(false);


  // Audio alerts toggle
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Filter orders by status
  const [orderFilter, setOrderFilter] = useState('all');

  // Modal actions
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [actionType, setActionType] = useState(null); // 'accept', 'reject', 'dispatch'
  const [prepTime, setPrepTime] = useState(25);
  const [rejectReason, setRejectReason] = useState('');
  const [riderName, setRiderName] = useState('');
  const [riderPhone, setRiderPhone] = useState('');

  // New incoming order notification banner
  const [incomingAlert, setIncomingAlert] = useState(null);

  // Check login token
  useEffect(() => {
    const token = localStorage.getItem('staff_token');
    const savedRest = localStorage.getItem('staff_restaurant');
    if (token) {
      setIsLoggedIn(true);
      if (savedRest) {
        try {
          setRestaurant(JSON.parse(savedRest));
        } catch (e) {}
      }
      loadDashboardData();
    } else {
      setLoading(false);
    }
  }, []);

  // WebSockets for real-time dashboard events
  useEffect(() => {
    if (!isLoggedIn) return;
    const socket = getSocket();
    if (!socket) return;

    if (restaurant?.id) {
      socket.emit('join:restaurant', restaurant.id);
    }

    // New order notification
    socket.on('order:new', (data) => {
      setIncomingAlert(data);
      if (soundEnabled) {
        try {
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
          audio.play().catch(() => {});
        } catch (e) {}
      }
      loadOrders();
    });

    socket.on('order:update', () => {
      loadOrders();
    });

    return () => {
      if (restaurant?.id) socket.emit('leave:restaurant', restaurant.id);
    };
  }, [isLoggedIn, restaurant?.id, soundEnabled]);

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await fetchAPI('/dashboard/login', {
        method: 'POST',
        body: JSON.stringify({ phone: loginPhone, password: loginPassword })
      });

      if (res.token) {
        localStorage.setItem('staff_token', res.token);
        const restObj = res.restaurant || { name: 'Spice Garden', slug: 'spice-garden' };
        localStorage.setItem('staff_restaurant', JSON.stringify(restObj));
        setRestaurant(restObj);
        setIsLoggedIn(true);
        loadDashboardData();
      } else {
        setLoginError(res.error || 'Login failed');
      }
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('staff_token');
    localStorage.removeItem('staff_restaurant');
    setIsLoggedIn(false);
  };

  const loadDashboardData = async () => {
    setLoading(true);
    await Promise.all([loadOrders(), loadMenu(), loadCustomers(), loadAnalytics()]);
    setLoading(false);
  };

  const loadOrders = async () => {
    try {
      const res = await fetchAPI('/dashboard/orders');
      if (res.success) setOrders(res.orders || []);
    } catch (e) {}
  };

  const loadMenu = async () => {
    try {
      const res = await fetchAPI('/dashboard/menu');
      if (res.success) {
        setMenuItems(res.items || []);
        setCategories(res.categories || []);
        if (res.categories?.length > 0) {
          setNewDishCategory(prev => prev || res.categories[0].id);
        }
      }
    } catch (e) {}
  };

  const handleOpenPhotoModal = (item) => {
    setPhotoModalItem(item);
    setSelectedPhotoUrl(item.image_url || '');
    setDevicePhotoData(null);
    setUploadTab('device');
    setPhotoSaveToast('');
  };

  const handleDeviceFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      alert('Photo is too large. Please select a photo under 20MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result;
      setDevicePhotoData({
        base64,
        name: file.name,
        size: (file.size / 1024).toFixed(0) + ' KB'
      });
      setSelectedPhotoUrl(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSavePhoto = async () => {
    if (!photoModalItem) return;
    setIsSavingPhoto(true);
    setPhotoSaveToast('');

    try {
      let finalImageUrl = selectedPhotoUrl;

      // If user selected a local file from device, upload it to server first
      if (devicePhotoData?.base64) {
        const uploadRes = await fetchAPI('/dashboard/upload', {
          method: 'POST',
          body: JSON.stringify({ imageBase64: devicePhotoData.base64 })
        });
        if (uploadRes.success && uploadRes.url) {
          finalImageUrl = uploadRes.url;
        } else {
          throw new Error(uploadRes.error || 'Failed to upload photo to server');
        }
      }

      if (!finalImageUrl) {
        throw new Error('Please select or upload a photo');
      }

      // Update the dish photo in database
      const res = await fetchAPI(`/dashboard/menu/item/${photoModalItem.id}/photo`, {
        method: 'PUT',
        body: JSON.stringify({ imageUrl: finalImageUrl })
      });

      if (res.success) {
        // Update local state immediately
        setMenuItems(prev => prev.map(item => 
          item.id === photoModalItem.id ? { ...item, image_url: finalImageUrl } : item
        ));
        setPhotoSaveToast('Food photo saved successfully! ✨');
        setTimeout(() => {
          setPhotoModalItem(null);
          setPhotoSaveToast('');
        }, 1000);
      } else {
        alert(res.error || 'Failed to update photo');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSavingPhoto(false);
    }
  };

  const handleCreateNewDish = async (e) => {
    if (e) e.preventDefault();
    if (!newDishName.trim()) {
      alert('Please enter dish name');
      return;
    }
    if (!newDishPrice || Number(newDishPrice) <= 0) {
      alert('Please enter a valid price');
      return;
    }
    if (!newDishCategory) {
      alert('Please select a category');
      return;
    }

    setIsCreatingDish(true);
    try {
      let finalImageUrl = newDishPhotoUrl;

      // If user uploaded a file for the new dish
      if (devicePhotoData?.base64) {
        const uploadRes = await fetchAPI('/dashboard/upload', {
          method: 'POST',
          body: JSON.stringify({ imageBase64: devicePhotoData.base64 })
        });
        if (uploadRes.success && uploadRes.url) {
          finalImageUrl = uploadRes.url;
        }
      }

      const res = await fetchAPI('/dashboard/menu/item', {
        method: 'POST',
        body: JSON.stringify({
          categoryId: newDishCategory,
          name: newDishName.trim(),
          description: newDishDescription.trim() || null,
          basePricePaise: Math.round(Number(newDishPrice) * 100),
          vegType: newDishVegType,
          imageUrl: finalImageUrl || null
        })
      });

      if (res.success) {
        await loadMenu();
        setShowAddDishModal(false);
        setNewDishName('');
        setNewDishPrice('');
        setNewDishDescription('');
        setNewDishPhotoUrl('');
        setDevicePhotoData(null);
        alert('New dish added successfully! 🎉');
      } else {
        alert(res.error || 'Failed to add dish');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setIsCreatingDish(false);
    }
  };


  const loadCustomers = async () => {
    try {
      const res = await fetchAPI('/dashboard/customers');
      if (res.success) setCustomers(res.customers || []);
    } catch (e) {}
  };

  const loadAnalytics = async () => {
    try {
      const res = await fetchAPI('/dashboard/analytics');
      if (res.success) setAnalytics(res.analytics);
    } catch (e) {}
  };

  const handleUpdateStatus = async (orderId, newStatus, extra = {}) => {
    try {
      const res = await fetchAPI(`/dashboard/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus, ...extra })
      });
      if (res.success) {
        setSelectedOrder(null);
        setActionType(null);
        loadOrders();
      } else {
        alert(res.error || 'Failed to update order');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleItemAvailable = async (itemId, currentVal) => {
    try {
      const res = await fetchAPI(`/dashboard/menu/${itemId}/availability`, {
        method: 'PATCH',
        body: JSON.stringify({ is_available: !currentVal })
      });
      if (res.success) {
        setMenuItems(prev => prev.map(item => item.id === itemId ? { ...item, is_available: !currentVal } : item));
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleRestaurantOpen = async () => {
    if (!restaurant) return;
    const newIsOpen = !restaurant.is_open;
    try {
      const res = await fetchAPI('/dashboard/settings', {
        method: 'PATCH',
        body: JSON.stringify({ is_open: newIsOpen })
      });
      if (res.success) {
        const updated = { ...restaurant, is_open: newIsOpen };
        setRestaurant(updated);
        localStorage.setItem('staff_restaurant', JSON.stringify(updated));
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // ORDER FILTERING
  const filteredOrders = orders.filter(order => {
    if (orderFilter === 'action_needed') return ['placed', 'paid'].includes(order.status);
    if (orderFilter === 'in_kitchen') return ['accepted', 'preparing'].includes(order.status);
    if (orderFilter === 'ready') return order.status === 'ready';
    if (orderFilter === 'out_for_delivery') return order.status === 'out_for_delivery';
    if (orderFilter === 'completed') return ['delivered', 'cancelled', 'rejected', 'expired'].includes(order.status);
    return true;
  });

  const actionNeededCount = orders.filter(o => ['placed', 'paid'].includes(o.status)).length;

  // LOGIN SCREEN (CLEAN WHITE)
  if (!isLoggedIn) {
    return (
      <div style={{ maxWidth: 420, margin: '60px auto', padding: '0 16px' }}>
        <div style={{ background: '#FFFFFF', padding: '36px 28px', border: '1px solid #E3E5EB', borderRadius: 20, boxShadow: 'var(--shadow-md)' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: 12,
              background: 'var(--primary)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
              margin: '0 auto 12px',
              boxShadow: '0 4px 14px var(--primary-glow)'
            }}>
              👨‍🍳
            </div>
            <h1 style={{ fontSize: 22, color: '#1C1C1C' }}>Restaurant Partner Portal</h1>
            <p style={{ color: '#696969', fontSize: 13, marginTop: 4 }}>
              Kitchen dashboard & direct store operations
            </p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, color: '#4F4F4F', fontWeight: 600, marginBottom: 5 }}>
                Registered Mobile Number
              </label>
              <input
                type="text"
                placeholder="10-digit phone number"
                value={loginPhone}
                onChange={(e) => setLoginPhone(e.target.value)}
                className="input-field"
                required
                style={{ height: 42 }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12.5, color: '#4F4F4F', fontWeight: 600, marginBottom: 5 }}>
                Staff Password
              </label>
              <input
                type="password"
                placeholder="Enter password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="input-field"
                required
                style={{ height: 42 }}
              />
            </div>

            {loginError && (
              <div style={{ color: 'var(--status-cancel)', fontSize: 13, background: '#FEECEE', padding: '8px 12px', borderRadius: 8 }}>
                ⚠️ {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: 14, marginTop: 4, borderRadius: 10 }}
            >
              {loginLoading ? 'Authenticating...' : 'Sign In to Kitchen Dashboard'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', maxWidth: 1180, margin: '0 auto' }}>
      {/* CRISP WHITE TOPBAR */}
      <header style={{
        margin: '14px 14px 16px',
        padding: '12px 20px',
        background: '#FFFFFF',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
        borderRadius: 14,
        border: '1px solid #ECEEF2',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: 'var(--primary)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20
          }}>
            🍲
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ fontSize: 18, color: '#1C1C1C' }}>{restaurant?.name || 'Spice Garden'}</h1>
              <span style={{ fontSize: 10.5, background: '#FFF1F2', color: 'var(--primary)', padding: '2px 7px', borderRadius: 4, fontWeight: 800 }}>
                PARTNER PORTAL
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 1, fontSize: 12 }}>
              <span style={{ color: '#696969' }}>/{restaurant?.slug || 'spice-garden'}</span>
              <a href={`/${restaurant?.slug || 'spice-garden'}`} target="_blank" style={{ color: 'var(--primary)', fontWeight: 700 }}>
                Open Storefront ↗
              </a>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Sound Alert Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              fontSize: 12,
              fontWeight: 700,
              background: soundEnabled ? '#FFF1F2' : '#F4F5F8',
              color: soundEnabled ? 'var(--primary)' : '#696969',
              border: `1px solid ${soundEnabled ? '#FBCED2' : '#E3E5EB'}`,
              display: 'flex',
              alignItems: 'center',
              gap: 5
            }}
          >
            {soundEnabled ? '🔔 Sound On' : '🔕 Muted'}
          </button>

          {/* Open/Close Toggle */}
          <button
            onClick={handleToggleRestaurantOpen}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: 12.5,
              fontWeight: 700,
              background: restaurant?.is_open ? '#EDF8F0' : '#FEECEE',
              color: restaurant?.is_open ? '#24963F' : '#E23744',
              border: `1px solid ${restaurant?.is_open ? '#A7E3B6' : '#FBCED2'}`,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: restaurant?.is_open ? '#24963F' : '#E23744' }} />
            {restaurant?.is_open ? 'Accepting Orders' : 'Store Offline'}
          </button>

          <button
            onClick={handleLogout}
            style={{ background: '#F4F5F8', color: '#4F4F4F', padding: '6px 12px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, border: '1px solid #E3E5EB' }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* NEW INCOMING ORDER PULSING BANNER */}
      {incomingAlert && (
        <div style={{
          margin: '0 14px 14px',
          background: 'var(--primary)',
          color: '#FFFFFF',
          padding: '14px 20px',
          borderRadius: 12,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 4px 16px var(--primary-glow)',
          animation: 'pulse-ring 2s infinite'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 28 }}>🔔</span>
            <div>
              <div style={{ fontSize: 17, fontWeight: 900 }}>New Order #{incomingAlert.orderNo} Placed!</div>
              <div style={{ fontSize: 12.5 }}>Total: ₹{(incomingAlert.total / 100).toFixed(0)} • Method: {incomingAlert.type?.toUpperCase()}</div>
            </div>
          </div>
          <button
            onClick={() => { setIncomingAlert(null); setActiveTab('orders'); setOrderFilter('action_needed'); }}
            style={{ background: '#FFFFFF', color: 'var(--primary)', fontWeight: 900, padding: '8px 18px', borderRadius: 8, fontSize: 13 }}
          >
            Accept Now ➔
          </button>
        </div>
      )}

      {/* NAVIGATION TABS (CLEAN WHITE) */}
      <div style={{ padding: '0 14px', display: 'flex', gap: 6, borderBottom: '1px solid #ECEEF2', marginBottom: 18, overflowX: 'auto', background: '#FFFFFF' }}>
        <button
          onClick={() => setActiveTab('orders')}
          style={{
            padding: '12px 18px',
            borderBottom: activeTab === 'orders' ? '2.5px solid var(--primary)' : '2.5px solid transparent',
            color: activeTab === 'orders' ? 'var(--primary)' : '#696969',
            fontWeight: 800,
            fontSize: 14,
            background: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <span>🛎️ Live Orders</span>
          {actionNeededCount > 0 && (
            <span style={{ background: 'var(--primary)', color: '#FFFFFF', borderRadius: 'var(--radius-full)', padding: '2px 8px', fontSize: 11, fontWeight: 900 }}>
              {actionNeededCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('menu')}
          style={{
            padding: '12px 18px',
            borderBottom: activeTab === 'menu' ? '2.5px solid var(--primary)' : '2.5px solid transparent',
            color: activeTab === 'menu' ? 'var(--primary)' : '#696969',
            fontWeight: 800,
            fontSize: 14,
            background: 'none'
          }}
        >
          📋 Menu & Stock (86)
        </button>

        <button
          onClick={() => setActiveTab('customers')}
          style={{
            padding: '12px 18px',
            borderBottom: activeTab === 'customers' ? '2.5px solid var(--primary)' : '2.5px solid transparent',
            color: activeTab === 'customers' ? 'var(--primary)' : '#696969',
            fontWeight: 800,
            fontSize: 14,
            background: 'none'
          }}
        >
          👥 Customer CRM
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          style={{
            padding: '12px 18px',
            borderBottom: activeTab === 'analytics' ? '2.5px solid var(--primary)' : '2.5px solid transparent',
            color: activeTab === 'analytics' ? 'var(--primary)' : '#696969',
            fontWeight: 800,
            fontSize: 14,
            background: 'none'
          }}
        >
          📊 Revenue & Analytics
        </button>
      </div>

      {/* TAB CONTENT */}
      <main style={{ flex: 1, padding: '0 14px 50px' }}>
        {/* ===================== ORDERS TAB ===================== */}
        {activeTab === 'orders' && (
          <div>
            {/* Status Filters */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: 'All Orders' },
                { id: 'action_needed', label: `Action Needed (${actionNeededCount})` },
                { id: 'in_kitchen', label: 'In Kitchen' },
                { id: 'ready', label: 'Ready for Dispatch' },
                { id: 'out_for_delivery', label: 'Out for Delivery' },
                { id: 'completed', label: 'Delivered / History' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setOrderFilter(f.id)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 8,
                    fontSize: 12.5,
                    fontWeight: 700,
                    background: orderFilter === f.id ? 'var(--primary)' : '#FFFFFF',
                    color: orderFilter === f.id ? '#FFFFFF' : '#4F4F4F',
                    border: orderFilter === f.id ? 'none' : '1px solid #E3E5EB',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'all 0.18s ease'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {filteredOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#696969', background: '#FFFFFF', borderRadius: 14, border: '1px solid #ECEEF2' }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>📦</div>
                <p style={{ fontSize: 16, color: '#1C1C1C', fontWeight: 700 }}>No orders in this view</p>
                <p style={{ fontSize: 13, marginTop: 4 }}>New customer orders placed online or via WhatsApp will appear here in real-time.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
                {filteredOrders.map(order => {
                  const isPending = ['placed', 'paid'].includes(order.status);

                  return (
                    <div
                      key={order.id}
                      style={{
                        background: '#FFFFFF',
                        borderRadius: 14,
                        padding: 18,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        border: isPending ? '1.5px solid var(--primary)' : '1px solid #ECEEF2',
                        borderLeft: isPending ? '5px solid var(--primary)' : '1px solid #ECEEF2',
                        boxShadow: 'var(--shadow-sm)'
                      }}
                    >
                      <div>
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                          <div>
                            <span style={{ fontSize: 16, fontWeight: 900, color: '#1C1C1C' }}>Order #{order.order_no}</span>
                            <span style={{ marginLeft: 6, fontSize: 11, textTransform: 'uppercase', background: '#F4F5F8', color: '#4F4F4F', padding: '2px 7px', borderRadius: 4, fontWeight: 700 }}>
                              {order.order_type}
                            </span>
                          </div>
                          <span style={{
                            fontSize: 11.5,
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: 6,
                            background: order.status === 'delivered' ? '#EDF8F0' :
                              order.status === 'out_for_delivery' ? '#F0F9FF' :
                              order.status === 'preparing' ? '#EFF6FF' :
                              isPending ? '#FFF1F2' : '#F4F5F8',
                            color: order.status === 'delivered' ? '#24963F' :
                              order.status === 'out_for_delivery' ? '#0284C7' :
                              order.status === 'preparing' ? '#2563EB' :
                              isPending ? 'var(--primary)' : '#4F4F4F'
                          }}>
                            {order.status.toUpperCase()}
                          </span>
                        </div>

                        {/* Customer & Address */}
                        <div style={{ fontSize: 13, color: '#4F4F4F', marginBottom: 12 }}>
                          <div>👤 <strong style={{ color: '#1C1C1C' }}>{order.customer_name || 'Customer'}</strong> • 📱 {order.delivery_phone || order.customer_phone}</div>
                          {order.delivery_address && (
                            <div style={{ marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#696969' }}>
                              📍 {order.delivery_address.address_line}
                            </div>
                          )}
                        </div>

                        {/* Total & Payment method */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 800, borderTop: '1px solid #F0F1F4', paddingTop: 8, marginBottom: 14 }}>
                          <span style={{ color: '#1C1C1C' }}>Total: ₹{(order.total_paise / 100).toFixed(0)}</span>
                          <span style={{ color: '#696969', fontWeight: 600, fontSize: 12 }}>{order.payment_method?.toUpperCase()}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {isPending && (
                          <>
                            <button
                              onClick={() => { setSelectedOrder(order); setActionType('accept'); }}
                              className="btn-primary"
                              style={{ flex: 1, padding: '9px 12px', fontSize: 13, borderRadius: 8 }}
                            >
                              ✓ Accept Order
                            </button>
                            <button
                              onClick={() => { setSelectedOrder(order); setActionType('reject'); }}
                              style={{ background: '#FFF1F2', color: 'var(--status-cancel)', border: '1px solid #FBCED2', padding: '9px 12px', borderRadius: 8, fontSize: 13, fontWeight: 700 }}
                            >
                              ✕ Reject
                            </button>
                          </>
                        )}

                        {order.status === 'accepted' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'preparing')}
                            className="btn-primary"
                            style={{ width: '100%', padding: '9px 12px', fontSize: 13, borderRadius: 8 }}
                          >
                            🍳 Start Cooking
                          </button>
                        )}

                        {order.status === 'preparing' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'ready')}
                            className="btn-primary"
                            style={{ width: '100%', padding: '9px 12px', fontSize: 13, borderRadius: 8 }}
                          >
                            📦 Mark Ready for Pickup
                          </button>
                        )}

                        {order.status === 'ready' && (
                          order.order_type === 'delivery' ? (
                            <button
                              onClick={() => { setSelectedOrder(order); setActionType('dispatch'); }}
                              className="btn-primary"
                              style={{ width: '100%', padding: '9px 12px', fontSize: 13, borderRadius: 8 }}
                            >
                              🛵 Dispatch / Assign Rider
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'delivered')}
                              className="btn-primary"
                              style={{ width: '100%', padding: '9px 12px', fontSize: 13, borderRadius: 8 }}
                            >
                              ✓ Hand Over to Customer
                            </button>
                          )
                        )}

                        {order.status === 'out_for_delivery' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'delivered')}
                            className="btn-primary"
                            style={{ width: '100%', padding: '9px 12px', fontSize: 13, background: 'var(--veg-color)', borderRadius: 8 }}
                          >
                            ✓ Mark Delivered
                          </button>
                        )}

                        <Link
                          href={`/track/${order.public_token}`}
                          target="_blank"
                          style={{ width: '100%', textAlign: 'center', fontSize: 12, color: '#696969', padding: '3px 0' }}
                        >
                          View Customer Live Tracker ↗
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ===================== MENU MANAGEMENT TAB ===================== */}
        {activeTab === 'menu' && (
          <div>
            {/* Top Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ fontSize: 20, color: '#1C1C1C', fontWeight: 800 }}>Menu Items & Food Pictures ({menuItems.length})</h2>
                <p style={{ fontSize: 13, color: '#696969' }}>Upload delicious food photos, customize pictures, and toggle stock in real-time</p>
              </div>

              <button
                onClick={() => setShowAddDishModal(true)}
                className="btn-primary"
                style={{ padding: '9px 18px', fontSize: 13.5, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <span>➕</span> Add New Dish
              </button>
            </div>

            {/* Category Filter Pills & Search */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="🔍 Search dish by name..."
                value={menuSearchQuery}
                onChange={(e) => setMenuSearchQuery(e.target.value)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid #D1D7DB',
                  background: '#FFFFFF',
                  fontSize: 13,
                  minWidth: 220,
                  outline: 'none'
                }}
              />

              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
                <button
                  onClick={() => setSelectedMenuCategory('all')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: 12.5,
                    fontWeight: 700,
                    background: selectedMenuCategory === 'all' ? '#1C1C1C' : '#FFFFFF',
                    color: selectedMenuCategory === 'all' ? '#FFFFFF' : '#4F4F4F',
                    border: '1px solid #D1D7DB',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  All ({menuItems.length})
                </button>
                {categories.map(cat => {
                  const count = menuItems.filter(i => i.category_id === cat.id).length;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedMenuCategory(cat.id)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: 12.5,
                        fontWeight: 700,
                        background: selectedMenuCategory === cat.id ? 'var(--primary)' : '#FFFFFF',
                        color: selectedMenuCategory === cat.id ? '#FFFFFF' : '#4F4F4F',
                        border: selectedMenuCategory === cat.id ? '1px solid var(--primary)' : '1px solid #D1D7DB',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {cat.name} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Menu Items Grid / List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {menuItems
                .filter(item => {
                  if (selectedMenuCategory !== 'all' && item.category_id !== selectedMenuCategory) return false;
                  if (menuSearchQuery && !item.name.toLowerCase().includes(menuSearchQuery.toLowerCase())) return false;
                  return true;
                })
                .map(item => {
                  const isCustom = Boolean(item.image_url && item.image_url.trim().length > 5);
                  return (
                    <div
                      key={item.id}
                      style={{
                        background: '#FFFFFF',
                        padding: '14px 18px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        opacity: item.is_available ? 1 : 0.7,
                        borderRadius: 14,
                        border: '1px solid #ECEEF2',
                        boxShadow: 'var(--shadow-sm)',
                        flexWrap: 'wrap',
                        gap: 12
                      }}
                    >
                      {/* Left: Food Photo + Details */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ position: 'relative', width: 68, height: 68, flexShrink: 0 }}>
                          <img
                            src={getFoodImageUrl(item)}
                            alt={item.name}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = item.veg_type === 'veg'
                                ? 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&auto=format&fit=crop&q=80'
                                : 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&auto=format&fit=crop&q=80';
                            }}
                            style={{
                              width: '100%',
                              height: '100%',
                              borderRadius: 12,
                              objectFit: 'cover',
                              border: '1.5px solid #E8EBF0',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.06)'
                            }}
                          />
                          {isCustom && (
                            <span
                              title="Custom photo uploaded"
                              style={{
                                position: 'absolute',
                                top: -4,
                                right: -4,
                                background: '#24963F',
                                color: '#FFFFFF',
                                fontSize: 9,
                                fontWeight: 800,
                                borderRadius: '50%',
                                width: 16,
                                height: 16,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1.5px solid #FFFFFF'
                              }}
                            >
                              ✓
                            </span>
                          )}
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className={item.veg_type === 'veg' ? 'badge-veg' : 'badge-nonveg'} />
                            <div style={{ fontWeight: 700, fontSize: 16, color: '#1C1C1C' }}>{item.name}</div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                            <span style={{ fontSize: 14, color: 'var(--primary)', fontWeight: 800 }}>
                              ₹{(item.base_price_paise / 100).toFixed(0)}
                            </span>
                            <span style={{ fontSize: 11.5, color: '#828282' }}>•</span>
                            <span style={{ fontSize: 11.5, color: '#828282' }}>
                              {categories.find(c => c.id === item.category_id)?.name || 'General'}
                            </span>
                            <span style={{ fontSize: 11.5, color: '#828282' }}>•</span>
                            <span style={{ fontSize: 11, color: isCustom ? '#24963F' : '#696969', fontWeight: 600 }}>
                              {isCustom ? '📷 Custom Photo' : '✨ Smart Default Photo'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <button
                          onClick={() => handleOpenPhotoModal(item)}
                          style={{
                            padding: '8px 14px',
                            borderRadius: 8,
                            fontSize: 12.5,
                            fontWeight: 700,
                            background: '#FFFFFF',
                            color: '#1C1C1C',
                            border: '1.5px solid #D1D7DB',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6
                          }}
                        >
                          <span>📷</span> {isCustom ? 'Change Photo' : 'Upload Photo'}
                        </button>

                        <button
                          onClick={() => handleToggleItemAvailable(item.id, item.is_available)}
                          style={{
                            padding: '8px 14px',
                            borderRadius: 8,
                            fontSize: 12.5,
                            fontWeight: 800,
                            background: item.is_available ? '#EDF8F0' : '#FEECEE',
                            color: item.is_available ? '#24963F' : '#E23744',
                            border: `1.5px solid ${item.is_available ? '#A7E3B6' : '#FBCED2'}`,
                            cursor: 'pointer'
                          }}
                        >
                          {item.is_available ? '✓ In Stock' : '✕ Sold Out (86)'}
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}


        {/* ===================== CUSTOMERS CRM TAB ===================== */}
        {activeTab === 'customers' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 18, color: '#1C1C1C' }}>Direct Customer CRM ({customers.length})</h2>
                <p style={{ fontSize: 12.5, color: '#696969' }}>Zero aggregator lock-in. Full phone numbers and loyalty profiles.</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
              {customers.map(c => (
                <div key={c.id} style={{ background: '#FFFFFF', padding: 18, borderRadius: 14, border: '1px solid #ECEEF2', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: '#1C1C1C' }}>{c.name || 'Loyal Customer'}</div>
                    <span style={{ background: '#FFF1F2', color: 'var(--primary)', padding: '2px 8px', borderRadius: 4, fontSize: 11.5, fontWeight: 800 }}>
                      🪙 {c.loyalty_points || 0} pts
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: '#696969', marginBottom: 12 }}>
                    📱 {c.phone}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, borderTop: '1px solid #F0F1F4', paddingTop: 10, color: '#4F4F4F' }}>
                    <span>Total Orders: <strong style={{ color: '#1C1C1C' }}>{c.total_orders || 1}</strong></span>
                    <span>Total Spent: <strong style={{ color: 'var(--primary)' }}>₹{((c.total_spent_paise || 0) / 100).toFixed(0)}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================== ANALYTICS TAB ===================== */}
        {activeTab === 'analytics' && (
          <div>
            <h2 style={{ fontSize: 18, color: '#1C1C1C', marginBottom: 16 }}>Business & Revenue Performance</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
              <div style={{ background: '#FFFFFF', padding: 20, borderRadius: 14, border: '1px solid #ECEEF2', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ color: '#696969', fontSize: 12, marginBottom: 6, fontWeight: 600 }}>Today's Revenue</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--primary)' }}>
                  ₹{((analytics?.today_sales_paise || 124000) / 100).toFixed(0)}
                </div>
              </div>

              <div style={{ background: '#FFFFFF', padding: 20, borderRadius: 14, border: '1px solid #ECEEF2', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ color: '#696969', fontSize: 12, marginBottom: 6, fontWeight: 600 }}>Today's Orders</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#1C1C1C' }}>
                  {analytics?.today_orders_count || orders.length || 8}
                </div>
              </div>

              <div style={{ background: '#FFFFFF', padding: 20, borderRadius: 14, border: '1px solid #ECEEF2', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ color: '#696969', fontSize: 12, marginBottom: 6, fontWeight: 600 }}>Average Order Value</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#1C1C1C' }}>
                  ₹{((analytics?.avg_order_value_paise || 52000) / 100).toFixed(0)}
                </div>
              </div>

              <div style={{ background: '#EDF8F0', padding: 20, borderRadius: 14, border: '1px solid #A7E3B6', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ color: '#24963F', fontSize: 12, marginBottom: 6, fontWeight: 800 }}>Aggregator Fee Saved</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#1B7A32' }}>
                  ₹{Math.round(((analytics?.today_sales_paise || 124000) * 0.28) / 100)}
                </div>
                <div style={{ fontSize: 11, color: '#335C3D', marginTop: 3 }}>saved today vs ~28% Zomato/Swiggy</div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ACTION MODAL (ACCEPT / REJECT / DISPATCH) */}
      {selectedOrder && actionType && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: 16
        }}>
          <div style={{ width: '100%', maxWidth: 440, padding: 24, borderRadius: 18, background: '#FFFFFF', boxShadow: 'var(--shadow-lg)' }}>
            <h3 style={{ fontSize: 18, marginBottom: 8, color: '#1C1C1C' }}>
              {actionType === 'accept' && `Accept Order #${selectedOrder.order_no}`}
              {actionType === 'reject' && `Reject Order #${selectedOrder.order_no}`}
              {actionType === 'dispatch' && `Dispatch Order #${selectedOrder.order_no}`}
            </h3>

            {actionType === 'accept' && (
              <div>
                <p style={{ color: '#696969', fontSize: 13, marginBottom: 14 }}>
                  Select estimated kitchen preparation time:
                </p>
                <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                  {[15, 25, 40].map(mins => (
                    <button
                      key={mins}
                      onClick={() => setPrepTime(mins)}
                      style={{
                        flex: 1,
                        padding: '12px 6px',
                        borderRadius: 10,
                        fontWeight: 800,
                        fontSize: 13.5,
                        background: prepTime === mins ? 'var(--primary)' : '#F4F5F8',
                        color: prepTime === mins ? '#FFFFFF' : '#1C1C1C',
                        border: prepTime === mins ? 'none' : '1px solid #E3E5EB'
                      }}
                    >
                      {mins} mins
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setSelectedOrder(null)} className="btn-secondary" style={{ flex: 1, borderRadius: 8 }}>
                    Cancel
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'accepted', { prep_minutes: prepTime })}
                    className="btn-primary"
                    style={{ flex: 1, borderRadius: 8 }}
                  >
                    Confirm Accept
                  </button>
                </div>
              </div>
            )}

            {actionType === 'reject' && (
              <div>
                <p style={{ color: '#696969', fontSize: 13, marginBottom: 10 }}>
                  Please enter reason for rejection (sent to customer via WhatsApp):
                </p>
                <input
                  type="text"
                  placeholder="e.g. Kitchen overwhelmed, item sold out"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="input-field"
                  style={{ marginBottom: 18, height: 42 }}
                />

                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setSelectedOrder(null)} className="btn-secondary" style={{ flex: 1, borderRadius: 8 }}>
                    Cancel
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'rejected', { cancel_reason: rejectReason || 'Kitchen unavailable' })}
                    style={{ flex: 1, background: 'var(--status-cancel)', color: '#FFFFFF', borderRadius: 8, fontWeight: 800 }}
                  >
                    Confirm Reject
                  </button>
                </div>
              </div>
            )}

            {actionType === 'dispatch' && (
              <div>
                <p style={{ color: '#696969', fontSize: 13, marginBottom: 14 }}>
                  Enter delivery rider details (sent to customer for live tracking):
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                  <input
                    type="text"
                    placeholder="Rider Name (e.g. Ramesh)"
                    value={riderName}
                    onChange={(e) => setRiderName(e.target.value)}
                    className="input-field"
                    style={{ height: 42 }}
                  />
                  <input
                    type="tel"
                    placeholder="Rider Contact Phone"
                    value={riderPhone}
                    onChange={(e) => setRiderPhone(e.target.value)}
                    className="input-field"
                    style={{ height: 42 }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setSelectedOrder(null)} className="btn-secondary" style={{ flex: 1, borderRadius: 8 }}>
                    Cancel
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'out_for_delivery', { rider_name: riderName || 'Delivery Partner', rider_phone: riderPhone || '+919999888877' })}
                    className="btn-primary"
                    style={{ flex: 1, borderRadius: 8 }}
                  >
                    Dispatch Now
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== FOOD PHOTO UPLOAD MODAL ===================== */}
      {photoModalItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 16
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: 20,
            maxWidth: 580,
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px 26px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            position: 'relative'
          }}>
            {/* Close Button */}
            <button
              onClick={() => { setPhotoModalItem(null); setPhotoSaveToast(''); }}
              style={{
                position: 'absolute',
                top: 20,
                right: 20,
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: '#F0F2F5',
                color: '#1C1C1C',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>

            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#FFF1F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                📸
              </div>
              <div>
                <h3 style={{ fontSize: 18, color: '#1C1C1C', fontWeight: 800 }}>Upload Food Photo</h3>
                <p style={{ fontSize: 13, color: '#696969' }}>
                  {photoModalItem.name} • ₹{(photoModalItem.base_price_paise / 100).toFixed(0)}
                </p>
              </div>
            </div>

            {/* Success Toast */}
            {photoSaveToast && (
              <div style={{ padding: '10px 14px', background: '#EDF8F0', color: '#24963F', borderRadius: 8, fontSize: 13, fontWeight: 700, marginBottom: 16, border: '1px solid #A7E3B6' }}>
                {photoSaveToast}
              </div>
            )}

            {/* 3 Upload Mode Tabs */}
            <div style={{ display: 'flex', gap: 8, background: '#F8F9FA', padding: 4, borderRadius: 12, marginBottom: 20, border: '1px solid #ECEEF2' }}>
              <button
                onClick={() => setUploadTab('device')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  background: uploadTab === 'device' ? '#FFFFFF' : 'transparent',
                  color: uploadTab === 'device' ? 'var(--primary)' : '#696969',
                  border: 'none',
                  boxShadow: uploadTab === 'device' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  cursor: 'pointer'
                }}
              >
                📁 Upload from Device
              </button>
              <button
                onClick={() => setUploadTab('presets')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  background: uploadTab === 'presets' ? '#FFFFFF' : 'transparent',
                  color: uploadTab === 'presets' ? 'var(--primary)' : '#696969',
                  border: 'none',
                  boxShadow: uploadTab === 'presets' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  cursor: 'pointer'
                }}
              >
                🎨 Food Library ({FOOD_PRESETS.length})
              </button>
              <button
                onClick={() => setUploadTab('url')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  background: uploadTab === 'url' ? '#FFFFFF' : 'transparent',
                  color: uploadTab === 'url' ? 'var(--primary)' : '#696969',
                  border: 'none',
                  boxShadow: uploadTab === 'url' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  cursor: 'pointer'
                }}
              >
                🔗 Image URL
              </button>
            </div>

            {/* Tab 1: Device File Upload */}
            {uploadTab === 'device' && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleDeviceFileSelect}
                  style={{ display: 'none' }}
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '2px dashed #D1D7DB',
                    borderRadius: 14,
                    padding: '28px 20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: '#FAFAFB',
                    transition: 'all 0.2s',
                    marginBottom: 16
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#D1D7DB'}
                >
                  <div style={{ fontSize: 36, marginBottom: 8 }}>📤</div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: '#1C1C1C' }}>
                    Click to browse or drag & drop food photo
                  </div>
                  <div style={{ fontSize: 12, color: '#828282', marginTop: 4 }}>
                    Supports JPG, PNG, WEBP from your phone or laptop (up to 20MB)
                  </div>
                  {devicePhotoData && (
                    <div style={{ marginTop: 12, padding: '6px 12px', background: '#EDF8F0', color: '#24963F', fontSize: 12, fontWeight: 700, borderRadius: 6, display: 'inline-block' }}>
                      ✓ Selected: {devicePhotoData.name} ({devicePhotoData.size})
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Curated Food Presets */}
            {uploadTab === 'presets' && (
              <div>
                <p style={{ fontSize: 12.5, color: '#696969', marginBottom: 12 }}>
                  1-Click select from our high-resolution culinary food library:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 10, maxHeight: 240, overflowY: 'auto', paddingRight: 4, marginBottom: 16 }}>
                  {FOOD_PRESETS.map((preset, idx) => {
                    const isSelected = selectedPhotoUrl === preset.url;
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          setSelectedPhotoUrl(preset.url);
                          setDevicePhotoData(null);
                        }}
                        style={{
                          borderRadius: 12,
                          overflow: 'hidden',
                          border: isSelected ? '2.5px solid var(--primary)' : '1px solid #ECEEF2',
                          cursor: 'pointer',
                          position: 'relative',
                          background: '#FFFFFF',
                          boxShadow: isSelected ? '0 0 0 2px rgba(226, 55, 68, 0.2)' : 'none'
                        }}
                      >
                        <img
                          src={preset.url}
                          alt={preset.name}
                          style={{ width: '100%', height: 75, objectFit: 'cover' }}
                        />
                        <div style={{ padding: '4px 6px', fontSize: 10.5, fontWeight: 700, color: '#1C1C1C', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {preset.name}
                        </div>
                        {isSelected && (
                          <div style={{ position: 'absolute', top: 4, right: 4, background: 'var(--primary)', color: '#FFFFFF', borderRadius: '50%', width: 18, height: 18, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                            ✓
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab 3: Paste Direct URL */}
            {uploadTab === 'url' && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#1C1C1C', marginBottom: 6 }}>
                  Image Web URL
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={selectedPhotoUrl.startsWith('data:') ? '' : selectedPhotoUrl}
                  onChange={(e) => {
                    setSelectedPhotoUrl(e.target.value);
                    setDevicePhotoData(null);
                  }}
                  className="input-field"
                  style={{ width: '100%', height: 42, fontSize: 13 }}
                />
              </div>
            )}

            {/* Live Customer Menu Preview Box */}
            <div style={{ background: '#F8F9FA', borderRadius: 14, padding: 14, marginBottom: 20, border: '1px solid #E8EBF0' }}>
              <div style={{ fontSize: 11.5, fontWeight: 800, color: '#696969', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                Live Customer Card Preview
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#FFFFFF', padding: 12, borderRadius: 12, border: '1px solid #E3E5EB' }}>
                <img
                  src={selectedPhotoUrl || getFoodImageUrl(photoModalItem)}
                  alt="Preview"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = photoModalItem.veg_type === 'veg'
                      ? 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&auto=format&fit=crop&q=80'
                      : 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&auto=format&fit=crop&q=80';
                  }}
                  style={{ width: 70, height: 70, borderRadius: 12, objectFit: 'cover', border: '1px solid #E8EBF0' }}
                />
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: '#1C1C1C' }}>{photoModalItem.name}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--primary)', marginTop: 2 }}>
                    ₹{(photoModalItem.base_price_paise / 100).toFixed(0)}
                  </div>
                  <div style={{ fontSize: 11, color: '#828282', marginTop: 2 }}>
                    Shown directly on customer digital menu & WhatsApp orders
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setPhotoModalItem(null)}
                className="btn-secondary"
                style={{ flex: 1, borderRadius: 10, padding: 11 }}
              >
                Cancel
              </button>
              <button
                onClick={handleSavePhoto}
                disabled={isSavingPhoto}
                className="btn-primary"
                style={{ flex: 1, borderRadius: 10, padding: 11, fontWeight: 800 }}
              >
                {isSavingPhoto ? 'Uploading & Saving...' : 'Save Food Photo ✨'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== ADD NEW DISH MODAL ===================== */}
      {showAddDishModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 16
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: 20,
            maxWidth: 520,
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px 26px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowAddDishModal(false)}
              style={{
                position: 'absolute',
                top: 20,
                right: 20,
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: '#F0F2F5',
                color: '#1C1C1C',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>

            <h3 style={{ fontSize: 19, color: '#1C1C1C', fontWeight: 800, marginBottom: 4 }}>➕ Add New Menu Dish</h3>
            <p style={{ fontSize: 13, color: '#696969', marginBottom: 20 }}>
              Add a new item with price and custom photo to your live digital menu
            </p>

            <form onSubmit={handleCreateNewDish}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 22 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#1C1C1C', marginBottom: 6 }}>
                    Dish Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Special Kadhai Paneer"
                    value={newDishName}
                    onChange={(e) => setNewDishName(e.target.value)}
                    className="input-field"
                    style={{ width: '100%', height: 42 }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#1C1C1C', marginBottom: 6 }}>
                      Category *
                    </label>
                    <select
                      value={newDishCategory}
                      onChange={(e) => setNewDishCategory(e.target.value)}
                      className="input-field"
                      style={{ width: '100%', height: 42 }}
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#1C1C1C', marginBottom: 6 }}>
                      Price (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 280"
                      value={newDishPrice}
                      onChange={(e) => setNewDishPrice(e.target.value)}
                      className="input-field"
                      style={{ width: '100%', height: 42 }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#1C1C1C', marginBottom: 6 }}>
                    Food Type
                  </label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {[
                      { id: 'veg', label: '🟢 Pure Veg' },
                      { id: 'non_veg', label: '🔴 Non-Veg' },
                      { id: 'egg', label: '🟡 Contains Egg' }
                    ].map(type => (
                      <label
                        key={type.id}
                        style={{
                          flex: 1,
                          padding: '9px 12px',
                          borderRadius: 10,
                          background: newDishVegType === type.id ? '#FFF1F2' : '#F8F9FA',
                          border: `1.5px solid ${newDishVegType === type.id ? 'var(--primary)' : '#E3E5EB'}`,
                          fontSize: 12.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                          textAlign: 'center'
                        }}
                      >
                        <input
                          type="radio"
                          name="newDishVeg"
                          checked={newDishVegType === type.id}
                          onChange={() => setNewDishVegType(type.id)}
                          style={{ display: 'none' }}
                        />
                        {type.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#1C1C1C', marginBottom: 6 }}>
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Fresh cottage cheese cooked with bell peppers and whole spices"
                    value={newDishDescription}
                    onChange={(e) => setNewDishDescription(e.target.value)}
                    className="input-field"
                    style={{ width: '100%', height: 42 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#1C1C1C', marginBottom: 6 }}>
                    Food Photo (Upload or Preset)
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleDeviceFileSelect}
                      style={{ fontSize: 12 }}
                    />
                  </div>
                  <div style={{ fontSize: 11.5, color: '#828282', marginTop: 4 }}>
                    Leave empty to automatically assign a delicious matching default photo!
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowAddDishModal(false)}
                  className="btn-secondary"
                  style={{ flex: 1, borderRadius: 10, padding: 11 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingDish}
                  className="btn-primary"
                  style={{ flex: 1, borderRadius: 10, padding: 11, fontWeight: 800 }}
                >
                  {isCreatingDish ? 'Adding Dish...' : 'Create Dish 🚀'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

