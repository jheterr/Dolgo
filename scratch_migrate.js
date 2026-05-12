const mysql = require('mysql2/promise');
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'dolgo_db'
};

async function migrate() {
    const connection = await mysql.createConnection(dbConfig);
    try {
        console.log('Adding image column to floor_elements...');
        await connection.execute('ALTER TABLE floor_elements ADD COLUMN image LONGTEXT AFTER status');
        console.log('Successfully added image column.');
    } catch (err) {
        if (err.code === 'ER_DUP_COLUMN_NAMES') {
            console.log('Column image already exists.');
        } else {
            console.error('Migration failed:', err);
        }
    } finally {
        await connection.end();
    }
}

migrate();
