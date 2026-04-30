'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { CheckCircle, XCircle, Edit2, X, AlertCircle } from 'lucide-react';
import { DayHomework, Student } from '@/lib/types';
import WeekSelector from '@/components/WeekSelector';
import { DAY_LABELS, DAY_ORDER, getWeekDateRange } from '@/lib/utils';

function weekToMonth(weekKey: string): string {
  const { start } = getWeekDateRange(weekKey);
  return `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
}
import { HomeworkStatus, HomeworkDay } from '@/lib/types';

const STATUS_META: Record<HomeworkStatus, { label: string; bg: string; color: string }> = {
  pending:   { label: '합의대기', bg: '#fef3c7', color: '#92400e' },
  agreed:    { label: '진행중',   bg: '#eff0ff', color: '#4338ca' },
  submitted: { label: '완료확인', bg: '#dbeafe', color: '#1e40af' },
  confirmed: { label: '완료',    bg: '#d1fae5', color: '#15803d' },
  approved:  { label: '완료',    bg: '#d1fae5', color: '#15803d' },
  rejected:  { label: '반려',    bg: '#fee2e2', color: '#991b1b' },
  missed:    { label: '미이행',  bg: '#fee2e2', color: '#991b1b' },
};

const CAT_LABELS: Record<string, string> = { computer: '컴퓨터', textbook: '교재', vocabulary: '단어', other: '문법' };

const ALL_DAYS: HomeworkDay[] = ['mon', 'tue', 'wed', 'thu', 'fri'];

function isActive(h: DayHomework) {
  return !['confirmed', 'approved', 'missed', 'rejected'].includes(h.status);
}

function isDone(h: DayHomework) {
  return h.status === 'confirmed' || h.status === 'approved';
}

// ── Create Homework Modal (admin creates directly as agreed) ─────────────────
function CreateHomeworkModal({ student, day, week, onSave, onClose }: {
  student: Student;
  day: HomeworkDay;
  week: string;
  onSave: (hw: DayHomework) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({ computer: '', textbook: '', vocabulary: '', other: '' });
  const handleSave = () => {
    const hw: DayHomework = {
      id: `hw-${student.id}-${week}-${day}-${Date.now()}`,
      studentId: student.id,
      studentName: student.name,
      week,
      day,
      computer: form.computer,
      textbook: form.textbook,
      vocabulary: form.vocabulary,
      other: form.other,
      submittedAt: new Date().toISOString(),
      agreedAt: new Date().toISOString(),
      status: 'agreed',
    };
    onSave(hw);
  };
  return (
    <div className="modal-backdrop">
      <div className="modal" style={{ maxWidth: 460 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>숙제 등록</div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>{student.name} · {DAY_LABELS[day]}요일</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        {(['computer', 'textbook', 'vocabulary', 'other'] as const).map(cat => (
          <div key={cat} style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4 }}>{CAT_LABELS[cat]}</label>
            <textarea value={form[cat]} onChange={e => setForm(f => ({ ...f, [cat]: e.target.value }))}
              rows={2} placeholder={`${CAT_LABELS[cat]} 내용`}
              style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, resize: 'vertical', fontFamily: 'inherit' }} />
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>취소</button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave}>등록</button>
        </div>
      </div>
    </div>
  );
}

// ── Edit Modal ───────────────────────────────────────────────────────────────
function EditHomeworkModal({ hw, onSave, onClose }: {
  hw: DayHomework; onSave: (u: DayHomework) => void; onClose: () => void;
}) {
  const [form, setForm] = useState({ computer: hw.computer, textbook: hw.textbook, vocabulary: hw.vocabulary, other: hw.other });
  return (
    <div className="modal-backdrop">
      <div className="modal" style={{ maxWidth: 460 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>숙제 내용 수정</div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>{hw.studentName} · {DAY_LABELS[hw.day]}요일</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        {(['computer', 'textbook', 'vocabulary', 'other'] as const).map(cat => (
          <div key={cat} style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4 }}>{CAT_LABELS[cat]}</label>
            <textarea value={form[cat]} onChange={e => setForm(f => ({ ...f, [cat]: e.target.value }))}
              rows={2} placeholder={`${CAT_LABELS[cat]} 내용`}
              style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, resize: 'vertical', fontFamily: 'inherit' }} />
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>취소</button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => onSave({ ...hw, ...form })}>저장</button>
        </div>
      </div>
    </div>
  );
}

// ── Homework Detail + Action Modal ───────────────────────────────────────────
function HomeworkDetailModal({ hw, onAction, onEdit, onClose }: {
  hw: DayHomework;
  onAction: (type: string, payload: unknown) => void;
  onEdit: () => void;
  onClose: () => void;
}) {
  const m = STATUS_META[hw.status];
  const hasContent = hw.computer || hw.textbook || hw.vocabulary || hw.other;

  const STAGE_INFO: Record<string, { step: number; title: string; desc: string; icon: string }> = {
    pending:   { step: 1, title: '합의 대기 중',  desc: '교사와 숙제 범위를 합의하는 단계입니다', icon: '🤝' },
    agreed:    { step: 2, title: '숙제 진행 중',  desc: '합의된 숙제를 학생이 진행하는 단계입니다', icon: '✏️' },
    submitted: { step: 3, title: '완료 확인 중',  desc: '학생이 제출 — 교사 최종 확인이 필요합니다', icon: '📬' },
    confirmed: { step: 4, title: '완료',          desc: '교사가 최종 승인한 숙제입니다', icon: '✅' },
    approved:  { step: 4, title: '완료',          desc: '교사가 최종 승인한 숙제입니다', icon: '✅' },
    rejected:  { step: 0, title: '반려됨',         desc: '교사에 의해 반려 처리된 숙제입니다', icon: '❌' },
    missed:    { step: 0, title: '미이행',         desc: '기한 내 숙제를 이행하지 않았습니다', icon: '⚠️' },
  };
  const stage = STAGE_INFO[hw.status] ?? { step: 0, title: hw.status, desc: '', icon: '?' };

  return (
    <div className="modal-backdrop">
      <div className="modal" style={{ maxWidth: 500 }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>{hw.studentName}</div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>
              {DAY_LABELS[hw.day]}요일 숙제
              <span style={{ marginLeft: 10, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: m.bg, color: m.color }}>
                {m.label}
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
            <X size={20} color="#94a3b8" />
          </button>
        </div>

        {/* 진행 단계 표시 */}
        <div style={{ background: m.bg, borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 28 }}>{stage.icon}</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: m.color }}>{stage.title}</div>
            <div style={{ fontSize: 12, color: m.color, opacity: 0.8, marginTop: 2 }}>{stage.desc}</div>
          </div>
          {stage.step > 0 && (
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
              {[1,2,3,4].map(n => (
                <div key={n} style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: n <= stage.step ? m.color : `${m.color}30`,
                }} />
              ))}
            </div>
          )}
        </div>

        {/* 숙제 내용 */}
        <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 10, letterSpacing: 0.5 }}>숙제 내용</div>
          {hasContent ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(['computer', 'textbook', 'vocabulary', 'other'] as const).map(cat =>
                hw[cat] ? (
                  <div key={cat} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'white', background: '#6366f1', borderRadius: 6, padding: '2px 7px', whiteSpace: 'nowrap', flexShrink: 0, marginTop: 2 }}>
                      {CAT_LABELS[cat]}
                    </span>
                    <span style={{ fontSize: 14, color: '#1e293b', lineHeight: 1.6 }}>{hw[cat]}</span>
                  </div>
                ) : null
              )}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '12px 0' }}>숙제 내용이 없습니다</div>
          )}
        </div>

        {/* 완료 예정일 표시 */}
        {hw.expectedSubmitDate && (
          <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '10px 14px', marginBottom: 16, border: '1px solid #bbf7d0' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#15803d' }}>
              📅 완료 예정일: {new Date(hw.expectedSubmitDate).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
            </div>
          </div>
        )}

        {/* 구분선 */}
        <div style={{ borderTop: '1px solid #f1f5f9', marginBottom: 16 }} />

        {/* 교사 액션 */}
        <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 10 }}>교사 처리</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={onEdit} style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '10px 16px', borderRadius: 9,
            border: '1px solid #e2e8f0', background: 'white', color: '#374151',
            cursor: 'pointer', fontSize: 13, fontWeight: 600, minHeight: 'unset',
          }}>
            <Edit2 size={13} /> 내용 수정
          </button>

          {hw.status === 'pending' && (
            <>
              <button onClick={() => { onAction('AGREE_HOMEWORK', hw.id); onClose(); }} style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '10px 16px', borderRadius: 9, border: 'none',
                background: '#6366f1', color: 'white',
                cursor: 'pointer', fontSize: 14, fontWeight: 800, minHeight: 'unset',
              }}>
                <CheckCircle size={15} /> 합의 승인
              </button>
              <button onClick={() => { onAction('REJECT_HOMEWORK', hw.id); onClose(); }} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '10px 16px', borderRadius: 9, border: 'none',
                background: '#fee2e2', color: '#991b1b',
                cursor: 'pointer', fontSize: 13, fontWeight: 700, minHeight: 'unset',
              }}>
                <XCircle size={13} /> 반려
              </button>
            </>
          )}

          {hw.status === 'agreed' && (
            <>
              <button onClick={() => { onAction('CONFIRM_HOMEWORK', { id: hw.id, result: 'confirmed' }); onClose(); }} style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '10px 16px', borderRadius: 9, border: 'none',
                background: '#22c55e', color: 'white',
                cursor: 'pointer', fontSize: 14, fontWeight: 800, minHeight: 'unset',
              }}>
                <CheckCircle size={15} /> 완료 처리
              </button>
              <button onClick={() => { onAction('REJECT_HOMEWORK', hw.id); onClose(); }} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '10px 16px', borderRadius: 9, border: 'none',
                background: '#fee2e2', color: '#991b1b',
                cursor: 'pointer', fontSize: 13, fontWeight: 700, minHeight: 'unset',
              }}>
                <XCircle size={13} /> 반려
              </button>
            </>
          )}

          {hw.status === 'submitted' && (
            <>
              <button onClick={() => { onAction('CONFIRM_HOMEWORK', { id: hw.id, result: 'approved' }); onClose(); }} style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '10px 16px', borderRadius: 9, border: 'none',
                background: '#22c55e', color: 'white',
                cursor: 'pointer', fontSize: 14, fontWeight: 800, minHeight: 'unset',
              }}>
                <CheckCircle size={15} /> 교사 승인
              </button>
              <button onClick={() => { onAction('CONFIRM_HOMEWORK', { id: hw.id, result: 'rejected' }); onClose(); }} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '10px 16px', borderRadius: 9, border: 'none',
                background: '#fee2e2', color: '#991b1b',
                cursor: 'pointer', fontSize: 13, fontWeight: 700, minHeight: 'unset',
              }}>
                <XCircle size={13} /> 반려
              </button>
            </>
          )}

          {(hw.status === 'confirmed' || hw.status === 'approved') && (
            <div style={{ flex: 1, textAlign: 'center', padding: '10px 0', fontSize: 14, color: '#15803d', fontWeight: 700 }}>
              ✅ 완료된 숙제입니다
            </div>
          )}

          {hw.status === 'missed' && (
            <div style={{ flex: 1, textAlign: 'center', padding: '10px 0', fontSize: 14, color: '#ef4444', fontWeight: 700 }}>
              ❌ 미이행 처리됨
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function HomeworkPage() {
  const { state, dispatch } = useStore();
  const [week, setWeek] = useState(state.currentWeek);
  const [classFilter, setClassFilter] = useState('전체');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'done' | 'missed'>('all');
  const [editHW, setEditHW] = useState<DayHomework | null>(null);
  const [detailHW, setDetailHW] = useState<DayHomework | null>(null);
  const [missedSel, setMissedSel] = useState<Set<string>>(new Set());
  const [nameSearch, setNameSearch] = useState('');
  const [addHWTarget, setAddHWTarget] = useState<{ student: Student; day: HomeworkDay } | null>(null);

  // Homework sequential numbers per student (sorted by submittedAt), across ALL weeks
  const hwNumbers = useMemo(() => {
    const nums = new Map<string, number>();
    const byStudent: Record<string, DayHomework[]> = {};
    state.dayHomeworks.forEach(hw => {
      if (!byStudent[hw.studentId]) byStudent[hw.studentId] = [];
      byStudent[hw.studentId].push(hw);
    });
    Object.values(byStudent).forEach(hws => {
      hws.sort((a, b) => (a.submittedAt || '').localeCompare(b.submittedAt || ''));
      hws.forEach((hw, i) => nums.set(hw.id, i + 1));
    });
    return nums;
  }, [state.dayHomeworks]);

  // ── 기본 데이터 ─────────────────────────────────────────────────────────
  const globalDaysRaw = new Set(state.students.flatMap(s => s.scheduleDays || []));
  const globalDays = globalDaysRaw.size > 0 ? globalDaysRaw : new Set(['mon','tue','wed','thu','fri']);
  const classGroups = ['전체', ...new Set(state.students.map(s => s.classGroup))];

  const filteredStudents = state.students.filter(s => {
    if (classFilter !== '전체' && s.classGroup !== classFilter) return false;
    const q = nameSearch.trim();
    if (q && !s.name.includes(q) && !(s.classGroup ?? '').includes(q)) return false;
    return true;
  });

  // weekHW: 전체 학생 기준으로 필터 (filteredStudents 의존 제거 → 타이밍 버그 방지)
  const weekHW = state.dayHomeworks.filter(h => h.week === week);

  const scheduledDays = useMemo(() =>
    DAY_ORDER.filter(d => globalDays.has(d)), [globalDays]);

  // ── 미이행 등록 헬퍼 ────────────────────────────────────────────────────
  const studentScheduledFor = (s: Student, day: HomeworkDay) =>
    s.scheduleDays ? s.scheduleDays.includes(day) : globalDays.has(day);

  const getUnrecorded = (day: HomeworkDay): Student[] =>
    filteredStudents.filter(s =>
      studentScheduledFor(s, day) && !weekHW.some(h => h.studentId === s.id && h.day === day)
    );

  const doMarkMissed = (student: Student, day: HomeworkDay) =>
    dispatch({
      type: 'ADD_HOMEWORK',
      payload: {
        id: `missed-${student.id}-${week}-${day}`,
        studentId: student.id, studentName: student.name,
        week, day,
        computer: '', textbook: '', vocabulary: '', other: '',
        submittedAt: new Date().toISOString(), status: 'missed',
      },
    });

  const toggleMissed = (studentId: string, day: HomeworkDay) =>
    setMissedSel(prev => {
      const next = new Set(prev);
      const k = `${studentId}-${day}`;
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });

  const allUnrecorded = useMemo(() =>
    scheduledDays.flatMap(day => getUnrecorded(day).map(s => ({ s, day }))),
    [weekHW, filteredStudents, scheduledDays]
  );

  const allUnrecordedKeys = useMemo(() =>
    new Set(allUnrecorded.map(({ s, day }) => `${s.id}-${day}`)),
    [allUnrecorded]
  );

  const allSelected = allUnrecorded.length > 0 && allUnrecorded.every(({ s, day }) => missedSel.has(`${s.id}-${day}`));

  const toggleSelectAll = () => {
    if (allSelected) {
      setMissedSel(prev => { const next = new Set(prev); allUnrecordedKeys.forEach(k => next.delete(k)); return next; });
    } else {
      setMissedSel(prev => { const next = new Set(prev); allUnrecordedKeys.forEach(k => next.add(k)); return next; });
    }
  };

  const registerAllSelected = () => {
    allUnrecorded.forEach(({ s, day }) => {
      if (missedSel.has(`${s.id}-${day}`)) doMarkMissed(s, day);
    });
    setMissedSel(new Set());
  };

  // ── 합계 계산 ────────────────────────────────────────────────────────────
  // 이번 주 기록된 건수 (미이행 제외)
  const weekRecordCount = (studentId: string) =>
    weekHW.filter(h => h.studentId === studentId && h.status !== 'missed').length;

  // 이번 주 완료 건수 (confirmed/approved)
  const weekDoneCount = (studentId: string) =>
    weekHW.filter(h => h.studentId === studentId && isDone(h)).length;

  // 전체 누적 기록 건수 (미이행 제외)
  const allTimeRecordCount = (studentId: string) =>
    state.dayHomeworks.filter(h => h.studentId === studentId && h.status !== 'missed').length;

  // 전체 누적 완료 건수 (confirmed/approved)
  const allTimeDoneCount = (studentId: string) =>
    state.dayHomeworks.filter(h => h.studentId === studentId && isDone(h)).length;

  // 월간 결산
  const currentMonth = weekToMonth(week);
  const monthHW = state.dayHomeworks.filter(h => weekToMonth(h.week) === currentMonth);
  const monthRecordCount = (studentId: string) =>
    monthHW.filter(h => h.studentId === studentId && h.status !== 'missed').length;
  const monthDoneCount = (studentId: string) =>
    monthHW.filter(h => h.studentId === studentId && isDone(h)).length;

  // 합계 총합 (맨 아래 행용)
  const weekTotalRecord = filteredStudents.reduce((sum, s) => sum + weekRecordCount(s.id), 0);
  const weekTotalDone = filteredStudents.reduce((sum, s) => sum + weekDoneCount(s.id), 0);
  const monthTotalRecord = filteredStudents.reduce((sum, s) => sum + monthRecordCount(s.id), 0);
  const monthTotalDone = filteredStudents.reduce((sum, s) => sum + monthDoneCount(s.id), 0);
  const allTimeTotalRecord = filteredStudents.reduce((sum, s) => sum + allTimeRecordCount(s.id), 0);
  const allTimeTotalDone = filteredStudents.reduce((sum, s) => sum + allTimeDoneCount(s.id), 0);

  // ── 하단 표: 전체 인원 × 요일 조합 ─────────────────────────────────────
  const allWeekRows = useMemo(() => {
    type Row = { key: string; student: Student; day: HomeworkDay; hw: DayHomework | null };
    const rows: Row[] = [];
    filteredStudents.forEach(student => {
      ALL_DAYS.forEach(day => {
        if (!studentScheduledFor(student, day)) return;
        const hw = weekHW.find(h => h.studentId === student.id && h.day === day) ?? null;
        rows.push({ key: `${student.id}-${day}`, student, day, hw });
      });
    });
    // 정렬: 대기중(active) → 미기록 → 완료 → 미이행
    const priority = (hw: DayHomework | null) => {
      if (!hw) return 1;
      if (isActive(hw)) return 0;
      if (isDone(hw)) return 2;
      if (hw.status === 'missed') return 3;
      return 4;
    };
    return rows.sort((a, b) => {
      const pd = priority(a.hw) - priority(b.hw);
      if (pd !== 0) return pd;
      return a.student.name.localeCompare(b.student.name);
    });
  }, [weekHW, filteredStudents]);

  const activeCount = allWeekRows.filter(r => r.hw && isActive(r.hw)).length;
  const unrecordedCount = allWeekRows.filter(r => !r.hw).length;

  // ── 상태 필터 카운트 ─────────────────────────────────────────────────────
  const filterCounts = useMemo(() => ({
    all:    allWeekRows.length,
    active: allWeekRows.filter(r => !r.hw || isActive(r.hw)).length,  // 대기중 + 미기록
    done:   allWeekRows.filter(r => r.hw && isDone(r.hw)).length,
    missed: allWeekRows.filter(r => r.hw?.status === 'missed').length,
  }), [allWeekRows]);

  // ── Table 1: 상태 필터 적용된 학생 목록 ──────────────────────────────────
  const table1Students = useMemo(() => {
    if (statusFilter === 'all') return filteredStudents;
    return filteredStudents.filter(s => {
      const hw = weekHW.filter(h => h.studentId === s.id);
      const hasUnrecorded = ALL_DAYS.some(d =>
        studentScheduledFor(s, d) && !hw.some(h => h.day === d)
      );
      if (statusFilter === 'active') return hw.some(h => isActive(h)) || hasUnrecorded;
      if (statusFilter === 'done')   return hw.some(h => isDone(h));
      if (statusFilter === 'missed') return hw.some(h => h.status === 'missed');
      return true;
    });
  }, [statusFilter, filteredStudents, weekHW]);

  // ── Table 2: 상태 필터 적용된 행 목록 ────────────────────────────────────
  const filteredWeekRows = useMemo(() => {
    if (statusFilter === 'all') return allWeekRows;
    return allWeekRows.filter(({ hw }) => {
      if (statusFilter === 'active') return !hw || isActive(hw);
      if (statusFilter === 'done')   return hw !== null && isDone(hw);
      if (statusFilter === 'missed') return hw?.status === 'missed';
      return true;
    });
  }, [statusFilter, allWeekRows]);

  const doAction = (type: string, payload: unknown) => dispatch({ type, payload } as Parameters<typeof dispatch>[0]);

  return (
    <div>
      {/* ── 헤더 ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>숙제 관리</h1>
          <p style={{ color: '#64748b', marginTop: 2, fontSize: 13 }}>주간 숙제 현황 · ① 합의 → ② 진행중 → ③ 완료확인 → ④ 완료</p>
        </div>
        <WeekSelector week={week} onChange={setWeek} />
      </div>

      {/* ── 이름 검색 ── */}
      <div style={{ marginBottom: 14 }}>
        <input
          type="text"
          placeholder="이름 또는 반 검색..."
          value={nameSearch}
          onChange={e => setNameSearch(e.target.value)}
          style={{
            width: '100%', maxWidth: 280, padding: '8px 14px', borderRadius: 10,
            border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none',
            background: 'white', boxSizing: 'border-box',
          }}
        />
      </div>

      {/* ── 반 필터 ── */}
      {classGroups.length > 2 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
          {classGroups.map(cls => (
            <button key={cls} onClick={() => setClassFilter(cls)} style={{
              padding: '5px 12px', borderRadius: 20, border: '1px solid',
              borderColor: classFilter === cls ? '#6366f1' : '#e2e8f0',
              background: classFilter === cls ? '#eff0ff' : 'white',
              color: classFilter === cls ? '#6366f1' : '#64748b',
              fontWeight: classFilter === cls ? 700 : 400, fontSize: 12, cursor: 'pointer', minHeight: 'unset',
            }}>{cls}</button>
          ))}
        </div>
      )}

      {/* ── 상태 카테고리 필터 ── */}
      {(() => {
        const tabs: { key: 'all' | 'active' | 'done' | 'missed'; label: string; bg: string; color: string; activeBg: string }[] = [
          { key: 'all',    label: '전체',   bg: '#f8fafc', color: '#475569', activeBg: '#1e293b' },
          { key: 'active', label: '대기중', bg: '#fef9ec', color: '#92400e', activeBg: '#f59e0b' },
          { key: 'done',   label: '완료',   bg: '#f0fdf4', color: '#15803d', activeBg: '#22c55e' },
          { key: 'missed', label: '미이행', bg: '#fef2f2', color: '#991b1b', activeBg: '#ef4444' },
        ];
        return (
          <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
            {tabs.map(t => {
              const active = statusFilter === t.key;
              const count = filterCounts[t.key];
              return (
                <button key={t.key} onClick={() => setStatusFilter(t.key)} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 10,
                  border: `1.5px solid ${active ? t.activeBg : '#e2e8f0'}`,
                  background: active ? t.activeBg : t.bg,
                  color: active ? 'white' : t.color,
                  fontWeight: 700, fontSize: 13, cursor: 'pointer', minHeight: 'unset',
                  boxShadow: active ? `0 2px 8px ${t.activeBg}40` : 'none',
                  transition: 'all 0.15s',
                }}>
                  {t.label}
                  <span style={{
                    fontSize: 11, fontWeight: 800,
                    background: active ? 'rgba(255,255,255,0.25)' : (t.key === 'all' ? '#e2e8f0' : t.activeBg + '22'),
                    color: active ? 'white' : t.activeBg,
                    padding: '1px 7px', borderRadius: 20,
                    minWidth: 22, textAlign: 'center',
                  }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        );
      })()}

      {/* ══════════════════════════════════════════════════════════
          TABLE 1 · 주간 숙제 누적 현황 (전체 학생)
      ══════════════════════════════════════════════════════════ */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#1e293b', marginBottom: 10 }}>
          📊 주간 숙제 누적 현황
          <span style={{ fontSize: 12, fontWeight: 400, color: '#94a3b8', marginLeft: 8 }}>셀 클릭 → 상세 보기 &amp; 승인/완료 처리</span>
        </div>

        <div style={{ overflowX: 'auto', borderRadius: 14, border: '1px solid #e2e8f0', background: 'white' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap', minWidth: 80 }}>학생</th>
                {ALL_DAYS.map((day) => (
                  <th key={day} style={{ padding: '6px 4px', textAlign: 'center', fontWeight: 700, color: '#475569', minWidth: 90 }}>
                    <div style={{ fontSize: 14, marginBottom: 4 }}>{DAY_LABELS[day]}요일</div>
                    <div style={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: '#15803d', background: '#d1fae5', borderRadius: 4, padding: '1px 5px' }}>상 완료</span>
                      <span style={{ fontSize: 9, fontWeight: 700, color: '#1e40af', background: '#dbeafe', borderRadius: 4, padding: '1px 5px' }}>하 합의</span>
                    </div>
                  </th>
                ))}
                <th style={{ padding: '12px 12px', textAlign: 'center', fontWeight: 800, color: '#6366f1', fontSize: 15, minWidth: 90, whiteSpace: 'nowrap', borderLeft: '2px solid #e2e8f0' }}>
                  주간 결산
                </th>
                <th style={{ padding: '12px 12px', textAlign: 'center', fontWeight: 800, color: '#f59e0b', fontSize: 15, minWidth: 90, whiteSpace: 'nowrap' }}>
                  월간 결산
                </th>
                <th style={{ padding: '12px 12px', textAlign: 'center', fontWeight: 800, color: '#0ea5e9', fontSize: 15, minWidth: 90, whiteSpace: 'nowrap' }}>
                  전체 결산
                </th>
              </tr>
            </thead>
            <tbody>
              {table1Students.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: 24, textAlign: 'center', color: '#cbd5e1', fontSize: 13 }}>
                    해당 카테고리의 학생이 없습니다
                  </td>
                </tr>
              ) : (
                table1Students.map((student, idx) => {
                  const studentWeekHW = weekHW.filter(h => h.studentId === student.id);
                  const weekRec = weekRecordCount(student.id);
                  const weekDone = weekDoneCount(student.id);
                  const monthRec = monthRecordCount(student.id);
                  const monthDone = monthDoneCount(student.id);
                  const allTimeRec = allTimeRecordCount(student.id);
                  const allTimeDone = allTimeDoneCount(student.id);
                  return (
                    <tr key={student.id} style={{ borderBottom: idx < table1Students.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                      <td style={{ padding: '10px 16px', fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap' }}>
                        <div>{student.name}</div>
                        {student.classGroup && (
                          <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400 }}>{student.classGroup}</div>
                        )}
                      </td>

                      {/* 5 통합 셀: 상(완료) / 하(합의) */}
                      {ALL_DAYS.map((day) => {
                        const hw = studentWeekHW.find(h => h.day === day);
                        const isScheduled = studentScheduledFor(student, day);
                        const hwNum = hw ? hwNumbers.get(hw.id) : null;
                        const m = hw ? STATUS_META[hw.status] : null;
                        const agreementDate = hw?.agreedAt || hw?.submittedAt;
                        const agreeStr = agreementDate ? new Date(agreementDate).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' }) : null;
                        const isCompletePhase = hw && ['submitted', 'confirmed', 'approved'].includes(hw.status);
                        const expectedDateStr = hw?.expectedSubmitDate
                          ? new Date(hw.expectedSubmitDate).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })
                          : null;
                        const cellBg = isScheduled ? 'white' : '#f5f5f5';

                        return (
                          <td key={day} style={{ padding: 0, textAlign: 'center', background: cellBg, verticalAlign: 'middle' }}>
                            {/* 상: 숙제 완료 */}
                            <div style={{ borderBottom: '1px solid #e2e8f0', padding: '5px 4px', minHeight: 36, background: isCompletePhase ? '#f0fdf4' : isScheduled ? '#fafafa' : '#f0f0f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                              {isCompletePhase ? (
                                <>
                                  {hwNum && <span style={{ fontSize: 9, fontWeight: 800, color: '#94a3b8' }}>#{hwNum}</span>}
                                  {expectedDateStr
                                    ? <span style={{ fontSize: 10, fontWeight: 700, color: '#15803d', background: '#d1fae5', padding: '1px 6px', borderRadius: 5 }}>{expectedDateStr}</span>
                                    : <span style={{ fontSize: 9, color: '#cbd5e1' }}>날짜미입력</span>}
                                  {isDone(hw) && <span style={{ fontSize: 9, color: '#15803d' }}>✓완료</span>}
                                </>
                              ) : (
                                <span style={{ fontSize: 9, color: isScheduled ? '#d1d5db' : '#e5e7eb' }}>–</span>
                              )}
                            </div>
                            {/* 하: 숙제 합의 */}
                            <div style={{ padding: '5px 4px', minHeight: 36, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                              {hw && m ? (
                                <button onClick={() => setDetailHW(hw)} style={{ padding: '2px 6px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: m.bg, color: m.color, border: `1px solid ${m.color}30`, cursor: 'pointer', minHeight: 'unset', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, width: '100%' }}>
                                  {hwNum && <span style={{ fontSize: 9, fontWeight: 800, opacity: 0.7 }}>#{hwNum}</span>}
                                  <span>{m.label}</span>
                                  {agreeStr && <span style={{ fontSize: 9, fontWeight: 400, opacity: 0.75 }}>{agreeStr}</span>}
                                </button>
                              ) : isScheduled ? (
                                <button onClick={() => setAddHWTarget({ student, day })} style={{ fontSize: 9, color: '#cbd5e1', background: 'none', border: '1px dashed #e2e8f0', borderRadius: 5, padding: '2px 6px', cursor: 'pointer', minHeight: 'unset' }}>
                                  + 등록
                                </button>
                              ) : (
                                <span style={{ fontSize: 9, color: '#e5e7eb' }}>–</span>
                              )}
                            </div>
                          </td>
                        );
                      })}

                      {/* 주간 결산 */}
                      <td style={{ padding: '10px 12px', textAlign: 'center', borderLeft: '2px solid #f1f5f9' }}>
                        {weekRec === 0 ? <span style={{ fontSize: 13, color: '#cbd5e1' }}>–</span> : (
                          <div>
                            <span style={{ fontWeight: 900, fontSize: 22, color: '#6366f1' }}>{weekRec}</span>
                            <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 2 }}>건</span>
                            {weekDone > 0 && <div style={{ fontSize: 12, color: '#22c55e', fontWeight: 700 }}>완료 {weekDone}</div>}
                          </div>
                        )}
                      </td>
                      {/* 월간 결산 */}
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        {monthRec === 0 ? <span style={{ fontSize: 13, color: '#cbd5e1' }}>–</span> : (
                          <div>
                            <span style={{ fontWeight: 900, fontSize: 22, color: '#f59e0b' }}>{monthRec}</span>
                            <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 2 }}>건</span>
                            {monthDone > 0 && <div style={{ fontSize: 12, color: '#22c55e', fontWeight: 700 }}>완료 {monthDone}</div>}
                          </div>
                        )}
                      </td>
                      {/* 전체 결산 */}
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        {allTimeRec === 0 ? <span style={{ fontSize: 13, color: '#cbd5e1' }}>–</span> : (
                          <div>
                            <span style={{ fontWeight: 900, fontSize: 22, color: '#0ea5e9' }}>{allTimeRec}</span>
                            <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 2 }}>건</span>
                            {allTimeDone > 0 && <div style={{ fontSize: 12, color: '#22c55e', fontWeight: 700 }}>완료 {allTimeDone}</div>}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* 합계 행 */}
            {table1Students.length > 0 && (
              <tfoot>
                <tr style={{ background: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
                  <td style={{ padding: '10px 16px', fontWeight: 800, color: '#475569', fontSize: 13 }}>합계</td>
                  {/* 5 통합 열 합계 */}
                  {ALL_DAYS.map((day) => {
                    const dayRec = weekHW.filter(h => h.day === day && h.status !== 'missed' && table1Students.some(s => s.id === h.studentId)).length;
                    const dayDone = weekHW.filter(h => h.day === day && isDone(h) && table1Students.some(s => s.id === h.studentId)).length;
                    const dayTotal = table1Students.filter(s => studentScheduledFor(s, day)).length;
                    const dayCompleted = weekHW.filter(h => h.day === day && ['submitted', 'confirmed', 'approved'].includes(h.status) && table1Students.some(s => s.id === h.studentId)).length;
                    return (
                      <td key={`tfoot-${day}`} style={{ padding: 0, textAlign: 'center' }}>
                        {/* 상: 완료 합계 */}
                        <div style={{ borderBottom: '1px solid #e2e8f0', padding: '5px 4px', background: '#f0fdf4', minHeight: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#15803d' }}>{dayCompleted}건</span>
                        </div>
                        {/* 하: 합의 합계 */}
                        <div style={{ padding: '5px 4px', minHeight: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#1e40af' }}>
                            {dayRec}<span style={{ color: '#cbd5e1', fontWeight: 400 }}>/{dayTotal}</span>
                          </div>
                          {dayDone > 0 && <div style={{ fontSize: 10, color: '#22c55e', fontWeight: 700 }}>완료 {dayDone}</div>}
                        </div>
                      </td>
                    );
                  })}
                  <td style={{ padding: '10px 12px', textAlign: 'center', borderLeft: '2px solid #e2e8f0' }}>
                    <div style={{ fontWeight: 900, fontSize: 20, color: '#6366f1' }}>{weekTotalRecord}<span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 2, fontWeight: 400 }}>건</span></div>
                    {weekTotalDone > 0 && <div style={{ fontSize: 12, color: '#22c55e', fontWeight: 700 }}>완료 {weekTotalDone}</div>}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <div style={{ fontWeight: 900, fontSize: 20, color: '#f59e0b' }}>{monthTotalRecord}<span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 2, fontWeight: 400 }}>건</span></div>
                    {monthTotalDone > 0 && <div style={{ fontSize: 12, color: '#22c55e', fontWeight: 700 }}>완료 {monthTotalDone}</div>}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <div style={{ fontWeight: 900, fontSize: 20, color: '#0ea5e9' }}>{allTimeTotalRecord}<span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 2, fontWeight: 400 }}>건</span></div>
                    {allTimeTotalDone > 0 && <div style={{ fontSize: 12, color: '#22c55e', fontWeight: 700 }}>완료 {allTimeTotalDone}</div>}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          TABLE 2 · 이번 주 전체 현황 (전체 인원)
      ══════════════════════════════════════════════════════════ */}
      <div>
        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#1e293b' }}>📋 이번 주 전체 현황</span>
          <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 400 }}>전체 인원 · 대기중 우선</span>
          {activeCount > 0 && (
            <span style={{ padding: '2px 10px', borderRadius: 20, background: '#fef3c7', color: '#92400e', fontSize: 12, fontWeight: 700 }}>
              처리 필요 {activeCount}건
            </span>
          )}
          {unrecordedCount > 0 && (
            <span style={{ padding: '2px 10px', borderRadius: 20, background: '#fee2e2', color: '#991b1b', fontSize: 12, fontWeight: 700 }}>
              미기록 {unrecordedCount}건
            </span>
          )}
          {allUnrecorded.length > 0 && (
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap' }}>
              <button onClick={toggleSelectAll} style={{
                padding: '5px 12px', borderRadius: 8, border: '1px solid #fca5a5',
                background: allSelected ? '#fee2e2' : 'white', color: '#991b1b',
                fontWeight: 700, fontSize: 12, cursor: 'pointer', minHeight: 'unset',
              }}>
                {allSelected ? '전체 해제' : '미기록 전체 선택'} ({allUnrecorded.length}건)
              </button>
              {missedSel.size > 0 && (
                <button onClick={registerAllSelected} style={{
                  padding: '5px 14px', borderRadius: 8, border: 'none',
                  background: '#ef4444', color: 'white', fontWeight: 700, fontSize: 12,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, minHeight: 'unset',
                }}>
                  <XCircle size={13} /> 일괄 미이행 ({missedSel.size}건)
                </button>
              )}
            </div>
          )}
        </div>

        {filteredWeekRows.length === 0 ? (
          <div style={{ padding: 28, textAlign: 'center', color: '#cbd5e1', borderRadius: 14, border: '1px dashed #e2e8f0', background: 'white', fontSize: 13 }}>
            {statusFilter === 'all' ? '등록된 학생이 없습니다' : '해당 카테고리의 항목이 없습니다'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto', borderRadius: 14, border: '1px solid #e2e8f0', background: 'white' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>학생</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>요일</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: '#475569', minWidth: 80 }}>상태</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>숙제 내용</th>
                  <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap', minWidth: 180 }}>액션</th>
                </tr>
              </thead>
              <tbody>
                {filteredWeekRows.map(({ key, student, day, hw }, idx) => {
                  const rowBg = !hw
                    ? (missedSel.has(key) ? '#fff5f5' : '#fafafa')
                    : isActive(hw) ? '#fffdf0'
                    : isDone(hw) ? '#f0fdf4'
                    : hw.status === 'missed' ? '#fef2f2'
                    : 'white';

                  return (
                    <tr key={key} style={{ borderBottom: '1px solid #f1f5f9', background: rowBg }}>
                      {/* 학생 */}
                      <td style={{ padding: '10px 16px', fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap' }}>
                        <div>{student.name}</div>
                        {student.classGroup && <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 400 }}>{student.classGroup}</div>}
                      </td>

                      {/* 요일 */}
                      <td style={{ padding: '10px 12px', textAlign: 'center', color: '#475569', whiteSpace: 'nowrap', fontWeight: 600 }}>
                        {DAY_LABELS[day]}
                      </td>

                      {/* 상태 */}
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        {hw ? (
                          <span style={{
                            padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                            background: STATUS_META[hw.status].bg, color: STATUS_META[hw.status].color, whiteSpace: 'nowrap',
                          }}>
                            {STATUS_META[hw.status].label}
                          </span>
                        ) : (
                          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: '#f1f5f9', color: '#94a3b8' }}>
                            미기록
                          </span>
                        )}
                      </td>

                      {/* 숙제 내용 */}
                      <td style={{ padding: '10px 16px', color: '#64748b', fontSize: 12, maxWidth: 220 }}>
                        {hw ? (
                          [hw.computer, hw.textbook, hw.vocabulary, hw.other].filter(Boolean).join(' / ').slice(0, 60)
                          || <span style={{ color: '#cbd5e1' }}>내용 없음</span>
                        ) : (
                          <span style={{ color: '#cbd5e1' }}>–</span>
                        )}
                      </td>

                      {/* 액션 */}
                      <td style={{ padding: '8px 14px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 5, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
                          {/* 기록 있는 경우 */}
                          {hw && (
                            <>
                              {/* 상세/수정 */}
                              <button onClick={() => setDetailHW(hw)} style={{
                                padding: '4px 9px', borderRadius: 7, border: '1px solid #e2e8f0', background: 'white',
                                color: '#374151', cursor: 'pointer', fontSize: 11, fontWeight: 600, minHeight: 'unset',
                                display: 'flex', alignItems: 'center', gap: 3,
                              }}>
                                <Edit2 size={11} /> 상세
                              </button>
                              {/* 합의 (pending → agreed) */}
                              {hw.status === 'pending' && (
                                <button onClick={() => doAction('AGREE_HOMEWORK', hw.id)} style={{
                                  padding: '4px 10px', borderRadius: 7, border: 'none', background: '#6366f1',
                                  color: 'white', cursor: 'pointer', fontSize: 11, fontWeight: 700, minHeight: 'unset',
                                  display: 'flex', alignItems: 'center', gap: 3,
                                }}>
                                  <CheckCircle size={11} /> 합의
                                </button>
                              )}
                              {/* 완료 (agreed → confirmed) */}
                              {hw.status === 'agreed' && (
                                <button onClick={() => doAction('CONFIRM_HOMEWORK', { id: hw.id, result: 'confirmed' })} style={{
                                  padding: '4px 10px', borderRadius: 7, border: 'none', background: '#22c55e',
                                  color: 'white', cursor: 'pointer', fontSize: 11, fontWeight: 700, minHeight: 'unset',
                                  display: 'flex', alignItems: 'center', gap: 3,
                                }}>
                                  <CheckCircle size={11} /> 완료
                                </button>
                              )}
                              {/* 승인 (submitted → approved) */}
                              {hw.status === 'submitted' && (
                                <button onClick={() => doAction('CONFIRM_HOMEWORK', { id: hw.id, result: 'approved' })} style={{
                                  padding: '4px 10px', borderRadius: 7, border: 'none', background: '#22c55e',
                                  color: 'white', cursor: 'pointer', fontSize: 11, fontWeight: 700, minHeight: 'unset',
                                  display: 'flex', alignItems: 'center', gap: 3,
                                }}>
                                  <CheckCircle size={11} /> 승인
                                </button>
                              )}
                              {/* 반려 (pending / agreed / submitted) */}
                              {isActive(hw) && (
                                <button onClick={() => doAction('REJECT_HOMEWORK', hw.id)} style={{
                                  padding: '4px 9px', borderRadius: 7, border: 'none', background: '#fee2e2',
                                  color: '#991b1b', cursor: 'pointer', fontSize: 11, fontWeight: 700, minHeight: 'unset',
                                  display: 'flex', alignItems: 'center', gap: 3,
                                }}>
                                  <XCircle size={11} /> 반려
                                </button>
                              )}
                              {/* 완료 뱃지 */}
                              {isDone(hw) && (
                                <span style={{ fontSize: 11, color: '#15803d', fontWeight: 700 }}>✅ 완료</span>
                              )}
                              {/* 미이행 뱃지 */}
                              {hw.status === 'missed' && (
                                <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 700 }}>❌ 미이행</span>
                              )}
                            </>
                          )}

                          {/* 미기록인 경우 */}
                          {!hw && (
                            <>
                              <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
                                <input type="checkbox" checked={missedSel.has(key)} onChange={() => toggleMissed(student.id, day)}
                                  style={{ width: 13, height: 13, accentColor: '#ef4444', cursor: 'pointer' }} />
                                <span style={{ fontSize: 11, color: missedSel.has(key) ? '#ef4444' : '#94a3b8', fontWeight: 600 }}>선택</span>
                              </label>
                              <button onClick={() => doMarkMissed(student, day)} style={{
                                padding: '4px 9px', borderRadius: 7, border: 'none', background: '#fee2e2',
                                color: '#991b1b', cursor: 'pointer', fontSize: 11, fontWeight: 700, minHeight: 'unset',
                                display: 'flex', alignItems: 'center', gap: 3,
                              }}>
                                <AlertCircle size={11} /> 미이행
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {detailHW && !editHW && (
        <HomeworkDetailModal
          hw={detailHW}
          onAction={doAction}
          onEdit={() => { setEditHW(detailHW); setDetailHW(null); }}
          onClose={() => setDetailHW(null)}
        />
      )}
      {editHW && (
        <EditHomeworkModal
          hw={editHW}
          onSave={updated => { dispatch({ type: 'UPDATE_HOMEWORK', payload: updated }); setEditHW(null); }}
          onClose={() => setEditHW(null)}
        />
      )}
      {addHWTarget && (
        <CreateHomeworkModal
          student={addHWTarget.student}
          day={addHWTarget.day}
          week={week}
          onSave={(hw) => { dispatch({ type: 'ADD_HOMEWORK', payload: hw }); setAddHWTarget(null); }}
          onClose={() => setAddHWTarget(null)}
        />
      )}
    </div>
  );
}
