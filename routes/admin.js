const express = require('express');
const router = express.Router();
const db = require('../db');

// Redirect /admin → /admin/dashboard
router.get('/', (req, res) => res.redirect('/admin/dashboard'));

router.get('/dashboard', async (req, res) => {
    try {
        // 1. Total Active Users (count from active_sessions)
        const [activeUsers] = await db.execute('SELECT COUNT(*) as count FROM active_sessions WHERE status = "active"');
        
        // 2. Total Customers
        const [totalCustomers] = await db.execute('SELECT COUNT(*) as count FROM users WHERE role = "customer"');
        
        // 3. Available Seats
        const [availableSeats] = await db.execute(
            'SELECT COUNT(*) as available, (SELECT COUNT(*) FROM floor_elements WHERE element_type IN ("chair", "chair-sq")) as total FROM floor_elements WHERE status = "open" AND element_type IN ("chair", "chair-sq")'
        );

        // 4. Pending Reservations
        const [pendingReservations] = await db.execute(`
            SELECT r.id, CONCAT(u.first_name, ' ', u.last_name) as name, fe.label as seat, 
            DATE_FORMAT(r.start_time, '%Y-%m-%d') as date, 
            DATE_FORMAT(r.start_time, '%h:%i %p') as time,
            COALESCE(r.amount, 0) as amount
            FROM reservations r
            JOIN users u ON r.user_id = u.id
            JOIN floor_elements fe ON r.element_id = fe.id
            WHERE r.status = 'pending'
            ORDER BY r.start_time DESC
        `);

        // 5. Recent Activity (Combined logs)
        const [activities] = await db.execute(`
            (SELECT fe.label as seat, 'occupied' as action, 
            CASE WHEN TIMESTAMPDIFF(MINUTE, r.start_time, NOW()) < 60 
                 THEN CONCAT(TIMESTAMPDIFF(MINUTE, r.start_time, NOW()), 'm')
                 ELSE CONCAT(TIMESTAMPDIFF(HOUR, r.start_time, NOW()), 'h') END as time, 
            'in' as type, r.start_time as ts
            FROM reservations r
            JOIN floor_elements fe ON r.element_id = fe.id
            WHERE r.status = 'confirmed'
            ORDER BY r.start_time DESC LIMIT 5)
            UNION ALL
            (SELECT fe.label as seat, 'vacated' as action,
            CASE WHEN TIMESTAMPDIFF(MINUTE, r.end_time, NOW()) < 60 
                 THEN CONCAT(TIMESTAMPDIFF(MINUTE, r.end_time, NOW()), 'm')
                 ELSE CONCAT(TIMESTAMPDIFF(HOUR, r.end_time, NOW()), 'h') END as time, 
            'out' as type, r.end_time as ts
            FROM reservations r
            JOIN floor_elements fe ON r.element_id = fe.id
            WHERE r.status = 'completed'
            ORDER BY r.end_time DESC LIMIT 5)
            ORDER BY ts DESC LIMIT 6
        `);

        res.render('admin/dashboard', { 
            active: 'Dashboard', 
            role: 'admin',
            stats: {
                activeUsers: activeUsers[0].count,
                totalCustomers: totalCustomers[0].count,
                availableSeats: `${availableSeats[0].available}/${availableSeats[0].total}`,
                wifiSessions: activeUsers[0].count
            },
            pendingReservations,
            activities
        });
    } catch (err) {
        console.error("Admin Dashboard Error:", err);
        res.status(500).send("Internal Server Error");
    }
});

router.get('/profile', async (req, res) => {
    try {
        const userId = (req.session.user && req.session.user.id) ? req.session.user.id : 1; // Default to 1 for demo
        const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [userId]);
        const user = rows[0] || { firstName: 'Admin', lastName: 'User', email: 'admin@example.com', role: 'admin' };
        
        // Map DB fields to what the view expects
        const mappedUser = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            firstName: user.first_name,
            lastName: user.last_name,
            phone: user.phone,
            location: user.location,
            profile_picture: user.profile_picture
        };

        res.render('admin/profile', { active: 'Profile', role: 'admin', user: mappedUser });
    } catch (err) {
        console.error("Admin Profile Error:", err);
        res.status(500).send("Internal Server Error");
    }
});

const pages = [
  { route: '/door-management', view: 'admin/door_management', active: 'Door Management' },
  { route: '/seat-management', view: 'admin/seat_management', active: 'Seat Management' },
  { route: '/reservation',     view: 'admin/reservation',     active: 'Reservation' },
  { route: '/staff',           view: 'admin/staff',           active: 'Staffs' },
  { route: '/customers',       view: 'admin/customers',       active: 'Customers' },
  { route: '/analytics',       view: 'admin/analytics',       active: 'Analytics & Reports' },
  { route: '/events',          view: 'admin/events',          active: 'Event' },
  { route: '/messages',        view: 'admin/messages',        active: 'Message' },
  { route: '/notifications',   view: 'admin/notification',    active: 'Notification' },
];

pages.forEach(({ route, view, active }) => {
  router.get(route, (req, res) => res.render(view, { active, role: 'admin', user: req.session.user || {} }));
});

module.exports = router;
