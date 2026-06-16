/**
 * PoseDetector — MoveNet (TF.js runtime, fully local, no CDN)
 *
 * MoveNet gives 17 keypoints. We map them into a 33-slot array that
 * matches the MediaPipe landmark indices used everywhere else in the app,
 * filling unused slots with visibility=0 so they're simply not drawn.
 *
 * MoveNet index → MediaPipe slot
 *  0 nose          →  0
 *  5 left_shoulder → 11
 *  6 right_shoulder→ 12
 *  7 left_elbow    → 13
 *  8 right_elbow   → 14
 *  9 left_wrist    → 15
 * 10 right_wrist   → 16
 * 11 left_hip      → 23
 * 12 right_hip     → 24
 * 13 left_knee     → 25
 * 14 right_knee    → 26
 * 15 left_ankle    → 27
 * 16 right_ankle   → 28
 */

import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import type { Landmark, PoseFrame, JointAngles } from '@shared/types';

export type OnFrameCallback = (frame: PoseFrame) => void;

// MoveNet index → MediaPipe 33-slot index
const MOVENET_TO_MP: Record<number, number> = {
  0:  0,   // nose
  5:  11,  // left_shoulder
  6:  12,  // right_shoulder
  7:  13,  // left_elbow
  8:  14,  // right_elbow
  9:  15,  // left_wrist
  10: 16,  // right_wrist
  11: 23,  // left_hip
  12: 24,  // right_hip
  13: 25,  // left_knee
  14: 26,  // right_knee
  15: 27,  // left_ankle
  16: 28,  // right_ankle
};

// Empty landmark placeholder for unused slots
const EMPTY_LM: Landmark = { x: 0, y: 0, z: 0, visibility: 0 };

export type DetectorStatus = 'idle' | 'loading' | 'ready' | 'error';

export class PoseDetector {
  private detector:      poseDetection.PoseDetector | null = null;
  private animFrame:     number | null = null;
  private videoEl:       HTMLVideoElement | null = null;
  private onFrame:       OnFrameCallback | null = null;
  private isRunning      = false;
  private prevLandmarks: Landmark[] | null = null;
  private prevTimestamp  = 0;
  private frameBuffer:   Landmark[][] = [];
  private tfReady        = false;
  public  status:        DetectorStatus = 'idle';
  public  statusText     = 'Waiting for pose…';

  async init(): Promise<void> {
    this.status     = 'loading';
    this.statusText = 'Loading AI model…';
    if (!this.tfReady) {
      await tf.ready();
      this.tfReady = true;
      console.log('[PoseDetector] TF.js backend:', tf.getBackend());
    }

    // LIGHTNING = ~12 MB, much faster to download than THUNDER (~29 MB)
    const model  = poseDetection.SupportedModels.MoveNet;
    const config: poseDetection.MoveNetModelConfig = {
      modelType:       poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
      enableSmoothing: true,
    };
    this.detector   = await poseDetection.createDetector(model, config);
    this.status     = 'ready';
    this.statusText = 'Active — stand in frame';
    console.log('[PoseDetector] MoveNet Lightning initialized');
  }

  async start(videoEl: HTMLVideoElement, onFrame: OnFrameCallback): Promise<void> {
    if (!this.detector) await this.init();
    this.videoEl   = videoEl;
    this.onFrame   = onFrame;
    this.isRunning = true;
    this._loop();
  }

  stop(): void {
    this.isRunning = false;
    if (this.animFrame !== null) {
      cancelAnimationFrame(this.animFrame);
      this.animFrame = null;
    }
  }

  dispose(): void {
    this.stop();
    this.detector?.dispose();
    this.detector = null;
  }

  private _loop(): void {
    if (!this.isRunning) return;
    this.animFrame = requestAnimationFrame(async () => {
      await this._processFrame();
      this._loop();
    });
  }

  private async _processFrame(): Promise<void> {
    if (!this.detector || !this.videoEl || !this.onFrame) return;
    if (this.videoEl.readyState < 2) return;

    try {
      const poses = await this.detector.estimatePoses(this.videoEl);
      if (!poses.length) return;

      const pose      = poses[0];
      const timestamp = performance.now();
      const vw        = this.videoEl.videoWidth  || 640;
      const vh        = this.videoEl.videoHeight || 480;

      // Build 33-slot array (MediaPipe layout) from 17 MoveNet keypoints
      const landmarks: Landmark[] = Array(33).fill(null).map(() => ({ ...EMPTY_LM }));
      for (let i = 0; i < pose.keypoints.length; i++) {
        const mpIdx = MOVENET_TO_MP[i];
        if (mpIdx === undefined) continue;
        const kp = pose.keypoints[i];
        landmarks[mpIdx] = {
          x:          kp.x / vw,   // normalize to 0-1
          y:          kp.y / vh,
          z:          0,
          visibility: kp.score ?? 0,
        };
      }

      const angles     = computeJointAngles(landmarks);
      const velocity   = this._computeVelocity(landmarks, timestamp);
      const smoothness = this._computeSmoothness(landmarks);

      const frame: PoseFrame = { timestamp, landmarks, angles, velocity, smoothness };

      this.prevLandmarks = landmarks;
      this.prevTimestamp = timestamp;
      this.frameBuffer.push(landmarks);
      if (this.frameBuffer.length > 10) this.frameBuffer.shift();

      this.onFrame(frame);
    } catch (err: any) {
      console.warn('[PoseDetector] frame error:', err?.message ?? err);
    }
  }

  private _computeVelocity(landmarks: Landmark[], timestamp: number): number {
    if (!this.prevLandmarks || !this.prevTimestamp) return 0;
    const dt = (timestamp - this.prevTimestamp) / 1000;
    if (dt <= 0) return 0;
    let total = 0, count = 0;
    for (let i = 0; i < landmarks.length; i++) {
      if ((landmarks[i].visibility ?? 0) < 0.3) continue;
      const dx = landmarks[i].x - this.prevLandmarks[i].x;
      const dy = landmarks[i].y - this.prevLandmarks[i].y;
      total += Math.sqrt(dx * dx + dy * dy);
      count++;
    }
    return count ? total / count / dt : 0;
  }

  private _computeSmoothness(landmarks: Landmark[]): number {
    if (this.frameBuffer.length < 3) return 1;
    const prev2 = this.frameBuffer[this.frameBuffer.length - 2];
    const prev1 = this.frameBuffer[this.frameBuffer.length - 1];
    let totalJerk = 0, count = 0;
    for (let i = 0; i < landmarks.length; i++) {
      if ((landmarks[i].visibility ?? 0) < 0.3) continue;
      const v1x = prev1[i].x - prev2[i].x;
      const v1y = prev1[i].y - prev2[i].y;
      const v2x = landmarks[i].x - prev1[i].x;
      const v2y = landmarks[i].y - prev1[i].y;
      totalJerk += Math.abs(v2x - v1x) + Math.abs(v2y - v1y);
      count++;
    }
    const avgJerk = count ? totalJerk / count : 0;
    return Math.max(0, Math.min(1, 1 - avgJerk * 50));
  }
}

// ─── Joint Angle Computation ──────────────────────────────────────────────────

function angleBetween(a: Landmark, b: Landmark, c: Landmark): number {
  if (!a || !b || !c) return 0;
  if ((a.visibility ?? 0) < 0.2 || (b.visibility ?? 0) < 0.2 || (c.visibility ?? 0) < 0.2) return 0;
  const bax = a.x - b.x, bay = a.y - b.y;
  const bcx = c.x - b.x, bcy = c.y - b.y;
  const dot  = bax * bcx + bay * bcy;
  const magA = Math.sqrt(bax ** 2 + bay ** 2);
  const magC = Math.sqrt(bcx ** 2 + bcy ** 2);
  if (!magA || !magC) return 0;
  return (Math.acos(Math.max(-1, Math.min(1, dot / (magA * magC)))) * 180) / Math.PI;
}

// Slot indices matching our MediaPipe mapping above
const S = {
  NOSE:  0,
  LS: 11, RS: 12,  // shoulders
  LE: 13, RE: 14,  // elbows
  LW: 15, RW: 16,  // wrists
  LH: 23, RH: 24,  // hips
  LK: 25, RK: 26,  // knees
  LA: 27, RA: 28,  // ankles
};

export function computeJointAngles(lm: Landmark[]): JointAngles {
  const g = (i: number) => lm[i] ?? EMPTY_LM;
  return {
    leftElbow:     angleBetween(g(S.LS), g(S.LE), g(S.LW)),
    rightElbow:    angleBetween(g(S.RS), g(S.RE), g(S.RW)),
    leftKnee:      angleBetween(g(S.LH), g(S.LK), g(S.LA)),
    rightKnee:     angleBetween(g(S.RH), g(S.RK), g(S.RA)),
    leftHip:       angleBetween(g(S.LS), g(S.LH), g(S.LK)),
    rightHip:      angleBetween(g(S.RS), g(S.RH), g(S.RK)),
    leftShoulder:  angleBetween(g(S.LE), g(S.LS), g(S.LH)),
    rightShoulder: angleBetween(g(S.RE), g(S.RS), g(S.RH)),
    leftAnkle:     angleBetween(g(S.LK), g(S.LA), EMPTY_LM),
    rightAnkle:    angleBetween(g(S.RK), g(S.RA), EMPTY_LM),
    spine:         angleBetween(g(S.LS), g(S.LH), g(S.LK)),
    neck:          angleBetween(g(S.LS), g(S.NOSE), g(S.RS)),
  };
}

export const poseDetectorInstance = new PoseDetector();
