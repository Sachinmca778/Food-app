'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { fetchAPI } from '@/lib/api';

export default function HomePage() {
  const [waPhone, setWaPhone] = useState('9123456789');
  const [waInput, setWaInput] = useState('Hi');
  const [waLog, setWaLog] = useState([
    { sender: 'bot', text: '👋 Welcome to Spice Garden!\nTap below or send "Hi" to explore our WhatsApp automated ordering.' }
  ]);
  const [waLoading, setWaLoading] = useState(false);

  // Profit Calculator state
  const [monthlyOrders, setMonthlyOrders] = useState(1200);
  const [avgTicket, setAvgTicket] = useState(450);

  const aggregatorCommission = Math.round(monthlyOrders * avgTicket * 0.28);
  const directDineSavings = aggregatorCommission;

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

  return (
    <div style={{ maxWidth: 1140, margin: '0 auto', padding: '20px 20px 80px' }}>
      {/* CRISP ZOMATO WHITE NAVBAR */}
      <nav style={{
        background: '#FFFFFF',
        padding: '14px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 48,
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 10,
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
            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--primary)' }}>
              DirectDine
            </div>
            <div style={{ fontSize: 10, color: '#696969', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800 }}>
              0% Commission Direct Ordering
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href="/spice-garden" className="btn-secondary" style={{ padding: '9px 18px', fontSize: 13, borderRadius: 8 }}>
            🍲 Customer Menu
          </Link>
          <Link href="/dashboard" className="btn-secondary" style={{ padding: '9px 18px', fontSize: 13, borderRadius: 8, borderColor: '#F0D0D2', color: 'var(--primary)' }}>
            👨‍🍳 Partner Dashboard
          </Link>
          <Link href="/admin" className="btn-primary" style={{ padding: '9px 20px', fontSize: 13, borderRadius: 8 }}>
            👑 Super Admin
          </Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section style={{ textAlign: 'center', maxWidth: 880, margin: '0 auto 64px', position: 'relative' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: '#FEECEE',
          border: '1px solid #FBCED2',
          color: 'var(--primary)',
          padding: '6px 18px',
          borderRadius: 'var(--radius-full)',
          fontSize: 13,
          fontWeight: 800,
          marginBottom: 20
        }}>
          <span className="pulse-indicator" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', display: 'inline-block' }} />
          Save ₹1,50,000+ Every Month In Food Commissions
        </div>

        <h1 style={{
          fontSize: 'clamp(34px, 5vw, 56px)',
          lineHeight: 1.15,
          marginBottom: 20,
          fontWeight: 900,
          letterSpacing: '-0.035em',
          color: '#1C1C1C'
        }}>
          Direct Ordering System With <br />
          <span style={{ color: 'var(--primary)' }}>
            Instant WhatsApp Automation
          </span>
        </h1>

        <p style={{
          color: '#4F4F4F',
          fontSize: 'clamp(16px, 1.8vw, 18px)',
          lineHeight: 1.6,
          maxWidth: 700,
          margin: '0 auto 32px'
        }}>
          Own your restaurant customers. Branded online storefront, 1-tap OTP ordering, real-time kitchen display, automated WhatsApp alerts, and direct payment to your bank account.
        </p>

        {/* CTA BUTTONS */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 36 }}>
          <Link href="/spice-garden" className="btn-primary" style={{ padding: '15px 34px', fontSize: 15, borderRadius: 10 }}>
            Browse Storefront (Spice Garden) ➔
          </Link>
          <Link href="/dashboard" className="btn-secondary" style={{ padding: '15px 28px', fontSize: 15, borderRadius: 10 }}>
            Open Live Kitchen Dashboard
          </Link>
        </div>

        {/* METRICS PILL STRIP */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 20,
          flexWrap: 'wrap',
          color: '#696969',
          fontSize: 13,
          fontWeight: 600
        }}>
          <span>✨ 0% Commission Forever</span>
          <span>⚡ 100% Customer Data Ownership</span>
          <span>💬 Meta Cloud WhatsApp Bot</span>
          <span>📱 Table & Delivery QR Generator</span>
        </div>
      </section>

      {/* LIVE DEMO RESTAURANTS SHOWCASE */}
      <section style={{ marginBottom: 64 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
              LIVE PRODUCTION STORES
            </div>
            <h2 style={{ fontSize: 26, color: '#1C1C1C' }}>Explore Pre-Configured Restaurants</h2>
          </div>
          <span style={{ color: '#696969', fontSize: 13 }}>Click to experience the full customer flow</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24 }}>
          {/* Card 1: Spice Garden */}
          <div className="glass-panel" style={{
            padding: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            border: '1px solid var(--border-medium)',
            borderRadius: 16
          }}>
            {/* Visual Cover Banner */}
            <div style={{
              height: 140,
              background: 'linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 50%, #FEE2E2 100%)',
              padding: 18,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              borderBottom: '1px solid var(--border-subtle)'
            }}>
              <span style={{ background: '#FFFFFF', color: 'var(--primary)', padding: '5px 12px', borderRadius: 'var(--radius-full)', fontSize: 12, fontWeight: 800, boxShadow: 'var(--shadow-sm)' }}>
                North Indian & Mughlai
              </span>
              <span style={{ background: 'var(--veg-bg)', color: 'var(--veg-color)', padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: 12, fontWeight: 800, border: '1px solid var(--veg-border)' }}>
                🟢 Open Now
              </span>
            </div>

            <div style={{ padding: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h3 style={{ fontSize: 22, color: '#1C1C1C' }}>Spice Garden</h3>
                <span className="zomato-rating-pill">4.8 ★</span>
              </div>
              <p style={{ color: '#4F4F4F', fontSize: 13.5, marginBottom: 18, lineHeight: 1.5 }}>
                Authentic Biryanis, Paneer specialties, Tandoori starters with Half/Full sizes, spicy addons, and active discount coupons (WELCOME10, FLAT50).
              </p>

              <div style={{ display: 'flex', gap: 14, fontSize: 12.5, color: '#696969', marginBottom: 20, borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
                <span>📍 Bandra West</span>
                <span>⏱️ 25 mins</span>
                <span>🪙 50 pts loyalty</span>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <Link href="/spice-garden" className="btn-primary" style={{ flex: 1, padding: '11px 16px', fontSize: 13.5, borderRadius: 8 }}>
                  Browse Branded Menu ➔
                </Link>
                <Link href="/dashboard" className="btn-secondary" style={{ padding: '11px 14px', fontSize: 13, borderRadius: 8 }}>
                  Partner Dashboard
                </Link>
              </div>
            </div>
          </div>

          {/* Card 2: Chai & Bites */}
          <div className="glass-panel" style={{
            padding: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            border: '1px solid var(--border-medium)',
            borderRadius: 16
          }}>
            <div style={{
              height: 140,
              background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 50%, #BBF7D0 100%)',
              padding: 18,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              borderBottom: '1px solid var(--border-subtle)'
            }}>
              <span style={{ background: '#FFFFFF', color: '#166534', padding: '5px 12px', borderRadius: 'var(--radius-full)', fontSize: 12, fontWeight: 800, boxShadow: 'var(--shadow-sm)' }}>
                Cafe & Quick Bites
              </span>
              <span style={{ background: 'var(--veg-bg)', color: 'var(--veg-color)', padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: 12, fontWeight: 800, border: '1px solid var(--veg-border)' }}>
                🟢 Open Now
              </span>
            </div>

            <div style={{ padding: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h3 style={{ fontSize: 22, color: '#1C1C1C' }}>Chai & Bites</h3>
                <span className="zomato-rating-pill">4.6 ★</span>
              </div>
              <p style={{ color: '#4F4F4F', fontSize: 13.5, marginBottom: 18, lineHeight: 1.5 }}>
                Gourmet cutting teas, samosas, bun maska, grilled cheese sandwiches, and takeaway pickup options for quick bites.
              </p>

              <div style={{ display: 'flex', gap: 14, fontSize: 12.5, color: '#696969', marginBottom: 20, borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
                <span>📍 Fort, Mumbai</span>
                <span>⏱️ 15 mins</span>
                <span>🛵 Direct Delivery</span>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <Link href="/chai-and-bites" className="btn-primary" style={{ flex: 1, padding: '11px 16px', fontSize: 13.5, borderRadius: 8 }}>
                  Browse Branded Menu ➔
                </Link>
                <Link href="/admin" className="btn-secondary" style={{ padding: '11px 14px', fontSize: 13, borderRadius: 8 }}>
                  Admin View
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE COMMISSION SAVINGS CALCULATOR */}
      <section className="glass-panel" style={{ padding: '36px 30px', marginBottom: 64, border: '1px solid var(--border-medium)', borderRadius: 20 }}>
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
            PROFIT CALCULATOR
          </div>
          <h2 style={{ fontSize: 26, color: '#1C1C1C' }}>See How Much You Keep With DirectDine</h2>
          <p style={{ color: '#4F4F4F', fontSize: 14.5, marginTop: 4 }}>
            Compare your earnings versus typical 28% aggregator commission
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
                <span style={{ fontWeight: 700, fontSize: 14, color: '#1C1C1C' }}>Average Order Value</span>
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

          {/* Result Highlight Card */}
          <div style={{
            background: '#EDF8F0',
            border: '1.5px solid #A7E3B6',
            borderRadius: 16,
            padding: 24,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 12, color: '#24963F', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em', marginBottom: 6 }}>
              ANNUAL COMMISSION SAVED
            </div>
            <div style={{ fontSize: 'clamp(32px, 3.8vw, 44px)', fontWeight: 900, color: '#1B7A32', marginBottom: 6 }}>
              ₹{((directDineSavings * 12) / 100000).toFixed(2)} Lakhs/yr
            </div>
            <div style={{ fontSize: 13.5, color: '#335C3D', fontWeight: 600 }}>
              (₹{directDineSavings.toLocaleString('en-IN')} extra direct profit every single month)
            </div>
          </div>
        </div>
      </section>

      {/* WHATSAPP BOT INTERACTIVE SIMULATOR */}
      <section style={{ marginBottom: 64 }}>
        <div className="glass-panel" style={{ padding: '36px 20px', border: '1px solid var(--border-medium)', borderRadius: 20 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <span style={{ fontSize: 36 }}>💬</span>
            <h2 style={{ fontSize: 26, marginTop: 4, color: '#1C1C1C' }}>Interactive WhatsApp Bot Simulation</h2>
            <p style={{ color: '#4F4F4F', fontSize: 14.5, maxWidth: 560, margin: '6px auto 0' }}>
              Customer messages your WhatsApp number. The automated bot immediately sends the branded ordering link, handles 1-tap reorders, or checks order status.
            </p>
          </div>

          {/* Genuine WhatsApp Simulator Frame */}
          <div style={{
            maxWidth: 460,
            margin: '0 auto',
            background: '#EFEAE2',
            borderRadius: 20,
            border: '1px solid #D1D7DB',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-lg)'
          }}>
            {/* WhatsApp App Bar */}
            <div style={{ background: '#075E54', color: '#FFFFFF', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                  🍲
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                    Spice Garden
                    <span style={{ fontSize: 12, color: '#25D366' }}>✓</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#D4EBE7' }}>Online • WhatsApp Cloud API</div>
                </div>
              </div>
              <span style={{ fontSize: 18, color: '#FFFFFF' }}>⋮</span>
            </div>

            {/* Chat Canvas */}
            <div style={{
              height: 270,
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
                onClick={() => handleSendWa('1')}
                style={{ padding: '5px 12px', borderRadius: 'var(--radius-full)', fontSize: 11.5, background: '#FFFFFF', color: '#111B21', fontWeight: 600, border: '1px solid #D1D7DB', whiteSpace: 'nowrap' }}
              >
                1 (Repeat Order)
              </button>
              <button
                onClick={() => handleSendWa('3')}
                style={{ padding: '5px 12px', borderRadius: 'var(--radius-full)', fontSize: 11.5, background: '#FFFFFF', color: '#111B21', fontWeight: 600, border: '1px solid #D1D7DB', whiteSpace: 'nowrap' }}
              >
                3 (Check Order Status)
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

      {/* FOOTER */}
      <footer style={{
        textAlign: 'center',
        borderTop: '1px solid var(--border-medium)',
        paddingTop: 28,
        color: '#696969',
        fontSize: 13,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 14
      }}>
        <div>DirectDine • Restaurant Direct Ordering & WhatsApp Commerce</div>
        <div style={{ display: 'flex', gap: 16 }}>
          <Link href="/spice-garden" style={{ color: 'var(--primary)', fontWeight: 600 }}>Customer Menu</Link>
          <Link href="/dashboard" style={{ color: 'var(--primary)', fontWeight: 600 }}>Owner Dashboard</Link>
          <Link href="/admin" style={{ color: 'var(--primary)', fontWeight: 600 }}>Super Admin</Link>
        </div>
      </footer>
    </div>
  );
}
