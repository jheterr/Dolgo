const express = require('express');
const router = express.Router();

// Redirect /admin → /admin/dashboard
router.get('/', (req, res) => res.redirect('/admin/dashboard'));

const pages = [
  { route: '/dashboard',       view: 'admin/dashboard',       active: 'Dashboard' },
  { route: '/door-management', view: 'admin/door_management', active: 'Door Management' },
  { route: '/seat-management', view: 'admin/seat_management', active: 'Seat Management' },
  { route: '/reservation',     view: 'admin/reservation',     active: 'Reservation' },
  { route: '/staff',           view: 'admin/staff',           active: 'Staffs' },
  { route: '/customers',       view: 'admin/customers',       active: 'Customers' },
  { route: '/analytics',       view: 'admin/analytics',       active: 'Analytics & Reports' },
  { route: '/events',          view: 'admin/events',          active: 'Event' },
  { route: '/messages',        view: 'admin/messages',        active: 'Message' },
  { route: '/notifications',   view: 'admin/notification',    active: 'Notification' },
  { route: '/profile',         view: 'admin/profile',         active: 'Profile' },
];

pages.forEach(({ route, view, active }) => {
  router.get(route, (req, res) => res.render(view, { active, role: 'admin' }));
});

module.exports = router;
