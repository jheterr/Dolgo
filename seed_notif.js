const db = require('./db');
async function seed() {
    try {
        await db.query("INSERT INTO notifications (user_id, title, message) VALUES (1, 'System Update', 'Notification system has been upgraded.')");
        console.log('Seeded');
        process.exit(0);
    } catch (e) { console.error(e); process.exit(1); }
}
seed();
