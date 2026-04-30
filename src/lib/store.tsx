'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode, useState, useRef, useCallback } from 'react';
import { fbSet, fbDelete, fbGet } from './firebase';
import { AppData, Student, DollarCondition, DayHomework, TestRecord, AttendanceRecord, AttitudeRecord, MakeupRequest, AttitudeDollarSettings, StudentReport } from './types';
import { initialData } from './mockData';
import { sheetsSync } from './sheets';
import { getWeekKey } from './utils';

type Action =
  | { type: 'ADD_STUDENT'; payload: Student }
  | { type: 'UPDATE_STUDENT'; payload: Student }
  | { type: 'DELETE_STUDENT'; payload: string }
  | { type: 'ADD_CONDITION'; payload: DollarCondition }
  | { type: 'UPDATE_CONDITION'; payload: DollarCondition }
  | { type: 'DELETE_CONDITION'; payload: string }
  | { type: 'ADD_HOMEWORK'; payload: DayHomework }
  | { type: 'UPDATE_HOMEWORK'; payload: DayHomework }
  | { type: 'APPROVE_HOMEWORK'; payload: string }
  | { type: 'REJECT_HOMEWORK'; payload: string }
  | { type: 'AGREE_HOMEWORK'; payload: string }
  | { type: 'COMPLETE_HOMEWORK'; payload: { id: string; note?: string } }
  | { type: 'CONFIRM_HOMEWORK'; payload: { id: string; result: 'confirmed' | 'rejected' } }
  | { type: 'SET_ATTITUDE_SETTINGS'; payload: AttitudeDollarSettings }
  | { type: 'CONFIRM_TEST'; payload: { id: string; score: number } }
  | { type: 'UPDATE_TEST'; payload: TestRecord }
  | { type: 'ADD_TEST'; payload: TestRecord }
  | { type: 'UPDATE_ATTENDANCE'; payload: AttendanceRecord }
  | { type: 'ADD_ATTENDANCE'; payload: AttendanceRecord }
  | { type: 'DELETE_ATTENDANCE'; payload: string }
  | { type: 'AWARD_DOLLARS'; payload: { studentId: string; amount: number; reason?: string } }
  | { type: 'ADD_ATTITUDE'; payload: AttitudeRecord }
  | { type: 'UPDATE_ATTITUDE'; payload: AttitudeRecord }
  | { type: 'DELETE_ATTITUDE'; payload: string }
  | { type: 'ADD_MAKEUP'; payload: MakeupRequest }
  | { type: 'UPDATE_MAKEUP'; payload: MakeupRequest }
  | { type: 'SET_WEEK'; payload: string }
  | { type: 'WEEK_RESET'; payload: string }
  | { type: 'RESET_ATTENDANCE' }
  | { type: 'RESET_ATTITUDE' }
  | { type: 'SAVE_REPORT'; payload: StudentReport }
  | { type: '_SET'; payload: Partial<AppData> };

function toArr<T>(val: unknown): T[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean) as T[];
  return Object.values(val as object).filter(Boolean) as T[];
}

function reducer(state: AppData, action: Action): AppData {
  switch (action.type) {
    case '_SET': return { ...state, ...action.payload };
    case 'ADD_STUDENT':    return { ...state, students: [...state.students, action.payload] };
    case 'UPDATE_STUDENT': return { ...state, students: state.students.map(s => s.id === action.payload.id ? action.payload : s) };
    case 'DELETE_STUDENT': return { ...state, students: state.students.filter(s => s.id !== action.payload) };
    case 'ADD_CONDITION':    return { ...state, dollarConditions: [...state.dollarConditions, action.payload] };
    case 'UPDATE_CONDITION': return { ...state, dollarConditions: state.dollarConditions.map(c => c.id === action.payload.id ? action.payload : c) };
    case 'DELETE_CONDITION': return { ...state, dollarConditions: state.dollarConditions.filter(c => c.id !== action.payload) };
    case 'ADD_HOMEWORK': return {
      ...state,
      dayHomeworks: [
        ...state.dayHomeworks.filter(h =>
          !(h.studentId === action.payload.studentId &&
            h.week === action.payload.week &&
            h.day === action.payload.day)
        ),
        action.payload,
      ],
    };
    case 'UPDATE_HOMEWORK': return { ...state, dayHomeworks: state.dayHomeworks.map(h => h.id === action.payload.id ? action.payload : h) };
    case 'APPROVE_HOMEWORK': return { ...state, dayHomeworks: state.dayHomeworks.map(h => h.id === action.payload ? { ...h, status: 'approved', approvedAt: new Date().toISOString() } : h) };
    case 'REJECT_HOMEWORK':  return { ...state, dayHomeworks: state.dayHomeworks.map(h => h.id === action.payload ? { ...h, status: 'rejected' } : h) };
    case 'AGREE_HOMEWORK':   return { ...state, dayHomeworks: state.dayHomeworks.map(h => h.id === action.payload ? { ...h, status: 'agreed', agreedAt: new Date().toISOString() } : h) };
    case 'COMPLETE_HOMEWORK': return { ...state, dayHomeworks: state.dayHomeworks.map(h => h.id === action.payload.id ? { ...h, status: 'submitted', completedAt: new Date().toISOString(), note: action.payload.note } : h) };
    case 'CONFIRM_HOMEWORK': return { ...state, dayHomeworks: state.dayHomeworks.map(h => h.id === action.payload.id ? { ...h, status: action.payload.result, approvedAt: new Date().toISOString() } : h) };
    case 'SET_ATTITUDE_SETTINGS': return { ...state, attitudeDollarSettings: action.payload };
    case 'ADD_TEST':     return { ...state, testRecords: [...state.testRecords, action.payload] };
    case 'UPDATE_TEST':  return { ...state, testRecords: state.testRecords.map(t => t.id === action.payload.id ? action.payload : t) };
    case 'CONFIRM_TEST': return { ...state, testRecords: state.testRecords.map(t => t.id === action.payload.id ? { ...t, score: action.payload.score, status: 'confirmed', confirmedAt: new Date().toISOString() } : t) };
    case 'ADD_ATTENDANCE': return {
      ...state,
      attendanceRecords: [
        ...state.attendanceRecords.filter(a =>
          !(a.studentId === action.payload.studentId && a.date === action.payload.date)
        ),
        action.payload,
      ],
    };
    case 'UPDATE_ATTENDANCE': return { ...state, attendanceRecords: state.attendanceRecords.map(a => a.id === action.payload.id ? action.payload : a) };
    case 'DELETE_ATTENDANCE': return { ...state, attendanceRecords: state.attendanceRecords.filter(a => a.id !== action.payload) };
    case 'ADD_ATTITUDE':    return { ...state, attitudeRecords: [...(state.attitudeRecords||[]), action.payload] };
    case 'UPDATE_ATTITUDE': return { ...state, attitudeRecords: (state.attitudeRecords||[]).map(a => a.id === action.payload.id ? action.payload : a) };
    case 'DELETE_ATTITUDE': return { ...state, attitudeRecords: (state.attitudeRecords||[]).filter(a => a.id !== action.payload) };
    case 'ADD_MAKEUP':    return { ...state, makeupRequests: [...(state.makeupRequests||[]), action.payload] };
    case 'UPDATE_MAKEUP': return { ...state, makeupRequests: (state.makeupRequests||[]).map(m => m.id === action.payload.id ? action.payload : m) };
    case 'AWARD_DOLLARS': return { ...state, students: state.students.map(s => s.id === action.payload.studentId ? { ...s, dollars: Math.max(0, s.dollars + action.payload.amount) } : s) };
    case 'SET_WEEK': return { ...state, currentWeek: action.payload };
    case 'WEEK_RESET': return {
      ...state,
      currentWeek: action.payload,
      dayHomeworks: [],
      attendanceRecords: [],
      attitudeRecords: [],
      makeupRequests: [],
      students: state.students.map(s => ({ ...s, dollars: 0 })),
    };
    case 'RESET_ATTENDANCE': return { ...state, attendanceRecords: [] };
    case 'RESET_ATTITUDE':   return { ...state, attitudeRecords: [] };
    case 'SAVE_REPORT': return { ...state, reports: [...(state.reports || []).filter(r => r.id !== action.payload.id), action.payload] };
    default: return state;
  }
}

type UndoEntry = { label: string; undo: () => void };

function makeUndoEntry(action: Action, snap: AppData, rd: React.Dispatch<Action>): UndoEntry | null {
  switch (action.type) {
    case 'ADD_STUDENT':
      return { label: '학생 추가', undo: () => { rd({ type: 'DELETE_STUDENT', payload: action.payload.id }); fbDelete(`lms/students/${action.payload.id}`); } };
    case 'UPDATE_STUDENT': {
      const old = snap.students.find(s => s.id === action.payload.id);
      if (!old) return null;
      return { label: '학생 수정', undo: () => { rd({ type: 'UPDATE_STUDENT', payload: old }); fbSet(`lms/students/${old.id}`, old); } };
    }
    case 'DELETE_STUDENT': {
      const old = snap.students.find(s => s.id === action.payload);
      if (!old) return null;
      return { label: '학생 삭제', undo: () => { rd({ type: 'ADD_STUDENT', payload: old }); fbSet(`lms/students/${old.id}`, old); } };
    }
    case 'AGREE_HOMEWORK': {
      const old = snap.dayHomeworks.find(h => h.id === action.payload);
      if (!old) return null;
      return { label: '숙제 범위 확정', undo: () => { rd({ type: 'UPDATE_HOMEWORK', payload: old }); fbSet(`lms/homework/${old.id}`, old); } };
    }
    case 'APPROVE_HOMEWORK': {
      const old = snap.dayHomeworks.find(h => h.id === action.payload);
      if (!old) return null;
      return { label: '숙제 승인', undo: () => { rd({ type: 'UPDATE_HOMEWORK', payload: old }); fbSet(`lms/homework/${old.id}`, old); } };
    }
    case 'REJECT_HOMEWORK': {
      const old = snap.dayHomeworks.find(h => h.id === action.payload);
      if (!old) return null;
      return { label: '숙제 반려', undo: () => { rd({ type: 'UPDATE_HOMEWORK', payload: old }); fbSet(`lms/homework/${old.id}`, old); } };
    }
    case 'COMPLETE_HOMEWORK': {
      const old = snap.dayHomeworks.find(h => h.id === action.payload.id);
      if (!old) return null;
      return { label: '숙제 제출', undo: () => { rd({ type: 'UPDATE_HOMEWORK', payload: old }); fbSet(`lms/homework/${old.id}`, old); } };
    }
    case 'CONFIRM_HOMEWORK': {
      const old = snap.dayHomeworks.find(h => h.id === action.payload.id);
      if (!old) return null;
      return { label: '숙제 확인', undo: () => { rd({ type: 'UPDATE_HOMEWORK', payload: old }); fbSet(`lms/homework/${old.id}`, old); } };
    }
    case 'CONFIRM_TEST': {
      const old = snap.testRecords.find(t => t.id === action.payload.id);
      if (!old) return null;
      return { label: '시험 확인', undo: () => { rd({ type: 'UPDATE_TEST', payload: old }); fbSet(`lms/tests/${old.id}`, old); } };
    }
    case 'ADD_TEST': {
      const savedRecords = snap.testRecords;
      return { label: '시험 추가', undo: () => { rd({ type: '_SET', payload: { testRecords: savedRecords } }); fbDelete(`lms/tests/${action.payload.id}`); } };
    }
    case 'ADD_ATTENDANCE': {
      const savedRecords = snap.attendanceRecords;
      return { label: '출석 추가', undo: () => { rd({ type: '_SET', payload: { attendanceRecords: savedRecords } }); fbDelete(`lms/attendance/${action.payload.id}`); } };
    }
    case 'UPDATE_ATTENDANCE': {
      const old = snap.attendanceRecords.find(a => a.id === action.payload.id);
      if (!old) return null;
      return { label: '출석 수정', undo: () => { rd({ type: 'UPDATE_ATTENDANCE', payload: old }); fbSet(`lms/attendance/${old.id}`, old); } };
    }
    case 'ADD_ATTITUDE': {
      return { label: '태도 입력', undo: () => { rd({ type: 'DELETE_ATTITUDE', payload: action.payload.id }); fbDelete(`lms/attitude/${action.payload.id}`); } };
    }
    case 'UPDATE_ATTITUDE': {
      const old = (snap.attitudeRecords || []).find(a => a.id === action.payload.id);
      if (!old) return null;
      return { label: '태도 수정', undo: () => { rd({ type: 'UPDATE_ATTITUDE', payload: old }); fbSet(`lms/attitude/${old.id}`, old); } };
    }
    case 'DELETE_ATTITUDE': {
      const old = (snap.attitudeRecords || []).find(a => a.id === action.payload);
      if (!old) return null;
      return { label: '태도 삭제', undo: () => { rd({ type: 'ADD_ATTITUDE', payload: old }); fbSet(`lms/attitude/${old.id}`, old); } };
    }
    case 'AWARD_DOLLARS': {
      const old = snap.students.find(s => s.id === action.payload.studentId);
      if (!old) return null;
      return { label: '달러 지급', undo: () => { rd({ type: 'UPDATE_STUDENT', payload: old }); fbSet(`lms/students/${old.id}`, old); } };
    }
    default: return null;
  }
}

const StoreContext = createContext<{
  state: AppData;
  dispatch: React.Dispatch<Action>;
  refresh: () => Promise<void>;
  undo: () => void;
  canUndo: boolean;
  undoLabel: string;
} | null>(null);

// 같은 studentId+week+day 조합이 중복될 경우 마지막 것만 유지
function dedupeHomework(hws: DayHomework[]): DayHomework[] {
  const map = new Map<string, DayHomework>();
  hws.forEach(h => map.set(`${h.studentId}-${h.week}-${h.day}`, h));
  return Array.from(map.values());
}

// 같은 studentId+date 출석이 중복될 경우 마지막 것만 유지
function dedupeAttendance(recs: AttendanceRecord[]): AttendanceRecord[] {
  const map = new Map<string, AttendanceRecord>();
  recs.forEach(r => map.set(`${r.studentId}-${r.date}`, r));
  return Array.from(map.values());
}

function applyFirebaseData(data: Record<string, unknown>, dispatch: React.Dispatch<Action>) {
  const fbConditions = toArr<DollarCondition>(data.conditions);
  dispatch({ type: '_SET', payload: {
    students:          toArr<Student>(data.students),
    attendanceRecords: dedupeAttendance(toArr<AttendanceRecord>(data.attendance)),
    dayHomeworks:      dedupeHomework(toArr<DayHomework>(data.homework)),
    testRecords:       toArr<TestRecord>(data.tests),
    attitudeRecords:   toArr<AttitudeRecord>(data.attitude),
    makeupRequests:    toArr<MakeupRequest>(data.makeup),
    reports:           toArr<StudentReport>(data.reports),
    currentWeek:       (data.currentWeek as string | undefined) ?? initialData.currentWeek,
    attitudeDollarSettings: (data.settings as any)?.attitudeDollar ?? initialData.attitudeDollarSettings,
    // Firebase 조건이 있으면 우선, 없으면 기본값 사용
    dollarConditions:  fbConditions.length ? fbConditions : initialData.dollarConditions,
  }});
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, rawDispatch] = useReducer(reducer, initialData);
  const [ready, setReady] = useState(true);
  const stateRef = useRef(state);
  stateRef.current = state;

  const undoStackRef = useRef<UndoEntry[]>([]);
  const [undoStackLen, setUndoStackLen] = useState(0);
  // 로컬 액션 직후 일정 시간 동안 Firebase 폴링이 state를 덮어쓰지 않도록 보호
  const lastLocalActionRef = useRef<number>(0);

  const undo = useCallback(() => {
    const entry = undoStackRef.current[undoStackRef.current.length - 1];
    if (!entry) return;
    undoStackRef.current = undoStackRef.current.slice(0, -1);
    setUndoStackLen(undoStackRef.current.length);
    entry.undo();
  }, []);

  const dispatch = useCallback((action: Action) => {
    const snap = stateRef.current;
    const undoEntry = makeUndoEntry(action, snap, rawDispatch);

    // 로컬 액션 시간 기록 (폴링 보호용)
    lastLocalActionRef.current = Date.now();

    rawDispatch(action);
    const s = snap;

    switch (action.type) {
      case 'ADD_STUDENT':
      case 'UPDATE_STUDENT':
        fbSet(`lms/students/${action.payload.id}`, action.payload); break;
      case 'DELETE_STUDENT':
        fbDelete(`lms/students/${action.payload}`); break;
      case 'ADD_CONDITION':
      case 'UPDATE_CONDITION':
        fbSet(`lms/conditions/${action.payload.id}`, action.payload); break;
      case 'DELETE_CONDITION':
        fbDelete(`lms/conditions/${action.payload}`); break;
      case 'ADD_HOMEWORK':
      case 'UPDATE_HOMEWORK':
        fbSet(`lms/homework/${action.payload.id}`, action.payload); break;
      case 'APPROVE_HOMEWORK': {
        const hw = s.dayHomeworks.find(h => h.id === action.payload);
        if (hw) { const u = { ...hw, status: 'approved', approvedAt: new Date().toISOString() }; fbSet(`lms/homework/${hw.id}`, u); sheetsSync.homework(u); } break;
      }
      case 'REJECT_HOMEWORK': {
        const hw = s.dayHomeworks.find(h => h.id === action.payload);
        if (hw) fbSet(`lms/homework/${hw.id}`, { ...hw, status: 'rejected' }); break;
      }
      case 'AGREE_HOMEWORK': {
        const hw = s.dayHomeworks.find(h => h.id === action.payload);
        if (hw) fbSet(`lms/homework/${hw.id}`, { ...hw, status: 'agreed', agreedAt: new Date().toISOString() }); break;
      }
      case 'COMPLETE_HOMEWORK': {
        const hw = s.dayHomeworks.find(h => h.id === action.payload.id);
        if (hw) fbSet(`lms/homework/${hw.id}`, { ...hw, status: 'submitted', completedAt: new Date().toISOString(), note: action.payload.note }); break;
      }
      case 'CONFIRM_HOMEWORK': {
        const hw = s.dayHomeworks.find(h => h.id === action.payload.id);
        if (hw) { const u = { ...hw, status: action.payload.result, approvedAt: new Date().toISOString() }; fbSet(`lms/homework/${hw.id}`, u); if (action.payload.result === 'confirmed') sheetsSync.homework(u); } break;
      }
      case 'SET_ATTITUDE_SETTINGS':
        fbSet('lms/settings/attitudeDollar', action.payload); break;
      case 'ADD_TEST':
        fbSet(`lms/tests/${action.payload.id}`, action.payload); sheetsSync.test(action.payload); break;
      case 'UPDATE_TEST':
        fbSet(`lms/tests/${action.payload.id}`, action.payload); break;
      case 'CONFIRM_TEST': {
        const t = s.testRecords.find(x => x.id === action.payload.id);
        if (t) { const u = { ...t, score: action.payload.score, status: 'confirmed', confirmedAt: new Date().toISOString() }; fbSet(`lms/tests/${t.id}`, u); sheetsSync.test(u); } break;
      }
      case 'ADD_ATTENDANCE':
        fbSet(`lms/attendance/${action.payload.id}`, action.payload); sheetsSync.attendance(action.payload); break;
      case 'UPDATE_ATTENDANCE':
        fbSet(`lms/attendance/${action.payload.id}`, action.payload); break;
      case 'DELETE_ATTENDANCE':
        fbDelete(`lms/attendance/${action.payload}`); break;
      case 'RESET_ATTENDANCE':
        fbSet('lms/attendance', null); break;
      case 'RESET_ATTITUDE':
        fbSet('lms/attitude', null); break;
      case 'SAVE_REPORT':
        fbSet(`lms/reports/${action.payload.id}`, action.payload); break;
      case 'ADD_ATTITUDE':
      case 'UPDATE_ATTITUDE':
        fbSet(`lms/attitude/${action.payload.id}`, action.payload); break;
      case 'DELETE_ATTITUDE':
        fbDelete(`lms/attitude/${action.payload}`); break;
      case 'ADD_MAKEUP':
      case 'UPDATE_MAKEUP':
        fbSet(`lms/makeup/${action.payload.id}`, action.payload); break;
      case 'WEEK_RESET':
        fbSet('lms/homework', null);
        fbSet('lms/attendance', null);
        fbSet('lms/attitude', null);
        fbSet('lms/makeup', null);
        fbSet('lms/currentWeek', action.payload);
        snap.students.forEach(st => fbSet(`lms/students/${st.id}`, { ...st, dollars: 0 }));
        break;
      case 'AWARD_DOLLARS': {
        const student = s.students.find(x => x.id === action.payload.studentId);
        if (student) { const u = { ...student, dollars: Math.max(0, student.dollars + action.payload.amount) }; fbSet(`lms/students/${student.id}`, u); sheetsSync.dollar({ studentName: student.name, amount: action.payload.amount, reason: action.payload.reason || '주간 달러 지급', newBalance: u.dollars }); } break;
      }
    }

    if (undoEntry) {
      undoStackRef.current = [...undoStackRef.current.slice(-14), undoEntry];
      setUndoStackLen(undoStackRef.current.length);
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const data = await fbGet('lms');
      if (data && typeof data === 'object') applyFirebaseData(data as Record<string, unknown>, rawDispatch);
    } catch {}
  }, []);

  // 초기 로드 + 5분마다 폴링 (로컬 액션 30초 이내면 폴링 스킵)
  useEffect(() => {
    const POLL_INTERVAL = 5 * 60 * 1000; // 5분
    const LOCAL_GRACE = 30 * 1000;        // 로컬 액션 후 30초간 폴링 skip

    const load = (isInitial = false) => fbGet('lms').then(data => {
      // 초기 로드가 아니고 최근 로컬 액션이 있으면 Firebase 데이터로 덮어쓰지 않음
      if (!isInitial && Date.now() - lastLocalActionRef.current < LOCAL_GRACE) return;

      if (data && typeof data === 'object') {
        applyFirebaseData(data as Record<string, unknown>, rawDispatch);
        const storedWeek = (data as Record<string, unknown>).currentWeek as string | undefined;
        const actualWeek = getWeekKey();
        if (storedWeek && storedWeek !== actualWeek) {
          dispatch({ type: 'WEEK_RESET', payload: actualWeek });
        }
      }
      setReady(true);
    }).catch(() => setReady(true));

    load(true);
    const interval = setInterval(() => load(false), POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const canUndo = undoStackLen > 0;
  const undoLabel = undoStackLen > 0 ? undoStackRef.current[undoStackLen - 1].label : '';

  return (
    <StoreContext.Provider value={{ state, dispatch, refresh, undo, canUndo, undoLabel }}>
      {!ready
        ? <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 40, height: 40, border: '4px solid #e2e8f0', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
              <div style={{ color: '#94a3b8', fontSize: 14 }}>로딩 중...</div>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        : children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
