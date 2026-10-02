import { requireActiveStudent, loadProgram, loadProgressRows } from '@/lib/data';
import { ProgressProvider } from '@/components/ProgressProvider';
import { AppShell } from '@/components/AppShell';
import { todayIso } from '@/lib/dates';

export const dynamic = 'force-dynamic';

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireActiveStudent();
  const [program, rows] = await Promise.all([loadProgram(), loadProgressRows(profile.id)]);
  return (
    <ProgressProvider program={program} profile={profile} taskRows={rows.taskRows} checklistRows={rows.checklistRows} serverTodayIso={todayIso()}>
      <AppShell>{children}</AppShell>
    </ProgressProvider>
  );
}
