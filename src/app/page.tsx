'use client';

import Link from 'next/link';
import { GraduationCap, Users, ShieldCheck } from 'lucide-react';

export default function Home() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 50%, #7c3aed 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 24, padding: '16px 24px', display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 16, backdropFilter: 'blur(10px)' }}>
          <GraduationCap size={36} color="white" />
          <div style={{ textAlign: 'left' }}>
            <div style={{ color: 'white', fontWeight: 900, fontSize: 24 }}>공터 영어 학원</div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>학습 관리 시스템</div>
          </div>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15 }}>접속할 포털을 선택하세요</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: 360 }}>
        <Link href="/student" style={{ textDecoration: 'none' }}>
          <div style={{
            background: 'white', borderRadius: 20, padding: 24,
            display: 'flex', alignItems: 'center', gap: 16,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            transition: 'transform 0.15s',
            cursor: 'pointer',
          }}>
            <div style={{ background: '#dbeafe', borderRadius: 14, padding: 14 }}>
              <Users size={28} color="#3b82f6" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18, color: '#0f172a' }}>학생 포털</div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>숙제 제출 · 시험 점수 · 출석 체크</div>
            </div>
            <div style={{ marginLeft: 'auto', color: '#94a3b8', fontSize: 20 }}>›</div>
          </div>
        </Link>

        <Link href="/admin" style={{ textDecoration: 'none' }}>
          <div style={{
            background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: 24,
            display: 'flex', alignItems: 'center', gap: 16,
            border: '1px solid rgba(255,255,255,0.3)',
            backdropFilter: 'blur(10px)',
            cursor: 'pointer',
          }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 14, padding: 14 }}>
              <ShieldCheck size={28} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18, color: 'white' }}>관리자 포털</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 3 }}>학생 관리 · 출석 · 달러 지급</div>
            </div>
            <div style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.6)', fontSize: 20 }}>›</div>
          </div>
        </Link>
      </div>
    </div>
  );
}
