export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#f0f9ff', fontFamily: "'Pretendard', -apple-system, sans-serif" }}>
      {children}
    </div>
  );
}
