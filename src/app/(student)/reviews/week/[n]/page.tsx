import { notFound } from 'next/navigation';
import { getSession } from '@/lib/data';
import { ReviewEditor } from '@/components/ReviewEditor';

export default async function Page({ params }: { params: Promise<{ n: string }> }) {
  const n = Number((await params).n);
  if (!Number.isInteger(n) || n < 1 || n > 19) notFound();
  const { supabase, user } = await getSession();
  const { data } = await supabase.from('weekly_review_responses')
    .select('goal,what_accomplished,what_to_improve,updated_at').eq('student_id', user!.id).eq('week_number', n).maybeSingle();
  return <ReviewEditor kind="week" number={n} initial={data ?? null} />;
}
