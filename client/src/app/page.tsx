import Link from 'next/link';
import {
  GraduationCap,
  BookOpen,
  Copy,
  FolderGit2,
  Video,
  FileCheck2,
  Users,
  ShieldCheck,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';

export default function Home() {
  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-[calc(100vh-4rem)] transition-colors">
      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-6">
          <span>Bangladeshi Coaching Management Platform</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-tight">
          Comprehensive Learning Platform for{' '}
          <span className="text-blue-600 dark:text-blue-400">Class 6 to Class 12</span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Manage courses, organize cohorts, duplicate batch curriculums with zero coupling,
          conduct examinations, and synchronize notes directly to Google Drive.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/register"
            className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-sm transition-colors flex items-center gap-2"
          >
            <span>Register as Student</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="px-5 py-2.5 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium text-sm border border-slate-300 dark:border-slate-800 transition-colors shadow-sm"
          >
            Staff & Student Log In
          </Link>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="border-t border-slate-200 dark:border-slate-800 pt-12 mb-10 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Designed for Coaching Operations
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Core LMS tools built specifically for teachers, students, and administrators.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="clean-card p-6">
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
              <Copy className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
              Zero-Coupling Batch Duplication
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Clone any existing batch's modules, sections, and lessons into a new cohort. Cloned content is independently editable without modifying the source.
            </p>
          </div>

          {/* Card 2 */}
          <div className="clean-card p-6">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
              Google Drive Cloud Storage
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Upload PDFs and notes from the admin dashboard directly to your Gmail Google Drive via API v3, with protected proxy access for students.
            </p>
          </div>

          {/* Card 3 */}
          <div className="clean-card p-6">
            <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mb-4">
              <Video className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
              YouTube Recorded Lectures
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Embed recorded video lectures cleanly into lesson pages with distraction-free playback parameters and zero server storage cost.
            </p>
          </div>

          {/* Card 4 */}
          <div className="clean-card p-6">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
              MCQ Examination System
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Automated testing with timer, negative marking, and server-side evaluation. Correct answers are kept confidential on the backend.
            </p>
          </div>

          {/* Card 5 */}
          <div className="clean-card p-6">
            <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
              6-Tier Role Access Control
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Dedicated dashboards for Superadmin, Admin, Teacher, Student, Guardian, and Employee. Public registrations strictly receive Student access.
            </p>
          </div>

          {/* Card 6 */}
          <div className="clean-card p-6">
            <div className="w-10 h-10 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
              Online MongoDB Atlas
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Lightweight cloud database architecture with compound indexes, optimized for low-bandwidth devices and academic record preservation.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
