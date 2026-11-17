import type { View } from "../types";

interface MobileNavProps {
  view: View;
  onNavigate: (view: View) => void;
}

export function MobileNav({ view, onNavigate }: MobileNavProps) {
  const item = (target: View, label: string, icon: React.ReactNode) => (
    <button
      onClick={() => onNavigate(target)}
      className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition ${
        view === target ? "text-sky-400" : "text-slate-500 hover:text-slate-300"
      }`}
      aria-current={view === target ? "page" : undefined}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-slate-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-2">
        {item(
          "tasks",
          "Задачи",
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="3" />
            <path d="m8 12 2.5 2.5L16 9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>,
        )}
        {item(
          "dashboard",
          "Дашборд",
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 20V10M10 20V4M16 20v-8M22 20H2" strokeLinecap="round" />
          </svg>,
        )}
      </div>
    </nav>
  );
}
