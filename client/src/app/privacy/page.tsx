import type { Metadata } from 'next';
import Link from 'next/link';
import PrivacyIcon from '@/components/privacy/PrivacyIcon';

export const metadata: Metadata = {
  title: 'Privacy Policy | Grav Academy',
  description:
    'Learn how Grav Academy collects, uses, stores, and protects student, guardian, teacher, and staff information, including our Google API Services User Data Policy compliance.',
  alternates: {
    canonical: 'https://gravacademy.com/privacy',
  },
  openGraph: {
    title: 'Privacy Policy | Grav Academy',
    description:
      'Privacy Policy and data protection practices for Grav Academy online academic coaching platform.',
    url: 'https://gravacademy.com/privacy',
    type: 'website',
  },
};

const sections = [
  {
    icon: 'Database' as const,
    title: '1. Information We Collect',
    items: [
      'Account and profile information such as your full name, email address, phone number, role (student, guardian, teacher, or staff), and academic grade level.',
      'Academic records including course enrollments, batch schedules, attendance, exam attempts, assignment submissions, and progress reports.',
      'Payment and billing records necessary to verify course fees, issue receipts, and process refunds.',
      'Technical logs such as device/browser metadata and IP address used solely for authentication security, fraud prevention, and service reliability.',
    ],
  },
  {
    icon: 'FileText' as const,
    title: '2. How We Use Your Information',
    items: [
      'To create and manage your Grav Academy account, enroll students in batches, and provide access to classes, exams, and study materials.',
      'To send essential academic and transactional notifications such as admission confirmations, schedule updates, exam results, and password resets.',
      'To provide responsive student and guardian support through our helpdesk channels.',
      'To maintain platform integrity, audit administrative actions, and improve learning experiences.',
    ],
  },
  {
    icon: 'Lock' as const,
    title: '3. Google API Services & Data Protection',
    items: [
      'Grav Academy uses Google Drive and Gmail APIs strictly for authorized administrative document storage and sending platform-related transactional emails.',
      'Grav Academy’s use and transfer of information received from Google APIs adhere to the Google API Services User Data Policy, including the Limited Use requirements.',
      'We never sell, rent, or trade your personal information or Google user data to third-party advertisers or data brokers.',
    ],
  },
  {
    icon: 'UserCheck' as const,
    title: '4. Data Retention & Your Rights',
    items: [
      'We retain your personal and academic records only for as long as your account is active or as required to provide educational services and comply with legal obligations.',
      'You may request access to, correction of, or deletion of your personal data at any time by contacting our support team.',
      'All sensitive credentials and tokens are stored securely using industry-standard encryption and access controls.',
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <main className="ga-page min-h-screen py-12 sm:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <header className="ga-card mb-8 p-6 sm:p-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-700 dark:text-orange-300">
            <PrivacyIcon name="ShieldCheck" className="h-3.5 w-3.5" />
            <span>Legal &amp; Data Protection</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Effective Date: November 28, 2026 · Grav Academy (<Link href="/" className="font-semibold text-orange-600 hover:underline dark:text-orange-400">gravacademy.com</Link>)
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
            Grav Academy respects your privacy and is committed to protecting the personal data of our students, guardians, teachers, and staff. This policy explains what information we collect, how we use it, and how we safeguard it.
          </p>
        </header>

        <div className="space-y-5">
          {sections.map((section) => {
            return (
              <section key={section.title} className="ga-card p-6 sm:p-7">
                <div className="mb-3 flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
                    <PrivacyIcon name={section.icon} className="h-4 w-4" />
                  </span>
                  <h2 className="text-lg font-bold text-slate-950 dark:text-white">{section.title}</h2>
                </div>
                <ul className="space-y-2.5 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {section.items.map((item) => (
                    <li key={item} className="flex gap-2.5">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}

          <section className="ga-card p-6 sm:p-7">
            <div className="mb-2 flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
                <PrivacyIcon name="Mail" className="h-4 w-4" />
              </span>
              <h2 className="text-lg font-bold text-slate-950 dark:text-white">5. Contact Us</h2>
            </div>
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
              If you have any questions about this Privacy Policy or wish to request data access or deletion, please contact us at{' '}
              <a href="mailto:support@gravacademy.com" className="font-semibold text-orange-600 hover:underline dark:text-orange-400">
                support@gravacademy.com
              </a>{' '}
              or visit our{' '}
              <Link href="/contact" className="font-semibold text-orange-600 hover:underline dark:text-orange-400">
                Contact page
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
