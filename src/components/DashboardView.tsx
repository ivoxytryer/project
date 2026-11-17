import { useMemo } from "react";
import { useStore } from "../store";
import { Heatmap } from "./Heatmap";
import { toDateKey, todayKey, addDays, shiftDateKey } from "../utils/dates";
import { plural } from "../utils/helpers";

interface Streak {
  current: number;
  best: number;
}

function computeStreaks(completedDates: Set<string>): Streak {
  // Текущая серия
  let current = 0;
  let cursor = new Date();
  if (!completedDates.has(toDateKey(cursor))) {
    cursor = addDays(cursor, -1);
  }
  while (completedDates.has(toDateKey(cursor))) {
    current++;
    cursor = addDays(cursor, -1);
  }

  // Лучшая серия
  const sorted = [...completedDates].sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const key of sorted) {
    run = prev && shiftDateKey(prev, 1) === key ? run + 1 : 1;
    if (run > best) best = run;
    prev = key;
  }

  return { current, best };
}

export function DashboardView() {
  const { state } = useStore();

  const stats = useMemo(() => {
    const total = state.tasks.length;
    const completed = state.tasks.filter((t) => t.completed).length;
    const open = total - completed;
    const rate = total ? Math.round((completed / total) * 100) : 0;

    const completedDates = new Set(
      state.tasks.filter((t) => t.completed).map((t) => t.date),
    );
    const streak = computeStreaks(completedDates);

    const today = todayKey();
    const todayDone = state.tasks.filter((t) => t.date === today && t.completed).length;
    const todayTotal = state.tasks.filter((t) => t.date === today).length;

    return { total, completed, open, rate, streak, todayDone, todayTotal };
  }, [state]);

  const card = (label: string, value: string, sub?: string) => (
    <div className="rounded-2xl border border-white/5 bg-white/5 p-4 backdrop-blur sm:p-5">
      <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500 sm:text-xs">{label}</div>
      <div className="mt-2 text-2xl font-bold text-white sm:text-3xl">{value}</div>
      {sub && <div className="mt-1 text-[11px] text-slate-500 sm:text-xs">{sub}</div>}
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <header>
        <h1 className="text-xl font-bold text-white sm:text-2xl">Дашборд</h1>
        <p className="mt-1 text-sm text-slate-400">Твоя активность и прогресс</p>
      </header>

      {/* Карточки статистики */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-4 lg:grid-cols-4">
        {card("Выполнено", String(stats.completed), `из ${stats.total} ${plural(stats.total, "задачи", "задач", "задач")}`)}
        {card("Процент выполнения", `${stats.rate}%`, `${stats.open} ${plural(stats.open, "открыта", "открыто", "открыто")}`)}
        {card("Текущая серия", `${stats.streak.current}`, plural(stats.streak.current, "день", "дня", "дней") + " подряд")}
        {card("Лучшая серия", `${stats.streak.best}`, plural(stats.streak.best, "день", "дня", "дней") + " подряд")}
      </div>

      {/* Heatmap */}
      <section className="mt-5 rounded-2xl border border-white/5 bg-white/5 p-4 backdrop-blur sm:mt-6 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-white">Активность</h2>
          <span className="text-xs text-slate-500">
            Сегодня: {stats.todayDone} из {stats.todayTotal} выполнено
          </span>
        </div>
        <Heatmap weeks={17} />
      </section>
    </div>
  );
}
