'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Users, DollarSign, BookOpen, ClipboardCheck, Calendar, TrendingUp, Clock } from 'lucide-react';
import WeekSelector from '@/components/WeekSelector';
import { localDateStr, getWeekDateRange } from '@/lib/utils';

function StatCard({ title, value, sub, icon: Icon, color, href }: { title: string; value: string | number; sub: string; icon: React.ElementType; color: string; href?: string }) {
  const inner = (
    <div className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: 16, cursor: href ? 'pointer' : undefined, transition: href ? 'box-shadow 0.15s' : undefined }}>
      <div style={{ background: color + '20', borderRadius: 10, padding: 10, flexShrink: 0 }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>{value}</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{title}</div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 1 }}>{sub}</div>
      </div>
    </div>
  );
  if (href) return <a href={href} style={{ textDecoration: 'none', display: 'block' }}>{inner}</a>;
  return inner;
}

const GRID_ROW: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: '64px repeat(5, 1fr)', gap: 4, marginBottom: 5, alignItems: 'center',
};
const NAME_CELL: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
};

export default function AdminDashboard() {
  const { state, dispatch } = useStore();
  const [week, setWeek] = useState(state.currentWeek);

  const handleWeekChange = (w: string) => {
    setWeek(w);
    dispatch({ type: 'SET_WEEK', payload: w });
  };

  const todayStr = localDateStr();
  const weekHW = state.dayHomeworks.filter(h => h.week === week);
  const weekTests = state.testRecords.filter(t => t.week === week);
  const todayAtt = state.attendanceRecords.filter(a => a.date === todayStr);

  const pendingHW = weekHW.filter(h => h.status === 'pending').length;
  const pendingTests = weekTests.filter(t => t.status === 'pending').length;
  const totalDollars = state.students.reduce((s, x) => s + x.dollars, 0);

  // 이번 주 Mon–Fri 날짜 계산
  const { start: weekStart } = getWeekDateRange(week);
  const weekDates = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return localDateStr(d);
  });
  const weekAtt = state.attendanceRecords.filter(a => weekDates.includes(a.date));

  // 달러 계산
  const enabledConditions = state.dollarConditions.filter(c => c.enabled);
  const basicConditions = enabledConditions.filter(c => ['attendance', 'homework', 'test'].includes(c.type));
  const bonusConditions = enabledConditions.filter(c => ['attitude', 'custom'].includes(c.type));

  const conditionMet = (studentId: string, type: string): boolean => {
    if (type === 'attendance') return state.attendanceRecords.filter(a => a.studentId === studentId && a.status !== 'absent').length >= 2;
    if (type === 'homework') return state.dayHomeworks.some(h => h.studentId === studentId && h.week === week && h.status === 'approved');
    if (type === 'test') return state.testRecords.some(t => t.studentId === studentId && t.week === week && t.status === 'confirmed');
    if (type === 'attitude') {
      const score = (state.attitudeRecords || [])
        .filter(r => r.studentId === studentId && r.week === week)
        .reduce((sum, r) => sum + r.shadowing + r.learningAttitude + r.basicAttitude, 0);
      return score >= (state.attitudeDollarSettings.tier3.minScore || 1);
    }
    return false;
  };
  const calcWeeklyDollars = (studentId: string) =>
    enabledConditions.reduce((sum, c) => sum + (conditionMet(studentId, c.type) ? c.amount : 0), 0);

  const DAY_KO = ['월', '화', '수', '목', '금'];
  const DAYS_HW = ['mon', 'tue', 'wed', 'thu', 'fri'] as const;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>대시보드</h1>
          <p style={{ color: '#64748b', marginTop: 2, fontSize: 13 }}>
            {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
          </p>
        </div>
        <WeekSelector week={week} onChange={handleWeekChange} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
        <StatCard title="전체 학생" value={state.students.length} sub="등록된 학생 수" icon={Users} color="#3b82f6" />
        <StatCard title="오늘 출석" value={todayAtt.length} sub={`/ ${state.students.length}명`} icon={Calendar} color="#22c55e" />
        <StatCard title="승인 대기" value={pendingHW + pendingTests} sub={`숙제 ${pendingHW} / 시험 ${pendingTests}`} icon={Clock} color="#f59e0b" href="/admin/homework" />
        <StatCard title="총 달러" value={`$${totalDollars}`} sub="전체 지급 누계" icon={DollarSign} color="#8b5cf6" />
      </div>

      <div className="m-col-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

        {/* ── 이번 주 숙제 현황 ── */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <BookOpen size={16} color="#3b82f6" /> 이번 주 숙제 현황
            </h3>
            <a href="/admin/homework" style={{ fontSize: 12, color: '#6366f1', textDecoration: 'none' }}>전체 →</a>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '64px repeat(5, 1fr)', gap: 4, marginBottom: 6 }}>
            <div />
            {DAY_KO.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>{d}</div>
            ))}
          </div>
          {state.students.map(s => (
            <div key={s.id} style={GRID_ROW}>
              <div style={NAME_CELL}>{s.name}</div>
              {DAYS_HW.map(day => {
                const hasSchedule = (s.scheduleDays || []).length > 0;
                const isScheduled = !hasSchedule || (s.scheduleDays || []).includes(day);
                const hw = weekHW.find(h => h.studentId === s.id && h.day === day);
                if (!isScheduled && !hw) {
                  return <div key={day} style={{ textAlign: 'center', padding: '5px 2px', borderRadius: 6, background: '#f8fafc', fontSize: 12, color: '#e2e8f0' }}>–</div>;
                }
                const st = hw?.status;
                const cell = st === 'approved' || st === 'confirmed' ? { e: '✅', bg: '#d1fae5' }
                  : st === 'submitted' ? { e: '🔄', bg: '#dbeafe' }
                  : st === 'agreed'    ? { e: '📋', bg: '#eff0ff' }
                  : st === 'pending'   ? { e: '⏳', bg: '#fef3c7' }
                  : st === 'rejected'  ? { e: '❌', bg: '#fee2e2' }
                  : st === 'missed'    ? { e: '✗', bg: '#fed7aa' }
                  : st === 'no_hw'     ? { e: '없', bg: '#e0f2fe' }
                  : { e: '·', bg: '#f1f5f9' };
                return (
                  <div key={day} title={st || (isScheduled ? '미제출' : '보충')} style={{ textAlign: 'center', padding: '5px 2px', borderRadius: 6, background: !isScheduled ? '#e0f2fe' : cell.bg, fontSize: 14 }}>
                    {cell.e}
                  </div>
                );
              })}
            </div>
          ))}
          {state.students.length === 0 && <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: 16 }}>등록된 학생이 없습니다</div>}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10, paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
            {[['⏳','확인대기'],['📋','합의됨'],['🔄','완료확인'],['✅','완료'],['❌','반려'],['✗','미이행'],['없','숙제없음']].map(([e, l]) => (
              <span key={l} style={{ fontSize: 11, color: '#64748b' }}>{e} {l}</span>
            ))}
          </div>
        </div>

        {/* ── 이번 주 출석 현황 ── */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={16} color="#22c55e" /> 이번 주 출석 현황
            </h3>
            <a href="/admin/attendance" style={{ fontSize: 12, color: '#6366f1', textDecoration: 'none' }}>전체 →</a>
          </div>
          {/* 요일 헤더 (날짜 포함) */}
          <div style={{ display: 'grid', gridTemplateColumns: '64px repeat(5, 1fr)', gap: 4, marginBottom: 6 }}>
            <div />
            {DAY_KO.map((d, i) => (
              <div key={d} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>{d}</div>
                <div style={{ fontSize: 9, color: '#cbd5e1' }}>{weekDates[i]?.slice(5)}</div>
              </div>
            ))}
          </div>
          {state.students.map(s => (
            <div key={s.id} style={GRID_ROW}>
              <div style={NAME_CELL}>{s.name}</div>
              {weekDates.map((date, i) => {
                const dayKey = ['mon','tue','wed','thu','fri'][i];
                const hasSchedule = (s.scheduleDays || []).length > 0;
                const isScheduled = !hasSchedule || (s.scheduleDays || []).includes(dayKey);
                const rec = weekAtt.find(a => a.studentId === s.id && a.date === date);
                const prevRec = i > 0 ? weekAtt.find(a => a.studentId === s.id && a.date === weekDates[i - 1]) : null;
                const prevAbsent = prevRec?.status === 'absent';
                const isPast = date <= todayStr;

                if (!isScheduled && !rec) {
                  return (
                    <div key={date} style={{ textAlign: 'center', padding: '4px 2px', borderRadius: 6, background: '#f8fafc', fontSize: 11 }}>
                      <div style={{ color: '#e2e8f0' }}>–</div>
                    </div>
                  );
                }

                if (!rec) {
                  return (
                    <div key={date} style={{ textAlign: 'center', padding: '4px 2px', borderRadius: 6, background: '#f1f5f9', fontSize: 11 }}>
                      <div style={{ color: '#cbd5e1' }}>{isPast ? '·' : ''}</div>
                      {prevAbsent && <div style={{ fontSize: 8, fontWeight: 700, color: '#f59e0b' }}>전결</div>}
                    </div>
                  );
                }

                if (rec.status === 'present') {
                  return (
                    <div key={date} style={{ textAlign: 'center', padding: '4px 2px', borderRadius: 6, background: !isScheduled ? '#e0f2fe' : '#d1fae5', fontSize: 13 }}>
                      <div>{!isScheduled ? '보' : '✅'}</div>
                      {prevAbsent && <div style={{ fontSize: 8, fontWeight: 700, color: '#f59e0b' }}>전결</div>}
                    </div>
                  );
                }

                if (rec.status === 'late') {
                  let lateText = '지각';
                  const dayKey = ['mon','tue','wed','thu','fri'][i];
                  const schedTime = s.scheduleTimes?.[dayKey] || s.scheduleTime || '';
                  if (schedTime) {
                    const m = schedTime.match(/^(\d{1,2}):(\d{2})/);
                    if (m) {
                      const startMins = parseInt(m[1]) * 60 + parseInt(m[2]);
                      const parts = rec.checkInTime.split(':').map(Number);
                      const lateMins = Math.max(0, parts[0] * 60 + parts[1] - startMins);
                      if (lateMins > 0) lateText = `+${lateMins}분`;
                    }
                  }
                  return (
                    <div key={date} style={{ textAlign: 'center', padding: '3px 2px', borderRadius: 6, background: '#fef3c7', fontSize: 11 }}>
                      <div>⏰</div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: '#92400e' }}>{lateText}</div>
                      {prevAbsent && <div style={{ fontSize: 8, fontWeight: 700, color: '#f59e0b' }}>전결</div>}
                    </div>
                  );
                }

                // absent
                return (
                  <div key={date} style={{ textAlign: 'center', padding: '4px 2px', borderRadius: 6, background: '#fee2e2', fontSize: 13 }}>
                    ❌
                  </div>
                );
              })}
            </div>
          ))}
          {state.students.length === 0 && <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: 16 }}>등록된 학생이 없습니다</div>}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10, paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
            {[['✅','출석'],['⏰','지각(N분)'],['❌','결석'],['전결','전날 결석']].map(([e, l]) => (
              <span key={l} style={{ fontSize: 11, color: '#64748b' }}>{e} {l}</span>
            ))}
          </div>
        </div>

        {/* ── 이번 주 시험 현황 ── */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <ClipboardCheck size={16} color="#f59e0b" /> 이번 주 시험 현황
            </h3>
            <a href="/admin/tests" style={{ fontSize: 12, color: '#6366f1', textDecoration: 'none' }}>전체 →</a>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '64px repeat(5, 1fr)', gap: 4, marginBottom: 6 }}>
            <div />
            {DAY_KO.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>{d}</div>
            ))}
          </div>
          {state.students.map(s => (
            <div key={s.id} style={GRID_ROW}>
              <div style={NAME_CELL}>{s.name}</div>
              {DAYS_HW.map(day => {
                const test = weekTests.find(t => t.studentId === s.id && t.day === day);
                if (!test) {
                  return (
                    <div key={day} style={{ textAlign: 'center', padding: '4px 2px', borderRadius: 6, background: '#f1f5f9', fontSize: 11, color: '#cbd5e1' }}>·</div>
                  );
                }
                const confirmed = test.status === 'confirmed';
                const scoreText = test.score !== null ? `${test.score}개` : '-';
                return (
                  <div key={day} title={test.subject} style={{ textAlign: 'center', padding: '3px 2px', borderRadius: 6, background: confirmed ? '#d1fae5' : '#fef3c7', fontSize: 11 }}>
                    <div>{confirmed ? '✅' : '⏳'}</div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: confirmed ? '#15803d' : '#92400e' }}>{scoreText}</div>
                  </div>
                );
              })}
            </div>
          ))}
          {state.students.length === 0 && <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: 16 }}>등록된 학생이 없습니다</div>}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10, paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
            {[['⏳','확인대기'],['✅','확정']].map(([e, l]) => (
              <span key={l} style={{ fontSize: 11, color: '#64748b' }}>{e} {l}</span>
            ))}
          </div>
        </div>

        {/* ── 달러 현황 ── */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <TrendingUp size={16} color="#8b5cf6" /> 달러 현황
            </h3>
            <a href="/admin/dollars" style={{ fontSize: 12, color: '#6366f1', textDecoration: 'none' }}>지급 →</a>
          </div>

          {enabledConditions.length === 0 ? (
            <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: 20 }}>달러 조건을 설정해주세요</div>
          ) : (() => {
            const colTemplate = `72px 58px ${basicConditions.map(() => '1fr').join(' ')}${bonusConditions.length > 0 ? ' 4px ' + bonusConditions.map(() => '1fr').join(' ') : ''} 58px`;
            const headerStyle: React.CSSProperties = { fontSize: 10, fontWeight: 700, textAlign: 'center', color: '#94a3b8' };
            return (
              <>
                {/* 헤더 */}
                <div style={{ display: 'grid', gridTemplateColumns: colTemplate, gap: 4, marginBottom: 6, alignItems: 'end' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>학생</div>
                  <div style={{ ...headerStyle, color: '#7c3aed' }}>보유</div>
                  {basicConditions.map(c => <div key={c.id} style={{ ...headerStyle, color: '#0369a1' }}>{c.name}</div>)}
                  {bonusConditions.length > 0 && <div style={{ background: '#e2e8f0', borderRadius: 2 }} />}
                  {bonusConditions.map(c => <div key={c.id} style={{ ...headerStyle, color: '#7c3aed' }}>⭐{c.name}</div>)}
                  <div style={{ ...headerStyle, color: '#7c3aed' }}>이번주</div>
                </div>

                {/* 학생 행 */}
                {state.students.map(s => {
                  const weekly = calcWeeklyDollars(s.id);
                  return (
                    <div key={s.id} style={{ display: 'grid', gridTemplateColumns: colTemplate, gap: 4, marginBottom: 5, alignItems: 'center' }}>
                      <div style={NAME_CELL}>{s.name}</div>
                      <div style={{ textAlign: 'center', fontWeight: 800, fontSize: 13, color: '#7c3aed',
                        background: '#f3e8ff', borderRadius: 6, padding: '4px 2px' }}>
                        ${s.dollars}
                      </div>
                      {basicConditions.map(c => {
                        const met = conditionMet(s.id, c.type);
                        return (
                          <div key={c.id} style={{ textAlign: 'center', borderRadius: 6, padding: '4px 2px',
                            background: met ? '#d1fae5' : '#f1f5f9', fontSize: 11, fontWeight: 700,
                            color: met ? '#15803d' : '#cbd5e1' }}>
                            {met ? `+$${c.amount}` : '—'}
                          </div>
                        );
                      })}
                      {bonusConditions.length > 0 && <div />}
                      {bonusConditions.map(c => {
                        const met = conditionMet(s.id, c.type);
                        return (
                          <div key={c.id} style={{ textAlign: 'center', borderRadius: 6, padding: '4px 2px',
                            background: met ? '#f3e8ff' : '#f1f5f9', fontSize: 11, fontWeight: 700,
                            color: met ? '#7c3aed' : '#cbd5e1' }}>
                            {met ? `+$${c.amount}` : '—'}
                          </div>
                        );
                      })}
                      <div style={{ textAlign: 'center', borderRadius: 6, padding: '4px 2px',
                        background: weekly > 0 ? '#ede9fe' : '#f1f5f9',
                        fontWeight: 800, fontSize: 13, color: weekly > 0 ? '#7c3aed' : '#94a3b8' }}>
                        +${weekly}
                      </div>
                    </div>
                  );
                })}

                {/* 범례 */}
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 10, paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: 11, color: '#0369a1', fontWeight: 600 }}>📋 기본: {basicConditions.map(c => c.name).join(' · ')}</span>
                  {bonusConditions.length > 0 && (
                    <span style={{ fontSize: 11, color: '#7c3aed', fontWeight: 600 }}>⭐ 보너스: {bonusConditions.map(c => c.name).join(' · ')}</span>
                  )}
                </div>
              </>
            );
          })()}
        </div>

      </div>
    </div>
  );
}
