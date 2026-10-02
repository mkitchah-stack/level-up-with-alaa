'use client';
import Link from 'next/link';
import { useProgress, useStats } from '@/components/ProgressProvider';
import { Bar, PageTitle, Stat } from '@/components/ui';
import { SUBJECT_ORDER, subjectLabel, subjectColor, MONTH_NAMES } from '@/lib/subjects';
import * as L from '@/lib/programLogic';

export function ProgressView() {
  const { program, state, opts } = useProgress();
  const s = useStats();
  const subjects = SUBJECT_ORDER.filter((k) => s.subjects[k]).concat(Object.keys(s.subjects).filter((k) => !SUBJECT_ORDER.includes(k)));

  return (
    <div className="space-y-5">
      <PageTitle title="التقدم" sub="تتحدّث الأرقام فور إنجاز أي مهمة." />

      <section className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <p className="font-bold text-forest">التقدم العام</p>
          <p className="ltr day-num text-5xl text-forest">{s.overall.pct}%</p>
        </div>
        <div className="mt-3"><Bar value={s.overall.done} max={s.overall.total} /></div>
        <p className="mt-2 text-sm text-ink-muted">{s.overall.done} مهمة مكتملة من {s.overall.total}</p>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Stat icon="today" label="الأيام المكتملة" value={<span className="ltr">{s.completedDays}</span>} sub="من 132" />
        <Stat icon="check" label="المهام المكتملة" value={<span className="ltr">{s.overall.done}</span>} sub={`من ${s.overall.total}`} />
        <Stat icon="more" label="المهام المتبقية" value={<span className="ltr">{s.overall.total - s.overall.done}</span>} />
        <Stat icon="star" label="النجوم" value={<span className="ltr">{s.stars.earned}</span>} sub={`من ${s.stars.max}`} />
        <Stat icon="flame" label="سلسلة الإنجاز" value={<span className="ltr">{s.chain}</span>} sub="أيام متتالية مكتملة" />
        <Link href="/catch-up" className="block"><Stat icon="rewind" label="المهام الفائتة" value={<span className="ltr">{s.missed.length}</span>} sub="افتح الاستدراك ←" /></Link>
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="font-bold text-forest">التقدم حسب المادة</h2>
        <ul className="mt-4 space-y-4">
          {subjects.map((k) => {
            const v = s.subjects[k];
            return (
              <li key={k}>
                <div className="mb-1.5 flex items-center justify-between text-[15px]">
                  <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: subjectColor(k) }} />{subjectLabel(k)}</span>
                  <span className="ltr text-sm text-ink-muted">{v.done}/{v.total}</span>
                </div>
                <Bar value={v.done} max={v.total} />
              </li>
            );
          })}
        </ul>
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="font-bold text-forest">التقدم حسب الشهر</h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {program.monthly.map((m) => {
            const r = L.rangeStats(program.days, program.dayNumbers, state, m.from_day, m.to_day, opts);
            return (
              <li key={m.month_number} className="rounded-xl bg-sand p-4">
                <div className="flex items-center justify-between text-[15px]"><span className="font-semibold text-forest">{MONTH_NAMES[m.month_number - 1]}</span><span className="ltr text-sm">{r.earned}/{r.max} ★</span></div>
                <div className="mt-2"><Bar value={r.earned} max={r.max} tone="gold" /></div>
                <p className="mt-1 text-xs text-ink-muted">اليوم {m.from_day}–{m.to_day} · {r.daysDone} أيام مكتملة</p>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
