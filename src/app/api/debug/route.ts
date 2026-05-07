import { NextResponse } from 'next/server';

const SB_URL = process.env.SUPABASE_URL || '';
const SB_KEY = process.env.SUPABASE_KEY || '';

export async function GET() {
  if (!SB_URL) return NextResponse.json({ error: 'No SUPABASE_URL' });

  const res = await fetch(`${SB_URL}/rest/v1/students?select=*`, {
    headers: {
      'apikey': SB_KEY,
      'Authorization': `Bearer ${SB_KEY}`,
    },
    cache: 'no-store',
  });

  const raw = await res.text();
  return NextResponse.json({ status: res.status, ok: res.ok, body: raw });
}
