'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { getWeekKey, localDateStr } from '@/lib/utils';
import { BookOpen, ClipboardCheck, Calendar, CheckCircle, XCircle, Clock, TrendingUp, Award } from 'lucide-react';

export default function StudentDashboard() {
  const params = useParams();
  const id = params.id as string;
  const { state } = useStore();

  const student = state.students.find(s => s.id === id);
  if (!student) return <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8' }}>학생을 찾을 수 없습니다</div>;

  const week = getWeekKey();
  const todayStr = localDateStr();

  const weekHomework = state.dayHomeworks.filter(h => h.studentId === id && h.week === week);
  const weekTests = state.testRecords.filter(t => t.studentId === id && t.week === week);
  const weekAttendance = state.attendanceRecords.filter(a => a.studentId === id);
  const todayAttendance = state.attendanceRecords.find(a => a.studentId === id && a.date === todayStr);

  const confirmedTests = state.testRecords.filter(t => t.studentId === id && t.status === 'confirmed' && t.score !== null);
  const avgScore = confirmedTests.length > 0
    ? Math.round(confirmedTests.reduce((s, t) => s + (t.score! / t.maxScore) * 100, 0) / confirmedTests.length)
    : null;

  // 오늘 할 일 + 주간 진행 상황
  const dayMap: { [key: string]: number } = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 0 };
  const scheduledDays = student.scheduleDays || [];
  const today = new Date();
  const todayDayNum = today.getDay();

  // 오늘 할 일
  const getTodayTasks = () => {
    const todayScheduled = scheduledDays.find(d => dayMap[d] === todayDayNum);
    if (!todayScheduled) return null;

    const att = state.attendanceRecords.find(a => a.studentId === id && a.date === todayStr);
    const hw = state.dayHomeworks.find(h =>
      h.studentId === id &&
      h.week === week &&
      h.day === (todayScheduled as any)
    );
    const test = state.testRecords.find(t => t.studentId === id && t.date === todayStr);

    return {
      attendance: att,
      homework: hw,
      test: test,
    };
  };

  const todayTasks = getTodayTasks();

  // 주간 진행 상황
  const getWeeklyProgress = () => {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());

    const progress: Array<{ date: string; day: string; dayName: string; attendance: boolean; homework: boolean; test: boolean; scheduled: boolean }> = [];

    scheduledDays.forEach((scheduledDay: string) => {
      const dayNum = dayMap[scheduledDay] || 0;
      const taskDate = new Date(weekStart);
      taskDate.setDate(weekStart.getDate() + dayNum);
      const dateStr = taskDate.toISOString().split('T')[0];

      const att = state.attendanceRecords.find(a => a.studentId === id && a.date === dateStr);
      const hw = state.dayHomeworks.find(h =>
        h.studentId === id &&
        h.week === week &&
        h.day === (scheduledDay as any)
      );
      const test = state.testRecords.find(t => t.studentId === id && t.date === dateStr);

      const dayName = ['일', '월', '화', '수', '목', '금', '토'][taskDate.getDay()];

      progress.push({
        date: dateStr,
        day: scheduledDay,
        dayName,
        attendance: !!att,
        homework: hw ? hw.status === 'approved' : false,
        test: test ? test.status === 'confirmed' : false,
        scheduled: true,
      });
    });

    return progress;
  };

  const weeklyProgress = getWeeklyProgress();

  const attDays = weekAttendance.filter(a => a.status !== 'absent').length;
  const approvedHW = weekHomework.filter(h => h.status === 'approved').length;
  const submittedHW = weekHomework.filter(h => h.status === 'pending' || h.status === 'approved').length;
  const pendingHW = weekHomework.filter(h => h.status === 'pending').length;
  const lastTest = weekTests[weekTests.length - 1];
  const scheduledDaysCount = (student?.scheduleDays || []).length;

  const weeklyDollars = state.dollarConditions
    .filter(c => c.enabled)
    .reduce((total, c) => {
      let dollarAmount = 0;

      if (c.type === 'attendance') {
        // 출석: 수업 일수 중 출석한 날짜만큼 비례 지급
        dollarAmount = scheduledDaysCount > 0 ? Math.round((attDays / scheduledDaysCount) * c.amount) : 0;
      } else if (c.type === 'homework') {
        // 숙제: 기입 + 완료 합산, 수업 일수 만큼만 인정
        const totalSubmitted = Math.min(submittedHW, scheduledDaysCount);
        dollarAmount = scheduledDaysCount > 0 ? Math.round((totalSubmitted / scheduledDaysCount) * c.amount) : 0;
      } else if (c.type === 'test') {
        dollarAmount = lastTest?.status === 'confirmed' ? c.amount : 0;
      } else if (c.type === 'attitude') {
        dollarAmount = 0;
      }

      return total + dollarAmount;
    }, 0);

  const maxDollars = state.dollarConditions.filter(c => c.enabled).reduce((s, c) => s + c.amount, 0);
  const gradeColor = (pct: number) => pct >= 80 ? '#16a34a' : pct >= 60 ? '#d97706' : '#dc2626';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* 오늘 할 일 */}
      {todayTasks && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>오늘 ({new Date().toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })})</div>

          {/* 출석 파트 */}
          <div style={{ background: 'white', borderRadius: 16, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: '#374151' }}>📍 출석</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Link href={`/student/${id}/attendance`} style={{ background: todayTasks.attendance ? '#d1fae5' : '#f1f5f9', borderRadius: 12, padding: 12, textAlign: 'center', border: `1px solid ${todayTasks.attendance ? '#86efac' : '#cbd5e1'}`, textDecoration: 'none', display: 'block', cursor: 'pointer', transition: 'all 0.2s' }}>
                <div style={{ fontSize: 18, marginBottom: 4 }}>🚪</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: todayTasks.attendance ? '#16a34a' : '#64748b' }}>입실</div>
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{todayTasks.attendance ? '완료' : '미완료'}</div>
              </Link>
              <Link href={`/student/${id}/attendance`} style={{ background: '#f1f5f9', borderRadius: 12, padding: 12, textAlign: 'center', border: '1px solid #cbd5e1', textDecoration: 'none', display: 'block', cursor: 'pointer', transition: 'all 0.2s' }}>
                <div style={{ fontSize: 18, marginBottom: 4 }}>🚪</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>퇴실</div>
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>확인 필요</div>
              </Link>
            </div>
          </div>

          {/* 숙제 파트 */}
          <div style={{ background: 'white', borderRadius: 16, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: '#374151' }}>📝 숙제</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Link href={`/student/${id}/homework`} style={{ background: todayTasks.homework ? '#eff0ff' : '#f1f5f9', borderRadius: 12, padding: 12, textAlign: 'center', border: `1px solid ${todayTasks.homework ? '#c7d2fe' : '#cbd5e1'}`, textDecoration: 'none', display: 'block', cursor: 'pointer', transition: 'all 0.2s' }}>
                <div style={{ fontSize: 18, marginBottom: 4 }}>✏️</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: todayTasks.homework ? '#6366f1' : '#64748b' }}>기입</div>
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{todayTasks.homework ? '입력됨' : '미입력'}</div>
              </Link>
              <Link href={`/student/${id}/homework`} style={{ background: todayTasks.homework?.status === 'approved' ? '#d1fae5' : '#f1f5f9', borderRadius: 12, padding: 12, textAlign: 'center', border: `1px solid ${todayTasks.homework?.status === 'approved' ? '#86efac' : '#cbd5e1'}`, textDecoration: 'none', display: 'block', cursor: 'pointer', transition: 'all 0.2s' }}>
                <div style={{ fontSize: 18, marginBottom: 4 }}>✅</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: todayTasks.homework?.status === 'approved' ? '#16a34a' : '#64748b' }}>완료 제출</div>
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{todayTasks.homework?.status === 'approved' ? '완료' : '미제출'}</div>
              </Link>
            </div>
          </div>

          {/* 시험 파트 */}
          <div style={{ background: 'white', borderRadius: 16, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: '#374151' }}>📊 시험 점수</div>
            <Link href={`/student/${id}/tests`} style={{ background: todayTasks.test?.status === 'confirmed' ? '#d1fae5' : '#f1f5f9', borderRadius: 12, padding: 12, textAlign: 'center', border: `1px solid ${todayTasks.test?.status === 'confirmed' ? '#86efac' : '#cbd5e1'}`, textDecoration: 'none', display: 'block', cursor: 'pointer', transition: 'all 0.2s' }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>🎯</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: todayTasks.test?.status === 'confirmed' ? '#16a34a' : '#64748b' }}>점수 입력</div>
              <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{todayTasks.test?.status === 'confirmed' ? `${todayTasks.test.score}/${todayTasks.test.maxScore}` : '미입력'}</div>
            </Link>
          </div>
        </div>
      )}

      {/* 주간 진행 상황 표 */}
      {weeklyProgress.length > 0 && (
        <div style={{ background: 'white', borderRadius: 16, padding: 18, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>주간 진행 상황</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: 700, color: '#64748b' }}>요일</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700, color: '#64748b' }}>📍 출석</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700, color: '#64748b' }}>📝 숙제</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700, color: '#64748b' }}>📊 시험</th>
                </tr>
              </thead>
              <tbody>
                {weeklyProgress.map((day, idx) => {
                  const [year, month, date] = day.date.split('-');
                  const displayDate = `${parseInt(month)}/${parseInt(date)}`;
                  return (
                  <tr key={day.date} style={{ borderBottom: idx < weeklyProgress.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                    <td style={{ padding: '12px 8px', fontWeight: 600, color: '#374151' }}>
                      <div style={{ fontSize: 14 }}>{day.dayName}요일</div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{displayDate}</div>
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                      <span style={{ display: 'inline-block', width: 28, height: 28, borderRadius: 8, background: day.attendance ? '#dcfce7' : '#f1f5f9', color: day.attendance ? '#16a34a' : '#cbd5e1', fontWeight: 700, lineHeight: '28px' }}>
                        {day.attendance ? '✓' : '-'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                      <span style={{ display: 'inline-block', width: 28, height: 28, borderRadius: 8, background: day.homework ? '#dcfce7' : '#f1f5f9', color: day.homework ? '#16a34a' : '#cbd5e1', fontWeight: 700, lineHeight: '28px' }}>
                        {day.homework ? '✓' : '-'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                      <span style={{ display: 'inline-block', width: 28, height: 28, borderRadius: 8, background: day.test ? '#dcfce7' : '#f1f5f9', color: day.test ? '#16a34a' : '#cbd5e1', fontWeight: 700, lineHeight: '28px' }}>
                        {day.test ? '✓' : '-'}
                      </span>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 달러 카드 */}
      <div style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', borderRadius: 20, padding: 22, color: 'white', boxShadow: '0 8px 24px rgba(99,102,241,0.35)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 4 }}>보유 달러</div>
            <div style={{ fontSize: 48, fontWeight: 900, lineHeight: 1 }}>${student.dollars}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 8 }}>이번 주 예상 +${weeklyDollars}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: '10px 12px', textAlign: 'center' }}>
            <Award size={26} color="white" style={{ display: 'block', margin: '0 auto' }} />
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>{student.classGroup}</div>
          </div>
        </div>
        <div style={{ marginTop: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 5 }}>
            <span>이번 주 달러 달성률</span>
            <span>${weeklyDollars} / ${maxDollars}</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 6, height: 8, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${maxDollars > 0 ? (weeklyDollars / maxDollars) * 100 : 0}%`, background: 'white', borderRadius: 6, transition: 'width 0.5s' }} />
          </div>
        </div>
      </div>

      {/* 이번 주 달러 조건 */}
      <div style={{ background: 'white', borderRadius: 20, padding: 18, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700 }}>이번 주 달러 조건</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {state.dollarConditions.filter(c => c.enabled).map(c => {
            const met = c.type === 'attendance' ? attDays >= 2
              : c.type === 'homework' ? approvedHW > 0
              : c.type === 'test' ? lastTest?.status === 'confirmed'
              : c.type === 'attitude';
            const pending = c.type === 'homework' ? pendingHW > 0
              : c.type === 'test' ? lastTest?.status === 'pending' : false;

            return (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: met ? '#f0fdf4' : pending ? '#fffbeb' : '#fef2f2', border: `1px solid ${met ? '#bbf7d0' : pending ? '#fde68a' : '#fecaca'}` }}>
                {met ? <CheckCircle size={18} color="#16a34a" /> : pending ? <Clock size={18} color="#d97706" /> : <XCircle size={18} color="#dc2626" />}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: met ? '#15803d' : pending ? '#92400e' : '#991b1b' }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>
                    {c.type === 'attendance' && `출석 ${attDays}일`}
                    {c.type === 'homework' && (approvedHW > 0 ? `${approvedHW}일 승인 완료` : pendingHW > 0 ? `${pendingHW}일 대기중` : '미제출')}
                    {c.type === 'test' && (lastTest ? (lastTest.status === 'confirmed' ? `${lastTest.score}점 확정` : '확정 대기중') : '미응시')}
                    {c.type === 'attitude' && '교사 평가'}
                  </div>
                </div>
                <span style={{ fontWeight: 800, fontSize: 15, color: met ? '#7c3aed' : '#94a3b8' }}>+${c.amount}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 빠른 액션 4칸 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Link href={`/student/${id}/homework`} style={{ background: 'white', borderRadius: 16, padding: 16, textDecoration: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: pendingHW > 0 ? '2px solid #fbbf24' : '1px solid #e2e8f0' }}>
          <div style={{ background: '#dbeafe', borderRadius: 10, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            <BookOpen size={20} color="#3b82f6" />
          </div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>숙제 제출</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>
            {approvedHW > 0 ? `✅ ${approvedHW}일 완료` : pendingHW > 0 ? `⏳ ${pendingHW}일 대기` : '📝 미제출'}
          </div>
        </Link>

        <Link href={`/student/${id}/tests`} style={{ background: 'white', borderRadius: 16, padding: 16, textDecoration: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: lastTest?.status === 'pending' ? '2px solid #fbbf24' : '1px solid #e2e8f0' }}>
          <div style={{ background: '#fef3c7', borderRadius: 10, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            <ClipboardCheck size={20} color="#f59e0b" />
          </div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>시험 점수</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>
            {lastTest ? (lastTest.status === 'confirmed' ? `✅ ${lastTest.score}점` : '⏳ 대기중') : '📊 미입력'}
          </div>
        </Link>

        <Link href={`/student/${id}/attendance`} style={{ background: 'white', borderRadius: 16, padding: 16, textDecoration: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: todayAttendance ? '2px solid #bbf7d0' : '1px solid #e2e8f0' }}>
          <div style={{ background: '#dcfce7', borderRadius: 10, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            <Calendar size={20} color="#22c55e" />
          </div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>출석 체크</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>
            {todayAttendance ? `✅ ${todayAttendance.checkInTime}` : '📲 오늘 미체크'}
          </div>
        </Link>

        <div style={{ background: 'white', borderRadius: 16, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
          <div style={{ background: '#f3e8ff', borderRadius: 10, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            <TrendingUp size={20} color="#8b5cf6" />
          </div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>평균 점수</div>
          <div style={{ fontSize: 18, fontWeight: 800, marginTop: 3, color: avgScore !== null ? gradeColor(avgScore) : '#94a3b8' }}>
            {avgScore !== null ? `${avgScore}점` : '-'}
          </div>
        </div>
      </div>

      {/* 최근 출석 */}
      <div style={{ background: 'white', borderRadius: 20, padding: 18, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700 }}>최근 출석</h3>
        {weekAttendance.length === 0 ? (
          <div style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center', padding: 16 }}>출석 기록이 없습니다</div>
        ) : (
          [...weekAttendance].reverse().slice(0, 5).map(a => (
            <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: 14, color: '#374151' }}>{a.date}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>{a.checkInTime}</span>
                <span className={`badge badge-${a.status}`} style={{ fontSize: 11 }}>
                  {a.status === 'present' ? '출석' : a.status === 'late' ? '지각' : '결석'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
