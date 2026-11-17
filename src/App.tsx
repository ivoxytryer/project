import { useState } from "react";
import type { View } from "./types";
import { RainBackground } from "./components/RainBackground";
import { Sidebar } from "./components/Sidebar";
import { TasksView } from "./components/TasksView";
import { DashboardView } from "./components/DashboardView";
import { useStore } from "./store";
import { MobileNav } from "./components/MobileNav";

export default function App() {
  const [view, setView] = useState<View>("tasks");
  const { error, clearError, mode, signOut } = useStore();

  return (
    <div className="relative flex h-full flex-col text-slate-200 md:flex-row">
      <RainBackground />

      <Sidebar view={view} onNavigate={setView} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-white/5 bg-black/20 px-4 py-2.5 backdrop-blur-xl md:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 text-base shadow-lg shadow-sky-500/20">
              🌧️
            </div>
            <div className="text-sm font-semibold text-white">Study Tracker</div>
          </div>
          {mode === "cloud" && (
            <button
              onClick={() => void signOut()}
              className="rounded-lg px-2.5 py-1.5 text-xs text-slate-400 transition hover:bg-white/5 hover:text-slate-200"
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
        <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-xl border border-red-500/30 bg-red-950/80 px-4 py-3 text-sm text-red-100 shadow-lg backdrop-blur">
          <div className="flex items-start gap-3">
            <span className="flex-1">{error}</span>
            <button
              onClick={clearError}
              className="shrink-0 text-red-300 transition hover:text-white"
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
