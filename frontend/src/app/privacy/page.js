'use client';

import React from 'react';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: 840, margin: '40px auto 80px', padding: '0 20px', color: '#374151', lineHeight: 1.65 }}>
      <Link href="/" style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', textDecoration: 'none' }}>
        ← Back to DirectDine
      </Link>

      <h1 style={{ fontSize: 32, fontWeight: 900, color: '#111827', margin: '20px 0 8px' }}>
        Privacy Policy &amp; Data Protection
      </h1>
      <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 28 }}>
        Last updated: November 2026 • Compliant with Digital Personal Data Protection (DPDP) Act, 2023 (India)
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontSize: 14 }}>
        <section>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827', marginBottom: 8 }}>
            1. Merchant Data Ownership (You Own Your Customers)
          </h2>
          <p>
            At DirectDine Technologies Inc. (&ldquo;DirectDine&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;), we strictly believe that your customer relationships belong entirely to you. Unlike third-party aggregators that mask or withhold customer contact information, DirectDine acts solely as a technical <strong>Data Processor</strong> under India&rsquo;s Digital Personal Data Protection (DPDP) Act, 2023. The restaurant merchant is the <strong>Data Fiduciary</strong>.
          </p>
          <p>
            We <strong>never sell, lease, or monetize</strong> your customer phone numbers, ordering history, or diner records. We will never market competing food brands, third-party discounts, or promotions to your customers.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827', marginBottom: 8 }}>
            2. Information Collected
          </h2>
          <p>To facilitate 0% commission direct ordering, we collect:</p>
          <ul style={{ paddingLeft: 20, margin: '6px 0 0' }}>
            <li><strong>Merchant Details:</strong> Restaurant business name, owner name, WhatsApp phone number, FSSAI registration number, UPI VPA (for direct payment routing), and physical outlet address.</li>
            <li><strong>Customer Ordering Data:</strong> Customer name, delivery address, phone number, and dish selections needed by the merchant and delivery rider to prepare and deliver the meal.</li>
            <li><strong>Technical Telemetry:</strong> Device browser type and operating logs to guarantee reliable KDS notifications and prevent fraudulent requests.</li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827', marginBottom: 8 }}>
            3. Instant UPI Payment Privacy &amp; Security
          </h2>
          <p>
            DirectDine facilitates direct peer-to-merchant UPI transactions. Customer funds flow directly into the merchant&rsquo;s linked bank UPI ID (Google Pay, PhonePe, Paytm, BHIM, or bank VPA). DirectDine <strong>never stores, transmits, or handles customer UPI PINs, CVVs, or net banking passwords</strong>. All financial transactions take place within NPCI-authorized bank UPI applications.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827', marginBottom: 8 }}>
            4. WhatsApp Messaging Consent
          </h2>
          <p>
            When customers place an order or interact with our automated WhatsApp ordering bot, transactional messages (order confirmation, live delivery link, digital invoice) are sent under explicit opt-in consent via Meta Cloud API. Diners can opt out of marketing broadcasts at any time by sending &ldquo;STOP&rdquo;.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827', marginBottom: 8 }}>
            5. Data Security &amp; Retention
          </h2>
          <p>
            All data in transit is encrypted using 256-bit TLS/SSL encryption. Database records are stored securely in certified cloud infrastructure. Merchants may request a full export or permanent deletion of their customer database at any time by emailing our Data Protection Officer at <code>privacy@directdine.in</code>.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827', marginBottom: 8 }}>
            6. Contact &amp; Grievance Officer
          </h2>
          <p>
            For privacy inquiries or DPDP compliance queries:<br />
            <strong>Grievance Officer:</strong> Data Protection Cell, DirectDine Technologies Inc.<br />
            Email: <code>privacy@directdine.in</code> | Phone: +91 93103 78572
          </p>
        </section>
      </div>
    </div>
  );
}

