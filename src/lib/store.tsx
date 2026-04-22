'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { AppData, Student, DollarCondition, DayHomework, TestRecord, AttendanceRecord } from './types';
import { initialData } from './mockData';
import { sheetsSync } from './sheets';

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
  | { type: 'CONFIRM_TEST'; payload: { id: string; score: number } }
  | { type: 'ADD_TEST'; payload: TestRecord }
  | { type: 'UPDATE_ATTENDANCE'; payload: AttendanceRecord }
  | { type: 'ADD_ATTENDANCE'; payload: AttendanceRecord }
  | { type: 'AWARD_DOLLARS'; payload: { studentId: string; amount: number; reason?: string } }
  | { type: 'SET_WEEK'; payload: string };

function reducer(state: AppData, action: Action): AppData {
  switch (action.type) {
    case 'ADD_STUDENT':
      return { ...state, students: [...state.students, action.payload] };
    case 'UPDATE_STUDENT':
      return { ...state, students: state.students.map(s => s.id === action.payload.id ? action.payload : s) };
    case 'DELETE_STUDENT':
      return { ...state, students: state.students.filter(s => s.id !== action.payload) };
    case 'ADD_CONDITION':
      return { ...state, dollarConditions: [...state.dollarConditions, action.payload] };
    case 'UPDATE_CONDITION':
      return { ...state, dollarConditions: state.dollarConditions.map(c => c.id === action.payload.id ? action.payload : c) };
    case 'DELETE_CONDITION':
      return { ...state, dollarConditions: state.dollarConditions.filter(c => c.id !== action.payload) };
    case 'ADD_HOMEWORK':
      return { ...state, dayHomeworks: [...state.dayHomeworks, action.payload] };
    case 'UPDATE_HOMEWORK':
      return { ...state, dayHomeworks: state.dayHomeworks.map(h => h.id === action.payload.id ? action.payload : h) };
    case 'APPROVE_HOMEWORK': {
      const approvedAt = new Date().toISOString();
      const hw = state.dayHomeworks.find(h => h.id === action.payload);
      if (hw) sheetsSync.homework({ ...hw, status: 'approved', approvedAt });
      return {
        ...state,
        dayHomeworks: state.dayHomeworks.map(h =>
          h.id === action.payload ? { ...h, status: 'approved', approvedAt } : h
        )
      };
    }
    case 'REJECT_HOMEWORK':
      return {
        ...state,
        dayHomeworks: state.dayHomeworks.map(h =>
          h.id === action.payload ? { ...h, status: 'rejected' } : h
        )
      };
    case 'CONFIRM_TEST': {
      const t = state.testRecords.find(x => x.id === action.payload.id);
      if (t) sheetsSync.test({ ...t, score: action.payload.score, status: 'confirmed' });
      return {
        ...state,
        testRecords: state.testRecords.map(t =>
          t.id === action.payload.id ? { ...t, score: action.payload.score, status: 'confirmed', confirmedAt: new Date().toISOString() } : t
        )
      };
    }
    case 'ADD_TEST': {
      sheetsSync.test(action.payload);
      return { ...state, testRecords: [...state.testRecords, action.payload] };
    }
    case 'ADD_ATTENDANCE': {
      sheetsSync.attendance(action.payload);
      return { ...state, attendanceRecords: [...state.attendanceRecords, action.payload] };
    }
    case 'UPDATE_ATTENDANCE':
      return { ...state, attendanceRecords: state.attendanceRecords.map(a => a.id === action.payload.id ? action.payload : a) };
    case 'AWARD_DOLLARS': {
      const student = state.students.find(s => s.id === action.payload.studentId);
      if (student) {
        sheetsSync.dollar({
          studentName: student.name,
          amount: action.payload.amount,
          reason: action.payload.reason || '주간 달러 지급',
          newBalance: Math.max(0, student.dollars + action.payload.amount),
        });
      }
      return {
        ...state,
        students: state.students.map(s =>
          s.id === action.payload.studentId ? { ...s, dollars: Math.max(0, s.dollars + action.payload.amount) } : s
        )
      };
    }
    case 'SET_WEEK':
      return { ...state, currentWeek: action.payload };
    default:
      return state;
  }
}

const StoreContext = createContext<{
  state: AppData;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialData);
  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
