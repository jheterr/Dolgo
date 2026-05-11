const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', (req, res) => res.redirect('/customer/dashboard'));

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
];

pages.forEach(({ route, view, active }) => {
  router.get(route, (req, res) => res.render(view, { active, role: 'customer', activeSession: null }));
});

module.exports = router;
