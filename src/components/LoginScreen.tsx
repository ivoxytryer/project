import { useState, type FormEvent } from "react";

interface LoginScreenProps {
  onSignIn: (email: string) => Promise<{ error: string | null }>;
  onSignInPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  onSignUpPassword: (email: string, password: string) => Promise<{ error: string | null }>;
}

type Method = "password" | "link";
type PasswordMode = "signin" | "signup";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20";

export function LoginScreen({ onSignIn, onSignInPassword, onSignUpPassword }: LoginScreenProps) {
  const [method, setMethod] = useState<Method>("password");
  const [mode, setMode] = useState<PasswordMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const switchMethod = (next: Method) => {
    setMethod(next);
    setError(null);
    setSentTo(null);
  };

  const submitPassword = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;

    const mail = email.trim();
    if (!mail || password.length < 6) {
      setError("Введите email и пароль не короче 6 символов");
      return;
    }

    setBusy(true);
    setError(null);
    const result =
      mode === "signin"
        ? await onSignInPassword(mail, password)
        : await onSignUpPassword(mail, password);
    setBusy(false);

    if (result.error) setError(result.error);
  };

  const submitLink = async (event: FormEvent) => {
    event.preventDefault();
    const mail = email.trim();
    if (!mail || busy) return;

    setBusy(true);
    setError(null);
    const result = await onSignIn(mail);
    setBusy(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    setSentTo(mail);
  };

  return (
    <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-6 text-slate-200 sm:px-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 text-xl shadow-lg shadow-sky-500/20">
            🌧️
          </div>
          <div>
            <div className="text-lg font-semibold text-white">Study Tracker</div>
            <div className="text-xs text-slate-500">личный прогресс в облаке</div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur sm:p-6">
          <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-black/30 p-1 text-xs">
            <button
              type="button"
              onClick={() => switchMethod("password")}
              className={`rounded-lg px-3 py-2 transition ${
                method === "password"
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Пароль
            </button>
            <button
              type="button"
              onClick={() => switchMethod("link")}
              className={`rounded-lg px-3 py-2 transition ${
                method === "link" ? "bg-white/10 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Ссылка на почту
            </button>
          </div>

          {method === "password" ? (
            <form onSubmit={submitPassword} className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-xs text-slate-400">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-xs text-slate-400">
                  Пароль
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="минимум 6 символов"
                  className={inputClass}
                />
              </div>

              {error && (
                <p className="rounded-lg border border-red-500/30 bg-red-950/40 px-3 py-2 text-xs text-red-200">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-3 py-2.5 text-sm font-medium text-white transition hover:from-sky-400 hover:to-indigo-400 disabled:opacity-50"
              >
                {busy ? "Подождите…" : mode === "signin" ? "Войти" : "Создать аккаунт"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode(mode === "signin" ? "signup" : "signin");
                  setError(null);
                }}
                className="w-full text-center text-xs text-sky-400 transition hover:text-sky-300"
              >
                {mode === "signin"
                  ? "Первый раз? Создать аккаунт"
                  : "Уже есть аккаунт? Войти"}
              </button>
            </form>
          ) : sentTo ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-200">
                Ссылка для входа отправлена на <b>{sentTo}</b>.
              </p>
              <p className="text-xs leading-relaxed text-slate-400">
                Откройте письмо на этом устройстве и перейдите по ссылке. У встроенной
                почты Supabase есть лимит писем в час — если не пришло, подождите или
                используйте вход по паролю.
              </p>
              <button
                onClick={() => {
                  setSentTo(null);
                  setEmail("");
                }}
                className="text-xs text-sky-400 hover:text-sky-300"
              >
                Указать другую почту
              </button>
            </div>
          ) : (
            <form onSubmit={submitLink} className="space-y-4">
              <div>
                <label htmlFor="email-link" className="mb-1.5 block text-xs text-slate-400">
                  Email
                </label>
                <input
                  id="email-link"
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className={inputClass}
                />
              </div>

              {error && (
                <p className="rounded-lg border border-red-500/30 bg-red-950/40 px-3 py-2 text-xs text-red-200">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-3 py-2.5 text-sm font-medium text-white transition hover:from-sky-400 hover:to-indigo-400 disabled:opacity-50"
              >
                {busy ? "Отправляем…" : "Войти по ссылке"}
              </button>

              <p className="text-center text-[11px] leading-relaxed text-slate-500">
                Пароль не нужен, но у бесплатного SMTP есть лимит писем.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
