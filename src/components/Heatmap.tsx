import { useMemo } from "react";
import { useStore } from "../store";
import { toDateKey, addDays, startOfWeek } from "../utils/dates";

const LEVELS = [
  "bg-white/[0.04]",
  "bg-sky-900/70",
  "bg-sky-700/75",
  "bg-sky-500/85",
  "bg-sky-300",
] as const;

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
}

export function Heatmap({ weeks = 17, compact = false }: HeatmapProps) {
  const { state } = useStore();

  const cell = compact ? 9 : 11;
  const gap = compact ? 2 : 3;
  const gutter = compact ? 0 : 36;

  const completedCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of state.tasks) {
      if (!t.completed) continue;
      map.set(t.date, (map.get(t.date) ?? 0) + 1);
    }
    return map;
  }, [state.tasks]);

  const grid = useMemo(() => {
    const today = new Date();
    const first = addDays(startOfWeek(today), -7 * (weeks - 1));
    const cols: { key: string; cells: { date: Date; key: string; count: number }[] }[] = [];
    for (let w = 0; w < weeks; w++) {
      const colStart = addDays(first, w * 7);
      const cells = [];
      for (let r = 0; r < 7; r++) {
        const d = addDays(colStart, r);
        cells.push({ date: d, key: toDateKey(d), count: completedCounts.get(toDateKey(d)) ?? 0 });
      }
      cols.push({ key: toDateKey(colStart), cells });
    }
    return cols;
  }, [completedCounts, weeks]);

  const monthLabels = useMemo(() => {
    const labels: { index: number; text: string }[] = [];
    grid.forEach((col, i) => {
      const d = col.cells[0].date;
      if (d.getDate() <= 7) {
        const text = d.toLocaleDateString("ru-RU", { month: "short" }).replace(".", "");
        const last = labels[labels.length - 1];
        if (!last || last.text !== text) labels.push({ index: i, text });
      }
    });
    return labels;
  }, [grid]);

  const totalDone = useMemo(
    () => [...completedCounts.values()].reduce((a, b) => a + b, 0),
    [completedCounts],
  );

  const colStep = cell + gap;

  return (
    <div className={compact ? "" : "overflow-x-auto"}>
      <div className={compact ? "" : "inline-block"}>
        {/* Подписи месяцев */}
        <div className="relative h-4 text-[10px] text-slate-500" style={{ marginLeft: gutter }}>
          {monthLabels.map((m, i) => (
            <span key={i} className="absolute top-0" style={{ left: m.index * colStep }}>
              {m.text}
            </span>
          ))}
        </div>

        <div className="flex" style={{ gap }}>
          {/* Дни недели */}
          {!compact && (
            <div className="flex flex-col text-[10px] text-slate-500" style={{ width: 32, marginRight: 4, gap }}>
              {DAY_LABELS.map((l, i) => (
                <span key={i} className="flex items-center" style={{ height: cell }}>
                  {l}
                </span>
              ))}
            </div>
          )}

          {/* Столбцы-недели */}
          {grid.map((col) => (
            <div key={col.key} className="flex flex-col" style={{ gap }}>
              {col.cells.map((cellData) => {
                const future = cellData.date.getTime() > Date.now();
                const lvl = future ? 0 : levelFor(cellData.count);
                return (
                  <div
                    key={cellData.key}
                    title={
                      future
                        ? cellData.key
                        : `${cellData.key}: выполнено ${cellData.count}`
                    }
                    className={LEVELS[lvl]}
                    style={{ width: cell, height: cell, borderRadius: 3 }}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {!compact && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500">
            <span>Меньше</span>
            {LEVELS.map((l, i) => (
              <span key={i} className={l} style={{ width: 11, height: 11, borderRadius: 3 }} />
            ))}
            <span>Больше</span>
            <span className="ml-2">
              · {totalDone} {totalDone === 1 ? "задача" : "задач"} выполнено за период
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
