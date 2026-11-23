import type { Metadata } from 'next';
import { Baloo_Da_2, DM_Sans, Noto_Sans_Bengali } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { SiteSettingsProvider } from '@/context/SiteSettingsContext';
import { Navbar } from '@/components/navigation/Navbar';
import FeatureRouteGuard from '@/components/common/FeatureRouteGuard';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-dm-sans',
});

const balooDa2 = Baloo_Da_2({
  subsets: ['bengali'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-baloo-da',
});

const notoSansBengali = Noto_Sans_Bengali({
  subsets: ['bengali'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-noto-bengali',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://gravacademy.com'),
  title: { default: 'গ্র্যাভ একাডেমি | ক্লাস ৬ – ১২ অনলাইন কোচিং ও একাডেমিক কেয়ার', template: '%s | GRAV ACADEMY' },
  description: '৬ষ্ঠ থেকে ১২শ শ্রেণির শিক্ষার্থীদের জন্য দেশের অন্যতম আধুনিক অনলাইন একাডেমিক কোচিং প্ল্যাটফর্ম। লাইভ ক্লাস, লেকচার শিট, পরীক্ষা ও সার্বক্ষণিক গাইডলাইন।',
  referrer: 'strict-origin-when-cross-origin',
  alternates: { canonical: '/' },
  openGraph: { type: 'website', locale: 'bn_BD', url: 'https://gravacademy.com', siteName: 'GRAV ACADEMY', title: 'গ্র্যাভ একাডেমি | ক্লাস ৬ – ১২ অনলাইন কোচিং ও একাডেমিক কেয়ার', description: 'লাইভ ক্লাস, লেকচার শিট, পরীক্ষা ও সার্বক্ষণিক একাডেমিক গাইডলাইন।', images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'GRAV ACADEMY' }] },
  twitter: { card: 'summary_large_image', title: 'GRAV ACADEMY', description: 'Your Academic Care', images: ['/opengraph-image'] },
  icons: {
    icon: 'https://lh3.googleusercontent.com/d/168GpVoyHXNpcY582UI2uGhtQkmau9SgT',
    apple: 'https://lh3.googleusercontent.com/d/168GpVoyHXNpcY582UI2uGhtQkmau9SgT',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'EducationalOrganization',
        '@id': 'https://gravacademy.com/#organization',
        name: 'GRAV ACADEMY',
        url: 'https://gravacademy.com',
        logo: 'https://lh3.googleusercontent.com/d/168GpVoyHXNpcY582UI2uGhtQkmau9SgT',
        description: 'ক্লাস ৬ থেকে ১২ পর্যন্ত অনলাইন একাডেমিক কেয়ার, লাইভ ক্লাস ও পরীক্ষার প্রস্তুতি।',
      },
      {
        '@type': 'WebSite',
        '@id': 'https://gravacademy.com/#website',
        url: 'https://gravacademy.com',
        name: 'GRAV ACADEMY',
        publisher: { '@id': 'https://gravacademy.com/#organization' },
        inLanguage: 'bn-BD',
      },
    ],
  };
  return (
    <html lang="bn" suppressHydrationWarning className={`${dmSans.variable} ${balooDa2.variable} ${notoSansBengali.variable}`}>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-blue-600 selection:text-white font-bangla transition-colors duration-150"
      >
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
        <ThemeProvider>
          <SiteSettingsProvider>
            <AuthProvider>
              <Navbar />
              <main className="ga-page min-h-[calc(100vh-4rem)]"><FeatureRouteGuard>{children}</FeatureRouteGuard></main>
            </AuthProvider>
          </SiteSettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
