export type LogicTask = { task_number: number; subject: string | null; checklist_items: string[] };
export type AllDaysData = Record<number, { tasks: LogicTask[] }>;
export type LogicState = {
  checklist: Record<string, boolean>;
  directDone: Record<string, boolean>;
  directAt?: Record<string, string>;
  checklistAt?: Record<string, string>;
};
export type LogicOpts = { calendarDay?: number; startIso?: string | null; timeZone?: string } | undefined;
export type DayStatus = 'empty' | 'partial' | 'done';
export type SubjectTotals = Record<string, { done: number; total: number }>;
export type RangeStats = {
  earned: number; max: number; missed: number; recovered: number; daysDone: number; pct: number;
  subjects: SubjectTotals;
};

export function buildStateFromRows(
  taskRows: Array<{ task_id: string; completed: boolean; completed_at?: string | null }>,
  checklistRows: Array<{ checklist_item_id: string; completed: boolean; completed_at?: string | null }>
): Required<LogicState>;
export function taskId(day: number, taskNumber: number): string;
export function isTaskComplete(day: number, t: LogicTask, state: LogicState): boolean;
export function taskCompletedAt(day: number, t: LogicTask, state: LogicState): string | null;
export function computeDayStatus(day: number, all: AllDaysData, state: LogicState): DayStatus;
export function dayDoneCount(day: number, all: AllDaysData, state: LogicState): number;
export function currentDay(all: AllDaysData, dayNumbers: number[], state: LogicState, opts?: LogicOpts): number;
export function nextIncompleteDay(all: AllDaysData, dayNumbers: number[], state: LogicState, from: number): number | null;
export function overallProgress(all: AllDaysData, dayNumbers: number[], state: LogicState): { done: number; total: number; pct: number };
export function subjectProgress(all: AllDaysData, dayNumbers: number[], state: LogicState): SubjectTotals;
export function totalStars(all: AllDaysData, dayNumbers: number[], state: LogicState): { earned: number; max: number };
export function streak(all: AllDaysData, dayNumbers: number[], state: LogicState, opts?: LogicOpts): number;
export function missedTasks<T extends LogicTask>(all: Record<number, { tasks: T[] }>, dayNumbers: number[], state: LogicState, opts?: LogicOpts): Array<T & { day: number }>;
export function isoDateInZone(date: Date, timeZone?: string): string;
export function calendarDayFromStart(startIso: string | null | undefined, todayIso: string, totalDays?: number): number | null;
export function dayDate(startIso: string | null | undefined, day: number): string | null;
export function rangeStats(all: AllDaysData, dayNumbers: number[], state: LogicState, fromDay: number, toDay: number, opts?: LogicOpts): RangeStats;
