const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => res.redirect('/staff/dashboard'));

router.get('/events', async (req, res) => {
    let eventList = [];
    let reservationList = [];
    try {
        const [rows] = await db.execute('SELECT * FROM events');
        eventList = rows;
        const [resRows] = await db.execute(`
            SELECT r.*, fe.label as seat_label, u.full_name as customer_name, u.email as customer_email
            FROM reservations r
            JOIN floor_elements fe ON r.element_id = fe.id
            JOIN users u ON r.user_id = u.id
        `);
        reservationList = resRows;
    } catch (err) {
        console.log("Staff Events DB Error:", err.message);
    }
    res.render('staff/events', { 
        active: 'Event', 
        role: 'staff',
        events: eventList, 
        reservations: reservationList 
    });
});

const pages = [
  { route: '/dashboard',       view: 'staff/dashboard',       active: 'Dashboard' },
  { route: '/door-management', view: 'staff/door_management', active: 'Door Management' },
  { route: '/seat-management', view: 'staff/seat_management', active: 'Seat Management' },
  { route: '/reservation',     view: 'staff/reservation',     active: 'Reservation' },
  { route: '/customers',       view: 'staff/customers',       active: 'Customers' },
  { route: '/profile',         view: 'staff/profile',         active: 'Profile' },
];

pages.forEach(({ route, view, active }) => {
  router.get(route, (req, res) => res.render(view, { active, role: 'staff' }));
});

module.exports = router;
