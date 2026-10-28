const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config();

let usePgLite = false;
let pgliteDb = null;
let pgPool = null;

// Determine if we should use PGlite or standard pg Pool
const hasPostgres = process.env.USE_POSTGRES === 'true';

if (hasPostgres) {
  const { Pool } = require('pg');
  const isRemote = process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost') && !process.env.DATABASE_URL.includes('127.0.0.1');
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ...(isRemote ? { ssl: { rejectUnauthorized: false } } : {})
  });

  pgPool.on('error', (err) => {
    console.error('❌ Unexpected PostgreSQL pool error:', err);
  });
} else {
  // Use embedded PostgreSQL engine (PGlite)
  usePgLite = true;
  const { PGlite } = require('@electric-sql/pglite');
  const { pgcrypto } = require('@electric-sql/pglite/contrib/pgcrypto');
  const { citext } = require('@electric-sql/pglite/contrib/citext');

  const dataDir = path.join(__dirname, '../data/pgdata');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  pgliteDb = new PGlite(dataDir, { extensions: { pgcrypto, citext } });
  console.log('📦 Using embedded PostgreSQL engine (PGlite)');
}

/**
 * Standardize query result to match 'pg' library format
 */
function standardizeResult(result) {
  if (!result) return { rows: [], rowCount: 0 };
  if (result.rowCount === undefined) {
    result.rowCount = result.affectedRows !== undefined ? result.affectedRows : (result.rows ? result.rows.length : 0);
  }
  return result;
}

// Promise mutex queue for PGlite WASM single-thread concurrency safety
let pgliteQueue = Promise.resolve();

/**
 * Single query helper
 */
async function query(text, params) {
  if (usePgLite) {
    return new Promise((resolve, reject) => {
      pgliteQueue = pgliteQueue.catch(() => {}).then(async () => {
        try {
          const res = await pgliteDb.query(text, params);
          resolve(standardizeResult(res));
        } catch (err) {
          reject(err);
        }
      });
    });
  } else {
    return pgPool.query(text, params);
  }
}


/**
 * Get client helper
 */
async function getClient() {
  if (usePgLite) {
    return {
      query: async (text, params) => {
        const res = await pgliteDb.query(text, params);
        return standardizeResult(res);
      },
      release: () => {}
    };
  } else {
    return pgPool.connect();
  }
}

/**
 * Transaction helper
 */
async function transaction(callback) {
  if (usePgLite) {
    return pgliteDb.transaction(async (tx) => {
      const clientWrapper = {
        query: async (text, params) => {
          const res = await tx.query(text, params);
          return standardizeResult(res);
        }
      };
      return callback(clientWrapper);
    });
  } else {
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

/**
 * Execute multi-statement SQL script (like schema.sql, seed.sql)
 */
async function exec(text) {
  if (usePgLite) {
    return pgliteDb.exec(text);
  } else {
    return pgPool.query(text);
  }
}

const pool = {
  query,
  exec,
  connect: getClient,
  end: async () => {
    if (usePgLite && pgliteDb) await pgliteDb.close();
    else if (pgPool) await pgPool.end();
  }
};

module.exports = { pool, query, exec, getClient, transaction };
