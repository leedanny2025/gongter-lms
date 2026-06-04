'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Calendar, BookOpen, ClipboardCheck, DollarSign, Settings, GraduationCap, LogOut, QrCode, Star, Undo2, FileText } from 'lucide-react';
import AdminAuthScreen, { useAdminAuth } from '@/components/AdminAuth';
import { useStore } from '@/lib/store';

const navItems = [
  { href: '/admin',            label: '대시보드', icon: LayoutDashboard },
  { href: '/admin/students',   label: '학생',     icon: Users },
  { href: '/admin/attendance', label: '출석',     icon: Calendar },
  { href: '/admin/homework',   label: '숙제',     icon: BookOpen },
  { href: '/admin/tests',      label: '시험',     icon: ClipboardCheck },
  { href: '/admin/attitude',   label: '태도',     icon: Star },
  { href: '/admin/dollars',    label: '달러',     icon: DollarSign },
  { href: '/admin/reports',   label: '리포트',   icon: FileText },
  { href: '/admin/qr',         label: 'QR',       icon: QrCode },
  { href: '/admin/settings',   label: '설정',     icon: Settings },
];

function Sidebar({ pathname }: { pathname: string }) {
  const { logout } = useAdminAuth();
  return (
    <aside style={{
      width: 200, minHeight: '100vh', background: '#1e293b',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
    }}>
      <div style={{ padding: '18px 14px', borderBottom: '1px solid #334155' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ background: '#6366f1', borderRadius: 10, padding: 8, flexShrink: 0 }}>
            <GraduationCap size={18} color="white" />
          </div>
          <div>
            <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 14 }}>공터 영어</div>
            <div style={{ color: '#64748b', fontSize: 11 }}>관리자</div>
          </div>
        </div>
      </div>
      <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} style={{
              display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px',
              borderRadius: 8, marginBottom: 2, textDecoration: 'none',
              background: active ? '#6366f1' : 'transparent',
              color: active ? 'white' : '#94a3b8',
              fontWeight: active ? 600 : 400, fontSize: 14,
            }}>
              <Icon size={16} />{label}
            </Link>
          );
        })}
      </nav>
      <div style={{ padding: '12px 8px', borderTop: '1px solid #334155' }}>
        <button onClick={logout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', borderRadius: 8, fontSize: 13 }}>
          <LogOut size={15} /> 로그아웃
        </button>
      </div>
    </aside>
  );
}

function MobileBottomNav({ pathname }: { pathname: string }) {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: '#1e293b', zIndex: 50,
      borderTop: '1px solid #334155',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      <div style={{
        display: 'flex',
        overflowX: 'auto',
        overflowY: 'hidden',
        WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'],
        scrollbarWidth: 'none' as React.CSSProperties['scrollbarWidth'],
        touchAction: 'pan-x',
      }}>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} style={{
              flex: '0 0 auto', minWidth: 120,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '20px 12px', textDecoration: 'none', gap: 6,
              color: active ? '#a5b4fc' : '#64748b',
              borderTop: active ? '2px solid #6366f1' : '2px solid transparent',
            }}>
              <Icon size={36} />
              <span style={{ fontSize: 18, fontWeight: active ? 700 : 400, whiteSpace: 'nowrap' }}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function UndoBar() {
  const { undo, canUndo, undoLabel } = useStore();
  if (!canUndo) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
      <button
        onClick={undo}
        title={`되돌리기: ${undoLabel}`}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 16px', borderRadius: 8,
          background: '#1e293b', color: 'white',
          border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13,
          boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
        }}
      >
        <Undo2 size={14} />
        <span>되돌리기</span>
        <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400 }}>{undoLabel}</span>
      </button>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { authed, checked, login } = useAdminAuth();
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (!checked) return null;
  if (!authed) return <AdminAuthScreen onAuth={login} />;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {!isMobile && <Sidebar pathname={pathname} />}
      <main style={{
        flex: 1, minWidth: 0,
        padding: isMobile ? '16px 12px 90px' : '24px 28px',
        overflowY: 'auto', overflowX: 'auto',
        WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'],
        background: '#f8fafc',
        touchAction: 'pan-x pan-y',
      }}>
        <UndoBar />
        {children}
      </main>
      {isMobile && <MobileBottomNav pathname={pathname} />}
    </div>
  );
}
