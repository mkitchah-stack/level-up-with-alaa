import { notFound } from 'next/navigation';
import { getSession } from '@/lib/data';
import { ReviewEditor } from '@/components/ReviewEditor';

export default async function Page({ params }: { params: Promise<{ n: string }> }) {
  const n = Number((await params).n);
  if (!Number.isInteger(n) || n < 1 || n > 4) notFound();
  const { supabase, user } = await getSession();
  const { data } = await supabase.from('monthly_review_responses')
    .select('goal,biggest_achievement,improve_next_month,updated_at').eq('student_id', user!.id).eq('month_number', n).maybeSingle();
  return <ReviewEditor kind="month" number={n} initial={data ?? null} />;
}
