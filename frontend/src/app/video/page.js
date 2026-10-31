'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// 60-Second Video Scenes Definition
const SCENES = [
  {
    id: 1,
    title: 'Scene 1: The Hook & Problem',
    tag: 'HOOK (0s - 10s)',
    duration: 10,
    startTime: 0,
    headline: 'Restaurants! 30% Commission Dena Band Karo!',
    subtext: 'Swiggy & Zomato ko har mahine hazaron rupaye kyu dena jab aapka apna system ho sakta hai?',
    visualType: 'hook',
    voiceover: 'Kya aapka restaurant bhi Swiggy aur Zomato ko 30% commission de raha hai? Har mahine hazaron rupaye commission me chale jaate hain. Ab band kijiye!',
    screenTitle: 'Commission Comparison',
    badge: 'Save ₹30,000+/Month',
    color: '#EF4444'
  },
  {
    id: 2,
    title: 'Scene 2: Customer Ordering Flow',
    tag: 'ORDERING (10s - 25s)',
    duration: 15,
    startTime: 10,
    headline: '0% Commission Branded Digital Storefront',
    subtext: 'Customer table se QR scan kare ya WhatsApp link khole — 10 second me direct order!',
    visualType: 'customer',
    voiceover: 'Pesh hai DirectDine — aapka apna direct food ordering software! Customer table se QR scan karega, menu dekhega, aur 10 second me direct UPI se order place karega. Zero commission, 100% paisa sidha aapke bank account me!',
    screenTitle: 'Live Mobile Storefront',
    badge: '10-Second Ordering',
    color: '#10B981'
  },
  {
    id: 3,
    title: 'Scene 3: Kitchen Display System (KDS)',
    tag: 'KITCHEN (25s - 40s)',
    duration: 15,
    startTime: 25,
    headline: 'Live Kitchen Dashboard & Sound Alerts',
    subtext: 'Naye order aate hi bell bajegi. 1-click me order accept karein aur prep timer set karein.',
    visualType: 'kitchen',
    voiceover: 'Kitchen dashboard me naye order ka instant sound alarm bajega. Chef sirf ek click me order accept karega aur preparation timer set kar dega. Kaun sa item khatam hua, wahi se ek tap me band kar sakte hain!',
    screenTitle: 'Live Kitchen KDS',
    badge: 'Realtime Audio Alert',
    color: '#3B82F6'
  },
  {
    id: 4,
    title: 'Scene 4: WhatsApp Bot & Tracking',
    tag: 'WHATSAPP (40s - 50s)',
    duration: 10,
    startTime: 40,
    headline: 'Automated WhatsApp Bot & Live Tracking',
    subtext: 'Customer ko WhatsApp par automatic invoice, live delivery link aur reorder button milega.',
    visualType: 'whatsapp',
    voiceover: 'Aur sabse badhiya cheez — Customer ko WhatsApp par automated order status, bill aur live tracking milegi bina kisi third-party app ke!',
    screenTitle: 'Automated WhatsApp Engine',
    badge: 'Automated Bot',
    color: '#22C55E'
  },
  {
    id: 5,
    title: 'Scene 5: Offer & Call to Action',
    tag: 'OFFER (50s - 60s)',
    duration: 10,
    startTime: 50,
    headline: 'Apne Restaurant ya Agency ke liye Aaj hi lein!',
    subtext: 'Flat monthly subscription ya Lifetime source code license available. Abhi demo dekhein!',
    visualType: 'offer',
    voiceover: 'Toh der kis baat ki? Apne restaurant ko direct banayein ya agency ke roop me white-label software lein. Abhi call karein ya niche diye number par WhatsApp karke live demo dekhein!',
    screenTitle: 'Claim Your Software',
    badge: 'Limited Time Deal',
    color: '#F59E0B'
  }
];

export default function VideoDemoPage() {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [aspectRatio, setAspectRatio] = useState('16:9'); // '16:9' or '9:16'
  const [recording, setRecording] = useState(false);
  const [activeTab, setActiveTab] = useState('player'); // 'player', 'script', 'social'

  const timerRef = useRef(null);
  const speechRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  // Find active scene based on currentTime
  const activeSceneIndex = SCENES.findIndex(
    (s, idx) => currentTime >= s.startTime && (idx === SCENES.length - 1 || currentTime < SCENES[idx + 1].startTime)
  );
  const activeScene = SCENES[activeSceneIndex] || SCENES[0];

  // Audio Chime Synthesizer using Web Audio API
  const playChime = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch {
      // Audio autoplay restrictions
    }
  };

  // Speak Voiceover
  const speakText = (text) => {
    if (!voiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    // Prefer Hindi or Indian English voice if available
    const voices = window.speechSynthesis.getVoices();
    const hiVoice = voices.find(v => v.lang.includes('hi') || v.lang.includes('IN') || v.name.toLowerCase().includes('india'));
    if (hiVoice) utterance.voice = hiVoice;
    window.speechSynthesis.speak(utterance);
    speechRef.current = utterance;
  };

  // Trigger speech when active scene changes during playback
  useEffect(() => {
    if (isPlaying) {
      speakText(activeScene.voiceover);
      if (activeScene.id === 3) {
        playChime();
      }
    }
  }, [activeSceneIndex, isPlaying]);

  // Playback Loop (0 to 60s)
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= 60) {
            setIsPlaying(false);
            if (window.speechSynthesis) window.speechSynthesis.cancel();
            return 60;
          }
          return Number((prev + 0.1).toFixed(1));
        });
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

  const handlePlayPause = () => {
    if (currentTime >= 60) {
      setCurrentTime(0);
      setIsPlaying(true);
    } else {
      const nextState = !isPlaying;
      setIsPlaying(nextState);
      if (!nextState && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    }
  };

  const handleRestart = () => {
    setCurrentTime(0);
    setIsPlaying(true);
  };

  const handleJumpToScene = (scene) => {
    setCurrentTime(scene.startTime);
    if (!isPlaying) {
      setIsPlaying(true);
    }
  };

  // Record Display Screen to WebM/MP4
  const startRecording = async () => {
    try {
      recordedChunksRef.current = [];
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: false
      });
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `DirectDine-60s-Promo-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        setRecording(false);
      };

      recorder.start();
      setRecording(true);
      // Restart playback from 0
      setCurrentTime(0);
      setIsPlaying(true);
    } catch {
      alert('Screen recording permission was cancelled or not supported.');
      setRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0F172A', color: '#F8FAFC', fontFamily: 'system-ui, sans-serif' }}>
      {/* Top Navbar */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 28px',
        borderBottom: '1px solid #1E293B',
        background: 'rgba(15, 23, 42, 0.9)',
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            background: 'linear-gradient(135deg, #EF4444, #DC2626)',
            width: 38,
            height: 38,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20
          }}>
            🎬
          </div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
              DirectDine <span style={{ color: '#EF4444' }}>Promo Video Studio</span>
            </h1>
            <p style={{ margin: 0, fontSize: 12, color: '#94A3B8' }}>
              High-Converting 60-Second Video Demo & Sales Script
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Aspect Ratio Toggle */}
          <div style={{ display: 'flex', background: '#1E293B', borderRadius: 8, padding: 3 }}>
            <button
              onClick={() => setAspectRatio('16:9')}
              style={{
                background: aspectRatio === '16:9' ? '#3B82F6' : 'transparent',
                color: '#FFF',
                border: 'none',
                padding: '6px 14px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              🖥️ 16:9 (Landscape)
            </button>
            <button
              onClick={() => setAspectRatio('9:16')}
              style={{
                background: aspectRatio === '9:16' ? '#3B82F6' : 'transparent',
                color: '#FFF',
                border: 'none',
                padding: '6px 14px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              📱 9:16 (Reel/Shorts)
            </button>
          </div>

          <Link
            href="/"
            style={{
              background: '#334155',
              color: '#FFF',
              padding: '8px 16px',
              borderRadius: 8,
              fontSize: 13,
              textDecoration: 'none',
              fontWeight: 500
            }}
          >
            ← Back to App
          </Link>
        </div>
      </header>

      {/* Main Studio Container */}
      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '24px 20px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, borderBottom: '1px solid #1E293B', paddingBottom: 12 }}>
          <button
            onClick={() => setActiveTab('player')}
            style={{
              background: activeTab === 'player' ? '#EF4444' : '#1E293B',
              color: '#FFF',
              border: 'none',
              padding: '10px 20px',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            ▶️ Interactive Video Demo
          </button>
          <button
            onClick={() => setActiveTab('script')}
            style={{
              background: activeTab === 'script' ? '#EF4444' : '#1E293B',
              color: '#FFF',
              border: 'none',
              padding: '10px 20px',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            📝 60s Script & Scene Breakdown
          </button>
          <button
            onClick={() => setActiveTab('social')}
            style={{
              background: activeTab === 'social' ? '#EF4444' : '#1E293B',
              color: '#FFF',
              border: 'none',
              padding: '10px 20px',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            💬 Ready-Made WhatsApp & DM Pitch
          </button>
        </div>

        {activeTab === 'player' && (
          <div style={{ display: 'grid', gridTemplateColumns: aspectRatio === '16:9' ? '1fr 340px' : '480px 1fr', gap: 24, alignItems: 'start' }}>
            {/* Video Player Display Screen */}
            <div style={{
              background: '#020617',
              borderRadius: 20,
              border: '1px solid #1E293B',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
              position: 'relative'
            }}>
              {/* Screen Top Bar */}
              <div style={{
                background: '#0F172A',
                padding: '12px 18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #1E293B'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444' }} />
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#F59E0B' }} />
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981' }} />
                  <span style={{ fontSize: 12, color: '#94A3B8', marginLeft: 8 }}>
                    {activeScene.screenTitle}
                  </span>
                </div>
                <div style={{
                  background: activeScene.color + '22',
                  color: activeScene.color,
                  border: `1px solid ${activeScene.color}44`,
                  padding: '3px 10px',
                  borderRadius: 12,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.04em'
                }}>
                  {activeScene.badge}
                </div>
              </div>

              {/* Dynamic Video Stage */}
              <div style={{
                minHeight: aspectRatio === '16:9' ? 440 : 600,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: 28,
                background: 'radial-gradient(circle at 50% 20%, #1E1B4B 0%, #020617 80%)',
                position: 'relative'
              }}>
                {/* Scene Tag & Progress */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    background: '#EF4444',
                    color: '#FFF',
                    fontWeight: 800,
                    fontSize: 11,
                    padding: '4px 10px',
                    borderRadius: 6,
                    letterSpacing: '0.05em'
                  }}>
                    {activeScene.tag}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#CBD5E1', fontVariantNumeric: 'tabular-nums' }}>
                    00:{currentTime < 10 ? `0${Math.floor(currentTime)}` : Math.floor(currentTime)} / 01:00
                  </span>
                </div>

                {/* Animated Visual Content for each Scene */}
                <div style={{ margin: 'auto 0', textAlign: 'center', padding: '16px 0' }}>
                  {activeScene.id === 1 && (
                    <div style={{ animation: 'fadeIn 0.5s ease' }}>
                      <div style={{ fontSize: 56, marginBottom: 16 }}>💸 ➔ 🚫</div>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 16,
                        background: '#1E293B',
                        padding: '16px 28px',
                        borderRadius: 16,
                        border: '1px solid #EF4444',
                        marginBottom: 16
                      }}>
                        <div>
                          <div style={{ fontSize: 12, color: '#94A3B8' }}>Aggregator Cut</div>
                          <div style={{ fontSize: 28, fontWeight: 900, color: '#EF4444' }}>-30% Commission</div>
                        </div>
                        <div style={{ fontSize: 24, color: '#64748B' }}>VS</div>
                        <div>
                          <div style={{ fontSize: 12, color: '#94A3B8' }}>DirectDine Cut</div>
                          <div style={{ fontSize: 28, fontWeight: 900, color: '#10B981' }}>0% Commission</div>
                        </div>
                      </div>
                      <h2 style={{ fontSize: 26, fontWeight: 800, margin: '8px 0', color: '#FFF' }}>
                        {activeScene.headline}
                      </h2>
                      <p style={{ fontSize: 14, color: '#94A3B8', maxWidth: 500, margin: '0 auto' }}>
                        {activeScene.subtext}
                      </p>
                    </div>
                  )}

                  {activeScene.id === 2 && (
                    <div style={{ animation: 'fadeIn 0.5s ease' }}>
                      <div style={{
                        maxWidth: 340,
                        margin: '0 auto 16px',
                        background: '#FFF',
                        color: '#000',
                        borderRadius: 20,
                        padding: 16,
                        textAlign: 'left',
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid #EEE', paddingBottom: 8 }}>
                          <span style={{ fontWeight: 800, fontSize: 14 }}>🌿 Spice Garden Restaurant</span>
                          <span style={{ background: '#DCFCE7', color: '#15803D', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>0% Fee</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, background: '#F8FAFC', padding: 8, borderRadius: 8 }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 13 }}>Paneer Butter Masala</div>
                            <div style={{ fontSize: 12, color: '#64748B' }}>₹280 • 1 item added</div>
                          </div>
                          <button style={{ background: '#EF4444', color: '#FFF', border: 'none', padding: '6px 12px', borderRadius: 6, fontWeight: 700, fontSize: 12 }}>
                            Add +
                          </button>
                        </div>
                        <div style={{ background: '#10B981', color: '#FFF', padding: '10px 14px', borderRadius: 8, textAlign: 'center', fontWeight: 800, fontSize: 13, marginTop: 10 }}>
                          ⚡ 1-Tap UPI Checkout (₹280)
                        </div>
                      </div>
                      <h2 style={{ fontSize: 24, fontWeight: 800, margin: '8px 0', color: '#FFF' }}>
                        {activeScene.headline}
                      </h2>
                      <p style={{ fontSize: 14, color: '#94A3B8', maxWidth: 520, margin: '0 auto' }}>
                        {activeScene.subtext}
                      </p>
                    </div>
                  )}

                  {activeScene.id === 3 && (
                    <div style={{ animation: 'fadeIn 0.5s ease' }}>
                      <div style={{
                        maxWidth: 420,
                        margin: '0 auto 16px',
                        background: '#1E293B',
                        borderRadius: 16,
                        padding: 16,
                        border: '2px solid #3B82F6',
                        textAlign: 'left'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 20 }}>🔔</span>
                            <span style={{ fontWeight: 800, color: '#38BDF8', fontSize: 14 }}>NEW ORDER #1042</span>
                          </div>
                          <span style={{ background: '#EF4444', color: '#FFF', fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 6, animation: 'pulse 1s infinite' }}>
                            RINGING ALERT
                          </span>
                        </div>
                        <div style={{ fontSize: 13, color: '#E2E8F0', marginBottom: 12 }}>
                          2x Butter Naan, 1x Dal Makhani • Table #4
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button style={{ flex: 1, background: '#10B981', color: '#FFF', border: 'none', padding: '8px', borderRadius: 8, fontWeight: 700, fontSize: 12 }}>
                            ✓ Accept (20 Min)
                          </button>
                          <button style={{ background: '#334155', color: '#CBD5E1', border: 'none', padding: '8px 14px', borderRadius: 8, fontWeight: 600, fontSize: 12 }}>
                            Print KOT
                          </button>
                        </div>
                      </div>
                      <h2 style={{ fontSize: 24, fontWeight: 800, margin: '8px 0', color: '#FFF' }}>
                        {activeScene.headline}
                      </h2>
                      <p style={{ fontSize: 14, color: '#94A3B8', maxWidth: 520, margin: '0 auto' }}>
                        {activeScene.subtext}
                      </p>
                    </div>
                  )}

                  {activeScene.id === 4 && (
                    <div style={{ animation: 'fadeIn 0.5s ease' }}>
                      <div style={{
                        maxWidth: 360,
                        margin: '0 auto 16px',
                        background: '#075E54',
                        color: '#FFF',
                        borderRadius: 16,
                        padding: 16,
                        textAlign: 'left',
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                          <span style={{ fontSize: 20 }}>💬</span>
                          <span style={{ fontWeight: 700, fontSize: 13 }}>Spice Garden WhatsApp Bot</span>
                        </div>
                        <div style={{ background: '#DCF8C6', color: '#111827', padding: 12, borderRadius: 10, fontSize: 12, lineHeight: 1.5 }}>
                          <strong>Order Confirmed! 🎉</strong><br />
                          Your delicious meal is being prepared.<br />
                          ⏱️ Est Time: 25 mins<br />
                          🔗 <span style={{ color: '#2563EB', textDecoration: 'underline' }}>Track Live: directdine.in/track/4829</span>
                        </div>
                      </div>
                      <h2 style={{ fontSize: 24, fontWeight: 800, margin: '8px 0', color: '#FFF' }}>
                        {activeScene.headline}
                      </h2>
                      <p style={{ fontSize: 14, color: '#94A3B8', maxWidth: 520, margin: '0 auto' }}>
                        {activeScene.subtext}
                      </p>
                    </div>
                  )}

                  {activeScene.id === 5 && (
                    <div style={{ animation: 'fadeIn 0.5s ease' }}>
                      <div style={{ fontSize: 52, marginBottom: 12 }}>🚀 📈 💰</div>
                      <div style={{
                        display: 'inline-block',
                        background: 'linear-gradient(135deg, #EF4444, #B91C1C)',
                        color: '#FFF',
                        padding: '12px 24px',
                        borderRadius: 12,
                        fontWeight: 900,
                        fontSize: 22,
                        marginBottom: 16,
                        boxShadow: '0 10px 20px rgba(239, 68, 68, 0.4)'
                      }}>
                        Own This Software Today!
                      </div>
                      <h2 style={{ fontSize: 26, fontWeight: 800, margin: '8px 0', color: '#FFF' }}>
                        Flat Monthly SaaS ya Lifetime Source Code
                      </h2>
                      <p style={{ fontSize: 14, color: '#94A3B8', maxWidth: 520, margin: '0 auto 16px' }}>
                        Zero commission direct food ordering system for your own restaurant or marketing agency clients.
                      </p>
                      <div style={{ display: 'inline-flex', gap: 12 }}>
                        <span style={{ background: '#1E293B', border: '1px solid #334155', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700 }}>
                          📞 WhatsApp: +91 98765 43210
                        </span>
                        <span style={{ background: '#10B981', color: '#FFF', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700 }}>
                          Instant Demo Available
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Subtitle / Caption Bar (Voiceover sync) */}
                <div style={{
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid #334155',
                  padding: '12px 18px',
                  borderRadius: 12,
                  backdropFilter: 'blur(8px)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: 11, color: '#EF4444', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>
                    🗣️ Voiceover & Subtitles (Hindi):
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#F1F5F9', lineHeight: 1.4 }}>
                    "{activeScene.voiceover}"
                  </div>
                </div>
              </div>

              {/* Player Timeline Progress Bar */}
              <div
                style={{
                  height: 6,
                  background: '#1E293B',
                  position: 'relative',
                  cursor: 'pointer'
                }}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const newTime = Number(((clickX / rect.width) * 60).toFixed(1));
                  setCurrentTime(newTime);
                }}
              >
                <div style={{
                  height: '100%',
                  width: `${(currentTime / 60) * 100}%`,
                  background: 'linear-gradient(90deg, #EF4444, #F59E0B)',
                  transition: 'width 0.1s linear'
                }} />
              </div>

              {/* Player Controls Bar */}
              <div style={{
                background: '#0F172A',
                padding: '14px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button
                    onClick={handlePlayPause}
                    style={{
                      background: isPlaying ? '#E2E8F0' : '#EF4444',
                      color: isPlaying ? '#0F172A' : '#FFF',
                      border: 'none',
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      fontSize: 18,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {isPlaying ? '⏸' : '▶'}
                  </button>

                  <button
                    onClick={handleRestart}
                    style={{
                      background: '#1E293B',
                      color: '#CBD5E1',
                      border: 'none',
                      padding: '8px 14px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    🔄 Restart
                  </button>

                  <button
                    onClick={() => setVoiceEnabled(!voiceEnabled)}
                    style={{
                      background: voiceEnabled ? '#10B98122' : '#334155',
                      color: voiceEnabled ? '#10B981' : '#94A3B8',
                      border: `1px solid ${voiceEnabled ? '#10B98144' : '#475569'}`,
                      padding: '8px 14px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {voiceEnabled ? '🔊 AI Voice: ON' : '🔇 AI Voice: OFF'}
                  </button>
                </div>

                {/* Direct Screen Recorder */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {!recording ? (
                    <button
                      onClick={startRecording}
                      style={{
                        background: '#DC2626',
                        color: '#FFF',
                        border: 'none',
                        padding: '10px 18px',
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      ⏺ Record & Download Video
                    </button>
                  ) : (
                    <button
                      onClick={stopRecording}
                      style={{
                        background: '#B91C1C',
                        color: '#FFF',
                        border: 'none',
                        padding: '10px 18px',
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        animation: 'pulse 1s infinite'
                      }}
                    >
                      ⏹ Stop & Save Video File
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Scene Selector Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Timeline Scenes (Click to Jump)
              </div>
              {SCENES.map((scene) => {
                const isActive = activeScene.id === scene.id;
                return (
                  <div
                    key={scene.id}
                    onClick={() => handleJumpToScene(scene)}
                    style={{
                      background: isActive ? '#1E293B' : '#0F172A',
                      border: `1px solid ${isActive ? '#EF4444' : '#1E293B'}`,
                      borderRadius: 12,
                      padding: 14,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: isActive ? '#EF4444' : '#64748B'
                      }}>
                        {scene.tag}
                      </span>
                      <span style={{ fontSize: 11, color: '#94A3B8', fontVariantNumeric: 'tabular-nums' }}>
                        {scene.duration}s
                      </span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC', marginBottom: 4 }}>
                      {scene.title}
                    </div>
                    <div style={{ fontSize: 11, color: '#94A3B8', lineHeight: 1.4 }}>
                      {scene.subtext}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Scene-by-Scene Script & Director Directions */}
        {activeTab === 'script' && (
          <div style={{ background: '#0F172A', borderRadius: 16, border: '1px solid #1E293B', padding: 28 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px', color: '#FFF' }}>
              60-Second Video Shooting Script (Hindi + English)
            </h2>
            <p style={{ fontSize: 14, color: '#94A3B8', margin: '0 0 24px' }}>
              Use this script to record on your phone with Loom, CapCut, or InVideo.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {SCENES.map((scene) => (
                <div key={scene.id} style={{ background: '#1E293B', borderRadius: 12, padding: 20, borderLeft: `4px solid ${scene.color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontWeight: 800, fontSize: 14, color: scene.color }}>
                      {scene.title} ({scene.startTime}s - {scene.startTime + scene.duration}s)
                    </span>
                    <span style={{ background: '#0F172A', padding: '3px 8px', borderRadius: 6, fontSize: 11, color: '#94A3B8' }}>
                      Duration: {scene.duration} seconds
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 12 }}>
                    <div style={{ background: '#0F172A', padding: 14, borderRadius: 8 }}>
                      <div style={{ fontSize: 11, color: '#38BDF8', fontWeight: 700, marginBottom: 4 }}>
                        🎬 SCREEN VISUAL (What to show):
                      </div>
                      <div style={{ fontSize: 13, color: '#E2E8F0', lineHeight: 1.5 }}>
                        {scene.id === 1 && "Show a graphic or calculator of 30% commission cut vs 0% DirectDine cut."}
                        {scene.id === 2 && "Screen record your phone scanning the Spice Garden QR code and adding items to cart in 10 seconds."}
                        {scene.id === 3 && "Show laptop screen: Spice Garden Dashboard ringing with sound when new order arrives, chef clicking 'Accept (20 Min)'."}
                        {scene.id === 4 && "Show WhatsApp phone screen receiving instant order confirmation with live tracking link."}
                        {scene.id === 5 && "Show your contact details, WhatsApp button, and pricing (₹499/month or Lifetime License)."}
                      </div>
                    </div>

                    <div style={{ background: '#0F172A', padding: 14, borderRadius: 8 }}>
                      <div style={{ fontSize: 11, color: '#4ADE80', fontWeight: 700, marginBottom: 4 }}>
                        🗣️ VOICEOVER (What to speak):
                      </div>
                      <div style={{ fontSize: 13, color: '#F1F5F9', lineHeight: 1.5, fontStyle: 'italic' }}>
                        "{scene.voiceover}"
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Social & WhatsApp Pitch */}
        {activeTab === 'social' && (
          <div style={{ background: '#0F172A', borderRadius: 16, border: '1px solid #1E293B', padding: 28 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px', color: '#FFF' }}>
              WhatsApp & Cold DM Sales Pitch
            </h2>
            <p style={{ fontSize: 14, color: '#94A3B8', margin: '0 0 20px' }}>
              Send this message along with your 1-minute video to restaurant owners or agencies:
            </p>

            <div style={{
              background: '#075E54',
              borderRadius: 12,
              padding: 24,
              color: '#FFF',
              fontFamily: 'monospace',
              fontSize: 14,
              lineHeight: 1.7,
              whiteSpace: 'pre-wrap'
            }}>
{`Namaste Restaurant Owner / Partner! 👋

Kya aap jante hain ki Swiggy aur Zomato aapke restaurant ke orders par 25% se 30% commission le jaate hain?

Humne local food businesses ke liye Direct Ordering Software develop kiya hai:
✅ 0% Commission — 100% paisa sidha aapke bank account me
✅ Table QR code & WhatsApp online ordering
✅ Kitchen Dashboard with Instant Sound Bells & Prep Timers
✅ Automatic WhatsApp delivery tracking for customers
✅ No marketing or delivery headache — Pure plug-and-play software

🎥 Watch this 1-Minute Video Demo attached above!

👉 Try Live Demo Yourself: [Paste Your Website Link]
Special Offer: Flat ₹499/month ya One-Time Lifetime License.

Reply "DEMO" to get your restaurant's free QR code setup today!`}
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText(`Namaste Restaurant Owner / Partner! 👋\n\nKya aap jante hain ki Swiggy aur Zomato aapke restaurant ke orders par 25% se 30% commission le jaate hain?\n\nHumne local food businesses ke liye Direct Ordering Software develop kiya hai:\n✅ 0% Commission — 100% paisa sidha aapke bank account me\n✅ Table QR code & WhatsApp online ordering\n✅ Kitchen Dashboard with Instant Sound Bells & Prep Timers\n✅ Automatic WhatsApp delivery tracking for customers\n✅ No marketing or delivery headache — Pure plug-and-play software\n\n🎥 Watch this 1-Minute Video Demo!\n\nSpecial Offer: Flat ₹499/month ya One-Time Lifetime License.\nReply "DEMO" to get your restaurant's free QR code setup today!`);
                alert('Copied pitch to clipboard!');
              }}
              style={{
                marginTop: 16,
                background: '#25D366',
                color: '#FFF',
                border: 'none',
                padding: '12px 24px',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer'
              }}
            >
              📋 Copy Pitch Text
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
