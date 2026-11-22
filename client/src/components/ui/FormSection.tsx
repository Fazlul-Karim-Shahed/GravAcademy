import type { ReactNode } from 'react';

export const formInputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-[#262b34] dark:bg-[#151921] dark:text-white';

export const formLabelClass = 'mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300';

interface FormSectionProps {
  id: string;
  icon?: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function FormSection({
  id,
  icon,
  title,
  description,
  children,
  className = '',
}: FormSectionProps) {
  return (
    <section
      id={id}
      className={`scroll-mt-24 border-b border-slate-200 bg-transparent py-5 last:border-b-0 dark:border-[#262b34] dark:bg-transparent sm:bg-white sm:p-6 dark:sm:bg-[#111318] ${className}`}
    >
      <div className="flex items-start gap-3">
        {icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-orange-200 bg-orange-50 text-orange-600 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-400">
            {icon}
          </span>
        )}
        <div>
          <h2 className="text-sm font-black text-slate-900 dark:text-white">{title}</h2>
          {description && (
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{description}</p>
          )}
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}
