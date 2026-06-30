'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { HomePage }     from '@/components/Dashboard/HomePage';
import { TrainingView } from '@/components/Dashboard/TrainingView';
import { CoachView }    from '@/components/Dashboard/CoachView';
import axios from 'axios';

const API = process.env.NODE_ENV === 'development' ? 'http://localhost:4000' : 'https://206f7aad-5914-4f94-952f-7ca67651ffda-00-cg7idyc9hp6e.sisko.replit.dev';

export default function Page() {
  const { mode, setExercises } = useAppStore();

  // Load exercises on mount
  useEffect(() => {
    axios.get(`${API}/api/exercises`)
      .then(r => setExercises(r.data.data))
      .catch(console.error);
  }, []);

  return (
    <main className="min-h-screen bg-dark-900">
      {mode === 'home'     && <HomePage />}
      {mode === 'training' && <TrainingView />}
      {mode === 'coaching' && <CoachView />}
    </main>
  );
}
