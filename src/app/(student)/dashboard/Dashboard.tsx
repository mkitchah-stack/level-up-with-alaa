'use client';
import Link from 'next/link';
import { useProgress, useStats } from '@/components/ProgressProvider';
import { Icon } from '@/components/Icon';
import { Bar, Stars, Stat } from '@/components/ui';
import { subjectLabel } from '@/lib/subjects';
import { pad3, formatArDate } from '@/lib/dates';
import * as L from '@/lib/programLogic';
import { daysAr, tasksAr } from '@/lib/plural';

export function Dashboard() {
  const { program, profile, state, calendarDay, isTaskDone } = useProgress();
  const s = useStats();
  const day = program.days[s.today];
  const doneToday = L.dayDoneCount(s.today, program.days, state);
  const week = program.weekly.find((w) => s.today >= w.from_day && s.today <= w.to_day);
  const firstName = profile.name.split(' ')[0];

  return (
    <div className="space-y-5">
      <p className="text-ink-muted">أهلًا {firstName} 🤍</p>

      {/* today hero */}
      <section className="overflow-hidden rounded-card bg-forest text-white">
        <div className="flex flex-wrap items-end justify-between gap-4 p-5 sm:p-7">
          <div>
            <p className="text-sm text-white/70">
              {calendarDay ? 'يومك الحالي في البرنامج' : 'اليوم التالي في البرنامج'}
              {calendarDay && profile.program_start_date ? ` · ${formatArDate(L.dayDate(profile.program_start_date, s.today))}` : ''}
            </p>
            <p className="ltr day-num mt-1 text-[56px] leading-none sm:text-[72px]">DAY {pad3(s.today)}</p>
            <div className="mt-3 flex items-center gap-3">
              <Stars earned={doneToday} max={day.tasks.length} className="h-6 w-6" />
              <span className="text-sm text-white/80">{doneToday} من {day.tasks.length} مهام</span>
            </div>
          </div>
          <Link href="/today" className="btn-gold">{doneToday === day.tasks.length ? 'مراجعة مهام اليوم' : 'ابدأ مهام اليوم'}</Link>
        </div>
        <ul className="grid divide-y divide-white/10 border-t border-white/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:divide-x-reverse">
          {day.tasks.map((t) => (
            <li key={t.id} className="flex items-start gap-3 p-4">
              <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${isTaskDone(t) ? 'border-gold bg-gold text-forest-deep' : 'border-white/30'}`}>
                {isTaskDone(t) && <Icon name="check" className="h-4 w-4" />}
              </span>
              <div className="min-w-0">
                <p className="text-xs text-gold">{subjectLabel(t.subject, t.subject_label_ar)}</p>
                <p className="line-clamp-2 text-sm text-white/90">{t.title}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {doneToday === day.tasks.length && s.nextAhead && (
        <div className="card-sand flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-[15px] text-forest">أنهيت مهام اليوم ✓ هل تريد التقدم؟</p>
          <Link href={`/days/${s.nextAhead}`} className="btn-ghost btn-sm">اليوم {s.nextAhead}</Link>
        </div>
      )}

      {/* catch-up */}
      {s.missed.length > 0 && (
        <section className="rounded-card border border-rose/30 bg-rose-pale p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 font-bold text-rose"><Icon name="rewind" /> استدراك الفائت</p>
              <p className="text-[15px] text-ink">متأخر: {tasksAr(s.missed.length)} من {daysAr(new Set(s.missed.map((m) => m.day)).size)}. لا تقلق، أنجزها على مهل.</p>
            </div>
            <Link href="/catch-up" className="btn-danger btn-sm">فتح الاستدراك</Link>
          </div>
        </section>
      )}

      {/* stats */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat icon="chart" label="التقدم العام" value={<span className="ltr">{s.overall.pct}%</span>} sub={<Bar value={s.overall.done} max={s.overall.total} />} />
        <Stat icon="star" label="النجوم" value={<span className="ltr">{s.stars.earned}</span>} sub={`من ${s.stars.max}`} />
        <Stat icon="flame" label="سلسلة الإنجاز" value={<span className="ltr">{s.chain}</span>} sub={s.chain === 1 ? 'يوم متتالٍ' : 'أيام متتالية'} />
        <Stat icon="today" label="الأيام المكتملة" value={<span className="ltr">{s.completedDays}</span>} sub="من 132" />
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <div className="card p-5">
          <p className="font-bold text-forest">المهام المتبقية</p>
          <p className="mt-1 day-num text-4xl text-forest ltr">{s.overall.total - s.overall.done}</p>
          <p className="text-sm text-ink-muted">من أصل {s.overall.total} مهمة في البرنامج</p>
          <Link href="/progress" className="mt-3 inline-block text-sm font-semibold text-forest underline underline-offset-4">تفاصيل التقدم</Link>
        </div>
        <Link href="/days" className="card group block p-5 hover:border-gold">
          <p className="font-bold text-forest">132 يومًا</p>
          <div className="mt-3 grid grid-cols-[repeat(22,minmax(0,1fr))] gap-[3px]" aria-hidden>
            {program.dayNumbers.map((n) => (
              <span key={n} className={`aspect-square rounded-[3px] ${s.statuses[n] === 'done' ? 'bg-forest' : s.statuses[n] === 'partial' ? 'bg-gold' : n < s.today ? 'bg-rose/40' : 'bg-sand'} ${n === s.today ? 'ring-2 ring-gold ring-offset-1' : ''}`} />
            ))}
          </div>
          <p className="mt-3 text-sm font-semibold text-forest group-hover:underline">عرض كل الأيام</p>
        </Link>
      </section>

      {week && (
        <Link href={`/reviews/week/${week.week_number}`} className="card flex items-center justify-between gap-3 p-4 hover:border-gold">
          <span className="flex items-center gap-2 text-[15px] text-forest"><Icon name="pen" className="h-5 w-5 text-gold" /> المراجعة الأسبوعية — الأسبوع {week.week_number}</span>
          <Icon name="chevron" className="h-5 w-5 text-ink-muted" />
        </Link>
      )}
    </div>
  );
}
