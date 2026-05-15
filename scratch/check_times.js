const pool = require('../db');
(async () => {
    try {
        const [sessions] = await pool.query('SELECT user_id, end_time, is_paused, remaining_seconds FROM active_sessions WHERE status = "active"');
        const [reservations] = await pool.query('SELECT user_id, end_time FROM reservations WHERE status = "confirmed"');
        console.log('Sessions:', JSON.stringify(sessions, null, 2));
        console.log('Reservations:', JSON.stringify(reservations, null, 2));
        console.log('Now (DB):', (await pool.query('SELECT NOW() as now'))[0][0].now);
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
})();
