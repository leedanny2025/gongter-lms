'use client';

import { useState, useMemo, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { CheckCircle, XCircle, Edit2, X, AlertCircle, RotateCcw } from 'lucide-react';
import { DayHomework, Student } from '@/lib/types';
import WeekSelector from '@/components/WeekSelector';
import { DAY_LABELS, DAY_ORDER, getWeekDateRange } from '@/lib/utils';
import { HomeworkStatus, HomeworkDay } from '@/lib/types';

function weekToMonth(weekKey: string): string {
  const { start } = getWeekDateRange(weekKey);
  return `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
}

const STATUS_META: Record<HomeworkStatus, { label: string; bg: string; color: string }> = {
  pending:   { label: '합의대기', bg: '#fef3c7', color: '#92400e' },
  agreed:    { label: '진행중',   bg: '#eff0ff', color: '#4338ca' },
  submitted: { label: '완료확인', bg: '#dbeafe', color: '#1e40af' },
  confirmed: { label: '완료',    bg: '#d1fae5', color: '#15803d' },
  approved:  { label: '완료',    bg: '#d1fae5', color: '#15803d' },
  rejected:  { label: '미완료',  bg: '#fff7ed', color: '#c2410c' },
  missed:    { label: '미이행',  bg: '#fee2e2', color: '#991b1b' },
  no_hw:     { label: '숙제없음', bg: '#f1f5f9', color: '#475569' },
};

const CAT_LABELS: Record<string, string> = { computer: '컴퓨터', textbook: '교재', vocabulary: '단어', other: '문법' };
const ALL_DAYS: HomeworkDay[] = ['mon', 'tue', 'wed', 'thu', 'fri'];

function isActive(h: DayHomework) {
  return !['confirmed', 'approved', 'missed', 'rejected', 'no_hw'].includes(h.status);
}
function isDone(h: DayHomework) {
  return h.status === 'confirmed' || h.status === 'approved';
}

/* ── Create Homework Modal ─────────────────────────────────── */
function CreateHomeworkModal({ student, day, week, onSave, onClose }: {
  student: Student; day: HomeworkDay; week: string;
  onSave: (hw: DayHomework) => void; onClose: () => void;
}) {
  const [form, setForm] = useState({ computer: '', textbook: '', vocabulary: '', other: '' });
  const handleSave = () => {
    onSave({
      id: `hw-${student.id}-${week}-${day}-${Date.now()}`,
      studentId: student.id, studentName: student.name, week, day,
      computer: form.computer, textbook: form.textbook, vocabulary: form.vocabulary, other: form.other,
      submittedAt: new Date().toISOString(), agreedAt: new Date().toISOString(), status: 'agreed',
    });
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

/* ── Edit Modal ────────────────────────────────────────────── */
function EditHomeworkModal({ hw, onSave, onClose }: {
  hw: DayHomework; onSave: (u: DayHomework) => void; onClose: () => void;
}) {
  const [form, setForm] = useState({ computer: hw.computer, textbook: hw.textbook, vocabulary: hw.vocabulary, other: hw.other });
  const [day, setDay] = useState<HomeworkDay>(hw.day);
  return (
    <div className="modal-backdrop">
      <div className="modal" style={{ maxWidth: 460 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>숙제 내용 수정</div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>{hw.studentName}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6 }}>제출 요일</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {ALL_DAYS.map(d => (
              <button key={d} onClick={() => setDay(d)} style={{
                flex: 1, padding: '8px 4px', borderRadius: 8, border: '2px solid',
                borderColor: day === d ? '#6366f1' : '#e2e8f0', background: day === d ? '#eff0ff' : 'white',
                color: day === d ? '#6366f1' : '#64748b', fontWeight: day === d ? 800 : 400, fontSize: 13,
                cursor: 'pointer', minHeight: 'unset',
              }}>{DAY_LABELS[d]}</button>
            ))}
          </div>
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
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => onSave({ ...hw, ...form, day })}>저장</button>
        </div>
      </div>
    </div>
  );
}

/* ── Homework Detail + Action Modal ────────────────────────── */
function HomeworkDetailModal({ hw, onAction, onEdit, onClose }: {
  hw: DayHomework; onAction: (type: string, payload: unknown) => void; onEdit: () => void; onClose: () => void;
}) {
  const [moveDay, setMoveDay] = useState<HomeworkDay | null>(null);
  const m = STATUS_META[hw.status];
  const hasContent = hw.computer || hw.textbook || hw.vocabulary || hw.other;

  const isExpectedDateToday = (dateStr?: string) => {
    if (!dateStr) return false;
    const expected = new Date(dateStr);
    expected.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return expected.getTime() === today.getTime();
  };

  const canProcessCompletion = hw.status === 'agreed' && hw.expectedSubmitDate && isExpectedDateToday(hw.expectedSubmitDate);

  const STAGE_INFO: Record<string, { step: number; title: string; desc: string; icon: string }> = {
    pending:   { step: 1, title: '합의 대기 중',  desc: '교사와 숙제 범위를 합의하는 단계입니다', icon: '🤝' },
    agreed:    { step: 2, title: '숙제 진행 중',  desc: '합의된 숙제를 학생이 진행하는 단계입니다', icon: '✏️' },
    submitted: { step: 3, title: '완료 확인 중',  desc: '학생이 제출 — 교사 최종 확인이 필요합니다', icon: '📬' },
    confirmed: { step: 4, title: '완료',          desc: '교사가 최종 승인한 숙제입니다', icon: '✅' },
    approved:  { step: 4, title: '완료',          desc: '교사가 최종 승인한 숙제입니다', icon: '✅' },
    rejected:  { step: 0, title: '미완료',        desc: '완료하지 못한 숙제입니다. 다른 날로 이동할 수 있습니다', icon: '🔄' },
    missed:    { step: 0, title: '미이행',         desc: '기한 내 숙제를 이행하지 않았습니다', icon: '⚠️' },
    no_hw:     { step: 0, title: '숙제 없음',       desc: '이 날은 숙제가 없습니다', icon: '📭' },
  };
  const stage = STAGE_INFO[hw.status] ?? { step: 0, title: hw.status, desc: '', icon: '?' };

  return (
    <div className="modal-backdrop">
      <div className="modal" style={{ maxWidth: 500 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>{hw.studentName}</div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>
              {DAY_LABELS[hw.day]}요일 숙제
              <span style={{ marginLeft: 10, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: m.bg, color: m.color }}>{m.label}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
            <X size={20} color="#94a3b8" />
          </button>
        </div>
        <div style={{ background: m.bg, borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 28 }}>{stage.icon}</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: m.color }}>{stage.title}</div>
            <div style={{ fontSize: 12, color: m.color, opacity: 0.8, marginTop: 2 }}>{stage.desc}</div>
          </div>
          {stage.step > 0 && (
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
              {[1, 2, 3, 4].map(n => (
                <div key={n} style={{ width: 8, height: 8, borderRadius: '50%', background: n <= stage.step ? m.color : `${m.color}30` }} />
              ))}
            </div>
          )}
        </div>
        <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 10, letterSpacing: 0.5 }}>숙제 내용</div>
          {hasContent ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(['computer', 'textbook', 'vocabulary', 'other'] as const).map(cat =>
                hw[cat] ? (
                  <div key={cat} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'white', background: '#6366f1', borderRadius: 6, padding: '2px 7px', whiteSpace: 'nowrap', flexShrink: 0, marginTop: 2 }}>{CAT_LABELS[cat]}</span>
                    <span style={{ fontSize: 14, color: '#1e293b', lineHeight: 1.6 }}>{hw[cat]}</span>
                  </div>
                ) : null
              )}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '12px 0' }}>숙제 내용이 없습니다</div>
          )}
        </div>
        {hw.expectedSubmitDate && (
          <div style={{ background: isExpectedDateToday(hw.expectedSubmitDate) ? '#f0fdf4' : '#fef3c7', borderRadius: 10, padding: '10px 14px', marginBottom: 16, border: `1px solid ${isExpectedDateToday(hw.expectedSubmitDate) ? '#bbf7d0' : '#fcd34d'}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: isExpectedDateToday(hw.expectedSubmitDate) ? '#15803d' : '#92400e' }}>
              📅 완료 예정일: {new Date(hw.expectedSubmitDate).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })} {isExpectedDateToday(hw.expectedSubmitDate) ? '(오늘)' : ''}
            </div>
          </div>
        )}
        <div style={{ borderTop: '1px solid #f1f5f9', marginBottom: 16 }} />
        {hw.status === 'agreed' && !canProcessCompletion && (
          <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 10, background: '#fef3c7', border: '1px solid #fcd34d', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ fontSize: 16, flexShrink: 0, marginTop: 2 }}>⏳</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#92400e', marginBottom: 4 }}>완료 처리 안내</div>
              <div style={{ fontSize: 11, color: '#92400e', lineHeight: 1.5 }}>
                {!hw.expectedSubmitDate ? '완료 예정일이 설정되지 않았습니다. 예정일을 지정한 후 그 날짜에 완료 처리할 수 있습니다.' : '오늘이 완료 예정일이 아닙니다. 예정일이 도래하면 완료 처리할 수 있습니다.'}
              </div>
            </div>
          </div>
        )}
        <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 10 }}>교사 처리</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={onEdit} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '10px 16px', borderRadius: 9, border: '1px solid #e2e8f0', background: 'white', color: '#374151', cursor: 'pointer', fontSize: 13, fontWeight: 600, minHeight: 'unset' }}>
            <Edit2 size={13} /> 내용 수정
          </button>
          {hw.status === 'pending' && (<>
            <button onClick={() => { onAction('AGREE_HOMEWORK', hw.id); onClose(); }} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 16px', borderRadius: 9, border: 'none', background: '#6366f1', color: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 800, minHeight: 'unset' }}>
              <CheckCircle size={15} /> 합의 승인
            </button>
            <button onClick={() => { onAction('REJECT_HOMEWORK', hw.id); onClose(); }} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '10px 16px', borderRadius: 9, border: 'none', background: '#fff7ed', color: '#c2410c', cursor: 'pointer', fontSize: 13, fontWeight: 700, minHeight: 'unset' }}>
              <XCircle size={13} /> 미완료
            </button>
          </>)}
          {hw.status === 'agreed' && (<>
            <button onClick={() => { onAction('CONFIRM_HOMEWORK', { id: hw.id, result: 'confirmed' }); onClose(); }} disabled={!canProcessCompletion} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 16px', borderRadius: 9, border: 'none', background: canProcessCompletion ? '#22c55e' : '#cbd5e1', color: 'white', cursor: canProcessCompletion ? 'pointer' : 'default', fontSize: 14, fontWeight: 800, minHeight: 'unset' }}>
              <CheckCircle size={15} /> 완료 처리
            </button>
            <button onClick={() => { onAction('REJECT_HOMEWORK', hw.id); onClose(); }} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '10px 16px', borderRadius: 9, border: 'none', background: '#fff7ed', color: '#c2410c', cursor: 'pointer', fontSize: 13, fontWeight: 700, minHeight: 'unset' }}>
              <XCircle size={13} /> 미완료
            </button>
          </>)}
          {hw.status === 'submitted' && (<>
            <button onClick={() => { onAction('CONFIRM_HOMEWORK', { id: hw.id, result: 'approved' }); onClose(); }} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 16px', borderRadius: 9, border: 'none', background: '#22c55e', color: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 800, minHeight: 'unset' }}>
              <CheckCircle size={15} /> 교사 승인
            </button>
            <button onClick={() => { onAction('CONFIRM_HOMEWORK', { id: hw.id, result: 'rejected' }); onClose(); }} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '10px 16px', borderRadius: 9, border: 'none', background: '#fff7ed', color: '#c2410c', cursor: 'pointer', fontSize: 13, fontWeight: 700, minHeight: 'unset' }}>
              <XCircle size={13} /> 미완료
            </button>
          </>)}
          {(hw.status === 'confirmed' || hw.status === 'approved') && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 14, color: '#15803d', fontWeight: 700 }}>✅ 완료</span>
              <button onClick={() => { onAction('UPDATE_HOMEWORK', { ...hw, status: 'agreed' }); onClose(); }} style={{ padding: '8px 14px', borderRadius: 9, border: '1px solid #fca5a5', background: '#fff5f5', color: '#991b1b', cursor: 'pointer', fontSize: 13, fontWeight: 700, minHeight: 'unset' }}>
                완료 취소
              </button>
            </div>
          )}
          {hw.status === 'rejected' && (
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#c2410c', marginBottom: 10 }}>🔄 다른 날로 이동</div>
              <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
                {ALL_DAYS.map(d => (
                  <button key={d} onClick={() => setMoveDay(d)} style={{
                    flex: 1, padding: '7px 4px', borderRadius: 7, border: '2px solid',
                    borderColor: moveDay === d ? '#6366f1' : '#e2e8f0', background: moveDay === d ? '#eff0ff' : 'white',
                    color: moveDay === d ? '#6366f1' : '#64748b', fontWeight: moveDay === d ? 800 : 400, fontSize: 12, cursor: 'pointer', minHeight: 'unset',
                  }}>{DAY_LABELS[d]}</button>
                ))}
              </div>
              {moveDay && (
                <button onClick={() => { onAction('UPDATE_HOMEWORK', { ...hw, day: moveDay, status: 'agreed' }); onClose(); }} style={{ width: '100%', padding: '10px', borderRadius: 9, border: 'none', background: '#6366f1', color: 'white', fontWeight: 800, fontSize: 14, cursor: 'pointer', minHeight: 'unset' }}>
                  {DAY_LABELS[moveDay]}요일로 이동
                </button>
              )}
            </div>
          )}
          {hw.status === 'missed' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 2 }}>상태 변경</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button onClick={() => { onAction('UPDATE_HOMEWORK', { ...hw, status: 'agreed', agreedAt: new Date().toISOString() }); onClose(); }}
                  style={{ flex: 1, padding: '10px 12px', borderRadius: 9, border: 'none', background: '#eff0ff', color: '#4338ca', cursor: 'pointer', fontSize: 13, fontWeight: 700, minHeight: 'unset' }}>
                  ✏️ 진행 중
                </button>
                <button onClick={() => { onAction('CONFIRM_HOMEWORK', { id: hw.id, result: 'confirmed' }); onClose(); }}
                  style={{ flex: 1, padding: '10px 12px', borderRadius: 9, border: 'none', background: '#d1fae5', color: '#15803d', cursor: 'pointer', fontSize: 13, fontWeight: 700, minHeight: 'unset' }}>
                  ✅ 완료
                </button>
                <button onClick={() => { onAction('DELETE_HOMEWORK', hw.id); onClose(); }}
                  style={{ padding: '10px 12px', borderRadius: 9, border: '1px solid #e2e8f0', background: 'white', color: '#94a3b8', cursor: 'pointer', fontSize: 13, fontWeight: 700, minHeight: 'unset' }}>
                  되돌리기
                </button>
              </div>
            </div>
          )}
          {hw.status === 'no_hw' && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 14, color: '#475569', fontWeight: 700 }}>📭 숙제 없음</span>
              <button onClick={() => { onAction('DELETE_HOMEWORK', hw.id); onClose(); }} style={{ padding: '8px 14px', borderRadius: 9, border: '1px solid #e2e8f0', background: 'white', color: '#64748b', cursor: 'pointer', fontSize: 13, fontWeight: 700, minHeight: 'unset' }}>
                되돌리기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────────── */
export default function HomeworkPage() {
  const { state, dispatch, loadCol, undo, canUndo, undoLabel, undoCount } = useStore();
  const [week, setWeek] = useState(state.currentWeek);
  const [refreshing, setRefreshing] = useState(false);
  const [classFilter, setClassFilter] = useState('전체');
  const [nameSearch, setNameSearch] = useState('');
  const [editHW, setEditHW] = useState<DayHomework | null>(null);
  const [detailHW, setDetailHW] = useState<DayHomework | null>(null);
  const [addHWTarget, setAddHWTarget] = useState<{ student: Student; day: HomeworkDay } | null>(null);

  // TABLE 2 전용 상태
  const [groupBy, setGroupBy] = useState<'day' | 'class'>('day');
  const [hwStatusFilter, setHwStatusFilter] = useState<'all' | 'active' | 'missed' | 'done' | 'no_hw'>('all');
  const [selectedSet, setSelectedSet] = useState<Set<string>>(new Set());

  useEffect(() => { loadCol('homework'); }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCol('homework');
    setRefreshing(false);
  };

  // ── 기본 데이터 ─────────────────────────────────────────────
  const globalDaysRaw = new Set(state.students.flatMap(s => s.scheduleDays || []));
  const globalDays = globalDaysRaw.size > 0 ? globalDaysRaw : new Set(['mon', 'tue', 'wed', 'thu', 'fri']);
  const classGroups = ['전체', ...new Set(state.students.map(s => s.classGroup))];

  const filteredStudents = state.students.filter(s => {
    if (classFilter !== '전체' && s.classGroup !== classFilter) return false;
    const q = nameSearch.trim();
    if (q && !s.name.includes(q) && !(s.classGroup ?? '').includes(q)) return false;
    return true;
  });

  const weekHW = state.dayHomeworks.filter(h => h.week === week);
  const scheduledDays = useMemo(() => DAY_ORDER.filter(d => globalDays.has(d)), [globalDays]);

  const weekStart = useMemo(() => getWeekDateRange(week).start, [week]);
  const getDayDate = (day: HomeworkDay): string => {
    const offsets: Record<string, number> = { mon: 0, tue: 1, wed: 2, thu: 3, fri: 4 };
    const d = new Date(weekStart);
    d.setDate(d.getDate() + (offsets[day] ?? 0));
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };
  const prevScheduledDay = (day: HomeworkDay): HomeworkDay | null => {
    const idx = scheduledDays.indexOf(day);
    return idx > 0 ? scheduledDays[idx - 1] : null;
  };

  const studentScheduledFor = (s: Student, day: HomeworkDay) =>
    s.scheduleDays ? s.scheduleDays.includes(day) : globalDays.has(day);

  // ── Homework number ─────────────────────────────────────────
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

  // ── 미이행/숙제없음 헬퍼 ──────────────────────────────────────
  const doMarkMissed = (student: Student, day: HomeworkDay) =>
    dispatch({
      type: 'ADD_HOMEWORK',
      payload: {
        id: `missed-${student.id}-${week}-${day}`,
        studentId: student.id, studentName: student.name,
        week, day, computer: '', textbook: '', vocabulary: '', other: '',
        submittedAt: new Date().toISOString(), status: 'missed',
      },
    });

  const doMarkNoHW = (student: Student, day: HomeworkDay) =>
    dispatch({
      type: 'ADD_HOMEWORK',
      payload: {
        id: `nohw-${student.id}-${week}-${day}`,
        studentId: student.id, studentName: student.name,
        week, day, computer: '', textbook: '', vocabulary: '', other: '',
        submittedAt: new Date().toISOString(), status: 'no_hw',
      },
    });

  // ── 합계 계산 ────────────────────────────────────────────────
  const weekToMon = weekToMonth;
  const currentMonth = weekToMon(week);
  const monthHW = state.dayHomeworks.filter(h => weekToMon(h.week) === currentMonth);

  const weekDoneCount = (sid: string) => weekHW.filter(h => h.studentId === sid && isDone(h)).length;
  const weekRecordCount = (sid: string) => weekHW.filter(h => h.studentId === sid && h.status !== 'missed' && h.status !== 'no_hw').length;
  const monthDoneCount = (sid: string) => monthHW.filter(h => h.studentId === sid && isDone(h)).length;
  const monthRecordCount = (sid: string) => monthHW.filter(h => h.studentId === sid && h.status !== 'missed' && h.status !== 'no_hw').length;
  const allTimeDoneCount = (sid: string) => state.dayHomeworks.filter(h => h.studentId === sid && isDone(h)).length;
  const allTimeRecordCount = (sid: string) => state.dayHomeworks.filter(h => h.studentId === sid && h.status !== 'missed' && h.status !== 'no_hw').length;

  const weekTotalDone = filteredStudents.reduce((s, st) => s + weekDoneCount(st.id), 0);
  const weekTotalRecord = filteredStudents.reduce((s, st) => s + weekRecordCount(st.id), 0);
  const monthTotalDone = filteredStudents.reduce((s, st) => s + monthDoneCount(st.id), 0);
  const monthTotalRecord = filteredStudents.reduce((s, st) => s + monthRecordCount(st.id), 0);
  const allTimeTotalDone = filteredStudents.reduce((s, st) => s + allTimeDoneCount(st.id), 0);
  const allTimeTotalRecord = filteredStudents.reduce((s, st) => s + allTimeRecordCount(st.id), 0);

  // ── TABLE 2 전체 행 목록 ──────────────────────────────────────
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
    const priority = (hw: DayHomework | null) => {
      if (!hw) return 1;
      if (isActive(hw)) return 0;
      if (isDone(hw)) return 2;
      if (hw.status === 'missed') return 3;
      return 4;
    };
    return rows.sort((a, b) => {
      const pd = priority(a.hw) - priority(b.hw);
      return pd !== 0 ? pd : a.student.name.localeCompare(b.student.name);
    });
  }, [weekHW, filteredStudents]);

  // ── TABLE 2 필터 + 그룹 ──────────────────────────────────────
  const rowKey = (student: Student, day: HomeworkDay, hw: DayHomework | null) =>
    hw ? hw.id : `noHW-${student.id}-${day}`;

  const table2Rows = useMemo(() => {
    return allWeekRows.filter(({ hw }) => {
      if (hwStatusFilter === 'all') return true;
      if (hwStatusFilter === 'active') return !hw || isActive(hw);
      if (hwStatusFilter === 'done') return hw !== null && isDone(hw);
      if (hwStatusFilter === 'missed') return !!(hw?.status === 'missed' || hw?.status === 'rejected');
      if (hwStatusFilter === 'no_hw') return hw?.status === 'no_hw';
      return true;
    });
  }, [hwStatusFilter, allWeekRows]);

  const table2Groups = useMemo(() => {
    if (groupBy === 'day') {
      return (scheduledDays as HomeworkDay[])
        .map(day => ({
          key: day,
          label: `${DAY_LABELS[day as keyof typeof DAY_LABELS]}요일`,
          sub: getDayDate(day),
          rows: table2Rows.filter(r => r.day === day),
        }))
        .filter(g => g.rows.length > 0);
    } else {
      const classes = [...new Set(filteredStudents.map(s => s.classGroup || '미지정'))];
      return classes
        .map(cls => ({
          key: cls,
          label: cls,
          sub: '',
          rows: table2Rows.filter(r => (r.student.classGroup || '미지정') === cls),
        }))
        .filter(g => g.rows.length > 0);
    }
  }, [groupBy, table2Rows, scheduledDays, filteredStudents]);

  const hwStatusFilterCounts = useMemo(() => ({
    all: allWeekRows.length,
    active: allWeekRows.filter(r => !r.hw || isActive(r.hw)).length,
    done: allWeekRows.filter(r => r.hw !== null && isDone(r.hw)).length,
    missed: allWeekRows.filter(r => !!(r.hw?.status === 'missed' || r.hw?.status === 'rejected')).length,
    no_hw: allWeekRows.filter(r => r.hw?.status === 'no_hw').length,
  }), [allWeekRows]);

  // ── 선택 로직 ────────────────────────────────────────────────
  const allTable2Keys = useMemo(() => new Set(table2Rows.map(r => rowKey(r.student, r.day, r.hw))), [table2Rows]);
  const totalSelected = useMemo(() => [...allTable2Keys].filter(k => selectedSet.has(k)).length, [allTable2Keys, selectedSet]);
  const allSelected2 = table2Rows.length > 0 && table2Rows.every(r => selectedSet.has(rowKey(r.student, r.day, r.hw)));

  const toggleSelectAll2 = () => {
    if (allSelected2) {
      setSelectedSet(prev => { const next = new Set(prev); allTable2Keys.forEach(k => next.delete(k)); return next; });
    } else {
      setSelectedSet(prev => new Set([...prev, ...allTable2Keys]));
    }
  };
  const toggleSelect = (key: string) => {
    setSelectedSet(prev => { const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next; });
  };

  // ── 일괄 처리 ────────────────────────────────────────────────
  const selectedActiveItems = table2Rows.filter(r => r.hw && selectedSet.has(r.hw.id) && r.hw.status === 'agreed');
  const selectedUnrecordedItems = table2Rows.filter(r => !r.hw && selectedSet.has(`noHW-${r.student.id}-${r.day}`));
  // 미이행으로 되돌리기: 기록된 항목 중 missed가 아닌 것
  const selectedRevertItems = table2Rows.filter(r => r.hw && selectedSet.has(r.hw.id) && r.hw.status !== 'missed');
  // 미이행 기록 삭제 (미기록으로 되돌리기): missed 항목
  const selectedMissedItems = table2Rows.filter(r => r.hw && selectedSet.has(r.hw.id) && r.hw.status === 'missed');
  const selectedNoHWItems = table2Rows.filter(r => r.hw && selectedSet.has(r.hw.id) && r.hw.status === 'no_hw');

  const bulkComplete = () => {
    selectedActiveItems.forEach(({ hw }) => {
      if (hw) doAction('CONFIRM_HOMEWORK', { id: hw.id, result: 'confirmed' });
    });
    setSelectedSet(new Set());
  };
  const bulkMissed = () => {
    selectedUnrecordedItems.forEach(({ student, day }) => doMarkMissed(student, day));
    setSelectedSet(new Set());
  };
  const bulkNoHW = () => {
    selectedUnrecordedItems.forEach(({ student, day }) => doMarkNoHW(student, day));
    setSelectedSet(new Set());
  };
  const bulkDeleteNoHW = () => {
    selectedNoHWItems.forEach(({ hw }) => { if (hw) doAction('DELETE_HOMEWORK', hw.id); });
    setSelectedSet(new Set());
  };
  const bulkRevertToMissed = () => {
    selectedRevertItems.forEach(({ hw }) => {
      if (hw) doAction('UPDATE_HOMEWORK', { ...hw, status: 'missed' });
    });
    setSelectedSet(new Set());
  };
  const bulkDeleteMissed = () => {
    selectedMissedItems.forEach(({ hw }) => {
      if (hw) doAction('DELETE_HOMEWORK', hw.id);
    });
    setSelectedSet(new Set());
  };

  const doAction = (type: string, payload: unknown) =>
    dispatch({ type, payload } as Parameters<typeof dispatch>[0]);

  const activeCount = allWeekRows.filter(r => r.hw && isActive(r.hw)).length;
  const unrecordedCount = allWeekRows.filter(r => !r.hw).length;

  return (
    <div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── 헤더 ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>숙제 관리</h1>
          <p style={{ color: '#64748b', marginTop: 2, fontSize: 13 }}>주간 숙제 현황 · ① 합의 → ② 진행중 → ③ 완료확인 → ④ 완료</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* 되돌리기 버튼 */}
          {canUndo && (
            <button onClick={undo} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 8, border: '1.5px solid #fca5a5',
              background: '#fff5f5', color: '#991b1b', cursor: 'pointer',
              fontSize: 13, fontWeight: 700, minHeight: 'unset',
            }}>
              <RotateCcw size={14} />
              되돌리기 · {undoLabel}
              <span style={{ fontSize: 11, background: '#fee2e2', color: '#991b1b', borderRadius: 20, padding: '1px 7px', fontWeight: 800 }}>
                {undoCount}/5
              </span>
            </button>
          )}
          <button onClick={handleRefresh} disabled={refreshing} style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 8,
            border: '1px solid #e2e8f0', background: '#fff', cursor: refreshing ? 'not-allowed' : 'pointer',
            fontSize: 13, fontWeight: 600, color: '#6366f1', opacity: refreshing ? 0.6 : 1,
          }}>
            <span style={{ display: 'inline-block', animation: refreshing ? 'spin 0.7s linear infinite' : 'none' }}>↻</span>
            {refreshing ? '로딩 중...' : '새로고침'}
          </button>
          <WeekSelector week={week} onChange={setWeek} />
        </div>
      </div>

      {/* ── 이름 검색 ── */}
      <div style={{ marginBottom: 14 }}>
        <input type="text" placeholder="이름 또는 반 검색..." value={nameSearch}
          onChange={e => setNameSearch(e.target.value)}
          style={{ width: '100%', maxWidth: 280, padding: '8px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', background: 'white', boxSizing: 'border-box' }} />
      </div>

      {/* ── 반 필터 ── */}
      {classGroups.length > 2 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
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

      {/* ══════════════════════════════════════════════════════════
          TABLE 1 · 주간 숙제 누적 현황
      ══════════════════════════════════════════════════════════ */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#1e293b', marginBottom: 10 }}>
          📊 주간 숙제 누적 현황
          <span style={{ fontSize: 12, fontWeight: 400, color: '#94a3b8', marginLeft: 8 }}>셀 클릭 → 상세 보기 &amp; 승인/완료 처리</span>
        </div>
        <div style={{ overflowX: 'auto', overflowY: 'visible', borderRadius: 14, border: '1px solid #e2e8f0', background: 'white', WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'], touchAction: 'manipulation', display: 'block' } as React.CSSProperties}>
          <table style={{ minWidth: '100%', borderCollapse: 'collapse', fontSize: 13, touchAction: 'auto', display: 'table' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap', minWidth: 80 }}>학생</th>
                {ALL_DAYS.map(day => (
                  <th key={day} style={{ padding: '6px 4px', textAlign: 'center', fontWeight: 700, color: '#475569', minWidth: 90 }}>
                    <div style={{ fontSize: 14, marginBottom: 2 }}>{DAY_LABELS[day]}요일</div>
                    <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4 }}>{getDayDate(day)}</div>
                    <div style={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: '#15803d', background: '#d1fae5', borderRadius: 4, padding: '1px 5px' }}>전수업</span>
                      <span style={{ fontSize: 9, fontWeight: 700, color: '#1e40af', background: '#dbeafe', borderRadius: 4, padding: '1px 5px' }}>합의</span>
                    </div>
                  </th>
                ))}
                <th style={{ padding: '12px 12px', textAlign: 'center', fontWeight: 800, color: '#6366f1', fontSize: 15, minWidth: 90, whiteSpace: 'nowrap', borderLeft: '2px solid #e2e8f0' }}>주간</th>
                <th style={{ padding: '12px 12px', textAlign: 'center', fontWeight: 800, color: '#f59e0b', fontSize: 15, minWidth: 90, whiteSpace: 'nowrap' }}>월간</th>
                <th style={{ padding: '12px 12px', textAlign: 'center', fontWeight: 800, color: '#0ea5e9', fontSize: 15, minWidth: 90, whiteSpace: 'nowrap' }}>전체</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr><td colSpan={9} style={{ padding: 24, textAlign: 'center', color: '#cbd5e1', fontSize: 13 }}>학생이 없습니다</td></tr>
              ) : filteredStudents.map((student, idx) => {
                const studentWeekHW = weekHW.filter(h => h.studentId === student.id);
                return (
                  <tr key={student.id} style={{ borderBottom: idx < filteredStudents.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                    <td style={{ padding: '10px 16px', fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap' }}>
                      <div>{student.name}</div>
                      {student.classGroup && <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400 }}>{student.classGroup}</div>}
                    </td>
                    {ALL_DAYS.map(day => {
                      const hw = studentWeekHW.find(h => h.day === day);
                      const isScheduled = studentScheduledFor(student, day);
                      const hwNum = hw ? hwNumbers.get(hw.id) : null;
                      const m = hw ? STATUS_META[hw.status] : null;
                      const prevDay = prevScheduledDay(day);
                      const prevHw = prevDay ? studentWeekHW.find(h => h.day === prevDay) : null;
                      const prevHwNum = prevHw ? hwNumbers.get(prevHw.id) : null;
                      const isCompletePhase = prevHw != null && ['submitted', 'confirmed', 'approved'].includes(prevHw.status);
                      return (
                        <td key={day} style={{ padding: 0, textAlign: 'center', background: isScheduled ? 'white' : '#f5f5f5', verticalAlign: 'middle' }}>
                          <div style={{ borderBottom: '1px solid #e2e8f0', padding: '5px 4px', minHeight: 36, background: isCompletePhase ? '#f0fdf4' : isScheduled ? '#fafafa' : '#f0f0f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                            {isCompletePhase && prevHw && prevDay ? (
                              <button onClick={() => setDetailHW(prevHw)} style={{ padding: '2px 5px', borderRadius: 5, background: 'none', border: 'none', cursor: 'pointer', minHeight: 'unset', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, width: '100%' }}>
                                {prevHwNum && <span style={{ fontSize: 9, fontWeight: 800, color: '#94a3b8' }}>#{prevHwNum}</span>}
                                {(() => { const d = prevHw.submittedAt || prevHw.agreedAt; const date = d ? new Date(d) : null; return date ? <span style={{ fontSize: 10, fontWeight: 700, color: '#15803d', background: '#d1fae5', padding: '1px 6px', borderRadius: 5 }}>{`${date.getMonth()+1}/${date.getDate()}`}</span> : null; })()}
                                {isDone(prevHw) ? <span style={{ fontSize: 9, color: '#15803d' }}>✓완료</span> : <span style={{ fontSize: 9, color: '#1e40af' }}>확인중</span>}
                              </button>
                            ) : <span style={{ fontSize: 9, color: isScheduled ? '#d1d5db' : '#e5e7eb' }}>–</span>}
                          </div>
                          <div style={{ padding: '5px 4px', minHeight: 36, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                            {hw && m ? (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, width: '100%' }}>
                                <button onClick={() => setDetailHW(hw)} style={{ padding: '2px 6px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: m.bg, color: m.color, border: `1px solid ${m.color}30`, cursor: 'pointer', minHeight: 'unset', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, width: '100%' }}>
                                  {hwNum && <span style={{ fontSize: 9, fontWeight: 800, opacity: 0.7 }}>#{hwNum}</span>}
                                  {(() => { const d = hw.submittedAt || hw.agreedAt; const date = d ? new Date(d) : null; return date ? <span style={{ fontSize: 9, opacity: 0.75 }}>{`${date.getMonth()+1}/${date.getDate()}`}</span> : null; })()}
                                  <span>{m.label}</span>
                                </button>
                                {hw.status === 'agreed' && hw.expectedSubmitDate && (() => {
                                  const expected = new Date(hw.expectedSubmitDate);
                                  expected.setHours(0, 0, 0, 0);
                                  const today = new Date();
                                  today.setHours(0, 0, 0, 0);
                                  const canProcess = expected.getTime() <= today.getTime();
                                  return canProcess ? (
                                    <button onClick={() => { dispatch({ type: 'CONFIRM_HOMEWORK', payload: { id: hw.id, result: 'confirmed' } }); }} style={{ fontSize: 8, padding: '2px 4px', borderRadius: 4, border: 'none', background: '#22c55e', color: 'white', cursor: 'pointer', fontWeight: 700, minHeight: 'unset', whiteSpace: 'nowrap' }}>
                                      완료
                                    </button>
                                  ) : null;
                                })()}
                              </div>
                            ) : isScheduled ? (
                              <button onClick={() => setAddHWTarget({ student, day })} style={{ fontSize: 9, color: '#cbd5e1', background: 'none', border: '1px dashed #e2e8f0', borderRadius: 5, padding: '2px 6px', cursor: 'pointer', minHeight: 'unset' }}>
                                + 등록
                              </button>
                            ) : <span style={{ fontSize: 9, color: '#e5e7eb' }}>–</span>}
                          </div>
                        </td>
                      );
                    })}
                    <td style={{ padding: '10px 12px', textAlign: 'center', borderLeft: '2px solid #f1f5f9' }}>
                      {weekRecordCount(student.id) === 0 ? <span style={{ color: '#cbd5e1' }}>–</span> : (
                        <div style={{ fontSize: 16, fontWeight: 800, whiteSpace: 'nowrap' }}>
                          <span style={{ color: '#22c55e' }}>{weekDoneCount(student.id)}</span>
                          <span style={{ color: '#cbd5e1', fontWeight: 400, margin: '0 2px' }}>/</span>
                          <span style={{ color: '#6366f1' }}>{weekRecordCount(student.id)}</span>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      {monthRecordCount(student.id) === 0 ? <span style={{ color: '#cbd5e1' }}>–</span> : (
                        <div style={{ fontSize: 16, fontWeight: 800, whiteSpace: 'nowrap' }}>
                          <span style={{ color: '#22c55e' }}>{monthDoneCount(student.id)}</span>
                          <span style={{ color: '#cbd5e1', fontWeight: 400, margin: '0 2px' }}>/</span>
                          <span style={{ color: '#f59e0b' }}>{monthRecordCount(student.id)}</span>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      {allTimeRecordCount(student.id) === 0 ? <span style={{ color: '#cbd5e1' }}>–</span> : (
                        <div style={{ fontSize: 16, fontWeight: 800, whiteSpace: 'nowrap' }}>
                          <span style={{ color: '#22c55e' }}>{allTimeDoneCount(student.id)}</span>
                          <span style={{ color: '#cbd5e1', fontWeight: 400, margin: '0 2px' }}>/</span>
                          <span style={{ color: '#0ea5e9' }}>{allTimeRecordCount(student.id)}</span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {filteredStudents.length > 0 && (
              <tfoot>
                <tr style={{ background: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
                  <td style={{ padding: '10px 16px', fontWeight: 800, color: '#475569', fontSize: 13 }}>합계</td>
                  {ALL_DAYS.map(day => {
                    const prevDay = prevScheduledDay(day);
                    const prevCompleted = prevDay ? weekHW.filter(h => h.day === prevDay && ['submitted', 'confirmed', 'approved'].includes(h.status) && filteredStudents.some(s => s.id === h.studentId)).length : 0;
                    const prevDone = prevDay ? weekHW.filter(h => h.day === prevDay && isDone(h) && filteredStudents.some(s => s.id === h.studentId)).length : 0;
                    const dayRec = weekHW.filter(h => h.day === day && h.status !== 'missed' && h.status !== 'no_hw' && filteredStudents.some(s => s.id === h.studentId)).length;
                    const dayTotal = filteredStudents.filter(s => studentScheduledFor(s, day)).length;
                    return (
                      <td key={`tfoot-${day}`} style={{ padding: 0, textAlign: 'center' }}>
                        <div style={{ borderBottom: '1px solid #e2e8f0', padding: '5px 4px', background: '#f0fdf4', minHeight: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                          {prevDay ? <span style={{ fontSize: 11, fontWeight: 700, color: '#15803d' }}><span style={{ color: '#22c55e' }}>{prevDone}</span><span style={{ color: '#cbd5e1', fontWeight: 400 }}>/{prevCompleted}</span></span> : <span style={{ fontSize: 10, color: '#cbd5e1' }}>–</span>}
                        </div>
                        <div style={{ padding: '5px 4px', minHeight: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#1e40af' }}>{dayRec}<span style={{ color: '#cbd5e1', fontWeight: 400 }}>/{dayTotal}</span></div>
                        </div>
                      </td>
                    );
                  })}
                  <td style={{ padding: '10px 12px', textAlign: 'center', borderLeft: '2px solid #e2e8f0' }}>
                    <div style={{ fontWeight: 900, fontSize: 18, whiteSpace: 'nowrap' }}><span style={{ color: '#22c55e' }}>{weekTotalDone}</span><span style={{ color: '#cbd5e1', fontWeight: 400, margin: '0 2px' }}>/</span><span style={{ color: '#6366f1' }}>{weekTotalRecord}</span></div>
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <div style={{ fontWeight: 900, fontSize: 18, whiteSpace: 'nowrap' }}><span style={{ color: '#22c55e' }}>{monthTotalDone}</span><span style={{ color: '#cbd5e1', fontWeight: 400, margin: '0 2px' }}>/</span><span style={{ color: '#f59e0b' }}>{monthTotalRecord}</span></div>
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <div style={{ fontWeight: 900, fontSize: 18, whiteSpace: 'nowrap' }}><span style={{ color: '#22c55e' }}>{allTimeTotalDone}</span><span style={{ color: '#cbd5e1', fontWeight: 400, margin: '0 2px' }}>/</span><span style={{ color: '#0ea5e9' }}>{allTimeTotalRecord}</span></div>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          TABLE 2 · 이번 주 전체 현황
      ══════════════════════════════════════════════════════════ */}
      <div>
        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#1e293b' }}>📋 이번 주 전체 현황</span>
          {activeCount > 0 && <span style={{ padding: '2px 10px', borderRadius: 20, background: '#fef3c7', color: '#92400e', fontSize: 12, fontWeight: 700 }}>처리 필요 {activeCount}건</span>}
          {unrecordedCount > 0 && <span style={{ padding: '2px 10px', borderRadius: 20, background: '#fee2e2', color: '#991b1b', fontSize: 12, fontWeight: 700 }}>미기록 {unrecordedCount}건</span>}
        </div>

        {/* 필터 컨트롤 바 */}
        <div style={{ background: 'white', borderRadius: 12, padding: '12px 16px', border: '1px solid #e2e8f0', marginBottom: 12, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          {/* 첫째 필터: 그룹 방식 */}
          <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
            {([['day', '요일별'], ['class', '반별']] as const).map(([val, label]) => (
              <button key={val} onClick={() => setGroupBy(val)} style={{
                padding: '6px 16px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, minHeight: 'unset',
                background: groupBy === val ? '#1e293b' : 'white',
                color: groupBy === val ? 'white' : '#64748b',
              }}>{label}</button>
            ))}
          </div>

          <div style={{ width: 1, height: 24, background: '#e2e8f0' }} />

          {/* 둘째 필터: 상태 */}
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {([
              ['all', '전체', '#475569', '#f8fafc', '#e2e8f0'],
              ['active', '이행중', '#4338ca', '#eff0ff', '#6366f1'],
              ['done', '완료', '#15803d', '#f0fdf4', '#22c55e'],
              ['missed', '미이행', '#991b1b', '#fef2f2', '#ef4444'],
              ['no_hw', '숙제없음', '#475569', '#f1f5f9', '#94a3b8'],
            ] as const).map(([key, label, color, bg, border]) => (
              <button key={key} onClick={() => setHwStatusFilter(key)} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 12px', borderRadius: 8, border: `1.5px solid ${hwStatusFilter === key ? border : '#e2e8f0'}`,
                background: hwStatusFilter === key ? bg : 'white',
                color: hwStatusFilter === key ? color : '#64748b',
                fontWeight: hwStatusFilter === key ? 700 : 400, fontSize: 12, cursor: 'pointer', minHeight: 'unset',
              }}>
                {label}
                <span style={{ fontSize: 10, fontWeight: 800, background: hwStatusFilter === key ? border + '22' : '#f1f5f9', color: hwStatusFilter === key ? color : '#94a3b8', padding: '1px 6px', borderRadius: 10 }}>
                  {hwStatusFilterCounts[key]}
                </span>
              </button>
            ))}
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 7, alignItems: 'center' }}>
            {/* 전체 선택 / 해제 */}
            <button onClick={toggleSelectAll2} style={{
              padding: '5px 12px', borderRadius: 8, border: '1px solid #e2e8f0',
              background: allSelected2 ? '#eff0ff' : 'white',
              color: allSelected2 ? '#6366f1' : '#475569',
              fontWeight: 700, fontSize: 12, cursor: 'pointer', minHeight: 'unset',
            }}>
              {allSelected2 ? '전체 해제' : '전체 선택'} ({table2Rows.length})
            </button>
            {totalSelected > 0 && (
              <button onClick={() => setSelectedSet(new Set())} style={{
                padding: '5px 12px', borderRadius: 8, border: '1px solid #e2e8f0',
                background: 'white', color: '#94a3b8',
                fontSize: 12, cursor: 'pointer', minHeight: 'unset',
              }}>
                선택 해제
              </button>
            )}
          </div>
        </div>

        {/* 일괄 처리 바 */}
        {totalSelected > 0 && (
          <div style={{ background: '#1e293b', borderRadius: 10, padding: '10px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>
              {totalSelected}건 선택됨
            </span>
            {selectedActiveItems.length > 0 && (
              <button onClick={bulkComplete} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 14px', borderRadius: 8, border: 'none',
                background: '#22c55e', color: 'white', fontWeight: 700, fontSize: 13,
                cursor: 'pointer', minHeight: 'unset',
              }}>
                <CheckCircle size={13} /> 완료 처리 ({selectedActiveItems.length}건)
              </button>
            )}
            {selectedUnrecordedItems.length > 0 && (<>
              <button onClick={bulkMissed} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 14px', borderRadius: 8, border: 'none',
                background: '#ef4444', color: 'white', fontWeight: 700, fontSize: 13,
                cursor: 'pointer', minHeight: 'unset',
              }}>
                <XCircle size={13} /> 미이행 처리 ({selectedUnrecordedItems.length}건)
              </button>
              <button onClick={bulkNoHW} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 14px', borderRadius: 8, border: '1.5px solid rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.9)', fontWeight: 700, fontSize: 13,
                cursor: 'pointer', minHeight: 'unset',
              }}>
                📭 숙제없음 처리 ({selectedUnrecordedItems.length}건)
              </button>
            </>)}
            {selectedRevertItems.length > 0 && (
              <button onClick={bulkRevertToMissed} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 14px', borderRadius: 8, border: '1.5px solid #fca5a5',
                background: 'rgba(255,255,255,0.1)', color: '#fca5a5', fontWeight: 700, fontSize: 13,
                cursor: 'pointer', minHeight: 'unset',
              }}>
                <RotateCcw size={13} /> 미이행으로 되돌리기 ({selectedRevertItems.length}건)
              </button>
            )}
            {selectedMissedItems.length > 0 && (
              <button onClick={bulkDeleteMissed} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 14px', borderRadius: 8, border: '1.5px solid rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)', fontWeight: 700, fontSize: 13,
                cursor: 'pointer', minHeight: 'unset',
              }}>
                <RotateCcw size={13} /> 미기록으로 되돌리기 ({selectedMissedItems.length}건)
              </button>
            )}
            {selectedNoHWItems.length > 0 && (
              <button onClick={bulkDeleteNoHW} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 14px', borderRadius: 8, border: '1.5px solid rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)', fontWeight: 700, fontSize: 13,
                cursor: 'pointer', minHeight: 'unset',
              }}>
                <RotateCcw size={13} /> 미기록으로 되돌리기 (숙제없음 {selectedNoHWItems.length}건)
              </button>
            )}
            <button onClick={() => setSelectedSet(new Set())} style={{
              marginLeft: 'auto', padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)',
              background: 'transparent', color: 'rgba(255,255,255,0.7)', fontSize: 12, cursor: 'pointer', minHeight: 'unset',
            }}>취소</button>
          </div>
        )}

        {/* 그룹별 목록 */}
        {table2Groups.length === 0 ? (
          <div style={{ padding: 28, textAlign: 'center', color: '#cbd5e1', borderRadius: 14, border: '1px dashed #e2e8f0', background: 'white', fontSize: 13 }}>
            해당 항목이 없습니다
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {table2Groups.map(group => (
              <div key={group.key} style={{ borderRadius: 14, border: '1px solid #e2e8f0', background: 'white', overflow: 'hidden' }}>
                {/* 그룹 헤더 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#1e293b' }}>{group.label}</span>
                  {group.sub && <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 400 }}>{group.sub}</span>}
                  <span style={{ padding: '2px 8px', borderRadius: 20, background: '#e2e8f0', color: '#475569', fontSize: 11, fontWeight: 700, marginLeft: 2 }}>
                    {group.rows.length}건
                  </span>
                  {/* 그룹 전체 선택 */}
                  <button
                    onClick={() => {
                      const groupKeys = new Set(group.rows.map(r => rowKey(r.student, r.day, r.hw)));
                      const allGroupSelected = [...groupKeys].every(k => selectedSet.has(k));
                      setSelectedSet(prev => {
                        const next = new Set(prev);
                        if (allGroupSelected) groupKeys.forEach(k => next.delete(k));
                        else groupKeys.forEach(k => next.add(k));
                        return next;
                      });
                    }}
                    style={{
                      marginLeft: 'auto', padding: '3px 10px', borderRadius: 6, border: '1px solid #e2e8f0',
                      background: 'white', color: '#64748b', fontSize: 11, cursor: 'pointer', minHeight: 'unset', fontWeight: 600,
                    }}
                  >
                    {[...new Set(group.rows.map(r => rowKey(r.student, r.day, r.hw)))].every(k => selectedSet.has(k)) ? '그룹 해제' : '그룹 선택'}
                  </button>
                </div>

                {/* 그룹 행 */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#fafafa', borderBottom: '1px solid #f1f5f9' }}>
                      <th style={{ width: 36, padding: '8px 12px', textAlign: 'center', color: '#94a3b8', fontWeight: 600, fontSize: 11 }}>선택</th>
                      <th style={{ padding: '8px 14px', textAlign: 'left', color: '#475569', fontWeight: 700, whiteSpace: 'nowrap' }}>학생</th>
                      {groupBy === 'class' && <th style={{ padding: '8px 12px', textAlign: 'center', color: '#475569', fontWeight: 700 }}>요일</th>}
                      <th style={{ padding: '8px 12px', textAlign: 'center', color: '#475569', fontWeight: 700, minWidth: 80 }}>상태</th>
                      <th style={{ padding: '8px 14px', textAlign: 'left', color: '#475569', fontWeight: 700 }}>숙제 내용</th>
                      <th style={{ padding: '8px 14px', textAlign: 'center', color: '#475569', fontWeight: 700, whiteSpace: 'nowrap', minWidth: 160 }}>액션</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.rows.map(({ key, student, day, hw }) => {
                      const rk = rowKey(student, day, hw);
                      const isSelected = selectedSet.has(rk);
                      const rowBg = isSelected ? '#f0f4ff'
                        : !hw ? '#fafafa'
                        : isActive(hw) ? '#fffdf0'
                        : isDone(hw) ? '#f0fdf4'
                        : hw.status === 'missed' ? '#fef2f2'
                        : hw.status === 'no_hw' ? '#f8fafc'
                        : 'white';

                      return (
                        <tr key={key} style={{ borderBottom: '1px solid #f1f5f9', background: rowBg }}>
                          {/* 체크박스 */}
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            <button onClick={() => toggleSelect(rk)} style={{
                              width: 22, height: 22, borderRadius: 6, border: `2px solid ${isSelected ? '#6366f1' : '#cbd5e1'}`,
                              background: isSelected ? '#6366f1' : 'white',
                              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              minHeight: 'unset', padding: 0, transition: 'all 0.12s', flexShrink: 0,
                            }}>
                              {isSelected && (
                                <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                                  <path d="M1 5L4.5 8.5L11 1" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </button>
                          </td>

                          {/* 학생 */}
                          <td style={{ padding: '10px 14px', fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap' }}>
                            <div>{student.name}</div>
                            {student.classGroup && groupBy === 'day' && <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 400 }}>{student.classGroup}</div>}
                          </td>

                          {/* 요일 (반별 그룹에서만) */}
                          {groupBy === 'class' && (
                            <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>
                              {DAY_LABELS[day]}
                            </td>
                          )}

                          {/* 상태 */}
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            {hw ? (
                              <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: STATUS_META[hw.status].bg, color: STATUS_META[hw.status].color, whiteSpace: 'nowrap' }}>
                                {STATUS_META[hw.status].label}
                              </span>
                            ) : (
                              <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: '#f1f5f9', color: '#94a3b8' }}>미기록</span>
                            )}
                          </td>

                          {/* 숙제 내용 */}
                          <td style={{ padding: '10px 14px', color: '#64748b', fontSize: 12, maxWidth: 220 }}>
                            {hw ? (
                              [hw.computer, hw.textbook, hw.vocabulary, hw.other].filter(Boolean).join(' / ').slice(0, 60)
                              || <span style={{ color: '#cbd5e1' }}>내용 없음</span>
                            ) : <span style={{ color: '#cbd5e1' }}>–</span>}
                          </td>

                          {/* 액션 */}
                          <td style={{ padding: '8px 14px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: 5, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
                              {hw && (<>
                                <button onClick={() => setDetailHW(hw)} style={{ padding: '4px 9px', borderRadius: 7, border: '1px solid #e2e8f0', background: 'white', color: '#374151', cursor: 'pointer', fontSize: 11, fontWeight: 600, minHeight: 'unset', display: 'flex', alignItems: 'center', gap: 3 }}>
                                  <Edit2 size={11} /> 상세
                                </button>
                                {hw.status === 'pending' && (
                                  <button onClick={() => doAction('AGREE_HOMEWORK', hw.id)} style={{ padding: '4px 10px', borderRadius: 7, border: 'none', background: '#6366f1', color: 'white', cursor: 'pointer', fontSize: 11, fontWeight: 700, minHeight: 'unset', display: 'flex', alignItems: 'center', gap: 3 }}>
                                    <CheckCircle size={11} /> 합의
                                  </button>
                                )}
                                {hw.status === 'agreed' && (
                                  <button onClick={() => doAction('CONFIRM_HOMEWORK', { id: hw.id, result: 'confirmed' })} style={{ padding: '4px 10px', borderRadius: 7, border: 'none', background: '#22c55e', color: 'white', cursor: 'pointer', fontSize: 11, fontWeight: 700, minHeight: 'unset', display: 'flex', alignItems: 'center', gap: 3 }}>
                                    <CheckCircle size={11} /> 완료
                                  </button>
                                )}
                                {hw.status === 'submitted' && (
                                  <button onClick={() => doAction('CONFIRM_HOMEWORK', { id: hw.id, result: 'approved' })} style={{ padding: '4px 10px', borderRadius: 7, border: 'none', background: '#22c55e', color: 'white', cursor: 'pointer', fontSize: 11, fontWeight: 700, minHeight: 'unset', display: 'flex', alignItems: 'center', gap: 3 }}>
                                    <CheckCircle size={11} /> 승인
                                  </button>
                                )}
                                {isActive(hw) && (
                                  <button onClick={() => doAction('REJECT_HOMEWORK', hw.id)} style={{ padding: '4px 9px', borderRadius: 7, border: 'none', background: '#fff7ed', color: '#c2410c', cursor: 'pointer', fontSize: 11, fontWeight: 700, minHeight: 'unset', display: 'flex', alignItems: 'center', gap: 3 }}>
                                    <XCircle size={11} /> 미완료
                                  </button>
                                )}
                                {isDone(hw) && (
                                  <button onClick={() => doAction('UPDATE_HOMEWORK', { ...hw, status: 'agreed' })} style={{ padding: '4px 9px', borderRadius: 7, border: '1px solid #fca5a5', background: '#fff5f5', color: '#991b1b', cursor: 'pointer', fontSize: 11, fontWeight: 700, minHeight: 'unset' }}>
                                    완료 취소
                                  </button>
                                )}
                                {hw.status === 'rejected' && (
                                  <button onClick={() => setDetailHW(hw)} style={{ padding: '4px 9px', borderRadius: 7, border: '1px solid #fed7aa', background: '#fff7ed', color: '#c2410c', cursor: 'pointer', fontSize: 11, fontWeight: 700, minHeight: 'unset' }}>
                                    🔄 날짜 이동
                                  </button>
                                )}
                                {hw.status === 'missed' && (
                                  <button onClick={() => doAction('DELETE_HOMEWORK', hw.id)} style={{
                                    padding: '4px 9px', borderRadius: 7, border: '1px solid #e2e8f0',
                                    background: 'white', color: '#64748b', cursor: 'pointer', fontSize: 11,
                                    fontWeight: 600, minHeight: 'unset', display: 'flex', alignItems: 'center', gap: 3,
                                  }}>
                                    <RotateCcw size={11} /> 되돌리기
                                  </button>
                                )}
                                {hw.status === 'no_hw' && (
                                  <button onClick={() => doAction('DELETE_HOMEWORK', hw.id)} style={{
                                    padding: '4px 9px', borderRadius: 7, border: '1px solid #e2e8f0',
                                    background: 'white', color: '#64748b', cursor: 'pointer', fontSize: 11,
                                    fontWeight: 600, minHeight: 'unset', display: 'flex', alignItems: 'center', gap: 3,
                                  }}>
                                    <RotateCcw size={11} /> 되돌리기
                                  </button>
                                )}
                              </>)}
                              {!hw && (<>
                                <button onClick={() => setAddHWTarget({ student, day })} style={{ padding: '4px 9px', borderRadius: 7, border: '1px solid #e2e8f0', background: 'white', color: '#374151', cursor: 'pointer', fontSize: 11, fontWeight: 600, minHeight: 'unset' }}>
                                  + 등록
                                </button>
                                <button onClick={() => doMarkMissed(student, day)} style={{ padding: '4px 9px', borderRadius: 7, border: 'none', background: '#fee2e2', color: '#991b1b', cursor: 'pointer', fontSize: 11, fontWeight: 700, minHeight: 'unset', display: 'flex', alignItems: 'center', gap: 3 }}>
                                  <AlertCircle size={11} /> 미이행
                                </button>
                                <button onClick={() => doMarkNoHW(student, day)} style={{ padding: '4px 9px', borderRadius: 7, border: 'none', background: '#f1f5f9', color: '#475569', cursor: 'pointer', fontSize: 11, fontWeight: 700, minHeight: 'unset' }}>
                                  📭 숙제없음
                                </button>
                              </>)}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {detailHW && !editHW && (
        <HomeworkDetailModal hw={detailHW} onAction={doAction} onEdit={() => { setEditHW(detailHW); setDetailHW(null); }} onClose={() => setDetailHW(null)} />
      )}
      {editHW && (
        <EditHomeworkModal hw={editHW} onSave={updated => { dispatch({ type: 'UPDATE_HOMEWORK', payload: updated }); setEditHW(null); }} onClose={() => setEditHW(null)} />
      )}
      {addHWTarget && (
        <CreateHomeworkModal student={addHWTarget.student} day={addHWTarget.day} week={week}
          onSave={hw => { dispatch({ type: 'ADD_HOMEWORK', payload: hw }); setAddHWTarget(null); }}
          onClose={() => setAddHWTarget(null)} />
      )}
    </div>
  );
}
