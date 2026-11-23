import { ImageResponse } from 'next/og';

const brandLogo = 'https://lh3.googleusercontent.com/d/168GpVoyHXNpcY582UI2uGhtQkmau9SgT';

export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff' }}>
      <img src={brandLogo} width="512" height="512" alt="Grav Academy" style={{ width: 512, height: 512, objectFit: 'cover' }} />
    </div>,
    size,
  );
}
