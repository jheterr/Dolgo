const pool = require('../db');

async function checkColumns() {
    try {
        console.log('Checking events table columns...');
        const [columns] = await pool.query('DESCRIBE events');
        console.log('Columns in events:', columns.map(c => ({ Field: c.Field, Type: c.Type })));

        console.log('\nChecking users table columns...');
        const [userColumns] = await pool.query('DESCRIBE users');
        console.log('Columns in users:', userColumns.map(c => ({ Field: c.Field, Type: c.Type })));

        process.exit(0);
    } catch (error) {
        console.error('Error checking columns:', error);
        process.exit(1);
    }
}

checkColumns();
