'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, KeyRound, Eye, EyeOff } from 'lucide-react';

const ADMIN_PIN = '8552';
const SESSION_KEY = 'admin_auth';

export function useAdminAuth() {
  const [authed, setAuthed] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const val = sessionStorage.getItem(SESSION_KEY);
    setAuthed(val === 'true');
    setChecked(true);
  }, []);

  const login = () => {
    sessionStorage.setItem(SESSION_KEY, 'true');
    setAuthed(true);
  };

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setAuthed(false);
  };

  return { authed, checked, login, logout };
}

export default function AdminAuthScreen({ onAuth }: { onAuth: () => void }) {
  const [pin, setPin] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const tryPin = (value: string) => {
    if (value.length < 4) return;
    if (value === ADMIN_PIN) {
      onAuth();
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => { setShake(false); setPin(''); setError(false); }, 600);
    }
  };

  const handleChange = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 4);
    setPin(digits);
    setError(false);
    if (digits.length === 4) tryPin(digits);
  };

  const handlePad = (digit: string) => {
    const next = (pin + digit).slice(0, 4);
    setPin(next);
    setError(false);
    if (next.length === 4) tryPin(next);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', padding: 20,
    }}>
      <div style={{ background: 'white', borderRadius: 24, padding: '36px 28px', width: '100%', maxWidth: 340, textAlign: 'center', boxShadow: '0 24px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ width: 64, height: 64, background: '#eff0ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <ShieldCheck size={32} color="#6366f1" />
        </div>
        <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 800 }}>관리자 인증</h2>
        <p style={{ margin: '0 0 28px', fontSize: 14, color: '#64748b' }}>4자리 비밀번호를 입력하세요</p>

        {/* PIN 표시 */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 28, animation: shake ? 'shake 0.4s' : 'none' }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{
              width: 16, height: 16, borderRadius: '50%',
              background: i < pin.length ? (error ? '#ef4444' : '#6366f1') : '#e2e8f0',
              transition: 'background 0.15s',
            }} />
          ))}
        </div>

        {/* 숫자 패드 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 12 }}>
          {['1','2','3','4','5','6','7','8','9'].map(d => (
            <button key={d} onClick={() => handlePad(d)} style={{
              padding: '16px', borderRadius: 12, border: '1px solid #e2e8f0',
              background: '#f8fafc', fontSize: 20, fontWeight: 700, cursor: 'pointer',
              transition: 'background 0.1s',
            }}>
              {d}
            </button>
          ))}
          <div />
          <button onClick={() => handlePad('0')} style={{
            padding: '16px', borderRadius: 12, border: '1px solid #e2e8f0',
            background: '#f8fafc', fontSize: 20, fontWeight: 700, cursor: 'pointer',
          }}>0</button>
          <button onClick={() => setPin(p => p.slice(0, -1))} style={{
            padding: '16px', borderRadius: 12, border: '1px solid #e2e8f0',
            background: '#f8fafc', fontSize: 16, cursor: 'pointer', color: '#64748b',
          }}>⌫</button>
        </div>

        {error && <p style={{ color: '#ef4444', fontSize: 13, margin: '8px 0 0', fontWeight: 600 }}>비밀번호가 틀렸습니다</p>}
      </div>
      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          20%,60%{transform:translateX(-8px)}
          40%,80%{transform:translateX(8px)}
        }
      `}</style>
    </div>
  );
}
