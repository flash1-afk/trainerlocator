const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/database');

const router = express.Router();

function validate(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(400).json({ success: false, error: errors.array()[0].msg }); return false; }
  return true;
}

// GET /api/sessions
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { userId, exerciseId, mode, limit = 20, offset = 0 } = req.query;
    let sql = `
      SELECT s.*, e.name as exercise_name
      FROM sessions s
      JOIN exercises e ON s.exercise_id = e.id
      WHERE 1=1
    `;
    const params = [];
    if (userId)     { sql += ' AND s.user_id = ?';      params.push(userId); }
    if (exerciseId) { sql += ' AND s.exercise_id = ?';  params.push(exerciseId); }
    if (mode)       { sql += ' AND s.mode = ?';         params.push(mode); }
    sql += ' ORDER BY s.start_time DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));
    const rows = db.prepare(sql).all(...params);
    res.json({ success: true, data: rows.map(r => ({ ...r, summary: JSON.parse(r.summary_json) })) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/sessions/:id
router.get('/:id', param('id').isUUID(), (req, res) => {
  if (!validate(req, res)) return;
  try {
    const db  = getDb();
    const row = db.prepare('SELECT s.*, e.name as exercise_name FROM sessions s JOIN exercises e ON s.exercise_id = e.id WHERE s.id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ success: false, error: 'Session not found' });
    const reps = db.prepare('SELECT * FROM rep_results WHERE session_id = ? ORDER BY rep_number').all(req.params.id);
    res.json({
      success: true,
      data: {
        ...row,
        summary: JSON.parse(row.summary_json),
        reps: reps.map(r => ({ ...r, angles: JSON.parse(r.angles_json), feedback: JSON.parse(r.feedback_json) }))
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/sessions — create session
router.post('/',
  body('exerciseId').isUUID(),
  body('mode').isIn(['training', 'coaching']),
  (req, res) => {
    if (!validate(req, res)) return;
    try {
      const db = getDb();
      const id = uuidv4();
      db.prepare(`
        INSERT INTO sessions (id, user_id, exercise_id, mode, status)
        VALUES (?, ?, ?, ?, 'active')
      `).run(id, req.body.userId || null, req.body.exerciseId, req.body.mode);
      res.status(201).json({ success: true, data: { sessionId: id } });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// PATCH /api/sessions/:id/complete — finalize session
router.patch('/:id/complete',
  param('id').isUUID(),
  body('totalReps').isInt({ min: 0 }),
  (req, res) => {
    if (!validate(req, res)) return;
    try {
      const db = getDb();
      const { totalReps, avgScore = 0, peakScore = 0, formScore = 0, tempoScore = 0, symmetryScore = 0, summary = {} } = req.body;
      db.prepare(`
        UPDATE sessions SET
          status = 'completed',
          end_time = datetime('now'),
          total_reps = ?,
          avg_score = ?,
          peak_score = ?,
          form_score = ?,
          tempo_score = ?,
          symmetry_score = ?,
          summary_json = ?
        WHERE id = ?
      `).run(totalReps, avgScore, peakScore, formScore, tempoScore, symmetryScore, JSON.stringify(summary), req.params.id);
      res.json({ success: true, message: 'Session completed' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// POST /api/sessions/:id/reps — save rep result
router.post('/:id/reps',
  param('id').isUUID(),
  body('repNumber').isInt({ min: 1 }),
  body('score').isFloat({ min: 0, max: 100 }),
  (req, res) => {
    if (!validate(req, res)) return;
    try {
      const db = getDb();
      const id = uuidv4();
      const { repNumber, score, durationMs = 0, angles = {}, feedback = [] } = req.body;
      db.prepare(`
        INSERT INTO rep_results (id, session_id, rep_number, score, duration_ms, angles_json, feedback_json)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, req.params.id, repNumber, score, durationMs, JSON.stringify(angles), JSON.stringify(feedback));
      res.status(201).json({ success: true, data: { repId: id } });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

module.exports = router;
