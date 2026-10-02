'use client';
import Link from 'next/link';
import { Icon } from '@/components/Icon';
import { useProgress, useStats } from '@/components/ProgressProvider';
import * as L from '@/lib/programLogic';

/** The dark bar at the bottom of every planner day page: نجومي اليوم / المفقودة / CATCH UP */
export function StarsBar({ day }: { day: number }) {
  const { program, state } = useProgress();
  const { missed } = useStats();
  const earned = L.dayDoneCount(day, program.days, state);
  const max = program.days[day].tasks.length;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-forest px-4 py-3 text-sm text-white">
      <span className="flex items-center gap-1.5"><Icon name="star" filled className="h-4 w-4 text-gold" /> نجومي اليوم: <b className="ltr text-gold">{earned} / {max}</b></span>
      <span>⚠️ المفقودة: <b className="ltr">{missed.length}</b></span>
      <Link href="/catch-up" className="ltr inline-flex items-center gap-1 font-semibold text-gold underline-offset-4 hover:underline">
        <Icon name="rewind" className="h-4 w-4" /> CATCH UP
      </Link>
    </div>
  );
}
