// Simple key-value persistence layer
// Uses PostgreSQL when DATABASE_URL is set (Render), falls back to JSON files (local dev)

import pg from 'pg';

let pool = null;
let ready = false;

export async function initDb() {
  if (!process.env.DATABASE_URL) return;
  try {
    pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
    await pool.query(
      'CREATE TABLE IF NOT EXISTS app_data (key TEXT PRIMARY KEY, value JSONB)'
    );
    ready = true;
    console.log('Connected to PostgreSQL for persistent storage');
  } catch (err) {
    console.error('Failed to connect to PostgreSQL:', err.message);
  }
}

export async function dbLoad(key) {
  if (!ready) return null;
  try {
    const res = await pool.query('SELECT value FROM app_data WHERE key = $1', [key]);
    return res.rows[0]?.value || null;
  } catch {
    return null;
  }
}

export function dbSave(key, data) {
  if (!ready) return;
  pool.query(
    'INSERT INTO app_data (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
    [key, JSON.stringify(data)]
  ).catch(() => {});
}
