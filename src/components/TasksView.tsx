import { useMemo, useState } from "react";
import type { Task } from "../types";
import { useStore } from "../store";
import { Heatmap } from "./Heatmap";
import {
  formatDayLabel,
  todayKey,
  shiftDateKey,
  formatShortDate,
} from "../utils/dates";

export function TasksView() {
  const { state, dispatch } = useStore();
  const [date, setDate] = useState(todayKey());
  const [title, setTitle] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const tasks = useMemo(() => {
    const list = state.tasks.filter((t) => t.date === date);
    return list.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return a.createdAt.localeCompare(b.createdAt);
    });
  }, [state.tasks, date]);

  const submitAdd = () => {
    const t = title.trim();
    if (!t) return;
    dispatch({ type: "ADD_TASK", title: t, date });
    setTitle("");
  };

  const submitEdit = () => {
    if (editingId) {
      const t = editTitle.trim();
      if (t) dispatch({ type: "RENAME_TASK", id: editingId, title: t });
    }
    setEditingId(null);
  };

  const doneCount = tasks.filter((t) => t.completed).length;
  const progress = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;

  const moveTask = (task: Task, amount: number) => {
    dispatch({ type: "MOVE_TASK", id: task.id, date: shiftDateKey(task.date, amount) });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex items-start gap-6">
        {/* Основная колонка задач */}
        <div className="min-w-0 flex-1">
          {/* Шапка с выбором дня */}
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-white sm:text-2xl">Задачи</h1>
              <p className="mt-1 text-sm text-slate-400">{formatDayLabel(date)}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-1 backdrop-blur">
              <button
                onClick={() => setDate((d) => shiftDateKey(d, -1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white"
                title="Предыдущий день"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              <input
                type="date"
                value={date}
                onChange={(e) => e.target.value && setDate(e.target.value)}
                className="rounded-lg bg-transparent px-1 text-sm text-slate-200 outline-none [color-scheme:dark]"
              />

              <button
                onClick={() => setDate((d) => shiftDateKey(d, 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white"
                title="Следующий день"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {date !== todayKey() && (
                <button
                  onClick={() => setDate(todayKey())}
                  className="rounded-lg bg-sky-500/90 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-500"
                >
                  Сегодня
                </button>
              )}
            </div>
          </header>

          {/* Добавление задачи */}
          <div className="mt-5 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-2 backdrop-blur">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitAdd()}
              placeholder="Новая задача…"
              className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder-slate-500 outline-none"
            />
            <button
              onClick={submitAdd}
              disabled={!title.trim()}
              className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Добавить
            </button>
          </div>

          {/* Прогресс дня */}
          {tasks.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>
                  {doneCount} из {tasks.length} выполнено
                </span>
                <span className="font-medium text-slate-300">{progress}%</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-400 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Список задач */}
          <ul className="mt-6 space-y-2">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="group flex items-center gap-2.5 rounded-2xl border border-white/5 bg-white/5 px-3 py-3 backdrop-blur transition hover:border-white/10 hover:bg-white/[0.08] sm:gap-3 sm:px-4"
              >
                <button
                  onClick={() => dispatch({ type: "TOGGLE_TASK", id: task.id })}
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition
                    ${
                      task.completed
                        ? "border-sky-400 bg-sky-500 text-white"
                        : "border-slate-500 text-transparent hover:border-sky-400"
                    }`}
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {editingId === task.id ? (
                  <input
                    autoFocus
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") submitEdit();
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    onBlur={submitEdit}
                    className="min-w-0 flex-1 rounded-lg bg-black/30 px-2 py-1 text-sm text-white outline-none ring-sky-400/50 focus:ring-2"
                  />
                ) : (
                  <span
                    className={`min-w-0 flex-1 truncate text-sm ${
                      task.completed ? "text-slate-500 line-through" : "text-slate-100"
                    }`}
                  >
                    {task.title}
                  </span>
                )}

                <div className="flex shrink-0 items-center gap-0.5">
                  <button
                    onClick={() => moveTask(task, -1)}
                    className="rounded-md p-1.5 text-slate-500 hover:bg-white/10 hover:text-white"
                    title="Перенести на вчера"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button
                    onClick={() => moveTask(task, 1)}
                    className="rounded-md p-1.5 text-slate-500 hover:bg-white/10 hover:text-white"
                    title="Перенести на завтра"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(task.id);
                      setEditTitle(task.title);
                    }}
                    className="rounded-md p-1.5 text-slate-500 hover:bg-white/10 hover:text-white"
                    title="Редактировать"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button
                    onClick={() => dispatch({ type: "DELETE_TASK", id: task.id })}
                    className="rounded-md p-1.5 text-slate-500 hover:bg-red-500/20 hover:text-red-400"
                    title="Удалить"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </li>
            ))}

            {tasks.length === 0 && (
              <div className="mt-16 flex flex-col items-center text-center">
                <div className="text-4xl">☔</div>
                <p className="mt-3 text-sm text-slate-400">
                  На {formatShortDate(date)} задач нет.
                </p>
                <p className="text-xs text-slate-600">Добавь первую задачу выше.</p>
              </div>
            )}
          </ul>
        </div>

        {/* Активность — маленький полупрозрачный квадрат справа */}
        <aside className="hidden w-44 shrink-0 lg:block">
          <div className="sticky top-8 rounded-2xl border border-white/5 bg-white/[0.03] p-4 backdrop-blur-sm">
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Активность
            </h2>
            <Heatmap compact weeks={10} />
          </div>
        </aside>
      </div>
    </div>
  );
}
