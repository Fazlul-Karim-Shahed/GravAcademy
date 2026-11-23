import { ImageResponse } from 'next/og';

const brandLogo = 'https://lh3.googleusercontent.com/d/168GpVoyHXNpcY582UI2uGhtQkmau9SgT';

export const runtime = 'nodejs';
export const alt = 'GRAV ACADEMY — Your Academic Care';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ height: '100%', width: '100%', display: 'flex', background: '#fff8f1', color: '#10233f', padding: '72px', position: 'relative' }}>
      <div style={{ position: 'absolute', width: 620, height: 620, borderRadius: 620, background: '#ff7a16', opacity: 0.12, right: -180, top: -220 }} />
      <div style={{ position: 'absolute', width: 360, height: 360, borderRadius: 360, background: '#f6bd53', opacity: 0.22, left: -130, bottom: -180 }} />
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}><img src={brandLogo} width="92" height="92" alt="Grav Academy logo" style={{ width: 92, height: 92, borderRadius: 46, objectFit: 'cover' }} /><div style={{ display: 'flex', flexDirection: 'column' }}><div style={{ fontSize: 36, fontWeight: 800, letterSpacing: 1 }}>GRAV ACADEMY</div><div style={{ fontSize: 20, color: '#d65a00', marginTop: 3 }}>YOUR ACADEMIC CARE</div></div></div>
        <div style={{ display: 'flex', flexDirection: 'column' }}><div style={{ display: 'flex', flexDirection: 'column', fontSize: 64, lineHeight: 1.1, fontWeight: 800, maxWidth: 860 }}><span>Learn with clarity.</span><span>Grow with confidence.</span></div><div style={{ fontSize: 26, color: '#526277', marginTop: 24 }}>Classes 6–12 · Live learning · Exam preparation</div></div>
        <div style={{ fontSize: 23, color: '#d65a00', fontWeight: 700 }}>gravacademy.com</div>
      </div>
    </div>,
    size,
  );
}
