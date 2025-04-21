import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER || 'entproject',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'entproject',
  password: process.env.DB_PASSWORD || 'entproject1',
  port: process.env.DB_PORT || 5432,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('connect', () => {
  console.log('✅ Database connection established');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
});

export const testConnection = async () => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT NOW() as current_time');
    console.log('Database test query successful:', result.rows[0].current_time);
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  } finally {
    client.release();
  }
};

export default pool;
