const express = require('express');
const router = express.Router();
const db = require('../db');

// Auto-cleanup for expired sessions/reservations
async function autoCleanup() {
    try {
        // 1. Find expired reservations that are still "confirmed"
        const [expired] = await db.query(`
            SELECT id, element_id FROM reservations 
            WHERE status = 'confirmed' AND end_time < NOW()
        `);

        if (expired.length > 0) {
            console.log(`Auto-cleaning ${expired.length} expired reservations...`);
            for (const r of expired) {
                // Mark reservation as completed
                await db.query('UPDATE reservations SET status = "completed" WHERE id = ?', [r.id]);
                // Open the seat
                await db.query('UPDATE floor_elements SET status = "open" WHERE id = ?', [r.element_id]);
            }
        }

        // 2. Mark active sessions AND their corresponding reservations as completed (only if NOT paused)
        // First, find IDs to update both tables
        const [toComplete] = await db.query('SELECT id, user_id FROM active_sessions WHERE status = "active" AND is_paused = 0 AND end_time < NOW()');
        
        if (toComplete.length > 0) {
            const userIds = toComplete.map(s => s.user_id);
            await db.query('UPDATE active_sessions SET status = "completed" WHERE id IN (?)', [toComplete.map(s => s.id)]);
            // Also complete the reservations for these users
            await db.query('UPDATE reservations SET status = "completed" WHERE user_id IN (?) AND status = "confirmed"', [userIds]);
        }

        // 3. Ensure floor_elements are 'open' if they have no active confirmed reservation
        await db.query(`
            UPDATE floor_elements fe
            LEFT JOIN reservations r ON fe.id = r.element_id AND r.status = 'confirmed'
            SET fe.status = 'open'
            WHERE (fe.status = 'taken' OR fe.status = 'idle') AND r.id IS NULL
        `);

    } catch (e) {
        console.error('Auto-Cleanup Error:', e);
    }
}

// Get layout
router.get('/layout', async (req, res) => {
    try {
        // Run cleanup before fetching
        await autoCleanup();

        // Find active floor plan
        const [plans] = await db.query('SELECT * FROM floor_plans WHERE is_active = 1 LIMIT 1');
        if (plans.length === 0) {
            return res.json({ items: null });
        }

        const planId = plans[0].id;
        // Join with active reservations and active_sessions to get end_time and pause status
        // Using a subquery for sessions to ensure we get the latest active session per user
        const [elements] = await db.query(`
            SELECT fe.*, r.end_time, r.user_id, u.first_name, u.last_name, 
                   s.is_paused, s.remaining_seconds
            FROM floor_elements fe
            LEFT JOIN reservations r ON fe.id = r.element_id 
                AND r.status = 'confirmed' 
                AND NOW() BETWEEN r.start_time AND r.end_time
            LEFT JOIN users u ON r.user_id = u.id
            LEFT JOIN (
                SELECT s1.* FROM active_sessions s1
                WHERE s1.status = 'active'
                AND s1.id = (SELECT MAX(id) FROM active_sessions s2 WHERE s2.user_id = s1.user_id AND s2.status = 'active')
            ) s ON r.user_id = s.user_id
            WHERE fe.floor_plan_id = ?
        `, [planId]);

        // Transform elements into expected format
        const items = elements.map(e => {
            let status = e.status;
            // Force status to 'idle' if we have an active paused session
            if (e.is_paused) status = 'idle';
            // Also ensure 'taken' if user_id exists but status is 'open' (backup check)
            else if (e.user_id && status === 'open') status = 'taken';

            return {
                id: e.id,
                type: e.element_type,
                x: e.pos_x,
                y: e.pos_y,
                w: e.width,
                h: e.height,
                rot: e.rotation,
                color: e.color,
                label: e.label,
                seats: e.capacity,
                status: status,
                statuses: [status],
                endTime: e.end_time,
                userName: e.first_name ? `${e.first_name} ${e.last_name}` : null,
                isPaused: !!e.is_paused,
                remainingSeconds: e.remaining_seconds || 0,
                user_id: e.user_id
            };
        });

        res.json({ items });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Save layout
router.post('/layout', async (req, res) => {
    const { items } = req.body;
    try {
        // Create a new floor plan (or update existing)
        // For simplicity, we just delete old and insert new.
        await db.query('DELETE FROM floor_plans WHERE is_active = 1');
        const [result] = await db.query('INSERT INTO floor_plans (name) VALUES (?)', ['Main Floor']);
        const planId = result.insertId;

        if (items && items.length > 0) {
            const values = items.map(i => [
                planId, i.type, i.label || null, i.x, i.y, i.w, i.h, i.rot || 0, i.color || null, i.seats || 1, i.statuses ? i.statuses[0] : 'open'
            ]);
            await db.query(`INSERT INTO floor_elements 
                (floor_plan_id, element_type, label, pos_x, pos_y, width, height, rotation, color, capacity, status) 
                VALUES ?`, [values]);
        }

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get users by status/role
router.get('/users', async (req, res) => {
    const { status, role, type, typeGroup } = req.query;
    let query = 'SELECT id, email, first_name, last_name, role, type, status, phone, location, schedule, created_at FROM users WHERE role != "super_admin"';
    const params = [];

    if (status) { query += ' AND status = ?'; params.push(status); }
    if (role) { query += ' AND role = ?'; params.push(role); }
    if (type) { query += ' AND type = ?'; params.push(type); }

    // typeGroup: 'walkin' => type LIKE '%walk%'
    // typeGroup: 'member' => type IN ('member','premium') OR type IS NULL
    if (typeGroup === 'walkin') {
        query += ' AND type LIKE "%walk%"';
    } else if (typeGroup === 'member') {
        query += ' AND (type IN ("member", "premium") OR type IS NULL)';
    }

    try {
        const [users] = await db.query(query, params);
        res.json({ users });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Approve user
router.post('/users/approve/:id', async (req, res) => {
    try {
        await db.query('UPDATE users SET status = "active" WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Database error' });
    }
});

// Add user (Admin/Staff)
router.post('/users/add', async (req, res) => {
    const { firstName, lastName, email, role, type, password, phone, location, schedule } = req.body;
    const bcrypt = require('bcryptjs');

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password || '123456', salt); // Default pass if none provided

        const [result] = await db.query(
            'INSERT INTO users (username, email, password_hash, role, type, status, first_name, last_name, phone, location, schedule) VALUES (?, ?, ?, ?, ?, "active", ?, ?, ?, ?, ?)',
            [email, email, hashedPassword, role || 'customer', type || 'member', firstName, lastName, phone || null, location || null, schedule || null]
        );
        res.json({ success: true, userId: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Database error' });
    }
});

// Get single user
router.get('/users/:id', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json({ user: rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Database error' });
    }
});

// Update user
router.put('/users/:id', async (req, res) => {
    const { firstName, lastName, email, role, type, status, phone, location, schedule } = req.body;
    try {
        await db.query(
            'UPDATE users SET first_name=?, last_name=?, email=?, role=?, type=?, status=?, phone=?, location=?, schedule=? WHERE id=?',
            [firstName, lastName, email, role, type, status, phone, location, schedule, req.params.id]
        );
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Database error' });
    }
});

// Extend active session
router.post('/session/extend', async (req, res) => {
    const { minutes, userId } = req.body;
    // Admin/Staff can specify userId, otherwise use session user (for customer self-extend)
    const targetUserId = userId || (req.session.user ? req.session.user.id : null);

    if (!targetUserId || !minutes) {
        return res.status(400).json({ success: false, error: 'Invalid request' });
    }

    try {
        await db.query(
            'UPDATE active_sessions SET end_time = DATE_ADD(end_time, INTERVAL ? MINUTE) WHERE user_id = ? AND status = "active"',
            [minutes, targetUserId]
        );
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Database error' });
    }
});

// Get active customers with their sessions and seats
router.get('/active-customers', async (req, res) => {
    try {
        await autoCleanup();
        const [customers] = await db.query(`
            SELECT u.id, u.first_name, u.last_name, u.email, u.role, u.type, 
                   s.start_time, s.end_time, s.mac_address, s.ip_address,
                   s.is_paused, s.remaining_seconds,
                   fe.label as seat_label
            FROM users u
            JOIN active_sessions s ON u.id = s.user_id
            LEFT JOIN (
                SELECT r1.user_id, r1.element_id FROM reservations r1
                WHERE r1.status = 'confirmed'
                AND r1.id = (SELECT MAX(id) FROM reservations r2 WHERE r2.user_id = r1.user_id AND r2.status = 'confirmed')
            ) r ON u.id = r.user_id
            LEFT JOIN floor_elements fe ON r.element_id = fe.id
            WHERE s.status = 'active'
            ORDER BY s.created_at DESC
        `);
        res.json({ customers });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Get seat transfer requests
router.get('/transfer-requests', async (req, res) => {
    try {
        const [requests] = await db.query(`
            SELECT tr.*, u.first_name, u.last_name, fe1.label as current_label, fe2.label as requested_label
            FROM seat_transfer_requests tr
            JOIN users u ON tr.user_id = u.id
            JOIN floor_elements fe1 ON tr.current_element_id = fe1.id
            JOIN floor_elements fe2 ON tr.requested_element_id = fe2.id
            WHERE tr.status = 'pending'
        `);
        res.json({ requests });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Approve transfer
router.post('/transfer-requests/:id/approve', async (req, res) => {
    try {
        const [requests] = await db.query('SELECT * FROM seat_transfer_requests WHERE id = ?', [req.params.id]);
        if (requests.length === 0) return res.status(404).json({ error: 'Request not found' });

        const reqData = requests[0];

        // 1. Update reservation
        await db.query('UPDATE reservations SET element_id = ? WHERE user_id = ? AND status = "confirmed"', [reqData.requested_element_id, reqData.user_id]);

        // 2. Update floor elements status
        await db.query('UPDATE floor_elements SET status = "open" WHERE id = ?', [reqData.current_element_id]);
        await db.query('UPDATE floor_elements SET status = "taken" WHERE id = ?', [reqData.requested_element_id]);

        // 3. Update request status
        await db.query('UPDATE seat_transfer_requests SET status = "approved" WHERE id = ?', [req.params.id]);

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Decline transfer
router.post('/transfer-requests/:id/decline', async (req, res) => {
    try {
        await db.query('UPDATE seat_transfer_requests SET status = "declined" WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Start Session (Assign User)
router.post('/session/start', async (req, res) => {
    const { userId, elementId, hours } = req.body;
    try {
        // 1. Check if user already has an active session
        const [existing] = await db.query('SELECT id, end_time FROM active_sessions WHERE user_id = ? AND status = "active" LIMIT 1', [userId]);

        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + hours * 60 * 60 * 1000);

        // 1. Create session
        await db.query('INSERT INTO active_sessions (user_id, start_time, end_time, status) VALUES (?, ?, ?, "active")', [userId, startTime, endTime]);

        // 2. Create reservation/booking record
        await db.query('INSERT INTO reservations (user_id, element_id, start_time, end_time, status) VALUES (?, ?, ?, ?, "confirmed")', [userId, elementId, startTime, endTime]);

        // 3. Update element status
        await db.query('UPDATE floor_elements SET status = "taken" WHERE id = ?', [elementId]);

        res.json({ success: true });
    } catch (error) {
        console.error('Session Start Error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Availability check for a specific time window
router.get('/availability', async (req, res) => {
    const { date, startTime, endTime } = req.query;
    if (!date || !startTime || !endTime) {
        return res.status(400).json({ error: 'Missing date, startTime, or endTime' });
    }
    try {
        const start = `${date} ${startTime}:00`;
        const end = `${date} ${endTime}:00`;

        // Find all reservations that overlap with this window
        // Overlap condition: (res.start < requested.end) AND (res.end > requested.start)
        const [rows] = await db.query(`
            SELECT element_id, status 
            FROM reservations 
            WHERE status NOT IN ('cancelled', 'completed')
            AND (
                (start_time < ? AND end_time > ?)
            )
        `, [end, start]);

        res.json({ busyElements: rows });
    } catch (error) {
        console.error('Availability Check Error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Get reservations
router.get('/reservations', async (req, res) => {
    try {
        console.log('Fetching all reservations...');
        const [rows] = await db.query(`
            SELECT r.*, u.first_name, u.last_name, u.email, fe.label as seat_label
            FROM reservations r
            LEFT JOIN users u ON r.user_id = u.id
            LEFT JOIN floor_elements fe ON r.element_id = fe.id
            ORDER BY r.created_at DESC
        `);
        console.log(`Found ${rows.length} reservations.`);
        res.json({ reservations: rows });
    } catch (error) {
        console.error('Error fetching reservations:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Add manual reservation (Admin/Staff)
router.post('/reservations/add', async (req, res) => {
    const { userId, date, startTime, endTime, elementId } = req.body;
    try {
        const start = `${date} ${startTime}:00`;
        const end = `${date} ${endTime}:00`;

        // Calculate amount (Demo: 50 per hour)
        const diffMs = new Date(end) - new Date(start);
        const diffHrs = Math.max(1, diffMs / (1000 * 60 * 60));
        const amount = diffHrs * 50;

        await db.query(
            'INSERT INTO reservations (user_id, element_id, start_time, end_time, amount, status, payment_method, payment_status) VALUES (?, ?, ?, ?, ?, "confirmed", "cashier", "unpaid")',
            [userId, elementId, start, end, amount]
        );
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Database error' });
    }
});

// Update reservation status
router.post('/reservations/:id/status', async (req, res) => {
    const { status, payment_status } = req.body;
    try {
        console.log(`Updating reservation ${req.params.id} to status: ${status}`);

        // 1. Get the reservation to find the element_id
        const [rows] = await db.query('SELECT element_id FROM reservations WHERE id = ?', [req.params.id]);
        if (rows.length > 0) {
            const elementId = rows[0].element_id;

            // 2. Update reservation
            await db.query('UPDATE reservations SET status = ?, payment_status = ? WHERE id = ?', [status, payment_status, req.params.id]);

            // 3. Update floor element status if applicable
            if (status === 'confirmed') {
                await db.query('UPDATE floor_elements SET status = "taken" WHERE id = ?', [elementId]);
            } else if (status === 'cancelled' || status === 'completed') {
                await db.query('UPDATE floor_elements SET status = "open" WHERE id = ?', [elementId]);
            }
        }

        res.json({ success: true });
    } catch (error) {
        console.error(`Error updating reservation ${req.params.id}:`, error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Get WiFi extensions
router.get('/wifi-extensions', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT w.*, u.first_name, u.last_name, u.email
            FROM wifi_extension_requests w
            JOIN users u ON w.user_id = u.id
            ORDER BY w.created_at DESC
        `);
        res.json({ requests: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Update WiFi extension status
router.post('/wifi-extensions/:id/status', async (req, res) => {
    const { status } = req.body;
    try {
        await db.query('UPDATE wifi_extension_requests SET status = ? WHERE id = ?', [status, req.params.id]);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Get Plan upgrades
router.get('/plan-upgrades', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT p.*, u.first_name, u.last_name, u.email, m1.name as current_plan, m2.name as requested_plan
            FROM plan_upgrade_requests p
            JOIN users u ON p.user_id = u.id
            LEFT JOIN membership_plans m1 ON p.current_plan_id = m1.id
            JOIN membership_plans m2 ON p.requested_plan_id = m2.id
            ORDER BY p.created_at DESC
        `);
        res.json({ requests: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Update Plan upgrade status
router.post('/plan-upgrades/:id/status', async (req, res) => {
    const { status } = req.body;
    try {
        await db.query('UPDATE plan_upgrade_requests SET status = ? WHERE id = ?', [status, req.params.id]);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Manual transfer by staff
router.post('/transfer-requests/manual', async (req, res) => {
    const { userId, currentElementId, newElementId } = req.body;
    try {
        console.log(`Transferring User: ${userId} from Seat: ${currentElementId} to Seat: ${newElementId}`);
        // 1. Update reservation (Latest active one)
        // Since active_sessions doesn't have element_id, we only update reservations
        await db.query('UPDATE reservations SET element_id = ? WHERE user_id = ? AND status = "confirmed" ORDER BY start_time DESC LIMIT 1', [newElementId, userId]);

        // 2. Update floor elements status
        if (currentElementId) {
            await db.query('UPDATE floor_elements SET status = "open" WHERE id = ?', [currentElementId]);
        }
        await db.query('UPDATE floor_elements SET status = "taken" WHERE id = ?', [newElementId]);

        res.json({ success: true });
    } catch (error) {
        console.error('Transfer Error:', error);
        res.status(500).json({ success: false, error: 'Database error' });
    }
});

// End customer session manually
router.post('/session/end', async (req, res) => {
    const { userId, elementId } = req.body;
    try {
        console.log(`Ending session for User: ${userId} on Element: ${elementId}`);

        // 1. Mark all currently confirmed reservations for this user as completed
        await db.query('UPDATE reservations SET status = "completed" WHERE user_id = ? AND status = "confirmed"', [userId]);

        // 2. Mark active session as completed
        await db.query('UPDATE active_sessions SET status = "completed", end_time = NOW() WHERE user_id = ? AND status = "active"', [userId]);

        // 3. Release the specific floor element
        if (elementId) {
            await db.query('UPDATE floor_elements SET status = "open" WHERE id = ?', [elementId]);
        }

        // 4. Safety check: Release any elements that might still be marked 'taken' for this user
        // We'll look for any elements where this user had a recent reservation
        await db.query(`
            UPDATE floor_elements 
            SET status = 'open' 
            WHERE id IN (
                SELECT element_id FROM (
                    SELECT element_id FROM reservations WHERE user_id = ? AND status = 'completed'
                ) as tmp
            )
        `, [userId]);

        res.json({ success: true });
    } catch (error) {
        console.error('End Session Error:', error);
        res.status(500).json({ success: false, error: 'Database error' });
    }
});

// Get events
router.get('/events', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM events ORDER BY event_date ASC');
        res.json({ events: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Create event
router.post('/events', async (req, res) => {
    const { title, description, date, location, price, maxAttendees, image } = req.body;
    console.log('API Request: Create Event', { title, date, location });

    try {
        // Get user ID from session or find an existing admin
        let userId = req.session.user ? req.session.user.id : null;

        if (!userId) {
            const [admins] = await db.query('SELECT id FROM users WHERE role = "admin" LIMIT 1');
            if (admins.length > 0) userId = admins[0].id;
        }

        console.log('Target User ID for Event:', userId);

        // Validate required fields
        if (!title || !date) {
            return res.status(400).json({ success: false, error: 'Title and Date are required' });
        }

        const priceNum = parseFloat(price) || 0;
        const attendeesNum = parseInt(maxAttendees) || 100;

        console.log('Inserting event with params:', [title, description, date, location, priceNum, attendeesNum, userId]);

        const [result] = await db.execute(
            'INSERT INTO events (title, description, event_date, location, price, max_attendees, image, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [title, description, date, location, priceNum, attendeesNum, image || null, userId]
        );

        console.log('Event created successfully, ID:', result.insertId);
        res.json({ success: true, id: result.insertId });
    } catch (error) {
        console.error("Event Creation Error Detail:", error);
        res.status(500).json({ success: false, error: 'Database error: ' + error.message });
    }
});

// Update event
router.put('/events/:id', async (req, res) => {
    const { title, description, date, location, price, maxAttendees, image } = req.body;
    try {
        const priceNum = parseFloat(price) || 0;
        const attendeesNum = parseInt(maxAttendees) || 100;

        await db.query(
            'UPDATE events SET title=?, description=?, event_date=?, location=?, price=?, max_attendees=?, image=? WHERE id=?',
            [title, description, date, location, priceNum, attendeesNum, image, req.params.id]
        );
        res.json({ success: true });
    } catch (error) {
        console.error("Event Update Error:", error);
        res.status(500).json({ success: false, error: error.message || 'Database error' });
    }
});

// Delete event
router.delete('/events/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM events WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        console.error("Event Delete Error:", error);
        res.status(500).json({ success: false, error: error.message || 'Database error' });
    }
});



// Get door access logs
router.get('/door-logs', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT d.*, u.first_name, u.last_name, u.role
            FROM door_access_logs d
            LEFT JOIN users u ON d.user_id = u.id
            ORDER BY d.access_time DESC
        `);
        res.json({ logs: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Submit door access log
router.post('/door-logs', async (req, res) => {
    const { user_id, door_name, status, method } = req.body;
    try {
        await db.query(
            'INSERT INTO door_access_logs (user_id, door_name, status, method) VALUES (?, ?, ?, ?)',
            [user_id, door_name, status, method || 'Manual Console']
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Error submitting door log:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// --- NOTIFICATIONS & AUDIT LOGS ---

// Get all notifications
router.get('/notifications', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT n.*, u.first_name, u.last_name 
            FROM notifications n
            LEFT JOIN users u ON n.user_id = u.id
            ORDER BY n.created_at DESC
        `);
        res.json({ notifications: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Mark notification as read
router.post('/notifications/mark-read', async (req, res) => {
    const { id, all } = req.body;
    try {
        if (all) {
            await db.query('UPDATE notifications SET is_read = 1');
        } else {
            await db.query('UPDATE notifications SET is_read = 1 WHERE id = ?', [id]);
        }
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Add Announcement (broadcast to all users or just system)
router.post('/notifications/announcement', async (req, res) => {
    const { title, message, type } = req.body;
    try {
        // For now, let's just create a general notification for the admin/system
        // In a real app, you might want to insert for each user or have a global_notifications table
        // For Dolgo, we'll just insert one for the admin (ID 1) as a record
        await db.query('INSERT INTO notifications (user_id, title, message) VALUES (1, ?, ?)', [title, message]);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Unified Audit Logs (Combines Door logs, Reservation updates, User activity)
router.get('/audit-logs', async (req, res) => {
    try {
        // Fetch Door logs
        const [doorLogs] = await db.query(`
            SELECT 'Security' as category, door_name as action, status, access_time as timestamp, 
                   CONCAT(u.first_name, ' ', u.last_name) as user_name, method as detail
            FROM door_access_logs d
            LEFT JOIN users u ON d.user_id = u.id
        `);

        // Fetch Reservation logs (confirmed/cancelled)
        const [resLogs] = await db.query(`
            SELECT 'Activity' as category, CONCAT('Reservation ', status) as action, 'info' as status, created_at as timestamp,
                   CONCAT(u.first_name, ' ', u.last_name) as user_name, CONCAT('Seat: ', fe.label) as detail
            FROM reservations r
            JOIN users u ON r.user_id = u.id
            JOIN floor_elements fe ON r.element_id = fe.id
        `);

        // Fetch WiFi extensions
        const [wifiLogs] = await db.query(`
            SELECT 'System' as category, 'WiFi Extension' as action, status, created_at as timestamp,
                   CONCAT(u.first_name, ' ', u.last_name) as user_name, CONCAT(requested_hours, ' hours') as detail
            FROM wifi_extension_requests w
            JOIN users u ON w.user_id = u.id
        `);

        // Combine and sort
        const allLogs = [...doorLogs, ...resLogs, ...wifiLogs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        res.json({ logs: allLogs });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Update profile picture
router.post('/users/profile-picture', async (req, res) => {
    const { image } = req.body;
    const userId = req.session.user ? req.session.user.id : null;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        await db.query('UPDATE users SET profile_picture = ? WHERE id = ?', [image, userId]);
        // Update session
        req.session.user.profile_picture = image;
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Update profile info
router.put('/users/profile', async (req, res) => {
    const { firstName, lastName, phone, location } = req.body;
    const userId = req.session.user ? req.session.user.id : null;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        await db.query(
            'UPDATE users SET first_name = ?, last_name = ?, phone = ?, location = ? WHERE id = ?',
            [firstName, lastName, phone, location, userId]
        );
        // Update session
        req.session.user.first_name = firstName;
        req.session.user.last_name = lastName;
        req.session.user.phone = phone;
        req.session.user.location = location;
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Get all users (for messaging/management)
router.get('/users', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, first_name, last_name, email, role, status FROM users');
        res.json({ users: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Get broadcast history
router.get('/messages', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM broadcasts ORDER BY created_at DESC');
        res.json({ messages: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Save sent broadcast and send internal notifications
router.post('/messages', async (req, res) => {
    const { audience, recipients, subject, body } = req.body;
    try {
        let senderId = req.session.user ? req.session.user.id : null;
        if (!senderId) {
            const [admins] = await db.query('SELECT id FROM users WHERE role = "admin" LIMIT 1');
            if (admins.length > 0) senderId = admins[0].id;
        }

        console.log('Processing broadcast for audience:', audience);

        // 1. Save to broadcast history
        await db.query(
            'INSERT INTO broadcasts (audience, recipients, subject, body, sender_id) VALUES (?, ?, ?, ?, ?)',
            [audience, recipients, subject, body, senderId]
        );

        // 2. Identify target user IDs for internal notifications
        let targetUserIds = [];
        if (audience === 'all') {
            const [users] = await db.query('SELECT id FROM users WHERE role != "admin"');
            targetUserIds = users.map(u => u.id);
        } else if (audience === 'members') {
            const [users] = await db.query('SELECT id FROM users WHERE role = "customer" AND status = "approved"');
            targetUserIds = users.map(u => u.id);
        } else if (audience === 'walkins') {
            const [users] = await db.query('SELECT id FROM users WHERE role = "customer" AND status = "pending"');
            targetUserIds = users.map(u => u.id);
        } else if (audience === 'staff') {
            const [users] = await db.query('SELECT id FROM users WHERE role = "staff"');
            targetUserIds = users.map(u => u.id);
        } else if (audience.startsWith('Specific')) {
            // Extract emails from recipients string and find user IDs
            const emails = recipients.split(',').map(e => e.trim());
            if (emails.length > 0) {
                const [users] = await db.query('SELECT id FROM users WHERE email IN (?)', [emails]);
                targetUserIds = users.map(u => u.id);
            }
        }

        // 3. Insert notifications for each target user
        if (targetUserIds.length > 0) {
            const values = targetUserIds.map(uid => [uid, subject, body]);
            await db.query('INSERT INTO notifications (user_id, title, message) VALUES ?', [values]);
            console.log(`Sent internal notifications to ${targetUserIds.length} users`);
        }

        res.json({ success: true });
    } catch (error) {
        console.error("Message/Notification Error:", error);
        res.status(500).json({ success: false, error: 'Database error: ' + error.message });
    }
});

// Run auto-cleanup every minute in the background
setInterval(autoCleanup, 60000);

// Analytics and Reports
router.get('/analytics', async (req, res) => {
    try {
        // 1. Total Stats Since Establishment
        const [[statsSince]] = await db.query(`
            SELECT 
                (SELECT COUNT(DISTINCT user_id) FROM reservations) as totalCustomers,
                (SELECT SUM(amount) FROM reservations WHERE payment_status = 'paid') as totalIncome,
                (SELECT SUM(TIMESTAMPDIFF(HOUR, start_time, end_time)) FROM reservations WHERE status = 'completed') as totalHours
        `);

        // 2. Traffic and Income Data (Today/Daily/Weekly/Monthly)
        // For simplicity, we'll return the last 30 days of data and let the frontend slice it
        const [dailyStats] = await db.query(`
            SELECT 
                DATE(start_time) as date,
                COUNT(*) as count,
                SUM(amount) as income
            FROM reservations
            WHERE status = 'completed'
            GROUP BY DATE(start_time)
            ORDER BY DATE(start_time) DESC
            LIMIT 30
        `);

        // 3. Customer Type Breakdown
        const [[typeBreakdown]] = await db.query(`
            SELECT 
                SUM(IF(role = 'customer' AND type = 'member', 1, 0)) as members,
                SUM(IF(role = 'customer' AND type = 'walkin', 1, 0)) as walkins,
                SUM(IF(role = 'customer' AND type = 'member' AND status = 'active', 1, 0)) as premium -- Simplified logic for premium
            FROM users
        `);

        // 4. Top Customers
        const [topCustomers] = await db.query(`
            SELECT u.first_name, u.last_name, u.type, SUM(TIMESTAMPDIFF(HOUR, r.start_time, r.end_time)) as total_hours
            FROM users u
            JOIN reservations r ON u.id = r.user_id
            WHERE r.status = 'completed'
            GROUP BY u.id
            ORDER BY total_hours DESC
            LIMIT 10
        `);

        // 5. Recent Transactions
        const [transactions] = await db.query(`
            SELECT r.*, u.first_name, u.last_name
            FROM reservations r
            JOIN users u ON r.user_id = u.id
            ORDER BY r.start_time DESC
            LIMIT 20
        `);

        // 6. Door Access History
        const [doorLogs] = await db.query(`
            SELECT l.*, u.first_name, u.last_name
            FROM door_access_logs l
            JOIN users u ON l.user_id = u.id
            ORDER BY l.access_time DESC
            LIMIT 20
        `);

        // 7. Income Logs Summary
        const [incomeLogs] = await db.query(`
            SELECT 
                DATE(start_time) as period,
                SUM(amount) as totalIncome,
                COUNT(*) as transactions,
                SUM(IF(payment_status = 'paid', amount, 0)) as paidAmount,
                SUM(IF(payment_status = 'unpaid', amount, 0)) as unpaidAmount
            FROM reservations
            GROUP BY DATE(start_time)
            ORDER BY DATE(start_time) DESC
            LIMIT 30
        `);

        // 8. Hourly Stats for Today
        const [hourlyStats] = await db.query(`
            SELECT 
                HOUR(start_time) as hour,
                COUNT(*) as count,
                SUM(amount) as income
            FROM reservations
            WHERE DATE(start_time) = CURDATE() AND status = 'completed'
            GROUP BY HOUR(start_time)
            ORDER BY HOUR(start_time)
        `);

        // 9. Weekly Customer Summary
        const [[weeklySummary]] = await db.query(`
            SELECT 
                COUNT(DISTINCT IF(u.type = 'member', u.id, NULL)) as weeklyMembers,
                COUNT(DISTINCT IF(u.type = 'walkin', u.id, NULL)) as weeklyWalkins,
                COUNT(DISTINCT IF(u.type = 'member' AND u.status = 'active', u.id, NULL)) as weeklyPremium
            FROM users u
            JOIN reservations r ON u.id = r.user_id
            WHERE YEARWEEK(r.start_time, 1) = YEARWEEK(CURDATE(), 1)
        `);

        // 10. Request Counts
        const [[{ wifiCount }]] = await db.query("SELECT COUNT(*) as wifiCount FROM wifi_extension_requests WHERE status = 'approved'");
        const [[{ planCount }]] = await db.query("SELECT COUNT(*) as planCount FROM plan_upgrade_requests WHERE status = 'approved'");

        res.json({
            statsSince,
            dailyStats: dailyStats.reverse(),
            typeBreakdown,
            topCustomers,
            transactions,
            doorLogs,
            incomeLogs,
            hourlyStats,
            weeklySummary,
            wifiCount,
            planCount
        });
    } catch (error) {
        console.error('Analytics API Error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;

