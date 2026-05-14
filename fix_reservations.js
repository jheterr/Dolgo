const pool = require('./db');

async function fixReservations() {
    try {
        console.log('Fixing reservations table...');
        
        const [columns] = await pool.query('DESCRIBE reservations');
        const columnNames = columns.map(c => c.Field);

        if (!columnNames.includes('amount')) {
            await pool.query('ALTER TABLE reservations ADD COLUMN amount DECIMAL(10,2) DEFAULT 0.00 AFTER end_time');
            console.log('Added amount column');
        }
        
        if (!columnNames.includes('payment_method')) {
            await pool.query("ALTER TABLE reservations ADD COLUMN payment_method ENUM('cashier', 'gcash') DEFAULT 'cashier' AFTER amount");
            console.log('Added payment_method column');
        }

        if (!columnNames.includes('payment_status')) {
            await pool.query("ALTER TABLE reservations ADD COLUMN payment_status ENUM('unpaid', 'paid') DEFAULT 'unpaid' AFTER payment_method");
            console.log('Added payment_status column');
        }

        if (!columnNames.includes('reference_number')) {
            await pool.query('ALTER TABLE reservations ADD COLUMN reference_number VARCHAR(100) AFTER payment_status');
            console.log('Added reference_number column');
        }

        if (!columnNames.includes('proof_image')) {
            await pool.query('ALTER TABLE reservations ADD COLUMN proof_image LONGTEXT AFTER reference_number');
            console.log('Added proof_image column');
        }

        console.log('Reservations table fix complete.');
        process.exit(0);
    } catch (error) {
        console.error('Error fixing reservations table:', error);
        process.exit(1);
    }
}

fixReservations();
