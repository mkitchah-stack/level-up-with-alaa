'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';
import { Icon } from '@/components/Icon';
import { subjectLabel } from '@/lib/subjects';
import { safeHttpsUrl, embedUrl } from '@/lib/media';
import type { Resource } from '@/lib/types';

export type EditableTask = {
  id: string; day_number: number; task_number: number; subject: string | null; subject_label_ar: string | null;
  task_type: string | null; title: string; description: string | null; has_video: boolean;
  video_url: string | null; thumbnail_url: string | null; resources: Resource[];
  items: { id: string; item_index: number; text: string }[];
};

export function TaskEditor({ task }: { task: EditableTask }) {
  const router = useRouter();
  const [t, setT] = useState(task);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const set = <K extends keyof EditableTask>(k: K, v: EditableTask[K]) => setT((x) => ({ ...x, [k]: v }));

  async function save() {
    setMsg(null);
    const video = t.video_url?.trim() || null;
    const thumb = t.thumbnail_url?.trim() || null;
    if (video && !safeHttpsUrl(video)) return setMsg({ ok: false, text: 'رابط الفيديو يجب أن يبدأ بـ https://' });
    if (thumb && !safeHttpsUrl(thumb)) return setMsg({ ok: false, text: 'رابط الصورة يجب أن يبدأ بـ https://' });
    const resources = t.resources.map((r) => ({ title: r.title.trim().slice(0, 120), url: r.url.trim() })).filter((r) => r.url);
    if (resources.some((r) => !safeHttpsUrl(r.url))) return setMsg({ ok: false, text: 'كل روابط المصادر يجب أن تبدأ بـ https://' });
    if (!t.title.trim()) return setMsg({ ok: false, text: 'العنوان مطلوب.' });

    setBusy(true);
    const sb = supabaseBrowser();
    const { error } = await sb.from('program_tasks').update({
      title: t.title.trim(), description: t.description?.trim() || null, task_type: t.task_type?.trim() || null,
      has_video: t.has_video || !!video, video_url: video, thumbnail_url: thumb, resources,
    }).eq('id', t.id);
    let itemErr = null;
    for (const it of t.items) {
      const orig = task.items.find((o) => o.id === it.id);
      if (orig && orig.text !== it.text && it.text.trim()) {
        const r = await sb.from('program_checklist_items').update({ text: it.text.trim() }).eq('id', it.id);
        if (r.error) itemErr = r.error;
      }
    }
    setBusy(false);
    const e = error || itemErr;
    setMsg(e ? { ok: false, text: e.message } : { ok: true, text: 'تم الحفظ.' });
    if (!e) router.refresh();
  }

  return (
    <section className="card space-y-4 p-5">
      <header className="flex flex-wrap items-center gap-2">
        <h2 className="font-bold text-forest">المهمة {t.task_number} — {subjectLabel(t.subject, t.subject_label_ar)}</h2>
        <span className="pill ltr">{t.id}</span>
      </header>
      <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
        <div><label className="label" htmlFor={`ti-${t.id}`}>العنوان</label>
          <input id={`ti-${t.id}`} className="input" value={t.title} onChange={(e) => set('title', e.target.value)} /></div>
        <div><label className="label" htmlFor={`ty-${t.id}`}>نوع المهمة</label>
          <input id={`ty-${t.id}`} className="input" value={t.task_type ?? ''} onChange={(e) => set('task_type', e.target.value)} /></div>
      </div>
      <div><label className="label" htmlFor={`de-${t.id}`}>الوصف</label>
        <textarea id={`de-${t.id}`} rows={2} className="input" value={t.description ?? ''} onChange={(e) => set('description', e.target.value)} /></div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor={`v-${t.id}`}>رابط الفيديو (YouTube / Vimeo / Drive)</label>
          <input id={`v-${t.id}`} dir="ltr" className="input text-left" placeholder="https://youtu.be/…" value={t.video_url ?? ''} onChange={(e) => set('video_url', e.target.value)} />
          {t.video_url && (embedUrl(t.video_url) ? <p className="mt-1 text-xs text-forest">✓ سيُعرض داخل المنصة</p> : safeHttpsUrl(t.video_url) ? <p className="mt-1 text-xs text-gold-ink">سيُفتح كرابط خارجي</p> : null)}
        </div>
        <div>
          <label className="label" htmlFor={`th-${t.id}`}>صورة مصغّرة (اختياري)</label>
          <input id={`th-${t.id}`} dir="ltr" className="input text-left" placeholder="https://…" value={t.thumbnail_url ?? ''} onChange={(e) => set('thumbnail_url', e.target.value)} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={t.has_video} onChange={(e) => set('has_video', e.target.checked)} /> هذه المهمة فيها فيديو</label>

      <div>
        <p className="label">المصادر</p>
        <ul className="space-y-2">
          {t.resources.map((r, i) => (
            <li key={i} className="flex flex-wrap gap-2">
              <input className="input flex-1 !min-w-[140px]" placeholder="العنوان (مثال: ملخص PDF)" value={r.title}
                onChange={(e) => set('resources', t.resources.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
              <input dir="ltr" className="input flex-[2] !min-w-[200px] text-left" placeholder="https://…" value={r.url}
                onChange={(e) => set('resources', t.resources.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
              <button type="button" aria-label="حذف المصدر" className="btn-danger btn-sm" onClick={() => set('resources', t.resources.filter((_, j) => j !== i))}><Icon name="trash" className="h-4 w-4" /></button>
            </li>
          ))}
        </ul>
        <button type="button" className="btn-ghost btn-sm mt-2" onClick={() => set('resources', [...t.resources, { title: '', url: '' }])}><Icon name="plus" className="h-4 w-4" /> إضافة مصدر</button>
      </div>

      {t.items.length > 0 && (
        <div>
          <p className="label">خطوات المهمة (Checklist)</p>
          <p className="mb-2 text-xs text-ink-muted">يمكن تعديل النص فقط. إضافة أو حذف خطوات يغيّر حساب الإنجاز للطلاب الحاليين، لذلك يتم عبر SQL بعد مراجعة.</p>
          <ul className="space-y-2">
            {t.items.map((it, i) => (
              <li key={it.id}><input className="input" value={it.text} aria-label={`الخطوة ${i + 1}`}
                onChange={(e) => set('items', t.items.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} /></li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="btn-primary" disabled={busy} onClick={save}>{busy ? 'جارٍ الحفظ…' : 'حفظ المهمة'}</button>
        {msg && <span role="status" className={`text-sm ${msg.ok ? 'text-forest' : 'text-rose'}`}>{msg.text}</span>}
      </div>
    </section>
  );
}
