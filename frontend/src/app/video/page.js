'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// All 6 core screens of the application with real high-resolution imagery and non-stop continuous Hindi narration
const SCREENS = [
  {
    id: 'landing',
    screenNumber: '01 / 06',
    title: 'Landing Page & Multi-Restaurant Hub',
    hindiTag: 'होम पेज & रेस्टोरेंट हब',
    duration: 10,
    startTime: 0,
    voiceover: 'नमस्ते दोस्तों! यह है हमारा कंप्लीट रेस्टोरेंट डायरेक्ट ऑर्डरिंग सॉफ़्टवेयर। सबसे पहले देखिए यह शानदार होमपेज, जहाँ कस्टमर बिरयानी, पिज़्ज़ा, और नॉर्थ इंडियन जैसी कैटेगरीज़ से शहर के बेस्ट रेस्टोरेंट्स खोज सकता है, टेबल से वेटर को बुला सकता है, और शून्य परसेंट कमीशन पर डायरेक्ट आर्डर कर सकता है।',
    accentColor: '#EF4444'
  },
  {
    id: 'menu',
    screenNumber: '02 / 06',
    title: 'Customer Digital Storefront (/spice-garden)',
    hindiTag: 'कस्टमर मेनू & टेबल QR',
    duration: 11,
    startTime: 10,
    voiceover: 'जैसे ही कस्टमर टेबल पर लगे क्यूआर कोड को स्कैन करेगा, बिना किसी ऐप डाउनलोड के तुरंत यह मोबाइल मेनू खुल जाएगा। यहाँ वेज और नॉन-वेज का साफ़ फ़िल्टर है, पसंदीदा डिश जैसे पनीर बटर मसाला या दम बिरयानी को हाफ या फुल प्लेट में चुन सकते हैं, और स्पेशल कुकिंग नोट्स भी लिख सकते हैं।',
    accentColor: '#10B981'
  },
  {
    id: 'checkout',
    screenNumber: '03 / 06',
    title: '1-Tap OTP & Direct UPI Checkout (/cart)',
    hindiTag: '1-टैप चेकआउट & डायरेक्ट UPI',
    duration: 10,
    startTime: 21,
    voiceover: 'अब देखिए इसका सुपर-फास्ट चेकआउट! कस्टमर अपना मोबाइल नंबर डालेगा और तुरंत ऑटो-ओटीपी से लॉगिन हो जाएगा। डिस्काउंट कूपन लगते ही तुरंत छूट मिलेगी, और गूगल-पे, फोनपे, पेटीएम या कैश ऑन डिलीवरी से एक टैप में पेमेंट हो जाएगी — बिना किसी कमीशन कट के सीधा आपके बैंक में!',
    accentColor: '#8B5CF6'
  },
  {
    id: 'kitchen',
    screenNumber: '04 / 06',
    title: 'Live Kitchen Display System (KDS) (/dashboard)',
    hindiTag: 'लाइव किचन डैशबोर्ड & साउंड बेल',
    duration: 12,
    startTime: 31,
    voiceover: 'और यह है रेस्टोरेंट का पावरफुल किचन डैशबोर्ड! नया आर्डर आते ही किचन में लाउड साउंड बेल बजेगी ताकि शेफ कोई आर्डर मिस न करे। शेफ तुरंत पंद्रह या पच्चीस मिनट का टाइमर सेट करके आर्डर एक्सेप्ट करेगा, थर्मल KOT रसीद प्रिंट करेगा, और कोई आइटम खत्म होने पर तुरंत स्टॉक ऑफ कर सकेगा।',
    accentColor: '#3B82F6'
  },
  {
    id: 'tracking',
    screenNumber: '05 / 06',
    title: 'WhatsApp Bot & Live Order Tracking (/track)',
    hindiTag: 'व्हाट्सएप बॉट & लाइव ट्रैकिंग',
    duration: 10,
    startTime: 43,
    voiceover: 'आर्डर होते ही कस्टमर के पर्सनल व्हाट्सएप पर ऑटोमैटिक बिल, डिलीवरी बॉय का नाम, नंबर और लाइव डिलीवरी ट्रैकिंग लिंक पहुंच जाएगा। कस्टमर घर बैठे या टेबल पर अपने आर्डर की पल-पल की लाइव स्थिति देख सकता है।',
    accentColor: '#16A34A'
  },
  {
    id: 'admin',
    screenNumber: '06 / 06',
    title: 'Super Admin & Instant QR Standee Engine (/admin)',
    hindiTag: 'सुपर एडमिन & टेबल QR जनरेटर',
    duration: 11,
    startTime: 53,
    voiceover: 'आखिर में देखिए सुपर एडमिन पैनल! यहाँ से आप सिर्फ एक मिनट में नया रेस्टोरेंट जोड़ सकते हैं और हाई-क्वालिटी प्रिंट-रेडी टेबल क्यूआर कोड डाउनलोड कर सकते हैं। तो चाहे अपने रेस्टोरेंट के लिए मंथली प्लान लेना हो, या पूरा सोर्स कोड अपनी एजेंसी के लिए — आज ही संपर्क करें और लाइव डेमो देखें!',
    accentColor: '#F59E0B'
  }
];

export default function NonStopVideoStudio() {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [speechRate, setSpeechRate] = useState(1.1); // Fast, energetic, non-stop cadence
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [recording, setRecording] = useState(false);
  const [aspectRatio, setAspectRatio] = useState('16:9'); // '16:9' or '9:16'
  const [activeTab, setActiveTab] = useState('video'); // 'video', 'all_screens', 'script'

  const timerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  const totalDuration = 64; // 64 seconds of continuous, non-stop banger presentation

  // Find active screen based on currentTime
  const activeIndex = SCREENS.findIndex(
    (s, idx) => currentTime >= s.startTime && (idx === SCREENS.length - 1 || currentTime < SCREENS[idx + 1].startTime)
  );
  const currentScreen = SCREENS[activeIndex] || SCREENS[0];

  // Initialize Indian / Hindi Voice Detection
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        const hiVoice = voices.find(
          v => v.lang === 'hi-IN' || v.lang === 'hi_IN' || v.name.toLowerCase().includes('hindi')
        );
        const inVoice = voices.find(
          v => v.lang.includes('IN') || v.name.toLowerCase().includes('india')
        );
        setSelectedVoice(hiVoice || inVoice || voices[0] || null);
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
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
      osc.frequency.setValueAtTime(850, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1250, ctx.currentTime + 0.1);
      osc.frequency.exponentialRampToValueAtTime(850, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
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
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch {
      // Audio autoplay policy
    }
  };

  // Immediate Non-Stop Speech Execution
  const speakImmediate = (text) => {
    if (!voiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel(); // kill any stale queue instantly

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'hi-IN';
    utterance.rate = speechRate;
    utterance.pitch = 1.05;

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    window.speechSynthesis.speak(utterance);
  };

  // Trigger voice & sound without delay whenever scene changes
  useEffect(() => {
    if (isPlaying) {
      speakImmediate(currentScreen.voiceover);

      if (currentScreen.id === 'kitchen') {
        setTimeout(playKitchenBell, 300);
      }
      if (currentScreen.id === 'checkout') {
        setTimeout(playUPIChime, 600);
      }
    }
  }, [activeIndex, isPlaying]);

  // Non-stop timer loop
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
      const next = !isPlaying;
      setIsPlaying(next);
      if (!next && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    }
  };

  const handleRestart = () => {
    setCurrentTime(0);
    setIsPlaying(true);
  };

  const jumpToScreen = (screen) => {
    setCurrentTime(screen.startTime);
    if (!isPlaying) {
      setIsPlaying(true);
    }
  };

  // Screen Recording for instant video export
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
        a.download = `DirectDine-Continuous-Video-${Date.now()}.webm`;
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
    <div style={{ minHeight: '100vh', background: '#090D16', color: '#F1F5F9', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Top Banner */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
        borderBottom: '1px solid #1E293B',
        background: 'rgba(9, 13, 22, 0.95)',
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            background: 'linear-gradient(135deg, #EF4444, #B91C1C)',
            width: 38,
            height: 38,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)'
          }}>
            ⚡
          </div>
          <div>
            <h1 style={{ fontSize: 17, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              DirectDine <span style={{ background: '#10B981', color: '#000', fontSize: 11, padding: '2px 8px', borderRadius: 4, fontWeight: 900 }}>NON-STOP VIDEO DEMO</span>
            </h1>
            <p style={{ margin: 0, fontSize: 11.5, color: '#94A3B8' }}>
              कंटीन्यूअस हिंदी वॉयसओवर • रियल स्क्रीन्स • जीरो पॉज़
            </p>
          </div>
        </div>

        {/* View Options & Recording */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', background: '#1E293B', borderRadius: 8, padding: 3 }}>
            <button
              onClick={() => setAspectRatio('16:9')}
              style={{
                background: aspectRatio === '16:9' ? '#3B82F6' : 'transparent',
                color: '#FFF',
                border: 'none',
                padding: '5px 12px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              🖥️ 16:9 Wide
            </button>
            <button
              onClick={() => setAspectRatio('9:16')}
              style={{
                background: aspectRatio === '9:16' ? '#3B82F6' : 'transparent',
                color: '#FFF',
                border: 'none',
                padding: '5px 12px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              📱 9:16 Reel
            </button>
          </div>

          <Link
            href="/"
            style={{
              background: '#1E293B',
              color: '#CBD5E1',
              padding: '6px 14px',
              borderRadius: 8,
              fontSize: 12.5,
              textDecoration: 'none',
              fontWeight: 600,
              border: '1px solid #334155'
            }}
          >
            ← Back to App
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '20px 20px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 18, borderBottom: '1px solid #1E293B', paddingBottom: 12 }}>
          <button
            onClick={() => setActiveTab('video')}
            style={{
              background: activeTab === 'video' ? '#EF4444' : '#1E293B',
              color: '#FFF',
              border: 'none',
              padding: '9px 18px',
              borderRadius: 8,
              fontSize: 13.5,
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            ▶️ Continuous Live Video
          </button>
          <button
            onClick={() => setActiveTab('all_screens')}
            style={{
              background: activeTab === 'all_screens' ? '#EF4444' : '#1E293B',
              color: '#FFF',
              border: 'none',
              padding: '9px 18px',
              borderRadius: 8,
              fontSize: 13.5,
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            🖼️ View All 6 Full Application Screens
          </button>
          <button
            onClick={() => setActiveTab('script')}
            style={{
              background: activeTab === 'script' ? '#EF4444' : '#1E293B',
              color: '#FFF',
              border: 'none',
              padding: '9px 18px',
              borderRadius: 8,
              fontSize: 13.5,
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            🎙️ Continuous Hindi Voiceover Text
          </button>
        </div>

        {/* TAB 1: CONTINUOUS VIDEO STAGE */}
        {activeTab === 'video' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: aspectRatio === '16:9' ? '1fr 340px' : '520px 1fr',
            gap: 20,
            alignItems: 'start'
          }}>
            {/* The Video Display Frame */}
            <div style={{
              background: '#020617',
              borderRadius: 20,
              border: '2px solid #1E293B',
              overflow: 'hidden',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9)',
              position: 'relative'
            }}>
              {/* Browser Header Bar */}
              <div style={{
                background: '#0B1120',
                padding: '12px 18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #1E293B'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#EF4444' }} />
                  <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#F59E0B' }} />
                  <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#10B981' }} />
                  <span style={{ fontSize: 12, color: '#94A3B8', marginLeft: 8, fontWeight: 700 }}>
                    {currentScreen.title}
                  </span>
                </div>

                <div style={{
                  background: currentScreen.accentColor + '22',
                  color: currentScreen.accentColor,
                  border: `1px solid ${currentScreen.accentColor}55`,
                  padding: '3px 12px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 900
                }}>
                  {currentScreen.screenNumber} • {currentScreen.hindiTag}
                </div>
              </div>

              {/* Dynamic Video Stage (Seamless High-Fidelity App UI Render) */}
              <div style={{
                minHeight: aspectRatio === '16:9' ? 560 : 700,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: 24,
                background: 'radial-gradient(ellipse at 50% 0%, #171B33 0%, #030712 90%)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Live Screen Header HUD */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
                  <div style={{
                    background: currentScreen.accentColor,
                    color: '#FFF',
                    fontWeight: 900,
                    fontSize: 12,
                    padding: '4px 12px',
                    borderRadius: 6,
                    letterSpacing: '0.04em'
                  }}>
                    {currentScreen.hindiTag}
                  </div>

                  <div style={{
                    background: 'rgba(15, 23, 42, 0.85)',
                    padding: '4px 12px',
                    borderRadius: 20,
                    border: '1px solid #334155',
                    fontSize: 13,
                    fontWeight: 900,
                    fontVariantNumeric: 'tabular-nums',
                    color: '#F8FAFC'
                  }}>
                    ⏱️ 00:{currentTime < 10 ? `0${Math.floor(currentTime)}` : Math.floor(currentTime)} / 01:{totalDuration}
                  </div>
                </div>

                {/* THE ACTUAL APPLICATION SCREEN DISPLAY (Full High-Fidelity UI) */}
                <div style={{ margin: 'auto 0', zIndex: 10, padding: '12px 0' }}>
                  {/* SCREEN 1: LANDING PAGE */}
                  {currentScreen.id === 'landing' && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        maxWidth: 620,
                        margin: '0 auto 12px',
                        background: '#FFFFFF',
                        color: '#111827',
                        borderRadius: 20,
                        padding: 20,
                        boxShadow: '0 20px 40px rgba(0,0,0,0.7)',
                        textAlign: 'left'
                      }}>
                        {/* Top Nav */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E5E7EB', paddingBottom: 10, marginBottom: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 20 }}>🍽️</span>
                            <strong style={{ fontSize: 16, color: '#E23744' }}>DirectDine</strong>
                            <span style={{ fontSize: 11, background: '#FEECEE', color: '#E23744', padding: '2px 6px', borderRadius: 4, fontWeight: 800 }}>0% Commission</span>
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <span style={{ background: '#F3F4F6', fontSize: 11, padding: '4px 8px', borderRadius: 6, fontWeight: 700 }}>📍 Bandra West, Mumbai</span>
                            <span style={{ background: '#10B981', color: '#FFF', fontSize: 11, padding: '4px 8px', borderRadius: 6, fontWeight: 800 }}>🛎️ Call Waiter</span>
                          </div>
                        </div>

                        {/* Cravings Chips */}
                        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 12 }}>
                          {['🍲 Biryani', '🥘 North Indian', '🍕 Pizza', '🍱 Thali', '🥟 Momos'].map((c, i) => (
                            <span key={i} style={{ background: i === 0 ? '#E23744' : '#F1F5F9', color: i === 0 ? '#FFF' : '#334155', padding: '4px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 700, whiteSpace: 'nowrap' }}>
                              {c}
                            </span>
                          ))}
                        </div>

                        {/* Restaurant Cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                          <div style={{ border: '1px solid #E2E8F0', borderRadius: 12, padding: 10, background: '#FAFAFA' }}>
                            <div style={{ height: 80, borderRadius: 8, background: 'url(https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80) center/cover', marginBottom: 6 }} />
                            <strong style={{ fontSize: 13, color: '#0F172A' }}>🌿 Spice Garden</strong>
                            <div style={{ fontSize: 11, color: '#64748B' }}>North Indian • ★ 4.8 (500+)</div>
                            <div style={{ fontSize: 11, color: '#16A34A', fontWeight: 800, marginTop: 2 }}>⚡ Table QR & Delivery Active</div>
                          </div>
                          <div style={{ border: '1px solid #E2E8F0', borderRadius: 12, padding: 10, background: '#FAFAFA' }}>
                            <div style={{ height: 80, borderRadius: 8, background: 'url(https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&q=80) center/cover', marginBottom: 6 }} />
                            <strong style={{ fontSize: 13, color: '#0F172A' }}>☕ Chai & Bites</strong>
                            <div style={{ fontSize: 11, color: '#64748B' }}>Cafe & Snacks • ★ 4.7 (320+)</div>
                            <div style={{ fontSize: 11, color: '#16A34A', fontWeight: 800, marginTop: 2 }}>⚡ Table QR & Delivery Active</div>
                          </div>
                        </div>
                      </div>
                      <h2 style={{ fontSize: 23, fontWeight: 800, margin: '6px 0', color: '#FFF' }}>
                        डायरेक्ट फूड ऑर्डरिंग हब — 0% कमीशन पर
                      </h2>
                    </div>
                  )}

                  {/* SCREEN 2: CUSTOMER STOREFRONT */}
                  {currentScreen.id === 'menu' && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        maxWidth: 400,
                        margin: '0 auto 12px',
                        background: '#FFFFFF',
                        color: '#111827',
                        borderRadius: 24,
                        padding: 16,
                        boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
                        textAlign: 'left'
                      }}>
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                          <div>
                            <strong style={{ fontSize: 16, color: '#0F172A' }}>🌿 Spice Garden</strong>
                            <div style={{ fontSize: 11, color: '#64748B' }}>Table #4 Dine-In • ⏱️ 20-25 Mins</div>
                          </div>
                          <span style={{ background: '#DCFCE7', color: '#15803D', fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 6 }}>
                            0% Extra Fee
                          </span>
                        </div>

                        {/* Food Item with Real Photo */}
                        <div style={{ display: 'flex', gap: 10, background: '#F8FAFC', padding: 10, borderRadius: 14, border: '1px solid #E2E8F0', marginBottom: 8, alignItems: 'center' }}>
                          <div style={{ width: 68, height: 68, borderRadius: 10, background: 'url(https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&q=80) center/cover', flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16A34A' }} />
                              <strong style={{ fontSize: 13, color: '#0F172A' }}>Paneer Butter Masala</strong>
                            </div>
                            <div style={{ fontSize: 11, color: '#64748B' }}>Rich buttery cashew gravy</div>
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#E23744', marginTop: 2 }}>₹280</div>
                          </div>
                          <button style={{ background: '#E23744', color: '#FFF', border: 'none', padding: '6px 12px', borderRadius: 8, fontWeight: 800, fontSize: 12 }}>
                            Add +
                          </button>
                        </div>

                        {/* Food Item 2 */}
                        <div style={{ display: 'flex', gap: 10, background: '#F8FAFC', padding: 10, borderRadius: 14, border: '1px solid #E2E8F0', alignItems: 'center' }}>
                          <div style={{ width: 68, height: 68, borderRadius: 10, background: 'url(https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80) center/cover', flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#DC2626' }} />
                              <strong style={{ fontSize: 13, color: '#0F172A' }}>Dum Biryani</strong>
                            </div>
                            <div style={{ fontSize: 11, color: '#64748B' }}>Slow cooked fragrant basmati</div>
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#E23744', marginTop: 2 }}>₹340</div>
                          </div>
                          <button style={{ background: '#E23744', color: '#FFF', border: 'none', padding: '6px 12px', borderRadius: 8, fontWeight: 800, fontSize: 12 }}>
                            Add +
                          </button>
                        </div>

                        {/* View Cart Bar */}
                        <div style={{ background: '#10B981', color: '#FFF', padding: '10px 14px', borderRadius: 12, textAlign: 'center', fontWeight: 800, fontSize: 13, marginTop: 12 }}>
                          🛒 1 Item Added • View Cart (₹280) ➔
                        </div>
                      </div>
                      <h2 style={{ fontSize: 23, fontWeight: 800, margin: '6px 0', color: '#FFF' }}>
                        10-सेकंड QR कोड मेनू — बिना ऐप डाउनलोड किए
                      </h2>
                    </div>
                  )}

                  {/* SCREEN 3: 1-TAP CHECKOUT */}
                  {currentScreen.id === 'checkout' && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        maxWidth: 400,
                        margin: '0 auto 12px',
                        background: '#FFFFFF',
                        color: '#111827',
                        borderRadius: 24,
                        padding: 16,
                        boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
                        textAlign: 'left'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E5E7EB', paddingBottom: 8, marginBottom: 10 }}>
                          <strong style={{ fontSize: 14 }}>🛒 Order Checkout</strong>
                          <span style={{ fontSize: 11, background: '#DCFCE7', color: '#15803D', fontWeight: 800, padding: '2px 8px', borderRadius: 4 }}>
                            Coupon: FLAT50 Applied
                          </span>
                        </div>

                        <div style={{ fontSize: 12, color: '#4B5563', marginBottom: 8 }}>
                          1x Paneer Butter Masala (₹280) + 2x Garlic Naan (₹90)
                        </div>

                        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 10, borderRadius: 10, marginBottom: 10 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                            <span>Subtotal:</span>
                            <strong>₹370</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#16A34A', fontWeight: 800 }}>
                            <span>Instant Discount:</span>
                            <span>-₹50</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 900, marginTop: 4, borderTop: '1px dashed #D1D5DB', paddingTop: 6, color: '#E23744' }}>
                            <span>Total Payable:</span>
                            <span>₹320</span>
                          </div>
                        </div>

                        {/* Phone & Auto OTP */}
                        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: 8, borderRadius: 8, fontSize: 11, color: '#1E40AF', marginBottom: 10 }}>
                          📱 Verified: <strong>+91 98765 43210</strong> (Auto OTP: 123456)
                        </div>

                        {/* 1-Tap UPI */}
                        <button style={{
                          width: '100%',
                          background: 'linear-gradient(135deg, #10B981, #059669)',
                          color: '#FFF',
                          border: 'none',
                          padding: '12px',
                          borderRadius: 12,
                          fontWeight: 900,
                          fontSize: 14,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
                        }}>
                          ⚡ Pay via UPI (PhonePe / GPay / Paytm)
                        </button>
                      </div>
                      <h2 style={{ fontSize: 23, fontWeight: 800, margin: '6px 0', color: '#FFF' }}>
                        1-टैप OTP लॉगिन & डायरेक्ट UPI सेटलमेंट
                      </h2>
                    </div>
                  )}

                  {/* SCREEN 4: KITCHEN DISPLAY SYSTEM */}
                  {currentScreen.id === 'kitchen' && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        maxWidth: 540,
                        margin: '0 auto 12px',
                        background: '#0F172A',
                        borderRadius: 20,
                        border: '2px solid #3B82F6',
                        padding: 18,
                        textAlign: 'left',
                        boxShadow: '0 20px 45px rgba(59, 130, 246, 0.4)'
                      }}>
                        {/* Ringing Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 24, animation: 'bounce 0.8s infinite' }}>🔔</span>
                            <div>
                              <strong style={{ fontSize: 15, color: '#38BDF8' }}>LIVE KITCHEN DASHBOARD</strong>
                              <div style={{ fontSize: 11, color: '#94A3B8' }}>Instant Ringing Audio Alert Active</div>
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
                        <div style={{ background: '#1E293B', padding: 12, borderRadius: 12, marginBottom: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 13, color: '#F8FAFC' }}>
                            <span>Table #4 • Rahul S.</span>
                            <span style={{ color: '#10B981' }}>₹320 (PAID UPI)</span>
                          </div>
                          <div style={{ fontSize: 12, color: '#CBD5E1', marginTop: 4 }}>
                            • 1x Paneer Butter Masala (Full Plate)<br />
                            • 2x Garlic Naan (Butter Crispy)
                          </div>
                          <div style={{ fontSize: 11, color: '#F59E0B', marginTop: 4, fontWeight: 700 }}>
                            📝 Chef Note: "Make it spicy, add extra chutney"
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button style={{ flex: 1, background: '#10B981', color: '#FFF', border: 'none', padding: '10px', borderRadius: 8, fontWeight: 800, fontSize: 13 }}>
                            ✓ Accept (25 Mins)
                          </button>
                          <button style={{ background: '#334155', color: '#E2E8F0', border: 'none', padding: '10px 14px', borderRadius: 8, fontWeight: 700, fontSize: 13 }}>
                            🖨️ Thermal KOT
                          </button>
                          <button style={{ background: '#7F1D1D', color: '#FCA5A5', border: 'none', padding: '10px 12px', borderRadius: 8, fontWeight: 700, fontSize: 12 }}>
                            86 Item Off
                          </button>
                        </div>
                      </div>
                      <h2 style={{ fontSize: 23, fontWeight: 800, margin: '6px 0', color: '#FFF' }}>
                        साउंड अलार्म के साथ लाइव किचन डिस्प्ले & प्रेप टाइमर
                      </h2>
                    </div>
                  )}

                  {/* SCREEN 5: WHATSAPP BOT & TRACKING */}
                  {currentScreen.id === 'tracking' && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        maxWidth: 440,
                        margin: '0 auto 12px',
                        background: '#0B141A',
                        borderRadius: 20,
                        padding: 16,
                        border: '1px solid #1F2C34',
                        textAlign: 'left',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.8)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #1F2C34', paddingBottom: 8, marginBottom: 10 }}>
                          <span style={{ fontSize: 22 }}>💬</span>
                          <div>
                            <strong style={{ color: '#E9EDEF', fontSize: 14 }}>Spice Garden WhatsApp Bot</strong>
                            <div style={{ fontSize: 11, color: '#00A884' }}>● Automated Order Status Engine</div>
                          </div>
                        </div>

                        {/* Message Bubble */}
                        <div style={{ background: '#005C4B', color: '#E9EDEF', padding: 12, borderRadius: '0 12px 12px 12px', fontSize: 12.5, lineHeight: 1.6, marginBottom: 10 }}>
                          <strong>Order Confirmed! 🍛🎉</strong><br />
                          Hi Rahul, your delicious meal is being prepared!<br />
                          ⏱️ <strong>Ready in:</strong> 25 minutes<br />
                          🛵 <strong>Rider:</strong> Ramesh Kumar (+91 9876543210)<br />
                          🔗 <span style={{ color: '#53BDEB', textDecoration: 'underline' }}>Track Order: directdine.in/track/ord_1042</span>
                        </div>

                        {/* Tracking Bar */}
                        <div style={{ background: '#1F2C34', padding: 10, borderRadius: 10, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                          <span style={{ color: '#00A884', fontWeight: 800 }}>✓ Kitchen Preparing</span>
                          <span style={{ color: '#94A3B8' }}>➔ Out for Delivery</span>
                          <span style={{ color: '#94A3B8' }}>➔ Delivered</span>
                        </div>
                      </div>
                      <h2 style={{ fontSize: 23, fontWeight: 800, margin: '6px 0', color: '#FFF' }}>
                        कस्टमर के WhatsApp पर ऑटोमैटिक बिल & लाइव ट्रैकिंग
                      </h2>
                    </div>
                  )}

                  {/* SCREEN 6: SUPER ADMIN & OFFER */}
                  {currentScreen.id === 'admin' && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        maxWidth: 520,
                        margin: '0 auto 12px',
                        background: 'linear-gradient(135deg, #1E1B4B, #0F172A)',
                        borderRadius: 20,
                        border: '2px solid #F59E0B',
                        padding: 20,
                        boxShadow: '0 20px 40px rgba(245, 158, 11, 0.3)'
                      }}>
                        <div style={{ display: 'inline-block', background: '#F59E0B', color: '#000', fontWeight: 900, fontSize: 11, padding: '3px 10px', borderRadius: 20, marginBottom: 8 }}>
                          👑 SUPER ADMIN & FULL SAAS SOURCE CODE
                        </div>
                        <h3 style={{ fontSize: 20, fontWeight: 900, color: '#FFF', margin: '4px 0 10px' }}>
                          इस पूरे सॉफ़्टवेयर को अभी खरीदें!
                        </h3>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, textAlign: 'left', marginBottom: 14 }}>
                          <div style={{ background: '#1E293B', padding: 10, borderRadius: 10, border: '1px solid #334155' }}>
                            <div style={{ fontSize: 11, color: '#94A3B8' }}>Option 1: Monthly SaaS</div>
                            <strong style={{ fontSize: 16, color: '#10B981' }}>₹499 - ₹999/mo</strong>
                            <div style={{ fontSize: 10, color: '#64748B' }}>Per Restaurant License</div>
                          </div>
                          <div style={{ background: '#1E293B', padding: 10, borderRadius: 10, border: '1px solid #334155' }}>
                            <div style={{ fontSize: 11, color: '#94A3B8' }}>Option 2: Full Source Code</div>
                            <strong style={{ fontSize: 16, color: '#F59E0B' }}>Lifetime License</strong>
                            <div style={{ fontSize: 10, color: '#64748B' }}>Agencies & Developers</div>
                          </div>
                        </div>

                        <div style={{ display: 'inline-flex', gap: 10, alignItems: 'center' }}>
                          <a
                            href="https://wa.me/919876543210?text=Hello%20DirectDine%20Live%20Demo"
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              background: '#25D366',
                              color: '#FFF',
                              padding: '10px 20px',
                              borderRadius: 10,
                              fontWeight: 900,
                              fontSize: 14,
                              textDecoration: 'none'
                            }}
                          >
                            💬 WhatsApp for Live Demo: +91 98765 43210
                          </a>
                        </div>
                      </div>
                      <h2 style={{ fontSize: 23, fontWeight: 800, margin: '6px 0', color: '#FFF' }}>
                        1-मिनट में नया रेस्टोरेंट ऑनबोर्ड करें & टेबल QR बनाएं
                      </h2>
                    </div>
                  )}
                </div>

                {/* Subtitle / Voiceover Captions */}
                <div style={{
                  background: 'rgba(15, 23, 42, 0.95)',
                  border: '1px solid #334155',
                  padding: '12px 18px',
                  borderRadius: 12,
                  backdropFilter: 'blur(8px)',
                  textAlign: 'center',
                  zIndex: 10
                }}>
                  <div style={{ fontSize: 11, color: currentScreen.accentColor, fontWeight: 900, marginBottom: 3 }}>
                    🗣️ नॉन-स्टॉप हिंदी वॉयसओवर:
                  </div>
                  <div style={{ fontSize: 14.5, fontWeight: 600, color: '#F8FAFC', lineHeight: 1.45 }}>
                    "{currentScreen.voiceover}"
                  </div>
                </div>
              </div>

              {/* Seamless Timeline Bar */}
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

              {/* Video Bottom Toolbar */}
              <div style={{
                background: '#0B1120',
                padding: '12px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 10
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    onClick={handlePlayPause}
                    style={{
                      background: isPlaying ? '#E2E8F0' : '#EF4444',
                      color: isPlaying ? '#0F172A' : '#FFF',
                      border: 'none',
                      width: 42,
                      height: 42,
                      borderRadius: '50%',
                      fontSize: 18,
                      fontWeight: 900,
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
                      padding: '7px 12px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    🔄 Restart
                  </button>

                  <button
                    onClick={() => {
                      const next = !voiceEnabled;
                      setVoiceEnabled(next);
                      if (!next && window.speechSynthesis) window.speechSynthesis.cancel();
                      if (next && isPlaying) speakImmediate(currentScreen.voiceover);
                    }}
                    style={{
                      background: voiceEnabled ? '#10B98122' : '#334155',
                      color: voiceEnabled ? '#10B981' : '#94A3B8',
                      border: `1px solid ${voiceEnabled ? '#10B98155' : '#475569'}`,
                      padding: '7px 12px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {voiceEnabled ? '🔊 हिंदी आवाज़: चालू' : '🔇 आवाज़: बंद'}
                  </button>

                  {/* Non-stop High Speed */}
                  <select
                    value={speechRate}
                    onChange={(e) => setSpeechRate(Number(e.target.value))}
                    style={{
                      background: '#1E293B',
                      color: '#CBD5E1',
                      border: '1px solid #334155',
                      padding: '6px 10px',
                      borderRadius: 8,
                      fontSize: 12,
                      cursor: 'pointer'
                    }}
                  >
                    <option value={1.0}>1.0x (Normal)</option>
                    <option value={1.15}>1.15x (Fast & Energetic)</option>
                    <option value={1.25}>1.25x (Super Fast)</option>
                  </select>
                </div>

                {/* Direct Video File Recording */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {!recording ? (
                    <button
                      onClick={startRecording}
                      style={{
                        background: '#DC2626',
                        color: '#FFF',
                        border: 'none',
                        padding: '9px 16px',
                        borderRadius: 8,
                        fontSize: 12.5,
                        fontWeight: 900,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
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
                        padding: '9px 16px',
                        borderRadius: 8,
                        fontSize: 12.5,
                        fontWeight: 900,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        animation: 'pulse 1s infinite'
                      }}
                    >
                      ⏹ Stop & Save Video
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar Screen Jump List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Application Screens (Click to view)
              </div>
              {SCREENS.map((screen) => {
                const isActive = currentScreen.id === screen.id;
                return (
                  <div
                    key={screen.id}
                    onClick={() => jumpToScreen(screen)}
                    style={{
                      background: isActive ? '#1E293B' : '#0B1120',
                      border: `1px solid ${isActive ? screen.accentColor : '#1E293B'}`,
                      borderRadius: 12,
                      padding: 12,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 900,
                        color: isActive ? screen.accentColor : '#64748B'
                      }}>
                        {screen.screenNumber} • {screen.hindiTag}
                      </span>
                      <span style={{ fontSize: 11, color: '#94A3B8', fontVariantNumeric: 'tabular-nums' }}>
                        {screen.duration}s
                      </span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC' }}>
                      {screen.title}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: VIEW ALL 6 FULL APPLICATION SCREENS (SIDE BY SIDE) */}
        {activeTab === 'all_screens' && (
          <div style={{ background: '#0F172A', borderRadius: 16, border: '1px solid #1E293B', padding: 24 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px', color: '#FFF' }}>
              एप्लीकेशन के सभी 6 मुख्य स्क्रीन्स (Complete Visual Walkthrough)
            </h2>
            <p style={{ fontSize: 14, color: '#94A3B8', margin: '0 0 24px' }}>
              आपकी एप्लीकेशन का हर एक पार्ट असली डेटा और फीचर्स के साथ यहाँ लाइव है:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 20 }}>
              {/* Screen 1 */}
              <div style={{ background: '#1E293B', borderRadius: 14, padding: 18, border: '1px solid #334155' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ background: '#EF4444', color: '#FFF', fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 4 }}>01. HOMEPAGE</span>
                  <Link href="/" target="_blank" style={{ color: '#38BDF8', fontSize: 12, fontWeight: 700 }}>Open Live ↗</Link>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#FFF', margin: '4px 0 8px' }}>DirectDine Multi-Storefront Hub</h3>
                <p style={{ fontSize: 13, color: '#CBD5E1', lineHeight: 1.6, margin: 0 }}>
                  कस्टमर्स के लिए शहर के टॉप रेस्टोरेंट्स (Spice Garden, Chai & Bites), बिरयानी, पिज़्ज़ा, मोमोज़ फ़िल्टर और टेबल से वेटर बुलाने का फीचर।
                </p>
              </div>

              {/* Screen 2 */}
              <div style={{ background: '#1E293B', borderRadius: 14, padding: 18, border: '1px solid #334155' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ background: '#10B981', color: '#000', fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 4 }}>02. STOREFRONT</span>
                  <Link href="/spice-garden" target="_blank" style={{ color: '#38BDF8', fontSize: 12, fontWeight: 700 }}>Open Live ↗</Link>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#FFF', margin: '4px 0 8px' }}>Customer Mobile QR Menu (/spice-garden)</h3>
                <p style={{ fontSize: 13, color: '#CBD5E1', lineHeight: 1.6, margin: 0 }}>
                  पनीर बटर मसाला (₹280), दम बिरयानी (₹340), शुद्ध शाकाहारी फ़िल्टर, हाफ/फुल पोर्शन और 1-क्लिक कार्ट एड।
                </p>
              </div>

              {/* Screen 3 */}
              <div style={{ background: '#1E293B', borderRadius: 14, padding: 18, border: '1px solid #334155' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ background: '#8B5CF6', color: '#FFF', fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 4 }}>03. CHECKOUT</span>
                  <Link href="/spice-garden/cart" target="_blank" style={{ color: '#38BDF8', fontSize: 12, fontWeight: 700 }}>Open Live ↗</Link>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#FFF', margin: '4px 0 8px' }}>1-Tap OTP & UPI Payment (/cart)</h3>
                <p style={{ fontSize: 13, color: '#CBD5E1', lineHeight: 1.6, margin: 0 }}>
                  FLAT50 डिस्काउंट कूपन, डेमो ऑटो-ओटीपी 123456, और GPay/PhonePe/Paytm डायरेक्ट यूपीआई पेमेंट बिना किसी 30% कमीशन कट के।
                </p>
              </div>

              {/* Screen 4 */}
              <div style={{ background: '#1E293B', borderRadius: 14, padding: 18, border: '1px solid #334155' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ background: '#3B82F6', color: '#FFF', fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 4 }}>04. KITCHEN KDS</span>
                  <Link href="/dashboard" target="_blank" style={{ color: '#38BDF8', fontSize: 12, fontWeight: 700 }}>Open Live ↗</Link>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#FFF', margin: '4px 0 8px' }}>Kitchen Operations & Sound Bell (/dashboard)</h3>
                <p style={{ fontSize: 13, color: '#CBD5E1', lineHeight: 1.6, margin: 0 }}>
                  आर्डर आते ही लाउड साउंड बेल, 15m/25m/40m प्रेप टाइमर के साथ Accept, थर्मल KOT प्रिंट और 86 आउट-ऑफ-स्टॉक टॉगल।
                </p>
              </div>

              {/* Screen 5 */}
              <div style={{ background: '#1E293B', borderRadius: 14, padding: 18, border: '1px solid #334155' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ background: '#16A34A', color: '#FFF', fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 4 }}>05. WHATSAPP</span>
                  <Link href="/track/demo" target="_blank" style={{ color: '#38BDF8', fontSize: 12, fontWeight: 700 }}>Open Live ↗</Link>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#FFF', margin: '4px 0 8px' }}>Automated WhatsApp Bot & Live Tracking</h3>
                <p style={{ fontSize: 13, color: '#CBD5E1', lineHeight: 1.6, margin: 0 }}>
                  कस्टमर को व्हाट्सएप पर डिजिटल रसीद, डिलीवरी बॉय का नाम, नंबर और लाइव डिलीवरी ट्रैकिंग लिंक (Kitchen ➔ Delivery ➔ Delivered)।
                </p>
              </div>

              {/* Screen 6 */}
              <div style={{ background: '#1E293B', borderRadius: 14, padding: 18, border: '1px solid #334155' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ background: '#F59E0B', color: '#000', fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 4 }}>06. SUPER ADMIN</span>
                  <Link href="/admin" target="_blank" style={{ color: '#38BDF8', fontSize: 12, fontWeight: 700 }}>Open Live ↗</Link>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#FFF', margin: '4px 0 8px' }}>Restaurant Onboarding & QR Generator (/admin)</h3>
                <p style={{ fontSize: 13, color: '#CBD5E1', lineHeight: 1.6, margin: 0 }}>
                  1-मिनट में नया रेस्टोरेंट बनाएं, टेबल QR कोड स्टैंडी डाउनलोड करें और मंथली SaaS या लाइफटाइम सोर्स कोड लाइसेंस बेचें।
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: NON-STOP PURE HINDI SCRIPT */}
        {activeTab === 'script' && (
          <div style={{ background: '#0F172A', borderRadius: 16, border: '1px solid #1E293B', padding: 24 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px', color: '#FFF' }}>
              🎙️ पूरा नॉन-स्टॉप हिंदी वॉयसओवर (बिना किसी रुकावट के)
            </h2>
            <p style={{ fontSize: 14, color: '#94A3B8', margin: '0 0 20px' }}>
              यह पूरा पैराग्राफ लगातार एक सांस में बोलने के लिए तैयार किया गया है, ताकि वीडियो में कोई भी अजीब सन्नाटा (pause) न रहे:
            </p>

            <div style={{
              background: '#1E293B',
              borderRadius: 14,
              padding: 24,
              fontSize: 16,
              lineHeight: 1.8,
              color: '#F8FAFC',
              borderLeft: '5px solid #EF4444'
            }}>
              "नमस्ते दोस्तों! यह है हमारा कंप्लीट रेस्टोरेंट डायरेक्ट ऑर्डरिंग सॉफ़्टवेयर। 
              सबसे पहले देखिए यह शानदार होमपेज, जहाँ कस्टमर शहर के बेस्ट रेस्टोरेंट्स खोज सकता है, टेबल से वेटर को बुला सकता है, और शून्य परसेंट कमीशन पर डायरेक्ट आर्डर कर सकता है। 
              जैसे ही कस्टमर टेबल पर लगे क्यूआर कोड को स्कैन करेगा, बिना किसी ऐप डाउनलोड के तुरंत मोबाइल मेनू खुल जाएगा। यहाँ वेज और नॉन-वेज का साफ़ फ़िल्टर है, और पसंदीदा डिश जैसे पनीर बटर मसाला या दम बिरयानी को तुरंत कार्ट में जोड़ सकते हैं। 
              अब देखिए इसका सुपर-फास्ट चेकआउट! कस्टमर अपना मोबाइल नंबर डालेगा और तुरंत ऑटो-ओटीपी से लॉगिन हो जाएगा। डिस्काउंट कूपन लगते ही तुरंत छूट मिलेगी, और गूगल-पे, फोनपे, पेटीएम या कैश ऑन डिलीवरी से एक टैप में डायरेक्ट पेमेंट हो जाएगी। 
              और यह है रेस्टोरेंट का पावरफुल किचन डैशबोर्ड! नया आर्डर आते ही किचन में लाउड साउंड बेल बजेगी। शेफ तुरंत पच्चीस मिनट का टाइमर सेट करके आर्डर एक्सेप्ट करेगा, थर्मल KOT रसीद प्रिंट करेगा, और कोई आइटम खत्म होने पर तुरंत स्टॉक ऑफ कर सकेगा। 
              आर्डर होते ही कस्टमर के पर्सनल व्हाट्सएप पर ऑटोमैटिक बिल और लाइव डिलीवरी ट्रैकिंग लिंक पहुंच जाएगा। 
              आखिर में देखिए सुपर एडमिन पैनल! यहाँ से आप सिर्फ एक मिनट में नया रेस्टोरेंट जोड़ सकते हैं और हाई-क्वालिटी प्रिंट-रेडी टेबल क्यूआर कोड डाउनलोड कर सकते हैं। 
              तो चाहे अपने रेस्टोरेंट के लिए लेना हो या अपनी एजेंसी के लिए पूरा सोर्स कोड — आज ही संपर्क करें और लाइव डेमो देखें!"
            </div>

            <button
              onClick={() => {
                const fullText = SCREENS.map(s => s.voiceover).join(' ');
                speakImmediate(fullText);
              }}
              style={{
                marginTop: 16,
                background: '#EF4444',
                color: '#FFF',
                border: 'none',
                padding: '12px 24px',
                borderRadius: 8,
                fontWeight: 800,
                fontSize: 14,
                cursor: 'pointer'
              }}
            >
              ▶️ पूरा वॉयसओवर एक साथ सुनें (Play Non-Stop Full Speech)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
