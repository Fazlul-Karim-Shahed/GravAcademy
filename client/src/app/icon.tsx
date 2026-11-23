import { ImageResponse } from 'next/og';

const brandLogo = 'https://lh3.googleusercontent.com/d/168GpVoyHXNpcY582UI2uGhtQkmau9SgT';

export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', position: 'relative' }}>
      <img src={brandLogo} width="512" height="512" alt="Grav Academy" style={{ width: 512, height: 512, objectFit: 'cover' }} />
      <div style={{ position: 'absolute', top: 320, left: 0, width: '100%', display: 'flex', justifyContent: 'center', color: '#ffffff', fontSize: 48, fontWeight: 700, letterSpacing: 0.2 }}>Learn with GRAV</div>
    </div>,
    size,
  );
}
