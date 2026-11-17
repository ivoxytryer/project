import { useMemo } from "react";
import { useStore } from "../store";
import { Heatmap } from "./Heatmap";
import { toDateKey, todayKey, addDays, shiftDateKey, formatShortDate } from "../utils/dates";
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
    const rate = total ? Math.round((completed / total) * 100) : 0;

    const completedDates = new Set(
      state.tasks.filter((t) => t.completed).map((t) => t.date),
    );
    const streak = computeStreaks(completedDates);

    const today = todayKey();
    const todayDone = state.tasks.filter((t) => t.date === today && t.completed).length;
    const todayTotal = state.tasks.filter((t) => t.date === today).length;

    const journalDates = [...new Set(state.tasks.map((t) => t.date))].sort();

    return {
      total,
      completed,
      rate,
      streak,
      todayDone,
      todayTotal,
      journalDays: journalDates.length,
      firstDate: journalDates[0] ?? null,
    };
  }, [state]);

  /** Строка реестра: название слева, измерение справа. */
  const row = (label: string, value: string, detail?: string) => (
    <div className="flex items-baseline justify-between gap-4 border-b border-line py-3.5">
      <dt className="shrink-0 text-[13px] text-muted">{label}</dt>
      <dd className="flex min-w-0 items-baseline justify-end gap-2.5">
        <span className="shrink-0 font-mono text-[19px] leading-none tabular-nums text-bone">
          {value}
        </span>
        {detail && (
          <span className="truncate font-mono text-[11px] uppercase tracking-[0.12em] text-faint">
            {detail}
          </span>
        )}
      </dd>
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
      <header className="animate-rise border-b border-line pb-4">
        <h1 className="text-3xl font-semibold tracking-tight text-bone sm:text-4xl">
          Дашборд
        </h1>
        <p className="mt-1.5 font-mono text-[12px] uppercase tracking-[0.16em] text-muted">
          {stats.firstDate
            ? `журнал с ${formatShortDate(stats.firstDate)} · ${stats.journalDays} ${plural(
                stats.journalDays,
                "день",
                "дня",
                "дней",
              )}`
            : "журнал пуст"}
        </p>
      </header>

      {stats.total === 0 ? (
        <div className="animate-rise mt-10 border-y border-line py-16 text-center" style={{ animationDelay: "60ms" }}>
          <div className="mx-auto flex h-10 w-10 items-center justify-center border border-line text-faint">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 20V10M10 20V4M16 20v-8M22 20H2" strokeLinecap="square" />
            </svg>
          </div>
          <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
            Записей пока нет
          </p>
          <p className="mt-1.5 text-sm text-faint">
            Добавьте первую задачу — здесь появятся серия и активность.
          </p>
        </div>
      ) : (
        <>
          <section className="animate-rise mt-8" style={{ animationDelay: "60ms" }}>
            <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
              Сводка
            </h2>

            <dl className="mt-3 border-t border-line">
              {row("Сегодня", `${stats.todayDone} / ${stats.todayTotal}`)}
              {row(
                "Текущая серия",
                String(stats.streak.current),
                `${plural(stats.streak.current, "день", "дня", "дней")} подряд`,
              )}
              {row(
                "Лучшая серия",
                String(stats.streak.best),
                `${plural(stats.streak.best, "день", "дня", "дней")} подряд`,
              )}
            </dl>

            <div className="mt-6">
              <div className="flex items-baseline justify-between font-mono text-[12px] uppercase tracking-[0.14em] text-muted">
                <span>
                  выполнено {stats.completed} из {stats.total} за всё время
                </span>
                <span className="tabular-nums text-bone">{stats.rate}%</span>
              </div>
              <div className="mt-2 h-0.5 w-full bg-line">
                <div
                  className="progress-fill h-0.5 bg-bone"
                  style={{ width: `${stats.rate}%` }}
                />
              </div>
            </div>
          </section>

          <section className="animate-rise mt-10" style={{ animationDelay: "120ms" }}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                Активность
              </h2>
              <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-faint">
                <span className="lg:hidden">17 недель</span>
                <span className="hidden lg:inline">год</span>
              </span>
            </div>
            <div className="mt-4">
              <Heatmap weeks={17} className="lg:hidden" />
              <Heatmap weeks={52} className="hidden lg:block" />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
