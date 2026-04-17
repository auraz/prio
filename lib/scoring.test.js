// Tests for scoring functions and consensus engine.
import { describe, it, expect } from 'vitest';
import { scoreConsequences, scoreImportance, scoreEnergy, getFrameworkPicks } from './scoring.js';

const task = (overrides) => ({ id: 1, title: 'Test', consequences: 'зворотні', deadline: 'цей тиждень', importance: 'meaningful', impactScope: 'affects one area', energyRequired: 2, createdAt: 1, ...overrides });

describe('scoreConsequences', () => {
  it('max score: irreversible + today', () => expect(scoreConsequences(task({ consequences: 'незворотні', deadline: 'сьогодні' }))).toBe(9));
  it('min score: none + later', () => expect(scoreConsequences(task({ consequences: 'ніякі', deadline: 'пізніше' }))).toBe(1));
  it('mid score: reversible + week', () => expect(scoreConsequences(task({ consequences: 'зворотні', deadline: 'цей тиждень' }))).toBe(4));
  it('defaults for missing fields', () => expect(scoreConsequences({})).toBe(1));
});

describe('scoreImportance', () => {
  it('max: life-changing + many areas', () => expect(scoreImportance(task({ importance: 'life-changing', impactScope: 'affects many areas' }))).toBe(9));
  it('min: nice-to-have + isolated', () => expect(scoreImportance(task({ importance: 'nice-to-have', impactScope: 'isolated' }))).toBe(1));
  it('defaults for legacy task', () => expect(scoreImportance({})).toBe(4));
});

describe('scoreEnergy', () => {
  it('perfect match high', () => expect(scoreEnergy(task({ energyRequired: 3 }), 3)).toBe(4));
  it('perfect match low', () => expect(scoreEnergy(task({ energyRequired: 1 }), 1)).toBe(4));
  it('one step off', () => expect(scoreEnergy(task({ energyRequired: 3 }), 2)).toBe(3));
  it('two steps off', () => expect(scoreEnergy(task({ energyRequired: 3 }), 1)).toBe(2));
  it('defaults for missing energyRequired', () => expect(scoreEnergy({}, 2)).toBe(4));
});

describe('getFrameworkPicks', () => {
  it('empty tasks', () => {
    const r = getFrameworkPicks([], 2);
    expect(r.consensus).toBe(false);
    expect(r.conflict).toBe(false);
    expect(r.topTaskId).toBeNull();
  });

  it('single task: trivial consensus', () => {
    const r = getFrameworkPicks([task()], 2);
    expect(r.consensus).toBe(true);
    expect(r.conflict).toBe(false);
    expect(r.topTaskId).toBe(1);
  });

  it('consensus: 2 frameworks agree', () => {
    const a = task({ id: 1, createdAt: 1, consequences: 'незворотні', deadline: 'сьогодні', importance: 'life-changing', impactScope: 'affects many areas', energyRequired: 2 });
    const b = task({ id: 2, createdAt: 2, consequences: 'ніякі', deadline: 'пізніше', importance: 'nice-to-have', impactScope: 'isolated', energyRequired: 3 });
    const r = getFrameworkPicks([a, b], 2);
    expect(r.consensus).toBe(true);
    expect(r.topTaskId).toBe(1);
  });

  it('conflict: all 3 disagree', () => {
    const a = task({ id: 1, createdAt: 1, consequences: 'незворотні', deadline: 'сьогодні', importance: 'nice-to-have', impactScope: 'isolated', energyRequired: 1 });
    const b = task({ id: 2, createdAt: 2, consequences: 'ніякі', deadline: 'пізніше', importance: 'life-changing', impactScope: 'affects many areas', energyRequired: 1 });
    const c = task({ id: 3, createdAt: 3, consequences: 'ніякі', deadline: 'пізніше', importance: 'nice-to-have', impactScope: 'isolated', energyRequired: 3 });
    const r = getFrameworkPicks([a, b, c], 3);
    expect(r.conflict).toBe(true);
    expect(r.topTaskId).toBeNull();
    expect(r.picks.consequences.taskId).toBe(1);
    expect(r.picks.importance.taskId).toBe(2);
    expect(r.picks.energy.taskId).toBe(3);
  });

  it('tie-break by createdAt (oldest first)', () => {
    const a = task({ id: 1, createdAt: 100, consequences: 'незворотні', deadline: 'сьогодні' });
    const b = task({ id: 2, createdAt: 50, consequences: 'незворотні', deadline: 'сьогодні' });
    const r = getFrameworkPicks([a, b], 2);
    expect(r.picks.consequences.taskId).toBe(2);
  });
});
