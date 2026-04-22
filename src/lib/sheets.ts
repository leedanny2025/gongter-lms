// Google Sheets 연동
// 브라우저 → /api/sheets (Next.js API 라우트) → Apps Script Web App → Google Sheets

async function post(data: Record<string, unknown>) {
  try {
    await fetch('/api/sheets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch {
    // 네트워크 오류 시 조용히 무시 (로컬 상태는 정상 동작)
  }
}

export const sheetsSync = {
  attendance: (data: {
    date: string; studentName: string; classGroup: string;
    checkInTime: string; status: string;
  }) => post({ type: 'attendance', ...data }),

  homework: (data: {
    week: string; day: string; studentName: string;
    computer: string; textbook: string; vocabulary: string; other: string;
    status: string; submittedAt: string; approvedAt?: string;
  }) => post({ type: 'homework', ...data }),

  test: (data: {
    week: string; date: string; studentName: string; subject: string;
    score: number | null; maxScore: number; status: string;
  }) => post({ type: 'test', ...data }),

  dollar: (data: {
    studentName: string; amount: number; reason: string; newBalance: number;
  }) => post({ type: 'dollar', ...data }),

  student: (data: {
    id: string; name: string; grade: string; classGroup: string;
    dollars: number; pin: string; joinedAt: string;
  }) => post({ type: 'student', ...data }),

  init: () => fetch('/api/sheets?action=init').catch(() => {}),
};
