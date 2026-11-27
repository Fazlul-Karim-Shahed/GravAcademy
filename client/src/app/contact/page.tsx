import type { Metadata } from 'next';
import Link from 'next/link';
import ContactIcon from '@/components/contact/ContactIcon';
import ContactForm from '@/components/contact/ContactForm';

export const dynamic = 'force-dynamic';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://gravapi.138.2.92.182.nip.io/api/v1';

interface PublicSettings {
  siteName?: string;
  siteTagline?: string;
  footerPhone?: string;
  footerEmail?: string;
  supportPhone?: string;
  contactPhone?: string;
  supportEmail?: string;
  contactEmail?: string;
  contactWhatsapp?: string;
  whatsappNumber?: string;
  contactAddress?: string;
  address?: string;
  contactHours?: string;
  supportHours?: string;
  contactTitle?: string;
  contactDescription?: string;
}

async function getLiveSettings(): Promise<PublicSettings> {
  try {
    const res = await fetch(`${API_BASE}/settings`, { cache: 'no-store' });
    if (!res.ok) return {};
    const json = await res.json();
    return json?.data || {};
  } catch {
    return {};
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getLiveSettings();
  const siteName = settings.siteName || 'Grav Academy';
  const email = settings.footerEmail || settings.contactEmail || settings.supportEmail || 'support@gravacademy.com';
  const phone = settings.footerPhone || settings.contactPhone || settings.supportPhone || '16910 / 01700-000000';
  const description = settings.contactDescription || `${siteName}-এর সাথে যোগাযোগ করুন — ভর্তি, কোর্স, ব্যাচ ও টেকনিক্যাল সহায়তার জন্য কল করুন (${phone}) অথবা ইমেইল করুন (${email})।`;

  return {
    title: `${settings.contactTitle || 'যোগাযোগ করুন'} | ${siteName}`,
    description,
    alternates: {
      canonical: 'https://gravacademy.com/contact',
    },
    openGraph: {
      title: `Contact ${siteName}`,
      description: `Get in touch with ${siteName} for admissions, courses, batches, and student support.`,
      url: 'https://gravacademy.com/contact',
      type: 'website',
    },
  };
}

export default async function ContactPage() {
  const settings = await getLiveSettings();
  const siteName = settings.siteName || 'Grav Academy';
  const phone = settings.footerPhone || settings.contactPhone || settings.supportPhone || '16910 / 01700-000000';
  const email = settings.footerEmail || settings.contactEmail || settings.supportEmail || 'support@gravacademy.com';
  const hours = settings.contactHours || settings.supportHours || 'সকাল ৯টা – রাত ১০টা (প্রতিদিন)';
  const address = settings.contactAddress || settings.address || 'ঢাকা, বাংলাদেশ (অনলাইন একাডেমিক প্ল্যাটফর্ম)';
  const title = settings.contactTitle || `${siteName}-এর সাথে যোগাযোগ করুন`;
  const description = settings.contactDescription || 'ভর্তি, ব্যাচ সময়সূচি, কোর্স ফি কিংবা টেকনিক্যাল যেকোনো সহায়তার জন্য আমাদের সাথে সরাসরি যোগাযোগ করতে পারেন।';
  const whatsappDigits = (settings.contactWhatsapp || settings.whatsappNumber || '').replace(/[^\d]/g, '');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: `Contact ${siteName}`,
    url: 'https://gravacademy.com/contact',
    mainEntity: {
      '@type': 'EducationalOrganization',
      name: siteName,
      url: 'https://gravacademy.com',
      email,
      telephone: phone,
      address: {
        '@type': 'PostalAddress',
        addressLocality: address,
        addressCountry: 'BD',
      },
    },
  };

  return (
    <main className="ga-page min-h-screen py-12 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <header className="ga-card mb-8 p-6 sm:p-8">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-700 dark:text-orange-300">
            <ContactIcon name="MessageCircle" className="h-3.5 w-3.5" /> হেল্পলাইন ও যোগাযোগ
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
            {title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            {description}
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_1.2fr]">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="ga-card flex items-start gap-4 p-5">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
                <ContactIcon name="Phone" className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">হেল্পলাইন নম্বর</h2>
                <p className="mt-1 text-sm font-semibold text-orange-600 dark:text-orange-400">{phone}</p>
              </div>
            </div>

            {whatsappDigits && <div className="ga-card flex items-start gap-4 p-5">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <ContactIcon name="MessageCircle" className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">WhatsApp</h2>
                <a href={`https://wa.me/${whatsappDigits}`} target="_blank" rel="noreferrer" className="mt-1 block text-sm font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">{whatsappDigits}</a>
              </div>
            </div>}

            <div className="ga-card flex items-start gap-4 p-5">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <ContactIcon name="Mail" className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">ইমেইল</h2>
                <a href={`mailto:${email}`} className="mt-1 block text-sm font-semibold text-slate-700 hover:text-orange-600 dark:text-slate-300">
                  {email}
                </a>
              </div>
            </div>

            <div className="ga-card flex items-start gap-4 p-5">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <ContactIcon name="Clock" className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">সাপোর্ট সময়</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{hours}</p>
              </div>
            </div>

            <div className="ga-card flex items-start gap-4 p-5">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                <ContactIcon name="MapPin" className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">অবস্থান</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{address}</p>
                <Link href="/privacy" className="mt-2 inline-block text-xs font-semibold text-orange-600 hover:underline dark:text-orange-400">
                  Privacy Policy দেখুন →
                </Link>
              </div>
            </div>
          </div>

          <section className="ga-card p-6 sm:p-7">
            <h2 className="mb-1 text-lg font-bold text-slate-950 dark:text-white">সরাসরি বার্তা পাঠান</h2>
            <p className="mb-5 text-xs text-slate-500 dark:text-slate-400">
              নিচের ফর্মটি পূরণ করলে সরাসরি আমাদের সাপোর্ট চ্যানেলে আপনার বার্তা তৈরি হবে।
            </p>
            <ContactForm supportEmail={email} whatsappDigits={whatsappDigits || undefined} />
          </section>
        </div>
      </div>
    </main>
  );
}
