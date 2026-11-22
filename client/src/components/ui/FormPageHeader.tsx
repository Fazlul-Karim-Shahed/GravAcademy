import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';

interface FormPageHeaderProps {
  backHref: string;
  backLabel: string;
  eyebrow: string;
  title: string;
  description?: string;
  badge?: ReactNode;
  action?: ReactNode;
}

/** The shared header for create and edit pages across GravAcademy. */
export function FormPageHeader({ backHref, backLabel, eyebrow, title, description, badge, action }: FormPageHeaderProps) {
  return <header className="mb-7">
    <div className="flex items-center justify-between gap-3">
      <Link href={backHref} className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 transition-colors hover:text-orange-600 dark:text-slate-400 dark:hover:text-orange-400"><ArrowLeft className="h-4 w-4" /> {backLabel}</Link>
      {badge && <div className="shrink-0">{badge}</div>}
    </div>
    <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-600 dark:text-orange-400">{eyebrow}</p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  </header>;
}
