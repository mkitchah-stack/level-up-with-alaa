'use client';
import Link from 'next/link';
import { useProgress, useStats } from '@/components/ProgressProvider';
import { TaskCard } from '@/components/TaskCard';
import { StarsBar } from '@/components/StarsBar';
import { DayHeader, Empty } from '@/components/ui';
import { Icon } from '@/components/Icon';
import * as L from '@/lib/programLogic';

/** Without `day` → today's tasks. With `day` → that day's details. */
export function DayView({ day }: { day?: number }) {
  const { program, profile } = useProgress();
  const { today, statuses, nextAhead } = useStats();
  const n = day ?? today;
  const d = program.days[n];
  if (!d) return <Empty title="هذا اليوم غير موجود" />;
  const first = program.dayNumbers[0];
  const last = program.dayNumbers[program.dayNumbers.length - 1];
  const isToday = n === today;
  const missedDay = n < today && statuses[n] !== 'done';

  return (
    <div className="space-y-4">
      {day && (
        <Link href="/days" className="inline-flex items-center gap-1 text-sm font-medium text-ink-muted hover:text-forest">
          <Icon name="chevronNext" className="h-4 w-4" /> كل الأيام
        </Link>
      )}
      <DayHeader day={n} month={d.month} date={L.dayDate(profile.program_start_date, n)} isToday={isToday} />

      {missedDay && <p className="rounded-xl bg-rose-pale px-4 py-2.5 text-sm text-rose">هذا يوم سابق لم يكتمل — مهامه ظاهرة أيضًا في قسم الاستدراك.</p>}
      {!day && statuses[n] === 'done' && (
        <div className="rounded-xl bg-forest-mist px-4 py-3 text-[15px] text-forest">
          أحسنت! أنهيت مهام اليوم 🤍 {nextAhead && <Link href={`/days/${nextAhead}`} className="font-semibold underline underline-offset-4">التقدم إلى اليوم {nextAhead}</Link>}
        </div>
      )}

      <div className="space-y-3">
        {d.tasks.map((t) => <TaskCard key={t.id} task={t} />)}
      </div>

      <StarsBar day={n} />

      <nav className="flex items-center justify-between gap-2 pt-1" aria-label="التنقل بين الأيام">
        {n > first ? (
          <Link href={`/days/${n - 1}`} className="btn-ghost btn-sm"><Icon name="chevronNext" className="h-4 w-4" /> اليوم {n - 1}</Link>
        ) : <span />}
        {n < last ? (
          <Link href={`/days/${n + 1}`} className="btn-ghost btn-sm">اليوم {n + 1} <Icon name="chevron" className="h-4 w-4" /></Link>
        ) : <span />}
      </nav>
    </div>
  );
}
