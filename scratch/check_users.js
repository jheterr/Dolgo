const db = require('../db');
(async () => {
    try {
        const [rows] = await db.execute('SELECT id, username, first_name FROM users');
        console.log(JSON.stringify(rows));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
})();
