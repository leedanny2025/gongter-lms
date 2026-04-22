'use client';

import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { getWeekDateRange, getPrevWeek, getNextWeek, getWeekKey } from '@/lib/utils';

interface Props {
  week: string;
  onChange: (week: string) => void;
  compact?: boolean;
}

export default function WeekSelector({ week, onChange, compact = false }: Props) {
  const { label } = getWeekDateRange(week);
  const isCurrentWeek = week === getWeekKey();

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: compact ? 6 : 10,
      background: 'white', borderRadius: compact ? 10 : 12,
      border: '1px solid #e2e8f0', padding: compact ? '6px 10px' : '8px 14px',
    }}>
      <button onClick={() => onChange(getPrevWeek(week))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center', color: '#64748b' }}>
        <ChevronLeft size={compact ? 16 : 18} />
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: compact ? 110 : 130 }}>
        <Calendar size={compact ? 13 : 14} color="#6366f1" />
        <span style={{ fontSize: compact ? 13 : 14, fontWeight: 700, color: '#0f172a' }}>{label}</span>
        {isCurrentWeek && (
          <span style={{ fontSize: 10, background: '#eff0ff', color: '#6366f1', padding: '1px 6px', borderRadius: 10, fontWeight: 700 }}>이번주</span>
        )}
      </div>
      <button onClick={() => onChange(getNextWeek(week))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center', color: '#64748b' }}>
        <ChevronRight size={compact ? 16 : 18} />
      </button>
    </div>
  );
}
