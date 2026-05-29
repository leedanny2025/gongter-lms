import { NextRequest, NextResponse } from 'next/server';
import { localDateStr } from '@/lib/utils';

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

    const todayStr = localDateStr();

    // 그날의 결석 기록 확인
    const attendance = (data as Record<string, unknown>).attendance as Record<string, unknown> | undefined;
    const absentStudents = new Set<string>();

    if (attendance && typeof attendance === 'object') {
      Object.entries(attendance).forEach(([_, record]) => {
        const att = record as Record<string, unknown>;
        if (att.date === todayStr && att.status === 'absent') {
          const studentId = att.studentId as string;
          if (studentId) {
            absentStudents.add(studentId);
          }
        }
      });
    }

    // 결석한 학생들의 보충 시간 증가
    const students = (data as Record<string, unknown>).students as Record<string, unknown> | undefined;
    if (students && absentStudents.size > 0) {
      await Promise.all(
        Array.from(absentStudents).map(studentId => {
          const student = students[studentId] as Record<string, unknown> | undefined;
          if (student) {
            const currentMakeupHours = (student.makeupHoursRequired as number) || 0;
            return fbWrite(`lms/students/${studentId}`, {
              ...student,
              makeupHoursRequired: currentMakeupHours + 1,
            });
          }
          return Promise.resolve();
        })
      );
    }

    return NextResponse.json({
      ok: true,
      date: todayStr,
      absentCount: absentStudents.size,
      updatedStudents: Array.from(absentStudents),
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
