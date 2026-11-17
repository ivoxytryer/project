import type { View } from "../types";
import { useStore } from "../store";
import { plural } from "../utils/helpers";

interface SidebarProps {
  view: View;
  onNavigate: (view: View) => void;
}

export function Sidebar({ view, onNavigate }: SidebarProps) {
  const { state, mode, userEmail, signOut } = useStore();
  const openCount = state.tasks.filter((t) => !t.completed).length;

  const navBtn = (target: View, label: string, icon: React.ReactNode) => (
    <button
      onClick={() => onNavigate(target)}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition
        ${
          view === target
            ? "bg-white/10 text-white shadow-inner"
            : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
        }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-white/5 bg-black/20 backdrop-blur-xl md:flex">
      {/* Логотип */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 text-lg shadow-lg shadow-sky-500/20">
          🌧️
        </div>
        <div>
          <div className="text-sm font-semibold text-white">Study Tracker</div>
          <div className="text-[11px] text-slate-500">личный прогресс</div>
        </div>
      </div>

      {/* Навигация */}
      <nav className="space-y-1 px-3">
        {navBtn(
          "tasks",
          "Задачи",
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="3" />
            <path d="m8 12 2.5 2.5L16 9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>,
        )}
        {navBtn(
          "dashboard",
          "Дашборд",
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 20V10M10 20V4M16 20v-8M22 20H2" strokeLinecap="round" />
          </svg>,
        )}
      </nav>

      <div className="flex-1" />

      <div className="border-t border-white/5 px-5 py-3 text-[11px] text-slate-600">
        {openCount} {plural(openCount, "открытая задача", "открытые задачи", "открытых задач")}
      </div>

      {mode === "cloud" && (
        <div className="border-t border-white/5 px-5 py-3">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            облако
          </div>
          <div className="mt-1 truncate text-[11px] text-slate-400" title={userEmail ?? ""}>
            {userEmail}
          </div>
          <button
            onClick={() => void signOut()}
            className="mt-1 text-[11px] text-slate-500 transition hover:text-slate-200"
          >
            Выйти
          </button>
        </div>
      )}
    </aside>
  );
}
