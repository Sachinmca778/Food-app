'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchAPI } from '@/lib/api';

// Craving Categories for Intent-Based Discovery (DirectDine Signature Feature)
const CRAVING_CATEGORIES = [
  { id: 'all', name: 'All Cravings', icon: '🍽️', tag: 'all' },
  { id: 'biryani', name: 'Biryani & Rice', icon: '🍲', tag: 'biryani', query: 'biryani' },
  { id: 'north_indian', name: 'North Indian', icon: '🥘', tag: 'north_indian', query: 'paneer' },
  { id: 'healthy', name: 'Healthy & High Protein', icon: '🥗', tag: 'healthy', query: 'healthy' },
  { id: 'pizza', name: 'Pizza & Fast Food', icon: '🍕', tag: 'fast_food', query: 'pizza' },
  { id: 'thali', name: 'Daily Thali & Meals', icon: '🍱', tag: 'thali', query: 'thali' },
  { id: 'momos', name: 'Momos & Asian', icon: '🥟', tag: 'asian', query: 'momos' },
  { id: 'desserts', name: 'Bakery & Sweets', icon: '🧁', tag: 'desserts', query: 'dessert' },
  { id: 'beverages', name: 'Chai & Shakes', icon: '🥤', tag: 'beverages', query: 'chai' }
];

export default function HomePage() {
  // Service mode: 'delivery', 'dine_in', 'takeaway' (DirectDine Multi-Mode Ordering)
  const [orderMode, setOrderMode] = useState('delivery');
  const [selectedCity, setSelectedCity] = useState('Bandra West, Mumbai');
  const [cityModalOpen, setCityModalOpen] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCraving, setSelectedCraving] = useState('all');
  const [filterType, setFilterType] = useState('all'); // 'all', 'veg', 'non_veg', 'top_rated'

  // Dine-In Table Call Waiter Modal (DirectDine Table Service Feature)
  const [waiterModalOpen, setWaiterModalOpen] = useState(false);
  const [tableNumber, setTableNumber] = useState('4');
  const [selectedService, setSelectedService] = useState('waiter');
  const [serviceStatusMsg, setServiceStatusMsg] = useState('');
  const [serviceLoading, setServiceLoading] = useState(false);

  // Merchant Onboarding Modal ("List Your Business in 5 Mins")
  const [onboardModalOpen, setOnboardModalOpen] = useState(false);
  const [onboardData, setOnboardData] = useState({
    businessName: '',
    foodType: 'Restaurant & Dine-in',
    phone: '',
    city: 'Mumbai'
  });
  const [onboardSuccess, setOnboardSuccess] = useState(false);

  // WhatsApp Simulator state
  const [waPhone, setWaPhone] = useState('9123456789');
  const [waInput, setWaInput] = useState('Hi');
  const [waLog, setWaLog] = useState([
    { sender: 'bot', text: '👋 Welcome to DirectDine Food Network!\n0% commission direct ordering. Send "Hi" or tap a quick chip to test our automated WhatsApp engine.' }
  ]);
  const [waLoading, setWaLoading] = useState(false);

  // Profit / Commission Calculator State
  const [monthlyOrders, setMonthlyOrders] = useState(1200);
  const [avgTicket, setAvgTicket] = useState(450);

  const aggregatorCommission = Math.round(monthlyOrders * avgTicket * 0.28);
  const directSavings = aggregatorCommission;

  // Handle WhatsApp bot simulation
  const handleSendWa = async (customMsg = null) => {
    const msgToSend = customMsg || waInput;
    if (!msgToSend.trim()) return;

    setWaLog(prev => [...prev, { sender: 'user', text: msgToSend }]);
    setWaInput('');
    setWaLoading(true);

    try {
      const res = await fetchAPI('/whatsapp/simulate', {
        method: 'POST',
        body: JSON.stringify({ phone: waPhone, message: msgToSend })
      });

      if (res.botResponse) {
        setWaLog(prev => [...prev, { sender: 'bot', text: res.botResponse }]);
      }
    } catch (err) {
      setWaLog(prev => [...prev, { sender: 'bot', text: '⚠️ Connection error with WhatsApp simulator.' }]);
    } finally {
      setWaLoading(false);
    }
  };

  // Handle Dine-In Service Request (Call Waiter / Water / Bill)
  const handleSendServiceRequest = async (type = selectedService) => {
    setServiceLoading(true);
    setServiceStatusMsg('');
    try {
      const res = await fetchAPI('/orders/service-request', {
        method: 'POST',
        body: JSON.stringify({
          restaurantSlug: 'spice-garden',
          tableNo: tableNumber,
          requestType: type
        })
      });
      setServiceStatusMsg(res.message || `Request sent for Table ${tableNumber}!`);
      setTimeout(() => {
        setWaiterModalOpen(false);
        setServiceStatusMsg('');
      }, 2400);
    } catch (e) {
      setServiceStatusMsg(`✅ Alert sent! Staff has been notified for Table ${tableNumber}.`);
      setTimeout(() => {
        setWaiterModalOpen(false);
        setServiceStatusMsg('');
      }, 2200);
    } finally {
      setServiceLoading(false);
    }
  };

  // Handle Merchant Onboarding Submit
  const handleOnboardSubmit = (e) => {
    e.preventDefault();
    setOnboardSuccess(true);
    setTimeout(() => {
      setOnboardModalOpen(false);
      setOnboardSuccess(false);
      setOnboardData({ businessName: '', foodType: 'Restaurant & Dine-in', phone: '', city: 'Mumbai' });
    }, 2800);
  };

  // Curated Restaurant List (DirectDine Direct Network)
  const restaurants = [
    {
      id: 'spice-garden',
      slug: 'spice-garden',
      name: 'Spice Garden',
      tagline: 'North Indian, Mughlai & Handi Dum Biryani',
      cover: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
      rating: '4.8',
      ratingCount: '180+',
      prepTime: '25 mins',
      avgForTwo: '₹400 for two',
      locality: 'Bandra West, Mumbai',
      distance: '1.2 km',
      savingsText: 'Save ₹85 vs Aggregators',
      isOpen: true,
      tags: ['biryani', 'north_indian', 'healthy'],
      phone: '919876543210'
    },
    {
      id: 'chai-and-bites',
      slug: 'chai-and-bites',
      name: 'Chai & Bites Cafe',
      tagline: 'Artisanal Cutting Chai, Bun Maska & Grilled Sandwiches',
      cover: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80',
      rating: '4.6',
      ratingCount: '120+',
      prepTime: '15 mins',
      avgForTwo: '₹200 for two',
      locality: 'Fort, Mumbai',
      distance: '2.4 km',
      savingsText: 'Save ₹45 vs Aggregators',
      isOpen: true,
      tags: ['beverages', 'fast_food', 'desserts'],
      phone: '919876543211'
    }
  ];

  // Filter restaurants by craving and search query
  const filteredRestaurants = restaurants.filter(r => {
    const matchSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.locality.toLowerCase().includes(searchQuery.toLowerCase());

    const matchCraving = selectedCraving === 'all' || r.tags.includes(selectedCraving);
    return matchSearch && matchCraving;
  });

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: '16px 16px 80px' }}>
      
      {/* 1. DIRECTDINE TOP NAVIGATION (ZOMATO CLEAN RED & WHITE THEME) */}
      <nav style={{
        background: '#FFFFFF',
        padding: '12px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-medium)',
        boxShadow: 'var(--shadow-sm)',
        flexWrap: 'wrap',
        gap: 12
      }}>
        {/* Brand Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'var(--primary)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            boxShadow: '0 4px 14px var(--primary-glow)'
          }}>
            🍽️
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--primary)' }}>
                DirectDine
              </span>
              <span style={{ fontSize: 10, background: '#FEECEE', color: 'var(--primary)', fontWeight: 800, padding: '2px 6px', borderRadius: 4, border: '1px solid #FBCED2' }}>
                DIRECT OS
              </span>
            </div>
            <div style={{ fontSize: 10.5, color: '#696969', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
              0% Commission Direct Ordering
            </div>
          </div>
        </div>

        {/* Multi-Mode Switcher (Delivery / Dine-in / Takeaway) */}
        <div style={{
          display: 'flex',
          background: '#F4F5F8',
          padding: 4,
          borderRadius: 10,
          border: '1px solid var(--border-medium)'
        }}>
          <button
            onClick={() => setOrderMode('delivery')}
            style={{
              padding: '7px 14px',
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 800,
              background: orderMode === 'delivery' ? '#FFFFFF' : 'transparent',
              color: orderMode === 'delivery' ? 'var(--primary)' : '#4F4F4F',
              boxShadow: orderMode === 'delivery' ? 'var(--shadow-sm)' : 'none',
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
              boxShadow: orderMode === 'dine_in' ? '0 2px 8px var(--primary-glow)' : 'none',
              transition: 'all 0.18s',
              display: 'flex',
              alignItems: 'center',
              gap: 5
            }}
          >
            🍽️ Dine-In {orderMode === 'dine_in' && <span style={{ background: '#FFFFFF', color: 'var(--primary)', padding: '1px 6px', borderRadius: 4, fontSize: 10 }}>T4</span>}
          </button>
          <button
            onClick={() => setOrderMode('takeaway')}
            style={{
              padding: '7px 14px',
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 800,
              background: orderMode === 'takeaway' ? '#FFFFFF' : 'transparent',
              color: orderMode === 'takeaway' ? 'var(--primary)' : '#4F4F4F',
              boxShadow: orderMode === 'takeaway' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.18s'
            }}
          >
            🥡 Takeaway
          </button>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Call Waiter Button (Active for Dine-In) */}
          {orderMode === 'dine_in' && (
            <button
              onClick={() => setWaiterModalOpen(true)}
              style={{
                background: '#FFF3CD',
                color: '#856404',
                border: '1px solid #FFEEBA',
                padding: '8px 14px',
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                cursor: 'pointer'
              }}
            >
              🔔 Call Waiter / Service
            </button>
          )}

          {/* Quick WhatsApp Order Action */}
          <a
            href="https://wa.me/919876543210?text=Hi%20Spice%20Garden!%20I%20want%20to%20place%20a%20direct%20order."
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: '#E8F5E9',
              color: '#1B5E20',
              border: '1px solid #C8E6C9',
              padding: '8px 14px',
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            📲 WhatsApp Order
          </a>

          {/* Register Business CTA */}
          <button
            onClick={() => setOnboardModalOpen(true)}
            style={{
              background: '#FFFFFF',
              color: 'var(--primary)',
              border: '1px solid #FBCED2',
              padding: '8px 14px',
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            + List Restaurant
          </button>

          <Link href="/dashboard" className="btn-secondary" style={{ padding: '8px 14px', fontSize: 12.5, borderRadius: 8 }}>
            👨‍🍳 Kitchen
          </Link>
          <Link href="/admin" className="btn-primary" style={{ padding: '8px 16px', fontSize: 12.5, borderRadius: 8 }}>
            👑 Super Admin
          </Link>
        </div>
      </nav>

      {/* 2. HERO & INTENT-BASED DISCOVERY HEADER */}
      <section style={{
        background: '#FFFFFF',
        borderRadius: 20,
        border: '1px solid var(--border-medium)',
        padding: '34px 24px',
        marginBottom: 28,
        boxShadow: 'var(--shadow-sm)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle Decorative Background Element */}
        <div style={{
          position: 'absolute',
          top: -30,
          right: -30,
          width: 140,
          height: 140,
          background: 'radial-gradient(circle, rgba(226,55,68,0.08) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />

        {/* 0% Commission Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: '#FEECEE',
          border: '1px solid #FBCED2',
          color: 'var(--primary)',
          padding: '5px 16px',
          borderRadius: 'var(--radius-full)',
          fontSize: 12.5,
          fontWeight: 800,
          marginBottom: 16
        }}>
          <span className="pulse-indicator" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', display: 'inline-block' }} />
          Zero Commission Direct Food Network • Instant Direct UPI Payments
        </div>

        <h1 style={{
          fontSize: 'clamp(28px, 4.2vw, 44px)',
          fontWeight: 900,
          lineHeight: 1.2,
          color: '#1C1C1C',
          letterSpacing: '-0.03em',
          marginBottom: 12
        }}>
          Direct Food Ordering With <br />
          <span style={{ color: 'var(--primary)' }}>Zero Aggregator Price Markup</span>
        </h1>

        <p style={{
          color: '#4F4F4F',
          fontSize: 'clamp(14px, 1.6vw, 16.5px)',
          lineHeight: 1.55,
          maxWidth: 680,
          margin: '0 auto 24px'
        }}>
          Enjoy authentic food straight from your favorite restaurants. 1-Tap UPI payments directly to the kitchen, contactless dine-in table ordering, and instant automated WhatsApp updates.
        </p>

        {/* Intent-Based Search & Location Bar */}
        <div style={{
          maxWidth: 680,
          margin: '0 auto',
          background: '#FFFFFF',
          borderRadius: 14,
          border: '2px solid var(--border-medium)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          display: 'flex',
          alignItems: 'center',
          padding: '6px 8px',
          flexWrap: 'wrap',
          gap: 8
        }}>
          {/* Location Selector Pill */}
          <button
            onClick={() => setCityModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: '#F8F9FA',
              border: '1px solid #E3E5EB',
              borderRadius: 8,
              padding: '8px 12px',
              fontSize: 13,
              fontWeight: 700,
              color: '#1C1C1C',
              cursor: 'pointer'
            }}
          >
            <span>📍</span>
            <span>{selectedCity}</span>
            <span style={{ fontSize: 10, color: '#696969' }}>▾</span>
          </button>

          {/* Intent Search Field */}
          <div style={{ flex: '1 1 240px', position: 'relative' }}>
            <input
              type="text"
              placeholder="Search by craving (Biryani, Keto, High Protein, Pizza, Thali)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                fontSize: 14,
                padding: '8px 12px 8px 30px',
                color: '#1C1C1C',
                fontFamily: 'inherit'
              }}
            />
            <span style={{ position: 'absolute', left: 8, top: 9, fontSize: 14, opacity: 0.5 }}>🔍</span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: 8, top: 9, background: 'none', color: '#696969', fontSize: 13 }}
              >
                ✕
              </button>
            )}
          </div>

          <button
            onClick={() => {}}
            className="btn-primary"
            style={{ padding: '10px 20px', borderRadius: 8, fontSize: 13.5 }}
          >
            Explore
          </button>
        </div>
      </section>

      {/* 3. SIGNATURE "EXPLORE BY CRAVING" CAROUSEL */}
      <section style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <h2 style={{ fontSize: 20, color: '#1C1C1C', fontWeight: 800 }}>Explore What You're Craving</h2>
            <p style={{ fontSize: 12.5, color: '#696969' }}>Search by specialty dishes, home food, and dietary preferences</p>
          </div>
          {selectedCraving !== 'all' && (
            <button
              onClick={() => setSelectedCraving('all')}
              style={{ fontSize: 12.5, color: 'var(--primary)', fontWeight: 700, background: 'none' }}
            >
              Reset to All
            </button>
          )}
        </div>

        {/* Circular Category Carousel */}
        <div style={{
          display: 'flex',
          gap: 14,
          overflowX: 'auto',
          paddingBottom: 10,
          scrollbarWidth: 'none'
        }}>
          {CRAVING_CATEGORIES.map(cat => {
            const isSelected = selectedCraving === cat.tag;
            return (
              <div
                key={cat.id}
                onClick={() => setSelectedCraving(cat.tag)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  minWidth: 84,
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'transform 0.15s ease'
                }}
              >
                <div style={{
                  width: 68,
                  height: 68,
                  borderRadius: '50%',
                  background: isSelected ? '#FEECEE' : '#FFFFFF',
                  border: `2px solid ${isSelected ? 'var(--primary)' : '#E3E5EB'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 28,
                  boxShadow: isSelected ? '0 4px 12px var(--primary-glow)' : 'var(--shadow-sm)',
                  marginBottom: 8,
                  transition: 'all 0.2s ease'
                }}>
                  {cat.icon}
                </div>
                <span style={{
                  fontSize: 12,
                  fontWeight: isSelected ? 800 : 600,
                  color: isSelected ? 'var(--primary)' : '#1C1C1C',
                  textAlign: 'center',
                  lineHeight: 1.2
                }}>
                  {cat.name}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. DIRECT RESTAURANT SHOWCASE */}
      <section style={{ marginBottom: 54 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
              0% COMMISSION DIRECT STORES
            </div>
            <h2 style={{ fontSize: 24, color: '#1C1C1C' }}>Popular Direct Food Partners</h2>
          </div>

          {/* Quick Filter Pills */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button
              onClick={() => setFilterType('all')}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-full)',
                fontSize: 12,
                fontWeight: 700,
                background: filterType === 'all' ? '#1C1C1C' : '#FFFFFF',
                color: filterType === 'all' ? '#FFFFFF' : '#4F4F4F',
                border: '1px solid #E3E5EB'
              }}
            >
              All Partners
            </button>
            <button
              onClick={() => setFilterType('veg')}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-full)',
                fontSize: 12,
                fontWeight: 700,
                background: filterType === 'veg' ? '#EDF8F0' : '#FFFFFF',
                color: filterType === 'veg' ? '#24963F' : '#4F4F4F',
                border: filterType === 'veg' ? '1px solid #24963F' : '1px solid #E3E5EB'
              }}
            >
              🟢 Pure Veg
            </button>
            <button
              onClick={() => setFilterType('top_rated')}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-full)',
                fontSize: 12,
                fontWeight: 700,
                background: filterType === 'top_rated' ? '#FFF3D6' : '#FFFFFF',
                color: filterType === 'top_rated' ? '#B45309' : '#4F4F4F',
                border: filterType === 'top_rated' ? '1px solid #B45309' : '1px solid #E3E5EB'
              }}
            >
              ★ Top Rated
            </button>
          </div>
        </div>

        {/* Restaurant Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: 22 }}>
          {filteredRestaurants.map(rest => (
            <div
              key={rest.id}
              className="glass-panel"
              style={{
                padding: 0,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: '1px solid var(--border-medium)',
                borderRadius: 16
              }}
            >
              {/* Cover Banner */}
              <div style={{
                height: 160,
                background: `linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.65) 100%), url(${rest.cover}) center/cover no-repeat`,
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                color: '#FFFFFF'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {/* DirectDine 0% Commission Direct Badge */}
                  <span style={{
                    background: '#24963F',
                    color: '#FFFFFF',
                    fontSize: 11,
                    fontWeight: 900,
                    padding: '3px 8px',
                    borderRadius: 6,
                    letterSpacing: '0.03em',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                  }}>
                    ✓ DIRECT • 0% MARKUP
                  </span>

                  <span style={{
                    background: 'rgba(0, 0, 0, 0.65)',
                    backdropFilter: 'blur(4px)',
                    color: '#FFFFFF',
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: 11.5,
                    fontWeight: 800
                  }}>
                    ⏱️ {rest.prepTime}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <span style={{ background: '#FFFFFF', color: '#1C1C1C', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800 }}>
                      {rest.savingsText}
                    </span>
                  </div>
                  <div style={{ background: '#24963F', color: '#FFFFFF', padding: '3px 8px', borderRadius: 6, fontSize: 13, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 3 }}>
                    {rest.rating} ★
                  </div>
                </div>
              </div>

              {/* Restaurant Details */}
              <div style={{ padding: '18px 20px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div>
                    <h3 style={{ fontSize: 20, color: '#1C1C1C', lineHeight: 1.2 }}>{rest.name}</h3>
                    <p style={{ color: '#696969', fontSize: 12.5, marginTop: 4 }}>
                      📍 {rest.locality} • {rest.distance}
                    </p>
                  </div>
                  <span style={{ fontSize: 12, color: '#4F4F4F', fontWeight: 700 }}>
                    {rest.avgForTwo}
                  </span>
                </div>

                <p style={{ color: '#4F4F4F', fontSize: 13, lineHeight: 1.45, marginBottom: 16 }}>
                  {rest.tagline}
                </p>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <Link
                    href={`/${rest.slug}${orderMode === 'dine_in' ? '?table=4' : ''}`}
                    className="btn-primary"
                    style={{ flex: 1, padding: '10px 14px', fontSize: 13, borderRadius: 8 }}
                  >
                    Browse Menu ➔
                  </Link>

                  <a
                    href={`https://wa.me/${rest.phone}?text=${encodeURIComponent(`Hi ${rest.name}! I would like to explore today's direct menu and place an order.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: '#E8F5E9',
                      color: '#1B5E20',
                      border: '1px solid #C8E6C9',
                      padding: '10px 14px',
                      borderRadius: 8,
                      fontSize: 13,
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
            </div>
          ))}
        </div>
      </section>

      {/* 5. BUSINESS VALUE STACK ("WHY FOOD BUSINESSES LOVE DIRECTDINE") */}
      <section style={{ marginBottom: 54 }}>
        <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 30px' }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
            DIGITAL RESTAURANT OPERATING SYSTEM
          </div>
          <h2 style={{ fontSize: 26, color: '#1C1C1C' }}>Built To Free Kitchens From High Commissions</h2>
          <p style={{ color: '#696969', fontSize: 14 }}>
            Everything you need to run dine-in, takeaway, and direct online food delivery without paying 30% cuts.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
          <div className="glass-panel" style={{ padding: '24px 20px', borderRadius: 14 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
            <h3 style={{ fontSize: 17, color: '#1C1C1C', marginBottom: 6 }}>Direct Instant UPI Payments</h3>
            <p style={{ color: '#696969', fontSize: 13, lineHeight: 1.5 }}>
              100% money goes directly to your Google Pay, PhonePe, or Merchant Bank Account. Zero commission cuts and no payout delays.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '24px 20px', borderRadius: 14 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📱</div>
            <h3 style={{ fontSize: 17, color: '#1C1C1C', marginBottom: 6 }}>Table QR & NFC Dine-In</h3>
            <p style={{ color: '#696969', fontSize: 13, lineHeight: 1.5 }}>
              Guests scan table QR codes to view the digital menu, order food, and call the waiter directly from their phones without paper menus.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '24px 20px', borderRadius: 14 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>💬</div>
            <h3 style={{ fontSize: 17, color: '#1C1C1C', marginBottom: 6 }}>Automated WhatsApp Bot</h3>
            <p style={{ color: '#696969', fontSize: 13, lineHeight: 1.5 }}>
              Instant order confirmations, live kitchen progress, and automated review collection sent via Meta Cloud WhatsApp API.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '24px 20px', borderRadius: 14 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>👑</div>
            <h3 style={{ fontSize: 17, color: '#1C1C1C', marginBottom: 6 }}>100% Customer Data Ownership</h3>
            <p style={{ color: '#696969', fontSize: 13, lineHeight: 1.5 }}>
              You own all customer phone numbers and ordering habits to run WhatsApp repeat marketing and loyalty campaigns.
            </p>
          </div>
        </div>
      </section>

      {/* 6. INTERACTIVE COMMISSION SAVINGS CALCULATOR */}
      <section className="glass-panel" style={{ padding: '36px 28px', marginBottom: 54, border: '1px solid var(--border-medium)', borderRadius: 20 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
            COMMISSION SAVINGS CALCULATOR
          </div>
          <h2 style={{ fontSize: 26, color: '#1C1C1C' }}>See How Much You Save With 0% Commission</h2>
          <p style={{ color: '#4F4F4F', fontSize: 14, marginTop: 4 }}>
            Compare typical 28% aggregator deductions against DirectDine 0% Commission Direct Ordering.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 28, alignItems: 'center' }}>
          <div>
            <div style={{ marginBottom: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: '#1C1C1C' }}>Monthly Orders</span>
                <span style={{ color: 'var(--primary)', fontWeight: 800, fontSize: 16 }}>{monthlyOrders} orders</span>
              </div>
              <input
                type="range"
                min="100"
                max="5000"
                step="50"
                value={monthlyOrders}
                onChange={(e) => setMonthlyOrders(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: '#1C1C1C' }}>Average Ticket Size</span>
                <span style={{ color: 'var(--primary)', fontWeight: 800, fontSize: 16 }}>₹{avgTicket}</span>
              </div>
              <input
                type="range"
                min="150"
                max="1500"
                step="25"
                value={avgTicket}
                onChange={(e) => setAvgTicket(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
            </div>
          </div>

          {/* Calculator Result Box */}
          <div style={{
            background: '#EDF8F0',
            border: '1.5px solid #A7E3B6',
            borderRadius: 16,
            padding: 24,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 11.5, color: '#24963F', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.06em', marginBottom: 6 }}>
              ANNUAL PROFIT RETAINED
            </div>
            <div style={{ fontSize: 'clamp(32px, 3.8vw, 42px)', fontWeight: 900, color: '#1B7A32', marginBottom: 6 }}>
              ₹{((directSavings * 12) / 100000).toFixed(2)} Lakhs/yr
            </div>
            <div style={{ fontSize: 13, color: '#335C3D', fontWeight: 600 }}>
              (₹{directSavings.toLocaleString('en-IN')} extra revenue going straight into your bank account every month)
            </div>
          </div>
        </div>
      </section>

      {/* 7. WHATSAPP BOT INTERACTIVE SIMULATOR */}
      <section style={{ marginBottom: 54 }}>
        <div className="glass-panel" style={{ padding: '36px 20px', border: '1px solid var(--border-medium)', borderRadius: 20 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <span style={{ fontSize: 36 }}>💬</span>
            <h2 style={{ fontSize: 26, marginTop: 4, color: '#1C1C1C' }}>Interactive WhatsApp Cloud API Bot</h2>
            <p style={{ color: '#4F4F4F', fontSize: 14, maxWidth: 560, margin: '6px auto 0' }}>
              Customers can message your WhatsApp number to view menus, search dishes, track live orders, or place 1-tap reorders.
            </p>
          </div>

          {/* WhatsApp Simulator Window */}
          <div style={{
            maxWidth: 460,
            margin: '0 auto',
            background: '#EFEAE2',
            borderRadius: 20,
            border: '1px solid #D1D7DB',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-lg)'
          }}>
            {/* Header */}
            <div style={{ background: '#075E54', color: '#FFFFFF', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                  🍲
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                    Spice Garden Direct
                    <span style={{ fontSize: 12, color: '#25D366' }}>✓</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#D4EBE7' }}>Official WhatsApp Cloud API</div>
                </div>
              </div>
              <span style={{ fontSize: 18, color: '#FFFFFF' }}>⋮</span>
            </div>

            {/* Chat Body */}
            <div style={{
              height: 260,
              overflowY: 'auto',
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              backgroundColor: '#EFEAE2'
            }}>
              {waLog.map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    background: msg.sender === 'user' ? '#D9FDD3' : '#FFFFFF',
                    color: '#111B21',
                    padding: '9px 13px',
                    borderRadius: 8,
                    fontSize: 13,
                    lineHeight: 1.45,
                    whiteSpace: 'pre-wrap',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                  }}
                >
                  {msg.text}
                </div>
              ))}
              {waLoading && (
                <div style={{ alignSelf: 'flex-start', color: '#667781', fontSize: 11.5, fontStyle: 'italic' }}>
                  Spice Garden is typing...
                </div>
              )}
            </div>

            {/* Quick Action Chips */}
            <div style={{ padding: '8px 10px', background: '#F0F2F5', borderTop: '1px solid #E9EDEF', display: 'flex', gap: 6, overflowX: 'auto' }}>
              <button
                onClick={() => handleSendWa('Hi')}
                style={{ padding: '5px 12px', borderRadius: 'var(--radius-full)', fontSize: 11.5, background: '#FFFFFF', color: '#111B21', fontWeight: 600, border: '1px solid #D1D7DB', whiteSpace: 'nowrap' }}
              >
                Send "Hi"
              </button>
              <button
                onClick={() => handleSendWa('biryani')}
                style={{ padding: '5px 12px', borderRadius: 'var(--radius-full)', fontSize: 11.5, background: '#FFFFFF', color: '#E23744', fontWeight: 700, border: '1px solid #E23744', whiteSpace: 'nowrap' }}
              >
                🔍 Search "biryani"
              </button>
              <button
                onClick={() => handleSendWa('2')}
                style={{ padding: '5px 12px', borderRadius: 'var(--radius-full)', fontSize: 11.5, background: '#FFFFFF', color: '#111B21', fontWeight: 600, border: '1px solid #D1D7DB', whiteSpace: 'nowrap' }}
              >
                2 (View Menu)
              </button>
              <button
                onClick={() => handleSendWa('3')}
                style={{ padding: '5px 12px', borderRadius: 'var(--radius-full)', fontSize: 11.5, background: '#FFFFFF', color: '#111B21', fontWeight: 600, border: '1px solid #D1D7DB', whiteSpace: 'nowrap' }}
              >
                3 (Order Status)
              </button>
            </div>

            {/* Input Bar */}
            <div style={{ padding: 8, display: 'flex', gap: 6, background: '#F0F2F5' }}>
              <input
                type="text"
                placeholder="Type a message..."
                value={waInput}
                onChange={(e) => setWaInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendWa()}
                style={{
                  flex: 1,
                  background: '#FFFFFF',
                  border: '1px solid #D1D7DB',
                  borderRadius: 8,
                  padding: '9px 12px',
                  color: '#111B21',
                  fontSize: 13,
                  outline: 'none'
                }}
              />
              <button
                onClick={() => handleSendWa()}
                disabled={waLoading}
                style={{
                  background: '#00A884',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  padding: '0 16px',
                  borderRadius: 8,
                  fontSize: 13
                }}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 8. DINE-IN SERVICE MODAL ("CALL WAITER / WATER / BILL") */}
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
            maxWidth: 440,
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
                <p style={{ fontSize: 12.5, color: '#696969' }}>Instantly alert kitchen and floor staff</p>
              </div>
            </div>

            {/* Table Number Selector */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#4F4F4F', marginBottom: 6 }}>
                Confirm Your Table Number:
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['1', '2', '3', '4', '5', '6'].map(num => (
                  <button
                    key={num}
                    onClick={() => setTableNumber(num)}
                    style={{
                      flex: 1,
                      padding: '8px 0',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 800,
                      background: tableNumber === num ? 'var(--primary)' : '#F8F9FA',
                      color: tableNumber === num ? '#FFFFFF' : '#1C1C1C',
                      border: `1.5px solid ${tableNumber === num ? 'var(--primary)' : '#E3E5EB'}`
                    }}
                  >
                    T{num}
                  </button>
                ))}
              </div>
            </div>

            {/* Service Action Options */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              <button
                onClick={() => handleSendServiceRequest('waiter')}
                disabled={serviceLoading}
                style={{
                  padding: '16px 12px',
                  borderRadius: 12,
                  background: '#F8F9FA',
                  border: '1.5px solid #E3E5EB',
                  textAlign: 'center',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontSize: 26, marginBottom: 4 }}>🙋‍♂️</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#1C1C1C' }}>Call Waiter</div>
                <div style={{ fontSize: 11, color: '#696969' }}>Need assistance</div>
              </button>

              <button
                onClick={() => handleSendServiceRequest('water')}
                disabled={serviceLoading}
                style={{
                  padding: '16px 12px',
                  borderRadius: 12,
                  background: '#F8F9FA',
                  border: '1.5px solid #E3E5EB',
                  textAlign: 'center',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontSize: 26, marginBottom: 4 }}>💧</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#1C1C1C' }}>Request Water</div>
                <div style={{ fontSize: 11, color: '#696969' }}>Chilled water</div>
              </button>

              <button
                onClick={() => handleSendServiceRequest('bill')}
                disabled={serviceLoading}
                style={{
                  padding: '16px 12px',
                  borderRadius: 12,
                  background: '#F8F9FA',
                  border: '1.5px solid #E3E5EB',
                  textAlign: 'center',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontSize: 26, marginBottom: 4 }}>🧾</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#1C1C1C' }}>Request Bill</div>
                <div style={{ fontSize: 11, color: '#696969' }}>UPI QR / Invoice</div>
              </button>

              <button
                onClick={() => handleSendServiceRequest('clean')}
                disabled={serviceLoading}
                style={{
                  padding: '16px 12px',
                  borderRadius: 12,
                  background: '#F8F9FA',
                  border: '1.5px solid #E3E5EB',
                  textAlign: 'center',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontSize: 26, marginBottom: 4 }}>🧹</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#1C1C1C' }}>Clean Table</div>
                <div style={{ fontSize: 11, color: '#696969' }}>Clear cutlery</div>
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

      {/* 9. MERCHANT ONBOARDING MODAL */}
      {onboardModalOpen && (
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
            maxWidth: 480,
            width: '100%',
            padding: 26,
            boxShadow: 'var(--shadow-lg)',
            position: 'relative'
          }}>
            <button
              onClick={() => setOnboardModalOpen(false)}
              style={{ position: 'absolute', top: 16, right: 16, background: '#F4F5F8', width: 32, height: 32, borderRadius: '50%', color: '#1C1C1C', fontSize: 14 }}
            >
              ✕
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 30 }}>🚀</span>
              <div>
                <h3 style={{ fontSize: 20, color: '#1C1C1C' }}>List Your Food Business</h3>
                <p style={{ fontSize: 12.5, color: '#696969' }}>Start 0% commission direct online ordering in 5 minutes</p>
              </div>
            </div>

            {onboardSuccess ? (
              <div style={{ textAlign: 'center', padding: '30px 10px' }}>
                <div style={{ fontSize: 44, marginBottom: 10 }}>🎉</div>
                <h4 style={{ fontSize: 18, color: '#1C1C1C', marginBottom: 6 }}>Registration Submitted!</h4>
                <p style={{ fontSize: 13.5, color: '#4F4F4F' }}>
                  Our team will contact you on WhatsApp to activate your direct storefront and send your branded table QR kit.
                </p>
              </div>
            ) : (
              <form onSubmit={handleOnboardSubmit}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#4F4F4F', marginBottom: 4 }}>
                    Restaurant / Brand Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Royal Biryani & Kebabs"
                    value={onboardData.businessName}
                    onChange={(e) => setOnboardData({ ...onboardData, businessName: e.target.value })}
                    className="input-field"
                    style={{ fontSize: 13.5, padding: '10px 12px' }}
                  />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#4F4F4F', marginBottom: 4 }}>
                    Food Business Category
                  </label>
                  <select
                    value={onboardData.foodType}
                    onChange={(e) => setOnboardData({ ...onboardData, foodType: e.target.value })}
                    className="input-field"
                    style={{ fontSize: 13.5, padding: '10px 12px' }}
                  >
                    <option value="Restaurant & Dine-in">Restaurant & Dine-in</option>
                    <option value="Cloud Kitchen">Cloud Kitchen</option>
                    <option value="Cafe & Quick Bites">Cafe & Quick Bites</option>
                    <option value="Home Chef / Bakery">Home Chef / Bakery</option>
                    <option value="Tiffin & Meal Service">Tiffin & Meal Service</option>
                  </select>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#4F4F4F', marginBottom: 4 }}>
                    Owner WhatsApp Mobile Number
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="9123456789"
                    value={onboardData.phone}
                    onChange={(e) => setOnboardData({ ...onboardData, phone: e.target.value })}
                    className="input-field"
                    style={{ fontSize: 13.5, padding: '10px 12px' }}
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#4F4F4F', marginBottom: 4 }}>
                    City / Locality
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bandra West, Mumbai"
                    value={onboardData.city}
                    onChange={(e) => setOnboardData({ ...onboardData, city: e.target.value })}
                    className="input-field"
                    style={{ fontSize: 13.5, padding: '10px 12px' }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  style={{ width: '100%', padding: '12px 0', fontSize: 14, borderRadius: 10 }}
                >
                  Claim 0% Commission Storefront ➔
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 10. LOCATION SELECTION MODAL */}
      {cityModalOpen && (
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
            borderRadius: 16,
            maxWidth: 400,
            width: '100%',
            padding: 22,
            boxShadow: 'var(--shadow-lg)',
            position: 'relative'
          }}>
            <button
              onClick={() => setCityModalOpen(false)}
              style={{ position: 'absolute', top: 14, right: 14, background: '#F4F5F8', width: 28, height: 28, borderRadius: '50%', color: '#1C1C1C', fontSize: 13 }}
            >
              ✕
            </button>

            <h3 style={{ fontSize: 17, color: '#1C1C1C', marginBottom: 12 }}>Select Your Locality</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['Bandra West, Mumbai', 'Andheri East, Mumbai', 'Fort & Colaba, Mumbai', 'Juhu & Vile Parle, Mumbai', 'Powai Hiranandani, Mumbai'].map(loc => (
                <button
                  key={loc}
                  onClick={() => {
                    setSelectedCity(loc);
                    setCityModalOpen(false);
                  }}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    textAlign: 'left',
                    background: selectedCity === loc ? '#FEECEE' : '#F8F9FA',
                    color: selectedCity === loc ? 'var(--primary)' : '#1C1C1C',
                    fontWeight: 700,
                    fontSize: 13.5,
                    border: `1px solid ${selectedCity === loc ? 'var(--primary)' : '#E3E5EB'}`
                  }}
                >
                  📍 {loc}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 11. CLEAN ZOMATO STYLE FOOTER */}
      <footer style={{
        marginTop: 48,
        paddingTop: 32,
        borderTop: '1px solid var(--border-medium)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
        color: '#696969',
        fontSize: 13
      }}>
        <div>
          <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: 16, marginBottom: 2 }}>
            DirectDine Direct Food OS
          </div>
          <div>Empowering restaurants, cloud kitchens & cafes with 0% commission direct ordering.</div>
        </div>

        <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
          <Link href="/spice-garden" style={{ color: 'var(--primary)', fontWeight: 700 }}>Customer Menu</Link>
          <Link href="/dashboard" style={{ color: '#1C1C1C', fontWeight: 600 }}>Kitchen KDS</Link>
          <Link href="/admin" style={{ color: '#1C1C1C', fontWeight: 600 }}>Super Admin</Link>
          <button onClick={() => setOnboardModalOpen(true)} style={{ background: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}>
            List Business
          </button>
        </div>
      </footer>
    </div>
  );
}
