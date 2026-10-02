'use client';
import Link from 'next/link';
import { useProgress, useStats } from '@/components/ProgressProvider';
import { TaskCard } from '@/components/TaskCard';
import { Empty, PageTitle } from '@/components/ui';
import type { Task } from '@/lib/types';
import { daysAr, tasksAr } from '@/lib/plural';

export function CatchUp() {
  const { program, calendarDay } = useProgress();
  const { missed, today } = useStats();
  // group by day, keeping program order; re-read the full task object from the program
  const byDay = new Map<number, Task[]>();
  missed.forEach((m) => {
    const t = program.days[m.day].tasks.find((x) => x.task_number === m.task_number)!;
    byDay.set(m.day, [...(byDay.get(m.day) ?? []), t]);
  });

  return (
    <div>
      <PageTitle title="استدراك الفائت — CATCH UP"
        sub="المهام التي مرّ يومها ولم تكتمل. لا تختفي أبدًا: أنجزها وستُحتسب نجومها ويظهر اليوم مكتملًا." />
      {!calendarDay && (
        <p className="mb-4 rounded-xl bg-gold-pale px-4 py-3 text-sm text-gold-ink">لم يُحدَّد تاريخ بداية برنامجك بعد، لذلك يُحتسب اليوم الحالي كأول يوم غير مكتمل.</p>
      )}
      {missed.length === 0 ? (
        <Empty title="لا توجد مهام فائتة 🤍">أنت على المسار. <Link href="/today" className="font-semibold text-forest underline">مهام اليوم {today}</Link></Empty>
      ) : (
        <div className="space-y-6">
          <p className="text-[15px] text-ink">{tasksAr(missed.length)} من {daysAr(byDay.size)}.</p>
          {[...byDay.entries()].map(([day, tasks]) => (
            <section key={day}>
              <h2 className="mb-2 flex items-center justify-between text-[15px] font-bold text-forest">
                <span>اليوم {day}</span>
                <Link href={`/days/${day}`} className="text-sm font-medium text-ink-muted underline underline-offset-4">فتح اليوم</Link>
              </h2>
              <div className="space-y-3">{tasks.map((t) => <TaskCard key={t.id} task={t} />)}</div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
