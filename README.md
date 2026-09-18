# To-do List

A local-first task manager built with Vite, TypeScript, vanilla HTML/CSS, and
browser local storage.

## Requirements

- Node.js 20.19 or newer
- npm

## Run locally

```sh
npm install
npm run dev
```

Open the local address printed in the terminal.

## Available commands

- `npm run dev` starts the development server.
- `npm run build` checks TypeScript and creates a production build in `dist`.
- `npm run preview` previews the production build locally.

## Project structure

- `src/main.ts` is the browser entry point.
- `src/models/task.ts` defines the task data shape.
- `src/storage/taskStorage.ts` owns browser persistence.
- `src/style.css` contains the application styles.
