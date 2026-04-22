import { AppData } from './types';
import { getWeekKey } from './utils';

const week = getWeekKey();

export const initialData: AppData = {
  students: [
    { id: 's1', name: '김민준', grade: '중1', classGroup: 'A반', parentPhone: '010-1234-5678', dollars: 45, joinedAt: '2024-03-01' },
    { id: 's2', name: '이서연', grade: '중2', classGroup: 'A반', parentPhone: '010-2345-6789', dollars: 62, joinedAt: '2024-03-01' },
    { id: 's3', name: '박지호', grade: '중1', classGroup: 'B반', parentPhone: '010-3456-7890', dollars: 28, joinedAt: '2024-04-01' },
    { id: 's4', name: '최수아', grade: '중3', classGroup: 'B반', parentPhone: '010-4567-8901', dollars: 80, joinedAt: '2024-02-01' },
    { id: 's5', name: '정도윤', grade: '중2', classGroup: 'A반', parentPhone: '010-5678-9012', dollars: 15, joinedAt: '2024-05-01' },
  ],
  dollarConditions: [
    { id: 'c1', name: '출석 완료', amount: 4, description: '주간 수업 모두 출석', enabled: true, type: 'attendance' },
    { id: 'c2', name: '숙제 완료', amount: 3, description: '주간 숙제 제출 및 승인', enabled: true, type: 'homework' },
    { id: 'c3', name: '시험 응시', amount: 2, description: '주간 시험 응시 및 점수 확정', enabled: true, type: 'test' },
    { id: 'c4', name: '학습 태도', amount: 1, description: '수업 태도 우수 (교사 평가)', enabled: true, type: 'attitude' },
  ],
  dayHomeworks: [
    { id: 'h1', studentId: 's1', studentName: '김민준', week, day: 'mon', computer: '단어 앱 20분', textbook: 'p.45 문제 풀기', vocabulary: '20개 암기', other: '', submittedAt: '2026-04-21T14:30:00', status: 'approved', approvedAt: '2026-04-21T16:00:00' },
    { id: 'h2', studentId: 's2', studentName: '이서연', week, day: 'mon', computer: 'EBS 강의 1강', textbook: 'Unit 5 독해', vocabulary: '15개', other: '', submittedAt: '2026-04-21T16:00:00', status: 'pending' },
    { id: 'h3', studentId: 's4', studentName: '최수아', week, day: 'mon', computer: '', textbook: '문법 워크북 Unit 3', vocabulary: '30개', other: '수동태 문장 10개 작문', submittedAt: '2026-04-20T19:00:00', status: 'approved', approvedAt: '2026-04-21T09:00:00' },
    { id: 'h4', studentId: 's1', studentName: '김민준', week, day: 'tue', computer: '단어 앱 20분', textbook: 'p.50 문제 풀기', vocabulary: '20개', other: '', submittedAt: '2026-04-22T08:00:00', status: 'pending' },
  ],
  testRecords: [
    { id: 't1', studentId: 's1', studentName: '김민준', subject: '영어 어휘 테스트', score: 85, maxScore: 100, submittedByStudent: false, status: 'confirmed', confirmedAt: '2026-04-18T11:00:00', week, date: '2026-04-18' },
    { id: 't2', studentId: 's2', studentName: '이서연', subject: '영어 어휘 테스트', score: 92, maxScore: 100, submittedByStudent: true, status: 'pending', week, date: '2026-04-18' },
    { id: 't3', studentId: 's4', studentName: '최수아', subject: '영어 어휘 테스트', score: 78, maxScore: 100, submittedByStudent: false, status: 'confirmed', confirmedAt: '2026-04-18T11:00:00', week, date: '2026-04-18' },
    { id: 't4', studentId: 's3', studentName: '박지호', subject: '영어 어휘 테스트', score: null, maxScore: 100, submittedByStudent: false, status: 'pending', week, date: '2026-04-22' },
  ],
  attendanceRecords: [
    { id: 'a1', studentId: 's1', studentName: '김민준', classGroup: 'A반', date: '2026-04-22', checkInTime: '14:02', status: 'present' },
    { id: 'a2', studentId: 's2', studentName: '이서연', classGroup: 'A반', date: '2026-04-22', checkInTime: '14:15', status: 'late' },
    { id: 'a3', studentId: 's4', studentName: '최수아', classGroup: 'B반', date: '2026-04-22', checkInTime: '13:58', status: 'present' },
    { id: 'a4', studentId: 's1', studentName: '김민준', classGroup: 'A반', date: '2026-04-21', checkInTime: '14:00', status: 'present' },
    { id: 'a5', studentId: 's2', studentName: '이서연', classGroup: 'A반', date: '2026-04-21', checkInTime: '14:01', status: 'present' },
    { id: 'a6', studentId: 's3', studentName: '박지호', classGroup: 'B반', date: '2026-04-21', checkInTime: '14:20', status: 'late' },
  ],
  weeklyReports: [],
  currentWeek: week,
};
