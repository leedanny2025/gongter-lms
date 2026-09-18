import { HomeworkDay } from './types';

export function localDateStr(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function localTimeStr(d: Date = new Date()): string {
  return d.toTimeString().slice(0, 5);
}

// Learning weeks roll over at Saturday 00:00 Asia/Seoul (Friday midnight).
// The key remains the ISO week of the upcoming Monday for existing weekday records.
export function koreanDateStr(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  return ['year', 'month', 'day'].map(type => parts.find(p => p.type === type)!.value).join('-');
}
export function getWeekKey(date: Date = new Date()): string {
  const d = new Date(`${koreanDateStr(date)}T00:00:00Z`);
  if (d.getUTCDay() === 6) d.setUTCDate(d.getUTCDate() + 2);
  else if (d.getUTCDay() === 0) d.setUTCDate(d.getUTCDate() + 1);
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const year = d.getUTCFullYear();
  const week = Math.ceil(((d.getTime() - Date.UTC(year, 0, 1)) / 86400000 + 1) / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
}
// Monday-based calendar grid; Jan 4 is always in ISO week 1.
export function getWeekDateRange(weekKey: string): { start: Date; end: Date; label: string } {
  const [year, week] = weekKey.split('-W').map(Number);
  const january4 = new Date(year, 0, 4);
  const start = new Date(year, 0, 4 - ((january4.getDay() + 6) % 7) + (week - 1) * 7);
  const end = new Date(start); end.setDate(start.getDate() + 6);
  const friday = new Date(start); friday.setDate(start.getDate() + 4);
  return { start, end, label: `${start.getMonth()+1}/${start.getDate()} ~ ${friday.getMonth()+1}/${friday.getDate()}` };
}
export function getLearningWeekRange(week: string) {
  const { start: monday } = getWeekDateRange(week);
  const start = new Date(monday); start.setDate(monday.getDate() - 2);
  const end = new Date(monday); end.setDate(monday.getDate() + 4);
  return { start: localDateStr(start), end: localDateStr(end), label: `${start.getMonth()+1}/${start.getDate()}(토) ~ ${end.getMonth()+1}/${end.getDate()}(금)` };
}
export function getNextWeekRollover(now: Date = new Date()): Date {
  const { end } = getLearningWeekRange(getWeekKey(now));
  return new Date(new Date(`${end}T00:00:00+09:00`).getTime() + 86400000);
}
export function getPrevWeek(week: string): string {
  const { start } = getWeekDateRange(week); start.setDate(start.getDate() - 7);
  return getWeekKey(new Date(`${localDateStr(start)}T12:00:00+09:00`));
}
export function getNextWeek(week: string): string {
  const { start } = getWeekDateRange(week); start.setDate(start.getDate() + 7);
  return getWeekKey(new Date(`${localDateStr(start)}T12:00:00+09:00`));
}

export const DAY_LABELS: Record<HomeworkDay, string> = {
  mon: '월', tue: '화', wed: '수', thu: '목', fri: '금'
};

export const DAY_ORDER: HomeworkDay[] = ['mon', 'tue', 'wed', 'thu', 'fri'];

export function getDayFromDate(dateStr: string): HomeworkDay | null {
  const day = new Date(dateStr).getDay();
  const map: Record<number, HomeworkDay> = { 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri' };
  return map[day] || null;
}

export function todayDay(): HomeworkDay {
  const d = new Date().getDay();
  const map: Record<number, HomeworkDay> = { 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri' };
  return map[d] || 'mon';
}
