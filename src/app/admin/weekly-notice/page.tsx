'use client';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { useSelectedWeek } from '@/lib/use-selected-week';
import { getWeeklyProgress } from '@/lib/weekly-progress';
import { getLearningWeekRange } from '@/lib/utils';
import WeekSelector from '@/components/WeekSelector';
import styles from './page.module.css';

export default function WeeklyNoticePage() {
  const { state } = useStore();
  const [week, setWeek] = useSelectedWeek();
  const [group, setGroup] = useState('전체');
  const groups = [...new Set(state.students.map(s => s.classGroup))].sort();
  const rows = state.students.filter(s => group === '전체' || s.classGroup === group).sort((a,b) => a.name.localeCompare(b.name,'ko')).map(student => ({ student, progress: getWeeklyProgress(state, student, week) }));
  const range = getLearningWeekRange(week);
  return <div className={styles.page}>
    <div className={styles.controls}><WeekSelector week={week} onChange={setWeek} compact /><label>반 <select aria-label="반 선택" value={group} onChange={e => setGroup(e.target.value)}><option>전체</option>{groups.map(g => <option key={g}>{g}</option>)}</select></label></div>
    <article className={styles.paper}>
      <header className={styles.header}><div className={styles.eyebrow}>GONGTER ENGLISH · WEEKLY NOTICE</div><h1>우리 반 주간 성장 소식</h1><p>{range.label}</p><span className={styles.badge}>{group === '전체' ? '전체 학생' : group} · {rows.length}명</span></header>
      <div className={styles.intro}>한 주 동안 차곡차곡 쌓은 노력입니다.<br /><strong>출석 · 숙제 · 시험</strong> 진행과 달러 성취를 함께 확인해 주세요.</div>
      <table className={styles.table}>
        <caption className={styles.srOnly}>학생별 주간 진행 사항과 예상 달러</caption>
        <colgroup><col style={{ width:'24%' }} /><col style={{ width:'16%' }} /><col style={{ width:'16%' }} /><col style={{ width:'16%' }} /><col style={{ width:'28%' }} /></colgroup>
        <thead><tr><th scope="col">이름</th><th scope="col">출석</th><th scope="col">숙제</th><th scope="col">시험</th><th scope="col">달러 성취</th></tr></thead>
        <tbody>{rows.map(({student,progress:p}) => <tr key={student.id}>
          <th scope="row"><span className={styles.name}>{student.name}</span><span className={styles.group}>{student.classGroup}</span></th>
          {[p.attendanceCount,p.homeworkCount,p.testCount].map((count,i) => <td key={i}><span className={count === p.total ? styles.complete : styles.count}>{count}<small>/{p.total}</small></span></td>)}
          <td><strong className={styles.dollars}>${p.earned}<small> / ${p.maximum}</small></strong><div className={styles.track} role="progressbar" aria-label={`${student.name} 달러 달성률`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={p.percent}><i style={{width:`${p.percent}%`}} /></div><span className={styles.paid}>지급 ${p.awarded}</span></td>
        </tr>)}</tbody>
      </table>
      {rows.length === 0 && <p className={styles.empty}>표시할 학생이 없습니다.</p>}
      <footer className={styles.footer}><strong>꼭 확인해 주세요</strong><p>숫자는 완료한 일수 / 주간 수업 일수입니다.<br />숙제는 완료·승인, 시험은 점수 확정 기록을 반영합니다.<br />달러는 태도 보너스를 포함한 예상 지급액이며 실제 지급액과 다를 수 있습니다.</p><div>금요일 자정에 새 주 시작 · 보유 달러와 지난 기록 보존</div></footer>
    </article>
    <p className={styles.hint}>휴대폰 화면에 맞춘 관리자용 공지표입니다. 주차와 반을 선택해 확인하세요.</p>
  </div>;
}
