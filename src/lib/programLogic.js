// LEVEL UP WITH ALAA — BAC 2027
// Single source of truth for checklist / stars / progress / سلسلة الإنجاز /
// current day / catch-up.  Used by every page — never re-derive these elsewhere.
//
// ORIGIN: the logic tested in the approved prototype (level-up-app.html),
// delivered as programLogic.js in the Phase-2 handoff.
//
// WHAT CHANGED (v2) — and why
// ---------------------------------------------------------------------------
// 1. BUG FIX — Catch-up could never contain anything.
//    v1: currentDay = first day that is not fully done, and
//        missedTasks = unfinished tasks in days BEFORE currentDay.
//    Every day before "the first unfinished day" is finished by definition,
//    so missedTasks() always returned [] — for every possible student.
//    Likewise streak() was just currentDay-1, so it never "broke".
//
//    v2 adds an OPTIONAL last argument `opts = { calendarDay }`.
//    calendarDay = which program day it is today for this student
//    (program_start_date → today, Africa/Algiers).  When it is given:
//      currentDay  = calendarDay (clamped 1..132)
//      missedTasks = unfinished tasks in days before calendarDay   (real catch-up)
//      streak      = consecutive fully-done days ending today (or yesterday,
//                    if today is still in progress — today can't break it yet)
//    When `opts` is omitted, every function behaves EXACTLY like v1
//    (verified by tests/programLogic.test.js, including the original
//    Day-1 scenario: current day 2, streak 1, 3 stars, 0 missed).
//
// 2. overallProgress().total is counted from the data instead of the literal
//    396 (same value for the approved program: 132 × 3 = 396).
//
// 3. NEW helpers (additive): calendarDayFromStart, buildStateFromRows also
//    collects completion dates, rangeStats (weekly/monthly reviews),
//    dayDoneCount, nextIncompleteDay, dayDate.
// ---------------------------------------------------------------------------

/**
 * Build the {checklist, directDone, completedAt} state from Supabase rows.
 * @param {Array<{task_id:string, completed:boolean, completed_at?:string|null}>} taskRows
 * @param {Array<{checklist_item_id:string, completed:boolean, completed_at?:string|null}>} checklistRows
 */
function buildStateFromRows(taskRows, checklistRows) {
  const directDone = {};
  const directAt = {};
  taskRows.forEach((r) => {
    if (r.completed) {
      directDone[r.task_id] = true;
      if (r.completed_at) directAt[r.task_id] = r.completed_at;
    }
  });
  const checklist = {};
  const checklistAt = {};
  checklistRows.forEach((r) => {
    if (r.completed) {
      checklist[r.checklist_item_id] = true;
      if (r.completed_at) checklistAt[r.checklist_item_id] = r.completed_at;
    }
  });
  return { checklist, directDone, directAt, checklistAt };
}

function taskId(day, taskNumber) {
  return `${day}-${taskNumber}`;
}

function isTaskComplete(day, t, state) {
  const id = taskId(day, t.task_number);
  if (t.checklist_items && t.checklist_items.length > 0) {
    return t.checklist_items.every((_, i) => !!state.checklist[`${id}::${i}`]);
  }
  return !!state.directDone[id];
}

/** ISO timestamp when the task became complete (latest item), or null. */
function taskCompletedAt(day, t, state) {
  if (!isTaskComplete(day, t, state)) return null;
  const id = taskId(day, t.task_number);
  if (t.checklist_items && t.checklist_items.length > 0) {
    let latest = null;
    t.checklist_items.forEach((_, i) => {
      const at = state.checklistAt && state.checklistAt[`${id}::${i}`];
      if (at && (!latest || at > latest)) latest = at;
    });
    return latest;
  }
  return (state.directAt && state.directAt[id]) || null;
}

function computeDayStatus(day, allDaysData, state) {
  const d = allDaysData[day];
  const done = d.tasks.filter((t) => isTaskComplete(day, t, state)).length;
  if (done === 0) return 'empty';
  if (done === d.tasks.length) return 'done';
  return 'partial';
}

function dayDoneCount(day, allDaysData, state) {
  return allDaysData[day].tasks.filter((t) => isTaskComplete(day, t, state)).length;
}

function clampDay(n, dayNumbers) {
  const last = dayNumbers[dayNumbers.length - 1];
  return Math.max(dayNumbers[0], Math.min(last, n));
}

/**
 * v1 rule (no opts): first day (1..132) not yet fully complete.
 * v2 (opts.calendarDay): the student's calendar day.
 */
function currentDay(allDaysData, dayNumbers, state, opts) {
  if (opts && typeof opts.calendarDay === 'number') return clampDay(opts.calendarDay, dayNumbers);
  for (const n of dayNumbers) if (computeDayStatus(n, allDaysData, state) !== 'done') return n;
  return 132;
}

/** first not-fully-done day strictly after `from` (for "work ahead"), or null */
function nextIncompleteDay(allDaysData, dayNumbers, state, from) {
  for (const n of dayNumbers) if (n > from && computeDayStatus(n, allDaysData, state) !== 'done') return n;
  return null;
}

function overallProgress(allDaysData, dayNumbers, state) {
  let done = 0;
  let total = 0;
  dayNumbers.forEach((n) =>
    allDaysData[n].tasks.forEach((t) => {
      total++;
      if (isTaskComplete(n, t, state)) done++;
    })
  );
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

function subjectProgress(allDaysData, dayNumbers, state) {
  const totals = {};
  dayNumbers.forEach((n) =>
    allDaysData[n].tasks.forEach((t) => {
      if (!t.subject) return;
      totals[t.subject] = totals[t.subject] || { done: 0, total: 0 };
      totals[t.subject].total++;
      if (isTaskComplete(n, t, state)) totals[t.subject].done++;
    })
  );
  return totals;
}

function totalStars(allDaysData, dayNumbers, state) {
  const p = overallProgress(allDaysData, dayNumbers, state); // 1 star per fully-completed task
  return { earned: p.done, max: p.total };
}

function streak(allDaysData, dayNumbers, state, opts) {
  if (opts && typeof opts.calendarDay === 'number') {
    const today = clampDay(opts.calendarDay, dayNumbers);
    let n = computeDayStatus(today, allDaysData, state) === 'done' ? today : today - 1;
    let s = 0;
    while (n >= dayNumbers[0] && allDaysData[n] && computeDayStatus(n, allDaysData, state) === 'done') {
      s++;
      n--;
    }
    return s;
  }
  let s = 0;
  for (const n of dayNumbers) {
    if (computeDayStatus(n, allDaysData, state) === 'done') s++;
    else break;
  }
  return s;
}

function missedTasks(allDaysData, dayNumbers, state, opts) {
  const today = currentDay(allDaysData, dayNumbers, state, opts);
  const out = [];
  dayNumbers
    .filter((n) => n < today)
    .forEach((n) => {
      allDaysData[n].tasks.forEach((t) => {
        if (!isTaskComplete(n, t, state)) out.push({ day: n, ...t });
      });
    });
  return out;
}

// ---------------------------------------------------------------------------
// Calendar helpers (Africa/Algiers)
// ---------------------------------------------------------------------------

/** 'YYYY-MM-DD' for an instant, in the given IANA time zone */
function isoDateInZone(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timeZone || 'Africa/Algiers', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const get = (k) => parts.find((p) => p.type === k).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

function daysBetweenIso(aIso, bIso) {
  const a = Date.UTC(+aIso.slice(0, 4), +aIso.slice(5, 7) - 1, +aIso.slice(8, 10));
  const b = Date.UTC(+bIso.slice(0, 4), +bIso.slice(5, 7) - 1, +bIso.slice(8, 10));
  return Math.round((b - a) / 86400000);
}

/**
 * Program day for a student: start date = day 1.  Returns null when the
 * student has no start date (then the v1 rule is used).  Before the start
 * date it returns 1; it never exceeds 132.
 */
function calendarDayFromStart(startIso, todayIso, totalDays) {
  if (!startIso) return null;
  const n = daysBetweenIso(startIso, todayIso) + 1;
  return Math.max(1, Math.min(totalDays || 132, n));
}

/** calendar date (YYYY-MM-DD) on which program day `day` falls */
function dayDate(startIso, day) {
  if (!startIso) return null;
  const d = new Date(Date.UTC(+startIso.slice(0, 4), +startIso.slice(5, 7) - 1, +startIso.slice(8, 10)));
  d.setUTCDate(d.getUTCDate() + (day - 1));
  return d.toISOString().slice(0, 10);
}

/**
 * Stats for a day range — used by Weekly / Monthly reviews.
 * earned    = completed tasks (stars) in range
 * missed    = unfinished tasks of days already passed (day < currentDay)
 * recovered = tasks finished AFTER their scheduled date (needs startIso)
 */
function rangeStats(allDaysData, dayNumbers, state, fromDay, toDay, opts) {
  const today = currentDay(allDaysData, dayNumbers, state, opts);
  const startIso = opts && opts.startIso;
  const tz = (opts && opts.timeZone) || 'Africa/Algiers';
  let earned = 0, max = 0, missed = 0, recovered = 0, daysDone = 0;
  const subjects = {};
  dayNumbers.filter((n) => n >= fromDay && n <= toDay).forEach((n) => {
    if (computeDayStatus(n, allDaysData, state) === 'done') daysDone++;
    allDaysData[n].tasks.forEach((t) => {
      max++;
      const done = isTaskComplete(n, t, state);
      if (t.subject) {
        subjects[t.subject] = subjects[t.subject] || { done: 0, total: 0 };
        subjects[t.subject].total++;
        if (done) subjects[t.subject].done++;
      }
      if (done) {
        earned++;
        const at = taskCompletedAt(n, t, state);
        if (startIso && at && isoDateInZone(new Date(at), tz) > dayDate(startIso, n)) recovered++;
      } else if (n < today) {
        missed++;
      }
    });
  });
  return { earned, max, missed, recovered, daysDone, pct: max ? Math.round((earned / max) * 100) : 0, subjects };
}

export {
  buildStateFromRows, taskId, isTaskComplete, taskCompletedAt, computeDayStatus, dayDoneCount,
  currentDay, nextIncompleteDay, overallProgress, subjectProgress, totalStars, streak, missedTasks,
  isoDateInZone, calendarDayFromStart, dayDate, rangeStats,
};
