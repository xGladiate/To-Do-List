import './style.css'
import type { Task, TaskFilter, TaskPriority } from './models/task.ts'
import { loadTasks, saveTasks } from './storage/taskStorage.ts'
import {
  createTask,
  deleteTask,
  filterTasks,
  toggleTask,
  updateTask,
} from './tasks/taskOperations.ts'

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
        <div class="field-stack">
          <label for="task-input">Task title</label>
          <input
            id="task-input"
            name="title"
            type="text"
            placeholder="What needs to be done?"
            maxlength="200"
            autocomplete="off"
            required
          />
        </div>

        <div class="field-stack">
          <label for="task-description">Description <span>(optional)</span></label>
          <textarea
            id="task-description"
            name="description"
            placeholder="Add a few helpful details"
            maxlength="1000"
            rows="3"
          ></textarea>
        </div>

        <div class="task-form-options">
          <div class="field-stack">
            <label for="task-due-date">Due date <span>(optional)</span></label>
            <input id="task-due-date" name="dueDate" type="date" />
          </div>

          <div class="field-stack">
            <label for="task-priority">Priority</label>
            <select id="task-priority" name="priority">
              <option value="low">Low</option>
              <option value="medium" selected>Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <button class="primary-button" type="submit">Add task</button>
        </div>
      </form>

      <div class="task-toolbar">
        <div class="search-field">
          <label class="sr-only" for="task-search">Search tasks</label>
          <input id="task-search" type="search" placeholder="Search tasks" autocomplete="off" />
        </div>

        <div class="filter-group" role="group" aria-label="Filter tasks by status">
          <button class="filter-button is-active" type="button" data-filter="all" aria-pressed="true">All</button>
          <button class="filter-button" type="button" data-filter="active" aria-pressed="false">Active</button>
          <button class="filter-button" type="button" data-filter="completed" aria-pressed="false">Completed</button>
        </div>
      </div>

      <div class="task-heading">
        <h2 id="task-list-title">Task list</h2>
        <p id="task-count" aria-live="polite"></p>
      </div>

      <ul class="task-list" id="task-list"></ul>

      <div class="empty-state" id="empty-state">
        <span aria-hidden="true">✓</span>
        <h2 id="empty-title">No tasks yet</h2>
        <p id="empty-message">Add your first task using the form above.</p>
      </div>
    </section>
  </main>
`

const taskForm = document.querySelector<HTMLFormElement>('#task-form')!
const taskInput = document.querySelector<HTMLInputElement>('#task-input')!
const descriptionInput = document.querySelector<HTMLTextAreaElement>('#task-description')!
const dueDateInput = document.querySelector<HTMLInputElement>('#task-due-date')!
const priorityInput = document.querySelector<HTMLSelectElement>('#task-priority')!
const searchInput = document.querySelector<HTMLInputElement>('#task-search')!
const taskList = document.querySelector<HTMLUListElement>('#task-list')!
const taskCount = document.querySelector<HTMLParagraphElement>('#task-count')!
const emptyState = document.querySelector<HTMLDivElement>('#empty-state')!
const emptyTitle = document.querySelector<HTMLHeadingElement>('#empty-title')!
const emptyMessage = document.querySelector<HTMLParagraphElement>('#empty-message')!
const filterButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>('[data-filter]'),
)

let tasks = loadTasks()
let editingTaskId: string | null = null
let activeFilter: TaskFilter = 'all'
let searchQuery = ''

function persistAndRender(): void {
  saveTasks(tasks)
  renderTasks()
}

function getLocalDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getDueDateDisplay(dueDate: string, completed: boolean): { label: string; overdue: boolean } {
  const today = new Date()
  const todayKey = getLocalDateKey(today)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowKey = getLocalDateKey(tomorrow)
  const overdue = !completed && dueDate < todayKey

  if (dueDate === todayKey) {
    return { label: 'Due today', overdue }
  }

  if (dueDate === tomorrowKey) {
    return { label: 'Due tomorrow', overdue }
  }

  const parsedDate = new Date(`${dueDate}T00:00:00`)
  const formattedDate = new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: parsedDate.getFullYear() === today.getFullYear() ? undefined : 'numeric',
  }).format(parsedDate)

  return { label: overdue ? `Overdue · ${formattedDate}` : `Due ${formattedDate}`, overdue }
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
    tasks = toggleTask(tasks, task.id)
    persistAndRender()
  })

  const taskCopy = document.createElement('span')
  taskCopy.className = 'task-copy'

  const title = document.createElement('span')
  title.className = 'task-title'
  title.textContent = task.title
  taskCopy.append(title)

  if (task.description !== '') {
    const description = document.createElement('span')
    description.className = 'task-description'
    description.textContent = task.description
    taskCopy.append(description)
  }

  const metadata = document.createElement('span')
  metadata.className = 'task-metadata'

  const priority = document.createElement('span')
  priority.className = `priority-badge priority-badge--${task.priority}`
  priority.textContent = `${task.priority[0].toUpperCase()}${task.priority.slice(1)}`
  metadata.append(priority)

  if (task.dueDate !== null) {
    const dueDateDisplay = getDueDateDisplay(task.dueDate, task.completed)
    const dueDate = document.createElement('span')
    dueDate.className = `due-date${dueDateDisplay.overdue ? ' due-date--overdue' : ''}`
    dueDate.textContent = dueDateDisplay.label
    metadata.append(dueDate)
  }

  taskCopy.append(metadata)
  taskLabel.append(checkbox, taskCopy)

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
    document.querySelector<HTMLInputElement>('#edit-task-title')?.focus()
    document.querySelector<HTMLInputElement>('#edit-task-title')?.select()
  })

  const deleteButton = document.createElement('button')
  deleteButton.className = 'text-button text-button--danger'
  deleteButton.type = 'button'
  deleteButton.textContent = 'Delete'
  deleteButton.setAttribute('aria-label', `Delete ${task.title}`)
  deleteButton.addEventListener('click', () => {
    tasks = deleteTask(tasks, task.id)
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

  const titleField = document.createElement('div')
  titleField.className = 'field-stack'
  const titleLabel = document.createElement('label')
  titleLabel.htmlFor = 'edit-task-title'
  titleLabel.textContent = 'Task title'
  const titleInput = document.createElement('input')
  titleInput.id = 'edit-task-title'
  titleInput.type = 'text'
  titleInput.value = task.title
  titleInput.maxLength = 200
  titleInput.required = true
  titleField.append(titleLabel, titleInput)

  const descriptionField = document.createElement('div')
  descriptionField.className = 'field-stack'
  const descriptionLabel = document.createElement('label')
  descriptionLabel.htmlFor = 'edit-task-description'
  descriptionLabel.textContent = 'Description'
  const description = document.createElement('textarea')
  description.id = 'edit-task-description'
  description.value = task.description
  description.maxLength = 1000
  description.rows = 3
  descriptionField.append(descriptionLabel, description)

  const options = document.createElement('div')
  options.className = 'edit-form-options'

  const dueDateField = document.createElement('div')
  dueDateField.className = 'field-stack'
  const dueDateLabel = document.createElement('label')
  dueDateLabel.htmlFor = 'edit-task-due-date'
  dueDateLabel.textContent = 'Due date'
  const dueDate = document.createElement('input')
  dueDate.id = 'edit-task-due-date'
  dueDate.type = 'date'
  dueDate.value = task.dueDate ?? ''
  dueDateField.append(dueDateLabel, dueDate)

  const priorityField = document.createElement('div')
  priorityField.className = 'field-stack'
  const priorityLabel = document.createElement('label')
  priorityLabel.htmlFor = 'edit-task-priority'
  priorityLabel.textContent = 'Priority'
  const priority = document.createElement('select')
  priority.id = 'edit-task-priority'
  ;(['low', 'medium', 'high'] as TaskPriority[]).forEach((value) => {
    const option = document.createElement('option')
    option.value = value
    option.textContent = `${value[0].toUpperCase()}${value.slice(1)}`
    option.selected = task.priority === value
    priority.append(option)
  })
  priorityField.append(priorityLabel, priority)

  const actions = document.createElement('div')
  actions.className = 'task-actions edit-actions'
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
  actions.append(saveButton, cancelButton)

  options.append(dueDateField, priorityField, actions)
  editForm.append(titleField, descriptionField, options)
  editForm.addEventListener('submit', (event) => {
    event.preventDefault()
    const updatedTitle = titleInput.value.trim()

    if (updatedTitle === '') {
      titleInput.focus()
      return
    }

    tasks = updateTask(tasks, task.id, {
      title: updatedTitle,
      description: description.value,
      dueDate: dueDate.value || null,
      priority: priority.value as TaskPriority,
    })
    editingTaskId = null
    persistAndRender()
  })

  item.append(editForm)
  return item
}

function renderTasks(): void {
  const visibleTasks = filterTasks(tasks, activeFilter, searchQuery)
  taskList.replaceChildren(...visibleTasks.map(createTaskItem))

  const remainingCount = tasks.filter((task) => !task.completed).length
  taskCount.textContent = `${visibleTasks.length} shown · ${remainingCount} remaining`

  const hasVisibleTasks = visibleTasks.length > 0
  taskList.hidden = !hasVisibleTasks
  emptyState.hidden = hasVisibleTasks

  if (tasks.length === 0) {
    emptyTitle.textContent = 'No tasks yet'
    emptyMessage.textContent = 'Add your first task using the form above.'
  } else if (!hasVisibleTasks) {
    emptyTitle.textContent = 'No matching tasks'
    emptyMessage.textContent = 'Try a different search or status filter.'
  }

  filterButtons.forEach((button) => {
    const isActive = button.dataset.filter === activeFilter
    button.classList.toggle('is-active', isActive)
    button.setAttribute('aria-pressed', String(isActive))
  })
}

taskForm.addEventListener('submit', (event) => {
  event.preventDefault()
  const title = taskInput.value.trim()

  if (title === '') {
    taskInput.focus()
    return
  }

  tasks = [
    createTask({
      title,
      description: descriptionInput.value,
      dueDate: dueDateInput.value || null,
      priority: priorityInput.value as TaskPriority,
    }),
    ...tasks,
  ]

  taskForm.reset()
  persistAndRender()
  taskInput.focus()
})

searchInput.addEventListener('input', () => {
  searchQuery = searchInput.value
  renderTasks()
})

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const filter = button.dataset.filter

    if (filter === 'all' || filter === 'active' || filter === 'completed') {
      activeFilter = filter
      editingTaskId = null
      renderTasks()
    }
  })
})

renderTasks()
