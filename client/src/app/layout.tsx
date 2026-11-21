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
  title: 'গ্র্যাভ একাডেমি | ক্লাস ৬ – ১২ অনলাইন কোচিং ও একাডেমিক কেয়ার',
  description: '৬ষ্ঠ থেকে ১২শ শ্রেণির শিক্ষার্থীদের জন্য দেশের অন্যতম আধুনিক অনলাইন একাডেমিক কোচিং প্ল্যাটফর্ম। লাইভ ক্লাস, লেকচার শিট, পরীক্ষা ও সার্বক্ষণিক গাইডলাইন।',
  referrer: 'strict-origin-when-cross-origin',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn" suppressHydrationWarning className={`${dmSans.variable} ${balooDa2.variable} ${notoSansBengali.variable}`}>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-blue-600 selection:text-white font-bangla transition-colors duration-150"
      >
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
