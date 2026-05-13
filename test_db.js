const db = require('./db');

async function test() {
    try {
        const [rows] = await db.query('SELECT 1');
        console.log('DB Connected');
        
        const [notifs] = await db.query('SELECT * FROM notifications');
        console.log('Notifications count:', notifs.length);
        
        const [doorLogs] = await db.query('SELECT * FROM door_access_logs LIMIT 1');
        console.log('Door Logs sample:', doorLogs.length);
        
        process.exit(0);
    } catch (e) {
        console.error('Test Failed:', e);
        process.exit(1);
    }
}

test();
