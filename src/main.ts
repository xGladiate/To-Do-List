import './style.css'
import type { Task } from './models/task.ts'
import { loadTasks, saveTasks } from './storage/taskStorage.ts'

const app = document.querySelector<HTMLDivElement>('#app')

if (app === null) {
  throw new Error('App container was not found')
}

app.innerHTML = `
  <main class="app-shell">
    <header class="app-header">
      <p class="eyebrow">Local-first task manager</p>
      <h1>My Tasks</h1>
      <p class="intro">Keep track of what matters. Your tasks stay in this browser.</p>
    </header>

    <section class="task-panel" aria-labelledby="task-list-title">
      <form class="task-form" id="task-form">
        <label class="sr-only" for="task-input">Task title</label>
        <input
          id="task-input"
          name="title"
          type="text"
          placeholder="What needs to be done?"
          maxlength="200"
          autocomplete="off"
          required
        />
        <button class="primary-button" type="submit">Add task</button>
      </form>

      <div class="task-heading">
        <h2 id="task-list-title">Task list</h2>
        <p id="task-count" aria-live="polite"></p>
      </div>

      <ul class="task-list" id="task-list"></ul>

      <div class="empty-state" id="empty-state">
        <span aria-hidden="true">✓</span>
        <h2>No tasks yet</h2>
        <p>Add your first task using the field above.</p>
      </div>
    </section>
  </main>
`

const taskForm = document.querySelector<HTMLFormElement>('#task-form')!
const taskInput = document.querySelector<HTMLInputElement>('#task-input')!
const taskList = document.querySelector<HTMLUListElement>('#task-list')!
const taskCount = document.querySelector<HTMLParagraphElement>('#task-count')!
const emptyState = document.querySelector<HTMLDivElement>('#empty-state')!

let tasks = loadTasks()
let editingTaskId: string | null = null

function persistAndRender(): void {
  saveTasks(tasks)
  renderTasks()
}

function createTaskItem(task: Task): HTMLLIElement {
  if (task.id === editingTaskId) {
    return createEditTaskItem(task)
  }

  const item = document.createElement('li')
  item.className = `task-item${task.completed ? ' task-item--completed' : ''}`

  const taskLabel = document.createElement('label')
  taskLabel.className = 'task-toggle'

  const checkbox = document.createElement('input')
  checkbox.type = 'checkbox'
  checkbox.checked = task.completed
  checkbox.setAttribute('aria-label', `Mark ${task.title} as ${task.completed ? 'active' : 'complete'}`)
  checkbox.addEventListener('change', () => {
    const now = new Date().toISOString()
    tasks = tasks.map((currentTask) =>
      currentTask.id === task.id
        ? {
            ...currentTask,
            completed: checkbox.checked,
            completedAt: checkbox.checked ? now : null,
            updatedAt: now,
          }
        : currentTask,
    )
    persistAndRender()
  })

  const title = document.createElement('span')
  title.className = 'task-title'
  title.textContent = task.title

  taskLabel.append(checkbox, title)

  const actions = document.createElement('div')
  actions.className = 'task-actions'

  const editButton = document.createElement('button')
  editButton.className = 'text-button'
  editButton.type = 'button'
  editButton.textContent = 'Edit'
  editButton.setAttribute('aria-label', `Edit ${task.title}`)
  editButton.addEventListener('click', () => {
    editingTaskId = task.id
    renderTasks()
    document.querySelector<HTMLInputElement>('#edit-task-input')?.focus()
    document.querySelector<HTMLInputElement>('#edit-task-input')?.select()
  })

  const deleteButton = document.createElement('button')
  deleteButton.className = 'text-button text-button--danger'
  deleteButton.type = 'button'
  deleteButton.textContent = 'Delete'
  deleteButton.setAttribute('aria-label', `Delete ${task.title}`)
  deleteButton.addEventListener('click', () => {
    tasks = tasks.filter((currentTask) => currentTask.id !== task.id)
    persistAndRender()
  })

  actions.append(editButton, deleteButton)
  item.append(taskLabel, actions)

  return item
}

function createEditTaskItem(task: Task): HTMLLIElement {
  const item = document.createElement('li')
  item.className = 'task-item task-item--editing'

  const editForm = document.createElement('form')
  editForm.className = 'edit-form'

  const editLabel = document.createElement('label')
  editLabel.className = 'sr-only'
  editLabel.htmlFor = 'edit-task-input'
  editLabel.textContent = 'Edit task title'

  const editInput = document.createElement('input')
  editInput.id = 'edit-task-input'
  editInput.type = 'text'
  editInput.value = task.title
  editInput.maxLength = 200
  editInput.required = true

  const editActions = document.createElement('div')
  editActions.className = 'task-actions'

  const saveButton = document.createElement('button')
  saveButton.className = 'small-button'
  saveButton.type = 'submit'
  saveButton.textContent = 'Save'

  const cancelButton = document.createElement('button')
  cancelButton.className = 'small-button small-button--secondary'
  cancelButton.type = 'button'
  cancelButton.textContent = 'Cancel'
  cancelButton.addEventListener('click', () => {
    editingTaskId = null
    renderTasks()
  })

  editForm.addEventListener('submit', (event) => {
    event.preventDefault()
    const updatedTitle = editInput.value.trim()

    if (updatedTitle === '') {
      editInput.focus()
      return
    }

    tasks = tasks.map((currentTask) =>
      currentTask.id === task.id
        ? { ...currentTask, title: updatedTitle, updatedAt: new Date().toISOString() }
        : currentTask,
    )
    editingTaskId = null
    persistAndRender()
  })

  editActions.append(saveButton, cancelButton)
  editForm.append(editLabel, editInput, editActions)
  item.append(editForm)

  return item
}

function renderTasks(): void {
  taskList.replaceChildren(...tasks.map(createTaskItem))

  const remainingCount = tasks.filter((task) => !task.completed).length
  taskCount.textContent = `${remainingCount} ${remainingCount === 1 ? 'task' : 'tasks'} remaining`
  taskList.hidden = tasks.length === 0
  emptyState.hidden = tasks.length > 0
}

taskForm.addEventListener('submit', (event) => {
  event.preventDefault()
  const title = taskInput.value.trim()

  if (title === '') {
    taskInput.focus()
    return
  }

  const now = new Date().toISOString()
  tasks = [
    {
      id: crypto.randomUUID(),
      title,
      completed: false,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    },
    ...tasks,
  ]

  taskInput.value = ''
  persistAndRender()
  taskInput.focus()
})

renderTasks()
