'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { GraduationCap, LogIn, LogOut, BookOpen } from 'lucide-react';

function ScanContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { state, refresh } = useStore();
  const idParam = searchParams.get('id');

  const [student, setStudent] = useState<typeof state.students[0] | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!idParam) { setLoading(false); return; }
    if (state.students.length === 0) {
      refresh().then(() => setLoading(false));
      return;
    }
    const found = state.students.find(s => s.id === idParam);
    setStudent(found ?? null);
    setLoading(false);
  }, [idParam, state.students]);

  const timeStr = now.toTimeString().slice(0, 5);
  const dateStr = now.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });

  if (!idParam) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center', padding: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#1e293b' }}>잘못된 QR 코드입니다</div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 8 }}>유효한 학생 QR 코드를 스캔해 주세요</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #6366f1 0%, #0ea5e9 100%)' }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
          <div style={{ fontWeight: 700 }}>불러오는 중...</div>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center', padding: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#1e293b' }}>학생을 찾을 수 없습니다</div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 8 }}>관리자에게 문의하세요</div>
        </div>
      </div>
    );
  }

  const options = [
    {
      icon: <LogIn size={32} color="#22c55e" />,
      label: '입실 체크',
      desc: '등원 출석을 기록합니다',
      bg: 'linear-gradient(135deg, #22c55e, #16a34a)',
      shadow: '0 8px 24px rgba(34,197,94,0.35)',
      onClick: () => router.push(`/checkin?id=${student.id}`),
    },
    {
      icon: <LogOut size={32} color="#f59e0b" />,
      label: '퇴원 체크',
      desc: '하원 시간을 기록합니다',
      bg: 'linear-gradient(135deg, #f59e0b, #d97706)',
      shadow: '0 8px 24px rgba(245,158,11,0.35)',
      onClick: () => router.push(`/checkout?id=${student.id}`),
    },
    {
      icon: <BookOpen size={32} color="#6366f1" />,
      label: '내 페이지',
      desc: '숙제·시험·출석 확인',
      bg: 'linear-gradient(135deg, #6366f1, #4f46e5)',
      shadow: '0 8px 24px rgba(99,102,241,0.35)',
      onClick: () => router.push(`/student/${student.id}`),
    },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0f172a 0%, #1e3a5f 50%, #0f2a52 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'flex-start', padding: '28px 20px',
    }}>
      {/* 학원 헤더 */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{
          background: 'rgba(255,255,255,0.1)', borderRadius: 18, padding: '10px 22px',
          display: 'inline-flex', alignItems: 'center', gap: 10, backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.15)',
        }}>
          <GraduationCap size={22} color="white" />
          <span style={{ color: 'white', fontWeight: 800, fontSize: 17 }}>공터 영어 학원</span>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 8 }}>
          {dateStr} · {timeStr}
        </div>
      </div>

      {/* 학생 카드 */}
      <div style={{
        background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)',
        borderRadius: 24, padding: '24px 32px', textAlign: 'center',
        border: '1px solid rgba(255,255,255,0.12)', marginBottom: 28,
        width: '100%', maxWidth: 360,
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1, #0ea5e9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 14px', fontSize: 30, fontWeight: 900, color: 'white',
        }}>
          {student.name[0]}
        </div>
        <div style={{ fontSize: 26, fontWeight: 900, color: 'white', marginBottom: 4 }}>
          {student.name}
        </div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)' }}>
          {student.grade} · {student.classGroup}
        </div>
      </div>

      {/* 3가지 선택 */}
      <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textAlign: 'center', letterSpacing: 1, marginBottom: 2 }}>
          무엇을 하시겠어요?
        </div>
        {options.map((opt) => (
          <button
            key={opt.label}
            onClick={opt.onClick}
            style={{
              display: 'flex', alignItems: 'center', gap: 18,
              padding: '18px 24px', borderRadius: 18,
              background: 'rgba(255,255,255,0.07)',
              backdropFilter: 'blur(8px)',
              cursor: 'pointer', textAlign: 'left', width: '100%',
              border: '1px solid rgba(255,255,255,0.1)',
              transition: 'transform 0.12s, background 0.12s',
            } as React.CSSProperties}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.13)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)'; }}
          >
            <div style={{
              width: 56, height: 56, borderRadius: 16, background: opt.bg,
              boxShadow: opt.shadow, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {opt.icon}
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: 'white', marginBottom: 2 }}>{opt.label}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{opt.desc}</div>
            </div>
            <div style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.3)', fontSize: 20 }}>›</div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ScanPage() {
  return (
    <Suspense>
      <ScanContent />
    </Suspense>
  );
}
