'use client';

import { useState, useEffect, Suspense } from 'react';
import { useStore } from '@/lib/store';
import { GraduationCap, CheckCircle, LogOut, UserCheck } from 'lucide-react';

function localDateStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function localTimeStr(d: Date) {
  return d.toTimeString().slice(0, 5);
}

function CheckOutContent() {
  const { state, dispatch, refresh } = useStore();

  const [step, setStep] = useState<'enter' | 'pick' | 'confirm' | 'done'>('enter');
  const [nameInput, setNameInput] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<typeof state.students[0] | null>(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const todayStr = localDateStr(now);
  const timeStr = localTimeStr(now);

  const todayRecord = selectedStudent
    ? state.attendanceRecords.find(a => a.studentId === selectedStudent.id && a.date === todayStr)
    : null;

  const submitName = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    const matches = state.students.filter(s => s.name === trimmed);
    if (matches.length === 1) {
      setSelectedStudent(matches[0]);
      setStep('confirm');
      setNotFound(false);
    } else if (matches.length > 1) {
      setStep('pick');
      setNotFound(false);
    } else {
      setNotFound(true);
    }
  };

  const confirmCheckOut = () => {
    if (!selectedStudent || !todayRecord) return;
    const actual = new Date();
    const actualTime = localTimeStr(actual);
    dispatch({
      type: 'UPDATE_ATTENDANCE',
      payload: { ...todayRecord, checkOutTime: actualTime },
    });
    setStep('done');
  };

  const reset = () => {
    setStep('enter');
    setNameInput('');
    setSelectedStudent(null);
    setNotFound(false);
  };

  const matches = state.students.filter(s => s.name === nameInput.trim());

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
      padding: '24px 16px',
    }}>
      {/* 헤더 */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 16, padding: '10px 20px', display: 'inline-flex', alignItems: 'center', gap: 10, backdropFilter: 'blur(8px)' }}>
          <GraduationCap size={22} color="white" />
          <span style={{ color: 'white', fontWeight: 800, fontSize: 18 }}>공터 영어 학원</span>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 700, fontSize: 16, marginTop: 8 }}>퇴원 체크</div>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 4 }}>
          {now.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })} · {timeStr}
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: 24, width: '100%', maxWidth: 400, overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.15)' }}>

        {/* STEP: 이름 기입 */}
        {step === 'enter' && (
          <div style={{ padding: '32px 24px' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <LogOut size={26} color="#f59e0b" />
              </div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>이름을 입력하세요</h3>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: '#94a3b8' }}>퇴원할 학생의 이름을 입력해 주세요</p>
            </div>

            <input
              value={nameInput}
              onChange={e => { setNameInput(e.target.value); setNotFound(false); }}
              onKeyDown={e => e.key === 'Enter' && submitName()}
              placeholder="예) 김민준"
              autoFocus
              style={{ fontSize: 20, fontWeight: 700, textAlign: 'center', letterSpacing: 4, marginBottom: 8 }}
            />

            {notFound && (
              <div style={{ textAlign: 'center', marginBottom: 12 }}>
                <p style={{ color: '#ef4444', fontSize: 13, fontWeight: 600, margin: '0 0 8px' }}>
                  등록되지 않은 이름입니다.
                </p>
                <button
                  onClick={async () => { await refresh(); submitName(); }}
                  style={{ fontSize: 12, color: '#f59e0b', background: '#fffbeb', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontWeight: 600 }}
                >
                  🔄 데이터 새로고침 후 재시도
                </button>
              </div>
            )}

            <button
              onClick={submitName}
              disabled={!nameInput.trim()}
              style={{
                width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                background: nameInput.trim() ? '#f59e0b' : '#e2e8f0',
                color: nameInput.trim() ? 'white' : '#94a3b8',
                fontWeight: 800, fontSize: 16, cursor: nameInput.trim() ? 'pointer' : 'default',
                marginTop: 4, transition: 'background 0.15s',
              }}
            >
              확인
            </button>
          </div>
        )}

        {/* STEP: 동명이인 선택 */}
        {step === 'pick' && (
          <div style={{ padding: '24px 20px' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 800 }}>본인을 선택하세요</h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#94a3b8' }}>같은 이름이 여러 명 있습니다</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {matches.map(student => (
                <button key={student.id} onClick={() => { setSelectedStudent(student); setStep('confirm'); }}
                  style={{ padding: '14px 16px', borderRadius: 14, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#d97706', flexShrink: 0 }}>
                    {student.name[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{student.name}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{student.grade} · {student.classGroup}</div>
                  </div>
                </button>
              ))}
            </div>
            <button onClick={reset} style={{ marginTop: 14, width: '100%', padding: '10px', borderRadius: 10, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: 14, color: '#64748b' }}>
              다시 입력
            </button>
          </div>
        )}

        {/* STEP: 확인 */}
        {step === 'confirm' && selectedStudent && (
          <div style={{ padding: '28px 20px', textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 900, color: '#d97706', margin: '0 auto 16px' }}>
              {selectedStudent.name[0]}
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>{selectedStudent.name}</div>
            <div style={{ fontSize: 14, color: '#64748b', marginBottom: 20 }}>{selectedStudent.grade} · {selectedStudent.classGroup}</div>

            {/* 입실 시간 표시 */}
            {todayRecord ? (
              <div style={{ background: '#f8fafc', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>입실</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#22c55e', marginTop: 2 }}>{todayRecord.checkInTime}</div>
                </div>
                <div style={{ width: 1, background: '#e2e8f0' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>퇴실</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#f59e0b', marginTop: 2 }}>{timeStr}</div>
                </div>
              </div>
            ) : (
              <div style={{ background: '#fef2f2', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#991b1b' }}>입실 기록이 없습니다</div>
                <div style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>먼저 입실 체크를 해주세요</div>
              </div>
            )}

            {todayRecord?.checkOutTime && (
              <div style={{ background: '#fef3c7', borderRadius: 12, padding: 14, marginBottom: 16 }}>
                <CheckCircle size={22} color="#d97706" style={{ display: 'block', margin: '0 auto 6px' }} />
                <div style={{ fontWeight: 700, fontSize: 14, color: '#92400e' }}>이미 퇴원 처리됨</div>
                <div style={{ fontSize: 13, color: '#92400e', marginTop: 2 }}>{todayRecord.checkOutTime} 퇴원</div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={reset} style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                뒤로
              </button>
              {todayRecord && !todayRecord.checkOutTime && (
                <button onClick={confirmCheckOut} style={{ flex: 2, padding: '12px', borderRadius: 10, border: 'none', background: '#f59e0b', color: 'white', cursor: 'pointer', fontWeight: 800, fontSize: 15 }}>
                  퇴원 완료!
                </button>
              )}
            </div>
          </div>
        )}

        {/* STEP: 완료 */}
        {step === 'done' && selectedStudent && (
          <div style={{ padding: '36px 20px', textAlign: 'center' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', animation: 'fadeUp 0.3s ease' }}>
              <LogOut size={40} color="#d97706" />
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 6 }}>퇴원 완료! 👋</div>
            <div style={{ fontSize: 16, color: '#374151', marginBottom: 4 }}>{selectedStudent.name}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#d97706', marginBottom: 8 }}>{timeStr}</div>
            {todayRecord && (
              <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 24 }}>
                입실 {todayRecord.checkInTime} → 퇴실 {timeStr}
              </div>
            )}
            <button onClick={reset} style={{ padding: '12px 28px', borderRadius: 10, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 600 }}>
              다음 학생
            </button>
          </div>
        )}
      </div>

      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}

export default function CheckOutPage() {
  return (
    <Suspense>
      <CheckOutContent />
    </Suspense>
  );
}
