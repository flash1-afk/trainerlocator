/**
 * useSocket
 * Manages the Socket.IO connection and emits/listens to server events.
 */
import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppStore } from '@/store/appStore';
import type { PoseFrame, CoachFeedback, RepResult } from '@shared/types';
import axios from 'axios';
import toast from 'react-hot-toast';

const envUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
const BACKEND_URL = (envUrl && envUrl.startsWith('http') ? envUrl : 'https://avatar-backend-orcin.vercel.app').replace(/\/$/, '');

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const store     = useAppStore();

  useEffect(() => {
    const socket = io(BACKEND_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect',    () => console.log('[Socket] Connected:', socket.id));
    socket.on('disconnect', () => console.log('[Socket] Disconnected'));

    // Training events
    socket.on('training:progress', ({ frameCount, repCount }: { frameCount: number; repCount: number }) => {
      useAppStore.getState().setTrainingProgress(frameCount, repCount);
    });

    // Server confirmed template was written to DB — now reload exercises
    // so template_id is populated and Coach button becomes clickable.
    socket.on('training:saved', async ({ repCount }: { repCount: number }) => {
      console.log('[Socket] Training saved. Reps:', repCount);
      try {
        const { data } = await axios.get(`${BACKEND_URL}/api/exercises`);
        useAppStore.getState().setExercises(data.data);
        toast.success(`Exercise saved! ${repCount} rep(s) recorded. You can now use Coach mode.`);
      } catch (err) {
        console.error('[Socket] Failed to reload exercises:', err);
      }
    });

    // Coaching events
    socket.on('coach:feedback', ({ feedback, repCount, score, jointMap, currentStep, totalSteps }: any) => {
      const s = useAppStore.getState();
      s.addFeedback(feedback as CoachFeedback[]);
      s.setRepCount(repCount);
      s.setCurrentScore(score);
      s.setJointMap(jointMap);
      if (totalSteps > 0) s.setStepInfo(currentStep, totalSteps);
    });

    // Joint colours at 500 ms — independent of the 5s message cooldown
    socket.on('coach:status', ({ jointMap, score }: any) => {
      const s = useAppStore.getState();
      s.setJointMap(jointMap);
      s.setCurrentScore(score);
    });

    socket.on('rep:complete', ({ repNumber, score, feedback }: any) => {
      useAppStore.getState().addRepResult({ repNumber, score, duration: 0, feedback, angles: {} } as RepResult);
    });

    socket.on('error', ({ message }: { message: string }) => {
      console.error('[Socket] Server error:', message);
      toast.error(message);
    });

    return () => { socket.disconnect(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const joinSession = useCallback((sessionId: string) => {
    socketRef.current?.emit('join:session', { sessionId });
  }, []);

  const startTraining = useCallback((sessionId: string, exerciseId: string) => {
    socketRef.current?.emit('training:start', { sessionId, exerciseId });
  }, []);

  const stopTraining = useCallback((sessionId: string) => {
    socketRef.current?.emit('training:stop', { sessionId });
  }, []);

  const startCoaching = useCallback((sessionId: string, exerciseId: string) => {
    socketRef.current?.emit('coaching:start', { sessionId, exerciseId });
  }, []);

  const stopCoaching = useCallback((sessionId: string) => {
    socketRef.current?.emit('coaching:stop', { sessionId });
  }, []);

  const sendPoseFrame = useCallback((sessionId: string, frame: PoseFrame) => {
    socketRef.current?.emit('pose:frame', { sessionId, frame });
  }, []);

  return { joinSession, startTraining, stopTraining, startCoaching, stopCoaching, sendPoseFrame };
}
