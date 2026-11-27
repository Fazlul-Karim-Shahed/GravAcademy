'use client';

import { Database, FileText, Lock, Mail, ShieldCheck, UserCheck } from 'lucide-react';

const icons = { Database, FileText, Lock, Mail, ShieldCheck, UserCheck };
export default function PrivacyIcon({ name, className }: { name: keyof typeof icons; className?: string }) {
  const Icon = icons[name];
  return <Icon className={className} />;
}
