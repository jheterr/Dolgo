const pool = require('../db');

async function checkDatabase() {
    try {
        console.log('Checking database tables...');
        const [tables] = await pool.query('SHOW TABLES');
        const tableNames = tables.map(t => Object.values(t)[0]);
        console.log('Tables in database:', tableNames);

        const expectedTables = [
            'users', 'membership_plans', 'user_memberships', 'floor_plans', 
            'floor_elements', 'reservations', 'active_sessions', 
            'door_access_logs', 'seat_transfer_requests', 'events', 'notifications'
        ];

        for (const table of expectedTables) {
            if (!tableNames.includes(table)) {
                console.log(`❌ Table missing: ${table}`);
            } else {
                console.log(`✅ Table exists: ${table}`);
                const [columns] = await pool.query(`DESCRIBE ${table}`);
                // console.log(`Columns in ${table}:`, columns.map(c => c.Field));
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('Error checking database:', error);
        process.exit(1);
    }
}

checkDatabase();
