import { NextRequest, NextResponse } from 'next/server';
import { getWeekKey } from '@/lib/utils';

const FB_URL = 'https://gongteo--lms-default-rtdb.firebaseio.com';

async function fbRead(path: string) {
  const res = await fetch(`${FB_URL}/${path}.json`, { cache: 'no-store' });
  return res.json();
}

async function fbWrite(path: string, data: unknown) {
  await fetch(`${FB_URL}/${path}.json`, {
    method: data === null ? 'DELETE' : 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: data === null ? undefined : JSON.stringify(data),
  });
}

export async function GET(req: NextRequest) {
  // Vercel cron sends Authorization: Bearer <CRON_SECRET>
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  }

  try {
    const data = await fbRead('lms');
    if (!data || typeof data !== 'object') {
      return NextResponse.json({ ok: false, error: 'no data' }, { status: 500 });
    }

    const currentWeek = getWeekKey();
    const students = (data as Record<string, unknown>).students as Record<string, unknown> | undefined;
    const dollarConditions = (data as Record<string, unknown>).dollarConditions as Record<string, unknown>[] | undefined;
    const awardRecords = ((data as Record<string, unknown>).awardRecords as Record<string, unknown>[] | undefined) || [];

    if (!students || !dollarConditions || dollarConditions.length === 0) {
      return NextResponse.json({ ok: true, message: 'no conditions or students' });
    }

    // 계산 함수들
    const enabledConditions = (dollarConditions as Record<string, unknown>[]).filter((c: Record<string, unknown>) => c.enabled);

    // 각 학생에게 달러 지급 및 지급 기록 생성
    const awardedStudents: string[] = [];
    const newAwardRecords = [...awardRecords];

    await Promise.all(
      Object.entries(students).map(async ([studentId, student]) => {
        const s = student as Record<string, unknown>;

        // 이미 이번 주에 지급되었는지 확인
        const alreadyAwarded = (awardRecords as Record<string, unknown>[]).some(
          (a: Record<string, unknown>) => a.studentId === studentId && a.week === currentWeek
        );

        if (alreadyAwarded) return;

        // 지급 예정액 사용 (weeklyPendingDollars)
        const pendingDollars = Number(s.weeklyPendingDollars) || 0;
        if (pendingDollars <= 0) return;

        // 학생 달러 업데이트 및 주별 지급액 기록, 지급 예정액 리셋
        const currentDollars = Number(s.dollars) || 0;
        const updatedWeeklyAwarded = { ...(s.weeklyDollarsAwarded as Record<string, number> || {}), [currentWeek]: pendingDollars };

        await fbWrite(`lms/students/${studentId}`, {
          ...s,
          dollars: currentDollars + pendingDollars,
          weeklyDollarsAwarded: updatedWeeklyAwarded,
          weeklyPendingDollars: 0, // 지급 후 리셋
        });

        // 지급 기록 추가
        newAwardRecords.push({
          id: Date.now().toString() + Math.random(),
          studentId,
          studentName: s.name || '',
          amount: pendingDollars,
          week: currentWeek,
          awardedAt: new Date().toISOString(),
        });

        awardedStudents.push(studentId);
      })
    );

    // 지급 기록 저장
    if (newAwardRecords.length > awardRecords.length) {
      await fbWrite('lms/awardRecords', newAwardRecords);
    }

    return NextResponse.json({
      ok: true,
      week: currentWeek,
      awardedCount: awardedStudents.length,
      awardedStudents,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
