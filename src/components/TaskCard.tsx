'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/Icon';
import { useProgress } from '@/components/ProgressProvider';
import { subjectLabel, subjectColor } from '@/lib/subjects';
import { embedUrl, safeHttpsUrl, thumbnailFor } from '@/lib/media';
import type { Task } from '@/lib/types';

function Check({ checked }: { checked: boolean }) {
  return (
    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${checked ? 'border-forest bg-forest text-white' : 'border-line bg-white'}`}>
      {checked && <Icon name="check" className="h-4 w-4" />}
    </span>
  );
}

export function VideoBlock({ task }: { task: Task }) {
  const [open, setOpen] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);
  const url = safeHttpsUrl(task.video_url);
  const embed = embedUrl(task.video_url);
  const thumb = thumbnailFor(task.video_url, task.thumbnail_url);
  if (!task.has_video && !url) return null;
  if (!url) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-gold/70 px-3 py-1.5 text-xs font-semibold text-gold-ink/70">
        <Icon name="play" className="h-3.5 w-3.5" /> VIDEO · سيُضاف الرابط قريبًا
      </span>
    );
  }
  if (!embed) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-gold px-3 py-1.5 text-xs font-semibold text-gold-ink hover:bg-gold-pale">
        <Icon name="play" className="h-3.5 w-3.5" /> VIDEO — فتح الفيديو
      </a>
    );
  }
  return open ? (
    <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
      <iframe src={embed} title={task.title} className="h-full w-full" loading="lazy"
        allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin" />
    </div>
  ) : (
    <button onClick={() => setOpen(true)} className="group relative flex w-full items-center gap-3 overflow-hidden rounded-xl border border-dashed border-gold bg-gold-pale/50 p-2 text-start hover:bg-gold-pale">
      {thumb && !thumbFailed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumb} alt="" className="h-16 w-28 shrink-0 rounded-lg object-cover" loading="lazy" onError={() => setThumbFailed(true)} />
      ) : (
        <span className="flex h-16 w-28 shrink-0 items-center justify-center rounded-lg bg-forest text-gold"><Icon name="play" className="h-7 w-7" filled /></span>
      )}
      <span className="text-sm font-semibold text-gold-ink">▶ VIDEO — مشاهدة الفيديو</span>
    </button>
  );
}

export function ResourceLinks({ task }: { task: Task }) {
  const items = task.resources.map((r) => ({ ...r, url: safeHttpsUrl(r.url) })).filter((r) => r.url);
  if (!items.length) return null;
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((r, i) => (
        <li key={i}>
          <a href={r.url!} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 text-xs font-medium text-forest hover:bg-sand">
            <Icon name="link" className="h-3.5 w-3.5" /> {r.title || 'مصدر'}
          </a>
        </li>
      ))}
    </ul>
  );
}

export function TaskCard({ task, compact = false, showDay = false }: { task: Task; compact?: boolean; showDay?: boolean }) {
  const { isTaskDone, isItemDone, toggleItem, toggleTask } = useProgress();
  const done = isTaskDone(task);
  const memo = task.subject === 'memorization';
  const hasChecklist = task.checklist_items.length > 0;

  return (
    <article className={`rounded-card border p-4 sm:p-5 transition-colors ${done ? 'border-forest/40 bg-forest-mist/50' : memo ? 'border-line bg-sand' : 'border-line bg-white shadow-card'}`}>
      <header className="flex flex-wrap items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: subjectColor(task.subject) }} aria-hidden />
        <h3 className="text-[15px] font-bold text-forest">
          المهمة <span className="ltr">{String(task.task_number).padStart(2, '0')}</span> — {subjectLabel(task.subject, task.subject_label_ar)}
        </h3>
        {task.task_type && <span className="pill">{task.task_type}</span>}
        {showDay && <Link href={`/days/${task.day_number}`} className="pill !bg-white border border-line">اليوم {task.day_number}</Link>}
        {done && <span className="ms-auto inline-flex items-center gap-1 text-sm font-semibold text-forest"><Icon name="star" filled className="h-4 w-4 text-gold" /> مكتملة</span>}
      </header>

      <p className="mt-2 text-[17px] font-semibold leading-relaxed text-ink">{task.title}</p>
      {task.description && !compact && <p className="mt-1 text-[15px] text-ink-muted">{task.description}</p>}

      {!compact && (task.has_video || task.video_url || task.resources.length > 0) && (
        <div className="mt-3 space-y-2"><VideoBlock task={task} /><ResourceLinks task={task} /></div>
      )}

      {hasChecklist ? (
        <ul className="mt-3 space-y-1">
          {task.checklist_items.map((text, i) => {
            const on = isItemDone(task, i);
            return (
              <li key={i}>
                <button type="button" role="checkbox" aria-checked={on} onClick={() => toggleItem(task, i, !on)}
                  className="flex w-full items-center gap-3 rounded-lg px-1 py-2 text-start hover:bg-black/[0.03]" style={{ minHeight: 44 }}>
                  <Check checked={on} />
                  <span className={`text-[15px] ${on ? 'text-ink-muted line-through decoration-forest/40' : 'text-ink'}`}>{text}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {!done ? (
          <button type="button" className="btn-primary btn-sm" onClick={() => toggleTask(task, true)}>
            <Icon name="check" className="h-4 w-4" /> {hasChecklist ? 'إكمال كل الخطوات' : 'تم الإنجاز'}
          </button>
        ) : (
          <button type="button" className="btn-ghost btn-sm" onClick={() => toggleTask(task, false)}>تراجع عن الإكمال</button>
        )}
      </div>
    </article>
  );
}
