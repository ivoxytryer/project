export interface Task {
  id: string;
  title: string;
  /** Дата в формате YYYY-MM-DD (локальная). */
  date: string;
  completed: boolean;
  completedAt: string | null;
  createdAt: string;
}

export interface AppState {
  tasks: Task[];
}

export type View = "tasks" | "dashboard";
