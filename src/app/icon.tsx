import { ImageResponse } from 'next/og';

export const size = { width: 192, height: 192 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 36,
        color: 'white',
        fontSize: 96,
        fontWeight: 900,
      }}
    >
      공
    </div>,
    { ...size }
  );
}
