'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useStore } from '@/lib/store';
import { DayHomework, HomeworkDay } from '@/lib/types';
import { getWeekKey } from '@/lib/utils';
import { Send, CheckCircle, Clock, XCircle, Monitor, BookOpen, Type, AlignLeft } from 'lucide-react';

const DAYS: { key: HomeworkDay; label: string }[] = [
  { key: 'mon', label: '월' }, { key: 'tue', label: '화' },
  { key: 'wed', label: '수' }, { key: 'thu', label: '목' }, { key: 'fri', label: '금' },
];

const CATS = [
  { key: 'computer', label: '컴퓨터', icon: Monitor, color: '#6366f1', placeholder: '예) 단어 앱 20분, EBS 강의 1강' },
  { key: 'textbook', label: '교재', icon: BookOpen, color: '#3b82f6', placeholder: '예) p.45-47 문제 풀기' },
  { key: 'vocabulary', label: '단어', icon: Type, color: '#22c55e', placeholder: '예) 20개 암기 완료' },
  { key: 'other', label: '기타', icon: AlignLeft, color: '#f59e0b', placeholder: '예) 작문 3문장, 받아쓰기' },
] as const;

type CatKey = 'computer' | 'textbook' | 'vocabulary' | 'other';

export default function StudentHomeworkPage() {
  const params = useParams();
  const id = params.id as string;
  const { state, dispatch } = useStore();

  const student = state.students.find(s => s.id === id);
  const week = getWeekKey();

  const todayDay = (): HomeworkDay => {
    const d = new Date().getDay();
    const map: Record<number, HomeworkDay> = { 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri' };
    return map[d] || 'mon';
  };

  const [activeDay, setActiveDay] = useState<HomeworkDay>(todayDay());
  const [form, setForm] = useState<Record<CatKey, string>>({ computer: '', textbook: '', vocabulary: '', other: '' });
  const [submitted, setSubmitted] = useState(false);

  const existing = state.dayHomeworks.find(h => h.studentId === id && h.week === week && h.day === activeDay);
  const weekHomeworks = DAYS.map(d => ({
    day: d.key,
    label: d.label,
    record: state.dayHomeworks.find(h => h.studentId === id && h.week === week && h.day === d.key),
  }));

  const handleChange = (cat: CatKey, val: string) => setForm(f => ({ ...f, [cat]: val }));

  const submit = () => {
    const hasContent = Object.values(form).some(v => v.trim());
    if (!hasContent) return alert('최소 한 가지 항목을 입력해주세요');

    if (existing && existing.status !== 'rejected') return;

    const record: DayHomework = {
      id: existing?.id || `h${Date.now()}`,
      studentId: id,
      studentName: student?.name || '',
      week,
      day: activeDay,
      ...form,
      submittedAt: new Date().toISOString(),
      status: 'pending',
    };

    if (existing) {
      dispatch({ type: 'UPDATE_HOMEWORK', payload: record });
    } else {
      dispatch({ type: 'ADD_HOMEWORK', payload: record });
    }
    setSubmitted(true);
    setForm({ computer: '', textbook: '', vocabulary: '', other: '' });
  };

  const loadForm = (day: HomeworkDay) => {
    setActiveDay(day);
    setSubmitted(false);
    const rec = state.dayHomeworks.find(h => h.studentId === id && h.week === week && h.day === day);
    if (rec) {
      setForm({ computer: rec.computer, textbook: rec.textbook, vocabulary: rec.vocabulary, other: rec.other });
    } else {
      setForm({ computer: '', textbook: '', vocabulary: '', other: '' });
    }
  };

  const canSubmit = !existing || existing.status === 'rejected';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* 이번 주 요일 탭 */}
      <div style={{ background: 'white', borderRadius: 20, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', marginBottom: 12 }}>이번 주 숙제 현황</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {weekHomeworks.map(({ day, label, record }) => {
            const isActive = activeDay === day;
            const statusBg = record?.status === 'approved' ? '#d1fae5' : record?.status === 'pending' ? '#fef3c7' : record?.status === 'rejected' ? '#fee2e2' : '#f1f5f9';
            const statusColor = record?.status === 'approved' ? '#15803d' : record?.status === 'pending' ? '#92400e' : record?.status === 'rejected' ? '#991b1b' : '#94a3b8';
            return (
              <button key={day} onClick={() => loadForm(day)} style={{
                flex: 1, padding: '10px 4px', borderRadius: 12, border: '2px solid',
                borderColor: isActive ? '#6366f1' : 'transparent',
                background: isActive ? '#eff0ff' : statusBg,
                cursor: 'pointer', textAlign: 'center',
              }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: isActive ? '#6366f1' : statusColor }}>{label}</div>
                <div style={{ fontSize: 10, marginTop: 3 }}>
                  {record?.status === 'approved' ? '✅' : record?.status === 'pending' ? '⏳' : record?.status === 'rejected' ? '❌' : '✏️'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 숙제 입력 폼 */}
      <div style={{ background: 'white', borderRadius: 20, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <div style={{ background: '#dbeafe', borderRadius: 10, padding: 8 }}>
            <BookOpen size={18} color="#3b82f6" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>
              {DAYS.find(d => d.key === activeDay)?.label}요일 숙제
            </h2>
          </div>
        </div>

        {/* 기존 기록 상태 */}
        {existing && (
          <div style={{
            borderRadius: 12, padding: 12, marginBottom: 16,
            background: existing.status === 'approved' ? '#f0fdf4' : existing.status === 'pending' ? '#fffbeb' : '#fef2f2',
            border: `1px solid ${existing.status === 'approved' ? '#bbf7d0' : existing.status === 'pending' ? '#fde68a' : '#fecaca'}`,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            {existing.status === 'approved' ? <CheckCircle size={18} color="#16a34a" />
              : existing.status === 'pending' ? <Clock size={18} color="#d97706" />
              : <XCircle size={18} color="#dc2626" />}
            <div style={{ fontSize: 14, fontWeight: 700, color: existing.status === 'approved' ? '#15803d' : existing.status === 'pending' ? '#92400e' : '#991b1b' }}>
              {existing.status === 'approved' ? '선생님이 승인했어요! 🎉' : existing.status === 'pending' ? '선생님이 확인 중이에요 ⏳' : '반려됨 - 다시 작성해주세요'}
            </div>
          </div>
        )}

        {submitted && !existing && (
          <div style={{ borderRadius: 12, padding: 12, marginBottom: 16, background: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle size={18} color="#16a34a" />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#15803d' }}>제출 완료! 선생님이 확인할 거예요 😊</span>
          </div>
        )}

        {/* 카테고리별 입력 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {CATS.map(({ key, label, icon: Icon, color, placeholder }) => (
            <div key={key} style={{ borderRadius: 12, border: `1.5px solid ${canSubmit ? '#e2e8f0' : '#f1f5f9'}`, overflow: 'hidden' }}>
              <div style={{ padding: '8px 14px', background: color + '10', display: 'flex', alignItems: 'center', gap: 7 }}>
                <Icon size={14} color={color} />
                <span style={{ fontSize: 12, fontWeight: 700, color }}>{label}</span>
              </div>
              {canSubmit ? (
                <textarea
                  value={form[key]}
                  onChange={e => handleChange(key, e.target.value)}
                  rows={2}
                  placeholder={placeholder}
                  style={{ borderRadius: 0, border: 'none', fontSize: 14, padding: '10px 14px', resize: 'none', borderTop: '1px solid #f1f5f9' }}
                />
              ) : (
                <div style={{ padding: '10px 14px', fontSize: 14, color: existing?.[key] ? '#374151' : '#cbd5e1', lineHeight: 1.6, minHeight: 44 }}>
                  {existing?.[key] || '미입력'}
                </div>
              )}
            </div>
          ))}
        </div>

        {canSubmit && (
          <button onClick={submit} style={{
            width: '100%', marginTop: 16, padding: '15px', borderRadius: 12, border: 'none',
            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
            color: 'white', fontWeight: 800, fontSize: 16, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <Send size={18} /> {DAYS.find(d => d.key === activeDay)?.label}요일 숙제 제출
          </button>
        )}
      </div>
    </div>
  );
}
