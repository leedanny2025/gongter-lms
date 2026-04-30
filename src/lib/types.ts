export interface Student {
  id: string;
  name: string;
  grade: string;
  classGroup: string;
  parentPhone: string;
  dollars: number;
  joinedAt: string;
  pin: string;
  level?: string;
  progress?: string;
  scheduleDays?: string[];
  scheduleTimes?: Record<string, string>;
  scheduleTime?: string;
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

export type HomeworkStatus = 'pending' | 'agreed' | 'submitted' | 'confirmed' | 'approved' | 'rejected' | 'missed';

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
  status: HomeworkStatus;
  agreedAt?: string;
  completedAt?: string;
  approvedAt?: string;
  note?: string;
  expectedSubmitDate?: string;
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
  day?: string;
}

export interface MakeupRequest {
  id: string;
  studentId: string;
  studentName: string;
  week: string;
  requestedAt: string;
  makeupDate: string;
  makeupTime: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedAt?: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  classGroup: string;
  date: string;
  checkInTime: string;
  checkOutTime?: string;
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

export interface AttitudeRecord {
  id: string;
  studentId: string;
  studentName: string;
  week: string;
  date: string;
  shadowing: number;
  learningAttitude: number;
  basicAttitude: number;
}

export interface AttitudeDollarTier {
  minScore: number;
  dollars: number;
}

export interface AttitudeDollarSettings {
  tier1: AttitudeDollarTier;
  tier2: AttitudeDollarTier;
  tier3: AttitudeDollarTier;
  locked: boolean;
}

export interface AppData {
  students: Student[];
  dollarConditions: DollarCondition[];
  dayHomeworks: DayHomework[];
  testRecords: TestRecord[];
  attendanceRecords: AttendanceRecord[];
  attitudeRecords: AttitudeRecord[];
  makeupRequests: MakeupRequest[];
  attitudeDollarSettings: AttitudeDollarSettings;
  weeklyReports: WeeklyReport[];
  reports: StudentReport[];
  currentWeek: string;
}

export interface StudentReport {
  id: string;
  studentId: string;
  studentName: string;
  type: 'weekly' | 'monthly';
  period: string;
  teacherNotes: string;
  teacherRequests: string;
  createdAt: string;
  updatedAt: string;
}
