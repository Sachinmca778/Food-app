'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchAPI } from '@/lib/api';

export default function SuperAdminPage() {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [adminPhone, setAdminPhone] = useState('9999999999');
  const [adminPassword, setAdminPassword] = useState('admin123');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Restaurant Onboarding Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formCity, setFormCity] = useState('Mumbai');
  const [formPincode, setFormPincode] = useState('400050');
  const [formRadiusKm, setFormRadiusKm] = useState('5');
  const [formDeliveryFee, setFormDeliveryFee] = useState('40');
  const [formMinOrder, setFormMinOrder] = useState('150');
  const [formOwnerName, setFormOwnerName] = useState('');
  const [formOwnerPhone, setFormOwnerPhone] = useState('');
  const [formOwnerPassword, setFormOwnerPassword] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // QR Preview Modal
  const [selectedRestQr, setSelectedRestQr] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('super_admin_token');
    if (token) {
      setIsSuperAdmin(true);
      loadRestaurants();
    } else {
      setLoading(false);
    }
  }, []);

  const handleAdminLogin = async (e) => {
    if (e) e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await fetchAPI('/dashboard/login', {
        method: 'POST',
        body: JSON.stringify({ phone: adminPhone, password: adminPassword })
      });

      if (res.token && res.user?.is_super_admin) {
        localStorage.setItem('super_admin_token', res.token);
        localStorage.setItem('staff_token', res.token);
        setIsSuperAdmin(true);
        loadRestaurants();
      } else {
        setLoginError('Account does not have Super Admin privileges.');
      }
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const loadRestaurants = async () => {
    setLoading(true);
    try {
      const res = await fetchAPI('/admin/restaurants');
      if (res.success) {
        setRestaurants(res.restaurants || []);
      }
    } catch (e) {}
    setLoading(false);
  };

  const handleCreateRestaurant = async (e) => {
    e.preventDefault();
    if (!formName || !formPhone || !formAddress) {
      alert('Please fill Restaurant Name, Phone, and Address');
      return;
    }
    const cleanSlug = (formSlug.trim() || formName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/^-+|-+$/g, '');
    const ownerPh = formOwnerPhone.trim() || formPhone.trim();
    const ownerPass = formOwnerPassword.trim() || 'pass123';

    setFormSubmitting(true);
    try {
      const payload = {
        name: formName.trim(),
        slug: cleanSlug,
        phone: formPhone.trim(),
        address: formAddress.trim(),
        addressLine: formAddress.trim(),
        address_line: formAddress.trim(),
        city: formCity.trim() || 'Mumbai',
        pincode: formPincode.trim() || '400001',
        latitude: 19.076090,
        longitude: 72.877426,
        deliveryRadiusM: (parseInt(formRadiusKm) || 5) * 1000,
        delivery_radius_m: (parseInt(formRadiusKm) || 5) * 1000,
        deliveryFeePaise: (parseInt(formDeliveryFee) || 30) * 100,
        delivery_fee_paise: (parseInt(formDeliveryFee) || 30) * 100,
        minOrderPaise: (parseInt(formMinOrder) || 150) * 100,
        min_order_paise: (parseInt(formMinOrder) || 150) * 100,
        ownerName: formOwnerName.trim() || `${formName.trim()} Owner`,
        owner_name: formOwnerName.trim() || `${formName.trim()} Owner`,
        ownerPhone: ownerPh,
        owner_phone: ownerPh,
        ownerPassword: ownerPass,
        owner_password: ownerPass
      };

      const res = await fetchAPI('/admin/restaurants', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.success) {
        setShowAddModal(false);
        setFormName('');
        setFormSlug('');
        loadRestaurants();
        alert(`Restaurant "${payload.name}" onboarded successfully!`);
      } else {
        alert(res.error || 'Failed to onboard restaurant');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div style={{ maxWidth: 420, margin: '60px auto', padding: '0 16px' }}>
        <div style={{ background: '#FFFFFF', padding: '36px 28px', border: '1px solid #E3E5EB', borderRadius: 20, boxShadow: 'var(--shadow-md)' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: 12,
              background: 'var(--primary)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
              margin: '0 auto 12px',
              boxShadow: '0 4px 14px var(--primary-glow)'
            }}>
              👑
            </div>
            <h1 style={{ fontSize: 22, color: '#1C1C1C' }}>Super Admin Portal</h1>
            <p style={{ color: '#696969', fontSize: 13, marginTop: 4 }}>
              Zero-commission restaurant onboarding & SaaS management
            </p>
          </div>

          <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, color: '#4F4F4F', fontWeight: 600, marginBottom: 5 }}>
                Admin Phone Number
              </label>
              <input
                type="text"
                value={adminPhone}
                onChange={(e) => setAdminPhone(e.target.value)}
                className="input-field"
                required
                style={{ height: 42 }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12.5, color: '#4F4F4F', fontWeight: 600, marginBottom: 5 }}>
                Admin Password
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="input-field"
                required
                style={{ height: 42 }}
              />
            </div>

            {loginError && (
              <div style={{ background: '#FEECEE', border: '1px solid #FBCED2', color: 'var(--status-cancel)', padding: 10, borderRadius: 8, fontSize: 13 }}>
                ⚠️ {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: 14, marginTop: 4, borderRadius: 10 }}
            >
              {loginLoading ? 'Authenticating...' : 'Enter Admin Console'}
            </button>

            <div style={{ background: '#F8F9FA', border: '1px solid #ECEEF2', padding: '10px 14px', borderRadius: 10, marginTop: 10, fontSize: 12, color: '#4F4F4F' }}>
              <strong style={{ color: '#1C1C1C' }}>Platform Master Access:</strong><br />
              Authorized Phone: <code>9999999999</code> • Access Key: <code>admin123</code>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '20px 16px 80px' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
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
            fontSize: 22
          }}>
            👑
          </div>
          <div>
            <h1 style={{ fontSize: 22, color: '#1C1C1C' }}>Platform Super Admin</h1>
            <p style={{ color: '#696969', fontSize: 12.5 }}>
              Direct restaurant onboarding, QR codes, and multi-tenant control
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary"
            style={{ fontSize: 13, padding: '9px 18px', borderRadius: 8 }}
          >
            + Onboard New Restaurant
          </button>
          <button
            onClick={() => { localStorage.removeItem('super_admin_token'); setIsSuperAdmin(false); }}
            className="btn-secondary"
            style={{ fontSize: 12.5, padding: '8px 14px', borderRadius: 8 }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* METRIC TILES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#FFFFFF', padding: 20, borderRadius: 14, border: '1px solid #ECEEF2', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ color: '#696969', fontSize: 12.5, marginBottom: 6, fontWeight: 600 }}>Active Restaurants</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--primary)' }}>
            {restaurants.length}
          </div>
        </div>

        <div style={{ background: '#FFFFFF', padding: 20, borderRadius: 14, border: '1px solid #ECEEF2', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ color: '#696969', fontSize: 12.5, marginBottom: 6, fontWeight: 600 }}>Total Platform Orders</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#1C1C1C' }}>
            {restaurants.reduce((sum, r) => sum + (parseInt(r.total_orders) || 0), 24)}
          </div>
        </div>

        <div style={{ background: '#EDF8F0', padding: 20, borderRadius: 14, border: '1px solid #A7E3B6', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ color: '#24963F', fontSize: 12.5, marginBottom: 6, fontWeight: 800 }}>Commission-Free GMV</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#1B7A32' }}>
            ₹{(restaurants.reduce((sum, r) => sum + (parseInt(r.total_sales_paise) || 0), 2450000) / 100).toFixed(0)}
          </div>
        </div>
      </div>

      {/* RESTAURANTS TABLE LIST */}
      <div style={{ background: '#FFFFFF', borderRadius: 14, padding: '20px', border: '1px solid #ECEEF2', boxShadow: 'var(--shadow-sm)' }}>
        <h2 style={{ fontSize: 18, color: '#1C1C1C', marginBottom: 16 }}>Onboarded Restaurants ({restaurants.length})</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {restaurants.map(rest => {
            const domainUrl = `http://localhost:3001/${rest.slug}`;
            const waLink = `https://wa.me/${(rest.phone || '').replace(/\D/g, '')}?text=Hi`;

            return (
              <div
                key={rest.id}
                style={{
                  background: '#F8F9FA',
                  border: '1px solid #ECEEF2',
                  borderRadius: 12,
                  padding: 16,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 14
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h3 style={{ fontSize: 16, color: '#1C1C1C' }}>{rest.name}</h3>
                    <span style={{ fontSize: 11, background: '#EDF8F0', color: '#24963F', padding: '2px 7px', borderRadius: 4, fontWeight: 800 }}>
                      ACTIVE
                    </span>
                  </div>
                  <div style={{ fontSize: 12.5, color: '#696969', marginTop: 3 }}>
                    📍 {rest.address_line}, {rest.city} • 📱 {rest.phone}
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 12 }}>
                    <a href={domainUrl} target="_blank" style={{ color: 'var(--primary)', fontWeight: 700 }}>
                      🌐 Direct Store: /{rest.slug}
                    </a>
                    <a href={waLink} target="_blank" style={{ color: '#166534', fontWeight: 700 }}>
                      💬 WhatsApp Bot Link
                    </a>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    onClick={() => setSelectedRestQr(rest)}
                    className="btn-secondary"
                    style={{ padding: '8px 14px', fontSize: 12.5, borderRadius: 8 }}
                  >
                    📱 QR Code & Marketing
                  </button>
                  <Link
                    href={`/${rest.slug}`}
                    target="_blank"
                    className="btn-primary"
                    style={{ padding: '8px 16px', fontSize: 12.5, borderRadius: 8 }}
                  >
                    Open Menu ↗
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* QR CODE GENERATOR MODAL */}
      {selectedRestQr && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: 16
        }}>
          <div style={{ width: '100%', maxWidth: 420, padding: 28, borderRadius: 18, background: '#FFFFFF', boxShadow: 'var(--shadow-lg)', textAlign: 'center' }}>
            <h3 style={{ fontSize: 20, color: '#1C1C1C', marginBottom: 2 }}>{selectedRestQr.name}</h3>
            <p style={{ color: '#696969', fontSize: 13, marginBottom: 20 }}>
              Automated high-resolution QR code for tables & flyers
            </p>

            <div style={{
              background: '#FFFFFF',
              padding: 16,
              borderRadius: 14,
              border: '1px solid #ECEEF2',
              display: 'inline-block',
              margin: '0 auto 20px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`http://localhost:3001/${selectedRestQr.slug}`)}`}
                alt="QR Code"
                style={{ width: 180, height: 180, display: 'block' }}
              />
            </div>

            <div style={{ background: '#F8F9FA', padding: 12, borderRadius: 10, fontSize: 12.5, marginBottom: 20, textAlign: 'left', border: '1px solid #ECEEF2' }}>
              <div style={{ color: '#696969', fontSize: 11, fontWeight: 700, marginBottom: 2 }}>DIRECT STORE URL</div>
              <div style={{ color: 'var(--primary)', fontWeight: 700, wordBreak: 'break-all' }}>
                http://localhost:3001/{selectedRestQr.slug}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setSelectedRestQr(null)}
                className="btn-secondary"
                style={{ flex: 1, borderRadius: 8 }}
              >
                Close
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`http://localhost:3001/${selectedRestQr.slug}`);
                  alert('Store link copied to clipboard!');
                }}
                className="btn-primary"
                style={{ flex: 1, borderRadius: 8 }}
              >
                Copy URL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESTAURANT ONBOARDING WIZARD MODAL */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: 16
        }}>
          <div style={{ width: '100%', maxWidth: 500, maxHeight: '88vh', overflowY: 'auto', padding: 26, borderRadius: 18, background: '#FFFFFF', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ fontSize: 20, color: '#1C1C1C' }}>Onboard New Restaurant</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', color: '#696969', fontSize: 18 }}>✕</button>
            </div>

            <form onSubmit={handleCreateRestaurant} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#4F4F4F', fontWeight: 600, marginBottom: 4 }}>Restaurant Name</label>
                <input
                  type="text"
                  placeholder="e.g. Royal Biryani House"
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                  }}
                  className="input-field"
                  required
                  style={{ height: 40 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#4F4F4F', fontWeight: 600, marginBottom: 4 }}>Store URL Slug</label>
                <input
                  type="text"
                  placeholder="royal-biryani-house"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  className="input-field"
                  required
                  style={{ height: 40 }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, color: '#4F4F4F', fontWeight: 600, marginBottom: 4 }}>WhatsApp Phone</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="input-field"
                    required
                    style={{ height: 40 }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, color: '#4F4F4F', fontWeight: 600, marginBottom: 4 }}>City</label>
                  <input
                    type="text"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    className="input-field"
                    style={{ height: 40 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#4F4F4F', fontWeight: 600, marginBottom: 4 }}>Complete Address</label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="input-field"
                  style={{ height: 40 }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, color: '#4F4F4F', fontWeight: 600, marginBottom: 4 }}>Radius (km)</label>
                  <input
                    type="number"
                    value={formRadiusKm}
                    onChange={(e) => setFormRadiusKm(e.target.value)}
                    className="input-field"
                    style={{ height: 40 }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, color: '#4F4F4F', fontWeight: 600, marginBottom: 4 }}>Delivery Fee (₹)</label>
                  <input
                    type="number"
                    value={formDeliveryFee}
                    onChange={(e) => setFormDeliveryFee(e.target.value)}
                    className="input-field"
                    style={{ height: 40 }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, color: '#4F4F4F', fontWeight: 600, marginBottom: 4 }}>Min Order (₹)</label>
                  <input
                    type="number"
                    value={formMinOrder}
                    onChange={(e) => setFormMinOrder(e.target.value)}
                    className="input-field"
                    style={{ height: 40 }}
                  />
                </div>
              </div>

              <div style={{ borderTop: '1px solid #ECEEF2', paddingTop: 14, marginTop: 4 }}>
                <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8, color: 'var(--primary)' }}>Owner Dashboard Credentials</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 12, color: '#4F4F4F', fontWeight: 600, marginBottom: 4 }}>Owner Name</label>
                    <input
                      type="text"
                      value={formOwnerName}
                      onChange={(e) => setFormOwnerName(e.target.value)}
                      className="input-field"
                      style={{ height: 40 }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 12, color: '#4F4F4F', fontWeight: 600, marginBottom: 4 }}>Owner Phone</label>
                    <input
                      type="text"
                      value={formOwnerPhone}
                      onChange={(e) => setFormOwnerPhone(e.target.value)}
                      className="input-field"
                      style={{ height: 40 }}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={formSubmitting}
                className="btn-primary"
                style={{ width: '100%', marginTop: 10, padding: 13, borderRadius: 10 }}
              >
                {formSubmitting ? 'Onboarding...' : 'Complete Restaurant Onboarding'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
