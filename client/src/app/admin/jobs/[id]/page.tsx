'use client';

import AdminJobFormPage from '../new/page';

export default function AdminJobEditPage({ params }: { params: Promise<{ id?: string }> }) {
  return <div className="ga-admin-page ga-form-page"><AdminJobFormPage params={params} /></div>;
}
