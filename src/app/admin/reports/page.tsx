'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { getWeekKey, getWeekDateRange, getPrevWeek, getNextWeek, DAY_LABELS, DAY_ORDER } from '@/lib/utils';
import { StudentReport } from '@/lib/types';
import { ChevronLeft, ChevronRight, Save, User, Calendar, BookOpen, ClipboardCheck, Star, DollarSign, MessageSquare } from 'lucide-react';

// ── helpers ─────────────────────────────────────────────────────────────────

function weekOfDate(dateStr: string): string {
  return getWeekKey(new Date(dateStr + 'T12:00:00'));
}

function getWeeksInMonth(monthKey: string): string[] {
  const [y, m] = monthKey.split('-').map(Number);
  const weeks = new Set<string>();
  const d = new Date(y, m - 1, 1);
  while (d.getMonth() === m - 1) {
    weeks.add(getWeekKey(new Date(d)));
    d.setDate(d.getDate() + 1);
  }
  return Array.from(weeks);
}

function recentMonths(n = 6): string[] {
  const out: string[] = [];
  const d = new Date();
  for (let i = 0; i < n; i++) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    out.push(`${y}-${m}`);
    d.setMonth(d.getMonth() - 1);
  }
  return out;
}

function monthLabel(mk: string): string {
  const [y, m] = mk.split('-');
  return `${y}년 ${Number(m)}월`;
}

const STATUS_COLOR: Record<string, { bg: string; color: string; label: string }> = {
  confirmed: { bg: '#d1fae5', color: '#15803d', label: '완료' },
  approved:  { bg: '#d1fae5', color: '#15803d', label: '완료' },
  missed:    { bg: '#fee2e2', color: '#991b1b', label: '미이행' },
  pending:   { bg: '#fef3c7', color: '#92400e', label: '합의 대기' },
  agreed:    { bg: '#eff0ff', color: '#4338ca', label: '진행중' },
  submitted: { bg: '#dbeafe', color: '#1e40af', label: '완료확인 대기' },
  rejected:  { bg: '#fee2e2', color: '#991b1b', label: '반려' },
  none:      { bg: '#f1f5f9', color: '#94a3b8', label: '미제출' },
};

const ATT_COLOR: Record<string, { bg: string; color: string; label: string }> = {
  present: { bg: '#d1fae5', color: '#15803d', label: '출석' },
  late:    { bg: '#fef3c7', color: '#92400e', label: '지각' },
  absent:  { bg: '#fee2e2', color: '#991b1b', label: '결석' },
  none:    { bg: '#f1f5f9', color: '#94a3b8', label: '–' },
};

// ── Shared teacher memo component ────────────────────────────────────────────

function TeacherMemo({ notes, requests, onChange, onSave, saved }:
  { notes: string; requests: string; onChange: (field: 'notes' | 'requests', v: string) => void; onSave: () => void; saved: boolean }) {
  return (
    <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <MessageSquare size={16} color="#6366f1" />
        <span style={{ fontSize: 15, fontWeight: 800, color: '#1e293b' }}>교사 메모</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 5 }}>특이 사항</label>
          <textarea
            value={notes}
            onChange={e => onChange('notes', e.target.value)}
            placeholder="이번 주 특이 사항을 기입하세요..."
            rows={3}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, fontFamily: 'inherit', lineHeight: 1.6, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
            onFocus={e => (e.target.style.borderColor = '#6366f1')}
            onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
          />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 5 }}>요청 사항</label>
          <textarea
            value={requests}
            onChange={e => onChange('requests', e.target.value)}
            placeholder="학부모/학생에게 요청할 사항을 기입하세요..."
            rows={3}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, fontFamily: 'inherit', lineHeight: 1.6, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
            onFocus={e => (e.target.style.borderColor = '#6366f1')}
            onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
          />
        </div>
      </div>
      <button
        onClick={onSave}
        style={{ marginTop: 14, padding: '10px 24px', borderRadius: 10, border: 'none', background: saved ? '#22c55e' : '#6366f1', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, minHeight: 'unset' }}>
        <Save size={15} /> {saved ? '저장됨 ✓' : '저장'}
      </button>
    </div>
  );
}

// ── Weekly report ─────────────────────────────────────────────────────────────

function WeeklyReport({ studentId, week }: { studentId: string; week: string }) {
  const { state, dispatch } = useStore();
  const student = state.students.find(s => s.id === studentId);
  if (!student) return null;

  const { label: weekLabel, start, end } = getWeekDateRange(week);

  // Attendance for this week
  const attRecs = state.attendanceRecords.filter(r =>
    r.studentId === studentId && weekOfDate(r.date) === week
  );

  // Homework for this week
  const hwRecs = state.dayHomeworks.filter(h => h.studentId === studentId && h.week === week);

  // Tests for this week
  const testRecs = state.testRecords.filter(t => t.studentId === studentId && t.week === week);

  // Attitude for this week
  const attitudeRecs = state.attitudeRecords.filter(a => a.studentId === studentId && a.week === week);

  const scheduledDays = (student.scheduleDays && student.scheduleDays.length > 0)
    ? student.scheduleDays
    : Array.from(new Set(state.students.flatMap(s => s.scheduleDays || [])));

  const totalPositive = attitudeRecs.reduce((sum, a) =>
    sum + Math.max(0, a.shadowing) + Math.max(0, a.learningAttitude) + Math.max(0, a.basicAttitude), 0);
  const totalNegative = attitudeRecs.reduce((sum, a) =>
    sum + Math.min(0, a.shadowing) + Math.min(0, a.learningAttitude) + Math.min(0, a.basicAttitude), 0);
  const attitudeNet = totalPositive + totalNegative;

  const presentDays = attRecs.filter(r => r.status === 'present' || r.status === 'late').length;
  const scheduledCount = scheduledDays.filter(d => DAY_ORDER.includes(d as typeof DAY_ORDER[number])).length;

  // Teacher memo
  const reportId = `report-${studentId}-weekly-${week}`;
  const existing = (state.reports || []).find(r => r.id === reportId);
  const [notes, setNotes] = useState(existing?.teacherNotes ?? '');
  const [requests, setRequests] = useState(existing?.teacherRequests ?? '');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    const report: StudentReport = {
      id: reportId,
      studentId,
      studentName: student.name,
      type: 'weekly',
      period: week,
      teacherNotes: notes,
      teacherRequests: requests,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    dispatch({ type: 'SAVE_REPORT', payload: report });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 학생 정보 */}
      <div style={{ background: 'white', borderRadius: 16, padding: '18px 20px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#eff0ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#6366f1', flexShrink: 0 }}>
          {student.name[0]}
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 18, color: '#1e293b' }}>{student.name}</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
            {student.classGroup} · {student.grade} · 달러 {student.dollars}$
          </div>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#6366f1' }}>{weekLabel}</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
            {start.getMonth() + 1}/{start.getDate()} ~ {end.getMonth() + 1}/{end.getDate()}
          </div>
        </div>
      </div>

      {/* 출석 현황 */}
      <div style={{ background: 'white', borderRadius: 16, padding: '18px 20px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Calendar size={16} color="#3b82f6" />
          <span style={{ fontSize: 15, fontWeight: 800, color: '#1e293b' }}>출석 현황</span>
          <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 700, color: presentDays >= scheduledCount ? '#15803d' : '#f59e0b' }}>
            {presentDays} / {scheduledCount}일
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {DAY_ORDER.map(day => {
            const isScheduled = scheduledDays.includes(day);
            if (!isScheduled) return null;
            const rec = attRecs.find(r => {
              const d = new Date(r.date + 'T12:00:00').getDay();
              const dayIdx = ['sun','mon','tue','wed','thu','fri','sat'].indexOf(day);
              return d === dayIdx;
            });
            const { bg, color, label } = rec ? ATT_COLOR[rec.status] : ATT_COLOR.none;
            return (
              <div key={day} style={{ textAlign: 'center', minWidth: 54 }}>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4, fontWeight: 600 }}>{DAY_LABELS[day as keyof typeof DAY_LABELS]}</div>
                <div style={{ padding: '5px 10px', borderRadius: 8, background: bg, color, fontSize: 12, fontWeight: 700 }}>{label}</div>
                {rec?.checkInTime && (
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>{rec.checkInTime}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 숙제 현황 */}
      <div style={{ background: 'white', borderRadius: 16, padding: '18px 20px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <BookOpen size={16} color="#22c55e" />
          <span style={{ fontSize: 15, fontWeight: 800, color: '#1e293b' }}>숙제 현황</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {DAY_ORDER.map(day => {
            const isScheduled = scheduledDays.includes(day);
            if (!isScheduled) return null;
            const hw = hwRecs.find(h => h.day === day);
            const { bg, color, label } = hw ? STATUS_COLOR[hw.status] ?? STATUS_COLOR.none : STATUS_COLOR.none;
            const cats = hw ? (['computer','textbook','vocabulary','other'] as const).filter(c => hw[c]) : [];
            const CAT_SHORT: Record<string, string> = { computer: '컴퓨터', textbook: '교재', vocabulary: '단어', other: '문법' };
            return (
              <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, background: '#f8fafc' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', minWidth: 28 }}>{DAY_LABELS[day as keyof typeof DAY_LABELS]}</span>
                <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: bg, color }}>{label}</span>
                {cats.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {cats.map(c => (
                      <span key={c} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: '#e2e8f0', color: '#475569', fontWeight: 600 }}>
                        {CAT_SHORT[c]}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 시험 현황 */}
      <div style={{ background: 'white', borderRadius: 16, padding: '18px 20px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <ClipboardCheck size={16} color="#f59e0b" />
          <span style={{ fontSize: 15, fontWeight: 800, color: '#1e293b' }}>시험 현황</span>
        </div>
        {testRecs.length === 0 ? (
          <div style={{ color: '#cbd5e1', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>이번 주 시험 없음</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {testRecs.map(t => {
              const pct = t.score !== null && t.maxScore > 0 ? Math.round((t.score! / t.maxScore) * 100) : null;
              const pctColor = pct === null ? '#94a3b8' : pct >= 90 ? '#15803d' : pct >= 70 ? '#4338ca' : '#991b1b';
              return (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, background: '#f8fafc' }}>
                  <span style={{ fontWeight: 700, fontSize: 13, flex: 1 }}>{t.subject}</span>
                  {t.score !== null ? (
                    <>
                      <span style={{ fontWeight: 800, fontSize: 15, color: pctColor }}>{t.score}<span style={{ fontSize: 11, fontWeight: 400, color: '#94a3b8' }}>/{t.maxScore}</span></span>
                      <span style={{ fontWeight: 700, fontSize: 13, color: pctColor }}>{pct}%</span>
                    </>
                  ) : (
                    <span style={{ color: '#94a3b8', fontSize: 12 }}>채점 대기</span>
                  )}
                  <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 6, background: t.status === 'confirmed' ? '#d1fae5' : '#fef3c7', color: t.status === 'confirmed' ? '#15803d' : '#92400e', fontWeight: 700 }}>
                    {t.status === 'confirmed' ? '확인됨' : '대기'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 태도 점수 */}
      <div style={{ background: 'white', borderRadius: 16, padding: '18px 20px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Star size={16} color="#a855f7" />
          <span style={{ fontSize: 15, fontWeight: 800, color: '#1e293b' }}>태도 점수</span>
        </div>
        {attitudeRecs.length === 0 ? (
          <div style={{ color: '#cbd5e1', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>이번 주 태도 기록 없음</div>
        ) : (
          <div style={{ display: 'flex', gap: 12 }}>
            {[
              { label: '긍정 (+)', value: `+${totalPositive}`, color: '#15803d', bg: '#d1fae5' },
              { label: '부정 (–)', value: String(totalNegative), color: '#991b1b', bg: '#fee2e2' },
              { label: '합계', value: attitudeNet >= 0 ? `+${attitudeNet}` : String(attitudeNet), color: attitudeNet >= 0 ? '#15803d' : '#991b1b', bg: attitudeNet >= 0 ? '#f0fdf4' : '#fff5f5' },
            ].map(({ label, value, color, bg }) => (
              <div key={label} style={{ flex: 1, textAlign: 'center', background: bg, borderRadius: 12, padding: '12px 8px' }}>
                <div style={{ fontSize: 10, color, fontWeight: 700, marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 교사 메모 */}
      <TeacherMemo
        notes={notes}
        requests={requests}
        onChange={(f, v) => { if (f === 'notes') setNotes(v); else setRequests(v); setSaved(false); }}
        onSave={handleSave}
        saved={saved}
      />
    </div>
  );
}

// ── Monthly report ────────────────────────────────────────────────────────────

function MonthlyReport({ studentId, monthKey }: { studentId: string; monthKey: string }) {
  const { state, dispatch } = useStore();
  const student = state.students.find(s => s.id === studentId);
  if (!student) return null;

  const weeks = useMemo(() => getWeeksInMonth(monthKey), [monthKey]);

  const scheduledDays = (student.scheduleDays && student.scheduleDays.length > 0)
    ? student.scheduleDays
    : Array.from(new Set(state.students.flatMap(s => s.scheduleDays || [])));

  const scheduledCount = scheduledDays.filter(d => DAY_ORDER.includes(d as typeof DAY_ORDER[number])).length;

  // Aggregate per week
  const weekData = weeks.map(week => {
    const att = state.attendanceRecords.filter(r => r.studentId === studentId && weekOfDate(r.date) === week);
    const hw = state.dayHomeworks.filter(h => h.studentId === studentId && h.week === week);
    const tests = state.testRecords.filter(t => t.studentId === studentId && t.week === week);
    const attitude = state.attitudeRecords.filter(a => a.studentId === studentId && a.week === week);

    const presentDays = att.filter(r => r.status === 'present' || r.status === 'late').length;
    const hwDone = hw.filter(h => h.status === 'confirmed' || h.status === 'approved').length;
    const hwMissed = hw.filter(h => h.status === 'missed').length;
    const confirmedTests = tests.filter(t => t.status === 'confirmed' && t.score !== null);
    const avgScore = confirmedTests.length > 0
      ? Math.round(confirmedTests.reduce((s, t) => s + (t.score! / t.maxScore) * 100, 0) / confirmedTests.length)
      : null;
    const pos = attitude.reduce((s, a) => s + Math.max(0, a.shadowing) + Math.max(0, a.learningAttitude) + Math.max(0, a.basicAttitude), 0);
    const neg = attitude.reduce((s, a) => s + Math.min(0, a.shadowing) + Math.min(0, a.learningAttitude) + Math.min(0, a.basicAttitude), 0);

    return { week, presentDays, hwDone, hwMissed, avgScore, pos, neg, hwTotal: hw.length };
  });

  const totalPresent = weekData.reduce((s, w) => s + w.presentDays, 0);
  const totalScheduled = weekData.length * scheduledCount;
  const totalHwDone = weekData.reduce((s, w) => s + w.hwDone, 0);
  const totalHwAll = weekData.reduce((s, w) => s + w.hwTotal, 0);
  const allTests = state.testRecords.filter(t => t.studentId === studentId && t.status === 'confirmed' && t.score !== null && weeks.some(w => t.week === w));
  const monthAvgScore = allTests.length > 0
    ? Math.round(allTests.reduce((s, t) => s + (t.score! / t.maxScore) * 100, 0) / allTests.length)
    : null;
  const totalPos = weekData.reduce((s, w) => s + w.pos, 0);
  const totalNeg = weekData.reduce((s, w) => s + w.neg, 0);

  const attRate = totalScheduled > 0 ? Math.round((totalPresent / totalScheduled) * 100) : 0;
  const hwRate = totalHwAll > 0 ? Math.round((totalHwDone / totalHwAll) * 100) : 0;

  // Teacher memo
  const reportId = `report-${studentId}-monthly-${monthKey}`;
  const existing = (state.reports || []).find(r => r.id === reportId);
  const [notes, setNotes] = useState(existing?.teacherNotes ?? '');
  const [requests, setRequests] = useState(existing?.teacherRequests ?? '');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    const report: StudentReport = {
      id: reportId,
      studentId,
      studentName: student.name,
      type: 'monthly',
      period: monthKey,
      teacherNotes: notes,
      teacherRequests: requests,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    dispatch({ type: 'SAVE_REPORT', payload: report });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const STATS = [
    { icon: Calendar, label: '출석률', value: `${attRate}%`, sub: `${totalPresent}/${totalScheduled}일`, color: '#3b82f6' },
    { icon: BookOpen, label: '숙제 완료율', value: `${hwRate}%`, sub: `${totalHwDone}/${totalHwAll}건`, color: '#22c55e' },
    { icon: ClipboardCheck, label: '평균 시험', value: monthAvgScore !== null ? `${monthAvgScore}%` : '–', sub: `${allTests.length}회 응시`, color: '#f59e0b' },
    { icon: Star, label: '태도 합계', value: (totalPos + totalNeg) >= 0 ? `+${totalPos + totalNeg}` : String(totalPos + totalNeg), sub: `+${totalPos} / ${totalNeg}`, color: '#a855f7' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 학생 정보 */}
      <div style={{ background: 'white', borderRadius: 16, padding: '18px 20px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#f59e0b', flexShrink: 0 }}>
          {student.name[0]}
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 18, color: '#1e293b' }}>{student.name}</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
            {student.classGroup} · {student.grade} · 달러 {student.dollars}$
          </div>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#f59e0b' }}>{monthLabel(monthKey)}</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{weeks.length}주 분량</div>
        </div>
      </div>

      {/* 요약 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {STATS.map(({ icon: Icon, label, value, sub, color }) => (
          <div key={label} style={{ background: 'white', borderRadius: 14, padding: '14px 16px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
              <Icon size={14} color={color} />
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{label}</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* 주별 현황 테이블 */}
      <div style={{ background: 'white', borderRadius: 16, padding: '18px 20px', border: '1px solid #e2e8f0' }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#1e293b', marginBottom: 14 }}>주별 현황</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['주', '출석', '숙제', '시험 평균', '태도'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weekData.map(({ week, presentDays, hwDone, hwMissed, avgScore, pos, neg, hwTotal }) => {
                const { label: wLabel } = getWeekDateRange(week);
                const net = pos + neg;
                return (
                  <tr key={week} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', fontSize: 12 }}>{wLabel}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ fontWeight: 700, color: presentDays >= scheduledCount ? '#15803d' : '#f59e0b' }}>
                        {presentDays}/{scheduledCount}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ fontWeight: 700, color: hwMissed > 0 ? '#991b1b' : hwDone > 0 ? '#15803d' : '#94a3b8' }}>
                        {hwDone}완료{hwMissed > 0 ? ` / ${hwMissed}미이행` : ''}
                        {hwTotal === 0 && <span style={{ color: '#cbd5e1' }}>–</span>}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      {avgScore !== null ? (
                        <span style={{ fontWeight: 700, color: avgScore >= 90 ? '#15803d' : avgScore >= 70 ? '#4338ca' : '#991b1b' }}>
                          {avgScore}%
                        </span>
                      ) : <span style={{ color: '#cbd5e1' }}>–</span>}
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: net >= 0 ? '#15803d' : '#991b1b' }}>
                      {pos > 0 || neg < 0 ? (net >= 0 ? `+${net}` : String(net)) : <span style={{ color: '#cbd5e1' }}>–</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 교사 메모 */}
      <TeacherMemo
        notes={notes}
        requests={requests}
        onChange={(f, v) => { if (f === 'notes') setNotes(v); else setRequests(v); setSaved(false); }}
        onSave={handleSave}
        saved={saved}
      />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const { state } = useStore();
  const [selectedStudentId, setSelectedStudentId] = useState<string>(state.students[0]?.id ?? '');
  const [reportType, setReportType] = useState<'weekly' | 'monthly'>('weekly');
  const [week, setWeek] = useState(state.currentWeek);
  const [monthKey, setMonthKey] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const months = useMemo(() => recentMonths(12), []);
  const student = state.students.find(s => s.id === selectedStudentId);

  return (
    <div>
      {/* 헤더 */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>학생 리포트</h1>
        <p style={{ color: '#64748b', marginTop: 2, fontSize: 13 }}>주간 / 월간 학습 현황 및 교사 메모</p>
      </div>

      {/* 컨트롤 바 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20, alignItems: 'center' }}>
        {/* 학생 선택 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', borderRadius: 12, padding: '8px 14px', border: '1px solid #e2e8f0', flex: '0 0 auto' }}>
          <User size={15} color="#6366f1" />
          <select
            value={selectedStudentId}
            onChange={e => setSelectedStudentId(e.target.value)}
            style={{ border: 'none', outline: 'none', fontSize: 14, fontWeight: 700, color: '#1e293b', background: 'transparent', cursor: 'pointer' }}>
            {state.students.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.classGroup})</option>
            ))}
          </select>
        </div>

        {/* 타입 토글 */}
        <div style={{ display: 'flex', borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0', background: 'white' }}>
          {(['weekly', 'monthly'] as const).map(t => (
            <button key={t} onClick={() => setReportType(t)} style={{
              padding: '9px 18px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, minHeight: 'unset',
              background: reportType === t ? '#6366f1' : 'white',
              color: reportType === t ? 'white' : '#64748b',
            }}>
              {t === 'weekly' ? '주간' : '월간'}
            </button>
          ))}
        </div>

        {/* 기간 선택 */}
        {reportType === 'weekly' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'white', borderRadius: 12, padding: '6px 10px', border: '1px solid #e2e8f0' }}>
            <button onClick={() => setWeek(getPrevWeek(week))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', minHeight: 'unset' }}>
              <ChevronLeft size={16} color="#64748b" />
            </button>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', minWidth: 80, textAlign: 'center' }}>
              {getWeekDateRange(week).label}
            </span>
            <button onClick={() => setWeek(getNextWeek(week))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', minHeight: 'unset' }}>
              <ChevronRight size={16} color="#64748b" />
            </button>
          </div>
        ) : (
          <select
            value={monthKey}
            onChange={e => setMonthKey(e.target.value)}
            style={{ padding: '9px 14px', borderRadius: 12, border: '1px solid #e2e8f0', background: 'white', fontSize: 13, fontWeight: 700, color: '#1e293b', cursor: 'pointer', outline: 'none' }}>
            {months.map(mk => (
              <option key={mk} value={mk}>{monthLabel(mk)}</option>
            ))}
          </select>
        )}
      </div>

      {/* 리포트 본문 */}
      {!student ? (
        <div className="card" style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>학생을 선택해주세요</div>
      ) : reportType === 'weekly' ? (
        <WeeklyReport key={`${selectedStudentId}-${week}`} studentId={selectedStudentId} week={week} />
      ) : (
        <MonthlyReport key={`${selectedStudentId}-${monthKey}`} studentId={selectedStudentId} monthKey={monthKey} />
      )}
    </div>
  );
}
