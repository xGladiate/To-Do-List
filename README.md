# To-do List

A local-first task manager built with Vite, TypeScript, vanilla HTML/CSS,
browser local storage, optional Chrome reminders, and optional Supabase sync.

## Requirements

- Node.js 20.19 or newer
- npm

## Run locally

From this project folder, install the dependencies once:

```sh
npm install
```

Start the development server:

```sh
npm run dev
```

Open the local address printed in the terminal, normally
`http://localhost:5173`.

Tasks are saved automatically in your browser's local storage. They remain
available after refreshing or reopening the app in the same browser. Clearing
site data will remove them.

## Chrome reminders

Click **Enable reminders** in the app header and allow notifications when
Chrome asks. The app checks active tasks every 30 seconds and sends one Chrome
notification when a task is within 15 minutes of its deadline or became
overdue within the last hour.

Reminders use `public/sw.js` and work while the app is open, including in a
background tab. `localhost` is accepted during development. A deployed app
must use HTTPS. Reliable reminders after every app tab and Chrome itself are
closed require a future Web Push backend; this version intentionally does not
claim that capability.

## Supabase setup

Supabase is optional. Without configuration, the app displays **Local only**
and continues using local storage normally.

### 1. Create and prepare the project

1. Create a project at [supabase.com](https://supabase.com/).
2. Open **SQL Editor**, create a query, paste the entire contents of
   `supabase/schema.sql`, and run it.
3. Open the project's Authentication settings and enable
   **Allow anonymous sign-ins**.

The schema creates:

- `public.tasks`, containing normalized task records.
- `public.game_states`, containing one JSON garden state per user.
- Row Level Security policies that only allow an authenticated user to read
  and modify rows whose `user_id` matches `auth.uid()`.

### 2. Add the browser-safe API values

Copy `.env.example` to a new file named `.env.local` in the project root:

```sh
copy .env.example .env.local
```

In Supabase, open the project's **Connect** dialog or **Settings > API Keys**.
Fill in `.env.local` with the project URL and publishable key:

```dotenv
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key_here
```

Use the publishable key in this browser application. Never place a Supabase
secret key or legacy `service_role` key in a `VITE_` variable; those keys
bypass Row Level Security and belong only on a trusted server.

Restart `npm run dev` after creating or changing `.env.local`. The header will
change from **Local only** to **Cloud synced** when the connection succeeds.

### Current sync behavior

The app signs in anonymously, so every browser profile receives its own private
Supabase user ID. If that user's cloud tables are empty, existing local tasks
and garden progress are uploaded. If cloud state already exists, it becomes the
local state. Later, anonymous accounts can be upgraded to email or OAuth login
for dependable cross-device access.

## Login setup

The app supports email/password accounts and Google account login through
Supabase. Google is used only for authentication; the app does not request
Google Calendar access.

To enable Google login:

1. In Google Cloud, configure the OAuth consent screen and create a **Web
   application** OAuth client.
2. Add the Supabase callback shown on the Supabase Google provider page as an
   authorized redirect URI. It has this form:

   ```text
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   ```

3. Open **Authentication > Providers > Google** in Supabase, enable it, and
   paste the Google Client ID and Client Secret.
4. In Supabase URL configuration, use `http://localhost:5173` as the Site URL
   during local development. Add both local addresses to the allowed redirect
   URLs because Vite or your browser may use either one:

   ```text
   http://localhost:5173
   http://127.0.0.1:5173
   ```
5. Keep **Allow anonymous sign-ins** enabled.
6. Enable **Allow manual linking** so an existing guest or email account can
   link a Google identity without changing its user ID.

The Google Client Secret belongs only in the Supabase Google provider settings;
never place it in `.env.local` or a `VITE_` variable. Restart `npm run dev`
after changing local environment values, then choose **Continue with Google**.

If this project previously used the removed Google Calendar integration, run
`supabase/remove-google-calendar.sql` once in the Supabase SQL Editor and
delete the deployed `google-calendar` Edge Function. The cleanup keeps tasks,
users, and garden progress intact.

## Features

- Add tasks
- Add an optional description, due date, and due time
- Assign low, medium, or high priority
- Add and edit tasks in a focused pop-up dialog
- Edit all task details
- Mark tasks as complete or active
- Delete tasks
- Search task titles and descriptions
- Start in a focused **To do** view, with a separate completed-task history
- Group active work into Overdue, Today, Upcoming, and Anytime
- Sort each group by priority and then deadline
- Earn growth points when tasks are completed: low `+5`, medium `+10`, high `+20`
- Grow a visible tree through seed, sprout, young tree, and growing-tree stages
- Plant every fully grown tree in a permanent forest collection
- Receive a different species from a shuffled, no-repeat seed bag
- Track trees grown, tasks completed this week, and tasks due today
- Enable 15-minute Chrome deadline reminders
- Persist tasks in browser local storage
- Persist garden progress separately in browser local storage
- Optionally sync tasks and garden progress to Supabase
- Sign in with email/password or a Google account

## Available commands

- `npm run dev` starts the development server.
- `npm run build` checks TypeScript and creates a production build in `dist`.
- `npm run preview` previews the production build locally.

## Project structure

- `src/main.ts` is the browser entry point.
- `src/models/task.ts` defines the task data shape.
- `src/storage/taskStorage.ts` owns browser persistence.
- `src/tasks/taskOperations.ts` contains task creation, updates, filtering, and search.
- `src/tasks/taskGrouping.ts` groups and orders tasks by urgency.
- `src/game/gameState.ts` contains the point, seed-bag, and forest rules.
- `src/game/gameStorage.ts` persists garden progress independently of tasks.
- `src/notifications/taskNotifications.ts` schedules due-task Chrome reminders.
- `src/auth/authService.ts` manages email and Google Supabase authentication.
- `src/supabase/supabaseClient.ts` creates the optional browser client.
- `src/supabase/cloudSync.ts` manages anonymous authentication and cloud sync.
- `src/ui/taskDialog.ts` manages the shared add/edit dialog.
- `src/ui/progressGarden.ts` renders the progress card and forest collection.
- `src/ui/treeIllustration.ts` renders the tree species and growth stages.
- `src/utils/dateTime.ts` converts and formats task deadlines.
- `src/style.css` contains the application styles.
- `public/assets/garden-clearing.png` is the generated garden backdrop.
- `public/sw.js` displays and handles Chrome notifications.
- `supabase/schema.sql` is the database schema and RLS configuration.
- `supabase/remove-google-calendar.sql` removes data left by the retired
  Calendar integration from an existing Supabase project.
- `.env.example` documents the required Supabase environment variables.

## Production build

Create an optimized build:

```sh
npm run build
```

Preview that build locally:

```sh
npm run preview
```
