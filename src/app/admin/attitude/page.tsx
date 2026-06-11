'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { AttitudeRecord, AttitudeDollarSettings, AttitudeDollarTier } from '@/lib/types';
import { localDateStr, getWeekKey, getWeekDateRange, getPrevWeek, getNextWeek } from '@/lib/utils';
import { Save, Plus, Minus, CheckCircle, DollarSign, Lock, Unlock, ChevronLeft, ChevronRight, Settings, Undo2 } from 'lucide-react';

type Counts = { shadowing: number; learningAttitude: number; basicAttitude: number };
type Snapshot = { prevCounts: Counts; savedId: string; wasNew: boolean };

const CATS: { key: keyof Counts; label: string }[] = [
  { key: 'shadowing',        label: '쉐도잉' },
  { key: 'learningAttitude', label: '학습태도' },
  { key: 'basicAttitude',    label: '기본태도' },
];

const btnBase: React.CSSProperties = {
  width: 24, height: 24, minHeight: 'unset',
  borderRadius: 6, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};

function Counter({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flex: 1 }}>
      <span style={{ fontSize: 9, color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <button onClick={() => onChange(value - 1)} style={{ ...btnBase, border: '1.5px solid #e2e8f0', background: 'white' }}>
          <Minus size={9} />
        </button>
        <span style={{
          fontSize: 16, fontWeight: 800, minWidth: 20, textAlign: 'center',
          color: value > 0 ? '#6366f1' : value < 0 ? '#ef4444' : '#94a3b8',
        }}>{value}</span>
        <button onClick={() => onChange(value + 1)} style={{ ...btnBase, border: 'none', background: '#6366f1' }}>
          <Plus size={9} color="white" />
        </button>
      </div>
    </div>
  );
}

function TierBadge({ score, settings }: { score: number; settings: AttitudeDollarSettings }) {
  if (score <= 0) return <span style={{ fontSize: 11, color: '#94a3b8' }}>–</span>;
  const tier = score >= settings.tier1.minScore ? { n: 1, color: '#f59e0b', ...settings.tier1 }
    : score >= settings.tier2.minScore ? { n: 2, color: '#94a3b8', ...settings.tier2 }
    : score >= settings.tier3.minScore ? { n: 3, color: '#cd7c2f', ...settings.tier3 }
    : null;
  if (!tier) return <span style={{ fontSize: 11, color: '#94a3b8' }}>–</span>;
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: tier.color + '20', color: tier.color }}>
      {tier.n}단계 ${tier.dollars}
    </span>
  );
}

export default function AttitudePage() {
  const { state, dispatch } = useStore();
  const [tab, setTab] = useState<'daily' | 'weekly'>('daily');
  const [today] = useState(localDateStr());
  const [viewWeek, setViewWeek] = useState(getWeekKey());
  const [counts, setCounts] = useState<Record<string, Counts>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [snapshots, setSnapshots] = useState<Record<string, Snapshot>>({});
  const [showSettings, setShowSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState<AttitudeDollarSettings>(state.attitudeDollarSettings);
  const [awarded, setAwarded] = useState<Record<string, boolean>>({});
  const [classFilter, setClassFilter] = useState('전체');
  const [summaryScope, setSummaryScope] = useState<'week' | 'month' | 'all'>('week');

  const week = getWeekKey();
  const { label: weekLabel } = getWeekDateRange(viewWeek);
  const classGroups = ['전체', ...new Set(state.students.map(s => s.classGroup))];
  const filteredStudents = classFilter === '전체' ? state.students : state.students.filter(s => s.classGroup === classFilter);

  const getPositive = (studentId: string, w?: string, month?: string) => {
    let records = (state.attitudeRecords || []).filter(r => r.studentId === studentId);
    if (w) records = records.filter(r => r.week === w);
    if (month) {
      const monthDate = getWeekDateRange(month).start;
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
      records = records.filter(r => {
        const rDate = getWeekDateRange(r.week).start;
        return rDate >= monthStart && rDate <= monthEnd;
      });
    }
    return records.reduce((sum, r) => sum + Math.max(0, r.shadowing) + Math.max(0, r.learningAttitude) + Math.max(0, r.basicAttitude), 0);
  };

  const getNegative = (studentId: string, w?: string, month?: string) => {
    let records = (state.attitudeRecords || []).filter(r => r.studentId === studentId);
    if (w) records = records.filter(r => r.week === w);
    if (month) {
      const monthDate = getWeekDateRange(month).start;
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
      records = records.filter(r => {
        const rDate = getWeekDateRange(r.week).start;
        return rDate >= monthStart && rDate <= monthEnd;
      });
    }
    return records.reduce((sum, r) => sum + Math.min(0, r.shadowing) + Math.min(0, r.learningAttitude) + Math.min(0, r.basicAttitude), 0);
  };

  useEffect(() => {
    setSettingsForm(state.attitudeDollarSettings);
  }, [state.attitudeDollarSettings]);

  useEffect(() => {
    const init: Record<string, Counts> = {};
    state.students.forEach(s => {
      const r = (state.attitudeRecords || []).find(a => a.studentId === s.id && a.date === today);
      init[s.id] = r
        ? { shadowing: r.shadowing, learningAttitude: r.learningAttitude, basicAttitude: r.basicAttitude }
        : { shadowing: 0, learningAttitude: 0, basicAttitude: 0 };
    });
    setCounts(init);
  }, [state.students, state.attitudeRecords, today]);

  const change = (studentId: string, field: keyof Counts, value: number) => {
    setCounts(prev => ({ ...prev, [studentId]: { ...prev[studentId], [field]: value } }));
    setSaved(prev => ({ ...prev, [studentId]: false }));
  };

  const save = (studentId: string) => {
    const student = state.students.find(s => s.id === studentId);
    if (!student) return;
    const existing = (state.attitudeRecords || []).find(r => r.studentId === studentId && r.date === today);
    const c = counts[studentId] ?? { shadowing: 0, learningAttitude: 0, basicAttitude: 0 };
    const prevCounts: Counts = existing
      ? { shadowing: existing.shadowing, learningAttitude: existing.learningAttitude, basicAttitude: existing.basicAttitude }
      : { shadowing: 0, learningAttitude: 0, basicAttitude: 0 };
    let savedId: string;
    if (existing) {
      savedId = existing.id;
      dispatch({ type: 'UPDATE_ATTITUDE', payload: { ...existing, ...c } });
    } else {
      savedId = `att${Date.now()}_${studentId}`;
      dispatch({ type: 'ADD_ATTITUDE', payload: {
        id: savedId, studentId, studentName: student.name, week, date: today, ...c,
      } as AttitudeRecord });
    }
    setSnapshots(prev => ({ ...prev, [studentId]: { prevCounts, savedId, wasNew: !existing } }));
    setSaved(prev => ({ ...prev, [studentId]: true }));
  };

  const undo = (studentId: string) => {
    const snap = snapshots[studentId];
    if (!snap) return;
    if (snap.wasNew) {
      dispatch({ type: 'DELETE_ATTITUDE', payload: snap.savedId });
      setCounts(prev => ({ ...prev, [studentId]: { shadowing: 0, learningAttitude: 0, basicAttitude: 0 } }));
    } else {
      const existing = (state.attitudeRecords || []).find(r => r.id === snap.savedId);
      if (existing) dispatch({ type: 'UPDATE_ATTITUDE', payload: { ...existing, ...snap.prevCounts } });
      setCounts(prev => ({ ...prev, [studentId]: snap.prevCounts }));
    }
    setSaved(prev => ({ ...prev, [studentId]: false }));
    setSnapshots(prev => { const n = { ...prev }; delete n[studentId]; return n; });
  };

  const saveAll = () => filteredStudents.forEach(s => save(s.id));

  // 주간 합산 계산
  const getWeeklyTotal = (studentId: string, w: string) =>
    (state.attitudeRecords || [])
      .filter(r => r.studentId === studentId && r.week === w)
      .reduce((sum, r) => sum + r.shadowing + r.learningAttitude + r.basicAttitude, 0);

  const getDollarTier = (score: number) => {
    const s = state.attitudeDollarSettings;
    if (score >= s.tier1.minScore) return { n: 1, dollars: s.tier1.dollars, color: '#f59e0b' };
    if (score >= s.tier2.minScore) return { n: 2, dollars: s.tier2.dollars, color: '#94a3b8' };
    if (score >= s.tier3.minScore) return { n: 3, dollars: s.tier3.dollars, color: '#cd7c2f' };
    return null;
  };

  const awardDollar = (studentId: string) => {
    const score = getWeeklyTotal(studentId, viewWeek);
    const tier = getDollarTier(score);
    if (!tier) return;
    dispatch({ type: 'AWARD_DOLLARS', payload: { studentId, amount: tier.dollars, reason: `태도 점수 ${viewWeek} (${score}점 → ${tier.n}단계)` } });
    setAwarded(prev => ({ ...prev, [studentId]: true }));
  };

  const saveSettings = () => {
    dispatch({ type: 'SET_ATTITUDE_SETTINGS', payload: settingsForm });
    setShowSettings(false);
  };

  const setSF = (tier: 'tier1' | 'tier2' | 'tier3', field: keyof AttitudeDollarTier, val: number) => {
    setSettingsForm(f => ({ ...f, [tier]: { ...f[tier], [field]: val } }));
  };

  const isLocked = state.attitudeDollarSettings.locked;

  return (
    <div>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>태도 점수</h1>
          <p style={{ color: '#64748b', marginTop: 2, fontSize: 12 }}>{today}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowSettings(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 12px', borderRadius: 10, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 13, minHeight: 'unset' }}>
            <Settings size={14} /> 달러 설정
          </button>
          <button
            onClick={() => { if (confirm('이번 주 태도 점수를 모두 초기화할까요?')) dispatch({ type: 'RESET_ATTITUDE' }); }}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 12px', borderRadius: 10, border: '1px solid #fecaca', background: '#fef2f2', cursor: 'pointer', fontWeight: 600, fontSize: 13, minHeight: 'unset', color: '#ef4444' }}>
            주간 초기화
          </button>
          {tab === 'daily' && (
            <button onClick={saveAll} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 14px', borderRadius: 10, border: 'none', background: '#6366f1', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: 13, minHeight: 'unset' }}>
              <Save size={14} /> 전체 저장
            </button>
          )}
        </div>
      </div>

      {/* 반 필터 */}
      {classGroups.length > 2 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
          {classGroups.map(cls => (
            <button key={cls} onClick={() => setClassFilter(cls)} style={{
              padding: '5px 12px', borderRadius: 20, border: '1px solid', minHeight: 'unset',
              borderColor: classFilter === cls ? '#6366f1' : '#e2e8f0',
              background: classFilter === cls ? '#eff0ff' : 'white',
              color: classFilter === cls ? '#6366f1' : '#64748b',
              fontWeight: classFilter === cls ? 700 : 400, fontSize: 12, cursor: 'pointer',
            }}>{cls}</button>
          ))}
        </div>
      )}

      {/* 탭 */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {[{ key: 'daily', label: '일별 기입' }, { key: 'weekly', label: '주간 합산 & 달러 지급' }].map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key as 'daily' | 'weekly')} style={{
            padding: '8px 14px', borderRadius: 20, border: '1px solid',
            borderColor: tab === key ? '#6366f1' : '#e2e8f0',
            background: tab === key ? '#eff0ff' : 'white',
            color: tab === key ? '#6366f1' : '#64748b',
            fontWeight: tab === key ? 700 : 400, fontSize: 13, cursor: 'pointer', minHeight: 'unset',
          }}>{label}</button>
        ))}
      </div>

      {/* 일별 기입 탭 */}
      {tab === 'daily' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {filteredStudents.map((student, i) => {
            const c = counts[student.id] ?? { shadowing: 0, learningAttitude: 0, basicAttitude: 0 };
            const isSaved = saved[student.id];
            return (
              <div key={student.id} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '10px 12px',
                borderBottom: i < state.students.length - 1 ? '1px solid #f1f5f9' : 'none',
                background: isSaved ? '#f0fdf4' : 'white',
                transition: 'background 0.3s',
              }}>
                <div style={{ width: 64, flexShrink: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{student.name}</div>
                  <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 1 }}>
                    {student.classGroup}
                    {(() => { const wp = getPositive(student.id, week); const wn = getNegative(student.id, week); return (wp > 0 || wn < 0) ? <span> ·{wp > 0 ? ` +${wp}` : ''}{wn < 0 ? ` ${wn}` : ''}</span> : null; })()}
                  </div>
                </div>
                <div style={{ flex: 1, display: 'flex', gap: 3 }}>
                  {CATS.map(({ key, label }) => (
                    <Counter key={key} label={label} value={c[key]} onChange={v => change(student.id, key, v)} />
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  {isSaved && (
                    <button onClick={() => undo(student.id)} title="되돌리기" style={{
                      width: 34, height: 34, minHeight: 'unset', borderRadius: 8, border: '1.5px solid #fca5a5',
                      background: '#fff1f2', color: '#ef4444',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Undo2 size={15} />
                    </button>
                  )}
                  <button onClick={() => save(student.id)} style={{
                    width: 34, height: 34, minHeight: 'unset', borderRadius: 8, border: 'none', flexShrink: 0,
                    background: isSaved ? '#dcfce7' : '#eff0ff',
                    color: isSaved ? '#16a34a' : '#6366f1',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {isSaved ? <CheckCircle size={16} /> : <Save size={15} />}
                  </button>
                </div>
              </div>
            );
          })}
          {state.students.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>등록된 학생이 없습니다</div>
          )}
        </div>
      )}

      {/* 주간 합산 & 달러 지급 탭 */}
      {tab === 'weekly' && (
        <div>
          {/* 주간 네비게이션 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, justifyContent: 'center' }}>
            <button onClick={() => setViewWeek(getPrevWeek(viewWeek))} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', minHeight: 'unset' }}>
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontWeight: 700, fontSize: 15 }}>{weekLabel}</span>
            <button onClick={() => setViewWeek(getNextWeek(viewWeek))} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', minHeight: 'unset' }}>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* 달러 기준 요약 */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {(['tier1', 'tier2', 'tier3'] as const).map((t, i) => {
              const tier = state.attitudeDollarSettings[t];
              const colors = ['#f59e0b', '#94a3b8', '#cd7c2f'];
              return (
                <div key={t} className="card" style={{ flex: 1, padding: '10px 12px', border: 'none', background: colors[i] + '15', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: colors[i], fontWeight: 700 }}>{i + 1}단계</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: colors[i] }}>${tier.dollars}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>≥{tier.minScore}점</div>
                </div>
              );
            })}
          </div>

          {/* 주간 / 전체 토글 */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {([{ key: 'week', label: '주간 누적' }, { key: 'month', label: '월간 누적' }, { key: 'all', label: '전체 누적' }] as const).map(({ key, label }) => (
              <button key={key} onClick={() => setSummaryScope(key)} style={{
                padding: '6px 14px', borderRadius: 20, border: '1px solid', minHeight: 'unset',
                borderColor: summaryScope === key ? '#6366f1' : '#e2e8f0',
                background: summaryScope === key ? '#eff0ff' : 'white',
                color: summaryScope === key ? '#6366f1' : '#64748b',
                fontWeight: summaryScope === key ? 700 : 400, fontSize: 12, cursor: 'pointer',
              }}>{label}</button>
            ))}
          </div>

          {/* 학생별 주간 합산 */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {filteredStudents.map((student, i) => {
              const total = getWeeklyTotal(student.id, viewWeek);
              const tier = getDollarTier(total);
              const isAwarded = awarded[student.id];
              const scopeWeek = summaryScope === 'week' ? viewWeek : undefined;
              const scopeMonth = summaryScope === 'month' ? viewWeek : undefined;
              const pos = getPositive(student.id, scopeWeek, scopeMonth);
              const neg = getNegative(student.id, scopeWeek, scopeMonth);
              return (
                <div key={student.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px',
                  borderBottom: i < filteredStudents.length - 1 ? '1px solid #f1f5f9' : 'none',
                  background: isAwarded ? '#f0fdf4' : 'white',
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{student.name}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{student.classGroup}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#16a34a' }}>+{pos}</div>
                      <div style={{ fontSize: 9, color: '#94a3b8' }}>플러스</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: neg < 0 ? '#ef4444' : '#94a3b8' }}>{neg}</div>
                      <div style={{ fontSize: 9, color: '#94a3b8' }}>마이너스</div>
                    </div>
                    <div style={{ textAlign: 'center', minWidth: 36 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: total > 0 ? '#6366f1' : '#94a3b8' }}>{total > 0 ? total : 0}</div>
                      <div style={{ fontSize: 9, color: '#94a3b8' }}>합계</div>
                    </div>
                  </div>
                  <div style={{ minWidth: 70, textAlign: 'center' }}>
                    <TierBadge score={total} settings={state.attitudeDollarSettings} />
                  </div>
                  <button
                    onClick={() => awardDollar(student.id)}
                    disabled={!tier || isAwarded}
                    style={{
                      padding: '8px 14px', borderRadius: 8, border: 'none', cursor: tier && !isAwarded ? 'pointer' : 'default',
                      background: isAwarded ? '#d1fae5' : tier ? '#6366f1' : '#f1f5f9',
                      color: isAwarded ? '#15803d' : tier ? 'white' : '#94a3b8',
                      fontWeight: 700, fontSize: 13, minHeight: 'unset', whiteSpace: 'nowrap',
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}
                  >
                    {isAwarded ? <><CheckCircle size={13} /> 지급됨</> : <><DollarSign size={13} /> {tier ? `$${tier.dollars} 지급` : '해당없음'}</>}
                  </button>
                </div>
              );
            })}
            {state.students.length === 0 && (
              <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>등록된 학생이 없습니다</div>
            )}
          </div>

          {/* 전체 지급 버튼 */}
          {filteredStudents.some(s => getDollarTier(getWeeklyTotal(s.id, viewWeek)) && !awarded[s.id]) && (
            <button
              onClick={() => filteredStudents.forEach(s => { if (getDollarTier(getWeeklyTotal(s.id, viewWeek)) && !awarded[s.id]) awardDollar(s.id); })}
              style={{ width: '100%', marginTop: 12, padding: '14px', borderRadius: 12, border: 'none', background: '#6366f1', color: 'white', cursor: 'pointer', fontWeight: 800, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 'unset' }}
            >
              <DollarSign size={18} /> 전체 달러 지급
            </button>
          )}
        </div>
      )}

      {/* 달러 설정 모달 */}
      {showSettings && (
        <div className="modal-backdrop">
          <div className="modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>태도 달러 설정</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => {
                    const locked = !settingsForm.locked;
                    setSettingsForm(f => ({ ...f, locked }));
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: settingsForm.locked ? '#fef3c7' : 'white', cursor: 'pointer', fontWeight: 600, fontSize: 12, minHeight: 'unset', color: settingsForm.locked ? '#92400e' : '#64748b' }}
                >
                  {settingsForm.locked ? <><Lock size={13} /> 고정됨</> : <><Unlock size={13} /> 고정 안됨</>}
                </button>
                <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20 }}>✕</button>
              </div>
            </div>

            {settingsForm.locked && (
              <div style={{ background: '#fef3c7', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#92400e', fontWeight: 600 }}>
                규칙이 고정되어 있습니다. 수정하려면 잠금을 해제하세요.
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {(['tier1', 'tier2', 'tier3'] as const).map((t, i) => {
                const colors = ['#f59e0b', '#94a3b8', '#cd7c2f'];
                const labels = ['1단계 (최고)', '2단계 (중간)', '3단계 (기본)'];
                return (
                  <div key={t} style={{ border: `2px solid ${colors[i]}30`, borderRadius: 12, padding: '14px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: colors[i], marginBottom: 10 }}>{labels[i]}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6, color: '#64748b' }}>최소 점수 (이상)</label>
                        <input
                          type="number"
                          value={settingsForm[t].minScore}
                          onChange={e => !settingsForm.locked && setSF(t, 'minScore', Number(e.target.value))}
                          disabled={settingsForm.locked}
                          style={{ padding: '8px 12px', fontSize: 16, fontWeight: 700, borderRadius: 8, textAlign: 'center', opacity: settingsForm.locked ? 0.5 : 1 }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6, color: '#64748b' }}>달러 지급액 ($)</label>
                        <input
                          type="number"
                          value={settingsForm[t].dollars}
                          onChange={e => !settingsForm.locked && setSF(t, 'dollars', Number(e.target.value))}
                          disabled={settingsForm.locked}
                          style={{ padding: '8px 12px', fontSize: 16, fontWeight: 700, borderRadius: 8, textAlign: 'center', color: colors[i], opacity: settingsForm.locked ? 0.5 : 1 }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 12, padding: '10px 14px', background: '#f8fafc', borderRadius: 8 }}>
              예시: 20점 이상 → $5, 10점 이상 → $3, 1점 이상 → $1
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowSettings(false)}>취소</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={saveSettings}>저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
