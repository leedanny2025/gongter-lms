'use client';
import { useEffect, useRef } from 'react';
import type { Student } from '@/lib/types';
import type { getWeeklyProgress } from '@/lib/weekly-progress';
import styles from './weekly-notice.module.css';

type Props = { student: Student; progress: ReturnType<typeof getWeeklyProgress> };
export default function WeeklyAchievementNotice({ student, progress }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const open = () => { dialog.current?.showModal(); heading.current?.focus({ preventScroll: true }); if (dialog.current) dialog.current.scrollTop = 0; };
  const storageKey = `weekly-notice:${student.id}:${progress.week}`;
  useEffect(() => {
    const modal = dialog.current;
    if (sessionStorage.getItem(storageKey) !== 'read') {
      dialog.current?.showModal();
      heading.current?.focus({ preventScroll: true });
      if (dialog.current) dialog.current.scrollTop = 0;
    }
    return () => modal?.close();
  }, [storageKey]);
  const dismiss = () => { sessionStorage.setItem(storageKey, 'read'); dialog.current?.close(); };
  return <>
    <button className={styles.reopen} onClick={open}>📣 이번 주 달러 성취 공지 보기 <span>→</span></button>
    <dialog ref={dialog} className={styles.dialog} aria-labelledby="weekly-achievement-title" onCancel={dismiss}>
      <div className={styles.hero}>
        <div className={styles.eyebrow}>공터 영어 · 주간 성장 알림</div>
        <h2 ref={heading} tabIndex={-1} id="weekly-achievement-title">{student.name}님의<br />이번 주 달러 성취</h2>
        <p>{progress.range.label}</p>
        <div className={styles.amount}>${progress.earned} <small>/ ${progress.maximum}</small></div>
        <progress aria-label="주간 달러 달성률" max={100} value={progress.percent} />
        <div className={styles.heroMeta}><span>달성률 {progress.percent}%</span><span>예상 지급액 기준</span></div>
      </div>
      <div className={styles.body}>
        <div className={styles.facts}>
          <div><span>이번 주 지급 완료</span><strong>${progress.awarded}</strong></div>
          <div><span>추가 예상 금액</span><strong>${progress.remaining}</strong></div>
        </div>
        <table className={styles.detailTable}>
          <caption className={styles.srOnly}>항목별 주간 달러 성취</caption>
          <thead><tr><th scope="col">항목</th><th scope="col">진행</th><th scope="col">달러</th></tr></thead>
          <tbody>{progress.breakdown.map(row => <tr key={row.id}>
            <th scope="row">{row.name}</th><td>{row.count !== null ? `${row.count}/${row.total}` : row.met ? '달성' : row.type === 'custom' ? '교사 확인' : '평가 중'}</td><td>${row.earned}<span> / ${row.maximum}</span></td>
          </tr>)}</tbody>
        </table>
        <p className={styles.note}>금요일 자정(토요일 0시)에 새 주가 시작돼요.<br />보유 달러와 지난 기록은 그대로 남아요.<br />예상 금액은 선생님 확인 후 지급됩니다.</p>
        <button className={styles.primary} onClick={dismiss}>확인했어요</button>
      </div>
    </dialog>
  </>;
}
