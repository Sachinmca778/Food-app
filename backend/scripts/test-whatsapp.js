/**
 * WhatsApp Test CLI Tool
 * Test your WhatsApp Bot locally or send live test messages via Meta Cloud API!
 * 
 * Usage:
 *   1. Test Bot response locally:
 *      node scripts/test-whatsapp.js bot "Hi" 9876543210
 *      node scripts/test-whatsapp.js bot "biryani" 9876543210
 *      node scripts/test-whatsapp.js bot "1" 9876543210
 *      node scripts/test-whatsapp.js bot "3" 9876543210
 * 
 *   2. Test Live Meta Message to a real phone number:
 *      node scripts/test-whatsapp.js live 919876543210 "Hello from DirectDine Bot!"
 */
require('dotenv').config();
const { sendMessage, isLiveMode } = require('../services/whatsappService');
const { query } = require('../db/pool');

const mode = process.argv[2] || 'bot';
const arg1 = process.argv[3] || 'Hi';
const arg2 = process.argv[4] || '9876543210';

async function run() {
  console.log('\n======================================================');
  console.log('🤖 DirectDine WhatsApp Bot Testing Tool');
  console.log(`📱 Live Meta Mode: ${isLiveMode() ? '✅ YES (Live API Enabled)' : '⚠️ NO (Mock Mode)'}`);
  console.log('======================================================\n');

  if (mode === 'live') {
    const targetPhone = arg1;
    const customText = arg2 === '9876543210' ? 'Hello from DirectDine Bot! Your WhatsApp integration is working.' : arg2;
    console.log(`📡 Sending test message to: ${targetPhone}`);
    console.log(`💬 Message: "${customText}"\n`);

    const { rows: [restaurant] } = await query('SELECT id, name FROM restaurants LIMIT 1');
    const result = await sendMessage(restaurant?.id, targetPhone, 'test_ping', customText);
    console.log('Result:', result);
  } else {
    const messageText = arg1;
    const senderPhone = arg2;

    console.log(`👤 Simulating Incoming WhatsApp message:`);
    console.log(`   From: +${senderPhone}`);
    console.log(`   Text: "${messageText}"\n`);

    try {
      const response = await fetch(`http://localhost:${process.env.PORT || 5001}/api/whatsapp/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: senderPhone, message: messageText })
      });
      const data = await response.json();
      console.log('🤖 Bot Reply:');
      console.log('------------------------------------------------------');
      console.log(data.botResponse);
      console.log('------------------------------------------------------\n');
    } catch (err) {
      console.error('❌ Could not connect to backend server. Make sure backend is running on port 5001!');
      console.error(err.message);
    }
  }

  process.exit(0);
}

run();
