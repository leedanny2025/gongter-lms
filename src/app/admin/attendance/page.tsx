'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { AttendanceRecord } from '@/lib/types';
import { Calendar, Plus, CheckCircle, Clock, XCircle, Printer, X, Edit2 } from 'lucide-react';
import QRCodeCanvas from '@/components/QRCodePrint';
import WeekSelector from '@/components/WeekSelector';

const STATUS = { present: '출석', late: '지각', absent: '결석' } as const;
const STATUS_COLOR = { present: '#22c55e', late: '#f59e0b', absent: '#ef4444' };

function EditModal({ record, onSave, onClose }: { record: AttendanceRecord; onSave: (r: AttendanceRecord) => void; onClose: () => void }) {
  const [time, setTime] = useState(record.checkInTime);
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
            <input type="time" value={time} onChange={e => setTime(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>상태</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['present', 'late', 'absent'] as const).map(s => (
                <button key={s} onClick={() => setStatus(s)} style={{
                  flex: 1, padding: '10px 0', borderRadius: 10, border: '2px solid',
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
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>취소</button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => onSave({ ...record, checkInTime: time, status })}>저장</button>
        </div>
      </div>
    </div>
  );
}

function AddModal({ onSave, onClose }: { onSave: (r: AttendanceRecord) => void; onClose: () => void }) {
  const { state } = useStore();
  const [studentId, setStudentId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  const [status, setStatus] = useState<'present' | 'late' | 'absent'>('present');

  const save = () => {
    const s = state.students.find(x => x.id === studentId);
    if (!s) return alert('학생 선택');
    onSave({ id: `a${Date.now()}`, studentId, studentName: s.name, classGroup: s.classGroup, date, checkInTime: time, status });
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
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>시간</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>상태</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['present', 'late', 'absent'] as const).map(s => (
                <button key={s} onClick={() => setStatus(s)} style={{
                  flex: 1, padding: '10px', borderRadius: 10, border: '2px solid',
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
          💡 인쇄 후 교실에 부착 → 학생이 QR 스캔 → 이름 입력 → 자동 출석 등록
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: classGroups.length > 1 ? '1fr 1fr' : '1fr', gap: 16 }}>
          {classGroups.map(cls => (
            <div key={cls} style={{ border: '1px solid #e2e8f0', borderRadius: 14, padding: 20, textAlign: 'center' }}>
              <QRCodeCanvas
                url={`${baseUrl}/checkin?class=${encodeURIComponent(cls)}`}
                label={cls}
                size={160}
              />
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

export default function AttendancePage() {
  const { state, dispatch } = useStore();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedClass, setSelectedClass] = useState('전체');
  const [showAdd, setShowAdd] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [editRecord, setEditRecord] = useState<AttendanceRecord | null>(null);
  const [week, setWeek] = useState(state.currentWeek);

  const classGroups = ['전체', ...new Set(state.students.map(s => s.classGroup))];
  const dayRecords = state.attendanceRecords.filter(a => a.date === selectedDate);
  const filtered = selectedClass === '전체' ? state.students : state.students.filter(s => s.classGroup === selectedClass);

  const present = dayRecords.filter(a => a.status === 'present').length;
  const late = dayRecords.filter(a => a.status === 'late').length;
  const absent = filtered.length - dayRecords.filter(a => filtered.some(s => s.id === a.studentId)).length;

  const saveRecord = (r: AttendanceRecord) => {
    const exists = state.attendanceRecords.find(a => a.studentId === r.studentId && a.date === r.date);
    exists ? dispatch({ type: 'UPDATE_ATTENDANCE', payload: { ...r, id: exists.id } }) : dispatch({ type: 'ADD_ATTENDANCE', payload: r });
    setShowAdd(false);
  };

  const quickSet = (student: { id: string; name: string; classGroup: string }, status: 'present' | 'late' | 'absent') => {
    const exists = state.attendanceRecords.find(a => a.studentId === student.id && a.date === selectedDate);
    const now = new Date().toTimeString().slice(0, 5);
    if (exists) {
      dispatch({ type: 'UPDATE_ATTENDANCE', payload: { ...exists, status, checkInTime: exists.checkInTime || now } });
    } else {
      dispatch({ type: 'ADD_ATTENDANCE', payload: { id: `a${Date.now()}`, studentId: student.id, studentName: student.name, classGroup: student.classGroup, date: selectedDate, checkInTime: now, status } });
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>출석 관리</h1>
          <p style={{ color: '#64748b', marginTop: 2, fontSize: 13 }}>반별 출석 체크 및 QR 코드 관리</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => setShowQR(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            QR 출력
          </button>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Plus size={15} /> 수동 입력</button>
        </div>
      </div>

      {/* 날짜 + 반 필터 */}
      <div className="card" style={{ marginBottom: 16, padding: '14px 16px', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calendar size={16} color="#6366f1" />
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={{ width: 'auto', padding: '6px 10px', fontSize: 14, fontWeight: 600, borderRadius: 8 }} />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {classGroups.map(cls => (
            <button key={cls} onClick={() => setSelectedClass(cls)} style={{
              padding: '6px 14px', borderRadius: 20, border: '1px solid',
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { label: '출석', count: present, icon: CheckCircle, color: '#22c55e', bg: '#d1fae5' },
          { label: '지각', count: late, icon: Clock, color: '#f59e0b', bg: '#fef3c7' },
          { label: '미체크', count: absent, icon: XCircle, color: '#ef4444', bg: '#fee2e2' },
        ].map(({ label, count, icon: Icon, color, bg }) => (
          <div key={label} className="card" style={{ padding: '14px', background: bg, border: 'none', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color }}>{count}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* 반별 출석표 */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th style={{ minWidth: 110 }}>학생</th>
                <th>반</th>
                <th>시간</th>
                <th>상태</th>
                <th style={{ minWidth: 180 }}>빠른 처리</th>
                <th>수정</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(student => {
                const rec = dayRecords.find(r => r.studentId === student.id);
                return (
                  <tr key={student.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#1e40af', flexShrink: 0 }}>
                          {student.name[0]}
                        </div>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{student.name}</span>
                      </div>
                    </td>
                    <td><span className="badge badge-blue">{student.classGroup}</span></td>
                    <td style={{ fontWeight: 600 }}>{rec?.checkInTime || '-'}</td>
                    <td>
                      {rec ? <span className={`badge badge-${rec.status}`}>{STATUS[rec.status]}</span>
                        : <span className="badge" style={{ background: '#f1f5f9', color: '#94a3b8' }}>미체크</span>}
                    </td>
                    <td>
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

      {showAdd && <AddModal onSave={saveRecord} onClose={() => setShowAdd(false)} />}
      {showQR && <QRModal onClose={() => setShowQR(false)} />}
      {editRecord && <EditModal record={editRecord} onSave={r => { dispatch({ type: 'UPDATE_ATTENDANCE', payload: r }); setEditRecord(null); }} onClose={() => setEditRecord(null)} />}
    </div>
  );
}
