'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { AttendanceRecord } from '@/lib/types';
import { Calendar, Plus, CheckCircle, Clock, XCircle, Printer, X, Edit2, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

const ATTENDANCE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1gvAaaBfba-o2zPv9TM39xTKzmpaldsv2D-bIz7WAdms/edit?usp=sharing';
import QRCodeCanvas from '@/components/QRCodePrint';
import { getWeekKey, getWeekDateRange, getPrevWeek, getNextWeek, localDateStr, DAY_LABELS, DAY_ORDER } from '@/lib/utils';
import { HomeworkDay } from '@/lib/types';

const STATUS = { present: '출석', late: '지각', absent: '결석' } as const;
const STATUS_COLOR = { present: '#22c55e', late: '#f59e0b', absent: '#ef4444' };

function EditModal({ record, onSave, onClose, onDelete }: { record: AttendanceRecord; onSave: (r: AttendanceRecord) => void; onClose: () => void; onDelete: () => void }) {
  const [checkIn, setCheckIn] = useState(record.checkInTime);
  const [checkOut, setCheckOut] = useState(record.checkOutTime || '');
  const [status, setStatus] = useState(record.status);
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{record.studentName} 출석 수정</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={22} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>입실 시간</label>
            <input type="time" value={checkIn} onChange={e => setCheckIn(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>퇴실 시간</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="time" value={checkOut} onChange={e => setCheckOut(e.target.value)} style={{ flex: 1 }} />
              <button
                type="button"
                onClick={() => setCheckOut(new Date().toTimeString().slice(0, 5))}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap' }}
              >
                지금
              </button>
              {checkOut && (
                <button
                  type="button"
                  onClick={() => setCheckOut('')}
                  style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2', cursor: 'pointer', fontSize: 12, color: '#ef4444' }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>상태</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['present', 'late', 'absent'] as const).map(s => (
                <button key={s} onClick={() => setStatus(s)} style={{
                  flex: 1, padding: '12px 0', borderRadius: 10, border: '2px solid',
                  borderColor: status === s ? STATUS_COLOR[s] : '#e2e8f0',
                  background: status === s ? STATUS_COLOR[s] + '18' : 'white',
                  cursor: 'pointer', fontWeight: 700, fontSize: 14,
                  color: status === s ? STATUS_COLOR[s] : '#94a3b8',
                }}>
                  {STATUS[s]}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button onClick={() => { if (confirm(`${record.studentName}의 출석 기록을 삭제할까요?`)) onDelete(); }}
            style={{ padding: '12px 14px', borderRadius: 10, border: 'none', background: '#fee2e2', color: '#ef4444', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>삭제</button>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>취소</button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => onSave({ ...record, checkInTime: checkIn, checkOutTime: checkOut || undefined, status })}>저장</button>
        </div>
      </div>
    </div>
  );
}

function localDate(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function localTime(d = new Date()) {
  return d.toTimeString().slice(0, 5);
}

function AddModal({ onSave, onClose }: { onSave: (r: AttendanceRecord) => void; onClose: () => void }) {
  const { state } = useStore();
  const [studentId, setStudentId] = useState('');
  const [date, setDate] = useState(localDate());
  const [time, setTime] = useState(localTime());
  const [checkOut, setCheckOut] = useState('');
  const [status, setStatus] = useState<'present' | 'late' | 'absent'>('present');

  const save = () => {
    const s = state.students.find(x => x.id === studentId);
    if (!s) return alert('학생 선택');
    onSave({ id: `a${Date.now()}`, studentId, studentName: s.name, classGroup: s.classGroup, date, checkInTime: time, checkOutTime: checkOut || undefined, status });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>출석 수동 입력</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={22} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>학생</label>
            <select value={studentId} onChange={e => setStudentId(e.target.value)}>
              <option value="">학생 선택</option>
              {state.students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.classGroup})</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>날짜</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>입실 시간</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>퇴실 시간 <span style={{ fontWeight: 400, color: '#94a3b8' }}>(선택)</span></label>
            <input type="time" value={checkOut} onChange={e => setCheckOut(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>상태</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['present', 'late', 'absent'] as const).map(s => (
                <button key={s} onClick={() => setStatus(s)} style={{
                  flex: 1, padding: '12px', borderRadius: 10, border: '2px solid',
                  borderColor: status === s ? STATUS_COLOR[s] : '#e2e8f0',
                  background: status === s ? STATUS_COLOR[s] + '18' : 'white',
                  cursor: 'pointer', fontWeight: 700, fontSize: 13,
                  color: status === s ? STATUS_COLOR[s] : '#94a3b8',
                }}>
                  {STATUS[s]}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>취소</button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={save}>저장</button>
        </div>
      </div>
    </div>
  );
}

function QRModal({ onClose }: { onClose: () => void }) {
  const { state } = useStore();
  const classGroups = [...new Set(state.students.map(s => s.classGroup))];
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://gongter-lms.vercel.app';

  return (
    <div className="modal-backdrop">
      <div className="modal" style={{ maxWidth: 500 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>출석 QR 코드 출력</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={22} /></button>
        </div>
        <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#15803d' }}>
          인쇄 후 교실에 부착 → 학생이 QR 스캔 → 이름 입력 → 자동 출석 등록
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: classGroups.length > 1 ? '1fr 1fr' : '1fr', gap: 16 }}>
          {classGroups.map(cls => (
            <div key={cls} style={{ border: '1px solid #e2e8f0', borderRadius: 14, padding: 20, textAlign: 'center' }}>
              <QRCodeCanvas url={`${baseUrl}/checkin?class=${encodeURIComponent(cls)}`} label={cls} size={160} />
              <div style={{ marginTop: 10, fontSize: 12, color: '#94a3b8', wordBreak: 'break-all' }}>
                {baseUrl}/checkin?class={cls}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>닫기</button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => window.print()}>
            <Printer size={16} /> 인쇄
          </button>
        </div>
      </div>
    </div>
  );
}

function WeeklyView() {
  const { state, dispatch } = useStore();
  const [week, setWeek] = useState(getWeekKey());
  const { start, label } = getWeekDateRange(week);

  const weekDates = DAY_ORDER.map((day, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return { day: day as HomeworkDay, date: localDateStr(d) };
  });

  const quickSet = (student: { id: string; name: string; classGroup: string }, date: string, status: 'present' | 'late' | 'absent') => {
    const exists = state.attendanceRecords.find(a => a.studentId === student.id && a.date === date);
    if (exists) {
      dispatch({ type: 'UPDATE_ATTENDANCE', payload: { ...exists, status } });
    } else {
      dispatch({ type: 'ADD_ATTENDANCE', payload: { id: `a${Date.now()}`, studentId: student.id, studentName: student.name, classGroup: student.classGroup, date, checkInTime: localTime(), status } });
    }
  };

  const cycleStatus = (current: 'present' | 'late' | 'absent' | undefined) => {
    if (!current) return 'present';
    if (current === 'present') return 'late';
    if (current === 'late') return 'absent';
    return 'present';
  };

  const STATUS_CELL = {
    present: { text: '출', bg: '#d1fae5', color: '#16a34a' },
    late:    { text: '지', bg: '#fef3c7', color: '#92400e' },
    absent:  { text: '결', bg: '#fee2e2', color: '#991b1b' },
  };

  return (
    <div>
      {/* 주간 네비게이션 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, justifyContent: 'center' }}>
        <button onClick={() => setWeek(getPrevWeek(week))} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <ChevronLeft size={16} />
        </button>
        <span style={{ fontWeight: 700, fontSize: 15 }}>{label}</span>
        <button onClick={() => setWeek(getNextWeek(week))} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <ChevronRight size={16} />
        </button>
      </div>

      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 10 }}>
        셀을 클릭하면 출석→지각→결석 순서로 변경됩니다
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden', overflowX: 'auto' }}>
        <table style={{ minWidth: 480 }}>
          <thead>
            <tr>
              <th style={{ minWidth: 90, textAlign: 'left' }}>학생</th>
              {weekDates.map(({ day, date }) => (
                <th key={day} style={{ textAlign: 'center', minWidth: 60 }}>
                  {DAY_LABELS[day]}<br/>
                  <span style={{ fontSize: 10, fontWeight: 400 }}>{date.slice(5)}</span>
                </th>
              ))}
              <th style={{ textAlign: 'center', minWidth: 60 }}>합계</th>
            </tr>
          </thead>
          <tbody>
            {state.students.map(student => {
              const scheduled = (student.scheduleDays || []) as HomeworkDay[];
              let attended = 0;
              return (
                <tr key={student.id}>
                  <td>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{student.name}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{student.classGroup}</div>
                  </td>
                  {weekDates.map(({ day, date }) => {
                    const isScheduled = scheduled.includes(day);
                    const rec = state.attendanceRecords.find(a => a.studentId === student.id && a.date === date);
                    if (rec && rec.status !== 'absent') attended++;

                    if (!isScheduled) {
                      const makeupRec = state.attendanceRecords.find(a => a.studentId === student.id && a.date === date);
                      return (
                        <td key={day} style={{ textAlign: 'center', cursor: 'pointer', background: makeupRec ? '#f0f9ff' : '#f8fafc' }}
                          title={makeupRec ? '클릭하면 보충 취소' : '클릭하면 보충 수업 등록'}
                          onClick={() => {
                            if (makeupRec) {
                              dispatch({ type: 'DELETE_ATTENDANCE', payload: makeupRec.id });
                            } else {
                              dispatch({ type: 'ADD_ATTENDANCE', payload: { id: `a${Date.now()}`, studentId: student.id, studentName: student.name, classGroup: student.classGroup, date, checkInTime: localTime(), status: 'present' } });
                            }
                          }}>
                          <span style={{ display: 'inline-block', width: 28, height: 28, lineHeight: '28px', borderRadius: '50%', fontSize: makeupRec ? 9 : 13, fontWeight: 700, background: makeupRec ? '#0ea5e9' : 'transparent', color: makeupRec ? 'white' : '#cbd5e1' }}>
                            {makeupRec ? '보충' : '–'}
                          </span>
                        </td>
                      );
                    }

                    const cell = rec ? STATUS_CELL[rec.status] : { text: '결', bg: '#fee2e2', color: '#991b1b' };
                    const nextStatus = cycleStatus(rec?.status);

                    return (
                      <td key={day} style={{ textAlign: 'center', cursor: 'pointer' }}
                        onClick={() => quickSet(student, date, nextStatus)}>
                        <span style={{
                          display: 'inline-block', width: 28, height: 28, lineHeight: '28px',
                          borderRadius: '50%', fontSize: 12, fontWeight: 700,
                          background: cell.bg, color: cell.color,
                        }}>
                          {cell.text}
                        </span>
                      </td>
                    );
                  })}
                  <td style={{ textAlign: 'center', fontWeight: 700, fontSize: 13 }}>
                    <span style={{ color: attended >= scheduled.length ? '#16a34a' : '#ef4444' }}>
                      {attended}/{scheduled.length || '?'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {state.students.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>등록된 학생이 없습니다</div>
        )}
      </div>

      {/* 보충 신청 승인 */}
      {(state.makeupRequests || []).filter(r => r.status === 'pending').length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>보충 수업 신청 대기</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(state.makeupRequests || []).filter(r => r.status === 'pending').map(req => (
              <div key={req.id} className="card" style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{req.studentName}</div>
                  <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
                    희망일: {req.makeupDate} {req.makeupTime}
                  </div>
                  {req.reason && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{req.reason}</div>}
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{req.week}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => {
                      dispatch({ type: 'UPDATE_MAKEUP', payload: { ...req, status: 'approved', approvedAt: new Date().toISOString() } });
                      const student = state.students.find(s => s.id === req.studentId);
                      if (student) {
                        dispatch({ type: 'ADD_ATTENDANCE', payload: { id: `a${Date.now()}`, studentId: req.studentId, studentName: req.studentName, classGroup: student.classGroup, date: req.makeupDate, checkInTime: req.makeupTime, status: 'present' } });
                      }
                    }}
                    style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#d1fae5', color: '#065f46', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}
                  >
                    승인
                  </button>
                  <button
                    onClick={() => dispatch({ type: 'UPDATE_MAKEUP', payload: { ...req, status: 'rejected' } })}
                    style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#fee2e2', color: '#991b1b', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}
                  >
                    거절
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AttendancePage() {
  const { state, dispatch } = useStore();
  const [tab, setTab] = useState<'daily' | 'weekly'>('daily');
  const [selectedDate, setSelectedDate] = useState(localDate());
  const [selectedClass, setSelectedClass] = useState('전체');
  const [showAdd, setShowAdd] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [editRecord, setEditRecord] = useState<AttendanceRecord | null>(null);
  const [checkoutEdit, setCheckoutEdit] = useState<{ studentId: string; time: string } | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const classGroups = ['전체', ...new Set(state.students.map(s => s.classGroup))];
  const dayRecords = state.attendanceRecords.filter(a => a.date === selectedDate);
  const filtered = selectedClass === '전체' ? state.students : state.students.filter(s => s.classGroup === selectedClass);
  const selectedWeekday = ['sun','mon','tue','wed','thu','fri','sat'][new Date(selectedDate + 'T12:00:00').getDay()];
  const sortedFiltered = [...filtered].sort((a, b) => {
    const tA = a.scheduleTimes?.[selectedWeekday] || a.scheduleTime || '';
    const tB = b.scheduleTimes?.[selectedWeekday] || b.scheduleTime || '';
    if (!tA && !tB) return 0;
    if (!tA) return 1;
    if (!tB) return -1;
    return tA.localeCompare(tB);
  });

  const present = dayRecords.filter(a => a.status === 'present').length;
  const late = dayRecords.filter(a => a.status === 'late').length;
  const absent = filtered.length - dayRecords.filter(a => filtered.some(s => s.id === a.studentId)).length;

  const saveRecord = (r: AttendanceRecord) => {
    const exists = state.attendanceRecords.find(a => a.studentId === r.studentId && a.date === r.date);
    exists ? dispatch({ type: 'UPDATE_ATTENDANCE', payload: { ...r, id: exists.id } }) : dispatch({ type: 'ADD_ATTENDANCE', payload: r });
    setShowAdd(false);
  };

  const saveCheckout = (studentId: string) => {
    if (!checkoutEdit || checkoutEdit.studentId !== studentId) return;
    const rec = state.attendanceRecords.find(a => a.studentId === studentId && a.date === selectedDate);
    if (!rec) return;
    dispatch({ type: 'UPDATE_ATTENDANCE', payload: { ...rec, checkOutTime: checkoutEdit.time } });
    setCheckoutEdit(null);
  };

  const quickSet = (student: { id: string; name: string; classGroup: string }, status: 'present' | 'late' | 'absent') => {
    const exists = state.attendanceRecords.find(a => a.studentId === student.id && a.date === selectedDate);
    const now = localTime();
    if (exists) {
      dispatch({ type: 'UPDATE_ATTENDANCE', payload: { ...exists, status, checkInTime: exists.checkInTime || now } });
    } else {
      dispatch({ type: 'ADD_ATTENDANCE', payload: { id: `a${Date.now()}`, studentId: student.id, studentName: student.name, classGroup: student.classGroup, date: selectedDate, checkInTime: now, status } });
    }
  };

  return (
    <div>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>출석 관리</h1>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <a href={ATTENDANCE_SHEET_URL} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 12px', borderRadius: 10, border: '1px solid #34a853', background: '#f0fdf4', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#16a34a', textDecoration: 'none' }}>
            <ExternalLink size={14} /> 구글 시트
          </a>
          <button onClick={() => setShowQR(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 12px', borderRadius: 10, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            QR 출력
          </button>
          <button
            onClick={() => { if (confirm('이번 주 출석 데이터를 모두 초기화할까요?')) dispatch({ type: 'RESET_ATTENDANCE' }); }}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 12px', borderRadius: 10, border: '1px solid #fecaca', background: '#fef2f2', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#ef4444' }}>
            주간 초기화
          </button>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Plus size={15} /> 수동 입력
          </button>
        </div>
      </div>

      {/* 탭 */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {[{ key: 'daily', label: '일별 출석' }, { key: 'weekly', label: '주간 출석표' }].map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key as 'daily' | 'weekly')} style={{
            padding: '8px 16px', borderRadius: 20, border: '1px solid',
            borderColor: tab === key ? '#6366f1' : '#e2e8f0',
            background: tab === key ? '#eff0ff' : 'white',
            color: tab === key ? '#6366f1' : '#64748b',
            fontWeight: tab === key ? 700 : 400, fontSize: 13, cursor: 'pointer',
          }}>{label}</button>
        ))}
      </div>

      {tab === 'weekly' ? <WeeklyView /> : (
        <>
          {/* 날짜 + 반 필터 */}
          <div className="card" style={{ marginBottom: 12, padding: '12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Calendar size={16} color="#6366f1" />
              <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                style={{ width: 'auto', padding: '6px 10px', fontSize: 14, fontWeight: 600, borderRadius: 8 }} />
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {classGroups.map(cls => (
                <button key={cls} onClick={() => setSelectedClass(cls)} style={{
                  padding: '7px 14px', borderRadius: 20, border: '1px solid',
                  borderColor: selectedClass === cls ? '#6366f1' : '#e2e8f0',
                  background: selectedClass === cls ? '#eff0ff' : 'white',
                  color: selectedClass === cls ? '#6366f1' : '#64748b',
                  fontWeight: selectedClass === cls ? 700 : 400,
                  cursor: 'pointer', fontSize: 13,
                }}>{cls}</button>
              ))}
            </div>
          </div>

          {/* 통계 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
            {[
              { label: '출석', count: present, icon: CheckCircle, color: '#22c55e', bg: '#d1fae5' },
              { label: '지각', count: late, icon: Clock, color: '#f59e0b', bg: '#fef3c7' },
              { label: '미체크', count: absent, icon: XCircle, color: '#ef4444', bg: '#fee2e2' },
            ].map(({ label, count, icon: Icon, color, bg }) => (
              <div key={label} className="card" style={{ padding: '12px', background: bg, border: 'none', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color }}>{count}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* 학생 목록 */}
          {isMobile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sortedFiltered.map(student => {
                const rec = dayRecords.find(r => r.studentId === student.id);
                const isScheduledToday = (student.scheduleDays || []).includes(selectedWeekday);
                const isMakeup = !isScheduledToday && !!rec;
                const isInactive = !isScheduledToday && !rec;
                return (
                  <div key={student.id} className="card" style={{ padding: '14px 16px', background: isInactive ? '#f8fafc' : 'white', opacity: isInactive ? 0.8 : 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isInactive ? 0 : 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 38, height: 38, borderRadius: '50%', background: isInactive ? '#f1f5f9' : '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: isInactive ? '#94a3b8' : '#1e40af', flexShrink: 0 }}>
                          {student.name[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 15, color: isInactive ? '#94a3b8' : undefined }}>{student.name}</div>
                          <div style={{ fontSize: 12, color: '#94a3b8' }}>
                            {student.classGroup}
                            {isInactive && <span> · 비수업일</span>}
                            {isMakeup && <span style={{ color: '#0369a1' }}> · 보충 수업</span>}
                            {!isInactive && !isMakeup && rec?.checkInTime ? ` · 입 ${rec.checkInTime}` : ''}
                            {!isInactive && !isMakeup && rec?.checkOutTime ? ` → 퇴 ${rec.checkOutTime}` : ''}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {isMakeup && <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1' }}>보충</span>}
                        {isScheduledToday && rec ? <span className={`badge badge-${rec.status}`}>{STATUS[rec.status]}</span>
                          : isScheduledToday ? <span className="badge" style={{ background: '#f1f5f9', color: '#94a3b8' }}>미체크</span> : null}
                        {isInactive && (
                          <button onClick={() => quickSet(student, 'present')} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #bae6fd', background: '#e0f2fe', color: '#0369a1', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>
                            보충 등록
                          </button>
                        )}
                        {rec && (
                          <button onClick={() => setEditRecord(rec)} style={{ background: '#eff6ff', border: 'none', cursor: 'pointer', padding: '7px 8px', borderRadius: 8, display: 'flex', alignItems: 'center' }}>
                            <Edit2 size={13} color="#3b82f6" />
                          </button>
                        )}
                      </div>
                    </div>
                    {!isInactive && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                      {(['present', 'late', 'absent'] as const).map(s => (
                        <button key={s} onClick={() => quickSet(student, s)} style={{
                          padding: '11px 0', borderRadius: 10, border: '2px solid',
                          borderColor: rec?.status === s ? STATUS_COLOR[s] : '#e2e8f0',
                          background: rec?.status === s ? STATUS_COLOR[s] + '18' : '#f8fafc',
                          cursor: 'pointer', fontWeight: 700, fontSize: 14,
                          color: rec?.status === s ? STATUS_COLOR[s] : '#64748b',
                        }}>
                          {STATUS[s]}
                        </button>
                      ))}
                    </div>
                    )}
                    {rec && (
                      <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
                        {checkoutEdit?.studentId === student.id ? (
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap' }}>퇴원 시간</span>
                            <input type="time" value={checkoutEdit.time}
                              onChange={e => setCheckoutEdit({ ...checkoutEdit, time: e.target.value })}
                              style={{ flex: 1, fontSize: 14, padding: '6px 8px', borderRadius: 8, border: '1px solid #6366f1' }} />
                            <button onClick={() => saveCheckout(student.id)}
                              style={{ padding: '7px 12px', borderRadius: 8, border: 'none', background: '#6366f1', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>저장</button>
                            <button onClick={() => setCheckoutEdit(null)}
                              style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: 13, color: '#94a3b8' }}>✕</button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 12, color: rec.checkOutTime ? '#d97706' : '#94a3b8', fontWeight: 600 }}>
                              퇴원 {rec.checkOutTime || '미기록'}
                            </span>
                            <button onClick={() => setCheckoutEdit({ studentId: student.id, time: rec.checkOutTime || localTime() })}
                              style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #fed7aa', background: '#fff7ed', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#d97706' }}>
                              퇴원 {rec.checkOutTime ? '수정' : '기록'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th style={{ minWidth: 110 }}>학생</th>
                      <th>반</th>
                      <th>입실</th>
                      <th>퇴실</th>
                      <th>상태</th>
                      <th style={{ minWidth: 180 }}>빠른 처리</th>
                      <th>수정</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(student => {
                      const rec = dayRecords.find(r => r.studentId === student.id);
                      const isScheduledToday = (student.scheduleDays || []).includes(selectedWeekday);
                      const isMakeup = !isScheduledToday && !!rec;
                      const isInactive = !isScheduledToday && !rec;
                      return (
                        <tr key={student.id} style={{ background: isInactive ? '#f8fafc' : undefined, opacity: isInactive ? 0.75 : 1 }}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 30, height: 30, borderRadius: '50%', background: isInactive ? '#f1f5f9' : '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: isInactive ? '#94a3b8' : '#1e40af', flexShrink: 0 }}>
                                {student.name[0]}
                              </div>
                              <span style={{ fontWeight: 600, fontSize: 14, color: isInactive ? '#94a3b8' : undefined }}>{student.name}</span>
                            </div>
                          </td>
                          <td><span className="badge badge-blue">{student.classGroup}</span></td>
                          <td style={{ fontWeight: 600, color: '#16a34a' }}>{rec?.checkInTime || (isInactive ? '' : '-')}</td>
                          <td>
                            {checkoutEdit?.studentId === student.id ? (
                              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                <input type="time" value={checkoutEdit.time}
                                  onChange={e => setCheckoutEdit({ ...checkoutEdit, time: e.target.value })}
                                  style={{ width: 90, fontSize: 12, padding: '3px 6px', borderRadius: 6, border: '1px solid #6366f1' }} />
                                <button onClick={() => saveCheckout(student.id)}
                                  style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: '#6366f1', color: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>✓</button>
                                <button onClick={() => setCheckoutEdit(null)}
                                  style={{ padding: '4px 6px', borderRadius: 6, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: 12, color: '#94a3b8' }}>✕</button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontWeight: 600, color: rec?.checkOutTime ? '#d97706' : '#94a3b8' }}>
                                  {rec?.checkOutTime || '-'}
                                </span>
                                {rec && (
                                  <button onClick={() => setCheckoutEdit({ studentId: student.id, time: rec.checkOutTime || localTime() })}
                                    style={{ padding: '3px 8px', borderRadius: 6, border: '1px solid #fed7aa', background: '#fff7ed', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: '#d97706', whiteSpace: 'nowrap' }}>
                                    퇴원
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                          <td>
                            {isInactive
                              ? <span className="badge" style={{ background: '#f1f5f9', color: '#cbd5e1' }}>비수업일</span>
                              : isMakeup
                                ? <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1' }}>보충</span>
                                : rec
                                  ? <span className={`badge badge-${rec.status}`}>{STATUS[rec.status]}</span>
                                  : <span className="badge" style={{ background: '#f1f5f9', color: '#94a3b8' }}>미체크</span>}
                          </td>
                          <td>
                            {isInactive ? (
                              <button onClick={() => quickSet(student, 'present')} style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid #bae6fd', background: '#e0f2fe', color: '#0369a1', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                                보충 등록
                              </button>
                            ) : (
                              <div style={{ display: 'flex', gap: 5 }}>
                                {(['present', 'late', 'absent'] as const).map(s => (
                                  <button key={s} onClick={() => quickSet(student, s)} style={{
                                    padding: '5px 8px', borderRadius: 7, border: '1px solid',
                                    borderColor: rec?.status === s ? STATUS_COLOR[s] : '#e2e8f0',
                                    background: rec?.status === s ? STATUS_COLOR[s] + '18' : 'white',
                                    cursor: 'pointer', fontSize: 12, fontWeight: rec?.status === s ? 700 : 400,
                                    color: rec?.status === s ? STATUS_COLOR[s] : '#64748b',
                                  }}>{STATUS[s]}</button>
                                ))}
                              </div>
                            )}
                          </td>
                          <td>
                            {rec && (
                              <button onClick={() => setEditRecord(rec)} style={{ background: '#eff6ff', border: 'none', cursor: 'pointer', padding: '6px 8px', borderRadius: 7 }}>
                                <Edit2 size={13} color="#3b82f6" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {showAdd && <AddModal onSave={saveRecord} onClose={() => setShowAdd(false)} />}
      {showQR && <QRModal onClose={() => setShowQR(false)} />}
      {editRecord && <EditModal record={editRecord} onSave={r => { dispatch({ type: 'UPDATE_ATTENDANCE', payload: r }); setEditRecord(null); }} onClose={() => setEditRecord(null)} onDelete={() => { dispatch({ type: 'DELETE_ATTENDANCE', payload: editRecord.id }); setEditRecord(null); }} />}
    </div>
  );
}
