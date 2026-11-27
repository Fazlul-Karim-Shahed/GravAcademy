'use client';
import { Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
const icons = { Clock, Mail, MapPin, MessageCircle, Phone };
export default function ContactIcon({ name, className }: { name: keyof typeof icons; className?: string }) { const Icon = icons[name]; return <Icon className={className} />; }
