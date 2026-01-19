import { Pool } from 'pg';
import { CONFIG } from './config.js';

export const db = new Pool({
  connectionString: CONFIG.DATABASE_URL,
});

export const initDB = async () => {
  try {
    const client = await db.connect();
    console.log('Database Connected!');
    client.release();

    await db.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY,
        type VARCHAR(50),
        token_in VARCHAR(50),
        token_out VARCHAR(50),
        amount DECIMAL,
        status VARCHAR(50),
        tx_hash VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (err) {
    console.error('Database Connecion dFailed:', err);
    process.exit(1);
  }
};
