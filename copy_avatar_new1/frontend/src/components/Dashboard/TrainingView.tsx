'use client';

import { useRef, useEffect, useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { useSocket }   from '@/hooks/useSocket';
import { AvatarCanvas } from '@/components/Avatar/AvatarCanvas';
import { poseDetectorInstance } from '@/lib/pose/poseDetector';
import axios from 'axios';
import toast from 'react-hot-toast';
import type { JointAngles } from '@shared/types';

const API = '';

export function TrainingView() {
  const store      = useAppStore();
  const socket     = useSocket();
  const videoRef      = useRef<HTMLVideoElement>(null);
  const streamRef     = useRef<MediaStream | null>(null);
  const [camReady,       setCamReady]       = useState(false);
  const [detectorStatus, setDetectorStatus] = useState('Waiting for pose…');
  const [countdown,      setCountdown]      = useState<number | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start webcam
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } })
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCamReady(true);
        }
      })
      .catch(() => toast.error('Camera access denied'));

    return () => {
      poseDetectorInstance.stop();
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  // Start pose detection once camera is ready.
  // Use useAppStore.getState() inside the callback to always read CURRENT
  // state — avoids the stale-closure problem where isRecording/sessionId
  // are frozen at the values they had when camReady first became true.
  useEffect(() => {
    if (!camReady || !videoRef.current) return;

    setDetectorStatus('Loading AI model…');
    poseDetectorInstance
      .start(videoRef.current, frame => {
        useAppStore.getState().setCurrentFrame(frame);
        setDetectorStatus(poseDetectorInstance.statusText);
        const { isRecording, sessionId } = useAppStore.getState();
        if (isRecording && sessionId) {
          socket.sendPoseFrame(sessionId, frame);
        }
      })
      .catch(err => {
        const msg = err?.message ?? 'Unknown error';
        setDetectorStatus(`Error: ${msg}`);
        toast.error(`Pose detection failed: ${msg}`);
      });
  }, [camReady]); // eslint-disable-line react-hooks/exhaustive-deps

  const beginRecording = async () => {
    if (!store.selectedExercise) return;
    try {
      const { data } = await axios.post(`${API}/api/sessions`, {
        exerciseId: store.selectedExercise.id,
        mode:       'training',
      });
      const sessionId = data.data.sessionId;
      store.setSessionId(sessionId);
      socket.joinSession(sessionId);
      socket.startTraining(sessionId, store.selectedExercise.id);
      store.setIsRecording(true);
      toast.success('Recording started — perform the exercise!');
    } catch {
      toast.error('Failed to start session');
    }
  };

  const handleStartRecording = () => {
    if (!store.selectedExercise || !camReady) return;
    setCountdown(3);
    let count = 3;
    countdownRef.current = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(countdownRef.current!);
        countdownRef.current = null;
        setCountdown(null);
        beginRecording();
      } else {
        setCountdown(count);
      }
    }, 1000);
  };

  const handleStopRecording = () => {
    if (!store.sessionId) return;
    socket.stopTraining(store.sessionId);
    store.setIsRecording(false);
    // Exercise list reload + success toast happen in useSocket's training:saved handler
    // once the server confirms the template was written to the DB.
  };

  const handleBack = () => {
    poseDetectorInstance.stop();
    streamRef.current?.getTracks().forEach(t => t.stop());
    store.resetSession();
    store.setMode('home');
  };

  const currentFrame = useAppStore(s => s.currentFrame);
  const angles       = (currentFrame?.angles ?? {}) as Partial<JointAngles>;

  return (
    <div className="min-h-screen flex flex-col p-4 max-w-6xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={handleBack} className="text-slate-400 hover:text-white text-sm">← Back</button>
        <div className="text-center">
          <h2 className="font-bold text-white text-lg">Training Mode</h2>
          <p className="text-brand-300 text-sm">{store.selectedExercise?.name}</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          {store.isRecording && (
            <span className="flex items-center gap-1 text-red-400">
              <span className="w-2 h-2 rounded-full bg-red-500 record-pulse" />
              REC
            </span>
          )}
        </div>
      </div>

      {/* Main grid — aspect-[4/3] matches webcam ratio so skeleton maps 1:1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Webcam — no skeleton overlay here */}
        <div className="glass relative overflow-hidden aspect-[4/3]">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover webcam-mirror"
          />
          {!camReady && (
            <div className="absolute inset-0 flex items-center justify-center text-slate-400">
              Starting camera…
            </div>
          )}
          {countdown !== null && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
              <div className="text-8xl font-bold text-white" style={{ textShadow: '0 0 40px rgba(139,92,246,0.8)' }}>
                {countdown}
              </div>
              <div className="text-slate-300 text-sm mt-3 uppercase tracking-widest">Get ready…</div>
            </div>
          )}
        </div>

        {/* Skeleton canvas — same ratio as webcam so joints map correctly */}
        <div className="glass overflow-hidden aspect-[4/3]">
          <AvatarCanvas
            landmarks={currentFrame?.landmarks ?? null}
            angles={angles}
            jointMap={store.jointMap}
            label="Your Skeleton"
            status={detectorStatus}
          />
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="glass p-4 text-center">
          <div className="text-2xl font-bold text-brand-300">{store.trainingRepCount}</div>
          <div className="text-xs text-slate-400 mt-1">
            {['yoga','stretching'].includes((store.selectedExercise as any)?.category)
              ? 'Holds Detected'
              : 'Reps Detected'}
          </div>
        </div>
        <div className="glass p-4 text-center">
          <div className="text-2xl font-bold text-brand-300">{store.trainingFrameCount}</div>
          <div className="text-xs text-slate-400 mt-1">Frames Captured</div>
        </div>
        <div className="glass p-4 text-center">
          <div className={`text-2xl font-bold ${store.isRecording ? 'text-red-400' : 'text-slate-500'}`}>
            {store.isRecording ? 'RECORDING' : 'READY'}
          </div>
          <div className="text-xs text-slate-400 mt-1">Status</div>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-4 flex gap-4 justify-center">
        {!store.isRecording ? (
          <button
            onClick={handleStartRecording}
            disabled={!camReady || countdown !== null}
            className="px-8 py-3 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
          >
            {countdown !== null ? `Starting in ${countdown}…` : '● Start Recording'}
          </button>
        ) : (
          <button
            onClick={handleStopRecording}
            className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition-all"
          >
            ■ Stop &amp; Save
          </button>
        )}
      </div>

      <p className="text-center text-slate-500 text-xs mt-3">
        Perform the exercise slowly and clearly. Aim for 5+ reps.
      </p>
    </div>
  );
}
