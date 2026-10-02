import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import type { ChecklistRow, Day, FinalMetric, MonthlyReview, Profile, Program, Resource, Task, TaskRow, WeeklyReview } from '@/lib/types';

/** Current user + profile (cached per request). */
export const getSession = cache(async () => {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, profile: null as Profile | null };
  const { data: profile } = await supabase
    .from('profiles')
    .select('id,name,email,role,account_status,program_start_date,created_at')
    .eq('id', user.id)
    .maybeSingle<Profile>();
  return { supabase, user, profile: profile ?? null };
});

/** Guards: these are UX redirects. The real enforcement is RLS in the database. */
export async function requireActiveStudent() {
  const s = await getSession();
  if (!s.user) redirect('/login');
  if (!s.profile) redirect('/pending');
  if (s.profile.role !== 'admin' && s.profile.account_status !== 'active') redirect('/pending');
  return s as typeof s & { profile: Profile };
}

export async function requireAdmin() {
  const s = await getSession();
  if (!s.user) redirect('/login?next=/admin');
  if (!s.profile || s.profile.role !== 'admin') redirect('/dashboard');
  return s as typeof s & { profile: Profile };
}

type TaskDbRow = Omit<Task, 'checklist_items' | 'resources'> & { resources: unknown };

/** Loads the full 132-day program from Supabase (RLS: active students + admins only). */
export async function loadProgram(): Promise<Program> {
  const { supabase } = await getSession();
  const [daysRes, tasksRes, itemsRes, weeklyRes, monthlyRes, finalRes] = await Promise.all([
    supabase.from('program_days').select('day_number,month').order('day_number').range(0, 999),
    supabase
      .from('program_tasks')
      .select('id,day_number,task_number,subject,subject_label_ar,task_type,title,description,has_video,video_url,thumbnail_url,resources')
      .order('day_number').order('task_number').range(0, 1999),
    supabase.from('program_checklist_items').select('id,task_id,item_index,text').order('task_id').order('item_index').range(0, 2999),
    supabase.from('weekly_reviews').select('*').order('week_number'),
    supabase.from('monthly_reviews').select('*').order('month_number'),
    supabase.from('final_check_metrics').select('*'),
  ]);
  const err = daysRes.error || tasksRes.error || itemsRes.error || weeklyRes.error || monthlyRes.error || finalRes.error;
  if (err) throw new Error(`Could not load program: ${err.message}`);

  const items = new Map<string, { idx: number; text: string }[]>();
  (itemsRes.data ?? []).forEach((r) => {
    const list = items.get(r.task_id) ?? [];
    list.push({ idx: r.item_index, text: r.text });
    items.set(r.task_id, list);
  });

  const days: Record<number, Day> = {};
  (daysRes.data ?? []).forEach((d) => { days[d.day_number] = { day: d.day_number, month: d.month, tasks: [] }; });
  ((tasksRes.data ?? []) as TaskDbRow[]).forEach((t) => {
    const list = (items.get(t.id) ?? []).sort((a, b) => a.idx - b.idx);
    const resources: Resource[] = Array.isArray(t.resources)
      ? (t.resources as Resource[]).filter((r) => r && typeof r.url === 'string')
      : [];
    days[t.day_number]?.tasks.push({ ...t, resources, checklist_items: list.map((i) => i.text) });
  });
  Object.values(days).forEach((d) => d.tasks.sort((a, b) => a.task_number - b.task_number));

  return {
    days,
    dayNumbers: Object.keys(days).map(Number).sort((a, b) => a - b),
    weekly: (weeklyRes.data ?? []) as WeeklyReview[],
    monthly: (monthlyRes.data ?? []) as MonthlyReview[],
    finalCheck: (finalRes.data ?? []) as FinalMetric[],
  };
}

/** Progress rows of ONE student. Always filtered by id (admins can read everyone's rows). */
export async function loadProgressRows(studentId: string) {
  const { supabase } = await getSession();
  const [t, c] = await Promise.all([
    supabase.from('student_task_progress').select('task_id,completed,completed_at').eq('student_id', studentId).range(0, 1999),
    supabase.from('student_checklist_progress').select('checklist_item_id,completed,completed_at').eq('student_id', studentId).range(0, 2999),
  ]);
  if (t.error || c.error) throw new Error(`Could not load progress: ${(t.error || c.error)!.message}`);
  return { taskRows: (t.data ?? []) as TaskRow[], checklistRows: (c.data ?? []) as ChecklistRow[] };
}

export async function loadSettings() {
  const { supabase } = await getSession();
  const { data } = await supabase.from('app_settings').select('key,value');
  const map: Record<string, unknown> = {};
  (data ?? []).forEach((r) => { map[r.key] = r.value; });
  return {
    price: typeof map.subscription_price === 'number' ? (map.subscription_price as number) : null,
    currency: typeof map.currency === 'string' ? (map.currency as string) : 'DZD',
    instructions: typeof map.payment_instructions === 'string' ? (map.payment_instructions as string) : '',
    contact: typeof map.contact === 'string' ? (map.contact as string) : '',
  };
}
