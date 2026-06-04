'use client';

import { useState, useRef, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Users, DollarSign, BookOpen, ClipboardCheck, Calendar, TrendingUp, Clock, X, CheckCircle } from 'lucide-react';
import { TestRecord, DayHomework, AttendanceRecord, HomeworkDay } from '@/lib/types';
import WeekSelector from '@/components/WeekSelector';
import { localDateStr, getWeekDateRange } from '@/lib/utils';

const DAY_LABEL: Record<string, string> = { mon: '월', tue: '화', wed: '수', thu: '목', fri: '금' };
const STATUS_COLOR_ATT = { present: '#22c55e', late: '#f59e0b', absent: '#ef4444' };

const HW_STATUSES = [
  { value: 'no_hw',  label: '— 숙제없음', bg: '#f1f5f9', color: '#64748b' },
  { value: 'missed', label: '✗ 미이행',  bg: '#fed7aa', color: '#9a3412' },
  { value: 'agreed', label: '✏️ 진행 중', bg: '#eff0ff', color: '#4338ca' },
  { value: 'confirmed', label: '✅ 완료', bg: '#d1fae5', color: '#15803d' },
] as const;

function HomeworkDashModal({ hw, studentId, studentName, day, week, onClose, onAction, onAdd }: {
  hw: DayHomework | null;
  studentId: string;
  studentName: string;
  day: string;
  week: string;
  onClose: () => void;
  onAction: (type: string, payload: unknown) => void;
  onAdd: (hw: DayHomework) => void;
}) {
  const [computer, setComputer] = useState(hw?.computer || '');
  const [textbook, setTextbook] = useState(hw?.textbook || '');
  const [vocabulary, setVocabulary] = useState(hw?.vocabulary || '');
  const [other, setOther] = useState(hw?.other || '');
  const [editStatus, setEditStatus] = useState<string>(hw?.status || 'pending');

  const save = () => {
    const updated = { computer, textbook, vocabulary, other, status: editStatus as HomeworkDay };
    if (hw) {
      const agreedAt = editStatus === 'agreed' ? (hw.agreedAt || new Date().toISOString()) : hw.agreedAt;
      const approvedAt = editStatus === 'confirmed' ? (hw.approvedAt || new Date().toISOString()) : hw.approvedAt;
      onAction('UPDATE_HOMEWORK', { ...hw, ...updated, agreedAt, approvedAt });
    } else {
      onAdd({
        id: `h${Date.now()}`, studentId, studentName, week, day: day as HomeworkDay,
        submittedAt: '', ...updated,
        status: editStatus as HomeworkDay,
      } as unknown as DayHomework);
    }
    onClose();
  };

  const inputStyle = { fontSize: 13, padding: '7px 10px', borderRadius: 8, border: '1px solid #e2e8f0', width: '100%', boxSizing: 'border-box' as const };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 18, padding: 24, width: '100%', maxWidth: 340, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>숙제 상세</h3>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{studentName} · {DAY_LABEL[day] || day}요일</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#94a3b8" /></button>
        </div>

        {/* 숙제 내용 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>숙제 내용</div>
          {[
            { label: '컴퓨터', value: computer, set: setComputer },
            { label: '교재',   value: textbook,  set: setTextbook },
            { label: '단어',   value: vocabulary, set: setVocabulary },
            { label: '기타',   value: other,      set: setOther },
          ].map(({ label, value, set }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#64748b', width: 40, flexShrink: 0 }}>{label}</span>
              <input value={value} onChange={e => set(e.target.value)} placeholder={`${label} 숙제`} style={inputStyle} />
            </div>
          ))}
        </div>

        {/* 상태 선택 */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 8 }}>상태</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {HW_STATUSES.map(s => (
              <button key={s.value} onClick={() => setEditStatus(s.value)} style={{
                padding: '9px 4px', borderRadius: 9, border: `2px solid ${editStatus === s.value ? s.color : '#e2e8f0'}`,
                background: editStatus === s.value ? s.bg : 'white',
                color: editStatus === s.value ? s.color : '#94a3b8',
                cursor: 'pointer', fontWeight: 700, fontSize: 12,
              }}>{s.label}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 13, color: '#64748b' }}>취소</button>
          <button onClick={save} style={{ flex: 2, padding: '11px', borderRadius: 10, border: 'none', background: '#6366f1', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>저장</button>
        </div>
        <a href="/admin/homework" style={{ display: 'block', marginTop: 10, textAlign: 'center', padding: '9px', borderRadius: 10, background: '#f8fafc', color: '#64748b', fontWeight: 600, fontSize: 12, textDecoration: 'none' }}>
          숙제 페이지로 →
        </a>
      </div>
    </div>
  );
}

function AttDashModal({ rec, studentId, studentName, classGroup, date, onClose, onSave, onDelete }: {
  rec: AttendanceRecord | null;
  studentId: string;
  studentName: string;
  classGroup: string;
  date: string;
  onClose: () => void;
  onSave: (r: AttendanceRecord) => void;
  onDelete: (id: string) => void;
}) {
  const [status, setStatus] = useState<'present' | 'late' | 'absent'>(rec?.status || 'present');
  const [checkIn, setCheckIn] = useState(rec?.checkInTime || '');
  const [checkOut, setCheckOut] = useState(rec?.checkOutTime || '');
  const [reason, setReason] = useState(rec?.reason || '');
  const localTime = () => new Date().toTimeString().slice(0, 5);
  const save = () => {
    onSave({
      id: rec?.id || `a${Date.now()}`,
      studentId, studentName, classGroup, date,
      checkInTime: status === 'absent' ? '' : (checkIn || localTime()),
      checkOutTime: checkOut || undefined,
      status,
      reason: (status === 'late' || status === 'absent') && reason ? reason : undefined,
    });
    onClose();
  };
  return (
    <div onMouseDown={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
      <div onMouseDown={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 18, padding: 24, width: '100%', maxWidth: 320, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>{studentName}</h3>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{date}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#94a3b8" /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['present', 'late', 'absent'] as const).map(s => (
              <button key={s} onClick={() => setStatus(s)} style={{
                flex: 1, padding: '10px 0', borderRadius: 10, border: '2px solid',
                borderColor: status === s ? STATUS_COLOR_ATT[s] : '#e2e8f0',
                background: status === s ? STATUS_COLOR_ATT[s] + '18' : 'white',
                cursor: 'pointer', fontWeight: 700, fontSize: 13,
                color: status === s ? STATUS_COLOR_ATT[s] : '#94a3b8',
              }}>{{ present: '출석', late: '지각', absent: '결석' }[s]}</button>
            ))}
          </div>
          {status !== 'absent' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>입실 시간</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input type="time" value={checkIn} onChange={e => setCheckIn(e.target.value)}
                    style={{ flex: 1, fontSize: 14, padding: '8px 10px', fontWeight: 600 }} />
                  <button type="button" onClick={() => setCheckIn(localTime())}
                    style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap' }}>지금</button>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#d97706', display: 'block', marginBottom: 4 }}>퇴원 시간</label>
                {checkOut ? (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input type="time" value={checkOut} onChange={e => setCheckOut(e.target.value)}
                      style={{ flex: 1, fontSize: 14, padding: '8px 10px', fontWeight: 700, color: '#d97706', border: '2px solid #fbbf24', borderRadius: 8 }} />
                    <button type="button" onClick={() => setCheckOut(localTime())}
                      style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #fbbf24', background: '#fffbeb', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#d97706', whiteSpace: 'nowrap' }}>지금</button>
                    <button type="button" onClick={() => setCheckOut('')}
                      style={{ padding: '8px 9px', borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2', cursor: 'pointer', fontSize: 12, color: '#ef4444' }}>✕</button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setCheckOut(localTime())}
                    style={{ width: '100%', padding: '12px', borderRadius: 10, border: '2px dashed #fbbf24', background: '#fffbeb', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#d97706', textAlign: 'center' }}>
                    + 퇴원 시간 기록 (지금)
                  </button>
                )}
              </div>
            </div>
          )}
          {(status === 'late' || status === 'absent') && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>사유 <span style={{ fontWeight: 400 }}>(선택)</span></label>
              <input type="text" value={reason} onChange={e => setReason(e.target.value)} placeholder={status === 'late' ? '지각 사유' : '결석 사유'} style={{ fontSize: 13, padding: '7px 10px' }} />
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          {rec && (
            <button onClick={() => { onDelete(rec.id); onClose(); }} style={{ padding: '10px 12px', borderRadius: 10, border: 'none', background: '#fee2e2', color: '#ef4444', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>삭제</button>
          )}
          <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 13, color: '#64748b' }}>취소</button>
          <button onClick={save} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: '#6366f1', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>저장</button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, sub, icon: Icon, color, href, onClick }: { title: string; value: string | number; sub: string; icon: React.ElementType; color: string; href?: string; onClick?: () => void }) {
  const inner = (
    <div className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: 16, cursor: href || onClick ? 'pointer' : undefined, transition: (href || onClick) ? 'box-shadow 0.15s' : undefined }} onClick={onClick}>
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
  const [testPopup, setTestPopup] = useState<{ test: TestRecord; studentName: string } | null>(null);
  const [testEditScore, setTestEditScore] = useState('');
  const [hwPopup, setHwPopup] = useState<{ hw: DayHomework | null; studentId: string; studentName: string; day: string; week: string } | null>(null);
  const [attPopup, setAttPopup] = useState<{ rec: AttendanceRecord | null; studentId: string; studentName: string; classGroup: string; date: string } | null>(null);
  const [addTestPopup, setAddTestPopup] = useState<{ studentId: string; studentName: string; date: string } | null>(null);
  const [addTestSubject, setAddTestSubject] = useState('영어 어휘 테스트');
  const [addTestScore, setAddTestScore] = useState('');
  const [addTestMax, setAddTestMax] = useState('20');
  const [testEditSubject, setTestEditSubject] = useState('');
  const [testEditMax, setTestEditMax] = useState('');
  const [testEditDate, setTestEditDate] = useState('');
  const [makeupHours, setMakeupHours] = useState<Record<string, number>>(
    state.students.reduce((acc, s) => {
      acc[s.id] = s.makeupHoursRequired ?? (state.attendanceRecords.filter(a => a.studentId === s.id && a.status === 'absent').length);
      return acc;
    }, {} as Record<string, number>)
  );
  const [makeupHoursEditMode, setMakeupHoursEditMode] = useState<Record<string, boolean>>({});
  const [makeupHoursSaved, setMakeupHoursSaved] = useState<Record<string, boolean>>({});
  const [studentWeeklyOverride, setStudentWeeklyOverride] = useState<Record<string, number>>({});
  const [studentMonthlyOverride, setStudentMonthlyOverride] = useState<Record<string, number>>({});
  const [studentTotalOverride, setStudentTotalOverride] = useState<Record<string, number>>({});
  const [editingHours, setEditingHours] = useState<string | null>(null);
  const makeupSectionRef = useRef<HTMLDivElement>(null);
  const [makeupEditPopup, setMakeupEditPopup] = useState<{ req: typeof state.makeupRequests[0] } | null>(null);
  const [makeupEditStatus, setMakeupEditStatus] = useState<'completed' | 'partial' | 'postponed' | 'cancelled'>('completed');
  const [makeupEditCompletedHours, setMakeupEditCompletedHours] = useState<string>('');
  const [studentDollarHistoryModal, setStudentDollarHistoryModal] = useState<{ studentId: string; studentName: string } | null>(null);
  const [makeupEditRemainingHours, setMakeupEditRemainingHours] = useState<string>('');
  const [makeupEditReason, setMakeupEditReason] = useState<string>('');

  // 매주 월요일에 지급 예정액 자동 계산
  useEffect(() => {
    const checkAndUpdatePendingDollars = () => {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const isMonday = dayOfWeek === 1;

      if (isMonday) {
        const currentWeek = state.currentWeek;

        // 각 학생의 이번주 지급액 계산
        state.students.forEach(student => {
          const alreadyAwarded = student.weeklyDollarsAwarded?.[currentWeek] || 0;
          if (alreadyAwarded === 0) {
            // 아직 지급하지 않았으면, weeklyPendingDollars 계산
            let total = 0;
            const enabledConditions = state.dollarConditions.filter(c => c.enabled);
            const basicConditions = enabledConditions.filter(c => ['attendance', 'homework', 'test'].includes(c.type));
            const bonusConditions = enabledConditions.filter(c => ['attitude', 'custom'].includes(c.type));

            // 기본 조건 계산 (간략화 - 실제로는 calcWeeklyDollars와 동일해야 함)
            basicConditions.forEach(c => {
              if (c.type === 'attendance') {
                const presentCount = state.attendanceRecords.filter(a => a.studentId === student.id && a.status !== 'absent').length;
                const total_required = student.scheduleDays?.length || 5;
                total += Math.round(c.amount * (presentCount / total_required));
              }
            });

            if (total !== student.weeklyPendingDollars) {
              dispatch({ type: 'UPDATE_STUDENT', payload: { ...student, weeklyPendingDollars: total } });
            }
          }
        });
      }
    };

    checkAndUpdatePendingDollars();
  }, [state.currentWeek, state.students, state.dollarConditions, state.attendanceRecords, dispatch]);

  const handleWeekChange = (w: string) => {
    setWeek(w);
    dispatch({ type: 'SET_WEEK', payload: w });
  };

  const todayStr = localDateStr();

  const markAbsentAtTime = (targetHour: number = 19) => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    if (currentHour < targetHour) {
      alert(`아직 ${targetHour}시가 아닙니다. (현재 ${currentHour}:${String(currentMinute).padStart(2, '0')})`);
      return;
    }

    let marked = 0;
    state.students.forEach(s => {
      const hasAttendanceToday = state.attendanceRecords.some(a => a.studentId === s.id && a.date === todayStr);
      if (!hasAttendanceToday) {
        const isScheduledToday = !s.scheduleDays || s.scheduleDays.length === 0 ||
          s.scheduleDays.includes(['mon', 'tue', 'wed', 'thu', 'fri'][new Date(todayStr + 'T12:00:00').getDay() - 1] ?? '');
        if (isScheduledToday) {
          dispatch({
            type: 'ADD_ATTENDANCE',
            payload: {
              id: `a${Date.now()}_${s.id}`,
              studentId: s.id,
              studentName: s.name,
              classGroup: s.classGroup,
              date: todayStr,
              checkInTime: '',
              status: 'absent',
              reason: '등록되지 않음 (자동 결석)',
            }
          });
          marked++;
        }
      }
    });

    if (marked > 0) {
      alert(`${marked}명의 학생을 결석 처리했습니다.`);
      // 자동으로 보충 시간 설정
      state.students.forEach(s => {
        const absentCount = (state.attendanceRecords.filter(a => a.studentId === s.id && a.status === 'absent').length) +
                           (state.attendanceRecords.find(a => a.studentId === s.id && a.date === todayStr && a.status === 'absent') ? 1 : 0);
        const requiredHours = absentCount * 2;
        if (!s.makeupHoursRequired || s.makeupHoursRequired < requiredHours) {
          dispatch({ type: 'UPDATE_STUDENT', payload: { ...s, makeupHoursRequired: requiredHours } });
        }
      });
    } else {
      alert('오늘 미등록 학생이 없습니다.');
    }
  };

  // 이번 주 Mon–Fri 날짜 계산
  const { start: weekStart } = getWeekDateRange(week);
  const weekDates = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return localDateStr(d);
  });

  const weekHW = state.dayHomeworks.filter(h => h.week === week);
  const weekTests = state.testRecords.filter(t => weekDates.includes(t.date));
  const weekAtt = state.attendanceRecords.filter(a => weekDates.includes(a.date));
  const todayAtt = state.attendanceRecords.filter(a => a.date === todayStr);

  const pendingHW = weekHW.filter(h => h.status === 'pending').length;
  const pendingTests = weekTests.filter(t => t.status === 'pending').length;
  const totalDollars = state.students.reduce((s, x) => s + x.dollars, 0);

  // 달러 계산
  const enabledConditions = state.dollarConditions.filter(c => c.enabled);
  const basicConditions = enabledConditions.filter(c => ['attendance', 'homework', 'test'].includes(c.type));
  const bonusConditions = enabledConditions.filter(c => ['attitude', 'custom'].includes(c.type));

  const getStudentScheduledDays = (studentId: string) => {
    const student = state.students.find(s => s.id === studentId);
    return student?.scheduleDays?.length || 5;
  };

  const getAchievementRate = (studentId: string, type: string): { rate: number; count: number; total: number } => {
    if (type === 'attendance') {
      const total = getStudentScheduledDays(studentId);
      const count = state.attendanceRecords.filter(a => a.studentId === studentId && a.status !== 'absent').length;
      return { rate: count / total, count, total };
    }
    if (type === 'homework') {
      const total = getStudentScheduledDays(studentId);
      const count = (state.dayHomeworks || []).filter(h => h.studentId === studentId && h.week === week && h.status === 'approved').length;
      return { rate: count / total, count, total };
    }
    if (type === 'test') {
      const total = getStudentScheduledDays(studentId);
      const count = state.testRecords.filter(t => t.studentId === studentId && weekDates.includes(t.date) && t.status === 'confirmed').length;
      return { rate: count / total, count, total };
    }
    return { rate: 0, count: 0, total: 1 };
  };

  const conditionMet = (studentId: string, type: string): boolean => {
    if (type === 'attendance') return state.attendanceRecords.filter(a => a.studentId === studentId && a.status !== 'absent').length >= 2;
    if (type === 'homework') return state.dayHomeworks.some(h => h.studentId === studentId && h.week === week && h.status === 'approved');
    if (type === 'test') return state.testRecords.some(t => t.studentId === studentId && weekDates.includes(t.date) && t.status === 'confirmed');
    if (type === 'attitude') {
      const score = (state.attitudeRecords || [])
        .filter(r => r.studentId === studentId && r.week === week)
        .reduce((sum, r) => sum + r.shadowing + r.learningAttitude + r.basicAttitude, 0);
      return score >= (state.attitudeDollarSettings.tier3.minScore || 1);
    }
    return false;
  };

  const calcWeeklyDollars = (studentId: string) => {
    const student = state.students.find(s => s.id === studentId);
    const alreadyAwarded = student?.weeklyDollarsAwarded?.[week] || 0;
    if (alreadyAwarded > 0) return 0; // 이미 지급했으면 0으로 표시

    let total = 0;
    basicConditions.forEach(c => {
      const { rate } = getAchievementRate(studentId, c.type);
      const earnedAmount = Math.round(c.amount * rate);
      total += earnedAmount;
    });
    bonusConditions.forEach(c => {
      total += conditionMet(studentId, c.type) ? c.amount : 0;
    });
    return total;
  };

  const DAY_KO = ['월', '화', '수', '목', '금'];
  const DAYS_HW = ['mon', 'tue', 'wed', 'thu', 'fri'] as const;
  const dateToDay = (date: string) => DAYS_HW[new Date(date + 'T12:00:00').getDay() - 1] ?? null;

  // 학생 누적 달러 지급 기록 모달
  const StudentDollarHistoryModal = () => {
    if (!studentDollarHistoryModal) return null;
    const records = (state.awardRecords || []).filter(r => r.studentId === studentDollarHistoryModal.studentId);
    const totalAwarded = records.reduce((sum, r) => sum + r.amount, 0);

    return (
      <div className="modal-backdrop" onClick={() => setStudentDollarHistoryModal(null)}>
        <div className="modal" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>달러 지급 기록</div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>{studentDollarHistoryModal.studentName}</div>
            </div>
            <button onClick={() => setStudentDollarHistoryModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
          </div>

          <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8' }}>누적 지급액</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#7c3aed', marginTop: 4 }}>${totalAwarded}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8' }}>지급 횟수</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#6366f1', marginTop: 4 }}>{records.length}</div>
              </div>
            </div>
          </div>

          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 10 }}>지급 내역</div>
          <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12 }}>
            {records.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: 20 }}>지급 기록이 없습니다</div>
            ) : (
              records.map(r => (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{r.week} 주</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{new Date(r.awardedAt).toLocaleDateString('ko-KR')}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#7c3aed' }}>+${r.amount}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          <button onClick={() => setStudentDollarHistoryModal(null)} className="btn btn-primary" style={{ width: '100%', marginTop: 16 }}>닫기</button>
        </div>
      </div>
    );
  };

  return (
    <div>
      <StudentDollarHistoryModal />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>대시보드</h1>
          <p style={{ color: '#64748b', marginTop: 2, fontSize: 13 }}>
            {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
          </p>
        </div>
        <WeekSelector week={week} onChange={handleWeekChange} />
      </div>

      {(() => {
        const studentsNeedingMakeup = state.students.filter(s =>
          state.attendanceRecords.some(a => a.studentId === s.id && a.status === 'absent')
        ).length;
        const makeupCompleted = state.students.filter(s => {
          const requiredHours = s.makeupHoursRequired ?? (state.attendanceRecords.filter(a => a.studentId === s.id && a.status === 'absent').length);
          const completedHours = (state.makeupRequests || [])
            .filter(m => m.studentId === s.id && m.status === 'approved')
            .reduce((sum, m) => {
              const timeMatch = m.makeupTime.match(/^(\d{1,2}):(\d{2})/);
              if (!timeMatch) return sum;
              const hours = parseInt(timeMatch[1]) || 0;
              const minutes = parseInt(timeMatch[2]) || 0;
              return sum + hours + (minutes > 30 ? 1 : 0);
            }, 0);
          return completedHours >= requiredHours && requiredHours > 0;
        }).length;

        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
            <StatCard title="전체 학생" value={state.students.length} sub="등록된 학생 수" icon={Users} color="#3b82f6" />
            <StatCard title="오늘 출석" value={todayAtt.length} sub={`/ ${state.students.length}명`} icon={Calendar} color="#22c55e" />
            <StatCard title="승인 대기" value={pendingHW + pendingTests} sub={`숙제 ${pendingHW} / 시험 ${pendingTests}`} icon={Clock} color="#f59e0b" href={pendingTests > 0 ? "/admin/tests" : "/admin/homework"} />
            <StatCard title="총 달러" value={`$${totalDollars}`} sub="전체 지급 누계" icon={DollarSign} color="#8b5cf6" />
            <StatCard title="보충 필요" value={studentsNeedingMakeup} sub="명의 학생" icon={Clock} color="#ef4444" onClick={() => makeupSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })} />
            <StatCard title="보충 완료" value={makeupCompleted} sub={`/ ${studentsNeedingMakeup}명`} icon={CheckCircle} color="#22c55e" onClick={() => makeupSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })} />
          </div>
        );
      })()}

      {(() => {
        const unregisteredCount = state.students.filter(s => {
          const hasAttendance = state.attendanceRecords.some(a => a.studentId === s.id && a.date === todayStr);
          return !hasAttendance && (!s.scheduleDays || s.scheduleDays.length === 0 ||
            s.scheduleDays.includes(['mon', 'tue', 'wed', 'thu', 'fri'][new Date(todayStr + 'T12:00:00').getDay() - 1] ?? ''));
        }).length;

        return unregisteredCount > 0 ? (
          <div style={{ background: '#fef2f2', border: '2px solid #fee2e2', borderRadius: 12, padding: 14, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#7f1d1d' }}>오늘 {unregisteredCount}명 미등록</div>
              <div style={{ fontSize: 12, color: '#991b1b', marginTop: 2 }}>오후 7시에 자동 결석 처리됩니다</div>
            </div>
            <button onClick={() => markAbsentAtTime(19)} style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap' }}>
              지금 결석 처리
            </button>
          </div>
        ) : null;
      })()}

      <div className="m-col-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

        {/* ── 이번 주 숙제 현황 ── */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <BookOpen size={16} color="#3b82f6" /> 이번 주 숙제 현황
            </h3>
            <a href="/admin/homework" style={{ fontSize: 12, color: '#6366f1', textDecoration: 'none' }}>전체 →</a>
          </div>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'], touchAction: 'pan-x', display: 'block' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '64px repeat(5, 1fr)', gap: 4, marginBottom: 6, minWidth: '100%' }}>
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
                const openHw = () => setHwPopup({ hw: hw || null, studentId: s.id, studentName: s.name, day, week });
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
                  : st === 'no_hw'     ? { e: '—', bg: '#f1f5f9' }
                  : { e: '·', bg: '#f1f5f9' };
                return (
                  <div key={day} title={st === 'no_hw' ? '숙제없음' : st || (isScheduled ? '미제출' : '보충')}
                    onClick={openHw}
                    style={{ textAlign: 'center', padding: '5px 2px', borderRadius: 6, background: !isScheduled ? '#e0f2fe' : cell.bg, fontSize: st === 'no_hw' ? 12 : 14, color: st === 'no_hw' ? '#94a3b8' : undefined, cursor: 'pointer' }}>
                    {cell.e}
                  </div>
                );
              })}
            </div>
            ))}
            {state.students.length === 0 && <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: 16 }}>등록된 학생이 없습니다</div>}
          </div>
          <div style={{ display: 'flex', gap: 13, flexWrap: 'wrap', marginTop: 13, paddingTop: 13, borderTop: '1px solid #f1f5f9' }}>
            {[['⏳','확인대기'],['📋','합의됨'],['🔄','완료확인'],['✅','완료'],['❌','반려'],['✗','미이행'],['—','숙제없음']].map(([e, l]) => (
              <span key={l} style={{ fontSize: 15, color: '#64748b' }}>{e} {l}</span>
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
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'], touchAction: 'pan-x', display: 'block' }}>
            {/* 요일 헤더 (날짜 포함) */}
            <div style={{ display: 'grid', gridTemplateColumns: '64px repeat(5, 1fr)', gap: 4, marginBottom: 6, minWidth: '100%' }}>
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

                const openAtt = () => setAttPopup({ rec: rec || null, studentId: s.id, studentName: s.name, classGroup: s.classGroup, date });

                if (!isScheduled && !rec) {
                  return (
                    <div key={date} onClick={openAtt} style={{ textAlign: 'center', padding: '4px 2px', borderRadius: 6, background: '#f8fafc', fontSize: 11, cursor: 'pointer' }}>
                      <div style={{ color: '#e2e8f0' }}>–</div>
                    </div>
                  );
                }

                if (!rec) {
                  return (
                    <div key={date} onClick={openAtt} style={{ textAlign: 'center', padding: '4px 2px', borderRadius: 6, background: '#f1f5f9', fontSize: 11, cursor: 'pointer' }}>
                      <div style={{ color: '#cbd5e1' }}>{isPast ? '·' : ''}</div>
                      {prevAbsent && <div style={{ fontSize: 8, fontWeight: 700, color: '#f59e0b' }}>전결</div>}
                    </div>
                  );
                }

                if (rec.status === 'present') {
                  return (
                    <div key={date} onClick={openAtt} style={{ textAlign: 'center', padding: '4px 2px', borderRadius: 6, background: !isScheduled ? '#e0f2fe' : '#d1fae5', fontSize: 13, cursor: 'pointer' }}>
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
                    <div key={date} onClick={openAtt} style={{ textAlign: 'center', padding: '3px 2px', borderRadius: 6, background: '#fef3c7', fontSize: 11, cursor: 'pointer' }}>
                      <div>⏰</div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: '#92400e' }}>{lateText}</div>
                      {prevAbsent && <div style={{ fontSize: 8, fontWeight: 700, color: '#f59e0b' }}>전결</div>}
                    </div>
                  );
                }

                // absent
                return (
                  <div key={date} onClick={openAtt} style={{ textAlign: 'center', padding: '4px 2px', borderRadius: 6, background: '#fee2e2', fontSize: 13, cursor: 'pointer' }}>
                    ❌
                  </div>
                );
              })}
            </div>
          ))}
            {state.students.length === 0 && <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: 16 }}>등록된 학생이 없습니다</div>}
          </div>
          <div style={{ display: 'flex', gap: 13, flexWrap: 'wrap', marginTop: 13, paddingTop: 13, borderTop: '1px solid #f1f5f9' }}>
            {[['✅','출석'],['⏰','지각(N분)'],['❌','결석'],['전결','전날 결석']].map(([e, l]) => (
              <span key={l} style={{ fontSize: 15, color: '#64748b' }}>{e} {l}</span>
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
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'], touchAction: 'pan-x', display: 'block' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '64px repeat(5, 1fr)', gap: 4, marginBottom: 6, minWidth: '100%' }}>
              <div />
              {DAY_KO.map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>{d}</div>
              ))}
            </div>
            {state.students.map(s => (
            <div key={s.id} style={GRID_ROW}>
              <div style={NAME_CELL}>{s.name}</div>
              {DAYS_HW.map(day => {
                const test = weekTests.find(t => t.studentId === s.id && dateToDay(t.date) === day);
                const dateForDay = weekDates[DAYS_HW.indexOf(day)];
                if (!test) {
                  return (
                    <div key={day} onClick={() => { setAddTestPopup({ studentId: s.id, studentName: s.name, date: dateForDay }); setAddTestSubject('영어 어휘 테스트'); setAddTestScore(''); setAddTestMax('20'); }}
                      style={{ textAlign: 'center', padding: '4px 2px', borderRadius: 6, background: '#f1f5f9', fontSize: 11, color: '#cbd5e1', cursor: 'pointer' }}>·</div>
                  );
                }
                const confirmed = test.status === 'confirmed';
                const scoreText = test.score !== null ? `${test.score}개` : '-';
                return (
                  <div key={day} title={test.subject} onClick={() => { setTestPopup({ test, studentName: s.name }); setTestEditScore(test.score?.toString() ?? ''); setTestEditSubject(test.subject); setTestEditMax(test.maxScore.toString()); setTestEditDate(test.date); }}
                    style={{ textAlign: 'center', padding: '3px 2px', borderRadius: 6, background: confirmed ? '#d1fae5' : '#fef3c7', fontSize: 11, cursor: 'pointer' }}>
                    <div>{confirmed ? '✅' : '⏳'}</div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: confirmed ? '#15803d' : '#92400e' }}>{scoreText}</div>
                  </div>
                );
              })}
            </div>
          ))}
            {state.students.length === 0 && <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: 16 }}>등록된 학생이 없습니다</div>}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10, paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
            {[['⏳','확인대기'],['✅','확정']].map(([e, l]) => (
              <span key={l} style={{ fontSize: 15, color: '#64748b' }}>{e} {l}</span>
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
                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'], touchAction: 'pan-x', display: 'block' }}>
                  {/* 헤더 */}
                  <div style={{ display: 'grid', gridTemplateColumns: colTemplate, gap: 4, marginBottom: 6, alignItems: 'end', minWidth: '100%' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>학생</div>
                    <div style={{ ...headerStyle, color: '#7c3aed' }}>보유</div>
                    {basicConditions.map(c => <div key={c.id} style={{ ...headerStyle, color: '#0369a1' }}>{c.name}</div>)}
                    {bonusConditions.length > 0 && <div style={{ background: '#e2e8f0', borderRadius: 2 }} />}
                    {bonusConditions.map(c => <div key={c.id} style={{ ...headerStyle, color: '#7c3aed' }}>⭐{c.name}</div>)}
                    <div style={{ ...headerStyle, color: '#7c3aed' }}>이번주</div>
                  </div>

                  {/* 학생 행 */}
                  {state.students.map(s => {
                    const pending = s.weeklyPendingDollars || 0;
                    return (
                      <div key={s.id} style={{ display: 'grid', gridTemplateColumns: colTemplate, gap: 4, marginBottom: 5, alignItems: 'center' }}>
                        <div style={{ ...NAME_CELL, cursor: 'pointer', color: '#6366f1', fontWeight: 700 }} onClick={() => setStudentDollarHistoryModal({ studentId: s.id, studentName: s.name })}>{s.name}</div>
                        <div style={{ textAlign: 'center', fontWeight: 800, fontSize: 13, color: '#7c3aed',
                          background: '#f3e8ff', borderRadius: 6, padding: '4px 2px' }}>
                          ${s.dollars}
                        </div>
                        {basicConditions.map(c => {
                          const { rate, count, total } = getAchievementRate(s.id, c.type);
                          const earnedAmount = Math.round(c.amount * rate);
                          const ratePct = Math.round(rate * 100);
                          return (
                            <div key={c.id} style={{ textAlign: 'center', borderRadius: 6, padding: '4px 2px',
                              background: rate > 0 ? '#d1fae5' : '#f1f5f9', fontSize: 11, fontWeight: 700,
                              color: rate > 0 ? '#15803d' : '#cbd5e1' }}>
                              <div style={{ fontSize: 10 }}>{count}/{total}</div>
                              <div>+${earnedAmount}</div>
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
                          background: pending > 0 ? '#ede9fe' : '#f1f5f9',
                          fontWeight: 800, fontSize: 13, color: pending > 0 ? '#7c3aed' : '#94a3b8' }}>
                          {pending > 0 ? `+$${pending}` : '—'}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 범례 */}
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 13, paddingTop: 13, borderTop: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: 15, color: '#0369a1', fontWeight: 600 }}>📋 기본: {basicConditions.map(c => c.name).join(' · ')}</span>
                  {bonusConditions.length > 0 && (
                    <span style={{ fontSize: 15, color: '#7c3aed', fontWeight: 600 }}>⭐ 보너스: {bonusConditions.map(c => c.name).join(' · ')}</span>
                  )}
                </div>
              </>
            );
          })()}
        </div>

        {/* ── 보충 현황 ── */}
        <div className="card" style={{ gridColumn: '1 / -1' }} ref={makeupSectionRef}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={16} color="#d97706" /> 보충 현황
            </h3>
          </div>

          {(() => {
            const studentAbsentDays: Record<string, number> = {};
            let weeklyAbsentHours = 0;
            let monthlyAbsentHours = 0;
            let totalAbsentHours = 0;

            const now = new Date();
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay() + 1);
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

            state.students.forEach(s => {
              const absentCount = state.attendanceRecords.filter(a => a.studentId === s.id && a.status === 'absent').length;
              if (absentCount > 0) {
                studentAbsentDays[s.id] = absentCount;
              }
            });

            state.attendanceRecords.forEach(a => {
              if (a.status === 'absent') {
                totalAbsentHours += 1;
                const attDate = new Date(a.date + 'T12:00:00');
                if (attDate >= weekStart) weeklyAbsentHours += 1;
                if (attDate >= monthStart) monthlyAbsentHours += 1;
              }
            });

            const studentsNeedingMakeup = state.students.filter(s => studentAbsentDays[s.id] > 0);

            if (studentsNeedingMakeup.length === 0) {
              return <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: 20 }}>보충이 필요한 학생이 없습니다</div>;
            }

            return (
              <>
                {/* 보충 통계 */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
                  <div style={{ background: '#fef3c7', borderRadius: 8, padding: 12, border: '1px solid #fcd34d' }}>
                    <div style={{ fontSize: 11, color: '#92400e', fontWeight: 600, marginBottom: 4 }}>📅 주간</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#b45309' }}>{weeklyAbsentHours}시간</div>
                    <div style={{ fontSize: 10, color: '#92400e', marginTop: 4 }}>이번 주 필요</div>
                  </div>
                  <div style={{ background: '#fecaca', borderRadius: 8, padding: 12, border: '1px solid #fca5a5' }}>
                    <div style={{ fontSize: 11, color: '#7f1d1d', fontWeight: 600, marginBottom: 4 }}>📆 월간</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#dc2626' }}>{monthlyAbsentHours}시간</div>
                    <div style={{ fontSize: 10, color: '#7f1d1d', marginTop: 4 }}>이번 달 필요</div>
                  </div>
                  <div style={{ background: '#dbeafe', borderRadius: 8, padding: 12, border: '1px solid #bfdbfe' }}>
                    <div style={{ fontSize: 11, color: '#1e3a8a', fontWeight: 600, marginBottom: 4 }}>📊 전체</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#1d4ed8' }}>{totalAbsentHours}시간</div>
                    <div style={{ fontSize: 10, color: '#1e3a8a', marginTop: 4 }}>누적 필요</div>
                  </div>
                </div>

                {/* 학생별 보충 현황 */}
                <div style={{ display: 'grid', gridTemplateColumns: '70px 45px 90px 90px 90px 60px 60px', gap: 4, marginBottom: 10, alignItems: 'center', fontSize: 10, fontWeight: 700, color: '#94a3b8' }}>
                  <div>학생</div>
                  <div style={{ textAlign: 'center' }}>결석</div>
                  <div style={{ textAlign: 'center', background: '#fef3c7', padding: 4, borderRadius: 4 }}>주간</div>
                  <div style={{ textAlign: 'center', background: '#fecaca', padding: 4, borderRadius: 4 }}>월간</div>
                  <div style={{ textAlign: 'center', background: '#dbeafe', padding: 4, borderRadius: 4 }}>전체</div>
                  <div style={{ textAlign: 'center' }}>완료</div>
                  <div style={{ textAlign: 'center' }}>상태</div>
                </div>

                {studentsNeedingMakeup.map(s => {
                  const absentDays = studentAbsentDays[s.id] || 0;

                  const studentWeeklyAbsent = state.attendanceRecords.filter(a => {
                    if (a.studentId !== s.id || a.status !== 'absent') return false;
                    const attDate = new Date(a.date + 'T12:00:00');
                    return attDate >= weekStart;
                  }).length;

                  const studentMonthlyAbsent = state.attendanceRecords.filter(a => {
                    if (a.studentId !== s.id || a.status !== 'absent') return false;
                    const attDate = new Date(a.date + 'T12:00:00');
                    return attDate >= monthStart;
                  }).length;

                  const requiredHours = makeupHours[s.id] || 0;
                  const completedHours = (state.makeupRequests || [])
                    .filter(m => m.studentId === s.id && m.status === 'approved')
                    .reduce((sum, m) => {
                      const timeMatch = m.makeupTime.match(/^(\d{1,2}):(\d{2})/);
                      if (!timeMatch) return sum;
                      const hours = parseInt(timeMatch[1]) || 0;
                      const minutes = parseInt(timeMatch[2]) || 0;
                      return sum + hours + (minutes > 30 ? 1 : 0);
                    }, 0);

                  return (
                    <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '70px 45px 90px 90px 90px 60px 60px', gap: 4, marginBottom: 6, alignItems: 'center', padding: '8px 10px', borderRadius: 8, background: '#f8fafc', fontSize: 12, fontWeight: 600 }}>
                      <div style={{ ...NAME_CELL }}>{s.name}</div>
                      <div style={{ textAlign: 'center', color: '#ef4444' }}>{absentDays}일</div>

                      {/* 주간 */}
                      <div
                        onClick={() => setEditingHours(`${s.id}-weekly`)}
                        style={{
                          textAlign: 'center',
                          background: editingHours === `${s.id}-weekly` ? 'white' : '#fef3c7',
                          padding: 4,
                          borderRadius: 4,
                          color: '#b45309',
                          cursor: 'pointer',
                          border: editingHours === `${s.id}-weekly` ? '2px solid #b45309' : 'none',
                        }}
                      >
                        {editingHours === `${s.id}-weekly` ? (
                          <input
                            type="number"
                            value={studentWeeklyOverride[s.id] ?? studentWeeklyAbsent}
                            onChange={e => setStudentWeeklyOverride(prev => ({ ...prev, [s.id]: Number(e.target.value) || 0 }))}
                            onBlur={() => setEditingHours(null)}
                            autoFocus
                            style={{ width: 80, fontSize: 11, fontWeight: 800, border: '2px solid #b45309', background: '#fffbeb', textAlign: 'center', color: '#b45309', padding: '6px 8px', borderRadius: 4 }}
                          />
                        ) : (
                          `${studentWeeklyOverride[s.id] ?? studentWeeklyAbsent}시간`
                        )}
                      </div>

                      {/* 월간 */}
                      <div
                        onClick={() => setEditingHours(`${s.id}-monthly`)}
                        style={{
                          textAlign: 'center',
                          background: editingHours === `${s.id}-monthly` ? 'white' : '#fecaca',
                          padding: 4,
                          borderRadius: 4,
                          color: '#dc2626',
                          cursor: 'pointer',
                          border: editingHours === `${s.id}-monthly` ? '2px solid #dc2626' : 'none',
                        }}
                      >
                        {editingHours === `${s.id}-monthly` ? (
                          <input
                            type="number"
                            value={studentMonthlyOverride[s.id] ?? studentMonthlyAbsent}
                            onChange={e => setStudentMonthlyOverride(prev => ({ ...prev, [s.id]: Number(e.target.value) || 0 }))}
                            onBlur={() => setEditingHours(null)}
                            autoFocus
                            style={{ width: 80, fontSize: 11, fontWeight: 800, border: '2px solid #dc2626', background: '#fecaca', textAlign: 'center', color: '#dc2626', padding: '6px 8px', borderRadius: 4 }}
                          />
                        ) : (
                          `${studentMonthlyOverride[s.id] ?? studentMonthlyAbsent}시간`
                        )}
                      </div>

                      {/* 전체 - 읽기 전용 */}
                      <div
                        style={{
                          textAlign: 'center',
                          background: '#dbeafe',
                          padding: 4,
                          borderRadius: 4,
                          color: '#1d4ed8',
                          cursor: 'not-allowed',
                          border: 'none',
                          fontWeight: 800,
                        }}
                      >
                        {(studentWeeklyOverride[s.id] ?? studentWeeklyAbsent) + (studentMonthlyOverride[s.id] ?? studentMonthlyAbsent)}시간
                      </div>

                      <div style={{ textAlign: 'center', color: completedHours >= requiredHours ? '#22c55e' : '#f59e0b' }}>
                        {completedHours}시간
                      </div>
                      <div style={{ textAlign: 'center', color: completedHours >= requiredHours ? '#22c55e' : '#f59e0b' }}>
                        {completedHours >= requiredHours ? '✅ 완료' : `⏳ ${requiredHours - completedHours}시간`}
                      </div>
                    </div>
                  );
                })}

                {/* 보충 요청 현황 */}
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
                  <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#374151' }}>등록된 보충 요청</h4>
                  {(state.makeupRequests || []).length === 0 ? (
                    <div style={{ color: '#94a3b8', fontSize: 12, textAlign: 'center', padding: 12 }}>등록된 보충 요청이 없습니다</div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '70px 70px 90px 70px 70px 70px 40px', gap: 4, marginBottom: 8, alignItems: 'center' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8' }}>학생</div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8' }}>요청일</div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8' }}>보충날짜</div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textAlign: 'center' }}>시간</div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textAlign: 'center' }}>부족</div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textAlign: 'center' }}>완료</div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textAlign: 'center' }}>액션</div>
                    </div>
                  )}
                  {(state.makeupRequests || []).map(req => {
                    const student = state.students.find(s => s.id === req.studentId);
                    const requiredHours = student?.makeupHoursRequired ?? (state.attendanceRecords.filter(a => a.studentId === req.studentId && a.status === 'absent').length * 2);
                    return (
                      <div key={req.id} style={{ display: 'grid', gridTemplateColumns: '70px 70px 90px 70px 70px 70px 40px', gap: 4, marginBottom: 4, alignItems: 'center', padding: '6px 8px', borderRadius: 6, background: '#fafbfc', fontSize: 11 }}>
                        <div style={{ fontWeight: 600, color: '#374151' }}>{req.studentName}</div>
                        <div style={{ color: '#64748b', fontSize: 10 }}>{req.requestedAt.slice(5, 10)}</div>
                        <div style={{ color: '#64748b', fontSize: 10 }}>{req.makeupDate}</div>
                        <div style={{ color: '#64748b', textAlign: 'center', fontSize: 10 }}>{req.makeupTime}</div>
                        <div style={{ textAlign: 'center', fontWeight: 700, color: '#ef4444', fontSize: 10 }}>{requiredHours - (req.completedHours || 0)}시간</div>
                        <div style={{ textAlign: 'center', fontWeight: 700, color: '#22c55e', fontSize: 10 }}>{req.completedHours || 0}시간</div>
                        <div style={{ display: 'flex', gap: 3, justifyContent: 'center' }}>
                          <button onClick={() => { setMakeupEditPopup({ req }); setMakeupEditStatus(req.completionStatus || 'completed'); setMakeupEditCompletedHours(req.completedHours?.toString() || ''); setMakeupEditRemainingHours(req.remainingHours?.toString() || ''); setMakeupEditReason(req.cancellationReason || ''); }} style={{ padding: '3px 6px', borderRadius: 4, border: 'none', background: '#e0f2fe', color: '#0369a1', cursor: 'pointer', fontWeight: 600, fontSize: 9 }}>수정</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })()}
        </div>

      </div>

      {testPopup && (
        <div onMouseDown={() => setTestPopup(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div onMouseDown={e => e.stopPropagation()}
            style={{ background: 'white', borderRadius: 18, padding: 24, width: '100%', maxWidth: 340, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>시험 상세 / 수정</h3>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{testPopup.studentName}</div>
              </div>
              <button onClick={() => setTestPopup(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <X size={20} color="#94a3b8" />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>시험명</label>
                <input value={testEditSubject} onChange={e => setTestEditSubject(e.target.value)}
                  style={{ fontSize: 13, padding: '8px 10px', width: '100%', boxSizing: 'border-box' as const }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>날짜</label>
                <input type="date" value={testEditDate} onChange={e => setTestEditDate(e.target.value)}
                  style={{ fontSize: 13, padding: '8px 10px', width: '100%', boxSizing: 'border-box' as const }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>맞은 점수</label>
                  <input type="number" value={testEditScore} onChange={e => setTestEditScore(e.target.value)}
                    placeholder="점수" min="0"
                    style={{ fontSize: 22, fontWeight: 700, textAlign: 'center', padding: '8px', width: '100%', boxSizing: 'border-box' as const }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>만점</label>
                  <input type="number" value={testEditMax} onChange={e => setTestEditMax(e.target.value)}
                    placeholder="만점" min="1"
                    style={{ fontSize: 22, fontWeight: 700, textAlign: 'center', padding: '8px', width: '100%', boxSizing: 'border-box' as const }} />
                </div>
              </div>
              <div style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#64748b' }}>
                {testPopup.test.submittedByStudent ? '학생 직접 제출' : '선생님 입력'} · {testPopup.test.status === 'confirmed' ? '✅ 확정됨' : '⏳ 확인대기'}
              </div>
            </div>
            {testPopup.test.imageUrl && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>첨부 이미지</div>
                <img src={testPopup.test.imageUrl} alt="시험지" style={{ width: '100%', borderRadius: 10, border: '1px solid #e2e8f0', maxHeight: 200, objectFit: 'contain' }} />
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={() => setTestPopup(null)}
                style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 13, color: '#64748b' }}>취소</button>
              <button onClick={() => {
                const s = testEditScore !== '' ? Number(testEditScore) : null;
                dispatch({ type: 'UPDATE_TEST', payload: {
                  ...testPopup.test,
                  subject: testEditSubject,
                  date: testEditDate,
                  score: s,
                  maxScore: Number(testEditMax) || testPopup.test.maxScore,
                  status: s !== null ? 'confirmed' : 'pending',
                  confirmedAt: s !== null ? (testPopup.test.confirmedAt ?? new Date().toISOString()) : undefined,
                }});
                setTestPopup(null);
              }} style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: '#6366f1', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>저장</button>
            </div>
            <a href="/admin/tests" style={{ display: 'block', marginTop: 10, textAlign: 'center', padding: '9px', borderRadius: 10, background: '#f8fafc', color: '#64748b', fontWeight: 600, fontSize: 12, textDecoration: 'none' }}>
              시험 페이지로 →
            </a>
          </div>
        </div>
      )}

      {hwPopup && (
        <HomeworkDashModal
          hw={hwPopup.hw}
          studentId={hwPopup.studentId}
          studentName={hwPopup.studentName}
          day={hwPopup.day}
          week={hwPopup.week}
          onClose={() => setHwPopup(null)}
          onAction={(type, payload) => dispatch({ type: type as never, payload: payload as never })}
          onAdd={hw => dispatch({ type: 'ADD_HOMEWORK', payload: hw })}
        />
      )}

      {addTestPopup && (
        <div onClick={() => setAddTestPopup(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 18, padding: 24, width: '100%', maxWidth: 320, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>시험 점수 입력</h3>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{addTestPopup.studentName} · {addTestPopup.date}</div>
              </div>
              <button onClick={() => setAddTestPopup(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#94a3b8" /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>시험명</label>
                <input value={addTestSubject} onChange={e => setAddTestSubject(e.target.value)} style={{ fontSize: 13, padding: '8px 10px' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>점수</label>
                  <input type="number" value={addTestScore} onChange={e => setAddTestScore(e.target.value)} placeholder="0" min="0"
                    style={{ fontSize: 20, fontWeight: 700, textAlign: 'center', padding: '8px' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>만점</label>
                  <input type="number" value={addTestMax} onChange={e => setAddTestMax(e.target.value)} placeholder="20" min="1"
                    style={{ fontSize: 20, fontWeight: 700, textAlign: 'center', padding: '8px' }} />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={() => setAddTestPopup(null)} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 13, color: '#64748b' }}>취소</button>
              <button onClick={() => {
                if (!addTestScore) return;
                dispatch({ type: 'ADD_TEST', payload: {
                  id: `t${Date.now()}`, studentId: addTestPopup.studentId, studentName: addTestPopup.studentName,
                  subject: addTestSubject, score: Number(addTestScore), maxScore: Number(addTestMax),
                  submittedByStudent: false, status: 'confirmed', confirmedAt: new Date().toISOString(),
                  week, date: addTestPopup.date,
                }});
                setAddTestPopup(null);
              }} style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: '#22c55e', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>저장</button>
            </div>
          </div>
        </div>
      )}

      {attPopup && (
        <AttDashModal
          {...attPopup}
          onClose={() => setAttPopup(null)}
          onSave={r => {
            const exists = state.attendanceRecords.find(a => a.studentId === attPopup.studentId && a.date === attPopup.date);
            exists
              ? dispatch({ type: 'UPDATE_ATTENDANCE', payload: { ...r, id: exists.id } })
              : dispatch({ type: 'ADD_ATTENDANCE', payload: r });
          }}
          onDelete={id => dispatch({ type: 'DELETE_ATTENDANCE', payload: id })}
        />
      )}

      {makeupEditPopup && (
        <div onMouseDown={() => setMakeupEditPopup(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div onMouseDown={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 18, padding: 24, width: '100%', maxWidth: 360, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>보충 요청 상세</h3>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{makeupEditPopup.req.studentName} · {makeupEditPopup.req.makeupDate}</div>
              </div>
              <button onClick={() => setMakeupEditPopup(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#94a3b8" /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {(['completed', 'partial', 'postponed', 'cancelled'] as const).map(s => (
                  <button key={s} onClick={() => setMakeupEditStatus(s)} style={{
                    padding: '10px 0', borderRadius: 10, border: '2px solid',
                    borderColor: makeupEditStatus === s ? { completed: '#22c55e', partial: '#f59e0b', postponed: '#94a3b8', cancelled: '#ef4444' }[s] : '#e2e8f0',
                    background: makeupEditStatus === s ? { completed: '#d1fae5', partial: '#fef3c7', postponed: '#f1f5f9', cancelled: '#fee2e2' }[s] : 'white',
                    cursor: 'pointer', fontWeight: 700, fontSize: 12,
                    color: { completed: '#22c55e', partial: '#f59e0b', postponed: '#64748b', cancelled: '#ef4444' }[s]
                  }}>{{ completed: '완료', partial: '부분', postponed: '연기', cancelled: '취소' }[s]}</button>
                ))}
              </div>

              {makeupEditStatus === 'completed' && (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>완료 시간 (시간)</label>
                  <input type="number" value={makeupEditCompletedHours} onChange={e => setMakeupEditCompletedHours(e.target.value)} placeholder="0" min="0" style={{ fontSize: 16, fontWeight: 700, textAlign: 'center', padding: '8px', width: '100%', boxSizing: 'border-box', borderRadius: 10 }} />
                </div>
              )}

              {makeupEditStatus === 'partial' && (
                <>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>완료한 시간 (시간)</label>
                    <input type="number" value={makeupEditCompletedHours} onChange={e => setMakeupEditCompletedHours(e.target.value)} placeholder="0" min="0" style={{ fontSize: 16, fontWeight: 700, textAlign: 'center', padding: '8px', width: '100%', boxSizing: 'border-box', borderRadius: 10 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>남은 시간 (시간)</label>
                    <input type="number" value={makeupEditRemainingHours} onChange={e => setMakeupEditRemainingHours(e.target.value)} placeholder="0" min="0" style={{ fontSize: 16, fontWeight: 700, textAlign: 'center', padding: '8px', width: '100%', boxSizing: 'border-box', borderRadius: 10 }} />
                  </div>
                </>
              )}

              {(makeupEditStatus === 'postponed' || makeupEditStatus === 'cancelled') && (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>사유 (선택)</label>
                  <input type="text" value={makeupEditReason} onChange={e => setMakeupEditReason(e.target.value)} placeholder={makeupEditStatus === 'postponed' ? '연기 사유' : '취소 사유'} style={{ fontSize: 13, padding: '8px 10px', width: '100%', boxSizing: 'border-box', borderRadius: 10 }} />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={() => {
                if (confirm('정말 삭제하시겠습니까?')) {
                  dispatch({ type: 'DELETE_MAKEUP', payload: makeupEditPopup.req.id });
                  setMakeupEditPopup(null);
                }
              }} style={{ padding: '10px 12px', borderRadius: 10, border: 'none', background: '#fee2e2', color: '#ef4444', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>삭제</button>
              <button onClick={() => setMakeupEditPopup(null)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 13, color: '#64748b' }}>취소</button>
              <button onClick={() => {
                dispatch({ type: 'UPDATE_MAKEUP', payload: { ...makeupEditPopup.req, completedHours: Number(makeupEditCompletedHours) || 0, completionStatus: makeupEditStatus, remainingHours: Number(makeupEditRemainingHours) || 0, cancellationReason: makeupEditReason || undefined } });
                setMakeupEditPopup(null);
              }} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: '#6366f1', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
