import { NextRequest, NextResponse } from 'next/server';
import { getWeekKey, getNextWeekRollover } from '@/lib/utils';

// A week boundary changes the reporting window, never the stored history or balance.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  return NextResponse.json({
    ok: true,
    currentWeek: getWeekKey(),
    nextRollover: getNextWeekRollover().toISOString(),
    timezone: 'Asia/Seoul',
    dataPreserved: true,
  });
}
