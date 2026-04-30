'use client';

import { useState, useRef } from 'react';
import { localDateStr } from '@/lib/utils';
import { useStore } from '@/lib/store';
import { Student } from '@/lib/types';
import { sheetsSync } from '@/lib/sheets';
import { Plus, Edit2, Trash2, X, KeyRound, Upload, Download, AlertCircle, CheckCircle2 } from 'lucide-react';
import { DAY_LABELS, DAY_ORDER } from '@/lib/utils';
import * as XLSX from 'xlsx';

const LEVELS = ['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5', '초급', '중급', '고급'];

// ── 엑셀 헤더 별칭 매핑 ──────────────────────────────────
const COL_MAP: Record<string, 'name' | 'grade' | 'level' | 'progress'> = {
  '이름': 'name', 'name': 'name',
  '학년': 'grade', 'grade': 'grade',
  '단계': 'level', 'level': 'level',
  '진도': 'progress', 'progress': 'progress',
};

type ParsedRow = { name: string; grade: string; level: string; progress: string; isDuplicate: boolean };

function parseSheet(wb: XLSX.WorkBook): ParsedRow[] | string {
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
  if (rows.length === 0) return '데이터가 없습니다.';

  const firstRow = rows[0];
  const headers = Object.keys(firstRow);
  const colKeys: Partial<Record<'name' | 'grade' | 'level' | 'progress', string>> = {};
  headers.forEach(h => {
    const mapped = COL_MAP[h.trim()];
    if (mapped) colKeys[mapped] = h;
  });
  if (!colKeys.name) return "열 이름을 확인하세요. '이름' 열이 필요합니다.";

  return rows
    .map(row => ({
      name:     String(row[colKeys.name!] ?? '').trim(),
      grade:    String(row[colKeys.grade ?? ''] ?? '').trim(),
      level:    String(row[colKeys.level ?? ''] ?? '').trim(),
      progress: String(row[colKeys.progress ?? ''] ?? '').trim(),
      isDuplicate: false,
    }))
    .filter(r => r.name);
}

function downloadTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    ['이름', '학년', '단계', '진도'],
    ['홍길동', '중1', 'Level 2', 'Unit 3'],
    ['김영희', '초6', 'Level 1', 'Unit 1'],
  ]);
  ws['!cols'] = [{ wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 14 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '학생목록');
  XLSX.writeFile(wb, '학생등록_양식.xlsx');
}

// ── 엑셀 업로드 모달 ─────────────────────────────────────
function ExcelUploadModal({ existingNames, onImport, onClose }: {
  existingNames: Set<string>;
  onImport: (rows: ParsedRow[]) => void;
  onClose: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[] | null>(null);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);

  const handleFile = (file: File) => {
    setError('');
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const result = parseSheet(wb);
        if (typeof result === 'string') { setError(result); setRows(null); return; }
        const marked = result.map(r => ({ ...r, isDuplicate: existingNames.has(r.name) }));
        setRows(marked);
      } catch {
        setError('파일을 읽을 수 없습니다. .xlsx 또는 .csv 형식을 사용하세요.');
        setRows(null);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const newRows = rows?.filter(r => !r.isDuplicate) ?? [];

  return (
    <div className="modal-backdrop">
      <div className="modal" style={{ maxWidth: 560, width: '95vw' }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>엑셀로 학생 일괄 등록</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={downloadTemplate} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 12, color: '#64748b', minHeight: 'unset' }}>
              <Download size={13} /> 양식 다운로드
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={22} /></button>
          </div>
        </div>

        {/* 컬럼 안내 */}
        <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#64748b' }}>
          필수 열: <strong>이름</strong> · 선택 열: <strong>학년, 단계, 진도</strong>
        </div>

        {/* 파일 드롭존 */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? '#6366f1' : '#e2e8f0'}`,
            borderRadius: 14, padding: '28px 20px', textAlign: 'center', cursor: 'pointer',
            background: dragging ? '#eff0ff' : '#f8fafc', transition: 'all 0.15s', marginBottom: 16,
          }}
        >
          <Upload size={28} color={dragging ? '#6366f1' : '#94a3b8'} style={{ margin: '0 auto 8px' }} />
          <div style={{ fontSize: 14, fontWeight: 700, color: dragging ? '#6366f1' : '#374151' }}>
            파일을 드래그하거나 클릭하여 선택
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>.xlsx, .xls, .csv 지원</div>
          <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        </div>

        {/* 오류 */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#fef2f2', borderRadius: 10, marginBottom: 14, color: '#991b1b', fontSize: 13 }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* 미리보기 */}
        {rows && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>미리보기 ({rows.length}행)</span>
              <div style={{ display: 'flex', gap: 10, fontSize: 12 }}>
                <span style={{ color: '#16a34a', fontWeight: 600 }}>✅ 신규 {newRows.length}명</span>
                {rows.filter(r => r.isDuplicate).length > 0 && (
                  <span style={{ color: '#f59e0b', fontWeight: 600 }}>⚠️ 중복 {rows.filter(r => r.isDuplicate).length}명</span>
                )}
              </div>
            </div>
            <div style={{ maxHeight: 240, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['이름', '학년', '단계', '진도', '상태'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, fontSize: 11, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} style={{ background: r.isDuplicate ? '#fffbeb' : 'white', borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '7px 10px', fontWeight: 600 }}>{r.name}</td>
                      <td style={{ padding: '7px 10px', color: '#64748b' }}>{r.grade || '-'}</td>
                      <td style={{ padding: '7px 10px', color: '#64748b' }}>{r.level || '-'}</td>
                      <td style={{ padding: '7px 10px', color: '#64748b' }}>{r.progress || '-'}</td>
                      <td style={{ padding: '7px 10px' }}>
                        {r.isDuplicate
                          ? <span style={{ fontSize: 11, background: '#fef3c7', color: '#92400e', padding: '2px 7px', borderRadius: 8, fontWeight: 700 }}>중복</span>
                          : <CheckCircle2 size={15} color="#16a34a" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.filter(r => r.isDuplicate).length > 0 && (
              <p style={{ fontSize: 11, color: '#92400e', marginTop: 8, background: '#fffbeb', padding: '8px 12px', borderRadius: 8 }}>
                ⚠️ 이미 등록된 이름은 건너뜁니다. 신규 {newRows.length}명만 등록됩니다.
              </p>
            )}
          </>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>취소</button>
          <button
            className="btn btn-primary" style={{ flex: 1 }}
            disabled={!rows || newRows.length === 0}
            onClick={() => { if (rows) onImport(newRows); }}
          >
            {newRows.length > 0 ? `${newRows.length}명 등록` : '등록할 학생 없음'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 학생 개별 등록/수정 모달 ─────────────────────────────
function StudentModal({ student, onSave, onClose }: { student: Partial<Student> | null; onSave: (s: Student) => void; onClose: () => void }) {
  const initForm = (): Partial<Student> => {
    if (!student) return { pin: '1111', scheduleDays: [], scheduleTimes: {} };
    if (student.scheduleTimes) return student;
    const times: Record<string, string> = {};
    if (student.scheduleTime && student.scheduleDays) {
      student.scheduleDays.forEach(d => { times[d] = student.scheduleTime!; });
    }
    return { ...student, scheduleTimes: times };
  };
  const [form, setForm] = useState<Partial<Student>>(initForm());
  const [showPin, setShowPin] = useState(false);
  const set = (k: keyof Student, v: string | string[] | Record<string, string>) => setForm(f => ({ ...f, [k]: v }));
  const setTime = (day: string, val: string) => setForm(f => ({ ...f, scheduleTimes: { ...(f.scheduleTimes || {}), [day]: val } }));

  const toggleDay = (day: string) => {
    const current = form.scheduleDays || [];
    const next = current.includes(day) ? current.filter(d => d !== day) : [...current, day];
    set('scheduleDays', next);
  };

  const save = () => {
    if (!form.name || !form.grade) return alert('이름과 학년을 입력하세요');
    const days = form.scheduleDays || [];
    const allTimes = form.scheduleTimes || {};
    const times: Record<string, string> = {};
    days.forEach(d => { if (allTimes[d]) times[d] = allTimes[d]; });
    onSave({
      id: form.id || `s${Date.now()}`,
      name: form.name!, grade: form.grade!,
      classGroup: form.classGroup || 'A반',
      parentPhone: form.parentPhone || '',
      dollars: Number(form.dollars) || 0,
      joinedAt: form.joinedAt || localDateStr(),
      pin: form.pin || '1111',
      level: form.level || '',
      progress: form.progress || '',
      scheduleDays: days,
      scheduleTimes: times,
      scheduleTime: times[days[0]] || '',
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>단계</label>
              <select value={form.level || ''} onChange={e => set('level', e.target.value)}>
                <option value="">선택 (선택사항)</option>
                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>진도</label>
              <input value={form.progress || ''} onChange={e => set('progress', e.target.value)} placeholder="예) Unit 3" />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>수업 요일</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {DAY_ORDER.map(day => {
                const selected = (form.scheduleDays || []).includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    style={{
                      flex: 1, padding: '8px 0', borderRadius: 8, border: '1.5px solid',
                      borderColor: selected ? '#6366f1' : '#e2e8f0',
                      background: selected ? '#eff0ff' : 'white',
                      color: selected ? '#6366f1' : '#94a3b8',
                      fontWeight: selected ? 700 : 400, fontSize: 14, cursor: 'pointer',
                      minHeight: 'unset',
                    }}
                  >
                    {DAY_LABELS[day]}
                  </button>
                );
              })}
            </div>
          </div>

          {(form.scheduleDays || []).length > 0 && (
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>요일별 수업 시간</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {(form.scheduleDays || []).map(day => (
                  <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#6366f1', minWidth: 22, textAlign: 'center',
                      background: '#eff0ff', borderRadius: 6, padding: '4px 0', display: 'inline-block' }}>
                      {DAY_LABELS[day as keyof typeof DAY_LABELS]}
                    </span>
                    <input
                      value={(form.scheduleTimes || {})[day] || ''}
                      onChange={e => setTime(day, e.target.value)}
                      placeholder="예) 14:00-16:00"
                      style={{ flex: 1 }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>학부모 연락처</label>
            <input value={form.parentPhone || ''} onChange={e => {
              const phone = e.target.value;
              set('parentPhone', phone);
              const digits = phone.replace(/\D/g, '');
              set('pin', digits.length >= 4 ? digits.slice(-4) : '1111');
            }} placeholder="010-0000-0000" />
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>번호 입력 시 비밀번호가 뒷자리 4자리로 자동 설정됩니다</div>
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
              <button type="button" onClick={() => setShowPin(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 12, minHeight: 'unset' }}>
                {showPin ? '숨기기' : '보기'}
              </button>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>등록일</label>
            <input type="date" value={form.joinedAt || localDateStr()} onChange={e => set('joinedAt', e.target.value)} />
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

// ── 메인 페이지 ──────────────────────────────────────────
export default function StudentsPage() {
  const { state, dispatch } = useStore();
  const [modal, setModal] = useState<Partial<Student> | null | false>(false);
  const [showUpload, setShowUpload] = useState(false);
  const [search, setSearch] = useState('');
  const [editPinId, setEditPinId] = useState<string | null>(null);
  const [editPinValue, setEditPinValue] = useState('');

  const filtered = state.students.filter(s =>
    s.name.includes(search) || s.grade.includes(search) || s.classGroup.includes(search)
  );

  const save = (s: Student) => {
    if (state.students.find(x => x.id === s.id)) {
      dispatch({ type: 'UPDATE_STUDENT', payload: s });
    } else {
      dispatch({ type: 'ADD_STUDENT', payload: s });
    }
    sheetsSync.student(s);
    setModal(false);
  };

  const del = (s: Student) => {
    if (confirm(`${s.name} 학생을 삭제하시겠습니까?`)) {
      dispatch({ type: 'DELETE_STUDENT', payload: s.id });
    }
  };

  const importStudents = (rows: ParsedRow[]) => {
    const today = localDateStr();
    rows.forEach(r => {
      const s: Student = {
        id: `s${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: r.name, grade: r.grade || '미설정',
        classGroup: 'A반', parentPhone: '',
        dollars: 0, joinedAt: today,
        pin: '1111', level: r.level || '',
        progress: r.progress || '',
        scheduleDays: [], scheduleTime: '',
      };
      dispatch({ type: 'ADD_STUDENT', payload: s });
      sheetsSync.student(s);
    });
    setShowUpload(false);
  };

  const existingNames = new Set(state.students.map(s => s.name));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>학생 관리</h1>
          <p style={{ color: '#64748b', marginTop: 2, fontSize: 13 }}>총 {state.students.length}명 등록</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowUpload(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10, border: '1.5px solid #6366f1', background: 'white', color: '#6366f1', cursor: 'pointer', fontWeight: 700, fontSize: 13, minHeight: 'unset' }}>
            <Upload size={15} /> 엑셀 업로드
          </button>
          <button className="btn btn-primary" onClick={() => setModal({})}><Plus size={15} /> 학생 등록</button>
        </div>
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
                <th>단계</th>
                <th>진도</th>
                <th>수업 요일</th>
                <th>시간</th>
                <th>반</th>
                <th>달러</th>
                <th>비밀번호</th>
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
                  <td><span style={{ fontSize: 12, color: '#64748b' }}>{s.level || '-'}</span></td>
                  <td><span style={{ fontSize: 12, color: '#64748b' }}>{s.progress || '-'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 3 }}>
                      {(s.scheduleDays || []).length > 0
                        ? (s.scheduleDays || []).map(d => (
                          <span key={d} style={{ background: '#eff0ff', color: '#6366f1', padding: '2px 6px', borderRadius: 5, fontSize: 11, fontWeight: 600 }}>
                            {DAY_LABELS[d as keyof typeof DAY_LABELS] || d}
                          </span>
                        ))
                        : <span style={{ color: '#94a3b8', fontSize: 12 }}>미설정</span>
                      }
                    </div>
                  </td>
                  <td style={{ fontSize: 11, color: '#64748b' }}>
                    {s.scheduleTimes && Object.keys(s.scheduleTimes).length > 0
                      ? (s.scheduleDays || []).map(d => s.scheduleTimes![d] ? (
                        <div key={d} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, color: '#6366f1', minWidth: 14 }}>{DAY_LABELS[d as keyof typeof DAY_LABELS]}</span>
                          <span>{s.scheduleTimes![d]}</span>
                        </div>
                      ) : null)
                      : (s.scheduleTime || '-')}
                  </td>
                  <td><span className="badge badge-blue">{s.classGroup}</span></td>
                  <td><span style={{ fontWeight: 800, color: '#7c3aed' }}>${s.dollars}</span></td>
                  <td>
                    {editPinId === s.id ? (
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <input
                          type="text" value={editPinValue} maxLength={4}
                          onChange={e => setEditPinValue(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          style={{ width: 56, textAlign: 'center', fontFamily: 'monospace', fontSize: 15, padding: '4px 6px', borderRadius: 6, border: '1.5px solid #6366f1' }}
                          autoFocus
                          onKeyDown={e => {
                            if (e.key === 'Enter') { dispatch({ type: 'UPDATE_STUDENT', payload: { ...s, pin: editPinValue || '1111' } }); setEditPinId(null); }
                            if (e.key === 'Escape') setEditPinId(null);
                          }}
                        />
                        <button onClick={() => { dispatch({ type: 'UPDATE_STUDENT', payload: { ...s, pin: editPinValue || '1111' } }); setEditPinId(null); }} style={{ background: '#d1fae5', border: 'none', cursor: 'pointer', padding: '5px 7px', borderRadius: 6, fontSize: 12, fontWeight: 700, color: '#15803d', minHeight: 'unset' }}>✓</button>
                        <button onClick={() => setEditPinId(null)} style={{ background: '#fee2e2', border: 'none', cursor: 'pointer', padding: '5px 7px', borderRadius: 6, fontSize: 12, fontWeight: 700, color: '#991b1b', minHeight: 'unset' }}>✕</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 14, color: '#475569', letterSpacing: 2 }}>{s.pin || '1111'}</span>
                        <button onClick={() => { setEditPinId(s.id); setEditPinValue(s.pin || '1111'); }} style={{ background: '#eff0ff', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 6, minHeight: 'unset' }}>
                          <KeyRound size={11} color="#6366f1" />
                        </button>
                      </div>
                    )}
                  </td>
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
      {showUpload && <ExcelUploadModal existingNames={existingNames} onImport={importStudents} onClose={() => setShowUpload(false)} />}
    </div>
  );
}
