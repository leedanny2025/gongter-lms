'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useStore } from '@/lib/store';
import { GraduationCap, CheckCircle, Clock, UserCheck } from 'lucide-react';

function localDateStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function localTimeStr(d: Date) {
  return d.toTimeString().slice(0, 5);
}

function CheckInContent() {
  const { state, dispatch, refresh } = useStore();
  const searchParams = useSearchParams();
  const idParam = searchParams.get('id');

  const [step, setStep] = useState<'enter' | 'pick' | 'confirm' | 'done'>('enter');
  const [nameInput, setNameInput] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<typeof state.students[0] | null>(null);
  const [now, setNow] = useState(new Date());
  const [checkType, setCheckType] = useState<'checkin' | 'checkout'>('checkin');
  const [registeredTime, setRegisteredTime] = useState('');

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!idParam) return;
    if (state.students.length === 0) { refresh(); return; }
    const student = state.students.find(s => s.id === idParam);
    if (student && step === 'enter') {
      setSelectedStudent(student);
      setStep('confirm');
    }
  }, [idParam, state.students]);

  const todayStr = localDateStr(now);
  const timeStr = localTimeStr(now);
  const currentDayKey = ['sun','mon','tue','wed','thu','fri','sat'][now.getDay()];
  const schedTime = selectedStudent
    ? (selectedStudent.scheduleTimes?.[currentDayKey] || selectedStudent.scheduleTime || '')
    : '';
  const isLate = schedTime ? timeStr > schedTime : false;

  const alreadyChecked = selectedStudent
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

  const confirmCheckIn = () => {
    if (!selectedStudent) return;
    const actual = new Date();
    const actualDate = localDateStr(actual);
    const actualTime = localTimeStr(actual);

    if (checkType === 'checkin') {
      if (alreadyChecked) return;
      const actualDayKey = ['sun','mon','tue','wed','thu','fri','sat'][actual.getDay()];
      const actualSchedTime = selectedStudent.scheduleTimes?.[actualDayKey] || selectedStudent.scheduleTime || '';
      const actualLate = actualSchedTime ? actualTime > actualSchedTime : false;
      dispatch({
        type: 'ADD_ATTENDANCE',
        payload: {
          id: `a${Date.now()}`,
          studentId: selectedStudent.id,
          studentName: selectedStudent.name,
          classGroup: selectedStudent.classGroup,
          date: actualDate,
          checkInTime: actualTime,
          status: actualLate ? 'late' : 'present',
        },
      });
    } else {
      // checkout
      if (alreadyChecked) {
        // 입실이 있으면 UPDATE
        dispatch({
          type: 'UPDATE_ATTENDANCE',
          payload: {
            ...alreadyChecked,
            checkOutTime: actualTime,
          },
        });
      } else {
        // 입실이 없으면 새로 ADD (퇴실만)
        dispatch({
          type: 'ADD_ATTENDANCE',
          payload: {
            id: `a${Date.now()}`,
            studentId: selectedStudent.id,
            studentName: selectedStudent.name,
            classGroup: selectedStudent.classGroup,
            date: actualDate,
            checkInTime: '',
            checkOutTime: actualTime,
            status: 'present',
          },
        });
      }
    }
    setRegisteredTime(actualTime);
    setStep('done');
  };

  const reset = () => {
    setStep('enter');
    setNameInput('');
    setSelectedStudent(null);
    setNotFound(false);
    setCheckType('checkin');
    setRegisteredTime('');
  };

  const matches = state.students.filter(s => s.name === nameInput.trim());

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '24px 16px' }}>
      {/* 헤더 */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 16, padding: '10px 20px', display: 'inline-flex', alignItems: 'center', gap: 10, backdropFilter: 'blur(8px)' }}>
          <GraduationCap size={22} color="white" />
          <span style={{ color: 'white', fontWeight: 800, fontSize: 18 }}>공터 영어 학원</span>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 700, fontSize: 16, marginTop: 8 }}>출석 체크</div>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 4 }}>
          {now.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })} · {timeStr}
          {isLate && <span style={{ marginLeft: 8, background: '#fef3c7', color: '#92400e', padding: '1px 8px', borderRadius: 10, fontSize: 12, fontWeight: 700 }}>지각</span>}
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: 24, width: '100%', maxWidth: 400, overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.15)' }}>

        {/* STEP: 이름 기입 */}
        {step === 'enter' && (
          <div style={{ padding: '32px 24px' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <UserCheck size={26} color="#6366f1" />
              </div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>이름을 입력하세요</h3>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: '#94a3b8' }}>본인의 이름을 정확히 입력해 주세요</p>
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
                  style={{ fontSize: 12, color: '#6366f1', background: '#eff0ff', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontWeight: 600 }}
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
                background: nameInput.trim() ? '#6366f1' : '#e2e8f0',
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
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#1e40af', flexShrink: 0 }}>
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
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 900, color: '#1e40af', margin: '0 auto 16px' }}>
              {selectedStudent.name[0]}
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>{selectedStudent.name}</div>
            <div style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>{selectedStudent.grade} · {selectedStudent.classGroup}</div>

            {!alreadyChecked && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 10 }}>유형 선택</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                  <button
                    onClick={() => setCheckType('checkin')}
                    style={{
                      padding: '12px', borderRadius: 10, border: `2px solid ${checkType === 'checkin' ? '#22c55e' : '#e2e8f0'}`,
                      background: checkType === 'checkin' ? '#f0fdf4' : 'white',
                      color: checkType === 'checkin' ? '#15803d' : '#64748b',
                      cursor: 'pointer', fontWeight: 700, fontSize: 14,
                    }}
                  >
                    입실 체크
                  </button>
                  <button
                    onClick={() => setCheckType('checkout')}
                    style={{
                      padding: '12px', borderRadius: 10, border: `2px solid ${checkType === 'checkout' ? '#0ea5e9' : '#e2e8f0'}`,
                      background: checkType === 'checkout' ? '#ecf9ff' : 'white',
                      color: checkType === 'checkout' ? '#0369a1' : '#64748b',
                      cursor: 'pointer', fontWeight: 700, fontSize: 14,
                    }}
                  >
                    퇴실 체크
                  </button>
                </div>
              </div>
            )}

            <div style={{
              background: checkType === 'checkin' ? (isLate ? '#fffbeb' : '#f0fdf4') : '#ecf9ff',
              borderRadius: 14, padding: 16, marginBottom: 20
            }}>
              {checkType === 'checkin' ? (
                <>
                  {isLate
                    ? <Clock size={28} color="#d97706" style={{ display: 'block', margin: '0 auto 8px' }} />
                    : <CheckCircle size={28} color="#16a34a" style={{ display: 'block', margin: '0 auto 8px' }} />}
                  <div style={{ fontWeight: 700, fontSize: 15, color: isLate ? '#92400e' : '#15803d' }}>
                    {alreadyChecked ? '이미 입실됨' : (isLate ? '지각 처리됩니다' : '출석 처리됩니다')}
                  </div>
                </>
              ) : (
                <>
                  <CheckCircle size={28} color="#0369a1" style={{ display: 'block', margin: '0 auto 8px' }} />
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#0369a1' }}>
                    퇴실 처리됩니다
                  </div>
                </>
              )}
              <div style={{ fontSize: 22, fontWeight: 900, marginTop: 6 }}>{timeStr}</div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={reset} style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                뒤로
              </button>
              <button
                onClick={confirmCheckIn}
                style={{
                  flex: 2, padding: '12px', borderRadius: 10, border: 'none',
                  background: checkType === 'checkin' ? (isLate ? '#f59e0b' : '#22c55e') : '#0ea5e9',
                  color: 'white', cursor: 'pointer',
                  fontWeight: 800, fontSize: 15
                }}
              >
                {checkType === 'checkin' ? '입실 완료!' : '퇴실 완료!'}
              </button>
            </div>
          </div>
        )}

        {/* STEP: 완료 */}
        {step === 'done' && selectedStudent && (
          <div style={{ padding: '36px 20px', textAlign: 'center' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: checkType === 'checkin' ? (isLate ? '#fef3c7' : '#d1fae5') : '#dbeafe',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', animation: 'fadeUp 0.3s ease'
            }}>
              {checkType === 'checkin' ? (
                isLate ? <Clock size={40} color="#d97706" /> : <CheckCircle size={40} color="#16a34a" />
              ) : (
                <CheckCircle size={40} color="#0369a1" />
              )}
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 6 }}>
              {checkType === 'checkin'
                ? (isLate ? '지각 처리 완료' : '입실 완료! ✓')
                : '퇴실 완료! ✓'}
            </div>
            <div style={{ fontSize: 16, color: '#374151', marginBottom: 4 }}>{selectedStudent.name}</div>
            <div style={{
              fontSize: 20, fontWeight: 800,
              color: checkType === 'checkin' ? (isLate ? '#d97706' : '#16a34a') : '#0369a1',
              marginBottom: 24
            }}>
              {registeredTime}
            </div>
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

export default function CheckInPage() {
  return (
    <Suspense>
      <CheckInContent />
    </Suspense>
  );
}
