const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/database');

const router = express.Router();

// POST /api/users — register/get user (simple, no auth for MVP)
router.post('/',
  body('name').trim().notEmpty(),
  body('email').isEmail().normalizeEmail(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, error: errors.array()[0].msg });
    try {
      const db = getDb();
      let user = db.prepare('SELECT * FROM users WHERE email = ?').get(req.body.email);
      if (!user) {
        const id = uuidv4();
        db.prepare('INSERT INTO users (id, name, email, role) VALUES (?, ?, ?, ?)').run(id, req.body.name, req.body.email, req.body.role || 'user');
        user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
      }
      res.json({ success: true, data: user });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// GET /api/users/:id/stats
router.get('/:id/stats', param('id').isUUID(), (req, res) => {
  try {
    const db = getDb();
    const stats = db.prepare(`
      SELECT
        COUNT(DISTINCT s.id) as total_sessions,
        COALESCE(SUM(s.total_reps), 0) as total_reps,
        COALESCE(AVG(s.avg_score), 0) as avg_score,
        COALESCE(MAX(s.peak_score), 0) as peak_score
      FROM sessions s
      WHERE s.user_id = ? AND s.status = 'completed'
    `).get(req.params.id);
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
