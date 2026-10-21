import { Baloo_Da_2, DM_Sans } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { Navbar } from '@/components/navigation/Navbar';

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

export const metadata: Metadata = {
  title: 'গ্র্যাভ একাডেমি | ক্লাস ৬ – ১২ অনলাইন কোচিং ও একাডেমিক কেয়ার',
  description: '৬ষ্ঠ থেকে ১২শ শ্রেণির শিক্ষার্থীদের জন্য দেশের অন্যতম আধুনিক অনলাইন একাডেমিক কোচিং প্ল্যাটফর্ম। লাইভ ক্লাস, লেকচার শিট, পরীক্ষা ও সার্বক্ষণিক গাইডলাইন।',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn" suppressHydrationWarning className={`${dmSans.variable} ${balooDa2.variable}`}>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-blue-600 selection:text-white font-bangla transition-colors duration-150"
      >
        <ThemeProvider>
          <AuthProvider>
            <Navbar />
            <main className="min-h-[calc(100vh-4rem)]">{children}</main>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
