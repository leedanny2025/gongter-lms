import { NextRequest, NextResponse } from 'next/server';

const SB_URL = process.env.SUPABASE_URL || '';
const SB_KEY = process.env.SUPABASE_KEY || '';
const FB_URL = 'https://gongteo--lms-default-rtdb.firebaseio.com';

const TABLES = ['students', 'attendance', 'homework', 'tests', 'attitude', 'conditions', 'makeup', 'settings'];

function sbHeaders(extra?: Record<string, string>) {
  return {
    'apikey': SB_KEY,
    'Authorization': `Bearer ${SB_KEY}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

export async function GET(req: NextRequest) {
  if (!SB_URL) {
    const path = new URL(req.url).searchParams.get('path') || 'lms';
    const res = await fetch(`${FB_URL}/${path}.json`);
    return NextResponse.json(await res.json());
  }

  const results = await Promise.all(
    TABLES.map(async table => {
      try {
        const res = await fetch(`${SB_URL}/rest/v1/${table}?select=*`, {
          headers: sbHeaders(),
          next: { revalidate: 20 },
        });
        const rows: { id: string; data: unknown }[] = await res.json().catch(() => []);
        const obj: Record<string, unknown> = {};
        if (Array.isArray(rows)) {
          rows.forEach(row => { if (row.id) obj[row.id] = row.data; });
        }
        return [table, obj] as const;
      } catch {
        return [table, {}] as const;
      }
    })
  );

  return NextResponse.json(Object.fromEntries(results));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { path, data, method } = body;

  if (!SB_URL) {
    const res = await fetch(`${FB_URL}/${path}.json`, {
      method: method || 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: method === 'DELETE' ? undefined : JSON.stringify(data),
    });
    return NextResponse.json({ ok: true, result: await res.json().catch(() => null) });
  }

  const parts = path.split('/');
  const table = parts[1];
  const id = parts[2];
  if (!table || !id) return NextResponse.json({ ok: false });

  try {
    if (method === 'DELETE') {
      await fetch(`${SB_URL}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: sbHeaders(),
      });
    } else {
      await fetch(`${SB_URL}/rest/v1/${table}`, {
        method: 'POST',
        headers: sbHeaders({ 'Prefer': 'resolution=merge-duplicates' }),
        body: JSON.stringify({ id, data }),
      });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
