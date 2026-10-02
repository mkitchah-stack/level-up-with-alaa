import Link from 'next/link';
import { getSession } from '@/lib/data';
import { TaskEditor, type EditableTask } from './TaskEditor';

export const metadata = { title: 'المحتوى' };

export default async function ContentPage({ searchParams }: { searchParams: Promise<{ day?: string; filter?: string }> }) {
  const sp = await searchParams;
  const day = Math.min(132, Math.max(1, Number(sp.day) || 1));
  const { supabase } = await getSession();
  const [{ data: tasks, error }, { data: items }, { data: missing }] = await Promise.all([
    supabase.from('program_tasks')
      .select('id,day_number,task_number,subject,subject_label_ar,task_type,title,description,has_video,video_url,thumbnail_url,resources')
      .eq('day_number', day).order('task_number'),
    supabase.from('program_checklist_items').select('id,task_id,item_index,text').like('id', `${day}-%`).order('item_index'),
    supabase.from('program_tasks').select('day_number').eq('has_video', true).is('video_url', null).order('day_number').range(0, 999),
  ]);
  if (error) return <p className="text-rose">{error.message}</p>;
  const missingDays = Array.from(new Set((missing ?? []).map((m) => m.day_number)));
  const editable: EditableTask[] = (tasks ?? []).map((t) => ({
    ...t,
    resources: Array.isArray(t.resources) ? t.resources : [],
    items: (items ?? []).filter((i) => i.task_id === t.id).sort((a, b) => a.item_index - b.item_index),
  }));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-forest">المحتوى والفيديوهات</h1>
          <p className="text-sm text-ink-muted">عدّل مهام اليوم {day}. التغييرات تظهر للطلاب عند فتح الصفحة التالية.</p>
        </div>
        <form className="flex items-center gap-2" action="/admin/content">
          <label htmlFor="day" className="text-sm text-ink-muted">اليوم</label>
          <input id="day" name="day" type="number" min={1} max={132} defaultValue={day} className="input !w-24" />
          <button className="btn-ghost btn-sm">فتح</button>
        </form>
      </div>
      <div className="flex items-center justify-between">
        {day > 1 ? <Link className="btn-ghost btn-sm" href={`/admin/content?day=${day - 1}`}>→ اليوم {day - 1}</Link> : <span />}
        {day < 132 ? <Link className="btn-ghost btn-sm" href={`/admin/content?day=${day + 1}`}>اليوم {day + 1} ←</Link> : <span />}
      </div>
      {missingDays.length > 0 && (
        <details className="card-sand p-4 text-sm">
          <summary className="cursor-pointer font-semibold text-forest">أيام فيها فيديو بدون رابط ({(missing ?? []).length} مهمة في {missingDays.length} يوم)</summary>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {missingDays.map((d) => <Link key={d} href={`/admin/content?day=${d}`} className={`pill ${d === day ? '!bg-forest !text-white' : '!bg-white border border-line'}`}>{d}</Link>)}
          </div>
        </details>
      )}
      <div className="space-y-4">{editable.map((t) => <TaskEditor key={t.id} task={t} />)}</div>
    </div>
  );
}
