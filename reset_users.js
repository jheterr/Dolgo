const pool = require('./db');
const bcrypt = require('bcryptjs');

async function resetUsers() {
    try {
        console.log('Resetting users table...');

        // Disable foreign key checks to allow truncation
        await pool.query('SET FOREIGN_KEY_CHECKS = 0');
        
        // Truncate the table
        await pool.query('TRUNCATE TABLE users');
        
        console.log('Users table truncated.');

        // Hash password for admin
        const salt = await bcrypt.genSalt(10);
        const adminPassword = 'admin'; // Simple password for testing
        const adminHash = await bcrypt.hash(adminPassword, salt);

        // Insert Admin
        await pool.execute(
            'INSERT INTO users (username, email, password_hash, role, status, first_name, last_name) VALUES (?, ?, ?, ?, ?, ?, ?)',
            ['admin', 'admin@example.com', adminHash, 'admin', 'active', 'Super', 'Admin']
        );
        console.log('Admin user created: admin@example.com / admin');

        // Insert a staff user for testing
        const staffPassword = 'staff';
        const staffHash = await bcrypt.hash(staffPassword, salt);
        await pool.execute(
            'INSERT INTO users (username, email, password_hash, role, status, first_name, last_name) VALUES (?, ?, ?, ?, ?, ?, ?)',
            ['staff', 'staff@example.com', staffHash, 'staff', 'active', 'Staff', 'Member']
        );
        console.log('Staff user created: staff@example.com / staff');

        // Insert a customer user for testing
        const customerPassword = 'customer';
        const customerHash = await bcrypt.hash(customerPassword, salt);
        await pool.execute(
            'INSERT INTO users (username, email, password_hash, role, status, first_name, last_name) VALUES (?, ?, ?, ?, ?, ?, ?)',
            ['customer', 'customer@example.com', customerHash, 'customer', 'active', 'John', 'Doe']
        );
        console.log('Customer user created: customer@example.com / customer');

        // Re-enable foreign key checks
        await pool.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log('User table reset complete.');
        process.exit(0);
    } catch (error) {
        console.error('Error resetting users table:', error);
        process.exit(1);
    }
}

resetUsers();
