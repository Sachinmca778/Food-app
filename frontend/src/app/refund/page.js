'use client';

import React from 'react';
import Link from 'next/link';

export default function RefundPage() {
  return (
    <div style={{ maxWidth: 840, margin: '40px auto 80px', padding: '0 20px', color: '#374151', lineHeight: 1.65 }}>
      <Link href="/" style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', textDecoration: 'none' }}>
        ← Back to DirectDine
      </Link>

      <h1 style={{ fontSize: 32, fontWeight: 900, color: '#111827', margin: '20px 0 8px' }}>
        Refund &amp; Cancellation Policy
      </h1>
      <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 28 }}>
        Last updated: November 2026
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontSize: 14 }}>
        <section>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827', marginBottom: 8 }}>
            1. 7-Day Free Trial Guarantee
          </h2>
          <p>
            All new restaurant merchants receive a 7-day complimentary free trial. No credit card or upfront deposit is required to start. If you decide DirectDine is not the right fit for your food business within the 7-day trial period, no charges will ever be levied.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827', marginBottom: 8 }}>
            2. SaaS Subscription Refunds
          </h2>
          <p>
            For paid monthly or annual subscriptions, refund requests initiated within 48 hours of initial renewal or purchase will be reviewed on a case-by-case basis. If you experience technical defects preventing direct orders that our support team cannot resolve within 48 hours, a pro-rata refund will be issued to your original payment method within 5-7 business days.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827', marginBottom: 8 }}>
            3. End-Customer Food Order Refunds
          </h2>
          <p>
            Because food preparation and delivery are managed directly by each independent restaurant, all food quality, missing item, or cancellation inquiries by diners must be handled by the respective restaurant merchant. The restaurant can initiate refunds directly to the customer via UPI or issue in-store loyalty points.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827', marginBottom: 8 }}>
            4. Cancellation Procedure
          </h2>
          <p>
            To cancel your DirectDine SaaS subscription, simply message your dedicated WhatsApp Account Manager or email <code>billing@directdine.in</code>. Your storefront and kitchen KDS will remain active until the end of your prepaid billing period.
          </p>
        </section>
      </div>
    </div>
  );
}

