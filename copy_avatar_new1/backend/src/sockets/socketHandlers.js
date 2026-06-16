const { v4: uuidv4 } = require('uuid');
const { getDb }      = require('../db/database');
const CoachingEngine = require('../services/coachingEngine');
const TrainingEngine = require('../services/trainingEngine');

// Active session state (in-memory)
const activeSessions = new Map(); // sessionId → { engine, mode, exerciseId, ... }

function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`[WS] Client connected: ${socket.id}`);

    // ── Join / Leave ──────────────────────────────────────────────────────────
    socket.on('join:session', ({ sessionId }) => {
      socket.join(sessionId);
      console.log(`[WS] ${socket.id} joined session ${sessionId}`);
    });

    socket.on('leave:session', ({ sessionId }) => {
      socket.leave(sessionId);
      activeSessions.delete(sessionId);
    });

    // ── Training Mode ─────────────────────────────────────────────────────────
    socket.on('training:start', async ({ sessionId, exerciseId }) => {
      try {
        const db       = getDb();
        const exercise = db.prepare('SELECT category FROM exercises WHERE id = ?').get(exerciseId);
        const engine   = new TrainingEngine(exerciseId, exercise?.category || 'strength');
        activeSessions.set(sessionId, { mode: 'training', engine, exerciseId, socketId: socket.id });
        socket.emit('training:progress', { sessionId, frameCount: 0, repCount: 0, isRecording: true });
        console.log(`[WS] Training started: session=${sessionId} exercise=${exerciseId}`);
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    socket.on('training:stop', async ({ sessionId }) => {
      try {
        const session = activeSessions.get(sessionId);
        if (!session || session.mode !== 'training') return;
        const { engine, exerciseId } = session;
        const template = engine.finalize();
        activeSessions.delete(sessionId);

        // ── Persist template to database ─────────────────────────────────────
        const db    = getDb();
        const tplId = uuidv4();

        db.prepare(`
          INSERT INTO exercise_templates
            (id, exercise_id, frame_count, rep_count, duration_ms, tempo_sec,
             frames_json, rep_frames_json, key_angles_json, metadata_json)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          tplId,
          exerciseId,
          template.frames.length,
          template.repCount,
          template.durationMs,
          template.tempo,
          JSON.stringify(template.frames),
          JSON.stringify(template.repFrames),
          JSON.stringify(template.keyAngles),
          JSON.stringify({ ...template.metadata, primaryJoint: template.primaryJoint })
        );

        // Link template to exercise so Coach mode can find it
        db.prepare(`UPDATE exercises SET template_id = ?, updated_at = datetime('now') WHERE id = ?`)
          .run(tplId, exerciseId);

        console.log(`[WS] Template saved: exercise=${exerciseId} templateId=${tplId} reps=${template.repCount} frames=${template.frames.length}`);
        socket.emit('training:saved', { sessionId, templateId: tplId, repCount: template.repCount });
      } catch (err) {
        console.error('[WS] training:stop error:', err);
        socket.emit('error', { message: err.message });
      }
    });

    // ── Coach Mode ────────────────────────────────────────────────────────────
    socket.on('coaching:start', async ({ sessionId, exerciseId }) => {
      try {
        const db = getDb();
        const exercise = db.prepare('SELECT * FROM exercises WHERE id = ?').get(exerciseId);
        if (!exercise || !exercise.template_id) {
          socket.emit('error', { message: 'No training template found for this exercise. Please train it first.' });
          return;
        }
        const tpl = db.prepare('SELECT * FROM exercise_templates WHERE id = ?').get(exercise.template_id);
        const template = {
          ...tpl,
          frames:    JSON.parse(tpl.frames_json),
          repFrames: JSON.parse(tpl.rep_frames_json),
          keyAngles: JSON.parse(tpl.key_angles_json),
          metadata:  JSON.parse(tpl.metadata_json),
        };
        const engine = new CoachingEngine(template);
        activeSessions.set(sessionId, { mode: 'coaching', engine, exerciseId, socketId: socket.id, repCount: 0, scores: [] });
        socket.emit('coaching:ready', { sessionId });
        console.log(`[WS] Coaching started: session=${sessionId}`);
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    socket.on('coaching:stop', ({ sessionId }) => {
      const session = activeSessions.get(sessionId);
      if (!session) return;
      activeSessions.delete(sessionId);
      console.log(`[WS] Coaching stopped: session=${sessionId}`);
    });

    // ── Pose Frame (used by both modes) ───────────────────────────────────────
    socket.on('pose:frame', (payload) => {
      const { sessionId, frame } = payload;
      const session = activeSessions.get(sessionId);
      if (!session) return;

      try {
        if (session.mode === 'training') {
          const { engine } = session;
          const progress = engine.addFrame(frame);
          socket.emit('training:progress', {
            sessionId,
            frameCount:  progress.frameCount,
            repCount:    progress.repCount,
            isRecording: true,
          });

        } else if (session.mode === 'coaching') {
          const { engine } = session;
          const result = engine.analyzeFrame(frame);

          // ── Corrective messages: respect 5s cooldown (handled inside engine) ──
          if (result.feedback.length > 0 || result.repCompleted) {
            socket.emit('coach:feedback', {
              sessionId,
              feedback:     result.feedback,
              repCount:     result.repCount,
              score:        result.score,
              jointMap:     result.jointMap,
              repCompleted: result.repCompleted,
              currentStep:  result.currentStep ?? 0,
              totalSteps:   result.totalSteps  ?? 0,
            });
          }

          if (result.repCompleted) {
            socket.emit('rep:complete', {
              sessionId,
              repNumber:  result.repCount,
              score:      result.repScore,
              feedback:   result.repFeedback,
            });
          }

          // ── Joint colour map: emit every 500 ms regardless of message cooldown ──
          const now = Date.now();
          if (!session.lastStatusTime || now - session.lastStatusTime >= 500) {
            session.lastStatusTime = now;
            socket.emit('coach:status', {
              sessionId,
              jointMap: result.jointMap,
              score:    result.score,
            });
          }
        }
      } catch (err) {
        console.error('[WS] Pose frame error:', err.message);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[WS] Client disconnected: ${socket.id}`);
      // Cleanup any sessions owned by this socket
      for (const [sid, session] of activeSessions.entries()) {
        if (session.socketId === socket.id) activeSessions.delete(sid);
      }
    });
  });
}

module.exports = { registerSocketHandlers };
