const express = require('express');
const router = express.Router();
const db = require('../db');

// Get layout
router.get('/layout', async (req, res) => {
    try {
        // Find active floor plan
        const [plans] = await db.query('SELECT * FROM floor_plans WHERE is_active = 1 LIMIT 1');
        if (plans.length === 0) {
            return res.json({ items: null });
        }
        
        const planId = plans[0].id;
        const [elements] = await db.query('SELECT * FROM floor_elements WHERE floor_plan_id = ?', [planId]);
        
        // Transform elements into expected format
        const items = elements.map(e => ({
            id: e.id,
            type: e.element_type,
            x: e.pos_x,
            y: e.pos_y,
            w: e.width,
            h: e.height,
            rot: e.rotation,
            color: e.color,
            label: e.label,
            seats: e.capacity,
            statuses: [e.status]
        }));
        
        res.json({ items });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Save layout
router.post('/layout', async (req, res) => {
    const { items } = req.body;
    try {
        // Create a new floor plan (or update existing)
        // For simplicity, we just delete old and insert new.
        await db.query('DELETE FROM floor_plans WHERE is_active = 1');
        const [result] = await db.query('INSERT INTO floor_plans (name) VALUES (?)', ['Main Floor']);
        const planId = result.insertId;
        
        if (items && items.length > 0) {
            const values = items.map(i => [
                planId, i.type, i.label || null, i.x, i.y, i.w, i.h, i.rot || 0, i.color || null, i.seats || 1, i.statuses ? i.statuses[0] : 'open'
            ]);
            await db.query(`INSERT INTO floor_elements 
                (floor_plan_id, element_type, label, pos_x, pos_y, width, height, rotation, color, capacity, status) 
                VALUES ?`, [values]);
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get users by status/role
router.get('/users', async (req, res) => {
    const { status, role } = req.query;
    let query = 'SELECT id, email, first_name, last_name, role, status, phone, location, schedule, created_at FROM users WHERE role != "super_admin" AND id != ?';
    const params = [req.session.user ? req.session.user.id : 0];

    if (status) { query += ' AND status = ?'; params.push(status); }
    if (role) { query += ' AND role = ?'; params.push(role); }

    try {
        const [users] = await db.query(query, params);
        res.json({ users });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Approve user
router.post('/users/approve/:id', async (req, res) => {
    try {
        await db.query('UPDATE users SET status = "active" WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Database error' });
    }
});

// Add user (Admin/Staff)
router.post('/users/add', async (req, res) => {
    const { firstName, lastName, email, role, password, phone, location, schedule } = req.body;
    const bcrypt = require('bcryptjs');

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password || '123456', salt); // Default pass if none provided

        await db.query(
            'INSERT INTO users (username, email, password_hash, role, status, first_name, last_name, phone, location, schedule) VALUES (?, ?, ?, ?, "active", ?, ?, ?, ?, ?)',
            [email, email, hashedPassword, role || 'customer', firstName, lastName, phone || null, location || null, schedule || null]
        );
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Database error' });
    }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Database error' });
    }
});

module.exports = router;
