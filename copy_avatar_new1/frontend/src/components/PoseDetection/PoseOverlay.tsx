'use client';

import { useRef, useEffect } from 'react';
import type { Landmark, JointName, FeedbackSeverity } from '@shared/types';

const CONNECTIONS: [number, number][] = [
  [11,12],[11,13],[13,15],[12,14],[14,16],
  [11,23],[12,24],[23,24],
  [23,25],[25,27],[24,26],[26,28],
  [0,11],[0,12],
];

const JOINT_INDICES: Partial<Record<number, JointName>> = {
  13: 'leftElbow', 14: 'rightElbow',
  25: 'leftKnee',  26: 'rightKnee',
  23: 'leftHip',   24: 'rightHip',
  11: 'leftShoulder', 12: 'rightShoulder',
};

const SEVERITY_COLOR: Record<string, string> = {
  correct: '#22c55e',
  warning: '#eab308',
  error:   '#ef4444',
};

interface Props {
  landmarks:  Landmark[];
  jointMap?:  Partial<Record<JointName, FeedbackSeverity>>;
}

export function PoseOverlay({ landmarks, jointMap = {} }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !landmarks.length) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // x is already mirrored because video is CSS-mirrored; landmarks stay raw
    const lx = (i: number) => landmarks[i].x * W;
    const ly = (i: number) => landmarks[i].y * H;

    // Bones
    ctx.lineWidth   = 2;
    ctx.strokeStyle = 'rgba(14,165,233,0.6)';
    for (const [a, b] of CONNECTIONS) {
      if (!landmarks[a] || !landmarks[b]) continue;
      if ((landmarks[a].visibility ?? 1) < 0.3 || (landmarks[b].visibility ?? 1) < 0.3) continue;
      ctx.beginPath();
      ctx.moveTo(lx(a), ly(a));
      ctx.lineTo(lx(b), ly(b));
      ctx.stroke();
    }

    // Joints
    for (let i = 0; i < landmarks.length; i++) {
      const vis = landmarks[i].visibility ?? 1;
      if (vis < 0.3) continue;
      const jointName = JOINT_INDICES[i];
      const severity  = jointName ? (jointMap[jointName] ?? 'correct') : 'correct';
      const color     = SEVERITY_COLOR[severity] ?? '#0ea5e9';
      ctx.beginPath();
      ctx.arc(lx(i), ly(i), jointName ? 7 : 3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
  }, [landmarks, jointMap]);

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={480}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
