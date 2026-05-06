'use client';

import { useState, useMemo, useRef } from 'react';
import { useStore } from '@/lib/store';
import { getWeekKey, getWeekDateRange, getPrevWeek, getNextWeek, DAY_LABELS, DAY_ORDER } from '@/lib/utils';
import { StudentReport } from '@/lib/types';
import { ChevronLeft, ChevronRight, Save, User, Download, Eye, EyeOff } from 'lucide-react';

function weekOfDate(dateStr: string): string {
  return getWeekKey(new Date(dateStr + 'T12:00:00'));
}

function getWeeksInMonth(monthKey: string): string[] {
  const [y, m] = monthKey.split('-').map(Number);
  const weeks = new Set<string>();
  const d = new Date(y, m - 1, 1);
  while (d.getMonth() === m - 1) { weeks.add(getWeekKey(new Date(d))); d.setDate(d.getDate() + 1); }
  return Array.from(weeks);
}

function recentMonths(n = 12): string[] {
  const out: string[] = [];
  const d = new Date();
  for (let i = 0; i < n; i++) {
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    d.setMonth(d.getMonth() - 1);
  }
  return out;
}

function monthLabel(mk: string): string {
  const [y, m] = mk.split('-');
  return `${y}년 ${Number(m)}월`;
}

function scoreGrade(pct: number): string {
  if (pct >= 90) return 'A';
  if (pct >= 80) return 'B';
  if (pct >= 70) return 'C';
  if (pct >= 60) return 'D';
  return 'F';
}

const HW_STATUS: Record<string, string> = {
  confirmed: '완료', approved: '완료', missed: '미이행',
  pending: '합의대기', agreed: '진행중', submitted: '확인대기',
  rejected: '미완료', none: '미제출', no_hw: '숙제없음',
};
const ATT_STATUS: Record<string, string> = {
  present: '출석', late: '지각', absent: '결석', none: '–',
};
const CAT_KO: Record<string, string> = {
  computer: '컴퓨터', textbook: '교재', vocabulary: '단어', other: '문법',
};

type Sections = { attendance: boolean; homework: boolean; tests: boolean; attitude: boolean; memo: boolean };

const SECTION_LABELS: { key: keyof Sections; label: string }[] = [
  { key: 'attendance', label: '출석' },
  { key: 'homework',   label: '숙제' },
  { key: 'tests',      label: '시험' },
  { key: 'attitude',   label: '태도' },
  { key: 'memo',       label: '메모' },
];

/* ─── 공식 PDF 레이아웃 ─────────────────────────────────────── */
function PrintReport({ student, periodLabel, isMonthly, dateRange, sections, reportData }: {
  student: { name: string; classGroup: string; grade: string };
  periodLabel: string;
  isMonthly: boolean;
  dateRange: string;
  sections: Sections;
  reportData: {
    attRecs: { day: string; status: string; checkInTime?: string; reason?: string }[];
    hwRecs: { day: string; status: string; cats: string[] }[];
    testRecs: { subject: string; score: number | null; maxScore: number; status: string }[];
    attitudeNet: number; totalPositive: number; totalNegative: number;
    teacherNotes: string; teacherRequests: string;
    scheduledDays: string[];
    weekRows?: { wLabel: string; present: number; scheduled: number; hwDone: number; hwTotal: number; avgScore: number | null; net: number }[];
  };
}) {
  const navy = '#0f2a52';
  const rule = { borderCollapse: 'collapse' as const, width: '100%', fontSize: 10 };
  const th = { padding: '5px 8px', background: navy, color: 'white', fontWeight: 700, textAlign: 'left' as const, border: '1px solid #c8d3e0' };
  const td = { padding: '5px 8px', border: '1px solid #dde4ed', verticalAlign: 'middle' as const };
  const tdAlt = { ...td, background: '#f4f7fb' };

  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

  // 출석 통계
  const attPresent = reportData.attRecs.filter(r => r.status === 'present' || r.status === 'late').length;
  const attTotal = reportData.scheduledDays.filter(d => DAY_ORDER.includes(d as typeof DAY_ORDER[number])).length;
  const attRate = attTotal > 0 ? Math.round((attPresent / attTotal) * 100) : 0;

  // 숙제 통계
  const hwDone = reportData.hwRecs.filter(h => h.status === 'confirmed' || h.status === 'approved').length;
  const hwTotal = reportData.hwRecs.length;
  const hwRate = hwTotal > 0 ? Math.round((hwDone / hwTotal) * 100) : 0;

  // 시험 평균
  const confirmedTests = reportData.testRecs.filter(t => t.score !== null && t.maxScore > 0);
  const avgPct = confirmedTests.length > 0
    ? Math.round(confirmedTests.reduce((s, t) => s + (t.score! / t.maxScore) * 100, 0) / confirmedTests.length)
    : null;

  return (
    <div style={{ fontFamily: 'Arial, "Malgun Gothic", sans-serif', background: 'white', color: '#1a1a2e', fontSize: 10, width: '100%' }}>

      {/* ── 공문서 헤더 ── */}
      <div style={{ borderBottom: `3px solid ${navy}`, paddingBottom: 10, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 7, color: '#6b7280', letterSpacing: 2, fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>GONGTER ENGLISH ACADEMY</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: navy, letterSpacing: -0.5 }}>공터 영어 학원</div>
            <div style={{ fontSize: 11, color: '#374151', fontWeight: 700, marginTop: 2 }}>{isMonthly ? '월간' : '주간'} 학습 현황 리포트</div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 9, color: '#6b7280', lineHeight: 1.8 }}>
            <div>발행일: {today}</div>
            <div>기간: {dateRange}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: navy, marginTop: 2 }}>{periodLabel}</div>
          </div>
        </div>
      </div>

      {/* ── 학생 정보 박스 ── */}
      <div style={{ border: `1px solid ${navy}`, borderRadius: 4, marginBottom: 12, overflow: 'hidden' }}>
        <div style={{ background: navy, padding: '4px 10px', fontSize: 9, fontWeight: 700, color: 'white', letterSpacing: 1 }}>학생 정보</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', padding: '8px 10px', gap: 0 }}>
          {[['이름', student.name], ['학년', student.grade], ['반', student.classGroup], ['대상 기간', periodLabel]].map(([label, val]) => (
            <div key={label} style={{ paddingRight: 16 }}>
              <div style={{ fontSize: 8, color: '#6b7280', fontWeight: 700, marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#111827' }}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 종합 요약 ── */}
      <div style={{ border: '1px solid #c8d3e0', borderRadius: 4, marginBottom: 12, overflow: 'hidden' }}>
        <div style={{ background: '#1e3a5f', padding: '4px 10px', fontSize: 9, fontWeight: 700, color: 'white', letterSpacing: 1 }}>종합 요약</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: '1px solid #c8d3e0' }}>
          {[
            { label: '출석률', value: sections.attendance ? `${attRate}%` : '–', sub: sections.attendance ? `${attPresent}/${attTotal}일` : '' },
            { label: '숙제 완료율', value: sections.homework ? `${hwRate}%` : '–', sub: sections.homework ? `${hwDone}/${hwTotal}건` : '' },
            { label: '시험 평균', value: sections.tests && avgPct !== null ? `${avgPct}%` : '–', sub: sections.tests && avgPct !== null ? scoreGrade(avgPct) + '등급' : '' },
            { label: '태도 점수', value: sections.attitude ? (reportData.attitudeNet >= 0 ? `+${reportData.attitudeNet}` : String(reportData.attitudeNet)) : '–', sub: sections.attitude ? `긍정 +${reportData.totalPositive} / 부정 ${reportData.totalNegative}` : '' },
          ].map((item, i) => (
            <div key={i} style={{ padding: '10px 12px', borderRight: i < 3 ? '1px solid #dde4ed' : 'none', textAlign: 'center' }}>
              <div style={{ fontSize: 8, color: '#6b7280', fontWeight: 700, marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: navy }}>{item.value}</div>
              <div style={{ fontSize: 8, color: '#6b7280', marginTop: 2 }}>{item.sub}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMonthly ? '1fr' : '1fr 1fr', gap: 10, marginBottom: 10 }}>
        {/* ── 출석 현황 ── */}
        {sections.attendance && !isMonthly && (
          <div style={{ border: '1px solid #c8d3e0', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ background: '#1e3a5f', padding: '4px 10px', fontSize: 9, fontWeight: 700, color: 'white', letterSpacing: 1 }}>출석 현황</div>
            <table style={rule}>
              <thead>
                <tr>
                  <th style={th}>요일</th>
                  <th style={th}>결과</th>
                  <th style={th}>입실 시각</th>
                  <th style={th}>사유</th>
                </tr>
              </thead>
              <tbody>
                {reportData.scheduledDays.filter(d => DAY_ORDER.includes(d as typeof DAY_ORDER[number])).map((day, i) => {
                  const rec = reportData.attRecs.find(r => r.day === day);
                  const status = rec?.status ?? 'none';
                  return (
                    <tr key={day}>
                      <td style={i % 2 === 0 ? td : tdAlt}>{DAY_LABELS[day as keyof typeof DAY_LABELS]}</td>
                      <td style={{ ...(i % 2 === 0 ? td : tdAlt), fontWeight: 700 }}>{ATT_STATUS[status] ?? '–'}</td>
                      <td style={i % 2 === 0 ? td : tdAlt}>{rec?.checkInTime ?? '–'}</td>
                      <td style={{ ...(i % 2 === 0 ? td : tdAlt), color: '#6b7280' }}>{rec?.reason ?? '–'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── 숙제 현황 ── */}
        {sections.homework && !isMonthly && (
          <div style={{ border: '1px solid #c8d3e0', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ background: '#1e3a5f', padding: '4px 10px', fontSize: 9, fontWeight: 700, color: 'white', letterSpacing: 1 }}>숙제 현황</div>
            <table style={rule}>
              <thead>
                <tr>
                  <th style={th}>요일</th>
                  <th style={th}>결과</th>
                  <th style={th}>과목</th>
                </tr>
              </thead>
              <tbody>
                {reportData.scheduledDays.filter(d => DAY_ORDER.includes(d as typeof DAY_ORDER[number])).map((day, i) => {
                  const hw = reportData.hwRecs.find(h => h.day === day);
                  const status = hw?.status ?? 'none';
                  return (
                    <tr key={day}>
                      <td style={i % 2 === 0 ? td : tdAlt}>{DAY_LABELS[day as keyof typeof DAY_LABELS]}</td>
                      <td style={{ ...(i % 2 === 0 ? td : tdAlt), fontWeight: 700 }}>{HW_STATUS[status] ?? '–'}</td>
                      <td style={i % 2 === 0 ? td : tdAlt}>{hw?.cats.map(c => CAT_KO[c] || c).join(', ') || '–'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 시험 성적 ── */}
      {sections.tests && (
        <div style={{ border: '1px solid #c8d3e0', borderRadius: 4, overflow: 'hidden', marginBottom: 10 }}>
          <div style={{ background: '#1e3a5f', padding: '4px 10px', fontSize: 9, fontWeight: 700, color: 'white', letterSpacing: 1 }}>시험 성적</div>
          {reportData.testRecs.length === 0 ? (
            <div style={{ padding: '12px 10px', fontSize: 9, color: '#9ca3af', textAlign: 'center' }}>이번 기간 시험 기록 없음</div>
          ) : (
            <table style={rule}>
              <thead>
                <tr>
                  <th style={th}>과목</th>
                  <th style={{ ...th, textAlign: 'center' as const }}>점수</th>
                  <th style={{ ...th, textAlign: 'center' as const }}>만점</th>
                  <th style={{ ...th, textAlign: 'center' as const }}>정답률</th>
                  <th style={{ ...th, textAlign: 'center' as const }}>등급</th>
                </tr>
              </thead>
              <tbody>
                {reportData.testRecs.map((t, i) => {
                  const pct = t.score !== null && t.maxScore > 0 ? Math.round((t.score / t.maxScore) * 100) : null;
                  return (
                    <tr key={i}>
                      <td style={i % 2 === 0 ? td : tdAlt}>{t.subject}</td>
                      <td style={{ ...(i % 2 === 0 ? td : tdAlt), textAlign: 'center', fontWeight: 700 }}>{t.score ?? '미채점'}</td>
                      <td style={{ ...(i % 2 === 0 ? td : tdAlt), textAlign: 'center' }}>{t.maxScore}</td>
                      <td style={{ ...(i % 2 === 0 ? td : tdAlt), textAlign: 'center', fontWeight: 700 }}>{pct !== null ? `${pct}%` : '–'}</td>
                      <td style={{ ...(i % 2 === 0 ? td : tdAlt), textAlign: 'center', fontWeight: 800 }}>{pct !== null ? scoreGrade(pct) : '–'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── 월간 주별 현황 ── */}
      {isMonthly && (sections.attendance || sections.homework) && reportData.weekRows && (
        <div style={{ border: '1px solid #c8d3e0', borderRadius: 4, overflow: 'hidden', marginBottom: 10 }}>
          <div style={{ background: '#1e3a5f', padding: '4px 10px', fontSize: 9, fontWeight: 700, color: 'white', letterSpacing: 1 }}>주별 학습 현황</div>
          <table style={rule}>
            <thead>
              <tr>
                <th style={th}>주차</th>
                {sections.attendance && <th style={{ ...th, textAlign: 'center' as const }}>출석</th>}
                {sections.attendance && <th style={{ ...th, textAlign: 'center' as const }}>출석률</th>}
                {sections.homework && <th style={{ ...th, textAlign: 'center' as const }}>숙제완료</th>}
                {sections.tests && <th style={{ ...th, textAlign: 'center' as const }}>시험평균</th>}
                {sections.attitude && <th style={{ ...th, textAlign: 'center' as const }}>태도</th>}
              </tr>
            </thead>
            <tbody>
              {reportData.weekRows.map((row, i) => {
                const rate = row.scheduled > 0 ? Math.round((row.present / row.scheduled) * 100) : 0;
                return (
                  <tr key={row.wLabel}>
                    <td style={i % 2 === 0 ? td : tdAlt}>{row.wLabel}</td>
                    {sections.attendance && <td style={{ ...(i % 2 === 0 ? td : tdAlt), textAlign: 'center' }}>{row.present}/{row.scheduled}일</td>}
                    {sections.attendance && <td style={{ ...(i % 2 === 0 ? td : tdAlt), textAlign: 'center', fontWeight: 700 }}>{rate}%</td>}
                    {sections.homework && <td style={{ ...(i % 2 === 0 ? td : tdAlt), textAlign: 'center', fontWeight: 700 }}>{row.hwDone}/{row.hwTotal}건</td>}
                    {sections.tests && <td style={{ ...(i % 2 === 0 ? td : tdAlt), textAlign: 'center', fontWeight: 700 }}>{row.avgScore !== null ? `${row.avgScore}%` : '–'}</td>}
                    {sections.attitude && <td style={{ ...(i % 2 === 0 ? td : tdAlt), textAlign: 'center', fontWeight: 700 }}>{row.net !== 0 ? (row.net > 0 ? `+${row.net}` : String(row.net)) : '–'}</td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── 태도 평가 ── */}
      {sections.attitude && (
        <div style={{ border: '1px solid #c8d3e0', borderRadius: 4, overflow: 'hidden', marginBottom: 10 }}>
          <div style={{ background: '#1e3a5f', padding: '4px 10px', fontSize: 9, fontWeight: 700, color: 'white', letterSpacing: 1 }}>태도 평가</div>
          <table style={rule}>
            <thead>
              <tr>
                <th style={th}>항목</th>
                <th style={{ ...th, textAlign: 'center' as const }}>긍정</th>
                <th style={{ ...th, textAlign: 'center' as const }}>부정</th>
                <th style={{ ...th, textAlign: 'center' as const }}>합계</th>
                <th style={{ ...th, textAlign: 'center' as const }}>평가</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={td}>종합 태도 점수</td>
                <td style={{ ...td, textAlign: 'center', fontWeight: 700 }}>+{reportData.totalPositive}</td>
                <td style={{ ...td, textAlign: 'center', fontWeight: 700 }}>{reportData.totalNegative}</td>
                <td style={{ ...td, textAlign: 'center', fontWeight: 800, fontSize: 12 }}>
                  {reportData.attitudeNet >= 0 ? `+${reportData.attitudeNet}` : reportData.attitudeNet}
                </td>
                <td style={{ ...td, textAlign: 'center', fontWeight: 800 }}>
                  {reportData.attitudeNet >= 5 ? '우수' : reportData.attitudeNet >= 0 ? '양호' : '주의'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* ── 교사 메모 ── */}
      {sections.memo && (reportData.teacherNotes || reportData.teacherRequests) && (
        <div style={{ border: '1px solid #c8d3e0', borderRadius: 4, overflow: 'hidden', marginBottom: 12 }}>
          <div style={{ background: '#1e3a5f', padding: '4px 10px', fontSize: 9, fontWeight: 700, color: 'white', letterSpacing: 1 }}>교사 메모</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
            <div style={{ padding: '10px 12px', borderRight: '1px solid #dde4ed' }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: '#6b7280', marginBottom: 4 }}>특이 사항</div>
              <div style={{ fontSize: 10, lineHeight: 1.6, color: '#111827', whiteSpace: 'pre-wrap', minHeight: 40 }}>{reportData.teacherNotes || '–'}</div>
            </div>
            <div style={{ padding: '10px 12px' }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: '#6b7280', marginBottom: 4 }}>요청 사항</div>
              <div style={{ fontSize: 10, lineHeight: 1.6, color: '#111827', whiteSpace: 'pre-wrap', minHeight: 40 }}>{reportData.teacherRequests || '–'}</div>
            </div>
          </div>
        </div>
      )}

      {/* ── 서명란 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
        {['담당 교사', '학부모 확인', '원장'].map(label => (
          <div key={label} style={{ border: '1px solid #c8d3e0', borderRadius: 4, padding: '8px 12px', height: 50 }}>
            <div style={{ fontSize: 8, fontWeight: 700, color: '#6b7280', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 8, color: '#d1d5db', marginTop: 'auto' }}>(서명)</div>
          </div>
        ))}
      </div>

      {/* ── 푸터 ── */}
      <div style={{ borderTop: `1px solid ${navy}`, paddingTop: 6, display: 'flex', justifyContent: 'space-between', fontSize: 7, color: '#9ca3af' }}>
        <span>공터 영어 학원 · 학습 관리 시스템</span>
        <span>본 리포트는 공터 영어 학원 LMS에서 자동 생성되었습니다.</span>
        <span>출력일: {today}</span>
      </div>
    </div>
  );
}

/* ─── 교사 메모 입력 ─────────────────────────────────────────── */
function TeacherMemo({ notes, requests, onChange, onSave, saved }:
  { notes: string; requests: string; onChange: (f: 'notes' | 'requests', v: string) => void; onSave: () => void; saved: boolean }) {
  return (
    <div style={{ background: 'white', borderRadius: 12, padding: 20, border: '1px solid #e2e8f0' }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: '#1e293b', marginBottom: 14 }}>교사 메모</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 5 }}>특이 사항</label>
          <textarea value={notes} onChange={e => onChange('notes', e.target.value)} placeholder="이번 주 특이 사항..." rows={3}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 5 }}>요청 사항</label>
          <textarea value={requests} onChange={e => onChange('requests', e.target.value)} placeholder="학부모/학생 요청 사항..." rows={3}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
        </div>
      </div>
      <button onClick={onSave} style={{ marginTop: 12, padding: '9px 22px', borderRadius: 8, border: 'none', background: saved ? '#22c55e' : '#0f2a52', color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, minHeight: 'unset' }}>
        <Save size={14} /> {saved ? '저장됨 ✓' : '저장'}
      </button>
    </div>
  );
}

/* ─── 섹션 카드 래퍼 ────────────────────────────────────────── */
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
      <div style={{ background: '#0f2a52', padding: '10px 18px' }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: 'white', letterSpacing: 0.5 }}>{title}</span>
      </div>
      <div style={{ padding: '14px 18px' }}>{children}</div>
    </div>
  );
}

const SCR_TH: React.CSSProperties = { padding: '8px 12px', background: '#f1f5f9', fontWeight: 700, fontSize: 12, color: '#374151', borderBottom: '2px solid #e2e8f0', textAlign: 'left' };
const SCR_TD: React.CSSProperties = { padding: '9px 12px', fontSize: 13, borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle' };

const HW_BADGE: Record<string, React.CSSProperties> = {
  confirmed: { background: '#d1fae5', color: '#15803d' },
  approved:  { background: '#d1fae5', color: '#15803d' },
  missed:    { background: '#fee2e2', color: '#991b1b' },
  pending:   { background: '#fef3c7', color: '#92400e' },
  agreed:    { background: '#eff0ff', color: '#4338ca' },
  submitted: { background: '#dbeafe', color: '#1e40af' },
  rejected:  { background: '#fff7ed', color: '#c2410c' },
  none:      { background: '#f1f5f9', color: '#94a3b8' },
  no_hw:     { background: '#f1f5f9', color: '#475569' },
};
const ATT_BADGE: Record<string, React.CSSProperties> = {
  present: { background: '#d1fae5', color: '#15803d' },
  late:    { background: '#fef3c7', color: '#92400e' },
  absent:  { background: '#fee2e2', color: '#991b1b' },
  none:    { background: '#f1f5f9', color: '#94a3b8' },
};

/* ─── 주간 리포트 (화면) ─────────────────────────────────────── */
function WeeklyReport({ studentId, week, sections, printRef }: {
  studentId: string; week: string; sections: Sections;
  printRef: React.RefObject<HTMLDivElement | null>;
}) {
  const { state, dispatch } = useStore();
  const student = state.students.find(s => s.id === studentId);
  if (!student) return null;

  const { label: weekLabel, start, end } = getWeekDateRange(week);
  const attRecs = state.attendanceRecords.filter(r => r.studentId === studentId && weekOfDate(r.date) === week);
  const hwRecs = state.dayHomeworks.filter(h => h.studentId === studentId && h.week === week);
  const testRecs = state.testRecords.filter(t => t.studentId === studentId && t.week === week);
  const attitudeRecs = state.attitudeRecords.filter(a => a.studentId === studentId && a.week === week);
  const scheduledDays = (student.scheduleDays && student.scheduleDays.length > 0)
    ? student.scheduleDays
    : Array.from(new Set(state.students.flatMap(s => s.scheduleDays || [])));

  const totalPositive = attitudeRecs.reduce((s, a) => s + Math.max(0, a.shadowing) + Math.max(0, a.learningAttitude) + Math.max(0, a.basicAttitude), 0);
  const totalNegative = attitudeRecs.reduce((s, a) => s + Math.min(0, a.shadowing) + Math.min(0, a.learningAttitude) + Math.min(0, a.basicAttitude), 0);
  const attitudeNet = totalPositive + totalNegative;
  const presentDays = attRecs.filter(r => r.status === 'present' || r.status === 'late').length;
  const scheduledCount = scheduledDays.filter(d => DAY_ORDER.includes(d as typeof DAY_ORDER[number])).length;
  const hwDone = hwRecs.filter(h => h.status === 'confirmed' || h.status === 'approved').length;
  const confirmedTests = testRecs.filter(t => t.score !== null && t.maxScore > 0);
  const avgPct = confirmedTests.length > 0 ? Math.round(confirmedTests.reduce((s, t) => s + (t.score! / t.maxScore) * 100, 0) / confirmedTests.length) : null;

  const reportId = `report-${studentId}-weekly-${week}`;
  const existing = (state.reports || []).find(r => r.id === reportId);
  const [notes, setNotes] = useState(existing?.teacherNotes ?? '');
  const [requests, setRequests] = useState(existing?.teacherRequests ?? '');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    dispatch({ type: 'SAVE_REPORT', payload: { id: reportId, studentId, studentName: student.name, type: 'weekly', period: week, teacherNotes: notes, teacherRequests: requests, createdAt: existing?.createdAt ?? new Date().toISOString(), updatedAt: new Date().toISOString() } as StudentReport });
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const attRec4Print = scheduledDays.filter(d => DAY_ORDER.includes(d as typeof DAY_ORDER[number])).map(day => {
    const dayIdx = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].indexOf(day);
    const rec = attRecs.find(r => new Date(r.date + 'T12:00:00').getDay() === dayIdx);
    return { day, status: rec?.status ?? 'none', checkInTime: rec?.checkInTime, reason: rec?.reason };
  });
  const hw4Print = scheduledDays.filter(d => DAY_ORDER.includes(d as typeof DAY_ORDER[number])).map(day => {
    const hw = hwRecs.find(h => h.day === day);
    const cats = hw ? (['computer', 'textbook', 'vocabulary', 'other'] as const).filter(c => hw[c]) : [];
    return { day, status: hw?.status ?? 'none', cats };
  });

  return (
    <>
      <div ref={printRef as React.RefObject<HTMLDivElement>} style={{ display: 'none' }}>
        <PrintReport student={student} periodLabel={weekLabel} isMonthly={false}
          dateRange={`${start.getMonth() + 1}/${start.getDate()} ~ ${end.getMonth() + 1}/${end.getDate()}`}
          sections={sections}
          reportData={{ attRecs: attRec4Print, hwRecs: hw4Print, testRecs, attitudeNet, totalPositive, totalNegative, teacherNotes: notes, teacherRequests: requests, scheduledDays }} />
      </div>

      {/* 화면 요약 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { label: '출석', value: `${presentDays}/${scheduledCount}일`, sub: scheduledCount > 0 ? `${Math.round(presentDays / scheduledCount * 100)}%` : '–' },
          { label: '숙제 완료', value: `${hwDone}/${hwRecs.length}건`, sub: hwRecs.length > 0 ? `${Math.round(hwDone / hwRecs.length * 100)}%` : '–' },
          { label: '시험 평균', value: avgPct !== null ? `${avgPct}%` : '–', sub: avgPct !== null ? scoreGrade(avgPct) + '등급' : '응시 없음' },
          { label: '태도 점수', value: attitudeNet >= 0 ? `+${attitudeNet}` : String(attitudeNet), sub: `+${totalPositive} / ${totalNegative}` },
        ].map(item => (
          <div key={item.label} style={{ background: 'white', borderRadius: 12, padding: '14px 16px', border: '1px solid #e2e8f0', borderTop: '3px solid #0f2a52' }}>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, marginBottom: 6 }}>{item.label}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#0f2a52' }}>{item.value}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>{item.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {sections.attendance && (
          <SectionCard title="출석 현황">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={SCR_TH}>요일</th>
                  <th style={SCR_TH}>결과</th>
                  <th style={SCR_TH}>입실 시각</th>
                  <th style={SCR_TH}>사유</th>
                </tr>
              </thead>
              <tbody>
                {DAY_ORDER.map(day => {
                  if (!scheduledDays.includes(day)) return null;
                  const dayIdx = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].indexOf(day);
                  const rec = attRecs.find(r => new Date(r.date + 'T12:00:00').getDay() === dayIdx);
                  const status = rec?.status ?? 'none';
                  return (
                    <tr key={day}>
                      <td style={SCR_TD}>{DAY_LABELS[day as keyof typeof DAY_LABELS]}</td>
                      <td style={SCR_TD}><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, ...ATT_BADGE[status] }}>{ATT_STATUS[status]}</span></td>
                      <td style={{ ...SCR_TD, color: '#64748b' }}>{rec?.checkInTime ?? '–'}</td>
                      <td style={{ ...SCR_TD, color: '#64748b', fontSize: 12 }}>{rec?.reason ?? '–'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </SectionCard>
        )}

        {sections.homework && (
          <SectionCard title="숙제 현황">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={SCR_TH}>요일</th>
                  <th style={SCR_TH}>결과</th>
                  <th style={SCR_TH}>과목</th>
                </tr>
              </thead>
              <tbody>
                {DAY_ORDER.map(day => {
                  if (!scheduledDays.includes(day)) return null;
                  const hw = hwRecs.find(h => h.day === day);
                  const status = hw?.status ?? 'none';
                  const cats = hw ? (['computer', 'textbook', 'vocabulary', 'other'] as const).filter(c => hw[c]) : [];
                  return (
                    <tr key={day}>
                      <td style={SCR_TD}>{DAY_LABELS[day as keyof typeof DAY_LABELS]}</td>
                      <td style={SCR_TD}><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, ...HW_BADGE[status] }}>{HW_STATUS[status]}</span></td>
                      <td style={{ ...SCR_TD, color: '#64748b' }}>{cats.map(c => CAT_KO[c]).join(', ') || '–'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </SectionCard>
        )}

        {sections.tests && (
          <SectionCard title="시험 성적">
            {testRecs.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#cbd5e1', padding: '16px 0', fontSize: 13 }}>이번 주 시험 기록 없음</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={SCR_TH}>과목</th>
                    <th style={{ ...SCR_TH, textAlign: 'center' }}>점수</th>
                    <th style={{ ...SCR_TH, textAlign: 'center' }}>만점</th>
                    <th style={{ ...SCR_TH, textAlign: 'center' }}>정답률</th>
                    <th style={{ ...SCR_TH, textAlign: 'center' }}>등급</th>
                  </tr>
                </thead>
                <tbody>
                  {testRecs.map(t => {
                    const pct = t.score !== null && t.maxScore > 0 ? Math.round((t.score! / t.maxScore) * 100) : null;
                    const gradeColor = pct === null ? '#94a3b8' : pct >= 90 ? '#15803d' : pct >= 70 ? '#1d4ed8' : '#991b1b';
                    return (
                      <tr key={t.id}>
                        <td style={SCR_TD}>{t.subject}</td>
                        <td style={{ ...SCR_TD, textAlign: 'center', fontWeight: 800, fontSize: 15 }}>{t.score ?? <span style={{ color: '#cbd5e1', fontSize: 12 }}>미채점</span>}</td>
                        <td style={{ ...SCR_TD, textAlign: 'center', color: '#64748b' }}>{t.maxScore}</td>
                        <td style={{ ...SCR_TD, textAlign: 'center', fontWeight: 700, color: gradeColor }}>{pct !== null ? `${pct}%` : '–'}</td>
                        <td style={{ ...SCR_TD, textAlign: 'center', fontWeight: 900, fontSize: 16, color: gradeColor }}>{pct !== null ? scoreGrade(pct) : '–'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </SectionCard>
        )}

        {sections.attitude && (
          <SectionCard title="태도 평가">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={SCR_TH}>항목</th>
                  <th style={{ ...SCR_TH, textAlign: 'center' }}>긍정</th>
                  <th style={{ ...SCR_TH, textAlign: 'center' }}>부정</th>
                  <th style={{ ...SCR_TH, textAlign: 'center' }}>합계</th>
                  <th style={{ ...SCR_TH, textAlign: 'center' }}>평가</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={SCR_TD}>종합 태도 점수</td>
                  <td style={{ ...SCR_TD, textAlign: 'center', fontWeight: 700, color: '#15803d' }}>+{totalPositive}</td>
                  <td style={{ ...SCR_TD, textAlign: 'center', fontWeight: 700, color: '#991b1b' }}>{totalNegative}</td>
                  <td style={{ ...SCR_TD, textAlign: 'center', fontWeight: 900, fontSize: 18, color: attitudeNet >= 0 ? '#15803d' : '#991b1b' }}>{attitudeNet >= 0 ? `+${attitudeNet}` : attitudeNet}</td>
                  <td style={{ ...SCR_TD, textAlign: 'center' }}>
                    <span style={{ padding: '3px 12px', borderRadius: 20, fontWeight: 700, fontSize: 12, background: attitudeNet >= 5 ? '#d1fae5' : attitudeNet >= 0 ? '#fef3c7' : '#fee2e2', color: attitudeNet >= 5 ? '#15803d' : attitudeNet >= 0 ? '#92400e' : '#991b1b' }}>
                      {attitudeNet >= 5 ? '우수' : attitudeNet >= 0 ? '양호' : '주의'}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </SectionCard>
        )}

        {sections.memo && (
          <TeacherMemo notes={notes} requests={requests}
            onChange={(f, v) => { if (f === 'notes') setNotes(v); else setRequests(v); setSaved(false); }}
            onSave={handleSave} saved={saved} />
        )}
      </div>
    </>
  );
}

/* ─── 월간 리포트 (화면) ─────────────────────────────────────── */
function MonthlyReport({ studentId, monthKey, sections, printRef }: {
  studentId: string; monthKey: string; sections: Sections;
  printRef: React.RefObject<HTMLDivElement | null>;
}) {
  const { state, dispatch } = useStore();
  const student = state.students.find(s => s.id === studentId);
  if (!student) return null;

  const weeks = useMemo(() => getWeeksInMonth(monthKey), [monthKey]);
  const scheduledDays = (student.scheduleDays && student.scheduleDays.length > 0)
    ? student.scheduleDays
    : Array.from(new Set(state.students.flatMap(s => s.scheduleDays || [])));
  const scheduledCount = scheduledDays.filter(d => DAY_ORDER.includes(d as typeof DAY_ORDER[number])).length;

  const weekData = weeks.map(week => {
    const att = state.attendanceRecords.filter(r => r.studentId === studentId && weekOfDate(r.date) === week);
    const hw = state.dayHomeworks.filter(h => h.studentId === studentId && h.week === week);
    const tests = state.testRecords.filter(t => t.studentId === studentId && t.week === week);
    const attitude = state.attitudeRecords.filter(a => a.studentId === studentId && a.week === week);
    const presentDays = att.filter(r => r.status === 'present' || r.status === 'late').length;
    const hwDone = hw.filter(h => h.status === 'confirmed' || h.status === 'approved').length;
    const confirmedTests = tests.filter(t => t.status === 'confirmed' && t.score !== null);
    const avgScore = confirmedTests.length > 0 ? Math.round(confirmedTests.reduce((s, t) => s + (t.score! / t.maxScore) * 100, 0) / confirmedTests.length) : null;
    const pos = attitude.reduce((s, a) => s + Math.max(0, a.shadowing) + Math.max(0, a.learningAttitude) + Math.max(0, a.basicAttitude), 0);
    const neg = attitude.reduce((s, a) => s + Math.min(0, a.shadowing) + Math.min(0, a.learningAttitude) + Math.min(0, a.basicAttitude), 0);
    return { week, present: presentDays, scheduled: scheduledCount, hwDone, hwTotal: hw.length, avgScore, pos, neg, net: pos + neg };
  });

  const totalPresent = weekData.reduce((s, w) => s + w.present, 0);
  const totalScheduled = weekData.length * scheduledCount;
  const totalHwDone = weekData.reduce((s, w) => s + w.hwDone, 0);
  const totalHwAll = weekData.reduce((s, w) => s + w.hwTotal, 0);
  const allTests = state.testRecords.filter(t => t.studentId === studentId && t.status === 'confirmed' && t.score !== null && weeks.some(w => t.week === w));
  const monthAvgPct = allTests.length > 0 ? Math.round(allTests.reduce((s, t) => s + (t.score! / t.maxScore) * 100, 0) / allTests.length) : null;
  const totalPos = weekData.reduce((s, w) => s + w.pos, 0);
  const totalNeg = weekData.reduce((s, w) => s + w.neg, 0);
  const attitudeNet = totalPos + totalNeg;
  const attRate = totalScheduled > 0 ? Math.round((totalPresent / totalScheduled) * 100) : 0;
  const hwRate = totalHwAll > 0 ? Math.round((totalHwDone / totalHwAll) * 100) : 0;

  const reportId = `report-${studentId}-monthly-${monthKey}`;
  const existing = (state.reports || []).find(r => r.id === reportId);
  const [notes, setNotes] = useState(existing?.teacherNotes ?? '');
  const [requests, setRequests] = useState(existing?.teacherRequests ?? '');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    dispatch({ type: 'SAVE_REPORT', payload: { id: reportId, studentId, studentName: student.name, type: 'monthly', period: monthKey, teacherNotes: notes, teacherRequests: requests, createdAt: existing?.createdAt ?? new Date().toISOString(), updatedAt: new Date().toISOString() } as StudentReport });
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const weekRows4Print = weekData.map(w => ({ wLabel: getWeekDateRange(w.week).label, ...w }));

  return (
    <>
      <div ref={printRef as React.RefObject<HTMLDivElement>} style={{ display: 'none' }}>
        <PrintReport student={student} periodLabel={monthLabel(monthKey)} isMonthly={true}
          dateRange={`${weeks.length}주 분량`} sections={sections}
          reportData={{ attRecs: [], hwRecs: [], testRecs: allTests, attitudeNet, totalPositive: totalPos, totalNegative: totalNeg, teacherNotes: notes, teacherRequests: requests, scheduledDays, weekRows: weekRows4Print }} />
      </div>

      {/* 화면 요약 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { label: '출석률', value: `${attRate}%`, sub: `${totalPresent}/${totalScheduled}일` },
          { label: '숙제 완료율', value: `${hwRate}%`, sub: `${totalHwDone}/${totalHwAll}건` },
          { label: '시험 평균', value: monthAvgPct !== null ? `${monthAvgPct}%` : '–', sub: monthAvgPct !== null ? scoreGrade(monthAvgPct) + '등급' : '응시 없음' },
          { label: '태도 점수', value: attitudeNet >= 0 ? `+${attitudeNet}` : String(attitudeNet), sub: `+${totalPos} / ${totalNeg}` },
        ].map(item => (
          <div key={item.label} style={{ background: 'white', borderRadius: 12, padding: '14px 16px', border: '1px solid #e2e8f0', borderTop: '3px solid #0f2a52' }}>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, marginBottom: 6 }}>{item.label}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#0f2a52' }}>{item.value}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>{item.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {(sections.attendance || sections.homework) && (
          <SectionCard title="주별 학습 현황">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={SCR_TH}>주차</th>
                  {sections.attendance && <th style={{ ...SCR_TH, textAlign: 'center' }}>출석</th>}
                  {sections.attendance && <th style={{ ...SCR_TH, textAlign: 'center' }}>출석률</th>}
                  {sections.homework && <th style={{ ...SCR_TH, textAlign: 'center' }}>숙제 완료</th>}
                  {sections.tests && <th style={{ ...SCR_TH, textAlign: 'center' }}>시험 평균</th>}
                  {sections.attitude && <th style={{ ...SCR_TH, textAlign: 'center' }}>태도</th>}
                </tr>
              </thead>
              <tbody>
                {weekData.map(({ week, present, hwDone, hwTotal, avgScore, pos, neg }) => {
                  const { label: wLabel } = getWeekDateRange(week);
                  const net = pos + neg;
                  const rate = scheduledCount > 0 ? Math.round(present / scheduledCount * 100) : 0;
                  return (
                    <tr key={week}>
                      <td style={SCR_TD}>{wLabel}</td>
                      {sections.attendance && <td style={{ ...SCR_TD, textAlign: 'center', fontWeight: 700 }}>{present}/{scheduledCount}일</td>}
                      {sections.attendance && <td style={{ ...SCR_TD, textAlign: 'center', fontWeight: 700, color: rate >= 80 ? '#15803d' : '#f59e0b' }}>{rate}%</td>}
                      {sections.homework && <td style={{ ...SCR_TD, textAlign: 'center', fontWeight: 700 }}>{hwDone}/{hwTotal}건</td>}
                      {sections.tests && <td style={{ ...SCR_TD, textAlign: 'center', fontWeight: 700 }}>{avgScore !== null ? `${avgScore}%` : <span style={{ color: '#cbd5e1' }}>–</span>}</td>}
                      {sections.attitude && <td style={{ ...SCR_TD, textAlign: 'center', fontWeight: 700, color: net >= 0 ? '#15803d' : '#991b1b' }}>{net !== 0 ? (net > 0 ? `+${net}` : String(net)) : <span style={{ color: '#cbd5e1' }}>–</span>}</td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </SectionCard>
        )}

        {sections.tests && (
          <SectionCard title="시험 성적">
            {allTests.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#cbd5e1', padding: '16px 0', fontSize: 13 }}>이번 달 시험 기록 없음</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={SCR_TH}>과목</th>
                    <th style={{ ...SCR_TH, textAlign: 'center' }}>점수</th>
                    <th style={{ ...SCR_TH, textAlign: 'center' }}>만점</th>
                    <th style={{ ...SCR_TH, textAlign: 'center' }}>정답률</th>
                    <th style={{ ...SCR_TH, textAlign: 'center' }}>등급</th>
                  </tr>
                </thead>
                <tbody>
                  {allTests.map(t => {
                    const pct = t.score !== null && t.maxScore > 0 ? Math.round((t.score! / t.maxScore) * 100) : null;
                    const gradeColor = pct === null ? '#94a3b8' : pct >= 90 ? '#15803d' : pct >= 70 ? '#1d4ed8' : '#991b1b';
                    return (
                      <tr key={t.id}>
                        <td style={SCR_TD}>{t.subject}</td>
                        <td style={{ ...SCR_TD, textAlign: 'center', fontWeight: 800, fontSize: 15 }}>{t.score}</td>
                        <td style={{ ...SCR_TD, textAlign: 'center', color: '#64748b' }}>{t.maxScore}</td>
                        <td style={{ ...SCR_TD, textAlign: 'center', fontWeight: 700, color: gradeColor }}>{pct !== null ? `${pct}%` : '–'}</td>
                        <td style={{ ...SCR_TD, textAlign: 'center', fontWeight: 900, fontSize: 16, color: gradeColor }}>{pct !== null ? scoreGrade(pct) : '–'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </SectionCard>
        )}

        {sections.attitude && (
          <SectionCard title="태도 평가">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                <th style={SCR_TH}>항목</th>
                <th style={{ ...SCR_TH, textAlign: 'center' }}>긍정</th>
                <th style={{ ...SCR_TH, textAlign: 'center' }}>부정</th>
                <th style={{ ...SCR_TH, textAlign: 'center' }}>합계</th>
                <th style={{ ...SCR_TH, textAlign: 'center' }}>평가</th>
              </tr></thead>
              <tbody>
                <tr>
                  <td style={SCR_TD}>종합 태도 점수</td>
                  <td style={{ ...SCR_TD, textAlign: 'center', fontWeight: 700, color: '#15803d' }}>+{totalPos}</td>
                  <td style={{ ...SCR_TD, textAlign: 'center', fontWeight: 700, color: '#991b1b' }}>{totalNeg}</td>
                  <td style={{ ...SCR_TD, textAlign: 'center', fontWeight: 900, fontSize: 18, color: attitudeNet >= 0 ? '#15803d' : '#991b1b' }}>{attitudeNet >= 0 ? `+${attitudeNet}` : attitudeNet}</td>
                  <td style={{ ...SCR_TD, textAlign: 'center' }}>
                    <span style={{ padding: '3px 12px', borderRadius: 20, fontWeight: 700, fontSize: 12, background: attitudeNet >= 5 ? '#d1fae5' : attitudeNet >= 0 ? '#fef3c7' : '#fee2e2', color: attitudeNet >= 5 ? '#15803d' : attitudeNet >= 0 ? '#92400e' : '#991b1b' }}>
                      {attitudeNet >= 5 ? '우수' : attitudeNet >= 0 ? '양호' : '주의'}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </SectionCard>
        )}

        {sections.memo && (
          <TeacherMemo notes={notes} requests={requests}
            onChange={(f, v) => { if (f === 'notes') setNotes(v); else setRequests(v); setSaved(false); }}
            onSave={handleSave} saved={saved} />
        )}
      </div>
    </>
  );
}

/* ─── 메인 페이지 ────────────────────────────────────────────── */
export default function ReportsPage() {
  const { state } = useStore();
  const [selectedStudentId, setSelectedStudentId] = useState<string>(state.students[0]?.id ?? '');
  const [reportType, setReportType] = useState<'weekly' | 'monthly'>('weekly');
  const [week, setWeek] = useState(state.currentWeek);
  const [monthKey, setMonthKey] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [sections, setSections] = useState<Sections>({ attendance: true, homework: true, tests: true, attitude: true, memo: true });
  const [downloading, setDownloading] = useState(false);
  const months = useMemo(() => recentMonths(12), []);
  const student = state.students.find(s => s.id === selectedStudentId);
  const printRef = useRef<HTMLDivElement | null>(null);

  const handleDownloadPdf = async () => {
    if (!printRef.current || !student) return;
    setDownloading(true);
    try {
      const el = printRef.current;
      el.style.display = 'block';
      el.style.position = 'fixed';
      el.style.top = '0';
      el.style.left = '-9999px';
      el.style.width = '794px';
      el.style.background = 'white';
      el.style.padding = '32px';
      el.style.zIndex = '9999';

      const { default: html2canvas } = await import('html2canvas');
      const { default: jsPDF } = await import('jspdf');

      await new Promise(r => setTimeout(r, 150));
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = 210, pageH = 297;
      const imgW = pageW - 20;
      const imgH = (canvas.height / canvas.width) * imgW;
      if (imgH <= pageH - 20) {
        pdf.addImage(imgData, 'JPEG', 10, 10, imgW, imgH);
      } else {
        const scaledH = pageH - 20;
        const scaledW = (canvas.width / canvas.height) * scaledH;
        pdf.addImage(imgData, 'JPEG', (pageW - scaledW) / 2, 10, scaledW, scaledH);
      }
      const period = reportType === 'weekly' ? week : monthKey;
      pdf.save(`리포트_${student.name}_${period}.pdf`);
    } finally {
      if (printRef.current) {
        printRef.current.style.display = 'none';
        printRef.current.style.position = '';
        printRef.current.style.top = '';
        printRef.current.style.left = '';
        printRef.current.style.width = '';
        printRef.current.style.padding = '';
        printRef.current.style.zIndex = '';
      }
      setDownloading(false);
    }
  };

  const toggleSection = (key: keyof Sections) => setSections(s => ({ ...s, [key]: !s[key] }));

  return (
    <div>
      {/* 헤더 */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: '#0f2a52' }}>학생 리포트</h1>
        <p style={{ color: '#64748b', marginTop: 2, fontSize: 13 }}>주간 / 월간 학습 현황 및 성적 분석</p>
      </div>

      {/* 컨트롤 바 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 12, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', borderRadius: 10, padding: '8px 14px', border: '1px solid #e2e8f0' }}>
          <User size={15} color="#0f2a52" />
          <select value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)}
            style={{ border: 'none', outline: 'none', fontSize: 14, fontWeight: 700, background: 'transparent', cursor: 'pointer', color: '#0f2a52' }}>
            {state.students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.classGroup})</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', borderRadius: 10, overflow: 'hidden', border: '1px solid #e2e8f0', background: 'white' }}>
          {(['weekly', 'monthly'] as const).map(t => (
            <button key={t} onClick={() => setReportType(t)} style={{ padding: '9px 18px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, minHeight: 'unset', background: reportType === t ? '#0f2a52' : 'white', color: reportType === t ? 'white' : '#64748b' }}>
              {t === 'weekly' ? '주간' : '월간'}
            </button>
          ))}
        </div>

        {reportType === 'weekly' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'white', borderRadius: 10, padding: '6px 10px', border: '1px solid #e2e8f0' }}>
            <button onClick={() => setWeek(getPrevWeek(week))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', minHeight: 'unset' }}><ChevronLeft size={16} color="#64748b" /></button>
            <span style={{ fontSize: 13, fontWeight: 700, minWidth: 80, textAlign: 'center', color: '#0f2a52' }}>{getWeekDateRange(week).label}</span>
            <button onClick={() => setWeek(getNextWeek(week))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', minHeight: 'unset' }}><ChevronRight size={16} color="#64748b" /></button>
          </div>
        ) : (
          <select value={monthKey} onChange={e => setMonthKey(e.target.value)}
            style={{ padding: '9px 14px', borderRadius: 10, border: '1px solid #e2e8f0', background: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', outline: 'none', color: '#0f2a52' }}>
            {months.map(mk => <option key={mk} value={mk}>{monthLabel(mk)}</option>)}
          </select>
        )}

        <button onClick={handleDownloadPdf} disabled={downloading || !student} style={{
          marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 7,
          padding: '9px 20px', borderRadius: 10, border: 'none',
          background: downloading ? '#94a3b8' : '#0f2a52', color: 'white',
          fontWeight: 700, fontSize: 13, cursor: downloading ? 'not-allowed' : 'pointer', minHeight: 'unset',
        }}>
          <Download size={15} />
          {downloading ? 'PDF 생성 중...' : 'PDF 다운로드'}
        </button>
      </div>

      {/* 섹션 토글 */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginRight: 2 }}>PDF 포함 섹션</span>
        {SECTION_LABELS.map(({ key, label }) => {
          const on = sections[key];
          return (
            <button key={key} onClick={() => toggleSection(key)} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '4px 12px', borderRadius: 20, border: '1.5px solid',
              borderColor: on ? '#0f2a52' : '#e2e8f0',
              background: on ? '#0f2a52' : 'white',
              color: on ? 'white' : '#94a3b8',
              fontWeight: 700, fontSize: 12, cursor: 'pointer', minHeight: 'unset',
            }}>
              {on ? <Eye size={11} /> : <EyeOff size={11} />}
              {label}
            </button>
          );
        })}
      </div>

      {!student ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8', background: 'white', borderRadius: 12, border: '1px solid #e2e8f0' }}>학생을 선택해주세요</div>
      ) : reportType === 'weekly' ? (
        <WeeklyReport key={`${selectedStudentId}-${week}`} studentId={selectedStudentId} week={week} sections={sections} printRef={printRef} />
      ) : (
        <MonthlyReport key={`${selectedStudentId}-${monthKey}`} studentId={selectedStudentId} monthKey={monthKey} sections={sections} printRef={printRef} />
      )}
    </div>
  );
}
