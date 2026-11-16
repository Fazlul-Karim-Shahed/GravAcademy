'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { Printer, X } from 'lucide-react';
import { formatBDDate } from '@/lib/dateUtils';

interface Props { data: any; onClose: () => void }

export default function TeacherPaymentReceiptModal({ data, onClose }: Props) {
  if (!data || typeof document === 'undefined') return null;
  const teacher = data.teacherId || {};
  const paidBy = data.paidBy || {};
  const handlePrint = () => window.print();
  const dateLabel = (value: string) => formatBDDate(`${value}T12:00:00`, { day: 'numeric', month: 'long', year: 'numeric' });
  const isBulk = (data.classes || []).length > 1;
  const courseRates = new Map<string, number>((data.courseBreakdown || []).map((course: any) => [
    String(course.courseId?._id || course.courseId), Number(course.rate || 0),
  ]));
  const referenceTotal = (data.classes || []).reduce((sum: number, item: any) =>
    sum + (courseRates.get(String(item.courseId?._id || item.courseId)) ?? Number(item.amount || 0)), 0);

  return createPortal(
    <div className="teacher-payment-print-root fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-3 sm:p-6 print:static print:block print:overflow-visible print:bg-white print:p-0">
      <style jsx global>{`
        @media print {
          @page { size: A4 portrait; margin: 12mm; }
          body > * { display: none !important; }
          body > .teacher-payment-print-root { display: block !important; position: static !important; width: 100% !important; background: #fff !important; }
          .teacher-payment-print-root > div { width: 100% !important; max-width: none !important; max-height: none !important; overflow: visible !important; box-shadow: none !important; border: 0 !important; }
          .teacher-payment-print-root .print-hidden { display: none !important; }
        }
      `}</style>
      <section className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl print:max-w-none print:rounded-none print:shadow-none">
        <div className="print-hidden flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-6">
          <h2 className="font-bold text-slate-900">Teacher Payment Receipt</h2>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="inline-flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white"><Printer className="h-4 w-4" /> Print</button>
            <button onClick={onClose} aria-label="Close receipt" className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-200"><X className="h-4 w-4" /></button>
          </div>
        </div>
        <div className="p-5 text-slate-900 sm:p-8 print:p-0">
          <header className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-dashed border-slate-300 pb-5">
            <div><h1 className="text-2xl font-black">GravAcademy</h1><p className="mt-1 text-sm text-slate-500">Teacher payment receipt</p></div>
            <div className="text-left sm:text-right"><p className="font-mono text-sm font-bold">{data.receiptNo}</p><p className="mt-1 text-xs text-slate-500">{formatBDDate(data.paidAt || data.createdAt, { day: 'numeric', month: 'long', year: 'numeric' })}</p></div>
          </header>
          <div className="grid gap-4 border-b border-slate-200 py-5 sm:grid-cols-2">
            <div><p className="text-xs text-slate-500">Teacher</p><p className="mt-1 font-bold">{teacher.name || '—'}</p>{teacher.gravId && <p className="text-xs text-slate-500">Grav ID: {teacher.gravId}</p>}</div>
            <div><p className="text-xs text-slate-500">Paid by</p><p className="mt-1 font-semibold">{paidBy.name || 'Admin'}</p></div>
          </div>
          {data.voidedAt && <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">VOID · {data.voidReason || 'Payment বাতিল হয়েছে'}</div>}
          <div className="overflow-x-auto py-4">
            <table className="w-full min-w-[460px] text-left text-sm">
              <thead><tr className="border-b border-slate-200 text-xs text-slate-500"><th className="py-2 pr-3">Course / Batch</th><th className="py-2 px-3">Class date</th><th className="py-2 pl-3 text-right">{isBulk ? 'Reference fee' : 'Amount'}</th></tr></thead>
              <tbody>{(data.classes || []).map((item: any, index: number) => <tr key={`${item.classKey}-${index}`} className="border-b border-slate-100"><td className="py-3 pr-3"><p className="font-semibold">{item.courseId?.title || 'Course'}</p><p className="text-xs text-slate-500">{item.batchId?.name || 'Batch'} · {item.startTime}{item.endTime ? `–${item.endTime}` : ''}</p></td><td className="px-3 py-3">{dateLabel(item.classDate)}</td><td className="py-3 pl-3 text-right font-bold">৳{Number(isBulk ? courseRates.get(String(item.courseId?._id || item.courseId)) ?? item.amount : item.amount || 0).toLocaleString('bn-BD')}</td></tr>)}</tbody>
            </table>
          </div>
          {data.notes && <p className="border-t border-slate-200 pt-4 text-sm"><span className="font-semibold">Note:</span> {data.notes}</p>}
          {isBulk && <div className="mt-4 flex justify-end text-sm text-slate-500"><div className="flex min-w-52 justify-between gap-8"><span>Reference total</span><span>৳{referenceTotal.toLocaleString('bn-BD')}</span></div></div>}
          <div className="mt-5 flex justify-end border-t-2 border-slate-800 pt-4"><div className="flex min-w-52 justify-between gap-8 text-lg font-black"><span>Total paid</span><span>৳{Number(data.amountPaid || 0).toLocaleString('bn-BD')}</span></div></div>
          <p className="mt-12 text-center text-xs text-slate-500">Automatically generated by GravAcademy</p>
        </div>
      </section>
    </div>,
    document.body,
  );
}
