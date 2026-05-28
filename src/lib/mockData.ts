import { AppData } from './types';
import { getWeekKey } from './utils';

export const initialData: AppData = {
  students: [
    {
      id: 'student-001',
      name: '김철수',
      classGroup: '초급반',
      grade: '중등',
      parentPhone: '010-1234-5678',
      joinedAt: new Date(Date.now() - 90*24*60*60*1000).toISOString(),
      pin: '1234',
      dollars: 25,
      scheduleDays: ['mon', 'wed', 'fri'],
    },
  ],
  dollarConditions: [
    { id: 'c1', name: '출석 완료', amount: 4, description: '주간 수업 모두 출석', enabled: true, type: 'attendance' },
    { id: 'c2', name: '숙제 완료', amount: 3, description: '주간 숙제 제출 및 승인', enabled: true, type: 'homework' },
    { id: 'c3', name: '시험 응시', amount: 2, description: '주간 시험 응시 및 점수 확정', enabled: true, type: 'test' },
    { id: 'c4', name: '학습 태도', amount: 1, description: '수업 태도 우수 (교사 평가)', enabled: true, type: 'attitude' },
  ],
  dayHomeworks: [
    {
      id: 'hw-001',
      studentId: 'student-001',
      studentName: '김철수',
      week: getWeekKey(),
      day: 'wed',
      computer: 'time 10분 학습',
      textbook: '',
      vocabulary: '단어 10개',
      other: '',
      submittedAt: new Date().toISOString(),
      status: 'approved',
      approvedAt: new Date().toISOString(),
    },
  ],
  testRecords: [
    {
      id: 'test-001',
      studentId: 'student-001',
      studentName: '김철수',
      subject: '영어 어휘 테스트',
      score: 18,
      maxScore: 20,
      submittedByStudent: true,
      status: 'confirmed',
      week: getWeekKey(),
      date: new Date().toISOString().split('T')[0],
      day: 'wed',
    },
  ],
  attendanceRecords: [
    {
      id: 'att-001',
      studentId: 'student-001',
      studentName: '김철수',
      classGroup: '초급반',
      date: new Date().toISOString().split('T')[0],
      checkInTime: '18:50',
      status: 'present',
    },
  ],
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
