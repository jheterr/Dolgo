const express = require('express');
const router = express.Router();
const db = require('../db');

// 1. Default Redirect
router.get('/', (req, res) => res.redirect('/customer/dashboard'));

// 2. DASHBOARD (GET)
router.get('/dashboard', async (req, res) => {
    try {
        const userId = (req.session.user && req.session.user.id) ? req.session.user.id : (req.session.userId || 2); 

        // Get User Info
        const [users] = await db.execute('SELECT first_name, profile_picture FROM users WHERE id = ?', [userId]);
        
        // Get Active Session
        const [sessions] = await db.execute(
            'SELECT * FROM active_sessions WHERE user_id = ? AND status = "active" LIMIT 1', 
            [userId]
        );

        // Count Available Seats
        const [seatCount] = await db.execute(
            'SELECT COUNT(*) as available FROM floor_elements WHERE status = "open" AND (element_type = "chair" OR element_type = "chair-sq")'
        );

        // Get Current Seat (from reservations)
        const [currentSeat] = await db.execute(`
            SELECT fe.label 
            FROM reservations r
            JOIN floor_elements fe ON r.element_id = fe.id
            WHERE r.user_id = ? AND r.status = "confirmed" 
            AND NOW() BETWEEN r.start_time AND r.end_time LIMIT 1
        `, [userId]);

        // Calculate remaining seconds on server to avoid client clock drift
        let remainingSecs = 0;
        if (sessions[0]) {
            if (sessions[0].is_paused) {
                remainingSecs = sessions[0].remaining_seconds;
            } else {
                const now = new Date();
                const end = new Date(sessions[0].end_time);
                remainingSecs = Math.max(0, Math.floor((end - now) / 1000));
            }
        }

        res.render('customer/dashboard', {
            active: 'Dashboard',
            role: 'customer',
            user: users[0] || { first_name: 'User' },
            session: sessions[0] || null,
            remainingSeconds: remainingSecs,
            availableSeats: seatCount[0].available,
            mySeat: currentSeat[0] ? currentSeat[0].label : 'N/A'
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Dashboard Error: " + err.message);
    }
});

// 3. TOGGLE PAUSE (POST)
router.post('/session/pause-toggle', async (req, res) => {
    try {
        const userId = (req.session.user && req.session.user.id) ? req.session.user.id : (req.session.userId || 2);
        const { isPaused, remainingSeconds } = req.body;

        // Find the active reservation for this user to get the element_id
        const [reservations] = await db.execute(
            'SELECT element_id FROM reservations WHERE user_id = ? AND status = "confirmed" LIMIT 1',
            [userId]
        );

        if (isPaused) {
            // PAUSING: Save the remaining seconds to DB and set seat to 'idle'
            await db.execute(
                `UPDATE active_sessions SET is_paused = 1, remaining_seconds = ? 
                 WHERE user_id = ? AND status = 'active'`,
                [remainingSeconds, userId]
            );
            if (reservations.length > 0) {
                await db.execute('UPDATE floor_elements SET status = "idle" WHERE id = ?', [reservations[0].element_id]);
            }
        } else {
            // RESUMING: Create a new end_time and set seat back to 'taken'
            const [updateResult] = await db.execute(
                `UPDATE active_sessions 
                 SET is_paused = 0, end_time = DATE_ADD(NOW(), INTERVAL ? SECOND) 
                 WHERE user_id = ? AND status = 'active'`,
                [remainingSeconds, userId]
            );

            if (reservations.length > 0) {
                // Also update the reservation end_time so the floor plan shows the correct time
                await db.execute(
                    `UPDATE reservations 
                     SET end_time = DATE_ADD(NOW(), INTERVAL ? SECOND) 
                     WHERE id = (
                        SELECT id FROM (
                            SELECT id FROM reservations 
                            WHERE user_id = ? AND element_id = ? AND status = 'confirmed' 
                            ORDER BY id DESC LIMIT 1
                        ) as t
                     )`,
                    [remainingSeconds, userId, reservations[0].element_id]
                );
                await db.execute('UPDATE floor_elements SET status = "taken" WHERE id = ?', [reservations[0].element_id]);
            }
        }
        
        // Get the updated session to return the new end_time
        const [updatedSession] = await db.execute(
            'SELECT end_time, is_paused, remaining_seconds FROM active_sessions WHERE user_id = ? AND status = "active" LIMIT 1',
            [userId]
        );

        res.json({ 
            success: true, 
            session: updatedSession[0] 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
});

// 4. EXTEND TIME (POST)
router.post('/session/extend', async (req, res) => {
    try {
        const userId = (req.session.user && req.session.user.id) ? req.session.user.id : (req.session.userId || 2);
        const { minutes } = req.body;

        // Add minutes to both end_time (for active) and remaining_seconds (for paused)
        await db.execute(
            `UPDATE active_sessions 
             SET end_time = DATE_ADD(end_time, INTERVAL ? MINUTE),
                 remaining_seconds = remaining_seconds + (? * 60)
             WHERE user_id = ? AND status = 'active'`,
            [minutes, minutes, userId]
        );

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
});

// 5. PROFILE ROUTES
router.get('/profile', async (req, res) => {
    try {
        const userId = (req.session.user && req.session.user.id) ? req.session.user.id : (req.session.userId || 2); 
        const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [userId]);
        res.render('customer/profile', { active: 'Profile', role: 'customer', user: rows[0] });
    } catch (err) { res.status(500).send(err.message); }
});

router.post('/profile/update', async (req, res) => {
    try {
        const userId = (req.session.user && req.session.user.id) ? req.session.user.id : (req.session.userId || 2);
        const { fullName, email, phone, location, mac_address } = req.body;
        const n = fullName.split(' ');
        await db.execute(
            `UPDATE users SET first_name=?, last_name=?, email=?, phone=?, location=?, mac_address=? WHERE id=?`,
            [n[0], n.slice(1).join(' '), email, phone, location, mac_address, userId]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false }); }
});

router.post('/profile/avatar', async (req, res) => {
    try {
        const userId = (req.session.user && req.session.user.id) ? req.session.user.id : (req.session.userId || 2);
        await db.execute('UPDATE users SET profile_picture=? WHERE id=?', [req.body.image, userId]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false }); }
});

// 6. EVENTS ROUTE
router.get('/events', async (req, res) => {
    try {
        const userId = (req.session.user && req.session.user.id) ? req.session.user.id : (req.session.userId || 2);
        const [events] = await db.execute('SELECT * FROM events ORDER BY event_date ASC');
        const [reservations] = await db.execute(`
            SELECT r.*, fe.label as seat_label 
            FROM reservations r
            JOIN floor_elements fe ON r.element_id = fe.id
            WHERE r.user_id = ?
        `, [userId]);
        res.render('customer/event', { active: 'Event', role: 'customer', events, reservations });
    } catch (err) { 
        console.error(err);
        res.status(500).send(err.message); 
    }
});

// 7. RESERVATIONS ROUTE
router.get('/reservations', async (req, res) => {
    try {
        const userId = (req.session.user && req.session.user.id) ? req.session.user.id : (req.session.userId || 2); 

        // 1. Get Active Session (The green card)
        const [sessions] = await db.execute(
            'SELECT * FROM active_sessions WHERE user_id = ? AND status = "active" LIMIT 1', 
            [userId]
        );

        // 2. Get All Reservations (The table)
        const [reservations] = await db.execute(`
            SELECT r.*, fe.label as seat_label, 
            TIMESTAMPDIFF(HOUR, r.start_time, r.end_time) as duration_hours
            FROM reservations r
            JOIN floor_elements fe ON r.element_id = fe.id
            WHERE r.user_id = ? 
            ORDER BY r.start_time DESC
        `, [userId]);

        // 3. Find if there is an active seat assigned right now
        const [activeSeat] = await db.execute(`
            SELECT fe.label 
            FROM reservations r
            JOIN floor_elements fe ON r.element_id = fe.id
            WHERE r.user_id = ? AND r.status = "confirmed" 
            AND NOW() BETWEEN r.start_time AND r.end_time LIMIT 1
        `, [userId]);

        res.render('customer/reservations', {
            active: 'Reservations',
            role: 'customer',
            session: sessions[0] || null,
            reservations: reservations,
            activeSeat: activeSeat[0] ? activeSeat[0].label : 'N/A'
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Reservations Error: " + err.message);
    }
});

// 8. NOTIFICATIONS ROUTE (Detailed)
router.get('/notifications', async (req, res) => {
    try {
        const userId = (req.session.user && req.session.user.id) ? req.session.user.id : (req.session.userId || 3);
        console.log('Fetching notifications for userId:', userId);
        
        const [rows] = await db.execute(
            'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );
        console.log(`Found ${rows.length} notifications for user ${userId}`);
        
        res.render('customer/notifications', { 
            active: 'Notifications', 
            role: 'customer', 
            userNotifications: rows || [],
            session: null 
        });
    } catch (err) {
        console.error('Notifications Route Error:', err);
        res.status(500).send("Notifications Error: " + err.message);
    }
});

// 9. MARK NOTIFICATION AS READ
router.post('/notifications/read/:id', async (req, res) => {
    try {
        const userId = (req.session.user && req.session.user.id) ? req.session.user.id : (req.session.userId || 2);
        const notifId = req.params.id;
        await db.execute(
            'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
            [notifId, userId]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

// 10. MARK ALL NOTIFICATIONS AS READ
router.post('/notifications/read-all', async (req, res) => {
    try {
        const userId = (req.session.user && req.session.user.id) ? req.session.user.id : (req.session.userId || 2);
        await db.execute(
            'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
            [userId]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

// 11. GENERIC PAGES
const genericPages = [
  { route: '/dashboard_static', view: 'customer/dashboard',      active: 'Dashboard' },
  { route: '/membership',       view: 'customer/membership',     active: 'Membership' },
  { route: '/reserve-new',      view: 'customer/reserve_new',    active: 'Reserve New' },
];

router.get('/reserve-history', async (req, res) => {
    try {
        const userId = (req.session.user && req.session.user.id) ? req.session.user.id : (req.session.userId || 2);
        const [rows] = await db.execute(`
            SELECT r.*, fe.label as seat_label, 
            DATE_FORMAT(r.start_time, '%b %d, %Y') as date,
            DATE_FORMAT(r.start_time, '%h:%i %p') as start_time_fmt,
            DATE_FORMAT(r.end_time, '%h:%i %p') as end_time_fmt,
            TIMESTAMPDIFF(HOUR, r.start_time, r.end_time) as duration_hours
            FROM reservations r
            JOIN floor_elements fe ON r.element_id = fe.id
            WHERE r.user_id = ?
            ORDER BY r.start_time DESC
        `, [userId]);
        res.render('customer/reserve_history', { active: 'Reserve History', role: 'customer', reservations: rows, session: null });
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});

genericPages.forEach(({ route, view, active }) => {
  router.get(route, (req, res) => res.render(view, { active, role: 'customer', session: null }));
});

// 9. SUBMIT RESERVATION (POST)
router.post('/reserve', async (req, res) => {
    console.log('New reservation request received:', req.body);
    try {
        const userId = (req.session.user && req.session.user.id) ? req.session.user.id : (req.session.userId || 3);
        const { elementId, date, startTime, endTime } = req.body;
        
        if (!elementId) {
            console.log('Reservation failed: Missing elementId');
            return res.status(400).json({ success: false, message: 'Please select a seat.' });
        }

        // Convert date and time to DATETIME
        const start = `${date} ${startTime}:00`;
        const end = `${date} ${endTime}:00`;

        // Calculate amount (Demo: 50 per hour)
        const diffMs = new Date(end) - new Date(start);
        const diffHrs = Math.max(1, diffMs / (1000 * 60 * 60));
        const amount = diffHrs * 50;

        await db.execute(
            `INSERT INTO reservations (user_id, element_id, start_time, end_time, amount, status) 
             VALUES (?, ?, ?, ?, ?, 'pending')`,
            [userId, elementId, start, end, amount]
        );

        console.log('Reservation saved for user:', userId);
        res.json({ success: true });
    } catch (err) {
        console.error('Error saving reservation:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;