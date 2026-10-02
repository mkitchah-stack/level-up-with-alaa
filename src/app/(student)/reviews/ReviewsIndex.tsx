'use client';
import Link from 'next/link';
import { useProgress, useStats } from '@/components/ProgressProvider';
import { Bar, PageTitle } from '@/components/ui';
import { MONTH_NAMES } from '@/lib/subjects';
import * as L from '@/lib/programLogic';

export function ReviewsIndex({ filledWeeks, filledMonths }: { filledWeeks: number[]; filledMonths: number[] }) {
  const { program, state, opts } = useProgress();
  const { today } = useStats();
  const stat = (a: number, b: number) => L.rangeStats(program.days, program.dayNumbers, state, a, b, opts);

  return (
    <div className="space-y-8">
      <PageTitle title="المراجعات" sub="WEEKLY REVIEW لتعرف ماذا أنجزت وما الذي تبقّى، ومراجعة شهرية، والتحقق النهائي." />

      <section>
        <h2 className="mb-3 text-lg font-bold text-forest">المراجعة الشهرية</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {program.monthly.map((m) => {
            const r = stat(m.from_day, m.to_day);
            return (
              <li key={m.month_number}>
                <Link href={`/reviews/month/${m.month_number}`} className="card block p-4 hover:border-gold">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-forest">{MONTH_NAMES[m.month_number - 1]}</span>
                    {filledMonths.includes(m.month_number) ? <span className="pill !bg-forest-mist !text-forest">مكتوبة ✓</span> : <span className="pill">لم تُكتب</span>}
                  </div>
                  <p className="mt-1 text-xs text-ink-muted">اليوم {m.from_day}–{m.to_day}</p>
                  <div className="mt-3"><Bar value={r.earned} max={m.max_stars ?? r.max} tone="gold" /></div>
                  <p className="ltr mt-1 text-end text-sm text-ink-muted">{r.earned} / {m.max_stars ?? r.max} ★</p>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-forest">المراجعة الأسبوعية</h2>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {program.weekly.map((w) => {
            const r = stat(w.from_day, w.to_day);
            const current = today >= w.from_day && today <= w.to_day;
            const future = w.from_day > today;
            return (
              <li key={w.week_number}>
                <Link href={`/reviews/week/${w.week_number}`}
                  className={`block rounded-2xl border p-3 hover:border-gold ${current ? 'border-gold bg-gold-pale' : future ? 'border-line bg-white/60 text-ink-muted' : 'border-line bg-white'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-forest">الأسبوع {w.week_number}</span>
                    {filledWeeks.includes(w.week_number) && <span className="text-forest" aria-label="مكتوبة">✓</span>}
                  </div>
                  <p className="text-xs text-ink-muted">اليوم {w.from_day}–{w.to_day}</p>
                  <p className="ltr mt-1 text-end text-sm">{r.earned}/{w.max_stars ?? r.max} ★</p>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <Link href="/reviews/final" className="card flex items-center justify-between p-5 hover:border-gold">
        <span><span className="block font-bold text-forest">FINAL CHECK — التحقق النهائي</span><span className="text-sm text-ink-muted">حصيلة البرنامج كاملًا</span></span>
        <span className="ltr day-num text-2xl text-gold">132</span>
      </Link>
    </div>
  );
}
