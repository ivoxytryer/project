import type { View } from "../types";
import { useStore } from "../store";
import { plural } from "../utils/helpers";
import { Logo } from "./Logo";

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
      className={`flex w-full items-center gap-3 px-3 py-2 text-left text-[13px] transition-colors ${
        view === target
          ? "bg-panel text-bone"
          : "text-muted hover:bg-panel hover:text-bone"
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-ink md:flex">
      <div className="flex items-center gap-3 border-b border-line px-5 py-5">
        <Logo className="h-6 w-6 text-bone" />
        <div>
          <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-bone">
            Study Tracker
          </div>
          <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
            личный прогресс
          </div>
        </div>
      </div>

      <nav className="space-y-0.5 p-3">
        {navBtn(
          "tasks",
          "Задачи",
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3.5" y="4.5" width="17" height="16" />
            <path d="m8 12 2.5 2.5L16 9" strokeLinecap="square" />
          </svg>,
        )}
        {navBtn(
          "dashboard",
          "Дашборд",
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 20V10M10 20V4M16 20v-8M22 20H2" strokeLinecap="square" />
          </svg>,
        )}
      </nav>

      <div className="flex-1" />

      <div className="border-t border-line px-5 py-3 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
        {openCount} {plural(openCount, "открытая задача", "открытые задачи", "открытых задач")}
      </div>

      {mode === "cloud" && (
        <div className="border-t border-line px-5 py-3">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
            <span className="h-1.5 w-1.5 bg-bone" />
            облако
          </div>
          <div className="mt-1.5 truncate font-mono text-[11px] text-muted" title={userEmail ?? ""}>
            {userEmail}
          </div>
          <button
            onClick={() => void signOut()}
            className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-faint transition-colors hover:text-bone"
          >
            Выйти
          </button>
        </div>
      )}
    </aside>
  );
}
