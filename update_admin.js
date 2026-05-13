const db = require('./db');
const bcrypt = require('bcryptjs');

async function updateAdmin() {
    try {
        console.log('Updating admin credentials...');
        const newEmail = 'thelastmuster@gmail.com';
        const newPassword = 'admin123';
        const newUsername = 'admin';

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update existing admin or insert if not exists
        // We'll update the user where role = 'admin'
        const [result] = await db.query(
            'UPDATE users SET username = ?, email = ?, password_hash = ? WHERE role = "admin"',
            [newUsername, newEmail, hashedPassword]
        );

        if (result.affectedRows === 0) {
            console.log('No admin user found to update. Inserting new admin...');
            await db.query(
                'INSERT INTO users (username, email, password_hash, role, status, first_name, last_name) VALUES (?, ?, ?, "admin", "active", "Super", "Admin")',
                [newUsername, newEmail, hashedPassword]
            );
        }

        console.log('Admin credentials updated successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Update failed:', err);
        process.exit(1);
    }
}

updateAdmin();
