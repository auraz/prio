// @vitest-environment jsdom
// UI tests for success path: render, add, consensus, conflict, lock, delete.
import React from 'react';
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

afterEach(cleanup);
import { EnergyToggle, HeroBanner, MorningRetro, DailyClose, PriorityMatrix } from './components.jsx';

const task = (overrides) => ({ id: 1, title: 'Test', consequences: 'зворотні', deadline: 'цей тиждень', importance: 'meaningful', impactScope: 'affects one area', energyRequired: 2, sphere: 'робота', createdAt: 1, ...overrides });

describe('EnergyToggle', () => {
  it('renders three levels', () => {
    render(<EnergyToggle level={2} onChange={() => {}} />);
    expect(screen.getByText('Висока')).toBeTruthy();
    expect(screen.getByText('Середня')).toBeTruthy();
    expect(screen.getByText('Низька')).toBeTruthy();
  });

  it('calls onChange on click', () => {
    const onChange = vi.fn();
    render(<EnergyToggle level={2} onChange={onChange} />);
    fireEvent.click(screen.getByText('Висока'));
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('marks active level as bold', () => {
    render(<EnergyToggle level={1} onChange={() => {}} />);
    expect(screen.getByText('Низька').style.fontWeight).toBe('700');
    expect(screen.getByText('Висока').style.fontWeight).toBe('400');
  });
});

describe('HeroBanner', () => {
  it('returns null for empty tasks', () => {
    const { container } = render(<HeroBanner tasks={[]} locked={null} frameworkResult={{ picks: {}, consensus: false, conflict: false, topTaskId: null }} onLock={() => {}} onUnlock={() => {}} />);
    expect(container.innerHTML).toBe('');
  });

  it('shows consensus banner with task title', () => {
    const tasks = [task()];
    const fr = { picks: { consequences: { taskId: 1, title: 'Test', score: 4 }, importance: { taskId: 1, title: 'Test', score: 4 }, energy: { taskId: 1, title: 'Test', score: 4 } }, consensus: true, conflict: false, topTaskId: 1 };
    render(<HeroBanner tasks={tasks} locked={null} frameworkResult={fr} onLock={() => {}} onUnlock={() => {}} />);
    expect(screen.getByText(/Згода/)).toBeTruthy();
    expect(screen.getByText(/«Test»/)).toBeTruthy();
    expect(screen.getByText('3/3')).toBeTruthy();
  });

  it('shows conflict banner with 3 picks', () => {
    const tasks = [task({ id: 1, title: 'A' }), task({ id: 2, title: 'B' }), task({ id: 3, title: 'C' })];
    const fr = { picks: { consequences: { taskId: 1, title: 'A', score: 9 }, importance: { taskId: 2, title: 'B', score: 6 }, energy: { taskId: 3, title: 'C', score: 4 } }, consensus: false, conflict: true, topTaskId: null };
    render(<HeroBanner tasks={tasks} locked={null} frameworkResult={fr} onLock={() => {}} onUnlock={() => {}} />);
    expect(screen.getByText(/Конфлікт/)).toBeTruthy();
    expect(screen.getByText(/«A»/)).toBeTruthy();
    expect(screen.getByText(/«B»/)).toBeTruthy();
    expect(screen.getByText(/«C»/)).toBeTruthy();
  });

  it('shows locked banner', () => {
    const tasks = [task()];
    const fr = { picks: {}, consensus: false, conflict: false, topTaskId: null };
    render(<HeroBanner tasks={tasks} locked={{ taskId: 1, date: '2026-04-17' }} frameworkResult={fr} onLock={() => {}} onUnlock={() => {}} />);
    expect(screen.getByText(/Фокус на сьогодні/)).toBeTruthy();
    expect(screen.getByText(/«Test»/)).toBeTruthy();
  });

  it('calls onLock on consensus click', () => {
    const onLock = vi.fn();
    const tasks = [task()];
    const fr = { picks: { consequences: { taskId: 1, title: 'Test', score: 4 }, importance: { taskId: 1, title: 'Test', score: 4 }, energy: { taskId: 1, title: 'Test', score: 4 } }, consensus: true, conflict: false, topTaskId: 1 };
    render(<HeroBanner tasks={tasks} locked={null} frameworkResult={fr} onLock={onLock} onUnlock={() => {}} />);
    fireEvent.click(screen.getByText(/«Test»/));
    expect(onLock).toHaveBeenCalledWith(1);
  });

  it('calls onUnlock on locked click', () => {
    const onUnlock = vi.fn();
    const tasks = [task()];
    const fr = { picks: {}, consensus: false, conflict: false, topTaskId: null };
    render(<HeroBanner tasks={tasks} locked={{ taskId: 1, date: '2026-04-17' }} frameworkResult={fr} onLock={() => {}} onUnlock={onUnlock} />);
    fireEvent.click(screen.getByText(/«Test»/));
    expect(onUnlock).toHaveBeenCalled();
  });

  it('calls onLock on conflict pick click', () => {
    const onLock = vi.fn();
    const tasks = [task({ id: 1, title: 'A' }), task({ id: 2, title: 'B' }), task({ id: 3, title: 'C' })];
    const fr = { picks: { consequences: { taskId: 1, title: 'A', score: 9 }, importance: { taskId: 2, title: 'B', score: 6 }, energy: { taskId: 3, title: 'C', score: 4 } }, consensus: false, conflict: true, topTaskId: null };
    render(<HeroBanner tasks={tasks} locked={null} frameworkResult={fr} onLock={onLock} onUnlock={() => {}} />);
    fireEvent.click(screen.getByText(/«B»/));
    expect(onLock).toHaveBeenCalledWith(2);
  });
});

describe('MorningRetro', () => {
  it('returns null without yesterday entry', () => {
    const { container } = render(<MorningRetro yesterdayEntry={null} onAnswer={() => {}} />);
    expect(container.innerHTML).toBe('');
  });

  it('returns null if already answered', () => {
    const { container } = render(<MorningRetro yesterdayEntry={{ lockedTaskTitle: 'X', retrospective: 'right' }} onAnswer={() => {}} />);
    expect(container.innerHTML).toBe('');
  });

  it('shows yesterday task and answer buttons', () => {
    render(<MorningRetro yesterdayEntry={{ lockedTaskTitle: 'Do taxes' }} onAnswer={() => {}} />);
    expect(screen.getByText(/«Do taxes»/)).toBeTruthy();
    expect(screen.getByText('Так')).toBeTruthy();
    expect(screen.getByText('Ні')).toBeTruthy();
    expect(screen.getByText('Не ясно')).toBeTruthy();
  });

  it('calls onAnswer with value', () => {
    const onAnswer = vi.fn();
    render(<MorningRetro yesterdayEntry={{ lockedTaskTitle: 'X' }} onAnswer={onAnswer} />);
    fireEvent.click(screen.getByText('Ні'));
    expect(onAnswer).toHaveBeenCalledWith('wrong');
  });
});

describe('DailyClose', () => {
  it('shows prompt when no task locked', () => {
    render(<DailyClose locked={null} frameworkResult={{ picks: {} }} history={[]} onClose={() => {}} />);
    expect(screen.getByText(/Спершу зафіксуй/)).toBeTruthy();
  });

  it('shows textarea and button when locked', () => {
    render(<DailyClose locked={{ taskId: 1, date: '2026-04-17' }} frameworkResult={{ picks: {} }} history={[]} onClose={() => {}} />);
    expect(screen.getByPlaceholderText('Рефлексія...')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Закрити день/ })).toBeTruthy();
  });
});

describe('PriorityMatrix (integration)', () => {
  let store = {};
  beforeEach(() => {
    store = {};
    vi.stubGlobal('localStorage', { getItem: vi.fn((k) => store[k] ?? null), setItem: vi.fn((k, v) => { store[k] = v; }) });
    vi.stubGlobal('fetch', vi.fn((url) => Promise.resolve({ ok: true, json: () => Promise.resolve(url.includes('history') ? [] : { version: 2, tasks: [], energyLevel: 2, locked: null }) })));
  });

  it('renders title and subtitle', async () => {
    await act(async () => { render(<PriorityMatrix />); });
    expect(screen.getByText('Пріоритети')).toBeTruthy();
    expect(screen.getByText(/Механізм незгоди/)).toBeTruthy();
  });

  it('shows empty state', async () => {
    await act(async () => { render(<PriorityMatrix />); });
    await waitFor(() => expect(screen.getByText(/Задач немає/)).toBeTruthy());
  });

  it('adds a task and shows in list', async () => {
    await act(async () => { render(<PriorityMatrix />); });
    await waitFor(() => expect(screen.getByPlaceholderText('Нова задача...')).toBeTruthy());
    const input = screen.getByPlaceholderText('Нова задача...');
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Buy groceries' } });
      fireEvent.click(screen.getByText(/Додати/));
    });
    expect(screen.getByText('Buy groceries')).toBeTruthy();
    expect(screen.queryByText(/Задач немає/)).toBeNull();
  });

  it('shows consensus for single task', async () => {
    await act(async () => { render(<PriorityMatrix />); });
    await waitFor(() => expect(screen.getByPlaceholderText('Нова задача...')).toBeTruthy());
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText('Нова задача...'), { target: { value: 'Solo task' } });
      fireEvent.click(screen.getByText(/Додати/));
    });
    expect(screen.getByText(/Згода/)).toBeTruthy();
  });

  it('deletes a task', async () => {
    await act(async () => { render(<PriorityMatrix />); });
    await waitFor(() => expect(screen.getByPlaceholderText('Нова задача...')).toBeTruthy());
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText('Нова задача...'), { target: { value: 'Temp task' } });
      fireEvent.click(screen.getByText(/Додати/));
    });
    expect(screen.getByText('Temp task')).toBeTruthy();
    await act(async () => { fireEvent.click(screen.getByLabelText('Видалити')); });
    expect(screen.queryByText('Temp task')).toBeNull();
  });
});
