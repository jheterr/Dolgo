const express = require('express');
const router = express.Router();

router.get('/', (req, res) => res.render('login/login'));
router.get('/signup', (req, res) => res.redirect('/login/sign-up'));
router.get('/sign up', (req, res) => res.redirect('/login/sign-up'));
router.get('/sign-up', (req, res) => res.render('login/signup'));

module.exports = router;
