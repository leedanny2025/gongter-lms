'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { DollarSign, Award, CheckCircle, XCircle, Star, X, ShoppingCart, Plus, Trash2, Package } from 'lucide-react';
import WeekSelector from '@/components/WeekSelector';
import { ShopItem } from '@/lib/types';
import { getWeekDateRange, localDateStr } from '@/lib/utils';

type AwardEntry = { name: string; amount: number };
type Tab = 'award' | 'shop';
type ViewMode = 'card' | 'table';

export default function DollarsPage() {
  const { state, dispatch } = useStore();
  const [tab, setTab] = useState<Tab>('award');
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  // 지급 탭 state
  const [week, setWeek] = useState(state.currentWeek);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [manualAmount, setManualAmount] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [awardSummary, setAwardSummary] = useState<AwardEntry[] | null>(null);

  // 구매 탭 state
  const [newItemName, setNewItemName] = useState('');
  const [newItemCost, setNewItemCost] = useState('');
  const [purchaseStudentId, setPurchaseStudentId] = useState<string>('');
  const [purchaseItemId, setPurchaseItemId] = useState<string>('');
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const [purchaseSummary, setPurchaseSummary] = useState<{ name: string; item: string; cost: number; quantity: number; total: number } | null>(null);
  const [purchaseMode, setPurchaseMode] = useState<'list' | 'direct'>('list');
  const [directItemName, setDirectItemName] = useState('');
  const [directItemCost, setDirectItemCost] = useState('');
  const [directQuantity, setDirectQuantity] = useState(1);
  const [purchasePage, setPurchasePage] = useState(1);

  const PAGE_SIZE = 10;
  const shopItems: ShopItem[] = state.shopItems || [];
  const purchases = state.purchases || [];
  const sortedPurchases = [...purchases].sort((a, b) => b.purchasedAt.localeCompare(a.purchasedAt));
  const totalPages = Math.max(1, Math.ceil(sortedPurchases.length / PAGE_SIZE));
  const pagedPurchases = sortedPurchases.slice((purchasePage - 1) * PAGE_SIZE, purchasePage * PAGE_SIZE);

  // ── 지급 탭 로직 ──────────────────────────────────────────────
  const enabledConditions = state.dollarConditions.filter(c => c.enabled);
  const basicConditions = enabledConditions.filter(c => ['attendance', 'homework', 'test'].includes(c.type));
  const bonusConditions = enabledConditions.filter(c => ['attitude', 'custom'].includes(c.type));

  const getAttitudeScore = (studentId: string) =>
    (state.attitudeRecords || [])
      .filter(r => r.studentId === studentId && r.week === week)
      .reduce((sum, r) => sum + r.shadowing + r.learningAttitude + r.basicAttitude, 0);

  const getWeekDates = () => {
    const { start } = getWeekDateRange(week);
    return Array.from({ length: 5 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return localDateStr(d);
    });
  };

  const getStatus = (studentId: string) => {
    const weekDates = getWeekDates();
    const weekHW = state.dayHomeworks.filter(h => h.studentId === studentId && h.week === week);
    const weekTest = state.testRecords.find(t => t.studentId === studentId && t.week === week);
    const weekAtt = state.attendanceRecords.filter(a => a.studentId === studentId && weekDates.includes(a.date));
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
    let total = 0;
    basicConditions.forEach(c => {
      const { attendanceCount, homeworkCount, testCount, total: maxDays } = getAchievementCounts(studentId);
      let rate = 0;
      if (c.type === 'attendance') rate = attendanceCount / maxDays;
      else if (c.type === 'homework') rate = homeworkCount / maxDays;
      else if (c.type === 'test') rate = testCount / maxDays;
      const earnedAmount = Math.round(c.amount * rate);
      total += earnedAmount;
    });
    bonusConditions.forEach(c => {
      total += conditionMet(studentId, c.type) ? c.amount : 0;
    });
    return total;
  };

  const getStudentScheduledDays = (studentId: string) => {
    const student = state.students.find(s => s.id === studentId);
    return student?.scheduleDays?.length || 5;
  };

  const getAchievementCounts = (studentId: string) => {
    const weekDates = getWeekDates();
    const total = getStudentScheduledDays(studentId);
    const attendanceCount = state.attendanceRecords.filter(a => a.studentId === studentId && weekDates.includes(a.date) && a.status !== 'absent').length;
    // 이번 주의 모든 숙제 중 완료/승인된 것 카운트
    const homeworkCount = state.dayHomeworks.filter(h => h.studentId === studentId && h.week === week && (h.status === 'confirmed' || h.status === 'approved')).length;
    const testCount = state.testRecords.filter(t => t.studentId === studentId && t.week === week && t.status === 'confirmed').length;
    return { attendanceCount, homeworkCount, testCount, total };
  };

  const conditionMet = (studentId: string, type: string) => {
    const s = getStatus(studentId);
    return type === 'attendance' ? s.attendance : type === 'homework' ? s.homework
      : type === 'test' ? s.test : type === 'attitude' ? s.attitude : false;
  };

  const isStudentAwarded = (studentId: string) => {
    return (state.awardRecords || []).some(a => a.studentId === studentId && a.week === week);
  };

  const getMonthlyDollars = (studentId: string) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // 달러 지급 합계
    const awardedAmount = (state.awardRecords || [])
      .filter(a => {
        if (a.studentId !== studentId) return false;
        const awardDate = new Date(a.awardedAt);
        return awardDate.getMonth() === currentMonth && awardDate.getFullYear() === currentYear;
      })
      .reduce((sum, a) => sum + a.amount, 0);

    // 달러 구매 차감
    const purchasedAmount = (state.purchases || [])
      .filter(p => {
        if (p.studentId !== studentId) return false;
        const purchaseDate = new Date(p.purchasedAt);
        return purchaseDate.getMonth() === currentMonth && purchaseDate.getFullYear() === currentYear;
      })
      .reduce((sum, p) => sum + p.cost, 0);

    return awardedAmount - purchasedAmount;
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
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(state.students.map(s => s.id)));
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
    const skipped: string[] = [];
    selectedIds.forEach(id => {
      if (isStudentAwarded(id)) {
        const student = state.students.find(s => s.id === id);
        skipped.push(student?.name || '');
        return;
      }
      const amount = calcDollars(id);
      if (amount > 0) {
        const student = state.students.find(s => s.id === id);
        dispatch({ type: 'AWARD_DOLLARS', payload: { studentId: id, amount } });
        results.push({ name: student?.name || '', amount });
      }
    });
    if (results.length === 0) return alert(`선택한 학생 중 지급할 달러가 없습니다${skipped.length > 0 ? `\n(이미 지급됨: ${skipped.join(', ')})` : ''}`);
    if (skipped.length > 0) alert(`${skipped.join(', ')}은(는) 이미 지급되어 건너뜁니다`);
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

  // ── 구매 탭 로직 ──────────────────────────────────────────────
  const addShopItem = () => {
    const name = newItemName.trim();
    const cost = Number(newItemCost);
    if (!name) return alert('상품명 입력');
    if (!cost || cost <= 0) return alert('가격 입력');
    dispatch({ type: 'ADD_SHOP_ITEM', payload: { id: Date.now().toString(), name, cost } });
    setNewItemName('');
    setNewItemCost('');
  };

  const deleteShopItem = (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return;
    dispatch({ type: 'DELETE_SHOP_ITEM', payload: id });
  };

  const processPurchase = () => {
    if (!purchaseStudentId) return alert('학생 선택');
    if (!purchaseItemId) return alert('상품 선택');
    if (purchaseQuantity < 1) return alert('수량은 1개 이상이어야 합니다');
    const student = state.students.find(s => s.id === purchaseStudentId);
    const item = shopItems.find(i => i.id === purchaseItemId);
    if (!student || !item) return;
    const totalCost = item.cost * purchaseQuantity;
    if (student.dollars < totalCost) return alert(`달러가 부족합니다 (보유: $${student.dollars}, 필요: $${totalCost})`);
    dispatch({
      type: 'ADD_PURCHASE',
      payload: {
        id: Date.now().toString(),
        studentId: student.id,
        studentName: student.name,
        itemId: item.id,
        itemName: item.name,
        cost: totalCost,
        purchasedAt: new Date().toISOString(),
      },
    });
    setPurchaseSummary({ name: student.name, item: item.name, cost: totalCost, quantity: purchaseQuantity, total: totalCost });
    setPurchaseStudentId('');
    setPurchaseItemId('');
    setPurchaseQuantity(1);
  };

  const processDirectPurchase = () => {
    if (!purchaseStudentId) return alert('학생 선택');
    const name = directItemName.trim();
    const cost = Number(directItemCost);
    if (!name) return alert('상품명 입력');
    if (!cost || cost <= 0) return alert('가격 입력');
    if (directQuantity < 1) return alert('수량은 1개 이상이어야 합니다');
    const student = state.students.find(s => s.id === purchaseStudentId);
    if (!student) return;
    const totalCost = cost * directQuantity;
    if (student.dollars < totalCost) return alert(`달러가 부족합니다 (보유: $${student.dollars}, 필요: $${totalCost})`);
    dispatch({
      type: 'ADD_PURCHASE',
      payload: {
        id: Date.now().toString(),
        studentId: student.id,
        studentName: student.name,
        itemId: 'direct',
        itemName: name,
        cost: totalCost,
        purchasedAt: new Date().toISOString(),
      },
    });
    setPurchaseSummary({ name: student.name, item: name, cost: totalCost, quantity: directQuantity, total: totalCost });
    setDirectItemName('');
    setDirectItemCost('');
    setDirectQuantity(1);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>달러 관리</h1>
          <p style={{ color: '#64748b', marginTop: 2, fontSize: 13 }}>달러 지급 및 구매 처리</p>
        </div>
        {/* 탭 */}
        <div style={{ display: 'flex', gap: 0, background: '#f1f5f9', borderRadius: 10, padding: 4 }}>
          <button
            onClick={() => setTab('award')}
            style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: tab === 'award' ? 'white' : 'transparent', color: tab === 'award' ? '#7c3aed' : '#64748b', fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: tab === 'award' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Award size={15} /> 달러 지급
          </button>
          <button
            onClick={() => setTab('shop')}
            style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: tab === 'shop' ? 'white' : 'transparent', color: tab === 'shop' ? '#0284c7' : '#64748b', fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: tab === 'shop' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <ShoppingCart size={15} /> 달러 구매
          </button>
        </div>
      </div>

      {/* ── 달러 지급 탭 ── */}
      {tab === 'award' && (
        <>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
            <WeekSelector week={week} onChange={setWeek} />
            <div style={{ display: 'flex', gap: 0, background: '#f1f5f9', borderRadius: 8, padding: 3 }}>
              <button
                onClick={() => setViewMode('table')}
                style={{ padding: '7px 14px', borderRadius: 6, border: 'none', background: viewMode === 'table' ? 'white' : 'transparent', color: viewMode === 'table' ? '#6366f1' : '#64748b', fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}
              >
                표 보기
              </button>
              <button
                onClick={() => setViewMode('card')}
                style={{ padding: '7px 14px', borderRadius: 6, border: 'none', background: viewMode === 'card' ? 'white' : 'transparent', color: viewMode === 'card' ? '#6366f1' : '#64748b', fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: viewMode === 'card' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}
              >
                카드 보기
              </button>
            </div>
            {viewMode === 'card' && (
              <button
                onClick={toggleSelectAll}
                style={{ padding: '10px 16px', borderRadius: 10, border: `2px solid ${allSelected ? '#6366f1' : '#e2e8f0'}`, background: allSelected ? '#eff0ff' : 'white', color: allSelected ? '#6366f1' : '#374151', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}
              >
                {allSelected ? '전체 해제' : '전체 선택'}
              </button>
            )}
            {selectedIds.size > 0 && (
              <button
                onClick={awardSelected}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}
              >
                <Award size={16} /> 선택 지급 ({selectedIds.size}명 · ${selectedTotal})
              </button>
            )}
          </div>

          {awardSummary && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 14, padding: '14px 18px', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#15803d' }}>🎉 달러 지급 완료</div>
                <button onClick={() => setAwardSummary(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}><X size={18} /></button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                {awardSummary.map((entry, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'white', borderRadius: 10, border: '1px solid #bbf7d0' }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: '#15803d' }}>{entry.name}</span>
                    <span style={{ fontWeight: 900, fontSize: 14, color: '#16a34a' }}>+${entry.amount}</span>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 13, color: '#16a34a', fontWeight: 700 }}>총 ${awardSummary.reduce((s, e) => s + e.amount, 0)} 지급 완료</div>
            </div>
          )}

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

          {viewMode === 'table' && (
            <div className="card" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'], touchAction: 'pan-x', minHeight: 'auto', display: 'block', width: '100%' }}>
              <table style={{ width: 'auto', minWidth: '100%', borderCollapse: 'collapse', fontSize: 14, touchAction: 'auto', tableLayout: 'auto' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#374151', fontSize: 13 }}>학생명</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700, color: '#0369a1', fontSize: 13 }}>출석</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700, color: '#0369a1', fontSize: 13 }}>숙제</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700, color: '#0369a1', fontSize: 13 }}>시험</th>
                    {bonusConditions.length > 0 && (
                      <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700, color: '#7c3aed', fontSize: 13 }}>⭐ 보너스</th>
                    )}
                    <th style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: '#16a34a', fontSize: 13 }}>이번 주</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: '#059669', fontSize: 13 }}>월별 누적</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: '#7c3aed', fontSize: 13 }}>총 보유</th>
                  </tr>
                </thead>
                <tbody>
                  {state.students.map((student, idx) => {
                    const amount = calcDollars(student.id);
                    const { attendanceCount, homeworkCount, testCount, total } = getAchievementCounts(student.id);
                    const bonusEarned = bonusConditions.reduce((s, c) => s + (conditionMet(student.id, c.type) ? c.amount : 0), 0);
                    const bonusMet = bonusConditions.filter(c => conditionMet(student.id, c.type)).length;

                    return (
                      <tr key={student.id} style={{ borderBottom: idx < state.students.length - 1 ? '1px solid #e2e8f0' : 'none', background: idx % 2 === 0 ? '#f8fafc' : 'white' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 600, color: '#374151' }}>{student.name}</td>
                        <td style={{ padding: '12px 14px', textAlign: 'center', fontSize: 12, color: '#64748b' }}>
                          <span style={{ fontWeight: 700, color: attendanceCount > 0 ? '#0369a1' : '#94a3b8' }}>
                            {attendanceCount}/{total}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center', fontSize: 12, color: '#64748b' }}>
                          <span style={{ fontWeight: 700, color: homeworkCount > 0 ? '#0369a1' : '#94a3b8' }}>
                            {homeworkCount}/{total}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center', fontSize: 12, color: '#64748b' }}>
                          <span style={{ fontWeight: 700, color: testCount > 0 ? '#0369a1' : '#94a3b8' }}>
                            {testCount}/{total}
                          </span>
                        </td>
                        {bonusConditions.length > 0 && (
                          <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                            <span style={{ fontWeight: 700, color: bonusEarned > 0 ? '#7c3aed' : '#94a3b8' }}>
                              {bonusMet}/{bonusConditions.length}
                            </span>
                          </td>
                        )}
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <span style={{ fontWeight: 800, color: amount > 0 ? '#16a34a' : '#94a3b8', fontSize: 15 }}>
                            +${amount}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <span style={{ fontWeight: 800, color: '#059669', fontSize: 15 }}>
                            ${getMonthlyDollars(student.id)}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <span style={{ fontWeight: 800, color: '#7c3aed', fontSize: 15 }}>
                            ${student.dollars}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {viewMode === 'card' && (
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

                    <div style={{ background: amount > 0 ? '#f3e8ff' : '#f8fafc', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, border: `1px solid ${amount > 0 ? '#ddd6fe' : '#e2e8f0'}` }}>
                      <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>이번 주 지급 예정</span>
                      <span style={{ fontSize: 20, fontWeight: 900, color: amount > 0 ? '#7c3aed' : '#94a3b8' }}>+${amount}</span>
                    </div>

                    <button onClick={e => { e.stopPropagation(); awardWeekly(student.id); }} disabled={amount === 0 || isStudentAwarded(student.id)}
                      style={{ width: '100%', padding: '10px', borderRadius: 8, border: 'none', background: isStudentAwarded(student.id) ? '#d1d5db' : (amount > 0 ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : '#e2e8f0'), color: (amount > 0 && !isStudentAwarded(student.id)) ? 'white' : '#94a3b8', cursor: (amount > 0 && !isStudentAwarded(student.id)) ? 'pointer' : 'not-allowed', fontWeight: 700, fontSize: 14 }}>
                      {isStudentAwarded(student.id) ? '✅ 이미 지급됨' : `주간 달러 지급 (+$${amount})`}
                    </button>

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
          )}
        </>
      )}

      {/* ── 달러 구매 탭 ── */}
      {tab === 'shop' && (
        <div className="shop-layout">

          {/* 좌측: 상품 관리 + 구매 처리 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* 상품 등록 */}
            <div className="card">
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0369a1', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Package size={15} /> 상품 관리
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                <input
                  value={newItemName}
                  onChange={e => setNewItemName(e.target.value)}
                  placeholder="상품명"
                  style={{ fontSize: 14, padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}
                  onKeyDown={e => e.key === 'Enter' && addShopItem()}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="number"
                    value={newItemCost}
                    onChange={e => setNewItemCost(e.target.value)}
                    placeholder="달러 가격"
                    style={{ fontSize: 14, padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', flex: 1 }}
                    onKeyDown={e => e.key === 'Enter' && addShopItem()}
                  />
                  <button
                    onClick={addShopItem}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 14px', borderRadius: 8, border: 'none', background: '#0284c7', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap' }}
                  >
                    <Plus size={14} /> 추가
                  </button>
                </div>
              </div>
              {shopItems.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: '16px 0' }}>등록된 상품이 없습니다</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {shopItems.map(item => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f0f9ff', borderRadius: 8, border: '1px solid #bae6fd' }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: '#0369a1' }}>{item.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 800, fontSize: 14, color: '#0284c7' }}>${item.cost}</span>
                        <button onClick={() => deleteShopItem(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', display: 'flex', alignItems: 'center', padding: 0 }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 구매 처리 */}
            <div className="card">
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0369a1', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <ShoppingCart size={15} /> 구매 처리
              </div>

              {/* 학생 선택 */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6 }}>학생 선택</div>
                <select
                  value={purchaseStudentId}
                  onChange={e => { setPurchaseStudentId(e.target.value); setPurchaseSummary(null); }}
                  style={{ width: '100%', fontSize: 14, padding: '8px 12px', borderRadius: 8, border: `1px solid ${purchaseStudentId ? '#0284c7' : '#e2e8f0'}`, background: 'white' }}
                >
                  <option value="">학생을 선택하세요</option>
                  {state.students.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* 구매 방식 탭 */}
              <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 8, padding: 3, marginBottom: 12 }}>
                <button
                  onClick={() => { setPurchaseMode('list'); setPurchaseItemId(''); }}
                  style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: 'none', background: purchaseMode === 'list' ? 'white' : 'transparent', color: purchaseMode === 'list' ? '#0284c7' : '#64748b', fontWeight: 700, fontSize: 12, cursor: 'pointer', boxShadow: purchaseMode === 'list' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}
                >
                  상품 목록
                </button>
                <button
                  onClick={() => { setPurchaseMode('direct'); setPurchaseItemId(''); }}
                  style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: 'none', background: purchaseMode === 'direct' ? 'white' : 'transparent', color: purchaseMode === 'direct' ? '#0284c7' : '#64748b', fontWeight: 700, fontSize: 12, cursor: 'pointer', boxShadow: purchaseMode === 'direct' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}
                >
                  직접 입력
                </button>
              </div>

              {/* 상품 목록 방식 */}
              {purchaseMode === 'list' && (
                <div style={{ marginBottom: 12 }}>
                  {shopItems.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12, padding: '12px 0' }}>등록된 상품이 없습니다</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {shopItems.map(item => {
                        const selected = purchaseItemId === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => { setPurchaseItemId(selected ? '' : item.id); setPurchaseSummary(null); setPurchaseQuantity(1); }}
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 8, border: `2px solid ${selected ? '#0284c7' : '#e2e8f0'}`, background: selected ? '#e0f2fe' : 'white', cursor: 'pointer', textAlign: 'left' }}
                          >
                            <span style={{ fontWeight: 600, fontSize: 13, color: selected ? '#0369a1' : '#374151' }}>{item.name}</span>
                            <span style={{ fontWeight: 800, fontSize: 14, color: selected ? '#0284c7' : '#64748b' }}>${item.cost}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {purchaseItemId && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6 }}>수량</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          onClick={() => setPurchaseQuantity(Math.max(1, purchaseQuantity - 1))}
                          style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 700, fontSize: 14, color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >−</button>
                        <input
                          type="number"
                          value={purchaseQuantity}
                          onChange={e => setPurchaseQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                          min="1"
                          style={{ width: 50, fontSize: 14, padding: '8px 10px', borderRadius: 6, border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: 700 }}
                        />
                        <button
                          onClick={() => setPurchaseQuantity(purchaseQuantity + 1)}
                          style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 700, fontSize: 14, color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >+</button>
                        {purchaseItemId && (
                          <span style={{ marginLeft: 'auto', fontWeight: 700, fontSize: 13, color: '#0284c7' }}>
                            ${((shopItems.find(i => i.id === purchaseItemId)?.cost ?? 0) * purchaseQuantity)}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 직접 입력 방식 */}
              {purchaseMode === 'direct' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                  <input
                    value={directItemName}
                    onChange={e => setDirectItemName(e.target.value)}
                    placeholder="상품명 입력"
                    style={{ fontSize: 14, padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}
                  />
                  <input
                    type="number"
                    value={directItemCost}
                    onChange={e => setDirectItemCost(e.target.value)}
                    placeholder="달러 가격"
                    style={{ fontSize: 14, padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}
                  />
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6 }}>수량</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button
                        onClick={() => setDirectQuantity(Math.max(1, directQuantity - 1))}
                        style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 700, fontSize: 14, color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >−</button>
                      <input
                        type="number"
                        value={directQuantity}
                        onChange={e => setDirectQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        min="1"
                        style={{ width: 50, fontSize: 14, padding: '8px 10px', borderRadius: 6, border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: 700 }}
                      />
                      <button
                        onClick={() => setDirectQuantity(directQuantity + 1)}
                        style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 700, fontSize: 14, color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >+</button>
                      {directItemCost && (
                        <span style={{ marginLeft: 'auto', fontWeight: 700, fontSize: 13, color: '#0284c7' }}>
                          ${Number(directItemCost) * directQuantity}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 구매 미리보기 */}
              {purchaseStudentId && (purchaseMode === 'list' ? purchaseItemId : directItemName && directItemCost) && (() => {
                const student = state.students.find(s => s.id === purchaseStudentId);
                if (!student) return null;
                const unitCost = purchaseMode === 'list'
                  ? (shopItems.find(i => i.id === purchaseItemId)?.cost ?? 0)
                  : Number(directItemCost);
                if (!unitCost) return null;
                const quantity = purchaseMode === 'list' ? purchaseQuantity : directQuantity;
                const totalCost = unitCost * quantity;
                const canAfford = student.dollars >= totalCost;
                return (
                  <div style={{ background: canAfford ? '#f0f9ff' : '#fef2f2', borderRadius: 8, padding: '8px 12px', fontSize: 13, border: `1px solid ${canAfford ? '#bae6fd' : '#fecaca'}`, marginBottom: 8 }}>
                    <div style={{ color: canAfford ? '#0369a1' : '#dc2626', fontWeight: 600 }}>
                      {student.name} · 보유 ${student.dollars}
                    </div>
                    <div style={{ color: canAfford ? '#0369a1' : '#dc2626', fontWeight: 600, marginTop: 2, fontSize: 12 }}>
                      구매: ${unitCost} × {quantity}개 = ${totalCost} → 구매 후 ${Math.max(0, student.dollars - totalCost)}
                      {!canAfford && ' (잔액 부족)'}
                    </div>
                  </div>
                );
              })()}

              <button
                onClick={purchaseMode === 'list' ? processPurchase : processDirectPurchase}
                disabled={!purchaseStudentId || (purchaseMode === 'list' ? !purchaseItemId : !directItemName || !directItemCost)}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: 'none', background: (purchaseStudentId && (purchaseMode === 'list' ? purchaseItemId : directItemName && directItemCost)) ? 'linear-gradient(135deg, #0284c7, #0369a1)' : '#e2e8f0', color: (purchaseStudentId && (purchaseMode === 'list' ? purchaseItemId : directItemName && directItemCost)) ? 'white' : '#94a3b8', cursor: (purchaseStudentId && (purchaseMode === 'list' ? purchaseItemId : directItemName && directItemCost)) ? 'pointer' : 'not-allowed', fontWeight: 700, fontSize: 14 }}
              >
                구매 처리 (달러 차감)
              </button>

              {purchaseSummary && (
                <div style={{ marginTop: 12, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#15803d' }}>✅ 구매 완료</div>
                    <div style={{ fontSize: 12, color: '#16a34a', marginTop: 2 }}>
                      {purchaseSummary.name} · {purchaseSummary.item} × {purchaseSummary.quantity}개
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div>
                      <div style={{ fontWeight: 900, fontSize: 15, color: '#dc2626', textAlign: 'right' }}>-${purchaseSummary.total}</div>
                      <div style={{ fontSize: 10, color: '#16a34a', marginTop: 1, textAlign: 'right' }}></div>
                    </div>
                    <button onClick={() => setPurchaseSummary(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={14} /></button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 우측: 구매 내역 */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#374151' }}>
                구매 내역
                {purchases.length > 0 && <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginLeft: 6 }}>총 {purchases.length}건</span>}
              </div>
              {totalPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    onClick={() => setPurchasePage(p => Math.max(1, p - 1))}
                    disabled={purchasePage === 1}
                    style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #e2e8f0', background: purchasePage === 1 ? '#f8fafc' : 'white', color: purchasePage === 1 ? '#cbd5e1' : '#374151', cursor: purchasePage === 1 ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >‹</button>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#374151', minWidth: 60, textAlign: 'center' }}>
                    {purchasePage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPurchasePage(p => Math.min(totalPages, p + 1))}
                    disabled={purchasePage === totalPages}
                    style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #e2e8f0', background: purchasePage === totalPages ? '#f8fafc' : 'white', color: purchasePage === totalPages ? '#cbd5e1' : '#374151', cursor: purchasePage === totalPages ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >›</button>
                </div>
              )}
            </div>
            {purchases.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 14, padding: '40px 0' }}>구매 내역이 없습니다</div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {pagedPurchases.map(p => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: 'white', flexShrink: 0 }}>
                          {p.studentName[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{p.studentName}</div>
                          <div style={{ fontSize: 12, color: '#64748b' }}>{p.itemName}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 900, fontSize: 16, color: '#dc2626' }}>-${p.cost}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>{new Date(p.purchasedAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                        <button
                          onClick={() => {
                            if (confirm(`${p.studentName}의 ${p.itemName} 구매를 취소하시겠습니까?\n(+$${p.cost} 환급)`)) {
                              dispatch({ type: 'DELETE_PURCHASE', payload: p.id });
                            }
                          }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', padding: '4px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 16, paddingTop: 14, borderTop: '1px solid #e2e8f0' }}>
                    <button
                      onClick={() => setPurchasePage(1)}
                      disabled={purchasePage === 1}
                      style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: purchasePage === 1 ? '#f8fafc' : 'white', color: purchasePage === 1 ? '#cbd5e1' : '#374151', cursor: purchasePage === 1 ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 12 }}
                    >처음</button>
                    <button
                      onClick={() => setPurchasePage(p => Math.max(1, p - 1))}
                      disabled={purchasePage === 1}
                      style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: purchasePage === 1 ? '#f8fafc' : 'white', color: purchasePage === 1 ? '#cbd5e1' : '#374151', cursor: purchasePage === 1 ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 15 }}
                    >‹ 이전</button>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#374151', padding: '6px 12px' }}>
                      {purchasePage} / {totalPages} 페이지
                    </span>
                    <button
                      onClick={() => setPurchasePage(p => Math.min(totalPages, p + 1))}
                      disabled={purchasePage === totalPages}
                      style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: purchasePage === totalPages ? '#f8fafc' : 'white', color: purchasePage === totalPages ? '#cbd5e1' : '#374151', cursor: purchasePage === totalPages ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 15 }}
                    >다음 ›</button>
                    <button
                      onClick={() => setPurchasePage(totalPages)}
                      disabled={purchasePage === totalPages}
                      style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: purchasePage === totalPages ? '#f8fafc' : 'white', color: purchasePage === totalPages ? '#cbd5e1' : '#374151', cursor: purchasePage === totalPages ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 12 }}
                    >마지막</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
