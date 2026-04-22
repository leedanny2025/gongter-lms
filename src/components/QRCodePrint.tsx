'use client';

import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface Props {
  url: string;
  label: string;
  size?: number;
}

export default function QRCodeCanvas({ url, label, size = 200 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, url, {
      width: size,
      margin: 2,
      color: { dark: '#0f172a', light: '#ffffff' },
    });
  }, [url, size]);

  return (
    <div style={{ textAlign: 'center' }}>
      <canvas ref={canvasRef} style={{ borderRadius: 8, display: 'block', margin: '0 auto' }} />
      <div style={{ marginTop: 8, fontSize: 13, fontWeight: 600, color: '#374151' }}>{label}</div>
    </div>
  );
}

export function PrintQRPage({ classGroup, baseUrl }: { classGroup: string; baseUrl: string }) {
  const url = `${baseUrl}/checkin?class=${encodeURIComponent(classGroup)}`;

  return (
    <div style={{ padding: 32, textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>공터 영어 학원</h1>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: '#6366f1', marginBottom: 24 }}>{classGroup} 출석 체크</h2>
      <QRCodeCanvas url={url} label={classGroup} size={220} />
      <div style={{ marginTop: 20, padding: '12px 24px', background: '#f8fafc', borderRadius: 12, display: 'inline-block' }}>
        <div style={{ fontSize: 13, color: '#64748b' }}>📱 QR 스캔 → 이름 입력 → 출석 완료</div>
        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{url}</div>
      </div>
    </div>
  );
}
