'use client';

import { BookOpen, CreditCard, Database, FileText, Lock, Mail, ShieldCheck, UserCheck } from 'lucide-react';

const icons = { BookOpen, CreditCard, Database, FileText, Lock, Mail, ShieldCheck, UserCheck };
export default function PrivacyIcon({ name, className }: { name: keyof typeof icons; className?: string }) {
  const Icon = icons[name];
  return <Icon className={className} />;
}
