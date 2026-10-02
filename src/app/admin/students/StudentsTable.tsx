'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';
import { Bar } from '@/components/ui';
import { formatArDate, formatArDateTime } from '@/lib/dates';

export type StudentRow = {
  id: string; name: string; email: string; role: string; account_status: 'pending' | 'active' | 'suspended';
  program_start_date: string | null; created_at: string; completed_tasks: number; last_activity: string | null;
};
const STATUS = { pending: 'في الانتظار', active: 'مفعّل', suspended: 'موقوف' } as const;
const STATUS_CLS = { pending: 'bg-gold-pale text-gold-ink', active: 'bg-forest-mist text-forest', suspended: 'bg-rose-pale text-rose' } as const;

export function StudentsTable({ rows }: { rows: StudentRow[] }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | StudentRow['account_status']>('all');
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const list = useMemo(() => rows.filter((r) =>
    (filter === 'all' || r.account_status === filter) &&
    (!q || r.name.toLowerCase().includes(q.toLowerCase()) || r.email.toLowerCase().includes(q.toLowerCase()))), [rows, q, filter]);

  async function setStatus(r: StudentRow, status: StudentRow['account_status']) {
    if (status === 'suspended' && !confirm(`إيقاف حساب ${r.name}؟`)) return;
    setBusy(r.id); setErr(null);
    const { error } = await supabaseBrowser().rpc('admin_set_account_status', { p_user: r.id, p_status: status });
    setBusy(null);
    if (error) setErr(error.message); else router.refresh();
  }
  async function setStart(r: StudentRow, date: string) {
    if (!date) return;
    setBusy(r.id); setErr(null);
    const { error } = await supabaseBrowser().rpc('admin_set_start_date', { p_user: r.id, p_start: date });
    setBusy(null);
    if (error) setErr(error.message); else router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold text-forest">الطلاب <span className="text-base font-normal text-ink-muted">({rows.length})</span></h1>
        <div className="flex flex-wrap gap-2">
          <input placeholder="بحث بالاسم أو البريد" className="input !w-60" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="input !w-auto" value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} aria-label="الحالة">
            <option value="all">كل الحالات</option><option value="pending">في الانتظار</option><option value="active">مفعّل</option><option value="suspended">موقوف</option>
          </select>
        </div>
      </div>
      {err && <p role="alert" className="rounded-xl bg-rose-pale px-4 py-2 text-sm text-rose">{err}</p>}
      <p className="text-xs text-ink-muted">تاريخ البداية = اليوم 1 للطالب. يُضبط تلقائيًا عند التفعيل، ويمكن تعديله. منه تُحسب المهام الفائتة وسلسلة الإنجاز.</p>

      <ul className="space-y-3">
        {list.map((r) => (
          <li key={r.id} className="card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-ink">{r.name || '—'} {r.role === 'admin' && <span className="pill !bg-gold-pale !text-gold-ink">admin</span>}</p>
                <p className="ltr truncate text-sm text-ink-muted">{r.email}</p>
                <p className="text-xs text-ink-muted">سُجّل {formatArDate(r.created_at.slice(0, 10))}{r.last_activity ? ` · آخر نشاط ${formatArDateTime(r.last_activity)}` : ''}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_CLS[r.account_status]}`}>{STATUS[r.account_status]}</span>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <div className="mb-1 flex justify-between text-xs text-ink-muted"><span>المهام المكتملة</span><span className="ltr">{r.completed_tasks}/396</span></div>
                <Bar value={r.completed_tasks} max={396} />
              </div>
              <label className="text-xs text-ink-muted">بداية البرنامج
                <input type="date" className="input mt-1 !min-h-0 !py-1.5 text-sm" defaultValue={r.program_start_date ?? ''} disabled={busy === r.id}
                  onBlur={(e) => e.target.value && e.target.value !== r.program_start_date && setStart(r, e.target.value)} />
              </label>
            </div>
            {r.role !== 'admin' && (
              <div className="mt-3 flex flex-wrap gap-2">
                {r.account_status !== 'active' && <button className="btn-primary btn-sm" disabled={busy === r.id} onClick={() => setStatus(r, 'active')}>تفعيل</button>}
                {r.account_status !== 'suspended' && <button className="btn-danger btn-sm" disabled={busy === r.id} onClick={() => setStatus(r, 'suspended')}>إيقاف</button>}
                {r.account_status !== 'pending' && <button className="btn-ghost btn-sm" disabled={busy === r.id} onClick={() => setStatus(r, 'pending')}>إرجاع للانتظار</button>}
              </div>
            )}
          </li>
        ))}
        {list.length === 0 && <li className="card-sand p-6 text-center text-ink-muted">لا يوجد طلاب بهذه المعايير.</li>}
      </ul>
    </div>
  );
}
