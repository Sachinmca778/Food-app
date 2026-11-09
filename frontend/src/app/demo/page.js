'use client';

import React from 'react';
import Link from 'next/link';

export default function DemoPage() {
  const salesWhatsAppUrl = `https://wa.me/919310378572?text=${encodeURIComponent(
    'Hello DirectDine Team! I would like to book a 1-on-1 guided live demo of the DirectDine restaurant platform.'
  )}`;

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '24px 16px 80px' }}>
      {/* Top Header */}
      <header style={{
        background: '#FFFFFF',
        padding: '16px 24px',
        borderRadius: 16,
        border: '1px solid #E5E7EB',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
        flexWrap: 'wrap',
        gap: 14,
        boxShadow: 'var(--shadow-sm)'
      }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: 'var(--primary)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            boxShadow: '0 4px 12px var(--primary-glow)'
          }}>
            🍽️
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--primary)', letterSpacing: '-0.02em' }}>
              DirectDine
            </div>
            <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 600 }}>
              Live Product Demo Center
            </div>
          </div>
        </Link>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link href="/" style={{ fontSize: 13, fontWeight: 700, color: '#4B5563', textDecoration: 'none' }}>
            ← Back to Home
          </Link>
          <a
            href={salesWhatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
            style={{ padding: '8px 16px', fontSize: 13, borderRadius: 8, textDecoration: 'none' }}
          >
            💬 Book 1-on-1 WhatsApp Demo
          </a>
        </div>
      </header>

      {/* Hero Overview */}
      <div style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto 36px' }}>
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
          ✨ FULL PRODUCT WALKTHROUGH
        </div>
        <h1 style={{ fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 900, color: '#111827', margin: '0 0 12px' }}>
          Experience The Complete DirectDine OS
        </h1>
        <p style={{ color: '#4B5563', fontSize: 15, lineHeight: 1.6, margin: 0 }}>
          Test the exact customer mobile storefront, kitchen order display (KDS), and automated WhatsApp bot used by 50+ smart restaurants across India.
        </p>
      </div>

      {/* 2 Primary Live Experience Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 24,
        marginBottom: 36
      }}>
        {/* Card 1: Customer Storefront */}
        <div style={{
          background: '#FFFFFF',
          border: '1.5px solid #E5E7EB',
          borderRadius: 20,
          padding: '28px 24px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: '#FEF2F2',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
              marginBottom: 16,
              border: '1px solid #FECDD3'
            }}>
              📱
            </div>
            <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              EXPERIENCE 1 • CONSUMER SIDE
            </div>
            <h2 style={{ fontSize: 21, fontWeight: 800, color: '#111827', margin: '4px 0 8px' }}>
              Customer Mobile Storefront
            </h2>
            <p style={{ fontSize: 13.5, color: '#4B5563', lineHeight: 1.55, marginBottom: 18 }}>
              Open the live digital menu of our pilot merchant <strong>Spice Garden</strong>. Experience fast mobile browsing, customizable portions, add-ons, 0% markup, and direct UPI checkout.
            </p>

            <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '12px 14px', border: '1px solid #E2E8F0', marginBottom: 22, fontSize: 12.5, color: '#334155' }}>
              <strong>What to test:</strong>
              <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.5 }}>
                <li>Filter by Pure Veg / Non-Veg</li>
                <li>Add Dum Biryani with raita &amp; spicy gravy add-ons</li>
                <li>Test Table QR Dine-in mode vs Delivery mode</li>
                <li>Apply discount coupons (e.g. WELCOME10)</li>
              </ul>
            </div>
          </div>

          <Link
            href="/spice-garden"
            className="btn-primary"
            style={{
              width: '100%',
              padding: '13px 0',
              fontSize: 14,
              fontWeight: 800,
              textAlign: 'center',
              borderRadius: 10,
              textDecoration: 'none',
              boxShadow: '0 4px 14px var(--primary-glow)'
            }}
          >
            Launch Customer Storefront ➔
          </Link>
        </div>

        {/* Card 2: Kitchen KDS Dashboard */}
        <div style={{
          background: '#FFFFFF',
          border: '1.5px solid #E5E7EB',
          borderRadius: 20,
          padding: '28px 24px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: '#F1F5F9',
              color: '#0F172A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
              marginBottom: 16,
              border: '1px solid #CBD5E1'
            }}>
              👨‍🍳
            </div>
            <div style={{ fontSize: 11, fontWeight: 900, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              EXPERIENCE 2 • RESTAURANT OPERATIONS
            </div>
            <h2 style={{ fontSize: 21, fontWeight: 800, color: '#111827', margin: '4px 0 8px' }}>
              Kitchen Display System (KDS)
            </h2>
            <p style={{ fontSize: 13.5, color: '#4B5563', lineHeight: 1.55, marginBottom: 18 }}>
              Open the live kitchen order display used by chefs and floor managers. Test incoming audio chime alerts, 1-tap accept/dispatch, KOT printing, and customer CRM.
            </p>

            <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '12px 14px', border: '1px solid #E2E8F0', marginBottom: 22, fontSize: 12.5, color: '#334155' }}>
              <strong>What to test:</strong>
              <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.5 }}>
                <li>Auto-fill demo credentials (Spice Garden: 9876543210 / spice123)</li>
                <li>Hear loud audio chimes on new orders</li>
                <li>Print sample thermal KOT receipt slips</li>
                <li>Generate &amp; download branded table QR standees</li>
              </ul>
            </div>
          </div>

          <Link
            href="/dashboard"
            style={{
              width: '100%',
              padding: '13px 0',
              fontSize: 14,
              fontWeight: 800,
              textAlign: 'center',
              borderRadius: 10,
              background: '#0F172A',
              color: '#FFFFFF',
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(15, 23, 42, 0.2)'
            }}
          >
            Launch Kitchen Dashboard ➔
          </Link>
        </div>
      </div>

      {/* 60s Video Tour Strip */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 20,
        border: '1px solid #E5E7EB',
        padding: '24px 28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 36,
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: '#EEF2FF',
            color: '#4F46E5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 26
          }}>
            🎬
          </div>
          {/* <div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: '0 0 3px' }}>
              Watch 60-Second Guided Video Tour
            </h3>
            <p style={{ fontSize: 13, color: '#4B5563', margin: 0 }}>
              Complete high-energy overview with Hindi voiceover covering all 6 screens from QR scan to kitchen chime.
            </p>
          </div> */}
        </div>

        <Link
          href="/video"
          className="btn-secondary"
          style={{
            padding: '12px 22px',
            fontSize: 13.5,
            fontWeight: 800,
            borderRadius: 10,
            textDecoration: 'none'
          }}
        >
          Watch Video Tour ➔
        </Link>
      </div>

      {/* Need Guided Assistance Box */}
      <div style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        borderRadius: 20,
        padding: '36px 28px',
        textAlign: 'center',
        color: '#FFFFFF'
      }}>
        <h3 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 8px' }}>
          Want a Custom Demo for Your Restaurant?
        </h3>
        <p style={{ color: '#94A3B8', fontSize: 14, maxWidth: 540, margin: '0 auto 20px', lineHeight: 1.5 }}>
          Our solutions engineer will hop on a quick 10-minute Google Meet or WhatsApp video call to demo how DirectDine fits your specific menu and floor layout.
        </p>
        <a
          href={salesWhatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
          style={{
            padding: '12px 24px',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 800,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <span>💬</span>
          <span>Schedule Guided WhatsApp Call</span>
        </a>
      </div>
    </div>
  );
}

