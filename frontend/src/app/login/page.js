'use client';

import React from 'react';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div style={{ maxWidth: 860, margin: '40px auto 80px', padding: '0 16px' }}>
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: 14,
          background: 'var(--primary)',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 30,
          margin: '0 auto 14px',
          boxShadow: '0 6px 20px var(--primary-glow)'
        }}>
          🍽️
        </div>
        <h1 style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 900, color: '#1C1C1C', letterSpacing: '-0.02em', margin: 0 }}>
          DirectDine Portals Gateway
        </h1>
        <p style={{ color: '#696969', fontSize: 14, marginTop: 6 }}>
          Choose your role to access the corresponding operating console
        </p>
      </div>

      {/* 2 Main Role Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 20,
        marginBottom: 36
      }}>
        {/* Card 1: Restaurant Partner / Kitchen Staff */}
        <div style={{
          background: '#FFFFFF',
          border: '1.5px solid #E3E5EB',
          borderRadius: 20,
          padding: '28px 24px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'transform 0.18s, border-color 0.18s'
        }}>
          <div>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: '#FFF1F2',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              marginBottom: 14,
              border: '1px solid #FECDD3'
            }}>
              🍲
            </div>

            <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              RESTAURANT MERCHANTS & KITCHEN STAFF
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1C1C1C', margin: '4px 0 8px' }}>
              Kitchen Partner Portal
            </h2>
            <p style={{ fontSize: 13, color: '#4F4F4F', lineHeight: 1.5, marginBottom: 16 }}>
              For restaurant owners, chefs, and floor managers to manage live orders (KDS), dish availability, table QRs, and customer loyalty CRM.
            </p>

            <div style={{
              background: '#F8F9FA',
              borderRadius: 10,
              padding: '10px 12px',
              fontSize: 12,
              color: '#4F4F4F',
              marginBottom: 20,
              border: '1px solid #ECEEF2'
            }}>
              <strong>Demo Logins:</strong>
              <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span>• Spice Garden: <code>9876543210</code> / <code>spice123</code></span>
                <span>• Chai &amp; Bites: <code>9988776655</code> / <code>chai123</code></span>
              </div>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="btn-primary"
            style={{ width: '100%', padding: '13px', fontSize: 14, fontWeight: 800, borderRadius: 10 }}
          >
            Enter Kitchen Dashboard ➔
          </Link>
        </div>

        {/* Card 2: Super Admin Console */}
        <div style={{
          background: '#FFFFFF',
          border: '1.5px solid #E3E5EB',
          borderRadius: 20,
          padding: '28px 24px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'transform 0.18s, border-color 0.18s'
        }}>
          <div>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: '#F3E8FF',
              color: '#7C3AED',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              marginBottom: 14,
              border: '1px solid #DDD6FE'
            }}>
              👑
            </div>

            <div style={{ fontSize: 11, fontWeight: 900, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              PLATFORM OWNER & SAAS ADMINISTRATOR
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1C1C1C', margin: '4px 0 8px' }}>
              Master Super Admin
            </h2>
            <p style={{ fontSize: 13, color: '#4F4F4F', lineHeight: 1.5, marginBottom: 16 }}>
              For platform administrators to onboard new restaurants, track platform-wide GMV, manage multi-tenant accounts, and download branded QR kits.
            </p>

            <div style={{
              background: '#F8F9FA',
              borderRadius: 10,
              padding: '10px 12px',
              fontSize: 12,
              color: '#4F4F4F',
              marginBottom: 20,
              border: '1px solid #ECEEF2'
            }}>
              <strong>Master Admin Login:</strong>
              <div style={{ marginTop: 4 }}>
                <span>• Super Admin: <code>9999999999</code> / <code>admin123</code></span>
              </div>
            </div>
          </div>

          <Link
            href="/admin"
            style={{
              width: '100%',
              padding: '13px',
              fontSize: 14,
              fontWeight: 800,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #1E1B4B 0%, #4338CA 100%)',
              color: '#FFFFFF',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(67, 56, 202, 0.25)'
            }}
          >
            Enter Super Admin Console ➔
          </Link>
        </div>
      </div>

      {/* Customer Storefront Demos Strip */}
      <div style={{
        background: '#F8FAFC',
        border: '1.5px solid #E2E8F0',
        borderRadius: 16,
        padding: '20px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 14
      }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>
            🍽️ Looking for the Customer Storefront Experience?
          </div>
          <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 2 }}>
            See how diners browse menus, redeem cash points, and order with 0% markup.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link
            href="/spice-garden"
            style={{
              background: '#FFFFFF',
              color: 'var(--primary)',
              border: '1px solid var(--border-medium)',
              padding: '8px 14px',
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5
            }}
          >
            <span>🍛</span>
            <span>Spice Garden Store</span>
          </Link>

          <Link
            href="/chai-and-bites"
            style={{
              background: '#FFFFFF',
              color: 'var(--primary)',
              border: '1px solid var(--border-medium)',
              padding: '8px 14px',
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5
            }}
          >
            <span>🥐</span>
            <span>Chai &amp; Bites Bakery</span>
          </Link>

          <Link
            href="/"
            className="btn-secondary"
            style={{ padding: '8px 14px', fontSize: 12.5, borderRadius: 8 }}
          >
            ← Platform Home
          </Link>
        </div>
      </div>
    </div>
  );
}

