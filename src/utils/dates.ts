/** Утилиты для работы с датами в локальном часовом поясе. */

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function addDays(date: Date, amount: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

export function shiftDateKey(key: string, amount: number): string {
  return toDateKey(addDays(fromDateKey(key), amount));
}

const WEEKDAYS_SHORT = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
const MONTHS_GEN = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];
const MONTHS_NOM = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

export function formatDayLabel(key: string): string {
  const date = fromDateKey(key);
  const today = todayKey();
  if (key === today) return "Сегодня";
  if (key === shiftDateKey(today, -1)) return "Вчера";
  if (key === shiftDateKey(today, 1)) return "Завтра";
  const wd = WEEKDAYS_SHORT[date.getDay()];
  return `${date.getDate()} ${MONTHS_GEN[date.getMonth()]}, ${wd}`;
}

export function formatShortDate(key: string): string {
  const date = fromDateKey(key);
  return `${date.getDate()} ${MONTHS_GEN[date.getMonth()]}`;
}

export function formatMonthYear(date: Date): string {
  return `${MONTHS_NOM[date.getMonth()]} ${date.getFullYear()}`;
}

export function weekdayIndex(date: Date): number {
  // Понедельник = 0 … Воскресенье = 6 (для heatmap-сетки).
  return (date.getDay() + 6) % 7;
}

export function startOfWeek(date: Date): Date {
  // Понедельник текущей недели.
  const idx = weekdayIndex(date);
  return addDays(date, -idx);
}

export function isSameDay(a: Date, b: Date): boolean {
  return toDateKey(a) === toDateKey(b);
}
