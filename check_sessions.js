const db = require('./db');

async function checkSessions() {
    try {
        const [sessions] = await db.query('SELECT * FROM active_sessions');
        console.log('Active Sessions Count:', sessions.length);
        console.log('Sample Session:', sessions[sessions.length - 1] || 'No sessions found');
        process.exit(0);
    } catch (err) {
        console.error('Error checking sessions:', err);
        process.exit(1);
    }
}

checkSessions();
