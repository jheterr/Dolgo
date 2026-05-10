const express = require('express');
const router = express.Router();

// Landing page
router.get('/', (req, res) => res.render('landing/index'));

// Redirect /signup to the actual signup page
router.get('/signup', (req, res) => res.redirect('/login/sign-up'));
router.get('/sign-up', (req, res) => res.redirect('/login/sign-up'));
router.get('/sign up', (req, res) => res.redirect('/login/sign-up'));

module.exports = router;
