'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { DollarSign, Award, CheckCircle, XCircle, Star, X } from 'lucide-react';
import WeekSelector from '@/components/WeekSelector';

type AwardEntry = { name: string; amount: number };

export default function DollarsPage() {
  const { state, dispatch } = useStore();
  const [week, setWeek] = useState(state.currentWeek);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [manualAmount, setManualAmount] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [awardSummary, setAwardSummary] = useState<AwardEntry[] | null>(null);

  const enabledConditions = state.dollarConditions.filter(c => c.enabled);
  const basicConditions = enabledConditions.filter(c => ['attendance', 'homework', 'test'].includes(c.type));
  const bonusConditions = enabledConditions.filter(c => ['attitude', 'custom'].includes(c.type));

  const getAttitudeScore = (studentId: string) =>
    (state.attitudeRecords || [])
      .filter(r => r.studentId === studentId && r.week === week)
      .reduce((sum, r) => sum + r.shadowing + r.learningAttitude + r.basicAttitude, 0);

  const getStatus = (studentId: string) => {
    const weekHW = state.dayHomeworks.filter(h => h.studentId === studentId && h.week === week);
    const weekTest = state.testRecords.find(t => t.studentId === studentId && t.week === week);
    const weekAtt = state.attendanceRecords.filter(a => a.studentId === studentId);
    const attDays = weekAtt.filter(a => a.status !== 'absent').length;
    const homeworkDone = weekHW.some(h => h.status === 'approved');
    const attitudeScore = getAttitudeScore(studentId);
    const { tier3 } = state.attitudeDollarSettings;
    return {
      attendance: attDays >= 2, homework: homeworkDone,
      test: weekTest?.status === 'confirmed',
      attitude: attitudeScore >= (tier3.minScore || 1), attDays,
    };
  };

  const calcDollars = (studentId: string) => {
    const s = getStatus(studentId);
    return enabledConditions.reduce((total, c) => {
      const met = c.type === 'attendance' ? s.attendance : c.type === 'homework' ? s.homework
        : c.type === 'test' ? s.test : c.type === 'attitude' ? s.attitude : false;
      return total + (met ? c.amount : 0);
    }, 0);
  };

  const conditionMet = (studentId: string, type: string) => {
    const s = getStatus(studentId);
    return type === 'attendance' ? s.attendance : type === 'homework' ? s.homework
      : type === 'test' ? s.test : type === 'attitude' ? s.attitude : false;
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const allSelected = selectedIds.size === state.students.length && state.students.length > 0;
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(state.students.map(s => s.id)));
    }
  };

  const selectedTotal = Array.from(selectedIds).reduce((sum, id) => sum + calcDollars(id), 0);

  const awardWeekly = (studentId: string) => {
    const amount = calcDollars(studentId);
    if (amount === 0) return;
    const student = state.students.find(s => s.id === studentId);
    dispatch({ type: 'AWARD_DOLLARS', payload: { studentId, amount } });
    setAwardSummary([{ name: student?.name || '', amount }]);
  };

  const awardSelected = () => {
    const results: AwardEntry[] = [];
    selectedIds.forEach(id => {
      const amount = calcDollars(id);
      if (amount > 0) {
        const student = state.students.find(s => s.id === id);
        dispatch({ type: 'AWARD_DOLLARS', payload: { studentId: id, amount } });
        results.push({ name: student?.name || '', amount });
      }
    });
    if (results.length === 0) return alert('선택한 학생 중 지급할 달러가 없습니다');
    setSelectedIds(new Set());
    setAwardSummary(results);
  };

  const awardManual = (studentId: string) => {
    const amount = Number(manualAmount);
    if (!amount || isNaN(amount)) return alert('금액 입력');
    dispatch({ type: 'AWARD_DOLLARS', payload: { studentId, amount } });
    setManualAmount('');
  };

  const maxPerWeek = enabledConditions.reduce((s, c) => s + c.amount, 0);
  const maxBasic = basicConditions.reduce((s, c) => s + c.amount, 0);
  const maxBonus = bonusConditions.reduce((s, c) => s + c.amount, 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>달러 지급</h1>
          <p style={{ color: '#64748b', marginTop: 2, fontSize: 13 }}>주간 조건 달성 확인 후 달러 지급</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <WeekSelector week={week} onChange={setWeek} />
          <button
            onClick={toggleSelectAll}
            style={{ padding: '10px 16px', borderRadius: 10, border: `2px solid ${allSelected ? '#6366f1' : '#e2e8f0'}`, background: allSelected ? '#eff0ff' : 'white', color: allSelected ? '#6366f1' : '#374151', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}
          >
            {allSelected ? '전체 해제' : '전체 선택'}
          </button>
          {selectedIds.size > 0 && (
            <button
              onClick={awardSelected}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}
            >
              <Award size={16} /> 선택 지급 ({selectedIds.size}명 · ${selectedTotal})
            </button>
          )}
        </div>
      </div>

      {/* 지급 완료 현황 */}
      {awardSummary && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 14, padding: '14px 18px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#15803d' }}>🎉 달러 지급 완료</div>
            <button onClick={() => setAwardSummary(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
              <X size={18} />
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
            {awardSummary.map((entry, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'white', borderRadius: 10, border: '1px solid #bbf7d0' }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: '#15803d' }}>{entry.name}</span>
                <span style={{ fontWeight: 900, fontSize: 14, color: '#16a34a' }}>+${entry.amount}</span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 13, color: '#16a34a', fontWeight: 700 }}>
            총 ${awardSummary.reduce((s, e) => s + e.amount, 0)} 지급 완료
          </div>
        </div>
      )}

      {/* 이번 주 지급 기준 */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', marginBottom: 10 }}>이번 주 지급 기준</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {basicConditions.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginRight: 2 }}>📋 기본</span>
              {basicConditions.map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: '#f0f9ff', borderRadius: 8, border: '1px solid #bae6fd', fontSize: 12 }}>
                  <DollarSign size={12} color="#0284c7" />
                  <span style={{ fontWeight: 600, color: '#0369a1' }}>{c.name}</span>
                  <span style={{ fontWeight: 800, color: '#0284c7' }}>+${c.amount}</span>
                </div>
              ))}
            </div>
          )}
          {bonusConditions.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', marginRight: 2 }}>⭐ 보너스</span>
              {bonusConditions.map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: '#f5f3ff', borderRadius: 8, border: '1px solid #ddd6fe', fontSize: 12 }}>
                  <Star size={12} color="#7c3aed" />
                  <span style={{ fontWeight: 600, color: '#6d28d9' }}>{c.name}</span>
                  <span style={{ fontWeight: 800, color: '#7c3aed' }}>+${c.amount}</span>
                </div>
              ))}
            </div>
          )}
          <div style={{ padding: '5px 12px', background: '#7c3aed', borderRadius: 8, color: 'white', fontWeight: 800, fontSize: 13, marginLeft: 'auto' }}>
            최대 ${maxPerWeek}/주
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
        {state.students.map(student => {
          const amount = calcDollars(student.id);
          const isExpanded = selectedStudent === student.id;
          const isBatchSelected = selectedIds.has(student.id);
          const basicEarned = basicConditions.reduce((s, c) => s + (conditionMet(student.id, c.type) ? c.amount : 0), 0);
          const bonusEarned = bonusConditions.reduce((s, c) => s + (conditionMet(student.id, c.type) ? c.amount : 0), 0);

          return (
            <div key={student.id} className="card"
              style={{ border: isBatchSelected ? '2px solid #6366f1' : '1px solid #e2e8f0', padding: 0, overflow: 'hidden' }}
            >
              {/* 헤더: 이름 + 보유 달러 + 체크박스 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: isBatchSelected ? 'linear-gradient(135deg, #eff0ff, #e0e7ff)' : 'linear-gradient(135deg, #f5f3ff, #ede9fe)', cursor: 'pointer' }}
                onClick={() => toggleSelect(student.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${isBatchSelected ? '#6366f1' : '#c4b5fd'}`, background: isBatchSelected ? '#6366f1' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {isBatchSelected && <CheckCircle size={13} color="white" fill="white" />}
                  </div>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color: 'white' }}>
                    {student.name[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{student.name}</div>
                    <div style={{ color: '#7c3aed', fontSize: 11, fontWeight: 600 }}>{student.grade} · {student.classGroup}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 26, fontWeight: 900, color: '#7c3aed', lineHeight: 1 }}>${student.dollars}</div>
                  <div style={{ fontSize: 10, color: '#9333ea', fontWeight: 600, marginTop: 2 }}>총 보유</div>
                </div>
              </div>

              <div style={{ padding: '14px 16px' }}>
                {/* 기본 달러 달성 */}
                {basicConditions.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#0369a1', marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
                      <span>📋 주간 기본 달성</span>
                      <span style={{ color: basicEarned > 0 ? '#0369a1' : '#94a3b8' }}>${basicEarned} / ${maxBasic}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                      {basicConditions.map(c => {
                        const met = conditionMet(student.id, c.type);
                        return (
                          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 8, background: met ? '#f0fdf4' : '#fef2f2', border: `1px solid ${met ? '#bbf7d0' : '#fecaca'}`, fontSize: 12 }}>
                            {met ? <CheckCircle size={12} color="#16a34a" /> : <XCircle size={12} color="#dc2626" />}
                            <span style={{ color: met ? '#15803d' : '#dc2626', fontWeight: 600, fontSize: 11, flex: 1 }}>{c.name}</span>
                            <span style={{ fontWeight: 800, color: met ? '#16a34a' : '#94a3b8', fontSize: 12 }}>+${c.amount}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 보너스 달러 달성 */}
                {bonusConditions.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
                      <span>⭐ 보너스 달성</span>
                      <span style={{ color: bonusEarned > 0 ? '#7c3aed' : '#94a3b8' }}>${bonusEarned} / ${maxBonus}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                      {bonusConditions.map(c => {
                        const met = conditionMet(student.id, c.type);
                        return (
                          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 8, background: met ? '#f5f3ff' : '#fef2f2', border: `1px solid ${met ? '#ddd6fe' : '#fecaca'}`, fontSize: 12 }}>
                            {met ? <Star size={12} color="#7c3aed" fill="#7c3aed" /> : <Star size={12} color="#dc2626" />}
                            <span style={{ color: met ? '#7c3aed' : '#dc2626', fontWeight: 600, fontSize: 11, flex: 1 }}>{c.name}</span>
                            <span style={{ fontWeight: 800, color: met ? '#7c3aed' : '#94a3b8', fontSize: 12 }}>+${c.amount}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 이번 주 지급 예정 */}
                <div style={{ background: amount > 0 ? '#f3e8ff' : '#f8fafc', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, border: `1px solid ${amount > 0 ? '#ddd6fe' : '#e2e8f0'}` }}>
                  <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>이번 주 지급 예정</span>
                  <span style={{ fontSize: 20, fontWeight: 900, color: amount > 0 ? '#7c3aed' : '#94a3b8' }}>+${amount}</span>
                </div>

                <button onClick={e => { e.stopPropagation(); awardWeekly(student.id); }} disabled={amount === 0}
                  style={{ width: '100%', padding: '10px', borderRadius: 8, border: 'none', background: amount > 0 ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : '#e2e8f0', color: amount > 0 ? 'white' : '#94a3b8', cursor: amount > 0 ? 'pointer' : 'not-allowed', fontWeight: 700, fontSize: 14 }}>
                  주간 달러 지급 (+${amount})
                </button>

                {/* 수동 지급 토글 */}
                <div style={{ marginTop: 10 }}>
                  <button
                    onClick={e => { e.stopPropagation(); setSelectedStudent(isExpanded ? null : student.id); }}
                    style={{ width: '100%', padding: '7px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: 12, color: '#64748b', fontWeight: 600 }}
                  >
                    수동 지급 / 차감
                  </button>
                  {isExpanded && (
                    <div style={{ marginTop: 8 }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input type="number" value={manualAmount} onChange={e => setManualAmount(e.target.value)} placeholder="금액 (음수=차감)" style={{ fontSize: 14, flex: 1 }} />
                        <button onClick={() => awardManual(student.id)} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#3b82f6', color: 'white', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap', fontSize: 13 }}>지급</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
