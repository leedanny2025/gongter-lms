'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useStore } from '@/lib/store';
import { DayHomework, HomeworkDay, HomeworkStatus } from '@/lib/types';
import { getWeekKey, getWeekDateRange, getDayFromDate } from '@/lib/utils';
import { Plus, CheckCircle, X, Pencil, Check } from 'lucide-react';
import WeekSelector from '@/components/WeekSelector';

const KO_DAY = ['일', '월', '화', '수', '목', '금', '토'];

function DatePicker({ value, onChange, bg = '#f5f3ff', border = '#a5b4fc', label = '숙제 완료 예정일 (선택)' }: {
  value: string;
  onChange: (v: string) => void;
  bg?: string;
  border?: string;
  label?: string;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const options: Date[] = [];
  for (let i = 0; i <= 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    options.push(d);
  }
  const toVal = (d: Date) => d.toISOString().slice(0, 10);
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 90);
  const minVal = toVal(today);
  const maxVal = toVal(maxDate);
  return (
    <div style={{ background: bg, borderRadius: 12, padding: '12px 14px', border: `1px solid ${border}` }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 10 }}>📅 {label}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <input
          type="date"
          value={value}
          min={minVal}
          max={maxVal}
          onChange={e => onChange(e.target.value)}
          style={{
            width: '100%', padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${value ? '#6366f1' : '#e2e8f0'}`,
            background: 'white', color: '#111827', fontSize: 13, outline: 'none', cursor: 'pointer',
          }}
        />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {options.map((d, i) => {
            const val = toVal(d);
            const selected = value === val;
            const label2 = i === 0 ? '오늘' : i === 1 ? '내일' : `${d.getMonth()+1}/${d.getDate()}`;
            const dayName = KO_DAY[d.getDay()];
            return (
              <button key={val} onClick={() => onChange(selected ? '' : val)} style={{
                padding: '5px 10px', borderRadius: 8, border: '1.5px solid',
                borderColor: selected ? '#6366f1' : '#e2e8f0',
                background: selected ? '#eff0ff' : 'white',
                color: selected ? '#6366f1' : '#374151',
                fontWeight: selected ? 800 : 400, fontSize: 12,
                cursor: 'pointer', minHeight: 'unset', lineHeight: 1.4,
              }}>
                <div>{label2}</div>
                <div style={{ fontSize: 10, opacity: 0.7 }}>{dayName}요일</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const DAYS: { key: HomeworkDay; label: string }[] = [
  { key: 'mon', label: '월' }, { key: 'tue', label: '화' },
  { key: 'wed', label: '수' }, { key: 'thu', label: '목' }, { key: 'fri', label: '금' },
];

const CATS = [
  { key: 'computer',   label: '컴퓨터', color: '#6366f1', bg: '#eff0ff', subs: ['time', 'e-library', '기타'] },
  { key: 'textbook',   label: '교재',   color: '#3b82f6', bg: '#dbeafe', subs: ['time'] },
  { key: 'vocabulary', label: '단어',   color: '#22c55e', bg: '#dcfce7', subs: ['power voca', '보카 챌린지'] },
  { key: 'other',      label: '문법',   color: '#7c3aed', bg: '#f3e8ff', subs: ['문법이 쓰기다 1', '문법이 쓰기다 2', '문법이 쓰기다 기본 3', '기타'] },
] as const;

type CatKey = 'computer' | 'textbook' | 'vocabulary' | 'other';

const CAT_MAP = Object.fromEntries(CATS.map(c => [c.key, c])) as Record<CatKey, typeof CATS[number]>;

const STATUS_EMOJI: Record<HomeworkStatus, string> = {
  pending: '⏳', agreed: '📋', submitted: '🔄', confirmed: '✅', approved: '✅', rejected: '❌', missed: '❌', no_hw: '📭',
};

const TOUCH = {
  touchAction: 'manipulation' as const,
  WebkitTapHighlightColor: 'transparent',
  userSelect: 'none' as const,
};

type Item = { uid: string; cat: CatKey; text: string };

const hwToItems = (rec: DayHomework): Item[] => {
  const out: Item[] = [];
  let i = 0;
  (['computer', 'textbook', 'vocabulary', 'other'] as CatKey[]).forEach(cat => {
    const val = rec[cat];
    if (val) val.split('\n').filter(Boolean).forEach(t => out.push({ uid: `${rec.id}:${cat}:${i++}`, cat, text: t }));
  });
  return out;
};

const noteToItems = (note?: string, recId?: string): Item[] => {
  if (!note) return [];
  return note.split('|').filter(Boolean).flatMap((part, idx) => {
    const ci = part.indexOf(':');
    if (ci < 0) return [];
    return [{ uid: `${recId || 'note'}:${idx}`, cat: part.slice(0, ci) as CatKey, text: part.slice(ci + 1) }];
  });
};

const mkItem = (cat: CatKey, text: string): Item => ({ uid: `new:${cat}:${Date.now()}:${Math.random()}`, cat, text });

function ItemInput({ cat, setCat, sub, setSub, text, setText, onAdd }: {
  cat: CatKey; setCat: (c: CatKey) => void;
  sub: string; setSub: (s: string) => void;
  text: string; setText: (s: string) => void;
  onAdd: () => void;
}) {
  const catObj = CAT_MAP[cat];
  const canAdd = !!(sub || text.trim());
  const handleKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && canAdd) { e.preventDefault(); onAdd(); } };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* ① 1차 범주 */}
      <div style={{ background: 'white', borderRadius: 14, padding: '13px 14px', border: '1.5px solid #e0e7ff' }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: '#6366f1', marginBottom: 9, letterSpacing: 0.3 }}>① 1차 범주</div>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {CATS.map(c => (
            <button key={c.key} onClick={() => { setCat(c.key); setSub(''); }} style={{
              padding: '9px 18px', borderRadius: 20, border: '2px solid',
              borderColor: cat === c.key ? c.color : '#e2e8f0',
              background: cat === c.key ? c.bg : '#f8fafc',
              color: cat === c.key ? c.color : '#94a3b8',
              fontWeight: cat === c.key ? 800 : 500, fontSize: 13, cursor: 'pointer', minHeight: 'unset',
              transition: 'all 0.12s',
              ...TOUCH,
            }}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* ② 2차 범주 */}
      <div style={{ background: catObj.bg, borderRadius: 14, padding: '13px 14px', border: `2px solid ${catObj.color}45` }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: catObj.color, marginBottom: 9, letterSpacing: 0.3 }}>
          ② 2차 범주 <span style={{ fontWeight: 500, opacity: 0.75 }}>· {catObj.label}</span>
        </div>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {catObj.subs.map((s: string) => {
            const selected = sub === s;
            return (
              <button key={s} onClick={() => setSub(selected ? '' : s)} style={{
                padding: '8px 15px', borderRadius: 20,
                border: `2px solid ${selected ? catObj.color : catObj.color + '45'}`,
                background: selected ? catObj.color : 'white',
                color: selected ? 'white' : catObj.color,
                fontWeight: selected ? 800 : 600, fontSize: 12, cursor: 'pointer', minHeight: 'unset',
                transition: 'all 0.12s',
                ...TOUCH,
              }}>
                {s}
              </button>
            );
          })}
        </div>
      </div>

      {/* ③ 3차 입력 */}
      <div style={{ background: 'white', borderRadius: 14, padding: '13px 14px', border: `1.5px solid ${catObj.color}40` }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: catObj.color, marginBottom: 9, letterSpacing: 0.3 }}>
          ③ 3차 입력 <span style={{ fontWeight: 400, color: '#94a3b8' }}>(직접 입력 · 선택)</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {sub && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0 11px', height: 44, borderRadius: 10, background: catObj.bg, border: `1.5px solid ${catObj.color}40`, flexShrink: 0 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: catObj.color, whiteSpace: 'nowrap' }}>{sub}</span>
            </div>
          )}
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKey}
            placeholder={sub ? '추가 내용 입력 (선택)...' : `${catObj.label} 내용을 직접 입력하세요`}
            style={{
              flex: 1, border: `1.5px solid ${catObj.color}50`, borderRadius: 10,
              outline: 'none', fontSize: 14, padding: '10px 12px', background: 'white', minWidth: 0,
            }}
          />
          <button onClick={onAdd} disabled={!canAdd} style={{
            width: 44, height: 44, borderRadius: 10, border: 'none', flexShrink: 0,
            background: canAdd ? catObj.color : '#e2e8f0',
            color: canAdd ? 'white' : '#94a3b8',
            cursor: canAdd ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'unset',
            ...TOUCH,
          }}>
            <Plus size={18} />
          </button>
        </div>
      </div>

    </div>
  );
}

function ItemList({ items, onRemove, onEdit }: {
  items: Item[];
  onRemove?: (uid: string) => void;
  onEdit?: (uid: string, text: string) => void;
}) {
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  if (items.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
      {items.map(item => {
        const c = CAT_MAP[item.cat];
        const isEditing = editingUid === item.uid;
        return (
          <div key={item.uid} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10, background: c.bg, border: `1px solid ${c.color}30` }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: c.color, minWidth: 46, whiteSpace: 'nowrap' }}>{c.label}</span>
            <div style={{ width: 1, height: 14, background: c.color + '40', flexShrink: 0 }} />
            {isEditing ? (
              <>
                <input
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') { onEdit?.(item.uid, editText); setEditingUid(null); }
                    if (e.key === 'Escape') setEditingUid(null);
                  }}
                  style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, background: 'transparent', padding: '2px 0' }}
                  autoFocus
                />
                <button
                  onClick={() => { onEdit?.(item.uid, editText); setEditingUid(null); }}
                  style={{ width: 22, height: 22, borderRadius: '50%', border: 'none', cursor: 'pointer', background: c.color + '20', color: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'unset', flexShrink: 0, ...TOUCH }}
                >
                  <Check size={12} />
                </button>
                <button
                  onClick={() => setEditingUid(null)}
                  style={{ width: 22, height: 22, borderRadius: '50%', border: 'none', cursor: 'pointer', background: '#e2e8f020', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'unset', flexShrink: 0, ...TOUCH }}
                >
                  <X size={12} />
                </button>
              </>
            ) : (
              <>
                <span style={{ flex: 1, fontSize: 13, color: '#374151' }}>{item.text}</span>
                {onEdit && (
                  <button
                    onClick={() => { setEditingUid(item.uid); setEditText(item.text); }}
                    style={{ width: 22, height: 22, borderRadius: '50%', border: 'none', cursor: 'pointer', background: c.color + '15', color: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'unset', flexShrink: 0, ...TOUCH }}
                  >
                    <Pencil size={11} />
                  </button>
                )}
                {onRemove && (
                  <button
                    onClick={() => onRemove(item.uid)}
                    style={{ width: 22, height: 22, borderRadius: '50%', border: 'none', cursor: 'pointer', background: c.color + '20', color: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'unset', flexShrink: 0, ...TOUCH }}
                  >
                    <X size={12} />
                  </button>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function StudentHomeworkPage() {
  const params = useParams();
  const id = params.id as string;
  const { state, dispatch } = useStore();
  const student = state.students.find(s => s.id === id);
  const [selectedWeek, setSelectedWeek] = useState(getWeekKey());
  const week = selectedWeek;

  const todayDay = (): HomeworkDay => {
    const d = new Date().getDay();
    const map: Record<number, HomeworkDay> = { 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri' };
    return map[d] || 'mon';
  };

  const [activeDay, setActiveDay] = useState<HomeworkDay>(todayDay());
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [uncheckedUids, setUncheckedUids] = useState<Set<string>>(new Set());

  const [expectedDate, setExpectedDate] = useState('');

  const [rangeCat, setRangeCat] = useState<CatKey>('computer');
  const [rangeSub, setRangeSub] = useState('');
  const [rangeText, setRangeText] = useState('');
  const [rangeItems, setRangeItems] = useState<Item[]>([]);

  const weekHomeworks = DAYS.map(d => ({
    day: d.key, label: d.label,
    record: state.dayHomeworks.find(h => h.studentId === id && h.week === week && h.day === d.key),
  }));

  const existing = state.dayHomeworks.find(h => h.studentId === id && h.week === week && h.day === activeDay);
  const canEditRange = !existing || isEditing;
  const phase2Active = !!existing && ['agreed', 'submitted', 'confirmed', 'approved'].includes(existing.status);

  const displayItems: Item[] = canEditRange ? rangeItems : (existing ? hwToItems(existing) : []);

  const wkSubmitted = weekHomeworks.filter(w => w.record && ['submitted', 'confirmed', 'approved'].includes(w.record.status)).length;
  const wkDone      = weekHomeworks.filter(w => w.record && ['confirmed', 'approved'].includes(w.record.status)).length;
  const wkNotYet    = weekHomeworks.filter(w => !w.record || ['pending', 'agreed', 'rejected'].includes(w.record.status)).length;

  const loadForm = (day: HomeworkDay) => {
    setActiveDay(day);
    setJustSubmitted(false);
    setIsEditing(false);
    setUncheckedUids(new Set());
    setRangeSub('');
    setRangeText('');
    const rec = state.dayHomeworks.find(h => h.studentId === id && h.week === week && h.day === day);
    setExpectedDate(rec?.expectedSubmitDate || '');
    setRangeItems(rec && (rec.status === 'pending' || rec.status === 'rejected') ? hwToItems(rec) : []);
  };

  const startEditing = () => {
    if (existing) {
      setRangeItems(hwToItems(existing));
      setExpectedDate(existing.expectedSubmitDate || '');
    }
    setIsEditing(true);
  };

  const addRange = () => {
    const combined = [rangeSub, rangeText.trim()].filter(Boolean).join(' ');
    if (!combined) return;
    setRangeItems(p => [...p, mkItem(rangeCat, combined)]);
    setRangeText('');
    // 2차 선택 유지 (같은 범주 연속 추가 편의)
  };

  const editRange = (uid: string, text: string) => {
    setRangeItems(p => p.map(i => i.uid === uid ? { ...i, text } : i));
  };

  const submitRange = () => {
    if (rangeItems.length === 0) { alert('항목을 하나 이상 추가해주세요'); return; }
    const get = (cat: CatKey) => rangeItems.filter(i => i.cat === cat).map(i => i.text).join('\n');
    const record: DayHomework = {
      id: existing?.id || `h${Date.now()}`,
      studentId: id, studentName: student?.name || '', week, day: activeDay,
      computer: get('computer'), textbook: get('textbook'),
      vocabulary: get('vocabulary'), other: get('other'),
      submittedAt: new Date().toISOString(), status: 'pending',
      expectedSubmitDate: expectedDate || undefined,
    };
    existing ? dispatch({ type: 'UPDATE_HOMEWORK', payload: record }) : dispatch({ type: 'ADD_HOMEWORK', payload: record });
    setIsEditing(false);
    setJustSubmitted(true);
    setTimeout(() => setJustSubmitted(false), 2500);
  };

  const toggleCheck = (uid: string) => {
    setUncheckedUids(prev => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid); else next.add(uid);
      return next;
    });
  };

  const submitDone = () => {
    if (!existing || existing.status !== 'agreed') return;
    const checkedItems = hwToItems(existing).filter(i => !uncheckedUids.has(i.uid));
    if (checkedItems.length === 0) return;
    const note = checkedItems.map(i => `${i.cat}:${i.text}`).join('|');
    dispatch({ type: 'COMPLETE_HOMEWORK', payload: { id: existing.id, note, expectedSubmitDate: expectedDate || undefined } });
    setUncheckedUids(new Set());
  };

  const formatDateLabel = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const formatExpectedLabel = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `- 완료 예정일 - ${d.getMonth() + 1}/${d.getDate()} (${KO_DAY[d.getDay()]}요일)`;
  };

  const isExpectedDateToday = (dateStr?: string) => {
    if (!dateStr) return false;
    const expected = new Date(dateStr);
    expected.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return expected.getTime() === today.getTime();
  };

  const isExpectedDatePast = (dateStr?: string) => {
    if (!dateStr) return false;
    const expected = new Date(dateStr);
    expected.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return expected.getTime() < today.getTime();
  };

  const dayLabel = DAYS.find(d => d.key === activeDay)?.label;
  const selectedExpectedDate = expectedDate || existing?.expectedSubmitDate;
  const canSubmitDone = existing?.status === 'agreed' && selectedExpectedDate && (isExpectedDateToday(selectedExpectedDate) || isExpectedDatePast(selectedExpectedDate));
  const pendingExpectedHomeworks = weekHomeworks.filter(w => w.record?.expectedSubmitDate && !['confirmed', 'approved'].includes(w.record.status));
  const rangeBadge = !existing ? null
    : existing.status === 'pending'  ? { text: '⏳ 확인 대기', bg: '#fef3c7', color: '#92400e' }
    : existing.status === 'rejected' ? { text: '❌ 반려됨',    bg: '#fee2e2', color: '#991b1b' }
    : { text: '✅ 범위 확인',  bg: '#d1fae5', color: '#15803d' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* 주 선택 */}
      <WeekSelector week={selectedWeek} onChange={setSelectedWeek} />

      {/* ── 요일 탭 ── */}
      <div style={{ background: 'white', borderRadius: 20, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 10 }}>요일 선택</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {weekHomeworks.map(({ day, label, record }) => {
            const isActive = activeDay === day;
            const s = record?.status;
            const isDone  = s === 'confirmed' || s === 'approved';
            const isSent  = s === 'submitted';
            const isReady = s === 'agreed';
            const isWait  = s === 'pending';
            const isRej   = s === 'rejected';

            const dotColor = isDone ? '#22c55e' : isSent ? '#3b82f6' : isReady ? '#6366f1'
              : isWait ? '#f59e0b' : isRej ? '#ef4444' : '#e2e8f0';
            const tabBg = isActive ? '#eff0ff'
              : isDone ? '#f0fdf4' : isSent ? '#eff6ff' : isRej ? '#fef2f2'
              : isWait || isReady ? '#fffbeb' : '#f8fafc';
            const tabLabel = isDone ? '완료' : isSent ? '제출' : isReady ? '대기' : isWait ? '확인중' : isRej ? '반려' : '미제출';
            const labelColor = isActive ? '#6366f1' : isDone ? '#15803d' : isSent ? '#1e40af'
              : isRej ? '#991b1b' : isWait || isReady ? '#92400e' : '#94a3b8';

            return (
              <button key={day} onClick={() => loadForm(day)} style={{
                flex: 1, padding: '10px 4px', borderRadius: 14, border: '2px solid',
                borderColor: isActive ? '#6366f1' : dotColor + '60',
                background: tabBg,
                cursor: 'pointer', textAlign: 'center', minHeight: 'unset', ...TOUCH,
              }}>
                <div style={{ fontSize: 18, lineHeight: 1.2 }}>{record ? STATUS_EMOJI[record.status] : '✏️'}</div>
                <div style={{ fontSize: 13, fontWeight: 900, color: isActive ? '#6366f1' : '#1e293b', marginTop: 3 }}>{label}</div>
                <div style={{ fontSize: 9, fontWeight: 700, color: labelColor, marginTop: 2 }}>{tabLabel}</div>
                {record?.expectedSubmitDate && (
                  <div style={{ fontSize: 8, color: '#64748b', marginTop: 2 }}>{formatExpectedLabel(record.expectedSubmitDate)}</div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 주간 현황 ── */}
      <div style={{ background: 'white', borderRadius: 20, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8' }}>이번 주 숙제 현황</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: wkDone >= 5 ? '#15803d' : '#6366f1' }}>
            {wkSubmitted}일 제출 / 5일
          </div>
        </div>
        <div style={{ height: 8, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden', marginBottom: 12 }}>
          <div style={{
            height: '100%', borderRadius: 99,
            width: `${(wkSubmitted / 5) * 100}%`,
            background: wkDone === wkSubmitted && wkDone > 0
              ? 'linear-gradient(90deg, #22c55e, #16a34a)'
              : 'linear-gradient(90deg, #6366f1, #22c55e)',
            transition: 'width 0.4s ease',
          }} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { label: '제출 완료', count: wkDone,              color: '#15803d', bg: '#dcfce7' },
            { label: '확인 중',   count: wkSubmitted - wkDone, color: '#1e40af', bg: '#dbeafe' },
            { label: '미제출',    count: wkNotYet,             color: '#64748b', bg: '#f1f5f9' },
          ].map(({ label, count, color, bg }) => (
            <div key={label} style={{ flex: 1, textAlign: 'center', background: bg, borderRadius: 10, padding: '10px 4px' }}>
              <div style={{ fontSize: 20, fontWeight: 900, color }}>{count}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color, marginTop: 3 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {pendingExpectedHomeworks.length > 0 && (
        <div style={{ background: 'white', borderRadius: 20, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 12, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎯</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0f766e' }}>완료 예정 숙제</div>
              <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>완료 예정일이 등록된 숙제입니다.</div>
            </div>
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {pendingExpectedHomeworks.map(({ day, label, record }) => {
              const expectedDay = getDayFromDate(record!.expectedSubmitDate!);
              const dueToday = expectedDay === activeDay;
              return (
                <div key={day} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 14px', borderRadius: 16, background: dueToday ? '#ecfdf5' : '#f8fafc', border: `1px solid ${dueToday ? '#6ee7b7' : '#e2e8f0'}` }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{label}요일 · {record?.status === 'agreed' ? '확정 범위' : '진행 중'}</div>
                    <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>{formatExpectedLabel(record!.expectedSubmitDate)}</div>
                  </div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 999, background: dueToday ? '#22c55e' : '#e2e8f0', color: dueToday ? 'white' : '#475569', fontSize: 11, fontWeight: 700, border: dueToday ? 'none' : '1px solid #cbd5e1' }}>
                    {dueToday ? '✅ 오늘 예정' : '⏳ 예정'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 토스트 ── */}
      {justSubmitted && (
        <div style={{ borderRadius: 16, padding: 14, background: '#f0fdf4', border: '1.5px solid #86efac', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>🎉</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#15803d' }}>범위 제출 완료!</div>
            <div style={{ fontSize: 12, color: '#16a34a', marginTop: 2 }}>선생님 확인을 기다려주세요</div>
          </div>
        </div>
      )}

      {/* ── ① 숙제 범위 카드 ── */}
      <div style={{ background: '#f5f3ff', borderRadius: 20, padding: 20, boxShadow: '0 2px 8px rgba(99,102,241,0.08)', border: '1.5px solid #e0e7ff' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📝</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#3730a3' }}>숙제 범위</div>
              <div style={{ fontSize: 11, color: '#6366f1', marginTop: 1 }}>{dayLabel}요일</div>
            </div>
          </div>
          {rangeBadge && (
            <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: rangeBadge.bg, color: rangeBadge.color }}>
              {rangeBadge.text}
            </span>
          )}
        </div>

        {canEditRange ? (
          <>
            <ItemInput cat={rangeCat} setCat={c => { setRangeCat(c); setRangeSub(''); }} sub={rangeSub} setSub={setRangeSub} text={rangeText} setText={setRangeText} onAdd={addRange} />
            <ItemList items={rangeItems} onRemove={(uid) => setRangeItems(p => p.filter(i => i.uid !== uid))} onEdit={editRange} />
            {rangeItems.length > 0 && (
              <>
                <div style={{ marginTop: 14 }}>
                  <DatePicker value={expectedDate} onChange={setExpectedDate} bg="#f5f3ff" border="#c7d2fe" />
                </div>
                <button onClick={submitRange} style={{
                  width: '100%', marginTop: 10, padding: '13px', borderRadius: 12, border: 'none',
                  background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  color: 'white', fontWeight: 800, fontSize: 15, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 'unset', ...TOUCH,
                }}>
                  숙제 범위 확인 요청
                </button>
              </>
            )}
          </>
        ) : (
          <>
            <ItemList items={hwToItems(existing!)} />
            {existing && (
              <button onClick={startEditing} style={{
                width: '100%', marginTop: 12, padding: '11px', borderRadius: 12, border: '1.5px solid #6366f1',
                background: 'white', color: '#6366f1', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 'unset', ...TOUCH,
              }}>
                ✏️ 재입력 / 수정
              </button>
            )}
          </>
        )}
      </div>

      {/* ── ② 숙제 제출 카드 ── */}
      <div style={{
        background: phase2Active ? '#f0fdf4' : '#f8fafc',
        borderRadius: 20, padding: 20, boxShadow: '0 2px 8px rgba(34,197,94,0.08)',
        border: `1.5px solid ${phase2Active ? '#bbf7d0' : '#e2e8f0'}`,
      }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: phase2Active ? '#22c55e' : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>✅</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: phase2Active ? '#15803d' : '#94a3b8' }}>숙제 제출</div>
              <div style={{ fontSize: 11, color: phase2Active ? '#16a34a' : '#94a3b8', marginTop: 1 }}>
                {existing?.status === 'agreed'
                  ? `${dayLabel}요일 · 완료한 항목을 체크하세요`
                  : phase2Active
                  ? `${dayLabel}요일 · 제출 완료`
                  : '범위 항목을 입력하면 여기에 표시돼요'}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 999, background: '#e0e7ff', color: '#1d4ed8', fontSize: 12, fontWeight: 700 }}>
                  📝 숙제 등록
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 999, background: selectedExpectedDate ? '#dcfce7' : '#f8fafc', color: selectedExpectedDate ? '#15803d' : '#475569', fontSize: 12, fontWeight: 700, border: selectedExpectedDate ? '1px solid #86efac' : '1px solid #e2e8f0' }}>
                  {selectedExpectedDate ? '📅 완료 예정 등록' : '📅 완료 예정 미등록'}
                </span>
              </div>
            </div>
          </div>
          {selectedExpectedDate && (
            <div style={{ marginRight: 12, fontSize: 12, fontWeight: 700, color: '#475569' }}>
              {formatExpectedLabel(selectedExpectedDate)}
            </div>
          )}
          {existing?.status === 'submitted' && (
            <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#dbeafe', color: '#1e40af' }}>🔄 확인 중</span>
          )}
          {(existing?.status === 'confirmed' || existing?.status === 'approved') && (
            <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#d1fae5', color: '#15803d' }}>✅ 완료</span>
          )}
        </div>

        {/* ── 항목 없음 ── */}
        {displayItems.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px 0', color: '#cbd5e1', fontSize: 13, fontWeight: 600 }}>
            위에서 숙제 범위를 입력하면 여기에 표시돼요
          </div>
        )}

        {/* ── agreed: 체크박스로 제출 ── */}
        {existing?.status === 'agreed' && displayItems.length > 0 && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#4338ca', marginBottom: 10 }}>
              📋 완료한 항목을 체크하고 제출하세요
            </div>
            {displayItems.map(item => {
              const c = CAT_MAP[item.cat];
              const checked = !uncheckedUids.has(item.uid);
              return (
                <div key={item.uid} onClick={() => toggleCheck(item.uid)} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px',
                  borderRadius: 12, border: `1.5px solid ${checked ? c.color : '#e2e8f0'}`,
                  background: checked ? c.bg : '#f8fafc',
                  cursor: 'pointer', marginBottom: 7, transition: 'all 0.15s',
                  ...TOUCH,
                }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    border: `2px solid ${checked ? c.color : '#d1d5db'}`,
                    background: checked ? c.color : 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}>
                    {checked && <CheckCircle size={13} color="white" />}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: checked ? c.color : '#94a3b8', minWidth: 46, whiteSpace: 'nowrap' }}>{c.label}</span>
                  <div style={{ width: 1, height: 14, background: (checked ? c.color : '#e2e8f0') + '60', flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 13, color: checked ? '#1e293b' : '#94a3b8', textDecoration: checked ? 'none' : 'line-through' }}>
                    {item.text}
                  </span>
                </div>
              );
            })}
            <div style={{ marginTop: 12 }}>
              <DatePicker value={expectedDate} onChange={setExpectedDate} bg="#f0fdf4" border="#bbf7d0" />
            </div>
            {(() => {
              const checkedCount = displayItems.filter(i => !uncheckedUids.has(i.uid)).length;
              const canSubmit = canSubmitDone && checkedCount > 0;
              const isDateMissing = !selectedExpectedDate;
              const isDateFuture = selectedExpectedDate && !isExpectedDateToday(selectedExpectedDate) && !isExpectedDatePast(selectedExpectedDate);

              return (
                <>
                  <button onClick={submitDone} disabled={!canSubmit} style={{
                    width: '100%', marginTop: 10, padding: '13px', borderRadius: 12, border: 'none',
                    background: canSubmit ? 'linear-gradient(135deg, #22c55e, #16a34a)' : '#e2e8f0',
                    color: canSubmit ? 'white' : '#94a3b8',
                    fontWeight: 800, fontSize: 15, cursor: canSubmit ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 'unset', ...TOUCH,
                  }}>
                    <CheckCircle size={18} />
                    숙제 완료 제출 {checkedCount > 0 ? `(${checkedCount}개)` : ''}
                  </button>
                  {isDateMissing && (
                    <div style={{ marginTop: 8, padding: '10px 14px', borderRadius: 10, background: '#fef3c7', fontSize: 12, fontWeight: 600, color: '#92400e', textAlign: 'center' }}>
                      📅 완료 예정일을 먼저 설정해주세요
                    </div>
                  )}
                  {isDateFuture && (
                    <div style={{ marginTop: 8, padding: '10px 14px', borderRadius: 10, background: '#fef3c7', fontSize: 12, fontWeight: 600, color: '#92400e', textAlign: 'center' }}>
                      ⏳ 예정일에만 제출할 수 있습니다
                    </div>
                  )}
                </>
              );
            })()}
          </>
        )}

        {/* ── pending / rejected / 미입력: 읽기 전용 미리보기 ── */}
        {!phase2Active && displayItems.length > 0 && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#92400e', marginBottom: 8 }}>
              {existing ? '📋 합의 대기 중인 범위' : '📋 입력 중인 범위'}
            </div>
            <ItemList items={displayItems} />
            {existing?.status === 'pending' && (
              <div style={{ marginTop: 12, borderRadius: 10, padding: '10px 14px', background: '#fef3c7', fontSize: 12, fontWeight: 600, color: '#92400e', textAlign: 'center' }}>
                ⏳ 선생님이 범위를 확인하면 제출할 수 있어요
              </div>
            )}
          </>
        )}

        {/* ── submitted / confirmed / approved: 결과 표시 ── */}
        {phase2Active && existing?.status !== 'agreed' && (
          <>
            {existing?.status === 'submitted' && (
              <div style={{ borderRadius: 12, padding: 12, background: '#dbeafe', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 20 }}>🔄</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#1e40af' }}>선생님 확인 중이에요</div>
                </div>
              </div>
            )}
            {(existing?.status === 'confirmed' || existing?.status === 'approved') && (
              <div style={{ borderRadius: 12, padding: 12, background: '#d1fae5', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 20 }}>🎉</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#15803d' }}>완료 확인됐어요!</div>
                </div>
              </div>
            )}
            {displayItems.length > 0 && (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', marginBottom: 6 }}>📋 합의된 숙제 범위</div>
                <ItemList items={displayItems} />
              </>
            )}
            {(() => {
              const noteItems = existing?.note ? noteToItems(existing.note, existing.id) : [];
              if (noteItems.length === 0) return null;
              const sameAsRange =
                noteItems.length === displayItems.length &&
                noteItems.map(i => `${i.cat}:${i.text}`).sort().join('|') ===
                displayItems.map(i => `${i.cat}:${i.text}`).sort().join('|');
              if (sameAsRange) return null;
              return (
                <>
                  <div style={{ height: 1, background: '#e2e8f0', margin: '12px 0' }} />
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#22c55e', marginBottom: 6 }}>✅ 제출한 내용</div>
                  <ItemList items={noteItems} />
                </>
              );
            })()}
          </>
        )}
      </div>

    </div>
  );
}
