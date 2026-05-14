const db = require('./db');

async function checkTransferTable() {
    try {
        const [columns] = await db.query('DESCRIBE seat_transfer_requests');
        console.log('Columns in seat_transfer_requests:', JSON.stringify(columns, null, 2));
        process.exit(0);
    } catch (err) {
        console.error('Error describing table:', err);
        process.exit(1);
    }
}

checkTransferTable();
