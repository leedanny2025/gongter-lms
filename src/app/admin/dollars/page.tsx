'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { DollarSign, Award, CheckCircle, XCircle } from 'lucide-react';
import WeekSelector from '@/components/WeekSelector';

export default function DollarsPage() {
  const { state, dispatch } = useStore();
  const [week, setWeek] = useState(state.currentWeek);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [manualAmount, setManualAmount] = useState('');

  const getStatus = (studentId: string) => {
    const weekHW = state.dayHomeworks.filter(h => h.studentId === studentId && h.week === week);
    const weekTest = state.testRecords.find(t => t.studentId === studentId && t.week === week);
    const weekAtt = state.attendanceRecords.filter(a => a.studentId === studentId);
    const attDays = weekAtt.filter(a => a.status !== 'absent').length;
    const homeworkDone = weekHW.some(h => h.status === 'approved');
    return {
      attendance: attDays >= 2, homework: homeworkDone,
      test: weekTest?.status === 'confirmed',
      attitude: true, attDays,
    };
  };

  const calcDollars = (studentId: string) => {
    const s = getStatus(studentId);
    return state.dollarConditions.filter(c => c.enabled).reduce((total, c) => {
      const met = c.type === 'attendance' ? s.attendance : c.type === 'homework' ? s.homework : c.type === 'test' ? s.test : c.type === 'attitude' ? s.attitude : false;
      return total + (met ? c.amount : 0);
    }, 0);
  };

  const awardWeekly = (studentId: string) => {
    const amount = calcDollars(studentId);
    if (amount === 0) return alert('지급할 달러가 없습니다');
    dispatch({ type: 'AWARD_DOLLARS', payload: { studentId, amount } });
    alert(`${state.students.find(s => s.id === studentId)?.name}에게 $${amount} 지급 완료!`);
  };

  const awardManual = (studentId: string) => {
    const amount = Number(manualAmount);
    if (!amount || isNaN(amount)) return alert('금액 입력');
    dispatch({ type: 'AWARD_DOLLARS', payload: { studentId, amount } });
    setManualAmount('');
  };

  const awardAll = () => {
    if (!confirm('이번 주 전체 학생에게 달러를 지급하시겠습니까?')) return;
    state.students.forEach(s => {
      const amount = calcDollars(s.id);
      if (amount > 0) dispatch({ type: 'AWARD_DOLLARS', payload: { studentId: s.id, amount } });
    });
    alert('전체 달러 지급 완료!');
  };

  const totalThisWeek = state.students.reduce((sum, s) => sum + calcDollars(s.id), 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>달러 지급</h1>
          <p style={{ color: '#64748b', marginTop: 2, fontSize: 13 }}>주간 조건 달성 확인 후 달러 지급</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <WeekSelector week={week} onChange={setWeek} />
          <button onClick={awardAll} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
            <Award size={16} /> 전체 지급 (${totalThisWeek})
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', marginBottom: 10 }}>이번 주 지급 기준</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {state.dollarConditions.filter(c => c.enabled).map(c => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}>
              <DollarSign size={13} color="#7c3aed" /><span style={{ fontWeight: 600 }}>{c.name}</span>
              <span style={{ fontWeight: 800, color: '#7c3aed' }}>+${c.amount}</span>
            </div>
          ))}
          <div style={{ padding: '6px 14px', background: '#7c3aed', borderRadius: 8, color: 'white', fontWeight: 800, fontSize: 13 }}>
            최대 ${state.dollarConditions.filter(c => c.enabled).reduce((s, c) => s + c.amount, 0)}/주
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
        {state.students.map(student => {
          const status = getStatus(student.id);
          const amount = calcDollars(student.id);
          const isSelected = selectedStudent === student.id;

          return (
            <div key={student.id} className="card" style={{ border: isSelected ? '2px solid #6366f1' : '1px solid #e2e8f0', cursor: 'pointer' }} onClick={() => setSelectedStudent(isSelected ? null : student.id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#1e40af' }}>
                    {student.name[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{student.name}</div>
                    <div style={{ color: '#94a3b8', fontSize: 12 }}>{student.grade} · {student.classGroup}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#7c3aed' }}>${student.dollars}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>보유</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginBottom: 14 }}>
                {state.dollarConditions.filter(c => c.enabled).map(c => {
                  const met = c.type === 'attendance' ? status.attendance : c.type === 'homework' ? status.homework : c.type === 'test' ? status.test : c.type === 'attitude' ? status.attitude : false;
                  return (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 8, background: met ? '#f0fdf4' : '#fef2f2', border: `1px solid ${met ? '#bbf7d0' : '#fecaca'}`, fontSize: 12 }}>
                      {met ? <CheckCircle size={12} color="#16a34a" /> : <XCircle size={12} color="#dc2626" />}
                      <span style={{ color: met ? '#15803d' : '#dc2626', fontWeight: 600 }}>{c.name}</span>
                      <span style={{ marginLeft: 'auto', fontWeight: 800, color: met ? '#16a34a' : '#94a3b8' }}>+${c.amount}</span>
                    </div>
                  );
                })}
              </div>

              <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>이번 주 지급 예정</span>
                <span style={{ fontSize: 18, fontWeight: 900, color: amount > 0 ? '#7c3aed' : '#94a3b8' }}>${amount}</span>
              </div>

              <button onClick={e => { e.stopPropagation(); awardWeekly(student.id); }} disabled={amount === 0}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: 'none', background: amount > 0 ? '#7c3aed' : '#e2e8f0', color: amount > 0 ? 'white' : '#94a3b8', cursor: amount > 0 ? 'pointer' : 'not-allowed', fontWeight: 700, fontSize: 14 }}>
                주간 달러 지급 (${amount})
              </button>

              {isSelected && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e2e8f0' }} onClick={e => e.stopPropagation()}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>수동 지급/차감</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="number" value={manualAmount} onChange={e => setManualAmount(e.target.value)} placeholder="금액 (음수=차감)" style={{ fontSize: 14 }} />
                    <button onClick={() => awardManual(student.id)} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#3b82f6', color: 'white', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap', fontSize: 13 }}>지급</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
