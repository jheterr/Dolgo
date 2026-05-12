const pool = require('./db');

async function seedSession() {
    try {
        const [users] = await pool.query('SELECT id FROM users WHERE email = "customer@gmail.com"');
        if (users.length === 0) {
            console.log('Customer user not found.');
            return;
        }
        const userId = users[0].id;
        
        // Check if there's already an active session
        const [sessions] = await pool.query('SELECT id FROM active_sessions WHERE user_id = ? AND status = "active"', [userId]);
        if (sessions.length > 0) {
            console.log('Active session already exists for this user.');
            return;
        }
        
        // Start time: now, End time: 2 hours from now
        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);
        
        await pool.query(
            'INSERT INTO active_sessions (user_id, start_time, end_time, status, mac_address, ip_address) VALUES (?, ?, ?, "active", "AA:BB:CC:DD:EE:FF", "192.168.1.101")',
            [userId, startTime, endTime]
        );
        
        console.log('Successfully seeded active session for customer@gmail.com');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding session:', error);
        process.exit(1);
    }
}

seedSession();
