import type { Task } from '../models/task.ts'

const SETTINGS_KEY = 'todo.notifications.v1'
const SENT_KEY = 'todo.notifications.sent.v1'
const REMINDER_LEAD_MINUTES = 15
const CHECK_INTERVAL_MS = 30_000
const OVERDUE_WINDOW_MS = 60 * 60 * 1000

type NotificationSettings = {
  enabled: boolean
}

export type TaskNotificationState = {
  supported: boolean
  permission: NotificationPermission | 'unsupported'
  enabled: boolean
}

export type TaskNotificationController = {
  getState: () => TaskNotificationState
  toggle: () => Promise<void>
  checkNow: () => Promise<void>
}

function loadSettings(): NotificationSettings {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}')
    if (typeof parsed === 'object' && parsed !== null && 'enabled' in parsed) {
      return { enabled: Boolean((parsed as { enabled: unknown }).enabled) }
    }
  } catch {
    // Fall through to the default.
  }

  return { enabled: false }
}

function loadSentReminders(): Set<string> {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(SENT_KEY) ?? '[]')
    return new Set(Array.isArray(parsed) ? parsed.filter((value) => typeof value === 'string') : [])
  } catch {
    return new Set()
  }
}

export function createTaskNotificationController(
  getTasks: () => Task[],
  onStateChange: (state: TaskNotificationState) => void,
): TaskNotificationController {
  const supported = 'Notification' in window && 'serviceWorker' in navigator
  const settings = loadSettings()
  const sentReminders = loadSentReminders()
  let registration: ServiceWorkerRegistration | null = null

  function getState(): TaskNotificationState {
    return {
      supported,
      permission: supported ? Notification.permission : 'unsupported',
      enabled: supported && Notification.permission === 'granted' && settings.enabled,
    }
  }

  function persistSettings(): void {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    onStateChange(getState())
  }

  async function ensureRegistration(): Promise<ServiceWorkerRegistration | null> {
    if (!supported) return null

    if (registration === null) {
      registration = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready
    }

    return registration
  }

  async function checkNow(): Promise<void> {
    if (!getState().enabled) return

    const activeRegistration = await ensureRegistration()
    if (activeRegistration === null) return

    const now = Date.now()
    const leadWindowMs = REMINDER_LEAD_MINUTES * 60 * 1000

    for (const task of getTasks()) {
      if (task.completed || task.dueAt === null) continue

      const dueTime = new Date(task.dueAt).getTime()
      if (Number.isNaN(dueTime)) continue

      const reminderId = `${task.id}:${task.dueAt}`
      const timeUntilDue = dueTime - now
      const isInReminderWindow = timeUntilDue <= leadWindowMs && timeUntilDue >= -OVERDUE_WINDOW_MS

      if (!isInReminderWindow || sentReminders.has(reminderId)) continue

      const body =
        timeUntilDue > 0
          ? `Due in ${Math.max(1, Math.ceil(timeUntilDue / 60_000))} minutes · ${task.priority} priority`
          : `This task is now overdue · ${task.priority} priority`

      await activeRegistration.showNotification(task.title, {
        body,
        tag: `task-due-${task.id}`,
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        data: { url: '/' },
      })

      sentReminders.add(reminderId)
    }

    localStorage.setItem(SENT_KEY, JSON.stringify([...sentReminders].slice(-200)))
  }

  async function toggle(): Promise<void> {
    if (!supported) return

    if (Notification.permission === 'granted') {
      settings.enabled = !settings.enabled
      persistSettings()
      if (settings.enabled) await checkNow()
      return
    }

    if (Notification.permission === 'denied') {
      settings.enabled = false
      persistSettings()
      return
    }

    const permission = await Notification.requestPermission()
    settings.enabled = permission === 'granted'
    persistSettings()

    if (settings.enabled) {
      await ensureRegistration()
      await checkNow()
    }
  }

  if (supported) {
    void ensureRegistration().catch(() => undefined)
    window.setInterval(() => void checkNow(), CHECK_INTERVAL_MS)
  }

  onStateChange(getState())

  return { getState, toggle, checkNow }
}
