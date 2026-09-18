'use client';
import { useState } from 'react';
import { useStore } from './store';
// Follow the live week until the user explicitly browses another week.
export function useSelectedWeek(): [string, (week: string) => void] {
  const { state } = useStore();
  const [selection, setSelection] = useState<string | null>(null);
  return [selection ?? state.currentWeek, week => setSelection(week === state.currentWeek ? null : week)];
}
