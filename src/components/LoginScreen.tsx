import { useState, type FormEvent } from "react";
import { Logo } from "./Logo";

interface LoginScreenProps {
  onSignIn: (email: string) => Promise<{ error: string | null }>;
  onSignInPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  onSignUpPassword: (email: string, password: string) => Promise<{ error: string | null }>;
}

type Method = "password" | "link";
type PasswordMode = "signin" | "signup";

const inputClass =
  "h-11 w-full border border-line bg-ink px-3 text-[15px] text-bone transition-colors outline-none placeholder:text-faint";

const labelClass =
  "mb-2 block font-mono text-[10px] uppercase tracking-[0.14em] text-muted";

const primaryClass =
  "h-11 w-full bg-bone font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-ink transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40";

const linkClass =
  "py-2 text-[12px] text-muted underline decoration-line-strong underline-offset-4 transition-colors hover:text-bone hover:decoration-bone";

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

  const errorNote = error ? (
    <p
      role="alert"
      className="border border-danger/40 bg-danger/10 px-3 py-2 text-xs leading-relaxed text-danger"
    >
      {error}
    </p>
  ) : null;

  return (
    <div className="flex h-full items-center justify-center overflow-y-auto bg-ink px-5 py-10">
      <div className="w-full max-w-[22rem]">
        <div className="flex items-center gap-3">
          <Logo className="h-7 w-7 shrink-0 text-bone" />
          <div className="min-w-0">
            <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-bone">
              Study Tracker
            </div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
              личный прогресс в облаке
            </div>
          </div>
        </div>

        <div className="mt-7 border border-line bg-panel">
          <div className="grid grid-cols-2">
            <button
              type="button"
              onClick={() => switchMethod("password")}
              aria-pressed={method === "password"}
              className={`h-11 border-r border-b border-r-line font-mono text-[10px] uppercase tracking-[0.14em] transition-colors ${
                method === "password"
                  ? "border-b-bone bg-panel-strong text-bone"
                  : "border-b-line text-faint hover:bg-panel-strong/60 hover:text-bone"
              }`}
            >
              Пароль
            </button>
            <button
              type="button"
              onClick={() => switchMethod("link")}
              aria-pressed={method === "link"}
              className={`h-11 border-b font-mono text-[10px] uppercase tracking-[0.14em] transition-colors ${
                method === "link"
                  ? "border-b-bone bg-panel-strong text-bone"
                  : "border-b-line text-faint hover:bg-panel-strong/60 hover:text-bone"
              }`}
            >
              Ссылка на почту
            </button>
          </div>

          <div className="p-5">
            {method === "password" ? (
              <form onSubmit={submitPassword} className="space-y-4" aria-busy={busy}>
                <div>
                  <label htmlFor="email" className={labelClass}>
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    autoFocus
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="password" className={labelClass}>
                    Пароль
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="минимум 6 символов"
                    className={inputClass}
                  />
                </div>

                {errorNote}

                <button type="submit" disabled={busy} className={primaryClass}>
                  {busy ? "Подождите…" : mode === "signin" ? "Войти" : "Создать аккаунт"}
                </button>

                <div className="-mb-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setMode(mode === "signin" ? "signup" : "signin");
                      setError(null);
                    }}
                    className={linkClass}
                  >
                    {mode === "signin"
                      ? "Первый раз? Создать аккаунт"
                      : "Уже есть аккаунт? Войти"}
                  </button>
                </div>
              </form>
            ) : sentTo ? (
              <div className="space-y-4">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                    Ссылка отправлена на
                  </div>
                  <div className="mt-1.5 break-all font-mono text-[13px] text-bone">
                    {sentTo}
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-muted">
                  Откройте письмо на этом устройстве и перейдите по ссылке. У встроенной
                  почты Supabase есть лимит писем в час — если не пришло, подождите или
                  используйте вход по паролю.
                </p>
                <div className="-my-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSentTo(null);
                      setEmail("");
                    }}
                    className={linkClass}
                  >
                    Указать другую почту
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={submitLink} className="space-y-4" aria-busy={busy}>
                <div>
                  <label htmlFor="email-link" className={labelClass}>
                    Email
                  </label>
                  <input
                    id="email-link"
                    type="email"
                    required
                    autoFocus
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className={inputClass}
                  />
                </div>

                {errorNote}

                <button type="submit" disabled={busy} className={primaryClass}>
                  {busy ? "Отправляем…" : "Войти по ссылке"}
                </button>

                <p className="text-[11px] leading-relaxed text-faint">
                  Пароль не нужен, но у бесплатного SMTP есть лимит писем.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
