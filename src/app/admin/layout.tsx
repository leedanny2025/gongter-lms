'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Calendar, BookOpen, ClipboardCheck, DollarSign, Settings, GraduationCap, LogOut } from 'lucide-react';
import AdminAuthScreen, { useAdminAuth } from '@/components/AdminAuth';

const navItems = [
  { href: '/admin', label: '대시보드', icon: LayoutDashboard },
  { href: '/admin/students', label: '학생', icon: Users },
  { href: '/admin/attendance', label: '출석', icon: Calendar },
  { href: '/admin/homework', label: '숙제', icon: BookOpen },
  { href: '/admin/tests', label: '시험', icon: ClipboardCheck },
  { href: '/admin/dollars', label: '달러', icon: DollarSign },
  { href: '/admin/settings', label: '설정', icon: Settings },
];

function Sidebar({ pathname }: { pathname: string }) {
  const { logout } = useAdminAuth();
  return (
    <aside className="admin-sidebar" style={{ width: 220, minHeight: '100vh', background: '#1e293b', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <div style={{ padding: '20px 16px', borderBottom: '1px solid #334155' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ background: '#6366f1', borderRadius: 10, padding: 8 }}>
            <GraduationCap size={18} color="white" />
          </div>
          <div>
            <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 14 }}>공터 영어</div>
            <div style={{ color: '#64748b', fontSize: 11 }}>관리자</div>
          </div>
        </div>
      </div>
      <nav style={{ flex: 1, padding: '10px 8px' }}>
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
  const topItems = navItems.slice(0, 5);
  return (
    <nav className="mobile-only" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#1e293b', display: 'flex', zIndex: 50, borderTop: '1px solid #334155', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {topItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link key={href} href={href} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '10px 0', textDecoration: 'none', gap: 3,
            color: active ? '#a5b4fc' : '#64748b',
            borderTop: active ? '2px solid #6366f1' : '2px solid transparent',
          }}>
            <Icon size={19} />
            <span style={{ fontSize: 10, fontWeight: active ? 700 : 400 }}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { authed, checked, login } = useAdminAuth();
  const pathname = usePathname();

  if (!checked) return null;
  if (!authed) return <AdminAuthScreen onAuth={login} />;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar pathname={pathname} />
      <main className="admin-content" style={{ flex: 1, padding: '24px 28px', overflowY: 'auto', background: '#f8fafc', paddingBottom: 80 }}>
        {children}
      </main>
      <MobileBottomNav pathname={pathname} />
    </div>
  );
}
