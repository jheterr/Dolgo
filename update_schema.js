const pool = require('./db');

async function updateSchema() {
    try {
        console.log('🚀 Starting database schema update...');

        // 1. Update users table
        console.log('Checking users table...');
        const [userCols] = await pool.query('DESCRIBE users');
        const userColNames = userCols.map(c => c.Field);

        if (!userColNames.includes('mac_address')) {
            await pool.query('ALTER TABLE users ADD COLUMN mac_address VARCHAR(17) AFTER location');
            console.log('✅ Added mac_address to users');
        }
        if (!userColNames.includes('profile_picture')) {
            await pool.query('ALTER TABLE users ADD COLUMN profile_picture LONGTEXT AFTER mac_address');
            console.log('✅ Added profile_picture to users');
        }
        
        // Update type ENUM and schedule type
        await pool.query("ALTER TABLE users MODIFY COLUMN type ENUM('member', 'walkin', 'staff') DEFAULT 'member'");
        console.log('✅ Updated users.type ENUM');
        
        await pool.query("ALTER TABLE users MODIFY COLUMN schedule TEXT");
        console.log('✅ Updated users.schedule to TEXT');

        // 2. Update events table
        console.log('Checking events table...');
        const [eventCols] = await pool.query('DESCRIBE events');
        const eventColNames = eventCols.map(c => c.Field);

        if (!eventColNames.includes('image')) {
            await pool.query('ALTER TABLE events ADD COLUMN image LONGTEXT AFTER location');
            console.log('✅ Added image to events');
        }
        if (!eventColNames.includes('price')) {
            await pool.query('ALTER TABLE events ADD COLUMN price DECIMAL(10,2) DEFAULT 0.00 AFTER image');
            console.log('✅ Added price to events');
        }

        // 3. Update floor_elements table
        console.log('Checking floor_elements table...');
        const [floorCols] = await pool.query('DESCRIBE floor_elements');
        const floorColNames = floorCols.map(c => c.Field);

        if (!floorColNames.includes('image')) {
            await pool.query('ALTER TABLE floor_elements ADD COLUMN image LONGTEXT');
            console.log('✅ Added image to floor_elements');
        }

        // 4. Create missing tables used in API
        console.log('Checking missing tables...');
        const [tables] = await pool.query('SHOW TABLES');
        const tableNames = tables.map(t => Object.values(t)[0]);

        if (!tableNames.includes('wifi_extension_requests')) {
            await pool.query(`
                CREATE TABLE wifi_extension_requests (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    requested_hours INT NOT NULL,
                    status ENUM('pending', 'approved', 'declined') DEFAULT 'pending',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
            `);
            console.log('✅ Created wifi_extension_requests table');
        }

        if (!tableNames.includes('plan_upgrade_requests')) {
            await pool.query(`
                CREATE TABLE plan_upgrade_requests (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    current_plan_id INT,
                    requested_plan_id INT NOT NULL,
                    status ENUM('pending', 'approved', 'declined') DEFAULT 'pending',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (current_plan_id) REFERENCES membership_plans(id),
                    FOREIGN KEY (requested_plan_id) REFERENCES membership_plans(id)
                )
            `);
            console.log('✅ Created plan_upgrade_requests table');
        }

        if (!tableNames.includes('broadcasts')) {
            await pool.query(`
                CREATE TABLE broadcasts (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    audience VARCHAR(50),
                    recipients TEXT,
                    subject VARCHAR(255),
                    body TEXT,
                    sender_id INT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (sender_id) REFERENCES users(id)
                )
            `);
            console.log('✅ Created broadcasts table');
        }

        console.log('✨ Database schema update complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error updating schema:', error);
        process.exit(1);
    }
}

updateSchema();
