'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Printer, Download, GraduationCap, Smartphone, Users } from 'lucide-react';
import { useStore } from '@/lib/store';

function QRBlock({ url, title, sub, color }: { url: string; title: string; sub: string; color: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, url, {
      width: 200, margin: 2,
      color: { dark: '#0f172a', light: '#ffffff' },
    });
  }, [url]);

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `${title}-QR.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div style={{
      background: 'white', borderRadius: 20, padding: 24, textAlign: 'center',
      border: `2px solid ${color}20`, boxShadow: `0 4px 20px ${color}15`,
    }}>
      <div style={{ background: color + '15', borderRadius: 14, padding: '10px 20px', display: 'inline-block', marginBottom: 16 }}>
        <div style={{ fontWeight: 800, fontSize: 16, color }}>{title}</div>
        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{sub}</div>
      </div>

      <div style={{ background: '#f8fafc', borderRadius: 14, padding: 16, marginBottom: 14, display: 'inline-block' }}>
        <canvas ref={canvasRef} style={{ display: 'block', borderRadius: 8 }} />
      </div>

      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 14, wordBreak: 'break-all', padding: '0 8px' }}>
        {url}
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        <button onClick={download} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
          borderRadius: 10, border: `1px solid ${color}`, background: color + '10',
          color, cursor: 'pointer', fontWeight: 600, fontSize: 13,
        }}>
          <Download size={14} /> 저장
        </button>
        <button onClick={() => window.print()} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
          borderRadius: 10, border: '1px solid #e2e8f0', background: 'white',
          color: '#374151', cursor: 'pointer', fontWeight: 600, fontSize: 13,
        }}>
          <Printer size={14} /> 인쇄
        </button>
      </div>
    </div>
  );
}

function StudentQRCard({ student, baseUrl }: {
  student: { id: string; name: string; grade: string; classGroup: string };
  baseUrl: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const url = `${baseUrl}/scan?id=${student.id}`;

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, url, { width: 140, margin: 1, color: { dark: '#0f172a', light: '#ffffff' } });
  }, [url]);

  const download = () => {
    const c = canvasRef.current;
    if (!c) return;
    const a = document.createElement('a');
    a.download = `${student.name}-QR.png`;
    a.href = c.toDataURL();
    a.click();
  };

  return (
    <div className="print-card" style={{
      background: 'white', borderRadius: 14, padding: 16, border: '1px solid #e2e8f0',
      textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#eff0ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px', fontSize: 16, fontWeight: 900, color: '#6366f1' }}>
        {student.name[0]}
      </div>
      <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 2 }}>{student.name}</div>
      <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 10 }}>{student.grade} · {student.classGroup}</div>

      <div style={{ background: '#f8fafc', borderRadius: 10, padding: 8, display: 'inline-block', marginBottom: 8 }}>
        <canvas ref={canvasRef} style={{ display: 'block', borderRadius: 6 }} />
      </div>

      <div style={{ fontSize: 9, color: '#94a3b8', marginBottom: 10, padding: '0 4px', wordBreak: 'break-all' }}>
        입실·퇴원·내 페이지 선택 가능
      </div>

      <button onClick={download} style={{
        display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px',
        borderRadius: 8, border: '1px solid #6366f1', background: '#eff0ff',
        color: '#6366f1', cursor: 'pointer', fontSize: 11, fontWeight: 600,
        minHeight: 'unset', margin: '0 auto',
      }}>
        <Download size={11} /> 저장
      </button>
    </div>
  );
}

export default function QRPage() {
  const [baseUrl, setBaseUrl] = useState('');
  const { state, loadCol } = useStore();

  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

  useEffect(() => {
    loadCol('students');
  }, []);

  if (!baseUrl) return null;

  const items = [
    {
      url: `${baseUrl}/student`,
      title: '학생 포털',
      sub: '숙제 · 시험 · 출석 체크',
      color: '#6366f1',
    },
    {
      url: `${baseUrl}/checkin`,
      title: '입실 체크 (공용)',
      sub: 'QR 스캔 → 이름 입력 → 입실',
      color: '#22c55e',
    },
    {
      url: `${baseUrl}/checkout`,
      title: '퇴원 체크 (공용)',
      sub: 'QR 스캔 → 이름 입력 → 퇴원',
      color: '#f59e0b',
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>QR 코드 관리</h1>
        <p style={{ color: '#64748b', marginTop: 4, fontSize: 13 }}>
          교실에 부착하거나 학생에게 공유할 QR 코드를 출력하세요
        </p>
      </div>

      {/* 안내 */}
      <div className="card" style={{ marginBottom: 20, background: '#eff0ff', border: '1px solid #c7d2fe' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <Smartphone size={20} color="#6366f1" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#4338ca' }}>사용 방법</div>
            <ul style={{ margin: '6px 0 0', paddingLeft: 16, fontSize: 13, color: '#4338ca', lineHeight: 2 }}>
              <li><strong>학생 포털 QR</strong> — 학부모/학생에게 공유 → 숙제·시험·출석 앱 바로 접속</li>
              <li><strong>입실 체크 QR (공용)</strong> — 입구에 부착 → 학생이 스캔 → 이름 입력 → 입실 완료</li>
              <li><strong>퇴원 체크 QR (공용)</strong> — 출구에 부착 → 학생이 스캔 → 이름 입력 → 퇴원 완료</li>
              <li><strong>학생별 개인 QR</strong> — 이름표에 부착 → 스캔 즉시 본인 확인 화면 이동 (이름 입력 불필요)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 공용 QR 카드 그리드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20, marginBottom: 36 }}>
        {items.map(item => (
          <QRBlock key={item.url} {...item} />
        ))}
      </div>

      {/* 학생별 개인 QR */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <Users size={18} color="#6366f1" />
          <span style={{ fontSize: 16, fontWeight: 800, color: '#1e293b' }}>학생별 개인 QR</span>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>스캔 즉시 본인 확인 화면으로 이동 — 이름 입력 불필요</span>
        </div>

        {state.students.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#cbd5e1', padding: 32, fontSize: 13, border: '1px dashed #e2e8f0', borderRadius: 14, background: 'white' }}>
            등록된 학생이 없습니다
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 14 }}>
            {state.students.map(student => (
              <StudentQRCard key={student.id} student={student} baseUrl={baseUrl} />
            ))}
          </div>
        )}
      </div>

      {/* 인쇄 전용 영역 */}
      <style>{`
        @media print {
          .admin-sidebar, nav, h1, p, .card:not(.print-card), button { display: none !important; }
          body { background: white; }
        }
      `}</style>
    </div>
  );
}
