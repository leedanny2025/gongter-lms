'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { TestRecord } from '@/lib/types';
import { Plus, CheckCircle, ImageIcon, X, Upload } from 'lucide-react';

function AddTestModal({ onSave, onClose }: { onSave: (t: TestRecord) => void; onClose: () => void }) {
  const { state } = useStore();
  const [studentId, setStudentId] = useState('');
  const [subject, setSubject] = useState('영어 어휘 테스트');
  const [score, setScore] = useState('');
  const [maxScore, setMaxScore] = useState('100');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const week = `${new Date().getFullYear()}-W${Math.ceil(new Date().getDate() / 7).toString().padStart(2, '0')}`;

  const save = () => {
    const student = state.students.find(s => s.id === studentId);
    if (!student) return alert('학생을 선택하세요');
    onSave({
      id: `t${Date.now()}`,
      studentId,
      studentName: student.name,
      subject,
      score: score ? Number(score) : null,
      maxScore: Number(maxScore),
      submittedByStudent: false,
      status: score ? 'confirmed' : 'pending',
      confirmedAt: score ? new Date().toISOString() : undefined,
      week,
      date,
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>시험 점수 입력</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>학생</label>
            <select value={studentId} onChange={e => setStudentId(e.target.value)}>
              <option value="">학생 선택</option>
              {state.students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.grade})</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>시험 과목</label>
            <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="시험명 입력" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>점수</label>
              <input type="number" value={score} onChange={e => setScore(e.target.value)} placeholder="0" min="0" max="100" />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>만점</label>
              <input type="number" value={maxScore} onChange={e => setMaxScore(e.target.value)} placeholder="100" />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>시험 날짜</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>시험지 사진 (선택)</label>
            <div style={{ border: '2px dashed #e2e8f0', borderRadius: 8, padding: 20, textAlign: 'center', cursor: 'pointer', color: '#94a3b8' }}>
              <Upload size={24} style={{ margin: '0 auto 8px' }} />
              <div style={{ fontSize: 13 }}>사진을 드래그하거나 클릭하여 업로드</div>
              <div style={{ fontSize: 11, marginTop: 4 }}>JPG, PNG 지원</div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
          <button className="btn-outline" onClick={onClose}>취소</button>
          <button className="btn-primary" onClick={save}>저장</button>
        </div>
      </div>
    </div>
  );
}

function ScoreConfirmModal({ record, onConfirm, onClose }: { record: TestRecord; onConfirm: (id: string, score: number) => void; onClose: () => void }) {
  const [score, setScore] = useState(record.score?.toString() || '');

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>점수 확정</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        <div style={{ background: '#f8fafc', borderRadius: 10, padding: 14, marginBottom: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{record.studentName}</div>
          <div style={{ color: '#64748b', fontSize: 13 }}>{record.subject} · {record.date}</div>
          {record.submittedByStudent && (
            <div style={{ marginTop: 8, fontSize: 13, color: '#3b82f6', background: '#eff6ff', padding: '6px 10px', borderRadius: 6 }}>
              학생이 직접 입력한 점수입니다
            </div>
          )}
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>최종 점수 (만점 {record.maxScore}점)</label>
          <input type="number" value={score} onChange={e => setScore(e.target.value)} placeholder="점수 입력" min="0" max={record.maxScore} style={{ fontSize: 24, fontWeight: 700, textAlign: 'center' }} />
        </div>
        {record.imageUrl && (
          <div style={{ marginTop: 16, background: '#f8fafc', borderRadius: 8, padding: 16, textAlign: 'center', color: '#94a3b8' }}>
            <ImageIcon size={40} style={{ margin: '0 auto' }} />
            <div style={{ fontSize: 12, marginTop: 8 }}>시험지 이미지 첨부됨</div>
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
          <button className="btn-outline" onClick={onClose}>취소</button>
          <button
            onClick={() => score && onConfirm(record.id, Number(score))}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', background: '#22c55e', color: 'white', cursor: 'pointer', fontWeight: 600 }}
          >
            <CheckCircle size={16} /> 점수 확정
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TestsPage() {
  const { state, dispatch } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [confirmRecord, setConfirmRecord] = useState<TestRecord | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed'>('all');

  const records = state.testRecords.filter(t => filter === 'all' || t.status === filter);

  const addTest = (t: TestRecord) => {
    dispatch({ type: 'ADD_TEST', payload: t });
    setShowAdd(false);
  };

  const confirmTest = (id: string, score: number) => {
    dispatch({ type: 'CONFIRM_TEST', payload: { id, score } });
    setConfirmRecord(null);
  };

  const getScoreColor = (score: number | null, max: number) => {
    if (score === null) return '#94a3b8';
    const pct = (score / max) * 100;
    if (pct >= 80) return '#16a34a';
    if (pct >= 60) return '#d97706';
    return '#dc2626';
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>시험 점수 관리</h1>
          <p style={{ color: '#64748b', marginTop: 4, fontSize: 14 }}>시험 점수 입력 및 확정</p>
        </div>
        <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => setShowAdd(true)}>
          <Plus size={16} /> 점수 입력
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {([
          { key: 'all', label: `전체 (${state.testRecords.length})` },
          { key: 'pending', label: `대기중 (${state.testRecords.filter(t => t.status === 'pending').length})` },
          { key: 'confirmed', label: `확정됨 (${state.testRecords.filter(t => t.status === 'confirmed').length})` },
        ] as const).map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key)} style={{
            padding: '7px 16px', borderRadius: 20, border: '1px solid',
            borderColor: filter === key ? '#3b82f6' : '#e2e8f0',
            background: filter === key ? '#eff6ff' : 'white',
            color: filter === key ? '#3b82f6' : '#64748b',
            fontWeight: filter === key ? 700 : 400,
            cursor: 'pointer', fontSize: 13,
          }}>
            {label}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>학생</th>
              <th>시험명</th>
              <th>날짜</th>
              <th>점수</th>
              <th>제출자</th>
              <th>상태</th>
              <th>액션</th>
            </tr>
          </thead>
          <tbody>
            {records.map(t => (
              <tr key={t.id}>
                <td style={{ fontWeight: 600 }}>{t.studentName}</td>
                <td style={{ color: '#374151', fontSize: 13 }}>{t.subject}</td>
                <td style={{ color: '#64748b', fontSize: 13 }}>{t.date}</td>
                <td>
                  {t.score !== null ? (
                    <span style={{ fontWeight: 700, fontSize: 16, color: getScoreColor(t.score, t.maxScore) }}>
                      {t.score}<span style={{ fontSize: 12, fontWeight: 400, color: '#94a3b8' }}>/{t.maxScore}</span>
                    </span>
                  ) : (
                    <span style={{ color: '#94a3b8', fontSize: 13 }}>미입력</span>
                  )}
                </td>
                <td>
                  <span style={{ fontSize: 12, padding: '3px 8px', borderRadius: 6, background: t.submittedByStudent ? '#dbeafe' : '#f1f5f9', color: t.submittedByStudent ? '#1e40af' : '#64748b' }}>
                    {t.submittedByStudent ? '학생 입력' : '교사 입력'}
                  </span>
                </td>
                <td>
                  <span className={`badge badge-${t.status}`}>
                    {t.status === 'confirmed' ? '확정됨' : '대기중'}
                  </span>
                </td>
                <td>
                  {t.status === 'pending' && (
                    <button onClick={() => setConfirmRecord(t)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 6, border: 'none', background: '#dbeafe', color: '#1e40af', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                      <CheckCircle size={13} /> 확정
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>해당 항목이 없습니다</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 학생별 점수 요약 */}
      <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
        {state.students.map(student => {
          const confirmed = state.testRecords.filter(t => t.studentId === student.id && t.status === 'confirmed' && t.score !== null);
          const avg = confirmed.length > 0
            ? Math.round(confirmed.reduce((s, t) => s + ((t.score! / t.maxScore) * 100), 0) / confirmed.length)
            : null;
          return (
            <div key={student.id} className="card" style={{ textAlign: 'center', padding: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#1e40af', margin: '0 auto 8px' }}>
                {student.name[0]}
              </div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{student.name}</div>
              <div style={{ fontSize: 22, fontWeight: 700, marginTop: 8, color: avg !== null ? getScoreColor(avg, 100) : '#94a3b8' }}>
                {avg !== null ? `${avg}%` : '-'}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>평균 ({confirmed.length}회)</div>
            </div>
          );
        })}
      </div>

      {showAdd && <AddTestModal onSave={addTest} onClose={() => setShowAdd(false)} />}
      {confirmRecord && <ScoreConfirmModal record={confirmRecord} onConfirm={confirmTest} onClose={() => setConfirmRecord(null)} />}
    </div>
  );
}
