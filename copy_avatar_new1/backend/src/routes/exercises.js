const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/database');

const router = express.Router();

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, error: errors.array()[0].msg });
    return false;
  }
  return true;
}

// GET /api/exercises — list all
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { category, difficulty } = req.query;
    let sql = 'SELECT * FROM exercises WHERE approved = 1';
    const params = [];
    if (category)   { sql += ' AND category = ?';   params.push(category); }
    if (difficulty) { sql += ' AND difficulty = ?';  params.push(difficulty); }
    sql += ' ORDER BY name ASC';
    const rows = db.prepare(sql).all(...params);
    const exercises = rows.map(r => ({ ...r, muscle_groups: JSON.parse(r.muscle_groups) }));
    res.json({ success: true, data: exercises });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/exercises/:id
router.get('/:id', param('id').isUUID(), (req, res) => {
  if (!handleValidation(req, res)) return;
  try {
    const db  = getDb();
    const row = db.prepare('SELECT * FROM exercises WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ success: false, error: 'Exercise not found' });
    res.json({ success: true, data: { ...row, muscle_groups: JSON.parse(row.muscle_groups) } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/exercises/:id/demo  — returns 3 reps of frames at recorded speed for avatar demo
router.get('/:id/demo', param('id').isUUID(), (req, res) => {
  if (!handleValidation(req, res)) return;
  try {
    const db = getDb();
    const ex = db.prepare('SELECT * FROM exercises WHERE id = ?').get(req.params.id);
    if (!ex || !ex.template_id) return res.status(404).json({ success: false, error: 'No template' });
    const tpl = db.prepare('SELECT rep_frames_json, frames_json, metadata_json FROM exercise_templates WHERE id = ?').get(ex.template_id);
    if (!tpl) return res.status(404).json({ success: false, error: 'Template not found' });

    const metadata  = JSON.parse(tpl.metadata_json);
    const repFrames = JSON.parse(tpl.rep_frames_json);
    const allFrames = JSON.parse(tpl.frames_json);

    const TARGET_REPS = 3;
    const MAX_FRAMES_PER_REP = 90;

    // Build an array of up to 3 rep sequences
    let repSequences;
    if (metadata.exerciseMode === 'reps') {
      const available = repFrames.length > 0 ? repFrames.slice(0, TARGET_REPS) : [allFrames];
      repSequences = [...available];
      // Pad to 3 by repeating the last recorded rep
      while (repSequences.length < TARGET_REPS) {
        repSequences.push(repSequences[repSequences.length - 1]);
      }
    } else {
      // hold / sequence — repeat the full recording 3 times
      repSequences = [allFrames, allFrames, allFrames];
    }

    // Downsample each rep, normalize timestamps to start at 0, then concatenate
    const repBoundaries = [];
    const frames = [];
    let timeOffset = 0;

    for (const seq of repSequences) {
      let sampled = seq;
      if (sampled.length > MAX_FRAMES_PER_REP) {
        const step = Math.ceil(sampled.length / MAX_FRAMES_PER_REP);
        sampled = sampled.filter((_, i) => i % step === 0);
      }

      repBoundaries.push(frames.length);
      const t0 = sampled[0]?.timestamp ?? 0;
      for (const f of sampled) {
        frames.push({ ...f, timestamp: (f.timestamp - t0) + timeOffset });
      }

      // Advance offset by the rep's duration plus one average frame gap
      const repDuration = (sampled[sampled.length - 1]?.timestamp ?? 0) - (sampled[0]?.timestamp ?? 0);
      const avgFrameGap = sampled.length > 1 ? repDuration / (sampled.length - 1) : 33;
      timeOffset = frames[frames.length - 1].timestamp + avgFrameGap;
    }

    res.json({
      success: true,
      data: { frames, repBoundaries, repCount: repSequences.length, tempo: metadata.avgTempo || 2 },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/exercises/:id/template
router.get('/:id/template', param('id').isUUID(), (req, res) => {
  if (!handleValidation(req, res)) return;
  try {
    const db = getDb();
    const ex = db.prepare('SELECT * FROM exercises WHERE id = ?').get(req.params.id);
    if (!ex) return res.status(404).json({ success: false, error: 'Exercise not found' });
    if (!ex.template_id) return res.status(404).json({ success: false, error: 'No template recorded yet' });
    const tpl = db.prepare('SELECT * FROM exercise_templates WHERE id = ?').get(ex.template_id);
    if (!tpl) return res.status(404).json({ success: false, error: 'Template not found' });
    res.json({
      success: true,
      data: {
        ...tpl,
        frames:      JSON.parse(tpl.frames_json),
        repFrames:   JSON.parse(tpl.rep_frames_json),
        keyAngles:   JSON.parse(tpl.key_angles_json),
        metadata:    JSON.parse(tpl.metadata_json),
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/exercises — create custom exercise
router.post('/',
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('category').isIn(['strength','cardio','yoga','martial_arts','boxing','stretching','dance','custom']),
  body('difficulty').optional().isIn(['beginner','intermediate','advanced']),
  (req, res) => {
    if (!handleValidation(req, res)) return;
    try {
      const db = getDb();
      const id = uuidv4();
      const { name, category, description = '', difficulty = 'beginner', muscleGroups = [] } = req.body;
      db.prepare(`
        INSERT INTO exercises (id, name, category, description, difficulty, muscle_groups, approved)
        VALUES (?, ?, ?, ?, ?, ?, 1)
      `).run(id, name, category, description, difficulty, JSON.stringify(muscleGroups));
      const row = db.prepare('SELECT * FROM exercises WHERE id = ?').get(id);
      res.status(201).json({ success: true, data: { ...row, muscle_groups: JSON.parse(row.muscle_groups) } });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// POST /api/exercises/:id/template — save a recorded template
router.post('/:id/template',
  param('id').isUUID(),
  body('frames').isArray().withMessage('frames must be an array'),
  body('repFrames').isArray(),
  body('repCount').isInt({ min: 1 }),
  (req, res) => {
    if (!handleValidation(req, res)) return;
    try {
      const db = getDb();
      const ex = db.prepare('SELECT * FROM exercises WHERE id = ?').get(req.params.id);
      if (!ex) return res.status(404).json({ success: false, error: 'Exercise not found' });

      const { frames, repFrames, keyAngles = [], tempo = 0, durationMs = 0, metadata = {} } = req.body;
      const tplId = uuidv4();

      db.prepare(`
        INSERT INTO exercise_templates
          (id, exercise_id, frame_count, rep_count, duration_ms, tempo_sec, frames_json, rep_frames_json, key_angles_json, metadata_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        tplId,
        req.params.id,
        frames.length,
        req.body.repCount,
        durationMs,
        tempo,
        JSON.stringify(frames),
        JSON.stringify(repFrames),
        JSON.stringify(keyAngles),
        JSON.stringify(metadata)
      );

      // Link template to exercise
      db.prepare('UPDATE exercises SET template_id = ?, updated_at = datetime("now") WHERE id = ?')
        .run(tplId, req.params.id);

      res.status(201).json({ success: true, data: { templateId: tplId } });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// DELETE /api/exercises/:id
router.delete('/:id', param('id').isUUID(), (req, res) => {
  if (!handleValidation(req, res)) return;
  try {
    const db = getDb();
    const info = db.prepare('DELETE FROM exercises WHERE id = ?').run(req.params.id);
    if (info.changes === 0) return res.status(404).json({ success: false, error: 'Exercise not found' });
    res.json({ success: true, message: 'Exercise deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
