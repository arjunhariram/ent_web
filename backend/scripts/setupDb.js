import pool, { testConnection } from '../db.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();


const initializeDatabase = async () => {
  console.log('==== Database Setup Tool ====');
  
  try {
     const isConnected = await testConnection();
    if (!isConnected) {
      console.error('❌ Database connection test failed. Please check your configuration.');
      process.exit(1);
    }
    
    console.log('🔍 Checking for users table...');
    await setupUsersTable();
    
    console.log('📊 Creating test data...');
    await createTestUser();
    
    console.log('✅ Database setup completed successfully');
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
  } finally {
    // Close the connection pool
    await pool.end();
    console.log('🔌 Database connection closed');
  }
};


const setupUsersTable = async () => {
  const tableCheck = await pool.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name = 'users'
    );
  `);
  
  const tableExists = tableCheck.rows[0].exists;
  
  if (tableExists) {
    console.log('✅ Users table already exists');
    
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users';
    `);
    
    console.log('Table columns:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}, ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    
    const requiredColumns = ['id', 'mobile_number', 'password_hash', 'created_at'];
    const hasAllColumns = requiredColumns.every(col => 
      columns.rows.some(c => c.column_name === col)
    );
    
    if (!hasAllColumns) {
      console.log('⚠️ Users table is missing required columns');
      await recreateTable();
    }
    
    const rowCount = await pool.query('SELECT COUNT(*) FROM users');
    console.log(`ℹ️ Users table has ${rowCount.rows[0].count} records`);
  } else {
    console.log('⚠️ Users table does not exist, creating it...');
    await createTable();
  }
};


const createTable = async () => {
  await pool.query(`
    CREATE TABLE users (
      id SERIAL PRIMARY KEY,
      mobile_number VARCHAR(20) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
  console.log('✅ Users table created successfully');
};


const recreateTable = async () => {
  console.log('🔄 Recreating users table with correct schema...');
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    await client.query('DROP TABLE IF EXISTS users;');
    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        mobile_number VARCHAR(20) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    await client.query('COMMIT');
    console.log('✅ Users table recreated successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};


const createTestUser = async () => {
  const testMobile = '9999999999';
  const testPassword = 'TestPassword123';
  
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(testPassword, saltRounds);
  
  try {
    const result = await pool.query(`
      INSERT INTO users (mobile_number, password_hash, created_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (mobile_number) DO UPDATE
      SET password_hash = $3
      RETURNING id;
    `, [testMobile, passwordHash, passwordHash]);
    
    console.log(`✅ Test user created/updated with ID: ${result.rows[0].id}`);
    console.log(`   Mobile: ${testMobile}`);
    console.log(`   Password: ${testPassword} (for development purposes only)`);
  } catch (error) {
    console.error('❌ Failed to create test user:', error.message);
    throw error;
  }
};

initializeDatabase().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
