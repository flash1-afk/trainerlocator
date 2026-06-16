'use client';

import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

const chartDefaults = {
  responsive: true,
  plugins: {
    legend: { labels: { color: '#94a3b8', font: { size: 11 } } },
    tooltip: { backgroundColor: '#1e293b', titleColor: '#e2e8f0', bodyColor: '#94a3b8' },
  },
  scales: {
    x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(14,165,233,0.05)' } },
    y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(14,165,233,0.05)' }, min: 0, max: 100 },
  },
};

interface RepHistory {
  date:         string;
  exerciseName: string;
  score:        number;
  formScore:    number;
  tempoScore:   number;
}

export function ScoreHistoryChart({ history }: { history: RepHistory[] }) {
  const data = {
    labels:   history.map(h => h.date),
    datasets: [
      {
        label:           'Form Score',
        data:            history.map(h => h.formScore),
        borderColor:     '#0ea5e9',
        backgroundColor: 'rgba(14,165,233,0.1)',
        fill:            true,
        tension:         0.4,
      },
      {
        label:           'Tempo Score',
        data:            history.map(h => h.tempoScore),
        borderColor:     '#a855f7',
        backgroundColor: 'rgba(168,85,247,0.05)',
        fill:            false,
        tension:         0.4,
      },
    ],
  };
  return <Line data={data} options={chartDefaults as any} />;
}

export function ExerciseBreakdownChart({ breakdown }: { breakdown: { name: string; avgScore: number; totalReps: number }[] }) {
  const data = {
    labels:   breakdown.map(b => b.name),
    datasets: [{
      label:           'Avg Score',
      data:            breakdown.map(b => b.avgScore),
      backgroundColor: breakdown.map(b =>
        b.avgScore >= 80 ? 'rgba(34,197,94,0.7)' :
        b.avgScore >= 50 ? 'rgba(234,179,8,0.7)' :
                           'rgba(239,68,68,0.7)'
      ),
      borderRadius: 6,
    }],
  };
  return <Bar data={data} options={chartDefaults as any} />;
}
