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
- Edit task titles
- Mark tasks as complete or active
- Delete tasks
- Persist tasks in browser local storage

## Available commands

- `npm run dev` starts the development server.
- `npm run build` checks TypeScript and creates a production build in `dist`.
- `npm run preview` previews the production build locally.

## Project structure

- `src/main.ts` is the browser entry point.
- `src/models/task.ts` defines the task data shape.
- `src/storage/taskStorage.ts` owns browser persistence.
- `src/style.css` contains the application styles.

## Production build

Create an optimized build:

```sh
npm run build
```

Preview that build locally:

```sh
npm run preview
```
