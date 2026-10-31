'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// Detailed Scene Definitions with Pure Devanagari Hindi Voiceover & High-Fidelity UI Screens
const SCENES = [
  {
    id: 1,
    tag: 'SCENE 1: THE HOOK',
    title: '30% Commission Band Karo',
    duration: 10,
    startTime: 0,
    badge: '30% Commission Saved',
    color: '#EF4444',
    hindiHeadline: 'अरे भइया! Swiggy-Zomato को 30% कमीशन देना बंद करो!',
    hindiSubtext: 'मेहनत आपकी, खाना आपका, और भारी कमीशन ले जाते हैं डिलीवरी ऐप्स! अब अपना खुद का डायरेक्ट सिस्टम चलाएं।',
    hindiVoiceover: 'अरे भइया! क्या आप भी हर महीने स्विगी और ज़ोमैटो को पच्चीस से तीस परसेंट कमीशन दे देकर परेशान हो चुके हैं? मेहनत आपकी, खाना आपका, और सारा मुनाफा ले जाते हैं डिलीवरी ऐप्स! अब ये भारी कमीशन देना बिल्कुल बंद कीजिए।',
    screenType: 'hook_comparison',
    appSection: 'Direct vs Aggregator Loss Calculator'
  },
  {
    id: 2,
    tag: 'SCENE 2: CUSTOMER STOREFRONT',
    title: '10 Second QR Mobile Ordering',
    duration: 12,
    startTime: 10,
    badge: '0% Commission Storefront',
    color: '#10B981',
    hindiHeadline: 'कस्टमर टेबल से QR स्कैन करेगा — 10 सेकंड में डायरेक्ट आर्डर!',
    hindiSubtext: 'बिना कोई ऐप डाउनलोड किए पूरा डिजिटल मेनू, फोटो, वेज-नॉनवेज फ़िल्टर और कस्टमाइज़ेशन।',
    hindiVoiceover: 'ये देखिए हमारा डायरेक्ट डाइन सॉफ़्टवेयर! कस्टमर टेबल पर रखे क्यूआर कोड को स्कैन करेगा या व्हाट्सएप लिंक खोलेगा। बिना कोई ऐप डाउनलोड किए सिर्फ दस सेकंड में पूरा डिजिटल मेनू देखेगा और सीधे आर्डर कर देगा। शून्य परसेंट कमीशन, सारा पैसा सीधा आपके बैंक में!',
    screenType: 'customer_menu',
    appSection: 'Live Customer Menu: Spice Garden (/spice-garden)'
  },
  {
    id: 3,
    tag: 'SCENE 3: 1-TAP CHECKOUT',
    title: 'Instant OTP & UPI Payment',
    duration: 10,
    startTime: 22,
    badge: '1-Tap UPI / COD',
    color: '#8B5CF6',
    hindiHeadline: '1-टैप OTP लॉगिन, कूपन और डायरेक्ट UPI पेमेंट',
    hindiSubtext: 'PhonePe, Google Pay, Paytm या Cash on Delivery — सीधा पैसा आपके खाते में बिना कटे।',
    hindiVoiceover: 'चेकआउट करना बच्चों का खेल है। वन-टैप ओटीपी वेरिफिकेशन, कूपन कोड, और सीधा फोनपे, गूगल-पे या पेटीएम से तुरंत पेमेंट। कोई झंझट नहीं, कोई बीच का दलाल नहीं।',
    screenType: 'customer_checkout',
    appSection: 'Checkout Flow: (/spice-garden/cart)'
  },
  {
    id: 4,
    tag: 'SCENE 4: KITCHEN DISPLAY (KDS)',
    title: 'Live Kitchen Dashboard & Bell Alert',
    duration: 14,
    startTime: 32,
    badge: 'Live Ringing Audio Bell',
    color: '#3B82F6',
    hindiHeadline: 'नया आर्डर आते ही बजेगी घंटी, 1-क्लिक में आर्डर एक्सेप्ट!',
    hindiSubtext: '15, 25 या 40 मिनट का प्रेप टाइमर, थर्मल KOT प्रिंट, और कोई डिश खत्म हो तो तुरंत स्टॉक ऑफ।',
    hindiVoiceover: 'अब देखिए रेस्टोरेंट का किचन डैशबोर्ड! जैसे ही नया आर्डर आएगा, लाउड साउंड बेल बजेगी। शेफ सिर्फ एक क्लिक में पच्चीस मिनट का टाइमर सेट करके आर्डर एक्सेप्ट करेगा, और किचन टिकट प्रिंट कर लेगा। अगर कोई डिश खत्म हो गई, तो एक टैप में उसे ऑफ कर सकते हैं।',
    screenType: 'kitchen_dashboard',
    appSection: 'Kitchen Operations: (/dashboard)'
  },
  {
    id: 5,
    tag: 'SCENE 5: WHATSAPP BOT & TRACKING',
    title: 'Automated WhatsApp Bot & Live Tracking',
    duration: 12,
    startTime: 46,
    badge: 'WhatsApp Cloud API',
    color: '#16A34A',
    hindiHeadline: 'कस्टमर के WhatsApp पर ऑटोमैटिक बिल और लाइव ट्रैकिंग!',
    hindiSubtext: 'आर्डर कन्फर्मेशन, डिलीवरी बॉय का नाम, फोन नंबर और 5-स्टार रेटिंग रिव्यु सिस्टम।',
    hindiVoiceover: 'और कस्टमर को क्या मिलेगा? उसके व्हाट्सएप पर तुरंत पक्का बिल, लाइव डिलीवरी ट्रैकिंग लिंक और राइडर का नंबर पहुंच जाएगा। कस्टमर भी खुश, और आप भी खुश!',
    screenType: 'whatsapp_tracking',
    appSection: 'WhatsApp Bot & Live Tracking (/track/[token])'
  },
  {
    id: 6,
    tag: 'SCENE 6: SUPER ADMIN & OFFER',
    title: '1-Min Setup & Own The Software',
    duration: 12,
    startTime: 58,
    badge: 'Own This Software Today',
    color: '#F59E0B',
    hindiHeadline: '1 मिनट में नया रेस्टोरेंट ऑनबोर्ड करें — आज ही सॉफ्टवेयर खरीदें!',
    hindiSubtext: 'सुपर एडमिन से अनलिमिटेड रेस्टोरेंट बनाएं, टेबल QR कोड जनरेट करें। मंथली SaaS या लाइफटाइम सोर्स कोड।',
    hindiVoiceover: 'सुपर एडमिन पैनल से आप एक मिनट में नया रेस्टोरेंट जोड़ सकते हैं और टेबल क्यूआर कोड डाउनलोड कर सकते हैं। तो चाहे अपने रेस्टोरेंट के लिए लेना हो, या अपनी एजेंसी के लिए पूरा सॉफ़्टवेयर खरीदना हो — आज ही नीचे दिए गए नंबर पर संपर्क करें और लाइव डेमो देखें!',
    screenType: 'super_admin',
    appSection: 'Super Admin & QR Engine (/admin)'
  }
];

export default function VideoDemoPage() {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [aspectRatio, setAspectRatio] = useState('16:9'); // '16:9' or '9:16'
  const [selectedSceneIndex, setSelectedSceneIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('video'); // 'video', 'screens', 'script', 'pitch'
  const [recording, setRecording] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [speechRate, setSpeechRate] = useState(1.0);

  const timerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  const totalDuration = 70; // 70-second complete deep-dive video

  // Find active scene based on currentTime
  const activeSceneIndex = SCENES.findIndex(
    (s, idx) => currentTime >= s.startTime && (idx === SCENES.length - 1 || currentTime < SCENES[idx + 1].startTime)
  );
  const currentScene = SCENES[activeSceneIndex] || SCENES[0];

  // Initialize Speech Synthesis & Indian / Hindi Voice Detection
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);

        // Find best Hindi voice or Indian voice
        const hindiVoice = voices.find(
          v => v.lang === 'hi-IN' || v.lang === 'hi_IN' || v.lang.toLowerCase().includes('hi')
        );
        const indianVoice = voices.find(
          v => v.lang.includes('IN') || v.name.toLowerCase().includes('india')
        );
        setSelectedVoice(hindiVoice || indianVoice || voices[0] || null);
      };

      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  // Web Audio Kitchen Ringing Bell Sound
  const playKitchenBell = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch {
      // Audio autoplay policy
    }
  };

  // Web Audio UPI Success Chime
  const playUPIChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.24); // G5
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch {
      // Audio autoplay policy
    }
  };

  // Pure Devanagari Hindi Text-To-Speech with correct lang
  const speakHindi = (text) => {
    if (!voiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'hi-IN';
    utterance.rate = speechRate;
    utterance.pitch = 1.02;

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    window.speechSynthesis.speak(utterance);
  };

  // Trigger speech & sound when scene changes during video play
  useEffect(() => {
    if (isPlaying) {
      speakHindi(currentScene.hindiVoiceover);

      if (currentScene.id === 3) {
        setTimeout(playUPIChime, 800);
      }
      if (currentScene.id === 4) {
        setTimeout(playKitchenBell, 400);
      }
    }
  }, [activeSceneIndex, isPlaying]);

  // Playback Timer
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= totalDuration) {
            setIsPlaying(false);
            if (window.speechSynthesis) window.speechSynthesis.cancel();
            return totalDuration;
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
    if (currentTime >= totalDuration) {
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

  const jumpToScene = (scene) => {
    setCurrentTime(scene.startTime);
    if (!isPlaying) {
      setIsPlaying(true);
    }
  };

  // Screen Recording Handler
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
        a.download = `DirectDine-Hindi-Sales-Video-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        setRecording(false);
      };

      recorder.start();
      setRecording(true);
      setCurrentTime(0);
      setIsPlaying(true);
    } catch {
      alert('Screen recording permission was cancelled.');
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
    <div style={{ minHeight: '100vh', background: '#0B0F19', color: '#F1F5F9', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Studio Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 28px',
        borderBottom: '1px solid #1E293B',
        background: 'rgba(11, 15, 25, 0.95)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            background: 'linear-gradient(135deg, #EF4444, #991B1B)',
            width: 42,
            height: 42,
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)'
          }}>
            🎥
          </div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 8 }}>
              DirectDine <span style={{ background: '#EF4444', color: '#FFF', fontSize: 11, padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>हिंदी सेल्स वीडियो</span>
            </h1>
            <p style={{ margin: 0, fontSize: 12, color: '#94A3B8' }}>
              असली स्क्रीन्स, शुद्ध हिंदी वॉयसओवर और एप्लीकेशन का पूरा डेमो
            </p>
          </div>
        </div>

        {/* Studio Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Aspect Ratio Switcher */}
          <div style={{ display: 'flex', background: '#1E293B', borderRadius: 8, padding: 3 }}>
            <button
              onClick={() => setAspectRatio('16:9')}
              style={{
                background: aspectRatio === '16:9' ? '#3B82F6' : 'transparent',
                color: '#FFF',
                border: 'none',
                padding: '6px 12px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              🖥️ Desktop (16:9)
            </button>
            <button
              onClick={() => setAspectRatio('9:16')}
              style={{
                background: aspectRatio === '9:16' ? '#3B82F6' : 'transparent',
                color: '#FFF',
                border: 'none',
                padding: '6px 12px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              📱 Reel / Status (9:16)
            </button>
          </div>

          <Link
            href="/"
            style={{
              background: '#1E293B',
              color: '#CBD5E1',
              padding: '8px 14px',
              borderRadius: 8,
              fontSize: 13,
              textDecoration: 'none',
              fontWeight: 600,
              border: '1px solid #334155'
            }}
          >
            ← Back to App
          </Link>
        </div>
      </header>

      {/* Main Content Layout */}
      <div style={{ maxWidth: 1380, margin: '0 auto', padding: '24px 20px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, borderBottom: '1px solid #1E293B', paddingBottom: 14 }}>
          <button
            onClick={() => setActiveTab('video')}
            style={{
              background: activeTab === 'video' ? '#EF4444' : '#1E293B',
              color: '#FFF',
              border: 'none',
              padding: '10px 18px',
              borderRadius: 8,
              fontSize: 13.5,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            ▶️ 1-Minute Live Video Demo
          </button>
          <button
            onClick={() => setActiveTab('screens')}
            style={{
              background: activeTab === 'screens' ? '#EF4444' : '#1E293B',
              color: '#FFF',
              border: 'none',
              padding: '10px 18px',
              borderRadius: 8,
              fontSize: 13.5,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            🖼️ All Application Screens & Features
          </button>
          <button
            onClick={() => setActiveTab('script')}
            style={{
              background: activeTab === 'script' ? '#EF4444' : '#1E293B',
              color: '#FFF',
              border: 'none',
              padding: '10px 18px',
              borderRadius: 8,
              fontSize: 13.5,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            📜 Pure Hindi Voiceover Script (शुद्ध हिंदी)
          </button>
          <button
            onClick={() => setActiveTab('pitch')}
            style={{
              background: activeTab === 'pitch' ? '#EF4444' : '#1E293B',
              color: '#FFF',
              border: 'none',
              padding: '10px 18px',
              borderRadius: 8,
              fontSize: 13.5,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            💬 Ready WhatsApp Message to Sell
          </button>
        </div>

        {/* TAB 1: INTERACTIVE LIVE VIDEO DEMO */}
        {activeTab === 'video' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: aspectRatio === '16:9' ? '1fr 360px' : '520px 1fr',
            gap: 24,
            alignItems: 'start'
          }}>
            {/* Video Stage Frame */}
            <div style={{
              background: '#020617',
              borderRadius: 20,
              border: '1px solid #1E293B',
              overflow: 'hidden',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
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
                  <span style={{ fontSize: 12, color: '#94A3B8', marginLeft: 8, fontWeight: 600 }}>
                    {currentScene.appSection}
                  </span>
                </div>

                <div style={{
                  background: currentScene.color + '22',
                  color: currentScene.color,
                  border: `1px solid ${currentScene.color}55`,
                  padding: '3px 10px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 800
                }}>
                  {currentScene.badge}
                </div>
              </div>

              {/* Dynamic Video Stage (Renders Realistic Actual App Screenshots) */}
              <div style={{
                minHeight: aspectRatio === '16:9' ? 520 : 660,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: 24,
                background: 'radial-gradient(ellipse at 50% 10%, #1E1B4B 0%, #030712 90%)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Top Badge & Timer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
                  <div style={{
                    background: currentScene.color,
                    color: '#FFF',
                    fontWeight: 900,
                    fontSize: 11,
                    padding: '4px 12px',
                    borderRadius: 6,
                    letterSpacing: '0.05em'
                  }}>
                    {currentScene.tag}
                  </div>

                  <div style={{
                    background: 'rgba(15, 23, 42, 0.8)',
                    padding: '4px 12px',
                    borderRadius: 20,
                    border: '1px solid #334155',
                    fontSize: 13,
                    fontWeight: 800,
                    fontVariantNumeric: 'tabular-nums',
                    color: '#F8FAFC'
                  }}>
                    ⏱️ 00:{currentTime < 10 ? `0${Math.floor(currentTime)}` : Math.floor(currentTime)} / 01:{totalDuration}
                  </div>
                </div>

                {/* SCENE VISUAL: HIGH-FIDELITY ACTUAL APP SCREENS */}
                <div style={{ margin: 'auto 0', zIndex: 10, padding: '16px 0' }}>
                  {/* SCENE 1: Aggregator Loss Calculator */}
                  {currentScene.id === 1 && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        maxWidth: 580,
                        margin: '0 auto 16px',
                        background: '#0F172A',
                        borderRadius: 16,
                        border: '1px solid #334155',
                        padding: 20,
                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                      }}>
                        <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 12, fontWeight: 700 }}>
                          📊 MONTHLY RESTAURANT PROFIT LOSS (ON ₹2,00,000 SALES)
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                          <div style={{ background: '#7F1D1D22', border: '1px solid #EF4444', borderRadius: 12, padding: 14 }}>
                            <div style={{ fontSize: 12, color: '#FCA5A5' }}>Swiggy / Zomato Cut</div>
                            <div style={{ fontSize: 28, fontWeight: 900, color: '#EF4444', margin: '4px 0' }}>-₹60,000</div>
                            <div style={{ fontSize: 11, color: '#94A3B8' }}>30% Commission Lost Every Month!</div>
                          </div>
                          <div style={{ background: '#064E3B22', border: '1px solid #10B981', borderRadius: 12, padding: 14 }}>
                            <div style={{ fontSize: 12, color: '#6EE7B7' }}>DirectDine Platform Cut</div>
                            <div style={{ fontSize: 28, fontWeight: 900, color: '#10B981', margin: '4px 0' }}>₹0 Cut</div>
                            <div style={{ fontSize: 11, color: '#6EE7B7', fontWeight: 700 }}>100% Direct to Bank!</div>
                          </div>
                        </div>
                      </div>
                      <h2 style={{ fontSize: 24, fontWeight: 800, margin: '8px 0', color: '#FFF' }}>
                        {currentScene.hindiHeadline}
                      </h2>
                      <p style={{ fontSize: 14, color: '#94A3B8', maxWidth: 540, margin: '0 auto' }}>
                        {currentScene.hindiSubtext}
                      </p>
                    </div>
                  )}

                  {/* SCENE 2: Actual Customer Mobile Storefront (/spice-garden) */}
                  {currentScene.id === 2 && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        maxWidth: 380,
                        margin: '0 auto 16px',
                        background: '#FFFFFF',
                        color: '#111827',
                        borderRadius: 24,
                        padding: 16,
                        boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                        textAlign: 'left'
                      }}>
                        {/* Restaurant Top Banner */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 18 }}>🌿</span>
                              <strong style={{ fontSize: 15, color: '#111827' }}>Spice Garden</strong>
                              <span style={{ background: '#DCFCE7', color: '#15803D', fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4 }}>0% Fee</span>
                            </div>
                            <div style={{ fontSize: 11, color: '#6B7280' }}>Bandra West • Table #4 Dine-In</div>
                          </div>
                          <span style={{ background: '#FEF3C7', color: '#D97706', fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 6 }}>
                            ★ 4.8 (500+)
                          </span>
                        </div>

                        {/* Dish Item 1 */}
                        <div style={{ background: '#F8FAFC', padding: 10, borderRadius: 12, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #E2E8F0' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span style={{ width: 10, height: 10, borderRadius: 2, border: '2px solid #16A34A', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#16A34A' }} />
                              </span>
                              <strong style={{ fontSize: 13, color: '#0F172A' }}>Paneer Butter Masala</strong>
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#EF4444', marginTop: 2 }}>₹280 <span style={{ fontSize: 10, color: '#64748B', fontWeight: 400 }}>(Best Seller)</span></div>
                          </div>
                          <button style={{ background: '#EF4444', color: '#FFF', border: 'none', padding: '6px 14px', borderRadius: 8, fontWeight: 800, fontSize: 12 }}>
                            Add +
                          </button>
                        </div>

                        {/* Dish Item 2 */}
                        <div style={{ background: '#F8FAFC', padding: 10, borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #E2E8F0' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span style={{ width: 10, height: 10, borderRadius: 2, border: '2px solid #DC2626', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#DC2626' }} />
                              </span>
                              <strong style={{ fontSize: 13, color: '#0F172A' }}>Chicken Dum Biryani</strong>
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#EF4444', marginTop: 2 }}>₹340</div>
                          </div>
                          <button style={{ background: '#EF4444', color: '#FFF', border: 'none', padding: '6px 14px', borderRadius: 8, fontWeight: 800, fontSize: 12 }}>
                            Add +
                          </button>
                        </div>

                        {/* Direct Bottom Bar */}
                        <div style={{ background: '#10B981', color: '#FFF', padding: '10px 14px', borderRadius: 10, textAlign: 'center', fontWeight: 800, fontSize: 13, marginTop: 12 }}>
                          ⚡ 1 Item Added • View Cart (₹280) ➔
                        </div>
                      </div>
                      <h2 style={{ fontSize: 24, fontWeight: 800, margin: '8px 0', color: '#FFF' }}>
                        {currentScene.hindiHeadline}
                      </h2>
                      <p style={{ fontSize: 14, color: '#94A3B8', maxWidth: 540, margin: '0 auto' }}>
                        {currentScene.hindiSubtext}
                      </p>
                    </div>
                  )}

                  {/* SCENE 3: 1-Tap OTP & UPI Checkout (/spice-garden/cart) */}
                  {currentScene.id === 3 && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        maxWidth: 380,
                        margin: '0 auto 16px',
                        background: '#FFFFFF',
                        color: '#111827',
                        borderRadius: 24,
                        padding: 16,
                        boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                        textAlign: 'left'
                      }}>
                        <div style={{ borderBottom: '1px solid #E5E7EB', paddingBottom: 8, marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
                          <strong style={{ fontSize: 14 }}>🛒 Order Summary</strong>
                          <span style={{ fontSize: 11, background: '#DCFCE7', color: '#15803D', fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>Coupon Applied: FLAT50</span>
                        </div>

                        <div style={{ fontSize: 12, color: '#4B5563', marginBottom: 8 }}>
                          1x Paneer Butter Masala (₹280) + 2x Garlic Naan (₹90)
                        </div>

                        <div style={{ background: '#F3F4F6', padding: 10, borderRadius: 10, marginBottom: 10 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                            <span>Subtotal:</span>
                            <strong>₹370</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#16A34A', fontWeight: 700 }}>
                            <span>Discount (FLAT50):</span>
                            <span>-₹50</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 900, marginTop: 4, borderTop: '1px dashed #D1D5DB', paddingTop: 4 }}>
                            <span>Total Payable:</span>
                            <span style={{ color: '#EF4444' }}>₹320</span>
                          </div>
                        </div>

                        {/* 1-Tap Login & UPI Button */}
                        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 8, borderRadius: 8, fontSize: 11, color: '#64748B', marginBottom: 10 }}>
                          🔐 Verified Phone: <strong>+91 98765 43210</strong> (Auto-OTP 123456)
                        </div>

                        <button style={{
                          width: '100%',
                          background: 'linear-gradient(135deg, #10B981, #059669)',
                          color: '#FFF',
                          border: 'none',
                          padding: '12px',
                          borderRadius: 10,
                          fontWeight: 800,
                          fontSize: 14,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
                        }}>
                          ⚡ Pay via UPI (PhonePe / GPay / Paytm)
                        </button>
                      </div>
                      <h2 style={{ fontSize: 24, fontWeight: 800, margin: '8px 0', color: '#FFF' }}>
                        {currentScene.hindiHeadline}
                      </h2>
                      <p style={{ fontSize: 14, color: '#94A3B8', maxWidth: 540, margin: '0 auto' }}>
                        {currentScene.hindiSubtext}
                      </p>
                    </div>
                  )}

                  {/* SCENE 4: Kitchen Dashboard & Live Ringing KDS (/dashboard) */}
                  {currentScene.id === 4 && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        maxWidth: 520,
                        margin: '0 auto 16px',
                        background: '#0F172A',
                        borderRadius: 18,
                        border: '2px solid #3B82F6',
                        padding: 18,
                        textAlign: 'left',
                        boxShadow: '0 20px 40px rgba(59, 130, 246, 0.3)'
                      }}>
                        {/* Ringing Alert Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 24, animation: 'bounce 0.8s infinite' }}>🔔</span>
                            <div>
                              <strong style={{ fontSize: 15, color: '#38BDF8' }}>LIVE KITCHEN DISPLAY (KDS)</strong>
                              <div style={{ fontSize: 11, color: '#94A3B8' }}>Audio Bell Chime Active</div>
                            </div>
                          </div>
                          <span style={{
                            background: '#EF4444',
                            color: '#FFF',
                            fontWeight: 900,
                            fontSize: 11,
                            padding: '4px 10px',
                            borderRadius: 6,
                            animation: 'pulse 1s infinite'
                          }}>
                            NEW ORDER #1042
                          </span>
                        </div>

                        {/* Order Details */}
                        <div style={{ background: '#1E293B', padding: 12, borderRadius: 10, marginBottom: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 13, color: '#F8FAFC' }}>
                            <span>Table #4 • Rahul S.</span>
                            <span style={{ color: '#10B981' }}>₹320 (PAID UPI)</span>
                          </div>
                          <div style={{ fontSize: 12, color: '#CBD5E1', marginTop: 4 }}>
                            • 1x Paneer Butter Masala<br />
                            • 2x Garlic Naan (Butter Crispy)
                          </div>
                          <div style={{ fontSize: 11, color: '#F59E0B', marginTop: 4, fontWeight: 600 }}>
                            📝 Note: "Less spicy, extra green chutney please"
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button style={{ flex: 1, background: '#10B981', color: '#FFF', border: 'none', padding: '10px', borderRadius: 8, fontWeight: 800, fontSize: 13 }}>
                            ✓ Accept (25 Mins)
                          </button>
                          <button style={{ background: '#334155', color: '#E2E8F0', border: 'none', padding: '10px 14px', borderRadius: 8, fontWeight: 700, fontSize: 13 }}>
                            🖨️ Print KOT
                          </button>
                          <button style={{ background: '#7F1D1D', color: '#FCA5A5', border: 'none', padding: '10px 12px', borderRadius: 8, fontWeight: 700, fontSize: 12 }}>
                            86 Item Off
                          </button>
                        </div>
                      </div>
                      <h2 style={{ fontSize: 24, fontWeight: 800, margin: '8px 0', color: '#FFF' }}>
                        {currentScene.hindiHeadline}
                      </h2>
                      <p style={{ fontSize: 14, color: '#94A3B8', maxWidth: 540, margin: '0 auto' }}>
                        {currentScene.hindiSubtext}
                      </p>
                    </div>
                  )}

                  {/* SCENE 5: WhatsApp Bot & Live Delivery Tracking */}
                  {currentScene.id === 5 && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        maxWidth: 420,
                        margin: '0 auto 16px',
                        background: '#0B141A',
                        borderRadius: 20,
                        padding: 16,
                        border: '1px solid #1F2C34',
                        textAlign: 'left',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.7)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #1F2C34', paddingBottom: 10, marginBottom: 12 }}>
                          <span style={{ fontSize: 22 }}>💬</span>
                          <div>
                            <strong style={{ color: '#E9EDEF', fontSize: 14 }}>Spice Garden WhatsApp Bot</strong>
                            <div style={{ fontSize: 11, color: '#00A884' }}>● Automated Order Engine</div>
                          </div>
                        </div>

                        {/* WhatsApp Message Bubble */}
                        <div style={{ background: '#005C4B', color: '#E9EDEF', padding: 12, borderRadius: '0 12px 12px 12px', fontSize: 12.5, lineHeight: 1.6, marginBottom: 10 }}>
                          <strong>Order Confirmed! 🍛🎉</strong><br />
                          Hi Rahul, your delicious meal is being prepared!<br />
                          ⏱️ <strong>Ready in:</strong> 25 minutes<br />
                          🛵 <strong>Rider:</strong> Ramesh Kumar (+91 9876543210)<br />
                          🔗 <span style={{ color: '#53BDEB', textDecoration: 'underline' }}>Track Order: directdine.in/track/ord_1042</span>
                        </div>

                        {/* Live Tracking Progress Pill */}
                        <div style={{ background: '#1F2C34', padding: 10, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                          <span style={{ color: '#00A884', fontWeight: 700 }}>✓ Kitchen Preparing</span>
                          <span style={{ color: '#94A3B8' }}>➔ Out for Delivery</span>
                          <span style={{ color: '#94A3B8' }}>➔ Delivered</span>
                        </div>
                      </div>
                      <h2 style={{ fontSize: 24, fontWeight: 800, margin: '8px 0', color: '#FFF' }}>
                        {currentScene.hindiHeadline}
                      </h2>
                      <p style={{ fontSize: 14, color: '#94A3B8', maxWidth: 540, margin: '0 auto' }}>
                        {currentScene.hindiSubtext}
                      </p>
                    </div>
                  )}

                  {/* SCENE 6: Super Admin & Software Purchase Offer */}
                  {currentScene.id === 6 && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        maxWidth: 500,
                        margin: '0 auto 16px',
                        background: 'linear-gradient(135deg, #1E1B4B, #0F172A)',
                        borderRadius: 20,
                        border: '2px solid #F59E0B',
                        padding: 22,
                        boxShadow: '0 20px 40px rgba(245, 158, 11, 0.25)'
                      }}>
                        <div style={{ display: 'inline-block', background: '#F59E0B', color: '#000', fontWeight: 900, fontSize: 12, padding: '4px 12px', borderRadius: 20, marginBottom: 10 }}>
                          👑 SUPER ADMIN + FULL SOURCE CODE
                        </div>
                        <h3 style={{ fontSize: 22, fontWeight: 900, color: '#FFF', margin: '6px 0 12px' }}>
                          इस पूरे सॉफ़्टवेयर को अपना बनाएं!
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, textAlign: 'left', marginBottom: 16 }}>
                          <div style={{ background: '#1E293B', padding: 10, borderRadius: 10, border: '1px solid #334155' }}>
                            <div style={{ fontSize: 11, color: '#94A3B8' }}>Option A: Restaurant SaaS</div>
                            <strong style={{ fontSize: 16, color: '#10B981' }}>₹499 - ₹999/Month</strong>
                            <div style={{ fontSize: 10, color: '#64748B' }}>0% Commission per restaurant</div>
                          </div>
                          <div style={{ background: '#1E293B', padding: 10, borderRadius: 10, border: '1px solid #334155' }}>
                            <div style={{ fontSize: 11, color: '#94A3B8' }}>Option B: Full Source Code</div>
                            <strong style={{ fontSize: 16, color: '#F59E0B' }}>Lifetime License</strong>
                            <div style={{ fontSize: 10, color: '#64748B' }}>Agencies & Developers ke liye</div>
                          </div>
                        </div>

                        <div style={{ display: 'inline-flex', gap: 12, alignItems: 'center' }}>
                          <a
                            href="https://wa.me/919876543210?text=Hi%20DirectDine%20Software%20Demo"
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              background: '#25D366',
                              color: '#FFF',
                              padding: '10px 20px',
                              borderRadius: 10,
                              fontWeight: 800,
                              fontSize: 14,
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6
                            }}
                          >
                            💬 WhatsApp for Demo: +91 98765 43210
                          </a>
                        </div>
                      </div>
                      <h2 style={{ fontSize: 24, fontWeight: 800, margin: '8px 0', color: '#FFF' }}>
                        {currentScene.hindiHeadline}
                      </h2>
                      <p style={{ fontSize: 14, color: '#94A3B8', maxWidth: 540, margin: '0 auto' }}>
                        {currentScene.hindiSubtext}
                      </p>
                    </div>
                  )}
                </div>

                {/* Real Pure Hindi Subtitle Bar */}
                <div style={{
                  background: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid #334155',
                  padding: '14px 20px',
                  borderRadius: 14,
                  backdropFilter: 'blur(10px)',
                  textAlign: 'center',
                  zIndex: 10
                }}>
                  <div style={{ fontSize: 11, color: '#EF4444', fontWeight: 900, letterSpacing: '0.05em', marginBottom: 4 }}>
                    🗣️ शुद्ध हिंदी वॉयसओवर (Live Hindi Speech):
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#F8FAFC', lineHeight: 1.5 }}>
                    "{currentScene.hindiVoiceover}"
                  </div>
                </div>
              </div>

              {/* Video Timeline Progress */}
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
                  const newTime = Number(((clickX / rect.width) * totalDuration).toFixed(1));
                  setCurrentTime(newTime);
                }}
              >
                <div style={{
                  height: '100%',
                  width: `${(currentTime / totalDuration) * 100}%`,
                  background: 'linear-gradient(90deg, #EF4444, #F59E0B, #10B981)',
                  transition: 'width 0.1s linear'
                }} />
              </div>

              {/* Video Control Bar */}
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
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)'
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
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    🔄 Restart (00:00)
                  </button>

                  <button
                    onClick={() => {
                      const next = !voiceEnabled;
                      setVoiceEnabled(next);
                      if (!next && window.speechSynthesis) window.speechSynthesis.cancel();
                      if (next && isPlaying) speakHindi(currentScene.hindiVoiceover);
                    }}
                    style={{
                      background: voiceEnabled ? '#10B98122' : '#334155',
                      color: voiceEnabled ? '#10B981' : '#94A3B8',
                      border: `1px solid ${voiceEnabled ? '#10B98155' : '#475569'}`,
                      padding: '8px 14px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {voiceEnabled ? '🔊 हिंदी आवाज़: चालू' : '🔇 आवाज़: बंद'}
                  </button>

                  {/* Speech Rate Adjustment */}
                  <select
                    value={speechRate}
                    onChange={(e) => setSpeechRate(Number(e.target.value))}
                    style={{
                      background: '#1E293B',
                      color: '#CBD5E1',
                      border: '1px solid #334155',
                      padding: '7px 10px',
                      borderRadius: 8,
                      fontSize: 12,
                      cursor: 'pointer'
                    }}
                  >
                    <option value={0.9}>0.9x (धीमी आवाज़)</option>
                    <option value={1.0}>1.0x (Normal)</option>
                    <option value={1.15}>1.15x (तेज़ वॉयस)</option>
                  </select>
                </div>

                {/* Record Button */}
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
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        boxShadow: '0 4px 14px rgba(220, 38, 38, 0.4)'
                      }}
                    >
                      ⏺ Record & Download Video File
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
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        animation: 'pulse 1s infinite'
                      }}
                    >
                      ⏹ Stop & Save Video
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar Scene Navigator */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Video Scenes (क्लिक करके चलाएं)
              </div>
              {SCENES.map((scene) => {
                const isActive = currentScene.id === scene.id;
                return (
                  <div
                    key={scene.id}
                    onClick={() => jumpToScene(scene)}
                    style={{
                      background: isActive ? '#1E293B' : '#0F172A',
                      border: `1px solid ${isActive ? '#EF4444' : '#1E293B'}`,
                      borderRadius: 12,
                      padding: 14,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 900,
                        color: isActive ? '#EF4444' : '#64748B'
                      }}>
                        {scene.tag}
                      </span>
                      <span style={{ fontSize: 11, color: '#94A3B8', fontVariantNumeric: 'tabular-nums' }}>
                        {scene.duration}s
                      </span>
                    </div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#F8FAFC', marginBottom: 4 }}>
                      {scene.hindiHeadline}
                    </div>
                    <div style={{ fontSize: 11.5, color: '#94A3B8', lineHeight: 1.4 }}>
                      {scene.appSection}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: DETAILED SCREENSHOTS & FEATURE EXPLAINER */}
        {activeTab === 'screens' && (
          <div style={{ background: '#0F172A', borderRadius: 16, border: '1px solid #1E293B', padding: 28 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px', color: '#FFF' }}>
              एप्लीकेशन के सभी मुख्य फीचर्स & स्क्रीन्स (How Every Screen Works)
            </h2>
            <p style={{ fontSize: 14, color: '#94A3B8', margin: '0 0 24px' }}>
              इस सेक्शन में आपकी एप्लीकेशन की हर एक स्क्रीन का असली वर्कफ़्लो दिया गया है ताकि आप किसी भी क्लाइंट को आसानी से समझा सकें:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
              {/* Screen 1: Customer Storefront */}
              <div style={{ background: '#1E293B', borderRadius: 14, padding: 20, border: '1px solid #334155' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ background: '#10B981', color: '#FFF', fontWeight: 800, fontSize: 11, padding: '3px 8px', borderRadius: 6 }}>
                    SCREEN 1: STOREFRONT
                  </span>
                  <Link href="/spice-garden" target="_blank" style={{ color: '#38BDF8', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                    Open Live (/spice-garden) ↗
                  </Link>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#FFF', margin: '0 0 8px' }}>
                  कस्टमर मोबाइल मेनू & टेबल QR
                </h3>
                <ul style={{ fontSize: 13, color: '#CBD5E1', lineHeight: 1.7, paddingLeft: 18, margin: 0 }}>
                  <li><strong>Instant QR Scan:</strong> बिना कोई ऐप इनस्टॉल किए तुरंत मोबाइल में मेनू खुलता है।</li>
                  <li><strong>Veg / Non-Veg Switcher:</strong> शुद्ध शाकाहारी और नॉनवेज फ़िल्टर 1-टैप में।</li>
                  <li><strong>Portion Sizes:</strong> हाफ / फुल प्लेट और कुकिंग इंस्ट्रक्शन नोट्स।</li>
                  <li><strong>Table Waiter Call:</strong> टेबल 4 से वेटर को 1 क्लिक में बुलाने का बटन।</li>
                </ul>
              </div>

              {/* Screen 2: 1-Tap Checkout */}
              <div style={{ background: '#1E293B', borderRadius: 14, padding: 20, border: '1px solid #334155' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ background: '#8B5CF6', color: '#FFF', fontWeight: 800, fontSize: 11, padding: '3px 8px', borderRadius: 6 }}>
                    SCREEN 2: CHECKOUT
                  </span>
                  <Link href="/spice-garden/cart" target="_blank" style={{ color: '#38BDF8', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                    Open Live (/cart) ↗
                  </Link>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#FFF', margin: '0 0 8px' }}>
                  1-टैप OTP & डायरेक्ट पेमेंट
                </h3>
                <ul style={{ fontSize: 13, color: '#CBD5E1', lineHeight: 1.7, paddingLeft: 18, margin: 0 }}>
                  <li><strong>Instant Demo OTP:</strong> कस्टमर का फोन नंबर डालते ही OTP आ जाता है।</li>
                  <li><strong>Coupons:</strong> WELCOME10 और FLAT50 जैसे कूपन्स तुरंत डिस्काउंट देते हैं।</li>
                  <li><strong>Direct UPI:</strong> PhonePe, GPay, Paytm या COD — पैसा सीधा मर्चेंट के बैंक में।</li>
                  <li><strong>Confetti Animation:</strong> आर्डर होते ही कन्फेटी सेलिब्रेशन।</li>
                </ul>
              </div>

              {/* Screen 3: Kitchen Display System */}
              <div style={{ background: '#1E293B', borderRadius: 14, padding: 20, border: '1px solid #334155' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ background: '#3B82F6', color: '#FFF', fontWeight: 800, fontSize: 11, padding: '3px 8px', borderRadius: 6 }}>
                    SCREEN 3: KITCHEN KDS
                  </span>
                  <Link href="/dashboard" target="_blank" style={{ color: '#38BDF8', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                    Open Live (/dashboard) ↗
                  </Link>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#FFF', margin: '0 0 8px' }}>
                  किचन डैशबोर्ड & रियल-टाइम साउंड अलर्ट
                </h3>
                <ul style={{ fontSize: 13, color: '#CBD5E1', lineHeight: 1.7, paddingLeft: 18, margin: 0 }}>
                  <li><strong>Sound Chime 🔔:</strong> आर्डर आते ही किचन में लाउड घंटी बजती है।</li>
                  <li><strong>Prep Timers:</strong> शेफ 15, 25 या 40 मिनट का टाइमर सेट करके Accept करता है।</li>
                  <li><strong>Thermal KOT Print:</strong> 80mm/58mm किचन प्रिंटर के लिए 1-क्लिक रसीद।</li>
                  <li><strong>86 Out-of-Stock:</strong> जो आइटम खत्म हो जाए उसे 1 सेकंड में ऑफ करें।</li>
                </ul>
              </div>

              {/* Screen 4: Super Admin */}
              <div style={{ background: '#1E293B', borderRadius: 14, padding: 20, border: '1px solid #334155' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ background: '#F59E0B', color: '#000', fontWeight: 800, fontSize: 11, padding: '3px 8px', borderRadius: 6 }}>
                    SCREEN 4: SUPER ADMIN
                  </span>
                  <Link href="/admin" target="_blank" style={{ color: '#38BDF8', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                    Open Live (/admin) ↗
                  </Link>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#FFF', margin: '0 0 8px' }}>
                  रेस्टोरेंट ऑनबोर्डिंग & QR जनरेटर
                </h3>
                <ul style={{ fontSize: 13, color: '#CBD5E1', lineHeight: 1.7, paddingLeft: 18, margin: 0 }}>
                  <li><strong>1-Minute Onboarding:</strong> रेस्टोरेंट का नाम, लोगो और फोन डालते ही सिस्टम रेडी।</li>
                  <li><strong>High-Res Table QR:</strong> टेबल पर चिपकाने के लिए प्रिंट-रेडी क्यूआर कोड।</li>
                  <li><strong>Multi-Tenancy:</strong> एक ही सर्वर पर सैकड़ों रेस्टोरेंट चलाएं।</li>
                  <li><strong>Zero Infrastructure Headache:</strong> पूरा सिस्टम ऑटोमेटेड है।</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PURE HINDI SCRIPT */}
        {activeTab === 'script' && (
          <div style={{ background: '#0F172A', borderRadius: 16, border: '1px solid #1E293B', padding: 28 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px', color: '#FFF' }}>
              🎙️ शुद्ध हिंदी वॉयसओवर स्क्रिप्ट (अगर आप खुद बोलना चाहें)
            </h2>
            <p style={{ fontSize: 14, color: '#94A3B8', margin: '0 0 24px' }}>
              यह स्क्रिप्ट बिल्कुल स्वाभाविक, इंसानी और असरदार हिंदी में लिखी गई है ताकि वीडियो देखते ही रेस्टोरेंट मालिक या खरीदार इम्प्रेस हो जाए:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {SCENES.map((scene, idx) => (
                <div key={scene.id} style={{ background: '#1E293B', borderRadius: 12, padding: 20, borderLeft: `5px solid ${scene.color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontWeight: 800, color: scene.color, fontSize: 14 }}>
                      भाग {idx + 1}: {scene.title} ({scene.duration} सेकंड्स)
                    </span>
                    <button
                      onClick={() => speakHindi(scene.hindiVoiceover)}
                      style={{
                        background: '#334155',
                        color: '#FFF',
                        border: 'none',
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontSize: 11,
                        cursor: 'pointer',
                        fontWeight: 700
                      }}
                    >
                      ▶️ सुनें (Play Voice)
                    </button>
                  </div>

                  <div style={{ background: '#0F172A', padding: 14, borderRadius: 8, fontSize: 14.5, color: '#F1F5F9', lineHeight: 1.6, fontStyle: 'italic' }}>
                    "{scene.hindiVoiceover}"
                  </div>

                  <div style={{ marginTop: 8, fontSize: 12, color: '#94A3B8' }}>
                    <strong>स्क्रीन पर क्या दिखाना है:</strong> {scene.appSection}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: WHATSAPP PITCH */}
        {activeTab === 'pitch' && (
          <div style={{ background: '#0F172A', borderRadius: 16, border: '1px solid #1E293B', padding: 28 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px', color: '#FFF' }}>
              💬 क्लाइंट्स को भेजने के लिए रेडी-मेड व्हाट्सएप पिच
            </h2>
            <p style={{ fontSize: 14, color: '#94A3B8', margin: '0 0 20px' }}>
              इस वीडियो के साथ आप यह मैसेज किसी भी रेस्टोरेंट ओनर या डिजिटल एजेंसी को सीधे भेज सकते हैं:
            </p>

            <div style={{
              background: '#075E54',
              borderRadius: 14,
              padding: 24,
              color: '#FFF',
              fontFamily: 'system-ui, sans-serif',
              fontSize: 14.5,
              lineHeight: 1.8,
              whiteSpace: 'pre-wrap'
            }}>
{`नमस्ते रेस्टोरेंट ओनर / बिज़नेस पार्टनर! 🙏

क्या आप जानते हैं कि स्विगी और ज़ोमैटो आपके रेस्टोरेंट के हर महीने के ऑर्डर्स पर 25% से 30% कमीशन ले जाते हैं?

हमने रेस्टोरेंट्स और कैफ़े के लिए Direct Food Ordering Software बनाया है:
✅ 0% कमीशन — 100% पैसा सीधा आपके बैंक खाते में
✅ टेबल QR कोड और व्हाट्सएप डायरेक्ट ऑनलाइन मेनू
✅ किचन में नया आर्डर आते ही लाउड साउंड बेल अलर्ट
✅ 1-क्लिक में आर्डर एक्सेप्ट और प्रेप टाइमर
✅ कस्टमर के व्हाट्सएप पर तुरंत पक्का बिल और लाइव ट्रैकिंग
✅ कोई डिलीवरी या मार्केटिंग का झंझट नहीं — प्योर प्लग एंड प्ले सॉफ़्टवेयर!

🎥 ऊपर दिया गया 1 मिनट का डेमो वीडियो ज़रूर देखें!

👉 अपने रेस्टोरेंट का लाइव मेनू डेमो देखने के लिए इस नंबर पर 'DEMO' लिखकर रिप्लाई करें।
ऑफर: सिर्फ ₹499/महीना या पूरा सॉफ़्टवेयर लाइफटाइम लाइसेंस!`}
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText(`नमस्ते रेस्टोरेंट ओनर / बिज़नेस पार्टनर! 🙏\n\nक्या आप जानते हैं कि स्विगी और ज़ोमैटो आपके रेस्टोरेंट के हर महीने के ऑर्डर्स पर 25% से 30% कमीशन ले जाते हैं?\n\nहमने रेस्टोरेंट्स और कैफ़े के लिए Direct Food Ordering Software बनाया है:\n✅ 0% कमीशन — 100% पैसा सीधा आपके बैंक खाते में\n✅ टेबल QR कोड और व्हाट्सएप डायरेक्ट ऑनलाइन मेनू\n✅ किचन में नया आर्डर आते ही लाउड साउंड बेल अलर्ट\n✅ 1-क्लिक में आर्डर एक्सेप्ट और प्रेप टाइमर\n✅ कस्टमर के व्हाट्सएप पर तुरंत पक्का बिल और लाइव ट्रैकिंग\n✅ कोई डिलीवरी या मार्केटिंग का झंझट नहीं — प्योर प्लग एंड प्ले सॉफ़्टवेयर!\n\n🎥 ऊपर दिया गया 1 मिनट का डेमो वीडियो ज़रूर देखें!\n\n👉 अपने रेस्टोरेंट का लाइव मेनू डेमो देखने के लिए 'DEMO' लिखकर रिप्लाई करें।`);
                alert('व्हाट्सएप पिच क्लिपबोर्ड पर कॉपी हो गया!');
              }}
              style={{
                marginTop: 16,
                background: '#25D366',
                color: '#FFF',
                border: 'none',
                padding: '12px 24px',
                borderRadius: 8,
                fontWeight: 800,
                fontSize: 14,
                cursor: 'pointer'
              }}
            >
              📋 मैसेज कॉपी करें (Copy WhatsApp Pitch)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
