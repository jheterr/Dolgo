const express = require('express');
const router = express.Router();

router.get('/', (req, res) => res.redirect('/customer/dashboard'));

const pages = [
  { route: '/dashboard',       view: 'customer/dashboard',      active: 'Dashboard' },
  { route: '/reservations',    view: 'customer/reservations',   active: 'Reservations' },
  { route: '/events',          view: 'customer/event',          active: 'Events' },
  { route: '/membership',      view: 'customer/membership',     active: 'Membership' },
  { route: '/notifications',   view: 'customer/notifications',  active: 'Notifications' },
  { route: '/reserve-history', view: 'customer/reserve_history',active: 'Reserve History' },
  { route: '/reserve-new',     view: 'customer/reserve_new',    active: 'Reserve New' },
  { route: '/profile',         view: 'customer/profile',        active: 'Profile' },
];

pages.forEach(({ route, view, active }) => {
  router.get(route, (req, res) => res.render(view, { active, role: 'customer' }));
});

module.exports = router;
