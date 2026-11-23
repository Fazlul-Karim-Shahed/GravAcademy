import { ImageResponse } from 'next/og';

const brandLogo = 'https://lh3.googleusercontent.com/d/168GpVoyHXNpcY582UI2uGhtQkmau9SgT';

export const runtime = 'nodejs';
export const alt = 'GRAV ACADEMY — School to Career · Learn with Confidence';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fffaf6', color: '#10233f', overflow: 'hidden', position: 'relative' }}>
      <div style={{ position: 'absolute', width: 1040, height: 1040, borderRadius: 1040, background: '#ff7a16', opacity: 0.1, top: -665, left: 80 }} />
      <div style={{ position: 'absolute', width: 780, height: 780, borderRadius: 780, background: '#f6bd53', opacity: 0.12, bottom: -590, right: -160 }} />
      <div style={{ zIndex: 1, display: 'flex', alignItems: 'center', flexDirection: 'column', textAlign: 'center', transform: 'translateY(-4px)' }}>
        <img src={brandLogo} width="260" height="260" alt="Grav Academy logo" style={{ width: 260, height: 260, borderRadius: 130, objectFit: 'cover' }} />
        <div style={{ marginTop: 38, fontSize: 54, lineHeight: 1, fontWeight: 600, letterSpacing: 16, color: '#092b59', paddingLeft: 16 }}>GRAV ACADEMY</div>
        <div style={{ marginTop: 24, fontSize: 28, lineHeight: 1, fontWeight: 400, letterSpacing: 1.1, color: '#f56600' }}>School to Career · Learn with Confidence</div>
      </div>
    </div>,
    size,
  );
}
