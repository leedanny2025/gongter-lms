// Google Sheets 연동 (Apps Script Web App URL 설정 필요)
// NEXT_PUBLIC_SHEETS_URL 환경 변수에 Apps Script 배포 URL 설정

const SHEETS_URL = process.env.NEXT_PUBLIC_SHEETS_URL || '';

async function post(data: Record<string, unknown>) {
  if (!SHEETS_URL) return; // URL 미설정 시 조용히 무시
  try {
    await fetch(SHEETS_URL, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
      mode: 'no-cors', // Apps Script CORS 우회
    });
  } catch {
    // 네트워크 오류 무시 (로컬 상태는 정상 동작)
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
};
