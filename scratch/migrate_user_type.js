const db = require('../db');

async function migrate() {
    try {
        console.log('Starting migration...');
        
        // Add type column to users table if it doesn't exist
        await db.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS type ENUM('member', 'walkin') DEFAULT 'member' AFTER role
        `);
        
        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
