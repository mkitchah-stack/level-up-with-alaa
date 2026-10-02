import { getSession } from '@/lib/data';
import { ReviewsIndex } from './ReviewsIndex';

export const metadata = { title: 'المراجعات' };

export default async function Page() {
  const { supabase, user } = await getSession();
  const [w, m] = await Promise.all([
    supabase.from('weekly_review_responses').select('week_number').eq('student_id', user!.id),
    supabase.from('monthly_review_responses').select('month_number').eq('student_id', user!.id),
  ]);
  return <ReviewsIndex filledWeeks={(w.data ?? []).map((r) => r.week_number)} filledMonths={(m.data ?? []).map((r) => r.month_number)} />;
}
