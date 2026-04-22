'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useStore } from '@/lib/store';
import { AttendanceRecord } from '@/lib/types';
import { QrCode, CheckCircle, Clock, MapPin, Calendar, ChevronRight, AlertCircle } from 'lucide-react';

export default function StudentAttendancePage() {
  const params = useParams();
  const id = params.id as string;
  const { state, dispatch } = useStore();

  const student = state.students.find(s => s.id === id);
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayRecord = state.attendanceRecords.find(a => a.studentId === id && a.date === todayStr);
  const myAttendance = state.attendanceRecords.filter(a => a.studentId === id);

  const [step, setStep] = useState<'main' | 'scanning' | 'name' | 'done'>(todayRecord ? 'done' : 'main');
  const [name, setName] = useState(student?.name || '');
  const [checkedTime, setCheckedTime] = useState('');

  const startScan = () => {
    setStep('scanning');
    // QR 스캔 시뮬레이션 (실제 구현: jsQR 또는 html5-qrcode 라이브러리 사용)
    setTimeout(() => setStep('name'), 1800);
  };

  const checkIn = () => {
    if (!name.trim()) return alert('이름을 입력해주세요');
    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 5);
    const classStart = '14:00';
    const isLate = timeStr > classStart;

    const record: AttendanceRecord = {
      id: `a${Date.now()}`,
      studentId: id,
      studentName: name,
      classGroup: student?.classGroup || '',
      date: todayStr,
      checkInTime: timeStr,
      status: isLate ? 'late' : 'present',
    };
    dispatch({ type: 'ADD_ATTENDANCE', payload: record });
    setCheckedTime(timeStr);
    setStep('done');
  };

  // 이번 주 출석 통계
  const thisWeekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + i);
    return d.toISOString().slice(0, 10);
  });

  const weeklyAttendance = thisWeekDates.map(date => ({
    date,
    record: myAttendance.find(a => a.date === date),
    isToday: date === todayStr,
    isFuture: date > todayStr,
  }));

  const presentCount = myAttendance.filter(a => a.status !== 'absent').length;
  const lateCount = myAttendance.filter(a => a.status === 'late').length;

  const DAY_KO = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 메인 출석 카드 */}
      <div style={{ background: 'white', borderRadius: 20, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ background: '#dcfce7', borderRadius: 10, padding: 8 }}>
            <QrCode size={20} color="#22c55e" />
          </div>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>출석 체크</h2>
        </div>

        {/* STEP: main */}
        {step === 'main' && (
          <div>
            <div style={{ background: '#f8fafc', borderRadius: 14, padding: 20, textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })}
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a' }}>
                {new Date().toTimeString().slice(0, 5)}
              </div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>수업 시간: 14:00</div>
            </div>

            <div style={{ background: '#fffbeb', borderRadius: 12, padding: 14, marginBottom: 20, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <AlertCircle size={18} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 13, color: '#92400e' }}>
                교실에 있는 QR 코드를 스캔하거나 아래 버튼을 눌러 출석 체크를 해주세요.
              </div>
            </div>

            <button
              onClick={startScan}
              style={{
                width: '100%', padding: '18px', borderRadius: 14, border: 'none',
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                color: 'white', fontWeight: 800, fontSize: 17, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                boxShadow: '0 6px 20px rgba(34,197,94,0.35)',
              }}
            >
              <QrCode size={24} /> QR 코드 스캔하기
            </button>
          </div>
        )}

        {/* STEP: scanning (QR 인식 중) */}
        {step === 'scanning' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ width: 200, height: 200, margin: '0 auto 20px', position: 'relative', background: '#0f172a', borderRadius: 16, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* QR 스캐너 시뮬레이션 UI */}
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(34,197,94,0.05)' }} />
              <div style={{ position: 'absolute', top: 20, left: 20, width: 30, height: 30, borderTop: '3px solid #22c55e', borderLeft: '3px solid #22c55e', borderRadius: '4px 0 0 0' }} />
              <div style={{ position: 'absolute', top: 20, right: 20, width: 30, height: 30, borderTop: '3px solid #22c55e', borderRight: '3px solid #22c55e', borderRadius: '0 4px 0 0' }} />
              <div style={{ position: 'absolute', bottom: 20, left: 20, width: 30, height: 30, borderBottom: '3px solid #22c55e', borderLeft: '3px solid #22c55e', borderRadius: '0 0 0 4px' }} />
              <div style={{ position: 'absolute', bottom: 20, right: 20, width: 30, height: 30, borderBottom: '3px solid #22c55e', borderRight: '3px solid #22c55e', borderRadius: '0 0 4px 0' }} />
              {/* 스캔 라인 애니메이션 */}
              <div style={{
                position: 'absolute', left: 20, right: 20, height: 2,
                background: 'linear-gradient(90deg, transparent, #22c55e, transparent)',
                animation: 'scanLine 1.5s ease-in-out infinite',
              }} />
              <QrCode size={60} color="rgba(255,255,255,0.3)" />
            </div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>QR 코드 인식 중...</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>카메라를 QR 코드에 가까이 대세요</div>
            <style>{`
              @keyframes scanLine {
                0% { top: 40px; }
                50% { top: 160px; }
                100% { top: 40px; }
              }
            `}</style>
          </div>
        )}

        {/* STEP: name 입력 */}
        {step === 'name' && (
          <div>
            <div style={{ background: '#d1fae5', borderRadius: 12, padding: 14, marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
              <CheckCircle size={20} color="#16a34a" />
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#15803d' }}>QR 코드 인식 완료!</div>
                <div style={{ fontSize: 12, color: '#166534' }}>이름을 확인하고 출석 체크를 완료해주세요.</div>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>본인 이름 확인</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="이름 입력"
                style={{ fontSize: 22, fontWeight: 700, textAlign: 'center', borderRadius: 12, padding: '14px' }}
                autoFocus
              />
            </div>

            <div style={{ background: '#f8fafc', borderRadius: 10, padding: 14, marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
              <Clock size={16} color="#64748b" />
              <div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>현재 시간</div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{new Date().toTimeString().slice(0, 5)}</div>
              </div>
              <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: 12 }}>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>수업 시작</div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>14:00</div>
              </div>
              {new Date().toTimeString().slice(0, 5) > '14:00' && (
                <span style={{ marginLeft: 'auto', background: '#fef3c7', color: '#92400e', fontSize: 12, padding: '4px 10px', borderRadius: 20, fontWeight: 600 }}>
                  지각
                </span>
              )}
            </div>

            <button
              onClick={checkIn}
              style={{
                width: '100%', padding: '16px', borderRadius: 12, border: 'none',
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                color: 'white', fontWeight: 800, fontSize: 16, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <CheckCircle size={20} /> 출석 완료!
            </button>
          </div>
        )}

        {/* STEP: done */}
        {step === 'done' && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            {(() => {
              const record = todayRecord || state.attendanceRecords.find(a => a.studentId === id && a.date === todayStr);
              const isLate = record?.status === 'late';
              return (
                <>
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: isLate ? '#fef3c7' : '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    {isLate ? <Clock size={40} color="#d97706" /> : <CheckCircle size={40} color="#16a34a" />}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 6, color: isLate ? '#92400e' : '#15803d' }}>
                    {isLate ? '지각 처리되었어요' : '출석 완료!'}
                  </div>
                  <div style={{ fontSize: 15, color: '#64748b', marginBottom: 4 }}>
                    입실 시간: <strong>{record?.checkInTime || checkedTime}</strong>
                  </div>
                  <div style={{ fontSize: 13, color: '#94a3b8' }}>
                    {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })}
                  </div>
                  {isLate && (
                    <div style={{ marginTop: 14, background: '#fef3c7', borderRadius: 10, padding: '10px 16px', fontSize: 13, color: '#92400e' }}>
                      다음에는 수업 시작 전에 도착해요! 😊
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* 이번 주 출석 캘린더 */}
      <div style={{ background: 'white', borderRadius: 20, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>이번 주 출석</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
          {weeklyAttendance.map(({ date, record, isToday, isFuture }) => {
            const day = new Date(date).getDay();
            const dayNum = new Date(date).getDate();
            const bg = record?.status === 'present' ? '#d1fae5'
              : record?.status === 'late' ? '#fef3c7'
              : record?.status === 'absent' ? '#fee2e2'
              : isFuture ? '#f8fafc' : '#f1f5f9';
            const textColor = record?.status === 'present' ? '#15803d'
              : record?.status === 'late' ? '#92400e'
              : record?.status === 'absent' ? '#991b1b'
              : '#94a3b8';
            return (
              <div key={date} style={{
                textAlign: 'center', borderRadius: 10, padding: '8px 4px',
                background: bg, border: isToday ? '2px solid #6366f1' : '1px solid transparent',
              }}>
                <div style={{ fontSize: 10, color: textColor, marginBottom: 3 }}>{DAY_KO[day]}</div>
                <div style={{ fontSize: 16, fontWeight: isToday ? 800 : 600, color: isToday ? '#6366f1' : textColor }}>{dayNum}</div>
                <div style={{ fontSize: 10, marginTop: 3 }}>
                  {record?.status === 'present' ? '✓' : record?.status === 'late' ? '⚠' : record?.status === 'absent' ? '✗' : isFuture ? '' : '-'}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 14, fontSize: 12, color: '#64748b', justifyContent: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: '#d1fae5', display: 'inline-block' }} />출석</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: '#fef3c7', display: 'inline-block' }} />지각</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: '#fee2e2', display: 'inline-block' }} />결석</span>
        </div>
      </div>

      {/* 전체 출석 통계 */}
      <div style={{ background: 'white', borderRadius: 20, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>누적 출석 현황</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          {[
            { label: '총 출석일', value: presentCount, color: '#22c55e', bg: '#d1fae5' },
            { label: '지각 횟수', value: lateCount, color: '#f59e0b', bg: '#fef3c7' },
            { label: '전체 기록', value: myAttendance.length, color: '#6366f1', bg: '#eff0ff' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} style={{ textAlign: 'center', background: bg, borderRadius: 12, padding: '12px 8px' }}>
              <div style={{ fontSize: 28, fontWeight: 900, color }}>{value}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
