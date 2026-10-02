import Link from 'next/link';
import { Icon } from '@/components/Icon';
import { pad3, formatArDate } from '@/lib/dates';
import { MONTH_NAMES } from '@/lib/subjects';

export function PageTitle({ title, sub, back }: { title: string; sub?: React.ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="mb-5">
      {back && (
        <Link href={back.href} className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-ink-muted hover:text-forest">
          <Icon name="chevronNext" className="h-4 w-4" /> {back.label}
        </Link>
      )}
      <h1 className="text-2xl font-bold text-forest sm:text-[28px]">{title}</h1>
      {sub && <p className="mt-1 text-[15px] text-ink-muted">{sub}</p>}
    </div>
  );
}

export function DayHeader({ day, month, date, isToday }: { day: number; month: number; date?: string | null; isToday?: boolean }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-sm text-ink-muted">{MONTH_NAMES[month - 1]} · اليوم {day} من 132{isToday ? ' · اليوم الحالي' : ''}</p>
        <h1 className="ltr day-num text-[44px] leading-none text-forest sm:text-[56px]">DAY {pad3(day)}</h1>
      </div>
      {date && <p className="rounded-full border border-line bg-white px-3 py-1 text-sm text-ink-muted">📅 {formatArDate(date)}</p>}
    </div>
  );
}

export function Bar({ value, max, tone = 'forest' }: { value: number; max: number; tone?: 'forest' | 'gold' | 'rose' }) {
  const pct = max ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const color = tone === 'gold' ? 'bg-gold' : tone === 'rose' ? 'bg-rose' : 'bg-forest';
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-sand" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full ${color} transition-[width] duration-500`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Stars({ earned, max, className = 'h-5 w-5' }: { earned: number; max: number; className?: string }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${earned} من ${max} نجوم`}>
      {Array.from({ length: max }).map((_, i) => (
        <Icon key={i} name="star" filled={i < earned} className={`${className} ${i < earned ? 'text-gold' : 'text-line'}`} />
      ))}
    </span>
  );
}

export function Stat({ label, value, sub, icon }: { label: string; value: React.ReactNode; sub?: React.ReactNode; icon?: string }) {
  return (
    <div className="card p-4">
      <p className="flex items-center gap-1.5 text-sm text-ink-muted">{icon && <Icon name={icon} className="h-4 w-4 text-gold" />}{label}</p>
      <p className="mt-1 day-num text-3xl text-forest">{value}</p>
      {sub && <div className="text-xs text-ink-muted">{sub}</div>}
    </div>
  );
}

export function Empty({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="card-sand p-8 text-center">
      <p className="font-bold text-forest">{title}</p>
      {children && <div className="mt-2 text-[15px] text-ink-muted">{children}</div>}
    </div>
  );
}
