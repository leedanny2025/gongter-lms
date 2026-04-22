import { NextRequest, NextResponse } from 'next/server';

const SHEETS_URL = process.env.SHEETS_URL || process.env.NEXT_PUBLIC_SHEETS_URL || '';

export async function POST(req: NextRequest) {
  if (!SHEETS_URL) {
    return NextResponse.json({ status: 'skip', message: 'SHEETS_URL 미설정' });
  }
  try {
    const body = await req.json();
    const res = await fetch(SHEETS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      redirect: 'follow',
    });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { status: 'ok', raw: text }; }
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ status: 'error', message: String(e) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  if (!SHEETS_URL) {
    return NextResponse.json({ status: 'skip', message: 'SHEETS_URL 미설정' });
  }
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action') || 'ping';
  try {
    const res = await fetch(`${SHEETS_URL}?action=${action}`, { redirect: 'follow' });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { status: 'ok', raw: text }; }
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ status: 'error', message: String(e) }, { status: 500 });
  }
}
