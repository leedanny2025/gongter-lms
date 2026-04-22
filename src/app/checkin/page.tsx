'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useStore } from '@/lib/store';
import { GraduationCap, CheckCircle, Clock, Search } from 'lucide-react';

function CheckInContent() {
  const params = useSearchParams();
  const classGroup = params.get('class') || '';
  const { state, dispatch } = useStore();

  const [step, setStep] = useState<'select' | 'confirm' | 'done'>('select');
  const [query, setQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<typeof state.students[0] | null>(null);
  const [now] = useState(new Date());

  const todayStr = now.toISOString().slice(0, 10);
  const timeStr = now.toTimeString().slice(0, 5);
  const isLate = timeStr > '14:00';

  const classStudents = classGroup
    ? state.students.filter(s => s.classGroup === classGroup)
    : state.students;

  const filtered = classStudents.filter(s =>
    !query || s.name.includes(query)
  );

  const alreadyChecked = selectedStudent
    ? state.attendanceRecords.find(a => a.studentId === selectedStudent.id && a.date === todayStr)
    : null;

  const confirmCheckIn = () => {
    if (!selectedStudent || alreadyChecked) return;
    dispatch({
      type: 'ADD_ATTENDANCE',
      payload: {
        id: `a${Date.now()}`,
        studentId: selectedStudent.id,
        studentName: selectedStudent.name,
        classGroup: selectedStudent.classGroup,
        date: todayStr,
        checkInTime: timeStr,
        status: isLate ? 'late' : 'present',
      },
    });
    setStep('done');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '24px 16px' }}>
      {/* 헤더 */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 16, padding: '10px 20px', display: 'inline-flex', alignItems: 'center', gap: 10, backdropFilter: 'blur(8px)' }}>
          <GraduationCap size={22} color="white" />
          <span style={{ color: 'white', fontWeight: 800, fontSize: 18 }}>공터 영어 학원</span>
        </div>
        {classGroup && (
          <div style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 700, fontSize: 16, marginTop: 8 }}>
            {classGroup} 출석 체크
          </div>
        )}
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 4 }}>
          {now.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })} · {timeStr}
          {isLate && <span style={{ marginLeft: 8, background: '#fef3c7', color: '#92400e', padding: '1px 8px', borderRadius: 10, fontSize: 12, fontWeight: 700 }}>지각</span>}
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: 24, width: '100%', maxWidth: 400, overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.15)' }}>
        {/* STEP: 학생 선택 */}
        {step === 'select' && (
          <div style={{ padding: '24px 20px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 800 }}>내 이름을 선택하세요</h3>
            <div style={{ position: 'relative', marginBottom: 14 }}>
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="이름 검색..." style={{ paddingLeft: 36, fontSize: 15 }} autoFocus />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 360, overflowY: 'auto' }}>
              {filtered.map(student => {
                const checked = state.attendanceRecords.find(a => a.studentId === student.id && a.date === todayStr);
                return (
                  <button key={student.id} onClick={() => { setSelectedStudent(student); setStep('confirm'); }}
                    style={{
                      padding: '14px 16px', borderRadius: 14, border: '1px solid',
                      borderColor: checked ? '#bbf7d0' : '#e2e8f0',
                      background: checked ? '#f0fdf4' : 'white',
                      cursor: 'pointer', textAlign: 'left',
                      display: 'flex', alignItems: 'center', gap: 12,
                    }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: checked ? '#d1fae5' : '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: checked ? '#16a34a' : '#1e40af', flexShrink: 0 }}>
                      {student.name[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{student.name}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>{student.grade} · {student.classGroup}</div>
                    </div>
                    {checked && (
                      <span style={{ fontSize: 11, background: '#d1fae5', color: '#15803d', padding: '3px 8px', borderRadius: 8, fontWeight: 700, flexShrink: 0 }}>
                        {checked.status === 'present' ? `✓ ${checked.checkInTime}` : `⚠ 지각`}
                      </span>
                    )}
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: 30, color: '#94a3b8' }}>학생을 찾을 수 없습니다</div>
              )}
            </div>
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

            {alreadyChecked ? (
              <div style={{ background: '#f0fdf4', borderRadius: 14, padding: 16, marginBottom: 20 }}>
                <CheckCircle size={28} color="#16a34a" style={{ display: 'block', margin: '0 auto 8px' }} />
                <div style={{ fontWeight: 700, fontSize: 15, color: '#15803d' }}>이미 출석 체크됨</div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{alreadyChecked.checkInTime} {alreadyChecked.status === 'late' ? '지각' : '출석'}</div>
              </div>
            ) : (
              <div style={{ background: isLate ? '#fffbeb' : '#f0fdf4', borderRadius: 14, padding: 16, marginBottom: 20 }}>
                {isLate ? <Clock size={28} color="#d97706" style={{ display: 'block', margin: '0 auto 8px' }} />
                  : <CheckCircle size={28} color="#16a34a" style={{ display: 'block', margin: '0 auto 8px' }} />}
                <div style={{ fontWeight: 700, fontSize: 15, color: isLate ? '#92400e' : '#15803d' }}>
                  {isLate ? '지각 처리됩니다' : '출석 처리됩니다'}
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, marginTop: 6 }}>{timeStr}</div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep('select')} style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                뒤로
              </button>
              {!alreadyChecked && (
                <button onClick={confirmCheckIn} style={{ flex: 2, padding: '12px', borderRadius: 10, border: 'none', background: isLate ? '#f59e0b' : '#22c55e', color: 'white', cursor: 'pointer', fontWeight: 800, fontSize: 15 }}>
                  출석 완료!
                </button>
              )}
            </div>
          </div>
        )}

        {/* STEP: 완료 */}
        {step === 'done' && selectedStudent && (
          <div style={{ padding: '36px 20px', textAlign: 'center' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: isLate ? '#fef3c7' : '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', animation: 'fadeUp 0.3s ease' }}>
              {isLate ? <Clock size={40} color="#d97706" /> : <CheckCircle size={40} color="#16a34a" />}
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 6 }}>
              {isLate ? '지각 처리 완료' : '출석 완료! 🎉'}
            </div>
            <div style={{ fontSize: 16, color: '#374151', marginBottom: 4 }}>{selectedStudent.name}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: isLate ? '#d97706' : '#16a34a', marginBottom: 24 }}>{timeStr}</div>
            <button onClick={() => { setStep('select'); setSelectedStudent(null); setQuery(''); }}
              style={{ padding: '12px 28px', borderRadius: 10, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 600 }}>
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
