const mysql = require('mysql2/promise');
require('dotenv').config();

// Create a connection pool to the database
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'dolgo_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test the connection
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('Successfully connected to the MySQL database.');
        connection.release();
    } catch (error) {
        console.error('Error connecting to the MySQL database:', error.message);
    }
})();

module.exports = pool;
