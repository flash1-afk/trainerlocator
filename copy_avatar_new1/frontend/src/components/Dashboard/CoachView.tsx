'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { useAppStore }   from '@/store/appStore';
import { useSocket }     from '@/hooks/useSocket';
import { useVoiceCoach } from '@/hooks/useVoiceCoach';
import { AvatarCanvas }  from '@/components/Avatar/AvatarCanvas';
import { FeedbackPanel } from '@/components/Dashboard/FeedbackPanel';
import { ScoreRing }     from '@/components/UI/ScoreRing';
import { poseDetectorInstance } from '@/lib/pose/poseDetector';
import type { Landmark, JointAngles } from '@shared/types';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = (process.env.NEXT_PUBLIC_BACKEND_URL || 'https://avatar-backend-orcin.vercel.app').replace(/\/$/, '');

type Phase = 'idle' | 'demo' | 'coaching';

interface DemoFrame { landmarks: Landmark[]; angles: Partial<JointAngles>; timestamp: number; }

export function CoachView() {
  const store     = useAppStore();
  const socket    = useSocket();
  const voice     = useVoiceCoach(true);

  const videoRef  = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [camReady, setCamReady] = useState(false);
  const [voiceOn,  setVoiceOn]  = useState(true);

  // Demo animation state
  const [phase,         setPhase]         = useState<Phase>('idle');
  const [demoFrames,    setDemoFrames]    = useState<DemoFrame[]>([]);
  const [demoIdx,       setDemoIdx]       = useState(0);
  const [demoLoops,     setDemoLoops]     = useState(0);  // tracks completed reps (0-based)
  const demoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Live skeleton during coaching
  const currentFrame = useAppStore(s => s.currentFrame);
  const liveAngles   = currentFrame?.angles ?? {};

  // ── Camera ────────────────────────────────────────────────────────────────
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } })
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; setCamReady(true); }
      })
      .catch(() => toast.error('Camera access denied'));
    return () => {
      poseDetectorInstance.stop();
      streamRef.current?.getTracks().forEach(t => t.stop());
      voice.cancel();
      clearDemoTimer();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Pose detection (only runs during coaching phase) ────────────────────
  useEffect(() => {
    if (!camReady || !videoRef.current) return;
    poseDetectorInstance
      .start(videoRef.current, frame => {
        useAppStore.getState().setCurrentFrame(frame);
        const { isCoaching, sessionId } = useAppStore.getState();
        if (isCoaching && sessionId) socket.sendPoseFrame(sessionId, frame);
      })
      .catch(err => toast.error(`Pose detection failed: ${err.message}`));
  }, [camReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Voice on new feedback ────────────────────────────────────────────────
  useEffect(() => {
    if (!voiceOn || !store.feedbackLog.length) return;
    const latest = store.feedbackLog[store.feedbackLog.length - 1];
    voice.speak(latest.message);
  }, [store.feedbackLog.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Demo animation helpers ───────────────────────────────────────────────
  const clearDemoTimer = useCallback(() => {
    if (demoTimerRef.current) {
      clearTimeout(demoTimerRef.current);
      demoTimerRef.current = null;
    }
  }, []);

  const startDemoAnimation = useCallback((frames: DemoFrame[], repBoundaries: number[]) => {
    if (!frames.length) return;
    setDemoIdx(0);
    setDemoLoops(0);

    let idx = 0;

    const step = () => {
      const nextIdx = idx + 1;

      if (nextIdx >= frames.length) {
        // All 3 reps played — transition to coaching
        clearDemoTimer();
        setPhase('coaching');
        return;
      }

      // Delay to next frame based on actual recorded timestamps
      const delay = Math.max(16, frames[nextIdx].timestamp - frames[idx].timestamp);
      idx = nextIdx;
      setDemoIdx(idx);

      // Crossed into a new rep?
      if (repBoundaries.includes(idx) && idx !== 0) {
        setDemoLoops(prev => prev + 1);
      }

      demoTimerRef.current = setTimeout(step, delay);
    };

    demoTimerRef.current = setTimeout(step, 16);
  }, [clearDemoTimer]);

  // ── Start coaching flow ──────────────────────────────────────────────────
  const handleStartCoaching = async () => {
    if (!store.selectedExercise) return;
    try {
      // 1. Fetch demo frames
      voice.speak('Watch carefully. I will demonstrate the exercise three times.');
      const { data: demoData } = await axios.get(
        `${API}/api/exercises/${store.selectedExercise.id}/demo`
      );
      setDemoFrames(demoData.data.frames);
      setPhase('demo');
      startDemoAnimation(demoData.data.frames, demoData.data.repBoundaries || [0]);
    } catch (err) {
      // If demo fetch fails, skip straight to coaching
      console.warn('[Demo] Could not load demo frames, skipping:', err);
      beginCoachingSession();
    }
  };

  // Begin the actual WebSocket coaching session
  const beginCoachingSession = useCallback(async () => {
    if (!store.selectedExercise) return;
    try {
      const { data } = await axios.post(`${API}/api/sessions`, {
        exerciseId: store.selectedExercise.id,
        mode:       'coaching',
      });
      const sessionId = data.data.sessionId;
      store.setSessionId(sessionId);
      socket.joinSession(sessionId);
      socket.startCoaching(sessionId, store.selectedExercise.id);
      store.setIsCoaching(true);
      voice.speak('Now your turn. Begin the exercise.');
      toast.success('Coaching started!');
    } catch {
      toast.error('Failed to start coaching session');
    }
  }, [store, socket, voice]); // eslint-disable-line react-hooks/exhaustive-deps

  // Transition from demo → coaching when demo finishes
  useEffect(() => {
    if (phase === 'coaching' && !store.isCoaching) {
      beginCoachingSession();
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStopCoaching = () => {
    if (store.sessionId) socket.stopCoaching(store.sessionId);
    store.setIsCoaching(false);
    setPhase('idle');
    clearDemoTimer();
    voice.cancel();
    const isHold = ['yoga','stretching'].includes((store.selectedExercise as any)?.category);
    voice.speak(
      isHold
        ? `Session complete. Your final pose score is ${store.currentScore}.`
        : `Session complete. You completed ${store.repCount} reps with an average score of ${store.currentScore}.`
    );
  };

  const handleSkipDemo = () => {
    clearDemoTimer();
    setPhase('coaching');
  };

  const handleBack = () => {
    poseDetectorInstance.stop();
    streamRef.current?.getTracks().forEach(t => t.stop());
    voice.cancel();
    clearDemoTimer();
    store.resetSession();
    store.setMode('home');
  };

  // What the avatar canvas should display
  const avatarLandmarks =
    phase === 'demo'
      ? (demoFrames[demoIdx]?.landmarks ?? null)
      : (currentFrame?.landmarks ?? null);

  const avatarAngles =
    phase === 'demo'
      ? (demoFrames[demoIdx]?.angles ?? {})
      : liveAngles;

  return (
    <div className="min-h-screen flex flex-col p-4 max-w-6xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={handleBack} className="text-slate-400 hover:text-white text-sm">← Back</button>
        <div className="text-center">
          <h2 className="font-bold text-white text-lg">Coach Mode</h2>
          <p className="text-accent-green text-sm">{store.selectedExercise?.name}</p>
        </div>
        <button
          onClick={() => { setVoiceOn(v => !v); voice.cancel(); }}
          className={`text-sm px-3 py-1 rounded border transition-colors ${
            voiceOn ? 'border-brand-400 text-brand-300' : 'border-slate-600 text-slate-500'
          }`}
        >
          {voiceOn ? '🔊 Voice' : '🔇 Muted'}
        </button>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Webcam — always visible */}
        <div className="glass relative overflow-hidden aspect-[4/3]">
          <video ref={videoRef} autoPlay playsInline muted
            className="w-full h-full object-cover webcam-mirror" />
          {!camReady && (
            <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
              Starting camera…
            </div>
          )}
          {/* Demo phase overlay */}
          {phase === 'demo' && (
            <div className="absolute inset-x-0 bottom-0 bg-black/60 py-2 px-3 flex items-center justify-between">
              <span className="text-xs text-brand-300">
                Demonstration — rep {demoLoops + 1} / 3
              </span>
              <button onClick={handleSkipDemo}
                className="text-xs text-slate-400 hover:text-white underline">
                Skip
              </button>
            </div>
          )}
        </div>

        {/* Avatar skeleton */}
        <div className="glass overflow-hidden aspect-[4/3] relative">
          <AvatarCanvas
            landmarks={avatarLandmarks}
            angles={avatarAngles as Partial<JointAngles>}
            jointMap={phase === 'coaching' ? store.jointMap : {}}
            label={phase === 'demo' ? 'Demonstration' : 'Your Skeleton'}
            status={phase === 'demo' ? 'Watch the demonstration…' : poseDetectorInstance.statusText}
          />
          {/* Demo banner */}
          {phase === 'demo' && (
            <div className="absolute top-2 right-2 bg-brand-600/80 text-white text-xs px-2 py-1 rounded font-semibold">
              DEMO
            </div>
          )}
        </div>

        {/* Score + feedback */}
        <div className="flex flex-col gap-3">
          {/* Step indicator — only for sequence-mode exercises */}
          {store.totalSteps > 0 && phase === 'coaching' && (
            <div className="glass px-4 py-2 flex items-center gap-3">
              <span className="text-xs text-slate-400">Step</span>
              <div className="flex gap-1.5 flex-1">
                {Array.from({ length: store.totalSteps }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 flex-1 rounded-full transition-colors ${
                      i === store.currentStep
                        ? 'bg-brand-400'
                        : i < store.currentStep
                          ? 'bg-brand-700'
                          : 'bg-slate-700'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-brand-300 font-mono">
                {store.currentStep + 1}/{store.totalSteps}
              </span>
            </div>
          )}

          <div className="glass p-4 flex items-center gap-6">
            <ScoreRing score={store.currentScore} />
            {(() => {
              const cat    = (store.selectedExercise as any)?.category;
              const isHold = ['yoga','stretching'].includes(cat);
              const isSeq  = ['boxing'].includes(cat);
              return (
                <div>
                  {isHold ? (
                    <>
                      <div className="text-3xl font-bold text-white">{store.currentScore}</div>
                      <div className="text-xs text-slate-400">Pose Score</div>
                      <div className="text-sm text-brand-300 mt-1">
                        {phase === 'demo' ? 'Watch the pose first' : 'Hold the pose'}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-3xl font-bold text-white">{store.repCount}</div>
                      <div className="text-xs text-slate-400">{isSeq ? 'Combos' : 'Reps'}</div>
                      <div className="text-sm text-brand-300 mt-1">
                        {phase === 'demo'
                          ? 'Watch the demo first'
                          : store.repResults.length > 0
                            ? `Last: ${store.repResults[store.repResults.length - 1].score}pts`
                            : isSeq ? 'Throw the combo' : 'Begin exercise'}
                      </div>
                    </>
                  )}
                </div>
              );
            })()}
          </div>
          <FeedbackPanel feedbackLog={store.feedbackLog} />
        </div>
      </div>

      {/* Controls */}
      <div className="mt-4 flex flex-col sm:flex-row gap-4 justify-center">
        {phase === 'idle' && (
          <button
            onClick={handleStartCoaching}
            disabled={!camReady}
            className="px-8 py-3 bg-accent-green hover:bg-green-500 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
          >
            ▶ Start Coaching
          </button>
        )}
        {phase === 'demo' && (
          <button
            onClick={handleSkipDemo}
            className="px-8 py-3 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-lg transition-all"
          >
            ▶▶ Skip Demo &amp; Start Now
          </button>
        )}
        {phase === 'coaching' && (
          <button
            onClick={handleStopCoaching}
            className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition-all"
          >
            ■ Stop Session
          </button>
        )}
      </div>

      {phase === 'demo' && (
        <p className="text-center text-slate-500 text-xs mt-2">
          The avatar will demonstrate the exercise 3 times at recorded speed, then coaching begins automatically.
        </p>
      )}
    </div>
  );
}
