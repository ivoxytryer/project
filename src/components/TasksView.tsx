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
  const [menuId, setMenuId] = useState<string | null>(null);

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
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="flex items-start gap-8">
        {/* Основная колонка задач */}
        <div className="min-w-0 flex-1">
          {/* Шапка с выбором дня */}
          <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-bone sm:text-4xl">
                Задачи
              </h1>
              <p className="mt-1.5 font-mono text-[12px] uppercase tracking-[0.16em] text-muted">
                {formatDayLabel(date)}
              </p>
            </div>

            <div className="flex items-center border border-line">
              <button
                onClick={() => setDate((d) => shiftDateKey(d, -1))}
                className="flex h-11 w-11 shrink-0 items-center justify-center text-muted transition-colors hover:bg-panel hover:text-bone md:h-9 md:w-9"
                title="Предыдущий день"
                aria-label="Предыдущий день"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M15 18l-6-6 6-6" strokeLinecap="square" />
                </svg>
              </button>

              <input
                type="date"
                value={date}
                onChange={(e) => e.target.value && setDate(e.target.value)}
                className="h-11 min-w-0 border-x border-line bg-transparent px-2 font-mono text-xs tabular-nums text-bone outline-none [color-scheme:dark] md:h-9"
              />

              <button
                onClick={() => setDate((d) => shiftDateKey(d, 1))}
                className="flex h-11 w-11 items-center justify-center text-muted transition-colors hover:bg-panel hover:text-bone md:h-9 md:w-9"
                title="Следующий день"
                aria-label="Следующий день"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 6l6 6-6 6" strokeLinecap="square" />
                </svg>
              </button>

              {date !== todayKey() && (
                <button
                  onClick={() => setDate(todayKey())}
                  className="h-11 border-l border-line px-3 font-mono text-[11px] uppercase tracking-[0.14em] text-bone transition-colors hover:bg-panel md:h-9"
                >
                  Сегодня
                </button>
              )}
            </div>
          </header>

          {/* Добавление задачи */}
          <div className="mt-6 flex items-center gap-2 border border-line p-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitAdd()}
              placeholder="Новая задача…"
              className="min-w-0 flex-1 bg-transparent px-2 py-2 text-base text-bone placeholder:text-faint outline-none"
            />
            <button
              onClick={submitAdd}
              disabled={!title.trim()}
              className="h-11 shrink-0 bg-bone px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-30 md:h-9"
            >
              Добавить
            </button>
          </div>

          {/* Прогресс дня */}
          {tasks.length > 0 && (
            <div className="mt-7">
              <div className="flex items-baseline justify-between font-mono text-[12px] uppercase tracking-[0.14em] text-muted">
                <span>
                  {doneCount} / {tasks.length} выполнено
                </span>
                <span className="tabular-nums text-bone">{progress}%</span>
              </div>
              <div className="mt-2 h-0.5 w-full bg-line">
                <div
                  className="progress-fill h-0.5 bg-bone"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Список задач */}
          <ul className="mt-8 border-t border-line">
            {tasks.map((task, index) => (
              <li
                key={task.id}
                className="animate-rise group relative flex items-center gap-3 border-b border-line py-3 transition-colors hover:bg-panel sm:gap-4"
                style={{ animationDelay: `${Math.min(index, 12) * 24}ms` }}
              >
                <span className="flex h-11 w-6 shrink-0 items-center justify-center font-mono text-xs tabular-nums text-faint md:h-9">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <button
                  onClick={() => dispatch({ type: "TOGGLE_TASK", id: task.id })}
                  aria-label={task.completed ? "Снять отметку" : "Отметить выполненной"}
                  className="flex h-11 w-11 shrink-0 items-center justify-center md:h-9 md:w-9"
                >
                  <span
                    className={`flex h-[18px] w-[18px] items-center justify-center border transition-colors ${
                      task.completed
                        ? "border-bone bg-bone text-ink"
                        : "border-line-strong text-transparent hover:border-bone"
                    }`}
                  >
                    <svg
                      className={`h-3 w-3 transition-transform duration-150 ${
                        task.completed ? "scale-100" : "scale-50"
                      }`}
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M3 8.5l3.2 3.2L13 4.5" strokeLinecap="square" />
                    </svg>
                  </span>
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
                    className="min-w-0 flex-1 border border-line bg-ink px-2 py-1 text-base text-bone outline-none focus:border-bone"
                  />
                ) : (
                  <span
                    className={`min-w-0 flex-1 truncate text-[15px] leading-snug ${
                      task.completed
                        ? "text-faint line-through decoration-line-strong"
                        : "text-bone"
                    }`}
                  >
                    {task.title}
                  </span>
                )}

                <div className="hidden shrink-0 items-center gap-0.5 md:flex md:opacity-0 md:transition-opacity md:group-hover:opacity-100 md:focus-within:opacity-100">
                  <button
                    onClick={() => moveTask(task, -1)}
                    className="flex h-8 w-8 items-center justify-center text-muted transition-colors hover:bg-ink hover:text-bone"
                    title="Перенести на вчера"
                    aria-label="Перенести на вчера"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M15 18l-6-6 6-6" strokeLinecap="square" />
                    </svg>
                  </button>
                  <button
                    onClick={() => moveTask(task, 1)}
                    className="flex h-8 w-8 items-center justify-center text-muted transition-colors hover:bg-ink hover:text-bone"
                    title="Перенести на завтра"
                    aria-label="Перенести на завтра"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M9 6l6 6-6 6" strokeLinecap="square" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(task.id);
                      setEditTitle(task.title);
                    }}
                    className="flex h-8 w-8 items-center justify-center text-muted transition-colors hover:bg-ink hover:text-bone"
                    title="Редактировать"
                    aria-label="Редактировать"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" strokeLinecap="square" />
                    </svg>
                  </button>
                  <button
                    onClick={() => dispatch({ type: "DELETE_TASK", id: task.id })}
                    className="flex h-8 w-8 items-center justify-center text-muted transition-colors hover:bg-ink hover:text-danger"
                    title="Удалить"
                    aria-label="Удалить"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M3 6h18M8 6V4h8v2m3 0v14H5V6" strokeLinecap="square" />
                    </svg>
                  </button>
                </div>

                <button
                  onClick={() => setMenuId(menuId === task.id ? null : task.id)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center text-muted transition-colors hover:text-bone md:hidden"
                  aria-label="Действия с задачей"
                  aria-expanded={menuId === task.id}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="5" cy="12" r="1.4" />
                    <circle cx="12" cy="12" r="1.4" />
                    <circle cx="19" cy="12" r="1.4" />
                  </svg>
                </button>

                {menuId === task.id && (
                  <div className="animate-pop absolute right-2 top-full z-20 w-52 border border-line bg-panel">
                    <button
                      onClick={() => {
                        moveTask(task, -1);
                        setMenuId(null);
                      }}
                      className="block w-full px-3 py-3 text-left text-[13px] text-bone transition-colors hover:bg-ink"
                    >
                      Перенести на вчера
                    </button>
                    <button
                      onClick={() => {
                        moveTask(task, 1);
                        setMenuId(null);
                      }}
                      className="block w-full border-t border-line px-3 py-3 text-left text-[13px] text-bone transition-colors hover:bg-ink"
                    >
                      Перенести на завтра
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(task.id);
                        setEditTitle(task.title);
                        setMenuId(null);
                      }}
                      className="block w-full border-t border-line px-3 py-3 text-left text-[13px] text-bone transition-colors hover:bg-ink"
                    >
                      Переименовать
                    </button>
                    <button
                      onClick={() => {
                        dispatch({ type: "DELETE_TASK", id: task.id });
                        setMenuId(null);
                      }}
                      className="block w-full border-t border-line px-3 py-3 text-left text-[13px] text-danger transition-colors hover:bg-ink"
                    >
                      Удалить
                    </button>
                  </div>
                )}
              </li>
            ))}

            {tasks.length === 0 && (
              <li className="border-b border-line py-16 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center border border-line text-faint">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3.5" y="4.5" width="17" height="16" />
                    <path d="M8 12h8M8 16h5" strokeLinecap="square" />
                  </svg>
                </div>
                <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
                  На {formatShortDate(date)} задач нет
                </p>
                <p className="mt-1.5 text-sm text-faint">Добавьте первую задачу выше.</p>
              </li>
            )}
          </ul>
        </div>

        {/* Активность — узкая рейка справа */}
        <aside className="hidden w-44 shrink-0 lg:block">
          <div className="sticky top-10 border border-line p-4">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
              Активность
            </h2>
            <div className="mt-4">
              <Heatmap compact weeks={12} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
