'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { fbDelete } from '@/lib/firebase';
import { TestRecord } from '@/lib/types';
import { Student } from '@/lib/types';
import { Plus, CheckCircle, ImageIcon, X, Upload, Pencil, Trash2 } from 'lucide-react';
import { localDateStr, getWeekKey } from '@/lib/utils';

function AddTestModal({ onSave, onClose }: { onSave: (t: TestRecord) => void; onClose: () => void }) {
  const { state } = useStore();
  const [studentId, setStudentId] = useState('');
  const [subject, setSubject] = useState('영어 어휘 테스트');
  const [score, setScore] = useState('');
  const [maxScore, setMaxScore] = useState('20');
  const [date, setDate] = useState(localDateStr());

  const week = getWeekKey();

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
              <input type="number" value={score} onChange={e => setScore(e.target.value)} placeholder="0" min="0" max={maxScore} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>만점 (개)</label>
              <input type="number" value={maxScore} onChange={e => setMaxScore(e.target.value)} placeholder="20" />
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

function EditTestModal({ record, onSave, onClose }: { record: TestRecord; onSave: (t: TestRecord) => void; onClose: () => void }) {
  const [subject, setSubject] = useState(record.subject);
  const [score, setScore] = useState(record.score?.toString() ?? '');
  const [maxScore, setMaxScore] = useState(record.maxScore.toString());
  const [date, setDate] = useState(record.date);

  const save = () => {
    const s = score !== '' ? Number(score) : null;
    onSave({
      ...record,
      subject,
      score: s,
      maxScore: Number(maxScore),
      date,
      status: s !== null ? 'confirmed' : 'pending',
      confirmedAt: s !== null ? (record.confirmedAt ?? new Date().toISOString()) : undefined,
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>시험 점수 수정</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 14, fontWeight: 600 }}>
          {record.studentName}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>시험 과목</label>
            <input value={subject} onChange={e => setSubject(e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>점수</label>
              <input type="number" value={score} onChange={e => setScore(e.target.value)} placeholder="미입력" min="0" max={maxScore} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>만점</label>
              <input type="number" value={maxScore} onChange={e => setMaxScore(e.target.value)} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>날짜</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
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
          <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>맞은 개수 ({record.maxScore}개 중)</label>
          <input type="number" value={score} onChange={e => setScore(e.target.value)} placeholder="개수 입력" min="0" max={record.maxScore} style={{ fontSize: 24, fontWeight: 700, textAlign: 'center' }} />
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

function StudentScoreModal({ student, records, onClose }: { student: Student; records: TestRecord[]; onClose: () => void }) {
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
  const confirmed = sorted.filter(r => r.status === 'confirmed' && r.score !== null);
  const avg = confirmed.length > 0
    ? Math.round(confirmed.reduce((s, t) => s + (t.score! / t.maxScore) * 100, 0) / confirmed.length)
    : null;

  const scoreColor = (score: number, max: number) => {
    const pct = (score / max) * 100;
    return pct >= 80 ? '#16a34a' : pct >= 60 ? '#d97706' : '#dc2626';
  };

  const fmtDate = (d: string) => {
    const [, m, day] = d.split('-');
    return `${Number(m)}/${Number(day)}`;
  };

  return (
    <div className="modal-backdrop">
      <div className="modal" style={{ maxWidth: 420 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{student.name} 점수 누적</h3>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{student.classGroup} · 총 {sorted.length}회</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={22} /></button>
        </div>

        {avg !== null && (
          <div style={{ background: '#f0f9ff', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#0369a1' }}>전체 평균</span>
            <span style={{ fontSize: 24, fontWeight: 900, color: scoreColor(avg, 100) }}>{avg}%</span>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 360, overflowY: 'auto' }}>
          {sorted.length === 0 && (
            <div style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>시험 기록이 없습니다</div>
          )}
          {sorted.map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#475569', minWidth: 36 }}>{fmtDate(t.date)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{t.subject}</div>
                {t.status !== 'confirmed' && (
                  <span style={{ fontSize: 10, color: '#f59e0b', fontWeight: 600 }}>대기중</span>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                {t.score !== null ? (
                  <>
                    <span style={{ fontSize: 18, fontWeight: 800, color: scoreColor(t.score, t.maxScore) }}>{t.score}</span>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>/{t.maxScore}</span>
                    <div style={{ fontSize: 11, color: scoreColor(t.score, t.maxScore), fontWeight: 600 }}>
                      {Math.round((t.score / t.maxScore) * 100)}%
                    </div>
                  </>
                ) : (
                  <span style={{ fontSize: 13, color: '#94a3b8' }}>미입력</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <button className="btn btn-outline" style={{ width: '100%', marginTop: 16 }} onClick={onClose}>닫기</button>
      </div>
    </div>
  );
}

export default function TestsPage() {
  const { state, dispatch } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [confirmRecord, setConfirmRecord] = useState<TestRecord | null>(null);
  const [editRecord, setEditRecord] = useState<TestRecord | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed'>('all');
  const [summaryView, setSummaryView] = useState<'week' | 'all'>('week');
  const [detailStudent, setDetailStudent] = useState<Student | null>(null);
  const [classFilter, setClassFilter] = useState('전체');

  const currentWeek = getWeekKey();
  const classGroups = ['전체', ...new Set(state.students.map(s => s.classGroup))];

  const weekRecords = state.testRecords.filter(t => t.week === currentWeek &&
    (classFilter === '전체' || state.students.find(s => s.id === t.studentId)?.classGroup === classFilter));
  const records = weekRecords.filter(t => filter === 'all' || t.status === filter);
  const filteredStudents = classFilter === '전체' ? state.students : state.students.filter(s => s.classGroup === classFilter);

  const addTest = (t: TestRecord) => {
    dispatch({ type: 'ADD_TEST', payload: t });
    setShowAdd(false);
  };

  const confirmTest = (id: string, score: number) => {
    dispatch({ type: 'CONFIRM_TEST', payload: { id, score } });
    setConfirmRecord(null);
  };

  const updateTest = (t: TestRecord) => {
    dispatch({ type: 'UPDATE_TEST', payload: t });
    setEditRecord(null);
  };

  const deleteTest = (id: string) => {
    if (!confirm('이 시험 기록을 삭제할까요?')) return;
    dispatch({ type: '_SET', payload: { testRecords: state.testRecords.filter(t => t.id !== id) } });
    fbDelete(`lms/tests/${id}`);
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

      {classGroups.length > 2 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
          {classGroups.map(cls => (
            <button key={cls} onClick={() => setClassFilter(cls)} style={{
              padding: '5px 12px', borderRadius: 20, border: '1px solid',
              borderColor: classFilter === cls ? '#3b82f6' : '#e2e8f0',
              background: classFilter === cls ? '#eff6ff' : 'white',
              color: classFilter === cls ? '#3b82f6' : '#64748b',
              fontWeight: classFilter === cls ? 700 : 400, fontSize: 12, cursor: 'pointer',
            }}>{cls}</button>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {([
          { key: 'all', label: `이번 주 전체 (${weekRecords.length})` },
          { key: 'pending', label: `대기중 (${weekRecords.filter(t => t.status === 'pending').length})` },
          { key: 'confirmed', label: `확정됨 (${weekRecords.filter(t => t.status === 'confirmed').length})` },
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
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {t.status === 'pending' && (
                      <button onClick={() => setConfirmRecord(t)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 6, border: 'none', background: '#dbeafe', color: '#1e40af', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                        <CheckCircle size={13} /> 확정
                      </button>
                    )}
                    <button onClick={() => setEditRecord(t)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 6, border: 'none', background: '#f1f5f9', color: '#475569', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                      <Pencil size={13} /> 수정
                    </button>
                    <button onClick={() => deleteTest(t.id)} style={{ display: 'flex', alignItems: 'center', padding: '5px 8px', borderRadius: 6, border: 'none', background: '#fef2f2', color: '#ef4444', cursor: 'pointer', fontSize: 12 }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
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
      <div style={{ marginTop: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>학생별 점수 현황</h2>
          <div style={{ display: 'flex', gap: 6 }}>
            {([{ key: 'week', label: '주간 누적' }, { key: 'all', label: '전체 누적' }] as const).map(({ key, label }) => (
              <button key={key} onClick={() => setSummaryView(key)} style={{
                padding: '7px 16px', borderRadius: 20, border: '1px solid',
                borderColor: summaryView === key ? '#6366f1' : '#e2e8f0',
                background: summaryView === key ? '#eff0ff' : 'white',
                color: summaryView === key ? '#6366f1' : '#64748b',
                fontWeight: summaryView === key ? 700 : 400,
                cursor: 'pointer', fontSize: 13,
              }}>{label}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 }}>
          {filteredStudents.map(student => {
            const allConfirmed = state.testRecords.filter(t => t.studentId === student.id && t.status === 'confirmed' && t.score !== null);
            const confirmed = summaryView === 'week'
              ? allConfirmed.filter(t => t.week === currentWeek)
              : allConfirmed;
            const avg = confirmed.length > 0
              ? Math.round(confirmed.reduce((s, t) => s + ((t.score! / t.maxScore) * 100), 0) / confirmed.length)
              : null;
            const allAvg = allConfirmed.length > 0
              ? Math.round(allConfirmed.reduce((s, t) => s + ((t.score! / t.maxScore) * 100), 0) / allConfirmed.length)
              : null;
            return (
              <div key={student.id} className="card" onClick={() => setDetailStudent(student)}
                style={{ textAlign: 'center', padding: 16, cursor: 'pointer', transition: 'box-shadow 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(99,102,241,0.15)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = '')}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#1e40af', margin: '0 auto 8px' }}>
                  {student.name[0]}
                </div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#6366f1', textDecoration: 'underline', textUnderlineOffset: 3 }}>{student.name}</div>
                <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8, color: avg !== null ? getScoreColor(avg, 100) : '#94a3b8' }}>
                  {avg !== null ? `${avg}%` : '-'}
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>{summaryView === 'week' ? '이번 주' : '전체'} {confirmed.length}회</div>
                {summaryView === 'week' && allConfirmed.length > confirmed.length && (
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                    전체 평균 {allAvg !== null ? `${allAvg}%` : '-'} ({allConfirmed.length}회)
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {showAdd && <AddTestModal onSave={addTest} onClose={() => setShowAdd(false)} />}
      {confirmRecord && <ScoreConfirmModal record={confirmRecord} onConfirm={confirmTest} onClose={() => setConfirmRecord(null)} />}
      {editRecord && <EditTestModal record={editRecord} onSave={updateTest} onClose={() => setEditRecord(null)} />}
      {detailStudent && (
        <StudentScoreModal
          student={detailStudent}
          records={state.testRecords.filter(t => t.studentId === detailStudent.id)}
          onClose={() => setDetailStudent(null)}
        />
      )}
    </div>
  );
}
