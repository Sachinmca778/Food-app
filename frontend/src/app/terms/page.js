'use client';

import React from 'react';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div style={{ maxWidth: 840, margin: '40px auto 80px', padding: '0 20px', color: '#374151', lineHeight: 1.65 }}>
      <Link href="/" style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', textDecoration: 'none' }}>
        ← Back to DirectDine
      </Link>

      <h1 style={{ fontSize: 32, fontWeight: 900, color: '#111827', margin: '20px 0 8px' }}>
        Terms of Service
      </h1>
      <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 28 }}>
        Last updated: November 2026
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontSize: 14 }}>
        <section>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827', marginBottom: 8 }}>
            1. Software License &amp; 0% Commission Nature
          </h2>
          <p>
            DirectDine provides a Software-as-a-Service (SaaS) digital operating system for food &amp; beverage merchants. DirectDine is not a food aggregator, marketplace broker, or food delivery fleet operator. We charge a flat software subscription fee (monthly or annual) and do not take any per-order marketplace commission.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827', marginBottom: 8 }}>
            2. Food Quality, Hygiene &amp; FSSAI Compliance
          </h2>
          <p>
            The restaurant merchant is solely responsible for food preparation, hygiene, correct allergen tagging, and holding a valid FSSAI (Food Safety and Standards Authority of India) license. DirectDine provides a field in each digital storefront to display the restaurant&rsquo;s 14-digit FSSAI license number.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827', marginBottom: 8 }}>
            3. Direct UPI Settlement
          </h2>
          <p>
            Customer payments are transferred directly from the customer&rsquo;s bank account/UPI handle to the merchant&rsquo;s linked bank UPI ID. DirectDine does not intermediate payment settlements. Any payment discrepancies between customer and merchant must be resolved directly or through their respective issuing banks.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827', marginBottom: 8 }}>
            4. Order Fulfillment &amp; Logistics
          </h2>
          <p>
            Merchants may fulfill orders using in-house delivery staff, dine-in table service, takeaway pickup, or through third-party hyperlocal delivery partners (such as Porter, Borzo, Shadowfax, or Flash). DirectDine is not liable for delayed deliveries caused by third-party courier services.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827', marginBottom: 8 }}>
            5. Termination &amp; Subscription Renewal
          </h2>
          <p>
            Merchants may cancel their monthly or annual subscription at any time prior to the next billing cycle through the kitchen partner portal or by contacting their dedicated WhatsApp manager.
          </p>
        </section>
      </div>
    </div>
  );
}

