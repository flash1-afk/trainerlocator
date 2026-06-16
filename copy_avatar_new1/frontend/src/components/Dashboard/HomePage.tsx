'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import type { Exercise } from '@shared/types';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

const CATEGORIES = ['strength','cardio','yoga','martial_arts','boxing','stretching','dance','custom'];
const DIFFICULTIES = ['beginner','intermediate','advanced'];

function AddExerciseModal({ onClose, onCreated }: { onClose: () => void; onCreated: (ex: Exercise) => void }) {
  const [name,        setName]        = useState('');
  const [category,    setCategory]    = useState('strength');
  const [difficulty,  setDifficulty]  = useState('beginner');
  const [description, setDescription] = useState('');
  const [saving,      setSaving]      = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const { data } = await axios.post(`${API}/api/exercises`, {
        name: name.trim(), category, difficulty, description,
      });
      toast.success(`"${data.data.name}" added!`);
      onCreated(data.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Failed to create exercise');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass w-full max-w-md p-6 rounded-xl shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-white">New Exercise</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Name *</label>
            <input
              value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Bicep Curl"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-400"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Category</label>
              <select
                value={category} onChange={e => setCategory(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-400"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_',' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Difficulty</label>
              <select
                value={difficulty} onChange={e => setDifficulty(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-400"
              >
                {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Description (optional)</label>
            <textarea
              value={description} onChange={e => setDescription(e.target.value)}
              rows={2}
              placeholder="Brief description…"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-400 resize-none"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-slate-600 text-slate-400 hover:text-white text-sm transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving || !name.trim()}
              className="flex-1 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm transition-colors disabled:opacity-50">
              {saving ? 'Saving…' : 'Create Exercise'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function HomePage() {
  const { exercises, selectedExercise, setSelectedExercise, setMode, setExercises } = useAppStore();
  const [showModal, setShowModal] = useState(false);

  const categories = Array.from(new Set(exercises.map(e => e.category)));

  const handleExerciseCreated = (ex: Exercise) => {
    setExercises([...exercises, ex]);
    setSelectedExercise(ex);
    setShowModal(false);
  };

  return (
    <div className="min-h-screen flex flex-col p-6 max-w-5xl mx-auto">
      {showModal && (
        <AddExerciseModal
          onClose={() => setShowModal(false)}
          onCreated={handleExerciseCreated}
        />
      )}

      {/* Header */}
      <header className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 mb-3">
          <div className="w-3 h-3 rounded-full bg-brand-400 animate-pulse-slow" />
          <span className="text-brand-400 text-sm font-mono uppercase tracking-widest">AI-Powered</span>
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">Avatar Exercise Buddy</h1>
        <p className="text-slate-400 text-lg">Demonstrate an exercise to train the AI, then get real-time coaching on your form.</p>
      </header>

      {/* Exercise Selector */}
      <section className="glass p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-brand-300">Select Exercise</h2>
          <button
            onClick={() => setShowModal(true)}
            className="text-xs px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-medium transition-colors"
          >
            + New Exercise
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {exercises.map(ex => (
            <button
              key={ex.id}
              onClick={() => setSelectedExercise(ex)}
              className={`p-3 rounded-lg border text-left transition-all ${
                selectedExercise?.id === ex.id
                  ? 'border-brand-400 bg-brand-900/30 text-white'
                  : 'border-slate-700 bg-slate-800/30 text-slate-300 hover:border-brand-600 hover:text-white'
              }`}
            >
              <div className="font-medium text-sm">{ex.name}</div>
              <div className="text-xs text-slate-500 mt-1 capitalize">{ex.category} · {ex.difficulty}</div>
              {(ex as any).template_id && (
                <div className="text-xs text-accent-green mt-1">✓ Trained</div>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Mode Buttons */}
      {selectedExercise && (
        <section className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setMode('training')}
            className="glass p-6 text-left hover:border-brand-400 transition-all group"
          >
            <div className="text-3xl mb-3">🎬</div>
            <div className="font-bold text-lg text-white group-hover:text-brand-300">Training Mode</div>
            <div className="text-slate-400 text-sm mt-1">Demonstrate <span className="text-brand-300">{selectedExercise.name}</span> to teach the AI your form, timing, and range of motion.</div>
          </button>

          <button
            onClick={() => setMode('coaching')}
            disabled={!(selectedExercise as any).template_id}
            className="glass p-6 text-left hover:border-accent-green transition-all group disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <div className="text-3xl mb-3">🤖</div>
            <div className="font-bold text-lg text-white group-hover:text-accent-green">Coach Mode</div>
            <div className="text-slate-400 text-sm mt-1">
              {(selectedExercise as any).template_id
                ? `Get real-time AI feedback on your ${selectedExercise.name} form.`
                : 'Train this exercise first to enable coaching.'}
            </div>
          </button>
        </section>
      )}

      {!selectedExercise && (
        <div className="text-center text-slate-500 mt-10">
          <div className="text-5xl mb-4">☝️</div>
          <p>Select an exercise above to get started.</p>
        </div>
      )}

      {/* Footer hint */}
      <div className="mt-auto pt-8 text-center text-slate-600 text-xs">
        Pose detection runs locally in your browser • No video is uploaded
      </div>
    </div>
  );
}
