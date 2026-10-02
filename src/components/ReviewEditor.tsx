'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useProgress } from '@/components/ProgressProvider';
import { Bar, PageTitle } from '@/components/ui';
import { supabaseBrowser } from '@/lib/supabase/client';
import { formatArDateTime } from '@/lib/dates';
import { MONTH_NAMES, SUBJECT_ORDER, subjectLabel } from '@/lib/subjects';
import * as L from '@/lib/programLogic';

type Initial = Record<string, string | null> | null;

// Field set mirrors the approved JSON (weekly_reviews[].fields / monthly_reviews[].fields).
// Numeric fields (stars, missed, recovered, progress, subjects) are computed, never typed.
const FIELDS = {
  week: [
    { k: 'goal', l: 'هدفي لهذا الأسبوع' },
    { k: 'what_accomplished', l: 'ماذا أنجزت هذا الأسبوع؟' },
    { k: 'what_to_improve', l: 'ما الذي أحتاج إلى تحسينه؟' },
  ],
  month: [
    { k: 'goal', l: 'هدفي لهذا الشهر' },
    { k: 'biggest_achievement', l: 'أكبر إنجاز هذا الشهر' },
    { k: 'improve_next_month', l: 'ما الذي سأحسّنه الشهر القادم؟' },
  ],
} as const;

export function ReviewEditor({ kind, number, initial }: { kind: 'week' | 'month'; number: number; initial: Initial }) {
  const { program, state, opts, profile } = useProgress();
  const meta = kind === 'week'
    ? program.weekly.find((w) => w.week_number === number)
    : program.monthly.find((m) => m.month_number === number);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(FIELDS[kind].map((f) => [f.k, (initial?.[f.k] as string) ?? ''])));
  const [savedAt, setSavedAt] = useState<string | null>((initial?.updated_at as string) ?? null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  if (!meta) return null;

  const r = L.rangeStats(program.days, program.dayNumbers, state, meta.from_day, meta.to_day, opts);
  const max = meta.max_stars ?? r.max;
  const title = kind === 'week' ? `المراجعة الأسبوعية — الأسبوع ${number}` : `المراجعة الشهرية — ${MONTH_NAMES[number - 1]}`;
  const memo = r.subjects.memorization;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const payload: Record<string, unknown> = { student_id: profile.id };
    FIELDS[kind].forEach((f) => { payload[f.k] = values[f.k].trim().slice(0, f.k === 'goal' ? 2000 : 4000) || null; });
    const table = kind === 'week' ? 'weekly_review_responses' : 'monthly_review_responses';
    if (kind === 'week') payload.week_number = number; else payload.month_number = number;
    const { data, error } = await supabaseBrowser().from(table)
      .upsert(payload, { onConflict: kind === 'week' ? 'student_id,week_number' : 'student_id,month_number' })
      .select('updated_at').single();
    setBusy(false);
    if (error) setErr('تعذر الحفظ. أعد المحاولة.'); else setSavedAt(data.updated_at);
  }

  return (
    <div className="space-y-5">
      <PageTitle title={title} sub={`اليوم ${meta.from_day} – اليوم ${meta.to_day}`} back={{ href: '/reviews', label: 'المراجعات' }} />

      <section className="card p-5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <p className="font-bold text-forest">{kind === 'week' ? 'نجوم الأسبوع' : 'نجوم الشهر'}</p>
          <p className="ltr day-num text-4xl text-forest">{r.earned} <span className="text-xl text-ink-muted">/ {max}</span></p>
        </div>
        <div className="mt-3"><Bar value={r.earned} max={max} tone="gold" /></div>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
          <div className="rounded-xl bg-sand p-3"><dt className="text-xs text-ink-muted">نسبة التقدم</dt><dd className="ltr day-num text-2xl text-forest">{r.pct}%</dd></div>
          <div className="rounded-xl bg-rose-pale p-3"><dt className="text-xs text-ink-muted">نجوم مفقودة</dt><dd className="ltr day-num text-2xl text-rose">{r.missed}</dd></div>
          <div className="rounded-xl bg-forest-mist p-3"><dt className="text-xs text-ink-muted">نجوم مستدركة</dt><dd className="ltr day-num text-2xl text-forest">{r.recovered}</dd></div>
          <div className="rounded-xl bg-sand p-3"><dt className="text-xs text-ink-muted">أيام مكتملة</dt><dd className="ltr day-num text-2xl text-forest">{r.daysDone}</dd></div>
        </dl>
        {kind === 'month' && (
          <div className="mt-4 space-y-2 text-sm">
            <p className="font-semibold text-forest">المواد المنجزة</p>
            {SUBJECT_ORDER.filter((k) => k !== 'memorization' && r.subjects[k]).map((k) => (
              <p key={k} className="flex justify-between"><span>{subjectLabel(k)}</span><span className="ltr">{r.subjects[k].done}/{r.subjects[k].total}</span></p>
            ))}
            {memo && <p className="flex justify-between border-t border-line pt-2 font-semibold"><span>الحفظ المنجز</span><span className="ltr">{memo.done}/{memo.total}</span></p>}
          </div>
        )}
      </section>

      <form onSubmit={save} className="card space-y-4 p-5">
        {FIELDS[kind].map((f) => (
          <div key={f.k}>
            <label htmlFor={f.k} className="label">{f.l}</label>
            <textarea id={f.k} rows={f.k === 'goal' ? 2 : 4} className="input" maxLength={f.k === 'goal' ? 2000 : 4000}
              value={values[f.k]} onChange={(e) => setValues((v) => ({ ...v, [f.k]: e.target.value }))} />
          </div>
        ))}
        {err && <p role="alert" className="text-sm text-rose">{err}</p>}
        <div className="flex flex-wrap items-center gap-3">
          <button className="btn-primary" disabled={busy}>{busy ? 'جارٍ الحفظ…' : 'حفظ المراجعة'}</button>
          {savedAt && <span className="text-xs text-ink-muted">آخر حفظ: {formatArDateTime(savedAt)}</span>}
        </div>
      </form>

      <Link href="/catch-up" className="block text-center text-sm font-semibold text-forest underline underline-offset-4">استدراك المهام الفائتة</Link>
    </div>
  );
}
