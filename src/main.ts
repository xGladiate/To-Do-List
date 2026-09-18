import './style.css'
import { loadTasks } from './storage/taskStorage.ts'

const taskCount = loadTasks().length

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <main class="app-shell">
    <header class="app-header">
      <p class="eyebrow">Local-first task manager</p>
      <h1>My Tasks</h1>
      <p class="intro">
        Your Vite and TypeScript foundation is ready. Tasks will be stored only
        in this browser.
      </p>
    </header>

    <section class="setup-card" aria-labelledby="setup-title">
      <span class="status-dot" aria-hidden="true"></span>
      <div>
        <h2 id="setup-title">Setup complete</h2>
        <p>${taskCount} ${taskCount === 1 ? 'task is' : 'tasks are'} currently saved.</p>
      </div>
    </section>
  </main>
`
