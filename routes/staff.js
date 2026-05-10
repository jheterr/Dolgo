const express = require('express');
const router = express.Router();

router.get('/', (req, res) => res.redirect('/staff/dashboard'));

const pages = [
  { route: '/dashboard',       view: 'staff/dashboard',       active: 'Dashboard' },
  { route: '/door-management', view: 'staff/door_management', active: 'Door Management' },
  { route: '/seat-management', view: 'staff/seat_management', active: 'Seat Management' },
  { route: '/reservation',     view: 'staff/reservation',     active: 'Reservation' },
  { route: '/customers',       view: 'staff/customers',       active: 'Customers' },
  { route: '/events',          view: 'staff/events',          active: 'Event' },

  { route: '/profile',         view: 'staff/profile',         active: 'Profile' },
];

pages.forEach(({ route, view, active }) => {
  router.get(route, (req, res) => res.render(view, { active, role: 'staff' }));
});

module.exports = router;
