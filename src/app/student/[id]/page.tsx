'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { getWeekKey, localDateStr } from '@/lib/utils';
import { BookOpen, ClipboardCheck, Calendar, CheckCircle, XCircle, Clock, TrendingUp, Award, AlertCircle } from 'lucide-react';

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

  // 일일 체크리스트 로직
  const dayMap: { [key: string]: number } = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 0 };
  const scheduledDays = student.scheduleDays || [];

  const getDayTasks = () => {
    const tasks: Array<{ date: string; day: string; dayName: string; items: Array<{ type: string; label: string; done: boolean; status: string }> }> = [];
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());

    scheduledDays.forEach((scheduledDay: string) => {
      const dayNum = dayMap[scheduledDay] || 0;
      const taskDate = new Date(weekStart);
      taskDate.setDate(weekStart.getDate() + dayNum);
      const dateStr = taskDate.toISOString().split('T')[0];

      // 같은 요일의 출석 기록 조회 (오늘 체크인했는지)
      const att = state.attendanceRecords.find(a => a.studentId === id && a.date === dateStr);

      // 같은 주, 같은 요일의 숙제 조회
      const hw = state.dayHomeworks.find(h =>
        h.studentId === id &&
        h.week === week &&
        h.day === (scheduledDay as any)
      );

      // 같은 날짜의 시험 점수 조회
      const test = state.testRecords.find(t => t.studentId === id && t.date === dateStr);

      const dayName = ['일', '월', '화', '수', '목', '금', '토'][taskDate.getDay()];

      const items = [
        { type: 'attendance', label: '출석 체크', done: !!att, status: att ? `✅ ${att.checkInTime}` : '❌ 미체크' },
        ...(hw ? [{ type: 'homework', label: '숙제 제출', done: hw.status === 'approved', status: hw.status === 'approved' ? '✅ 승인됨' : hw.status === 'pending' ? '⏳ 대기중' : '❌ 미제출' }] : []),
        ...(test ? [{ type: 'test', label: '시험 점수', done: test.status === 'confirmed', status: test.status === 'confirmed' ? `✅ ${test.score}점` : '⏳ 대기중' }] : []),
      ];

      tasks.push({ date: dateStr, day: scheduledDay, dayName, items });
    });

    return tasks;
  };

  const dayTasks = getDayTasks();

  const attDays = weekAttendance.filter(a => a.status !== 'absent').length;
  const approvedHW = weekHomework.filter(h => h.status === 'approved').length;
  const pendingHW = weekHomework.filter(h => h.status === 'pending').length;
  const lastTest = weekTests[weekTests.length - 1];

  const weeklyDollars = state.dollarConditions
    .filter(c => c.enabled)
    .reduce((total, c) => {
      const met = c.type === 'attendance' ? attDays >= 2
        : c.type === 'homework' ? approvedHW > 0
        : c.type === 'test' ? lastTest?.status === 'confirmed'
        : c.type === 'attitude';
      return total + (met ? c.amount : 0);
    }, 0);

  const maxDollars = state.dollarConditions.filter(c => c.enabled).reduce((s, c) => s + c.amount, 0);
  const gradeColor = (pct: number) => pct >= 80 ? '#16a34a' : pct >= 60 ? '#d97706' : '#dc2626';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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

      {/* 일일 체크리스트 */}
      {dayTasks.length > 0 && (
        <div style={{ background: 'white', borderRadius: 20, padding: 18, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={18} color="#6366f1" />
            수업별 할 일
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {dayTasks.map((dayTask) => {
              const hasIncomplete = dayTask.items.some(item => !item.done);
              return (
                <div key={dayTask.date} style={{ background: hasIncomplete ? '#fef2f2' : '#f0fdf4', border: `2px solid ${hasIncomplete ? '#fecaca' : '#bbf7d0'}`, borderRadius: 14, padding: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: hasIncomplete ? '#dc2626' : '#15803d' }}>
                      {dayTask.dayName}요일 {dayTask.date}
                    </div>
                    {hasIncomplete && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: '#fee2e2', borderRadius: 8, fontSize: 11, fontWeight: 700, color: '#dc2626' }}>
                        <AlertCircle size={12} />
                        미완료
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {dayTask.items.map((item) => (
                      <div key={item.type} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: item.done ? '#f0fdf4' : '#fef2f2', borderRadius: 10, border: `1px solid ${item.done ? '#bbf7d0' : '#fecaca'}` }}>
                        {item.done ? (
                          <CheckCircle size={16} color="#16a34a" />
                        ) : (
                          <XCircle size={16} color="#dc2626" />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 12, color: item.done ? '#15803d' : '#991b1b' }}>{item.label}</div>
                          <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>{item.status}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
