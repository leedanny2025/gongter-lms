'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { CheckCircle, XCircle, BookOpen, Monitor, Type, AlignLeft } from 'lucide-react';
import WeekSelector from '@/components/WeekSelector';
import { DAY_LABELS, DAY_ORDER } from '@/lib/utils';

const CAT_ICONS = { computer: Monitor, textbook: BookOpen, vocabulary: Type, other: AlignLeft };
const CAT_LABELS = { computer: '컴퓨터', textbook: '교재', vocabulary: '단어', other: '기타' };
const CAT_COLORS = { computer: '#6366f1', textbook: '#3b82f6', vocabulary: '#22c55e', other: '#f59e0b' };

export default function HomeworkPage() {
  const { state, dispatch } = useStore();
  const [week, setWeek] = useState(state.currentWeek);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const weekHW = state.dayHomeworks.filter(h => h.week === week);
  const filtered = weekHW.filter(h => filter === 'all' || h.status === filter);

  const counts = {
    all: weekHW.length,
    pending: weekHW.filter(h => h.status === 'pending').length,
    approved: weekHW.filter(h => h.status === 'approved').length,
    rejected: weekHW.filter(h => h.status === 'rejected').length,
  };

  const selected = selectedId ? state.dayHomeworks.find(h => h.id === selectedId) : null;

  const approve = (id: string) => { dispatch({ type: 'APPROVE_HOMEWORK', payload: id }); };
  const reject = (id: string) => { dispatch({ type: 'REJECT_HOMEWORK', payload: id }); };

  const hasContent = (hw: typeof filtered[0]) =>
    hw.computer || hw.textbook || hw.vocabulary || hw.other;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>숙제 승인 관리</h1>
          <p style={{ color: '#64748b', marginTop: 2, fontSize: 13 }}>요일별·카테고리별 숙제 확인 및 승인</p>
        </div>
        <WeekSelector week={week} onChange={setWeek} />
      </div>

      {/* 필터 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {([
          { key: 'all', label: '전체', color: '#64748b' },
          { key: 'pending', label: '대기중', color: '#f59e0b' },
          { key: 'approved', label: '승인됨', color: '#22c55e' },
          { key: 'rejected', label: '반려됨', color: '#ef4444' },
        ] as const).map(({ key, label, color }) => (
          <button key={key} onClick={() => setFilter(key)} style={{
            padding: '7px 14px', borderRadius: 20, border: '1px solid',
            borderColor: filter === key ? color : '#e2e8f0',
            background: filter === key ? color + '15' : 'white',
            color: filter === key ? color : '#64748b',
            fontWeight: filter === key ? 700 : 400, cursor: 'pointer', fontSize: 13,
          }}>
            {label} ({counts[key]})
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: 16, alignItems: 'start' }}>
        {/* 목록 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {DAY_ORDER.map(day => {
            const dayItems = filtered.filter(h => h.day === day);
            if (dayItems.length === 0) return null;
            return (
              <div key={day}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6, paddingLeft: 4 }}>{DAY_LABELS[day]}요일</div>
                {dayItems.map(hw => (
                  <div key={hw.id} onClick={() => setSelectedId(selectedId === hw.id ? null : hw.id)}
                    style={{
                      background: 'white', borderRadius: 14, padding: '14px 16px', marginBottom: 8, cursor: 'pointer',
                      border: `2px solid ${selectedId === hw.id ? '#6366f1' : '#e2e8f0'}`,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#1e40af' }}>
                          {hw.studentName[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{hw.studentName}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>
                            {new Date(hw.submittedAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                      <span className={`badge badge-${hw.status}`}>
                        {hw.status === 'pending' ? '대기' : hw.status === 'approved' ? '승인' : '반려'}
                      </span>
                    </div>
                    {/* 카테고리 요약 */}
                    <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                      {(['computer', 'textbook', 'vocabulary', 'other'] as const).map(cat => hw[cat] ? (
                        <span key={cat} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: CAT_COLORS[cat] + '15', color: CAT_COLORS[cat], fontWeight: 600 }}>
                          {CAT_LABELS[cat]}
                        </span>
                      ) : null)}
                    </div>
                    {/* 빠른 승인 */}
                    {hw.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 12 }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => approve(hw.id)} style={{ flex: 1, padding: '8px', borderRadius: 8, border: 'none', background: '#d1fae5', color: '#15803d', cursor: 'pointer', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                          <CheckCircle size={14} /> 승인
                        </button>
                        <button onClick={() => reject(hw.id)} style={{ flex: 1, padding: '8px', borderRadius: 8, border: 'none', background: '#fee2e2', color: '#991b1b', cursor: 'pointer', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                          <XCircle size={14} /> 반려
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>이번 주 제출된 숙제가 없습니다</div>
          )}
        </div>

        {/* 상세 */}
        {selected && (
          <div className="card" style={{ position: 'sticky', top: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 18 }}>{selected.studentName}</div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>
                  {DAY_LABELS[selected.day]}요일 숙제 · {new Date(selected.submittedAt).toLocaleString('ko-KR')}
                </div>
              </div>
              <span className={`badge badge-${selected.status}`}>
                {selected.status === 'pending' ? '대기중' : selected.status === 'approved' ? '승인됨' : '반려됨'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(['computer', 'textbook', 'vocabulary', 'other'] as const).map(cat => {
                const Icon = CAT_ICONS[cat];
                return (
                  <div key={cat} style={{ borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <div style={{ padding: '8px 14px', background: CAT_COLORS[cat] + '12', display: 'flex', alignItems: 'center', gap: 7 }}>
                      <Icon size={14} color={CAT_COLORS[cat]} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: CAT_COLORS[cat] }}>{CAT_LABELS[cat]}</span>
                    </div>
                    <div style={{ padding: '10px 14px', fontSize: 14, color: selected[cat] ? '#374151' : '#cbd5e1', minHeight: 40, lineHeight: 1.6 }}>
                      {selected[cat] || '미입력'}
                    </div>
                  </div>
                );
              })}
            </div>

            {selected.status === 'pending' && (
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button onClick={() => approve(selected.id)} style={{ flex: 1, padding: '12px', borderRadius: 10, border: 'none', background: '#22c55e', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <CheckCircle size={18} /> 승인
                </button>
                <button onClick={() => reject(selected.id)} style={{ flex: 1, padding: '12px', borderRadius: 10, border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <XCircle size={18} /> 반려
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
