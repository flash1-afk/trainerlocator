// ─── Pose & Landmark Types ───────────────────────────────────────────────────

export interface Landmark {
  x: number;        // normalized 0-1
  y: number;        // normalized 0-1
  z: number;        // depth, normalized
  visibility?: number; // 0-1 confidence
}

export interface PoseFrame {
  timestamp: number;
  landmarks: Landmark[];       // 33 MediaPipe landmarks
  worldLandmarks?: Landmark[]; // 3D world coordinates
  angles: JointAngles;
  velocity: number;            // overall movement speed
  smoothness: number;          // 0-1 motion smoothness score
}

export interface JointAngles {
  leftElbow:     number;
  rightElbow:    number;
  leftKnee:      number;
  rightKnee:     number;
  leftHip:       number;
  rightHip:      number;
  leftShoulder:  number;
  rightShoulder: number;
  leftAnkle:     number;
  rightAnkle:    number;
  spine:         number;
  neck:          number;
}

// ─── Exercise Types ───────────────────────────────────────────────────────────

export type ExerciseCategory =
  | 'strength'
  | 'cardio'
  | 'yoga'
  | 'martial_arts'
  | 'boxing'
  | 'stretching'
  | 'dance'
  | 'custom';

export interface Exercise {
  id:          string;
  name:        string;
  category:    ExerciseCategory;
  description: string;
  difficulty:  'beginner' | 'intermediate' | 'advanced';
  muscleGroups: string[];
  createdAt:   string;
  updatedAt:   string;
  trainerId?:  string;
  approved:    boolean;
  templateId?: string; // reference to stored pose template
}

export interface ExerciseTemplate {
  id:         string;
  exerciseId: string;
  frames:     PoseFrame[];
  repFrames:  PoseFrame[][];   // individual rep sequences
  keyAngles:  Partial<JointAngles>[];
  tempo:      number;           // seconds per rep
  repCount:   number;
  duration:   number;           // total recording duration ms
  createdAt:  string;
  metadata: {
    avgVelocity:    number;
    rangeOfMotion:  Partial<JointAngles>;
    symmetryScore:  number;
    peakAngles:     Partial<JointAngles>;
    valleyAngles:   Partial<JointAngles>;
  };
}

// ─── Coaching & Feedback Types ────────────────────────────────────────────────

export type FeedbackSeverity = 'correct' | 'warning' | 'error';

export type JointName = keyof JointAngles;

export interface CoachFeedback {
  id:         string;
  timestamp:  number;
  joint?:     JointName;
  severity:   FeedbackSeverity;
  message:    string;
  detail?:    string;
  score:      number;           // 0-100 accuracy for this feedback item
}

export interface RepResult {
  repNumber:   number;
  score:       number;          // 0-100
  duration:    number;          // ms
  feedback:    CoachFeedback[];
  angles:      Partial<JointAngles>;
}

export interface SessionSummary {
  sessionId:     string;
  exerciseId:    string;
  exerciseName:  string;
  startTime:     string;
  endTime:       string;
  totalReps:     number;
  avgScore:      number;
  peakScore:     number;
  repResults:    RepResult[];
  feedbackLog:   CoachFeedback[];
  rangeOfMotion: Partial<JointAngles>;
  formScore:     number;         // 0-100 overall form quality
  tempoScore:    number;         // 0-100 tempo consistency
  symmetryScore: number;         // 0-100 left/right balance
}

// ─── User Types ───────────────────────────────────────────────────────────────

export interface User {
  id:        string;
  name:      string;
  email:     string;
  role:      'trainer' | 'user' | 'admin';
  createdAt: string;
  stats: {
    totalSessions: number;
    totalReps:     number;
    avgFormScore:  number;
    streak:        number;
  };
}

// ─── WebSocket Event Types ────────────────────────────────────────────────────

export interface WsPoseFrame {
  sessionId:  string;
  frame:      PoseFrame;
  mode:       'training' | 'coaching';
}

export interface WsCoachFeedback {
  sessionId: string;
  feedback:  CoachFeedback[];
  repCount:  number;
  score:     number;
  jointMap:  Record<JointName, FeedbackSeverity>;
}

export interface WsTrainingProgress {
  sessionId: string;
  frameCount: number;
  repCount:   number;
  isRecording: boolean;
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?:   T;
  error?:  string;
  message?: string;
}

// ─── MediaPipe Landmark Indices ───────────────────────────────────────────────

export const LANDMARK_INDICES = {
  NOSE:              0,
  LEFT_EYE_INNER:    1,
  LEFT_EYE:          2,
  LEFT_EYE_OUTER:    3,
  RIGHT_EYE_INNER:   4,
  RIGHT_EYE:         5,
  RIGHT_EYE_OUTER:   6,
  LEFT_EAR:          7,
  RIGHT_EAR:         8,
  MOUTH_LEFT:        9,
  MOUTH_RIGHT:       10,
  LEFT_SHOULDER:     11,
  RIGHT_SHOULDER:    12,
  LEFT_ELBOW:        13,
  RIGHT_ELBOW:       14,
  LEFT_WRIST:        15,
  RIGHT_WRIST:       16,
  LEFT_PINKY:        17,
  RIGHT_PINKY:       18,
  LEFT_INDEX:        19,
  RIGHT_INDEX:       20,
  LEFT_THUMB:        21,
  RIGHT_THUMB:       22,
  LEFT_HIP:          23,
  RIGHT_HIP:         24,
  LEFT_KNEE:         25,
  RIGHT_KNEE:        26,
  LEFT_ANKLE:        27,
  RIGHT_ANKLE:       28,
  LEFT_HEEL:         29,
  RIGHT_HEEL:        30,
  LEFT_FOOT_INDEX:   31,
  RIGHT_FOOT_INDEX:  32,
} as const;

export type LandmarkIndex = typeof LANDMARK_INDICES[keyof typeof LANDMARK_INDICES];
