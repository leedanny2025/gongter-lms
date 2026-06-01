'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useStore } from '@/lib/store';
import { getWeekKey, getWeekDateRange, localDateStr, DAY_LABELS, DAY_ORDER } from '@/lib/utils';
import { MakeupRequest, HomeworkDay } from '@/lib/types';
import { Plus, X, CheckCircle, Clock, XCircle } from 'lucide-react';
import WeekSelector from '@/components/WeekSelector';

export default function MakeupPage() {
  const params = useParams();
  const id = params.id as string;
  const { state, dispatch } = useStore();

  const student = state.students.find(s => s.id === id);
  const [selectedWeek, setSelectedWeek] = useState(getWeekKey());
  const week = selectedWeek;
  const { start, label } = getWeekDateRange(week);

  const [showForm, setShowForm] = useState(false);
  const [makeupDate, setMakeupDate] = useState('');
  const [makeupTime, setMakeupTime] = useState('');
  const [reason, setReason] = useState('');

  const weekDates = DAY_ORDER.map((day, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return { day: day as HomeworkDay, date: localDateStr(d) };
  });

  const scheduledDays = (student?.scheduleDays || []) as HomeworkDay[];

  const weekAttendance = state.attendanceRecords.filter(a =>
    a.studentId === id && weekDates.some(wd => wd.date === a.date)
  );

  const attendedCount = scheduledDays.filter(day => {
    const wd = weekDates.find(w => w.day === day);
    if (!wd) return false;
    const rec = weekAttendance.find(a => a.date === wd.date);
    return rec && rec.status !== 'absent';
  }).length;

  const missingDays = scheduledDays.length - attendedCount;

  const myRequests = (state.makeupRequests || [])
    .filter(r => r.studentId === id)
    .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));

  const submitRequest = () => {
    if (!makeupDate || !makeupTime) return;
    const req: MakeupRequest = {
      id: `mk${Date.now()}`,
      studentId: id,
      studentName: student?.name || '',
      week,
      requestedAt: new Date().toISOString(),
      makeupDate,
      makeupTime,
      reason,
      status: 'pending',
    };
    dispatch({ type: 'ADD_MAKEUP', payload: req });
    setShowForm(false);
    setMakeupDate('');
    setMakeupTime('');
    setReason('');
  };

  const STATUS_ICON = {
    approved: <CheckCircle size={14} color="#16a34a" />,
    rejected: <XCircle size={14} color="#ef4444" />,
    pending:  <Clock size={14} color="#f59e0b" />,
  };
  const STATUS_LABEL = { approved: '승인됨', rejected: '거절됨', pending: '검토중' };
  const STATUS_COLOR = {
    approved: { bg: '#d1fae5', color: '#065f46' },
    rejected: { bg: '#fee2e2', color: '#991b1b' },
    pending:  { bg: '#fef3c7', color: '#92400e' },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 주 선택 */}
      <WeekSelector week={selectedWeek} onChange={setSelectedWeek} />

      {/* 이번 주 출석 현황 */}
      <div style={{ background: 'white', borderRadius: 20, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 700 }}>이번 주 출석 현황</h2>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: '#94a3b8' }}>{label}</p>

        {scheduledDays.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: 14, background: '#f8fafc', borderRadius: 12 }}>
            수업 일정이 설정되지 않았습니다.<br/>
            <span style={{ fontSize: 12 }}>선생님께 문의해 주세요.</span>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              {weekDates.map(({ day, date }) => {
                const isScheduled = scheduledDays.includes(day);
                const rec = weekAttendance.find(a => a.date === date);

                let bg = '#f1f5f9', color = '#cbd5e1', text = '–';
                if (isScheduled) {
                  if (rec) {
                    if (rec.status === 'present') { bg = '#d1fae5'; color = '#16a34a'; text = '출'; }
                    else if (rec.status === 'late') { bg = '#fef3c7'; color = '#92400e'; text = '지'; }
                    else { bg = '#fee2e2'; color = '#991b1b'; text = '결'; }
                  } else {
                    bg = '#fee2e2'; color = '#991b1b'; text = '결';
                  }
                }

                return (
                  <div key={day} style={{ flex: 1, textAlign: 'center', background: bg, borderRadius: 10, padding: '10px 0' }}>
                    <div style={{ fontSize: 13, color, fontWeight: 700 }}>{DAY_LABELS[day]}</div>
                    <div style={{ fontSize: 15, color, fontWeight: 900, marginTop: 4 }}>{text}</div>
                  </div>
                );
              })}
            </div>

            <div style={{
              background: missingDays > 0 ? '#fff7ed' : '#f0fdf4',
              borderRadius: 12, padding: '12px 14px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: missingDays > 0 ? '#92400e' : '#15803d' }}>
                  {attendedCount}/{scheduledDays.length}일 출석
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                  {missingDays > 0 ? `${missingDays}일 부족 — 보충 수업을 신청할 수 있어요` : '이번 주 출석 완료!'}
                </div>
              </div>
              {missingDays > 0 && (
                <button
                  onClick={() => setShowForm(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 14px', borderRadius: 10, border: 'none', background: '#f97316', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: 13, minHeight: 'unset' }}
                >
                  <Plus size={14} /> 보충 신청
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* 신청 내역 */}
      {myRequests.length > 0 && (
        <div style={{ background: 'white', borderRadius: 20, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>보충 수업 신청 내역</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {myRequests.map(req => {
              const sc = STATUS_COLOR[req.status];
              return (
                <div key={req.id} style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{req.makeupDate} {req.makeupTime}</div>
                    {req.reason && <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{req.reason}</div>}
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{req.week}</div>
                  </div>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.color, whiteSpace: 'nowrap' }}>
                    {STATUS_ICON[req.status]} {STATUS_LABEL[req.status]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 신청 모달 */}
      {showForm && (
        <div className="modal-backdrop">
          <div className="modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>보충 수업 신청</h3>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={22} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>희망 날짜</label>
                <input type="date" value={makeupDate} onChange={e => setMakeupDate(e.target.value)} min={localDateStr()} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>희망 시간</label>
                <input type="time" value={makeupTime} onChange={e => setMakeupTime(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>사유 (선택)</label>
                <input value={reason} onChange={e => setReason(e.target.value)} placeholder="예) 병원 방문으로 인한 결석" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowForm(false)}>취소</button>
              <button
                className="btn btn-primary"
                style={{ flex: 1, opacity: makeupDate && makeupTime ? 1 : 0.5 }}
                onClick={submitRequest}
                disabled={!makeupDate || !makeupTime}
              >신청하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
