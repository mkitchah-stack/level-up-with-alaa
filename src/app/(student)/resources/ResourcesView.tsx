'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useProgress } from '@/components/ProgressProvider';
import { ResourceLinks, VideoBlock } from '@/components/TaskCard';
import { Empty, PageTitle } from '@/components/ui';
import { SUBJECT_ORDER, subjectLabel } from '@/lib/subjects';
import { safeHttpsUrl } from '@/lib/media';

export function ResourcesView() {
  const { program } = useProgress();
  const [subject, setSubject] = useState<string>('all');
  const [kind, setKind] = useState<'all' | 'video' | 'files'>('all');

  const all = useMemo(() => program.dayNumbers.flatMap((n) => program.days[n].tasks), [program]);
  const withMedia = all.filter((t) => safeHttpsUrl(t.video_url) || t.resources.length > 0);
  const pendingVideos = all.filter((t) => t.has_video && !safeHttpsUrl(t.video_url)).length;
  const list = withMedia.filter((t) =>
    (subject === 'all' || t.subject === subject) &&
    (kind === 'all' || (kind === 'video' ? !!safeHttpsUrl(t.video_url) : t.resources.length > 0)));

  return (
    <div>
      <PageTitle title="المصادر والفيديوهات" sub="كل الفيديوهات والملفات المرتبطة بمهام البرنامج، مرتبة حسب اليوم." />
      <div className="mb-5 flex flex-wrap gap-2">
        <select aria-label="المادة" className="input !w-auto" value={subject} onChange={(e) => setSubject(e.target.value)}>
          <option value="all">كل المواد</option>
          {SUBJECT_ORDER.map((k) => <option key={k} value={k}>{subjectLabel(k)}</option>)}
        </select>
        <select aria-label="النوع" className="input !w-auto" value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}>
          <option value="all">الكل</option><option value="video">فيديوهات</option><option value="files">ملفات وروابط</option>
        </select>
      </div>

      {list.length === 0 ? (
        <Empty title="لا توجد مصادر منشورة بعد">
          {pendingVideos > 0 ? `${pendingVideos} مهمة فيها فيديو سيُضاف رابطه قريبًا من طرف الإدارة.` : 'جرّب مادة أو نوعًا آخر.'}
        </Empty>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {list.map((t) => (
            <li key={t.id} className="card space-y-2 p-4">
              <div className="flex items-center justify-between gap-2 text-xs text-ink-muted">
                <span>{subjectLabel(t.subject, t.subject_label_ar)}</span>
                <Link href={`/days/${t.day_number}`} className="pill">اليوم {t.day_number}</Link>
              </div>
              <p className="font-semibold text-ink">{t.title}</p>
              <VideoBlock task={t} />
              <ResourceLinks task={t} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
