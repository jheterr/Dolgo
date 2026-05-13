const db = require('./db');
async function seed() {
    try {
        const users = [1, 2, 3];
        for (const userId of users) {
            await db.query(`INSERT INTO notifications (user_id, title, message, is_read) VALUES 
                (?, 'Welcome!', 'Welcome to The Last Muster! We are glad to have you.', 0),
                (?, 'New Event: Celebration', 'Join us for our 2nd Anniversary Celebration!', 0),
                (?, 'Confirmed: Seat Reservation', 'Your seat reservation for tomorrow has been confirmed.', 0)`,
                [userId, userId, userId]
            );
        }
        console.log('Seeded for users 1, 2, and 3');
        process.exit(0);
    } catch (e) { console.error(e); process.exit(1); }
}
seed();
