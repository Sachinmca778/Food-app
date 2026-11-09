'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchAPI } from '@/lib/api';

// Craving Categories for Intent-Based Consumer Discovery
const CRAVING_CATEGORIES = [
  { id: 'all', name: 'All Cravings', icon: '🍽️', tag: 'all' },
  { id: 'biryani', name: 'Biryani & Rice', icon: '🍲', tag: 'biryani' },
  { id: 'healthy', name: 'Healthy & Salad', icon: '🥗', tag: 'healthy' },
  { id: 'north_indian', name: 'North Indian', icon: '🥘', tag: 'north_indian' },
  { id: 'pizza', name: 'Pizza & Fast Food', icon: '🍕', tag: 'fast_food' },
  { id: 'thali', name: 'Daily Thali & Meals', icon: '🍱', tag: 'thali' },
  { id: 'momos', name: 'Momos & Asian', icon: '🥟', tag: 'asian' },
  { id: 'desserts', name: 'Bakery & Sweets', icon: '🧁', tag: 'desserts' },
  { id: 'beverages', name: 'Chai & Shakes', icon: '🥤', tag: 'beverages' }
];

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCraving, setSelectedCraving] = useState('all');
  const [filterType, setFilterType] = useState('all'); // 'all', 'veg', 'top_rated'
  const [orderMode, setOrderMode] = useState('delivery'); // 'delivery', 'dine_in', 'takeaway'
  const [dbRestaurants, setDbRestaurants] = useState([]);

  useEffect(() => {
    fetchAPI('/restaurant')
      .then(res => {
        if (res.success && res.restaurants?.length > 0) {
          setDbRestaurants(res.restaurants);
        }
      })
      .catch(() => {});
  }, []);

  const fallbackRestaurants = [
    {
      id: 'spice-garden',
      slug: 'spice-garden',
      name: 'Spice Garden',
      tagline: 'North Indian, Mughlai & Handi Dum Biryani',
      cover: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
      rating: '4.8',
      prepTime: '25 mins',
      avgForTwo: '₹400 for two',
      locality: 'Bandra West, Mumbai',
      savingsText: 'Save ₹85 vs Aggregators',
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
      prepTime: '15 mins',
      avgForTwo: '₹200 for two',
      locality: 'Fort, Mumbai',
      savingsText: 'Save ₹45 vs Aggregators',
      tags: ['beverages', 'fast_food', 'desserts'],
      phone: '919876543211'
    }
  ];

  const restaurants = dbRestaurants.length > 0 ? dbRestaurants.map(r => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    tagline: r.description || 'Authentic Handi Dum Biryani & North Indian Delicacies',
    cover: r.cover_url || (r.slug === 'spice-garden' ? 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80' : 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80'),
    rating: '4.8',
    prepTime: `${r.avg_prep_minutes || 25} mins`,
    avgForTwo: '₹350 for two',
    locality: `${r.address_line || 'Bandra West'}, ${r.city || 'Mumbai'}`,
    savingsText: 'Save ₹80 vs Aggregators',
    tags: ['biryani', 'north_indian', 'healthy'],
    phone: r.phone || '919876543210'
  })) : fallbackRestaurants;

  const filteredRestaurants = restaurants.filter(r => {
    const matchSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.locality.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCraving = selectedCraving === 'all' || r.tags.includes(selectedCraving);
    return matchSearch && matchCraving;
  });

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: '20px 16px 80px' }}>
      {/* Top Header */}
      <header style={{
        background: '#FFFFFF',
        padding: '14px 20px',
        borderRadius: 16,
        border: '1px solid #E5E7EB',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'var(--primary)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20
            }}>
              🍽️
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--primary)' }}>DirectDine</div>
              <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 600 }}>0% Commission Direct Food Stores</div>
            </div>
          </Link>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link href="/" style={{ fontSize: 13, fontWeight: 700, color: '#4B5563', textDecoration: 'none' }}>
            ← Back to SaaS Home
          </Link>
          <Link
            href="/dashboard"
            className="btn-secondary"
            style={{ padding: '8px 14px', fontSize: 12.5, borderRadius: 8 }}
          >
            Restaurant Login
          </Link>
        </div>
      </header>

      {/* Hero Search */}
      <section style={{
        background: '#FFFFFF',
        borderRadius: 20,
        border: '1px solid #E5E7EB',
        padding: '32px 24px',
        marginBottom: 28,
        textAlign: 'center'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: '#FEF2F2',
          color: 'var(--primary)',
          padding: '4px 14px',
          borderRadius: 20,
          fontSize: 12,
          fontWeight: 800,
          marginBottom: 12
        }}>
          ✨ Order Direct & Save 20-30% On Every Meal
        </div>
        <h1 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 900, color: '#111827', margin: '0 0 10px' }}>
          Explore Direct Restaurant Partners
        </h1>
        <p style={{ color: '#4B5563', fontSize: 14, maxWidth: 600, margin: '0 auto 20px' }}>
          Support your favorite local restaurants directly. No aggregator markups, instant UPI, and direct delivery.
        </p>

        {/* Search Field */}
        <div style={{
          maxWidth: 600,
          margin: '0 auto',
          position: 'relative',
          display: 'flex',
          alignItems: 'center'
        }}>
          <input
            type="text"
            placeholder="Search restaurants, cuisines, biryani, pizza, or locality..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px 12px 40px',
              borderRadius: 12,
              border: '1.5px solid #E5E7EB',
              fontSize: 14,
              outline: 'none',
              fontFamily: 'inherit'
            }}
          />
          <span style={{ position: 'absolute', left: 14, fontSize: 16, opacity: 0.5 }}>🔍</span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: 14, background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer' }}
            >
              ✕
            </button>
          )}
        </div>
      </section>

      {/* Craving Categories */}
      <section style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8 }}>
          {CRAVING_CATEGORIES.map(cat => {
            const isSelected = selectedCraving === cat.tag;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCraving(cat.tag)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 700,
                  background: isSelected ? 'var(--primary)' : '#FFFFFF',
                  color: isSelected ? '#FFFFFF' : '#374151',
                  border: isSelected ? '1px solid var(--primary)' : '1px solid #E5E7EB',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Restaurant Grid */}
      <section>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          {filteredRestaurants.map(rest => (
            <div
              key={rest.id}
              style={{
                background: '#FFFFFF',
                borderRadius: 16,
                border: '1px solid #E5E7EB',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div style={{
                height: 160,
                background: `linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.65) 100%), url(${rest.cover}) center/cover no-repeat`,
                padding: 14,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                color: '#FFFFFF'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ background: '#16A34A', color: '#FFFFFF', fontSize: 11, fontWeight: 900, padding: '3px 8px', borderRadius: 6 }}>
                    ✓ DIRECT • 0% MARKUP
                  </span>
                  <span style={{ background: 'rgba(0,0,0,0.6)', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>
                    ⏱️ {rest.prepTime}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <span style={{ background: '#FFFFFF', color: '#111827', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800 }}>
                    {rest.savingsText}
                  </span>
                  <span style={{ background: '#16A34A', color: '#FFFFFF', padding: '2px 7px', borderRadius: 6, fontSize: 12, fontWeight: 800 }}>
                    ★ {rest.rating}
                  </span>
                </div>
              </div>

              <div style={{ padding: 16 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: '0 0 4px' }}>{rest.name}</h3>
                <p style={{ fontSize: 12.5, color: '#6B7280', margin: '0 0 8px' }}>📍 {rest.locality}</p>
                <p style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.4, margin: '0 0 16px' }}>{rest.tagline}</p>

                <div style={{ display: 'flex', gap: 8 }}>
                  <Link
                    href={`/${rest.slug}`}
                    className="btn-primary"
                    style={{ flex: 1, padding: '10px 14px', fontSize: 13, borderRadius: 8, textAlign: 'center', textDecoration: 'none' }}
                  >
                    Open Direct Storefront ➔
                  </Link>
                  <a
                    href={`https://wa.me/${rest.phone}?text=${encodeURIComponent(`Hi ${rest.name}! I would like to place a direct order.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: '#25D366',
                      color: '#FFFFFF',
                      padding: '10px 14px',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 800,
                      textDecoration: 'none',
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
    </div>
  );
}

