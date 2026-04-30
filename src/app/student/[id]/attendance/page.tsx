'use client';

import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { QrCode, CheckCircle, Clock, AlertCircle, ExternalLink } from 'lucide-react';

const ATTENDANCE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1gvAaaBfba-o2zPv9TM39xTKzmpaldsv2D-bIz7WAdms/edit?usp=sharing';

export default function StudentAttendancePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { state } = useStore();

  const _now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const todayStr = `${_now.getFullYear()}-${pad(_now.getMonth()+1)}-${pad(_now.getDate())}`;
  const todayRecord = state.attendanceRecords.find(a => a.studentId === id && a.date === todayStr);
  const myAttendance = state.attendanceRecords.filter(a => a.studentId === id);

  // 이번 주 출석 통계
  const thisWeekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + i);
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
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
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>오늘 출석</h2>
        </div>

        {todayRecord ? (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            {(() => {
              const isLate = todayRecord.status === 'late';
              return (
                <>
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: isLate ? '#fef3c7' : '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    {isLate ? <Clock size={40} color="#d97706" /> : <CheckCircle size={40} color="#16a34a" />}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 6, color: isLate ? '#92400e' : '#15803d' }}>
                    {isLate ? '지각 처리되었어요' : '출석 완료!'}
                  </div>
                  <div style={{ fontSize: 15, color: '#64748b', marginBottom: 4 }}>
                    입실 시간: <strong>{todayRecord.checkInTime}</strong>
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
        ) : (
          <div>
            <div style={{ background: '#f8fafc', borderRadius: 14, padding: 20, textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })}
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a' }}>
                {new Date().toTimeString().slice(0, 5)}
              </div>
            </div>

            <div style={{ background: '#fffbeb', borderRadius: 12, padding: 14, marginBottom: 20, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <AlertCircle size={18} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 13, color: '#92400e' }}>
                교실 입구에 있는 QR 코드를 스캔해서 출석 체크를 해주세요.
              </div>
            </div>

            <button
              onClick={() => router.push('/checkin')}
              style={{
                width: '100%', padding: '18px', borderRadius: 14, border: 'none',
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                color: 'white', fontWeight: 800, fontSize: 17, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                boxShadow: '0 6px 20px rgba(34,197,94,0.35)',
              }}
            >
              <QrCode size={24} /> 출석 체크하기
            </button>
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

      {/* 구글 시트 링크 */}
      <a
        href={ATTENDANCE_SHEET_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'flex', alignItems: 'center', gap: 14,
          background: 'white', borderRadius: 20, padding: '18px 20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          border: '1.5px solid #bbf7d0', textDecoration: 'none',
        }}
      >
        <div style={{ width: 44, height: 44, borderRadius: 12, background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 22 }}>
          📊
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#15803d' }}>구글 시트로 출석 확인</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>전체 출석 기록을 구글 시트에서 확인하고 입력할 수 있어요</div>
        </div>
        <ExternalLink size={18} color="#22c55e" />
      </a>
    </div>
  );
}
