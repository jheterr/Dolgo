const db = require('./db');

async function createTable() {
    try {
        console.log('Creating seat_transfer_requests table...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS seat_transfer_requests (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                current_element_id INT NOT NULL,
                requested_element_id INT NOT NULL,
                status ENUM('pending', 'approved', 'declined') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (current_element_id) REFERENCES floor_elements(id) ON DELETE CASCADE,
                FOREIGN KEY (requested_element_id) REFERENCES floor_elements(id) ON DELETE CASCADE
            )
        `);
        console.log('Successfully created seat_transfer_requests table.');
        process.exit(0);
    } catch (err) {
        console.error('Error creating table:', err);
        process.exit(1);
    }
}

createTable();
