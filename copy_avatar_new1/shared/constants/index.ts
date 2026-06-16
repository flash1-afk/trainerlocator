// Re-export LANDMARK_INDICES so it can be imported from either @shared/constants or @shared/types
export { LANDMARK_INDICES } from '../types';

// ─── Pose Detection Constants ─────────────────────────────────────────────────

export const POSE_DETECTION = {
  MIN_DETECTION_CONFIDENCE:  0.7,
  MIN_TRACKING_CONFIDENCE:   0.7,
  MODEL_COMPLEXITY:          1,       // 0=Lite, 1=Full, 2=Heavy
  SMOOTH_LANDMARKS:          true,
  TARGET_FPS:                30,
  FRAME_BUFFER_SIZE:         300,     // max frames to buffer
} as const;

// ─── Joint Angle Thresholds ───────────────────────────────────────────────────

export const ANGLE_THRESHOLDS = {
  WARNING_TOLERANCE:  15,  // degrees before flagging warning
  ERROR_TOLERANCE:    30,  // degrees before flagging error
} as const;

// ─── Exercise Defaults ────────────────────────────────────────────────────────

export const EXERCISE_DEFAULTS = {
  BICEP_CURL: {
    name: 'Bicep Curl',
    targetAngles: { leftElbow: 30, rightElbow: 30 },
    extendedAngles: { leftElbow: 170, rightElbow: 170 },
  },
  SQUAT: {
    name: 'Squat',
    targetAngles: { leftKnee: 90, rightKnee: 90, leftHip: 90, rightHip: 90 },
    extendedAngles: { leftKnee: 170, rightKnee: 170 },
  },
  PUSHUP: {
    name: 'Push-up',
    targetAngles: { leftElbow: 90, rightElbow: 90 },
    extendedAngles: { leftElbow: 160, rightElbow: 160 },
  },
  LUNGE: {
    name: 'Lunge',
    targetAngles: { leftKnee: 90, rightKnee: 90 },
    extendedAngles: { leftKnee: 170, rightKnee: 170 },
  },
  SHOULDER_PRESS: {
    name: 'Shoulder Press',
    targetAngles: { leftElbow: 170, rightElbow: 170 },
    startAngles: { leftElbow: 90, rightElbow: 90 },
  },
} as const;

// ─── DTW Constants ────────────────────────────────────────────────────────────

export const DTW = {
  WINDOW_SIZE:        10,   // Sakoe-Chiba band width
  MAX_DISTANCE:       1.0,  // normalized max DTW distance
  SIMILARITY_THRESHOLD: 0.75, // 0-1 minimum similarity to count as a rep
} as const;

// ─── Scoring Weights ──────────────────────────────────────────────────────────

export const SCORING = {
  ANGLE_WEIGHT:     0.40,
  SYMMETRY_WEIGHT:  0.20,
  TEMPO_WEIGHT:     0.20,
  ROM_WEIGHT:       0.20,  // range of motion
} as const;

// ─── Avatar Colors ────────────────────────────────────────────────────────────

export const AVATAR_COLORS = {
  JOINT_CORRECT:  0x22c55e,  // green
  JOINT_WARNING:  0xeab308,  // yellow
  JOINT_ERROR:    0xef4444,  // red
  JOINT_NEUTRAL:  0x0ea5e9,  // brand blue
  BONE_DEFAULT:   0x94a3b8,
  BODY_SKIN:      0xe8c49a,
  BODY_DARK:      0x1a1a2e,
} as const;

// ─── Voice Coaching ───────────────────────────────────────────────────────────

export const VOICE = {
  RATE:    0.9,
  PITCH:   1.0,
  VOLUME:  1.0,
  LANG:    'en-US',
  COOLDOWN_MS: 3000,  // minimum ms between same feedback
} as const;

// ─── WebSocket Events ─────────────────────────────────────────────────────────

export const WS_EVENTS = {
  // Client → Server
  JOIN_SESSION:       'join:session',
  LEAVE_SESSION:      'leave:session',
  POSE_FRAME:         'pose:frame',
  START_TRAINING:     'training:start',
  STOP_TRAINING:      'training:stop',
  START_COACHING:     'coaching:start',
  STOP_COACHING:      'coaching:stop',

  // Server → Client
  COACH_FEEDBACK:     'coach:feedback',
  REP_COMPLETE:       'rep:complete',
  SESSION_SUMMARY:    'session:summary',
  TRAINING_PROGRESS:  'training:progress',
  TRAINING_SAVED:     'training:saved',
  ERROR:              'error',
} as const;
