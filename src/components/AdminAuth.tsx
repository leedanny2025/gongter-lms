'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, KeyRound, Eye, EyeOff } from 'lucide-react';

const ADMIN_PIN = '8552';
const SESSION_KEY = 'admin_auth_v2';

export function useAdminAuth() {
  const [authed, setAuthed] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // 초기화: sessionStorage에서 인증 상태 읽기
    const stored = sessionStorage.getItem(SESSION_KEY);
    const isAuthed = stored === 'authenticated_8552';
    setAuthed(isAuthed);
    setChecked(true);
  }, []);

  const login = (pin: string): boolean => {
    // PIN 길이 확인
    if (!pin || typeof pin !== 'string' || pin.length !== 4) {
      return false;
    }

    // PIN 값 확인 (반드시 '8552'여야 함)
    if (pin !== '8552') {
      return false;
    }

    // 로그인 성공
    sessionStorage.setItem(SESSION_KEY, 'authenticated_8552');
    setAuthed(true);
    return true;
  };

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setAuthed(false);
  };

  return { authed, checked, login, logout };
}

export default function AdminAuthScreen({ onAuth }: { onAuth: (pin: string) => boolean }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = () => {
    if (!password || password.length === 0) {
      setError(true);
      setShake(true);
      setTimeout(() => { setShake(false); setError(false); }, 600);
      return;
    }
    const result = onAuth(password);
    if (result) {
      setPassword('');
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => { setShake(false); setPassword(''); setError(false); }, 600);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', padding: 20,
    }}>
      <div style={{ background: 'white', borderRadius: 24, padding: '36px 28px', width: '100%', maxWidth: 360, textAlign: 'center', boxShadow: '0 24px 60px rgba(0,0,0,0.3)', animation: shake ? 'shake 0.4s' : 'none' }}>
        <div style={{ width: 64, height: 64, background: '#eff0ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <ShieldCheck size={32} color="#6366f1" />
        </div>
        <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 800 }}>관리자 인증</h2>
        <p style={{ margin: '0 0 28px', fontSize: 14, color: '#64748b' }}>암호를 입력하세요</p>

        {/* 입력 필드 */}
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={e => {
              setPassword(e.target.value);
              setError(false);
            }}
            onKeyPress={handleKeyPress}
            placeholder="암호 입력"
            autoFocus
            style={{
              width: '100%',
              padding: '14px 40px 14px 14px',
              borderRadius: 12,
              border: `2px solid ${error ? '#ef4444' : '#e2e8f0'}`,
              fontSize: 16,
              fontWeight: 500,
              outline: 'none',
              transition: 'border 0.2s',
            }}
          />
          <button
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#94a3b8',
              padding: 4,
              minHeight: 'unset',
            }}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {/* 제출 버튼 */}
        <button
          onClick={handleSubmit}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: 12,
            border: 'none',
            background: password ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : '#e2e8f0',
            color: password ? 'white' : '#94a3b8',
            fontSize: 15,
            fontWeight: 700,
            cursor: password ? 'pointer' : 'default',
            transition: 'all 0.2s',
            marginBottom: 12,
            minHeight: 'unset',
          }}
        >
          로그인
        </button>

        {error && <p style={{ color: '#ef4444', fontSize: 13, margin: 0, fontWeight: 600 }}>암호가 틀렸습니다</p>}
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
