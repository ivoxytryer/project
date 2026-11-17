import { useState } from "react";
import type { View } from "./types";
import { Sidebar } from "./components/Sidebar";
import { TasksView } from "./components/TasksView";
import { DashboardView } from "./components/DashboardView";
import { MobileNav } from "./components/MobileNav";
import { Logo } from "./components/Logo";
import { useStore } from "./store";

export default function App() {
  const [view, setView] = useState<View>("tasks");
  const { error, clearError, mode, signOut } = useStore();

  return (
    <div className="relative flex h-full flex-col bg-ink text-bone md:flex-row">
      <Sidebar view={view} onNavigate={setView} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-line px-4 py-3 md:hidden">
          <div className="flex items-center gap-2.5">
            <Logo className="h-5 w-5 text-bone" />
            <div className="text-[12px] font-semibold uppercase tracking-[0.16em]">
              Study Tracker
            </div>
          </div>
          {mode === "cloud" && (
            <button
              onClick={() => void signOut()}
              className="px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted transition-colors hover:text-bone"
            >
              Выйти
            </button>
          )}
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto pb-24 md:pb-0">
          {view === "tasks" ? <TasksView /> : <DashboardView />}
        </main>
      </div>

      <MobileNav view={view} onNavigate={setView} />

      {error && (
        <div className="fixed bottom-20 right-4 z-50 max-w-sm border border-danger bg-ink px-4 py-3 text-xs text-danger md:bottom-4">
          <div className="flex items-start gap-3">
            <span className="flex-1">{error}</span>
            <button
              onClick={clearError}
              className="shrink-0 text-danger transition-opacity hover:opacity-70"
              aria-label="Закрыть"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
