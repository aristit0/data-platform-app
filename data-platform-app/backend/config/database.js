const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    ca: fs.readFileSync(path.join(__dirname, process.env.DB_SSL_CA_PATH))
  },
  // Enhanced pooling config
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  maxIdle: 10,
  idleTimeout: 60000,
  acquireTimeout: 30000,
  timeout: 60000,
});

// Retry logic
async function queryWithRetry(sql, params, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const [results] = await pool.query(sql, params);
      return results;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      console.log(`Query failed, retrying (${i + 1}/${maxRetries})...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

// Test connection
pool.getConnection()
  .then(connection => {
    console.log('✅ Database connected successfully to TiDB');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
  });

module.exports = pool;
