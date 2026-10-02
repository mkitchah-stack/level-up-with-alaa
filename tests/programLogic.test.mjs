// Run: node tests/programLogic.test.mjs
// 1) v2 without opts must equal the original v1 logic on 2,000 random states.
// 2) The original prototype scenario.  3) Calendar / catch-up / streak / reviews.
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import * as L from '../src/lib/programLogic.js';
const require = createRequire(import.meta.url);
const V1 = require('./programLogic.v1.cjs');
const json = require('../supabase/level-up-132-days-schema.json');

const allDaysData = {};
Object.values(json.days).forEach((d) => { allDaysData[d.day] = { tasks: d.tasks }; });
const dayNumbers = Object.keys(allDaysData).map(Number).sort((a, b) => a - b);
let pass = 0; const ok = (m) => { pass++; console.log('PASS ', m); };

assert.equal(dayNumbers.length, 132); assert.equal(dayNumbers[0], 1); assert.equal(dayNumbers[131], 132);
ok('132 days, ordered 1..132');

function completeDay(state, n) {
  allDaysData[n].tasks.forEach((t) => {
    const id = `${n}-${t.task_number}`;
    if (t.checklist_items.length) t.checklist_items.forEach((_, i) => { state.checklist[`${id}::${i}`] = true; });
    else state.directDone[id] = true;
  });
}
const empty = () => ({ checklist: {}, directDone: {} });

// 1) equivalence with v1
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
for (let k = 0; k < 2000; k++) {
  const s = empty(); const upto = Math.floor(rnd() * 133); const density = rnd();
  dayNumbers.forEach((n) => {
    if (n <= upto) completeDay(s, n);
    else allDaysData[n].tasks.forEach((t) => {
      const id = `${n}-${t.task_number}`;
      if (t.checklist_items.length) t.checklist_items.forEach((_, i) => { if (rnd() < density * 0.3) s.checklist[`${id}::${i}`] = true; });
      else if (rnd() < density * 0.3) s.directDone[id] = true;
    });
  });
  for (const fn of ['currentDay', 'overallProgress', 'subjectProgress', 'totalStars', 'streak', 'missedTasks'])
    assert.deepEqual(L[fn](allDaysData, dayNumbers, s), V1[fn](allDaysData, dayNumbers, s), fn);
}
ok('v2 (no opts) === v1 on 2000 random states, all 6 functions');

// 2) original prototype scenario
{ const s = empty(); completeDay(s, 1);
  assert.equal(L.currentDay(allDaysData, dayNumbers, s), 2);
  assert.equal(L.streak(allDaysData, dayNumbers, s), 1);
  assert.equal(L.totalStars(allDaysData, dayNumbers, s).earned, 3);
  assert.equal(L.missedTasks(allDaysData, dayNumbers, s).length, 0);
  assert.equal(L.overallProgress(allDaysData, dayNumbers, s).total, 396);
  ok('prototype scenario: Day1 done -> day 2, streak 1, 3 stars, 0 missed, total 396'); }

// v1 bug demonstration: catch-up structurally empty
{ const s = empty(); completeDay(s, 1); completeDay(s, 3); /* day 2 skipped */
  assert.equal(V1.missedTasks(allDaysData, dayNumbers, s).length, 0);
  ok('v1 bug reproduced: day 2 skipped but v1 catch-up = 0'); }

// 3) calendar mode
{ const s = empty(); completeDay(s, 1); completeDay(s, 3); completeDay(s, 4);
  const o = { calendarDay: 5 };
  assert.equal(L.currentDay(allDaysData, dayNumbers, s, o), 5);
  const m = L.missedTasks(allDaysData, dayNumbers, s, o);
  assert.equal(m.length, 3); assert.ok(m.every((t) => t.day === 2));
  assert.equal(L.streak(allDaysData, dayNumbers, s, o), 2); // days 3,4 (today 5 still open)
  completeDay(s, 5); assert.equal(L.streak(allDaysData, dayNumbers, s, o), 3);
  completeDay(s, 2); assert.equal(L.streak(allDaysData, dayNumbers, s, o), 5);
  assert.equal(L.missedTasks(allDaysData, dayNumbers, s, o).length, 0);
  ok('calendar mode: catch-up lists day 2, streak breaks/recovers correctly'); }

{ const s = empty(); // nothing done, day 10
  assert.equal(L.missedTasks(allDaysData, dayNumbers, s, { calendarDay: 10 }).length, 27);
  assert.equal(L.streak(allDaysData, dayNumbers, s, { calendarDay: 10 }), 0);
  assert.equal(L.currentDay(allDaysData, dayNumbers, s, { calendarDay: 500 }), 132);
  assert.equal(L.currentDay(allDaysData, dayNumbers, s, { calendarDay: -3 }), 1);
  ok('calendar mode: 9 missed days = 27 tasks; clamping 1..132'); }

{ // checklist partially done -> not complete
  const s = empty(); s.checklist['1-2::0'] = true;
  assert.equal(L.isTaskComplete(1, allDaysData[1].tasks[1], s), false);
  s.checklist['1-2::1'] = true; assert.equal(L.isTaskComplete(1, allDaysData[1].tasks[1], s), true);
  assert.equal(L.computeDayStatus(1, allDaysData, s), 'partial');
  ok('checklist task completes only when all items are ticked'); }

// calendar helpers
assert.equal(L.calendarDayFromStart('2026-10-01', '2026-10-01'), 1);
assert.equal(L.calendarDayFromStart('2026-10-01', '2026-10-31'), 31);
assert.equal(L.calendarDayFromStart('2026-10-01', '2027-06-01'), 132);
assert.equal(L.calendarDayFromStart('2026-10-01', '2026-09-20'), 1);
assert.equal(L.calendarDayFromStart(null, '2026-10-01'), null);
assert.equal(L.dayDate('2026-10-01', 1), '2026-10-01');
assert.equal(L.dayDate('2026-12-30', 3), '2027-01-01');
assert.equal(L.isoDateInZone(new Date('2026-10-01T23:30:00Z'), 'Africa/Algiers'), '2026-10-02');
ok('calendar helpers + Africa/Algiers midnight boundary');

// reviews
{ const rows = { t: [], c: [] };
  // day 1 on time (2026-10-01), day 2 completed late (2026-10-05), day 3 untouched; today = day 6
  const at = (d) => `${d}T10:00:00Z`;
  const add = (n, when) => allDaysData[n].tasks.forEach((t) => {
    const id = `${n}-${t.task_number}`;
    if (t.checklist_items.length) t.checklist_items.forEach((_, i) => rows.c.push({ checklist_item_id: `${id}::${i}`, completed: true, completed_at: at(when) }));
    else rows.t.push({ task_id: id, completed: true, completed_at: at(when) });
  });
  add(1, '2026-10-01'); add(2, '2026-10-05');
  const s = L.buildStateFromRows(rows.t, rows.c);
  const r = L.rangeStats(allDaysData, dayNumbers, s, 1, 7, { calendarDay: 6, startIso: '2026-10-01' });
  assert.deepEqual([r.earned, r.max, r.missed, r.recovered, r.daysDone, r.pct], [6, 21, 9, 3, 2, 29]);
  const w = json.weekly_reviews; assert.equal(w.length, 19);
  assert.equal(w.reduce((a, x) => a + x.max_stars, 0), 396);
  const mo = L.rangeStats(allDaysData, dayNumbers, L.buildStateFromRows([], []), 1, 33, {});
  assert.equal(mo.max, json.monthly_reviews[0].max_stars);
  ok('rangeStats: earned 6/21, missed 9, recovered 3; weekly max_stars sum = 396; month max 99'); }

console.log(`\nALL ${pass} LOGIC TESTS PASSED`);
