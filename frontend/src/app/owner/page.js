'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchAPI } from '@/lib/api';

export default function OwnerDashboard() {
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Determine which restaurant we own
  useEffect(() => {
    const storedSlug = typeof window !== 'undefined' && localStorage.getItem('owner_restaurant_slug');
    if (!storedSlug) {
      setError('No owned restaurant found. Please create a trial first.');
      setLoading(false);
      return;
    }
    fetchAPI(`/restaurant/${storedSlug}`)
      .then(res => {
        if (res.success) {
          setRestaurant(res.restaurant);
        } else {
          setError(res.error || 'Failed to load restaurant');
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // After Stripe redirect back, verify checkout success
  useEffect(() => {
    if (!restaurant) return;
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    if (sessionId) {
      // Call backend to finalize subscription
      fetchAPI('/payments/checkout-success', {
        method: 'POST',
        body: JSON.stringify({ sessionId })
      })
        .then(res => {
          if (res.success) {
            // Reload restaurant data to reflect new plan
            fetchAPI(`/restaurant/${restaurant.slug}`)
              .then(r => r.success && setRestaurant(r.restaurant))
              .catch(() => {});
          } else {
            alert(res.error || 'Subscription verification failed');
          }
        })
        .catch(e => alert(e.message));
    }
  }, [restaurant]);
  useEffect(() => {
    const storedSlug = typeof window !== 'undefined' && localStorage.getItem('owner_restaurant_slug');
    if (!storedSlug) {
      setError('No owned restaurant found. Please create a trial first.');
      setLoading(false);
      return;
    }
    fetchAPI(`/restaurant/${storedSlug}`)
      .then(res => {
        if (res.success) {
          setRestaurant(res.restaurant);
        } else {
          setError(res.error || 'Failed to load restaurant');
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleUpgrade = async (plan) => {
    try {
      const res = await fetchAPI('/payments/create-subscription', {
        method: 'POST',
        body: JSON.stringify({ slug: restaurant.slug, plan })
      });
      if (res.success && res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      } else {
        alert(res.error || 'Failed to start checkout');
      }
    } catch (e) {
      alert(e.message);
    }
  }; {
    alert('Upgrade flow not yet implemented.');
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <p>Loading your restaurant...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <p style={{ color: 'red' }}>{error}</p>
        <Link href='/' style={{ color: 'var(--primary)' }}>Back to Home</Link>
      </div>
    );
  }

  // Calculate remaining trial days if applicable
  const trialEnds = restaurant?.trial_ends_at ? new Date(restaurant.trial_ends_at) : null;
  const daysLeft = trialEnds ? Math.max(0, Math.ceil((trialEnds - new Date()) / (1000 * 60 * 60 * 24))) : null;

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 16px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: 24 }}>Restaurant Owner Dashboard</h1>
      <section style={{ background: '#F9FAFB', padding: 24, borderRadius: 12, marginBottom: 24 }}>
        <h2>{restaurant?.name}</h2>
        {restaurant?.logo_url && (
          <img src={restaurant.logo_url} alt='logo' style={{ maxWidth: 140, borderRadius: 8, marginBottom: 12 }} />
        )}
        <p>{restaurant?.description}</p>
        <p><strong>Phone:</strong> {restaurant?.phone}</p>
        <p><strong>City:</strong> {restaurant?.city}</p>

        {/* QR placeholder */}
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <img src={`/qr/${restaurant?.slug}.png`} alt='QR Code' style={{ width: 180, height: 180, background: '#E5E7EB' }} />
          <p style={{ marginTop: 8, fontSize: 12, color: '#555' }}>Your storefront QR (placeholder)</p>
        </div>

        {/* Trial info */}
        {restaurant?.plan === 'trial' && daysLeft != null && (
          <div style={{ marginTop: 20, padding: 12, background: '#FFF7ED', borderRadius: 8, border: '1px solid #FCD34D' }}>
            <p style={{ margin: 0, fontWeight: 600 }}>
              Your trial ends in <span style={{ color: '#D97706' }}>{daysLeft} day{daysLeft !== 1 ? 's' : ''}</span>.
            </p>
            <button onClick={handleUpgrade} style={{ marginTop: 12, padding: '8px 16px', background: 'var(--primary)', color: '#FFF', border: 'none', borderRadius: 4 }}>
              Upgrade to Paid Plan
            </button>
          </div>
        )}
      </section>
      <Link href='/' style={{ display: 'block', textAlign: 'center', marginTop: 24, color: 'var(--primary)' }}>Back to Home</Link>
    </div>
  );
}

