import type { AppData, Student } from './types';
import { getLearningWeekRange, koreanDateStr } from './utils';

export function getWeeklyProgress(state: AppData, student: Student, week: string) {
  const range = getLearningWeekRange(week);
  const inWeek = (date: string) => date >= range.start && date <= range.end;
  const total = new Set(student.scheduleDays?.filter(d => ['mon','tue','wed','thu','fri','sat','sun'].includes(d))).size || 5;
  // Latest record per date/day wins; repeated entries cannot inflate a weekly reward.
  const attendance = new Map(state.attendanceRecords.filter(r => r.studentId === student.id && inWeek(r.date)).map(r => [r.date, r]));
  const homework = new Map(state.dayHomeworks.filter(r => r.studentId === student.id && r.week === week).map(r => [r.day, r]));
  const tests = new Map(state.testRecords.filter(r => r.studentId === student.id && inWeek(r.date)).map(r => [`${r.date}/${r.subject}`, r]));
  const attendanceCount = Math.min(total, [...attendance.values()].filter(r => r.status === 'present' || r.status === 'late').length);
  const homeworkCount = Math.min(total, [...homework.values()].filter(r => r.status === 'confirmed' || r.status === 'approved').length);
  const testCount = Math.min(total, new Set([...tests.values()].filter(r => r.status === 'confirmed' && r.score !== null && r.maxScore > 0).map(r => r.date)).size);
  const attitude = new Map(state.attitudeRecords.filter(r => r.studentId === student.id && inWeek(r.date)).map(r => [r.date, r]));
  const attitudeScore = [...attitude.values()].reduce((s, r) => s + r.shadowing + r.learningAttitude + r.basicAttitude, 0);
  const breakdown = state.dollarConditions.filter(c => c.enabled).map(c => {
    const maximum = Math.max(0, Number(c.amount) || 0);
    const count = c.type === 'attendance' ? attendanceCount : c.type === 'homework' ? homeworkCount : c.type === 'test' ? testCount : null;
    const rate = count !== null ? count / total : c.type === 'attitude' && attitudeScore >= Math.max(1, state.attitudeDollarSettings.tier3.minScore) ? 1 : 0;
    const earned = Math.min(maximum, Math.max(0, Math.round(maximum * rate)));
    return { ...c, maximum, earned, count, total, met: rate >= 1 };
  });
  const earned = breakdown.reduce((s, c) => s + c.earned, 0);
  const maximum = breakdown.reduce((s, c) => s + c.maximum, 0);
  const awarded = state.awardRecords.filter(r => r.studentId === student.id && (r.week ? r.week === week : inWeek(koreanDateStr(new Date(r.awardedAt))))).reduce((s, r) => s + r.amount, 0);
  return { week, range, total, attendanceCount, homeworkCount, testCount, attitudeScore, breakdown, earned, maximum, awarded, remaining: Math.max(0, earned - awarded), percent: maximum ? Math.min(100, Math.round(earned / maximum * 100)) : 0 };
}
