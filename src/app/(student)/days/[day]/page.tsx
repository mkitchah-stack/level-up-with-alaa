import { notFound } from 'next/navigation';
import { DayView } from '@/components/DayView';

export default async function Page({ params }: { params: Promise<{ day: string }> }) {
  const { day } = await params;
  const n = Number(day);
  if (!Number.isInteger(n) || n < 1 || n > 132) notFound();
  return <DayView day={n} />;
}
