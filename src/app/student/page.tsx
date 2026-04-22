'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { GraduationCap, Search, ChevronRight, KeyRound, X } from 'lucide-react';

type Step = 'search' | 'pin';

export default function StudentLoginPage() {
  const { state } = useStore();
  const router = useRouter();

  const [step, setStep] = useState<Step>('search');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<typeof state.students[0] | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const filtered = query.trim()
    ? state.students.filter(s => s.name.includes(query.trim()))
    : state.students;

  const selectStudent = (s: typeof state.students[0]) => {
    setSelected(s);
    setPin('');
    setError(false);
    setStep('pin');
  };

  const handlePad = (digit: string) => {
    const next = (pin + digit).slice(0, 4);
    setPin(next);
    setError(false);
    if (next.length === 4) {
      setTimeout(() => tryLogin(next), 150);
    }
  };

  const tryLogin = (inputPin: string) => {
    if (!selected) return;
    const correctPin = selected.pin || '1111';
    if (inputPin === correctPin) {
      router.push(`/student/${selected.id}`);
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => { setShake(false); setPin(''); setError(false); }, 600);
    }
  };

  const backspace = () => setPin(p => p.slice(0, -1));

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0ea5e9 0%, #6366f1 60%, #7c3aed 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'flex-start', padding: '32px 16px 24px',
    }}>
      {/* 헤더 */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{
          background: 'rgba(255,255,255,0.18)', borderRadius: 18,
          padding: '12px 22px', display: 'inline-flex', alignItems: 'center',
          gap: 10, backdropFilter: 'blur(10px)', marginBottom: 10,
        }}>
          <GraduationCap size={26} color="white" />
          <span style={{ color: 'white', fontWeight: 900, fontSize: 20 }}>공터 영어 학원</span>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>학생 포털</div>
      </div>

      <div style={{ background: 'white', borderRadius: 24, width: '100%', maxWidth: 400, boxShadow: '0 24px 60px rgba(0,0,0,0.18)', overflow: 'hidden' }}>

        {/* ── STEP 1: 이름 검색 ── */}
        {step === 'search' && (
          <div style={{ padding: '24px 20px' }}>
            <h2 style={{ margin: '0 0 6px', fontSize: 19, fontWeight: 800 }}>내 이름을 찾으세요</h2>
            <p style={{ margin: '0 0 18px', fontSize: 13, color: '#64748b' }}>이름을 검색하거나 아래 목록에서 선택하세요</p>

            <div style={{ position: 'relative', marginBottom: 14 }}>
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="이름 검색..."
                style={{ paddingLeft: 38, fontSize: 15 }}
                autoFocus
              />
              {query && (
                <button onClick={() => setQuery('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                  <X size={15} color="#94a3b8" />
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 340, overflowY: 'auto' }}>
              {filtered.map(s => (
                <button key={s.id} onClick={() => selectStudent(s)} style={{
                  padding: '14px 16px', borderRadius: 14, border: '1.5px solid #e2e8f0',
                  background: 'white', cursor: 'pointer', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 12,
                  transition: 'border-color 0.15s',
                }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #dbeafe, #ede9fe)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, fontWeight: 900, color: '#4338ca', flexShrink: 0,
                  }}>
                    {s.name[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 1 }}>{s.grade} · {s.classGroup}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#94a3b8' }}>
                    <KeyRound size={13} />
                    <ChevronRight size={16} />
                  </div>
                </button>
              ))}
              {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8', fontSize: 14 }}>
                  "{query}" 검색 결과 없음
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 2: PIN 입력 ── */}
        {step === 'pin' && selected && (
          <div style={{ padding: '28px 20px' }}>
            <button onClick={() => { setStep('search'); setPin(''); setError(false); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 20, padding: 0 }}>
              ← 다시 선택
            </button>

            {/* 학생 프로필 */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1, #0ea5e9)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 26, fontWeight: 900, color: 'white', margin: '0 auto 12px',
              }}>
                {selected.name[0]}
              </div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{selected.name}</div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>{selected.grade} · {selected.classGroup}</div>
            </div>

            <p style={{ textAlign: 'center', fontSize: 14, color: '#64748b', marginBottom: 20 }}>비밀번호 4자리를 입력하세요</p>

            {/* PIN 도트 표시 */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginBottom: 28, animation: shake ? 'shake 0.4s' : 'none' }}>
              {[0, 1, 2, 3].map(i => (
                <div key={i} style={{
                  width: 18, height: 18, borderRadius: '50%',
                  background: i < pin.length ? (error ? '#ef4444' : '#6366f1') : '#e2e8f0',
                  transition: 'background 0.15s',
                  boxShadow: i < pin.length && !error ? '0 2px 8px rgba(99,102,241,0.4)' : 'none',
                }} />
              ))}
            </div>

            {/* 숫자 패드 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, maxWidth: 300, margin: '0 auto' }}>
              {['1','2','3','4','5','6','7','8','9'].map(d => (
                <button key={d} onClick={() => handlePad(d)} style={{
                  padding: '18px 0', borderRadius: 14, border: '1.5px solid #e2e8f0',
                  background: '#f8fafc', fontSize: 22, fontWeight: 700, cursor: 'pointer',
                  transition: 'background 0.1s', color: '#0f172a',
                }}>
                  {d}
                </button>
              ))}
              <div />
              <button onClick={() => handlePad('0')} style={{
                padding: '18px 0', borderRadius: 14, border: '1.5px solid #e2e8f0',
                background: '#f8fafc', fontSize: 22, fontWeight: 700, cursor: 'pointer', color: '#0f172a',
              }}>0</button>
              <button onClick={backspace} style={{
                padding: '18px 0', borderRadius: 14, border: '1.5px solid #e2e8f0',
                background: '#f8fafc', fontSize: 18, cursor: 'pointer', color: '#64748b',
              }}>⌫</button>
            </div>

            {error && (
              <p style={{ textAlign: 'center', color: '#ef4444', fontSize: 13, fontWeight: 600, marginTop: 14 }}>
                비밀번호가 틀렸습니다 😢
              </p>
            )}

            <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#cbd5e1' }}>
              기본 비밀번호: 1111
            </div>
          </div>
        )}
      </div>

      <a href="/admin" style={{ marginTop: 24, color: 'rgba(255,255,255,0.5)', fontSize: 12, textDecoration: 'none' }}>
        관리자 페이지 →
      </a>

      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          20%,60%{transform:translateX(-10px)}
          40%,80%{transform:translateX(10px)}
        }
      `}</style>
    </div>
  );
}
