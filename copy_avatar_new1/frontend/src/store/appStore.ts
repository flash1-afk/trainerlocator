/**
 * Global app state via Zustand.
 */

import { create } from 'zustand';
import type { Exercise, CoachFeedback, RepResult, PoseFrame, JointName, FeedbackSeverity } from '@shared/types';

interface AppState {
  // Mode
  mode: 'home' | 'training' | 'coaching';
  setMode: (m: AppState['mode']) => void;

  // Exercises
  exercises: Exercise[];
  selectedExercise: Exercise | null;
  setExercises: (ex: Exercise[]) => void;
  setSelectedExercise: (ex: Exercise | null) => void;

  // Session
  sessionId: string | null;
  setSessionId: (id: string | null) => void;

  // Training state
  isRecording: boolean;
  trainingFrameCount: number;
  trainingRepCount: number;
  setIsRecording: (v: boolean) => void;
  setTrainingProgress: (fc: number, rc: number) => void;

  // Coaching state
  isCoaching: boolean;
  repCount: number;
  currentScore: number;
  feedbackLog: CoachFeedback[];
  jointMap: Partial<Record<JointName, FeedbackSeverity>>;
  repResults: RepResult[];
  currentStep: number;
  totalSteps: number;
  setIsCoaching: (v: boolean) => void;
  addFeedback: (items: CoachFeedback[]) => void;
  setRepCount: (n: number) => void;
  setCurrentScore: (n: number) => void;
  setJointMap: (m: Partial<Record<JointName, FeedbackSeverity>>) => void;
  addRepResult: (r: RepResult) => void;
  setStepInfo: (current: number, total: number) => void;
  resetSession: () => void;

  // Live pose
  currentFrame: PoseFrame | null;
  setCurrentFrame: (f: PoseFrame | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  mode: 'home',
  setMode: (mode) => set({ mode }),

  exercises: [],
  selectedExercise: null,
  setExercises: (exercises) => set({ exercises }),
  setSelectedExercise: (selectedExercise) => set({ selectedExercise }),

  sessionId: null,
  setSessionId: (sessionId) => set({ sessionId }),

  isRecording: false,
  trainingFrameCount: 0,
  trainingRepCount: 0,
  setIsRecording: (isRecording) => set({ isRecording }),
  setTrainingProgress: (trainingFrameCount, trainingRepCount) => set({ trainingFrameCount, trainingRepCount }),

  isCoaching: false,
  repCount: 0,
  currentScore: 0,
  feedbackLog: [],
  jointMap: {},
  repResults: [],
  currentStep: 0,
  totalSteps: 0,
  setIsCoaching: (isCoaching) => set({ isCoaching }),
  addFeedback: (items) => set(s => ({ feedbackLog: [...s.feedbackLog.slice(-50), ...items] })),
  setRepCount: (repCount) => set({ repCount }),
  setCurrentScore: (currentScore) => set({ currentScore }),
  setJointMap: (jointMap) => set({ jointMap }),
  addRepResult: (r) => set(s => ({ repResults: [...s.repResults, r] })),
  setStepInfo: (currentStep, totalSteps) => set({ currentStep, totalSteps }),
  resetSession: () => set({
    isRecording: false, isCoaching: false, repCount: 0, currentScore: 0,
    feedbackLog: [], jointMap: {}, repResults: [], trainingFrameCount: 0, trainingRepCount: 0,
    sessionId: null, currentStep: 0, totalSteps: 0,
  }),

  currentFrame: null,
  setCurrentFrame: (currentFrame) => set({ currentFrame }),
}));
