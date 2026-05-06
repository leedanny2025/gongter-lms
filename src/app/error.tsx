'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: 20 }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 8px' }}>페이지 오류가 발생했습니다</h2>
        <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 20px' }}>{error.message || '알 수 없는 오류'}</p>
        <button
          onClick={reset}
          style={{ padding: '10px 24px', borderRadius: 10, background: '#6366f1', color: 'white', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}
