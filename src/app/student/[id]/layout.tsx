'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Home, BookOpen, ClipboardCheck, QrCode, ArrowLeft, CalendarClock } from 'lucide-react';

export default function StudentIdLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useParams();
  const id = params.id as string;
  const { state } = useStore();
  const student = state.students.find(s => s.id === id);

  const pendingMakeup = (state.makeupRequests || []).filter(r => r.studentId === id && r.status === 'pending').length;

  const tabs = [
    { href: `/student/${id}`, label: '홈', icon: Home },
    { href: `/student/${id}/homework`, label: '숙제 제출', icon: BookOpen },
    { href: `/student/${id}/tests`, label: '시험 점수', icon: ClipboardCheck },
    { href: `/student/${id}/attendance`, label: '출석 체크', icon: QrCode },
    { href: `/student/${id}/makeup`, label: '보충신청', icon: CalendarClock, badge: pendingMakeup },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f0f9ff', paddingBottom: 'calc(80px + env(safe-area-inset-bottom))', WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'] }}>
      {/* 상단 헤더 */}
      <div style={{ background: 'linear-gradient(135deg, #6366f1, #0ea5e9)', padding: '20px 20px 60px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Link href="/student" style={{ color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, textDecoration: 'none' }}>
            <ArrowLeft size={16} /> 학생 선택
          </Link>
        </div>
        {student && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: 'white', border: '2px solid rgba(255,255,255,0.5)' }}>
              {student.name[0]}
            </div>
            <div>
              <div style={{ color: 'white', fontWeight: 800, fontSize: 20 }}>{student.name}</div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>{student.grade} · 보유 달러 <strong>${student.dollars}</strong></div>
            </div>
          </div>
        )}
      </div>

      {/* 콘텐츠 영역 */}
      <div style={{ margin: '-32px 16px 0', position: 'relative', zIndex: 1 }}>
        {children}
      </div>

      {/* 하단 네비게이션 */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTop: '1px solid #e2e8f0', display: 'flex', zIndex: 50, boxShadow: '0 -4px 12px rgba(0,0,0,0.08)', paddingBottom: 'env(safe-area-inset-bottom)', overflowX: 'auto', WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'], touchAction: 'pan-x' }}>
        {tabs.map(({ href, label, icon: Icon, badge }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} style={{
              flex: '0 0 auto', minWidth: 60,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '10px 8px', textDecoration: 'none', gap: 4, position: 'relative',
              color: active ? '#6366f1' : '#94a3b8',
              borderTop: active ? '2px solid #6366f1' : '2px solid transparent',
              background: active ? '#f5f3ff' : 'white',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              userSelect: 'none',
            }}>
              <Icon size={20} />
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 400, whiteSpace: 'nowrap' }}>{label}</span>
              {badge ? (
                <span style={{ position: 'absolute', top: 6, right: 8, width: 16, height: 16, background: '#f97316', borderRadius: '50%', fontSize: 9, color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
