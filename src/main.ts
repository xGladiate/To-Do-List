import './style.css'
import type { Task, TaskView } from './models/task.ts'
import { loadTasks, saveTasks } from './storage/taskStorage.ts'
import {
  createTask,
  deleteTask,
  filterTasks,
  toggleTask,
  updateTask,
} from './tasks/taskOperations.ts'
import {
  countCompletedThisWeek,
  countDueToday,
  groupActiveTasks,
  sortCompletedTasks,
} from './tasks/taskGrouping.ts'
import {
  completeTaskReward,
  createInitialGameState,
  getRewardPoints,
  reopenTaskReward,
  synchronizeCompletedTasks,
  TREE_LABELS,
  type GrownTree,
} from './game/gameState.ts'
import { loadGameState, saveGameState } from './game/gameStorage.ts'
import {
  initializeCloudSync,
  queueCloudSave,
  type CloudStatus,
} from './supabase/cloudSync.ts'
import { isSupabaseConfigured } from './supabase/supabaseClient.ts'
import {
  createTaskNotificationController,
  type TaskNotificationState,
} from './notifications/taskNotifications.ts'
import {
  continueWithGoogle,
  createEmailAccount,
  getAccountState,
  signInWithEmail,
  signOut,
  type AccountState,
} from './auth/authService.ts'
import { createTaskDialog } from './ui/taskDialog.ts'
import { renderForest, renderProgressGarden } from './ui/progressGarden.ts'
import { formatDueAt } from './utils/dateTime.ts'

const app = document.querySelector<HTMLDivElement>('#app')

if (app === null) {
  throw new Error('App container was not found')
}

app.innerHTML = `
  <main class="app-shell">
    <header class="app-header app-header--with-tools">
      <div>
        <p class="eyebrow">Grow through what you do</p>
        <h1>My Tasks</h1>
        <p class="intro">Focus on what needs attention and grow a forest along the way.</p>
      </div>
      <div class="app-tools" aria-label="App services">
        <button class="utility-button" id="notification-button" type="button">
          <svg class="utility-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
          </svg>
          <span id="notification-button-label">Enable reminders</span>
        </button>
        <button class="utility-button" id="account-button" type="button">
          <svg class="utility-icon" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21a8 8 0 0 1 16 0" />
          </svg>
          <span id="account-button-label">Sign in</span>
        </button>
        <span class="sync-status" id="sync-status" data-status="local" role="status">
          <span aria-hidden="true"></span>
          <span id="sync-status-label">Local only</span>
        </span>
      </div>
    </header>

    <section class="garden-panel" id="garden-panel" aria-label="Garden progress"></section>

    <section class="task-panel" aria-labelledby="task-list-title">
      <div class="task-section-header">
        <div>
          <h2 id="task-list-title">Tasks to act on</h2>
          <p id="task-count" aria-live="polite"></p>
        </div>
        <button class="primary-button add-task-button" id="add-task-button" type="button">
          <span aria-hidden="true">+</span>
          Add task
        </button>
      </div>

      <div class="task-toolbar">
        <div class="search-field">
          <label class="sr-only" for="task-search">Search current task view</label>
          <input id="task-search" type="search" placeholder="Search this view" autocomplete="off" />
        </div>

        <div class="filter-group" role="group" aria-label="Choose task view">
          <button class="filter-button is-active" type="button" data-view="todo" aria-pressed="true">To do <span id="todo-tab-count"></span></button>
          <button class="filter-button" type="button" data-view="completed" aria-pressed="false">Completed <span id="completed-tab-count"></span></button>
        </div>
      </div>

      <div class="task-groups" id="task-list"></div>

      <div class="empty-state" id="empty-state">
        <span aria-hidden="true">✓</span>
        <h2 id="empty-title">Nothing to act on</h2>
        <p id="empty-message">Add a task or enjoy the breathing room.</p>
      </div>
    </section>
  </main>

  <div class="growth-toast" id="growth-toast" role="status" aria-live="polite" hidden></div>

  <dialog class="forest-dialog" id="forest-dialog" aria-labelledby="forest-dialog-title">
    <div class="forest-dialog-card">
      <div class="dialog-header">
        <div>
          <p class="dialog-eyebrow">Your collection</p>
          <h2 id="forest-dialog-title">My Forest</h2>
        </div>
        <button class="dialog-close forest-dialog-close" type="button" aria-label="Close forest">×</button>
      </div>
      <p class="forest-intro">Each completed tree stays here. New seeds cycle through every species before repeats begin.</p>
      <div id="forest-content"></div>
    </div>
  </dialog>

  <dialog class="task-dialog account-dialog" id="account-dialog" aria-labelledby="account-dialog-title">
    <div class="dialog-card">
      <div class="dialog-header">
        <div>
          <p class="dialog-eyebrow">Cloud account</p>
          <h2 id="account-dialog-title">Account</h2>
        </div>
        <button class="dialog-close account-dialog-close" type="button" aria-label="Close account settings">×</button>
      </div>

      <div class="account-summary" id="account-summary"></div>

      <form class="dialog-form account-form" id="account-form">
        <div class="field-stack">
          <label for="account-email">Email</label>
          <input id="account-email" name="email" type="email" autocomplete="email" required />
        </div>
        <div class="field-stack">
          <label for="account-password">Password</label>
          <input id="account-password" name="password" type="password" autocomplete="current-password" minlength="6" required />
        </div>
        <div class="dialog-actions account-email-actions">
          <button class="small-button small-button--secondary" id="create-account-button" type="button">Create account</button>
          <button class="small-button" type="submit">Sign in</button>
        </div>
      </form>

      <div class="account-divider" id="account-divider"><span>or</span></div>
      <button class="google-button" id="google-auth-button" type="button">
        <span class="google-mark" aria-hidden="true">G</span>
        Continue with Google
      </button>

      <p class="account-message" id="account-message" role="status" aria-live="polite"></p>
      <button class="small-button small-button--secondary account-signout" id="sign-out-button" type="button" hidden>Sign out</button>
    </div>
  </dialog>
`

const addTaskButton = document.querySelector<HTMLButtonElement>('#add-task-button')!
const searchInput = document.querySelector<HTMLInputElement>('#task-search')!
const taskList = document.querySelector<HTMLDivElement>('#task-list')!
const taskCount = document.querySelector<HTMLParagraphElement>('#task-count')!
const emptyState = document.querySelector<HTMLDivElement>('#empty-state')!
const emptyTitle = document.querySelector<HTMLHeadingElement>('#empty-title')!
const emptyMessage = document.querySelector<HTMLParagraphElement>('#empty-message')!
const gardenPanel = document.querySelector<HTMLElement>('#garden-panel')!
const growthToast = document.querySelector<HTMLDivElement>('#growth-toast')!
const todoTabCount = document.querySelector<HTMLSpanElement>('#todo-tab-count')!
const completedTabCount = document.querySelector<HTMLSpanElement>('#completed-tab-count')!
const forestDialog = document.querySelector<HTMLDialogElement>('#forest-dialog')!
const forestContent = document.querySelector<HTMLDivElement>('#forest-content')!
const forestCloseButton = document.querySelector<HTMLButtonElement>('.forest-dialog-close')!
const notificationButton = document.querySelector<HTMLButtonElement>('#notification-button')!
const notificationButtonLabel = document.querySelector<HTMLSpanElement>('#notification-button-label')!
const accountButton = document.querySelector<HTMLButtonElement>('#account-button')!
const accountButtonLabel = document.querySelector<HTMLSpanElement>('#account-button-label')!
const syncStatus = document.querySelector<HTMLSpanElement>('#sync-status')!
const syncStatusLabel = document.querySelector<HTMLSpanElement>('#sync-status-label')!
const viewButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-view]'))
const accountDialog = document.querySelector<HTMLDialogElement>('#account-dialog')!
const accountCloseButton = document.querySelector<HTMLButtonElement>('.account-dialog-close')!
const accountSummary = document.querySelector<HTMLDivElement>('#account-summary')!
const accountForm = document.querySelector<HTMLFormElement>('#account-form')!
const accountEmail = document.querySelector<HTMLInputElement>('#account-email')!
const accountPassword = document.querySelector<HTMLInputElement>('#account-password')!
const createAccountButton = document.querySelector<HTMLButtonElement>('#create-account-button')!
const googleAuthButton = document.querySelector<HTMLButtonElement>('#google-auth-button')!
const accountDivider = document.querySelector<HTMLDivElement>('#account-divider')!
const accountMessage = document.querySelector<HTMLParagraphElement>('#account-message')!
const signOutButton = document.querySelector<HTMLButtonElement>('#sign-out-button')!

let tasks = loadTasks()
let gameState = loadGameState()
let activeView: TaskView = 'todo'
let searchQuery = ''
let toastTimer: number | undefined
let accountState: AccountState = {
  configured: isSupabaseConfigured,
  user: null,
  anonymous: true,
  email: null,
  googleLinked: false,
}

const initialGameUpdate = synchronizeCompletedTasks(gameState, tasks)
gameState = initialGameUpdate.state
saveGameState(gameState)

const taskNotifications = createTaskNotificationController(
  () => tasks,
  updateNotificationButton,
)

function updateNotificationButton(state: TaskNotificationState): void {
  notificationButton.dataset.state = state.enabled ? 'enabled' : state.permission

  if (!state.supported) {
    notificationButtonLabel.textContent = 'Reminders unavailable'
    notificationButton.disabled = true
    notificationButton.title = 'This browser does not support web notifications.'
  } else if (state.permission === 'denied') {
    notificationButtonLabel.textContent = 'Notifications blocked'
    notificationButton.title = 'Allow notifications for this site in Chrome settings, then reload.'
  } else if (state.enabled) {
    notificationButtonLabel.textContent = 'Reminders on'
    notificationButton.title = 'Chrome reminders are enabled. Click to turn them off.'
  } else if (state.permission === 'granted') {
    notificationButtonLabel.textContent = 'Reminders off'
    notificationButton.title = 'Click to turn due-task reminders on.'
  } else {
    notificationButtonLabel.textContent = 'Enable reminders'
    notificationButton.title = 'Get a Chrome notification 15 minutes before a task is due.'
  }
}

function updateCloudStatus(status: CloudStatus, message?: string): void {
  const labels: Record<CloudStatus, string> = {
    local: 'Local only',
    connecting: 'Connecting…',
    synced: 'Cloud synced',
    saving: 'Saving…',
    error: 'Sync paused',
  }

  syncStatus.dataset.status = status
  syncStatusLabel.textContent = labels[status]
  syncStatus.title =
    message ??
    (status === 'local'
      ? 'Add Supabase values to .env.local to enable cloud sync.'
      : 'Supabase keeps tasks and garden progress backed up.')
}

function setAccountMessage(message: string, isError = false): void {
  accountMessage.textContent = message
  accountMessage.classList.toggle('account-message--error', isError)
}

function renderAccountState(): void {
  const hasPermanentAccount = accountState.user !== null && !accountState.anonymous
  accountButtonLabel.textContent = hasPermanentAccount
    ? accountState.email ?? 'Account'
    : 'Sign in'

  accountSummary.replaceChildren()
  const summaryTitle = document.createElement('strong')
  const summaryCopy = document.createElement('p')

  if (!accountState.configured) {
    summaryTitle.textContent = 'Supabase setup required'
    summaryCopy.textContent = 'Add the project URL and publishable key to .env.local first.'
  } else if (hasPermanentAccount) {
    summaryTitle.textContent = accountState.email ?? 'Signed in'
    summaryCopy.textContent = 'Your tasks and garden can sync through this account.'
  } else {
    summaryTitle.textContent = 'Guest mode'
    summaryCopy.textContent = 'Create an account or continue with Google to keep this data recoverable.'
  }

  accountSummary.append(summaryTitle, summaryCopy)

  const showEmailForm = accountState.configured && !hasPermanentAccount
  accountForm.hidden = !showEmailForm
  accountDivider.hidden = !accountState.configured || accountState.googleLinked
  googleAuthButton.hidden = !accountState.configured || accountState.googleLinked
  googleAuthButton.textContent = hasPermanentAccount
    ? 'Link Google account'
    : 'Continue with Google'
  googleAuthButton.disabled = !accountState.configured
  signOutButton.hidden = !hasPermanentAccount
}

async function refreshAccountState(): Promise<void> {
  accountState = await getAccountState()
  renderAccountState()
}

function openForest(): void {
  renderForest(forestContent, gameState)
  forestDialog.showModal()
  forestCloseButton.focus()
}

function closeForest(): void {
  forestDialog.close()
}

function showGrowthToast(grownTrees: GrownTree[], points: number): void {
  window.clearTimeout(toastTimer)

  if (grownTrees.length > 0) {
    const latestTree = grownTrees[grownTrees.length - 1]
    growthToast.innerHTML = `<strong>Tree grown!</strong><span>Your ${TREE_LABELS[latestTree.species]} joined the forest. A new seed has begun.</span>`
    growthToast.classList.add('growth-toast--celebration')
  } else {
    growthToast.innerHTML = `<strong>+${points} growth points</strong><span>Your tree is growing.</span>`
    growthToast.classList.remove('growth-toast--celebration')
  }

  growthToast.hidden = false
  requestAnimationFrame(() => growthToast.classList.add('is-visible'))
  toastTimer = window.setTimeout(() => {
    growthToast.classList.remove('is-visible')
    window.setTimeout(() => {
      growthToast.hidden = true
    }, 220)
  }, 3200)
}

function persistAndRender(): void {
  saveTasks(tasks)
  saveGameState(gameState)
  renderApp()
  queueCloudSave(tasks, gameState, updateCloudStatus)
  void taskNotifications.checkNow()
}

const taskDialog = createTaskDialog(({ taskId, details }) => {
  if (taskId === null) {
    const newTask = createTask(details)
    tasks = [newTask, ...tasks]
  } else {
    tasks = updateTask(tasks, taskId, details)
  }

  persistAndRender()
})

function toggleTaskCompletion(task: Task): void {
  const wasCompleted = task.completed
  tasks = toggleTask(tasks, task.id)

  if (wasCompleted) {
    gameState = reopenTaskReward(gameState, task.id).state
  } else {
    const updatedTask = tasks.find((candidate) => candidate.id === task.id)!
    const gameUpdate = completeTaskReward(gameState, updatedTask)
    gameState = gameUpdate.state
    showGrowthToast(gameUpdate.grownTrees, getRewardPoints(task.priority))
  }

  persistAndRender()
}

function createTaskItem(task: Task): HTMLLIElement {
  const item = document.createElement('li')
  item.className = `task-item${task.completed ? ' task-item--completed' : ''}`

  const taskLabel = document.createElement('label')
  taskLabel.className = 'task-toggle'

  const checkbox = document.createElement('input')
  checkbox.type = 'checkbox'
  checkbox.checked = task.completed
  checkbox.setAttribute('aria-label', `Mark ${task.title} as ${task.completed ? 'active' : 'complete'}`)
  checkbox.addEventListener('change', () => toggleTaskCompletion(task))

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
    description.title = task.description
    taskCopy.append(description)
  }

  const metadata = document.createElement('span')
  metadata.className = 'task-metadata'

  const priority = document.createElement('span')
  priority.className = `priority-badge priority-badge--${task.priority}`
  priority.textContent = `${task.priority[0].toUpperCase()}${task.priority.slice(1)} · +${getRewardPoints(task.priority)}`
  metadata.append(priority)

  if (task.dueAt !== null) {
    const dueDateDisplay = formatDueAt(task.dueAt, task.completed)
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
  editButton.dataset.editTaskId = task.id
  editButton.setAttribute('aria-label', `Edit ${task.title}`)
  editButton.addEventListener('click', () => taskDialog.openForEdit(task, editButton))

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

function createTaskGroup(label: string, key: string, groupTasks: Task[]): HTMLElement {
  const section = document.createElement('section')
  section.className = `task-group task-group--${key}`

  const heading = document.createElement('div')
  heading.className = 'task-group-heading'
  const headingTitle = document.createElement('h3')
  headingTitle.textContent = label
  const headingCount = document.createElement('span')
  headingCount.textContent = String(groupTasks.length)
  heading.append(headingTitle, headingCount)

  const list = document.createElement('ul')
  list.className = 'task-list'
  list.append(...groupTasks.map(createTaskItem))
  section.append(heading, list)

  return section
}

function renderTasks(): void {
  const visibleTasks = filterTasks(tasks, activeView, searchQuery)
  const remainingCount = tasks.filter((task) => !task.completed).length
  const completedCount = tasks.length - remainingCount
  let groups: HTMLElement[]

  if (activeView === 'todo') {
    groups = groupActiveTasks(visibleTasks).map((group) =>
      createTaskGroup(group.label, group.key, group.tasks),
    )
    taskCount.textContent = `${remainingCount} task${remainingCount === 1 ? '' : 's'} need attention`
  } else {
    const sortedTasks = sortCompletedTasks(visibleTasks)
    groups = sortedTasks.length > 0 ? [createTaskGroup('Recently completed', 'completed', sortedTasks)] : []
    taskCount.textContent = `${completedCount} task${completedCount === 1 ? '' : 's'} completed`
  }

  taskList.replaceChildren(...groups)
  todoTabCount.textContent = String(remainingCount)
  completedTabCount.textContent = String(completedCount)

  const hasVisibleTasks = visibleTasks.length > 0
  taskList.hidden = !hasVisibleTasks
  emptyState.hidden = hasVisibleTasks

  if (!hasVisibleTasks && searchQuery.trim() !== '') {
    emptyTitle.textContent = 'No matching tasks'
    emptyMessage.textContent = 'Try a different search in this view.'
  } else if (activeView === 'completed') {
    emptyTitle.textContent = 'No completed tasks yet'
    emptyMessage.textContent = 'Completed work will be kept here as a simple history.'
  } else {
    emptyTitle.textContent = 'Nothing to act on'
    emptyMessage.textContent = tasks.length === 0 ? 'Add your first task and begin growing.' : 'You are all caught up.'
  }

  viewButtons.forEach((button) => {
    const isActive = button.dataset.view === activeView
    button.classList.toggle('is-active', isActive)
    button.setAttribute('aria-pressed', String(isActive))
  })
}

function renderApp(): void {
  renderProgressGarden(
    gardenPanel,
    gameState,
    {
      completedThisWeek: countCompletedThisWeek(tasks),
      dueToday: countDueToday(tasks),
    },
    openForest,
  )
  renderTasks()
}

addTaskButton.addEventListener('click', () => taskDialog.openForCreate(addTaskButton))

searchInput.addEventListener('input', () => {
  searchQuery = searchInput.value
  renderTasks()
})

viewButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const view = button.dataset.view

    if (view === 'todo' || view === 'completed') {
      activeView = view
      renderTasks()
    }
  })
})

forestCloseButton.addEventListener('click', closeForest)
forestDialog.addEventListener('click', (event) => {
  if (event.target === forestDialog) closeForest()
})

notificationButton.addEventListener('click', () => {
  void taskNotifications.toggle()
})

accountButton.addEventListener('click', () => {
  setAccountMessage('')
  renderAccountState()
  accountDialog.showModal()
  void refreshAccountState()
})

accountCloseButton.addEventListener('click', () => accountDialog.close())
accountDialog.addEventListener('click', (event) => {
  if (event.target === accountDialog) accountDialog.close()
})

accountForm.addEventListener('submit', (event) => {
  event.preventDefault()
  setAccountMessage('Signing in…')

  void signInWithEmail(accountEmail.value.trim(), accountPassword.value)
    .then(async () => {
      accountDialog.close()
      await startCloudSync()
    })
    .catch((error: unknown) => {
      setAccountMessage(error instanceof Error ? error.message : 'Sign-in failed.', true)
    })
})

createAccountButton.addEventListener('click', () => {
  if (!accountForm.reportValidity()) return
  setAccountMessage('Creating account…')

  void createEmailAccount(accountEmail.value.trim(), accountPassword.value)
    .then(async (message) => {
      setAccountMessage(message)
      await refreshAccountState()
    })
    .catch((error: unknown) => {
      setAccountMessage(error instanceof Error ? error.message : 'Account creation failed.', true)
    })
})

googleAuthButton.addEventListener('click', () => {
  setAccountMessage('Opening Google…')
  const shouldLink = accountState.user !== null && !accountState.googleLinked

  void continueWithGoogle(shouldLink).catch((error: unknown) => {
    setAccountMessage(error instanceof Error ? error.message : 'Google sign-in failed.', true)
  })
})

signOutButton.addEventListener('click', () => {
  setAccountMessage('Signing out…')
  void signOut()
    .then(async () => {
      tasks = []
      gameState = createInitialGameState()
      saveTasks(tasks)
      saveGameState(gameState)
      renderApp()
      accountDialog.close()
      await startCloudSync()
    })
    .catch((error: unknown) => {
      setAccountMessage(error instanceof Error ? error.message : 'Could not sign out.', true)
    })
})

async function startCloudSync(): Promise<void> {
  if (!isSupabaseConfigured) {
    updateCloudStatus('local')
    await refreshAccountState()
    return
  }

  updateCloudStatus('connecting')
  const cloudState = await initializeCloudSync(tasks, gameState)

  if (!cloudState.connected) {
    updateCloudStatus('error', cloudState.message)
    await refreshAccountState()
    return
  }

  tasks = cloudState.tasks
  gameState = synchronizeCompletedTasks(cloudState.gameState, tasks).state
  saveTasks(tasks)
  saveGameState(gameState)
  renderApp()
  updateCloudStatus('synced')
  queueCloudSave(tasks, gameState, updateCloudStatus)
  await refreshAccountState()
}

renderApp()
void startCloudSync()
