export interface Student {
  id: string;
  name: string;
  grade: string;
  classGroup: string; // 반 (예: A반, B반)
  parentPhone: string;
  dollars: number;
  joinedAt: string;
  pin: string; // 학생 비밀번호 (기본값 '1111')
}

export interface DollarCondition {
  id: string;
  name: string;
  amount: number;
  description: string;
  enabled: boolean;
  type: 'attendance' | 'homework' | 'test' | 'attitude' | 'custom';
}

export type HomeworkDay = 'mon' | 'tue' | 'wed' | 'thu' | 'fri';

export interface DayHomework {
  id: string;
  studentId: string;
  studentName: string;
  week: string;
  day: HomeworkDay;
  computer: string;
  textbook: string;
  vocabulary: string;
  other: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedAt?: string;
}

export interface TestRecord {
  id: string;
  studentId: string;
  studentName: string;
  subject: string;
  score: number | null;
  maxScore: number;
  imageUrl?: string;
  submittedByStudent: boolean;
  status: 'pending' | 'confirmed';
  confirmedAt?: string;
  week: string;
  date: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  classGroup: string;
  date: string;
  checkInTime: string;
  status: 'present' | 'late' | 'absent';
}

export interface WeeklyReport {
  studentId: string;
  studentName: string;
  week: string;
  attendanceDays: number;
  requiredDays: number;
  homeworkDone: boolean;
  testDone: boolean;
  attitudeScore: number;
  dollarsEarned: number;
  conditions: {
    conditionId: string;
    conditionName: string;
    met: boolean;
    amount: number;
  }[];
}

export interface AppData {
  students: Student[];
  dollarConditions: DollarCondition[];
  dayHomeworks: DayHomework[];
  testRecords: TestRecord[];
  attendanceRecords: AttendanceRecord[];
  weeklyReports: WeeklyReport[];
  currentWeek: string;
}
