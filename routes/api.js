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

module.exports = router;
