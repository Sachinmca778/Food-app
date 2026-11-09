'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { fetchAPI } from '@/lib/api';

export default function HomePage() {
  // Language toggle: 'en' for English, 'hi' for Hinglish
  const [lang, setLang] = useState('en');

  // Pricing Toggle ('monthly' vs 'annual')
  const [billingCycle, setBillingCycle] = useState('monthly');

  // FAQ Accordion
  const [openFaq, setOpenFaq] = useState(0);

  // 7-Day Free Trial Onboarding Modal State
  const [onboardModalOpen, setOnboardModalOpen] = useState(false);
  const [onboardData, setOnboardData] = useState({
    businessName: '',
    foodType: 'Restaurant & Dine-in',
    phone: '',
    city: ''
  });
  const [onboardSuccess, setOnboardSuccess] = useState(false);

  // Profit / Commission Calculator State
  const [monthlyOrders, setMonthlyOrders] = useState(1200);
  const [avgTicket, setAvgTicket] = useState(450);

  // Dynamic Net Savings Calculation
  const monthlyGMV = monthlyOrders * avgTicket;
  const aggregatorCommission = Math.round(monthlyGMV * 0.28);
  const directDineFee = billingCycle === 'annual' ? 1599 : 1999;
  const netMonthlySavings = Math.max(0, aggregatorCommission - directDineFee);
  const netAnnualSavings = netMonthlySavings * 12;

  // WhatsApp Simulator state
  const [waPhone, setWaPhone] = useState('9123456789');
  const [waInput, setWaInput] = useState('Hi');
  const [waLog, setWaLog] = useState([
    {
      sender: 'bot',
      text: '👋 Welcome to Spice Garden Direct Ordering Bot!\n0% commission direct ordering powered by DirectDine. Tap a quick chip below or send "Hi" to test our automated WhatsApp engine.'
    }
  ]);
  const [waLoading, setWaLoading] = useState(false);

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

  // Handle Free Trial Onboarding Submit
  const handleOnboardSubmit = (e) => {
    e.preventDefault();
    setOnboardSuccess(true);
    setTimeout(() => {
      setOnboardModalOpen(false);
      setOnboardSuccess(false);
      setOnboardData({ businessName: '', foodType: 'Restaurant & Dine-in', phone: '', city: '' });
    }, 3000);
  };

  // FAQs List with 100% complete, thorough answers
  const faqs = [
    {
      q: lang === 'hi' ? 'Setup mein kitna time lagta hai?' : 'How long does the setup take?',
      a: lang === 'hi'
        ? 'Sirf 10 se 15 minute! Aap apna menu upload karte hain, apna UPI ID link karte hain, aur aapka branded storefront aur QR codes instantly ready ho jaate hain. Hamari onboarding team WhatsApp par bhi poora setup free me karwa deti hai.'
        : 'Under 10 to 15 minutes! Simply enter your menu items, set your prices, and connect your Google Pay or PhonePe UPI ID. Your branded mobile storefront and printable table QR standees are generated instantly.'
    },
    {
      q: lang === 'hi' ? 'Customer ka payment mere bank account mein kaise aayega?' : 'How do payments reach my bank account?',
      a: lang === 'hi'
        ? 'Direct aur Instant! Customer seedha aapke Google Pay, PhonePe, Paytm ya Bank UPI ID par pay karta hai. Paisa kisi third-party wallet me nahi rukta, seedha aapke bank account me bina kisi delay ya deduction ke credit hota hai.'
        : 'Directly and instantly via UPI! Customer payments transfer straight into your existing Google Pay, PhonePe, Paytm, or bank UPI ID with 0-second delay. DirectDine never holds your money or deducts commission.'
    },
    {
      q: lang === 'hi' ? 'Kya customer ko koi app download karni padegi?' : 'Do customers need to download any app?',
      a: lang === 'hi'
        ? 'Bilkul nahi! DirectDine 100% web aur WhatsApp par chalta hai. Customer table QR scan kare ya Instagram/WhatsApp link par tap kare, unka browser bina kisi download ke 1 second mein menu load kar deta hai.'
        : 'No app download required! DirectDine runs natively in any mobile browser and over WhatsApp Cloud API. Customers scan your table QR or tap your Instagram bio link to order in 1 tap.'
    },
    {
      q: lang === 'hi' ? 'Zomato/Swiggy ke delivery boy milenge kya, ya delivery kaise hogi?' : 'How do deliveries work without aggregator riders?',
      a: lang === 'hi'
        ? 'DirectDine direct orders ke liye banaya gaya hai. Aap apne existing in-house delivery staff use kar sakte hain, ya hyperlocal delivery partners (jaise Shadowfax, Dunzo, Borzo, Porter) ke through 5-10 km radius me deliver kar sakte hain. Dine-in aur Takeaway orders me toh 0 delivery cost hoti hai!'
        : 'You can fulfill deliveries using your in-house delivery staff or connect with on-demand hyperlocal logistics like Shadowfax, Dunzo, Borzo, or Porter. For Dine-in and Takeaway orders, delivery overhead is zero.'
    },
    {
      q: lang === 'hi' ? 'Agar koi problem aaye toh support kaisa milega?' : 'What kind of customer support is provided?',
      a: lang === 'hi'
        ? 'Har restaurant owner ko ek dedicated WhatsApp Account Manager milta hai. 24/7 technical support aur menu updates ke liye aap direct WhatsApp message ya phone call kar sakte hain.'
        : 'Every merchant gets a dedicated WhatsApp Account Manager and 24/7 technical priority support for instant menu updates, staff training, and troubleshooting.'
    },
    {
      q: lang === 'hi' ? 'Kya koi hidden charges ya per-order commission hai?' : 'Are there any hidden cuts or per-order commissions?',
      a: lang === 'hi'
        ? 'Bilkul 0% commission! Aap sirf ek flat monthly/annual subscription fee pay karte hain. Chahe aap mahine me 100 orders lein ya 10,000 orders lein, DirectDine ₹1 bhi commission nahi leta.'
        : 'Strictly 0% commission forever! You only pay a flat monthly or annual software subscription. Whether you process 100 orders or 10,000 orders a month, you keep 100% of every rupee.'
    }
  ];

  const salesWhatsAppUrl = `https://wa.me/919876543210?text=${encodeURIComponent(
    'Hello DirectDine Team! I own a restaurant/cloud kitchen and want a live 10-minute demo of DirectDine 0% commission system.'
  )}`;

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: '16px 16px 80px' }}>
      
      {/* 1. TOP B2B SAAS NAVBAR */}
      <nav style={{
        background: '#FFFFFF',
        padding: '14px 22px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 28,
        borderRadius: 16,
        border: '1px solid #E5E7EB',
        boxShadow: 'var(--shadow-sm)',
        flexWrap: 'wrap',
        gap: 14
      }}>
        {/* Brand Logo */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 42,
            height: 42,
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--primary)' }}>
                DirectDine
              </span>
              <span style={{ fontSize: 10, background: '#FEF2F2', color: 'var(--primary)', fontWeight: 800, padding: '2px 7px', borderRadius: 4, border: '1px solid #FECDD3' }}>
                B2B SAAS
              </span>
            </div>
            <div style={{ fontSize: 10.5, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
              0% Commission Restaurant OS
            </div>
          </div>
        </Link>

        {/* Quick Anchor Links (Desktop) */}
        <div style={{
          display: 'flex',
          gap: 20,
          alignItems: 'center',
          fontSize: 13.5,
          fontWeight: 700,
          color: '#4B5563',
          flexWrap: 'wrap'
        }}>
          <a href="#features" style={{ color: '#4B5563', textDecoration: 'none' }}>Features</a>
          <a href="#how-it-works" style={{ color: '#4B5563', textDecoration: 'none' }}>How It Works</a>
          <a href="#calculator" style={{ color: '#4B5563', textDecoration: 'none' }}>Savings Calculator</a>
          <a href="#demo" style={{ color: '#4B5563', textDecoration: 'none' }}>Live Demo</a>
          <a href="#pricing" style={{ color: '#4B5563', textDecoration: 'none' }}>Pricing</a>
          <a href="#faqs" style={{ color: '#4B5563', textDecoration: 'none' }}>FAQs</a>
        </div>

        {/* Right Actions: Language Switcher, Kitchen Login, Free Trial */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Language Toggle (EN / Hinglish) */}
          <div style={{
            display: 'inline-flex',
            background: '#F1F5F9',
            padding: 3,
            borderRadius: 8,
            border: '1px solid #E2E8F0'
          }}>
            <button
              onClick={() => setLang('en')}
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 11.5,
                fontWeight: 800,
                background: lang === 'en' ? '#FFFFFF' : 'transparent',
                color: lang === 'en' ? 'var(--primary)' : '#64748B',
                boxShadow: lang === 'en' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer',
                border: 'none'
              }}
            >
              EN
            </button>
            <button
              onClick={() => setLang('hi')}
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 11.5,
                fontWeight: 800,
                background: lang === 'hi' ? '#FFFFFF' : 'transparent',
                color: lang === 'hi' ? 'var(--primary)' : '#64748B',
                boxShadow: lang === 'hi' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer',
                border: 'none'
              }}
            >
              🇮🇳 Hinglish
            </button>
          </div>

          <Link
            href="/dashboard"
            style={{
              padding: '8px 14px',
              fontSize: 12.5,
              fontWeight: 800,
              color: '#111827',
              textDecoration: 'none',
              borderRadius: 8,
              border: '1px solid #E5E7EB',
              background: '#FFFFFF'
            }}
          >
            Kitchen Login ➔
          </Link>

          <button
            onClick={() => setOnboardModalOpen(true)}
            className="btn-primary"
            style={{
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 800,
              borderRadius: 8,
              cursor: 'pointer'
            }}
          >
            Start Free Trial
          </button>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section style={{
        background: '#FFFFFF',
        borderRadius: 24,
        border: '1px solid #E5E7EB',
        padding: '44px 28px',
        marginBottom: 32,
        boxShadow: 'var(--shadow-sm)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: -40,
          right: -40,
          width: 240,
          height: 240,
          background: 'radial-gradient(circle, rgba(226,55,68,0.08) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 36,
          alignItems: 'center'
        }}>
          {/* Left Column: Value Copy & 2 Primary CTAs */}
          <div>
            {/* Top Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: '#FEF2F2',
              border: '1px solid #FECDD3',
              color: 'var(--primary)',
              padding: '6px 16px',
              borderRadius: 20,
              fontSize: 12.5,
              fontWeight: 800,
              marginBottom: 16
            }}>
              <span className="pulse-indicator" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', display: 'inline-block' }} />
              {lang === 'hi'
                ? '🔥 0% Commission Forever • WhatsApp Bot • 10-Minute Setup'
                : '🔥 0% Commission Forever • WhatsApp Bot • 10-Minute Setup'}
            </div>

            {/* Main Punchy Headline */}
            <h1 style={{
              fontSize: 'clamp(28px, 4vw, 44px)',
              fontWeight: 900,
              lineHeight: 1.18,
              color: '#111827',
              letterSpacing: '-0.03em',
              marginBottom: 14
            }}>
              {lang === 'hi' ? (
                <>
                  Zomato/Swiggy ko 30% commission dena band karo. <br />
                  <span style={{ color: 'var(--primary)' }}>Apne customers, apna paisa.</span>
                </>
              ) : (
                <>
                  Stop Paying 30% Commissions to Aggregators. <br />
                  <span style={{ color: 'var(--primary)' }}>Own Your Customers &amp; Revenue.</span>
                </>
              )}
            </h1>

            {/* Sub-headline */}
            <p style={{
              color: '#4B5563',
              fontSize: 'clamp(14.5px, 1.6vw, 16.5px)',
              lineHeight: 1.6,
              marginBottom: 24
            }}>
              {lang === 'hi'
                ? 'DirectDine deta hai restaurant, cloud kitchen aur cafe ko apna custom branded online storefront, automated WhatsApp ordering bot, QR ordering aur direct UPI instant settlement. Sirf 10 minute mein live jao.'
                : 'DirectDine gives restaurants, cloud kitchens & cafes your own custom branded online storefront, automated WhatsApp ordering bot, contactless table QR, and instant 0-second UPI settlements direct to your bank account.'}
            </p>

            {/* 2 Clear, High-Converting CTAs */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
              <button
                onClick={() => setOnboardModalOpen(true)}
                className="btn-primary"
                style={{
                  padding: '13px 24px',
                  borderRadius: 10,
                  fontSize: 14.5,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 4px 14px var(--primary-glow)'
                }}
              >
                <span>🚀</span>
                <span>{lang === 'hi' ? 'Start 7-Day Free Trial' : 'Start 7-Day Free Trial'}</span>
              </button>

              <a
                href={salesWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: '#F0FDF4',
                  color: '#166534',
                  border: '1.5px solid #BBF7D0',
                  padding: '13px 20px',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  textDecoration: 'none'
                }}
              >
                <span>💬</span>
                <span>{lang === 'hi' ? 'Book Demo on WhatsApp' : 'Book Demo on WhatsApp'}</span>
              </a>
            </div>

            {/* Value Checkmarks */}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12.5, fontWeight: 700, color: '#6B7280' }}>
              <span>✓ No credit card needed</span>
              <span>✓ Instant UPI direct to your bank</span>
              <span>✓ Live in 10 minutes</span>
            </div>
          </div>

          {/* Right Column: Visual Product Mockup (Storefront + WhatsApp Bot) */}
          <div style={{
            background: '#F8FAFC',
            borderRadius: 20,
            border: '1.5px solid #E2E8F0',
            padding: '24px 20px',
            position: 'relative'
          }}>
            {/* Mockup Frame Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
              paddingBottom: 12,
              borderBottom: '1px solid #E2E8F0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444', display: 'inline-block' }} />
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#F59E0B', display: 'inline-block' }} />
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                <span style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', marginLeft: 4 }}>
                  orders.spicegarden.directdine.in
                </span>
              </div>
              <span style={{ fontSize: 11, background: '#DCFCE7', color: '#166534', padding: '2px 8px', borderRadius: 4, fontWeight: 800 }}>
                0% COMMISSION
              </span>
            </div>

            {/* Mobile Storefront Card */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: 14,
              border: '1px solid #E5E7EB',
              padding: '16px',
              marginBottom: 14,
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: '#FEF2F2', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                    🍛
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>Spice Garden</div>
                    <div style={{ fontSize: 11, color: '#16A34A', fontWeight: 700 }}>Direct UPI • Save ₹85 vs Zomato</div>
                  </div>
                </div>
                <span style={{ background: '#FEF2F2', color: 'var(--primary)', fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 6 }}>
                  Direct Store
                </span>
              </div>

              {/* Sample Dish Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FAFAFA', padding: '10px 12px', borderRadius: 8, border: '1px solid #F1F5F9' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Handi Dum Biryani (1kg)</div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#111827' }}>₹450 <span style={{ fontSize: 11, color: '#9CA3AF', textDecoration: 'line-through' }}>₹580 on Zomato</span></div>
                </div>
                <span style={{ background: '#FFFFFF', border: '1.5px solid var(--primary)', color: 'var(--primary)', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 800 }}>
                  ADDED ✓
                </span>
              </div>
            </div>

            {/* WhatsApp Notification Bubble */}
            <div style={{
              background: '#DCF8C6',
              borderRadius: 12,
              padding: '12px 14px',
              border: '1px solid #C4E9AE',
              fontSize: 12.5,
              color: '#111B21',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 800, color: '#075E54' }}>
                  <span>💬 WhatsApp Bot</span>
                  <span>✓</span>
                </div>
                <span style={{ fontSize: 11, color: '#556B2F' }}>Just now</span>
              </div>
              <div style={{ lineHeight: 1.45 }}>
                🎉 <strong>New Order #1084 received!</strong> (₹450 Paid via UPI straight to your HDFC bank). Kitchen KDS chiming now!
              </div>
              <div style={{ marginTop: 6, fontSize: 11, fontWeight: 800, color: '#166534' }}>
                💰 Commission Paid to Aggregators: ₹0.00 (You saved ₹126!)
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. TRUST STRIP & PROVEN METRICS */}
      <section style={{ marginBottom: 44, textAlign: 'center' }}>
        <p style={{ fontSize: 12, fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
          {lang === 'hi'
            ? 'Trusted by 50+ smart restaurants, cloud kitchens & cafes across India'
            : 'Trusted by 50+ smart restaurants, cloud kitchens & cafes across India'}
        </p>

        {/* Pilot Restaurant Badges */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 12,
          flexWrap: 'wrap',
          marginBottom: 24
        }}>
          {[
            { name: 'Spice Garden', city: 'Bandra West, Mumbai', icon: '🍛' },
            { name: 'Chai & Bites Cafe', city: 'Fort, Mumbai', icon: '🥐' },
            { name: 'Royal Biryani Hub', city: 'Andheri, Mumbai', icon: '🍗' },
            { name: 'Urban Crust Woodfired', city: 'Indiranagar, Bengaluru', icon: '🍕' },
            { name: 'The Roll Company', city: 'CyberHub, Gurugram', icon: '🌯' },
            { name: 'Punjabi Rasoi & Tiffin', city: 'Viman Nagar, Pune', icon: '🍲' }
          ].map(p => (
            <div
              key={p.name}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: 12,
                padding: '8px 14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <span style={{ fontSize: 18 }}>{p.icon}</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: '#111827' }}>{p.name}</div>
                <div style={{ fontSize: 10.5, color: '#6B7280' }}>{p.city}</div>
              </div>
            </div>
          ))}
        </div>

        {/* 4 Hard Metrics Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16
        }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', padding: '20px 16px', borderRadius: 16, boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 900, color: 'var(--primary)', marginBottom: 4 }}>
              ₹42 Lakhs+
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Commission Saved</div>
            <div style={{ fontSize: 11.5, color: '#6B7280', marginTop: 2 }}>Kept in owners' bank accounts</div>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', padding: '20px 16px', borderRadius: 16, boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 900, color: '#111827', marginBottom: 4 }}>
              1,25,000+
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Direct Orders Processed</div>
            <div style={{ fontSize: 11.5, color: '#6B7280', marginTop: 2 }}>Via QR, web &amp; WhatsApp bot</div>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', padding: '20px 16px', borderRadius: 16, boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 900, color: '#16A34A', marginBottom: 4 }}>
              100%
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Customer Data Retained</div>
            <div style={{ fontSize: 11.5, color: '#6B7280', marginTop: 2 }}>Unmasked phone numbers for remarketing</div>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', padding: '20px 16px', borderRadius: 16, boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 900, color: '#0F172A', marginBottom: 4 }}>
              0 Seconds
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Payment Delay</div>
            <div style={{ fontSize: 11.5, color: '#6B7280', marginTop: 2 }}>Instant UPI credit, no 14-day waits</div>
          </div>
        </div>
      </section>

      {/* 4. THE PROBLEM SECTION ("THE AGGREGATOR TRAP") */}
      <section style={{ marginBottom: 48 }}>
        <div style={{ textAlign: 'center', maxWidth: 700, margin: '0 auto 28px' }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
            {lang === 'hi' ? 'AGGREGATORS KI ASLIYAT' : 'THE AGGREGATOR TRAP'}
          </div>
          <h2 style={{ fontSize: 'clamp(22px, 3.2vw, 30px)', color: '#111827', fontWeight: 900 }}>
            {lang === 'hi'
              ? '3 Badi Problems Jo Aapka Restaurant Profit Khatam Kar Rahi Hain'
              : 'Why Aggregators Are Silently Eating Your Restaurant Profits'}
          </h2>
          <p style={{ color: '#4B5563', fontSize: 14, margin: '6px 0 0' }}>
            {lang === 'hi'
              ? 'Mehnat aapki, khana aapka, kitchen aapka — lekin 30% profit Zomato/Swiggy le jaate hain.'
              : 'You pay for rent, chefs, ingredients, and staff. Aggregators capture 30% of your revenue and lock your customers away.'}
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
          gap: 20
        }}>
          {/* Trap 1 */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #FCA5A5',
            borderRadius: 18,
            padding: '24px 22px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 14 }}>
              📉
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#991B1B', margin: '0 0 8px' }}>
              25% - 32% Commission Cut
            </h3>
            <p style={{ fontSize: 13.5, color: '#4B5563', lineHeight: 1.55, margin: 0 }}>
              {lang === 'hi'
                ? 'Har ₹500 ke order par aap ₹140 se ₹160 aggregator ko de dete hain. Mahine ka lakho rupya seedha commission me waste hota hai.'
                : 'On every ₹500 order, aggregators deduct ₹140 to ₹160 in commissions, delivery cuts, and convenience charges. That is ₹1.5L+ lost every month.'}
            </p>
          </div>

          {/* Trap 2 */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #FCA5A5',
            borderRadius: 18,
            padding: '24px 22px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 14 }}>
              🔒
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#991B1B', margin: '0 0 8px' }}>
              Customer Data Stolen &amp; Masked
            </h3>
            <p style={{ fontSize: 13.5, color: '#4B5563', lineHeight: 1.55, margin: 0 }}>
              {lang === 'hi'
                ? 'Aapko customer ka phone number tak nahi milta. Kal ko unhi customers ko Zomato aapke competitor restaurant ka 50% off discount push karta hai.'
                : 'Aggregators mask your customers’ phone numbers and names. You cannot market to them directly, while aggregators push competitor discounts to your loyal foodies.'}
            </p>
          </div>

          {/* Trap 3 */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #FCA5A5',
            borderRadius: 18,
            padding: '24px 22px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 14 }}>
              ⏳
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#991B1B', margin: '0 0 8px' }}>
              7 to 14 Days Payment Delay
            </h3>
            <p style={{ fontSize: 13.5, color: '#4B5563', lineHeight: 1.55, margin: 0 }}>
              {lang === 'hi'
                ? 'Customer ne aaj khana khaya, lekin paisa 10 se 14 din baad aata hai. Daily vendor payments aur staff salary manage karna nightmare ban jata hai.'
                : 'Customer paid today, but your payout arrives 7 to 14 days later. Your daily cash flow freezes while vendors and staff demand immediate daily payments.'}
            </p>
          </div>
        </div>
      </section>

      {/* 5. THE SOLUTION / 3 CORE VALUE PILLARS (FEATURES) */}
      <section id="features" style={{ marginBottom: 48 }}>
        <div style={{ textAlign: 'center', maxWidth: 700, margin: '0 auto 28px' }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
            THE DIRECTDINE SOLUTION
          </div>
          <h2 style={{ fontSize: 'clamp(22px, 3.2vw, 30px)', color: '#111827', fontWeight: 900 }}>
            {lang === 'hi'
              ? 'Aapka Apna Complete Digital Restaurant Operating System'
              : 'Everything You Need to Run 100% Commission-Free Direct Orders'}
          </h2>
          <p style={{ color: '#4B5563', fontSize: 14, margin: '6px 0 0' }}>
            {lang === 'hi'
              ? 'Storefront, WhatsApp bot, aur Kitchen KDS — sab kuch ek simple platform me connected.'
              : 'Branded web storefront, automated WhatsApp ordering, contactless table QR, and real-time kitchen displays.'}
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 20
        }}>
          {/* Card 1: Custom Online Storefront */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: 18,
            padding: '26px 22px',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#FEF2F2', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 14, border: '1px solid #FECDD3' }}>
                🌐
              </div>
              <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                PILLAR 1 • ZERO-COMMISSION WEB
              </div>
              <h3 style={{ fontSize: 19, fontWeight: 800, color: '#111827', margin: '4px 0 8px' }}>
                Custom Branded Storefront
              </h3>
              <p style={{ fontSize: 13.5, color: '#4B5563', lineHeight: 1.55, marginBottom: 16 }}>
                Aapke restaurant ka apna direct ordering link (<code>yourbrand.directdine.in</code>). Fast, clean mobile experience, high-res photos, veg/non-veg tags, portion sizes, aur instant UPI payment.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5, color: '#1F2937', fontWeight: 600, marginBottom: 20 }}>
                <div>✓ 0% commission on every single order</div>
                <div>✓ Multi-mode: Delivery, Takeaway &amp; Dine-In</div>
                <div>✓ Custom discount promo codes (WELCOME10, FLAT50)</div>
              </div>
            </div>

            <Link
              href="/spice-garden"
              style={{
                background: '#FFFFFF',
                color: 'var(--primary)',
                border: '1.5px solid var(--primary)',
                padding: '10px 14px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 800,
                textAlign: 'center',
                textDecoration: 'none'
              }}
            >
              See Live Storefront Demo ➔
            </Link>
          </div>

          {/* Card 2: Automated WhatsApp Bot */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: 18,
            padding: '26px 22px',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 14, border: '1px solid #BBF7D0' }}>
                💬
              </div>
              <div style={{ fontSize: 11, fontWeight: 900, color: '#16A34A', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                PILLAR 2 • WHATSAPP CLOUD API
              </div>
              <h3 style={{ fontSize: 19, fontWeight: 800, color: '#111827', margin: '4px 0 8px' }}>
                Automated WhatsApp Bot
              </h3>
              <p style={{ fontSize: 13.5, color: '#4B5563', lineHeight: 1.55, marginBottom: 16 }}>
                Aapke customers WhatsApp par sirf "Hi" bhejkar digital menu dekh sakte hain, order place kar sakte hain, aur real-time delivery status track kar sakte hain.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5, color: '#1F2937', fontWeight: 600, marginBottom: 20 }}>
                <div>✓ 1-Tap automated WhatsApp reordering</div>
                <div>✓ Instant order confirmations &amp; digital invoice PDFs</div>
                <div>✓ Birthday &amp; loyalty remarketing broadcast</div>
              </div>
            </div>

            <a
              href="#demo"
              style={{
                background: '#F0FDF4',
                color: '#166534',
                border: '1.5px solid #BBF7D0',
                padding: '10px 14px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 800,
                textAlign: 'center',
                textDecoration: 'none'
              }}
            >
              Test WhatsApp Bot Below ➔
            </a>
          </div>

          {/* Card 3: Kitchen KDS & Floor Management */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: 18,
            padding: '26px 22px',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#F8FAFC', color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 14, border: '1px solid #E2E8F0' }}>
                👨‍🍳
              </div>
              <div style={{ fontSize: 11, fontWeight: 900, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                PILLAR 3 • KITCHEN &amp; FLOOR KDS
              </div>
              <h3 style={{ fontSize: 19, fontWeight: 800, color: '#111827', margin: '4px 0 8px' }}>
                Live Kitchen KDS &amp; Floor Ops
              </h3>
              <p style={{ fontSize: 13.5, color: '#4B5563', lineHeight: 1.55, marginBottom: 16 }}>
                Chefs aur floor staff ke liye real-time audio chime alerts, 1-tap accept/dispatch, printable KOT slips, table QR standee generator, aur customer loyalty CRM.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5, color: '#1F2937', fontWeight: 600, marginBottom: 20 }}>
                <div>✓ Audio alerts for incoming orders &amp; waiter calls</div>
                <div>✓ 1-Click Table QR generator with brand logo</div>
                <div>✓ Repeat customer loyalty ledger (1 Pt = ₹1)</div>
              </div>
            </div>

            <Link
              href="/dashboard"
              style={{
                background: '#0F172A',
                color: '#FFFFFF',
                border: 'none',
                padding: '10px 14px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 800,
                textAlign: 'center',
                textDecoration: 'none'
              }}
            >
              Open Kitchen Dashboard Demo ➔
            </Link>
          </div>
        </div>
      </section>

      {/* 6. HOW IT WORKS (3 SIMPLE STEPS) */}
      <section id="how-it-works" style={{ marginBottom: 48 }}>
        <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 28px' }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
            HOW IT WORKS
          </div>
          <h2 style={{ fontSize: 'clamp(22px, 3.2vw, 28px)', color: '#111827', fontWeight: 900 }}>
            {lang === 'hi' ? '3 Simple Steps Mein Apna Restaurant Live Karein' : 'Go Live in 3 Simple Steps'}
          </h2>
          <p style={{ color: '#4B5563', fontSize: 14 }}>
            No tech knowledge needed. Hamari team WhatsApp par pura setup guide karti hai.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          <div style={{ background: '#FFFFFF', padding: '26px 20px', borderRadius: 16, textAlign: 'center', border: '1px solid #E5E7EB', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: '#FEF2F2', color: 'var(--primary)', fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontWeight: 900 }}>
              1
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: '#111827', marginBottom: 6 }}>Upload Menu (10 Mins)</h3>
            <p style={{ color: '#4B5563', fontSize: 13, lineHeight: 1.5 }}>
              Apne dishes, prices aur photos upload karein aur apna Google Pay / PhonePe UPI ID link karein.
            </p>
          </div>

          <div style={{ background: '#FFFFFF', padding: '26px 20px', borderRadius: 16, textAlign: 'center', border: '1px solid #E5E7EB', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: '#F0FDF4', color: '#16A34A', fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontWeight: 900 }}>
              2
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: '#111827', marginBottom: 6 }}>Share Link &amp; Print QRs</h3>
            <p style={{ color: '#4B5563', fontSize: 13, lineHeight: 1.5 }}>
              Dine-in tables par branded QR standees lagayein aur Instagram bio &amp; WhatsApp status par apna link share karein.
            </p>
          </div>

          <div style={{ background: '#FFFFFF', padding: '26px 20px', borderRadius: 16, textAlign: 'center', border: '1px solid #E5E7EB', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: '#FFFBEB', color: '#B45309', fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontWeight: 900 }}>
              3
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: '#111827', marginBottom: 6 }}>Keep 100% of Every Rupee</h3>
            <p style={{ color: '#4B5563', fontSize: 13, lineHeight: 1.5 }}>
              Har order ka paisa seedha aapke bank account me bina kisi cut ke instant aata hai, aur kitchen KDS chime karta hai!
            </p>
          </div>
        </div>
      </section>

      {/* 7. COMPARISON TABLE */}
      <section style={{ marginBottom: 48 }}>
        <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 28px' }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
            TRANSPARENT COMPARISON
          </div>
          <h2 style={{ fontSize: 'clamp(22px, 3.2vw, 28px)', color: '#111827', fontWeight: 900 }}>
            Zomato / Swiggy vs. DirectDine
          </h2>
        </div>

        <div style={{ overflowX: 'auto', borderRadius: 16, border: '1px solid #E5E7EB', background: '#FFFFFF', boxShadow: 'var(--shadow-sm)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 620 }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ padding: '16px 20px', fontSize: 13.5, color: '#475569', fontWeight: 800 }}>Feature / Capability</th>
                <th style={{ padding: '16px 20px', fontSize: 13.5, color: '#DC2626', fontWeight: 800 }}>Zomato / Swiggy</th>
                <th style={{ padding: '16px 20px', fontSize: 13.5, color: '#166534', fontWeight: 900, background: '#F0FDF4' }}>DirectDine Platform</th>
              </tr>
            </thead>
            <tbody style={{ fontSize: 13.5 }}>
              <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '14px 20px', fontWeight: 700, color: '#111827' }}>Commission Per Order</td>
                <td style={{ padding: '14px 20px', color: '#DC2626' }}>❌ 25% – 32% Cut</td>
                <td style={{ padding: '14px 20px', color: '#166534', fontWeight: 800, background: '#F0FDF4' }}>✅ 0% Commission (Keep 100%)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '14px 20px', fontWeight: 700, color: '#111827' }}>Payment Settlement</td>
                <td style={{ padding: '14px 20px', color: '#DC2626' }}>❌ 7 to 14 days delay</td>
                <td style={{ padding: '14px 20px', color: '#166534', fontWeight: 800, background: '#F0FDF4' }}>✅ Instant to your UPI / Bank</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '14px 20px', fontWeight: 700, color: '#111827' }}>Customer Phone Numbers</td>
                <td style={{ padding: '14px 20px', color: '#DC2626' }}>❌ Masked numbers (not shared)</td>
                <td style={{ padding: '14px 20px', color: '#166534', fontWeight: 800, background: '#F0FDF4' }}>✅ 100% Owned by you</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '14px 20px', fontWeight: 700, color: '#111827' }}>Dine-In Table QR Ordering</td>
                <td style={{ padding: '14px 20px', color: '#DC2626' }}>❌ Not available / Extra fees</td>
                <td style={{ padding: '14px 20px', color: '#166534', fontWeight: 800, background: '#F0FDF4' }}>✅ Built-in QR + Call Waiter</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '14px 20px', fontWeight: 700, color: '#111827' }}>Automated WhatsApp Bot</td>
                <td style={{ padding: '14px 20px', color: '#DC2626' }}>❌ No direct restaurant bot</td>
                <td style={{ padding: '14px 20px', color: '#166534', fontWeight: 800, background: '#F0FDF4' }}>✅ Meta Cloud WhatsApp Bot</td>
              </tr>
              <tr>
                <td style={{ padding: '14px 20px', fontWeight: 700, color: '#111827' }}>Monthly Cost</td>
                <td style={{ padding: '14px 20px', color: '#DC2626' }}>❌ ₹40,000 to ₹1,50,000+</td>
                <td style={{ padding: '14px 20px', color: '#166534', fontWeight: 800, background: '#F0FDF4' }}>✅ Flat ₹1,999/mo (Predictable)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 8. INTERACTIVE COMMISSION SAVINGS CALCULATOR (WITH REAL NET SAVINGS) */}
      <section id="calculator" style={{
        background: '#FFFFFF',
        borderRadius: 20,
        border: '1px solid #E5E7EB',
        padding: '36px 26px',
        marginBottom: 48,
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
            COMMISSION SAVINGS CALCULATOR
          </div>
          <h2 style={{ fontSize: 'clamp(22px, 3.2vw, 28px)', color: '#111827', fontWeight: 900 }}>
            {lang === 'hi' ? 'Aapka Net Profit Calculator' : 'Calculate Your Net In-Pocket Savings'}
          </h2>
          <p style={{ color: '#4B5563', fontSize: 14, margin: '4px 0 0' }}>
            DirectDine plan subscription fees minus karne ke baad bhi aap kitna cash bachate hain:
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 32,
          alignItems: 'center'
        }}>
          {/* Sliders Column */}
          <div>
            <div style={{ marginBottom: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>Monthly Orders</span>
                <span style={{ color: 'var(--primary)', fontWeight: 800, fontSize: 16 }}>{monthlyOrders} orders/mo</span>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6B7280', marginTop: 4 }}>
                <span>100 orders</span>
                <span>2,500</span>
                <span>5,000 orders</span>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>Average Order Value</span>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6B7280', marginTop: 4 }}>
                <span>₹150</span>
                <span>₹800</span>
                <span>₹1,500</span>
              </div>
            </div>
          </div>

          {/* Transparent Net Breakdown Box */}
          <div style={{
            background: '#F0FDF4',
            border: '1.5px solid #BBF7D0',
            borderRadius: 18,
            padding: '24px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 11.5, color: '#166534', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.06em', marginBottom: 4 }}>
              NET PROFIT RETAINED IN YOUR BANK
            </div>
            <div style={{ fontSize: 'clamp(32px, 3.8vw, 42px)', fontWeight: 900, color: '#15803D', marginBottom: 6 }}>
              ₹{netMonthlySavings.toLocaleString('en-IN')}<span style={{ fontSize: 16, fontWeight: 700, color: '#166534' }}>/month</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#166534', marginBottom: 14 }}>
              = ₹{(netAnnualSavings / 100000).toFixed(2)} Lakhs Net Extra Cash Every Year!
            </div>

            {/* Believable Math Transparency Box */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: 10,
              padding: '12px 14px',
              fontSize: 12,
              color: '#374151',
              textAlign: 'left',
              border: '1px solid #DCFCE7',
              display: 'flex',
              flexDirection: 'column',
              gap: 4
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>• Monthly Gross Food Sales:</span>
                <strong>₹{monthlyGMV.toLocaleString('en-IN')}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#DC2626' }}>
                <span>• 28% Commission Lost to Zomato/Swiggy:</span>
                <strong>−₹{aggregatorCommission.toLocaleString('en-IN')}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4B5563' }}>
                <span>• DirectDine Blaze Subscription Fee:</span>
                <strong>−₹{directDineFee.toLocaleString('en-IN')}</strong>
              </div>
              <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: 6, marginTop: 4, display: 'flex', justifyContent: 'space-between', color: '#166534', fontWeight: 800, fontSize: 12.5 }}>
                <span>✓ Pure Net Profit Back In Your Pocket:</span>
                <span>₹{netMonthlySavings.toLocaleString('en-IN')}/mo</span>
              </div>
            </div>

            <p style={{ fontSize: 11.5, color: '#4B5563', marginTop: 10, marginBottom: 0 }}>
              💡 DirectDine pays for itself in less than 2 days of direct orders!
            </p>
          </div>
        </div>
      </section>

      {/* 9. LIVE INTERACTIVE DEMOS SECTION (NO SUPER ADMIN) */}
      <section id="demo" style={{ marginBottom: 48 }}>
        <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 28px' }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
            TEST DRIVE LIVE
          </div>
          <h2 style={{ fontSize: 'clamp(22px, 3.2vw, 28px)', color: '#111827', fontWeight: 900 }}>
            {lang === 'hi' ? 'Platform Ko Live Test Karein' : 'Experience The Real Platform'}
          </h2>
          <p style={{ color: '#4B5563', fontSize: 14 }}>
            Test exactly what your customers will see on their phones, and what your kitchen staff will use in the kitchen.
          </p>
        </div>

        {/* 2 Live Demo Experience Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 20,
          marginBottom: 32
        }}>
          {/* Demo 1: Customer Storefront */}
          <div style={{
            background: '#FFFFFF',
            border: '1.5px solid #E5E7EB',
            borderRadius: 18,
            padding: '24px',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 28 }}>📱</span>
                <span style={{ background: '#FEF2F2', color: 'var(--primary)', fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 6 }}>
                  Customer Experience
                </span>
              </div>
              <h3 style={{ fontSize: 19, fontWeight: 800, color: '#111827', margin: '0 0 6px' }}>
                Spice Garden Customer Storefront
              </h3>
              <p style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.5, marginBottom: 16 }}>
                Experience 0% markup menu browsing, veg/non-veg filters, instant UPI checkout, and loyalty points redemption.
              </p>
            </div>

            <Link
              href="/spice-garden"
              className="btn-primary"
              style={{
                width: '100%',
                padding: '12px 0',
                fontSize: 13.5,
                fontWeight: 800,
                textAlign: 'center',
                borderRadius: 8,
                textDecoration: 'none'
              }}
            >
              Open Customer Storefront Demo ➔
            </Link>
          </div>

          {/* Demo 2: Kitchen KDS Dashboard */}
          <div style={{
            background: '#FFFFFF',
            border: '1.5px solid #E5E7EB',
            borderRadius: 18,
            padding: '24px',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 28 }}>👨‍🍳</span>
                <span style={{ background: '#F1F5F9', color: '#0F172A', fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 6 }}>
                  Kitchen &amp; Owner Console
                </span>
              </div>
              <h3 style={{ fontSize: 19, fontWeight: 800, color: '#111827', margin: '0 0 6px' }}>
                Live Kitchen KDS Dashboard
              </h3>
              <p style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.5, marginBottom: 16 }}>
                Experience live order dispatching, audio chimes, table QR generator with standees, and customer CRM profiles.
              </p>
            </div>

            <Link
              href="/dashboard"
              style={{
                width: '100%',
                padding: '12px 0',
                fontSize: 13.5,
                fontWeight: 800,
                textAlign: 'center',
                borderRadius: 8,
                background: '#0F172A',
                color: '#FFFFFF',
                textDecoration: 'none'
              }}
            >
              Enter Kitchen Dashboard Demo ➔
            </Link>
          </div>
        </div>

        {/* Embedded WhatsApp Simulator */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 20,
          border: '1px solid #E5E7EB',
          padding: '28px 20px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <span style={{ fontSize: 32 }}>💬</span>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: '4px 0 2px' }}>
              Interactive WhatsApp Bot Simulator
            </h3>
            <p style={{ color: '#4B5563', fontSize: 13.5, margin: 0 }}>
              Test our real automated Meta Cloud WhatsApp ordering engine right here in your browser:
            </p>
          </div>

          <div style={{
            maxWidth: 440,
            margin: '0 auto',
            background: '#EFEAE2',
            borderRadius: 16,
            border: '1px solid #D1D7DB',
            overflow: 'hidden',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
          }}>
            {/* Header */}
            <div style={{ background: '#075E54', color: '#FFFFFF', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                  🍲
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 5 }}>
                    Spice Garden Direct
                    <span style={{ fontSize: 12, color: '#25D366' }}>✓</span>
                  </div>
                  <div style={{ fontSize: 10.5, color: '#D4EBE7' }}>Official WhatsApp Cloud API</div>
                </div>
              </div>
              <span style={{ fontSize: 16, color: '#FFFFFF' }}>⋮</span>
            </div>

            {/* Chat Messages */}
            <div style={{
              height: 240,
              overflowY: 'auto',
              padding: 14,
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
                    padding: '8px 12px',
                    borderRadius: 8,
                    fontSize: 12.5,
                    lineHeight: 1.45,
                    whiteSpace: 'pre-wrap',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                  }}
                >
                  {msg.text}
                </div>
              ))}
              {waLoading && (
                <div style={{ alignSelf: 'flex-start', color: '#667781', fontSize: 11, fontStyle: 'italic' }}>
                  Spice Garden bot is typing...
                </div>
              )}
            </div>

            {/* Quick Chips */}
            <div style={{ padding: '8px 10px', background: '#F0F2F5', borderTop: '1px solid #E9EDEF', display: 'flex', gap: 6, overflowX: 'auto' }}>
              <button
                onClick={() => handleSendWa('Hi')}
                style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, background: '#FFFFFF', color: '#111B21', fontWeight: 600, border: '1px solid #D1D7DB', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                Send "Hi"
              </button>
              <button
                onClick={() => handleSendWa('biryani')}
                style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, background: '#FFFFFF', color: '#E23744', fontWeight: 700, border: '1px solid #E23744', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                🔍 Search "biryani"
              </button>
              <button
                onClick={() => handleSendWa('2')}
                style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, background: '#FFFFFF', color: '#111B21', fontWeight: 600, border: '1px solid #D1D7DB', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                2 (View Menu)
              </button>
              <button
                onClick={() => handleSendWa('3')}
                style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, background: '#FFFFFF', color: '#111B21', fontWeight: 600, border: '1px solid #D1D7DB', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                3 (Order Status)
              </button>
            </div>

            {/* Input Bar */}
            <div style={{ padding: 8, display: 'flex', gap: 6, background: '#F0F2F5' }}>
              <input
                type="text"
                placeholder="Type a message (e.g. biryani)..."
                value={waInput}
                onChange={(e) => setWaInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendWa()}
                style={{
                  flex: 1,
                  background: '#FFFFFF',
                  border: '1px solid #D1D7DB',
                  borderRadius: 8,
                  padding: '8px 10px',
                  color: '#111B21',
                  fontSize: 12.5,
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
                  padding: '0 14px',
                  borderRadius: 8,
                  fontSize: 12.5,
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 10. REAL RESTAURANT OWNER TESTIMONIALS */}
      <section style={{ marginBottom: 48 }}>
        <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 28px' }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
            REAL EXPERIENCES
          </div>
          <h2 style={{ fontSize: 'clamp(22px, 3.2vw, 28px)', color: '#111827', fontWeight: 900 }}>
            {lang === 'hi' ? 'Restaurant Owners Kya Kehte Hain' : 'What Restaurant Owners Are Saying'}
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 20
        }}>
          {/* Testimonial 1 */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: 16,
            padding: '24px 20px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ color: '#F59E0B', fontSize: 16, marginBottom: 8 }}>★★★★★</div>
            <p style={{ fontSize: 13.5, color: '#374151', lineHeight: 1.55, fontStyle: 'italic', marginBottom: 16 }}>
              &ldquo;Hum pehle har mahine ₹1.4 lakh Zomato ko commission me de rahe the. DirectDine lagane ke baad 40% regular customers direct WhatsApp aur table QR se order karne lage. Pehle 45 dino mein hi ₹1.8 lakh ki net bachat hui!&rdquo;
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#FEF2F2', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                👨‍💼
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: '#111827' }}>Rajesh Khurana</div>
                <div style={{ fontSize: 11.5, color: '#6B7280' }}>Owner, Spice Garden (Mumbai) • <span style={{ color: '#16A34A', fontWeight: 700 }}>Saved ₹1.8L in 45 days</span></div>
              </div>
            </div>
          </div>

          {/* Testimonial 2 */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: 16,
            padding: '24px 20px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ color: '#F59E0B', fontSize: 16, marginBottom: 8 }}>★★★★★</div>
            <p style={{ fontSize: 13.5, color: '#374151', lineHeight: 1.55, fontStyle: 'italic', marginBottom: 16 }}>
              &ldquo;Sabse bada benefit customer data ka hai. Zomato par hume customer ka number tak nahi milta tha. Ab hamare paas 2,400+ loyal customers ka WhatsApp database hai jinko hum weekend specials bhejte hain.&rdquo;
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#FEF2F2', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                👩‍🍳
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: '#111827' }}>Chef Ananya Sen</div>
                <div style={{ fontSize: 11.5, color: '#6B7280' }}>Founder, Urban Crust (Bengaluru) • <span style={{ color: '#16A34A', fontWeight: 700 }}>2,400+ Repeat Customers</span></div>
              </div>
            </div>
          </div>

          {/* Testimonial 3 */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: 16,
            padding: '24px 20px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ color: '#F59E0B', fontSize: 16, marginBottom: 8 }}>★★★★★</div>
            <p style={{ fontSize: 13.5, color: '#374151', lineHeight: 1.55, fontStyle: 'italic', marginBottom: 16 }}>
              &ldquo;Daily cash flow dramatically improve ho gaya. Swiggy se 10 din baad payout aata tha, yahan customer ka direct UPI payment seedha hamare bank account me instant credit hota hai.&rdquo;
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#FEF2F2', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                👳‍♂️
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: '#111827' }}>Harpreet Singh</div>
                <div style={{ fontSize: 11.5, color: '#6B7280' }}>Managing Partner, Royal Biryani Hub • <span style={{ color: '#16A34A', fontWeight: 700 }}>0-Second Settlement</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 11. TRANSPARENT SAAS PRICING */}
      <section id="pricing" style={{ marginBottom: 48 }}>
        <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 28px' }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
            TRANSPARENT PRICING
          </div>
          <h2 style={{ fontSize: 'clamp(22px, 3.2vw, 28px)', color: '#111827', fontWeight: 900 }}>
            Simple Flat Plans. 0% Per-Order Cut.
          </h2>
          <p style={{ color: '#4B5563', fontSize: 14 }}>
            No setup fees. No hidden commissions. Keep 100% of your earnings.
          </p>

          {/* Billing Switcher */}
          <div style={{
            display: 'inline-flex',
            background: '#FFFFFF',
            padding: 4,
            borderRadius: 10,
            border: '1px solid #E5E7EB',
            marginTop: 14,
            boxShadow: 'var(--shadow-sm)'
          }}>
            <button
              onClick={() => setBillingCycle('monthly')}
              style={{
                padding: '6px 16px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                background: billingCycle === 'monthly' ? 'var(--primary)' : 'transparent',
                color: billingCycle === 'monthly' ? '#FFFFFF' : '#4B5563',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              style={{
                padding: '6px 16px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                background: billingCycle === 'annual' ? 'var(--primary)' : 'transparent',
                color: billingCycle === 'annual' ? '#FFFFFF' : '#4B5563',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              Annual Billing <span style={{ background: '#16A34A', color: '#FFFFFF', padding: '1px 6px', borderRadius: 4, fontSize: 10 }}>SAVE 20%</span>
            </button>
          </div>
        </div>

        {/* 3 Pricing Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, alignItems: 'stretch' }}>
          {/* Starter Plan */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: 18,
            padding: '26px 22px',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>STARTER PLAN</span>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#111827', margin: '8px 0 4px' }}>
                ₹{billingCycle === 'annual' ? '799' : '999'}<span style={{ fontSize: 14, color: '#6B7280', fontWeight: 600 }}>/month</span>
              </div>
              <p style={{ color: '#6B7280', fontSize: 13, marginBottom: 20 }}>Best for home chefs, tiffin services &amp; small bakeries</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: '#111827', marginBottom: 24 }}>
                <div>✓ 1 Location Storefront</div>
                <div>✓ Up to 35 Menu Items</div>
                <div>✓ 0% Commission Direct UPI</div>
                <div>✓ Printable Table QR Code</div>
                <div>✓ WhatsApp Direct Order Link</div>
                <div>✓ 7-Day Free Trial</div>
              </div>
            </div>

            <button
              onClick={() => setOnboardModalOpen(true)}
              className="btn-secondary"
              style={{ width: '100%', padding: '12px 0', fontSize: 13.5, borderRadius: 8 }}
            >
              Start 7-Day Free Trial
            </button>
          </div>

          {/* Blaze Plan (Featured) */}
          <div style={{
            background: '#FFFFFF',
            border: '2px solid var(--primary)',
            borderRadius: 18,
            padding: '26px 22px',
            boxShadow: '0 8px 30px rgba(226, 55, 68, 0.12)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative'
          }}>
            <div style={{ position: 'absolute', top: -12, right: 20, background: 'var(--primary)', color: '#FFFFFF', padding: '3px 12px', borderRadius: 20, fontSize: 11, fontWeight: 900 }}>
              ★ MOST POPULAR
            </div>

            <div>
              <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>BLAZE PRO</span>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#111827', margin: '8px 0 4px' }}>
                ₹{billingCycle === 'annual' ? '1,599' : '1,999'}<span style={{ fontSize: 14, color: '#6B7280', fontWeight: 600 }}>/month</span>
              </div>
              <p style={{ color: '#6B7280', fontSize: 13, marginBottom: 20 }}>For dine-in restaurants, cafes &amp; cloud kitchens</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: '#111827', marginBottom: 24 }}>
                <div>✓ <strong>Unlimited</strong> Menu Items &amp; Categories</div>
                <div>✓ <strong>Live Kitchen KDS</strong> (Audio chimes &amp; status)</div>
                <div>✓ <strong>Table QR &amp; Call Waiter</strong> System</div>
                <div>✓ <strong>Meta Cloud WhatsApp API</strong> Bot</div>
                <div>✓ Active Coupons (WELCOME10, FLAT50)</div>
                <div>✓ Customer Analytics &amp; Loyalty CRM (1 Pt = ₹1)</div>
              </div>
            </div>

            <button
              onClick={() => setOnboardModalOpen(true)}
              className="btn-primary"
              style={{ width: '100%', padding: '12px 0', fontSize: 14, borderRadius: 8, boxShadow: '0 4px 14px var(--primary-glow)' }}
            >
              Start 7-Day Free Trial ➔
            </button>
          </div>

          {/* Enterprise Empire */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: 18,
            padding: '26px 22px',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>EMPIRE MULTI-OUTLET</span>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#111827', margin: '8px 0 4px' }}>
                ₹{billingCycle === 'annual' ? '3,199' : '3,999'}<span style={{ fontSize: 14, color: '#6B7280', fontWeight: 600 }}>/month</span>
              </div>
              <p style={{ color: '#6B7280', fontSize: 13, marginBottom: 20 }}>For multi-outlet food chains &amp; franchise brands</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: '#111827', marginBottom: 24 }}>
                <div>✓ Multi-Branch Centralized Portal</div>
                <div>✓ Custom Domain (`orders.yourcafe.com`)</div>
                <div>✓ Dedicated WhatsApp Number Setup</div>
                <div>✓ Dedicated Account Manager on WhatsApp</div>
                <div>✓ Priority 24/7 Phone &amp; Tech Support</div>
              </div>
            </div>

            <a
              href={salesWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
              style={{ width: '100%', padding: '12px 0', fontSize: 13.5, borderRadius: 8, textAlign: 'center', textDecoration: 'none' }}
            >
              Talk to Sales on WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* 12. FREQUENTLY ASKED QUESTIONS (ACCORDION WITH 100% ANSWERS) */}
      <section id="faqs" style={{ marginBottom: 48 }}>
        <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 28px' }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
            FREQUENTLY ASKED QUESTIONS
          </div>
          <h2 style={{ fontSize: 'clamp(22px, 3.2vw, 28px)', color: '#111827', fontWeight: 900 }}>
            {lang === 'hi' ? 'Aapke Sawal, Hamare Jawab' : 'Got Questions? We Have Answers.'}
          </h2>
        </div>

        <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                style={{
                  background: '#FFFFFF',
                  borderRadius: 14,
                  overflow: 'hidden',
                  border: '1px solid #E5E7EB',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    textAlign: 'left',
                    background: '#FFFFFF',
                    border: 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontWeight: 800,
                    fontSize: 14.5,
                    color: '#111827',
                    cursor: 'pointer'
                  }}
                >
                  <span>{faq.q}</span>
                  <span style={{ fontSize: 20, color: 'var(--primary)', fontWeight: 800, marginLeft: 10 }}>
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
                {isOpen && (
                  <div style={{ padding: '0 20px 18px', color: '#4B5563', fontSize: 13.5, lineHeight: 1.6, borderTop: '1px solid #F1F5F9', paddingTop: 12 }}>
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 13. FINAL HIGH-CONVERTING CTA BANNER */}
      <section style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        borderRadius: 24,
        padding: '44px 28px',
        textAlign: 'center',
        color: '#FFFFFF',
        marginBottom: 48,
        boxShadow: '0 8px 32px rgba(15, 23, 42, 0.25)'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(255,255,255,0.1)',
          padding: '4px 14px',
          borderRadius: 20,
          fontSize: 12,
          fontWeight: 800,
          color: '#FCD34D',
          marginBottom: 14
        }}>
          ✨ 7-DAY FREE TRIAL • NO COMMITMENT • SETUP IN 10 MINS
        </div>
        <h2 style={{ fontSize: 'clamp(24px, 3.8vw, 36px)', fontWeight: 900, letterSpacing: '-0.02em', margin: '0 0 12px' }}>
          {lang === 'hi'
            ? 'Aaj Hi Apna Restaurant Zomato/Swiggy Commission Se Azaad Karein'
            : 'Start Keeping 100% of Your Hard-Earned Food Revenue'}
        </h2>
        <p style={{ color: '#94A3B8', fontSize: 15, maxWidth: 620, margin: '0 auto 28px', lineHeight: 1.6 }}>
          Join 50+ smart restaurants and cloud kitchens who saved ₹42+ Lakhs in aggregator commissions.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setOnboardModalOpen(true)}
            className="btn-primary"
            style={{
              padding: '14px 28px',
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 16px var(--primary-glow)'
            }}
          >
            🚀 Start 7-Day Free Trial
          </button>

          <a
            href={salesWhatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: '#25D366',
              color: '#FFFFFF',
              padding: '14px 24px',
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 800,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <span>💬</span>
            <span>Chat with Sales on WhatsApp</span>
          </a>
        </div>
      </section>

      {/* 14. PROFESSIONAL B2B SAAS FOOTER */}
      <footer style={{
        paddingTop: 36,
        borderTop: '1px solid #E5E7EB',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        color: '#6B7280',
        fontSize: 13
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 24
        }}>
          {/* Brand Col */}
          <div style={{ maxWidth: 320 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 20 }}>🍽️</span>
              <span style={{ fontWeight: 900, color: 'var(--primary)', fontSize: 18 }}>DirectDine</span>
            </div>
            <p style={{ fontSize: 12.5, lineHeight: 1.5, color: '#4B5563', margin: '0 0 10px' }}>
              Direct ordering operating system for restaurants, cafes, cloud kitchens &amp; food franchises. 0% commission direct commerce.
            </p>
            <div style={{ fontSize: 12, color: '#6B7280' }}>
              📍 Made with ❤️ for Indian Food Entrepreneurs
            </div>
          </div>

          {/* Product Links */}
          <div>
            <div style={{ fontWeight: 800, color: '#111827', fontSize: 13, textTransform: 'uppercase', marginBottom: 10 }}>
              Product
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
              <a href="#features" style={{ color: '#4B5563', textDecoration: 'none' }}>Direct Storefront</a>
              <a href="#features" style={{ color: '#4B5563', textDecoration: 'none' }}>WhatsApp Cloud Bot</a>
              <a href="#features" style={{ color: '#4B5563', textDecoration: 'none' }}>Kitchen KDS</a>
              <a href="#calculator" style={{ color: '#4B5563', textDecoration: 'none' }}>Commission Calculator</a>
              <Link href="/explore" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>
                Browse Food Stores ➔
              </Link>
            </div>
          </div>

          {/* Stakeholder Logins */}
          <div>
            <div style={{ fontWeight: 800, color: '#111827', fontSize: 13, textTransform: 'uppercase', marginBottom: 10 }}>
              Operating Consoles
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
              <Link href="/dashboard" style={{ color: '#4B5563', textDecoration: 'none' }}>Kitchen Partner Login</Link>
              <Link href="/login" style={{ color: '#4B5563', textDecoration: 'none' }}>Portals Gateway</Link>
              <Link href="/spice-garden" style={{ color: '#4B5563', textDecoration: 'none' }}>Spice Garden Demo</Link>
              <Link href="/chai-and-bites" style={{ color: '#4B5563', textDecoration: 'none' }}>Chai &amp; Bites Demo</Link>
            </div>
          </div>

          {/* Support & Sales */}
          <div>
            <div style={{ fontWeight: 800, color: '#111827', fontSize: 13, textTransform: 'uppercase', marginBottom: 10 }}>
              Sales &amp; Support
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
              <a href={salesWhatsAppUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#16A34A', fontWeight: 800, textDecoration: 'none' }}>
                💬 WhatsApp: +91 98765 43210
              </a>
              <div>📧 sales@directdine.in</div>
              <div>⏱️ 24/7 Merchant Support</div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{
          borderTop: '1px solid #F1F5F9',
          paddingTop: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          fontSize: 12
        }}>
          <div>© 2026 DirectDine Technologies Inc. All rights reserved.</div>
          <div style={{ display: 'flex', gap: 16 }}>
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Refund Policy</span>
          </div>
        </div>
      </footer>

      {/* 15. 7-DAY FREE TRIAL LEAD CAPTURE MODAL */}
      {onboardModalOpen && (
        <div className="modal-overlay-responsive">
          <div className="mobile-modal-sheet touch-scroll" style={{
            maxWidth: 460,
            padding: 26,
            position: 'relative'
          }}>
            <button
              onClick={() => setOnboardModalOpen(false)}
              style={{ position: 'absolute', top: 16, right: 16, background: '#F1F5F9', border: 'none', width: 32, height: 32, borderRadius: '50%', color: '#111827', fontSize: 14, cursor: 'pointer' }}
            >
              ✕
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 30 }}>🚀</span>
              <div>
                <h3 style={{ fontSize: 20, color: '#111827', margin: '0 0 2px' }}>Start 7-Day Free Trial</h3>
                <p style={{ fontSize: 12.5, color: '#6B7280', margin: 0 }}>
                  0% commission direct ordering for your restaurant in 10 mins
                </p>
              </div>
            </div>

            {onboardSuccess ? (
              <div style={{ textAlign: 'center', padding: '30px 10px' }}>
                <div style={{ fontSize: 48, marginBottom: 10 }}>🎉</div>
                <h4 style={{ fontSize: 19, color: '#111827', margin: '0 0 6px' }}>Trial Request Received!</h4>
                <p style={{ fontSize: 13.5, color: '#4B5563', lineHeight: 1.5 }}>
                  Our onboarding team will contact you on WhatsApp within 15 minutes to activate your direct storefront and send your branded table QR kit.
                </p>
              </div>
            ) : (
              <form onSubmit={handleOnboardSubmit}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4 }}>
                    Restaurant / Brand Name:
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
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4 }}>
                    Food Business Category:
                  </label>
                  <select
                    value={onboardData.foodType}
                    onChange={(e) => setOnboardData({ ...onboardData, foodType: e.target.value })}
                    className="input-field"
                    style={{ fontSize: 13.5, padding: '10px 12px' }}
                  >
                    <option value="Restaurant & Dine-in">Dine-in Restaurant &amp; Bar</option>
                    <option value="Cloud Kitchen">Cloud Kitchen / Delivery Only</option>
                    <option value="Cafe & Quick Bites">Cafe &amp; Quick Service Restaurant (QSR)</option>
                    <option value="Home Chef / Bakery">Artisanal Bakery &amp; Dessert Shop</option>
                    <option value="Tiffin & Meal Service">Tiffin &amp; Daily Meal Service</option>
                  </select>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4 }}>
                    Owner WhatsApp Mobile Number:
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit number e.g. 9876543210"
                    value={onboardData.phone}
                    onChange={(e) => setOnboardData({ ...onboardData, phone: e.target.value })}
                    className="input-field"
                    style={{ fontSize: 13.5, padding: '10px 12px' }}
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4 }}>
                    City / Locality:
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
                  style={{ width: '100%', padding: '12px 0', fontSize: 14, fontWeight: 800, borderRadius: 10 }}
                >
                  Claim 0% Commission Storefront ➔
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
