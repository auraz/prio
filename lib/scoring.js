// Scoring functions and consensus engine, extracted for testability.

export const CONS_MAP = { 'незворотні': 3, 'зворотні': 2, 'ніякі': 1 };
export const DEAD_MAP = { 'сьогодні': 3, 'цей тиждень': 2, 'пізніше': 1 };
export const IMP_MAP = { 'life-changing': 3, 'meaningful': 2, 'nice-to-have': 1 };
export const SCOPE_MAP = { 'affects many areas': 3, 'affects one area': 2, 'isolated': 1 };

export const scoreConsequences = (t) => (CONS_MAP[t.consequences] || 1) * (DEAD_MAP[t.deadline] || 1);
export const scoreImportance = (t) => (IMP_MAP[t.importance] || 2) * (SCOPE_MAP[t.impactScope] || 2);
export const scoreEnergy = (t, energy) => 4 - Math.abs((t.energyRequired || 2) - energy);

export function getFrameworkPicks(tasks, energyLevel) {
  if (tasks.length === 0) return { picks: {}, consensus: false, conflict: false, topTaskId: null };
  const rank = (scoreFn) => [...tasks].sort((a, b) => { const d = scoreFn(b) - scoreFn(a); return d !== 0 ? d : (a.createdAt || a.id) - (b.createdAt || b.id); })[0];
  const c = rank((t) => scoreConsequences(t));
  const i = rank((t) => scoreImportance(t));
  const e = rank((t) => scoreEnergy(t, energyLevel));
  const picks = {
    consequences: { taskId: c.id, title: c.title, score: scoreConsequences(c) },
    importance: { taskId: i.id, title: i.title, score: scoreImportance(i) },
    energy: { taskId: e.id, title: e.title, score: scoreEnergy(e, energyLevel) },
  };
  const ids = [c.id, i.id, e.id];
  const counts = {};
  ids.forEach(id => { counts[id] = (counts[id] || 0) + 1; });
  const maxCount = Math.max(...Object.values(counts));
  const topTaskId = maxCount >= 2 ? Number(Object.entries(counts).find(([, v]) => v >= 2)[0]) : null;
  return { picks, consensus: maxCount >= 2, conflict: maxCount < 2, topTaskId };
}
