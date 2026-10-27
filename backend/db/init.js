/**
 * Database Initialization Script
 * Usage: node db/init.js
 * Creates tables and seeds demo data
 */
const fs = require('fs');
const path = require('path');
const { pool } = require('./pool');

async function initDB() {
  const client = await pool.connect();
  try {
    console.log('🔄 Running schema.sql...');
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    if (pool.exec) {
      await pool.exec(schema);
    } else {
      await client.query(schema);
    }
    console.log('✅ Schema created successfully');

    console.log('🔄 Running seed.sql...');
    const seed = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
    if (pool.exec) {
      await pool.exec(seed);
    } else {
      await client.query(seed);
    }
    console.log('✅ Seed data inserted successfully');

    // Verify
    const { rows: restaurants } = await client.query('SELECT slug, name FROM restaurants');
    console.log(`\n📋 Restaurants in database:`);
    restaurants.forEach(r => console.log(`   • ${r.name} (/${r.slug})`));

    const { rows: items } = await client.query('SELECT count(*) as count FROM menu_items');
    console.log(`   🍽️  Total menu items: ${items[0].count}`);

    const { rows: staff } = await client.query('SELECT name, phone, is_super_admin FROM staff_users');
    console.log(`\n👤 Staff users:`);
    staff.forEach(s => console.log(`   • ${s.name} (${s.phone}) ${s.is_super_admin ? '👑 Super Admin' : ''}`));

    console.log('\n🚀 Database ready!');
  } catch (err) {
    console.error('❌ Database init failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

initDB();
