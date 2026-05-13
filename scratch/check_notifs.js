const db = require('../db');
(async () => {
    try {
        const [rows] = await db.execute('SELECT * FROM notifications WHERE user_id = 3');
        console.log('User 3 notifications count:', rows.length);
        console.log(JSON.stringify(rows));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
})();
