const express = require('express');
const router = express.Router();
<<<<<<< HEAD
const db = require('../db'); 
=======
const pool = require('../db');
>>>>>>> b71e5ca040dc8e180a5e9bd216de8d45ca4c4906

// 1. Default Redirect
router.get('/', (req, res) => res.redirect('/customer/dashboard'));

<<<<<<< HEAD
// 2. DASHBOARD (GET)
router.get('/dashboard', async (req, res) => {
    try {
        const userId = (req.session && req.session.userId) ? req.session.userId : 2; 

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

        res.render('customer/dashboard', {
            active: 'Dashboard',
            role: 'customer',
            user: users[0] || { first_name: 'User' },
            session: sessions[0] || null,
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
        const userId = (req.session && req.session.userId) ? req.session.userId : 2;
        const { isPaused, remainingSeconds } = req.body;

        if (isPaused) {
            // PAUSING: Save the remaining seconds to DB
            await db.execute(
                `UPDATE active_sessions SET is_paused = 1, remaining_seconds = ? 
                 WHERE user_id = ? AND status = 'active'`,
                [remainingSeconds, userId]
            );
        } else {
            // RESUMING: Create a new end_time based on saved seconds
            await db.execute(
                `UPDATE active_sessions 
                 SET is_paused = 0, end_time = DATE_ADD(NOW(), INTERVAL ? SECOND) 
                 WHERE user_id = ? AND status = 'active'`,
                [remainingSeconds, userId]
            );
        }
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
});

// 4. EXTEND TIME (POST)
router.post('/session/extend', async (req, res) => {
    try {
        const userId = (req.session && req.session.userId) ? req.session.userId : 2;
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
        const userId = (req.session && req.session.userId) ? req.session.userId : 2; 
        const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [userId]);
        res.render('customer/profile', { active: 'Profile', role: 'customer', user: rows[0] });
    } catch (err) { res.status(500).send(err.message); }
});

router.post('/profile/update', async (req, res) => {
    try {
        const userId = (req.session && req.session.userId) ? req.session.userId : 2;
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
        const userId = (req.session && req.session.userId) ? req.session.userId : 2;
        await db.execute('UPDATE users SET profile_picture=? WHERE id=?', [req.body.image, userId]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false }); }
});

// 6. EVENTS ROUTE
router.get('/events', async (req, res) => {
    try {
        const userId = (req.session && req.session.userId) ? req.session.userId : 2;
        const [events] = await db.execute('SELECT * FROM events ORDER BY event_date ASC');
        const [reservations] = await db.execute(`
            SELECT r.*, fe.label as seat_label 
            FROM reservations r
            JOIN floor_elements fe ON r.element_id = fe.id
            WHERE r.user_id = ?
        `, [userId]);
        res.render('customer/event', { active: 'Event', role: 'customer', events, reservations });
    } catch (err) { res.status(500).send(err.message); }
});

// routes/customer.js

router.get('/reservations', async (req, res) => {
    try {
        const userId = (req.session && req.session.userId) ? req.session.userId : 2; // Default to Jheter

        // 1. Get Active Session (The green card)
        const [sessions] = await db.execute(
            'SELECT * FROM active_sessions WHERE user_id = ? AND status = "active" LIMIT 1', 
            [userId]
        );

        // 2. Get All Reservations (The table)
        // We join with floor_elements to get labels like "T1-S1"
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

// 7. GENERIC PAGES
const pages = [
  { route: '/dashboard_static', view: 'customer/dashboard',      active: 'Dashboard' },
  { route: '/reservations',     view: 'customer/reservations',   active: 'Reservations' },
  { route: '/membership',       view: 'customer/membership',     active: 'Membership' },
  { route: '/notifications',    view: 'customer/notifications',  active: 'Notifications' },
  { route: '/reserve-history',  view: 'customer/reserve_history',active: 'Reserve History' },
  { route: '/reserve-new',      view: 'customer/reserve_new',    active: 'Reserve New' },
=======
router.get('/dashboard', async (req, res) => {
    try {
        const userId = req.session.user.id;
        
        // Fetch active session
        const [sessions] = await pool.query(
            'SELECT * FROM active_sessions WHERE user_id = ? AND status = "active" ORDER BY created_at DESC LIMIT 1',
            [userId]
        );
        
        const activeSession = sessions.length > 0 ? sessions[0] : null;
        
        res.render('customer/dashboard', { 
            active: 'Dashboard', 
            role: 'customer',
            activeSession 
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).send('Internal Server Error');
    }
});

const pages = [
  { route: '/reservations',    view: 'customer/reservations',   active: 'Reservations' },
  { route: '/events',          view: 'customer/event',          active: 'Events' },
  { route: '/membership',      view: 'customer/membership',     active: 'Membership' },
  { route: '/notifications',   view: 'customer/notifications',  active: 'Notifications' },
  { route: '/reserve-history', view: 'customer/reserve_history',active: 'Reserve History' },
  { route: '/reserve-new',     view: 'customer/reserve_new',    active: 'Reservations' },
  { route: '/profile',         view: 'customer/profile',        active: 'Profile' },
>>>>>>> b71e5ca040dc8e180a5e9bd216de8d45ca4c4906
];

pages.forEach(({ route, view, active }) => {
  router.get(route, (req, res) => res.render(view, { active, role: 'customer', activeSession: null }));
});

// 8. SUBMIT RESERVATION (POST)
router.post('/reserve', async (req, res) => {
    try {
        const userId = (req.session && req.session.userId) ? req.session.userId : 2;
        const { elementId, date, startTime, endTime } = req.body;

        if (!elementId || !date || !startTime || !endTime) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const startFull = `${date} ${startTime}:00`;
        const endFull = `${date} ${endTime}:00`;

        // 1. Insert into reservations table
        await db.execute(
            'INSERT INTO reservations (user_id, element_id, start_time, end_time, status) VALUES (?, ?, ?, ?, ?)',
            [userId, elementId, startFull, endFull, 'confirmed']
        );

        // 2. Update floor element status to 'reserved' (Optional, but useful for the map)
        await db.execute(
            'UPDATE floor_elements SET status = "reserved" WHERE id = ?',
            [elementId]
        );

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;