'use client';

import AdminJobFormPage from '../new/page';

export default function AdminJobEditPage({ params }: { params: Promise<{ id?: string }> }) {
  return <AdminJobFormPage params={params} />;
}
