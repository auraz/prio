// Extracted React components for testability. Canonical source — sync with index.html.
import React, { useState, useEffect, useRef } from 'react';
import { scoreConsequences, scoreImportance, scoreEnergy, getFrameworkPicks } from './scoring.js';

export const today = () => new Date().toISOString().slice(0, 10);

export const priorityLabel = (score) => {
  if (score >= 7) return { text: 'P0', style: { color: 'var(--mark)', fontWeight: 700 } };
  if (score >= 4) return { text: 'P1', style: { color: 'var(--ink)', fontWeight: 700 } };
  if (score >= 2) return { text: 'P2', style: { color: 'var(--ink-mid)', fontWeight: 400 } };
  return { text: 'P3', style: { color: 'var(--ink-faint)', fontWeight: 400 } };
};

const Icon = ({ path, size = 16, ...rest }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...rest}>{path}</svg>
);
const TrashIcon = (p) => <Icon {...p} path={<><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></>} />;
const PlusIcon = (p) => <Icon {...p} path={<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>} />;
const LockIcon = (p) => <Icon {...p} path={<><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>} />;
const ChevronIcon = ({ open, ...p }) => <Icon {...p} path={<polyline points={open ? "18 15 12 9 6 15" : "6 9 12 15 18 9"} />} />;

const CACHE_KEY = 'prio-state';
function loadCache() { try { return JSON.parse(localStorage.getItem(CACHE_KEY)); } catch { return null; } }
function saveCache(state) { try { localStorage.setItem(CACHE_KEY, JSON.stringify(state)); } catch {} }

const MATRIX_CONS = [{ row: 'Незворотні', vals: [9, 6, 3] }, { row: 'Зворотні', vals: [6, 4, 2] }, { row: 'Ніякі', vals: [3, 2, 1] }];
const MATRIX_IMP = [{ row: 'Life-changing', vals: [9, 6, 3] }, { row: 'Meaningful', vals: [6, 4, 2] }, { row: 'Nice-to-have', vals: [3, 2, 1] }];

export function EnergyToggle({ level, onChange }) {
  const levels = [{ v: 3, label: 'Висока' }, { v: 2, label: 'Середня' }, { v: 1, label: 'Низька' }];
  return (
    <div className="flex items-baseline gap-4 mb-6">
      <span className="label">Енергія</span>
      <div className="flex gap-3">
        {levels.map(l => (
          <button key={l.v} onClick={() => onChange(l.v)} className="text-sm pb-0.5 transition-colors"
            style={{ color: level === l.v ? 'var(--ink)' : 'var(--ink-faint)', fontWeight: level === l.v ? 700 : 400, borderBottom: level === l.v ? '2px solid var(--ink)' : '2px solid transparent' }}>
            {l.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function HeroBanner({ tasks, locked, frameworkResult, onLock, onUnlock }) {
  if (tasks.length === 0) return null;
  const { picks, consensus, conflict, topTaskId } = frameworkResult;

  if (locked) {
    const task = tasks.find(t => t.id === locked.taskId);
    if (!task) return null;
    return (
      <div className="mb-6 cursor-pointer fade-up" onClick={onUnlock} style={{ background: 'var(--ink)', color: 'var(--paper)', padding: '1.25rem 1rem' }}>
        <div className="label" style={{ color: 'oklch(0.65 0.005 80)', marginBottom: '0.5rem' }}>
          <span className="inline-flex items-center gap-1.5"><LockIcon size={11} /> Фокус на сьогодні</span>
        </div>
        <div className="font-display text-xl" style={{ fontWeight: 600, lineHeight: 1.3 }}>«{task.title}»</div>
        <div className="mt-2 text-xs" style={{ color: 'oklch(0.55 0.005 80)' }}>{task.sphere} · {task.consequences} · {task.deadline}</div>
        <div className="mt-3 text-xs" style={{ color: 'oklch(0.45 0.005 80)' }}>натисни щоб розблокувати</div>
      </div>
    );
  }

  if (consensus) {
    const task = tasks.find(t => t.id === topTaskId);
    if (!task) return null;
    const agreeCount = Object.values(picks).filter(p => p.taskId === topTaskId).length;
    return (
      <div className="mb-6 cursor-pointer fade-up" onClick={() => onLock(topTaskId)} style={{ borderTop: '1px solid var(--agree)', borderBottom: '1px solid var(--agree)', padding: '1.25rem 0' }}>
        <div className="flex items-baseline justify-between mb-2">
          <span className="label" style={{ color: 'var(--agree)' }}>Згода</span>
          <span className="text-xs" style={{ color: 'var(--agree)' }}>{agreeCount}/3</span>
        </div>
        <div className="font-display text-xl" style={{ fontWeight: 600, lineHeight: 1.3 }}>→ «{task.title}»</div>
        <div className="mt-2 text-xs" style={{ color: 'var(--ink-mid)' }}>{task.sphere} · {task.consequences} · {task.deadline}</div>
        <div className="mt-3 text-xs" style={{ color: 'var(--ink-faint)' }}>натисни щоб зафіксувати</div>
      </div>
    );
  }

  const fwLabels = { consequences: 'Наслідки', importance: 'Важливість', energy: 'Енергія' };
  return (
    <div className="mb-6 fade-up" style={{ borderTop: '2px solid var(--mark)', padding: '1.25rem 0' }}>
      <div className="label mb-4" style={{ color: 'var(--mark)' }}>Конфлікт — фреймворки не згодні</div>
      <div className="space-y-0">
        {Object.entries(picks).map(([fw, pick]) => (
          <div key={fw} className="flex items-baseline gap-3 cursor-pointer group py-2.5" onClick={() => onLock(pick.taskId)} style={{ borderBottom: '1px solid var(--rule)' }}>
            <span className="text-xs shrink-0" style={{ color: 'var(--ink-mid)', width: '5.5rem' }}>{fwLabels[fw]}:</span>
            <span className="font-display text-sm flex-1 group-hover:underline" style={{ fontWeight: 600 }}>«{pick.title}»</span>
            <span className="text-xs tabular-nums shrink-0" style={{ color: 'var(--ink-faint)' }}>{pick.score}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 text-xs" style={{ color: 'var(--ink-faint)' }}>Обери один. Натисни щоб зафіксувати.</div>
    </div>
  );
}

export function MorningRetro({ yesterdayEntry, onAnswer }) {
  if (!yesterdayEntry || yesterdayEntry.retrospective) return null;
  return (
    <div className="mb-6 py-4 fade-up" style={{ borderTop: '1px solid var(--rule)', borderBottom: '1px solid var(--rule)' }}>
      <div className="label mb-2">Вчорашній вибір</div>
      <div className="font-display text-base mb-3" style={{ fontWeight: 600 }}>«{yesterdayEntry.lockedTaskTitle}»</div>
      <div className="text-xs mb-3" style={{ color: 'var(--ink-mid)' }}>Це був правильний вибір?</div>
      <div className="flex gap-4">
        {[{ v: 'right', label: 'Так' }, { v: 'wrong', label: 'Ні' }, { v: 'unclear', label: 'Не ясно' }].map(o => (
          <button key={o.v} onClick={() => onAnswer(o.v)} className="text-sm pb-0.5 hover:underline" style={{ color: 'var(--ink)' }}>{o.label}</button>
        ))}
      </div>
    </div>
  );
}

export function DailyClose({ locked, frameworkResult, history, onClose }) {
  const [reflection, setReflection] = useState('');
  const [saving, setSaving] = useState(false);
  const todayDate = today();
  const todayEntry = history.find(e => e.date === todayDate);

  if (todayEntry) {
    const weekEntries = history.filter(e => { const d = new Date(e.date); const now = new Date(); const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7); return d >= weekAgo; });
    const alignedCount = weekEntries.filter(e => e.aligned).length;
    return (
      <div className="mt-8 pt-4" style={{ borderTop: '1px solid var(--rule)' }}>
        <span className="text-sm" style={{ color: 'var(--agree)' }}>День закрито — {todayEntry.aligned ? 'збігся з фреймворками' : 'обрав своє'} · {alignedCount}/7 за тиждень</span>
      </div>
    );
  }

  const handleClose = async () => {
    if (!locked) return;
    setSaving(true);
    const { picks } = frameworkResult;
    const aligned = Object.values(picks).filter(p => p.taskId === locked.taskId).length >= 2;
    await onClose({ date: todayDate, lockedTaskId: locked.taskId, frameworkPicks: picks, aligned, reflection: reflection.trim() || null });
    setSaving(false);
  };

  return (
    <div className="mt-8 pt-4" style={{ borderTop: '1px solid var(--rule)' }}>
      <div className="label mb-3">Закрити день</div>
      {!locked && <div className="text-xs" style={{ color: 'var(--ink-faint)' }}>Спершу зафіксуй задачу як фокус</div>}
      {locked && (
        <>
          <textarea value={reflection} onChange={(e) => setReflection(e.target.value)} placeholder="Рефлексія..." className="w-full mb-3 text-sm p-2" style={{ background: 'var(--surface)', border: '1px solid var(--rule)', resize: 'none' }} rows={2} />
          <button onClick={handleClose} disabled={saving} className="text-sm py-2 px-6 transition-colors"
            style={{ border: '1px solid var(--ink)', background: saving ? 'var(--surface)' : 'transparent', color: 'var(--ink)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: saving ? 0.5 : 1 }}>
            {saving ? 'Зберігаю...' : 'Закрити день'}
          </button>
        </>
      )}
    </div>
  );
}

export function FrameworkInfo({ show, onToggle }) {
  if (!show) return (
    <button onClick={onToggle} className="flex items-center gap-1 text-xs mb-6 hover:underline" style={{ color: 'var(--ink-mid)' }}>
      <ChevronIcon open={false} size={12} /> Як працює пріоритизація
    </button>
  );

  const MatrixTable = ({ title, cols, rows }) => (
    <div className="mb-5">
      <div className="font-display text-sm mb-2" style={{ fontWeight: 600 }}>{title}</div>
      <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
        <thead><tr>
          <th className="text-left py-1 pr-3" style={{ borderBottom: '1px solid var(--rule)' }}></th>
          {cols.map(c => <th key={c} className="text-center py-1 px-2" style={{ borderBottom: '1px solid var(--rule)', fontWeight: 400, color: 'var(--ink-mid)' }}>{c}</th>)}
        </tr></thead>
        <tbody>{rows.map(r => (
          <tr key={r.row}>
            <td className="text-left py-1.5 pr-3" style={{ borderBottom: '1px solid var(--rule)', color: 'var(--ink-mid)' }}>{r.row}</td>
            {r.vals.map((v, idx) => <td key={idx} className="text-center py-1.5 px-2 tabular-nums" style={{ borderBottom: '1px solid var(--rule)', fontWeight: v >= 6 ? 700 : 400, color: v >= 7 ? 'var(--mark)' : 'var(--ink)' }}>{v}</td>)}
          </tr>
        ))}</tbody>
      </table>
    </div>
  );

  return (
    <div className="mb-6">
      <button onClick={onToggle} className="flex items-center gap-1 text-xs mb-4 hover:underline" style={{ color: 'var(--ink-mid)' }}>
        <ChevronIcon open={true} size={12} /> Як працює пріоритизація
      </button>
      <div className="pt-4" style={{ borderTop: '1px solid var(--rule)' }}>
        <MatrixTable title="Наслідки × Терміновість" cols={['Сьогодні', 'Тиждень', 'Пізніше']} rows={MATRIX_CONS} />
        <MatrixTable title="Важливість × Масштаб впливу" cols={['Багато', 'Одна', 'Ізольо.']} rows={MATRIX_IMP} />
        <div>
          <div className="font-display text-sm mb-1" style={{ fontWeight: 600 }}>Збіг енергії</div>
          <div className="text-xs" style={{ color: 'var(--ink-mid)' }}>4 − |потрібна − поточна|. Діапазон: 2–4.</div>
        </div>
      </div>
    </div>
  );
}

export function PriorityMatrix() {
  const [tasks, setTasks] = useState([]);
  const [energyLevel, setEnergyLevel] = useState(2);
  const [locked, setLocked] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveError, setSaveError] = useState(false);
  const loaded = useRef(false);
  const [title, setTitle] = useState('');
  const [consequences, setConsequences] = useState('зворотні');
  const [deadline, setDeadline] = useState('цей тиждень');
  const [sphere, setSphere] = useState('робота');
  const [importance, setImportance] = useState('meaningful');
  const [impactScope, setImpactScope] = useState('affects one area');
  const [energyRequired, setEnergyRequired] = useState(2);
  const [showFramework, setShowFramework] = useState(false);

  const apiHeaders = { 'Content-Type': 'application/json' };

  useEffect(() => {
    const cached = loadCache();
    if (cached) { setTasks(cached.tasks || []); setEnergyLevel(cached.energyLevel || 2); setLocked(cached.locked || null); }
    Promise.all([
      fetch('/api/tasks', { headers: apiHeaders }).then(r => r.ok ? r.json() : Promise.reject()),
      fetch('/api/history', { headers: apiHeaders }).then(r => r.ok ? r.json() : Promise.reject()),
    ]).then(([state, hist]) => {
      let { tasks: t, energyLevel: e, locked: l } = state;
      if (l && l.date !== today()) { l = null; e = 2; }
      setTasks(t || []); setEnergyLevel(e || 2); setLocked(l); setHistory(hist || []);
      saveCache({ tasks: t, energyLevel: e, locked: l });
      loaded.current = true; setLoading(false);
    }).catch(() => { if (!cached) setError('Не вдалося завантажити'); loaded.current = true; setLoading(false); });
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    const blob = { version: 2, tasks, energyLevel, locked };
    saveCache(blob); setSaveError(false);
    fetch('/api/tasks', { method: 'PUT', headers: apiHeaders, body: JSON.stringify(blob) }).catch(() => setSaveError(true));
  }, [tasks, energyLevel, locked]);

  const addTask = () => {
    if (!title.trim()) return;
    setTasks([...tasks, { id: Date.now(), title: title.trim(), consequences, deadline, sphere, importance, impactScope, energyRequired, createdAt: Date.now() }]);
    setTitle('');
  };
  const deleteTask = (id) => { setTasks(tasks.filter(t => t.id !== id)); if (locked?.taskId === id) setLocked(null); };
  const lockTask = (taskId) => setLocked({ taskId, date: today() });
  const unlockTask = () => setLocked(null);

  const closeDay = async (entry) => {
    const lockedTask = tasks.find(t => t.id === locked?.taskId);
    if (lockedTask) entry.lockedTaskTitle = lockedTask.title;
    try {
      await fetch('/api/history', { method: 'POST', headers: apiHeaders, body: JSON.stringify(entry) });
      setHistory(prev => [...prev.filter(e => e.date !== entry.date), entry]);
    } catch { setSaveError(true); }
  };

  const answerRetro = async (answer) => {
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const yDate = yesterday.toISOString().slice(0, 10);
    const entry = history.find(e => e.date === yDate);
    if (!entry) return;
    const updated = { ...entry, retrospective: answer };
    try {
      await fetch('/api/history', { method: 'POST', headers: apiHeaders, body: JSON.stringify(updated) });
      setHistory(prev => prev.map(e => e.date === yDate ? updated : e));
    } catch { setSaveError(true); }
  };

  const frameworkResult = getFrameworkPicks(tasks, energyLevel);
  const sortedTasks = [...tasks].sort((a, b) => scoreConsequences(b) - scoreConsequences(a));
  const yesterdayDate = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10); })();
  const yesterdayEntry = history.find(e => e.date === yesterdayDate);

  if (loading && !loadCache()) return (
    <div className="min-h-screen flex items-center justify-center"><span className="text-sm" style={{ color: 'var(--ink-faint)' }}>Завантаження...</span></div>
  );
  if (error && tasks.length === 0) return (
    <div className="min-h-screen flex items-center justify-center"><span className="text-sm" style={{ color: 'var(--mark)' }}>{error}</span></div>
  );

  const selectStyle = { background: 'transparent', border: 'none', borderBottom: '1px solid var(--rule)', padding: '0.375rem 0', fontSize: '0.875rem', color: 'var(--ink)', width: '100%' };

  return (
    <div className="mx-auto px-4 py-6 min-h-screen" style={{ maxWidth: '36rem' }}>
      <header className="mb-8">
        <h1 className="font-display" style={{ fontSize: '2.25rem', fontWeight: 400, lineHeight: 1.2, letterSpacing: '-0.01em' }}>Пріоритети</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--ink-mid)' }}>Механізм незгоди — три фреймворки, одне рішення</p>
      </header>

      {saveError && <div className="text-xs mb-4" style={{ color: 'var(--mark)' }}>Не вдалося зберегти. Зміни збережені локально.</div>}

      <MorningRetro yesterdayEntry={yesterdayEntry} onAnswer={answerRetro} />
      <EnergyToggle level={energyLevel} onChange={setEnergyLevel} />
      <HeroBanner tasks={tasks} locked={locked} frameworkResult={frameworkResult} onLock={lockTask} onUnlock={unlockTask} />
      <FrameworkInfo show={showFramework} onToggle={() => setShowFramework(!showFramework)} />

      <div className="mb-8 pb-6" style={{ borderBottom: '1px solid var(--rule)' }}>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTask()} placeholder="Нова задача..."
          className="w-full mb-4 text-base py-2" style={{ background: 'transparent', border: 'none', borderBottom: '2px solid var(--ink)', outline: 'none', fontFamily: '"Brygada 1918", serif', fontWeight: 600 }} />
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-4">
          <div><label className="label block mb-1">Наслідки</label><select value={consequences} onChange={(e) => setConsequences(e.target.value)} style={selectStyle}><option value="незворотні">Незворотні</option><option value="зворотні">Зворотні</option><option value="ніякі">Ніякі</option></select></div>
          <div><label className="label block mb-1">Дедлайн</label><select value={deadline} onChange={(e) => setDeadline(e.target.value)} style={selectStyle}><option value="сьогодні">Сьогодні</option><option value="цей тиждень">Цей тиждень</option><option value="пізніше">Пізніше</option></select></div>
          <div><label className="label block mb-1">Важливість</label><select value={importance} onChange={(e) => setImportance(e.target.value)} style={selectStyle}><option value="life-changing">Змінює життя</option><option value="meaningful">Значуща</option><option value="nice-to-have">Було б добре</option></select></div>
          <div><label className="label block mb-1">Масштаб впливу</label><select value={impactScope} onChange={(e) => setImpactScope(e.target.value)} style={selectStyle}><option value="affects many areas">Багато сфер</option><option value="affects one area">Одна сфера</option><option value="isolated">Ізольований</option></select></div>
          <div><label className="label block mb-1">Сфера</label><select value={sphere} onChange={(e) => setSphere(e.target.value)} style={selectStyle}><option value="робота">Робота</option><option value="особисте">Особисте</option></select></div>
          <div><label className="label block mb-1">Потрібна енергія</label><select value={energyRequired} onChange={(e) => setEnergyRequired(Number(e.target.value))} style={selectStyle}><option value={3}>Глибокий фокус</option><option value={2}>Помірна</option><option value={1}>Автопілот</option></select></div>
        </div>
        <button onClick={addTask} className="flex items-center gap-2 text-sm py-2 px-5"
          style={{ border: '1px solid var(--ink)', background: 'transparent', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <PlusIcon size={14} /> Додати
        </button>
      </div>

      {sortedTasks.length > 0 ? (
        <div>
          <div className="flex items-baseline justify-between mb-3">
            <span className="label">Задачі</span>
            <span className="text-xs tabular-nums" style={{ color: 'var(--ink-faint)' }}>{sortedTasks.length}</span>
          </div>
          {sortedTasks.map((task) => {
            const prio = priorityLabel(scoreConsequences(task));
            const isLocked = locked?.taskId === task.id;
            return (
              <div key={task.id} data-locked-title={isLocked ? task.title : undefined} className="task-row flex items-start gap-3 py-3">
                <span className="text-xs tabular-nums shrink-0 pt-0.5" style={{ ...prio.style, width: '1.5rem' }}>{prio.text}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm" style={{ fontWeight: isLocked ? 700 : 400 }}>
                    {isLocked && <LockIcon size={11} style={{ display: 'inline', verticalAlign: '-1px', marginRight: '4px' }} />}{task.title}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--ink-mid)' }}>{task.sphere} · {task.consequences} · {task.deadline}</div>
                  <div className="text-xs mt-0.5 tabular-nums" style={{ color: 'var(--ink-faint)' }}>Н:{scoreConsequences(task)} В:{scoreImportance(task)} Е:{scoreEnergy(task, energyLevel)}</div>
                </div>
                <button onClick={() => deleteTask(task.id)} className="shrink-0 pt-0.5" style={{ color: 'var(--ink-faint)' }} aria-label="Видалити"><TrashIcon size={14} /></button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-2 text-sm" style={{ color: 'var(--ink-mid)' }}>Задач немає. Додай першу — три фреймворки оцінять її незалежно.</div>
      )}

      <DailyClose locked={locked} frameworkResult={frameworkResult} history={history} onClose={closeDay} />
    </div>
  );
}
