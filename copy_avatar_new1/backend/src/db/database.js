const Database = require('better-sqlite3');
const path      = require('path');
const fs        = require('fs');

const DB_PATH = process.env.DB_PATH || (process.env.VERCEL ? '/tmp/avatar_buddy.db' : path.join(__dirname, '../../data/avatar_buddy.db'));

let db;

function getDb() {
  if (!db) throw new Error('Database not initialized. Call initDb() first.');
  return db;
}

async function initDb() {
  let dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/avatar_buddy.db');
  
  // Try to create the directory
  try {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (err) {
    console.warn(`Failed to create directory for ${dbPath}, falling back to /tmp/avatar_buddy.db`);
    dbPath = '/tmp/avatar_buddy.db';
  }

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  createTables();
  seedDefaultExercises();
  console.log(`[DB] SQLite initialized at ${DB_PATH}`);
}

function createTables() {
  db.exec(`
    -- Users
    CREATE TABLE IF NOT EXISTS users (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      email       TEXT UNIQUE NOT NULL,
      role        TEXT NOT NULL DEFAULT 'user',
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Exercises
    CREATE TABLE IF NOT EXISTS exercises (
      id           TEXT PRIMARY KEY,
      name         TEXT NOT NULL,
      category     TEXT NOT NULL,
      description  TEXT,
      difficulty   TEXT NOT NULL DEFAULT 'beginner',
      muscle_groups TEXT NOT NULL DEFAULT '[]',
      trainer_id   TEXT REFERENCES users(id),
      approved     INTEGER NOT NULL DEFAULT 1,
      template_id  TEXT,
      created_at   TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Exercise Templates (pose sequences)
    CREATE TABLE IF NOT EXISTS exercise_templates (
      id           TEXT PRIMARY KEY,
      exercise_id  TEXT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
      frame_count  INTEGER NOT NULL DEFAULT 0,
      rep_count    INTEGER NOT NULL DEFAULT 0,
      duration_ms  INTEGER NOT NULL DEFAULT 0,
      tempo_sec    REAL NOT NULL DEFAULT 0,
      frames_json  TEXT NOT NULL DEFAULT '[]',
      rep_frames_json TEXT NOT NULL DEFAULT '[]',
      key_angles_json TEXT NOT NULL DEFAULT '[]',
      metadata_json   TEXT NOT NULL DEFAULT '{}',
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Sessions
    CREATE TABLE IF NOT EXISTS sessions (
      id           TEXT PRIMARY KEY,
      user_id      TEXT REFERENCES users(id),
      exercise_id  TEXT NOT NULL REFERENCES exercises(id),
      mode         TEXT NOT NULL CHECK(mode IN ('training','coaching')),
      status       TEXT NOT NULL DEFAULT 'active',
      start_time   TEXT NOT NULL DEFAULT (datetime('now')),
      end_time     TEXT,
      total_reps   INTEGER NOT NULL DEFAULT 0,
      avg_score    REAL NOT NULL DEFAULT 0,
      peak_score   REAL NOT NULL DEFAULT 0,
      form_score   REAL NOT NULL DEFAULT 0,
      tempo_score  REAL NOT NULL DEFAULT 0,
      symmetry_score REAL NOT NULL DEFAULT 0,
      summary_json TEXT NOT NULL DEFAULT '{}'
    );

    -- Rep Results
    CREATE TABLE IF NOT EXISTS rep_results (
      id           TEXT PRIMARY KEY,
      session_id   TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      rep_number   INTEGER NOT NULL,
      score        REAL NOT NULL DEFAULT 0,
      duration_ms  INTEGER NOT NULL DEFAULT 0,
      angles_json  TEXT NOT NULL DEFAULT '{}',
      feedback_json TEXT NOT NULL DEFAULT '[]',
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Feedback Log
    CREATE TABLE IF NOT EXISTS feedback_log (
      id           TEXT PRIMARY KEY,
      session_id   TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      timestamp_ms INTEGER NOT NULL,
      joint        TEXT,
      severity     TEXT NOT NULL,
      message      TEXT NOT NULL,
      detail       TEXT,
      score        REAL NOT NULL DEFAULT 0
    );

    -- Analytics snapshots
    CREATE TABLE IF NOT EXISTS analytics (
      id           TEXT PRIMARY KEY,
      user_id      TEXT REFERENCES users(id),
      exercise_id  TEXT REFERENCES exercises(id),
      date         TEXT NOT NULL,
      avg_score    REAL,
      total_reps   INTEGER,
      total_sessions INTEGER,
      rom_json     TEXT NOT NULL DEFAULT '{}',
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_sessions_user    ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_exercise ON sessions(exercise_id);
    CREATE INDEX IF NOT EXISTS idx_rep_results_session ON rep_results(session_id);
    CREATE INDEX IF NOT EXISTS idx_feedback_session  ON feedback_log(session_id);
    CREATE INDEX IF NOT EXISTS idx_analytics_user    ON analytics(user_id, date);
  `);
}

function seedDefaultExercises() {
  const count = db.prepare('SELECT COUNT(*) as c FROM exercises').get();
  if (count.c > 0) return;

  const { v4: uuidv4 } = require('uuid');
  const defaults = [
    { name: 'Bicep Curl',      category: 'strength',  difficulty: 'beginner',     muscles: ['biceps','forearms'] },
    { name: 'Squat',           category: 'strength',  difficulty: 'beginner',     muscles: ['quads','glutes','hamstrings'] },
    { name: 'Push-up',         category: 'strength',  difficulty: 'intermediate', muscles: ['chest','triceps','shoulders'] },
    { name: 'Lunge',           category: 'strength',  difficulty: 'beginner',     muscles: ['quads','glutes','calves'] },
    { name: 'Shoulder Press',  category: 'strength',  difficulty: 'intermediate', muscles: ['shoulders','triceps'] },
    { name: 'Warrior Pose',    category: 'yoga',      difficulty: 'beginner',     muscles: ['hips','quads','core'] },
    { name: 'Jab-Cross Combo', category: 'boxing',    difficulty: 'intermediate', muscles: ['shoulders','core','legs'] },
    { name: 'Front Kick',      category: 'martial_arts', difficulty: 'intermediate', muscles: ['quads','hip_flexors'] },
    { name: 'Hip Hinge Stretch', category: 'stretching', difficulty: 'beginner',  muscles: ['hamstrings','lower_back'] },
  ];

  const insert = db.prepare(`
    INSERT INTO exercises (id, name, category, description, difficulty, muscle_groups, approved)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `);

  const insertMany = db.transaction((exercises) => {
    for (const ex of exercises) {
      insert.run(
        uuidv4(),
        ex.name,
        ex.category,
        `${ex.name} exercise - standard form`,
        ex.difficulty,
        JSON.stringify(ex.muscles)
      );
    }
  });

  insertMany(defaults);
  console.log(`[DB] Seeded ${defaults.length} default exercises`);
}

module.exports = { getDb, initDb };
