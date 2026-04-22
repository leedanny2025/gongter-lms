'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { DollarCondition } from '@/lib/types';
import { Plus, Edit2, Trash2, Save, X, ToggleLeft, ToggleRight } from 'lucide-react';

const TYPE_LABELS = { attendance: '출석', homework: '숙제', test: '시험', attitude: '태도', custom: '기타' };
const TYPE_COLORS = { attendance: '#22c55e', homework: '#3b82f6', test: '#f59e0b', attitude: '#8b5cf6', custom: '#64748b' };

function ConditionModal({ condition, onSave, onClose }: { condition: Partial<DollarCondition> | null; onSave: (c: DollarCondition) => void; onClose: () => void }) {
  const [form, setForm] = useState<Partial<DollarCondition>>(condition || { enabled: true, type: 'custom' });

  const save = () => {
    if (!form.name || form.amount === undefined) return alert('이름과 금액을 입력하세요');
    onSave({
      id: form.id || `c${Date.now()}`,
      name: form.name!,
      amount: Number(form.amount),
      description: form.description || '',
      enabled: form.enabled !== false,
      type: form.type || 'custom',
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{form.id ? '조건 수정' : '새 달러 조건 추가'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>조건 이름 *</label>
            <input value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="예: 수업 참여도 우수" />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>지급 달러 *</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: '#7c3aed' }}>$</span>
              <input type="number" value={form.amount || ''} onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))} placeholder="0" style={{ paddingLeft: 28 }} min="0" />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>분류</label>
            <select value={form.type || 'custom'} onChange={e => setForm(f => ({ ...f, type: e.target.value as DollarCondition['type'] }))}>
              {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>설명 (선택)</label>
            <textarea value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="조건에 대한 설명을 입력하세요" />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
          <button className="btn-outline" onClick={onClose}>취소</button>
          <button onClick={save} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', background: '#7c3aed', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
            <Save size={15} /> 저장
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { state, dispatch } = useStore();
  const [modal, setModal] = useState<Partial<DollarCondition> | null | false>(false);

  const totalMax = state.dollarConditions.filter(c => c.enabled).reduce((s, c) => s + c.amount, 0);

  const save = (c: DollarCondition) => {
    if (c.id && state.dollarConditions.find(x => x.id === c.id)) {
      dispatch({ type: 'UPDATE_CONDITION', payload: c });
    } else {
      dispatch({ type: 'ADD_CONDITION', payload: c });
    }
    setModal(false);
  };

  const del = (id: string, name: string) => {
    if (confirm(`"${name}" 조건을 삭제하시겠습니까?`)) {
      dispatch({ type: 'DELETE_CONDITION', payload: id });
    }
  };

  const toggle = (c: DollarCondition) => {
    dispatch({ type: 'UPDATE_CONDITION', payload: { ...c, enabled: !c.enabled } });
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>달러 시스템 설정</h1>
        <p style={{ color: '#64748b', marginTop: 4, fontSize: 14 }}>주간 달러 지급 조건을 설정합니다</p>
      </div>

      {/* 요약 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', border: 'none' }}>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 4 }}>주간 최대 지급액</div>
          <div style={{ color: 'white', fontSize: 32, fontWeight: 800 }}>${totalMax}</div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4 }}>모든 조건 충족 시</div>
        </div>
        <div className="card">
          <div style={{ color: '#64748b', fontSize: 13, marginBottom: 4 }}>활성화된 조건</div>
          <div style={{ fontSize: 32, fontWeight: 800 }}>{state.dollarConditions.filter(c => c.enabled).length}개</div>
          <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>/ 전체 {state.dollarConditions.length}개</div>
        </div>
        <div className="card">
          <div style={{ color: '#64748b', fontSize: 13, marginBottom: 4 }}>학생 수</div>
          <div style={{ fontSize: 32, fontWeight: 800 }}>{state.students.length}명</div>
          <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>주간 최대 ${totalMax * state.students.length} 지급 가능</div>
        </div>
      </div>

      {/* 조건 목록 */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>달러 지급 조건</h2>
          <button onClick={() => setModal({})} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', background: '#7c3aed', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
            <Plus size={16} /> 조건 추가
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {state.dollarConditions.map(c => (
            <div key={c.id} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
              borderRadius: 10, border: '1px solid #e2e8f0',
              background: c.enabled ? 'white' : '#f8fafc',
              opacity: c.enabled ? 1 : 0.6,
            }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: c.enabled ? TYPE_COLORS[c.type] : '#cbd5e1', flexShrink: 0 }} />

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{c.name}</span>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: TYPE_COLORS[c.type] + '20', color: TYPE_COLORS[c.type], fontWeight: 600 }}>
                    {TYPE_LABELS[c.type]}
                  </span>
                  {!c.enabled && <span style={{ fontSize: 11, color: '#94a3b8' }}>비활성</span>}
                </div>
                {c.description && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>{c.description}</div>}
              </div>

              <div style={{ fontSize: 22, fontWeight: 800, color: c.enabled ? '#7c3aed' : '#94a3b8', minWidth: 60, textAlign: 'right' }}>
                ${c.amount}
              </div>

              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <button onClick={() => toggle(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.enabled ? '#22c55e' : '#94a3b8' }}>
                  {c.enabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                </button>
                <button onClick={() => setModal(c)} style={{ background: '#eff6ff', border: 'none', cursor: 'pointer', padding: '6px 8px', borderRadius: 6 }}>
                  <Edit2 size={14} color="#3b82f6" />
                </button>
                <button onClick={() => del(c.id, c.name)} style={{ background: '#fef2f2', border: 'none', cursor: 'pointer', padding: '6px 8px', borderRadius: 6 }}>
                  <Trash2 size={14} color="#ef4444" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {state.dollarConditions.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
            조건이 없습니다. 새 조건을 추가하세요.
          </div>
        )}

        {/* 합계 */}
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '2px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 14, color: '#64748b' }}>주간 최대 지급액</span>
          <span style={{ fontSize: 24, fontWeight: 800, color: '#7c3aed' }}>${totalMax}</span>
        </div>
      </div>

      {/* 안내 */}
      <div className="card" style={{ marginTop: 20, background: '#fffbeb', border: '1px solid #fcd34d' }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#92400e', marginTop: 0, marginBottom: 10 }}>⚙️ 달러 시스템 안내</h3>
        <ul style={{ color: '#78350f', fontSize: 13, lineHeight: 1.8, margin: 0, paddingLeft: 20 }}>
          <li>매주 조건 충족 여부를 확인한 후 달러 지급 페이지에서 지급합니다</li>
          <li>조건을 비활성화하면 해당 조건은 이번 주 계산에서 제외됩니다</li>
          <li>조건 추가/삭제는 즉시 적용되며, 이미 지급된 달러에는 영향을 주지 않습니다</li>
          <li>수동 지급/차감도 가능합니다 (달러 지급 페이지에서)</li>
        </ul>
      </div>

      {modal !== false && (
        <ConditionModal condition={modal} onSave={save} onClose={() => setModal(false)} />
      )}
    </div>
  );
}
