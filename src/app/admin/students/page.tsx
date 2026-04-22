'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Student } from '@/lib/types';
import { sheetsSync } from '@/lib/sheets';
import { Plus, Edit2, Trash2, X, KeyRound } from 'lucide-react';

function StudentModal({ student, onSave, onClose }: { student: Partial<Student> | null; onSave: (s: Student) => void; onClose: () => void }) {
  const [form, setForm] = useState<Partial<Student>>(student || { pin: '1111' });
  const [showPin, setShowPin] = useState(false);
  const set = (k: keyof Student, v: string) => setForm(f => ({ ...f, [k]: v }));

  const save = () => {
    if (!form.name || !form.grade) return alert('이름과 학년을 입력하세요');
    onSave({
      id: form.id || `s${Date.now()}`,
      name: form.name!, grade: form.grade!,
      classGroup: form.classGroup || 'A반',
      parentPhone: form.parentPhone || '',
      dollars: Number(form.dollars) || 0,
      joinedAt: form.joinedAt || new Date().toISOString().slice(0, 10),
      pin: form.pin || '1111',
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{form.id ? '학생 수정' : '학생 등록'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={22} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>이름 *</label>
            <input value={form.name || ''} onChange={e => set('name', e.target.value)} placeholder="학생 이름" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>학년 *</label>
              <select value={form.grade || ''} onChange={e => set('grade', e.target.value)}>
                <option value="">선택</option>
                {['초4','초5','초6','중1','중2','중3','고1','고2','고3'].map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>반</label>
              <select value={form.classGroup || 'A반'} onChange={e => set('classGroup', e.target.value)}>
                {['A반','B반','C반','D반'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>학부모 연락처</label>
            <input value={form.parentPhone || ''} onChange={e => set('parentPhone', e.target.value)} placeholder="010-0000-0000" />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <KeyRound size={13} color="#6366f1" /> 학생 비밀번호
              <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400 }}>(기본값 1111)</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPin ? 'text' : 'password'}
                value={form.pin || '1111'}
                onChange={e => set('pin', e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="4자리 숫자"
                maxLength={4}
              />
              <button type="button" onClick={() => setShowPin(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 12 }}>
                {showPin ? '숨기기' : '보기'}
              </button>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>등록일</label>
            <input type="date" value={form.joinedAt || new Date().toISOString().slice(0, 10)} onChange={e => set('joinedAt', e.target.value)} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>취소</button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={save}>저장</button>
        </div>
      </div>
    </div>
  );
}

export default function StudentsPage() {
  const { state, dispatch } = useStore();
  const [modal, setModal] = useState<Partial<Student> | null | false>(false);
  const [search, setSearch] = useState('');

  const filtered = state.students.filter(s =>
    s.name.includes(search) || s.grade.includes(search) || s.classGroup.includes(search)
  );

  const save = (s: Student) => {
    if (state.students.find(x => x.id === s.id)) {
      dispatch({ type: 'UPDATE_STUDENT', payload: s });
    } else {
      dispatch({ type: 'ADD_STUDENT', payload: s });
    }
    // Google Sheets 동기화
    sheetsSync.student(s);
    setModal(false);
  };

  const del = (s: Student) => {
    if (confirm(`${s.name} 학생을 삭제하시겠습니까?`)) {
      dispatch({ type: 'DELETE_STUDENT', payload: s.id });
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>학생 관리</h1>
          <p style={{ color: '#64748b', marginTop: 2, fontSize: 13 }}>총 {state.students.length}명 등록</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal({})}><Plus size={15} /> 학생 등록</button>
      </div>

      <div className="card" style={{ marginBottom: 14, padding: 12 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="이름, 학년, 반 검색..." />
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>학생</th>
                <th>학년</th>
                <th>반</th>
                <th>학부모</th>
                <th>비밀번호</th>
                <th>달러</th>
                <th>등록일</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#1e40af', flexShrink: 0 }}>{s.name[0]}</div>
                      <span style={{ fontWeight: 600 }}>{s.name}</span>
                    </div>
                  </td>
                  <td><span style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: 6, fontSize: 12 }}>{s.grade}</span></td>
                  <td><span className="badge badge-blue">{s.classGroup}</span></td>
                  <td style={{ color: '#64748b', fontSize: 13 }}>{s.parentPhone || '-'}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#94a3b8', fontSize: 13 }}>
                      <KeyRound size={12} />
                      {'●'.repeat(s.pin?.length || 4)}
                    </div>
                  </td>
                  <td><span style={{ fontWeight: 800, color: '#7c3aed' }}>${s.dollars}</span></td>
                  <td style={{ color: '#94a3b8', fontSize: 12 }}>{s.joinedAt}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => setModal(s)} style={{ background: '#eff6ff', border: 'none', cursor: 'pointer', padding: '6px 8px', borderRadius: 6 }}><Edit2 size={13} color="#3b82f6" /></button>
                      <button onClick={() => del(s)} style={{ background: '#fef2f2', border: 'none', cursor: 'pointer', padding: '6px 8px', borderRadius: 6 }}><Trash2 size={13} color="#ef4444" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>검색 결과 없음</div>}
      </div>

      {modal !== false && <StudentModal student={modal} onSave={save} onClose={() => setModal(false)} />}
    </div>
  );
}
