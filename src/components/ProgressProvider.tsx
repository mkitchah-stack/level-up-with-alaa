'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as L from '@/lib/programLogic';
import { supabaseBrowser } from '@/lib/supabase/client';
import { todayIso as clientTodayIso } from '@/lib/dates';
import type { ChecklistRow, Profile, Program, Task, TaskRow } from '@/lib/types';

type State = ReturnType<typeof L.buildStateFromRows>;

type Ctx = {
  program: Program;
  profile: Profile;
  state: State;
  opts: L.LogicOpts;
  calendarDay: number | null;
  today: number;
  saving: number;
  error: string | null;
  clearError: () => void;
  isTaskDone: (t: Task) => boolean;
  isItemDone: (t: Task, i: number) => boolean;
  toggleItem: (t: Task, i: number, value: boolean) => void;
  toggleTask: (t: Task, value: boolean) => void;
  completeTask: (t: Task) => void;
};

const ProgressContext = createContext<Ctx | null>(null);

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used inside <ProgressProvider>');
  return ctx;
}

export function ProgressProvider({
  program, profile, taskRows, checklistRows, serverTodayIso, children,
}: {
  program: Program; profile: Profile; taskRows: TaskRow[]; checklistRows: ChecklistRow[];
  serverTodayIso: string; children: React.ReactNode;
}) {
  const [state, setState] = useState<State>(() => L.buildStateFromRows(taskRows, checklistRows));
  const [todayIso, setTodayIso] = useState(serverTodayIso);
  const [saving, setSaving] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const queues = useRef(new Map<string, Promise<void>>());

  // keep "today" correct if the tab stays open past midnight (Africa/Algiers)
  useEffect(() => {
    const tick = () => setTodayIso(clientTodayIso());
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  const calendarDay = L.calendarDayFromStart(profile.program_start_date, todayIso, program.dayNumbers.length);
  const opts = useMemo<L.LogicOpts>(
    () => (calendarDay ? { calendarDay, startIso: profile.program_start_date } : undefined),
    [calendarDay, profile.program_start_date]
  );
  const today = L.currentDay(program.days, program.dayNumbers, state, opts);

  /** Writes are serialized per key so fast double-taps land in order. */
  const persist = useCallback((key: string, write: () => PromiseLike<{ error: { message: string } | null }>, rollback: () => void) => {
    setSaving((n) => n + 1);
    const prev = queues.current.get(key) ?? Promise.resolve();
    const next = prev.then(async () => {
      try {
        const { error } = await write();
        if (error) throw new Error(error.message);
      } catch (e) {
        rollback();
        setError('لم يتم حفظ التغيير. تحقق من الاتصال ثم أعد المحاولة.');
        console.error(e);
      } finally {
        setSaving((n) => n - 1);
      }
    });
    queues.current.set(key, next);
  }, []);

  const isTaskDone = useCallback((t: Task) => L.isTaskComplete(t.day_number, t, state), [state]);
  const isItemDone = useCallback((t: Task, i: number) => !!state.checklist[`${t.id}::${i}`], [state]);

  const toggleItem = useCallback((t: Task, i: number, value: boolean) => {
    const key = `${t.id}::${i}`;
    const nowIso = new Date().toISOString();
    setState((s) => {
      const checklist = { ...s.checklist }; const checklistAt = { ...s.checklistAt };
      if (value) { checklist[key] = true; checklistAt[key] = nowIso; } else { delete checklist[key]; delete checklistAt[key]; }
      return { ...s, checklist, checklistAt };
    });
    persist(key, () => supabaseBrowser()
      .from('student_checklist_progress')
      .upsert({ student_id: profile.id, checklist_item_id: key, completed: value }, { onConflict: 'student_id,checklist_item_id' }),
    () => setState((s) => {
      const checklist = { ...s.checklist };
      if (value) delete checklist[key]; else checklist[key] = true;
      return { ...s, checklist };
    }));
  }, [persist, profile.id]);

  const toggleTask = useCallback((t: Task, value: boolean) => {
    if (t.checklist_items.length > 0) {
      t.checklist_items.forEach((_, i) => {
        if (!!state.checklist[`${t.id}::${i}`] !== value) toggleItem(t, i, value);
      });
      return;
    }
    const key = t.id;
    const nowIso = new Date().toISOString();
    setState((s) => {
      const directDone = { ...s.directDone }; const directAt = { ...s.directAt };
      if (value) { directDone[key] = true; directAt[key] = nowIso; } else { delete directDone[key]; delete directAt[key]; }
      return { ...s, directDone, directAt };
    });
    persist(key, () => supabaseBrowser()
      .from('student_task_progress')
      .upsert({ student_id: profile.id, task_id: key, completed: value }, { onConflict: 'student_id,task_id' }),
    () => setState((s) => {
      const directDone = { ...s.directDone };
      if (value) delete directDone[key]; else directDone[key] = true;
      return { ...s, directDone };
    }));
  }, [persist, profile.id, state.checklist, toggleItem]);

  const completeTask = useCallback((t: Task) => toggleTask(t, true), [toggleTask]);

  // warn before closing the tab while a save is in flight
  useEffect(() => {
    if (!saving) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [saving]);

  const value: Ctx = {
    program, profile, state, opts, calendarDay, today, saving, error,
    clearError: () => setError(null), isTaskDone, isItemDone, toggleItem, toggleTask, completeTask,
  };
  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

/** Derived numbers used across Dashboard / Progress — all from programLogic. */
export function useStats() {
  const { program, state, opts, today } = useProgress();
  return useMemo(() => {
    const { days, dayNumbers } = program;
    const overall = L.overallProgress(days, dayNumbers, state);
    const stars = L.totalStars(days, dayNumbers, state);
    const chain = L.streak(days, dayNumbers, state, opts);
    const missed = L.missedTasks(days, dayNumbers, state, opts);
    const subjects = L.subjectProgress(days, dayNumbers, state);
    const statuses: Record<number, L.DayStatus> = {};
    dayNumbers.forEach((n) => { statuses[n] = L.computeDayStatus(n, days, state); });
    const completedDays = dayNumbers.filter((n) => statuses[n] === 'done').length;
    const nextAhead = L.nextIncompleteDay(days, dayNumbers, state, today);
    return { overall, stars, chain, missed, subjects, statuses, completedDays, nextAhead, today };
  }, [program, state, opts, today]);
}
