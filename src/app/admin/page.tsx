'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Users, DollarSign, BookOpen, ClipboardCheck, Calendar, TrendingUp, Clock } from 'lucide-react';
import WeekSelector from '@/components/WeekSelector';

function StatCard({ title, value, sub, icon: Icon, color }: { title: string; value: string | number; sub: string; icon: React.ElementType; color: string }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: 16 }}>
      <div style={{ background: color + '20', borderRadius: 10, padding: 10, flexShrink: 0 }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>{value}</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{title}</div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 1 }}>{sub}</div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { state, dispatch } = useStore();
  const [week, setWeek] = useState(state.currentWeek);

  const handleWeekChange = (w: string) => {
    setWeek(w);
    dispatch({ type: 'SET_WEEK', payload: w });
  };

  const todayStr = new Date().toISOString().slice(0, 10);
  const weekHW = state.dayHomeworks.filter(h => h.week === week);
  const weekTests = state.testRecords.filter(t => t.week === week);
  const todayAtt = state.attendanceRecords.filter(a => a.date === todayStr);

  const pendingHW = weekHW.filter(h => h.status === 'pending').length;
  const pendingTests = weekTests.filter(t => t.status === 'pending').length;
  const totalDollars = state.students.reduce((s, x) => s + x.dollars, 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>대시보드</h1>
          <p style={{ color: '#64748b', marginTop: 2, fontSize: 13 }}>
            {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
          </p>
        </div>
        <WeekSelector week={week} onChange={handleWeekChange} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
        <StatCard title="전체 학생" value={state.students.length} sub="등록된 학생 수" icon={Users} color="#3b82f6" />
        <StatCard title="오늘 출석" value={todayAtt.length} sub={`/ ${state.students.length}명`} icon={Calendar} color="#22c55e" />
        <StatCard title="승인 대기" value={pendingHW + pendingTests} sub={`숙제 ${pendingHW} / 시험 ${pendingTests}`} icon={Clock} color="#f59e0b" />
        <StatCard title="총 달러" value={`$${totalDollars}`} sub="전체 지급 누계" icon={DollarSign} color="#8b5cf6" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* 이번 주 숙제 요약 */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <BookOpen size={16} color="#3b82f6" /> 이번 주 숙제
            </h3>
            <a href="/admin/homework" style={{ fontSize: 12, color: '#6366f1', textDecoration: 'none' }}>전체 →</a>
          </div>
          {state.students.map(s => {
            const dayCount = weekHW.filter(h => h.studentId === s.id).length;
            const approvedCount = weekHW.filter(h => h.studentId === s.id && h.status === 'approved').length;
            const pendingCount = weekHW.filter(h => h.studentId === s.id && h.status === 'pending').length;
            return (
              <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</span>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {approvedCount > 0 && <span className="badge badge-approved" style={{ fontSize: 11 }}>승인 {approvedCount}</span>}
                  {pendingCount > 0 && <span className="badge badge-pending" style={{ fontSize: 11 }}>대기 {pendingCount}</span>}
                  {dayCount === 0 && <span style={{ fontSize: 12, color: '#cbd5e1' }}>미제출</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* 오늘 출석 현황 */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={16} color="#22c55e" /> 오늘 출석
            </h3>
            <a href="/admin/attendance" style={{ fontSize: 12, color: '#6366f1', textDecoration: 'none' }}>전체 →</a>
          </div>
          {state.students.map(s => {
            const rec = todayAtt.find(a => a.studentId === s.id);
            return (
              <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#1e40af' }}>{s.name[0]}</div>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</span>
                </div>
                {rec ? <span className={`badge badge-${rec.status}`}>{rec.status === 'present' ? `출석 ${rec.checkInTime}` : `지각 ${rec.checkInTime}`}</span>
                  : <span className="badge" style={{ background: '#f1f5f9', color: '#94a3b8' }}>미체크</span>}
              </div>
            );
          })}
        </div>

        {/* 달러 현황 */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <TrendingUp size={16} color="#8b5cf6" /> 달러 현황
            </h3>
            <a href="/admin/dollars" style={{ fontSize: 12, color: '#6366f1', textDecoration: 'none' }}>지급 →</a>
          </div>
          {[...state.students].sort((a, b) => b.dollars - a.dollars).map((s, i) => (
            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#cbd5e1', fontSize: 12, width: 16 }}>#{i + 1}</span>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</span>
              </div>
              <span style={{ fontWeight: 800, color: '#7c3aed', fontSize: 15 }}>${s.dollars}</span>
            </div>
          ))}
        </div>

        {/* 이번 주 시험 */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <ClipboardCheck size={16} color="#f59e0b" /> 시험 현황
            </h3>
            <a href="/admin/tests" style={{ fontSize: 12, color: '#6366f1', textDecoration: 'none' }}>전체 →</a>
          </div>
          {weekTests.length === 0 ? (
            <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: 20 }}>이번 주 시험 없음</div>
          ) : weekTests.map(t => (
            <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{t.studentName}</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: 15, color: t.score !== null ? (t.score >= 80 ? '#16a34a' : '#d97706') : '#94a3b8' }}>
                  {t.score !== null ? `${t.score}점` : '-'}
                </span>
                <span className={`badge badge-${t.status}`} style={{ fontSize: 10 }}>{t.status === 'confirmed' ? '확정' : '대기'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
