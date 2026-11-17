import { useMemo } from "react";
import { useStore } from "../store";
import { toDateKey, addDays, startOfWeek } from "../utils/dates";
import { plural } from "../utils/helpers";

/** Плотность записей: от пустой клетки к бумаге. Без цвета — только свет. */
const LEVELS = ["#1c1d22", "#3a3c42", "#61636b", "#94959c", "#e9e7e1"] as const;

const DAY_LABELS = ["Пн", "", "Ср", "", "Пт", "", "Вс"];

function levelFor(count: number): number {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count === 3) return 3;
  return 4;
}

interface HeatmapProps {
  weeks?: number;
  compact?: boolean;
  className?: string;
}

export function Heatmap({ weeks = 17, compact = false, className = "" }: HeatmapProps) {
  const { state } = useStore();

  const { cells, monthLabels, totalDone } = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of state.tasks) {
      if (!t.completed) continue;
      counts.set(t.date, (counts.get(t.date) ?? 0) + 1);
    }

    const first = addDays(startOfWeek(new Date()), -7 * (weeks - 1));
    const now = Date.now();
    const cells: { key: string; count: number; future: boolean }[] = [];
    const monthLabels: { index: number; text: string }[] = [];

    for (let w = 0; w < weeks; w++) {
      const colStart = addDays(first, w * 7);
      if (colStart.getDate() <= 7) {
        const text = colStart
          .toLocaleDateString("ru-RU", { month: "short" })
          .replace(".", "");
        const last = monthLabels[monthLabels.length - 1];
        if (!last || last.text !== text) monthLabels.push({ index: w, text });
      }
      for (let r = 0; r < 7; r++) {
        const d = addDays(colStart, r);
        const key = toDateKey(d);
        cells.push({ key, count: counts.get(key) ?? 0, future: d.getTime() > now });
      }
    }

    let totalDone = 0;
    for (const count of counts.values()) totalDone += count;

    return { cells, monthLabels, totalDone };
  }, [state.tasks, weeks]);

  const columns = { gridTemplateColumns: `repeat(${weeks}, minmax(0, 1fr))` };
  const rows = { gridTemplateRows: "repeat(7, auto)" };

  return (
    <div className={className}>
      <div className={`flex gap-[3px] ${compact ? "mb-1 min-h-[12px]" : ""}`}>
        {!compact && <div className="w-8 shrink-0" />}
        <div className="grid flex-1" style={columns}>
          {monthLabels.map((m) => (
            <span
              key={`${m.index}-${m.text}`}
              style={{ gridColumnStart: m.index + 1 }}
              className={
                compact
                  ? "whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.08em] text-faint"
                  : "whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.12em] text-faint"
              }
            >
              {m.text}
            </span>
          ))}
        </div>
      </div>

      <div className={`flex gap-[3px] ${compact ? "" : "mt-1.5"}`}>
        {!compact && (
          <div className="grid w-8 shrink-0 grid-rows-7 gap-[3px] font-mono text-[11px] uppercase tracking-[0.12em] text-faint">
            {DAY_LABELS.map((label, i) => (
              <span key={i} className="flex items-center leading-none">
                {label}
              </span>
            ))}
          </div>
        )}

        <div
          className="grid flex-1 grid-flow-col gap-[3px]"
          style={{ ...columns, ...rows }}
          role="img"
          aria-label={`Активность за ${weeks} недель: ${totalDone} ${plural(
            totalDone,
            "выполненная задача",
            "выполненные задачи",
            "выполненных задач",
          )}`}
        >
          {cells.map((cell) => {
            const level = cell.future ? 0 : levelFor(cell.count);
            return (
              <div
                key={cell.key}
                title={cell.future ? cell.key : `${cell.key}: выполнено ${cell.count}`}
                className="aspect-square"
                style={{ backgroundColor: LEVELS[level] }}
              />
            );
          })}
        </div>
      </div>

      {!compact && (
        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] uppercase tracking-[0.12em] text-faint">
          <span>меньше</span>
          <span className="flex items-center" style={{ gap: 3 }}>
            {LEVELS.map((level, i) => (
              <span key={i} style={{ width: 9, height: 9, backgroundColor: level }} />
            ))}
          </span>
          <span>больше</span>
          <span className="ml-auto text-muted">
            {totalDone} {plural(totalDone, "задача", "задачи", "задач")} за период
          </span>
        </div>
      )}
    </div>
  );
}
