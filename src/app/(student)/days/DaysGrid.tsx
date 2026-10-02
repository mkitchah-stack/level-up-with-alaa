'use client';
import Link from 'next/link';
import { useProgress, useStats } from '@/components/ProgressProvider';
import { PageTitle } from '@/components/ui';
import { MONTH_NAMES } from '@/lib/subjects';
import * as L from '@/lib/programLogic';

const LEGEND = [
  { c: 'bg-white border-line', t: 'لم يبدأ' },
  { c: 'bg-gold-pale border-gold', t: 'قيد الإنجاز' },
  { c: 'bg-forest border-forest', t: 'مكتمل' },
  { c: 'bg-rose-pale border-rose/50', t: 'فائت' },
];
const STATUS_AR = { empty: 'لم يبدأ', partial: 'قيد الإنجاز', done: 'مكتمل' } as const;

export function DaysGrid() {
  const { program, state } = useProgress();
  const { statuses, today, completedDays } = useStats();
  const months = Array.from(new Set(program.dayNumbers.map((n) => program.days[n].month)));

  return (
    <div>
      <PageTitle title="132 يومًا" sub={`أكملت ${completedDays} يومًا من 132. اضغط على أي يوم لفتح مهامه.`} />
      <ul className="mb-6 flex flex-wrap gap-x-4 gap-y-2 text-sm text-ink-muted">
        {LEGEND.map((l) => <li key={l.t} className="flex items-center gap-1.5"><span className={`h-4 w-4 rounded border ${l.c}`} />{l.t}</li>)}
        <li className="flex items-center gap-1.5"><span className="h-4 w-4 rounded border border-line ring-2 ring-gold" />اليوم الحالي</li>
      </ul>
      <div className="space-y-8">
        {months.map((m) => {
          const days = program.dayNumbers.filter((n) => program.days[n].month === m);
          const done = days.filter((n) => statuses[n] === 'done').length;
          return (
            <section key={m} aria-labelledby={`m${m}`}>
              <div className="mb-3 flex items-baseline justify-between">
                <h2 id={`m${m}`} className="text-lg font-bold text-forest">{MONTH_NAMES[m - 1]}</h2>
                <span className="text-sm text-ink-muted">اليوم {days[0]}–{days[days.length - 1]} · {done}/{days.length}</span>
              </div>
              <ol className="grid grid-cols-5 gap-2 sm:grid-cols-7 md:grid-cols-9 lg:grid-cols-11">
                {days.map((n) => {
                  const st = statuses[n];
                  const missed = n < today && st !== 'done';
                  const cnt = L.dayDoneCount(n, program.days, state);
                  const cls = st === 'done' ? 'bg-forest border-forest text-white'
                    : missed ? 'bg-rose-pale border-rose/50 text-rose'
                    : st === 'partial' ? 'bg-gold-pale border-gold text-gold-ink'
                    : 'bg-white border-line text-ink';
                  return (
                    <li key={n}>
                      <Link href={`/days/${n}`} aria-label={`اليوم ${n}: ${missed ? 'فائت' : STATUS_AR[st]}، ${cnt} من 3`}
                        className={`flex aspect-square flex-col items-center justify-center rounded-xl border text-center transition-transform hover:-translate-y-0.5 ${cls} ${n === today ? 'ring-2 ring-gold ring-offset-2 ring-offset-cream' : ''}`}>
                        <span className="day-num text-lg leading-none sm:text-xl">{n}</span>
                        <span className="mt-1 text-[10px] leading-none opacity-80">{'★'.repeat(cnt)}{'☆'.repeat(Math.max(0, program.days[n].tasks.length - cnt))}</span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}
      </div>
    </div>
  );
}
