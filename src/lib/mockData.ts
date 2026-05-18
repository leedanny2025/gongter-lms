import { AppData } from './types';
import { getWeekKey } from './utils';

export const initialData: AppData = {
  students: [],
  dollarConditions: [
    { id: 'c1', name: '출석 완료', amount: 4, description: '주간 수업 모두 출석', enabled: true, type: 'attendance' },
    { id: 'c2', name: '숙제 완료', amount: 3, description: '주간 숙제 제출 및 승인', enabled: true, type: 'homework' },
    { id: 'c3', name: '시험 응시', amount: 2, description: '주간 시험 응시 및 점수 확정', enabled: true, type: 'test' },
    { id: 'c4', name: '학습 태도', amount: 1, description: '수업 태도 우수 (교사 평가)', enabled: true, type: 'attitude' },
  ],
  dayHomeworks: [],
  testRecords: [],
  attendanceRecords: [],
  attitudeRecords: [],
  makeupRequests: [],
  attitudeDollarSettings: {
    tier1: { minScore: 20, dollars: 5 },
    tier2: { minScore: 10, dollars: 3 },
    tier3: { minScore: 1,  dollars: 1 },
    locked: false,
  },
  weeklyReports: [],
  reports: [],
  currentWeek: getWeekKey(),
  shopItems: [],
  purchases: [],
};
