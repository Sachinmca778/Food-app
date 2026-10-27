'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import { fetchAPI } from '@/lib/api';

function RatingContent() {
  const params = useParams();
  const token = params?.token;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function checkRating() {
      try {
        const res = await fetchAPI(`/ratings/${token}`);
        if (res.success) {
          setOrder(res.order);
          if (res.rating) {
            setSubmitted(true);
            setStars(res.rating.stars || 5);
            setComment(res.rating.comment || '');
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    checkRating();
  }, [token]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetchAPI(`/ratings/${token}`, {
        method: 'POST',
        body: JSON.stringify({ stars, comment })
      });
      if (res.success) {
        setSubmitted(true);
        try {
          confetti({ particleCount: 80, spread: 60 });
        } catch (e) {}
      } else {
        setError(res.error || 'Failed to submit rating');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <div style={{ width: 44, height: 44, border: '3px solid #E3E5EB', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style jsx>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 500, margin: '50px auto', padding: '0 16px' }}>
      <div style={{ background: '#FFFFFF', padding: '36px 28px', textAlign: 'center', borderRadius: 20, border: '1px solid #E3E5EB', boxShadow: 'var(--shadow-md)' }}>
        {submitted ? (
          <div>
            <div style={{ fontSize: 56, marginBottom: 14 }}>⭐</div>
            <h1 style={{ fontSize: 24, marginBottom: 8, color: '#1C1C1C' }}>Thank You for Your Feedback!</h1>
            <p style={{ color: '#4F4F4F', fontSize: 14, marginBottom: 20, lineHeight: 1.5 }}>
              Your feedback goes directly to {order?.restaurant_name || 'the restaurant'} and helps maintain top quality.
            </p>
            <div style={{ background: '#EDF8F0', border: '1px solid #A7E3B6', color: '#1B7A32', padding: 12, borderRadius: 10, fontSize: 14, fontWeight: 700, marginBottom: 24 }}>
              🎁 50 Bonus Loyalty Points Credited to your Phone!
            </div>
            <Link href="/" className="btn-primary" style={{ width: '100%', padding: '13px', borderRadius: 10 }}>
              Back to Home ➔
            </Link>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 44, marginBottom: 8 }}>😋</div>
            <h1 style={{ fontSize: 24, marginBottom: 4, color: '#1C1C1C' }}>How was your food?</h1>
            <p style={{ color: '#696969', fontSize: 13.5, marginBottom: 24 }}>
              Order #{order?.order_no || ''} from {order?.restaurant_name || 'Spice Garden'}
            </p>

            {/* STAR RATING INTERACTION */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, fontSize: 40, marginBottom: 24, cursor: 'pointer' }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <span
                  key={s}
                  onClick={() => setStars(s)}
                  style={{
                    color: s <= stars ? '#F59E0B' : '#E5E7EB',
                    transition: 'transform 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
                  onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                >
                  ★
                </span>
              ))}
            </div>

            <div style={{ marginBottom: 20, textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: 12.5, color: '#4F4F4F', marginBottom: 6, fontWeight: 600 }}>
                Any comments for the kitchen or delivery rider?
              </label>
              <textarea
                rows={3}
                placeholder="The flavors, warmth of food, packaging quality..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="input-field"
                style={{ resize: 'none', height: 80 }}
              />
            </div>

            {error && (
              <p style={{ color: 'var(--status-cancel)', fontSize: 13, marginBottom: 16 }}>⚠️ {error}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary"
              style={{ width: '100%', padding: '14px 20px', fontSize: 15, borderRadius: 10 }}
            >
              {submitting ? 'Submitting...' : 'Submit Rating & Claim 50 Points'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrderRatingPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: 60, color: '#696969' }}>Loading rating...</div>}>
      <RatingContent />
    </Suspense>
  );
}
