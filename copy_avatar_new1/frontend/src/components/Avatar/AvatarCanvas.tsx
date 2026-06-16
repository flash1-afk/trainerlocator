'use client';

import { useRef, useEffect } from 'react';
import type { Landmark, JointName, JointAngles, FeedbackSeverity } from '@shared/types';

// MediaPipe slot indices (filled by MoveNet mapper)
const CONNECTIONS: [number, number][] = [
  [11,12], [11,13], [13,15],
  [12,14], [14,16],
  [11,23], [12,24], [23,24],
  [23,25], [25,27],
  [24,26], [26,28],
  [0,11],  [0,12],
];

// Key joints that have angles to display
const ANGLE_JOINTS: { mpIdx: number; name: JointName; label: string }[] = [
  { mpIdx: 13, name: 'leftElbow',     label: 'L.Elbow' },
  { mpIdx: 14, name: 'rightElbow',    label: 'R.Elbow' },
  { mpIdx: 25, name: 'leftKnee',      label: 'L.Knee'  },
  { mpIdx: 26, name: 'rightKnee',     label: 'R.Knee'  },
  { mpIdx: 23, name: 'leftHip',       label: 'L.Hip'   },
  { mpIdx: 24, name: 'rightHip',      label: 'R.Hip'   },
  { mpIdx: 11, name: 'leftShoulder',  label: 'L.Shldr' },
  { mpIdx: 12, name: 'rightShoulder', label: 'R.Shldr' },
];

const SEVERITY_COLOR: Record<string, string> = {
  correct: '#22c55e',
  warning: '#eab308',
  error:   '#ef4444',
};
const DEFAULT_JOINT_COLOR = '#0ea5e9';

// Draw only when visibility exceeds this — very low so we render anything detected
const VIS_THRESHOLD = 0.05;

interface Props {
  landmarks:  Landmark[] | null;
  angles?:    Partial<JointAngles>;
  jointMap?:  Partial<Record<JointName, FeedbackSeverity>>;
  label?:     string;
  status?:    string; // e.g. "Loading model…", "Active"
}

function drawFrame(
  canvas:   HTMLCanvasElement,
  lm:       Landmark[] | null,
  angles:   Partial<JointAngles>,
  jointMap: Partial<Record<JointName, FeedbackSeverity>>,
  status:   string,
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  // Dark background
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, W, H);

  // Subtle grid
  ctx.strokeStyle = 'rgba(14,165,233,0.06)';
  ctx.lineWidth   = 1;
  const step = Math.round(W / 10);
  for (let x = 0; x < W; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  // Status overlay when no landmarks
  const hasLandmarks = lm && lm.some(l => (l.visibility ?? 0) > VIS_THRESHOLD);
  if (!hasLandmarks) {
    ctx.fillStyle = '#475569';
    ctx.font      = `${Math.max(12, Math.round(W / 26))}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(status || 'Waiting for pose…', W / 2, H / 2 - 10);
    if (status && status !== 'Waiting for pose…') {
      ctx.fillStyle = '#64748b';
      ctx.font      = `${Math.max(10, Math.round(W / 36))}px system-ui, sans-serif`;
      ctx.fillText('Stand in frame to begin', W / 2, H / 2 + 16);
    }
    return;
  }

  // Mirror X (skeleton faces the user like a mirror)
  const lx = (i: number) => (1 - (lm![i]?.x ?? 0)) * W;
  const ly = (i: number) => (lm![i]?.y ?? 0) * H;
  const vis = (i: number) => lm![i]?.visibility ?? 0;

  // Bones
  ctx.lineWidth   = Math.max(2, W / 120);
  ctx.strokeStyle = '#334155';
  for (const [a, b] of CONNECTIONS) {
    if (!lm![a] || !lm![b]) continue;
    if (vis(a) < VIS_THRESHOLD || vis(b) < VIS_THRESHOLD) continue;
    ctx.beginPath();
    ctx.moveTo(lx(a), ly(a));
    ctx.lineTo(lx(b), ly(b));
    ctx.stroke();
  }

  // Joint dots
  const baseR = Math.max(5, W / 55);
  for (let i = 0; i < lm!.length; i++) {
    if (vis(i) < VIS_THRESHOLD) continue;
    const aj       = ANGLE_JOINTS.find(j => j.mpIdx === i);
    const severity = aj ? (jointMap[aj.name] ?? 'correct') : undefined;
    const color    = severity ? (SEVERITY_COLOR[severity] ?? DEFAULT_JOINT_COLOR) : DEFAULT_JOINT_COLOR;
    const r        = aj ? baseR : baseR * 0.55;

    ctx.beginPath();
    ctx.arc(lx(i), ly(i), r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // Glow ring on key joints
    if (aj) {
      ctx.beginPath();
      ctx.arc(lx(i), ly(i), r * 1.8, 0, Math.PI * 2);
      ctx.strokeStyle = color + '44';
      ctx.lineWidth   = 1.5;
      ctx.stroke();
    }
  }

  // Angle labels at key joints
  const fontSize = Math.max(9, Math.round(W / 38));
  ctx.font       = `bold ${fontSize}px system-ui, sans-serif`;
  ctx.textAlign  = 'center';

  for (const { mpIdx, name, label } of ANGLE_JOINTS) {
    if (!lm![mpIdx] || vis(mpIdx) < VIS_THRESHOLD) continue;
    const angle = angles[name];
    if (!angle || angle < 1) continue;

    const x  = lx(mpIdx);
    const y  = ly(mpIdx);
    const severity = jointMap[name] ?? 'correct';
    const color    = SEVERITY_COLOR[severity] ?? DEFAULT_JOINT_COLOR;

    // Small pill background
    const text = `${Math.round(angle)}°`;
    const tw   = ctx.measureText(text).width;
    const pad  = 3;
    const bx   = x - tw / 2 - pad;
    const by   = y - fontSize - baseR - 4;
    const bw   = tw + pad * 2;
    const bh   = fontSize + 4;

    ctx.fillStyle   = 'rgba(0,0,0,0.65)';
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 3);
    ctx.fill();

    ctx.fillStyle = color;
    ctx.fillText(text, x, by + bh - 3);
  }
}

export function AvatarCanvas({ landmarks, angles = {}, jointMap = {}, label, status }: Props) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const wrapperRef   = useRef<HTMLDivElement>(null);
  const landmarksRef = useRef(landmarks);
  const anglesRef    = useRef(angles);
  const jointMapRef  = useRef(jointMap);
  const statusRef    = useRef(status ?? 'Waiting for pose…');

  landmarksRef.current = landmarks;
  anglesRef.current    = angles;
  jointMapRef.current  = jointMap;
  statusRef.current    = status ?? 'Waiting for pose…';

  // Match canvas buffer size to CSS size via ResizeObserver
  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas  = canvasRef.current;
    if (!wrapper || !canvas) return;

    const ro = new ResizeObserver(entries => {
      for (const e of entries) {
        const { width, height } = e.contentRect;
        if (width > 0 && height > 0) {
          // Set buffer size = CSS size (no DPR scaling).
          // Keeps landmark coordinates correct: lx = (1-x)*W maps directly.
          canvas.width  = Math.round(width);
          canvas.height = Math.round(height);
          drawFrame(canvas, landmarksRef.current, anglesRef.current, jointMapRef.current, statusRef.current);
        }
      }
    });
    ro.observe(wrapper);
    return () => ro.disconnect();
  }, []);

  // Redraw on every new frame
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0) return;
    drawFrame(canvas, landmarks, angles, jointMap, status ?? 'Waiting for pose…');
  }, [landmarks, angles, jointMap, status]);

  return (
    <div ref={wrapperRef} className="relative w-full h-full bg-slate-900">
      <canvas ref={canvasRef} className="block w-full h-full" />
      {label && (
        <div className="absolute top-2 left-2 text-xs text-slate-600 font-mono select-none">
          {label}
        </div>
      )}
    </div>
  );
}

