'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { GraduationCap, ChevronRight, Lock } from 'lucide-react';

export default function StudentSelectPage() {
  const { state } = useStore();
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const select = (id: string) => {
    setSelectedId(id);
    setPin('');
    setError('');
  };

  const enter = () => {
    // PIN 없이 바로 입장 (추후 PIN 기능 추가 가능)
    if (selectedId) router.push(`/student/${selectedId}`);
  };

  const selected = state.students.find(s => s.id === selectedId);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      {/* 헤더 */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '12px 16px', display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 16, backdropFilter: 'blur(10px)' }}>
          <GraduationCap size={28} color="white" />
          <span style={{ color: 'white', fontWeight: 800, fontSize: 20 }}>공터 영어 학원</span>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16 }}>학생 포털</div>
      </div>

      {/* 학생 선택 카드 */}
      <div style={{ background: 'white', borderRadius: 24, padding: 28, width: '100%', maxWidth: 420, boxShadow: '0 24px 48px rgba(0,0,0,0.15)' }}>
        <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700, color: '#0f172a' }}>내 이름을 선택하세요</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          {state.students.map(student => (
            <button
              key={student.id}
              onClick={() => select(student.id)}
              style={{
                padding: '14px 10px',
                borderRadius: 12,
                border: '2px solid',
                borderColor: selectedId === student.id ? '#6366f1' : '#e2e8f0',
                background: selectedId === student.id ? '#eff0ff' : '#f8fafc',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s',
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: '50%', margin: '0 auto 8px',
                background: selectedId === student.id ? '#6366f1' : '#dbeafe',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, fontWeight: 800,
                color: selectedId === student.id ? 'white' : '#1e40af',
              }}>
                {student.name[0]}
              </div>
              <div style={{ fontWeight: 600, fontSize: 14, color: selectedId === student.id ? '#4338ca' : '#374151' }}>{student.name}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{student.grade}</div>
            </button>
          ))}
        </div>

        {selected && (
          <div style={{ animation: 'fadeIn 0.2s' }}>
            <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color: 'white' }}>
                {selected.name[0]}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{selected.name} 학생</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>현재 보유 달러: <strong style={{ color: '#7c3aed' }}>${selected.dollars}</strong></div>
              </div>
            </div>

            <button
              onClick={enter}
              style={{
                width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                background: 'linear-gradient(135deg, #6366f1, #0ea5e9)',
                color: 'white', fontWeight: 700, fontSize: 16, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              입장하기 <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      {/* 관리자 링크 */}
      <a href="/admin" style={{ marginTop: 24, color: 'rgba(255,255,255,0.6)', fontSize: 13, textDecoration: 'none' }}>
        관리자 페이지로 →
      </a>

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}
