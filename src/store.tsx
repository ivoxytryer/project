import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import type { AppState, Task } from "./types";
import { uid } from "./utils/helpers";
import { isRemoteEnabled, supabase } from "./lib/supabase";
import {
  deleteTaskRemote,
  fetchTasks,
  insertTasks,
  updateTaskRemote,
} from "./lib/tasks-api";
import { LoginScreen } from "./components/LoginScreen";

const STORAGE_KEY = "study-tracker:state:v1";
const MIGRATED_KEY = "study-tracker:migrated:v1";

type Action =
  | { type: "ADD_TASK"; title: string; date: string; id?: string; createdAt?: string }
  | { type: "TOGGLE_TASK"; id: string }
  | { type: "RENAME_TASK"; id: string; title: string }
  | { type: "MOVE_TASK"; id: string; date: string }
  | { type: "DELETE_TASK"; id: string }
  | { type: "REPLACE_TASKS"; tasks: Task[] };

type Status = "local" | "loading" | "ready" | "error";
type Mode = "local" | "cloud";

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "ADD_TASK":
      return {
        ...state,
        tasks: [
          ...state.tasks,
          {
            id: action.id ?? uid(),
            title: action.title,
            date: action.date,
            completed: false,
            completedAt: null,
            createdAt: action.createdAt ?? new Date().toISOString(),
          },
        ],
      };

    case "TOGGLE_TASK":
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.id
            ? {
                ...t,
                completed: !t.completed,
                completedAt: !t.completed ? new Date().toISOString() : null,
              }
            : t,
        ),
      };

    case "RENAME_TASK":
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.id ? { ...t, title: action.title } : t,
        ),
      };

    case "MOVE_TASK":
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.id ? { ...t, date: action.date } : t,
        ),
      };

    case "DELETE_TASK":
      return {
        ...state,
        tasks: state.tasks.filter((t) => t.id !== action.id),
      };

    case "REPLACE_TASKS":
      return { tasks: action.tasks };

    default:
      return state;
  }
}

function loadLocalState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { tasks: [] };
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
    };
  } catch {
    return { tasks: [] };
  }
}

function toMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return "Не удалось синхронизироваться с Supabase";
}

function translateAuthError(message: string): string {
  const text = message.toLowerCase();
  if (text.includes("invalid login credentials")) return "Неверный email или пароль";
  if (text.includes("user already registered"))
    return "Такой email уже зарегистрирован. Если пароль не подходит — удалите пользователя в Supabase → Authentication → Users и создайте аккаунт заново";
  if (text.includes("password should be at least"))
    return "Пароль слишком короткий (минимум 6 символов)";
  if (text.includes("email not confirmed"))
    return "Email не подтверждён. Отключите «Confirm email» в Supabase → Authentication → Sign In / Providers → Email";
  if (text.includes("rate limit") || text.includes("too many"))
    return "Слишком много попыток. Подождите пару минут";
  if (text.includes("unable to validate email")) return "Некорректный email";
  return message;
}

/** Переносит задачи из localStorage в облако один раз — при первом входе. */
async function migrateLocalTasks(userId: string): Promise<Task[]> {
  if (localStorage.getItem(MIGRATED_KEY)) return [];

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(MIGRATED_KEY, "1");
    return [];
  }

  let tasks: Task[] = [];
  try {
    const parsed = JSON.parse(raw) as Partial<AppState>;
    tasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
  } catch {
    tasks = [];
  }

  if (!tasks.length) {
    localStorage.setItem(MIGRATED_KEY, "1");
    return [];
  }

  try {
    await insertTasks(tasks, userId);
    localStorage.setItem(MIGRATED_KEY, "1");
    return await fetchTasks(userId);
  } catch {
    // не ставим флаг — попробуем перенести при следующем входе
    return [];
  }
}

interface StoreContextValue {
  state: AppState;
  dispatch: (action: Action) => void;
  mode: Mode;
  userEmail: string | null;
  status: Status;
  error: string | null;
  signIn: (email: string) => Promise<{ error: string | null }>;
  signInPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

function BootScreen() {
  return (
    <div className="flex h-full items-center justify-center bg-slate-950 text-slate-300">
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
        Подключение к Supabase…
      </div>
    </div>
  );
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, rawDispatch] = useReducer(reducer, undefined, loadLocalState);
  const stateRef = useRef(state);
  stateRef.current = state;

  const [session, setSession] = useState<Session | null | undefined>(
    isRemoteEnabled ? undefined : null,
  );
  const [status, setStatus] = useState<Status>(isRemoteEnabled ? "loading" : "local");
  const [error, setError] = useState<string | null>(null);
  const reloadTimer = useRef<number | undefined>(undefined);

  // Локальный кэш: работает и как офлайн-резерв, и как режим без Supabase.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore quota errors */
    }
  }, [state]);

  useEffect(() => {
    if (!isRemoteEnabled || !supabase) return;
    const client = supabase;
    let active = true;

    client.auth.getSession().then(({ data }) => {
      if (active) setSession(data.session);
    });

    const { data: subscription } = client.auth.onAuthStateChange(
      (_event, nextSession) => setSession(nextSession),
    );

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  // Загрузка задач и первичная миграция из localStorage
  useEffect(() => {
    if (!isRemoteEnabled || !supabase || !session?.user) return;
    const userId = session.user.id;
    let cancelled = false;

    setStatus("loading");
    (async () => {
      try {
        let tasks = await fetchTasks(userId);
        if (!tasks.length) {
          tasks = await migrateLocalTasks(userId);
        }
        if (!cancelled) {
          rawDispatch({ type: "REPLACE_TASKS", tasks });
          setStatus("ready");
        }
      } catch (err) {
        if (!cancelled) {
          setError(toMessage(err));
          setStatus("error");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  // Realtime: изменения на телефоне/другом ПК подтягиваются автоматически
  useEffect(() => {
    if (!isRemoteEnabled || !supabase || !session?.user) return;
    const client = supabase;
    const userId = session.user.id;

    const channel = client
      .channel(`tasks-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks", filter: `user_id=eq.${userId}` },
        () => {
          window.clearTimeout(reloadTimer.current);
          reloadTimer.current = window.setTimeout(() => {
            fetchTasks(userId)
              .then((tasks) => rawDispatch({ type: "REPLACE_TASKS", tasks }))
              .catch(() => {
                /* тихо игнорируем — следующее изменение повторит попытку */
              });
          }, 200);
        },
      )
      .subscribe();

    return () => {
      window.clearTimeout(reloadTimer.current);
      void client.removeChannel(channel);
    };
  }, [session?.user?.id]);

  const resync = useCallback(async (userId: string) => {
    try {
      const tasks = await fetchTasks(userId);
      rawDispatch({ type: "REPLACE_TASKS", tasks });
    } catch {
      /* оставляем оптимистичное состояние */
    }
  }, []);

  const dispatch = useCallback(
    (action: Action) => {
      const client = supabase;
      const user = session?.user;
      if (!isRemoteEnabled || !client || !user) {
        rawDispatch(action);
        return;
      }

      const userId = user.id;
      const fail = (err: unknown) => {
        setError(toMessage(err));
        void resync(userId);
      };

      if (action.type === "ADD_TASK") {
        const id = action.id ?? uid();
        const createdAt = action.createdAt ?? new Date().toISOString();
        const title = action.title.trim();
        rawDispatch({ ...action, title, id, createdAt });
        const task: Task = {
          id,
          title,
          date: action.date,
          completed: false,
          completedAt: null,
          createdAt,
        };
        void insertTasks([task], userId).catch(fail);
        return;
      }

      if (action.type === "TOGGLE_TASK") {
        const task = stateRef.current.tasks.find((t) => t.id === action.id);
        rawDispatch(action);
        if (task) {
          const completed = !task.completed;
          const completedAt = completed ? new Date().toISOString() : null;
          void updateTaskRemote(action.id, { completed, completedAt }).catch(fail);
        }
        return;
      }

      if (action.type === "RENAME_TASK") {
        rawDispatch({ ...action, title: action.title.trim() });
        void updateTaskRemote(action.id, { title: action.title.trim() }).catch(fail);
        return;
      }

      if (action.type === "MOVE_TASK") {
        rawDispatch(action);
        void updateTaskRemote(action.id, { date: action.date }).catch(fail);
        return;
      }

      if (action.type === "DELETE_TASK") {
        rawDispatch(action);
        void deleteTaskRemote(action.id).catch(fail);
        return;
      }

      rawDispatch(action);
    },
    [session?.user, resync],
  );

  const signIn = useCallback(async (email: string) => {
    if (!supabase) return { error: "Supabase не настроен" };
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: window.location.origin + import.meta.env.BASE_URL,
      },
    });
    return { error: authError?.message ?? null };
  }, []);

  const signInPassword = useCallback(async (email: string, password: string) => {
    if (!supabase) return { error: "Supabase не настроен" };
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    return { error: authError ? translateAuthError(authError.message) : null };
  }, []);

  const signUpPassword = useCallback(async (email: string, password: string) => {
    if (!supabase) return { error: "Supabase не настроен" };
    const { data, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    if (authError) return { error: translateAuthError(authError.message) };
    if (!data.session) {
      return {
        error:
          "Аккаунт создан, но вход не выполнен: включено подтверждение email. Отключите «Confirm email» в Supabase → Authentication → Sign In / Providers → Email",
      };
    }
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut();
    rawDispatch({ type: "REPLACE_TASKS", tasks: [] });
  }, []);

  const value = useMemo<StoreContextValue>(
    () => ({
      state,
      dispatch,
      mode: isRemoteEnabled ? "cloud" : "local",
      userEmail: session?.user?.email ?? null,
      status,
      error,
      signIn,
      signInPassword,
      signUpPassword,
      signOut,
      clearError: () => setError(null),
    }),
    [state, dispatch, session, status, error, signIn, signInPassword, signUpPassword, signOut],
  );

  let content: ReactNode = children;
  if (isRemoteEnabled) {
    if (session === undefined) content = <BootScreen />;
    else if (!session)
      content = (
        <LoginScreen
          onSignIn={signIn}
          onSignInPassword={signInPassword}
          onSignUpPassword={signUpPassword}
        />
      );
  }

  return <StoreContext.Provider value={value}>{content}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
