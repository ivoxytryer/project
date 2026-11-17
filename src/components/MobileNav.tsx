import type { View } from "../types";

interface MobileNavProps {
  view: View;
  onNavigate: (view: View) => void;
}

export function MobileNav({ view, onNavigate }: MobileNavProps) {
  const item = (target: View, label: string, icon: React.ReactNode) => (
    <button
      onClick={() => onNavigate(target)}
      className={`flex flex-col items-center justify-center gap-1.5 py-2.5 text-[10px] uppercase tracking-[0.14em] transition-colors ${
        view === target ? "text-bone" : "text-faint hover:text-muted"
      }`}
      aria-current={view === target ? "page" : undefined}
    >
      <span className={`block h-px w-6 ${view === target ? "bg-bone" : "bg-transparent"}`} />
      {icon}
      {label}
    </button>
  );

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ink pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-2">
        {item(
          "tasks",
          "Задачи",
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3.5" y="4.5" width="17" height="16" />
            <path d="m8 12 2.5 2.5L16 9" strokeLinecap="square" />
          </svg>,
        )}
        {item(
          "dashboard",
          "Дашборд",
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 20V10M10 20V4M16 20v-8M22 20H2" strokeLinecap="square" />
          </svg>,
        )}
      </div>
    </nav>
  );
}
