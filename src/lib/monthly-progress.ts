import type { AppData, Student } from './types';
import { getWeekDateRange, localDateStr, koreanDateStr } from './utils';

// Calendar-month reporting is read-only; dollars reflect actual payment dates.
export function getMonthlyProgress(state: AppData, student: Student, month: string) {
  const [year, m] = month.split('-').map(Number);
  const start = `${month}-01`;
  const end = localDateStr(new Date(year, m, 0));
  const inside = (date: string) => date >= start && date <= end;
  const days = ['sun','mon','tue','wed','thu','fri','sat'];
  const configured = student.scheduleDays?.filter(d => days.includes(d));
  const scheduled = new Set(configured?.length ? configured : ['mon','tue','wed','thu','fri']);
  let total = 0;
  for (let d = new Date(year, m - 1, 1); localDateStr(d) <= end; d.setDate(d.getDate() + 1)) {
    if (scheduled.has(days[d.getDay()])) total++;
  }
  const attendance = new Map(state.attendanceRecords.filter(r => r.studentId === student.id && inside(r.date)).map(r => [r.date, r]));
  const homework = new Map(state.dayHomeworks.filter(r => r.studentId === student.id).map(r => {
    const date = getWeekDateRange(r.week).start;
    date.setDate(date.getDate() + ['mon','tue','wed','thu','fri'].indexOf(r.day));
    return [localDateStr(date), r] as const;
  }).filter(([date]) => inside(date)));
  const tests = new Map(state.testRecords.filter(r => r.studentId === student.id && inside(r.date)).map(r => [`${r.date}/${r.subject}`, r]));
  const attitude = new Map(state.attitudeRecords.filter(r => r.studentId === student.id && inside(r.date)).map(r => [r.date, r]));
  return {
    total,
    attendanceCount: [...attendance.values()].filter(r => r.status === 'present' || r.status === 'late').length,
    homeworkCount: [...homework.values()].filter(r => r.status === 'confirmed' || r.status === 'approved').length,
    testCount: new Set([...tests.values()].filter(r => r.status === 'confirmed' && r.score !== null && r.maxScore > 0).map(r => r.date)).size,
    attitudeScore: [...attitude.values()].reduce((sum, r) => sum + r.shadowing + r.learningAttitude + r.basicAttitude, 0),
    awarded: state.awardRecords.filter(r => r.studentId === student.id && r.awardedAt && Number.isFinite(Date.parse(r.awardedAt)) && inside(koreanDateStr(new Date(r.awardedAt)))).reduce((sum, r) => sum + r.amount, 0),
  };
}
