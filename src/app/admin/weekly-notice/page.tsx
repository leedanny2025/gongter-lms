'use client';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { useSelectedWeek } from '@/lib/use-selected-week';
import { getWeeklyProgress } from '@/lib/weekly-progress';
import { getMonthlyProgress } from '@/lib/monthly-progress';
import { getLearningWeekRange, koreanDateStr } from '@/lib/utils';
import WeekSelector from '@/components/WeekSelector';
import styles from './page.module.css';
import { rankNoticeRows } from '@/lib/notice-ranking';
type SortKey = 'name' | 'attendanceCount' | 'homeworkCount' | 'testCount' | 'attitudeScore' | 'dollars';

export default function WeeklyNoticePage() {
  const { state } = useStore();
  const [week, setWeek] = useSelectedWeek();
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const [month, setMonth] = useState(() => koreanDateStr().slice(0, 7));
  const monthly = period === 'monthly';
  const periodLabel = monthly ? '월간' : '주간';
  const [group, setGroup] = useState('전체');
  const [sort, setSort] = useState<{key: SortKey; ascending: boolean}>({key:'name',ascending:true});
  const columns: {key: SortKey; label: string}[] = [{key:'name',label:'이름'},{key:'attendanceCount',label:'출석'},{key:'homeworkCount',label:'숙제'},{key:'testCount',label:'시험'},{key:'attitudeScore',label:'태도'},{key:'dollars',label:monthly ? '지급 달러' : '달러 성취'}];
  const sortBy = (key: SortKey) => setSort(previous => ({key,ascending:previous.key === key ? !previous.ascending : key === 'name'}));
  const groups = [...new Set(state.students.map(s => s.classGroup))].sort();
  const sourceRows = state.students.filter(s => group === '전체' || s.classGroup === group).sort((a,b) => a.name.localeCompare(b.name,'ko')).map(student => ({ student, progress: getWeeklyProgress(state, student, week), monthlyProgress: getMonthlyProgress(state, student, month) }));
  const rows = rankNoticeRows(sourceRows, row => row.student.name, sort.key === 'name' ? null : row => {
    const stats = monthly ? row.monthlyProgress : row.progress;
    return sort.key === 'dollars' ? (monthly ? stats.awarded : row.progress.earned) : stats[sort.key as 'attendanceCount' | 'homeworkCount' | 'testCount' | 'attitudeScore'];
  }, sort.ascending);
  const range = getLearningWeekRange(week);
  return <div className={styles.page}>
    <div className={styles.periods} aria-label="조회 기간">{(['weekly', 'monthly'] as const).map(value => <button key={value} type="button" aria-pressed={period === value} onClick={() => setPeriod(value)}>{value === 'weekly' ? '주간' : '월간'}</button>)}</div>
    <div className={styles.controls}>{monthly ? <label>조회 월 <input type="month" aria-label="조회 월" value={month} onChange={e => { if (/^\d{4}-\d{2}$/.test(e.target.value)) setMonth(e.target.value); }} /></label> : <WeekSelector week={week} onChange={setWeek} compact />}<label>반 <select aria-label="반 선택" value={group} onChange={e => setGroup(e.target.value)}><option>전체</option>{groups.map(g => <option key={g}>{g}</option>)}</select></label></div>
    <article className={styles.paper}>
      <header className={styles.header}><div className={styles.eyebrow}>GONGTER ENGLISH · {monthly ? 'MONTHLY' : 'WEEKLY'} NOTICE</div><h1>우리 반 {periodLabel} 성장 소식</h1><p>{monthly ? `${month.split('-')[0]}년 ${Number(month.split('-')[1])}월` : range.label}</p><span className={styles.badge}>{group === '전체' ? '전체 학생' : group} · {rows.length}명</span></header>
      <div className={styles.intro}>{monthly ? '한 달' : '한 주'} 동안 차곡차곡 쌓은 노력입니다.<br /><strong>출석 · 숙제 · 시험 · 태도</strong> 진행과 달러 성취를 함께 확인해 주세요.</div>
      <p className={styles.sortHint} aria-live="polite">{sort.key === 'name' ? '항목 제목을 누르면 순위를 볼 수 있어요.' : `${columns.find(c => c.key === sort.key)?.label} · ${sort.ascending ? '낮은' : '높은'} 순 · 동점은 공동 순위`}</p>
      <table className={styles.table}>
        <caption className={styles.srOnly}>학생별 {periodLabel} 진행 사항과 달러</caption>
        <colgroup>{[20,13,13,13,15,26].map((width,i) => <col key={i} style={{width:`${width}%`}} />)}</colgroup>
        <thead><tr>{columns.map(column => <th key={column.key} scope="col" aria-sort={sort.key === column.key ? (sort.ascending ? 'ascending' : 'descending') : 'none'}><button type="button" className={styles.sortButton} onClick={() => sortBy(column.key)} aria-label={`${column.label} 순위 정렬`}>{column.label}<span aria-hidden="true">{sort.key === column.key ? (sort.ascending ? ' ↑' : ' ↓') : ' ↕'}</span></button></th>)}</tr></thead>
        <tbody>{rows.map(({row:{student,progress:p,monthlyProgress},rank}) => { const stats = monthly ? monthlyProgress : p; return <tr key={student.id}>
          <th scope="row">{rank !== null && <span className={styles.rank}>{rank}위</span>}<span className={styles.name}>{student.name}</span><span className={styles.group}>{student.classGroup}</span></th>
          {[stats.attendanceCount,stats.homeworkCount,stats.testCount].map((count,i) => <td key={i}><span className={count >= stats.total && stats.total > 0 ? styles.complete : styles.count}>{count}<small>/{stats.total}</small></span></td>)}
          <td><strong className={styles.attitude}>{stats.attitudeScore}<small>점</small></strong></td>
          <td>{monthly ? <strong className={styles.dollars}>${stats.awarded}</strong> : <><strong className={styles.dollars}>${p.earned}<small> / ${p.maximum}</small></strong><div className={styles.track} role="progressbar" aria-label={`${student.name} 달러 달성률`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={p.percent}><i style={{width:`${p.percent}%`}} /></div><span className={styles.paid}>지급 ${p.awarded}</span></>}</td>
        </tr>; })}</tbody>
      </table>
      {rows.length === 0 && <p className={styles.empty}>표시할 학생이 없습니다.</p>}
      <footer className={styles.footer}><strong>꼭 확인해 주세요</strong><p>숫자는 완료한 일수 / {periodLabel} 수업 예정 일수입니다.<br />출석·숙제·시험 순위는 완료 일수 기준이며, 선택한 반 안에서 계산합니다.<br />숙제는 완료·승인, 시험은 점수 확정 기록을 반영합니다.<br />태도 점수는 해당 기간의 쉐도잉·학습 태도·기본 태도 합계입니다.<br />{monthly ? '월간은 매월 1일~말일 기준이며, 달러는 한국 시간 지급일 기준 실제 지급 합계입니다.' : '달러는 태도 보너스를 포함한 예상 지급액이며 실제 지급액과 다를 수 있습니다.'}</p><div>금요일 자정에 새 주 시작 · 보유 달러와 지난 기록 보존</div></footer>
    </article>
    <p className={styles.hint}>휴대폰 화면에 맞춘 관리자용 공지표입니다. 주간·월간과 반을 선택해 확인하세요.</p>
  </div>;
}
