// LEVEL UP WITH ALAA — BAC 2027
// This is the SAME logic already tested in the approved prototype (level-up-app.html),
// unchanged, just made data-source-agnostic. Import it once, use it both in Supabase
// queries (server) and in the UI (client) so there is exactly one place these rules live.
//
// The only thing that changes in Phase 2 is *where the state object comes from*:
//   - Prototype:  state.checklist / state.directDone lived in React useState (browser memory)
//   - Phase 2:    state.checklist / state.directDone are built from Supabase rows
//                 (student_checklist_progress, student_task_progress) after fetching them
//                 for the signed-in student. See buildStateFromRows() below.
//
// Do not re-derive "current day", "stars", "streak", "progress" or "catch-up" anywhere
// else in the app — always call these functions.

/**
 * Build the same {checklist, directDone} shape the frontend already uses,
 * from the rows Supabase returns for one student.
 * @param {Array<{task_id:string, completed:boolean}>} taskRows - from student_task_progress
 * @param {Array<{checklist_item_id:string, completed:boolean}>} checklistRows - from student_checklist_progress
 */
function buildStateFromRows(taskRows, checklistRows){
  const directDone = {};
  taskRows.forEach(r => { if (r.completed) directDone[r.task_id] = true; });
  const checklist = {};
  checklistRows.forEach(r => { if (r.completed) checklist[r.checklist_item_id] = true; });
  return { checklist, directDone };
}

function taskId(day, taskNumber){ return `${day}-${taskNumber}`; }

function isTaskComplete(day, t, state){
  const id = taskId(day, t.task_number);
  if (t.checklist_items && t.checklist_items.length > 0){
    return t.checklist_items.every((_, i) => !!state.checklist[`${id}::${i}`]);
  }
  return !!state.directDone[id];
}

function computeDayStatus(day, allDaysData, state){
  const d = allDaysData[day];
  const done = d.tasks.filter(t => isTaskComplete(day, t, state)).length;
  if (done === 0) return 'empty';
  if (done === d.tasks.length) return 'done';
  return 'partial';
}

/** current day = first day (1..132) not yet fully complete. Unchanged rule. */
function currentDay(allDaysData, dayNumbers, state){
  for (const n of dayNumbers) if (computeDayStatus(n, allDaysData, state) !== 'done') return n;
  return 132;
}

function overallProgress(allDaysData, dayNumbers, state){
  let done = 0;
  dayNumbers.forEach(n => allDaysData[n].tasks.forEach(t => { if (isTaskComplete(n, t, state)) done++; }));
  return { done, total: 396, pct: Math.round(done/396*100) };
}

function subjectProgress(allDaysData, dayNumbers, state){
  const totals = {};
  dayNumbers.forEach(n => allDaysData[n].tasks.forEach(t => {
    if (!t.subject) return;
    totals[t.subject] = totals[t.subject] || { done:0, total:0 };
    totals[t.subject].total++;
    if (isTaskComplete(n, t, state)) totals[t.subject].done++;
  }));
  return totals;
}

function totalStars(allDaysData, dayNumbers, state){
  const p = overallProgress(allDaysData, dayNumbers, state); // 1 star per fully-completed task
  return { earned: p.done, max: p.total };
}

function streak(allDaysData, dayNumbers, state){
  let s = 0;
  for (const n of dayNumbers){
    if (computeDayStatus(n, allDaysData, state) === 'done') s++; else break;
  }
  return s;
}

function missedTasks(allDaysData, dayNumbers, state){
  const today = currentDay(allDaysData, dayNumbers, state);
  const out = [];
  dayNumbers.filter(n => n < today).forEach(n => {
    allDaysData[n].tasks.forEach(t => { if (!isTaskComplete(n, t, state)) out.push({ day:n, ...t }); });
  });
  return out;
}

module.exports = {
  buildStateFromRows, taskId, isTaskComplete, computeDayStatus,
  currentDay, overallProgress, subjectProgress, totalStars, streak, missedTasks,
};
