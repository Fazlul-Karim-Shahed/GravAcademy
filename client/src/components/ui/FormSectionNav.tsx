'use client';

import { useEffect, useState } from 'react';

export interface FormSectionNavItem { id: string; label: string; }

interface FormSectionNavProps { heading: string; items: FormSectionNavItem[]; }

/** Sticky long-form navigation that reflects the section currently in view. */
export function FormSectionNav({ heading, items }: FormSectionNavProps) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? '');

  useEffect(() => {
    let frame = 0;
    const updateActiveSection = () => {
      frame = 0;
      let selected = items[0]?.id ?? '';
      for (const item of items) {
        const section = document.getElementById(item.id);
        if (section && section.getBoundingClientRect().top <= 150) selected = item.id;
      }
      setActiveId(selected);
    };
    const requestUpdate = () => { if (!frame) frame = window.requestAnimationFrame(updateActiveSection); };
    const hashId = window.location.hash.slice(1);
    if (items.some((item) => item.id === hashId)) setActiveId(hashId);
    requestUpdate();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    window.addEventListener('hashchange', requestUpdate);
    return () => {
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
      window.removeEventListener('hashchange', requestUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [items]);

  const goToSection = (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    event.preventDefault();
    setActiveId(id);
    window.history.replaceState(null, '', `#${id}`);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return <aside className="hidden lg:sticky lg:top-24 lg:block">
    <p className="mb-3 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">{heading}</p>
    <nav aria-label={heading} className="space-y-1 border-l border-slate-200 pl-3 dark:border-[#262b34]">
      {items.map((item) => {
        const active = activeId === item.id;
        return <a key={item.id} href={`#${item.id}`} aria-current={active ? 'location' : undefined} onClick={(event) => goToSection(event, item.id)} className={`block rounded-lg px-3 py-2 text-xs font-bold transition-colors ${active ? 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300' : 'text-slate-600 hover:bg-orange-50 hover:text-orange-700 dark:text-slate-300 dark:hover:bg-orange-950/30 dark:hover:text-orange-300'}`}>{item.label}</a>;
      })}
    </nav>
  </aside>;
}
