const express = require('express');
const { getDb } = require('../db/database');

const router = express.Router();

// GET /api/analytics/user/:userId — overall user analytics
router.get('/user/:userId', (req, res) => {
  try {
    const db = getDb();
    const { userId } = req.params;
    const { days = 30 } = req.query;

    const sessions = db.prepare(`
      SELECT s.*, e.name as exercise_name
      FROM sessions s
      JOIN exercises e ON s.exercise_id = e.id
      WHERE s.user_id = ?
        AND s.status = 'completed'
        AND s.start_time >= datetime('now', ? || ' days')
      ORDER BY s.start_time ASC
    `).all(userId, `-${days}`);

    const exerciseBreakdown = db.prepare(`
      SELECT e.name, COUNT(s.id) as session_count, AVG(s.avg_score) as avg_score, SUM(s.total_reps) as total_reps
      FROM sessions s
      JOIN exercises e ON s.exercise_id = e.id
      WHERE s.user_id = ? AND s.status = 'completed'
      GROUP BY s.exercise_id
      ORDER BY session_count DESC
    `).all(userId);

    const repHistory = sessions.map(s => ({
      date:         s.start_time.split('T')[0],
      exerciseName: s.exercise_name,
      reps:         s.total_reps,
      score:        Math.round(s.avg_score),
      formScore:    Math.round(s.form_score),
      tempoScore:   Math.round(s.tempo_score),
      symmetryScore: Math.round(s.symmetry_score),
    }));

    res.json({
      success: true,
      data: {
        repHistory,
        exerciseBreakdown: exerciseBreakdown.map(e => ({
          name:         e.name,
          sessionCount: e.session_count,
          avgScore:     Math.round(e.avg_score),
          totalReps:    e.total_reps,
        })),
        summary: {
          totalSessions:  sessions.length,
          totalReps:      sessions.reduce((a, s) => a + s.total_reps, 0),
          avgFormScore:   sessions.length ? Math.round(sessions.reduce((a, s) => a + s.form_score, 0) / sessions.length) : 0,
          avgTempoScore:  sessions.length ? Math.round(sessions.reduce((a, s) => a + s.tempo_score, 0) / sessions.length) : 0,
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/analytics/session/:sessionId
router.get('/session/:sessionId', (req, res) => {
  try {
    const db = getDb();
    const reps = db.prepare(`
      SELECT * FROM rep_results WHERE session_id = ? ORDER BY rep_number
    `).all(req.params.sessionId);
    const feedback = db.prepare(`
      SELECT * FROM feedback_log WHERE session_id = ? ORDER BY timestamp_ms
    `).all(req.params.sessionId);
    res.json({
      success: true,
      data: {
        reps: reps.map(r => ({
          ...r,
          angles: JSON.parse(r.angles_json),
          feedback: JSON.parse(r.feedback_json),
        })),
        feedback,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
