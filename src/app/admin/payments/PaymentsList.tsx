'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';
import { formatArDateTime } from '@/lib/dates';

export type PaymentRow = {
  id: string; student_id: string; payment_method: string | null; payment_reference: string | null;
  screenshot_path: string | null; note: string | null; status: 'pending' | 'approved' | 'rejected';
  submitted_at: string; reviewed_at: string | null; admin_note: string | null;
  profile: { name: string; email: string; account_status: string } | null; proof_url: string | null;
};
const ST = { pending: 'جديد', approved: 'مقبول', rejected: 'مرفوض' } as const;

export function PaymentsList({ rows, price, currency }: { rows: PaymentRow[]; price: number | null; currency: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<'pending' | 'done'>('pending');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const list = rows.filter((r) => (tab === 'pending' ? r.status === 'pending' : r.status !== 'pending'));

  async function review(r: PaymentRow, approve: boolean) {
    if (!approve && !confirm('رفض هذا الطلب؟')) return;
    setBusy(r.id); setErr(null);
    const { error } = await supabaseBrowser().rpc('admin_review_payment', { p_request: r.id, p_approve: approve, p_note: notes[r.id] || null });
    setBusy(null);
    if (error) setErr(error.message); else router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold text-forest">المدفوعات اليدوية</h1>
        <p className="text-sm text-ink-muted">السعر الحالي: {price !== null ? `${price} ${currency}` : 'غير محدد'}</p>
      </div>
      <div className="flex gap-2">
        <button className={tab === 'pending' ? 'btn-primary btn-sm' : 'btn-ghost btn-sm'} onClick={() => setTab('pending')}>جديدة ({rows.filter((r) => r.status === 'pending').length})</button>
        <button className={tab === 'done' ? 'btn-primary btn-sm' : 'btn-ghost btn-sm'} onClick={() => setTab('done')}>تمت مراجعتها</button>
      </div>
      {err && <p role="alert" className="rounded-xl bg-rose-pale px-4 py-2 text-sm text-rose">{err}</p>}
      <ul className="space-y-3">
        {list.map((r) => (
          <li key={r.id} className="card grid gap-4 p-4 md:grid-cols-[1fr_200px]">
            <div className="space-y-1 text-[15px]">
              <p className="font-semibold">{r.profile?.name || '—'} <span className="ltr text-sm font-normal text-ink-muted">{r.profile?.email}</span></p>
              <p className="text-sm text-ink-muted">{formatArDateTime(r.submitted_at)} · {r.payment_method || '—'} · <span className="pill">{ST[r.status]}</span></p>
              {r.payment_reference && <p>المرجع: <span className="ltr font-semibold">{r.payment_reference}</span></p>}
              {r.note && <p className="text-ink-muted">ملاحظة الطالب: {r.note}</p>}
              {r.admin_note && <p className="text-ink-muted">ملاحظة الإدارة: {r.admin_note}</p>}
              {r.status === 'pending' && (
                <div className="space-y-2 pt-2">
                  <input className="input" placeholder="ملاحظة للطالب (اختياري، تظهر له عند الرفض)" maxLength={500}
                    value={notes[r.id] ?? ''} onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))} />
                  <div className="flex gap-2">
                    <button className="btn-primary btn-sm" disabled={busy === r.id} onClick={() => review(r, true)}>قبول وتفعيل الحساب</button>
                    <button className="btn-danger btn-sm" disabled={busy === r.id} onClick={() => review(r, false)}>رفض</button>
                  </div>
                </div>
              )}
            </div>
            <div>
              {r.proof_url ? (
                <a href={r.proof_url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl border border-line">
                  {/\.pdf$/i.test(r.screenshot_path ?? '') ? <span className="block p-6 text-center text-sm text-forest">فتح ملف PDF</span>
                    // eslint-disable-next-line @next/next/no-img-element
                    : <img src={r.proof_url} alt="إثبات الدفع" className="h-48 w-full object-cover" />}
                </a>
              ) : <p className="rounded-xl bg-sand p-6 text-center text-sm text-ink-muted">لا يوجد ملف</p>}
            </div>
          </li>
        ))}
        {list.length === 0 && <li className="card-sand p-6 text-center text-ink-muted">لا توجد طلبات هنا.</li>}
      </ul>
    </div>
  );
}
