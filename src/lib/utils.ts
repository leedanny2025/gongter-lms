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

export function getWeekKey(date: Date = new Date()): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
}

export function getWeekDateRange(weekKey: string): { start: Date; end: Date; label: string } {
  const [year, weekStr] = weekKey.split('-W');
  const week = parseInt(weekStr);
  const jan1 = new Date(parseInt(year), 0, 1);
  const startDay = new Date(jan1.getTime() + (week - 1) * 7 * 86400000);
  const dayOfWeek = startDay.getDay();
  const monday = new Date(startDay.getTime() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) * 86400000);
  const friday = new Date(monday.getTime() + 4 * 86400000);
  const sunday = new Date(monday.getTime() + 6 * 86400000); // 월요일부터 일요일까지 포함
  const label = `${monday.getMonth() + 1}/${monday.getDate()} ~ ${friday.getMonth() + 1}/${friday.getDate()}`;
  return { start: monday, end: sunday, label };
}

export function getPrevWeek(weekKey: string): string {
  const { start } = getWeekDateRange(weekKey);
  start.setDate(start.getDate() - 7);
  return getWeekKey(start);
}

export function getNextWeek(weekKey: string): string {
  const { start } = getWeekDateRange(weekKey);
  start.setDate(start.getDate() + 7);
  return getWeekKey(start);
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
