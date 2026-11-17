# Supabase: облачный режим и GitHub Pages

Приложение умеет работать в двух режимах:

| Режим | Когда включается | Где данные |
|---|---|---|
| Локальный | нет `.env.local` с ключами | `localStorage` браузера |
| Облачный | заданы `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY` | Postgres в Supabase, общий для всех устройств |

В облачном режиме вход по email-ссылке (magic link), пароль не нужен. Задачи видны
на ПК и телефоне после входа с одним и тем же email.

---

## 1. Создать проект

1. Зайдите на [supabase.com](https://supabase.com) → **New project**.
2. Задайте имя, пароль БД, регион (ближайший, например Frankfurt).
3. Дождитесь создания проекта.

## 2. Создать таблицу

Supabase → **SQL Editor** → **New query** → вставьте содержимое
[`supabase/schema.sql`](supabase/schema.sql) → **Run**.

Скрипт создаёт таблицу `tasks`, включает RLS (каждый видит только свои задачи)
и добавляет таблицу в Realtime.

## 3. Настроить вход

Supabase → **Authentication** → **Sign In / Providers** → **Email**:

- включите провайдер **Email**;
- **выключите `Confirm email`** — тогда регистрация по паролю входит сразу, без писем;
- **Save**.

Supabase → **Authentication** → **URL Configuration**:

- **Site URL**: `http://localhost:5173` (на время разработки).
- **Redirect URLs**: добавьте
  - `http://localhost:5173/**`
  - `http://<IP-ПК>:5173/**` — если открываете с телефона по локальной сети
  - `https://<ваш-логин>.github.io/<репозиторий>/**` — для GitHub Pages

> Вход по email-ссылке (magic link) остаётся как второй способ, но у встроенного SMTP
> Supabase жёсткий лимит — около 2 писем в час. Поэтому основной способ — пароль.

### Если аккаунт уже создавался по ссылке

У такого пользователя нет пароля, и войти с паролем не получится. Удалите его:
Supabase → **Authentication → Users** → `…` → **Delete user**, затем в трекере
зарегистрируйтесь заново с тем же email.

## 4. Подключить ключи локально

Project Settings → **API** → скопируйте:

- **Project URL**
- **anon public** key (именно `anon`, не `service_role`)

Создайте файл `.env.local` в корне проекта:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Перезапустите dev-сервер:

```powershell
npm run dev
```

Откроется экран входа. Введите email, перейдите по ссылке из письма — задачи
загрузятся из облака. Если в `localStorage` уже были задачи, при первом входе
они один раз перенесутся в базу (флаг `study-tracker:migrated:v1`).

## 5. Выложить на GitHub Pages

1. Запушьте проект в GitHub-репозиторий (ветка `main`).
2. Репозиторий → **Settings** → **Pages** → **Build and deployment** →
   **Source: GitHub Actions**.
3. Запушьте в `main` — workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)
   соберёт и опубликует сайт. Base-path подставляется автоматически:
   `/имя-репозитория/`, а для сайта `user.github.io` — `/`.
4. Адрес сайта: `https://<логин>.github.io/<репозиторий>/`.

Параметры Supabase для сборки лежат в [`.env.production`](.env.production).
Publishable-ключ публичный по дизайну Supabase и защищён RLS, поэтому его можно
держать в репозитории. Если не хотите — уберите файл и задайте
`VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY` в
**Settings → Secrets and variables → Actions**, а в workflow верните блок `env:`.

После первого деплоя добавьте адрес Pages в **Redirect URLs** Supabase
(Authentication → URL Configuration), иначе ссылка из письма приведёт не туда.
Для входа по паролю это не требуется.

---

## Как это устроено в коде

| Файл | Роль |
|---|---|
| `src/lib/supabase.ts` | клиент Supabase; если ключей нет — `null` и локальный режим |
| `src/lib/tasks-api.ts` | CRUD-запросы к таблице `tasks` |
| `src/store.tsx` | единый стор: оптимистичные обновления, realtime, миграция |
| `src/components/LoginScreen.tsx` | вход по email-ссылке |

`dispatch` остался прежним, поэтому компоненты не пришлось переписывать: изменения
сразу применяются локально, затем уходят в Supabase. Если запрос упал — показывается
баннер и состояние перечитывается из базы.

Realtime-подписка обновляет список при изменениях на другом устройстве (задержка
~200 мс).

---

## Безопасность

- В фронтенд попадает только **anon** key — это нормально: доступ ограничивают
  RLS-политики `auth.uid() = user_id`.
- **service_role** key в браузер класть нельзя никогда.
- Пока RLS включён, чужой пользователь не прочитает и не изменит ваши задачи,
  даже зная URL и anon key.
- Если позже понадобится «общий список для нескольких людей», добавьте таблицу
  `workspaces` и политику членства — текущая схема рассчитана на личный трекер.

---

## Если что-то не работает

| Симптом | Причина / решение |
|---|---|
| Приложение пустое, но ключи заданы | не выполнен `schema.sql`; смотрите консоль браузера |
| Письмо не приходит | проверьте папку «Спам»; у бесплатного SMTP лимит писем в час |
| Ссылка ведёт на localhost с телефона | добавьте адрес Pages в Redirect URLs Supabase |
| Изменения не приходят с другого устройства | не выполнена строка `alter publication supabase_realtime add table public.tasks` |
| Ошибка `row-level security policy` | `user_id` не совпадает с `auth.uid()` — войдите заново |
