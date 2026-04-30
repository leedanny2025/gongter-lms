import { NextRequest, NextResponse } from 'next/server';
import { getNextWeek } from '@/lib/utils';

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

    const currentWeek = (data as Record<string, unknown>).currentWeek as string | undefined;
    if (!currentWeek) {
      return NextResponse.json({ ok: false, error: 'no currentWeek stored' }, { status: 500 });
    }

    const nextWeek = getNextWeek(currentWeek);

    // Clear weekly collections
    await fbWrite('lms/homework', null);
    await fbWrite('lms/attendance', null);
    await fbWrite('lms/attitude', null);
    await fbWrite('lms/makeup', null);
    await fbWrite('lms/currentWeek', nextWeek);

    // Reset each student's dollars to 0
    const students = (data as Record<string, unknown>).students as Record<string, unknown> | undefined;
    if (students) {
      await Promise.all(
        Object.entries(students).map(([id, student]) =>
          fbWrite(`lms/students/${id}`, { ...(student as object), dollars: 0 })
        )
      );
    }

    return NextResponse.json({ ok: true, resetFrom: currentWeek, resetTo: nextWeek });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
