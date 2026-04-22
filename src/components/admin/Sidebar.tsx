'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  DollarSign,
  BookOpen,
  ClipboardCheck,
  Calendar,
  Settings,
  GraduationCap,
} from 'lucide-react';

const navItems = [
  { href: '/admin', label: '대시보드', icon: LayoutDashboard },
  { href: '/admin/students', label: '학생 관리', icon: Users },
  { href: '/admin/attendance', label: '출석 관리', icon: Calendar },
  { href: '/admin/homework', label: '숙제 승인', icon: BookOpen },
  { href: '/admin/tests', label: '시험 점수', icon: ClipboardCheck },
  { href: '/admin/dollars', label: '달러 지급', icon: DollarSign },
  { href: '/admin/settings', label: '설정', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside style={{ width: 240, minHeight: '100vh', background: '#1e293b', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '24px 20px', borderBottom: '1px solid #334155' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ background: '#3b82f6', borderRadius: 10, padding: 8 }}>
            <GraduationCap size={20} color="white" />
          </div>
          <div>
            <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 15 }}>공터 영어</div>
            <div style={{ color: '#94a3b8', fontSize: 11 }}>학습 관리 시스템</div>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '12px 8px' }}>
        <div style={{ color: '#64748b', fontSize: 11, fontWeight: 600, padding: '8px 12px', marginBottom: 4, letterSpacing: '0.05em' }}>
          관리자 메뉴
        </div>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 8,
                marginBottom: 2,
                textDecoration: 'none',
                background: active ? '#3b82f6' : 'transparent',
                color: active ? 'white' : '#94a3b8',
                fontWeight: active ? 600 : 400,
                fontSize: 14,
                transition: 'all 0.15s',
              }}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: '16px 20px', borderTop: '1px solid #334155' }}>
        <div style={{ color: '#475569', fontSize: 12 }}>관리자 모드</div>
        <div style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>v1.0.0</div>
      </div>
    </aside>
  );
}
