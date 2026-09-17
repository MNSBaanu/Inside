import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Inside — interior design marketplace';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#FDF8F1',
          color: '#231C16',
          padding: '72px 80px',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 22,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: '#C4553A',
          }}
        >
          Interior design marketplace
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: 84,
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            maxWidth: 900,
          }}
        >
          The right designer for the space you have in mind.
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '2px solid #C4553A',
            paddingTop: 32,
            fontSize: 30,
          }}
        >
          <div style={{ display: 'flex' }}>Inside</div>
          <div style={{ display: 'flex', fontSize: 22, color: '#7A6E63' }}>
            Brief · Compare · Build
          </div>
        </div>
      </div>
    ),
    size,
  );
}
