const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../db');

// Render pages
router.get('/', (req, res) => res.render('login/login', { error: null }));
router.get('/sign-up', (req, res) => res.render('login/signup', { error: null }));

// Handle Login
router.post('/', async (req, res) => {
    const { email, password } = req.body;

    try {
        const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        
        if (users.length === 0) {
            return res.render('login/login', { error: 'Invalid email or password' });
        }

        const user = users[0];

        // Check account status
        if (user.status === 'pending') {
            return res.render('login/login', { error: 'Your account is pending approval. Please wait for staff verification.' });
        }
        if (user.status === 'suspended') {
            return res.render('login/login', { error: 'Your account has been suspended. Please contact administration.' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.render('login/login', { error: 'Invalid email or password' });
        }

        // Save to session
        req.session.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            status: user.status,
            firstName: user.first_name,
            lastName: user.last_name
        };

        // Redirect based on role
        if (user.role === 'admin') return res.redirect('/admin/dashboard');
        if (user.role === 'staff') return res.redirect('/staff/dashboard');
        return res.redirect('/customer/dashboard');

    } catch (err) {
        console.error(err);
        res.status(500).render('login/login', { error: 'An error occurred. Please try again.' });
    }
});

// Handle Signup
router.post('/sign-up', async (req, res) => {
    const { firstName, lastName, email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        return res.render('login/signup', { error: 'Passwords do not match' });
    }

    try {
        // Check if user exists
        const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.render('login/signup', { error: 'Email already in use' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert user (status defaults to 'pending' from DB schema)
        await pool.execute(
            'INSERT INTO users (username, email, password_hash, role, status, first_name, last_name) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [email, email, hashedPassword, 'customer', 'pending', firstName, lastName]
        );

        res.render('login/login', { error: null, success: 'Registration successful! Your account is now pending approval.' });

    } catch (err) {
        console.error(err);
        res.status(500).render('login/signup', { error: 'An error occurred during registration.' });
    }
});

// Handle Logout
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

module.exports = router;
