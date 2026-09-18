# To-do List

A local-first task manager built with Vite, TypeScript, vanilla HTML/CSS, and
browser local storage.

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
- Persist tasks in browser local storage
- Persist garden progress separately in browser local storage

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
- `src/ui/taskDialog.ts` manages the shared add/edit dialog.
- `src/ui/progressGarden.ts` renders the progress card and forest collection.
- `src/ui/treeIllustration.ts` renders the tree species and growth stages.
- `src/utils/dateTime.ts` converts and formats task deadlines.
- `src/style.css` contains the application styles.
- `public/assets/garden-clearing.png` is the generated garden backdrop.

## Production build

Create an optimized build:

```sh
npm run build
```

Preview that build locally:

```sh
npm run preview
```
