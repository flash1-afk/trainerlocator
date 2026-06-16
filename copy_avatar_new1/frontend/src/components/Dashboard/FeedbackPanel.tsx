'use client';

import { useRef, useEffect } from 'react';
import type { CoachFeedback } from '@shared/types';

interface Props { feedbackLog: CoachFeedback[]; }

const severityIcon = (s: string) =>
  s === 'correct' ? '✓' : s === 'warning' ? '⚠' : '✗';

const severityColor = (s: string) =>
  s === 'correct' ? 'text-accent-green' : s === 'warning' ? 'text-accent-yellow' : 'text-accent-red';

const severityBg = (s: string) =>
  s === 'correct' ? 'bg-green-900/30' : s === 'warning' ? 'bg-yellow-900/30' : 'bg-red-900/30';

export function FeedbackPanel({ feedbackLog }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [feedbackLog.length]);

  // Oldest first (top → bottom), newest at bottom
  const recent = feedbackLog.slice(-20);

  return (
    <div className="glass flex-1 p-3 overflow-y-auto" style={{ maxHeight: 280 }}>
      <div className="text-xs text-slate-500 uppercase tracking-widest mb-2">Live Feedback</div>
      {recent.length === 0 ? (
        <div className="text-slate-600 text-sm text-center mt-6">
          Feedback will appear here once coaching starts.
        </div>
      ) : (
        recent.map((fb, i) => {
          const isNewest = i === recent.length - 1;
          return (
            <div
              key={fb.id}
              className={`flex items-start gap-2 mb-1.5 rounded-lg transition-all ${
                isNewest
                  ? `px-3 py-2 ${severityBg(fb.severity)}`
                  : 'px-1 py-0.5 opacity-50'
              }`}
            >
              <span className={`font-bold shrink-0 mt-0.5 ${severityColor(fb.severity)} ${isNewest ? 'text-base' : 'text-xs'}`}>
                {severityIcon(fb.severity)}
              </span>
              <span className={`${severityColor(fb.severity)} ${isNewest ? 'text-sm font-medium' : 'text-xs'}`}>
                {fb.message}
              </span>
            </div>
          );
        })
      )}
      <div ref={bottomRef} />
    </div>
  );
}
